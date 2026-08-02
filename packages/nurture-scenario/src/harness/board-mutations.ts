import { randomUUID } from "node:crypto";
import type { NurtureCommandSpec } from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import type {
  NurtureCaregiverDailyCareFacts,
  NurtureGuardianFocusGoalFacts,
} from "../domain/institution/board-mutation-transaction.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardTargetRef,
  resolveBoardTargetRef,
  type BoardScopeV1,
} from "./board-projection.js";
import { issueCapabilityResultRef } from "./keyed-refs.js";

/**
 * G3-A inline board mutations.
 *
 * A board card may be adjusted in place, but the change is always submitted to
 * the canonical owner of the fact it touches. Neither capability writes a board
 * snapshot, a derived projection or a unified child-state row, and neither is a
 * publication: recording an internal class fact never makes it family-visible.
 */
export const UPDATE_GUARDIAN_CURRENT_FOCUS_CAPABILITY = {
  key: "update_guardian_current_focus",
  version: "1.0.0",
} as const;

export const RECORD_CAREGIVER_DAILY_CARE_CAPABILITY = {
  key: "record_caregiver_daily_care",
  version: "1.0.0",
} as const;

export const FOCUS_GOAL_TARGET_KIND = "focus_goal";
export const CHILD_CARE_PROCESS_TARGET_KIND = "child_care_process";

const MIN_LABEL_CHARS = 1;
const MAX_LABEL_CHARS = 200;
const MIN_SUMMARY_CHARS = 1;
const MAX_SUMMARY_CHARS = 500;
const MIN_PRIORITY = 1;
const MAX_PRIORITY = 99;

export const DAILY_CARE_KINDS = [
  "meal",
  "nap",
  "mood",
  "activity",
  "health_observation",
] as const;

export type DailyCareKindV1 = (typeof DAILY_CARE_KINDS)[number];

export type BoardMutationPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string };

type ParsedInput<Input> =
  | { status: "ok"; input: Input }
  | { status: "invalid"; fields: string[] };

const closedRecord = (
  value: unknown,
  allowed: readonly string[],
): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).every((key) => allowed.includes(key)) ? record : null;
};

// ---------------------------------------------------------------------------
// update_guardian_current_focus

export type UpdateGuardianCurrentFocusInputV1 = { label: string; priority: number };

export const parseUpdateGuardianCurrentFocusInputV1 = (
  value: unknown,
): ParsedInput<UpdateGuardianCurrentFocusInputV1> => {
  const record = closedRecord(value, ["label", "priority"]);
  if (!record) return { status: "invalid", fields: ["label", "priority"] };
  const fields: string[] = [];
  const label = typeof record.label === "string" ? record.label.trim() : "";
  if (label.length < MIN_LABEL_CHARS || label.length > MAX_LABEL_CHARS) fields.push("label");
  const priority = record.priority;
  if (
    typeof priority !== "number" ||
    !Number.isSafeInteger(priority) ||
    priority < MIN_PRIORITY ||
    priority > MAX_PRIORITY
  ) {
    fields.push("priority");
  }
  if (fields.length > 0) return { status: "invalid", fields };
  return { status: "ok", input: { label, priority: priority as number } };
};

export type UpdateGuardianCurrentFocusCommandV1 = {
  label: string;
  priority: number;
  focus_goal_id: string;
  focus_cycle_id: string;
  expected_focus_cycle_version: number;
  expected_focus_goal_version: number;
};

export const canonicalizeUpdateGuardianCurrentFocusCommand = (
  input: UpdateGuardianCurrentFocusCommandV1,
): unknown => ({
  label: input.label,
  priority: input.priority,
  focus_goal_id: input.focus_goal_id,
  focus_cycle_id: input.focus_cycle_id,
  expected_focus_cycle_version: input.expected_focus_cycle_version,
  expected_focus_goal_version: input.expected_focus_goal_version,
});

const focusGoalWritable = (facts: NurtureGuardianFocusGoalFacts): boolean =>
  facts.participant_active &&
  facts.guardian_authority_current &&
  Boolean(facts.family_ref_key) &&
  Boolean(facts.focus_cycle_id);

