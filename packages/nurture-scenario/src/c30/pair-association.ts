import {
  assertScenarioCanonicalBindingPairExchangeV1,
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  assertScenarioHumanPrincipalV1,
  assertScenarioIdentityOperationStatusLookupRequestV1,
  type CanonicalRef,
  type ScenarioCanonicalBindingPairRequestV1,
  type ScenarioCanonicalBindingPairResultV1,
  type ScenarioCurrentOwnerBindingPairEvidenceV1,
  type ScenarioHumanPrincipalV1,
  type ScenarioIdentityOperationStatusLookupRequestV1,
  type ScenarioIdentityOperationStatusLookupResultV1,
} from "@my-chat/workflow-contracts";
import {
  nurtureCanonicalJsonBytes,
  nurtureSha256Hex,
} from "./canonical-json.js";

export type NurtureC30LocalPairSeedV1 = {
  seed_version: 1;
  participant_id: string;
  principal_binding_id: string;
  child_id: string;
  child_display_name: string;
  child_care_process_id: string;
  family_id: string;
  family_display_name?: string;
  initial_role_assignment_id: string;
  child_association_id: string;
  family_association_id: string;
  command_execution_id: string;
};

export type NurtureC30PairAssociationCommandV1 = {
  command_version: 1;
  pair_request: ScenarioCanonicalBindingPairRequestV1;
  pair_result: ScenarioCanonicalBindingPairResultV1;
  current_owner_evidence: ScenarioCurrentOwnerBindingPairEvidenceV1;
  principal: ScenarioHumanPrincipalV1;
  local_seed: NurtureC30LocalPairSeedV1;
  scenario_command_id: string;
  scenario_command_hash: string;
  association_expectation_hash: string;
  request_nonce_hash: string;
  host_identity_evidence_hash: string;
  deadline_evidence_hash: string;
  attempt_ledger_hash: string;
  writer_fence_hash: string;
  effect_deadline_at: string;
};

export type NurtureC30PairAssociationResultV1 = {
  result_version: 1;
  identity_operation_id: string;
  scenario_command_id: string;
  disposition: "committed" | "exact_replay";
  participant_ref: CanonicalRef;
  child_care_process_ref: CanonicalRef;
  family_ref: CanonicalRef;
  scenario_execution_ref: CanonicalRef;
  scenario_commit_evidence_hash: string;
};

export type NurtureC30PairAttemptRegistrationV1 = {
  registration_version: 1;
  identity_operation_id: string;
  disposition: "eligible" | "exact_replay";
  effect_deadline_at: string;
};

export type NurtureC30PairAssociationRepository = {
  registerEligibleAttempt(
    command: NurtureC30PairAssociationCommandV1,
  ): Promise<NurtureC30PairAttemptRegistrationV1>;
  commitAssociation(
    command: NurtureC30PairAssociationCommandV1,
  ): Promise<NurtureC30PairAssociationResultV1>;
  lookupStatus(
    request: ScenarioIdentityOperationStatusLookupRequestV1,
    now: Date,
  ): Promise<ScenarioIdentityOperationStatusLookupResultV1>;
};

export type NurtureC30PairAssociationErrorCode =
  | "pair_command_invalid"
  | "pair_evidence_mismatch"
  | "pair_attempt_conflict"
  | "pair_attempt_not_current"
  | "pair_authority_denied"
  | "pair_local_conflict"
  | "pair_concurrency_conflict";

export class NurtureC30PairAssociationError extends Error {
  constructor(readonly code: NurtureC30PairAssociationErrorCode, message: string) {
    super(message);
    this.name = "NurtureC30PairAssociationError";
  }
}

