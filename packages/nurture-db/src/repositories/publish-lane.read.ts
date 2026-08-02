import type {
  CaregiverFactAuthorityV1,
  ProtectedContentEnvelopeV1,
  ProtectedContentWritePort,
  PublishCancelFactsV1,
  PublishCancelReadPort,
  PublishDraftFactsV1,
  PublishDraftReadPort,
  PublishEditHoldFactsV1,
  PublishEditHoldReadPort,
  PublishProcessStateV1,
  RawBoardSourceHead,
  RawPublishQueueRow,
  TeacherPublishQueueReadPort,
} from "@the-nurture/scenario/harness";
import { assertProtectedContentEnvelopeV1 } from "@the-nurture/scenario/harness";
import {
  activeRoleWindow,
  censusOf,
  sourceHeadPair,
  type BoardPrisma,
} from "./board-read-support.js";

const PUBLISH_STATES = [
  "draft",
  "needs_review",
  "pending_release",
  "released",
  "cancelled",
] as const satisfies readonly PublishProcessStateV1[];

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

type CaregiverReach = { care_group_id: string; role: string; role_assignment_id: string };

/**
 * Reads behind the publish queue and the draft/hold/cancel lane (G3-B1).
 *
 * The queue is a class-shared work list: any current class teacher sees and may
 * act on any card in their own CareGroup, so authority is measured against the
 * exact source CareGroup rather than against who created the card.
 */
