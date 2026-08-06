import { describe, expect, it } from "vitest";
import {
  assertScenarioProtectedBodyFreeControlV1,
  type ScenarioProtectedInteractionContractV1,
  type ScenarioProtectedPlainTextCarrierV1,
} from "@my-chat/workflow-contracts";
import {
  assertNurtureC30ProtectedCommitCommandV1,
  computeNurtureC30PrincipalBindingHash,
  computeNurtureC30ProtectedEncryptionContextHash,
  DenyNurtureC30ProtectedIntegrityPort,
  DenyNurtureC30ProtectedKmsPort,
  nurtureScenarioManifest,
  nurtureSha256Base64Url,
  nurtureSha256Hex,
  type NurtureC30ProtectedCommitCommandV1,
} from "../../src/index.js";

const contract: ScenarioProtectedInteractionContractV1 = {
  protected_interaction_contract_version: 1,
  scenario_key: "nurture",
  action_key: "fixture.neutral_protected_v1",
  protected_field_key: "fixture_private_text",
  content_kind: "fixture.neutral_private_text",
  prepare_operation_key: "prepare_domain_action",
  read_operation_key: "read_protected_detail",
  content_profile: {
    media_type: "text/plain; charset=utf-8",
    normalization: "trim_outer_whitespace_and_crlf_to_lf_v1",
    min_characters: 1,
    max_characters: 2000,
    attachments: "none",
  },
};

describe("C30 protected owner contracts", () => {
  it("keeps the neutral protected fixture outside production registration", () => {
    expect(nurtureScenarioManifest.scenario_contracts?.protected_interaction_contracts).toEqual([]);
    expect(JSON.stringify(nurtureScenarioManifest)).not.toContain(contract.action_key);
  });

  it("accepts only the exact normalized I1-E carrier and owner context", () => {
    const command = fixtureCommand();
    expect(() => assertNurtureC30ProtectedCommitCommandV1(command)).not.toThrow();
    expect(() => assertNurtureC30ProtectedCommitCommandV1({
      ...command,
      carrier: { ...command.carrier, plain_text: " private body " },
    })).toThrow();
    expect(() => assertNurtureC30ProtectedCommitCommandV1({
      ...command,
      aggregate_ref: ref("nurture", "child_care_process", "other-process", 1),
    })).toThrow();
  });

  it("recursively rejects plaintext copies in generic destinations", () => {
    const carrier = fixtureCommand().carrier;
    expect(() => assertScenarioProtectedBodyFreeControlV1({
      execution: { result: "body_free", refs: ["nurture:protected:opaque"] },
      audit: { evidence_hash: digest("evidence") },
      outbox: { aggregate_ref: "nurture:aggregate:fixture" },
    }, carrier, "destinations")).not.toThrow();
    expect(() => assertScenarioProtectedBodyFreeControlV1({
      execution: { nested: [{ copied_body: carrier.plain_text }] },
    }, carrier, "destinations")).toThrow();
  });

  it("binds encryption context to Workspace, action, aggregate and version", () => {
    const command = fixtureCommand();
    const base = encryptionContext(command);
    expect(base).toMatch(/^[a-f0-9]{64}$/u);
    expect(computeNurtureC30ProtectedEncryptionContextHash({
      ...encryptionContextInput(command),
      committed_content_version: "committed-other",
    })).not.toBe(base);
  });

  it("keeps unconfigured KMS and integrity verification default-deny", async () => {
    const kms = new DenyNurtureC30ProtectedKmsPort();
    await expect(kms.wrapDataKey({
      plaintext_dek: new Uint8Array(32),
      content_ref_hash: digest("content"),
      encryption_context_hash: digest("context"),
    })).rejects.toMatchObject({ code: "protected_kms_unavailable" });
    await expect(new DenyNurtureC30ProtectedIntegrityPort().verify({
      carrier: fixtureCommand().carrier,
      protected_content_ref: fixtureCommand().prepared_content.protected_content_ref,
      request_identity_hash: digest("request"),
      expected_keyed_integrity_hash: digest("integrity"),
    })).resolves.toBe(false);
  });
});

function fixtureCommand(): NurtureC30ProtectedCommitCommandV1 {
  const workspaceRef = ref("my_chat", "workspace", "workspace-1");
  const participant = {
    participant_ref: ref("nurture", "participant", "participant-1", 3),
    workspace_ref: workspaceRef,
    principal_origin: "interactive_session" as const,
    binding_revision: 4,
    authority_revision: 5,
  };
  const principal = {
    principal_version: 1 as const,
    principal_kind: "human_user" as const,
    account_ref: ref("my_chat", "user", "user-1"),
    actor_ref: ref("my_chat", "actor", "actor-1"),
    workspace_ref: workspaceRef,
    principal_origin: "interactive_session" as const,
  };
  const aggregateRef = ref("nurture", "child_care_process", "process-1", 7);
  const carrier: ScenarioProtectedPlainTextCarrierV1 = {
    protected_carrier_version: 1,
    protected_field_key: contract.protected_field_key,
    media_type: "text/plain; charset=utf-8",
    plain_text: "private body\n第二行",
    attachment_refs: [],
  };
  return {
    protected_store_command_version: 1,
    content_id: "content-1",
    contract,
    carrier,
    prepared_content: {
      protected_content_control_version: 1,
      state: "prepared",
      protected_content_ref: nurtureSha256Base64Url(Buffer.from("protected-content-1", "utf8")),
      protected_content_version: "prepared-1",
      content_kind: contract.content_kind,
      keyed_integrity_hash: digest("integrity"),
      issued_at: "2026-08-06T13:00:00.000Z",
      expires_at: "2026-08-06T13:05:00.000Z",
    },
    principal,
    current_participant: participant,
    current_target: {
      target_version: 1,
      target_ref: nurtureSha256Base64Url(Buffer.from("target-1", "utf8")),
      target_ref_class: "fixture.neutral_target_v1",
      workspace_ref: workspaceRef,
      current_version: "v7",
      primary_scope_ref: aggregateRef,
      child_care_process_ref: aggregateRef,
      target_principal_binding_hash: computeNurtureC30PrincipalBindingHash(principal, participant),
      authority_evidence_hash: digest("authority"),
      authority_revision: 1,
    },
    owning_action_ref: ref("nurture", "action_operation", "action-1", 1),
    aggregate_ref: aggregateRef,
    request_identity_hash: digest("request"),
    accepted_carrier_binding_hash: digest("carrier-binding"),
    canonical_payload_hash: digest("payload"),
    readable_until: "2026-08-07T13:00:00.000Z",
    retention_until: "2026-08-08T13:00:00.000Z",
  };
}

function encryptionContext(command: NurtureC30ProtectedCommitCommandV1) {
  return computeNurtureC30ProtectedEncryptionContextHash(encryptionContextInput(command));
}

function encryptionContextInput(command: NurtureC30ProtectedCommitCommandV1) {
  return {
    protected_content_ref: command.prepared_content.protected_content_ref,
    workspace_ref: command.principal.workspace_ref,
    scenario_key: "nurture",
    action_key: command.contract.action_key,
    content_kind: command.contract.content_kind,
    protected_field_key: command.contract.protected_field_key,
    aggregate_ref: command.aggregate_ref,
    committed_content_version: "committed-1",
  };
}

function ref(namespace: string, objectType: string, objectId: string, version?: number) {
  return {
    schema_version: 1 as const,
    namespace,
    object_type: objectType,
    object_id: objectId,
    ...(version === undefined ? {} : { version }),
  };
}

function digest(value: string): string {
  return nurtureSha256Hex(Buffer.from(value, "utf8"));
}