export type GuardianFocusEligibilityReadPort = {
  resolveGuardianFocusEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{
    participant_active: boolean;
    goals: Array<{
      focus_goal_id: string;
      focus_cycle_id: string;
      display_label: string;
      focus_cycle_version: number;
      focus_goal_version: number;
    }>;
  }>;
};

export const prepareUpdateGuardianCurrentFocus = async (
  deps: {
    eligibility: GuardianFocusEligibilityReadPort;
    contexts: NurtureInteractionContextService;
    integrity_key: string;
    create_command_id?: () => string;
  },
  request: BoardScopeV1 & {
    surface: string;
    host_conversation_ref?: string;
    operation_input: unknown;
    target_option_ref?: string;
  },
): Promise<BoardMutationPrepareDecision> => {
  const parsed = parseUpdateGuardianCurrentFocusInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };

  const eligibility = await deps.eligibility.resolveGuardianFocusEligibility({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  });
  if (!eligibility.participant_active || eligibility.goals.length === 0) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  // Only an owner-issued, actor-bound ref selects the goal; a raw FocusGoal id
  // never resolves, so it can never route a write.
  const focusGoalId = resolveBoardTargetRef(
    deps.integrity_key,
    request,
    FOCUS_GOAL_TARGET_KIND,
    request.target_option_ref,
  );
  const target = eligibility.goals.find((goal) => goal.focus_goal_id === focusGoalId);
  if (!target) return { status: "denied", reason_code: "not_authorized" };

  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: UpdateGuardianCurrentFocusCommandV1 = {
    label: parsed.input.label,
    priority: parsed.input.priority,
    focus_goal_id: target.focus_goal_id,
    focus_cycle_id: target.focus_cycle_id,
    expected_focus_cycle_version: target.focus_cycle_version,
    expected_focus_goal_version: target.focus_goal_version,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: UPDATE_GUARDIAN_CURRENT_FOCUS_CAPABILITY.key,
      capability_version: UPDATE_GUARDIAN_CURRENT_FOCUS_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: {
        focus_goal: target.focus_goal_id,
        focus_cycle: target.focus_cycle_id,
      },
      expected_heads: {
        focus_cycle: command.expected_focus_cycle_version,
        focus_goal: command.expected_focus_goal_version,
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeUpdateGuardianCurrentFocusCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      normalized_label: command.label,
      priority: command.priority,
      target_label: target.display_label,
      effect: "update_guardian_current_focus",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const createUpdateGuardianCurrentFocusSpec = (deps: {
  integrity_key: string;
}): NurtureCommandSpec<UpdateGuardianCurrentFocusCommandV1> => ({
  command_key: UPDATE_GUARDIAN_CURRENT_FOCUS_CAPABILITY.key,
  command_scope: "board_focus",
  contract_version: 1,
  canonicalize: canonicalizeUpdateGuardianCurrentFocusCommand,
  async checkPreconditions(transaction, input, context) {
    const board = transaction.boardMutations;
    if (!board) return { status: "invalid", reason_code: "board_mutation_port_unavailable" };
    const parsed = parseUpdateGuardianCurrentFocusInputV1({
      label: input.label,
      priority: input.priority,
    });
    if (parsed.status === "invalid" || parsed.input.label !== input.label) {
      return { status: "invalid", reason_code: "invalid_focus_input" };
    }
    const facts = await board.loadGuardianFocusGoalFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      focus_goal_id: input.focus_goal_id,
    });
    if (!focusGoalWritable(facts) || facts.focus_cycle_id !== input.focus_cycle_id) {
      return { status: "blocked", reason_code: "not_authorized" };
    }
    if (
      facts.focus_cycle_version !== input.expected_focus_cycle_version ||
      facts.focus_goal_version !== input.expected_focus_goal_version
    ) {
      return { status: "conflict", reason_code: "stale_confirmation" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const board = transaction.boardMutations;
    if (!board) throw new Error("board mutation owner port is unavailable");
    // The owner is re-read inside the transaction: a board snapshot, cache or
    // optimistic client state is never the authority for the committed change.
    const facts = await board.loadGuardianFocusGoalFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      focus_goal_id: input.focus_goal_id,
    });
    if (
      !focusGoalWritable(facts) ||
      facts.focus_cycle_id !== input.focus_cycle_id ||
      facts.focus_cycle_version !== input.expected_focus_cycle_version ||
      facts.focus_goal_version !== input.expected_focus_goal_version
    ) {
      throw new Error("guardian focus facts changed inside the transaction");
    }
    const applied = await board.applyGuardianFocusGoalUpdate({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      focus_goal_id: input.focus_goal_id,
      focus_cycle_id: input.focus_cycle_id,
      label: input.label,
      priority: input.priority,
      expected_focus_goal_version: input.expected_focus_goal_version,
    });
    return {
      output_refs: [applied.focus_goal_ref],
      result_schema_version: 1,
      committed_result: {
        focusGoalRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "focus_goal",
          applied.focus_goal_ref,
        ),
        revision: applied.revision,
        // Explicit child scope stays an owner fact; this capability never
        // promotes a family-scope goal into a child-scoped one by writing text.
        scopeSource: facts.child_scope_explicit ? "explicit_child_scope" : "family_scope",
      },
    };
  },
});

