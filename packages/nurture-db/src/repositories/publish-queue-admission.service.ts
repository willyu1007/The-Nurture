import { Prisma, type PrismaClient } from "@prisma/client";
import {
  admitPublishProcessToQueue,
  type NurturePublishQueueAdmissionFacts,
  type NurturePublishQueueAdmissionTransaction,
  type NurtureStoredPublishSchedule,
  type PublishQueueAdmissionResultV1,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";
import { loadCurrentInstitutionPublicationPolicy } from "./institution-publication-policy.read.js";
import { readResolvedPublishSchedule } from "./publish-schedule.support.js";

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

const domainRef = (objectType: string, objectId: string, version: number) => ({
  schema_version: 1 as const,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

class PrismaPublishQueueAdmissionTransaction
  implements NurturePublishQueueAdmissionTransaction
{
  constructor(private readonly prisma: BoardPrisma) {}

  async loadPublishQueueAdmissionFacts(input: {
    workspace_id: string;
    process_key: string;
    read_at: string;
  }): Promise<NurturePublishQueueAdmissionFacts | null> {
    const readAt = new Date(input.read_at);
    if (Number.isNaN(readAt.getTime())) return null;
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: {
        currentRevision: { select: { revision: true } },
        editHold: { select: { expiresAt: true } },
        careGroup: { include: { institution: true } },
      },
    });
    if (
      !process ||
      process.careGroup.status !== "active" ||
      process.careGroup.deletedAt !== null ||
      process.careGroup.institution.status !== "active" ||
      process.careGroup.institution.deletedAt !== null
    ) {
      return null;
    }

    const [role, policy] = await Promise.all([
      process.authorizingRoleAssignmentId
        ? this.prisma.nurtureCareRoleAssignment.findFirst({
            where: {
              id: process.authorizingRoleAssignmentId,
              workspaceId: input.workspace_id,
              role: { in: [...CAREGIVER_ROLES] },
              scopeType: "care_group",
              scopeId: process.careGroupId,
              ...activeRoleWindow(readAt),
              participant: { status: "active", deletedAt: null },
            },
            select: { id: true },
          })
        : null,
      loadCurrentInstitutionPublicationPolicy(this.prisma, {
        workspace_id: input.workspace_id,
        institution_id: process.careGroup.institutionId,
        at: readAt,
      }),
    ]);

    return {
      publish_process_ref: domainRef(
        "publish_process",
        process.id,
        process.aggregateVersion,
      ),
      process_state: process.state,
      process_version: process.aggregateVersion,
      current_revision: process.currentRevision?.revision ?? 0,
      created_at: process.createdAt.toISOString(),
      read_at: readAt.toISOString(),
      authorizing_role_assignment_id: process.authorizingRoleAssignmentId,
      authorizing_role_current: role !== null,
      ...(process.editHold
        ? { current_hold_expires_at: process.editHold.expiresAt.toISOString() }
        : {}),
      schedule: readResolvedPublishSchedule(process),
      current_policy: policy,
    };
  }

  async applyPublishQueueAdmission(input: {
    workspace_id: string;
    process_key: string;
    expected_process_version: number;
    authorizing_role_assignment_id: string;
    admitted_at: string;
    schedule: NurtureStoredPublishSchedule;
  }) {
    const admittedAt = new Date(input.admitted_at);
    const schedule = input.schedule;
    const updated = await this.prisma.nurturePublishProcess.updateMany({
      where: {
        workspaceId: input.workspace_id,
        processKey: input.process_key,
        state: "draft",
        aggregateVersion: input.expected_process_version,
        currentRevisionId: { not: null },
        authorizingRoleAssignmentId: input.authorizing_role_assignment_id,
        OR: [
          { editHold: { is: null } },
          { editHold: { is: { expiresAt: { lte: admittedAt } } } },
        ],
      },
      data: {
        state: "pending_release",
        scheduledAt: new Date(schedule.scheduledAt),
        notAfter: new Date(schedule.notAfter),
        scheduleTimeZone: schedule.timeZone,
        schedulePolicyRef: schedule.policyRef,
        schedulePolicyHead: schedule.policyHead,
        schedulePolicyVersion: schedule.policyVersion,
        scheduleResolvedAt: new Date(schedule.resolvedAt),
        aggregateVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new Error("nurture publish queue: admission conflict");
    }
    const process = await this.prisma.nurturePublishProcess.findFirstOrThrow({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
    });
    const stored = readResolvedPublishSchedule(process);
    if (!stored) throw new Error("nurture publish queue: schedule unavailable after write");
    return {
      publish_process_ref: domainRef(
        "publish_process",
        process.id,
        process.aggregateVersion,
      ),
      schedule: stored,
    };
  }
}

/** Scenario-side admission executed atomically; host code owns only timer/retry. */
export class PrismaPublishQueueAdmissionService {
  constructor(private readonly prisma: PrismaClient) {}

  admitDueProcess(input: {
    workspace_id: string;
    process_key: string;
    now: Date;
  }): Promise<PublishQueueAdmissionResultV1> {
    return this.prisma.$transaction(
      (tx) =>
        admitPublishProcessToQueue(
          new PrismaPublishQueueAdmissionTransaction(tx),
          input,
        ),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
