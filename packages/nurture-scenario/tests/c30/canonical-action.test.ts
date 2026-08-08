import { describe, expect, it, vi } from "vitest";
import type {
  CanonicalRef,
  ScenarioDomainActionContractV1,
  ScenarioHumanPrincipalV1,
} from "@my-chat/workflow-contracts";
import {
  computeNurtureC30ActionContractHash,
  computeNurtureC30ActionEffectIdentityHash,
  computeNurtureC30PrincipalBindingHash,
  NurtureC30CanonicalActionRunner,
  nurtureSha256Base64Url,
  nurtureSha256Hex,
  nurtureScenarioManifest,
  type NurtureC30ActionExecutionCommandV1,
  type NurtureC30ActionExecutionRepository,
  type NurtureC30ActionPreparationStore,
  type NurtureC30PreparedActionContextV1,
} from "../../src/index.js";

const now = new Date("2026-08-06T13:30:00.000Z");
const principal: ScenarioHumanPrincipalV1 = {
  principal_version: 1,
  principal_kind: "human_user",
  account_ref: ref("my_chat", "user", "user-1"),
  actor_ref: ref("my_chat", "actor", "actor-1"),
  workspace_ref: ref("my_chat", "workspace", "workspace-1"),
  principal_origin: "interactive_session",
};
const participant = {
  participant_ref: ref("nurture", "participant", "participant-1", 3),
  workspace_ref: principal.workspace_ref,
  principal_origin: "interactive_session" as const,
  binding_revision: 4,
  authority_revision: 5,
};
const binding = {
  binding_version: 1 as const,
  binding_revision: participant.binding_revision,
  status: "active" as const,
  participant_ref: participant.participant_ref,
  account_ref: principal.account_ref,
  actor_ref: principal.actor_ref,
  workspace_ref: principal.workspace_ref,
};
const targetRef = "t".repeat(43);
const primaryScopeRef = ref("nurture", "child_care_process", "process-1", 7);

const directContract = contract("fixture.neutral_direct_v1", "scenario_direct_empty_v1");
const claimedContract = contract("fixture.neutral_claimed_v1", "workflow_claimed_step_v1");

function fixture() {
  const contexts = new Map<string, NurtureC30PreparedActionContextV1>();
  let tokenIndex = 0;
  const preparationStore: NurtureC30ActionPreparationStore = {
    issue: vi.fn(async (context) => {
      tokenIndex += 1;
      const token = nurtureSha256Base64Url(Buffer.from(`token-${tokenIndex}`, "utf8"));
      contexts.set(token, structuredClone(context));
      return token;
    }),
    read: vi.fn(async (token) => structuredClone(contexts.get(token) ?? null)),
  };
  const committed = new Map<string, Extract<Awaited<ReturnType<NurtureC30ActionExecutionRepository["execute"]>>, { status: "committed" }>>();
  const commands: NurtureC30ActionExecutionCommandV1[] = [];
  const executionRepository: NurtureC30ActionExecutionRepository = {
    execute: vi.fn(async (command) => {
      commands.push(command);
      const key = computeNurtureC30ActionEffectIdentityHash(command.execution_binding);
      const existing = committed.get(key);
      if (existing) return { ...structuredClone(existing), disposition: "replayed" as const };
      const result = {
        status: "committed" as const,
        disposition: "executed" as const,
        business_outcome: "applied" as const,
        execution_ref: ref("nurture", "command_execution", command.execution_id, 1),
        output_refs: [ref("nurture", "neutral_effect", `effect-${commands.length}`, 1)],
        handoff_request_snapshots: structuredClone(command.handoff_request_snapshots),
      };
      committed.set(key, result);
      return result;
    }),
    lookup: vi.fn(async (command) => {
      const result = committed.get(computeNurtureC30ActionEffectIdentityHash(command.execution_binding));
      return result
        ? { status_version: 1 as const, status: "committed" as const, result: { ...result, disposition: "replayed" as const } }
        : { status_version: 1 as const, status: "unknown" as const };
    }),
  };
  const bindingReader = { readCurrentBindings: vi.fn(async () => [binding]) };
  const authorityReader = {
    authorizeCurrent: vi.fn(async () => ({
      authority_version: 1 as const,
      authorized: true,
      authority_revision: participant.authority_revision,
      reason_code: "authorized",
    })),
  };
  const targetReader = {
    resolveCurrent: vi.fn(async () => ({
      target_version: 1 as const,
      target_ref: targetRef,
      target_ref_class: "fixture.neutral_target_v1",
      workspace_ref: principal.workspace_ref,
      current_version: "v7",
      primary_scope_ref: primaryScopeRef,
      child_care_process_ref: primaryScopeRef,
      target_principal_binding_hash: computeNurtureC30PrincipalBindingHash(principal, participant),
      authority_evidence_hash: digest("authority"),
      authority_revision: 1,
    })),
  };
  let id = 0;
  const runner = new NurtureC30CanonicalActionRunner({
    definitions: [definition(directContract), definition(claimedContract)],
    binding_reader: bindingReader,
    authority_reader: authorityReader,
    target_reader: targetReader,
    preparation_store: preparationStore,
    execution_repository: executionRepository,
    clock: () => now,
    identity_factory: () => `fixture-id-${++id}`,
  });
  return {
    runner,
    commands,
    contexts,
    bindingReader,
    authorityReader,
    targetReader,
    executionRepository,
  };
}