// ---------------------------------------------------------------------------
// record_caregiver_daily_care

export type RecordCaregiverDailyCareInputV1 = {
  kind: DailyCareKindV1;
  summary: string;
};

export const parseRecordCaregiverDailyCareInputV1 = (
  value: unknown,
): ParsedInput<RecordCaregiverDailyCareInputV1> => {
  const record = closedRecord(value, ["kind", "summary"]);
  if (!record) return { status: "invalid", fields: ["kind", "summary"] };
  const fields: string[] = [];
  const kind = record.kind;
  if (typeof kind !== "string" || !DAILY_CARE_KINDS.includes(kind as DailyCareKindV1)) {
    fields.push("kind");
  }
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  if (summary.length < MIN_SUMMARY_CHARS || summary.length > MAX_SUMMARY_CHARS) {
    fields.push("summary");
  }
  if (fields.length > 0) return { status: "invalid", fields };
  return { status: "ok", input: { kind: kind as DailyCareKindV1, summary } };
};

export type RecordCaregiverDailyCareCommandV1 = {
  kind: DailyCareKindV1;
  summary: string;
  child_care_process_id: string;
  expected_care_group_version: number;
  expected_role_version: number;
  expected_enrollment_version: number;
};

export const canonicalizeRecordCaregiverDailyCareCommand = (
  input: RecordCaregiverDailyCareCommandV1,
): unknown => ({
  kind: input.kind,
  summary: input.summary,
  child_care_process_id: input.child_care_process_id,
  expected_care_group_version: input.expected_care_group_version,
  expected_role_version: input.expected_role_version,
  expected_enrollment_version: input.expected_enrollment_version,
});

const dailyCareWritable = (facts: NurtureCaregiverDailyCareFacts): boolean =>
  facts.participant_active &&
  CAREGIVER_BOARD_ROLES.includes(facts.caregiver_role) &&
  facts.role_scope_type === "care_group" &&
  facts.role_scope_matches_source &&
  facts.enrollment_active &&
  Boolean(facts.caregiver_role_assignment_id) &&
  Boolean(facts.care_group_id) &&
  Boolean(facts.enrollment_id);

export type CaregiverDailyCareEligibilityReadPort = {
  resolveCaregiverDailyCareEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{
    participant_active: boolean;
    children: Array<{
      child_care_process_id: string;
      display_label: string;
      care_group_version: number;
      caregiver_role_version: number;
      enrollment_version: number;
    }>;
  }>;
};

