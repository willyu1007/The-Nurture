import type { PrismaClient } from "@prisma/client";
import type {
  NurtureUserAttentionAcknowledgeApplied,
  NurtureUserAttentionFacts,
  NurtureUserAttentionRepository,
} from "@the-nurture/scenario/harness";

const OWNER_ACKNOWLEDGEMENT_SOURCE = "user_attention_owner";

/**
 * Owner-side acknowledgement records are persisted as `acknowledged` item
 * events whose payload carries the idempotency key and the presented item
 * version, so replays can restate the original response verbatim.
 */
const storedAcknowledgement = (event: {
  id: string;
  eventPayload: unknown;
}): NonNullable<NonNullable<NurtureUserAttentionFacts["item"]>["acknowledgement"]> | null => {
  const payload = event.eventPayload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  if (
    record.source !== OWNER_ACKNOWLEDGEMENT_SOURCE ||
    typeof record.idempotency_key !== "string" ||
    typeof record.item_version !== "number" ||
    typeof record.acknowledged_at !== "string"
  ) {
    return null;
  }
  return {
    receipt_id: event.id,
    idempotency_key: record.idempotency_key,
    item_version: record.item_version,
    acknowledged_at: record.acknowledged_at,
  };
};

const currentGrant = (
  grant: {
    status: string;
    effectiveFrom: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
  } | null,
  at: Date,
): boolean =>
  Boolean(
    grant &&
      grant.status === "active" &&
      !grant.revokedAt &&
      (!grant.effectiveFrom || grant.effectiveFrom <= at) &&
      (!grant.expiresAt || grant.expiresAt > at),
  );

/**
 * Owner-side current read for My-Chat activation. It deliberately selects no
 * message body, attachment, child display, or item detail fields.
 */
