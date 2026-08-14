import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  ParentCommunicationAuthorityResolverV1,
  ParentCommunicationContextSelectionPortV1,
  ParentCommunicationOwnerReadPortV1,
  ParentCommunicationReadSnapshotV1,
  ParentCommunicationResolvedAuthorityV1,
} from "@the-nurture/scenario";
import { FAMILY_CARE_PURPOSE } from "@the-nurture/scenario";

type PrismaReader = PrismaClient | Prisma.TransactionClient;

export class PrismaParentCommunicationAuthorityResolver
implements ParentCommunicationAuthorityResolverV1 {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly contextSelection: ParentCommunicationContextSelectionPortV1,
    private readonly integrityKey: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    assertIntegrityKey(integrityKey);
  }

  async resolve(
    input: Parameters<ParentCommunicationAuthorityResolverV1["resolve"]>[0],
  ): ReturnType<ParentCommunicationAuthorityResolverV1["resolve"]> {
    let selected;
    try {
      selected = await this.contextSelection.resolveCurrent(input);
    } catch {
      return { status: "temporarily_unavailable" };
    }
    if (selected.status !== "resolved") {
      return selected.status === "temporarily_unavailable"
        ? { status: "temporarily_unavailable" }
        : { status: selected.status };
    }
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const participants = await transaction.nurtureParticipant.findMany({
            where: {
              workspaceId: input.workspace_id,
              myChatUserId: input.my_chat_user_id,
              status: "active",
              deletedAt: null,
            },
            orderBy: { id: "asc" },
            take: 2,
          });
          if (participants.length !== 1) {
            return { status: "ambiguous_enrollment" as const };
          }
          const participant = participants[0]!;
          const at = this.now();
          const enrollment = await transaction.nurtureEnrollment.findFirst({
            where: {
              id: selected.enrollment_ref,
              workspaceId: input.workspace_id,
              status: "active",
              deletedAt: null,
              OR: [{ leftAt: null }, { leftAt: { gt: at } }],
            },
            include: {
              childCareProcess: true,
              careGroup: { include: { institution: true } },
            },
          });
          if (!enrollment
            || enrollment.childCareProcess.status !== "active"
            || enrollment.childCareProcess.deletedAt
            || enrollment.careGroup.status !== "active"
            || enrollment.careGroup.deletedAt
            || enrollment.careGroup.institution.status !== "active"
            || enrollment.careGroup.institution.deletedAt
            || enrollment.institutionId !== enrollment.careGroup.institutionId) {
            return { status: "scope_loss" as const };
          }
          const primaryFamilyId = enrollment.childCareProcess.primaryFamilyId;
          if (!primaryFamilyId) return { status: "scope_loss" as const };
          const [family, associations, roles, threads, grants] = await Promise.all([
            transaction.nurtureFamily.findFirst({
              where: {
                id: primaryFamilyId,
                workspaceId: input.workspace_id,
                childCareProcessId: enrollment.childCareProcessId,
                status: "active",
                deletedAt: null,
              },
            }),
            transaction.nurtureFamilyAnchorAssociation.findMany({
              where: {
                workspaceId: input.workspace_id,
                childCareProcessId: enrollment.childCareProcessId,
                familyId: primaryFamilyId,
                status: "active",
                currentKey: "current",
                currentChildAssociationId: { not: null },
                revokedAt: null,
                quarantinedAt: null,
                familyAnchor: {
                  status: "associated",
                  revokedAt: null,
                  quarantinedAt: null,
                },
                childAnchor: {
                  status: "associated",
                  revokedAt: null,
                  quarantinedAt: null,
                },
                childAssociation: {
                  status: "active",
                  currentKey: "current",
                  revokedAt: null,
                  quarantinedAt: null,
                },
                currentChildAssociation: {
                  is: {
                    status: "active",
                    currentKey: "current",
                    revokedAt: null,
                    quarantinedAt: null,
                  },
                },
              },
              take: 2,
              orderBy: { id: "asc" },
            }),
            transaction.nurtureCareRoleAssignment.findMany({
              where: {
                workspaceId: input.workspace_id,
                participantId: participant.id,
                role: "guardian",
                status: "active",
                deletedAt: null,
                AND: [
                  { OR: [{ startsAt: null }, { startsAt: { lte: at } }] },
                  { OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
                  { OR: [
                    { scopeType: "family", scopeId: primaryFamilyId },
                    { scopeType: "child_care_process", scopeId: enrollment.childCareProcessId },
                    { scopeType: "enrollment", scopeId: enrollment.id },
                  ] },
                ],
              },
              take: 2,
              orderBy: { id: "asc" },
            }),
            transaction.nurtureFamilyCareThread.findMany({
              where: {
                workspaceId: input.workspace_id,
                childCareProcessId: enrollment.childCareProcessId,
                familyId: primaryFamilyId,
                enrollmentId: enrollment.id,
                careGroupId: enrollment.careGroupId,
                visibilityScope: { in: ["family_private", "enrollment_private"] },
                status: "active",
                deletedAt: null,
              },
              take: 2,
              orderBy: { id: "asc" },
            }),
            transaction.nurtureChildLinkGrant.findMany({
              where: {
                workspaceId: input.workspace_id,
                childCareProcessId: enrollment.childCareProcessId,
                enrollmentId: enrollment.id,
                status: "active",
                revokedAt: null,
                deletedAt: null,
                directions: { hasEvery: ["family_to_org", "org_to_family"] },
                dataClasses: { has: "family_care_question" },
                purposes: { has: FAMILY_CARE_PURPOSE },
                AND: [
                  { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
                  { OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] },
                  { OR: [
                    { grantedToScopeType: "care_group", grantedToScopeId: enrollment.careGroupId },
                    { grantedToScopeType: "enrollment", grantedToScopeId: enrollment.id },
                    { grantedToScopeType: "institution", grantedToScopeId: enrollment.institutionId },
                  ] },
                ],
              },
              take: 2,
              orderBy: { id: "asc" },
            }),
          ]);
          if (!family
            || associations.length !== 1
            || roles.length !== 1
            || threads.length !== 1
            || grants.length !== 1) {
            return { status: "scope_loss" as const };
          }
          const association = associations[0]!;
          if (association.childAssociationId !== association.currentChildAssociationId) {
            return { status: "scope_loss" as const };
          }
          const role = roles[0]!;
          const thread = threads[0]!;
          const grant = grants[0]!;
          const memberships = await transaction.nurtureFamilyCareThreadParticipant.findMany({
            where: {
              workspaceId: input.workspace_id,
              threadId: thread.id,
              participantId: participant.id,
              roleAssignmentId: role.id,
              participantKind: "guardian",
              visibilityStatus: "active",
              deletedAt: null,
            },
            take: 2,
            orderBy: { id: "asc" },
          });
          if (memberships.length !== 1) return { status: "protected_display_denial" as const };
          const membership = memberships[0]!;
          const headSeed = [
            participant.id, participant.aggregateVersion,
            role.id, role.aggregateVersion,
            association.id, association.aggregateVersion,
            enrollment.id, enrollment.aggregateVersion,
            enrollment.careGroup.id, enrollment.careGroup.aggregateVersion,
            enrollment.careGroup.institution.id, enrollment.careGroup.institution.aggregateVersion,
            family.id, family.aggregateVersion,
            enrollment.childCareProcess.id, enrollment.childCareProcess.aggregateVersion,
            thread.id, thread.aggregateVersion,
            membership.id, membership.aggregateVersion,
            grant.id, grant.aggregateVersion,
            selected.context_version,
          ].join("\0");
          const scopeVersion = Number.parseInt(
            createHash("sha256").update(headSeed, "utf8").digest("hex").slice(0, 12),
            16,
          );
          const tag = (purpose: string) => createHmac("sha256", this.integrityKey)
            .update(`nurture.parent-communication-${purpose}.v1\0${input.workspace_id}\0${input.my_chat_user_id}\0${input.context_ref}\0${headSeed}`, "utf8")
            .digest("hex");
          return {
            status: "resolved" as const,
            authority: {
              participant_id: participant.id,
              participant_version: participant.aggregateVersion,
              guardian_role_assignment_id: role.id,
              guardian_role_version: role.aggregateVersion,
              association_ref: association.id,
              association_version: association.aggregateVersion,
              enrollment_ref: enrollment.id,
              enrollment_version: enrollment.aggregateVersion,
              care_group_ref: enrollment.careGroup.id,
              care_group_version: enrollment.careGroup.aggregateVersion,
              institution_ref: enrollment.careGroup.institution.id,
              institution_version: enrollment.careGroup.institution.aggregateVersion,
              family_ref: family.id,
              family_version: family.aggregateVersion,
              child_care_process_ref: enrollment.childCareProcess.id,
              child_care_process_version: enrollment.childCareProcess.aggregateVersion,
              thread_ref: thread.id,
              thread_version: thread.aggregateVersion,
              membership_ref: membership.id,
              membership_version: membership.aggregateVersion,
              grant_ref: grant.id,
              grant_version: grant.aggregateVersion,
              context_version: selected.context_version,
              resolution_ref: tag("resolution"),
              scope_ref: tag("scope"),
              scope_version: scopeVersion,
              context_ref: input.context_ref,
            },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );
    } catch {
      return { status: "temporarily_unavailable" };
    }
  }
}

