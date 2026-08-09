import { createHmac } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION } from "@the-nurture/scenario";
import type {
  NurtureInstitutionSupportSignalOwnerReadRequest,
  NurtureInstitutionSupportSignalPolicyV1,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow } from "./board-read-support.js";
import { PrismaInstitutionBusinessCommunicationReadPort } from "./institution-business-communication.read.js";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";
import { loadInstitutionLocalDay } from "./institution-local-day.js";

export const MAX_EXACT_OWNER_ROWS = 100;

type OwnerClass = {
  id: string;
  name: string;
  ageBandKey: string | null;
};

type OwnerScope = {
  at: Date;
  classes: OwnerClass[];
};

type LocalDay = NonNullable<Awaited<ReturnType<typeof loadInstitutionLocalDay>>>;

export type OwnerSelection = {
  care_group: OwnerClass;
  policy: NurtureInstitutionSupportSignalPolicyV1;
  local_day: LocalDay;
};

type SelectionRead =
  | { status: "available"; selections: OwnerSelection[]; scope: OwnerScope }
  | { status: "unavailable" };

type BusinessRows = Awaited<
  ReturnType<PrismaInstitutionBusinessCommunicationReadPort["listInstitutionBusinessCommunications"]>
>["rows"];

const localDateFromWindow = (windowKey: string): string | null => {
  const match = /^local-day:(\d{4}-\d{2}-\d{2})$/.exec(windowKey);
  return match?.[1] ?? null;
};

/** Stateless request-time owner context. Every provider invocation rechecks
 * the exact current role and source authority before returning facts. */
export class PrismaInstitutionSupportSignalOwnerContext {
  private readonly communicationOwner: PrismaInstitutionBusinessCommunicationReadPort;
  private readonly institutionContext: PrismaInstitutionContextRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly integrityKey: string,
  ) {
    if (integrityKey.length < 16) {
      throw new RangeError("support-signal owner ref integrity key is too short");
    }
    this.communicationOwner = new PrismaInstitutionBusinessCommunicationReadPort(prisma);
    this.institutionContext = new PrismaInstitutionContextRepository(prisma);
  }

  private async loadScope(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<OwnerScope | null> {
    const at = new Date(input.snapshot_at);
    if (Number.isNaN(at.getTime())) return null;
    const [participant, role, institution, classes] = await Promise.all([
      this.prisma.nurtureParticipant.findFirst({
        where: {
          id: input.participant_ref,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_ref,
          workspaceId: input.workspace_id,
          participantId: input.participant_ref,
          role: "institution_admin",
          scopeType: "institution",
          scopeId: input.institution_ref,
          ...activeRoleWindow(at),
        },
        select: { id: true },
      }),
      this.prisma.nurtureCareInstitution.findFirst({
        where: {
          id: input.institution_ref,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.nurtureCareGroup.findMany({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          status: "active",
          deletedAt: null,
        },
        select: { id: true, name: true, ageBandKey: true },
        orderBy: { id: "asc" },
        take: MAX_EXACT_OWNER_ROWS + 1,
      }),
    ]);
    return participant && role && institution && classes.length <= MAX_EXACT_OWNER_ROWS
      ? { at, classes }
      : null;
  }

  async select(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    category: NurtureInstitutionSupportSignalPolicyV1["category"],
    checkpointRef: string,
  ): Promise<SelectionRead> {
    const scope = await this.loadScope(input);
    if (!scope) return { status: "unavailable" };
    const policies = input.policies.filter((policy) => policy.category === category);
    if (
      policies.some(
        (policy) =>
          policy.workspace_id !== input.workspace_id ||
          policy.institution_ref !== input.institution_ref,
      )
    ) {
      return { status: "unavailable" };
    }

    const selections: OwnerSelection[] = [];
    const localDays = new Map<string, Promise<LocalDay | null>>();
    for (const careGroup of scope.classes) {
      const classPolicies = policies.filter(
        (policy) => policy.care_group_ref === careGroup.id,
      );
      const candidates =
        classPolicies.length > 0
          ? classPolicies
          : policies.filter((policy) => policy.care_group_ref === undefined);
      if (candidates.length === 0) continue;
      if (candidates.length !== 1) return { status: "unavailable" };
      const policy = candidates[0]!;
      if (!policy.enabled) continue;
      const localDate = localDateFromWindow(policy.window_key);
      if (
        policy.contract_version !== INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION ||
        policy.checkpoint_ref !== checkpointRef ||
        !localDate
      ) {
        return { status: "unavailable" };
      }
      let localDayRead = localDays.get(localDate);
      if (!localDayRead) {
        localDayRead = loadInstitutionLocalDay(this.prisma, {
          workspace_id: input.workspace_id,
          institution_id: input.institution_ref,
          local_date: localDate,
          at: scope.at,
        });
        localDays.set(localDate, localDayRead);
      }
      const localDay = await localDayRead;
      if (!localDay) return { status: "unavailable" };
      selections.push({ care_group: careGroup, policy, local_day: localDay });
    }
    return { status: "available", selections, scope };
  }

  async loadBusinessRows(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    selection: OwnerSelection,
  ): Promise<BusinessRows | null> {
    const candidateCount = await this.prisma.nurtureFamilyCareMessage.count({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: selection.care_group.id,
        writerContract: "harness_g2_v1",
        status: { in: ["sent", "redacted"] },
        createdAt: {
          gte: new Date(selection.local_day.occurred_from),
          lt: new Date(selection.local_day.occurred_before),
          lte: new Date(input.snapshot_at),
        },
      },
    });
    if (candidateCount > MAX_EXACT_OWNER_ROWS) return null;
    const page = await this.communicationOwner.listInstitutionBusinessCommunications({
      workspace_id: input.workspace_id,
      participant_id: input.participant_ref,
      care_group_id: selection.care_group.id,
      occurred_from: selection.local_day.occurred_from,
      occurred_before: selection.local_day.occurred_before,
      snapshot_at: input.snapshot_at,
      limit: MAX_EXACT_OWNER_ROWS,
    });
    return page.has_more ? null : page.rows;
  }

  async loadPopulation(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    selection: OwnerSelection,
  ) {
    const count = await this.prisma.nurtureEnrollment.count({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        careGroupId: selection.care_group.id,
        status: "active",
        deletedAt: null,
      },
    });
    if (count > MAX_EXACT_OWNER_ROWS) return null;
    const population = await this.institutionContext.loadAggregatePopulation({
      workspace_id: input.workspace_id,
      institution_ref: input.institution_ref,
      care_group_ref: selection.care_group.id,
      at: input.snapshot_at,
      limit: count + 1,
    });
    return population.class_state === "in_scope" && population.members.length === count
      ? population
      : null;
  }

  async hasAttendanceSubmission(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    selection: OwnerSelection,
    at: Date,
  ): Promise<boolean> {
    const row = await this.prisma.nurtureDailyAttendanceSubmission.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: selection.care_group.id,
        localDate: new Date(selection.local_day.storage_date),
        createdAt: { lte: at },
        deletedAt: null,
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  issueRef(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    kind: string,
    sourceId: string,
  ): string {
    return createHmac("sha256", this.integrityKey)
      .update(
        `nurture.institution-support-signal-source.v1\0${input.workspace_id}\0${input.participant_ref}\0${input.role_assignment_ref}\0${kind}\0${sourceId}`,
        "utf8",
      )
      .digest("base64url")
      .slice(0, 32);
  }
}
