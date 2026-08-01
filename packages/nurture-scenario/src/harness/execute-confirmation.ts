import {
  hashScenarioToken,
  classifyInteractionContextRow,
} from "../domain/interactions/interaction-context.js";
import type {
  NurtureCommandSpec,
  NurtureCommandPreconditionDecision,
} from "../domain/commands/command-kernel.js";
import {
  computeHarnessInputIntegrityTag,
  parseHarnessConfirmationPayloadV2,
  HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION,
} from "./confirmation.js";

export type HarnessConfirmationBinding = {
  /** The opaque confirmationRef the user gesture submitted. */
  confirmation_ref: string;
  actor_participant_id: string;
  surface: string;
  host_conversation_ref?: string;
  /** Expected stable business command identity resolved before execute. */
  command_request_id: string;
  capability_key: string;
  capability_version: string;
  integrity_key: string;
  now?: () => Date;
};

const refusal = (
  status: "invalid" | "blocked" | "conflict",
  reason_code: string,
): NurtureCommandPreconditionDecision => ({ status, reason_code });

/**
 * Wraps a capability command spec so the Harness confirmation is verified and
 * consumed inside the same command transaction as the business effect
 * (G2-03). Committed replays never reach this path: the runner short-circuits
 * on the CommandExecution before opening the transaction, so a consumed
 * confirmation still yields the exact replay of its own effect.
 */
export const withHarnessConfirmation = <Input>(
  spec: NurtureCommandSpec<Input>,
  binding: HarnessConfirmationBinding,
): NurtureCommandSpec<Input> => ({
  ...spec,
  async checkPreconditions(transaction, input, context) {
    const contexts = transaction.interactionContexts;
    if (!contexts) return refusal("invalid", "harness_confirmation_unavailable");

    const now = (binding.now ?? (() => new Date()))();
    const row = await contexts.findByTokenHash({
      workspace_id: context.workspace_id,
      token_hash: hashScenarioToken(context.workspace_id, binding.confirmation_ref),
    });
    const classified = classifyInteractionContextRow(
      row,
      {
        workspace_id: context.workspace_id,
        participant_id: binding.actor_participant_id,
        purpose: "prepare_action",
        surface: binding.surface,
        ...(binding.host_conversation_ref
          ? { host_conversation_ref: binding.host_conversation_ref }
          : {}),
      },
      now,
    );
    if (classified.status === "expired") return refusal("conflict", "confirmation_expired");
    if (classified.status === "blocked") {
      if (classified.reason_code === "token_replayed") {
        return refusal("conflict", "confirmation_replayed");
      }
      if (classified.reason_code === "token_revoked") {
        return refusal("blocked", "confirmation_revoked");
      }
      return refusal("blocked", "invalid_confirmation");
    }

    const current = classified.context;
    if (current.payload_schema_version !== HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION) {
      return refusal("blocked", "invalid_confirmation");
    }
    let payload;
    try {
      payload = parseHarnessConfirmationPayloadV2(current.state_payload);
    } catch {
      return refusal("blocked", "invalid_confirmation");
    }
    if (
      payload.capability_key !== binding.capability_key ||
      payload.capability_version !== binding.capability_version ||
      payload.command_request_id !== binding.command_request_id
    ) {
      return refusal("blocked", "invalid_confirmation");
    }
    const expectedTag = computeHarnessInputIntegrityTag(
      binding.integrity_key,
      spec.canonicalize(input),
    );
    if (expectedTag !== payload.input_integrity_tag) {
      return refusal("conflict", "input_integrity_mismatch");
    }

    const consumed = await contexts.consume({
      workspace_id: context.workspace_id,
      context_id: current.id,
      expected_version: current.version,
      consumed_at: now.toISOString(),
    });
    if (!consumed) return refusal("conflict", "confirmation_replayed");

    return spec.checkPreconditions(transaction, input, context);
  },
});