export const prepareRecordCaregiverDailyCare = async (
  deps: {
    eligibility: CaregiverDailyCareEligibilityReadPort;
    contexts: NurtureInteractionContextService;
    integrity_key: string;
    create_command_id?: () => string;
  },
  request: BoardScopeV1 & {
    surface: string;
    host_conversation_ref?: string;
    operation_input: unknown;
    target_option_ref?: string;
  },
): Promise<BoardMutationPrepareDecision> => {
  const parsed = parseRecordCaregiverDailyCareInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };

  const eligibility = await deps.eligibility.resolveCaregiverDailyCareEligibility({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  });
  if (!eligibility.participant_active || eligibility.children.length === 0) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const childCareProcessId = resolveBoardTargetRef(
    deps.integrity_key,
    request,
    CHILD_CARE_PROCESS_TARGET_KIND,
    request.target_option_ref,
  );
  const target = eligibility.children.find(
    (child) => child.child_care_process_id === childCareProcessId,
  );
  if (!target) return { status: "denied", reason_code: "not_authorized" };

  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: RecordCaregiverDailyCareCommandV1 = {
    kind: parsed.input.kind,
    summary: parsed.input.summary,
    child_care_process_id: target.child_care_process_id,
    expected_care_group_version: target.care_group_version,
    expected_role_version: target.caregiver_role_version,
    expected_enrollment_version: target.enrollment_version,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: RECORD_CAREGIVER_DAILY_CARE_CAPABILITY.key,
      capability_version: RECORD_CAREGIVER_DAILY_CARE_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { child_care_process: target.child_care_process_id },
      expected_heads: {
        care_group: command.expected_care_group_version,
        role: command.expected_role_version,
        enrollment: command.expected_enrollment_version,
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeRecordCaregiverDailyCareCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      kind: command.kind,
      normalized_summary: command.summary,
      target_label: target.display_label,
      effect: "record_caregiver_daily_care",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const createRecordCaregiverDailyCareSpec = (deps: {
  integrity_key: string;
}): NurtureCommandSpec<RecordCaregiverDailyCareCommandV1> => ({
  command_key: RECORD_CAREGIVER_DAILY_CARE_CAPABILITY.key,
  command_scope: "board_daily_care",
  contract_version: 1,
  canonicalize: canonicalizeRecordCaregiverDailyCareCommand,
  async checkPreconditions(transaction, input, context) {
    const board = transaction.boardMutations;
    if (!board) return { status: "invalid", reason_code: "board_mutation_port_unavailable" };
    const parsed = parseRecordCaregiverDailyCareInputV1({
      kind: input.kind,
      summary: input.summary,
    });
    if (parsed.status === "invalid" || parsed.input.summary !== input.summary) {
      return { status: "invalid", reason_code: "invalid_daily_care_input" };
    }
    const facts = await board.loadCaregiverDailyCareFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      child_care_process_id: input.child_care_process_id,
    });
    if (!dailyCareWritable(facts)) return { status: "blocked", reason_code: "not_authorized" };
    if (
      facts.care_group_version !== input.expected_care_group_version ||
      facts.caregiver_role_version !== input.expected_role_version ||
      facts.enrollment_version !== input.expected_enrollment_version
    ) {
      return { status: "conflict", reason_code: "stale_confirmation" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const board = transaction.boardMutations;
    if (!board) throw new Error("board mutation owner port is unavailable");
    const facts = await board.loadCaregiverDailyCareFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      child_care_process_id: input.child_care_process_id,
    });
    if (
      !dailyCareWritable(facts) ||
      !facts.caregiver_role_assignment_id ||
      !facts.care_group_id ||
      !facts.enrollment_id ||
      facts.care_group_version !== input.expected_care_group_version ||
      facts.caregiver_role_version !== input.expected_role_version ||
      facts.enrollment_version !== input.expected_enrollment_version
    ) {
      throw new Error("caregiver daily-care facts changed inside the transaction");
    }
    const applied = await board.applyCaregiverDailyCareRecord({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      child_care_process_id: input.child_care_process_id,
      care_group_id: facts.care_group_id,
      enrollment_id: facts.enrollment_id,
      recorded_by_role_assignment_id: facts.caregiver_role_assignment_id,
      kind: input.kind,
      summary: input.summary,
      expected_enrollment_version: input.expected_enrollment_version,
    });
    return {
      output_refs: [applied.daily_care_log_ref],
      result_schema_version: 1,
      // An internal class fact only. It is not a publication: no release,
      // Receipt or family-visibility claim is produced here.
      committed_result: {
        dailyCareLogRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "daily_care_log",
          applied.daily_care_log_ref,
        ),
        kind: input.kind,
        recordedAt: applied.recorded_at,
      },
    };
  },
});

/** Owner-issued target refs the board hands to these two capabilities. */
export const issueFocusGoalTargetRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  focusGoalId: string,
): string => issueBoardTargetRef(integrityKey, scope, FOCUS_GOAL_TARGET_KIND, focusGoalId);

export const issueChildCareProcessTargetRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  childCareProcessId: string,
): string =>
  issueBoardTargetRef(integrityKey, scope, CHILD_CARE_PROCESS_TARGET_KIND, childCareProcessId);
