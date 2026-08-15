import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  parseNurtureBindingOwnerRef,
  type NurtureParentContextPresenterTransaction,
  type ParentContextPresenterAuthorityResolverV1,
  type ParentContextPresenterExactAuthorityV1,
  type ParentContextPresenterReadPortV1,
} from "@the-nurture/scenario";

type PrismaReader = PrismaClient | Prisma.TransactionClient;

const DAILY_CARE_PURPOSE = "family_daily_care_update";
const VISIBLE_NOTICE_STATUSES = [
  "delivered",
  "read",
  "acknowledged",
  "revoked_after_delivery",
] as const;

export class PrismaParentContextPresenterAuthorityResolver
  implements ParentContextPresenterAuthorityResolverV1
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly integrityKey: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    assertIntegrityKey(integrityKey);
  }

  async resolve(
    input: Parameters<ParentContextPresenterAuthorityResolverV1["resolve"]>[0],
  ): ReturnType<ParentContextPresenterAuthorityResolverV1["resolve"]> {
    const selection = input.context_selection;
    if (
      selection.workspace_id !== input.workspace_id
      || selection.my_chat_user_id !== input.my_chat_user_id
      || selection.host_request_id !== input.host_request_id
      || selection.context_ref !== input.context_ref
    ) {
      return { status: "stale_context_ref" };
    }
    let childAnchorId: string;
    let familyAnchorId: string;
    try {
      const child = parseNurtureBindingOwnerRef(selection.child_binding.owner_ref);
      const family = parseNurtureBindingOwnerRef(selection.family_binding.owner_ref);
      if (child.subjectType !== "child" || family.subjectType !== "family") {
        return { status: "stale_context_ref" };
      }
      childAnchorId = child.anchorId;
      familyAnchorId = family.anchorId;
    } catch {
      return { status: "stale_context_ref" };
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
          if (participants.length === 0) return { status: "scope_loss" as const };
          if (participants.length !== 1) {
            return { status: "ambiguous_enrollment" as const };
          }
          const participant = participants[0]!;
          const at = this.now();

          const associations = await transaction.nurtureFamilyAnchorAssociation.findMany({
            where: {
              workspaceId: input.workspace_id,
              childAnchorId,
              familyAnchorId,
              status: "active",
              currentKey: "current",
              currentChildAssociationId: { not: null },
              revokedAt: null,
              quarantinedAt: null,
              familyAnchor: {
                status: "associated",
                aggregateVersion: selection.family_binding.owner_version,
                revokedAt: null,
                quarantinedAt: null,
              },
              childAnchor: {
                status: "associated",
                aggregateVersion: selection.child_binding.owner_version,
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
              family: { status: "active", deletedAt: null },
              childCareProcess: { status: "active", deletedAt: null },
            },
            include: {
              family: true,
              childCareProcess: true,
              childAnchor: true,
              familyAnchor: true,
            },
            orderBy: { id: "asc" },
            take: 2,
          });
          if (associations.length !== 1) {
            return { status: "stale_context_ref" as const };
          }
          const association = associations[0]!;
          if (association.childAssociationId !== association.currentChildAssociationId) {
            return { status: "stale_context_ref" as const };
          }

          const currentSelection = await transaction.nurtureParentContextEnrollmentSelection.findUnique({
            where: {
              workspaceId_childCareProcessId: {
                workspaceId: input.workspace_id,
                childCareProcessId: association.childCareProcessId,
              },
            },
            include: {
              enrollment: {
                include: { careGroup: { include: { institution: true } } },
              },
            },
          });
          if (!currentSelection) return { status: "ambiguous_enrollment" as const };
          const enrollment = currentSelection.enrollment;
          if (
            enrollment.status !== "active"
            || enrollment.deletedAt
            || (enrollment.leftAt && enrollment.leftAt <= at)
            || enrollment.childCareProcessId !== association.childCareProcessId
            || enrollment.careGroup.status !== "active"
            || enrollment.careGroup.deletedAt
            || enrollment.careGroup.institution.status !== "active"
            || enrollment.careGroup.institution.deletedAt
          ) {
            return { status: "scope_loss" as const };
          }
          if (enrollment.institutionId !== enrollment.careGroup.institutionId) {
            return { status: "scope_loss" as const };
          }

          const grantScope = {
            workspaceId: input.workspace_id,
            childCareProcessId: association.childCareProcessId,
            enrollmentId: enrollment.id,
            status: "active",
            revokedAt: null,
            deletedAt: null,
            AND: [
              { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] },
              { OR: grantTargetWhere(enrollment) },
            ],
          } satisfies Prisma.NurtureChildLinkGrantWhereInput;
          const grants = await transaction.nurtureChildLinkGrant.findMany({
            where: {
              ...grantScope,
              directions: { has: "org_to_family" },
              dataClasses: { has: "daily_care_log" },
              purposes: { has: DAILY_CARE_PURPOSE },
            },
            orderBy: { id: "asc" },
            take: 2,
          });
          if (grants.length !== 1) {
            const hasCurrentGrant = grants.length > 0 || Boolean(
              await transaction.nurtureChildLinkGrant.findFirst({
                where: grantScope,
                select: { id: true },
              }),
            );
            return hasCurrentGrant
              ? { status: "protected_display_denial" as const }
              : { status: "scope_loss" as const };
          }
          const grant = grants[0]!;

          const threads = await transaction.nurtureFamilyCareThread.findMany({
            where: {
              workspaceId: input.workspace_id,
              childCareProcessId: association.childCareProcessId,
              familyId: association.familyId,
              enrollmentId: enrollment.id,
              careGroupId: enrollment.careGroupId,
              visibilityScope: { in: ["family_private", "enrollment_private"] },
              status: "active",
              deletedAt: null,
            },
            orderBy: { id: "asc" },
            take: 2,
          });
          if (threads.length !== 1) {
            return { status: "protected_display_denial" as const };
          }
          const thread = threads[0]!;
          const memberships = await transaction.nurtureFamilyCareThreadParticipant.findMany({
            where: {
              workspaceId: input.workspace_id,
              threadId: thread.id,
              participantId: participant.id,
              participantKind: "guardian",
              visibilityStatus: "active",
              deletedAt: null,
            },
            orderBy: { id: "asc" },
            take: 2,
          });
          if (memberships.length !== 1) {
            return { status: "protected_display_denial" as const };
          }
          const membership = memberships[0]!;
          const role = await transaction.nurtureCareRoleAssignment.findFirst({
            where: {
              id: membership.roleAssignmentId,
              workspaceId: input.workspace_id,
              participantId: participant.id,
              role: "guardian",
              status: "active",
              deletedAt: null,
              AND: [
                { OR: [{ startsAt: null }, { startsAt: { lte: at } }] },
                { OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
                {
                  OR: [
                    { scopeType: "family", scopeId: association.familyId },
                    {
                      scopeType: "child_care_process",
                      scopeId: association.childCareProcessId,
                    },
                    { scopeType: "enrollment", scopeId: enrollment.id },
                  ],
                },
              ],
            },
          });
          if (!role) return { status: "scope_loss" as const };
          const headSeed = [
            participant.id,
            participant.aggregateVersion,
            role.id,
            role.aggregateVersion,
            association.id,
            association.aggregateVersion,
            association.childAnchor.id,
            association.childAnchor.aggregateVersion,
            association.familyAnchor.id,
            association.familyAnchor.aggregateVersion,
            currentSelection.aggregateVersion,
            enrollment.id,
            enrollment.aggregateVersion,
            enrollment.careGroup.id,
            enrollment.careGroup.aggregateVersion,
            enrollment.careGroup.institution.id,
            enrollment.careGroup.institution.aggregateVersion,
            association.family.id,
            association.family.aggregateVersion,
            association.childCareProcess.id,
            association.childCareProcess.aggregateVersion,
            grant.id,
            grant.aggregateVersion,
            thread.id,
            thread.aggregateVersion,
            membership.id,
            membership.aggregateVersion,
            selection.context_version,
            selection.child_binding.owner_ref,
            selection.child_binding.owner_version,
            selection.family_binding.owner_ref,
            selection.family_binding.owner_version,
          ].join("\0");
          const tag = (purpose: string) =>
            createHmac("sha256", this.integrityKey)
              .update(
                `nurture.parent-context-presenter-${purpose}.v1\0${input.workspace_id}\0${input.my_chat_user_id}\0${input.context_ref}\0${headSeed}`,
                "utf8",
              )
              .digest("hex");
          const scopeVersion = Number.parseInt(
            createHash("sha256").update(headSeed, "utf8").digest("hex").slice(0, 12),
            16,
          );
          return {
            status: "resolved" as const,
            authority: {
              participant_id: participant.id,
              participant_version: participant.aggregateVersion,
              guardian_role_assignment_id: role.id,
              guardian_role_version: role.aggregateVersion,
              association_ref: association.id,
              association_version: association.aggregateVersion,
              child_anchor_ref: association.childAnchor.id,
              child_anchor_version: association.childAnchor.aggregateVersion,
              family_anchor_ref: association.familyAnchor.id,
              family_anchor_version: association.familyAnchor.aggregateVersion,
              parent_context_selection_version: currentSelection.aggregateVersion,
              enrollment_ref: enrollment.id,
              enrollment_version: enrollment.aggregateVersion,
              care_group_ref: enrollment.careGroup.id,
              care_group_version: enrollment.careGroup.aggregateVersion,
              institution_ref: enrollment.careGroup.institution.id,
              institution_version: enrollment.careGroup.institution.aggregateVersion,
              family_ref: association.family.id,
              family_version: association.family.aggregateVersion,
              child_care_process_ref: association.childCareProcess.id,
              child_care_process_version: association.childCareProcess.aggregateVersion,
              grant_ref: grant.id,
              grant_version: grant.aggregateVersion,
              thread_ref: thread.id,
              thread_version: thread.aggregateVersion,
              membership_ref: membership.id,
              membership_version: membership.aggregateVersion,
              resolution_ref: tag("resolution"),
              scope_ref: tag("scope"),
              scope_version: scopeVersion,
              context_ref: input.context_ref,
              resolved_at: at.toISOString(),
              host_context_version: selection.context_version,
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

export class PrismaParentContextPresenterReadRepository
  implements ParentContextPresenterReadPortV1
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly integrityKey: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    assertIntegrityKey(integrityKey);
  }

  listDailyLogs(
    input: Parameters<ParentContextPresenterReadPortV1["listDailyLogs"]>[0],
  ): ReturnType<ParentContextPresenterReadPortV1["listDailyLogs"]> {
    return this.prisma.$transaction(async (transaction) => {
      if (!await parentContextAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        this.now(),
      )) return { status: "scope_changed" };
      const rows = await transaction.nurtureDailyCareLog.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: input.authority.child_care_process_ref,
          enrollmentId: input.authority.enrollment_ref,
          careGroupId: input.authority.care_group_ref,
          grantId: input.authority.grant_ref,
          logDate: localDate(input.local_date),
          status: "shared",
          deletedAt: null,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: input.take,
      });
      return {
        status: "current",
        value: rows.map((row) => ({
          log_id: row.id,
          log_version: row.aggregateVersion,
          local_date: row.logDate.toISOString().slice(0, 10),
          recorded_at: row.updatedAt.toISOString(),
          summary: row.summary,
          meal: row.mealPayload,
          nap: row.napPayload,
          activity: row.activityPayload,
          mood: row.moodPayload,
          health_observation: row.healthObservationPayload,
        })),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  listNotices(
    input: Parameters<ParentContextPresenterReadPortV1["listNotices"]>[0],
  ): ReturnType<ParentContextPresenterReadPortV1["listNotices"]> {
    return this.prisma.$transaction(async (transaction) => {
      if (!await parentContextAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        this.now(),
      )) return { status: "scope_changed" };
      const cursor = input.cursor
        ? decodeCursor(this.integrityKey, input.workspace_id, input.authority, input.cursor)
        : null;
      if (input.cursor && !cursor) return { status: "scope_changed" };
      const rows = await noticeRows(transaction, input, input.page_size + 1, cursor);
      const hasMore = rows.length > input.page_size;
      const selected = rows.slice(0, input.page_size);
      const last = selected.at(-1);
      return {
        status: "current",
        value: {
          notices: selected.map(toNoticeFact),
          has_more: hasMore,
          ...(hasMore && last
            ? {
                next_cursor: encodeCursor(
                  this.integrityKey,
                  input.workspace_id,
                  input.authority,
                  last.createdAt,
                  last.id,
                ),
              }
            : {}),
        },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  listNoticeCandidates(
    input: Parameters<ParentContextPresenterReadPortV1["listNoticeCandidates"]>[0],
  ): ReturnType<ParentContextPresenterReadPortV1["listNoticeCandidates"]> {
    return this.prisma.$transaction(async (transaction) => {
      if (!await parentContextAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        this.now(),
      )) return { status: "scope_changed" };
      const rows = await noticeRows(transaction, input, input.take, null);
      return { status: "current", value: rows.map(toNoticeFact) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  readAttendance(
    input: Parameters<ParentContextPresenterReadPortV1["readAttendance"]>[0],
  ): ReturnType<ParentContextPresenterReadPortV1["readAttendance"]> {
    return this.prisma.$transaction(async (transaction) => {
      if (!await parentContextAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        this.now(),
      )) return { status: "scope_changed" };
      const submission = await transaction.nurtureDailyAttendanceSubmission.findUnique({
        where: {
          workspaceId_careGroupId_localDate: {
            workspaceId: input.workspace_id,
            careGroupId: input.authority.care_group_ref,
            localDate: localDate(input.local_date),
          },
        },
        include: {
          entries: {
            where: {
              workspaceId: input.workspace_id,
              childCareProcessId: input.authority.child_care_process_ref,
            },
            take: 2,
          },
        },
      });
      if (!submission || submission.deletedAt || submission.entries.length !== 1) {
        return {
          status: "current",
          value: { submission_state: "missing", entry_state: "missing" },
        };
      }
      return {
        status: "current",
        value: {
          submission_state: submission.state,
          entry_state: submission.entries[0]!.state,
          observed_at: submission.updatedAt.toISOString(),
        },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }
}

export class PrismaParentContextPresenterTransaction
  implements NurtureParentContextPresenterTransaction
{
  constructor(
    private readonly transaction: Prisma.TransactionClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async loadNoticeConfirmationFacts(
    input: Parameters<NurtureParentContextPresenterTransaction["loadNoticeConfirmationFacts"]>[0],
  ): ReturnType<NurtureParentContextPresenterTransaction["loadNoticeConfirmationFacts"]> {
    if (!await parentContextAuthorityIsCurrent(
      this.transaction,
      input.workspace_id,
      input.authority,
      this.now(),
    )) return { status: "scope_changed" };
    const notice = await this.transaction.nurtureChildLinkReceipt.findFirst({
      where: noticeIdentityWhere(input),
    });
    if (!notice) return { status: "notice_missing" };
    if (notice.version !== input.expected_notice_version) {
      return notice.status === "read" || notice.status === "acknowledged"
        ? {
            status: "already_satisfied",
            notice_version: notice.version,
            confirmed_at: (notice.readAt ?? notice.acknowledgedAt ?? notice.updatedAt).toISOString(),
            output_refs: [receiptRef(notice.id, notice.version)],
          }
        : { status: "notice_changed" };
    }
    if (notice.status === "read" || notice.status === "acknowledged") {
      return {
        status: "already_satisfied",
        notice_version: notice.version,
        confirmed_at: (notice.readAt ?? notice.acknowledgedAt ?? notice.updatedAt).toISOString(),
        output_refs: [receiptRef(notice.id, notice.version)],
      };
    }
    return notice.status === "delivered"
      ? { status: "current", notice_version: notice.version }
      : { status: "notice_changed" };
  }

  async markNoticeRead(
    input: Parameters<NurtureParentContextPresenterTransaction["markNoticeRead"]>[0],
  ): ReturnType<NurtureParentContextPresenterTransaction["markNoticeRead"]> {
    if (!await parentContextAuthorityIsCurrent(
      this.transaction,
      input.workspace_id,
      input.authority,
      this.now(),
    )) return { status: "scope_changed" };
    const confirmedAt = new Date(input.confirmed_at);
    const updated = await this.transaction.nurtureChildLinkReceipt.updateMany({
      where: {
        ...noticeIdentityWhere(input),
        version: input.expected_notice_version,
        status: "delivered",
      },
      data: {
        status: "read",
        readAt: confirmedAt,
        version: { increment: 1 },
      },
    });
    return updated.count === 1
      ? {
          status: "committed",
          notice_ref: receiptRef(input.notice_id, input.expected_notice_version + 1),
          confirmed_at: confirmedAt.toISOString(),
        }
      : { status: "notice_changed" };
  }
}

export async function parentContextAuthorityIsCurrent(
  transaction: PrismaReader,
  workspaceId: string,
  authority: ParentContextPresenterExactAuthorityV1,
  at: Date,
): Promise<boolean> {
  // Prisma interactive transactions use one connection. Keep the authority
  // reread sequential so a driver never interleaves queries on that connection.
  const participant = await transaction.nurtureParticipant.count({
      where: {
        id: authority.participant_id,
        workspaceId,
        aggregateVersion: authority.participant_version,
        status: "active",
        deletedAt: null,
      },
    });
  const role = await transaction.nurtureCareRoleAssignment.count({
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
          {
            OR: [
              { scopeType: "family", scopeId: authority.family_ref },
              {
                scopeType: "child_care_process",
                scopeId: authority.child_care_process_ref,
              },
              { scopeType: "enrollment", scopeId: authority.enrollment_ref },
            ],
          },
        ],
      },
    });
  const association = await transaction.nurtureFamilyAnchorAssociation.findFirst({
      where: {
        id: authority.association_ref,
        workspaceId,
        familyId: authority.family_ref,
        childCareProcessId: authority.child_care_process_ref,
        childAnchorId: authority.child_anchor_ref,
        familyAnchorId: authority.family_anchor_ref,
        aggregateVersion: authority.association_version,
        status: "active",
        currentKey: "current",
        currentChildAssociationId: { not: null },
        revokedAt: null,
        quarantinedAt: null,
        familyAnchor: {
          id: authority.family_anchor_ref,
          aggregateVersion: authority.family_anchor_version,
          status: "associated",
          revokedAt: null,
          quarantinedAt: null,
        },
        childAnchor: {
          id: authority.child_anchor_ref,
          aggregateVersion: authority.child_anchor_version,
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
      select: { childAssociationId: true, currentChildAssociationId: true },
    });
  const selection = await transaction.nurtureParentContextEnrollmentSelection.count({
      where: {
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        enrollmentId: authority.enrollment_ref,
        aggregateVersion: authority.parent_context_selection_version,
      },
    });
  const enrollment = await transaction.nurtureEnrollment.count({
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
    });
  const group = await transaction.nurtureCareGroup.count({
      where: {
        id: authority.care_group_ref,
        workspaceId,
        institutionId: authority.institution_ref,
        aggregateVersion: authority.care_group_version,
        status: "active",
        deletedAt: null,
      },
    });
  const institution = await transaction.nurtureCareInstitution.count({
      where: {
        id: authority.institution_ref,
        workspaceId,
        aggregateVersion: authority.institution_version,
        status: "active",
        deletedAt: null,
      },
    });
  const family = await transaction.nurtureFamily.count({
      where: {
        id: authority.family_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        aggregateVersion: authority.family_version,
        status: "active",
        deletedAt: null,
      },
    });
  const process = await transaction.nurtureChildCareProcess.count({
      where: {
        id: authority.child_care_process_ref,
        workspaceId,
        aggregateVersion: authority.child_care_process_version,
        status: "active",
        deletedAt: null,
      },
    });
  const grant = await transaction.nurtureChildLinkGrant.count({
      where: {
        id: authority.grant_ref,
        workspaceId,
        childCareProcessId: authority.child_care_process_ref,
        enrollmentId: authority.enrollment_ref,
        aggregateVersion: authority.grant_version,
        status: "active",
        revokedAt: null,
        deletedAt: null,
        directions: { has: "org_to_family" },
        dataClasses: { has: "daily_care_log" },
        purposes: { has: DAILY_CARE_PURPOSE },
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] },
          {
            OR: [
              { grantedToScopeType: "care_group", grantedToScopeId: authority.care_group_ref },
              { grantedToScopeType: "enrollment", grantedToScopeId: authority.enrollment_ref },
              { grantedToScopeType: "institution", grantedToScopeId: authority.institution_ref },
            ],
          },
        ],
      },
    });
  const thread = await transaction.nurtureFamilyCareThread.count({
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
    });
  const membership = await transaction.nurtureFamilyCareThreadParticipant.count({
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
    });
  return [
    participant,
    role,
    selection,
    enrollment,
    group,
    institution,
    family,
    process,
    grant,
    thread,
    membership,
  ].every((count) => count === 1)
    && Boolean(association)
    && association!.childAssociationId === association!.currentChildAssociationId;
}

const grantTargetWhere = (enrollment: {
  id: string;
  careGroupId: string;
  institutionId: string;
}) => [
  { grantedToScopeType: "care_group" as const, grantedToScopeId: enrollment.careGroupId },
  { grantedToScopeType: "enrollment" as const, grantedToScopeId: enrollment.id },
  { grantedToScopeType: "institution" as const, grantedToScopeId: enrollment.institutionId },
];

const noticeRows = (
  transaction: Prisma.TransactionClient,
  input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
  },
  take: number,
  cursor: Readonly<{ created_at: Date; notice_id: string }> | null,
) =>
  transaction.nurtureChildLinkReceipt.findMany({
    where: {
      workspaceId: input.workspace_id,
      grantId: input.authority.grant_ref,
      childCareProcessId: input.authority.child_care_process_ref,
      enrollmentId: input.authority.enrollment_ref,
      direction: "org_to_family",
      status: { in: [...VISIBLE_NOTICE_STATUSES] },
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.created_at } },
              { createdAt: cursor.created_at, id: { lt: cursor.notice_id } },
            ],
          }
        : {}),
    },
    include: { grant: { select: { expiresAt: true } } },
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take,
  });

type NoticeRow = Awaited<ReturnType<typeof noticeRows>>[number];

const toNoticeFact = (row: NoticeRow) => ({
  notice_id: row.id,
  notice_version: row.version,
  source_type: row.sourceType,
  data_class: row.dataClass,
  delivery_status: row.status as (typeof VISIBLE_NOTICE_STATUSES)[number],
  published_at: (row.deliveredAt ?? row.createdAt).toISOString(),
  ...(row.grant?.expiresAt ? { expires_at: row.grant.expiresAt.toISOString() } : {}),
});

const noticeIdentityWhere = (input: {
  workspace_id: string;
  authority: ParentContextPresenterExactAuthorityV1;
  notice_id: string;
}) => ({
  id: input.notice_id,
  workspaceId: input.workspace_id,
  grantId: input.authority.grant_ref,
  childCareProcessId: input.authority.child_care_process_ref,
  enrollmentId: input.authority.enrollment_ref,
  direction: "org_to_family" as const,
  status: { in: [...VISIBLE_NOTICE_STATUSES] },
});

const receiptRef = (id: string, version: number) => ({
  schema_version: 1 as const,
  namespace: "nurture",
  object_type: "child_link_receipt",
  object_id: id,
  version,
});

const encodeCursor = (
  integrityKey: string,
  workspaceId: string,
  authority: ParentContextPresenterExactAuthorityV1,
  createdAt: Date,
  noticeId: string,
): string => {
  const payload = Buffer.from(JSON.stringify({
    created_at: createdAt.toISOString(),
    notice_id: noticeId,
    resolution_ref: authority.resolution_ref,
  }), "utf8").toString("base64url");
  const signature = cursorSignature(integrityKey, workspaceId, payload);
  return `${payload}.${signature}`;
};

const decodeCursor = (
  integrityKey: string,
  workspaceId: string,
  authority: ParentContextPresenterExactAuthorityV1,
  value: string,
): Readonly<{ created_at: Date; notice_id: string }> | null => {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = cursorSignature(integrityKey, workspaceId, payload);
  const actualBytes = Buffer.from(signature, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    if (!isRecord(decoded)
      || typeof decoded.created_at !== "string"
      || typeof decoded.notice_id !== "string"
      || decoded.resolution_ref !== authority.resolution_ref) return null;
    const createdAt = new Date(decoded.created_at);
    return Number.isNaN(createdAt.getTime())
      ? null
      : { created_at: createdAt, notice_id: decoded.notice_id };
  } catch {
    return null;
  }
};

const cursorSignature = (
  integrityKey: string,
  workspaceId: string,
  payload: string,
): string =>
  createHmac("sha256", integrityKey)
    .update(`nurture.parent-context-presenter-cursor.v1\0${workspaceId}\0${payload}`, "utf8")
    .digest("hex");

const localDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const assertIntegrityKey = (value: string): void => {
  if (value.length < 32) {
    throw new Error("parent-context presenter integrity key must contain at least 32 characters");
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
