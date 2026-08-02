import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  FamilyCareQueryPage,
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

/**
 * A guardian's reach is NOT uniformly the child-care process: an
 * enrollment-scoped role reaches only that enrollment. Widening it to the
 * whole process would expose every other Institution enrollment of the same
 * child, which the contract forbids. Process- and family-scoped roles do
 * reach the whole process.
 */
export type GuardianReach = {
  processIds: Set<string>;
  enrollmentIds: Set<string>;
};

const reaches = (reach: GuardianReach, row: { childCareProcessId: string; enrollmentId: string | null }): boolean =>
  reach.processIds.has(row.childCareProcessId) ||
  (row.enrollmentId !== null && reach.enrollmentIds.has(row.enrollmentId));

const currentGuardianReach = async (
  prisma: Client,
  workspaceId: string,
  participantId: string,
): Promise<GuardianReach | null> => {
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
  const enrollmentIds = new Set<string>();
  for (const role of roles) {
    if (role.scopeType === "child_care_process") processIds.add(role.scopeId);
    else if (role.scopeType === "family") {
      const family = await prisma.nurtureFamily.findFirst({
        where: { id: role.scopeId, workspaceId, status: "active", deletedAt: null },
      });
      if (family) processIds.add(family.childCareProcessId);
    } else if (role.scopeType === "enrollment") {
      enrollmentIds.add(role.scopeId);
    }
  }
  return { processIds, enrollmentIds };
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

const enrollmentDetails = async (
  prisma: Client,
  workspaceId: string,
  enrollmentIds: string[],
): Promise<
  Map<string, { label: string; institution_id: string; care_group_id: string }>
> => {
  if (enrollmentIds.length === 0) return new Map();
  const enrollments = await prisma.nurtureEnrollment.findMany({
    where: { workspaceId, id: { in: enrollmentIds } },
    include: { institution: true, careGroup: true },
  });
  return new Map(
    enrollments.map((enrollment) => [
      enrollment.id,
      {
        label: `${enrollment.institution.displayName} · ${enrollment.careGroup.name}`,
        institution_id: enrollment.institutionId,
        care_group_id: enrollment.careGroupId,
      },
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
    snapshot_at: string;
    before?: { occurred_at: string; id: string };
  }): Promise<FamilyCareQueryPage<RawTimelineMessageRow>> {
    const reach = await currentGuardianReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
    );
    if (!reach) return { authorized: false, rows: [], has_more: false };
    if (reach.processIds.size === 0 && reach.enrollmentIds.size === 0) {
      return { authorized: true, rows: [], has_more: false };
    }
    const reachFilter = {
      OR: [
        ...(reach.processIds.size > 0
          ? [{ childCareProcessId: { in: [...reach.processIds] } }]
          : []),
        ...(reach.enrollmentIds.size > 0
          ? [{ enrollmentId: { in: [...reach.enrollmentIds] } }]
          : []),
      ],
    };

    // Scan take+1 source records: paging state comes from the scanned window,
    // never from the projected rows, so an unresolvable row can be skipped
    // without shortening the page or ending pagination early.
    const scanned = await this.prisma.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId: input.workspace_id,
        AND: [reachFilter],
        messageKind: {
          in: ["family_message", "caregiver_reply", "caregiver_direct_message"],
        },
        writerContract: { in: [...G2_WRITERS] },
        createdAt: { lte: new Date(input.snapshot_at) },
        ...(beforeFilter(input.before) as Prisma.NurtureFamilyCareMessageWhereInput),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.take + 1,
    });
    const hasMore = scanned.length > input.take;
    const messages = scanned.slice(0, input.take);
    if (messages.length === 0) return { authorized: true, rows: [], has_more: false };
    const tailRecord = messages[messages.length - 1]!;
    const tail = { occurred_at: tailRecord.createdAt.toISOString(), id: tailRecord.id };

    const sourceMessageIds = messages
      .filter((message) => message.messageKind === "family_message")
      .map((message) => message.id);
    const replyItemIds = messages
      .filter((message) => message.messageKind === "caregiver_reply" && message.sourceItemId)
      .map((message) => message.sourceItemId!) as string[];
    const items =
      sourceMessageIds.length > 0 || replyItemIds.length > 0
        ? await this.prisma.nurtureFamilyCareItem.findMany({
            where: {
              workspaceId: input.workspace_id,
              OR: [
                ...(sourceMessageIds.length > 0
                  ? [{ sourceMessageId: { in: sourceMessageIds } }]
                  : []),
                ...(replyItemIds.length > 0 ? [{ id: { in: replyItemIds } }] : []),
              ],
            },
          })
        : [];
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
        .filter((item) => reaches(reach, item))
        .map((item) => item.id),
    );
    const [receipts, directGrants] = await Promise.all([
      this.prisma.nurtureChildLinkReceipt.findMany({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_message",
          sourceId: { in: messages.map((message) => message.id) },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
      this.prisma.nurtureChildLinkGrant.findMany({
        where: {
          workspaceId: input.workspace_id,
          id: {
            in: messages
              .filter((message) => message.messageKind === "caregiver_direct_message")
              .map((message) => message.grantId)
              .filter((id): id is string => Boolean(id)),
          },
        },
      }),
    ]);
    const corrections = await this.prisma.nurtureFamilyCareMessageCorrection.findMany({
      where: {
        workspaceId: input.workspace_id,
        messageId: { in: messages.map((message) => message.id) },
        status: "active",
      },
      orderBy: [{ correctionVersion: "desc" }, { id: "asc" }],
    });
    const latestCorrectionByMessage = new Map<
      string,
      (typeof corrections)[number]
    >();
    for (const correction of corrections) {
      if (!latestCorrectionByMessage.has(correction.messageId)) {
        latestCorrectionByMessage.set(correction.messageId, correction);
      }
    }
    const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
    const directGrantById = new Map(directGrants.map((grant) => [grant.id, grant]));
    const originalReceiptBySource = new Map<string, (typeof receipts)[number]>();
    for (const receipt of receipts) {
      if (
        !receipt.routingAttemptKey.startsWith("g2-correction:") &&
        !originalReceiptBySource.has(receipt.sourceId)
      ) {
        originalReceiptBySource.set(receipt.sourceId, receipt);
      }
    }
    const enrollmentById = await enrollmentDetails(
      this.prisma,
      input.workspace_id,
      [
        ...new Set(
          messages
            .map((message) => message.enrollmentId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
    );

    const rows: RawTimelineMessageRow[] = [];
    const projectionNow = new Date();
    for (const message of messages) {
      const item =
        message.messageKind === "family_message"
          ? itemBySource.get(message.id)
          : message.sourceItemId
            ? itemById.get(message.sourceItemId)
            : undefined;
      const enrollmentId = item?.enrollmentId ?? message.enrollmentId;
      if (!enrollmentId) continue;
      const enrollment = enrollmentById.get(enrollmentId);
      const correction = latestCorrectionByMessage.get(message.id);
      const directGrant = message.grantId
        ? directGrantById.get(message.grantId)
        : undefined;
      const directContentReadable =
        message.messageKind !== "caregiver_direct_message" ||
        Boolean(
          directGrant &&
            enrollment &&
            directGrant.status === "active" &&
            !directGrant.revokedAt &&
            directGrant.deletedAt === null &&
            (!directGrant.effectiveFrom || directGrant.effectiveFrom <= projectionNow) &&
            (!directGrant.expiresAt || directGrant.expiresAt > projectionNow) &&
            directGrant.directions.includes("org_to_family") &&
            directGrant.dataClasses.includes("direct_care_communication") &&
            directGrant.purposes.includes("family_care_workflow") &&
            directGrant.childCareProcessId === message.childCareProcessId &&
            directGrant.enrollmentId === enrollmentId &&
            ((directGrant.grantedToScopeType === "care_group" &&
              directGrant.grantedToScopeId === enrollment.care_group_id) ||
              (directGrant.grantedToScopeType === "enrollment" &&
                directGrant.grantedToScopeId === enrollmentId) ||
              (directGrant.grantedToScopeType === "institution" &&
                directGrant.grantedToScopeId === enrollment.institution_id)),
        );
      // A correction is a new cross-boundary content effect with its own
      // Receipt. Select it by the correction's exact FK; otherwise select the
      // deterministically ordered original delivery receipt. Never collapse
      // multiple semantic receipts through an unordered source-id map.
      const receipt = correction?.receiptId
        ? receiptById.get(correction.receiptId)
        : originalReceiptBySource.get(message.id);
      rows.push({
        message_id: message.id,
        ...(item ? { item_id: item.id } : {}),
        enrollment_id: enrollmentId,
        message_kind: message.messageKind as RawTimelineMessageRow["message_kind"],
        redacted: message.status === "redacted",
        corrected: Boolean(correction),
        content_readable: directContentReadable,
        occurred_at: message.createdAt.toISOString(),
        ...(message.status === "redacted" ? {} : { body_envelope: message.bodyProtectionPayload }),
        ...(message.status !== "redacted" && correction
          ? { correction_body_envelope: correction.bodyProtectionPayload }
          : {}),
        source_label: enrollment?.label ?? "Care group",
        ...(item
          ? {
              acknowledgement_state: item.acknowledgementState,
              response_state: item.responseState,
              lifecycle_state: item.lifecycleState,
              ...(item.lifecycleReason ? { lifecycle_reason: item.lifecycleReason } : {}),
            }
          : {}),
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
        ...(item?.contextContinuationOfItemId
          ? {
              continuation_source_item_id: item.contextContinuationOfItemId,
              continuation_source_readable: continuationReadable.has(
                item.contextContinuationOfItemId,
              ),
            }
          : {}),
      });
    }
    return { authorized: true, rows, has_more: hasMore, tail };
  }

  async listCaregiverWork(input: {
    workspace_id: string;
    participant_id: string;
    take: number;
    snapshot_at: string;
    care_group_id?: string;
    before?: { occurred_at: string; id: string };
  }): Promise<FamilyCareQueryPage<RawWorkItemRow>> {
    const groupIds = await currentCaregiverGroupIds(
      this.prisma,
      input.workspace_id,
      input.participant_id,
    );
    if (!groupIds) return { authorized: false, rows: [], has_more: false };
    if (groupIds.size === 0) return { authorized: true, rows: [], has_more: false };
    // The work list is scoped to one exact CareGroup: a caregiver assigned to
    // several groups must ask per group rather than receive one merged,
    // provenance-free list.
    const careGroupId = input.care_group_id ?? [...groupIds].sort()[0]!;
    if (!groupIds.has(careGroupId)) {
      return { authorized: false, rows: [], has_more: false };
    }

    const scanned = await this.prisma.nurtureFamilyCareItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId,
        writerContract: { in: [...G2_WRITERS] },
        createdAt: { lte: new Date(input.snapshot_at) },
        ...(beforeFilter(input.before) as Prisma.NurtureFamilyCareItemWhereInput),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.take + 1,
      include: { childCareProcess: { include: { child: true } } },
    });
    const hasMore = scanned.length > input.take;
    const items = scanned.slice(0, input.take);
    if (items.length === 0) return { authorized: true, rows: [], has_more: false };
    const tailRecord = items[items.length - 1]!;
    const tail = { occurred_at: tailRecord.createdAt.toISOString(), id: tailRecord.id };
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
      has_more: hasMore,
      tail,
      care_group_id: careGroupId,
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

    const [guardianReach, caregiverGroupIds] = await Promise.all([
      currentGuardianReach(this.prisma, input.workspace_id, input.participant_id),
      currentCaregiverGroupIds(this.prisma, input.workspace_id, input.participant_id),
    ]);
    const isGuardian = Boolean(guardianReach && reaches(guardianReach, item));
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

    const [sourceMessage, replies, receipts, attention, enrollmentById] = await Promise.all([
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
      enrollmentDetails(this.prisma, input.workspace_id, [item.enrollmentId]),
    ]);
    if (!sourceMessage) return { authorized: false };
    const messageIds = new Set([sourceMessage.id, ...replies.map((reply) => reply.id)]);
    const corrections = await this.prisma.nurtureFamilyCareMessageCorrection.findMany({
      where: {
        workspaceId: input.workspace_id,
        messageId: { in: [...messageIds] },
        status: "active",
      },
      orderBy: [{ correctionVersion: "desc" }, { id: "asc" }],
    });
    const latestCorrectionByMessage = new Map<
      string,
      (typeof corrections)[number]
    >();
    for (const correction of corrections) {
      if (!latestCorrectionByMessage.has(correction.messageId)) {
        latestCorrectionByMessage.set(correction.messageId, correction);
      }
    }

    let continuationReadable = false;
    if (item.contextContinuationOfItemId) {
      const source = await this.prisma.nurtureFamilyCareItem.findFirst({
        where: {
          id: item.contextContinuationOfItemId,
          workspaceId: input.workspace_id,
          lifecycleState: "active",
        },
      });
      continuationReadable = Boolean(
        source &&
          (projectionRole === "guardian"
            ? guardianReach && reaches(guardianReach, source)
            : caregiverGroupIds?.has(source.careGroupId)),
      );
    }

    return {
      authorized: true,
      detail: {
        projection_role: projectionRole,
        item_id: item.id,
        enrollment_id: item.enrollmentId,
        source_label: enrollmentById.get(item.enrollmentId)?.label ?? "Care group",
        direction: "family_to_org",
        acknowledgement_state: item.acknowledgementState,
        response_state: item.responseState,
        lifecycle_state: item.lifecycleState,
        ...(item.lifecycleReason ? { lifecycle_reason: item.lifecycleReason } : {}),
        reply_count: replies.length,
        content_readable: projectionRole === "guardian" ? true : grantActive,
        messages: [sourceMessage, ...replies].map((message) => {
          const correction = latestCorrectionByMessage.get(message.id);
          return {
            message_id: message.id,
            message_kind: message.messageKind as "family_message" | "caregiver_reply",
            redacted: message.status === "redacted",
            corrected: Boolean(correction),
            exact_author: message.senderParticipantId === input.participant_id,
            correction_allowed:
              message.status === "sent" &&
              item.lifecycleState === "active" &&
              (message.messageKind !== "family_message" ||
                item.responseState === "awaiting_reply"),
            occurred_at: message.createdAt.toISOString(),
            ...(message.status === "redacted"
              ? {}
              : { body_envelope: message.bodyProtectionPayload }),
            ...(message.status !== "redacted" && correction
              ? { correction_body_envelope: correction.bodyProtectionPayload }
              : {}),
          };
        }),
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
              // A source the caller can no longer read must not surface even
              // as a relation; readability is recomputed, never assumed.
              continuation_source_readable: continuationReadable,
            }
          : {}),
      },
    };
  }
}
