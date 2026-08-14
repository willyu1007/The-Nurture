import { createHash, createHmac } from "node:crypto";
import { nurtureCanonicalJson } from "./c30/canonical-json.js";
import {
  isNurtureCommandRetryable,
  NurtureDeterministicRollback,
  type NurtureCommandInput,
  type NurtureCommandResult,
  type NurtureCommandSpec,
} from "./domain/commands/command-kernel.js";
import type { NurtureWeeklyDraftFacts } from "./domain/institution/teacher-assistant-transaction.js";
import { issueBoardOpaqueRef } from "./harness/board-projection.js";
import type { CaregiverDailyCareEligibilityReadPort } from "./harness/board-mutations.js";
import { evaluateContentSafetyRoute } from "./harness/content-safety-policy.js";
import type { ProtectedContentWritePort } from "./harness/protected-content.js";
import { publishTargetKey } from "./harness/publish-process.js";
import {
  TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE,
  type TeacherAssistantQueryOwnerOperation,
} from "./teacher-assistant-query-owner-contract.js";
import type {
  TeacherCaregiverContextV1,
  TeacherClassFactsV1,
} from "./teacher-class-stream-service.js";

/**
 * W10 real-owner service for `nurture.teacher-assistant-query-owner@1.0.0`
 * — the assistant-backed teacher queries. Reads follow the W6 discipline
 * over owner facts; the weekly-draft exchange runs on the generic command
 * ledger with the W7 actor HMAC and is additionally domain-idempotent per
 * (class, ISO week). The generation boundary stays engine-ready: the owner
 * assembles deterministic facts only and never calls a model provider.
 */

const RESPONSE_TTL_MS = 300_000;
const MAX_CHILDREN = 80;
const COUNT_CAP = 999;
const TOTAL_CAP = 9999;
const DAY_MS = 86_400_000;

export const TEACHER_ASSISTANT_CARE_KINDS = [
  "meal",
  "nap",
  "mood",
  "activity",
  "health_observation",
] as const;
export type TeacherAssistantCareKind =
  (typeof TEACHER_ASSISTANT_CARE_KINDS)[number];

type CaregiverRole = "caregiver" | "lead_caregiver";

type BaseRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  class_ref: string;
  local_date: string;
}>;

export type TeacherAssistantMissingRecordsRequest = BaseRequestV1;
export type TeacherAssistantWeeklySourceRequest = BaseRequestV1;
export type TeacherAssistantWeeklyDraftRequest = BaseRequestV1 &
  Readonly<{ command_request_id: string }>;

export type TeacherAssistantQueryResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: CaregiverRole;
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

export type TeacherAssistantQueryAuthorityDecisionV1 =
  | Readonly<{ status: "resolved"; owner_resolution: TeacherAssistantQueryResolutionV1 }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface TeacherAssistantQueryAuthorityPortV1 {
  resolve(
    input: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      host_request_id: string;
      context_ref: string;
      operation: TeacherAssistantQueryOwnerOperation;
      class_ref: string;
    }>,
  ): Promise<TeacherAssistantQueryAuthorityDecisionV1>;
}

export interface TeacherAssistantQueryOwnerPortV1 {
  missingRecords(input: Readonly<{
    request: TeacherAssistantMissingRecordsRequest;
    authority: TeacherAssistantQueryResolutionV1;
  }>): Promise<unknown>;
  weeklySource(input: Readonly<{
    request: TeacherAssistantWeeklySourceRequest;
    authority: TeacherAssistantQueryResolutionV1;
  }>): Promise<unknown>;
  weeklyDraft(input: Readonly<{
    request: TeacherAssistantWeeklyDraftRequest;
    authority: TeacherAssistantQueryResolutionV1;
  }>): Promise<unknown>;
}

export type TeacherAssistantQueryOwnerServiceBindingV1 = Readonly<{
  authorityResolver: TeacherAssistantQueryAuthorityPortV1;
  owner: TeacherAssistantQueryOwnerPortV1;
}>;

