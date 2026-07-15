import type { PrismaClient } from "@prisma/client";
import type {
  NurtureUserAttentionFacts,
  NurtureUserAttentionRepository,
} from "@the-nurture/scenario";

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
}