describe("C30 Base-neutral canonical action runner", () => {
  it("keeps both neutral fixture actions outside the production manifest", () => {
    expect(nurtureScenarioManifest.scenario_contracts?.domain_action_contracts).toEqual([]);
    expect(nurtureScenarioManifest.scenario_contracts?.protected_interaction_contracts).toEqual([]);
    expect(JSON.stringify(nurtureScenarioManifest)).not.toContain(directContract.action_key);
    expect(JSON.stringify(nurtureScenarioManifest)).not.toContain(claimedContract.action_key);
  });

  it("prepares and commits the direct-empty driver with explicit scenario identity", async () => {
    const { runner, commands } = fixture();
    const prepared = await prepare(runner, directContract.action_key);
    const submitted = await runner.submit({
      principal,
      request: submit(prepared.submit_token, "mutation-direct-1"),
      invocation_evidence: evidence(),
    });
    expect(submitted.public_result).toEqual({
      status: "completed",
      current_result: { state: "changed" },
    });
    expect(submitted.execution_binding?.effect_identity).toMatchObject({
      driver: "scenario_direct_empty_v1",
      scenario_key: "nurture",
      action_key: directContract.action_key,
      workspace_ref: principal.workspace_ref,
    });
    expect(commands[0]?.handoff_request_snapshots).toEqual([]);
  });

  it("exact-replays the direct effect and recovers the committed result", async () => {
    const { runner } = fixture();
    const prepared = await prepare(runner, directContract.action_key);
    const request = submit(prepared.submit_token, "mutation-direct-1");
    const first = await runner.submit({ principal, request, invocation_evidence: evidence() });
    const replay = await runner.submit({ principal, request, invocation_evidence: evidence("retry") });
    expect(first.execution_result).toMatchObject({ status: "committed", disposition: "executed" });
    expect(replay.execution_result).toMatchObject({ status: "committed", disposition: "replayed" });
    if (!replay.execution_binding) throw new Error("expected execution binding");
    await expect(runner.status({
      principal,
      submit_token: prepared.submit_token,
      execution_binding: replay.execution_binding,
      submit: request,
      invocation_evidence: evidence("status"),
    })).resolves.toMatchObject({ status: "committed", result: { disposition: "replayed" } });
  });

  it("preserves the claimed original Step and never forwards the claim token", async () => {
    const { runner, commands } = fixture();
    const prepared = await prepare(runner, claimedContract.action_key);
    const request = submit(prepared.submit_token, "mutation-claimed-1");
    const actionContractHash = computeNurtureC30ActionContractHash(claimedContract);
    const stepRef = {
      schema_version: 1 as const,
      namespace: "my_chat" as const,
      object_type: "workflow_step" as const,
      object_id: "original-step-1",
    };
    const claimed = {
      step_assertion: {
        step_assertion_version: 1 as const,
        workflow_step_ref: stepRef,
        workspace_ref: principal.workspace_ref,
        principal_provenance_hash: evidence().principal_provenance_hash,
        scenario_key: "nurture",
        action_key: claimedContract.action_key,
        handler_key: claimedContract.handler_key,
        action_contract_hash: actionContractHash,
        driver: "workflow_claimed_step_v1" as const,
        client_mutation_id: request.client_echo.client_mutation_id,
        request_correlation_hash: evidence().request_correlation_hash,
      },
      driver: {
        claimed_driver_version: 1 as const,
        workflow_step_ref: stepRef,
        action_contract_hash: actionContractHash,
        claim_token: "c".repeat(43),
        expected_step_version: 7,
      },
      binding_published: true,
      handoff_request_snapshots: [{
        requestId: "handoff-1",
        handoffKey: "fixture.neutral_handoff",
        requestedPurpose: "fixture.neutral_purpose",
        sourceContextRefs: [primaryScopeRef],
      }],
    };
    const result = await runner.submit({
      principal,
      request,
      invocation_evidence: evidence(),
      claimed,
    });
    expect(result.public_result).toEqual({ status: "accepted" });
    expect(result.execution_binding?.effect_identity).toEqual({
      effect_identity_version: 1,
      driver: "workflow_claimed_step_v1",
      workspace_ref: principal.workspace_ref,
      scenario_key: "nurture",
      action_key: claimedContract.action_key,
      original_workflow_step_ref: stepRef,
    });
    expect(JSON.stringify(commands)).not.toContain(claimed.driver.claim_token);
  });

  it("denies changed claimed evidence before the execution repository", async () => {
    const { runner, executionRepository } = fixture();
    const prepared = await prepare(runner, claimedContract.action_key);
    const request = submit(prepared.submit_token, "mutation-claimed-1");
    const contractHash = computeNurtureC30ActionContractHash(claimedContract);
    const stepRef = {
      schema_version: 1 as const,
      namespace: "my_chat" as const,
      object_type: "workflow_step" as const,
      object_id: "original-step-1",
    };
    const result = await runner.submit({
      principal,
      request,
      invocation_evidence: evidence(),
      claimed: {
        step_assertion: {
          step_assertion_version: 1,
          workflow_step_ref: stepRef,
          workspace_ref: principal.workspace_ref,
          principal_provenance_hash: digest("wrong-principal"),
          scenario_key: "nurture",
          action_key: claimedContract.action_key,
          handler_key: claimedContract.handler_key,
          action_contract_hash: contractHash,
          driver: "workflow_claimed_step_v1",
          client_mutation_id: request.client_echo.client_mutation_id,
          request_correlation_hash: evidence().request_correlation_hash,
        },
        driver: {
          claimed_driver_version: 1,
          workflow_step_ref: stepRef,
          action_contract_hash: contractHash,
          claim_token: "c".repeat(43),
          expected_step_version: 7,
        },
        binding_published: true,
        handoff_request_snapshots: [],
      },
    });
    expect(result.public_result.status).toBe("unavailable");
    expect(executionRepository.execute).not.toHaveBeenCalled();
  });

  it("rereads identity, business authority and target on prepare, submit and status", async () => {
    const { runner, bindingReader, authorityReader, targetReader } = fixture();
    const prepared = await prepare(runner, directContract.action_key);
    const request = submit(prepared.submit_token, "mutation-direct-1");
    const submitted = await runner.submit({ principal, request, invocation_evidence: evidence() });
    if (!submitted.execution_binding) throw new Error("expected execution binding");
    await runner.status({
      principal,
      submit_token: prepared.submit_token,
      execution_binding: submitted.execution_binding,
      submit: request,
      invocation_evidence: evidence("status"),
    });
    expect(bindingReader.readCurrentBindings).toHaveBeenCalledTimes(3);
    expect(authorityReader.authorizeCurrent).toHaveBeenCalledTimes(3);
    expect(targetReader.resolveCurrent).toHaveBeenCalledTimes(3);
  });

  it("fails closed before authority reads for invalid status token and invocation evidence", async () => {
    const { runner, bindingReader, authorityReader, targetReader } = fixture();
    const prepared = await prepare(runner, directContract.action_key);
    const request = submit(prepared.submit_token, "mutation-direct-1");
    const submitted = await runner.submit({ principal, request, invocation_evidence: evidence() });
    if (!submitted.execution_binding) throw new Error("expected execution binding");
    const readsBeforeStatus = bindingReader.readCurrentBindings.mock.calls.length;
    await expect(runner.status({
      principal,
      submit_token: prepared.submit_token,
      execution_binding: submitted.execution_binding,
      submit: submit(digest("wrong-token"), "mutation-direct-1"),
      invocation_evidence: { ...evidence("status"), request_nonce_hash: "invalid" },
    })).resolves.toEqual({ status_version: 1, status: "unknown" });
    expect(bindingReader.readCurrentBindings).toHaveBeenCalledTimes(readsBeforeStatus);
    expect(authorityReader.authorizeCurrent).toHaveBeenCalledTimes(readsBeforeStatus);
    expect(targetReader.resolveCurrent).toHaveBeenCalledTimes(readsBeforeStatus);
  });
});

