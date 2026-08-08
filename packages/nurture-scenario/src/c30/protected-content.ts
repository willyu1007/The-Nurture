import {
  assertCanonicalRef,
  assertReadScenarioProtectedDetailInputV1,
  assertScenarioPreparedProtectedContentControlV1,
  assertScenarioProtectedContentReadLocatorV1,
  assertScenarioProtectedInteractionContractV1,
  assertScenarioProtectedPlainTextCarrierForContractV1,
  assertScenarioHumanPrincipalV1,
  type CanonicalRef,
  type ReadScenarioProtectedDetailInputV1,
  type ReadScenarioProtectedDetailResultV1,
  type ScenarioCommittedProtectedContentControlV1,
  type ScenarioPreparedProtectedContentControlV1,
  type ScenarioProtectedContentReadLocatorV1,
  type ScenarioProtectedInteractionContractV1,
  type ScenarioProtectedPlainTextCarrierV1,
  type ScenarioHumanPrincipalV1,
} from "@my-chat/workflow-contracts";
import { nurtureCanonicalJsonBytes, nurtureSha256Hex } from "./canonical-json.js";
import {
  computeNurtureC30PrincipalBindingHash,
  type NurtureC30ActionTargetV1,
} from "./canonical-action.js";
import type { AuthorizedNurtureParticipantV1 } from "./participant-binding.js";

export const nurtureC30ProtectedEncryptionAlgorithm = "aes-256-gcm" as const;
export const nurtureC30ProtectedEncryptionVersion = 1 as const;

export type NurtureC30ProtectedAuthorityEvidenceV1 = {
  authorized: true;
  authority_evidence_hash: string;
  authority_revision: number;
  pair_evidence_hash: string;
  policy_evidence_hash: string;
};

export type NurtureC30ProtectedCommitCommandV1 = {
  protected_store_command_version: 1;
  content_id: string;
  contract: ScenarioProtectedInteractionContractV1;
  carrier: ScenarioProtectedPlainTextCarrierV1;
  prepared_content: ScenarioPreparedProtectedContentControlV1;
  principal: ScenarioHumanPrincipalV1;
  current_participant: AuthorizedNurtureParticipantV1;
  current_target: NurtureC30ActionTargetV1;
  owning_action_ref: CanonicalRef;
  aggregate_ref: CanonicalRef;
  request_identity_hash: string;
  accepted_carrier_binding_hash: string;
  canonical_payload_hash: string;
  readable_until: string;
  retention_until: string;
};

export type NurtureC30ProtectedReadCommandV1 = {
  protected_store_read_version: 1;
  contract: ScenarioProtectedInteractionContractV1;
  locator: ScenarioProtectedContentReadLocatorV1;
  request: ReadScenarioProtectedDetailInputV1;
  principal: ScenarioHumanPrincipalV1;
  current_participant: AuthorizedNurtureParticipantV1;
  current_target: NurtureC30ActionTargetV1;
  request_identity_hash: string;
  verified_foreground_context_hash: string;
};

export type NurtureC30ProtectedEraseReasonV1 =
  | "revoked"
  | "redacted"
  | "expired"
  | "policy_changed"
  | "retention_elapsed"
  | "crypto_erasure";

export type NurtureC30ProtectedEraseCommandV1 = {
  protected_store_erase_version: 1;
  contract: ScenarioProtectedInteractionContractV1;
  protected_content_ref: string;
  principal: ScenarioHumanPrincipalV1;
  current_participant: AuthorizedNurtureParticipantV1;
  current_target: NurtureC30ActionTargetV1;
  reason: NurtureC30ProtectedEraseReasonV1;
  transition_evidence_hash: string;
};

export type NurtureC30ProtectedCommitResultV1 = {
  result_version: 1;
  disposition: "committed" | "replayed";
  committed_content: ScenarioCommittedProtectedContentControlV1;
};

