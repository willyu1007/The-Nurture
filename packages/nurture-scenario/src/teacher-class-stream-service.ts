import { issueBoardOpaqueRef } from "./harness/board-projection.js";
import {
  TEACHER_CLASS_STREAM_INTERFACE,
  type TeacherClassStreamOperation,
} from "./teacher-class-stream-contract.js";

/**
 * W6 real-owner service for `nurture.teacher-class-stream-presenter@1.0.0`.
 * The authority resolver rereads the caller's current caregiver context on
 * every call; the owner reads echo the resolved authority verbatim and fetch
 * only payload facts. Opaque class/child refs are deterministic
 * workspace-bound HMACs resolved by candidate matching, so a foreign or stale
 * ref never reveals whether its target exists.
 */

const RESPONSE_TTL_MS = 300_000;
const MAX_CLASSES = 8;
const MAX_CHILDREN = 80;
const MAX_ENTRIES = 40;

type CaregiverRole = "caregiver" | "lead_caregiver";

type BaseRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type TeacherClassStreamClassContextRequest = BaseRequestV1 &
  Readonly<{ local_date: string; selected_class_ref?: string }>;
export type TeacherClassStreamClassScopedRequest = BaseRequestV1 &
  Readonly<{ class_ref: string; local_date: string }>;
export type TeacherClassStreamChildScopedRequest =
  TeacherClassStreamClassScopedRequest & Readonly<{ child_ref: string }>;

export type TeacherClassStreamResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: CaregiverRole;
  scope_kind: "participant" | "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

export type TeacherClassStreamAuthorityDecisionV1 =
  | Readonly<{ status: "resolved"; owner_resolution: TeacherClassStreamResolutionV1 }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface TeacherClassStreamAuthorityPortV1 {
  resolve(
    input: BaseRequestV1 & Readonly<{
      operation: TeacherClassStreamOperation;
      class_ref?: string;
    }>,
  ): Promise<TeacherClassStreamAuthorityDecisionV1>;
}

export interface TeacherClassStreamOwnerPortV1 {
  classContext(input: Readonly<{
    request: TeacherClassStreamClassContextRequest;
    authority: TeacherClassStreamResolutionV1;
  }>): Promise<unknown>;
  childStrip(input: Readonly<{
    request: TeacherClassStreamClassScopedRequest;
    authority: TeacherClassStreamResolutionV1;
  }>): Promise<unknown>;
  childDayDetail(input: Readonly<{
    request: TeacherClassStreamChildScopedRequest;
    authority: TeacherClassStreamResolutionV1;
  }>): Promise<unknown>;
  schedule(input: Readonly<{
    request: TeacherClassStreamClassScopedRequest;
    authority: TeacherClassStreamResolutionV1;
  }>): Promise<unknown>;
}

export type TeacherClassStreamServiceBindingV1 = Readonly<{
  authorityResolver: TeacherClassStreamAuthorityPortV1;
  owner: TeacherClassStreamOwnerPortV1;
}>;

// ---------------------------------------------------------------------------
// Read-port facts (owner-internal; refs and copy are issued in this service).

export type TeacherClassFactsV1 = Readonly<{
  care_group_id: string;
  care_group_label: string;
  role: CaregiverRole;
  role_version: number;
  care_group_version: number;
  institution_id: string;
  publication_policy_resolved: boolean;
}>;

export type TeacherCaregiverContextV1 = Readonly<{
  participant_id: string;
  participant_version: number;
  classes: readonly TeacherClassFactsV1[];
}>;

export type TeacherClassChildFactsV1 = Readonly<{
  child_care_process_id: string;
  child_safe_label: string;
  last_activity_at: string | null;
  attention_priorities: readonly ("routine" | "attention" | "urgent")[];
}>;

export type TeacherDailyCareFactV1 = Readonly<{
  log_id: string;
  kind: "meal" | "nap" | "mood" | "activity" | "health_observation";
  summary: string;
  occurred_at: string;
  fact_version: number;
}>;

export type TeacherChildDayFactsV1 = Readonly<{
  child_safe_label: string;
  arrival:
    | Readonly<{
        state: "present" | "absent" | "excused_absent" | "not_expected";
        recorded_at: string;
        fact_version: number;
      }>
    | null;
  daily_care: readonly TeacherDailyCareFactV1[];
  family_instructions: readonly Readonly<{
    item_id: string;
    summary: string;
    received_at: string;
    fact_version: number;
  }>[];
}>;