export class PrismaPublishLaneReadPort
  implements
    TeacherPublishQueueReadPort,
    PublishEditHoldReadPort,
    PublishDraftReadPort,
    PublishCancelReadPort
{
  constructor(
    private readonly prisma: BoardPrisma,
    /**
     * Absent by default. Without key material the queue shows no title rather
     * than a sealed payload — the no-store protected-content boundary stays
     * closed instead of leaking ciphertext into a public result.
     */
    private readonly protectedContent?: ProtectedContentWritePort,
  ) {}

  private async resolveReach(
    workspaceId: string,
    participantId: string,
    at: Date,
  ): Promise<CaregiverReach | null> {
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: { id: participantId, workspaceId, status: "active", deletedAt: null },
    });
    if (!participant) return null;
    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId,
        participantId,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        ...activeRoleWindow(at),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    for (const role of roles) {
      const group = await this.prisma.nurtureCareGroup.findFirst({
        where: { id: role.scopeId, workspaceId, status: "active", deletedAt: null },
      });
      if (group) {
        return { care_group_id: group.id, role: role.role, role_assignment_id: role.id };
      }
    }
    return null;
  }

  private authority(reach: CaregiverReach, sourceCareGroupId: string): CaregiverFactAuthorityV1 {
    return {
      role: reach.role,
      role_scope_type: "care_group",
      role_scope_matches_source: sourceCareGroupId === reach.care_group_id,
      role_assignment_current: true,
      fact_visible: true,
      purpose_allowed: true,
    };
  }

  private safeTitle(payload: unknown): string {
    if (!this.protectedContent || payload === null || typeof payload !== "object") return "";
    let envelope: ProtectedContentEnvelopeV1;
    try {
      assertProtectedContentEnvelopeV1(payload);
      envelope = payload as ProtectedContentEnvelopeV1;
      return this.protectedContent.unseal(envelope);
    } catch {
      return "";
    }
  }

  async listTeacherPublishQueue(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    snapshot_at: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{
    authorized: boolean;
    rows: RawPublishQueueRow[];
    has_more: boolean;
    heads: RawBoardSourceHead[];
    state_counts: Record<PublishProcessStateV1, number>;
  }> {
    const emptyCounts = Object.fromEntries(
      PUBLISH_STATES.map((state) => [state, 0]),
    ) as Record<PublishProcessStateV1, number>;
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
    if (!reach || reach.care_group_id !== input.care_group_id) {
      return {
        authorized: false,
        rows: [],
        has_more: false,
        heads: [],
        state_counts: emptyCounts,
      };
    }

    const [processes, grouped, grants] = await Promise.all([
      this.prisma.nurturePublishProcess.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: reach.care_group_id,
          ...(input.before ? { updatedAt: { lte: new Date(input.before.occurred_at) } } : {}),
        },
        include: {
          currentRevision: true,
          targets: { include: { release: { select: { id: true } } } },
          editHold: true,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: input.take + 1,
      }),
      // The census is queue-wide for this CareGroup: it must not become a count
      // of whatever the current page happened to contain.
      this.prisma.nurturePublishProcess.groupBy({
        by: ["state"],
        where: { workspaceId: input.workspace_id, careGroupId: reach.care_group_id },
        _count: { _all: true },
      }),
      this.prisma.nurtureChildLinkGrant.findMany({
        where: {
          workspaceId: input.workspace_id,
          grantedToScopeType: "care_group",
          grantedToScopeId: reach.care_group_id,
          status: "active",
          deletedAt: null,
        },
        select: { updatedAt: true },
      }),
    ]);

    const stateCounts = { ...emptyCounts };
    for (const row of grouped) stateCounts[row.state] = row._count._all;

    const rows: RawPublishQueueRow[] = processes.map((process) => ({
      process_key: process.processKey,
      state: process.state,
      data_class: process.dataClass === "child_growth_record" ? "child_growth_record" : "daily_care_log",
      title: this.safeTitle(process.currentRevision?.titleProtectionPayload ?? null),
      current_revision: process.currentRevision?.revision ?? 0,
      target_count: process.targets.length,
      released_target_count: process.targets.filter((target) => target.release !== null).length,
      occurred_at: process.updatedAt.toISOString(),
      // A schedule is shown only once the institution actually resolved one.
      ...(process.scheduledAt ? { scheduled_at: process.scheduledAt.toISOString() } : {}),
      edit_hold_active: Boolean(process.editHold && process.editHold.expiresAt > at),
      authority: this.authority(reach, process.careGroupId),
      action_grants: [
        {
          capability_key: "save_publish_process_draft",
          capability_version: "1.0.0",
          availability: "available" as const,
          target_option_id: process.processKey,
          target_kind: "publish_process",
        },
      ],
    }));

    const afterCursor = input.before
      ? rows.filter(
          (row) =>
            row.occurred_at < input.before!.occurred_at ||
            (row.occurred_at === input.before!.occurred_at &&
              row.process_key < input.before!.id),
        )
      : rows;
    const page = afterCursor.slice(0, input.take);

    return {
      authorized: true,
      rows: page,
      has_more: afterCursor.length > page.length,
      heads: [
        {
          source_kind: "care_group_role",
          source_id: reach.role_assignment_id,
          fact_version: page.length,
          ...sourceHeadPair(
            "publish_queue",
            [reach.care_group_id, ...processes.map((process) => process.updatedAt.toISOString())],
            censusOf(grants),
          ),
        },
      ],
      state_counts: stateCounts,
    };
  }

  async listEditableProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, new Date());
    if (!reach) return [];
    const processes = await this.prisma.nurturePublishProcess.findMany({
      where: { workspaceId: input.workspace_id, careGroupId: reach.care_group_id },
      select: { processKey: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return processes.map((process) => process.processKey);
  }

  private async loadProcess(
    workspaceId: string,
    participantId: string,
    processKey: string,
  ) {
    const at = new Date();
    const reach = await this.resolveReach(workspaceId, participantId, at);
    if (!reach) return null;
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId, processKey },
      include: {
        currentRevision: true,
        editHold: { include: { holder: { include: { participant: true } } } },
      },
    });
    if (!process) return null;
    return { at, reach, process };
  }

  private holdFacts(
    at: Date,
    reach: CaregiverReach,
    process: {
      state: PublishProcessStateV1;
      careGroupId: string;
      editHold: {
        holderParticipantId: string;
        expiresAt: Date;
        holder: { displayLabel: string | null };
      } | null;
    },
  ): PublishEditHoldFactsV1 {
    const hold = process.editHold;
    return {
      process_state: process.state,
      authority: this.authority(reach, process.careGroupId),
      // An expired hold is no hold. It is never renewed implicitly by being read.
      ...(hold && hold.expiresAt > at
        ? {
            current_hold: {
              holder_participant_id: hold.holderParticipantId,
              holder_label: hold.holder.displayLabel ?? "",
              expires_at: hold.expiresAt.toISOString(),
            },
          }
        : {}),
    };
  }

  async loadEditHoldFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublishEditHoldFactsV1 | null> {
    const loaded = await this.loadProcess(
      input.workspace_id,
      input.participant_id,
      input.process_key,
    );
    if (!loaded) return null;
    return this.holdFacts(loaded.at, loaded.reach, loaded.process);
  }

  async loadDraftFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
  }): Promise<PublishDraftFactsV1 | null> {
    const loaded = await this.loadProcess(
      input.workspace_id,
      input.participant_id,
      input.process_key,
    );
    if (!loaded) return null;
    const { at, reach, process } = loaded;

    // An exact command replay is answered from the revision that command wrote,
    // never by writing a second one.
    const replayed = await this.prisma.nurturePublishProcessRevision.findFirst({
      where: {
        workspaceId: input.workspace_id,
        publishProcessId: process.id,
        organizerInputRevision: input.command_request_id,
      },
      orderBy: { revision: "desc" },
    });

    return {
      ...this.holdFacts(at, reach, process),
      current_revision: process.currentRevision?.revision ?? 0,
      // Only refs the owner itself recorded for this process are known; an
      // unknown ref in a saved segment would fabricate provenance.
      known_source_refs: readSourceRefs(process.currentRevision?.sourceRefsPayload ?? null),
      ...(replayed
        ? {
            replayed_revision: {
              revision: replayed.revision,
              content_digest: replayed.contentDigest,
              saved_at: replayed.createdAt.toISOString(),
            },
          }
        : {}),
    };
  }

  async loadCancelFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublishCancelFactsV1 | null> {
    const loaded = await this.loadProcess(
      input.workspace_id,
      input.participant_id,
      input.process_key,
    );
    if (!loaded) return null;
    const committed = await this.prisma.nurturePublicationRelease.count({
      where: { workspaceId: input.workspace_id, publishProcessId: loaded.process.id },
    });
    return {
      ...this.holdFacts(loaded.at, loaded.reach, loaded.process),
      committed_release_count: committed,
    };
  }
}

/** A malformed payload contributes no known refs rather than a partial set. */
const readSourceRefs = (payload: unknown): string[] =>
  Array.isArray(payload) && payload.every((entry) => typeof entry === "string")
    ? (payload as string[])
    : [];
