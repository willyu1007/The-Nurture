import type { CanonicalRef } from "@my-chat/workflow-contracts";
import {
  NurtureDeterministicRollback,
  type NurtureCommandExecutionContext,
  type NurtureCommandSpec,
  type NurtureCommandTransaction,
} from "../domain/commands/command-kernel.js";

type DomainContextRef = CanonicalRef;

/**
 * The shared shape of every T-006 board write command.
 *
 * Sixteen capabilities have to repeat the same five obligations, and each of
 * them is the kind of thing that is correct fifteen times and wrong once:
 *
 * 1. the owner write port may be absent, and the refusal has to name which one;
 * 2. the owner is re-read *inside* the command transaction, and the heads the
 *    prepare step froze are compared against what the owner holds now — a board
 *    snapshot, cache or client state is never the authority for the write;
 * 3. the typed input is parsed again inside the transaction, so an execute that
 *    resubmits something other than what prepare canonicalised cannot commit;
 * 4. `already_satisfied` must point at the fact it claims already exists, so a
 *    capability cannot report success with nothing to show for it;
 * 5. the committed result carries the capability's result schema version.
 *
 * A capability supplies only what is specific to it: how to read its facts, how
 * to authorise them, and how to write. Everything above is applied here, in one
 * place, for every capability that goes through this factory.
 */
export type BoardWriteRefusalV1 = {
  status: "invalid" | "blocked" | "conflict";
  reason_code: string;
};

export type BoardWriteEffectV1 = {
  /** At least one; the factory refuses an effect that names nothing. */
  output_refs: DomainContextRef[];
  committed_result: unknown;
};

/**
 * The outcome of authorising one owner read. `authorized` carries the exact
 * values the write may use, so `apply` cannot reach for a field the
 * authorisation never looked at.
 */
export type BoardWriteAuthorizationV1<Write> =
  | { status: "authorized"; write: Write }
  | { status: "already_satisfied"; effect: BoardWriteEffectV1 }
  | BoardWriteRefusalV1;

export type BoardWriteSpecDefinitionV1<Input, Port, Facts, Write> = {
  capability: { key: string; version: string };
  /** Distinct per capability: two board writes never share a command scope. */
  command_scope: string;
  contract_version: number;
  /** Stamped onto every committed result the factory returns. */
  result_schema_version: number;
  canonicalize(input: Input): unknown;

  /** (1) The owner write port, and the refusal that names it when absent. */
  port: {
    select(transaction: NurtureCommandTransaction): Port | undefined;
    unavailable_reason_code: string;
  };

  /**
   * (3) Re-parse the typed business input from the command payload. Returning a
   * refusal here means execute carried something prepare would not have
   * accepted.
   */
  revalidateInput(input: Input): BoardWriteRefusalV1 | null;

  /** (2) The in-transaction owner read. `null` means the target is gone. */
  loadFacts(
    port: Port,
    input: Input,
    context: NurtureCommandExecutionContext,
  ): Promise<Facts | null>;
  facts_absent_reason_code: string;

  /** (4) Authority, plus the already-satisfied evidence when it applies. */
  authorize(
    facts: Facts,
    input: Input,
    context: NurtureCommandExecutionContext,
  ): BoardWriteAuthorizationV1<Write>;

  /**
   * (2) The heads this command freezes, declared once and by name.
   *
   * Comparing two empty maps succeeds, so a capability that simply forgot its
   * head would pass head comparison unconditionally — a check that cannot fail.
   * Naming the set makes an empty one a visible statement rather than an
   * omission, and lets a contract-conformance test read it without running the
   * command. `expectedHeads` and `currentHeads` must produce exactly these keys.
   */
  head_keys: readonly string[];
  /** (2) What prepare froze, against what the owner holds inside the write. */
  expectedHeads(input: Input): Record<string, number>;
  /**
   * The input names WHICH head when one aggregate carries many — an
   * attribution head is per child, and the child is in the command.
   */
  currentHeads(facts: Facts, input: Input): Record<string, number>;
  /** Defaults to `stale_confirmation`, the reason code the transport maps to a re-prepare. */
  drift_reason_code?: string;

  apply(
    port: Port,
    input: Input,
    context: NurtureCommandExecutionContext,
    write: Write,
  ): Promise<BoardWriteEffectV1>;
};

type EvaluationV1<Port, Facts, Write> =
  | { status: "authorized"; port: Port; facts: Facts; write: Write }
  | { status: "already_satisfied"; effect: BoardWriteEffectV1 }
  | BoardWriteRefusalV1;

const DEFAULT_DRIFT_REASON_CODE = "stale_confirmation";

/**
 * Head equality over the declared key set. Comparing whatever keys happen to be
 * present would let a head quietly drop out of the comparison; `head_keys` is
 * the set, and `assertDeclaredHeads` below has already established that both
 * sides carry exactly it.
 */
