import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  NurtureActorBinding,
  NurtureInstitutionContextRepository,
  NurtureParticipantFact,
  NurturePolicyFacts,
  NurturePolicyFactRequest,
  NurtureWorkScope,
  ResolutionCandidate,
} from "@the-nurture/scenario";

type RoleRow = Awaited<ReturnType<PrismaClient["nurtureCareRoleAssignment"]["findFirst"]>>;

const isCurrent = (startsAt: Date | null, endsAt: Date | null, at: Date): boolean =>
  (!startsAt || startsAt <= at) && (!endsAt || endsAt > at);

const participantFact = (row: {
  id: string;
  workspaceId: string;
  myChatUserId: string;
  displayName: string | null;
}): NurtureParticipantFact => ({
  workspace_id: row.workspaceId,
  participant_id: row.id,
  my_chat_user_id: row.myChatUserId,
  ...(row.displayName ? { display_name: row.displayName } : {}),
});

const sourceMatch = (
  text: string | undefined,
  safeSummary: string | null | undefined,
): ResolutionCandidate["match_class"] => {
  const normalized = text?.trim().toLocaleLowerCase();
  if (normalized && safeSummary?.toLocaleLowerCase().includes(normalized)) return "exact_topic_or_date";
  if (normalized && /(^|\s)(continue|resume)(\s|$)|继续|接着/.test(normalized)) {
    return "explicit_continuation";
  }
  return "weak_recent_context";
};