export type TeacherScheduleFactsV1 =
  | Readonly<{
      status: "resolved";
      resolution: "day_override" | "class_template" | "institution_template" | "none";
      version_head: number;
      slots: readonly Readonly<{
        source_ref: string;
        label: string;
        starts_at: string;
        ends_at: string;
      }>[];
    }>
  | Readonly<{ status: "malformed" }>;

export interface TeacherClassStreamReadPortV1 {
  loadCaregiverContext(input: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }>): Promise<TeacherCaregiverContextV1 | null>;
  listClassChildren(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
    local_date: string;
  }>): Promise<readonly TeacherClassChildFactsV1[]>;
  loadChildDay(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
    child_care_process_id: string;
    local_date: string;
  }>): Promise<TeacherChildDayFactsV1 | null>;
  loadClassSchedule(input: Readonly<{
    workspace_id: string;
    institution_id: string;
    care_group_id: string;
    local_date: string;
  }>): Promise<TeacherScheduleFactsV1>;
}

export type TeacherClassStreamServiceDependenciesV1 = Readonly<{
  reads: TeacherClassStreamReadPortV1;
  integrityKey: string;
  now?: () => Date;
}>;

// ---------------------------------------------------------------------------

const PRIORITY_RANK = { routine: 1, attention: 2, urgent: 3 } as const;
const PRIORITY_LABEL = {
  routine: "常规",
  attention: "需要关注",
  urgent: "紧急",
} as const;

const compareClasses = (
  left: TeacherClassFactsV1,
  right: TeacherClassFactsV1,
): number =>
  left.care_group_label.localeCompare(right.care_group_label, "zh-Hans-CN")
  || left.care_group_id.localeCompare(right.care_group_id);