export class PrismaParentCommunicationOwnerReadRepository
implements ParentCommunicationOwnerReadPortV1 {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly integrityKey: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    assertIntegrityKey(integrityKey);
  }

  read(
    input: Parameters<ParentCommunicationOwnerReadPortV1["read"]>[0],
  ): Promise<ParentCommunicationReadSnapshotV1 | Readonly<{ status: "scope_changed" }>> {
    return this.prisma.$transaction(
      async (transaction) => this.readTransaction(transaction, input),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async readTransaction(
    transaction: Prisma.TransactionClient,
    input: Parameters<ParentCommunicationOwnerReadPortV1["read"]>[0],
  ): Promise<ParentCommunicationReadSnapshotV1 | Readonly<{ status: "scope_changed" }>> {
    const readAt = this.now();
    if (!await exactAuthorityIsCurrent(transaction, input.workspace_id, input.authority, readAt)) {
      return { status: "scope_changed" };
    }
    const authority = input.authority;
    const membership = await transaction.nurtureFamilyCareThreadParticipant.findFirstOrThrow({
      where: { id: authority.membership_ref, workspaceId: input.workspace_id },
    });
    const unreadCount = await transaction.nurtureFamilyCareMessage.count({
      where: {
        workspaceId: input.workspace_id,
        threadId: authority.thread_ref,
        status: "sent",
        direction: "org_to_family",
        ...(membership.lastReadAt ? { createdAt: { gt: membership.lastReadAt } } : {}),
      },
    });
    const memberRows = await transaction.nurtureFamilyCareThreadParticipant.findMany({
      where: {
        workspaceId: input.workspace_id,
        threadId: authority.thread_ref,
        participantKind: "caregiver",
        visibilityStatus: "active",
        deletedAt: null,
        participant: { status: "active", deletedAt: null },
        roleAssignment: {
          role: { in: ["caregiver", "lead_caregiver"] },
          status: "active",
          deletedAt: null,
          scopeType: "care_group",
          scopeId: authority.care_group_ref,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: readAt } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: readAt } }] },
          ],
        },
      },
      include: { participant: true, roleAssignment: true },
      orderBy: { id: "asc" },
      take: 20,
    });
    const cursor = input.cursor
      ? decodeCursor(this.integrityKey, input.workspace_id, authority, input.cursor)
      : null;
    if (input.cursor && !cursor) return { status: "scope_changed" };
    const messageRows = input.include_detail
      ? await transaction.nurtureFamilyCareMessage.findMany({
          where: {
            workspaceId: input.workspace_id,
            threadId: authority.thread_ref,
            status: "sent",
            writerContract: { in: ["legacy_migrated_v1", "harness_g2_v1"] },
            bodyStorageMode: "encrypted",
            bodyProtectionPayload: { not: Prisma.JsonNull },
            ...(cursor ? {
              OR: [
                { createdAt: { lt: cursor.created_at } },
                { createdAt: cursor.created_at, id: { lt: cursor.message_id } },
              ],
            } : {}),
          },
          include: { senderParticipant: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: input.page_size + 1,
        })
      : [];
    const hasMore = messageRows.length > input.page_size;
    const selectedMessages = messageRows.slice(0, input.page_size);
    const receipts = selectedMessages.length
      ? await transaction.nurtureChildLinkReceipt.findMany({
          where: {
            workspaceId: input.workspace_id,
            sourceType: "family_care_message",
            sourceId: { in: selectedMessages.map((message) => message.id) },
          },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        })
      : [];
    const receiptByMessage = new Map<string, (typeof receipts)[number]>();
    for (const receipt of receipts) {
      if (!receiptByMessage.has(receipt.sourceId)) {
        receiptByMessage.set(receipt.sourceId, receipt);
      }
    }
    const presentationHead = createHash("sha256").update(JSON.stringify({
      thread: authority.thread_version,
      membership: authority.membership_version,
      unread: unreadCount,
      members: memberRows.map((row) => [
        row.id,
        row.aggregateVersion,
        row.participant.aggregateVersion,
        row.roleAssignment.aggregateVersion,
      ]),
    }), "utf8").digest("hex");
    const last = selectedMessages.at(-1);
    return {
      status: "current",
      refreshed_at: readAt.toISOString(),
      unread_count: unreadCount,
      presentation_head: presentationHead,
      members: (input.include_detail ? memberRows : []).map((row) => ({
        participant_id: row.participant.id,
        display_name: row.participant.displayName ?? row.roleAssignment.displayLabel ?? "教师",
        role_display: row.roleAssignment.displayLabel
          ?? (row.roleAssignment.role === "lead_caregiver" ? "主带班老师" : "带班老师"),
        aggregate_version: row.aggregateVersion,
      })),
      messages: selectedMessages.reverse().map((row) => ({
        message_id: row.id,
        sender_participant_id: row.senderParticipantId,
        sender_kind: row.direction === "family_to_org" ? "parent" as const : "teacher" as const,
        sender_display: row.senderParticipant.displayName
          ?? (row.direction === "family_to_org" ? "家长" : "教师"),
        sent_at: row.createdAt.toISOString(),
        delivery_state: deliveryState(receiptByMessage.get(row.id)?.status),
        body_envelope: row.bodyProtectionPayload,
      })),
      has_more: hasMore,
      ...(hasMore && last
        ? { next_cursor: encodeCursor(this.integrityKey, input.workspace_id, authority, last.createdAt, last.id) }
        : {}),
    };
  }
}

