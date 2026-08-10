import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  NurtureInstitutionAuthorityChain,
  canonicalJsonV1,
  type NurtureInstitutionKnowledgeCommandFactsResult,
  type NurtureInstitutionKnowledgeEventDraft,
  type NurtureInstitutionKnowledgeItemV1,
  type NurtureInstitutionKnowledgeMutation,
  type NurtureInstitutionKnowledgeMutationResult,
  type NurtureInstitutionKnowledgeRevisionEventV1,
  type NurtureInstitutionKnowledgeRevisionSummaryV1,
  type NurtureInstitutionKnowledgeTransaction,
} from "@the-nurture/scenario/harness";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";

const MAX_REVISIONS = 1_000;
const MAX_EVENTS = 4_000;

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

type ItemRow = {
  id: string;
  workspaceId: string;
  institutionId: string;
  category: NurtureInstitutionKnowledgeItemV1["category"];
  itemHead: number;
  latestRevisionId: string | null;
  currentPublishedRevisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RevisionRow = {
  id: string;
  workspaceId: string;
  institutionId: string;
  itemId: string;
  revisionNumber: number;
  contentHash: string;
  intendedAudiences: string[];
  ageBandKeys: string[];
  scenarioKeys: string[];
  safetyClass: NurtureInstitutionKnowledgeRevisionSummaryV1["safety_class"];
  validFrom: Date | null;
  validUntil: Date | null;
  authorParticipantId: string;
  authorRoleAssignmentId: string;
  createdAt: Date;
};

type EventRow = {
  id: string;
  workspaceId: string;
  institutionId: string;
  itemId: string;
  revisionId: string;
  commandExecutionId: string;
  eventType: NurtureInstitutionKnowledgeRevisionEventV1["event_type"];
  itemHead: number;
  eventOrdinal: number;
  actorParticipantId: string;
  actorRoleAssignmentId: string;
  reasonKey: string;
  occurredAt: Date;
};

const toItem = (row: ItemRow): NurtureInstitutionKnowledgeItemV1 => {
  if (!row.latestRevisionId) throw new Error("institution knowledge item has no latest revision");
  return {
    item_ref: row.id,
    workspace_id: row.workspaceId,
    institution_ref: row.institutionId,
    category: row.category,
    item_head: row.itemHead,
    latest_revision_ref: row.latestRevisionId,
    ...(row.currentPublishedRevisionId
      ? { current_published_revision_ref: row.currentPublishedRevisionId }
      : {}),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
};

const toRevision = (row: RevisionRow): NurtureInstitutionKnowledgeRevisionSummaryV1 => ({
  revision_ref: row.id,
  item_ref: row.itemId,
  workspace_id: row.workspaceId,
  institution_ref: row.institutionId,
  revision_number: row.revisionNumber,
  content_hash: row.contentHash,
  authorship: "institution_authored",
  intended_audiences:
    row.intendedAudiences as NurtureInstitutionKnowledgeRevisionSummaryV1["intended_audiences"],
  age_band_keys: row.ageBandKeys,
  scenario_keys: row.scenarioKeys,
  safety_class: row.safetyClass,
  ...(row.validFrom ? { valid_from: row.validFrom.toISOString() } : {}),
  ...(row.validUntil ? { valid_until: row.validUntil.toISOString() } : {}),
  author_participant_ref: row.authorParticipantId,
  author_role_assignment_ref: row.authorRoleAssignmentId,
  created_at: row.createdAt.toISOString(),
});

const toEvent = (row: EventRow): NurtureInstitutionKnowledgeRevisionEventV1 => ({
  event_ref: row.id,
  workspace_id: row.workspaceId,
  institution_ref: row.institutionId,
  item_ref: row.itemId,
  revision_ref: row.revisionId,
  event_type: row.eventType,
  item_head: row.itemHead,
  event_ordinal: row.eventOrdinal,
  actor_participant_ref: row.actorParticipantId,
  actor_role_assignment_ref: row.actorRoleAssignmentId,
  reason_key: row.reasonKey,
  command_execution_ref: row.commandExecutionId,
  occurred_at: row.occurredAt.toISOString(),
});

const sourceRefHash = (value: unknown): string =>
  createHash("sha256").update(canonicalJsonV1(value), "utf8").digest("hex");

const eventDraft = (input: {
  mutation: NurtureInstitutionKnowledgeMutation;
  item_ref: string;
  revision_ref: string;
  event_type: NurtureInstitutionKnowledgeEventDraft["event_type"];
  item_head: number;
  event_ordinal: number;
  reason_key: string;
  occurred_at: string;
}): NurtureInstitutionKnowledgeEventDraft => ({
  workspace_id: input.mutation.workspace_id,
  institution_ref: input.mutation.institution_ref,
  item_ref: input.item_ref,
  revision_ref: input.revision_ref,
  event_type: input.event_type,
  item_head: input.item_head,
  event_ordinal: input.event_ordinal,
  actor_participant_ref: input.mutation.actor_participant_ref,
  actor_role_assignment_ref: input.mutation.actor_role_assignment_ref,
  reason_key: input.reason_key,
  occurred_at: input.occurred_at,
});

export class PrismaInstitutionKnowledgeRepository
  implements NurtureInstitutionKnowledgeTransaction
{
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async loadCommandFacts(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    item_ref?: string;
  }): Promise<NurtureInstitutionKnowledgeCommandFactsResult> {
    try {
      const authority = await new NurtureInstitutionAuthorityChain(
        new PrismaInstitutionContextRepository(this.prisma),
      ).resolve({
        workspace_id: input.workspace_id,
        participant_ref: input.participant_ref,
        role_assignment_ref: input.role_assignment_ref,
        at: this.now().toISOString(),
      });
      if (
        authority.status === "denied" ||
        authority.active_role.role_kind !== "institution_admin" ||
        authority.active_role.scope_type !== "institution" ||
        authority.active_role.scope_ref !== input.institution_ref ||
        authority.institution_scope.institution_ref !== input.institution_ref
      ) {
        return {
          status: "denied",
          reason_code:
            authority.status === "denied" ? authority.reason_code : "not_authorized",
        };
      }
      if (!input.item_ref) {
        return {
          status: "resolved",
          facts: {
            actor_participant_ref: authority.active_role.participant_ref,
            actor_role_assignment_ref: authority.active_role.role_assignment_ref,
            revisions: [],
            events: [],
          },
        };
      }
      const item = await this.prisma.nurtureInstitutionKnowledgeItem.findFirst({
        where: {
          id: input.item_ref,
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
        },
      });
      if (!item) return { status: "denied", reason_code: "not_authorized" };
      const [revisions, events] = await Promise.all([
        this.prisma.nurtureInstitutionKnowledgeRevision.findMany({
          where: { itemId: item.id, workspaceId: input.workspace_id },
          orderBy: [{ revisionNumber: "asc" }, { id: "asc" }],
          take: MAX_REVISIONS + 1,
        }),
        this.prisma.nurtureInstitutionKnowledgeRevisionEvent.findMany({
          where: { itemId: item.id, workspaceId: input.workspace_id },
          orderBy: [{ itemHead: "asc" }, { eventOrdinal: "asc" }],
          take: MAX_EVENTS + 1,
        }),
      ]);
      if (revisions.length > MAX_REVISIONS || events.length > MAX_EVENTS) {
        return { status: "unavailable", reason_code: "knowledge_history_limit_exceeded" };
      }
      return {
        status: "resolved",
        facts: {
          actor_participant_ref: authority.active_role.participant_ref,
          actor_role_assignment_ref: authority.active_role.role_assignment_ref,
          item: toItem(item),
          revisions: revisions.map(toRevision),
          events: events.map(toEvent),
        },
      };
    } catch {
      return { status: "unavailable", reason_code: "institution_knowledge_owner_unavailable" };
    }
  }

  private revisionData(input: {
    mutation: Extract<
      NurtureInstitutionKnowledgeMutation,
      { kind: "create_item" | "create_revision" }
    >;
    item_ref: string;
    revision_number: number;
    occurred_at: Date;
  }) {
    const revision = input.mutation.revision;
    return {
      workspaceId: input.mutation.workspace_id,
      institutionId: input.mutation.institution_ref,
      itemId: input.item_ref,
      revisionNumber: input.revision_number,
      bodyEnvelope: asJson(revision.body_envelope),
      contentHash: revision.content_hash,
      intendedAudiences: revision.intended_audiences,
      ageBandKeys: revision.age_band_keys,
      scenarioKeys: revision.scenario_keys,
      safetyClass: revision.safety_class,
      ...(revision.valid_from ? { validFrom: new Date(revision.valid_from) } : {}),
      ...(revision.valid_until ? { validUntil: new Date(revision.valid_until) } : {}),
      authorParticipantId: input.mutation.actor_participant_ref,
      authorRoleAssignmentId: input.mutation.actor_role_assignment_ref,
      createdAt: input.occurred_at,
    };
  }

  private async appendAuthorityLinks(input: {
    mutation: Extract<
      NurtureInstitutionKnowledgeMutation,
      { kind: "create_item" | "create_revision" }
    >;
    revision_ref: string;
    occurred_at: Date;
  }): Promise<void> {
    if (input.mutation.revision.verified_authority_links.length === 0) return;
    const result = await this.prisma.nurtureInstitutionKnowledgeAuthorityLink.createMany({
      data: input.mutation.revision.verified_authority_links.map((link) => ({
        workspaceId: input.mutation.workspace_id,
        institutionId: input.mutation.institution_ref,
        revisionId: input.revision_ref,
        authoritySourceRef: asJson(link.authority_source_ref),
        sourceRefHash: sourceRefHash(link.authority_source_ref),
        sourceVersion: link.source_version,
        publisher: link.publisher,
        title: link.title,
        sourceDate: new Date(`${link.source_date}T00:00:00.000Z`),
        deepLink: link.deep_link,
        excerpt: link.excerpt,
        verifiedAt: new Date(link.verified_at),
        snapshotHash: link.snapshot_hash,
        createdAt: input.occurred_at,
      })),
    });
    if (result.count !== input.mutation.revision.verified_authority_links.length) {
      throw new Error("institution knowledge authority links were not appended atomically");
    }
  }

  async applyMutation(
    mutation: NurtureInstitutionKnowledgeMutation,
  ): Promise<NurtureInstitutionKnowledgeMutationResult> {
    const occurredAt = this.now();
    const occurredAtIso = occurredAt.toISOString();
    if (mutation.kind === "create_item") {
      const item = await this.prisma.nurtureInstitutionKnowledgeItem.create({
        data: {
          workspaceId: mutation.workspace_id,
          institutionId: mutation.institution_ref,
          category: mutation.category,
          itemHead: 1,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        },
      });
      const revision = await this.prisma.nurtureInstitutionKnowledgeRevision.create({
        data: this.revisionData({
          mutation,
          item_ref: item.id,
          revision_number: 1,
          occurred_at: occurredAt,
        }),
      });
      await this.appendAuthorityLinks({
        mutation,
        revision_ref: revision.id,
        occurred_at: occurredAt,
      });
      const completed = await this.prisma.nurtureInstitutionKnowledgeItem.update({
        where: { id: item.id },
        data: { latestRevisionId: revision.id, updatedAt: occurredAt },
      });
      return {
        committed: true,
        item: toItem(completed),
        revision: toRevision(revision),
        revision_state: mutation.resulting_state,
        event_drafts: [
          eventDraft({
            mutation,
            item_ref: item.id,
            revision_ref: revision.id,
            event_type: "revision_created",
            item_head: 1,
            event_ordinal: 0,
            reason_key: "knowledge_item_created",
            occurred_at: occurredAtIso,
          }),
        ],
        occurred_at: occurredAtIso,
      };
    }

    // Lock the item before a new revision claims its next number. The command
    // transaction is Serializable, but the explicit row lock also prevents a
    // unique-index race from being misreported as a generic technical error.
    const locked = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT "id"
        FROM "nurture_institution_knowledge_item"
        WHERE "id" = ${mutation.item_ref}
          AND "workspace_id" = ${mutation.workspace_id}
          AND "institution_id" = ${mutation.institution_ref}
        FOR UPDATE`,
    );
    if (locked.length !== 1) return { committed: false };
    const item = await this.prisma.nurtureInstitutionKnowledgeItem.findFirst({
      where: {
        id: mutation.item_ref,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        itemHead: mutation.expected_item_head,
      },
    });
    if (!item?.latestRevisionId) return { committed: false };

    if (mutation.kind === "create_revision") {
      const revision = await this.prisma.nurtureInstitutionKnowledgeRevision.create({
        data: this.revisionData({
          mutation,
          item_ref: item.id,
          revision_number: mutation.revision_number,
          occurred_at: occurredAt,
        }),
      });
      await this.appendAuthorityLinks({
        mutation,
        revision_ref: revision.id,
        occurred_at: occurredAt,
      });
      const updated = await this.prisma.nurtureInstitutionKnowledgeItem.updateMany({
        where: {
          id: item.id,
          workspaceId: mutation.workspace_id,
          institutionId: mutation.institution_ref,
          itemHead: mutation.expected_item_head,
          latestRevisionId: item.latestRevisionId,
        },
        data: {
          latestRevisionId: revision.id,
          itemHead: { increment: 1 },
          updatedAt: occurredAt,
        },
      });
      if (updated.count !== 1) return { committed: false };
      const completed = await this.prisma.nurtureInstitutionKnowledgeItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      const events = [
        eventDraft({
          mutation,
          item_ref: item.id,
          revision_ref: revision.id,
          event_type: "revision_created",
          item_head: mutation.expected_item_head + 1,
          event_ordinal: 0,
          reason_key: "knowledge_revision_created",
          occurred_at: occurredAtIso,
        }),
        ...(mutation.superseded_revision_ref
          ? [
              eventDraft({
                mutation,
                item_ref: item.id,
                revision_ref: mutation.superseded_revision_ref,
                event_type: "revision_superseded",
                item_head: mutation.expected_item_head + 1,
                event_ordinal: 1,
                reason_key: "newer_revision_created",
                occurred_at: occurredAtIso,
              }),
            ]
          : []),
      ];
      return {
        committed: true,
        item: toItem(completed),
        revision: toRevision(revision),
        revision_state: mutation.resulting_state,
        event_drafts: events,
        occurred_at: occurredAtIso,
      };
    }

    const revision = await this.prisma.nurtureInstitutionKnowledgeRevision.findFirst({
      where: {
        id: mutation.revision_ref,
        itemId: item.id,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
      },
    });
    if (!revision) return { committed: false };

    if (mutation.kind === "record_review") {
      const updated = await this.prisma.nurtureInstitutionKnowledgeItem.updateMany({
        where: { id: item.id, itemHead: mutation.expected_item_head },
        data: { itemHead: { increment: 1 }, updatedAt: occurredAt },
      });
      if (updated.count !== 1) return { committed: false };
      const completed = await this.prisma.nurtureInstitutionKnowledgeItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      return {
        committed: true,
        item: toItem(completed),
        revision: toRevision(revision),
        revision_state: mutation.resulting_state,
        event_drafts: [
          eventDraft({
            mutation,
            item_ref: item.id,
            revision_ref: revision.id,
            event_type: mutation.decision,
            item_head: mutation.expected_item_head + 1,
            event_ordinal: 0,
            reason_key: mutation.reason_key,
            occurred_at: occurredAtIso,
          }),
        ],
        occurred_at: occurredAtIso,
      };
    }

    if (mutation.kind === "publish_revision") {
      const updated = await this.prisma.nurtureInstitutionKnowledgeItem.updateMany({
        where: {
          id: item.id,
          itemHead: mutation.expected_item_head,
          latestRevisionId: revision.id,
          NOT: { currentPublishedRevisionId: revision.id },
        },
        data: {
          currentPublishedRevisionId: revision.id,
          itemHead: { increment: 1 },
          updatedAt: occurredAt,
        },
      });
      if (updated.count !== 1) return { committed: false };
      const completed = await this.prisma.nurtureInstitutionKnowledgeItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      const events = [
        ...(mutation.superseded_revision_ref
          ? [
              eventDraft({
                mutation,
                item_ref: item.id,
                revision_ref: mutation.superseded_revision_ref,
                event_type: "publication_superseded",
                item_head: mutation.expected_item_head + 1,
                event_ordinal: 0,
                reason_key: "new_publication_selected",
                occurred_at: occurredAtIso,
              }),
            ]
          : []),
        eventDraft({
          mutation,
          item_ref: item.id,
          revision_ref: revision.id,
          event_type: "published",
          item_head: mutation.expected_item_head + 1,
          event_ordinal: mutation.superseded_revision_ref ? 1 : 0,
          reason_key: "knowledge_revision_published",
          occurred_at: occurredAtIso,
        }),
      ];
      return {
        committed: true,
        item: toItem(completed),
        revision: toRevision(revision),
        revision_state: mutation.resulting_state,
        event_drafts: events,
        occurred_at: occurredAtIso,
      };
    }

    const updated = await this.prisma.nurtureInstitutionKnowledgeItem.updateMany({
      where: {
        id: item.id,
        itemHead: mutation.expected_item_head,
        currentPublishedRevisionId: revision.id,
      },
      data: {
        currentPublishedRevisionId: null,
        itemHead: { increment: 1 },
        updatedAt: occurredAt,
      },
    });
    if (updated.count !== 1) return { committed: false };
    const completed = await this.prisma.nurtureInstitutionKnowledgeItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    return {
      committed: true,
      item: toItem(completed),
      revision: toRevision(revision),
      revision_state: mutation.resulting_state,
      event_drafts: [
        eventDraft({
          mutation,
          item_ref: item.id,
          revision_ref: revision.id,
          event_type: "revoked",
          item_head: mutation.expected_item_head + 1,
          event_ordinal: 0,
          reason_key: mutation.reason_key,
          occurred_at: occurredAtIso,
        }),
      ],
      occurred_at: occurredAtIso,
    };
  }

  async appendEvents(input: {
    command_execution_id: string;
    events: NurtureInstitutionKnowledgeEventDraft[];
  }): Promise<void> {
    if (input.events.length < 1 || input.events.length > 2) {
      throw new Error("invalid institution knowledge event batch");
    }
    const result = await this.prisma.nurtureInstitutionKnowledgeRevisionEvent.createMany({
      data: input.events.map((event) => ({
        workspaceId: event.workspace_id,
        institutionId: event.institution_ref,
        itemId: event.item_ref,
        revisionId: event.revision_ref,
        commandExecutionId: input.command_execution_id,
        eventType: event.event_type,
        itemHead: event.item_head,
        eventOrdinal: event.event_ordinal,
        actorParticipantId: event.actor_participant_ref,
        actorRoleAssignmentId: event.actor_role_assignment_ref,
        reasonKey: event.reason_key,
        occurredAt: new Date(event.occurred_at),
      })),
    });
    if (result.count !== input.events.length) {
      throw new Error("institution knowledge events were not appended atomically");
    }
  }
}
