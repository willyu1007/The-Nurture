import type {
  CaptureBatchReadPort,
  CaptureOrganizeSourceV1,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";
import { readOrganizePolicy } from "./care-capture.transaction.js";

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

/**
 * Owner-side capture intake for the organize trigger (G3-B1 / B3). Reading is
 * pure: it never opens a batch, never advances one and never touches the
 * activity lease. The stable-prefix judgement stays in the domain evaluator —
 * the owner only reports which captures it actually holds a durable head for.
 */
export class PrismaCareCaptureReadPort implements CaptureBatchReadPort {
  constructor(private readonly prisma: BoardPrisma) {}

  async listOrganizeCareGroups(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<Array<{ care_group_id: string; display_label: string }>> {
    const at = new Date();
    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        ...activeRoleWindow(at),
      },
      orderBy: { id: "asc" },
    });
    if (roles.length === 0) return [];
    const groups = await this.prisma.nurtureCareGroup.findMany({
      where: {
        workspaceId: input.workspace_id,
        id: { in: [...new Set(roles.map((role) => role.scopeId))] },
        status: "active",
        deletedAt: null,
        institution: { status: "active", deletedAt: null },
      },
      orderBy: { id: "asc" },
    });
    return groups.map((group) => ({
      care_group_id: group.id,
      display_label: group.name,
    }));
  }

  async loadOrganizeSource(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    snapshot_at: string;
  }): Promise<CaptureOrganizeSourceV1 | null> {
    const at = new Date(input.snapshot_at);
    const role = await this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        scopeId: input.care_group_id,
        ...activeRoleWindow(at),
      },
    });
    const participant = role
      ? await this.prisma.nurtureParticipant.findFirst({
          where: {
            id: input.participant_id,
            workspaceId: input.workspace_id,
            status: "active",
            deletedAt: null,
          },
        })
      : null;
    if (!role || !participant) return null;

    const group = await this.prisma.nurtureCareGroup.findFirst({
      where: {
        id: input.care_group_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
      include: { institution: { select: { policyConfigPayload: true, status: true } } },
    });
    if (!group || group.institution.status !== "active") return null;

    const batch = await this.prisma.nurtureCareCaptureBatch.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        state: "collecting",
      },
      include: {
        captures: {
          where: { deletedAt: null },
          orderBy: { sourceSequence: "asc" },
          include: { capturedBy: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (!batch) return null;

    const authority = {
      role: role.role,
      role_scope_type: "care_group",
      role_scope_matches_source: true,
      role_assignment_current: true,
      fact_visible: true,
      purpose_allowed: true,
    };

    const organizePolicy = readOrganizePolicy(group.institution.policyConfigPayload ?? null);
    return {
      batch_id: batch.id,
      batch_version: batch.aggregateVersion,
      state: batch.state,
      ...(organizePolicy ? { organize_policy: organizePolicy } : {}),
      captures: batch.captures.map((capture) => ({
        capture_id: capture.id,
        kind: capture.kind,
        // `stable` is the owner's own durability fact: an upload still settling
        // is not stable however far along it is.
        stable: capture.stable,
        source_sequence: capture.sourceSequence,
        occurred_at: capture.occurredAt.toISOString(),
        authority: {
          ...authority,
          role_scope_matches_source: capture.careGroupId === input.care_group_id,
        },
      })),
      activity: {
        // Only real user activity counts; machine progress is reported
        // separately so it can never satisfy the quiescence gate.
        last_user_activity_at: (batch.observedUserActivityAt ?? batch.createdAt).toISOString(),
        last_machine_progress_at: batch.updatedAt.toISOString(),
        ...(batch.quiescenceSeconds !== null && batch.observedUserActivityAt
          ? {
              activity_lease_expires_at: new Date(
                batch.observedUserActivityAt.getTime() + batch.quiescenceSeconds * 1000,
              ).toISOString(),
            }
          : {}),
      },
      // `fallback_due_at` means the daily fallback point has been reached. The
      // owner records no such fact, and `cutAt` is when a batch was cut — a
      // different thing entirely. Absent until there is a fact to report.

    };
  }
}