export const createTeacherClassStreamService = (
  deps: TeacherClassStreamServiceDependenciesV1,
): TeacherClassStreamServiceBindingV1 => {
  const now = deps.now ?? (() => new Date());
  if (deps.integrityKey.length < 32) {
    throw new Error("Teacher class-stream integrity key must be at least 32 characters");
  }

  const scopeOf = (workspaceId: string) => ({ workspace_id: workspaceId });
  const classRefOf = (workspaceId: string, careGroupId: string): string =>
    issueBoardOpaqueRef(deps.integrityKey, scopeOf(workspaceId), "care_group", careGroupId);
  const childRefOf = (workspaceId: string, childCareProcessId: string): string =>
    issueBoardOpaqueRef(
      deps.integrityKey,
      scopeOf(workspaceId),
      "child_care_process",
      childCareProcessId,
    );

  const masked = (
    contextRef: string,
    reason: "access_changed" | "context_changed" | "refresh_not_retryable",
  ): unknown => ({
    status: "masked",
    context_ref: contextRef,
    masked_at: now().toISOString(),
    mask_signal: {
      kind: "mask",
      reason_code: reason,
      purge_partition: true,
      content_masked: true,
    },
  });

  const unavailable = (
    contextRef: string,
    reason: "content_unavailable" | "temporarily_unavailable" | "request_invalid",
  ): unknown => ({
    status: "unavailable",
    context_ref: contextRef,
    failed_at: now().toISOString(),
    reason_code: reason,
    retryable: reason === "temporarily_unavailable",
  });

  const sortedClasses = (
    context: TeacherCaregiverContextV1,
  ): TeacherClassFactsV1[] => [...context.classes].sort(compareClasses);

  const findByClassRef = (
    workspaceId: string,
    context: TeacherCaregiverContextV1,
    classRef: string,
  ): TeacherClassFactsV1 | undefined =>
    context.classes.find(
      (entry) => classRefOf(workspaceId, entry.care_group_id) === classRef,
    );

  const participantResolution = (
    request: BaseRequestV1,
    context: TeacherCaregiverContextV1,
    resolvedAt: string,
  ): TeacherClassStreamResolutionV1 => {
    const scopeVersion = Math.max(
      1,
      context.participant_version,
      ...context.classes.map((entry) =>
        Math.max(entry.role_version, entry.care_group_version)),
    );
    const role: CaregiverRole = context.classes.some(
      (entry) => entry.role === "lead_caregiver",
    )
      ? "lead_caregiver"
      : "caregiver";
    const scopeRef = issueBoardOpaqueRef(
      deps.integrityKey,
      scopeOf(request.workspace_id),
      "participant",
      context.participant_id,
    );
    return Object.freeze({
      resolution_ref: issueBoardOpaqueRef(
        deps.integrityKey,
        scopeOf(request.workspace_id),
        "resolution",
        `participant:${context.participant_id}:${scopeVersion}`,
      ),
      presentation_role: role,
      scope_kind: "participant",
      scope_ref: scopeRef,
      context_ref: request.context_ref,
      scope_version: scopeVersion,
      resolved_at: resolvedAt,
    });
  };

  const classResolution = (
    request: BaseRequestV1,
    entry: TeacherClassFactsV1,
    classRef: string,
    resolvedAt: string,
  ): TeacherClassStreamResolutionV1 => {
    const scopeVersion = Math.max(1, entry.role_version, entry.care_group_version);
    return Object.freeze({
      resolution_ref: issueBoardOpaqueRef(
        deps.integrityKey,
        scopeOf(request.workspace_id),
        "resolution",
        `care_group:${entry.care_group_id}:${scopeVersion}`,
      ),
      presentation_role: entry.role,
      scope_kind: "care_group",
      scope_ref: classRef,
      context_ref: request.context_ref,
      scope_version: scopeVersion,
      resolved_at: resolvedAt,
    });
  };

  const readyEnvelope = (
    request: BaseRequestV1,
    authority: TeacherClassStreamResolutionV1,
    operation: TeacherClassStreamOperation,
    queryKey: string,
  ) => {
    const generatedAt = now();
    return {
      status: "ready" as const,
      owner_resolution: authority,
      cache_partition: {
        partition_key: issueBoardOpaqueRef(
          deps.integrityKey,
          scopeOf(request.workspace_id),
          "partition",
          `${operation}\0${request.my_chat_user_id}\0${authority.resolution_ref}\0${queryKey}`,
        ),
        interface_key: TEACHER_CLASS_STREAM_INTERFACE.key,
        interface_version: TEACHER_CLASS_STREAM_INTERFACE.version,
        contract_digest: TEACHER_CLASS_STREAM_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        presentation_role: authority.presentation_role,
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        query_key: queryKey,
        expires_at: new Date(generatedAt.getTime() + RESPONSE_TTL_MS).toISOString(),
      },
      generated_at: generatedAt.toISOString(),
      freshness: {
        resolved_at: authority.resolved_at,
        source: "current_owner_read" as const,
      },
    };
  };

  const loadContext = async (
    request: BaseRequestV1,
  ): Promise<TeacherCaregiverContextV1 | null> =>
    deps.reads.loadCaregiverContext({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      at: now(),
    });

  const resolveClassMembership = async (
    request: TeacherClassStreamClassScopedRequest,
  ): Promise<TeacherClassFactsV1 | null> => {
    const context = await loadContext(request);
    if (!context) return null;
    return (
      findByClassRef(request.workspace_id, context, request.class_ref) ?? null
    );
  };

  const authorityResolver: TeacherClassStreamAuthorityPortV1 = {
    async resolve(input) {
      let context: TeacherCaregiverContextV1 | null;
      try {
        context = await loadContext(input);
      } catch {
        return {
          status: "closed",
          response: unavailable(input.context_ref, "temporarily_unavailable"),
        };
      }
      if (!context || context.classes.length === 0) {
        return {
          status: "closed",
          response: masked(input.context_ref, "access_changed"),
        };
      }
      const resolvedAt = now().toISOString();
      if (input.operation === "class_context_query") {
        return {
          status: "resolved",
          owner_resolution: participantResolution(input, context, resolvedAt),
        };
      }
      const classRef = input.class_ref;
      const entry = classRef
        ? findByClassRef(input.workspace_id, context, classRef)
        : undefined;
      if (!classRef || !entry) {
        // A ref from another scope, class or a revoked assignment is
        // indistinguishable from stale cache here; both purge.
        return {
          status: "closed",
          response: masked(input.context_ref, "access_changed"),
        };
      }
      return {
        status: "resolved",
        owner_resolution: classResolution(input, entry, classRef, resolvedAt),
      };
    },
  };

  const owner: TeacherClassStreamOwnerPortV1 = {
    async classContext({ request, authority }) {
      const context = await loadContext(request);
      if (!context || context.classes.length === 0) {
        return masked(request.context_ref, "access_changed");
      }
      const ordered = sortedClasses(context).slice(0, MAX_CLASSES);
      const selected =
        (request.selected_class_ref
          ? ordered.find(
              (entry) =>
                classRefOf(request.workspace_id, entry.care_group_id)
                === request.selected_class_ref,
            )
          : undefined) ?? ordered[0];
      if (!selected) return masked(request.context_ref, "access_changed");
      if (request.selected_class_ref
        && classRefOf(request.workspace_id, selected.care_group_id)
          !== request.selected_class_ref) {
        // The presented selection no longer resolves; purge instead of
        // silently switching classes under the caller.
        return masked(request.context_ref, "access_changed");
      }
      const schedule = await deps.reads.loadClassSchedule({
        workspace_id: request.workspace_id,
        institution_id: selected.institution_id,
        care_group_id: selected.care_group_id,
        local_date: request.local_date,
      });
      const selectedRef = classRefOf(request.workspace_id, selected.care_group_id);
      return {
        ...readyEnvelope(request, authority, "class_context_query", request.local_date),
        classes: ordered.map((entry) => ({
          class_ref: classRefOf(request.workspace_id, entry.care_group_id),
          class_label: entry.care_group_label,
          selectable: true,
          current: entry.care_group_id === selected.care_group_id,
        })),
        day_header: {
          class_ref: selectedRef,
          class_label: selected.care_group_label,
          local_date: request.local_date,
          effective_schedule:
            schedule.status === "resolved" && schedule.resolution !== "none"
              ? ("available" as const)
              : ("unknown" as const),
          publication_window: selected.publication_policy_resolved
            ? ("resolved" as const)
            : ("unresolved" as const),
        },
      };
    },

    async childStrip({ request, authority }) {
      const membership = await resolveClassMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const children = await deps.reads.listClassChildren({
        workspace_id: request.workspace_id,
        care_group_id: membership.care_group_id,
        local_date: request.local_date,
      });
      return {
        ...readyEnvelope(
          request,
          authority,
          "child_strip_query",
          `${request.class_ref}|${request.local_date}`,
        ),
        children: children.slice(0, MAX_CHILDREN).map((child) => {
          const count = child.attention_priorities.length;
          const highest = child.attention_priorities.reduce<
            "none" | "routine" | "attention" | "urgent"
          >(
            (current, priority) =>
              current === "none"
              || PRIORITY_RANK[priority]
                > PRIORITY_RANK[current as keyof typeof PRIORITY_RANK]
                ? priority
                : current,
            "none",
          );
          return {
            child_ref: childRefOf(request.workspace_id, child.child_care_process_id),
            child_safe_label: child.child_safe_label,
            attention: {
              count,
              highest_priority: highest,
              text_alternative: count === 0
                ? "无待关注事项"
                : `${count} 项待关注，最高级别为${
                  PRIORITY_LABEL[highest as keyof typeof PRIORITY_LABEL]
                }`,
            },
            ...(child.last_activity_at
              ? { last_activity_at: child.last_activity_at }
              : {}),
          };
        }),
      };
    },

    async childDayDetail({ request, authority }) {
      const membership = await resolveClassMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const children = await deps.reads.listClassChildren({
        workspace_id: request.workspace_id,
        care_group_id: membership.care_group_id,
        local_date: request.local_date,
      });
      const target = children.find(
        (child) =>
          childRefOf(request.workspace_id, child.child_care_process_id)
          === request.child_ref,
      );
      if (!target) return masked(request.context_ref, "access_changed");
      const day = await deps.reads.loadChildDay({
        workspace_id: request.workspace_id,
        care_group_id: membership.care_group_id,
        child_care_process_id: target.child_care_process_id,
        local_date: request.local_date,
      });
      if (!day) return masked(request.context_ref, "access_changed");
      const generated = now().toISOString();
      const sections = [
        // present -> arrived; absent and excused_absent -> absent;
        // not_expected has no arrival expectation and reports empty.
        day.arrival === null || day.arrival.state === "not_expected"
          ? { section_key: "arrival" as const, status: "empty" as const, title: "到园" }
          : {
              section_key: "arrival" as const,
              status: "ready" as const,
              title: "到园",
              generated_at: generated,
              source_head: Math.max(1, day.arrival.fact_version),
              arrival_state:
                day.arrival.state === "present"
                  ? ("arrived" as const)
                  : ("absent" as const),
            },
        day.daily_care.length === 0
          ? {
              section_key: "daily_care" as const,
              status: "empty" as const,
              title: "今日照护",
            }
          : {
              section_key: "daily_care" as const,
              status: "ready" as const,
              title: "今日照护",
              generated_at: generated,
              source_head: Math.max(
                1,
                ...day.daily_care.map((entry) => entry.fact_version),
              ),
              entries: day.daily_care.slice(0, MAX_ENTRIES).map((entry) => ({
                log_ref: issueBoardOpaqueRef(
                  deps.integrityKey,
                  scopeOf(request.workspace_id),
                  "daily_care_log",
                  entry.log_id,
                ),
                kind: entry.kind,
                summary: entry.summary,
                occurred_at: entry.occurred_at,
                source_head: Math.max(1, entry.fact_version),
              })),
              supplement_action: {
                capability_key: "record_caregiver_daily_care",
                capability_version: "1.0.0",
                availability: "available" as const,
              },
            },
        day.family_instructions.length === 0
          ? {
              section_key: "family_instructions" as const,
              status: "empty" as const,
              title: "家庭嘱托",
            }
          : {
              section_key: "family_instructions" as const,
              status: "ready" as const,
              title: "家庭嘱托",
              generated_at: generated,
              source_head: Math.max(
                1,
                ...day.family_instructions.map((entry) => entry.fact_version),
              ),
              entries: day.family_instructions.slice(0, MAX_ENTRIES).map((entry) => ({
                instruction_ref: issueBoardOpaqueRef(
                  deps.integrityKey,
                  scopeOf(request.workspace_id),
                  "care_interaction_item",
                  entry.item_id,
                ),
                summary: entry.summary,
                received_at: entry.received_at,
                source_head: Math.max(1, entry.fact_version),
              })),
            },
        // No caregiver-visible child-associated observation source exists yet;
        // the association chain arrives with W9. Shape frozen, outcome honest.
        {
          section_key: "observations" as const,
          status: "unavailable" as const,
          title: "观察记录",
        },
        // Focus facts are family-owned; no granted caregiver projection exists
        // yet. Same reserved posture as observations.
        {
          section_key: "focus_link" as const,
          status: "unavailable" as const,
          title: "当前培养重点",
        },
      ];
      return {
        ...readyEnvelope(
          request,
          authority,
          "child_day_detail_query",
          `${request.child_ref}|${request.local_date}`,
        ),
        child_ref: request.child_ref,
        child_safe_label: day.child_safe_label,
        local_date: request.local_date,
        sections,
      };
    },

    async schedule({ request, authority }) {
      const membership = await resolveClassMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const schedule = await deps.reads.loadClassSchedule({
        workspace_id: request.workspace_id,
        institution_id: membership.institution_id,
        care_group_id: membership.care_group_id,
        local_date: request.local_date,
      });
      if (schedule.status === "malformed") {
        return unavailable(request.context_ref, "content_unavailable");
      }
      const envelope = readyEnvelope(
        request,
        authority,
        "schedule_query",
        `${request.class_ref}|${request.local_date}`,
      );
      return {
        ...envelope,
        local_date: request.local_date,
        resolution: schedule.resolution,
        schedule_version_head:
          schedule.resolution === "none" ? 0 : Math.max(1, schedule.version_head),
        as_of: envelope.generated_at,
        slots: schedule.slots.slice(0, 24).map((slot) => ({
          slot_ref: issueBoardOpaqueRef(
            deps.integrityKey,
            scopeOf(request.workspace_id),
            "schedule_slot",
            `${membership.care_group_id}\0${request.local_date}\0${slot.source_ref}`,
          ),
          label: slot.label,
          starts_at: slot.starts_at,
          ends_at: slot.ends_at,
          // No canonical institution timezone exists yet, so no slot is ever
          // marked current; the header still reports as_of for the caller.
          current: false,
        })),
      };
    },
  };

  return { authorityResolver, owner };
};
