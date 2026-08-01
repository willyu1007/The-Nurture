import { createHmac } from "node:crypto";
import { classifySafetyIntent } from "../domain/safety-classifier.js";
import {
  NurtureInteractionContextService,
} from "../domain/interactions/interaction-context.js";
import type { NurtureCommandSpec } from "../domain/commands/command-kernel.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import type { ProtectedContentWritePort } from "./protected-content.js";

/**
 * G2-A first action: guardian-initiated family-care question through the
 * Harness (08-increment-1-submit-ux-contract.md is the normative input
 * contract; 10-g2-schema-freeze.md owns the three-axis write shape).
 */
export const SUBMIT_FAMILY_CARE_QUESTION_CAPABILITY = {
  key: "submit_family_care_question",
  version: "1.0.0",
} as const;

const MIN_BODY_CHARS = 1;
const MAX_BODY_CHARS = 2_000;
const INPUT_KEYS = new Set(["body", "context_continuation_of_item_ref"]);
const OPTION_REF_VERSION = "1";

export type SubmitFamilyCareQuestionInputV1 = {
  body: string;
  context_continuation_of_item_ref?: string;
};

export type SubmitFamilyCareQuestionParse =
  | { status: "ok"; input: SubmitFamilyCareQuestionInputV1 }
  | { status: "invalid"; fields: string[] };

/**
 * Closed operation-input parse: protected plain text plus the optional
 * context continuation ref. Raw targets, grants, classification, routing and
 * internal content refs are rejected as unknown fields; canonicalization is
 * mechanical trim only — never an LLM rewrite.
 */
export const parseSubmitFamilyCareQuestionInputV1 = (
  value: unknown,
): SubmitFamilyCareQuestionParse => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["body"] };
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !INPUT_KEYS.has(key))) {
    return {
      status: "invalid",
      fields: Object.keys(record).filter((key) => !INPUT_KEYS.has(key)),
    };
  }
  const fields: string[] = [];
  const body = typeof record.body === "string" ? record.body.trim() : "";
  if (body.length < MIN_BODY_CHARS || body.length > MAX_BODY_CHARS) fields.push("body");
  let continuation: string | undefined;
  if (record.context_continuation_of_item_ref !== undefined) {
    if (
      typeof record.context_continuation_of_item_ref !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(record.context_continuation_of_item_ref)
    ) {
      fields.push("context_continuation_of_item_ref");
    } else {
      continuation = record.context_continuation_of_item_ref;
    }
  }
  if (fields.length > 0) return { status: "invalid", fields };
  return {
    status: "ok",
    input: { body, ...(continuation ? { context_continuation_of_item_ref: continuation } : {}) },
  };
};

/**
 * Keyed body digest used inside the canonical command payload so neither the
 * CommandExecution payload hash nor the confirmation stores an enumerable
 * bare hash of a low-entropy protected body.
 */
export const computeProtectedBodyTag = (integrityKey: string, body: string): string => {
  if (typeof integrityKey !== "string" || integrityKey.length < 32) {
    throw new Error("harness integrity key must contain at least 32 characters");
  }
  return createHmac("sha256", integrityKey)
    .update("nurture.protected-body.v1\0", "utf8")
    .update(body, "utf8")
    .digest("hex");
};