export class PrismaInstitutionContextRepository implements NurtureInstitutionContextRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listActiveParticipants(input: {
    workspace_id?: string;
    my_chat_user_id: string;
    limit: number;
  }): Promise<NurtureParticipantFact[]> {
    const rows = await this.prisma.nurtureParticipant.findMany({
      where: {
        ...(input.workspace_id ? { workspaceId: input.workspace_id } : {}),
        myChatUserId: input.my_chat_user_id,
        status: "active",
        deletedAt: null,
      },
      orderBy: { id: "asc" },
      take: input.limit,
    });
    return rows.map(participantFact);
  }

  private async workScopeForRole(
    row: NonNullable<RoleRow>,
  ): Promise<{ work_scope: NurtureWorkScope; safe_scope_label?: string } | null> {
    switch (row.scopeType) {
      case "child_care_process": {
        const process = await this.prisma.nurtureChildCareProcess.findFirst({
          where: {
            id: row.scopeId,
            workspaceId: row.workspaceId,
            status: "active",
            deletedAt: null,
          },
          include: { child: { select: { displayName: true } } },
        });
        return process
          ? {
              work_scope: { kind: "child_process", child_care_process_id: row.scopeId },
              safe_scope_label: process.child.displayName,
            }
          : null;
      }
      case "family": {
        const family = await this.prisma.nurtureFamily.findFirst({
          where: { id: row.scopeId, workspaceId: row.workspaceId, status: "active", deletedAt: null },
        });
        return family
          ? { work_scope: {
              kind: "family",
              family_id: family.id,
              child_care_process_id: family.childCareProcessId,
            }, ...(family.displayName ? { safe_scope_label: family.displayName } : {}) }
          : null;
      }
      case "care_group": {
        const group = await this.prisma.nurtureCareGroup.findFirst({
          where: {
            id: row.scopeId,
            workspaceId: row.workspaceId,
            status: "active",
            deletedAt: null,
          },
        });
        return group
          ? {
              work_scope: { kind: "care_group", care_group_id: row.scopeId },
              safe_scope_label: group.name,
            }
          : null;
      }
      case "institution": {
        const institution = await this.prisma.nurtureCareInstitution.findFirst({
          where: {
            id: row.scopeId,
            workspaceId: row.workspaceId,
            status: "active",
            deletedAt: null,
          },
        });
        return institution
          ? {
              work_scope: { kind: "institution", institution_id: row.scopeId },
              safe_scope_label: institution.displayName,
            }
          : null;
      }
      case "enrollment": {
        const enrollment = await this.prisma.nurtureEnrollment.findFirst({
          where: {
            id: row.scopeId,
            workspaceId: row.workspaceId,
            status: "active",
            deletedAt: null,
          },
        });
        return enrollment
          ? { work_scope: {
              kind: "care_group",
              care_group_id: enrollment.careGroupId,
              institution_id: enrollment.institutionId,
              enrollment_id: enrollment.id,
              child_care_process_id: enrollment.childCareProcessId,
            } }
          : null;
      }
    }
  }

  private async mapBinding(row: NonNullable<RoleRow>): Promise<NurtureActorBinding | null> {
    const resolvedScope = await this.workScopeForRole(row);
    if (!resolvedScope) return null;
    return {
      actor_binding_ref: row.id,
      participant_id: row.participantId,
      role_assignment_id: row.id,
      role_kind: row.role,
      scope_type: row.scopeType,
      scope_id: row.scopeId,
      work_scope: resolvedScope.work_scope,
      ...(resolvedScope.safe_scope_label
        ? { safe_scope_label: resolvedScope.safe_scope_label }
        : {}),
    };
  }

  async listActiveActorBindings(input: {
    workspace_id: string;
    participant_id: string;
    at: string;
    limit: number;
  }): Promise<NurtureActorBinding[]> {
    const at = new Date(input.at);
    const rows = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        status: "active",
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: at } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: at } }] }],
      },
      orderBy: { id: "asc" },
      take: input.limit,
    });
    const mapped = await Promise.all(rows.map((row) => this.mapBinding(row)));
    return mapped.filter((row): row is NurtureActorBinding => row !== null);
  }

  private scopeWhere(
    binding: NurtureActorBinding,
    kind: "item" | "attention" | "thread",
  ): Prisma.NurtureFamilyCareItemWhereInput | Prisma.NurtureTeacherAttentionItemWhereInput | Prisma.NurtureFamilyCareThreadWhereInput {
    const scope = binding.work_scope;
    if (scope.child_care_process_id && binding.scope_type === "child_care_process") {
      return { childCareProcessId: scope.child_care_process_id };
    }
    if (scope.family_id && kind !== "attention") return { familyId: scope.family_id };
    if (scope.enrollment_id && kind !== "attention") return { enrollmentId: scope.enrollment_id };
    if (scope.care_group_id) return { careGroupId: scope.care_group_id };
    if (scope.institution_id) {
      return kind === "attention"
        ? { careGroup: { institutionId: scope.institution_id } }
        : { careGroup: { institutionId: scope.institution_id } };
    }
    return { id: "__unreachable__" };
  }

  private caregiverReceiveReason(
    binding: NurtureActorBinding,
    row: {
      dataClass: string;
      enrollment: { status: string } | null;
      grant: {
        status: string;
        directions: string[];
        dataClasses: string[];
        effectiveFrom: Date | null;
        expiresAt: Date | null;
        revokedAt: Date | null;
      } | null;
    },
    at: Date,
  ): "allowed" | "grant_missing" | "grant_revoked" | "enrollment_inactive" {
    if (binding.role_kind === "guardian") return "allowed";
    const grant = row.grant;
    if (row.enrollment?.status !== "active") return "enrollment_inactive";
    if (grant?.status === "revoked" || grant?.revokedAt) return "grant_revoked";
    if (
      !grant ||
      grant.status !== "active" ||
      (grant.effectiveFrom && grant.effectiveFrom > at) ||
      (grant.expiresAt && grant.expiresAt <= at) ||
      !grant.directions.includes("family_to_org") ||
      !grant.dataClasses.includes(row.dataClass)
    ) {
      return "grant_missing";
    }
    return "allowed";
  }

  private caregiverCanReceive(
    binding: NurtureActorBinding,
    row: Parameters<PrismaInstitutionContextRepository["caregiverReceiveReason"]>[1],
    at: Date,
  ): boolean {
    return this.caregiverReceiveReason(binding, row, at) === "allowed";
  }

  private caregiverThreadReadReason(
    binding: NurtureActorBinding,
    row: {
      enrollment: {
        id: string;
        institutionId: string;
        careGroupId: string;
        status: string;
        grants: Array<{
          status: string;
          directions: string[];
          effectiveFrom: Date | null;
          expiresAt: Date | null;
          revokedAt: Date | null;
          grantedToScopeType: string;
          grantedToScopeId: string;
        }>;
      } | null;
    },
    at: Date,
  ): "allowed" | "grant_missing" | "grant_revoked" | "enrollment_inactive" {
    if (binding.role_kind === "guardian") return "allowed";
    const enrollment = row.enrollment;
    if (!enrollment || enrollment.status !== "active") return "enrollment_inactive";
    const applicable = enrollment.grants.filter(
      (grant) =>
        (grant.grantedToScopeType === "care_group" &&
          grant.grantedToScopeId === enrollment.careGroupId) ||
        (grant.grantedToScopeType === "institution" &&
          grant.grantedToScopeId === enrollment.institutionId) ||
        (grant.grantedToScopeType === "enrollment" &&
          grant.grantedToScopeId === enrollment.id),
    );
    const allowed = applicable.some(
      (grant) =>
        grant.status === "active" &&
        !grant.revokedAt &&
        (!grant.effectiveFrom || grant.effectiveFrom <= at) &&
        (!grant.expiresAt || grant.expiresAt > at) &&
        grant.directions.includes("family_to_org"),
    );
    if (allowed) return "allowed";
    return applicable.some((grant) => grant.status === "revoked" || grant.revokedAt)
      ? "grant_revoked"
      : "grant_missing";
  }

  private caregiverCanReadThread(
    binding: NurtureActorBinding,
    row: Parameters<PrismaInstitutionContextRepository["caregiverThreadReadReason"]>[1],
    at: Date,
  ): boolean {
    return this.caregiverThreadReadReason(binding, row, at) === "allowed";
  }

  async listResolutionCandidates(input: Parameters<NurtureInstitutionContextRepository["listResolutionCandidates"]>[0]): Promise<ResolutionCandidate[]> {
    const at = new Date(input.at);
    const text = input.query_text;
    const perBinding = Math.max(1, Math.ceil(input.limit / Math.max(1, input.actor_bindings.length)));

    const candidateGroups = await Promise.all(input.actor_bindings.map(async (binding) => {
      const candidates: ResolutionCandidate[] = [];
      if (input.source_key === "family_care_item") {
        const rows = await this.prisma.nurtureFamilyCareItem.findMany({
          where: {
            workspaceId: input.workspace_id,
            status: { in: ["open", "acknowledged", "replied", "followed_up"] },
            AND: [this.scopeWhere(binding, "item") as Prisma.NurtureFamilyCareItemWhereInput],
          },
          include: { grant: true, enrollment: true },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: perBinding,
        });
        for (const row of rows) {
          if (!this.caregiverCanReceive(binding, row, at)) continue;
          candidates.push({
            candidate_key: `${binding.actor_binding_ref}:family_care_item:${row.id}`,
            actor_binding_ref: binding.actor_binding_ref,
            scope_ref: { kind: binding.work_scope.kind, id: binding.scope_id },
            target_ref: {
              object_type: "family_care_item",
              object_id: row.id,
              lifecycle_state: row.status,
              child_care_process_id: row.childCareProcessId,
            },
            intent_key: input.intent_key,
            source_key: input.source_key,
            state_class: "actionable",
            match_class: sourceMatch(text, row.summary),
            evidence_codes: ["nonterminal_item", `category:${row.category}`],
            occurred_at: row.updatedAt.toISOString(),
            dedupe_key: `${binding.actor_binding_ref}:family_care_item:${row.id}`,
            safe_label: row.summary,
          });
        }
      } else if (input.source_key === "teacher_attention_item") {
        const rows = await this.prisma.nurtureTeacherAttentionItem.findMany({
          where: {
            workspaceId: input.workspace_id,
            status: "active",
            AND: [this.scopeWhere(binding, "attention") as Prisma.NurtureTeacherAttentionItemWhereInput],
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: perBinding,
        });
        const backingItemIds = rows.flatMap((row) =>
          row.sourceType === "family_care_item" && row.sourceId ? [row.sourceId] : [],
        );
        const backingItems = backingItemIds.length
          ? await this.prisma.nurtureFamilyCareItem.findMany({
              where: {
                workspaceId: input.workspace_id,
                id: { in: backingItemIds },
                status: { in: ["open", "acknowledged", "replied", "followed_up"] },
              },
              include: { grant: true, enrollment: true },
            })
          : [];
        const backingById = new Map(backingItems.map((row) => [row.id, row]));
        for (const row of rows) {
          const backedByItem = row.sourceType === "family_care_item" && row.sourceId;
          const backingItem = backedByItem ? backingById.get(row.sourceId!) : undefined;
          if (backedByItem && (!backingItem || !this.caregiverCanReceive(binding, backingItem, at))) {
            continue;
          }
          candidates.push({
            candidate_key: `${binding.actor_binding_ref}:teacher_attention_item:${row.id}`,
            actor_binding_ref: binding.actor_binding_ref,
            scope_ref: { kind: binding.work_scope.kind, id: binding.scope_id },
            target_ref: {
              object_type: backedByItem ? "family_care_item" : "teacher_attention_item",
              object_id: backedByItem ? row.sourceId! : row.id,
              lifecycle_state: backingItem?.status ?? "active",
              child_care_process_id: row.childCareProcessId,
            },
            intent_key: input.intent_key,
            source_key: input.source_key,
            state_class: "actionable",
            match_class: sourceMatch(text, row.summary ?? row.title),
            evidence_codes: ["active_attention", `source:${row.sourceType}`],
            occurred_at: row.updatedAt.toISOString(),
            dedupe_key: backedByItem
              ? `${binding.actor_binding_ref}:family_care_item:${row.sourceId}`
              : `${binding.actor_binding_ref}:teacher_attention_item:${row.id}`,
            safe_label: row.title,
            ...(row.summary ? { safe_description: row.summary } : {}),
          });
        }
      } else if (input.source_key === "family_care_thread") {
        if (!/continue|reply|view|inbox|attention/.test(input.intent_key)) return candidates;
        const rows = await this.prisma.nurtureFamilyCareThread.findMany({
          where: {
            workspaceId: input.workspace_id,
            status: "active",
            participants: {
              some: {
                participantId: input.participant.participant_id,
                roleAssignmentId: binding.role_assignment_id,
                visibilityStatus: "active",
                deletedAt: null,
              },
            },
            AND: [this.scopeWhere(binding, "thread") as Prisma.NurtureFamilyCareThreadWhereInput],
          },
          include: { enrollment: { include: { grants: true } } },
          orderBy: [{ latestMessageAt: "desc" }, { id: "asc" }],
          take: perBinding,
        });
        for (const row of rows) {
          if (!this.caregiverCanReadThread(binding, row, at)) continue;
          candidates.push({
            candidate_key: `${binding.actor_binding_ref}:family_care_thread:${row.id}`,
            actor_binding_ref: binding.actor_binding_ref,
            scope_ref: { kind: binding.work_scope.kind, id: binding.scope_id },
            target_ref: {
              object_type: "family_care_thread",
              object_id: row.id,
              lifecycle_state: row.status,
              child_care_process_id: row.childCareProcessId,
            },
            intent_key: input.intent_key,
            source_key: input.source_key,
            state_class: "active_context",
            match_class: sourceMatch(text, undefined),
            evidence_codes: ["active_private_thread"],
            ...(row.latestMessageAt ? { occurred_at: row.latestMessageAt.toISOString() } : {}),
            dedupe_key: `${binding.actor_binding_ref}:family_care_thread:${row.id}`,
            safe_label: "Family care conversation",
          });
        }
      }
      return candidates;
    }));
    return candidateGroups.flat().slice(0, input.limit);
  }

  private async roleReachesChild(
    workspaceId: string,
    binding: NurtureActorBinding,
    childCareProcessId: string | undefined,
  ): Promise<boolean> {
    if (!childCareProcessId) return false;
    switch (binding.scope_type) {
      case "child_care_process":
        return binding.scope_id === childCareProcessId;
      case "family":
        return Boolean(
          await this.prisma.nurtureFamily.findFirst({
            where: {
              id: binding.scope_id,
              workspaceId,
              childCareProcessId,
              status: "active",
              deletedAt: null,
            },
            select: { id: true },
          }),
        );
      case "enrollment":
        return Boolean(
          await this.prisma.nurtureEnrollment.findFirst({
            where: {
              id: binding.scope_id,
              workspaceId,
              childCareProcessId,
              status: "active",
              deletedAt: null,
            },
            select: { id: true },
          }),
        );
      case "care_group":
        return Boolean(
          await this.prisma.nurtureEnrollment.findFirst({
            where: {
              careGroupId: binding.scope_id,
              workspaceId,
              childCareProcessId,
              status: "active",
              deletedAt: null,
            },
            select: { id: true },
          }),
        );
      case "institution":
        return Boolean(
          await this.prisma.nurtureEnrollment.findFirst({
            where: {
              institutionId: binding.scope_id,
              workspaceId,
              childCareProcessId,
              status: "active",
              deletedAt: null,
            },
            select: { id: true },
          }),
        );
    }
  }

  async revalidateResolutionCandidate(input: Parameters<NurtureInstitutionContextRepository["revalidateResolutionCandidate"]>[0]): ReturnType<NurtureInstitutionContextRepository["revalidateResolutionCandidate"]> {
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) return { current: false, reason_code: "participant_missing" };
    const role = await this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        id: input.candidate.actor_binding_ref,
        participantId: input.participant_id,
        workspaceId: input.workspace_id,
        deletedAt: null,
      },
    });
    if (!role) return { current: false, reason_code: "role_missing" };
    if (role.status !== "active" || !isCurrent(role.startsAt, role.endsAt, new Date(input.at))) {
      return { current: false, reason_code: "role_revoked" };
    }
    const binding = await this.mapBinding(role);
    if (!binding) return { current: false, reason_code: "scope_mismatch" };
    const target = input.candidate.target_ref;
    let currentCandidate = input.candidate;
    if (
      target?.child_care_process_id &&
      !(await this.roleReachesChild(input.workspace_id, binding, target.child_care_process_id))
    ) {
      return { current: false, reason_code: "child_not_visible" };
    }
    if (target?.object_type === "family_care_item") {
      const row = await this.prisma.nurtureFamilyCareItem.findFirst({
        where: {
          id: target.object_id,
          workspaceId: input.workspace_id,
          status: { in: ["open", "acknowledged", "replied", "followed_up"] },
        },
        include: { grant: true, enrollment: true },
      });
      if (!row) return { current: false, reason_code: "scope_mismatch" };
      const receiveReason = this.caregiverReceiveReason(binding, row, new Date(input.at));
      if (receiveReason !== "allowed") return { current: false, reason_code: receiveReason };
      currentCandidate = {
        ...currentCandidate,
        target_ref: {
          ...currentCandidate.target_ref!,
          lifecycle_state: row.status,
          child_care_process_id: row.childCareProcessId,
        },
      };
    } else if (target?.object_type === "teacher_attention_item") {
      const row = await this.prisma.nurtureTeacherAttentionItem.findFirst({
        where: { id: target.object_id, workspaceId: input.workspace_id, status: "active" },
      });
      if (!row) return { current: false, reason_code: "scope_mismatch" };
      currentCandidate = {
        ...currentCandidate,
        target_ref: { ...currentCandidate.target_ref!, lifecycle_state: row.status },
      };
    } else if (target?.object_type === "family_care_thread") {
      const row = await this.prisma.nurtureFamilyCareThread.findFirst({
        where: { id: target.object_id, workspaceId: input.workspace_id, status: "active" },
        include: { enrollment: { include: { grants: true } } },
      });
      if (!row) return { current: false, reason_code: "thread_inactive" };
      const readReason = this.caregiverThreadReadReason(binding, row, new Date(input.at));
      if (readReason !== "allowed") return { current: false, reason_code: readReason };
      currentCandidate = {
        ...currentCandidate,
        target_ref: {
          ...currentCandidate.target_ref!,
          lifecycle_state: row.status,
          child_care_process_id: row.childCareProcessId,
        },
      };
    }
    return {
      current: true,
      participant: participantFact(participant),
      actor_binding: binding,
      candidate: currentCandidate,
    };
  }

  async loadPolicyFacts(input: NurturePolicyFactRequest): Promise<NurturePolicyFacts> {
    const context = input.resolved_context;
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: context.actor.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    const role = await this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        id: context.actor.role_assignment_id,
        participantId: context.actor.participant_id,
        workspaceId: input.workspace_id,
        deletedAt: null,
      },
    });
    const binding = role ? await this.mapBinding(role) : null;

    let childCareProcessId =
      context.target?.child_care_process_id ?? context.work_scope.child_care_process_id;
    let enrollmentId = context.work_scope.enrollment_id;
    let careGroupId = context.work_scope.care_group_id;
    let threadId: string | undefined;
    let messageState: NurturePolicyFacts["message_state"] = "missing";
    const target = context.target;
    if (target?.object_type === "family_care_item") {
      const row = await this.prisma.nurtureFamilyCareItem.findFirst({
        where: { id: target.object_id, workspaceId: input.workspace_id },
      });
      childCareProcessId = row?.childCareProcessId ?? childCareProcessId;
      enrollmentId = row?.enrollmentId ?? enrollmentId;
      careGroupId = row?.careGroupId ?? careGroupId;
      threadId = row?.threadId;
    } else if (target?.object_type === "family_care_thread") {
      threadId = target.object_id;
    } else if (target?.object_type === "family_care_message") {
      const message = await this.prisma.nurtureFamilyCareMessage.findFirst({
        where: { id: target.object_id, workspaceId: input.workspace_id },
      });
      if (message) {
        messageState = message.status;
        threadId = message.threadId;
        childCareProcessId = message.childCareProcessId;
      }
    }

    const thread = threadId
      ? await this.prisma.nurtureFamilyCareThread.findFirst({
          where: { id: threadId, workspaceId: input.workspace_id },
        })
      : null;
    childCareProcessId = thread?.childCareProcessId ?? childCareProcessId;
    enrollmentId = thread?.enrollmentId ?? enrollmentId;
    careGroupId = thread?.careGroupId ?? careGroupId;
    const membership = threadId
      ? await this.prisma.nurtureFamilyCareThreadParticipant.findFirst({
          where: {
            workspaceId: input.workspace_id,
            threadId,
            participantId: context.actor.participant_id,
            roleAssignmentId: context.actor.role_assignment_id,
            visibilityStatus: "active",
            deletedAt: null,
          },
        })
      : null;
    const enrollment = enrollmentId
      ? await this.prisma.nurtureEnrollment.findFirst({
          where: { id: enrollmentId, workspaceId: input.workspace_id, deletedAt: null },
        })
      : childCareProcessId && careGroupId
        ? await this.prisma.nurtureEnrollment.findFirst({
            where: {
              workspaceId: input.workspace_id,
              childCareProcessId,
              careGroupId,
              deletedAt: null,
            },
          })
        : null;
    enrollmentId = enrollment?.id ?? enrollmentId;
    careGroupId = enrollment?.careGroupId ?? careGroupId;

    const grants = childCareProcessId
      ? await this.prisma.nurtureChildLinkGrant.findMany({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId,
            ...(enrollmentId ? { enrollmentId } : {}),
            deletedAt: null,
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
        })
      : [];
    const now = new Date();
    const grantsForBinding = grants.filter((grant) => {
      if (!binding || binding.role_kind === "guardian") return true;
      return (
        (grant.grantedToScopeType === "care_group" && grant.grantedToScopeId === careGroupId) ||
        (grant.grantedToScopeType === "institution" &&
          grant.grantedToScopeId === enrollment?.institutionId) ||
        (grant.grantedToScopeType === "enrollment" &&
          grant.grantedToScopeId === enrollmentId)
      );
    });
    const currentGrants = grantsForBinding.filter(
      (grant) =>
        grant.status === "active" &&
        !grant.revokedAt &&
        (!grant.effectiveFrom || grant.effectiveFrom <= now) &&
        (!grant.expiresAt || grant.expiresAt > now),
    );
    const matchingGrant = currentGrants.find(
      (grant) =>
        (!input.direction || grant.directions.includes(input.direction)) &&
        (!input.data_class || grant.dataClasses.includes(input.data_class)),
    );
    const activeGrant = matchingGrant ?? currentGrants[0];
    const revokedGrant = grantsForBinding.find(
      (grant) => grant.status === "revoked" || grant.revokedAt,
    );
    const scopeReachesChild = binding
      ? await this.roleReachesChild(input.workspace_id, binding, childCareProcessId)
      : false;
    const childVisible = childCareProcessId
      ? Boolean(
          await this.prisma.nurtureChildCareProcess.findFirst({
            where: {
              id: childCareProcessId,
              workspaceId: input.workspace_id,
              status: "active",
              deletedAt: null,
            },
            select: { id: true },
          }),
        ) && scopeReachesChild
      : false;

    let assetScopeMatches = false;
    let childEnrolled = false;
    let exposurePolicyPresent = false;
    if (target?.object_type === "child_media_attribution") {
      const attribution = await this.prisma.nurtureChildMediaAttribution.findFirst({
        where: { id: target.object_id, workspaceId: input.workspace_id, deletedAt: null },
        include: { mediaAssetRef: true },
      });
      if (attribution && binding) {
        exposurePolicyPresent = attribution.exposurePolicyPayload !== null;
        const asset = attribution.mediaAssetRef;
        assetScopeMatches =
          (binding.scope_type === "care_group" && binding.scope_id === asset.careGroupId) ||
          (binding.scope_type === "institution" && binding.scope_id === asset.institutionId) ||
          (binding.scope_type === "enrollment" && scopeReachesChild);
        childEnrolled = Boolean(
          await this.prisma.nurtureEnrollment.findFirst({
            where: {
              workspaceId: input.workspace_id,
              childCareProcessId: attribution.childCareProcessId,
              ...(asset.careGroupId ? { careGroupId: asset.careGroupId } : { institutionId: asset.institutionId }),
              status: "active",
              deletedAt: null,
            },
            select: { id: true },
          }),
        );
      }
    }

    return {
      participant_state: participant ? "active" : "missing",
      role_state:
        !role
          ? "missing"
          : role.status === "active" && isCurrent(role.startsAt, role.endsAt, now)
            ? "active"
            : "revoked",
      ...(role ? { role_kind: role.role } : {}),
      scope_reaches_child: scopeReachesChild,
      care_group_matches: Boolean(
        binding &&
          careGroupId &&
          ((binding.scope_type === "care_group" && binding.scope_id === careGroupId) ||
            (binding.scope_type === "institution" && enrollment?.institutionId === binding.scope_id) ||
            (binding.scope_type === "enrollment" && enrollment?.id === binding.scope_id)),
      ),
      child_visible: childVisible,
      thread_state: !thread ? "missing" : thread.status === "active" ? "active" : "inactive",
      thread_membership_active: Boolean(membership),
      message_state: messageState,
      enrollment_state: !enrollment ? "missing" : enrollment.status === "active" ? "active" : "inactive",
      grant_state: activeGrant ? "active" : revokedGrant ? "revoked" : "missing",
      grant_directions: activeGrant?.directions ?? [],
      grant_data_classes: activeGrant?.dataClasses ?? [],
      family_thread_visible: thread?.status === "active" && Boolean(membership),
      asset_scope_matches: assetScopeMatches,
      child_enrolled: childEnrolled,
      exposure_policy_present: exposurePolicyPresent,
    };
  }
}