// ---------------------------------------------------------------------------
// Owner-internal read facts.

export interface TeacherAssistantQueryContextReadPortV1 {
  loadCaregiverContext(input: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }>): Promise<TeacherCaregiverContextV1 | null>;
}

export type TeacherAssistantClassChildV1 = Readonly<{
  child_care_process_id: string;
  display_label: string;
}>;

export type TeacherAssistantWeeklyChildFactsV1 = Readonly<{
  child_care_process_id: string;
  care_counts: Readonly<Record<TeacherAssistantCareKind, number>>;
  confirmed_media_count: number;
}>;

export interface TeacherAssistantQueryReadPortV1 {
  /** Currently enrolled children of the exact class, label-ordered. */
  listClassChildren(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
  }>): Promise<readonly TeacherAssistantClassChildV1[]>;
  /** The daily-care kinds recorded per child for the exact local date. */
  listRecordedDayKinds(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
    local_date: string;
  }>): Promise<
    readonly Readonly<{
      child_care_process_id: string;
      kinds: readonly TeacherAssistantCareKind[];
    }>[]
  >;
  /** Per-kind day counts and confirmed-media counts over the exact week. */
  loadWeeklyCareFacts(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
    week_start: string;
    week_end: string;
  }>): Promise<readonly TeacherAssistantWeeklyChildFactsV1[]>;
  /** The (class, week) draft process, if one already exists. */
  findWeeklyDraftProcessId(input: Readonly<{
    workspace_id: string;
    process_key: string;
  }>): Promise<string | null>;
}

export type TeacherAssistantQueryCommandRunnerV1 = Readonly<{
  execute<Input>(input: NurtureCommandInput<Input>): Promise<NurtureCommandResult>;
}>;

export type TeacherAssistantQueryOwnerServiceDependenciesV1 = Readonly<{
  contextReads: TeacherAssistantQueryContextReadPortV1;
  assistantReads: TeacherAssistantQueryReadPortV1;
  supplementEligibility: CaregiverDailyCareEligibilityReadPort;
  protectedContent: ProtectedContentWritePort;
  commands: TeacherAssistantQueryCommandRunnerV1;
  integrityKey: string;
  now?: () => Date;
}>;

// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isoDateOf = (instant: Date): string => instant.toISOString().slice(0, 10);