async function prepare(runner: NurtureC30CanonicalActionRunner, actionKey: string) {
  const result = await runner.prepare({
    principal,
    ingress_key: "fixture.neutral_surface_v1",
    request: {
      prepare_version: 1,
      action_key: actionKey,
      target_ref: targetRef,
      expected_version: "v7",
      action_input: { fixture_value: "empty-neutral" },
    },
  });
  if (result.status !== "prepared") throw new Error("expected prepared action");
  return result;
}

function definition(contractValue: ScenarioDomainActionContractV1) {
  return {
    definition_version: 1 as const,
    contract: contractValue,
    assert_action_input: (value: unknown) => {
      if (
        value === null
        || typeof value !== "object"
        || Array.isArray(value)
        || Object.keys(value).join(",") !== "fixture_value"
        || (value as { fixture_value?: unknown }).fixture_value !== "empty-neutral"
      ) throw new Error("invalid neutral fixture input");
    },
    confirmation_prompt: "Confirm the neutral fixture action.",
  };
}

function contract(actionKey: string, driver: ScenarioDomainActionContractV1["driver"]): ScenarioDomainActionContractV1 {
  return {
    action_contract_version: 1,
    scenario_key: "nurture",
    action_key: actionKey,
    input_schema_key: "fixture.neutral_action.input",
    input_schema_version: 1,
    target_ref_class: "fixture.neutral_target_v1",
    confirmation_class: "explicit",
    entitled_ingress_keys: ["fixture.neutral_surface_v1"],
    handler_key: `fixture.${driver}.handler`,
    command_contract: { command_key: "fixture.neutral_apply", command_contract_version: 1 },
    driver,
  };
}

