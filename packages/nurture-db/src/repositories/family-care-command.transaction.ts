import { Prisma } from "@prisma/client";
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
  NurtureFamilyCareCommandTransaction,
} from "@the-nurture/scenario";
import type { DomainContextRef } from "@my-chat/workflow-contracts";

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const domainRef = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  namespace: "nurture",
  consumer_scenario_key: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
  owner_scope: "workspace",
});

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
  constructor(private readonly transaction: Prisma.TransactionClient) {}

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
          target_scope_type: fallback.grantedToScopeType as FamilyCareCurrentGrant["target_scope_type"],
          target_scope_id: fallback.grantedToScopeId,
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

    const receipts = await this.transaction.nurtureChildLinkReceipt.findMany({
      where: {
        workspaceId: input.workspace_id,
        grantId: input.grant_id,
        status: { in: ["pending", "delivered", "read", "acknowledged"] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    });
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
    }

    const items = await this.transaction.nurtureFamilyCareItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        grantId: input.grant_id,
        status: { in: ["open", "acknowledged", "waiting_for_family", "replied", "followed_up"] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    });
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
    }
    return {
      grant_ref: domainRef("child_link_grant", input.grant_id, input.expected_version + 1),
      affected_item_refs: items.slice(0, 15).map((item) =>
        domainRef("family_care_item", item.id, item.version + 1),
      ),
      affected_receipt_refs: receipts.slice(0, 15).map((receipt) =>
        domainRef("child_link_receipt", receipt.id, receipt.version + 1),
      ),
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