/** Owner-computed Monday-Sunday window of the week containing the date. */
export const teacherAssistantWeekOf = (
  localDate: string,
): Readonly<{ week_start: string; week_end: string }> => {
  const date = new Date(`${localDate}T00:00:00.000Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const start = new Date(date.getTime() - mondayOffset * DAY_MS);
  return Object.freeze({
    week_start: isoDateOf(start),
    week_end: isoDateOf(new Date(start.getTime() + 6 * DAY_MS)),
  });
};

/** Deterministic natural key: one weekly draft per (class, week). */
export const teacherAssistantWeeklyProcessKey = (
  careGroupId: string,
  weekStart: string,
): string => `weekly:${careGroupId}:${weekStart}`;

export const createTeacherAssistantQueryOwnerService = (
  deps: TeacherAssistantQueryOwnerServiceDependenciesV1,
): TeacherAssistantQueryOwnerServiceBindingV1 => {
  const now = deps.now ?? (() => new Date());
  if (deps.integrityKey.length < 32) {
    throw new Error(
      "Teacher assistant-query integrity key must be at least 32 characters",
    );
  }

  const scopeOf = (workspaceId: string) => ({ workspace_id: workspaceId });
  const refOf = (workspaceId: string, kind: string, id: string): string =>
    issueBoardOpaqueRef(deps.integrityKey, scopeOf(workspaceId), kind, id);
  const classRefOf = (workspaceId: string, careGroupId: string): string =>
    refOf(workspaceId, "care_group", careGroupId);
  const childRefOf = (workspaceId: string, childCareProcessId: string): string =>
    refOf(workspaceId, "child_care_process", childCareProcessId);
  const processRefOf = (workspaceId: string, processId: string): string =>
    refOf(workspaceId, "publish_process", processId);
  const actorBindingOf = (workspaceId: string, participantId: string): string =>
    createHmac("sha256", deps.integrityKey)
      .update(
        `nurture.teacher-assistant-query-actor.v1\0${workspaceId}\0${participantId}`,
        "utf8",
      )
      .digest("hex");
  const digestOf = (value: unknown): string =>
    `sha256:${createHash("sha256")
      .update(nurtureCanonicalJson(value), "utf8")
      .digest("hex")}`;

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

  const outcomeUnknown = (contextRef: string, commandRequestId: string): unknown => ({
    status: "outcome_unknown",
    context_ref: contextRef,
    command_request_id: commandRequestId,
    recovery: "reconcile_same_command",
  });

  const notCommitted = (
    request: Readonly<{ context_ref: string; command_request_id: string }>,
    reason: string,
  ): unknown => ({
    status: "not_committed",
    context_ref: request.context_ref,
    command_request_id: request.command_request_id,
    reason_code: reason,
  });

  const findByClassRef = (
    workspaceId: string,
    context: TeacherCaregiverContextV1,
    classRef: string,
  ): TeacherClassFactsV1 | undefined =>
    context.classes.find(
      (entry) => classRefOf(workspaceId, entry.care_group_id) === classRef,
    );

  const loadContext = (request: BaseRequestV1) =>
    deps.contextReads.loadCaregiverContext({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      at: now(),
    });

  const classResolution = (
    request: Readonly<{
      workspace_id: string;
      class_ref: string;
      context_ref: string;
    }>,
    entry: TeacherClassFactsV1,
    resolvedAt: string,
  ): TeacherAssistantQueryResolutionV1 => {
    const scopeVersion = Math.max(1, entry.role_version, entry.care_group_version);
    return Object.freeze({
      resolution_ref: refOf(
        request.workspace_id,
        "resolution",
        `assistant-query:${entry.care_group_id}:${scopeVersion}`,
      ),
      presentation_role: entry.role,
      scope_kind: "care_group" as const,
      scope_ref: request.class_ref,
      context_ref: request.context_ref,
      scope_version: scopeVersion,
      resolved_at: resolvedAt,
    });
  };

  const readyEnvelope = (
    request: BaseRequestV1,
    authority: TeacherAssistantQueryResolutionV1,
    operation: "missing_records_query" | "weekly_source_query",
    queryKey: string,
  ) => {
    const generatedAt = now();
    return {
      status: "ready" as const,
      owner_resolution: authority,
      cache_partition: {
        partition_key: refOf(
          request.workspace_id,
          "partition",
          `${operation}\0${request.my_chat_user_id}\0${authority.resolution_ref}\0${queryKey}`,
        ),
        interface_key: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.key,
        interface_version: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.version,
        contract_digest: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.digest,
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

  const authorityResolver: TeacherAssistantQueryAuthorityPortV1 = {
    async resolve(input) {
      let context: TeacherCaregiverContextV1 | null;
      try {
        context = await deps.contextReads.loadCaregiverContext({
          workspace_id: input.workspace_id,
          my_chat_user_id: input.my_chat_user_id,
          at: now(),
        });
      } catch {
        return {
          status: "closed",
          response: unavailable(input.context_ref, "temporarily_unavailable"),
        };
      }
      const entry = context
        ? findByClassRef(input.workspace_id, context, input.class_ref)
        : undefined;
      if (!entry) {
        return {
          status: "closed",
          response: masked(input.context_ref, "access_changed"),
        };
      }
      return {
        status: "resolved",
        owner_resolution: classResolution(input, entry, now().toISOString()),
      };
    },
  };

  type Membership = Readonly<{
    context: TeacherCaregiverContextV1;
    entry: TeacherClassFactsV1;
  }>;

  const resolveMembership = async (
    request: BaseRequestV1,
  ): Promise<Membership | null> => {
    const context = await loadContext(request);
    if (!context) return null;
    const entry = findByClassRef(request.workspace_id, context, request.class_ref);
    return entry ? { context, entry } : null;
  };

  const safeLabel = (label: string): string => (label || "孩子").slice(0, 80);

  const cappedCounts = (
    counts: Readonly<Record<TeacherAssistantCareKind, number>>,
  ): Record<TeacherAssistantCareKind, number> => {
    const output = {} as Record<TeacherAssistantCareKind, number>;
    for (const kind of TEACHER_ASSISTANT_CARE_KINDS) {
      output[kind] = Math.min(Math.max(counts[kind] ?? 0, 0), COUNT_CAP);
    }
    return output;
  };

  // Defensive identity hygiene: a duplicated child id would trip the
  // uniqueness bindings downstream, so reads never trust the port on it.
  const dedupeChildren = (
    children: readonly TeacherAssistantClassChildV1[],
  ): TeacherAssistantClassChildV1[] => {
    const seen = new Set<string>();
    return children.filter((child) => {
      if (seen.has(child.child_care_process_id)) return false;
      seen.add(child.child_care_process_id);
      return true;
    });
  };

  const weeklyChildrenOf = async (
    request: BaseRequestV1,
    careGroupId: string,
    window: Readonly<{ week_start: string; week_end: string }>,
  ) => {
    const [rawChildren, facts] = await Promise.all([
      deps.assistantReads.listClassChildren({
        workspace_id: request.workspace_id,
        care_group_id: careGroupId,
      }),
      deps.assistantReads.loadWeeklyCareFacts({
        workspace_id: request.workspace_id,
        care_group_id: careGroupId,
        week_start: window.week_start,
        week_end: window.week_end,
      }),
    ]);
    const children = dedupeChildren(rawChildren);
    // The frozen page is the whole answer: a class the schema cannot
    // represent must refuse, never silently truncate.
    if (children.length > MAX_CHILDREN) return null;
    const factsByChild = new Map(
      facts.map((entry) => [entry.child_care_process_id, entry] as const),
    );
    return children.map((child) => {
      const fact = factsByChild.get(child.child_care_process_id);
      return {
        child_care_process_id: child.child_care_process_id,
        child_safe_label: safeLabel(child.display_label),
        care_counts: cappedCounts(
          fact?.care_counts
            ?? ({} as Record<TeacherAssistantCareKind, number>),
        ),
        confirmed_media_count: Math.min(
          Math.max(fact?.confirmed_media_count ?? 0, 0),
          COUNT_CAP,
        ),
      };
    });
  };

  const owner: TeacherAssistantQueryOwnerPortV1 = {
    async missingRecords({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const careGroupId = membership.entry.care_group_id;
      const [children, recorded, eligibility] = await Promise.all([
        deps.assistantReads.listClassChildren({
          workspace_id: request.workspace_id,
          care_group_id: careGroupId,
        }),
        deps.assistantReads.listRecordedDayKinds({
          workspace_id: request.workspace_id,
          care_group_id: careGroupId,
          local_date: request.local_date,
        }),
        deps.supplementEligibility.resolveCaregiverDailyCareEligibility({
          workspace_id: request.workspace_id,
          participant_id: membership.context.participant_id,
        }),
      ]);
      const classChildren = dedupeChildren(children);
      if (classChildren.length > MAX_CHILDREN) {
        // The frozen page is the whole answer: refuse, never truncate a
        // class into a silently partial missing-record report.
        return unavailable(request.context_ref, "content_unavailable");
      }
      const recordedByChild = new Map(
        recorded.map((entry) => [entry.child_care_process_id, entry.kinds] as const),
      );
      const supplementable = new Set(
        eligibility.children.map((child) => child.child_care_process_id),
      );
      let missingTotal = 0;
      const rows = classChildren.map((child) => {
        const kinds = new Set(recordedByChild.get(child.child_care_process_id) ?? []);
        const present = TEACHER_ASSISTANT_CARE_KINDS.filter((kind) => kinds.has(kind));
        const missing = TEACHER_ASSISTANT_CARE_KINDS.filter((kind) => !kinds.has(kind));
        missingTotal += missing.length;
        const childRef = childRefOf(request.workspace_id, child.child_care_process_id);
        return {
          child_ref: childRef,
          child_safe_label: safeLabel(child.display_label),
          present_kinds: present,
          missing_kinds: missing,
          // A typed descriptor only: the target rereads current authority
          // and nothing here is executable or writes anything.
          ...(missing.length > 0
            ? {
                handoff: {
                  interface_key: "nurture.teacher-organization-owner" as const,
                  interface_version: "1.0.0" as const,
                  operation: "supplement_exchange" as const,
                  child_ref: childRef,
                  availability: supplementable.has(child.child_care_process_id)
                    ? ("available" as const)
                    : ("unavailable" as const),
                },
              }
            : {}),
        };
      });
      return {
        ...readyEnvelope(
          request,
          authority,
          "missing_records_query",
          `${request.class_ref}|${request.local_date}`,
        ),
        local_date: request.local_date,
        missing_count: missingTotal,
        children: rows,
      };
    },

    async weeklySource({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const careGroupId = membership.entry.care_group_id;
      const window = teacherAssistantWeekOf(request.local_date);
      const children = await weeklyChildrenOf(request, careGroupId, window);
      if (!children) return unavailable(request.context_ref, "content_unavailable");
      const totals = children.reduce(
        (sums, child) => ({
          records:
            sums.records
            + TEACHER_ASSISTANT_CARE_KINDS.reduce(
              (inner, kind) => inner + child.care_counts[kind],
              0,
            ),
          media: sums.media + child.confirmed_media_count,
        }),
        { records: 0, media: 0 },
      );
      if (totals.records > TOTAL_CAP || totals.media > TOTAL_CAP) {
        // The schema caps class totals and the runtime validator recomputes
        // them from the children, so a clamped total is unservable — refuse
        // a week the contract cannot represent.
        return unavailable(request.context_ref, "content_unavailable");
      }
      const draftProcessId = await deps.assistantReads.findWeeklyDraftProcessId({
        workspace_id: request.workspace_id,
        process_key: teacherAssistantWeeklyProcessKey(careGroupId, window.week_start),
      });
      return {
        ...readyEnvelope(
          request,
          authority,
          "weekly_source_query",
          `${request.class_ref}|${window.week_start}`,
        ),
        week_start: window.week_start,
        week_end: window.week_end,
        children: children.map((child) => ({
          child_ref: childRefOf(request.workspace_id, child.child_care_process_id),
          child_safe_label: child.child_safe_label,
          care_counts: child.care_counts,
          confirmed_media_count: child.confirmed_media_count,
        })),
        class_total_records: totals.records,
        class_total_confirmed_media: totals.media,
        ...(draftProcessId
          ? { draft_process_ref: processRefOf(request.workspace_id, draftProcessId) }
          : {}),
      };
    },

    async weeklyDraft({ request }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const careGroupId = membership.entry.care_group_id;
      const participantId = membership.context.participant_id;
      const window = teacherAssistantWeekOf(request.local_date);
      const processKey = teacherAssistantWeeklyProcessKey(
        careGroupId,
        window.week_start,
      );
      const children = await weeklyChildrenOf(request, careGroupId, window);
      const totalRecords = (children ?? []).reduce(
        (sum, child) =>
          sum
          + TEACHER_ASSISTANT_CARE_KINDS.reduce(
            (inner, kind) => inner + child.care_counts[kind],
            0,
          )
          + child.confirmed_media_count,
        0,
      );
      if (!children || totalRecords === 0) {
        // Unrepresentable class or nothing to summarize — but never mask a
        // replay or a duplicate: when the (class, week) draft already
        // exists the command runs so the ledger or the domain answers it
        // (the W7 lesson).
        const existing = await deps.assistantReads.findWeeklyDraftProcessId({
          workspace_id: request.workspace_id,
          process_key: processKey,
        });
        if (!existing) {
          return children
            ? notCommitted(request, "no_weekly_facts")
            : unavailable(request.context_ref, "content_unavailable");
        }
      }

      // The deterministic weekly-facts document: safe labels and counts
      // only — no refs, no ids, no generated prose. Absent when the class
      // is unrepresentable; apply then refuses deterministically while
      // replays and duplicates still answer through the ledger/domain.
      const document = children
        ? {
            schema_version: 1,
            kind: "weekly_care_summary_facts",
            week_start: window.week_start,
            week_end: window.week_end,
            children: children.map((child) => ({
              child_safe_label: child.child_safe_label,
              care_counts: child.care_counts,
              confirmed_media_count: child.confirmed_media_count,
            })),
          }
        : undefined;
      const contentDigest = document ? digestOf(document) : "sha256:unrepresentable";
      const organizerInputRevision = `weekly:${window.week_start}@${contentDigest}`;
      const titleEnvelope = document
        ? deps.protectedContent.seal(`每周成长小结 ${window.week_start}`)
        : undefined;
      const bodyEnvelope = document
        ? deps.protectedContent.seal(JSON.stringify(document))
        : undefined;
      const committedAt = now().toISOString();

      let facts: NurtureWeeklyDraftFacts | undefined;
      const stateOf = (existing: { state: "draft" | "needs_review" }) =>
        existing.state;
      const spec: NurtureCommandSpec<Record<string, unknown>> = {
        command_key: "teacher_assistant_weekly_draft",
        command_scope: "teacher_assistant_query",
        contract_version: 1,
        canonicalize: (payload) => payload,
        checkPreconditions: async (transaction) => {
          if (!transaction.teacherAssistant) {
            return {
              status: "blocked",
              reason_code: "teacher_assistant_port_unavailable",
            };
          }
          const loaded = await transaction.teacherAssistant.loadWeeklyDraftFacts({
            workspace_id: request.workspace_id,
            participant_id: participantId,
            care_group_id: careGroupId,
            process_key: processKey,
          });
          if (!loaded) {
            return { status: "blocked", reason_code: "not_authorized" };
          }
          if (loaded.existing) {
            return {
              status: "already_satisfied",
              output_refs: [
                {
                  schema_version: 1,
                  namespace: "nurture",
                  object_type: "publish_process",
                  object_id: loaded.existing.process_id,
                  version: 1,
                },
              ],
              result_schema_version: 1,
              committed_result: {
                schema_version: 1,
                process_id: loaded.existing.process_id,
                state: stateOf(loaded.existing),
                week_start: window.week_start,
              },
            };
          }
          if (!loaded.safety_policy) {
            return { status: "blocked", reason_code: "safety_route_unavailable" };
          }
          if (loaded.targets.length === 0) {
            return { status: "blocked", reason_code: "no_eligible_target" };
          }
          facts = loaded;
          return { status: "ready" };
        },
        apply: async (transaction) => {
          if (!document || !titleEnvelope || !bodyEnvelope) {
            // The class is unrepresentable and no draft existed when the
            // command was assembled; refuse deterministically inside the
            // transaction rather than sealing a partial document.
            throw new NurtureDeterministicRollback(
              "weekly_source_unrepresentable",
              "blocked",
            );
          }
          if (!facts?.safety_policy || !transaction.teacherAssistant) {
            throw new Error("teacher assistant apply facts unavailable");
          }
          // Facts-only content evaluated through the same deterministic
          // safety route the organize lane uses; no classifier participates.
          const { assessment } = evaluateContentSafetyRoute({
            policy_ref: facts.safety_policy.policy_ref,
            policy_head: facts.safety_policy.policy_head,
            sources: [
              {
                source_id: processKey,
                fact_kind: "teacher_text",
                markers: [],
              },
            ],
            classifier: null,
          });
          const state = assessment.route === "ordinary" ? "draft" : "needs_review";
          const applied = await transaction.teacherAssistant.applyWeeklyDraftProcess({
            workspace_id: request.workspace_id,
            care_group_id: careGroupId,
            process_key: processKey,
            state,
            week_start: window.week_start,
            week_end: window.week_end,
            safety: {
              route: assessment.route,
              policy_ref: assessment.policyRef,
              policy_head: assessment.policyHead,
              rule_revision: assessment.ruleRevision,
              risk_codes: assessment.riskCodes,
            },
            content_digest: contentDigest,
            organizer_input_revision: organizerInputRevision,
            command_request_id: request.command_request_id,
            title_envelope: titleEnvelope,
            body_envelope: bodyEnvelope,
            authorizing_role_assignment_id: facts.authorizing_role_assignment_id,
            targets: facts.targets.map((target) => ({
              ...target,
              target_key: publishTargetKey(target),
            })),
          });
          return {
            output_refs: [
              {
                schema_version: 1,
                namespace: "nurture",
                object_type: "publish_process",
                object_id: applied.process_id,
                version: applied.process_version,
              },
            ],
            result_schema_version: 1,
            committed_result: {
              schema_version: 1,
              process_id: applied.process_id,
              state,
              week_start: window.week_start,
              committed_at: committedAt,
            },
          };
        },
      };

      const result = await deps.commands.execute({
        workspace_id: request.workspace_id,
        invocation_request_id: request.host_request_id,
        command_request_id: request.command_request_id,
        business_actor_ref: participantId,
        payload: {
          care_group_id: careGroupId,
          week_start: window.week_start,
          actor_binding_ref: actorBindingOf(request.workspace_id, participantId),
        },
        spec,
      });
      if (result.status === "outcome_unknown") {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      if (result.status === "ok") {
        const committed = isRecord(result.committed_result)
          ? result.committed_result
          : undefined;
        if (
          !committed
          || typeof committed.process_id !== "string"
          || (committed.state !== "draft" && committed.state !== "needs_review")
          || typeof committed.week_start !== "string"
        ) {
          return outcomeUnknown(request.context_ref, request.command_request_id);
        }
        return {
          status: "committed",
          context_ref: request.context_ref,
          command_request_id: request.command_request_id,
          executed: result.disposition,
          disposition:
            result.business_outcome === "already_satisfied"
              ? "already_satisfied"
              : "created",
          process_ref: processRefOf(request.workspace_id, committed.process_id),
          week_start: committed.week_start,
          state: committed.state,
        };
      }
      if (result.decision === "idempotency_conflict") {
        return notCommitted(request, "command_payload_conflict");
      }
      if (result.reason_code === "not_authorized") {
        return masked(request.context_ref, "access_changed");
      }
      if (
        result.reason_code === "safety_route_unavailable"
        || result.reason_code === "no_eligible_target"
      ) {
        return notCommitted(request, result.reason_code);
      }
      if (isNurtureCommandRetryable(result)) {
        // Rolled-back write conflicts and busy locks are safe to retry with
        // the same command; a retry finds the winner and answers
        // replayed/already_satisfied instead of failing terminally.
        return unavailable(request.context_ref, "temporarily_unavailable");
      }
      return unavailable(request.context_ref, "content_unavailable");
    },
  };

  return { authorityResolver, owner };
};
