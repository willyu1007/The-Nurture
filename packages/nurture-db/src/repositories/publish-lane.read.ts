import type {
  BoardSortKeyV1,
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
  aggregateCensus,
  caregiverRowAuthority,
  censusOf,
  resolveCaregiverReach,
  sourceHeadPair,
  type BoardPrisma,
  type CaregiverReachV1,
} from "./board-read-support.js";

const PUBLISH_STATES = [
  "draft",
  "needs_review",
  "pending_release",
  "released",
  "cancelled",
] as const satisfies readonly PublishProcessStateV1[];

/**
 * The two publishable data classes. A process carrying anything else is not
 * publish-queue work; it is excluded rather than presented under a class it
 * does not have, which is what a fallback branch would do.
 */
const PUBLISHABLE_DATA_CLASSES = ["daily_care_log", "child_growth_record"] as const;

/**
 * "Strictly after this position" in the declared queue order. The order mixes
 * directions, so the lexicographic comparison is written out rather than
 * expressed as a single row comparison.
 */
const strictlyAfter = (before: BoardSortKeyV1) => {
  const sameState =
    before.rank === undefined
      ? {}
      : { state: PUBLISH_STATES[Number(before.rank)] ?? PUBLISH_STATES[0] };
  const withinState = [
    { ...sameState, updatedAt: { lt: new Date(before.occurred_at) } },
    { ...sameState, updatedAt: new Date(before.occurred_at), processKey: { lt: before.id } },
  ];
  return before.rank === undefined
    ? { OR: withinState }
    : {
        OR: [
          { state: { in: PUBLISH_STATES.slice(Number(before.rank) + 1) } },
          ...withinState,
        ],
      };
};

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
    before?: BoardSortKeyV1;
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
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
    if (!reach || reach.care_group_id !== input.care_group_id) {
      return {
        authorized: false,
        rows: [],
        has_more: false,
        heads: [],
        state_counts: emptyCounts,
      };
    }

    const [processes, grouped, grants, queueCensus] = await Promise.all([
      this.prisma.nurturePublishProcess.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: reach.care_group_id,
          dataClass: { in: [...PUBLISHABLE_DATA_CLASSES] },
          ...(input.before ? strictlyAfter(input.before) : {}),
        },
        include: {
          currentRevision: true,
          targets: { include: { release: { select: { id: true } } } },
          editHold: true,
        },
        // Exactly TEACHER_PUBLISH_QUEUE_ORDER. The enum's declaration order is
        // the state rank, so ordering by it is the rank the cursor carries.
        orderBy: [{ state: "asc" }, { updatedAt: "desc" }, { processKey: "desc" }],
        take: input.take + 1,
      }),
      // The census is queue-wide for this CareGroup: it must not become a count
      // of whatever the current page happened to contain.
      this.prisma.nurturePublishProcess.groupBy({
        by: ["state"],
        where: {
          workspaceId: input.workspace_id,
          careGroupId: reach.care_group_id,
          dataClass: { in: [...PUBLISHABLE_DATA_CLASSES] },
        },
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
      aggregateCensus((args) =>
        this.prisma.nurturePublishProcess.aggregate({
          where: {
            workspaceId: input.workspace_id,
            careGroupId: reach.care_group_id,
            dataClass: { in: [...PUBLISHABLE_DATA_CLASSES] },
          },
          ...args,
        }),
      ),
    ]);

    const stateCounts = { ...emptyCounts };
    for (const row of grouped) stateCounts[row.state] = row._count._all;

    const rows: RawPublishQueueRow[] = processes.map((process) => ({
      process_key: process.processKey,
      state: process.state,
      data_class: process.dataClass as (typeof PUBLISHABLE_DATA_CLASSES)[number],
      title: this.safeTitle(process.currentRevision?.titleProtectionPayload ?? null),
      current_revision: process.currentRevision?.revision ?? 0,
      target_count: process.targets.length,
      released_target_count: process.targets.filter((target) => target.release !== null).length,
      occurred_at: process.updatedAt.toISOString(),
      // A schedule is shown only once the institution actually resolved one.
      ...(process.scheduledAt ? { scheduled_at: process.scheduledAt.toISOString() } : {}),
      edit_hold_active: Boolean(process.editHold && process.editHold.expiresAt > at),
      authority: caregiverRowAuthority(reach, process.careGroupId) as CaregiverFactAuthorityV1,
      // No action is advertised while the publish write lane has no owner write
      // and no ingress route. A board that offers "Save draft" on a card whose
      // capability answers `unknown_capability` has made a promise the system
      // cannot keep — the same placeholder the freeze refuses on the ingress
      // side, arriving from the read side instead. Restore the grant with B8.
      action_grants: [],
    }));

    const page = rows.slice(0, input.take);

    return {
      authorized: true,
      rows: page,
      has_more: rows.length > page.length,
      heads: [
        {
          source_kind: "care_group_role",
          source_id: reach.role_assignment_id,
          fact_version: reach.role_version,
          // Scope-level: a head built from the page would move whenever the
          // page size did, which is not a change in the source.
          ...sourceHeadPair(
            "publish_queue",
            [reach.care_group_id, queueCensus.count, queueCensus.newest],
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
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
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
    const reach = await resolveCaregiverReach(this.prisma, workspaceId, participantId, at);
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
    reach: CaregiverReachV1,
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
      authority: caregiverRowAuthority(reach, process.careGroupId) as CaregiverFactAuthorityV1,
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