const sameHeads = (
  declared: readonly string[],
  expected: Record<string, number>,
  current: Record<string, number>,
): boolean => declared.every((key) => expected[key] === current[key]);

/**
 * The produced key set must be exactly the declared one. A head that appears
 * only at runtime was never reviewable, and one that is declared but never
 * produced silently drops out of the comparison above.
 */
const assertDeclaredHeads = (
  capabilityKey: string,
  declared: readonly string[],
  produced: Record<string, number>,
  side: string,
): void => {
  const producedKeys = Object.keys(produced).sort();
  const declaredKeys = [...declared].sort();
  if (producedKeys.join("\u0000") !== declaredKeys.join("\u0000")) {
    throw new NurtureDeterministicRollback(`undeclared_${side}_head`);
  }
  if (capabilityKey.length === 0) throw new NurtureDeterministicRollback("invalid_capability_key");
};

/** A command spec that also publishes the head set it freezes. */
export type NurtureBoardWriteSpec<Input> = NurtureCommandSpec<Input> & {
  readonly board_write_head_keys: readonly string[];
};

export const createBoardWriteSpec = <Input, Port, Facts, Write>(
  definition: BoardWriteSpecDefinitionV1<Input, Port, Facts, Write>,
): NurtureBoardWriteSpec<Input> => {
  const driftReasonCode = definition.drift_reason_code ?? DEFAULT_DRIFT_REASON_CODE;

  const evaluate = async (
    transaction: NurtureCommandTransaction,
    input: Input,
    context: NurtureCommandExecutionContext,
  ): Promise<EvaluationV1<Port, Facts, Write>> => {
    const port = definition.port.select(transaction);
    if (!port) {
      return { status: "invalid", reason_code: definition.port.unavailable_reason_code };
    }
    const invalidInput = definition.revalidateInput(input);
    if (invalidInput) return invalidInput;

    const facts = await definition.loadFacts(port, input, context);
    if (!facts) {
      return { status: "blocked", reason_code: definition.facts_absent_reason_code };
    }

    const authorization = definition.authorize(facts, input, context);
    if (authorization.status === "already_satisfied") {
      // The evidence is required before the heads are compared: a second
      // request for an effect that already landed is satisfied by the fact
      // itself, and the head that produced it has necessarily moved on.
      if (authorization.effect.output_refs.length === 0) {
        throw new NurtureDeterministicRollback("already_satisfied_without_evidence");
      }
      return authorization;
    }
    if (authorization.status !== "authorized") return authorization;

    const expected = definition.expectedHeads(input);
    const current = definition.currentHeads(facts, input);
    assertDeclaredHeads(definition.capability.key, definition.head_keys, expected, "expected");
    assertDeclaredHeads(definition.capability.key, definition.head_keys, current, "current");
    if (!sameHeads(definition.head_keys, expected, current)) {
      return { status: "conflict", reason_code: driftReasonCode };
    }
    return { status: "authorized", port, facts, write: authorization.write };
  };

  return {
    command_key: definition.capability.key,
    command_scope: definition.command_scope,
    contract_version: definition.contract_version,
    /** Readable without executing anything, for the contract-conformance guard. */
    board_write_head_keys: [...definition.head_keys],
    canonicalize: definition.canonicalize,

    async checkPreconditions(transaction, input, context) {
      const evaluation = await evaluate(transaction, input, context);
      if (evaluation.status === "authorized") return { status: "ready" };
      if (evaluation.status === "already_satisfied") {
        return {
          status: "already_satisfied",
          output_refs: evaluation.effect.output_refs,
          result_schema_version: definition.result_schema_version,
          committed_result: evaluation.effect.committed_result,
        };
      }
      return evaluation;
    },

    async apply(transaction, input, context) {
      // The owner is read again here, and the write only ever uses values this
      // read authorised. A caller reaching `apply` on facts that no longer
      // authorise it aborts the whole command with a definite reason code
      // rather than writing against the earlier answer.
      const evaluation = await evaluate(transaction, input, context);
      if (evaluation.status === "already_satisfied") {
        throw new NurtureDeterministicRollback(driftReasonCode);
      }
      if (evaluation.status !== "authorized") {
        throw new NurtureDeterministicRollback(evaluation.reason_code);
      }
      const effect = await definition.apply(
        evaluation.port,
        input,
        context,
        evaluation.write,
      );
      if (effect.output_refs.length === 0) {
        throw new NurtureDeterministicRollback("committed_without_output_ref");
      }
      return {
        output_refs: effect.output_refs,
        result_schema_version: definition.result_schema_version,
        committed_result: effect.committed_result,
      };
    },
  };
};
