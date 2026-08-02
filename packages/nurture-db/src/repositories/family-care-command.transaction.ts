import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { FAMILY_CARE_PURPOSE } from "@the-nurture/scenario/harness";
import type {
  FamilyCareCancelRouteFacts,
  FamilyCareCancelRoutePayload,
  FamilyCareCurrentGrant,
  FamilyCareGrantRevokeFacts,
  FamilyCareGrantRevokePayload,
  FamilyCareItemActionFacts,
  FamilyCareItemActionPayload,
  FamilyCareRedactionFacts,
  FamilyCareRedactionPayload,
  FamilyCareReplyApplied,
  FamilyCareReplyPayload,
  FamilyCareTransactionInput,
  FamilyInputRouteApplied,
  FamilyInputRouteFacts,
  FamilyInputRoutePayload,
  G2AcknowledgeApplied,
  G2AcknowledgeApplyInput,
  G2CorrectMessageApplied,
  G2CorrectMessageApplyInput,
  G2DirectMessageApplied,
  G2DirectMessageApplyInput,
  G2DirectMessageFacts,
  G2DirectMessagePayload,
  G2ItemActionFacts,
  G2ItemActionPayload,
  G2MessageChangeFacts,
  G2MessageChangePayload,
  G2RedactMessageApplied,
  G2RedactMessageApplyInput,
  G2RedactionFinalization,
  G2ReplyApplied,
  G2ReplyApplyInput,
  G2SubmitApplied,
  G2SubmitApplyInput,
  G2SubmitCommandPayload,
  G2SubmitFacts,
  G2WithdrawalApplied,
  G2WithdrawalApplyInput,
  G2WithdrawalFacts,
  G2WithdrawalPayload,
  NurtureFamilyCareCommandTransaction,
} from "@the-nurture/scenario/harness";
import type { CanonicalRef } from "@my-chat/workflow-contracts";

type DomainContextRef = CanonicalRef;

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const domainRef = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

// Cascades must reach closure inside the command transaction or fail as a
// whole (10-g2-schema-freeze.md D5): a fixed page cap that silently commits a
// partial cascade is an atomicity failure, not a bounded cost. Each page
// updates the rows out of its own filter, so re-querying converges.
const CASCADE_PAGE_SIZE = 100;
// Legacy grant-revoke paths retain a high explicit safety bound, but reaching
// it throws and rolls back the whole transaction; it can never commit a
// partial cascade. G2-B redaction loops directly to closure without this cap.
const CASCADE_MAX_PAGES = 100;

const roleCurrent = (row: {
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
} | null, now: Date): boolean =>
  Boolean(
    row &&
      row.status === "active" &&
      (!row.startsAt || row.startsAt <= now) &&
      (!row.endsAt || row.endsAt > now),
  );

export class PrismaFamilyCareCommandTransaction implements NurtureFamilyCareCommandTransaction {
  constructor(private readonly transaction: Prisma.TransactionClient | PrismaClient) {}