export type NurtureC30ProtectedReadResultV1 = {
  result: ReadScenarioProtectedDetailResultV1;
  carrier?: ScenarioProtectedPlainTextCarrierV1;
  cache_control: "no-store";
};

export type NurtureC30ProtectedEraseResultV1 = {
  result_version: 1;
  lifecycle: "tombstoned" | "erased";
  disposition: "transitioned" | "already_terminal";
};

export type NurtureC30ProtectedContentRepository = {
  commit(command: NurtureC30ProtectedCommitCommandV1): Promise<NurtureC30ProtectedCommitResultV1>;
  read(command: NurtureC30ProtectedReadCommandV1): Promise<NurtureC30ProtectedReadResultV1>;
  erase(command: NurtureC30ProtectedEraseCommandV1): Promise<NurtureC30ProtectedEraseResultV1>;
};

export type NurtureC30WrappedDataKeyV1 = {
  wrapped_dek: Uint8Array;
  kms_key_domain: string;
  kms_key_version: string;
  kms_key_handle: string;
  wrapping_algorithm: string;
};

export type NurtureC30ProvisionedDataKeyV1 = NurtureC30WrappedDataKeyV1 & {
  plaintext_dek: Uint8Array;
};

export type NurtureC30ProtectedKmsPort = {
  /**
   * Idempotently provisions one data key for the durable provisioning key.
   * Replays MUST return the same DEK and wrapped-key identity until erasure.
   */
  provisionDataKey(input: {
    provisioning_key: string;
    content_ref_hash: string;
    encryption_context_hash: string;
  }): Promise<NurtureC30ProvisionedDataKeyV1>;
  unwrapDataKey(input: NurtureC30WrappedDataKeyV1 & {
    content_ref_hash: string;
    encryption_context_hash: string;
  }): Promise<Uint8Array>;
  destroyDataKey(input: {
    kms_key_domain: string;
    kms_key_version: string;
    kms_key_handle: string;
    content_ref_hash: string;
    erasure_evidence_hash: string;
  }): Promise<void>;
};

export type NurtureC30ProtectedReadBindingV1 = {
  keyed_binding_hash: string;
  valid_until: string;
};

export type NurtureC30ProtectedReadBindingPort = {
  bindCurrent(input: {
    verified_foreground_context_hash: string;
    request_identity_hash: string;
    principal: ScenarioHumanPrincipalV1;
    current_participant: AuthorizedNurtureParticipantV1;
    contract: ScenarioProtectedInteractionContractV1;
    protected_content_ref: string;
    protected_content_version: string;
    carrier: ScenarioProtectedPlainTextCarrierV1;
    now: Date;
  }): Promise<NurtureC30ProtectedReadBindingV1>;
};

export type NurtureC30ProtectedIntegrityPort = {
  verify(input: {
    carrier: ScenarioProtectedPlainTextCarrierV1;
    protected_content_ref: string;
    request_identity_hash: string;
    expected_keyed_integrity_hash: string;
  }): Promise<boolean>;
};

export class DenyNurtureC30ProtectedKmsPort implements NurtureC30ProtectedKmsPort {
  async provisionDataKey(
    _input: Parameters<NurtureC30ProtectedKmsPort["provisionDataKey"]>[0],
  ): Promise<never> {
    throw protectedError("protected_kms_unavailable", "Protected KMS is not configured.");
  }

  async unwrapDataKey(_input: Parameters<NurtureC30ProtectedKmsPort["unwrapDataKey"]>[0]): Promise<never> {
    throw protectedError("protected_kms_unavailable", "Protected KMS is not configured.");
  }

  async destroyDataKey(_input: Parameters<NurtureC30ProtectedKmsPort["destroyDataKey"]>[0]): Promise<never> {
    throw protectedError("protected_kms_unavailable", "Protected KMS is not configured.");
  }
}