export class PrismaUserAttentionRepository implements NurtureUserAttentionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async loadCurrentFacts(input: {
    workspace_id: string;
    message_id: string;
    receipt_id: string;
    item_id: string;
    at: string;
  }): Promise<NurtureUserAttentionFacts> {
    const at = new Date(input.at);
    if (Number.isNaN(at.getTime())) throw new Error("invalid user-attention read time");

    const [message, receipt, item] = await Promise.all([
      this.prisma.nurtureFamilyCareMessage.findFirst({
        where: { id: input.message_id, workspaceId: input.workspace_id },
        select: {
          id: true,
          status: true,
          redactedAt: true,
          threadId: true,
          childCareProcessId: true,
          grantId: true,
        },
      }),
      this.prisma.nurtureChildLinkReceipt.findFirst({
        where: { id: input.receipt_id, workspaceId: input.workspace_id },
        select: {
          id: true,
          status: true,
          direction: true,
          dataClass: true,
          sourceType: true,
          sourceId: true,
          targetScopeType: true,
          targetScopeId: true,
          grantId: true,
          childCareProcessId: true,
          enrollmentId: true,
        },
      }),
      this.prisma.nurtureFamilyCareItem.findFirst({
        where: { id: input.item_id, workspaceId: input.workspace_id },
        select: {
          id: true,
          status: true,
          sourceMessageId: true,
          threadId: true,
          childCareProcessId: true,
          enrollmentId: true,
          careGroupId: true,
          grantId: true,
          dataClass: true,
          expiresAt: true,
          version: true,
          updatedAt: true,
          acknowledgementState: true,
          thread: { select: { status: true, deletedAt: true } },
          enrollment: {
            select: {
              id: true,
              status: true,
              deletedAt: true,
              institutionId: true,
              careGroupId: true,
            },
          },
          careGroup: {
            select: {
              id: true,
              status: true,
              deletedAt: true,
              institution: { select: { id: true, status: true, deletedAt: true } },
            },
          },
          grant: {
            select: {
              id: true,
              status: true,
              directions: true,
              dataClasses: true,
              grantedToScopeType: true,
              grantedToScopeId: true,
              effectiveFrom: true,
              expiresAt: true,
              revokedAt: true,
              deletedAt: true,
            },
          },
        },
      }),
    ]);

    const enrollment = item?.enrollment ?? null;
    const institution = item?.careGroup.institution ?? null;
    const scopeCandidates = item
      ? [
          { scopeType: "care_group" as const, scopeId: item.careGroupId },
          ...(item.enrollmentId
            ? [{ scopeType: "enrollment" as const, scopeId: item.enrollmentId }]
            : []),
          ...(institution
            ? [{ scopeType: "institution" as const, scopeId: institution.id }]
            : []),
        ]
      : [];
    const recipients = item
      ? await this.prisma.nurtureCareRoleAssignment.findMany({
          where: {
            workspaceId: input.workspace_id,
            role: { in: ["caregiver", "lead_caregiver", "institution_admin"] },
            status: "active",
            deletedAt: null,
            OR: [{ startsAt: null }, { startsAt: { lte: at } }],
            AND: [
              { OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
              { OR: scopeCandidates },
            ],
            participant: { status: "active", deletedAt: null },
            threadMemberships: {
              some: {
                threadId: item.threadId,
                visibilityStatus: "active",
                deletedAt: null,
              },
            },
          },
          select: { participant: { select: { myChatUserId: true } } },
          orderBy: { id: "asc" },
          take: 200,
        })
      : [];

    const itemAcknowledged = Boolean(
      item && (item.status === "acknowledged" || item.acknowledgementState === "acknowledged"),
    );
    const acknowledgementEvent = itemAcknowledged
      ? await this.prisma.nurtureFamilyCareItemEvent.findFirst({
          where: {
            workspaceId: input.workspace_id,
            itemId: input.item_id,
            eventType: "acknowledged",
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, eventPayload: true },
        })
      : null;

    const grant = item?.grant ?? null;
    const grantTargetMatches = Boolean(
      grant &&
        receipt &&
        receipt.targetScopeType === grant.grantedToScopeType &&
        receipt.targetScopeId === grant.grantedToScopeId &&
        ((grant.grantedToScopeType === "care_group" &&
          grant.grantedToScopeId === item?.careGroupId) ||
          (grant.grantedToScopeType === "enrollment" &&
            grant.grantedToScopeId === item?.enrollmentId) ||
          (grant.grantedToScopeType === "institution" &&
            grant.grantedToScopeId === institution?.id)),
    );

    return {
      message: message
        ? {
            id: message.id,
            status: message.status,
            redacted: Boolean(message.redactedAt),
            thread_id: message.threadId,
            child_care_process_id: message.childCareProcessId,
            ...(message.grantId ? { grant_id: message.grantId } : {}),
          }
        : null,
      receipt: receipt
        ? {
            id: receipt.id,
            status: receipt.status,
            direction: receipt.direction,
            ...(receipt.dataClass ? { data_class: receipt.dataClass } : {}),
            source_type: receipt.sourceType,
            source_id: receipt.sourceId,
            ...(receipt.targetScopeType ? { target_scope_type: receipt.targetScopeType } : {}),
            ...(receipt.targetScopeId ? { target_scope_id: receipt.targetScopeId } : {}),
            ...(receipt.grantId ? { grant_id: receipt.grantId } : {}),
            child_care_process_id: receipt.childCareProcessId,
            ...(receipt.enrollmentId ? { enrollment_id: receipt.enrollmentId } : {}),
          }
        : null,
      item: item
        ? {
            id: item.id,
            status: item.status,
            ...(item.sourceMessageId ? { source_message_id: item.sourceMessageId } : {}),
            thread_id: item.threadId,
            child_care_process_id: item.childCareProcessId,
            ...(item.enrollmentId ? { enrollment_id: item.enrollmentId } : {}),
            care_group_id: item.careGroupId,
            ...(item.grantId ? { grant_id: item.grantId } : {}),
            data_class: item.dataClass,
            ...(item.expiresAt ? { expires_at: item.expiresAt.toISOString() } : {}),
            version: item.version,
            updated_at: item.updatedAt.toISOString(),
            acknowledged: itemAcknowledged,
            acknowledgement: acknowledgementEvent
              ? storedAcknowledgement(acknowledgementEvent)
              : null,
          }
        : null,
      current: {
        grant_active: currentGrant(grant, at) && grant?.deletedAt === null,
        grant_revoked: Boolean(
          grant &&
            (grant.status === "revoked" || grant.status === "expired" || grant.revokedAt),
        ),
        grant_direction_allowed: Boolean(grant?.directions.includes("family_to_org")),
        grant_data_class_allowed: Boolean(item && grant?.dataClasses.includes(item.dataClass)),
        grant_target_matches: grantTargetMatches,
        enrollment_active: Boolean(
          enrollment && enrollment.status === "active" && !enrollment.deletedAt,
        ),
        thread_active: Boolean(item?.thread.status === "active" && !item.thread.deletedAt),
        care_group_active: Boolean(
          item?.careGroup.status === "active" && !item.careGroup.deletedAt,
        ),
        institution_active: Boolean(
          institution?.status === "active" && !institution.deletedAt,
        ),
      },
      recipient_user_ids: recipients.map((row) => row.participant.myChatUserId),
    };
  }

  async applyAcknowledgement(input: {
    workspace_id: string;
    item_id: string;
    receipt_id: string;
    actor_user_id: string;
    idempotency_key: string;
    expected_item_version: number;
    acknowledged_item_version: number;
    at: string;
  }): Promise<NurtureUserAttentionAcknowledgeApplied | { status: "conflict" }> {
    const at = new Date(input.at);
    if (Number.isNaN(at.getTime())) throw new Error("invalid user-attention acknowledge time");
    return this.prisma.$transaction(async (tx) => {
      const actorParticipant = await tx.nurtureParticipant.findFirst({
        where: {
          workspaceId: input.workspace_id,
          myChatUserId: input.actor_user_id,
          status: "active",
          deletedAt: null,
        },
        select: { id: true },
      });
      // Fence in the mutated channel: the conditional update loses against any
      // concurrent acknowledge (version moved), lifecycle change (status left
      // "open"), or grant revocation/expiry committed after the owner reread.
      // Single-writer cutover (10-g2-schema-freeze.md C6/C8): this legacy-shape
      // write must never mutate a harness-managed row, so it fails closed on
      // any writer contract other than legacy_v1.
      const updated = await tx.nurtureFamilyCareItem.updateMany({
        where: {
          id: input.item_id,
          workspaceId: input.workspace_id,
          version: input.expected_item_version,
          status: "open",
          writerContract: "legacy_v1",
          grant: {
            status: "active",
            revokedAt: null,
            deletedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: at } }],
          },
        },
        data: {
          status: "acknowledged",
          ...(actorParticipant ? { ackedByParticipantId: actorParticipant.id } : {}),
          ackedAt: at,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) return { status: "conflict" as const };
      await tx.nurtureChildLinkReceipt.updateMany({
        where: {
          id: input.receipt_id,
          workspaceId: input.workspace_id,
          status: { in: ["delivered", "read"] },
        },
        data: { status: "acknowledged", acknowledgedAt: at, version: { increment: 1 } },
      });
      const event = await tx.nurtureFamilyCareItemEvent.create({
        data: {
          workspaceId: input.workspace_id,
          itemId: input.item_id,
          ...(actorParticipant ? { actorParticipantId: actorParticipant.id } : {}),
          eventType: "acknowledged",
          fromStatus: "open",
          toStatus: "acknowledged",
          eventPayload: {
            source: OWNER_ACKNOWLEDGEMENT_SOURCE,
            idempotency_key: input.idempotency_key,
            actor_user_id: input.actor_user_id,
            acknowledged_at: input.at,
            item_version: input.acknowledged_item_version,
          },
        },
        select: { id: true },
      });
      return {
        status: "applied" as const,
        receipt_id: event.id,
        acknowledged_at: input.at,
      };
    });
  }
}