  private async currentGrant(input: {
    workspace_id: string;
    child_care_process_id: string;
    enrollment_id: string;
    care_group_id: string;
    institution_id: string;
    data_class: FamilyInputRoutePayload["data_class"];
    direction: "family_to_org" | "org_to_family";
  }): Promise<FamilyCareCurrentGrant> {
    const now = new Date();
    const target = {
      OR: [
        { grantedToScopeType: "care_group" as const, grantedToScopeId: input.care_group_id },
        { grantedToScopeType: "institution" as const, grantedToScopeId: input.institution_id },
        { grantedToScopeType: "enrollment" as const, grantedToScopeId: input.enrollment_id },
      ],
    } satisfies Prisma.NurtureChildLinkGrantWhereInput;
    const currentWindow = [
      { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    ] satisfies Prisma.NurtureChildLinkGrantWhereInput[];
    const base = {
      workspaceId: input.workspace_id,
      childCareProcessId: input.child_care_process_id,
      enrollmentId: input.enrollment_id,
      deletedAt: null,
    } satisfies Prisma.NurtureChildLinkGrantWhereInput;
    const [active, revoked, activeMismatch] = await Promise.all([
      this.transaction.nurtureChildLinkGrant.findFirst({
        where: {
          ...base,
          status: "active",
          revokedAt: null,
          directions: { has: input.direction },
          dataClasses: { has: input.data_class },
          AND: [target, ...currentWindow],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
      this.transaction.nurtureChildLinkGrant.findFirst({
        where: {
          ...base,
          directions: { has: input.direction },
          dataClasses: { has: input.data_class },
          AND: [target, { OR: [{ status: "revoked" }, { revokedAt: { not: null } }] }],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
      this.transaction.nurtureChildLinkGrant.findFirst({
        where: {
          ...base,
          status: "active",
          revokedAt: null,
          AND: [target, ...currentWindow],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
    ]);
    const fallback = active ?? revoked ?? activeMismatch;
    return fallback
      ? {
          grant_id: fallback.id,
          status: active || activeMismatch === fallback ? "active" : "revoked",
          directions: fallback.directions,
          data_classes: fallback.dataClasses,
          purposes: fallback.purposes,
          target_scope_type: fallback.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: fallback.grantedToScopeId,
          aggregate_version: fallback.aggregateVersion,
        }
      : {
          grant_id: "missing",
          status: "missing",
          directions: [],
          data_classes: [],
          target_scope_type: "care_group",
          target_scope_id: input.care_group_id,
        };
  }

  async loadFamilyCareGrantRevokeFacts(
    input: FamilyCareTransactionInput<FamilyCareGrantRevokePayload>,
  ): Promise<FamilyCareGrantRevokeFacts> {
    const [participant, role, grant] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: {
          id: input.participant_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_id,
          participantId: input.participant_id,
          workspaceId: input.workspace_id,
          deletedAt: null,
        },
      }),
      this.transaction.nurtureChildLinkGrant.findFirst({
        where: { id: input.grant_id, workspaceId: input.workspace_id, deletedAt: null },
      }),
    ]);
    const family =
      role?.scopeType === "family" && grant
        ? await this.transaction.nurtureFamily.findFirst({
            where: {
              id: role.scopeId,
              workspaceId: input.workspace_id,
              childCareProcessId: grant.childCareProcessId,
              status: "active",
              deletedAt: null,
            },
          })
        : null;
    const roleReachesGrant = Boolean(
      role &&
        grant &&
        ((role.scopeType === "child_care_process" &&
          role.scopeId === grant.childCareProcessId) ||
          (role.scopeType === "enrollment" && role.scopeId === grant.enrollmentId) ||
          (role.scopeType === "family" && family)),
    );
    return {
      participant_active: Boolean(participant),
      guardian_role_active: roleCurrent(role, new Date()) && role?.role === "guardian",
      actor_owns_grant: grant?.grantedByParticipantId === input.participant_id,
      role_reaches_grant: roleReachesGrant,
      grant_status: grant?.status ?? "missing",
      grant_version: grant?.aggregateVersion ?? -1,
      ...(grant ? { child_care_process_id: grant.childCareProcessId } : {}),
      output_refs: grant
        ? [domainRef("child_link_grant", grant.id, grant.aggregateVersion)]
        : [],
    };
  }

  async revokeFamilyCareGrant(
    input: FamilyCareTransactionInput<FamilyCareGrantRevokePayload>,
  ) {
    const now = new Date();
    const grantUpdated = await this.transaction.nurtureChildLinkGrant.updateMany({
      where: {
        id: input.grant_id,
        workspaceId: input.workspace_id,
        status: "active",
        aggregateVersion: input.expected_version,
        deletedAt: null,
      },
      data: {
        status: "revoked",
        revokedAt: now,
        revokedByParticipantId: input.participant_id,
        revokeReason: input.reason_code,
        aggregateVersion: { increment: 1 },
      },
    });
    if (grantUpdated.count !== 1) throw new Error("grant revoke conflict");

    const affectedItemRefs: DomainContextRef[] = [];
    const affectedReceiptRefs: DomainContextRef[] = [];

    for (let page = 0; ; page += 1) {
      if (page >= CASCADE_MAX_PAGES) {
        throw new Error("grant receipt cascade exceeded its closure bound");
      }
      const receipts = await this.transaction.nurtureChildLinkReceipt.findMany({
        where: {
          workspaceId: input.workspace_id,
          grantId: input.grant_id,
          status: { in: ["pending", "delivered", "read", "acknowledged"] },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: CASCADE_PAGE_SIZE,
      });
      if (receipts.length === 0) break;
      for (const receipt of receipts) {
        const visible = ["delivered", "read", "acknowledged"].includes(receipt.status);
        const updated = await this.transaction.nurtureChildLinkReceipt.updateMany({
          where: {
            id: receipt.id,
            workspaceId: input.workspace_id,
            version: receipt.version,
            status: receipt.status,
          },
          data: {
            status: visible ? "revoked_after_delivery" : "blocked",
            reasonCode: "grant_revoked",
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new Error("grant receipt fence conflict");
        affectedReceiptRefs.push(
          domainRef("child_link_receipt", receipt.id, receipt.version + 1),
        );
      }
    }

    for (let page = 0; ; page += 1) {
      if (page >= CASCADE_MAX_PAGES) {
        throw new Error("grant item cascade exceeded its closure bound");
      }
      const items = await this.transaction.nurtureFamilyCareItem.findMany({
        where: {
          workspaceId: input.workspace_id,
          grantId: input.grant_id,
          status: { in: ["open", "acknowledged", "waiting_for_family", "replied", "followed_up"] },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: CASCADE_PAGE_SIZE,
      });
      if (items.length === 0) break;
      for (const item of items) {
        if (item.status === "waiting_for_family") {
          await this.transaction.nurtureFamilyCareItemEvent.create({
            data: {
              workspaceId: input.workspace_id,
              itemId: item.id,
              actorParticipantId: input.participant_id,
              actorRoleAssignmentId: input.role_assignment_id,
              eventType: "clarification_cancelled",
              fromStatus: "waiting_for_family",
              toStatus: "waiting_for_family",
              correlationEventId: item.activeClarificationRequestEventId,
              eventPayload: { reason_code: "grant_revoked" },
            },
          });
        }
        const updated = await this.transaction.nurtureFamilyCareItem.updateMany({
          where: {
            id: item.id,
            workspaceId: input.workspace_id,
            version: item.version,
            status: item.status,
          },
          data: {
            status: "suppressed",
            activeClarificationRequestEventId: null,
            waitingForFamilySince: null,
            waitingForFamilyUntil: null,
            clarificationExpiryDriverRef: Prisma.DbNull,
            suppressedAt: now,
            suppressionReason: "grant_revoked",
            version: { increment: 1 },
            // Grant revoke is a cross-cutting authorization action rather than
            // a legacy loop handler, so it also moves the canonical lifecycle
            // axis on harness-managed rows instead of desynchronising them.
            ...(item.writerContract === "legacy_v1"
              ? {}
              : {
                  lifecycleState: "suppressed" as const,
                  lifecycleReason: "grant_revoked" as const,
                  lifecycleHead: { increment: 1 },
                }),
          },
        });
        if (updated.count !== 1) throw new Error("grant item fence conflict");
        await this.transaction.nurtureFamilyCareItemEvent.create({
          data: {
            workspaceId: input.workspace_id,
            itemId: item.id,
            actorParticipantId: input.participant_id,
            actorRoleAssignmentId: input.role_assignment_id,
            eventType: "suppressed",
            fromStatus: item.status,
            toStatus: "suppressed",
            eventPayload: { reason_code: "grant_revoked" },
          },
        });
        await this.transaction.nurtureTeacherAttentionItem.updateMany({
          where: {
            workspaceId: input.workspace_id,
            sourceType: "family_care_item",
            sourceId: item.id,
            status: "active",
          },
          data: { status: "suppressed", aggregateVersion: { increment: 1 } },
        });
        affectedItemRefs.push(domainRef("family_care_item", item.id, item.version + 1));
      }
    }
    return {
      grant_ref: domainRef("child_link_grant", input.grant_id, input.expected_version + 1),
      // Output refs stay bounded for the command result; the cascade itself
      // always runs to closure above.
      affected_item_refs: affectedItemRefs.slice(0, 15),
      affected_receipt_refs: affectedReceiptRefs.slice(0, 15),
    };
  }

  async loadFamilyInputRouteFacts(input: FamilyCareTransactionInput<FamilyInputRoutePayload>): Promise<FamilyInputRouteFacts> {
    const [participant, role, process, family, enrollment, thread, membership] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: { id: input.participant_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_id,
          participantId: input.participant_id,
          workspaceId: input.workspace_id,
          deletedAt: null,
        },
      }),
      this.transaction.nurtureChildCareProcess.findFirst({
        where: { id: input.child_care_process_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureFamily.findFirst({
        where: {
          id: input.family_id,
          workspaceId: input.workspace_id,
          childCareProcessId: input.child_care_process_id,
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureEnrollment.findFirst({
        where: {
          id: input.enrollment_id,
          workspaceId: input.workspace_id,
          childCareProcessId: input.child_care_process_id,
          careGroupId: input.care_group_id,
          status: "active",
          deletedAt: null,
          OR: [{ leftAt: null }, { leftAt: { gt: new Date() } }],
          institution: { status: "active", deletedAt: null },
          careGroup: { status: "active", deletedAt: null },
        },
      }),
      this.transaction.nurtureFamilyCareThread.findFirst({
        where: {
          id: input.thread_id,
          workspaceId: input.workspace_id,
          childCareProcessId: input.child_care_process_id,
          familyId: input.family_id,
          enrollmentId: input.enrollment_id,
          careGroupId: input.care_group_id,
          visibilityScope: { in: ["family_private", "enrollment_private"] },
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureFamilyCareThreadParticipant.findFirst({
        where: {
          workspaceId: input.workspace_id,
          threadId: input.thread_id,
          participantId: input.participant_id,
          roleAssignmentId: input.role_assignment_id,
          visibilityStatus: "active",
          deletedAt: null,
        },
      }),
    ]);
    const now = new Date();
    const guardianRole = roleCurrent(role, now) && role?.role === "guardian";
    const roleReachesFamily = Boolean(
      role &&
        ((role.scopeType === "family" && role.scopeId === input.family_id) ||
          (role.scopeType === "child_care_process" && role.scopeId === input.child_care_process_id) ||
          (role.scopeType === "enrollment" && role.scopeId === input.enrollment_id)),
    );
    const grant = enrollment
      ? await this.currentGrant({
          workspace_id: input.workspace_id,
          child_care_process_id: input.child_care_process_id,
          enrollment_id: input.enrollment_id,
          care_group_id: input.care_group_id,
          institution_id: enrollment.institutionId,
          data_class: input.data_class,
          direction: "family_to_org",
        })
      : {
          grant_id: "missing",
          status: "missing" as const,
          directions: [],
          data_classes: [],
          target_scope_type: "care_group" as const,
          target_scope_id: input.care_group_id,
        };
    return {
      participant_active: Boolean(participant),
      guardian_role_active: guardianRole,
      role_reaches_family: roleReachesFamily,
      child_process_active: Boolean(process),
      family_active: Boolean(family),
      enrollment_active: Boolean(enrollment),
      thread_active: Boolean(thread),
      thread_membership_active: Boolean(membership),
      grant,
    };
  }

  async applyFamilyInputRoute(input: FamilyCareTransactionInput<FamilyInputRoutePayload>): Promise<FamilyInputRouteApplied> {
    const enrollment = await this.transaction.nurtureEnrollment.findFirstOrThrow({
      where: { id: input.enrollment_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
    });
    const grant = await this.currentGrant({
      workspace_id: input.workspace_id,
      child_care_process_id: input.child_care_process_id,
      enrollment_id: input.enrollment_id,
      care_group_id: input.care_group_id,
      institution_id: enrollment.institutionId,
      data_class: input.data_class,
      direction: "family_to_org",
    });
    const immediate = input.route_mode === "immediate";
    if (immediate && grant.status !== "active") throw new Error("family route grant changed");
    const message = await this.transaction.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: input.workspace_id,
        threadId: input.thread_id,
        childCareProcessId: input.child_care_process_id,
        senderParticipantId: input.participant_id,
        senderRoleAssignmentId: input.role_assignment_id,
        messageKind: "family_message",
        authorshipKind: "family_authored",
        bodyFormat: "plain_text",
        bodyStorageMode: "protected",
        bodyProtectionPayload: asJson({ content_ref: input.protected_content_ref }),
        attachmentsPayload: asJson({ attachment_refs: input.attachment_refs }),
        sourceSurface: input.source_surface,
        ...(grant.status === "active" ? { grantId: grant.grant_id } : {}),
        status: "sent",
      },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        ...(grant.status === "active" ? { grantId: grant.grant_id } : {}),
        childCareProcessId: input.child_care_process_id,
        enrollmentId: input.enrollment_id,
        direction: "family_to_org",
        ...(immediate ? { dataClass: input.data_class } : {}),
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: input.routing_attempt_key,
        ...(immediate
          ? {
              targetScopeType: grant.target_scope_type,
              targetScopeId: grant.target_scope_id,
              status: "delivered" as const,
              deliveredAt: new Date(),
            }
          : {
              status: "pending" as const,
              pendingReason: "workflow_processing" as const,
              driverType: "workflow_step" as const,
              driverRef: asJson(input.pending_driver_ref!),
            }),
      },
    });
    await this.transaction.nurtureFamilyCareThread.updateMany({
      where: { id: input.thread_id, workspaceId: input.workspace_id, status: "active" },
      data: { latestMessageAt: message.createdAt, aggregateVersion: { increment: 1 } },
    });
    if (!immediate) {
      return {
        message_ref: domainRef("family_care_message", message.id, message.aggregateVersion),
        receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
      };
    }
    const item = await this.transaction.nurtureFamilyCareItem.create({
      data: {
        workspaceId: input.workspace_id,
        sourceMessageId: message.id,
        threadId: input.thread_id,
        childCareProcessId: input.child_care_process_id,
        familyId: input.family_id,
        enrollmentId: input.enrollment_id,
        careGroupId: input.care_group_id,
        dataClass: input.data_class,
        category: input.category,
        summary: input.safe_summary.trim(),
        urgency: input.urgency,
        requiresAck: input.requires_ack,
        requiresReply: input.requires_reply,
        status: "open",
        classificationSource: "manual",
        grantId: grant.grant_id,
      },
    });
    await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.role_assignment_id,
        eventType: "created",
        toStatus: "open",
        relatedMessageId: message.id,
      },
    });
    const attention = await this.transaction.nurtureTeacherAttentionItem.create({
      data: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        childCareProcessId: input.child_care_process_id,
        sourceType: "family_care_item",
        sourceId: item.id,
        title: input.safe_summary.trim().slice(0, 160),
        summary: input.safe_summary.trim(),
        priority:
          input.urgency === "time_sensitive" || input.urgency === "urgent_non_emergency"
            ? "time_sensitive"
            : input.urgency === "today_attention"
              ? "attention"
              : "normal",
        status: "active",
        effectiveDate: new Date(),
      },
    });
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion),
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
      item_ref: domainRef("family_care_item", item.id, item.version),
      attention_ref: domainRef("teacher_attention_item", attention.id, attention.aggregateVersion),
    };
  }

  async loadG2SubmitFacts(input: FamilyCareTransactionInput<G2SubmitCommandPayload>): Promise<G2SubmitFacts> {
    const missingGrant: FamilyCareCurrentGrant = {
      grant_id: "missing",
      status: "missing",
      directions: [],
      data_classes: [],
      target_scope_type: "care_group",
      target_scope_id: "missing",
    };
    const [participant, enrollment] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: { id: input.participant_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureEnrollment.findFirst({
        where: {
          id: input.enrollment_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
          OR: [{ leftAt: null }, { leftAt: { gt: new Date() } }],
          institution: { status: "active", deletedAt: null },
          careGroup: { status: "active", deletedAt: null },
        },
      }),
    ]);
    if (!enrollment) {
      return {
        participant_active: Boolean(participant),
        enrollment_active: false,
        grant: missingGrant,
      };
    }
    const now = new Date();
    const [family, role, thread] = await Promise.all([
      this.transaction.nurtureFamily.findFirst({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: enrollment.childCareProcessId,
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          workspaceId: input.workspace_id,
          participantId: input.participant_id,
          role: "guardian",
          status: "active",
          deletedAt: null,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
        },
        orderBy: { id: "asc" },
      }),
      this.transaction.nurtureFamilyCareThread.findFirst({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: enrollment.childCareProcessId,
          enrollmentId: input.enrollment_id,
          visibilityScope: { in: ["family_private", "enrollment_private"] },
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
      }),
    ]);
    const roleReaches = Boolean(
      role &&
        ((role.scopeType === "family" && family && role.scopeId === family.id) ||
          (role.scopeType === "child_care_process" && role.scopeId === enrollment.childCareProcessId) ||
          (role.scopeType === "enrollment" && role.scopeId === input.enrollment_id)),
    );
    const grant = await this.currentGrant({
      workspace_id: input.workspace_id,
      child_care_process_id: enrollment.childCareProcessId,
      enrollment_id: input.enrollment_id,
      care_group_id: enrollment.careGroupId,
      institution_id: enrollment.institutionId,
      data_class: "family_care_question",
      direction: "family_to_org",
    });
    let continuationEligible: boolean | undefined;
    if (input.context_continuation_of_item_id) {
      const source = family
        ? await this.transaction.nurtureFamilyCareItem.findFirst({
            where: {
              id: input.context_continuation_of_item_id,
              workspaceId: input.workspace_id,
              childCareProcessId: enrollment.childCareProcessId,
              enrollmentId: input.enrollment_id,
              familyId: family.id,
              responseState: "responded",
            },
          })
        : null;
      continuationEligible = Boolean(source);
    }
    return {
      participant_active: Boolean(participant),
      ...(role && roleReaches ? { guardian_role_assignment_id: role.id } : {}),
      enrollment_active: true,
      child_care_process_id: enrollment.childCareProcessId,
      ...(family ? { family_id: family.id } : {}),
      care_group_id: enrollment.careGroupId,
      ...(thread ? { thread_id: thread.id } : {}),
      grant,
      ...(continuationEligible === undefined ? {} : { continuation_eligible: continuationEligible }),
    };
  }

  async applyG2Submit(input: FamilyCareTransactionInput<G2SubmitApplyInput>): Promise<G2SubmitApplied> {
    const message = await this.transaction.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: input.workspace_id,
        threadId: input.thread_id,
        childCareProcessId: input.child_care_process_id,
        senderParticipantId: input.participant_id,
        senderRoleAssignmentId: input.guardian_role_assignment_id,
        messageKind: "family_message",
        authorshipKind: "family_authored",
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: asJson(input.body_envelope),
        sourceSurface: "mobile",
        grantId: input.grant_id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: input.enrollment_id,
        careGroupId: input.care_group_id,
        direction: "family_to_org",
      },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        grantId: input.grant_id,
        childCareProcessId: input.child_care_process_id,
        enrollmentId: input.enrollment_id,
        direction: "family_to_org",
        dataClass: "family_care_question",
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: `g2-submit:${message.id}`,
        targetScopeType: "care_group",
        targetScopeId: input.care_group_id,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    await this.transaction.nurtureFamilyCareThread.updateMany({
      where: { id: input.thread_id, workspaceId: input.workspace_id, status: "active" },
      data: { latestMessageAt: message.createdAt, aggregateVersion: { increment: 1 } },
    });
    const item = await this.transaction.nurtureFamilyCareItem.create({
      data: {
        workspaceId: input.workspace_id,
        sourceMessageId: message.id,
        threadId: input.thread_id,
        childCareProcessId: input.child_care_process_id,
        familyId: input.family_id,
        enrollmentId: input.enrollment_id,
        careGroupId: input.care_group_id,
        dataClass: "family_care_question",
        category: "question",
        summary: input.safe_summary,
        urgency: "today_attention",
        requiresAck: true,
        requiresReply: true,
        // Legacy status is the read-only derived compatibility column
        // (cutover C1); the three axes below are the canonical state.
        status: "open",
        classificationSource: "system",
        grantId: input.grant_id,
        writerContract: "harness_g2_v1",
        acknowledgementState: "pending",
        responseState: "awaiting_reply",
        lifecycleState: "active",
        ...(input.context_continuation_of_item_id
          ? { contextContinuationOfItemId: input.context_continuation_of_item_id }
          : {}),
      },
    });
    const event = await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.guardian_role_assignment_id,
        eventType: "created",
        toStatus: "open",
        relatedMessageId: message.id,
      },
    });
    const attention = await this.transaction.nurtureTeacherAttentionItem.create({
      data: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        childCareProcessId: input.child_care_process_id,
        sourceType: "family_care_item",
        sourceId: item.id,
        title: input.safe_summary.slice(0, 160),
        summary: input.safe_summary,
        priority: "attention",
        status: "active",
        effectiveDate: new Date(),
      },
    });
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion),
      item_ref: domainRef("family_care_item", item.id, item.version),
      item_event_ref: domainRef("family_care_item_event", event.id),
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
      attention_ref: domainRef("teacher_attention_item", attention.id, attention.aggregateVersion),
    };
  }

  async loadG2DirectMessageFacts(
    input: FamilyCareTransactionInput<G2DirectMessagePayload>,
  ): Promise<G2DirectMessageFacts> {
    const missingGrant: FamilyCareCurrentGrant = {
      grant_id: "missing",
      status: "missing",
      directions: [],
      data_classes: [],
      purposes: [],
      target_scope_type: "care_group",
      target_scope_id: "missing",
    };
    const now = new Date();
    const [participant, enrollment] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: {
          id: input.participant_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureEnrollment.findFirst({
        where: {
          id: input.enrollment_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
          OR: [{ leftAt: null }, { leftAt: { gt: now } }],
          institution: { status: "active", deletedAt: null },
          careGroup: { status: "active", deletedAt: null },
        },
        include: { careGroup: true },
      }),
    ]);
    if (!enrollment) {
      return {
        participant_active: Boolean(participant),
        enrollment_active: false,
        grant: missingGrant,
      };
    }
    const [families, roles, grantRow] = await Promise.all([
      this.transaction.nurtureFamily.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: enrollment.childCareProcessId,
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
        take: 2,
      }),
      this.transaction.nurtureCareRoleAssignment.findMany({
        where: {
          workspaceId: input.workspace_id,
          participantId: input.participant_id,
          role: { in: ["caregiver", "lead_caregiver"] },
          scopeType: "care_group",
          scopeId: enrollment.careGroupId,
          status: "active",
          deletedAt: null,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
        },
        orderBy: { id: "asc" },
        take: 2,
      }),
      this.transaction.nurtureChildLinkGrant.findFirst({
        where: {
          id: input.grant_id,
          workspaceId: input.workspace_id,
          childCareProcessId: enrollment.childCareProcessId,
          enrollmentId: enrollment.id,
        },
      }),
    ]);
    const role = roles.length === 1 ? roles[0] : undefined;
    const family = families.length === 1 ? families[0] : undefined;
    const threads = family
      ? await this.transaction.nurtureFamilyCareThread.findMany({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: enrollment.childCareProcessId,
            familyId: family.id,
            enrollmentId: enrollment.id,
            careGroupId: enrollment.careGroupId,
            visibilityScope: { in: ["family_private", "enrollment_private"] },
            status: "active",
            deletedAt: null,
          },
          orderBy: { id: "asc" },
          take: 2,
        })
      : [];
    const exactThread = threads.length === 1 ? threads[0] : undefined;
    const grantTargetMatches = Boolean(
      grantRow &&
        ((grantRow.grantedToScopeType === "care_group" &&
          grantRow.grantedToScopeId === enrollment.careGroupId) ||
          (grantRow.grantedToScopeType === "enrollment" &&
            grantRow.grantedToScopeId === enrollment.id) ||
          (grantRow.grantedToScopeType === "institution" &&
            grantRow.grantedToScopeId === enrollment.institutionId)),
    );
    const grantActive = Boolean(
      grantRow &&
        grantRow.status === "active" &&
        !grantRow.revokedAt &&
        grantRow.deletedAt === null &&
        (!grantRow.effectiveFrom || grantRow.effectiveFrom <= now) &&
        (!grantRow.expiresAt || grantRow.expiresAt > now) &&
        grantRow.directions.includes("org_to_family") &&
        grantRow.dataClasses.includes("direct_care_communication") &&
        grantRow.purposes.includes(FAMILY_CARE_PURPOSE) &&
        grantTargetMatches,
    );
    const grant: FamilyCareCurrentGrant = grantRow
      ? {
          grant_id: grantRow.id,
          status: grantActive
            ? "active"
            : grantRow.status === "revoked" || grantRow.revokedAt
              ? "revoked"
              : "missing",
          directions: grantRow.directions,
          data_classes: grantRow.dataClasses,
          purposes: grantRow.purposes,
          target_scope_type:
            grantRow.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: grantRow.grantedToScopeId,
          aggregate_version: grantRow.aggregateVersion,
        }
      : missingGrant;
    return {
      participant_active: Boolean(participant),
      ...(role
        ? {
            caregiver_role_assignment_id: role.id,
            caregiver_role_version: role.aggregateVersion,
          }
        : {}),
      enrollment_active: true,
      enrollment_version: enrollment.aggregateVersion,
      care_group_version: enrollment.careGroup.aggregateVersion,
      child_care_process_id: enrollment.childCareProcessId,
      ...(family ? { family_id: family.id } : {}),
      care_group_id: enrollment.careGroupId,
      ...(exactThread
        ? { thread_id: exactThread.id, thread_version: exactThread.aggregateVersion }
        : {}),
      grant,
    };
  }

  async applyG2DirectMessage(
    input: FamilyCareTransactionInput<G2DirectMessageApplyInput>,
  ): Promise<G2DirectMessageApplied> {
    const messageId = randomUUID();
    const updatedThread = await this.transaction.nurtureFamilyCareThread.updateMany({
      where: {
        id: input.thread_id,
        workspaceId: input.workspace_id,
        childCareProcessId: input.child_care_process_id,
        familyId: input.family_id,
        enrollmentId: input.enrollment_id,
        careGroupId: input.care_group_id,
        status: "active",
        aggregateVersion: input.expected_thread_version,
      },
      data: { latestMessageAt: new Date(), aggregateVersion: { increment: 1 } },
    });
    if (updatedThread.count !== 1) throw new Error("G2 direct message thread conflict");
    const message = await this.transaction.nurtureFamilyCareMessage.create({
      data: {
        id: messageId,
        workspaceId: input.workspace_id,
        threadId: input.thread_id,
        childCareProcessId: input.child_care_process_id,
        senderParticipantId: input.participant_id,
        senderRoleAssignmentId: input.caregiver_role_assignment_id,
        messageKind: "caregiver_direct_message",
        authorshipKind: "caregiver_confirmed",
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: asJson(input.body_envelope),
        sourceSurface: "workflow",
        grantId: input.grant_id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: input.enrollment_id,
        careGroupId: input.care_group_id,
        direction: "org_to_family",
      },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        grantId: input.grant_id,
        childCareProcessId: input.child_care_process_id,
        enrollmentId: input.enrollment_id,
        direction: "org_to_family",
        dataClass: "direct_care_communication",
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: `g2-direct:${message.id}`,
        targetScopeType: "family",
        targetScopeId: input.family_id,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion),
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
    };
  }

  async loadG2ItemActionFacts(input: FamilyCareTransactionInput<G2ItemActionPayload>): Promise<G2ItemActionFacts> {
    const missingGrant: FamilyCareCurrentGrant = {
      grant_id: "missing",
      status: "missing",
      directions: [],
      data_classes: [],
      target_scope_type: "care_group",
      target_scope_id: "missing",
    };
    const [participant, item] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: { id: input.participant_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureFamilyCareItem.findFirst({
        where: { id: input.item_id, workspaceId: input.workspace_id },
      }),
    ]);
    if (!item) {
      return { participant_active: Boolean(participant), item_present: false, grant: missingGrant };
    }
    const now = new Date();
    const role = await this.transaction.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: ["caregiver", "lead_caregiver"] },
        scopeType: "care_group",
        scopeId: item.careGroupId,
        status: "active",
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: { id: "asc" },
    });
    const grantRow = item.grantId
      ? await this.transaction.nurtureChildLinkGrant.findFirst({
          where: { id: item.grantId, workspaceId: input.workspace_id, deletedAt: null },
        })
      : null;
    const grantCurrent = Boolean(
      grantRow &&
        grantRow.status === "active" &&
        !grantRow.revokedAt &&
        (!grantRow.effectiveFrom || grantRow.effectiveFrom <= now) &&
        (!grantRow.expiresAt || grantRow.expiresAt > now),
    );
    const grant: FamilyCareCurrentGrant = grantRow
      ? {
          grant_id: grantRow.id,
          status: grantCurrent ? "active" : "revoked",
          directions: grantRow.directions,
          data_classes: grantRow.dataClasses,
          purposes: grantRow.purposes,
          target_scope_type: grantRow.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: grantRow.grantedToScopeId,
        }
      : missingGrant;
    let existingAckRefs: DomainContextRef[] | undefined;
    if (item.acknowledgementState === "acknowledged") {
      const ackEvent = await this.transaction.nurtureFamilyCareItemEvent.findFirst({
        where: { workspaceId: input.workspace_id, itemId: item.id, eventType: "acknowledged" },
        orderBy: { createdAt: "desc" },
      });
      existingAckRefs = [
        domainRef("family_care_item", item.id, item.version),
        ...(ackEvent ? [domainRef("family_care_item_event", ackEvent.id)] : []),
      ];
    }
    return {
      participant_active: Boolean(participant),
      ...(role ? { caregiver_role_assignment_id: role.id } : {}),
      item_present: true,
      writer_contract: item.writerContract,
      acknowledgement_state: item.acknowledgementState,
      acknowledgement_head: item.acknowledgementHead,
      response_state: item.responseState,
      lifecycle_state: item.lifecycleState,
      lifecycle_head: item.lifecycleHead,
      item_safe_summary: item.summary,
      grant,
      ...(existingAckRefs ? { existing_acknowledgement_refs: existingAckRefs } : {}),
    };
  }

  async applyG2Acknowledge(
    input: FamilyCareTransactionInput<G2AcknowledgeApplyInput>,
  ): Promise<G2AcknowledgeApplied> {
    const before = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: input.item_id, workspaceId: input.workspace_id },
    });
    const derivedStatus = before.responseState === "responded" ? "replied" : "acknowledged";
    const updated = await this.transaction.nurtureFamilyCareItem.updateMany({
      where: {
        id: input.item_id,
        workspaceId: input.workspace_id,
        writerContract: { in: ["legacy_migrated_v1", "harness_g2_v1"] },
        acknowledgementState: "pending",
        acknowledgementHead: input.expected_acknowledgement_head,
        lifecycleState: "active",
      },
      data: {
        acknowledgementState: "acknowledged",
        acknowledgementHead: { increment: 1 },
        ackedByParticipantId: input.participant_id,
        ackedByRoleAssignmentId: input.caregiver_role_assignment_id,
        ackedAt: new Date(),
        // Legacy status stays the one-way derived compatibility value (C1).
        status: derivedStatus,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("G2 acknowledge head conflict");
    const item = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: input.item_id, workspaceId: input.workspace_id },
    });
    const event = await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.caregiver_role_assignment_id,
        eventType: "acknowledged",
        fromStatus: before.status,
        toStatus: derivedStatus,
      },
    });
    let receiptRef: DomainContextRef | undefined;
    if (item.sourceMessageId) {
      const receipt = await this.transaction.nurtureChildLinkReceipt.findFirst({
        where: {
          workspaceId: input.workspace_id,
          direction: "family_to_org",
          sourceType: "family_care_message",
          sourceId: item.sourceMessageId,
        },
      });
      if (receipt && ["delivered", "read"].includes(receipt.status)) {
        const receiptUpdated = await this.transaction.nurtureChildLinkReceipt.updateMany({
          where: { id: receipt.id, workspaceId: input.workspace_id, version: receipt.version },
          data: { status: "acknowledged", acknowledgedAt: new Date(), version: { increment: 1 } },
        });
        if (receiptUpdated.count !== 1) throw new Error("G2 acknowledge receipt conflict");
        receiptRef = domainRef("child_link_receipt", receipt.id, receipt.version + 1);
      }
    }
    return {
      item_ref: domainRef("family_care_item", item.id, item.version),
      item_event_ref: domainRef("family_care_item_event", event.id),
      ...(receiptRef ? { receipt_ref: receiptRef } : {}),
    };
  }

  async applyG2Reply(input: FamilyCareTransactionInput<G2ReplyApplyInput>): Promise<G2ReplyApplied> {
    const item = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: input.item_id, workspaceId: input.workspace_id },
    });
    if (!item.enrollmentId) throw new Error("G2 reply enrollment missing");
    const messageId = randomUUID();
    const clockRows = await this.transaction.$queryRaw<Array<{ micros: bigint }>>(
      Prisma.sql`SELECT (extract(epoch FROM clock_timestamp()) * 1000000)::bigint AS micros`,
    );
    const replyOrderKey = `${clockRows[0]!.micros.toString().padStart(16, "0")}-${messageId}`;
    const message = await this.transaction.nurtureFamilyCareMessage.create({
      data: {
        id: messageId,
        workspaceId: input.workspace_id,
        threadId: item.threadId,
        childCareProcessId: item.childCareProcessId,
        senderParticipantId: input.participant_id,
        senderRoleAssignmentId: input.caregiver_role_assignment_id,
        messageKind: "caregiver_reply",
        authorshipKind: "caregiver_confirmed",
        sourceItemId: item.id,
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: asJson(input.body_envelope),
        sourceSurface: "mobile",
        grantId: input.grant_id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: item.enrollmentId,
        careGroupId: item.careGroupId,
        direction: "org_to_family",
        replyOrderKey,
      },
    });
    // Append-compatible: only the first response transition is conditional;
    // additional legitimate replies never conflict on the response axis.
    const firstTransition = await this.transaction.nurtureFamilyCareItem.updateMany({
      where: {
        id: item.id,
        workspaceId: input.workspace_id,
        responseState: "awaiting_reply",
        lifecycleState: "active",
      },
      data: {
        responseState: "responded",
        responseHead: { increment: 1 },
        // C1 derivation: active + responded maps to legacy "replied".
        status: "replied",
        version: { increment: 1 },
      },
    });
    const responseEffect = firstTransition.count === 1 ? "first_response" : "additional_response";
    const event = await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.caregiver_role_assignment_id,
        eventType: "replied",
        fromStatus: item.status,
        toStatus: "replied",
        relatedMessageId: message.id,
      },
    });
    await this.transaction.nurtureFamilyCareMessage.update({
      where: { id: message.id },
      data: { sourceItemEventId: event.id },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        grantId: input.grant_id,
        childCareProcessId: item.childCareProcessId,
        enrollmentId: item.enrollmentId,
        direction: "org_to_family",
        dataClass: item.dataClass,
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: `g2-reply:${message.id}`,
        targetScopeType: "family",
        targetScopeId: item.familyId,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    await this.transaction.nurtureFamilyCareThread.updateMany({
      where: { id: item.threadId, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      data: { latestMessageAt: message.createdAt, aggregateVersion: { increment: 1 } },
    });
    let attentionEffect: "resolved" | "unchanged" = "unchanged";
    if (responseEffect === "first_response") {
      const resolved = await this.transaction.nurtureTeacherAttentionItem.updateMany({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_item",
          sourceId: item.id,
          status: "active",
        },
        data: { status: "resolved", aggregateVersion: { increment: 1 } },
      });
      attentionEffect = resolved.count > 0 ? "resolved" : "unchanged";
    }
    const updatedItem = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: item.id, workspaceId: input.workspace_id },
    });
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion),
      item_ref: domainRef("family_care_item", updatedItem.id, updatedItem.version),
      item_event_ref: domainRef("family_care_item_event", event.id),
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
      reply_order_key: replyOrderKey,
      response_effect: responseEffect,
      attention_effect: attentionEffect,
    };
  }

  async loadG2MessageChangeFacts(
    input: FamilyCareTransactionInput<G2MessageChangePayload>,
  ): Promise<G2MessageChangeFacts> {
    const missingGrant: FamilyCareCurrentGrant = {
      grant_id: "missing",
      status: "missing",
      directions: [],
      data_classes: [],
      purposes: [],
      target_scope_type: "care_group",
      target_scope_id: "missing",
    };
    const [participant, message] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: {
          id: input.participant_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureFamilyCareMessage.findFirst({
        where: { id: input.message_id, workspaceId: input.workspace_id },
        include: { grant: true, enrollment: true },
      }),
    ]);
    if (!message) {
      return {
        participant_active: Boolean(participant),
        message_present: false,
        exact_author: false,
        same_side_reachable: false,
        policy_actor_authorized: false,
        correction_head: 0,
        grant: missingGrant,
      };
    }

    const item = await this.transaction.nurtureFamilyCareItem.findFirst({
      where:
        message.messageKind === "family_message"
          ? { workspaceId: input.workspace_id, sourceMessageId: message.id }
          : message.sourceItemId
            ? { workspaceId: input.workspace_id, id: message.sourceItemId }
            : { workspaceId: input.workspace_id, id: "__no_item__" },
    });
    const now = new Date();
    const exactAuthor = message.senderParticipantId === input.participant_id;
    const authorScopes: Prisma.NurtureCareRoleAssignmentWhereInput[] = [];
    let authorRoles: Array<"guardian" | "caregiver" | "lead_caregiver"> = ["guardian"];
    if (message.authorshipKind === "family_authored") {
      authorScopes.push({ scopeType: "child_care_process", scopeId: message.childCareProcessId });
      if (message.enrollmentId) authorScopes.push({ scopeType: "enrollment", scopeId: message.enrollmentId });
      if (item?.familyId) authorScopes.push({ scopeType: "family", scopeId: item.familyId });
    } else {
      authorRoles = ["caregiver", "lead_caregiver"];
      if (message.careGroupId) authorScopes.push({ scopeType: "care_group", scopeId: message.careGroupId });
    }
    const currentAuthorRole =
      exactAuthor && authorScopes.length > 0
        ? await this.transaction.nurtureCareRoleAssignment.findFirst({
            where: {
              workspaceId: input.workspace_id,
              participantId: input.participant_id,
              role: { in: authorRoles },
              status: "active",
              deletedAt: null,
              OR: authorScopes,
              AND: [
                { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
              ],
            },
            orderBy: { id: "asc" },
          })
        : null;
    const policyScopes: Prisma.NurtureCareRoleAssignmentWhereInput[] = [
      { scopeType: "child_care_process", scopeId: message.childCareProcessId },
      ...(message.enrollmentId
        ? [{ scopeType: "enrollment" as const, scopeId: message.enrollmentId }]
        : []),
      ...(message.enrollment
        ? [{ scopeType: "institution" as const, scopeId: message.enrollment.institutionId }]
        : []),
    ];
    const policyRole = participant
      ? await this.transaction.nurtureCareRoleAssignment.findFirst({
          where: {
            workspaceId: input.workspace_id,
            participantId: input.participant_id,
            role: "system_operator",
            status: "active",
            deletedAt: null,
            OR: policyScopes,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            ],
          },
          orderBy: { id: "asc" },
        })
      : null;

    const grantRow = message.grant;
    const targetMatches = Boolean(
      grantRow &&
        message.enrollment &&
        ((grantRow.grantedToScopeType === "care_group" &&
          grantRow.grantedToScopeId === message.careGroupId) ||
          (grantRow.grantedToScopeType === "enrollment" &&
            grantRow.grantedToScopeId === message.enrollmentId) ||
          (grantRow.grantedToScopeType === "institution" &&
            grantRow.grantedToScopeId === message.enrollment.institutionId)),
    );
    const grantCurrent = Boolean(
      grantRow &&
        grantRow.status === "active" &&
        !grantRow.revokedAt &&
        grantRow.deletedAt === null &&
        (!grantRow.effectiveFrom || grantRow.effectiveFrom <= now) &&
        (!grantRow.expiresAt || grantRow.expiresAt > now) &&
        message.direction &&
        grantRow.directions.includes(message.direction) &&
        grantRow.dataClasses.includes(item?.dataClass ?? "direct_care_communication") &&
        grantRow.purposes.includes(FAMILY_CARE_PURPOSE) &&
        targetMatches,
    );
    const grant: FamilyCareCurrentGrant = grantRow
      ? {
          grant_id: grantRow.id,
          status: grantCurrent ? "active" : grantRow.status === "revoked" || grantRow.revokedAt ? "revoked" : "missing",
          directions: grantRow.directions,
          data_classes: grantRow.dataClasses,
          purposes: grantRow.purposes,
          target_scope_type: grantRow.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: grantRow.grantedToScopeId,
        }
      : missingGrant;
    const correctionHead = await this.transaction.nurtureFamilyCareMessageCorrection.aggregate({
      where: { workspaceId: input.workspace_id, messageId: message.id },
      _max: { correctionVersion: true },
    });
    const existingAudit =
      message.status === "redacted"
        ? await this.transaction.nurtureFamilyCareCascadeAudit.findFirst({
            where: { workspaceId: input.workspace_id, rootMessageId: message.id, closureState: "complete" },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          })
        : null;
    return {
      participant_active: Boolean(participant),
      message_present: true,
      writer_contract: message.writerContract,
      ...(message.messageKind === "family_message" ||
      message.messageKind === "caregiver_reply" ||
      message.messageKind === "caregiver_direct_message"
        ? { message_kind: message.messageKind }
        : {}),
      message_status: message.status,
      message_version: message.aggregateVersion,
      ...(message.direction ? { message_direction: message.direction } : {}),
      exact_author: exactAuthor,
      ...(currentAuthorRole ? { current_author_role_assignment_id: currentAuthorRole.id } : {}),
      same_side_reachable: Boolean(currentAuthorRole),
      policy_actor_authorized: Boolean(policyRole),
      ...(policyRole ? { policy_role_assignment_id: policyRole.id } : {}),
      correction_head: correctionHead._max.correctionVersion ?? 0,
      ...(item
        ? {
            source_item_id: item.id,
            source_item_response_state: item.responseState,
            source_item_lifecycle_state: item.lifecycleState,
            source_item_lifecycle_head: item.lifecycleHead,
          }
        : {}),
      grant,
      ...(existingAudit
        ? {
            existing_redaction_refs: [
              domainRef("family_care_message", message.id, message.aggregateVersion),
              domainRef("family_care_cascade_audit", existingAudit.id),
            ],
          }
        : {}),
    };
  }

  async applyG2Correction(
    input: FamilyCareTransactionInput<G2CorrectMessageApplyInput>,
  ): Promise<G2CorrectMessageApplied> {
    const message = await this.transaction.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { id: input.message_id, workspaceId: input.workspace_id },
      include: { thread: true },
    });
    const item = await this.transaction.nurtureFamilyCareItem.findFirst({
      where:
        message.messageKind === "family_message"
          ? { workspaceId: input.workspace_id, sourceMessageId: message.id }
          : message.sourceItemId
            ? { workspaceId: input.workspace_id, id: message.sourceItemId }
            : { workspaceId: input.workspace_id, id: "__no_item__" },
    });
    if (
      input.expected_lifecycle_head !== undefined &&
      (!item ||
        item.lifecycleState !== "active" ||
        item.lifecycleHead !== input.expected_lifecycle_head)
    ) {
      throw new Error("G2 correction lifecycle conflict");
    }
    const head = await this.transaction.nurtureFamilyCareMessageCorrection.aggregate({
      where: { workspaceId: input.workspace_id, messageId: message.id },
      _max: { correctionVersion: true },
    });
    if ((head._max.correctionVersion ?? 0) !== input.expected_correction_head) {
      throw new Error("G2 correction head conflict");
    }
    const updated = await this.transaction.nurtureFamilyCareMessage.updateMany({
      where: {
        id: message.id,
        workspaceId: input.workspace_id,
        writerContract: "harness_g2_v1",
        status: "sent",
        aggregateVersion: input.expected_message_version,
      },
      data: { aggregateVersion: { increment: 1 } },
    });
    if (updated.count !== 1) throw new Error("G2 correction message conflict");

    const correctionId = randomUUID();
    const correctionVersion = input.expected_correction_head + 1;
    await this.transaction.nurtureFamilyCareMessageCorrection.create({
      data: {
        id: correctionId,
        workspaceId: input.workspace_id,
        messageId: message.id,
        correctionVersion,
        authorParticipantId: input.participant_id,
        authorRoleAssignmentId: input.current_author_role_assignment_id,
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: asJson(input.body_envelope),
        status: "active",
      },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        grantId: message.grantId,
        childCareProcessId: message.childCareProcessId,
        enrollmentId: message.enrollmentId,
        direction: message.direction ?? "family_to_org",
        dataClass: item?.dataClass ?? "direct_care_communication",
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: `g2-correction:${correctionId}`,
        targetScopeType: message.direction === "org_to_family" ? "family" : "care_group",
        targetScopeId:
          message.direction === "org_to_family" ? message.thread.familyId : message.careGroupId,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    await this.transaction.nurtureFamilyCareMessageCorrection.update({
      where: { id: correctionId },
      data: { receiptId: receipt.id },
    });
    if (item) {
      await this.transaction.nurtureFamilyCareItemEvent.create({
        data: {
          workspaceId: input.workspace_id,
          itemId: item.id,
          actorParticipantId: input.participant_id,
          actorRoleAssignmentId: input.current_author_role_assignment_id,
          eventType: "corrected",
          fromStatus: item.status,
          toStatus: item.status,
          relatedMessageId: message.id,
          eventPayload: { correction_id: correctionId, correction_version: correctionVersion },
        },
      });
    }
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion + 1),
      ...(item ? { item_ref: domainRef("family_care_item", item.id, item.version) } : {}),
      correction_ref: domainRef("family_care_message_correction", correctionId, correctionVersion),
      correction_version: correctionVersion,
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
      finalization: { correction_id: correctionId },
    };
  }

  async finalizeG2Correction(
    input: FamilyCareTransactionInput<{ correction_id: string; command_execution_id: string }>,
  ): Promise<void> {
    const updated = await this.transaction.nurtureFamilyCareMessageCorrection.updateMany({
      where: {
        id: input.correction_id,
        workspaceId: input.workspace_id,
        commandExecutionId: null,
      },
      data: { commandExecutionId: input.command_execution_id },
    });
    if (updated.count !== 1) throw new Error("G2 correction execution binding conflict");
  }

  async loadG2WithdrawalFacts(
    input: FamilyCareTransactionInput<G2WithdrawalPayload>,
  ): Promise<G2WithdrawalFacts> {
    const missingGrant: FamilyCareCurrentGrant = {
      grant_id: "missing",
      status: "missing",
      directions: [],
      data_classes: [],
      purposes: [],
      target_scope_type: "care_group",
      target_scope_id: "missing",
    };
    const [participant, item] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: {
          id: input.participant_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      }),
      this.transaction.nurtureFamilyCareItem.findFirst({
        where: { id: input.item_id, workspaceId: input.workspace_id },
        include: { grant: true, enrollment: true },
      }),
    ]);
    if (!item) {
      return {
        participant_active: Boolean(participant),
        item_present: false,
        exact_source_author: false,
        same_side_reachable: false,
        grant: missingGrant,
      };
    }
    const source = item.sourceMessageId
      ? await this.transaction.nurtureFamilyCareMessage.findFirst({
          where: { id: item.sourceMessageId, workspaceId: input.workspace_id },
        })
      : null;
    const now = new Date();
    const role = await this.transaction.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: "guardian",
        status: "active",
        deletedAt: null,
        OR: [
          { scopeType: "child_care_process", scopeId: item.childCareProcessId },
          { scopeType: "family", scopeId: item.familyId },
          ...(item.enrollmentId
            ? [{ scopeType: "enrollment" as const, scopeId: item.enrollmentId }]
            : []),
        ],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: { id: "asc" },
    });
    const grantRow = item.grant;
    const targetMatches = Boolean(
      grantRow &&
        item.enrollment &&
        ((grantRow.grantedToScopeType === "care_group" &&
          grantRow.grantedToScopeId === item.careGroupId) ||
          (grantRow.grantedToScopeType === "enrollment" &&
            grantRow.grantedToScopeId === item.enrollmentId) ||
          (grantRow.grantedToScopeType === "institution" &&
            grantRow.grantedToScopeId === item.enrollment.institutionId)),
    );
    const grantCurrent = Boolean(
      grantRow &&
        grantRow.status === "active" &&
        !grantRow.revokedAt &&
        grantRow.deletedAt === null &&
        (!grantRow.effectiveFrom || grantRow.effectiveFrom <= now) &&
        (!grantRow.expiresAt || grantRow.expiresAt > now) &&
        grantRow.directions.includes("family_to_org") &&
        grantRow.dataClasses.includes(item.dataClass) &&
        grantRow.purposes.includes(FAMILY_CARE_PURPOSE) &&
        targetMatches,
    );
    const grant: FamilyCareCurrentGrant = grantRow
      ? {
          grant_id: grantRow.id,
          status: grantCurrent ? "active" : grantRow.status === "revoked" || grantRow.revokedAt ? "revoked" : "missing",
          directions: grantRow.directions,
          data_classes: grantRow.dataClasses,
          purposes: grantRow.purposes,
          target_scope_type: grantRow.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: grantRow.grantedToScopeId,
        }
      : missingGrant;
    const withdrawalEvent =
      item.lifecycleState === "closed" && item.lifecycleReason === "family_withdrawn"
        ? await this.transaction.nurtureFamilyCareItemEvent.findFirst({
            where: {
              workspaceId: input.workspace_id,
              itemId: item.id,
              eventType: "closed",
            },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          })
        : null;
    const withdrawalReceipt = withdrawalEvent
      ? await this.transaction.nurtureChildLinkReceipt.findFirst({
          where: {
            workspaceId: input.workspace_id,
            sourceType: "family_care_item",
            sourceId: item.id,
            routingAttemptKey: { startsWith: "g2-withdraw:" },
          },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        })
      : null;
    return {
      participant_active: Boolean(participant),
      item_present: true,
      writer_contract: item.writerContract,
      exact_source_author: source?.senderParticipantId === input.participant_id,
      ...(role ? { current_guardian_role_assignment_id: role.id } : {}),
      same_side_reachable: Boolean(role),
      lifecycle_state: item.lifecycleState,
      ...(item.lifecycleReason ? { lifecycle_reason: item.lifecycleReason } : {}),
      lifecycle_head: item.lifecycleHead,
      grant,
      ...(withdrawalEvent
        ? {
            existing_withdrawal_refs: [
              domainRef("family_care_item", item.id, item.version),
              domainRef("family_care_item_event", withdrawalEvent.id),
              ...(withdrawalReceipt
                ? [domainRef("child_link_receipt", withdrawalReceipt.id, withdrawalReceipt.version)]
                : []),
            ],
          }
        : {}),
    };
  }

  async applyG2Withdrawal(
    input: FamilyCareTransactionInput<G2WithdrawalApplyInput>,
  ): Promise<G2WithdrawalApplied> {
    const item = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: input.item_id, workspaceId: input.workspace_id },
    });
    const updated = await this.transaction.nurtureFamilyCareItem.updateMany({
      where: {
        id: item.id,
        workspaceId: input.workspace_id,
        writerContract: "harness_g2_v1",
        lifecycleState: "active",
        lifecycleHead: input.expected_lifecycle_head,
      },
      data: {
        lifecycleState: "closed",
        lifecycleReason: "family_withdrawn",
        lifecycleHead: { increment: 1 },
        status: "closed",
        closedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("G2 withdrawal lifecycle conflict");
    const event = await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.current_guardian_role_assignment_id,
        eventType: "closed",
        fromStatus: item.status,
        toStatus: "closed",
        relatedMessageId: item.sourceMessageId,
        eventPayload: { lifecycle_reason: "family_withdrawn" },
      },
    });
    const attention = await this.transaction.nurtureTeacherAttentionItem.updateMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_item",
        sourceId: item.id,
        status: "active",
      },
      data: { status: "resolved", aggregateVersion: { increment: 1 } },
    });
    const relatedMessages = await this.transaction.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId: input.workspace_id,
        OR: [
          ...(item.sourceMessageId ? [{ id: item.sourceMessageId }] : []),
          { sourceItemId: item.id },
        ],
      },
      select: { id: true },
    });
    await this.transaction.nurtureChildLinkReceipt.updateMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_message",
        sourceId: { in: relatedMessages.map((message) => message.id) },
        status: "pending",
      },
      data: { status: "blocked", reasonCode: "family_withdrawn", version: { increment: 1 } },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        grantId: item.grantId,
        childCareProcessId: item.childCareProcessId,
        enrollmentId: item.enrollmentId,
        direction: "family_to_org",
        dataClass: item.dataClass,
        sourceType: "family_care_item",
        sourceId: item.id,
        routingAttemptKey: `g2-withdraw:${item.id}:${input.expected_lifecycle_head}`,
        targetScopeType: "care_group",
        targetScopeId: item.careGroupId,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    return {
      item_ref: domainRef("family_care_item", item.id, item.version + 1),
      withdrawal_event_ref: domainRef("family_care_item_event", event.id),
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
      attention_effect: attention.count > 0 ? "resolved" : "unchanged",
    };
  }

  async applyG2Redaction(
    input: FamilyCareTransactionInput<G2RedactMessageApplyInput>,
  ): Promise<G2RedactMessageApplied> {
    const message = await this.transaction.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { id: input.message_id, workspaceId: input.workspace_id },
    });
    const sourceItem = await this.transaction.nurtureFamilyCareItem.findFirst({
      where:
        message.messageKind === "family_message"
          ? { workspaceId: input.workspace_id, sourceMessageId: message.id }
          : message.sourceItemId
            ? { workspaceId: input.workspace_id, id: message.sourceItemId }
            : { workspaceId: input.workspace_id, id: "__no_item__" },
    });
    const expectedScope = message.messageKind === "family_message" ? "source_question" : "reply_local";
    if (input.cascade_scope !== expectedScope) throw new Error("G2 redaction scope mismatch");
    const updated = await this.transaction.nurtureFamilyCareMessage.updateMany({
      where: {
        id: message.id,
        workspaceId: input.workspace_id,
        writerContract: "harness_g2_v1",
        status: "sent",
        aggregateVersion: input.expected_message_version,
      },
      data: {
        status: "redacted",
        body: null,
        bodyStorageMode: "redacted",
        bodyProtectionPayload: Prisma.DbNull,
        attachmentsPayload: Prisma.DbNull,
        redactedAt: new Date(),
        redactedByParticipantId: input.participant_id,
        redactionReason: input.reason_code,
        redactionPayload: { reason_code: input.reason_code },
        aggregateVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("G2 redaction message conflict");

    const affectedRefs: DomainContextRef[] = [
      domainRef("family_care_message", message.id, message.aggregateVersion + 1),
    ];
    for (;;) {
      const corrections = await this.transaction.nurtureFamilyCareMessageCorrection.findMany({
        where: { workspaceId: input.workspace_id, messageId: message.id, status: "active" },
        orderBy: [{ correctionVersion: "asc" }, { id: "asc" }],
        take: CASCADE_PAGE_SIZE,
      });
      if (corrections.length === 0) break;
      for (const correction of corrections) {
        const correctionUpdated = await this.transaction.nurtureFamilyCareMessageCorrection.updateMany({
          where: { id: correction.id, workspaceId: input.workspace_id, status: "active" },
          data: { status: "redacted", bodyProtectionPayload: Prisma.DbNull },
        });
        if (correctionUpdated.count !== 1) throw new Error("G2 correction redaction conflict");
        affectedRefs.push(
          domainRef("family_care_message_correction", correction.id, correction.correctionVersion),
        );
      }
    }

    if (input.cascade_scope === "source_question") {
      for (;;) {
        const items = await this.transaction.nurtureFamilyCareItem.findMany({
          where: {
            workspaceId: input.workspace_id,
            sourceMessageId: message.id,
            writerContract: "harness_g2_v1",
            lifecycleState: { not: "suppressed" },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: CASCADE_PAGE_SIZE,
        });
        if (items.length === 0) break;
        for (const item of items) {
          const itemUpdated = await this.transaction.nurtureFamilyCareItem.updateMany({
            where: {
              id: item.id,
              workspaceId: input.workspace_id,
              version: item.version,
              lifecycleState: item.lifecycleState,
            },
            data: {
              lifecycleState: "suppressed",
              lifecycleReason: "source_redacted",
              lifecycleHead: { increment: 1 },
              status: "suppressed",
              summary: "Content no longer available.",
              detail: null,
              suppressedAt: new Date(),
              suppressionReason: "source_redacted",
              version: { increment: 1 },
            },
          });
          if (itemUpdated.count !== 1) throw new Error("G2 redaction item conflict");
          const event = await this.transaction.nurtureFamilyCareItemEvent.create({
            data: {
              workspaceId: input.workspace_id,
              itemId: item.id,
              actorParticipantId: input.participant_id,
              actorRoleAssignmentId: input.actor_role_assignment_id,
              eventType: "suppressed",
              fromStatus: item.status,
              toStatus: "suppressed",
              relatedMessageId: message.id,
              eventPayload: { reason_code: input.reason_code },
            },
          });
          affectedRefs.push(
            domainRef("family_care_item", item.id, item.version + 1),
            domainRef("family_care_item_event", event.id),
          );
          const attentionRows = await this.transaction.nurtureTeacherAttentionItem.findMany({
            where: {
              workspaceId: input.workspace_id,
              sourceType: "family_care_item",
              sourceId: item.id,
              status: "active",
            },
          });
          for (const attention of attentionRows) {
            const attentionUpdated = await this.transaction.nurtureTeacherAttentionItem.updateMany({
              where: {
                id: attention.id,
                workspaceId: input.workspace_id,
                aggregateVersion: attention.aggregateVersion,
                status: "active",
              },
              data: {
                status: "suppressed",
                title: "Content no longer available",
                summary: null,
                aggregateVersion: { increment: 1 },
              },
            });
            if (attentionUpdated.count !== 1) throw new Error("G2 redaction attention conflict");
            affectedRefs.push(
              domainRef("teacher_attention_item", attention.id, attention.aggregateVersion + 1),
            );
          }
        }
      }
    }

    for (;;) {
      const receipts = await this.transaction.nurtureChildLinkReceipt.findMany({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_message",
          sourceId: message.id,
          status: { in: ["pending", "delivered", "read", "acknowledged"] },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: CASCADE_PAGE_SIZE,
      });
      if (receipts.length === 0) break;
      for (const receipt of receipts) {
        const visible = receipt.status !== "pending";
        const receiptUpdated = await this.transaction.nurtureChildLinkReceipt.updateMany({
          where: {
            id: receipt.id,
            workspaceId: input.workspace_id,
            version: receipt.version,
            status: receipt.status,
          },
          data: {
            status: visible ? "revoked_after_delivery" : "blocked",
            reasonCode: "source_redacted",
            version: { increment: 1 },
          },
        });
        if (receiptUpdated.count !== 1) throw new Error("G2 redaction receipt conflict");
        affectedRefs.push(domainRef("child_link_receipt", receipt.id, receipt.version + 1));
      }
    }

    const finalization: G2RedactionFinalization = {
      cascade_audit_id: input.cascade_audit_id,
      root_message_id: message.id,
      cascade_scope: input.cascade_scope,
      affected_refs: affectedRefs,
    };
    const finalSourceItem = sourceItem
      ? await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
          where: { id: sourceItem.id, workspaceId: input.workspace_id },
        })
      : null;
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion + 1),
      ...(finalSourceItem
        ? {
            item_ref: domainRef(
              "family_care_item",
              finalSourceItem.id,
              finalSourceItem.version,
            ),
          }
        : {}),
      cascade_audit_ref: domainRef("family_care_cascade_audit", input.cascade_audit_id),
      affected_refs: affectedRefs,
      finalization,
    };
  }

  async finalizeG2Redaction(
    input: FamilyCareTransactionInput<G2RedactionFinalization> & {
      command_execution_id: string;
    },
  ): Promise<void> {
    await this.transaction.nurtureFamilyCareCascadeAudit.create({
      data: {
        id: input.cascade_audit_id,
        workspaceId: input.workspace_id,
        rootMessageId: input.root_message_id,
        cascadeScope: input.cascade_scope,
        closureState: "complete",
        affectedRefsPayload: asJson({ schema_version: 1, affected_refs: input.affected_refs }),
        commandExecutionId: input.command_execution_id,
      },
    });
  }

  async loadFamilyCareItemActionFacts(input: FamilyCareTransactionInput<FamilyCareItemActionPayload>): Promise<FamilyCareItemActionFacts> {
    const [participant, role, item] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: { id: input.participant_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_id,
          participantId: input.participant_id,
          workspaceId: input.workspace_id,
          deletedAt: null,
        },
      }),
      this.transaction.nurtureFamilyCareItem.findFirst({
        where: { id: input.item_id, workspaceId: input.workspace_id },
        include: {
          enrollment: true,
          grant: true,
          thread: {
            include: {
              participants: {
                where: {
                  participantId: input.participant_id,
                  roleAssignmentId: input.role_assignment_id,
                  visibilityStatus: "active",
                  deletedAt: null,
                },
                take: 1,
              },
            },
          },
        },
      }),
    ]);
    const roleActive =
      roleCurrent(role, new Date()) &&
      Boolean(role && ["caregiver", "lead_caregiver", "institution_admin"].includes(role.role));
    const scopeMatches = Boolean(
      role &&
        item &&
        ((role.scopeType === "care_group" && role.scopeId === item.careGroupId) ||
          (role.scopeType === "enrollment" && role.scopeId === item.enrollmentId) ||
          (role.scopeType === "institution" && role.scopeId === item.enrollment?.institutionId)),
    );
    const now = new Date();
    const linkedGrant = item?.grant;
    const linkedTargetMatches = Boolean(
      linkedGrant &&
        item.enrollment &&
        ((linkedGrant.grantedToScopeType === "care_group" &&
          linkedGrant.grantedToScopeId === item.careGroupId) ||
          (linkedGrant.grantedToScopeType === "enrollment" &&
            linkedGrant.grantedToScopeId === item.enrollment.id) ||
          (linkedGrant.grantedToScopeType === "institution" &&
            linkedGrant.grantedToScopeId === item.enrollment.institutionId)),
    );
    const linkedGrantCurrent = Boolean(
      linkedGrant &&
        linkedGrant.status === "active" &&
        linkedGrant.deletedAt === null &&
        !linkedGrant.revokedAt &&
        (!linkedGrant.effectiveFrom || linkedGrant.effectiveFrom <= now) &&
        (!linkedGrant.expiresAt || linkedGrant.expiresAt > now) &&
        linkedGrant.directions.includes("family_to_org") &&
        linkedGrant.dataClasses.includes(item!.dataClass) &&
        linkedTargetMatches,
    );
    const linkedGrantRevoked = Boolean(
      linkedGrant && (linkedGrant.status === "revoked" || linkedGrant.revokedAt),
    );
    const unavailableLinkedGrant: FamilyCareCurrentGrant = linkedGrant
      ? {
          grant_id: linkedGrant.id,
          status: linkedGrantRevoked ? "revoked" : "missing",
          directions: linkedGrant.directions,
          data_classes: linkedGrant.dataClasses,
          target_scope_type: linkedGrant.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: linkedGrant.grantedToScopeId,
        }
      : {
          grant_id: "missing",
          status: "missing",
          directions: [],
          data_classes: [],
          target_scope_type: "care_group",
          target_scope_id: item?.careGroupId ?? "missing",
        };
    const grant =
      item?.enrollment && linkedGrantCurrent
        ? input.required_direction === "family_to_org"
          ? {
              grant_id: linkedGrant!.id,
              status: "active" as const,
              directions: linkedGrant!.directions,
              data_classes: linkedGrant!.dataClasses,
              target_scope_type: linkedGrant!
                .grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
              target_scope_id: linkedGrant!.grantedToScopeId,
            }
          : await this.currentGrant({
              workspace_id: input.workspace_id,
              child_care_process_id: item.childCareProcessId,
              enrollment_id: item.enrollment.id,
              care_group_id: item.careGroupId,
              institution_id: item.enrollment.institutionId,
              data_class: item.dataClass,
              direction: input.required_direction,
            })
        : unavailableLinkedGrant;
    const receipt = item?.sourceMessageId
      ? await this.transaction.nurtureChildLinkReceipt.findFirst({
          where: {
            workspaceId: input.workspace_id,
            direction: "family_to_org",
            sourceType: "family_care_message",
            sourceId: item.sourceMessageId,
            status: { in: ["delivered", "read", "acknowledged"] },
          },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        })
      : null;
    return {
      participant_active: Boolean(participant),
      caregiver_role_active: roleActive,
      caregiver_scope_matches: scopeMatches,
      enrollment_active: Boolean(
        item?.enrollment?.status === "active" &&
          item.enrollment.deletedAt === null &&
          (!item.enrollment.leftAt || item.enrollment.leftAt > new Date()),
      ),
      thread_active: Boolean(item?.thread.status === "active" && item.thread.deletedAt === null),
      thread_membership_active: Boolean(item?.thread.participants.length),
      grant,
      item_status: item?.status ?? "missing",
      item_version: item?.version ?? -1,
      ...(item ? { child_care_process_id: item.childCareProcessId } : {}),
      ...(item ? { item_data_class: item.dataClass } : {}),
      output_refs: [
        ...(item ? [domainRef("family_care_item", item.id, item.version)] : []),
        ...(receipt ? [domainRef("child_link_receipt", receipt.id, receipt.version)] : []),
      ],
    };
  }

  async acknowledgeFamilyCareItem(input: FamilyCareTransactionInput<FamilyCareItemActionPayload>) {
    const updated = await this.transaction.nurtureFamilyCareItem.updateMany({
      where: {
        id: input.item_id,
        workspaceId: input.workspace_id,
        version: input.expected_version,
        status: "open",
        // Single-writer cutover (10-g2-schema-freeze.md C6/C8): legacy
        // handlers must never mutate a harness-managed row, whose canonical
        // state lives on the three axes rather than this status column.
        writerContract: "legacy_v1",
      },
      data: {
        status: "acknowledged",
        ackedByParticipantId: input.participant_id,
        ackedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("item acknowledge conflict");
    const item = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: input.item_id, workspaceId: input.workspace_id },
    });
    const event = await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.role_assignment_id,
        eventType: "acknowledged",
        fromStatus: "open",
        toStatus: "acknowledged",
      },
    });
    const receipt = item.sourceMessageId
      ? await this.transaction.nurtureChildLinkReceipt.findFirst({
          where: {
            workspaceId: input.workspace_id,
            direction: "family_to_org",
            sourceType: "family_care_message",
            sourceId: item.sourceMessageId,
          },
        })
      : null;
    let receiptVersion = receipt?.version;
    if (receipt && ["delivered", "read"].includes(receipt.status)) {
      const receiptUpdated = await this.transaction.nurtureChildLinkReceipt.updateMany({
        where: { id: receipt.id, workspaceId: input.workspace_id, version: receipt.version },
        data: { status: "acknowledged", acknowledgedAt: new Date(), version: { increment: 1 } },
      });
      if (receiptUpdated.count !== 1) throw new Error("receipt acknowledge conflict");
      receiptVersion = receipt.version + 1;
    }
    return {
      item_ref: domainRef("family_care_item", item.id, item.version),
      item_event_ref: domainRef("family_care_item_event", event.id, 1),
      ...(receipt && receiptVersion !== undefined
        ? { receipt_ref: domainRef("child_link_receipt", receipt.id, receiptVersion) }
        : {}),
    };
  }

  async replyToFamilyCareItem(input: FamilyCareTransactionInput<FamilyCareReplyPayload>): Promise<FamilyCareReplyApplied> {
    const item = await this.transaction.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: input.item_id, workspaceId: input.workspace_id },
      include: { enrollment: true },
    });
    if (!item.enrollment) throw new Error("reply enrollment missing");
    // Single-writer cutover (C6/C8): the legacy reply path is read/migration
    // compatibility only and must fail closed on harness-managed rows.
    if (item.writerContract !== "legacy_v1") {
      throw new Error("legacy reply cannot write a harness-managed item");
    }
    const grant = await this.currentGrant({
      workspace_id: input.workspace_id,
      child_care_process_id: item.childCareProcessId,
      enrollment_id: item.enrollment.id,
      care_group_id: item.careGroupId,
      institution_id: item.enrollment.institutionId,
      data_class: item.dataClass,
      direction: "org_to_family",
    });
    if (grant.status !== "active") throw new Error("reply grant changed");
    const message = await this.transaction.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: input.workspace_id,
        threadId: item.threadId,
        childCareProcessId: item.childCareProcessId,
        senderParticipantId: input.participant_id,
        senderRoleAssignmentId: input.role_assignment_id,
        messageKind: "caregiver_reply",
        authorshipKind: "caregiver_confirmed",
        sourceItemId: item.id,
        bodyFormat: "plain_text",
        bodyStorageMode: "protected",
        bodyProtectionPayload: asJson({ content_ref: input.protected_content_ref }),
        attachmentsPayload: asJson({ attachment_refs: [] }),
        sourceSurface: "workflow",
        grantId: grant.grant_id,
        status: "sent",
      },
    });
    const updated = await this.transaction.nurtureFamilyCareItem.updateMany({
      where: {
        id: item.id,
        workspaceId: input.workspace_id,
        version: input.expected_version,
        status: { in: ["open", "acknowledged", "waiting_for_family"] },
        writerContract: "legacy_v1",
      },
      data: {
        status: "replied",
        linkedReplyMessageId: message.id,
        activeClarificationRequestEventId: null,
        waitingForFamilySince: null,
        waitingForFamilyUntil: null,
        clarificationExpiryDriverRef: Prisma.DbNull,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("reply item conflict");
    const event = await this.transaction.nurtureFamilyCareItemEvent.create({
      data: {
        workspaceId: input.workspace_id,
        itemId: item.id,
        actorParticipantId: input.participant_id,
        actorRoleAssignmentId: input.role_assignment_id,
        eventType: "replied",
        fromStatus: item.status,
        toStatus: "replied",
        relatedMessageId: message.id,
      },
    });
    await this.transaction.nurtureFamilyCareMessage.update({
      where: { id: message.id },
      data: { sourceItemEventId: event.id },
    });
    const receipt = await this.transaction.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: input.workspace_id,
        grantId: grant.grant_id,
        childCareProcessId: item.childCareProcessId,
        enrollmentId: item.enrollment.id,
        direction: "org_to_family",
        dataClass: item.dataClass,
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: input.routing_attempt_key,
        targetScopeType: "family",
        targetScopeId: item.familyId,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    const threadUpdated = await this.transaction.nurtureFamilyCareThread.updateMany({
      where: {
        id: item.threadId,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
      data: { latestMessageAt: message.createdAt, aggregateVersion: { increment: 1 } },
    });
    if (threadUpdated.count !== 1) throw new Error("reply thread inactive");
    await this.transaction.nurtureTeacherAttentionItem.updateMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_item",
        sourceId: item.id,
        status: "active",
      },
      data: { status: "resolved", aggregateVersion: { increment: 1 } },
    });
    return {
      item_ref: domainRef("family_care_item", item.id, item.version + 1),
      item_event_ref: domainRef("family_care_item_event", event.id, 1),
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion),
      receipt_ref: domainRef("child_link_receipt", receipt.id, receipt.version),
    };
  }

  async loadFamilyCareRedactionFacts(input: FamilyCareTransactionInput<FamilyCareRedactionPayload>): Promise<FamilyCareRedactionFacts> {
    const [participant, role, message] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: { id: input.participant_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_id,
          participantId: input.participant_id,
          workspaceId: input.workspace_id,
          deletedAt: null,
        },
      }),
      this.transaction.nurtureFamilyCareMessage.findFirst({
        where: { id: input.message_id, workspaceId: input.workspace_id },
      }),
    ]);
    return {
      participant_active: Boolean(participant),
      author_role_active: roleCurrent(role, new Date()),
      actor_is_author: Boolean(
        message &&
          message.senderParticipantId === input.participant_id &&
          message.senderRoleAssignmentId === input.role_assignment_id,
      ),
      message_status: message?.status ?? "missing",
      message_version: message?.aggregateVersion ?? -1,
      ...(message ? { child_care_process_id: message.childCareProcessId } : {}),
      output_refs: message
        ? [domainRef("family_care_message", message.id, message.aggregateVersion)]
        : [],
    };
  }

  async redactFamilyCareMessage(input: FamilyCareTransactionInput<FamilyCareRedactionPayload>) {
    const message = await this.transaction.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { id: input.message_id, workspaceId: input.workspace_id },
    });
    const updated = await this.transaction.nurtureFamilyCareMessage.updateMany({
      where: {
        id: input.message_id,
        workspaceId: input.workspace_id,
        aggregateVersion: input.expected_version,
        status: "sent",
        // Single-writer cutover (C6/C8): harness-managed messages are
        // redacted only by the Increment 2 author capability.
        writerContract: "legacy_v1",
      },
      data: {
        status: "redacted",
        body: null,
        bodyStorageMode: "redacted",
        bodyProtectionPayload: Prisma.DbNull,
        attachmentsPayload: Prisma.DbNull,
        redactedAt: new Date(),
        redactedByParticipantId: input.participant_id,
        redactionReason: input.reason_code,
        redactionPayload: { reason_code: input.reason_code },
        aggregateVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("message redaction conflict");
    const affectedItems =
      message.messageKind === "family_message"
        ? await this.transaction.nurtureFamilyCareItem.findMany({
            where: {
              workspaceId: input.workspace_id,
              sourceMessageId: message.id,
              status: { notIn: ["closed", "expired", "suppressed"] },
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 100,
          })
        : [];
    for (const item of affectedItems) {
      const itemUpdated = await this.transaction.nurtureFamilyCareItem.updateMany({
        where: { id: item.id, workspaceId: input.workspace_id, version: item.version },
        data: {
          status: "suppressed",
          summary: "Content no longer available.",
          detail: null,
          suppressedAt: new Date(),
          suppressionReason: "source_redacted",
          version: { increment: 1 },
        },
      });
      if (itemUpdated.count !== 1) throw new Error("message redaction item conflict");
      await this.transaction.nurtureFamilyCareItemEvent.create({
        data: {
          workspaceId: input.workspace_id,
          itemId: item.id,
          actorParticipantId: input.participant_id,
          actorRoleAssignmentId: input.role_assignment_id,
          eventType: "suppressed",
          fromStatus: item.status,
          toStatus: "suppressed",
          relatedMessageId: message.id,
          eventPayload: { reason_code: "source_redacted" },
        },
      });
      await this.transaction.nurtureTeacherAttentionItem.updateMany({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_item",
          sourceId: item.id,
          status: "active",
        },
        data: {
          status: "suppressed",
          title: "Content no longer available",
          summary: null,
          aggregateVersion: { increment: 1 },
        },
      });
    }
    const receipts = await this.transaction.nurtureChildLinkReceipt.findMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_message",
        sourceId: message.id,
        status: { notIn: ["blocked", "failed", "revoked_after_delivery"] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    for (const receipt of receipts) {
      const visible = ["delivered", "read", "acknowledged"].includes(receipt.status);
      const receiptUpdated = await this.transaction.nurtureChildLinkReceipt.updateMany({
        where: { id: receipt.id, workspaceId: input.workspace_id, version: receipt.version },
        data: {
          status: visible ? "revoked_after_delivery" : "blocked",
          reasonCode: "source_redacted",
          version: { increment: 1 },
        },
      });
      if (receiptUpdated.count !== 1) throw new Error("message redaction receipt conflict");
    }
    return {
      message_ref: domainRef("family_care_message", message.id, message.aggregateVersion + 1),
      // The immediate convergence and returned refs are bounded. Owner reads
      // still fence any older fan-out against the redacted source message.
      affected_item_refs: affectedItems.slice(0, 15).map((item) =>
        domainRef("family_care_item", item.id, item.version + 1),
      ),
      affected_receipt_refs: receipts.slice(0, 15).map((receipt) =>
        domainRef("child_link_receipt", receipt.id, receipt.version + 1),
      ),
    };
  }

  async loadFamilyCareCancelRouteFacts(input: FamilyCareTransactionInput<FamilyCareCancelRoutePayload>): Promise<FamilyCareCancelRouteFacts> {
    const [participant, role, receipt] = await Promise.all([
      this.transaction.nurtureParticipant.findFirst({
        where: { id: input.participant_id, workspaceId: input.workspace_id, status: "active", deletedAt: null },
      }),
      this.transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_id,
          participantId: input.participant_id,
          workspaceId: input.workspace_id,
          deletedAt: null,
        },
      }),
      this.transaction.nurtureChildLinkReceipt.findFirst({
        where: {
          id: input.receipt_id,
          workspaceId: input.workspace_id,
          direction: "family_to_org",
          sourceType: "family_care_message",
        },
      }),
    ]);
    const sourceMessage = receipt
      ? await this.transaction.nurtureFamilyCareMessage.findFirst({
          where: {
            id: receipt.sourceId,
            workspaceId: input.workspace_id,
            senderParticipantId: input.participant_id,
            senderRoleAssignmentId: input.role_assignment_id,
          },
        })
      : null;
    return {
      participant_active: Boolean(participant),
      actor_owns_source: Boolean(sourceMessage && roleCurrent(role, new Date())),
      receipt_status: receipt?.status ?? "missing",
      receipt_version: receipt?.version ?? -1,
      ...(receipt ? { child_care_process_id: receipt.childCareProcessId } : {}),
      ...(receipt?.reasonCode ? { receipt_reason_code: receipt.reasonCode } : {}),
      output_refs: receipt ? [domainRef("child_link_receipt", receipt.id, receipt.version)] : [],
    };
  }

  async cancelFamilyCareRoute(input: FamilyCareTransactionInput<FamilyCareCancelRoutePayload>) {
    const updated = await this.transaction.nurtureChildLinkReceipt.updateMany({
      where: {
        id: input.receipt_id,
        workspaceId: input.workspace_id,
        version: input.expected_version,
        status: "pending",
      },
      data: {
        status: "blocked",
        reasonCode: "user_cancelled_before_delivery",
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("route cancel conflict");
    return { receipt_ref: domainRef("child_link_receipt", input.receipt_id, input.expected_version + 1) };
  }
}