export class DenyNurtureC30ProtectedReadBindingPort
implements NurtureC30ProtectedReadBindingPort {
  async bindCurrent(): Promise<never> {
    throw protectedError("protected_context_changed", "Protected foreground binding is not configured.");
  }
}

export class DenyNurtureC30ProtectedIntegrityPort
implements NurtureC30ProtectedIntegrityPort {
  async verify(_input: Parameters<NurtureC30ProtectedIntegrityPort["verify"]>[0]): Promise<boolean> {
    return false;
  }
}

export function assertNurtureC30ProtectedCommitCommandV1(
  command: NurtureC30ProtectedCommitCommandV1,
): void {
  assertScenarioProtectedInteractionContractV1(command.contract);
  assertScenarioProtectedPlainTextCarrierForContractV1(command.contract, command.carrier);
  assertScenarioPreparedProtectedContentControlV1(command.prepared_content);
  assertCanonicalRef(command.owning_action_ref, "owning_action_ref");
  assertCanonicalRef(command.aggregate_ref, "aggregate_ref");
  assertCommonContext(command.principal, command.current_participant, command.current_target);
  const readableUntil = canonicalInstant(command.readable_until, "readable_until");
  const retentionUntil = canonicalInstant(command.retention_until, "retention_until");
  const preparedExpiry = canonicalInstant(command.prepared_content.expires_at, "prepared expires_at");
  if (
    command.protected_store_command_version !== 1
    || !opaqueIdPattern.test(command.content_id)
    || command.contract.scenario_key !== "nurture"
    || command.prepared_content.content_kind !== command.contract.content_kind
    || hashCanonical(command.aggregate_ref) !== hashCanonical(command.current_target.primary_scope_ref)
    || readableUntil <= preparedExpiry
    || retentionUntil < readableUntil
    || retentionUntil - readableUntil > maximumRetentionTailMs
  ) throw protectedError("protected_request_invalid", "Protected commit context is invalid.");
  for (const value of [
    command.request_identity_hash,
    command.accepted_carrier_binding_hash,
    command.canonical_payload_hash,
    command.prepared_content.keyed_integrity_hash,
  ]) assertSha256(value);
}

export function assertNurtureC30ProtectedReadCommandV1(
  command: NurtureC30ProtectedReadCommandV1,
): void {
  assertScenarioProtectedInteractionContractV1(command.contract);
  assertScenarioProtectedContentReadLocatorV1(command.locator);
  assertReadScenarioProtectedDetailInputV1(command.request);
  assertCommonContext(command.principal, command.current_participant, command.current_target);
  if (
    command.protected_store_read_version !== 1
    || command.contract.scenario_key !== "nurture"
    || command.locator.protected_content_ref !== command.request.protected_content_ref
    || command.locator.content_kind !== command.contract.content_kind
  ) throw protectedError("protected_request_invalid", "Protected read context is invalid.");
  for (const value of [
    command.request_identity_hash,
    command.verified_foreground_context_hash,
  ]) assertSha256(value);
}

export function assertNurtureC30ProtectedEraseCommandV1(
  command: NurtureC30ProtectedEraseCommandV1,
): void {
  assertScenarioProtectedInteractionContractV1(command.contract);
  assertCommonContext(command.principal, command.current_participant, command.current_target);
  if (
    command.protected_store_erase_version !== 1
    || command.contract.scenario_key !== "nurture"
    || !protectedEraseReasons.has(command.reason)
  ) throw protectedError("protected_request_invalid", "Protected erase context is invalid.");
  assertSha256(command.transition_evidence_hash);
}

export function computeNurtureC30ProtectedEncryptionContextHash(input: {
  protected_content_ref: string;
  workspace_ref: CanonicalRef;
  scenario_key: string;
  action_key: string;
  content_kind: string;
  protected_field_key: string;
  aggregate_ref: CanonicalRef;
  committed_content_version: string;
}): string {
  return hashCanonical({
    encryption_context_version: 1,
    ...input,
    workspace_ref: workspaceRef(input.workspace_ref.object_id),
  });
}