async function exactAuthorityIsCurrent(
  transaction: PrismaReader,
  workspaceId: string,
  authority: ParentCommunicationResolvedAuthorityV1,
  at: Date,
): Promise<boolean> {
  const [
    participant,
    role,
    association,
    enrollment,
    group,
    institution,
    family,
    process,
    thread,
    membership,
    grant,
  ] = await Promise.all([
    transaction.nurtureParticipant.count({
      where: {
        id: authority.participant_id,
        workspaceId,
        aggregateVersion: authority.participant_version,
        status: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureCareRoleAssignment.count({
      where: {
        id: authority.guardian_role_assignment_id,
        workspaceId,
        participantId: authority.participant_id,
        aggregateVersion: authority.guardian_role_version,
        role: "guardian",
        status: "active",
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: at } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
          { OR: [
            { scopeType: "family", scopeId: authority.family_ref },
            { scopeType: "child_care_process", scopeId: authority.child_care_process_ref },
            { scopeType: "enrollment", scopeId: authority.enrollment_ref },
          ] },
        ],
      },
    }),
    transaction.nurtureFamilyAnchorAssociation.findFirst({
      where: {
        id: authority.association_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        familyId: authority.family_ref,
        aggregateVersion: authority.association_version,
        status: "active",
        currentKey: "current",
        currentChildAssociationId: { not: null },
        revokedAt: null,
        quarantinedAt: null,
        familyAnchor: { status: "associated", revokedAt: null, quarantinedAt: null },
        childAnchor: { status: "associated", revokedAt: null, quarantinedAt: null },
        childAssociation: {
          status: "active",
          currentKey: "current",
          revokedAt: null,
          quarantinedAt: null,
        },
        currentChildAssociation: {
          is: {
            status: "active",
            currentKey: "current",
            revokedAt: null,
            quarantinedAt: null,
          },
        },
      },
      select: { childAssociationId: true, currentChildAssociationId: true },
    }),
    transaction.nurtureEnrollment.count({
      where: {
        id: authority.enrollment_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        careGroupId: authority.care_group_ref,
        institutionId: authority.institution_ref,
        aggregateVersion: authority.enrollment_version,
        status: "active",
        deletedAt: null,
        OR: [{ leftAt: null }, { leftAt: { gt: at } }],
      },
    }),
    transaction.nurtureCareGroup.count({
      where: {
        id: authority.care_group_ref,
        workspaceId,
        institutionId: authority.institution_ref,
        aggregateVersion: authority.care_group_version,
        status: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureCareInstitution.count({
      where: {
        id: authority.institution_ref,
        workspaceId,
        aggregateVersion: authority.institution_version,
        status: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureFamily.count({
      where: {
        id: authority.family_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        aggregateVersion: authority.family_version,
        status: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureChildCareProcess.count({
      where: {
        id: authority.child_care_process_ref,
        workspaceId,
        primaryFamilyId: authority.family_ref,
        aggregateVersion: authority.child_care_process_version,
        status: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureFamilyCareThread.count({
      where: {
        id: authority.thread_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        familyId: authority.family_ref,
        enrollmentId: authority.enrollment_ref,
        careGroupId: authority.care_group_ref,
        aggregateVersion: authority.thread_version,
        visibilityScope: { in: ["family_private", "enrollment_private"] },
        status: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureFamilyCareThreadParticipant.count({
      where: {
        id: authority.membership_ref,
        workspaceId,
        threadId: authority.thread_ref,
        participantId: authority.participant_id,
        roleAssignmentId: authority.guardian_role_assignment_id,
        aggregateVersion: authority.membership_version,
        participantKind: "guardian",
        visibilityStatus: "active",
        deletedAt: null,
      },
    }),
    transaction.nurtureChildLinkGrant.count({
      where: {
        id: authority.grant_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        enrollmentId: authority.enrollment_ref,
        aggregateVersion: authority.grant_version,
        status: "active",
        revokedAt: null,
        deletedAt: null,
        directions: { hasEvery: ["family_to_org", "org_to_family"] },
        dataClasses: { has: "family_care_question" },
        purposes: { has: FAMILY_CARE_PURPOSE },
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] },
          { OR: [
            { grantedToScopeType: "care_group", grantedToScopeId: authority.care_group_ref },
            { grantedToScopeType: "enrollment", grantedToScopeId: authority.enrollment_ref },
            { grantedToScopeType: "institution", grantedToScopeId: authority.institution_ref },
          ] },
        ],
      },
    }),
  ]);
  return participant === 1
    && role === 1
    && association !== null
    && association.childAssociationId === association.currentChildAssociationId
    && enrollment === 1
    && group === 1
    && institution === 1
    && family === 1
    && process === 1
    && thread === 1
    && membership === 1
    && grant === 1;
}

const deliveryState = (status?: string): "sent" | "delivered" | "read" | "not_applicable" => {
  if (status === "read" || status === "acknowledged") return "read";
  if (status === "delivered") return "delivered";
  if (status === "failed" || status === "blocked" || status === "revoked_after_delivery") {
    return "not_applicable";
  }
  return "sent";
};

const cursorKey = (integrityKey: string): Buffer =>
  createHash("sha256").update(`nurture.parent-communication-cursor.v1\0${integrityKey}`, "utf8").digest();

const encodeCursor = (
  integrityKey: string,
  workspaceId: string,
  authority: ParentCommunicationResolvedAuthorityV1,
  createdAt: Date,
  messageId: string,
): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cursorKey(integrityKey), iv);
  cipher.setAAD(Buffer.from(`${workspaceId}\0${authority.participant_id}\0${authority.thread_ref}`, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify({ created_at: createdAt.toISOString(), message_id: messageId }), "utf8"),
    cipher.final(),
  ]);
  return `1.${Buffer.concat([iv, ciphertext, cipher.getAuthTag()]).toString("base64url")}`;
};

const decodeCursor = (
  integrityKey: string,
  workspaceId: string,
  authority: ParentCommunicationResolvedAuthorityV1,
  cursor: string,
): { created_at: Date; message_id: string } | null => {
  if (!cursor.startsWith("1.")) return null;
  try {
    const value = Buffer.from(cursor.slice(2), "base64url");
    if (value.length <= 28) return null;
    const decipher = createDecipheriv("aes-256-gcm", cursorKey(integrityKey), value.subarray(0, 12));
    decipher.setAAD(Buffer.from(`${workspaceId}\0${authority.participant_id}\0${authority.thread_ref}`, "utf8"));
    decipher.setAuthTag(value.subarray(value.length - 16));
    const parsed = JSON.parse(Buffer.concat([
      decipher.update(value.subarray(12, value.length - 16)),
      decipher.final(),
    ]).toString("utf8")) as unknown;
    if (!isRecord(parsed) || typeof parsed.created_at !== "string" || typeof parsed.message_id !== "string") return null;
    const createdAt = new Date(parsed.created_at);
    return Number.isNaN(createdAt.getTime()) || !parsed.message_id
      ? null
      : { created_at: createdAt, message_id: parsed.message_id };
  } catch {
    return null;
  }
};

const assertIntegrityKey = (value: string): void => {
  if (value.length < 32) throw new Error("parent communication integrity key must contain at least 32 characters");
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