function submit(token: string, clientMutationId: string) {
  return {
    submit_request_version: 1 as const,
    client_echo: {
      submit_version: 1 as const,
      submit_token: token,
      confirmation: "confirmed" as const,
      client_mutation_id: clientMutationId,
    },
  };
}

function evidence(suffix = "initial") {
  return {
    evidence_version: 1 as const,
    request_nonce_hash: digest(`nonce-${suffix}`),
    host_identity_evidence_hash: digest(`host-${suffix}`),
    principal_provenance_hash: digest("principal"),
    request_correlation_hash: digest("correlation"),
    deadline_evidence_hash: digest(`deadline-${suffix}`),
    attempt_ledger_hash: digest(`attempt-${suffix}`),
    writer_fence_hash: digest(`writer-${suffix}`),
    effect_deadline_at: new Date(now.getTime() + 30_000).toISOString(),
  };
}

function ref(
  namespace: "my_chat" | "nurture",
  objectType: string,
  objectId: string,
  version?: number,
): CanonicalRef {
  return {
    schema_version: 1,
    namespace,
    object_type: objectType,
    object_id: objectId,
    ...(version === undefined ? {} : { version }),
  };
}

function digest(value: string): string {
  return nurtureSha256Hex(Buffer.from(value, "utf8"));
}