export function computeNurtureC30ProtectedContentRefHash(protectedContentRef: string): string {
  return nurtureSha256Hex(Buffer.from(protectedContentRef, "utf8"));
}

export type NurtureC30ProtectedContentErrorCode =
  | "protected_request_invalid"
  | "protected_authority_denied"
  | "protected_context_changed"
  | "protected_integrity_failed"
  | "protected_kms_unavailable"
  | "protected_conflict";

export class NurtureC30ProtectedContentError extends Error {
  constructor(readonly code: NurtureC30ProtectedContentErrorCode, message: string) {
    super(message);
    this.name = "NurtureC30ProtectedContentError";
  }
}

export function nurtureC30ProtectedContentError(
  code: NurtureC30ProtectedContentErrorCode,
  message: string,
): NurtureC30ProtectedContentError {
  return protectedError(code, message);
}

function assertCommonContext(
  principal: ScenarioHumanPrincipalV1,
  participant: AuthorizedNurtureParticipantV1,
  target: NurtureC30ActionTargetV1,
): void {
  assertScenarioHumanPrincipalV1(principal);
  assertCanonicalRef(participant.participant_ref, "current_participant.participant_ref");
  assertCanonicalRef(participant.workspace_ref, "current_participant.workspace_ref");
  assertCanonicalRef(target.workspace_ref, "current_target.workspace_ref");
  assertCanonicalRef(target.primary_scope_ref, "current_target.primary_scope_ref");
  if (target.child_care_process_ref) {
    assertCanonicalRef(target.child_care_process_ref, "current_target.child_care_process_ref");
  }
  if (
    participant.participant_ref.namespace !== "nurture"
    || participant.participant_ref.object_type !== "participant"
    || participant.workspace_ref.object_id !== principal.workspace_ref.object_id
    || !Number.isSafeInteger(participant.binding_revision)
    || participant.binding_revision < 1
    || !Number.isSafeInteger(participant.authority_revision)
    || participant.authority_revision < 1
    || target.workspace_ref.namespace !== "my_chat"
    || target.workspace_ref.object_type !== "workspace"
    || target.workspace_ref.object_id !== principal.workspace_ref.object_id
    || target.target_principal_binding_hash
      !== computeNurtureC30PrincipalBindingHash(principal, participant)
    || target.child_care_process_ref === undefined
    || target.child_care_process_ref.namespace !== "nurture"
    || target.child_care_process_ref.object_type !== "child_care_process"
    || hashCanonical(target.child_care_process_ref) !== hashCanonical(target.primary_scope_ref)
  ) throw protectedError("protected_context_changed", "Protected owner context changed.");
}

function canonicalInstant(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!canonicalInstantPattern.test(value) || !Number.isFinite(parsed)) {
    throw protectedError("protected_request_invalid", `${label} is invalid.`);
  }
  return parsed;
}

function assertSha256(value: string): void {
  if (!sha256Pattern.test(value)) {
    throw protectedError("protected_request_invalid", "Protected evidence digest is invalid.");
  }
}

function hashCanonical(value: unknown): string {
  return nurtureSha256Hex(nurtureCanonicalJsonBytes(value));
}

function workspaceRef(workspaceId: string): CanonicalRef {
  return {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workspace",
    object_id: workspaceId,
  };
}

function protectedError(
  code: NurtureC30ProtectedContentErrorCode,
  message: string,
): NurtureC30ProtectedContentError {
  return new NurtureC30ProtectedContentError(code, message);
}

const maximumRetentionTailMs = 366 * 24 * 60 * 60 * 1000;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const protectedEraseReasons = new Set<NurtureC30ProtectedEraseReasonV1>([
  "revoked",
  "redacted",
  "expired",
  "policy_changed",
  "retention_elapsed",
  "crypto_erasure",
]);
