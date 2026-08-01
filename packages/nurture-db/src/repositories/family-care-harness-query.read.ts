import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  FamilyCareQueryReadPort,
  RawItemDetail,
  RawTimelineMessageRow,
  RawWorkItemRow,
} from "@the-nurture/scenario/harness";

const G2_WRITERS = ["harness_g2_v1", "legacy_migrated_v1"] as const;

type Client = PrismaClient | Prisma.TransactionClient;

const attentionState = (
  status: "active" | "resolved" | "expired" | "suppressed" | undefined,
): "active" | "resolved" | "suppressed" =>
  status === "active" ? "active" : status === "suppressed" || status === "expired" ? "suppressed" : "resolved";

const currentGuardianProcessIds = async (
  prisma: Client,
  workspaceId: string,
  participantId: string,
): Promise<Set<string> | null> => {
  const now = new Date();
  const participant = await prisma.nurtureParticipant.findFirst({
    where: { id: participantId, workspaceId, status: "active", deletedAt: null },
  });
  if (!participant) return null;
  const roles = await prisma.nurtureCareRoleAssignment.findMany({
    where: {
      workspaceId,
      participantId,
      role: "guardian",
      status: "active",
      deletedAt: null,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
  });
  const processIds = new Set<string>();
  for (const role of roles) {
    if (role.scopeType === "child_care_process") processIds.add(role.scopeId);
    else if (role.scopeType === "family") {
      const family = await prisma.nurtureFamily.findFirst({
        where: { id: role.scopeId, workspaceId, status: "active", deletedAt: null },
      });
      if (family) processIds.add(family.childCareProcessId);
    } else if (role.scopeType === "enrollment") {
      const enrollment = await prisma.nurtureEnrollment.findFirst({
        where: { id: role.scopeId, workspaceId, deletedAt: null },
      });
      if (enrollment) processIds.add(enrollment.childCareProcessId);
    }
  }
  return processIds;
};

const currentCaregiverGroupIds = async (
  prisma: Client,
  workspaceId: string,
  participantId: string,
): Promise<Set<string> | null> => {
  const now = new Date();
  const participant = await prisma.nurtureParticipant.findFirst({
    where: { id: participantId, workspaceId, status: "active", deletedAt: null },
  });
  if (!participant) return null;
  const roles = await prisma.nurtureCareRoleAssignment.findMany({
    where: {
      workspaceId,
      participantId,
      role: { in: ["caregiver", "lead_caregiver"] },
      scopeType: "care_group",
      status: "active",
      deletedAt: null,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
  });
  return new Set(roles.map((role) => role.scopeId));
};

const beforeFilter = (
  before: { occurred_at: string; id: string } | undefined,
): Prisma.NurtureFamilyCareMessageWhereInput | Prisma.NurtureFamilyCareItemWhereInput => {
  if (!before) return {};
  const at = new Date(before.occurred_at);
  return {
    OR: [
      { createdAt: { lt: at } },
      { createdAt: at, id: { lt: before.id } },
    ],
  };
};

const enrollmentLabels = async (
  prisma: Client,
  workspaceId: string,
  enrollmentIds: string[],
): Promise<Map<string, string>> => {
  if (enrollmentIds.length === 0) return new Map();
  const enrollments = await prisma.nurtureEnrollment.findMany({
    where: { workspaceId, id: { in: enrollmentIds } },
    include: { institution: true, careGroup: true },
  });
  return new Map(
    enrollments.map((enrollment) => [
      enrollment.id,
      `${enrollment.institution.displayName} · ${enrollment.careGroup.name}`,
    ]),
  );
};

/**
 * Read-only projection source for the G2 query lane. Every list is scoped to
 * the caller's current role reach, only harness-managed rows are projected,
 * and raw rows never leave the domain presenter.
 */
export class PrismaFamilyCareHarnessQueryReadPort implements FamilyCareQueryReadPort {
  constructor(private readonly prisma: Client) {}

  async listGuardianTimeline(input: {
    workspace_id: string;
    participant_id: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{ authorized: boolean; rows: RawTimelineMessageRow[] }> {
    const processIds = await currentGuardianProcessIds(
      this.prisma,
      input.workspace_id,
      input.participant_id,
    );
    if (!processIds) return { authorized: false, rows: [] };
    if (processIds.size === 0) return { authorized: true, rows: [] };

    const messages = await this.prisma.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId: input.workspace_id,
        childCareProcessId: { in: [...processIds] },
        messageKind: { in: ["family_message", "caregiver_reply"] },
        writerContract: { in: [...G2_WRITERS] },
        ...(beforeFilter(input.before) as Prisma.NurtureFamilyCareMessageWhereInput),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.take,
    });
    if (messages.length === 0) return { authorized: true, rows: [] };

    const sourceMessageIds = messages
      .filter((message) => message.messageKind === "family_message")
      .map((message) => message.id);
    const replyItemIds = messages
      .filter((message) => message.messageKind === "caregiver_reply" && message.sourceItemId)
      .map((message) => message.sourceItemId!) as string[];
    const items = await this.prisma.nurtureFamilyCareItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        OR: [
          ...(sourceMessageIds.length > 0 ? [{ sourceMessageId: { in: sourceMessageIds } }] : []),
          ...(replyItemIds.length > 0 ? [{ id: { in: replyItemIds } }] : []),
        ],
      },
    });
    const itemBySource = new Map(items.filter((item) => item.sourceMessageId).map((item) => [item.sourceMessageId!, item]));
    const itemById = new Map(items.map((item) => [item.id, item]));
    const continuationIds = [
      ...new Set(items.map((item) => item.contextContinuationOfItemId).filter(Boolean)),
    ] as string[];
    const continuationReadable = new Set(
      (
        await this.prisma.nurtureFamilyCareItem.findMany({
          where: { workspaceId: input.workspace_id, id: { in: continuationIds } },
        })
      )
        .filter((item) => processIds.has(item.childCareProcessId))
        .map((item) => item.id),
    );
    const receipts = await this.prisma.nurtureChildLinkReceipt.findMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_message",
        sourceId: { in: messages.map((message) => message.id) },
      },
    });
    const receiptBySource = new Map(receipts.map((receipt) => [receipt.sourceId, receipt]));
    const labels = await enrollmentLabels(
      this.prisma,
      input.workspace_id,
      [...new Set(items.map((item) => item.enrollmentId).filter(Boolean))] as string[],
    );

    const rows: RawTimelineMessageRow[] = [];
    for (const message of messages) {
      const item =
        message.messageKind === "family_message"
          ? itemBySource.get(message.id)
          : message.sourceItemId
            ? itemById.get(message.sourceItemId)
            : undefined;
      if (!item?.enrollmentId) continue;
      const receipt = receiptBySource.get(message.id);
      rows.push({
        message_id: message.id,
        item_id: item.id,
        enrollment_id: item.enrollmentId,
        message_kind: message.messageKind as "family_message" | "caregiver_reply",
        redacted: message.status === "redacted",
        occurred_at: message.createdAt.toISOString(),
        ...(message.status === "redacted" ? {} : { body_envelope: message.bodyProtectionPayload }),
        source_label: labels.get(item.enrollmentId) ?? "Care group",
        acknowledgement_state: item.acknowledgementState,
        response_state: item.responseState,
        lifecycle_state: item.lifecycleState,
        ...(receipt
          ? {
              receipt: {
                receipt_id: receipt.id,
                direction: receipt.direction,
                logical_status: receipt.status,
                occurred_at: (receipt.deliveredAt ?? receipt.createdAt).toISOString(),
              },
            }
          : {}),
        ...(item.contextContinuationOfItemId
          ? {
              continuation_source_item_id: item.contextContinuationOfItemId,
              continuation_source_readable: continuationReadable.has(
                item.contextContinuationOfItemId,
              ),
            }
          : {}),
      });
    }
    return { authorized: true, rows };
  }

  async listCaregiverWork(input: {
    workspace_id: string;
    participant_id: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{ authorized: boolean; rows: RawWorkItemRow[] }> {
    const groupIds = await currentCaregiverGroupIds(
      this.prisma,
      input.workspace_id,
      input.participant_id,
    );
    if (!groupIds) return { authorized: false, rows: [] };
    if (groupIds.size === 0) return { authorized: true, rows: [] };

    const items = await this.prisma.nurtureFamilyCareItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: { in: [...groupIds] },
        writerContract: { in: [...G2_WRITERS] },
        ...(beforeFilter(input.before) as Prisma.NurtureFamilyCareItemWhereInput),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.take,
      include: { childCareProcess: { include: { child: true } } },
    });
    if (items.length === 0) return { authorized: true, rows: [] };
    const attentions = await this.prisma.nurtureTeacherAttentionItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_item",
        sourceId: { in: items.map((item) => item.id) },
      },
    });
    const attentionBySource = new Map(attentions.map((attention) => [attention.sourceId, attention]));

    return {
      authorized: true,
      rows: items.map((item) => ({
        item_id: item.id,
        child_safe_label: item.childCareProcess.child?.displayName ?? "Child",
        source_safe_summary: item.summary,
        acknowledgement_state: item.acknowledgementState,
        response_state: item.responseState,
        lifecycle_state: item.lifecycleState,
        attention_state: attentionState(attentionBySource.get(item.id)?.status),
        created_at: item.createdAt.toISOString(),
        last_activity_at: item.updatedAt.toISOString(),
      })),
    };
  }

  async loadItemDetail(input: {
    workspace_id: string;
    participant_id: string;
    item_id: string;
  }): Promise<{ authorized: boolean; detail?: RawItemDetail }> {
    const item = await this.prisma.nurtureFamilyCareItem.findFirst({
      where: {
        id: input.item_id,
        workspaceId: input.workspace_id,
        writerContract: { in: [...G2_WRITERS] },
      },
    });
    if (!item?.enrollmentId || !item.sourceMessageId) return { authorized: false };

    const [guardianProcessIds, caregiverGroupIds] = await Promise.all([
      currentGuardianProcessIds(this.prisma, input.workspace_id, input.participant_id),
      currentCaregiverGroupIds(this.prisma, input.workspace_id, input.participant_id),
    ]);
    const isGuardian = Boolean(guardianProcessIds?.has(item.childCareProcessId));
    const isCaregiver = Boolean(caregiverGroupIds?.has(item.careGroupId));
    if (!isGuardian && !isCaregiver) return { authorized: false };
    const projectionRole = isGuardian ? "guardian" : "caregiver";

    const now = new Date();
    const grant = item.grantId
      ? await this.prisma.nurtureChildLinkGrant.findFirst({
          where: { id: item.grantId, workspaceId: input.workspace_id, deletedAt: null },
        })
      : null;
    const grantActive = Boolean(
      grant &&
        grant.status === "active" &&
        !grant.revokedAt &&
        (!grant.effectiveFrom || grant.effectiveFrom <= now) &&
        (!grant.expiresAt || grant.expiresAt > now),
    );

    const [sourceMessage, replies, receipts, attention, labels] = await Promise.all([
      this.prisma.nurtureFamilyCareMessage.findFirst({
        where: { id: item.sourceMessageId, workspaceId: input.workspace_id },
      }),
      this.prisma.nurtureFamilyCareMessage.findMany({
        where: {
          workspaceId: input.workspace_id,
          sourceItemId: item.id,
          messageKind: "caregiver_reply",
          writerContract: { in: [...G2_WRITERS] },
        },
        orderBy: [{ replyOrderKey: "asc" }],
      }),
      this.prisma.nurtureChildLinkReceipt.findMany({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_message",
          childCareProcessId: item.childCareProcessId,
        },
        orderBy: [{ createdAt: "asc" }],
      }),
      this.prisma.nurtureTeacherAttentionItem.findFirst({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_item",
          sourceId: item.id,
        },
      }),
      enrollmentLabels(this.prisma, input.workspace_id, [item.enrollmentId]),
    ]);
    if (!sourceMessage) return { authorized: false };
    const messageIds = new Set([sourceMessage.id, ...replies.map((reply) => reply.id)]);

    return {
      authorized: true,
      detail: {
        projection_role: projectionRole,
        item_id: item.id,
        enrollment_id: item.enrollmentId,
        source_label: labels.get(item.enrollmentId) ?? "Care group",
        direction: "family_to_org",
        acknowledgement_state: item.acknowledgementState,
        response_state: item.responseState,
        lifecycle_state: item.lifecycleState,
        reply_count: replies.length,
        content_readable: projectionRole === "guardian" ? true : grantActive,
        messages: [sourceMessage, ...replies].map((message) => ({
          message_id: message.id,
          message_kind: message.messageKind as "family_message" | "caregiver_reply",
          redacted: message.status === "redacted",
          occurred_at: message.createdAt.toISOString(),
          ...(message.status === "redacted" ? {} : { body_envelope: message.bodyProtectionPayload }),
        })),
        receipts: receipts
          .filter((receipt) => messageIds.has(receipt.sourceId))
          .map((receipt) => ({
            receipt_id: receipt.id,
            direction: receipt.direction,
            logical_status: receipt.status,
            occurred_at: (receipt.deliveredAt ?? receipt.createdAt).toISOString(),
          })),
        ...(attention ? { attention_state: attentionState(attention.status) } : {}),
        ...(item.contextContinuationOfItemId
          ? {
              continuation_source_item_id: item.contextContinuationOfItemId,
              continuation_source_readable: true,
            }
          : {}),
      },
    };
  }
}