// Owner-issued, actor-bound target option. The embedded id is unusable
// without the keyed tag, and execute re-resolves current authority anyway.
export const issueTargetOptionRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string; enrollment_id: string },
): string => {
  const tag = createHmac("sha256", integrityKey)
    .update(
      `nurture.target-option.v${OPTION_REF_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${scope.enrollment_id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `${OPTION_REF_VERSION}.${scope.enrollment_id}.${tag}`;
};

export const resolveTargetOptionRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
): string | null => {
  const parts = ref.split(".");
  if (parts.length !== 3 || parts[0] !== OPTION_REF_VERSION) return null;
  const [, enrollmentId] = parts;
  if (!enrollmentId) return null;
  return issueTargetOptionRef(integrityKey, { ...scope, enrollment_id: enrollmentId }) === ref
    ? enrollmentId
    : null;
};

export type GuardianSubmitTarget = {
  enrollment_id: string;
  care_group_id: string;
  child_care_process_id: string;
  family_id: string;
  display_label: string;
};

export type SubmitEligibilityReadPort = {
  resolveGuardianSubmitEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{ participant_active: boolean; targets: GuardianSubmitTarget[] }>;
  resolveContinuationSource(input: {
    workspace_id: string;
    participant_id: string;
    item_id: string;
    enrollment_id: string;
  }): Promise<{ eligible: boolean }>;
};

export type SubmitPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: { normalized_body: string; target_label: string; effect: "send_family_care_question" };
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
      enrollment_id: string;
    }
  | {
      status: "needs_input";
      fields?: string[];
      choices?: Array<{ target_option_ref: string; display_label: string }>;
    }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string; alternate_process?: string };

export type SubmitPrepareDependencies = {
  eligibility: SubmitEligibilityReadPort;
  contexts: NurtureInteractionContextService;
  integrity_key: string;
  create_command_id?: () => string;
};

export type SubmitPrepareRequest = {
  workspace_id: string;
  participant_id: string;
  surface: string;
  host_conversation_ref?: string;
  operation_input: unknown;
  target_option_ref?: string;
};

export const canonicalizeSubmitCommand = (
  integrityKey: string,
  command: SubmitFamilyCareQuestionCommandV1,
): unknown => ({
  body_tag: computeProtectedBodyTag(integrityKey, command.body),
  enrollment_id: command.enrollment_id,
  context_continuation_of_item_id: command.context_continuation_of_item_id ?? null,
});

/**
 * Prepare branch per 08-increment-1: `ready_to_confirm | needs_input |
 * denied | unavailable`. No business fact is created; the only persisted
 * state is the body-free confirmation row.
 */
export const prepareSubmitFamilyCareQuestion = async (
  deps: SubmitPrepareDependencies,
  request: SubmitPrepareRequest,
): Promise<SubmitPrepareDecision> => {
  const parsed = parseSubmitFamilyCareQuestionInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };

  const safety = classifySafetyIntent({ health_or_safety_material: [parsed.input.body] });
  if (safety.overall_level === "restricted") {
    return {
      status: "unavailable",
      reason_code: safety.reason_code ?? "SAFETY_RESTRICTED_INTENT",
      alternate_process: "offline_emergency_or_medical_channel",
    };
  }

  const eligibility = await deps.eligibility.resolveGuardianSubmitEligibility({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  });
  if (!eligibility.participant_active || eligibility.targets.length === 0) {
    return { status: "denied", reason_code: "not_authorized" };
  }

  let target: GuardianSubmitTarget | undefined;
  if (eligibility.targets.length === 1) {
    target = eligibility.targets[0];
  } else if (request.target_option_ref) {
    const enrollmentId = resolveTargetOptionRef(
      deps.integrity_key,
      { workspace_id: request.workspace_id, participant_id: request.participant_id },
      request.target_option_ref,
    );
    target = eligibility.targets.find((entry) => entry.enrollment_id === enrollmentId);
  }
  if (!target) {
    return {
      status: "needs_input",
      choices: eligibility.targets.map((entry) => ({
        target_option_ref: issueTargetOptionRef(deps.integrity_key, {
          workspace_id: request.workspace_id,
          participant_id: request.participant_id,
          enrollment_id: entry.enrollment_id,
        }),
        display_label: entry.display_label,
      })),
    };
  }

  let continuationItemId: string | undefined;
  if (parsed.input.context_continuation_of_item_ref) {
    continuationItemId = parsed.input.context_continuation_of_item_ref;
    const continuation = await deps.eligibility.resolveContinuationSource({
      workspace_id: request.workspace_id,
      participant_id: request.participant_id,
      item_id: continuationItemId,
      enrollment_id: target.enrollment_id,
    });
    if (!continuation.eligible) return { status: "denied", reason_code: "invalid_continuation" };
  }

  const commandRequestId = (deps.create_command_id ?? (() => `command:${crypto.randomUUID()}`))();
  const command: SubmitFamilyCareQuestionCommandV1 = {
    body: parsed.input.body,
    enrollment_id: target.enrollment_id,
    ...(continuationItemId ? { context_continuation_of_item_id: continuationItemId } : {}),
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: SUBMIT_FAMILY_CARE_QUESTION_CAPABILITY.key,
      capability_version: SUBMIT_FAMILY_CARE_QUESTION_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: {
        enrollment: target.enrollment_id,
        ...(continuationItemId ? { continuation_item: continuationItemId } : {}),
      },
      expected_heads: {},
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeSubmitCommand(deps.integrity_key, command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      normalized_body: parsed.input.body,
      target_label: target.display_label,
      effect: "send_family_care_question",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
    enrollment_id: target.enrollment_id,
  };
};

export type SubmitFamilyCareQuestionCommandV1 = {
  body: string;
  enrollment_id: string;
  context_continuation_of_item_id?: string;
};

const SAFE_SUMMARY = "New family care question";

/**
 * The three-axis Harness writer for the submit effect. Facts are re-read
 * inside the command transaction; the protected body is sealed through the
 * no-store port and bound to the Message in the same transaction.
 */
export const createSubmitFamilyCareQuestionSpec = (deps: {
  protected_content: ProtectedContentWritePort;
  integrity_key: string;
}): NurtureCommandSpec<SubmitFamilyCareQuestionCommandV1> => ({
  command_key: SUBMIT_FAMILY_CARE_QUESTION_CAPABILITY.key,
  command_scope: "family_care",
  contract_version: 1,
  canonicalize: (input) => canonicalizeSubmitCommand(deps.integrity_key, input),
  async checkPreconditions(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.loadG2SubmitFacts) {
      return { status: "invalid", reason_code: "family_care_port_unavailable" };
    }
    if (
      typeof input.body !== "string" ||
      input.body.trim() !== input.body ||
      input.body.length < MIN_BODY_CHARS ||
      input.body.length > MAX_BODY_CHARS
    ) {
      return { status: "invalid", reason_code: "invalid_protected_body" };
    }
    const safety = classifySafetyIntent({ health_or_safety_material: [input.body] });
    if (safety.overall_level === "restricted") {
      return {
        status: "blocked",
        reason_code: safety.reason_code ?? "SAFETY_RESTRICTED_INTENT",
      };
    }
    const facts = await familyCare.loadG2SubmitFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      enrollment_id: input.enrollment_id,
      ...(input.context_continuation_of_item_id
        ? { context_continuation_of_item_id: input.context_continuation_of_item_id }
        : {}),
    });
    if (!facts.participant_active || !facts.guardian_role_assignment_id) {
      return { status: "blocked", reason_code: "not_authorized" };
    }
    if (!facts.enrollment_active || !facts.thread_id) {
      return { status: "conflict", reason_code: "target_unavailable" };
    }
    if (
      facts.grant.status !== "active" ||
      !facts.grant.directions.includes("family_to_org") ||
      !facts.grant.directions.includes("org_to_family")
    ) {
      return { status: "blocked", reason_code: "grant_unavailable" };
    }
    if (input.context_continuation_of_item_id && facts.continuation_eligible !== true) {
      return { status: "conflict", reason_code: "invalid_continuation" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.applyG2Submit || !familyCare.loadG2SubmitFacts) {
      throw new Error("family care G2 transaction port is unavailable");
    }
    const facts = await familyCare.loadG2SubmitFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      enrollment_id: input.enrollment_id,
      ...(input.context_continuation_of_item_id
        ? { context_continuation_of_item_id: input.context_continuation_of_item_id }
        : {}),
    });
    if (
      !facts.guardian_role_assignment_id ||
      !facts.child_care_process_id ||
      !facts.family_id ||
      !facts.care_group_id ||
      !facts.thread_id ||
      facts.grant.status !== "active"
    ) {
      throw new Error("G2 submit facts changed inside the transaction");
    }
    const applied = await familyCare.applyG2Submit({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      enrollment_id: input.enrollment_id,
      ...(input.context_continuation_of_item_id
        ? { context_continuation_of_item_id: input.context_continuation_of_item_id }
        : {}),
      guardian_role_assignment_id: facts.guardian_role_assignment_id,
      child_care_process_id: facts.child_care_process_id,
      family_id: facts.family_id,
      care_group_id: facts.care_group_id,
      thread_id: facts.thread_id,
      grant_id: facts.grant.grant_id,
      body_envelope: deps.protected_content.seal(input.body),
      safe_summary: SAFE_SUMMARY,
    });
    return {
      output_refs: [
        applied.message_ref,
        applied.item_ref,
        applied.item_event_ref,
        applied.receipt_ref,
        applied.attention_ref,
      ],
    };
  },
});
