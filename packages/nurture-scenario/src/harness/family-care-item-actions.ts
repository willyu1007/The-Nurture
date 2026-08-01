import { createHmac, randomUUID } from "node:crypto";
import type {
  NurtureCommandSpec,
} from "../domain/commands/command-kernel.js";
import type {
  FamilyCareTransactionInput,
  G2ItemActionFacts,
  G2ItemActionPayload,
} from "../domain/institution/family-care-transaction.js";
import {
  NurtureInteractionContextService,
} from "../domain/interactions/interaction-context.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import type { ProtectedContentWritePort } from "./protected-content.js";
import { computeProtectedBodyTag } from "./submit-family-care-question.js";

/**
 * G2-A caregiver-side actions on one exact CareItem: the convergent class
 * acknowledgement and the append-compatible class reply (01-plan G2-05).
 * Authority is the exact CareGroup current caregiver/lead caregiver; the
 * acknowledging actor is audit evidence, never an assignment.
 */
export const ACKNOWLEDGE_FAMILY_CARE_ITEM_CAPABILITY = {
  key: "acknowledge_family_care_item",
  version: "1.0.0",
} as const;

export const REPLY_FAMILY_CARE_ITEM_CAPABILITY = {
  key: "reply_family_care_item",
  version: "1.0.0",
} as const;

const MIN_BODY_CHARS = 1;
const MAX_BODY_CHARS = 2_000;
const ITEM_REF_VERSION = "1";