export function assertNurtureC30PairAssociationCommandV1(
  command: NurtureC30PairAssociationCommandV1,
): void {
  try {
    assertScenarioCanonicalBindingPairExchangeV1(command.pair_request, command.pair_result);
    assertScenarioCurrentOwnerBindingPairEvidenceV1(command.current_owner_evidence);
    assertScenarioHumanPrincipalV1(command.principal);
  } catch (error) {
    throw new NurtureC30PairAssociationError(
      "pair_command_invalid",
      error instanceof Error ? error.message : "The pair command is invalid.",
    );
  }
  if (command.command_version !== 1 || command.local_seed.seed_version !== 1) {
    fail("pair_command_invalid", "The pair command version is invalid.");
  }
  if (
    command.pair_request.scenario_key !== "nurture"
    || !sameRef(command.pair_request.workspace_ref, command.principal.workspace_ref)
    || command.current_owner_evidence.purpose_key !== "associate_canonical_pair"
    || command.current_owner_evidence.pair_relation_evidence_hash
      !== command.pair_request.pair_relation_evidence_hash
  ) {
    fail("pair_evidence_mismatch", "The pair command route or evidence does not match.");
  }
  const slots = command.pair_result.bindings.map((binding) => binding.binding_slot);
  if (slots[0] !== "child" || slots[1] !== "family") {
    fail("pair_evidence_mismatch", "The Nurture pair must be ordered child then family.");
  }
  command.pair_result.bindings.forEach((binding, index) => {
    const evidence = command.current_owner_evidence.owner_bindings[index];
    if (
      !evidence
      || evidence.binding_slot !== binding.binding_slot
      || !sameRef(evidence.owner_ref, binding.scenario_owner_ref)
    ) {
      fail("pair_evidence_mismatch", "Current owner evidence does not match the pair result.");
    }
  });
  assertOwnerRef(command.pair_result.bindings[0]?.scenario_owner_ref, "child_binding_anchor");
  assertOwnerRef(command.pair_result.bindings[1]?.scenario_owner_ref, "family_binding_anchor");
  for (const [field, value] of Object.entries(command.local_seed)) {
    if (field === "seed_version" || field === "family_display_name") continue;
    if (field === "child_display_name") {
      if (!isBoundedText(value, 200)) fail("pair_command_invalid", "Child display name is invalid.");
      continue;
    }
    if (!isOpaqueId(value)) fail("pair_command_invalid", `Local seed ${field} is invalid.`);
  }
  if (
    command.local_seed.family_display_name !== undefined
    && !isBoundedText(command.local_seed.family_display_name, 200)
  ) {
    fail("pair_command_invalid", "Family display name is invalid.");
  }
  if (
    command.local_seed.participant_id !== command.local_seed.participant_id.trim()
    || !isOpaqueId(command.scenario_command_id)
  ) {
    fail("pair_command_invalid", "The pair command identifiers are invalid.");
  }
  for (const digest of [
    command.scenario_command_hash,
    command.association_expectation_hash,
    command.request_nonce_hash,
    command.host_identity_evidence_hash,
    command.deadline_evidence_hash,
    command.attempt_ledger_hash,
    command.writer_fence_hash,
  ]) {
    if (!sha256Pattern.test(digest)) fail("pair_command_invalid", "The pair command digest is invalid.");
  }
  if (command.association_expectation_hash !== computeNurtureC30AssociationExpectationHash(command)) {
    fail("pair_evidence_mismatch", "The local association expectation hash does not match.");
  }
  if (command.scenario_command_hash !== computeNurtureC30PairCommandHash(command)) {
    fail("pair_evidence_mismatch", "The Scenario command hash does not match.");
  }
  const deadline = Date.parse(command.effect_deadline_at);
  if (!canonicalInstantPattern.test(command.effect_deadline_at) || !Number.isFinite(deadline)) {
    fail("pair_command_invalid", "The effect deadline is invalid.");
  }
}

export function computeNurtureC30AssociationExpectationHash(
  command: Pick<
    NurtureC30PairAssociationCommandV1,
    "pair_request" | "pair_result" | "current_owner_evidence" | "principal" | "local_seed"
  >,
): string {
  return hashCanonical({
    hash_version: 1,
    identity_operation_id: command.pair_request.identity_operation_id,
    pair_commit_evidence_hash: command.pair_result.pair_commit_evidence_hash,
    current_owner_evidence_hash: command.current_owner_evidence.current_owner_evidence_hash,
    workspace_ref: command.principal.workspace_ref,
    actor_ref: command.principal.actor_ref,
    local_seed: command.local_seed,
  });
}

export function computeNurtureC30PairCommandHash(
  command: Omit<NurtureC30PairAssociationCommandV1, "scenario_command_hash">,
): string {
  return hashCanonical({
    hash_version: 1,
    command_version: command.command_version,
    identity_operation_id: command.pair_request.identity_operation_id,
    canonical_input_hash: command.pair_request.canonical_input_hash,
    association_expectation_hash: command.association_expectation_hash,
    scenario_command_id: command.scenario_command_id,
    request_nonce_hash: command.request_nonce_hash,
    host_identity_evidence_hash: command.host_identity_evidence_hash,
    deadline_evidence_hash: command.deadline_evidence_hash,
    attempt_ledger_hash: command.attempt_ledger_hash,
    writer_fence_hash: command.writer_fence_hash,
    effect_deadline_at: command.effect_deadline_at,
  });
}

export function assertNurtureC30StatusLookupRequest(
  request: ScenarioIdentityOperationStatusLookupRequestV1,
): void {
  try {
    assertScenarioIdentityOperationStatusLookupRequestV1(request);
  } catch (error) {
    throw new NurtureC30PairAssociationError(
      "pair_command_invalid",
      error instanceof Error ? error.message : "The status request is invalid.",
    );
  }
}

function assertOwnerRef(value: CanonicalRef | undefined, objectType: string): void {
  if (
    !value
    || value.namespace !== "nurture"
    || value.object_type !== objectType
    || !isOpaqueId(value.object_id)
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
  ) {
    fail("pair_evidence_mismatch", `The ${objectType} owner ref is invalid.`);
  }
}

function hashCanonical(value: unknown): string {
  return nurtureSha256Hex(nurtureCanonicalJsonBytes(value));
}

function sameRef(left: CanonicalRef, right: CanonicalRef): boolean {
  return left.schema_version === right.schema_version
    && left.namespace === right.namespace
    && left.object_type === right.object_type
    && left.object_id === right.object_id
    && left.version === right.version;
}

function isOpaqueId(value: unknown): value is string {
  return typeof value === "string" && opaqueIdPattern.test(value);
}

function isBoundedText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim() === value && value.length >= 1 && value.length <= maximum;
}

function fail(code: NurtureC30PairAssociationErrorCode, message: string): never {
  throw new NurtureC30PairAssociationError(code, message);
}

const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