// Owner-issued, actor-bound CareItem target ref: raw ids are unusable
// without the keyed tag, and execute re-reads current authority anyway.
export const issueCareItemTargetRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string; item_id: string },
): string => {
  const tag = createHmac("sha256", integrityKey)
    .update(
      `nurture.care-item-target.v${ITEM_REF_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${scope.item_id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `${ITEM_REF_VERSION}.${scope.item_id}.${tag}`;
};

export const resolveCareItemTargetRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
): string | null => {
  const parts = ref.split(".");
  if (parts.length !== 3 || parts[0] !== ITEM_REF_VERSION || !parts[1]) return null;
  return issueCareItemTargetRef(integrityKey, { ...scope, item_id: parts[1] }) === ref
    ? parts[1]
    : null;
};

export type ItemActionFactsReadPort = {
  loadG2ItemActionFacts(
    input: FamilyCareTransactionInput<G2ItemActionPayload>,
  ): Promise<G2ItemActionFacts>;
};

export type ItemActionPrepareDependencies = {
  facts: ItemActionFactsReadPort;
  contexts: NurtureInteractionContextService;
  integrity_key: string;
  create_command_id?: () => string;
};

export type ItemActionPrepareRequest = {
  workspace_id: string;
  participant_id: string;
  surface: string;
  host_conversation_ref?: string;
  target_option_ref: string;
  operation_input?: unknown;
};

export type ItemActionPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: { target_label: string; effect: string };
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
      item_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string };

type ItemGate =
  | { status: "ok"; facts: G2ItemActionFacts; item_id: string }
  | { status: "refused"; decision: ItemActionPrepareDecision };

const gateItemAction = async (
  deps: ItemActionPrepareDependencies,
  request: ItemActionPrepareRequest,
  requiredDirection: "family_to_org" | "org_to_family",
): Promise<ItemGate> => {
  const itemId = resolveCareItemTargetRef(
    deps.integrity_key,
    { workspace_id: request.workspace_id, participant_id: request.participant_id },
    request.target_option_ref,
  );
  if (!itemId) {
    return { status: "refused", decision: { status: "denied", reason_code: "not_authorized" } };
  }
  const facts = await deps.facts.loadG2ItemActionFacts({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    item_id: itemId,
  });
  if (!facts.participant_active || !facts.caregiver_role_assignment_id || !facts.item_present) {
    return { status: "refused", decision: { status: "denied", reason_code: "not_authorized" } };
  }
  if (facts.writer_contract === "legacy_v1") {
    return {
      status: "refused",
      decision: { status: "denied", reason_code: "legacy_item_not_supported" },
    };
  }
  if (facts.lifecycle_state !== "active") {
    return { status: "refused", decision: { status: "denied", reason_code: "target_unavailable" } };
  }
  if (facts.grant.status !== "active" || !facts.grant.directions.includes(requiredDirection)) {
    return { status: "refused", decision: { status: "denied", reason_code: "grant_unavailable" } };
  }
  return { status: "ok", facts, item_id: itemId };
};

export type AcknowledgeFamilyCareItemCommandV1 = {
  item_id: string;
  expected_acknowledgement_head: number;
  expected_lifecycle_head: number;
};

export const canonicalizeAcknowledgeCommand = (
  command: AcknowledgeFamilyCareItemCommandV1,
): unknown => ({
  item_id: command.item_id,
  expected_acknowledgement_head: command.expected_acknowledgement_head,
  expected_lifecycle_head: command.expected_lifecycle_head,
});

/**
 * Acknowledge prepare: the typed input is the empty object; the exact
 * acknowledgement and lifecycle heads are frozen into the confirmation. An
 * already-acknowledged item still prepares — execute converges to
 * already_satisfied without a second event or a false personal attribution.
 */
export const prepareAcknowledgeFamilyCareItem = async (
  deps: ItemActionPrepareDependencies,
  request: ItemActionPrepareRequest,
): Promise<ItemActionPrepareDecision> => {
  if (
    request.operation_input !== undefined &&
    (typeof request.operation_input !== "object" ||
      request.operation_input === null ||
      Object.keys(request.operation_input).length > 0)
  ) {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  const gate = await gateItemAction(deps, request, "family_to_org");
  if (gate.status === "refused") return gate.decision;
  const { facts, item_id } = gate;

  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: AcknowledgeFamilyCareItemCommandV1 = {
    item_id,
    expected_acknowledgement_head: facts.acknowledgement_head ?? 0,
    expected_lifecycle_head: facts.lifecycle_head ?? 0,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: ACKNOWLEDGE_FAMILY_CARE_ITEM_CAPABILITY.key,
      capability_version: ACKNOWLEDGE_FAMILY_CARE_ITEM_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { care_item: item_id },
      expected_heads: {
        acknowledgement: command.expected_acknowledgement_head,
        lifecycle: command.expected_lifecycle_head,
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeAcknowledgeCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      target_label: facts.item_safe_summary ?? "Family care item",
      effect: "acknowledge_family_care_item",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
    item_id,
  };
};

/**
 * The convergent class acknowledgement. `already_satisfied` only when the
 * exact acknowledged postcondition already holds and the remaining
 * lifecycle/authority fences are still valid; any other drift stays stale.
 */
export const createAcknowledgeFamilyCareItemSpec =
  (): NurtureCommandSpec<AcknowledgeFamilyCareItemCommandV1> => ({
    command_key: ACKNOWLEDGE_FAMILY_CARE_ITEM_CAPABILITY.key,
    command_scope: "family_care",
    contract_version: 1,
    canonicalize: canonicalizeAcknowledgeCommand,
    async checkPreconditions(transaction, input, context) {
      const familyCare = transaction.familyCare;
      if (!familyCare?.loadG2ItemActionFacts) {
        return { status: "invalid", reason_code: "family_care_port_unavailable" };
      }
      const facts = await familyCare.loadG2ItemActionFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        item_id: input.item_id,
      });
      if (!facts.participant_active || !facts.caregiver_role_assignment_id || !facts.item_present) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      if (facts.writer_contract === "legacy_v1") {
        return { status: "blocked", reason_code: "legacy_item_not_supported" };
      }
      if (facts.lifecycle_state !== "active") {
        return { status: "conflict", reason_code: "target_unavailable" };
      }
      if (facts.lifecycle_head !== input.expected_lifecycle_head) {
        return { status: "conflict", reason_code: "stale_confirmation" };
      }
      if (
        facts.grant.status !== "active" ||
        !facts.grant.directions.includes("family_to_org")
      ) {
        return { status: "blocked", reason_code: "grant_unavailable" };
      }
      if (facts.acknowledgement_state === "acknowledged") {
        // Convergence needs provable evidence of the existing acknowledgement;
        // an unprovable postcondition fails closed rather than committing an
        // already_satisfied execution with no output refs.
        const existing = facts.existing_acknowledgement_refs ?? [];
        if (existing.length === 0) {
          return { status: "conflict", reason_code: "acknowledgement_evidence_unavailable" };
        }
        return { status: "already_satisfied", output_refs: existing };
      }
      if (facts.acknowledgement_head !== input.expected_acknowledgement_head) {
        return { status: "conflict", reason_code: "stale_confirmation" };
      }
      return { status: "ready" };
    },
    async apply(transaction, input, context) {
      const familyCare = transaction.familyCare;
      if (!familyCare?.applyG2Acknowledge || !familyCare.loadG2ItemActionFacts) {
        throw new Error("family care G2 transaction port is unavailable");
      }
      const facts = await familyCare.loadG2ItemActionFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        item_id: input.item_id,
      });
      if (!facts.caregiver_role_assignment_id) {
        throw new Error("G2 acknowledge facts changed inside the transaction");
      }
      const applied = await familyCare.applyG2Acknowledge({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        item_id: input.item_id,
        caregiver_role_assignment_id: facts.caregiver_role_assignment_id,
        expected_acknowledgement_head: input.expected_acknowledgement_head,
      });
      return {
        output_refs: [
          applied.item_ref,
          applied.item_event_ref,
          ...(applied.receipt_ref ? [applied.receipt_ref] : []),
        ],
      };
    },
  });

export type ReplyFamilyCareItemInputV1 = { body: string };

export type ReplyFamilyCareItemCommandV1 = {
  body: string;
  item_id: string;
  expected_lifecycle_head: number;
};

const REPLY_INPUT_KEYS = new Set(["body"]);

export const parseReplyFamilyCareItemInputV1 = (
  value: unknown,
): { status: "ok"; input: ReplyFamilyCareItemInputV1 } | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["body"] };
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !REPLY_INPUT_KEYS.has(key))) {
    return {
      status: "invalid",
      fields: Object.keys(record).filter((key) => !REPLY_INPUT_KEYS.has(key)),
    };
  }
  const body = typeof record.body === "string" ? record.body.trim() : "";
  if (body.length < MIN_BODY_CHARS || body.length > MAX_BODY_CHARS) {
    return { status: "invalid", fields: ["body"] };
  }
  return { status: "ok", input: { body } };
};

export const canonicalizeReplyCommand = (
  integrityKey: string,
  command: ReplyFamilyCareItemCommandV1,
): unknown => ({
  body_tag: computeProtectedBodyTag(integrityKey, command.body),
  item_id: command.item_id,
  expected_lifecycle_head: command.expected_lifecycle_head,
});

/**
 * Reply prepare: protected body only; the replyable lifecycle head is frozen
 * while the response axis stays free — another legitimate class reply never
 * makes this confirmation stale (append-compatible concurrency).
 */
export const prepareReplyFamilyCareItem = async (
  deps: ItemActionPrepareDependencies,
  request: ItemActionPrepareRequest,
): Promise<ItemActionPrepareDecision> => {
  const parsed = parseReplyFamilyCareItemInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const gate = await gateItemAction(deps, request, "org_to_family");
  if (gate.status === "refused") return gate.decision;
  const { facts, item_id } = gate;

  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: ReplyFamilyCareItemCommandV1 = {
    body: parsed.input.body,
    item_id,
    expected_lifecycle_head: facts.lifecycle_head ?? 0,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: REPLY_FAMILY_CARE_ITEM_CAPABILITY.key,
      capability_version: REPLY_FAMILY_CARE_ITEM_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { care_item: item_id },
      expected_heads: { lifecycle: command.expected_lifecycle_head },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeReplyCommand(deps.integrity_key, command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      target_label: facts.item_safe_summary ?? "Family care item",
      effect: "reply_family_care_item",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
    item_id,
  };
};

/**
 * The append-compatible class reply: every legitimate command appends an
 * independent canonical reply Message; only the first response transition
 * resolves the waiting Attention, and the Item stays active/appendable.
 */
export const createReplyFamilyCareItemSpec = (deps: {
  protected_content: ProtectedContentWritePort;
  integrity_key: string;
}): NurtureCommandSpec<ReplyFamilyCareItemCommandV1> => ({
  command_key: REPLY_FAMILY_CARE_ITEM_CAPABILITY.key,
  command_scope: "family_care",
  contract_version: 1,
  canonicalize: (input) => canonicalizeReplyCommand(deps.integrity_key, input),
  async checkPreconditions(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.loadG2ItemActionFacts) {
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
    const facts = await familyCare.loadG2ItemActionFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      item_id: input.item_id,
    });
    if (!facts.participant_active || !facts.caregiver_role_assignment_id || !facts.item_present) {
      return { status: "blocked", reason_code: "not_authorized" };
    }
    if (facts.writer_contract === "legacy_v1") {
      return { status: "blocked", reason_code: "legacy_item_not_supported" };
    }
    if (facts.lifecycle_state !== "active") {
      return { status: "conflict", reason_code: "target_unavailable" };
    }
    if (facts.lifecycle_head !== input.expected_lifecycle_head) {
      return { status: "conflict", reason_code: "stale_confirmation" };
    }
    if (
      facts.grant.status !== "active" ||
      !facts.grant.directions.includes("org_to_family")
    ) {
      return { status: "blocked", reason_code: "grant_unavailable" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.applyG2Reply || !familyCare.loadG2ItemActionFacts) {
      throw new Error("family care G2 transaction port is unavailable");
    }
    const facts = await familyCare.loadG2ItemActionFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      item_id: input.item_id,
    });
    if (!facts.caregiver_role_assignment_id || facts.grant.status !== "active") {
      throw new Error("G2 reply facts changed inside the transaction");
    }
    const applied = await familyCare.applyG2Reply({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      item_id: input.item_id,
      caregiver_role_assignment_id: facts.caregiver_role_assignment_id,
      grant_id: facts.grant.grant_id,
      body_envelope: deps.protected_content.seal(input.body),
    });
    return {
      output_refs: [
        applied.message_ref,
        applied.item_ref,
        applied.item_event_ref,
        applied.receipt_ref,
      ],
    };
  },
});
