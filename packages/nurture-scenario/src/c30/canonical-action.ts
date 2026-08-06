import { randomUUID } from "node:crypto";
import {
  assertPrepareScenarioDomainActionExchangeV1,
  assertScenarioDomainActionClaimedStepAssertionV1,
  assertScenarioDomainActionClaimedStepDriverV1,
  assertScenarioDomainActionClaimedStepExecutionContextV1,
  assertScenarioDomainActionContractV1,
  assertScenarioDomainActionExecutionBindingV1,
  assertScenarioDomainActionExecutionResultForBindingV1,
  assertSubmitScenarioDomainActionContextV1,
  assertSubmitScenarioDomainActionInputV1,
  assertSubmitScenarioDomainActionResultForContractV1,
  type CanonicalRef,
  type PrepareScenarioDomainActionInputV1,
  type PrepareScenarioDomainActionResultV1,
  type ScenarioDomainActionClaimedStepAssertionV1,
  type ScenarioDomainActionClaimedStepDriverV1,
  type ScenarioDomainActionContractV1,
  type ScenarioDomainActionExecutionBindingV1,
  type ScenarioDomainActionExecutionResultV1,
  type ScenarioHandoffRequestSnapshot,
  type ScenarioHumanPrincipalV1,
  type SubmitScenarioDomainActionInputV1,
  type SubmitScenarioDomainActionResultV1,
} from "@my-chat/workflow-contracts";
import { nurtureCanonicalJsonBytes, nurtureSha256Hex } from "./canonical-json.js";
import {
  NurtureParticipantResolutionError,
  resolveAuthorizedNurtureParticipant,
  type AuthorizedNurtureParticipantV1,
  type NurtureParticipantAuthorityReader,
  type NurtureParticipantBindingReader,
} from "./participant-binding.js";

export type NurtureC30ActionDefinitionV1 = {
  definition_version: 1;
  contract: ScenarioDomainActionContractV1;
  assert_action_input(value: unknown): void;
  confirmation_prompt: string;
};

export type NurtureC30ActionTargetV1 = {
  target_version: 1;
  target_ref: string;
  target_ref_class: string;
  workspace_ref: CanonicalRef;
  current_version: string;
  primary_scope_ref: CanonicalRef;
  child_care_process_ref?: CanonicalRef;
  target_principal_binding_hash: string;
  authority_evidence_hash: string;
  authority_revision: number;
};

export type NurtureC30ActionTargetReader = {
  resolveCurrent(input: {
    principal: ScenarioHumanPrincipalV1;
    participant: AuthorizedNurtureParticipantV1;
    contract: ScenarioDomainActionContractV1;
    target_ref: string;
    purpose: "prepare" | "submit" | "status";
    now: Date;
  }): Promise<NurtureC30ActionTargetV1 | null>;
};

export type NurtureC30PreparedActionContextV1 = {
  preparation_version: 1;
  contract: ScenarioDomainActionContractV1;
  action_contract_hash: string;
  principal_binding_hash: string;
  participant: AuthorizedNurtureParticipantV1;
  principal: ScenarioHumanPrincipalV1;
  target: NurtureC30ActionTargetV1;
  action_input: Readonly<Record<string, unknown>>;
  canonical_payload_hash: string;
  issued_at: string;
  expires_at: string;
};

export type NurtureC30ActionPreparationStore = {
  issue(context: NurtureC30PreparedActionContextV1): Promise<string>;
  read(submitToken: string): Promise<NurtureC30PreparedActionContextV1 | null>;
};

export type NurtureC30ActionInvocationEvidenceV1 = {
  evidence_version: 1;
  request_nonce_hash: string;
  host_identity_evidence_hash: string;
  principal_provenance_hash: string;
  request_correlation_hash: string;
  deadline_evidence_hash: string;
  attempt_ledger_hash: string;
  writer_fence_hash: string;
  effect_deadline_at: string;
};

export type NurtureC30ActionExecutionCommandV1 = {
  command_version: 1;
  operation_id: string;
  execution_id: string;
  scenario_command_id: string;
  scenario_command_hash: string;
  definition: NurtureC30ActionDefinitionV1;
  prepared: NurtureC30PreparedActionContextV1;
  current_participant: AuthorizedNurtureParticipantV1;
  current_target: NurtureC30ActionTargetV1;
  principal: ScenarioHumanPrincipalV1;
  submit: SubmitScenarioDomainActionInputV1;
  execution_binding: ScenarioDomainActionExecutionBindingV1;
  handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
  invocation_evidence: NurtureC30ActionInvocationEvidenceV1;
};

export type NurtureC30ActionExecutionStatusV1 =
  | {
      status_version: 1;
      status: "committed";
      result: Extract<ScenarioDomainActionExecutionResultV1, { status: "committed" }>;
    }
  | { status_version: 1; status: "confirmed_no_effect" }
  | { status_version: 1; status: "unknown" };

export type NurtureC30ActionExecutionRepository = {
  execute(command: NurtureC30ActionExecutionCommandV1): Promise<ScenarioDomainActionExecutionResultV1>;
  lookup(command: NurtureC30ActionExecutionCommandV1, now: Date): Promise<NurtureC30ActionExecutionStatusV1>;
};

export type NurtureC30ActionRunnerDeps = {
  definitions: readonly NurtureC30ActionDefinitionV1[];
  binding_reader: NurtureParticipantBindingReader;
  authority_reader: NurtureParticipantAuthorityReader;
  target_reader: NurtureC30ActionTargetReader;
  preparation_store: NurtureC30ActionPreparationStore;
  execution_repository: NurtureC30ActionExecutionRepository;
  clock?: () => Date;
  identity_factory?: () => string;
};

export class NurtureC30CanonicalActionRunner {
  private readonly definitions: ReadonlyMap<string, NurtureC30ActionDefinitionV1>;
  private readonly clock: () => Date;
  private readonly identityFactory: () => string;

  constructor(private readonly deps: NurtureC30ActionRunnerDeps) {
    const definitions = new Map<string, NurtureC30ActionDefinitionV1>();
    for (const definition of deps.definitions) {
      assertDefinition(definition);
      if (definitions.has(definition.contract.action_key)) {
        throw actionError("action_definition_invalid", "The action definition is duplicated.");
      }
      definitions.set(definition.contract.action_key, definition);
    }
    this.definitions = definitions;
    this.clock = deps.clock ?? (() => new Date());
    this.identityFactory = deps.identity_factory ?? randomUUID;
  }

  async prepare(input: {
    principal: ScenarioHumanPrincipalV1;
    ingress_key: string;
    request: PrepareScenarioDomainActionInputV1;
  }): Promise<PrepareScenarioDomainActionResultV1> {
    const now = this.clock();
    try {
      const definition = this.definition(input.request.action_key);
      assertActionInput(definition, input.request.action_input);
      const participant = await this.participant(input.principal, "prepare_domain_action");
      const principalBindingHash = computeNurtureC30PrincipalBindingHash(input.principal, participant);
      const target = await this.deps.target_reader.resolveCurrent({
        principal: input.principal,
        participant,
        contract: definition.contract,
        target_ref: input.request.target_ref,
        purpose: "prepare",
        now,
      });
      if (!target) return unavailable("action_unavailable", "The action target is unavailable.");
      const actionContractHash = computeNurtureC30ActionContractHash(definition.contract);
      const prepared: NurtureC30PreparedActionContextV1 = {
        preparation_version: 1,
        contract: structuredClone(definition.contract),
        action_contract_hash: actionContractHash,
        principal_binding_hash: principalBindingHash,
        participant: structuredClone(participant),
        principal: structuredClone(input.principal),
        target: structuredClone(target),
        action_input: structuredClone(input.request.action_input),
        canonical_payload_hash: computeNurtureC30ActionPayloadHash(input.request.action_input),
        issued_at: now.toISOString(),
        expires_at: new Date(now.getTime() + preparationLifetimeMs).toISOString(),
      };
      const submitToken = await this.deps.preparation_store.issue(prepared);
      const result: PrepareScenarioDomainActionResultV1 = {
        status: "prepared",
        submit_token: submitToken,
        confirmation: {
          confirmation_class: definition.contract.confirmation_class,
          prompt: safeText(definition.confirmation_prompt),
        },
        issued_at: prepared.issued_at,
        expires_at: prepared.expires_at,
      };
      assertPrepareScenarioDomainActionExchangeV1(
        definition.contract,
        input.request,
        result,
        {
          scenario_key: "nurture",
          ingress_key: input.ingress_key,
          principal_binding_hash: principalBindingHash,
          target_principal_binding_hash: target.target_principal_binding_hash,
          workspace_ref: input.principal.workspace_ref,
          target_workspace_ref: target.workspace_ref,
          target_ref: target.target_ref,
          target_ref_class: target.target_ref_class,
          current_expected_version: target.current_version,
          input_schema_key: definition.contract.input_schema_key,
          input_schema_version: definition.contract.input_schema_version,
          assert_action_input: (value) => assertActionInput(definition, value),
        },
      );
      return result;
    } catch (error) {
      return closedPrepare(error);
    }
  }

  async submit(input: {
    principal: ScenarioHumanPrincipalV1;
    request: SubmitScenarioDomainActionInputV1;
    invocation_evidence: NurtureC30ActionInvocationEvidenceV1;
    claimed?: {
      step_assertion: ScenarioDomainActionClaimedStepAssertionV1;
      driver: ScenarioDomainActionClaimedStepDriverV1;
      binding_published: boolean;
      handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
    };
  }): Promise<{
    public_result: SubmitScenarioDomainActionResultV1;
    execution_binding?: ScenarioDomainActionExecutionBindingV1;
    execution_result?: ScenarioDomainActionExecutionResultV1;
  }> {
    const now = this.clock();
    try {
      assertSubmitScenarioDomainActionInputV1(input.request);
      assertInvocationEvidence(input.invocation_evidence, now);
      const prepared = await this.deps.preparation_store.read(input.request.client_echo.submit_token);
      if (!prepared) {
        return { public_result: unavailable("action_unavailable", "The action context is unavailable.") };
      }
      const definition = this.definition(prepared.contract.action_key);
      assertPrepared(prepared, definition);
      const participant = await this.participant(input.principal, "submit_domain_action");
      const target = await this.currentTarget(input.principal, participant, prepared, "submit", now);
      assertSubmitScenarioDomainActionContextV1(definition.contract, input.request, {
        submit_token: input.request.client_echo.submit_token,
        scenario_key: "nurture",
        action_key: definition.contract.action_key,
        principal_binding_hash: computeNurtureC30PrincipalBindingHash(input.principal, participant),
        submit_context_expires_at: prepared.expires_at,
        now: now.toISOString(),
      });
      const executionBinding = this.executionBinding(
        definition,
        prepared,
        input.request.client_echo.submit_token,
        input.request.client_echo.client_mutation_id,
        input.claimed,
      );
      if (input.claimed) {
        assertClaimedContext(
          definition,
          prepared,
          input.principal,
          input.request,
          input.invocation_evidence,
          input.claimed,
        );
      }
      const command: NurtureC30ActionExecutionCommandV1 = {
        command_version: 1,
        operation_id: this.identityFactory(),
        execution_id: this.identityFactory(),
        scenario_command_id: this.identityFactory(),
        scenario_command_hash: "0".repeat(64),
        definition,
        prepared,
        current_participant: participant,
        current_target: target,
        principal: structuredClone(input.principal),
        submit: structuredClone(input.request),
        execution_binding: executionBinding,
        handoff_request_snapshots: input.claimed?.handoff_request_snapshots ?? [],
        invocation_evidence: structuredClone(input.invocation_evidence),
      };
      command.scenario_command_hash = computeNurtureC30ActionCommandHash(command);
      const executionResult = await this.deps.execution_repository.execute(command);
      assertScenarioDomainActionExecutionResultForBindingV1(
        definition.contract,
        executionBinding,
        executionResult,
      );
      let publicResult: SubmitScenarioDomainActionResultV1;
      if (definition.contract.driver === "scenario_direct_empty_v1") {
        publicResult = executionResult.status === "committed"
          ? {
              status: "completed",
              current_result: {
                state: executionResult.business_outcome === "applied" ? "changed" : "already_current",
              },
            }
          : unavailable("action_unavailable", "The action was not completed.");
      } else {
        publicResult = executionResult.status === "committed"
          ? { status: "accepted" }
          : unavailable("action_unavailable", "The action was not accepted.");
        const claimed = input.claimed;
        if (!claimed) throw actionError("action_request_invalid", "Claimed execution context is missing.");
        assertScenarioDomainActionClaimedStepExecutionContextV1(
          definition.contract,
          claimed.step_assertion,
          claimed.driver,
          executionBinding,
          executionResult,
          {
            binding_published: claimed.binding_published,
            action_contract_hash: prepared.action_contract_hash,
          },
        );
      }
      assertSubmitScenarioDomainActionResultForContractV1(definition.contract, publicResult);
      return {
        public_result: publicResult,
        execution_binding: executionBinding,
        execution_result: executionResult,
      };
    } catch (error) {
      return { public_result: closedSubmit(error) };
    }
  }

  async status(input: {
    principal: ScenarioHumanPrincipalV1;
    submit_token: string;
    execution_binding: ScenarioDomainActionExecutionBindingV1;
    submit: SubmitScenarioDomainActionInputV1;
    invocation_evidence: NurtureC30ActionInvocationEvidenceV1;
    claimed?: {
      step_assertion: ScenarioDomainActionClaimedStepAssertionV1;
      driver: ScenarioDomainActionClaimedStepDriverV1;
      binding_published: boolean;
      handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
    };
  }): Promise<NurtureC30ActionExecutionStatusV1> {
    const now = this.clock();
    try {
      assertScenarioDomainActionExecutionBindingV1(input.execution_binding);
      assertSubmitScenarioDomainActionInputV1(input.submit);
      assertInvocationEvidence(input.invocation_evidence, now);
      if (input.submit.client_echo.submit_token !== input.submit_token) {
        return { status_version: 1, status: "unknown" };
      }
      const prepared = await this.deps.preparation_store.read(input.submit_token);
      if (!prepared) return { status_version: 1, status: "unknown" };
      const definition = this.definition(prepared.contract.action_key);
      assertPrepared(prepared, definition);
      const participant = await this.participant(input.principal, "status_domain_action");
      const target = await this.currentTarget(input.principal, participant, prepared, "status", now);
      const expectedBinding = this.executionBinding(
        definition,
        prepared,
        input.submit_token,
        input.submit.client_echo.client_mutation_id,
        input.claimed,
      );
      if (input.claimed) {
        assertClaimedContext(
          definition,
          prepared,
          input.principal,
          input.submit,
          input.invocation_evidence,
          input.claimed,
        );
      }
      if (hashCanonical(expectedBinding) !== hashCanonical(input.execution_binding)) {
        return { status_version: 1, status: "unknown" };
      }
      const command: NurtureC30ActionExecutionCommandV1 = {
        command_version: 1,
        operation_id: this.identityFactory(),
        execution_id: this.identityFactory(),
        scenario_command_id: this.identityFactory(),
        scenario_command_hash: "0".repeat(64),
        definition,
        prepared,
        current_participant: participant,
        current_target: target,
        principal: structuredClone(input.principal),
        submit: structuredClone(input.submit),
        execution_binding: input.execution_binding,
        handoff_request_snapshots: input.claimed?.handoff_request_snapshots ?? [],
        invocation_evidence: structuredClone(input.invocation_evidence),
      };
      command.scenario_command_hash = computeNurtureC30ActionCommandHash(command);
      return this.deps.execution_repository.lookup(command, now);
    } catch {
      return { status_version: 1, status: "unknown" };
    }
  }

  private definition(actionKey: string): NurtureC30ActionDefinitionV1 {
    const definition = this.definitions.get(actionKey);
    if (!definition) throw actionError("action_not_declared", "The action is not declared by this runner.");
    return definition;
  }

  private participant(principal: ScenarioHumanPrincipalV1, operationKey: string) {
    return resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: operationKey,
      binding_reader: this.deps.binding_reader,
      authority_reader: this.deps.authority_reader,
    });
  }

  private async currentTarget(
    principal: ScenarioHumanPrincipalV1,
    participant: AuthorizedNurtureParticipantV1,
    prepared: NurtureC30PreparedActionContextV1,
    purpose: "submit" | "status",
    now: Date,
  ): Promise<NurtureC30ActionTargetV1> {
    const target = await this.deps.target_reader.resolveCurrent({
      principal,
      participant,
      contract: prepared.contract,
      target_ref: prepared.target.target_ref,
      purpose,
      now,
    });
    if (
      !target
      || target.current_version !== prepared.target.current_version
      || target.target_principal_binding_hash !== prepared.principal_binding_hash
      || hashCanonical(target.primary_scope_ref) !== hashCanonical(prepared.target.primary_scope_ref)
      || computeNurtureC30PrincipalBindingHash(principal, participant) !== prepared.principal_binding_hash
    ) throw actionError("action_context_changed", "Current action authority changed.");
    return target;
  }

  private executionBinding(
    definition: NurtureC30ActionDefinitionV1,
    prepared: NurtureC30PreparedActionContextV1,
    submitToken: string,
    clientMutationId: string,
    claimed: {
      step_assertion: ScenarioDomainActionClaimedStepAssertionV1;
      driver: ScenarioDomainActionClaimedStepDriverV1;
      binding_published: boolean;
      handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
    } | undefined,
  ): ScenarioDomainActionExecutionBindingV1 {
    if (definition.contract.driver === "scenario_direct_empty_v1") {
      if (claimed !== undefined) throw actionError("action_request_invalid", "Direct execution cannot claim a Step.");
      return {
        execution_binding_version: 1,
        effect_identity: {
          effect_identity_version: 1,
          driver: "scenario_direct_empty_v1",
          workspace_ref: prepared.principal.workspace_ref,
          scenario_key: "nurture",
          action_key: definition.contract.action_key,
          submit_context_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "action_submit_context",
            object_id: nurtureSha256Hex(Buffer.from(submitToken, "utf8")),
            version: 1,
          },
        },
        canonical_payload_hash: prepared.canonical_payload_hash,
      };
    }
    if (!claimed || !claimed.binding_published) {
      throw actionError("action_request_invalid", "The original Step binding is not published.");
    }
    assertScenarioDomainActionClaimedStepAssertionV1(claimed.step_assertion);
    assertScenarioDomainActionClaimedStepDriverV1(claimed.driver);
    if (
      claimed.step_assertion.action_contract_hash !== prepared.action_contract_hash
      || claimed.driver.action_contract_hash !== prepared.action_contract_hash
      || claimed.step_assertion.client_mutation_id !== clientMutationId
    ) throw actionError("action_request_invalid", "The claimed Step does not match the prepared action.");
    return {
      execution_binding_version: 1,
      effect_identity: {
        effect_identity_version: 1,
        driver: "workflow_claimed_step_v1",
        workspace_ref: prepared.principal.workspace_ref,
        scenario_key: "nurture",
        action_key: definition.contract.action_key,
        original_workflow_step_ref: claimed.step_assertion.workflow_step_ref,
      },
      canonical_payload_hash: prepared.canonical_payload_hash,
    };
  }
}

function assertClaimedContext(
  definition: NurtureC30ActionDefinitionV1,
  prepared: NurtureC30PreparedActionContextV1,
  principal: ScenarioHumanPrincipalV1,
  submit: SubmitScenarioDomainActionInputV1,
  evidence: NurtureC30ActionInvocationEvidenceV1,
  claimed: {
    step_assertion: ScenarioDomainActionClaimedStepAssertionV1;
    driver: ScenarioDomainActionClaimedStepDriverV1;
    binding_published: boolean;
  },
): void {
  const assertion = claimed.step_assertion;
  if (
    !claimed.binding_published
    || definition.contract.driver !== "workflow_claimed_step_v1"
    || assertion.scenario_key !== "nurture"
    || assertion.action_key !== definition.contract.action_key
    || assertion.handler_key !== definition.contract.handler_key
    || assertion.action_contract_hash !== prepared.action_contract_hash
    || claimed.driver.action_contract_hash !== prepared.action_contract_hash
    || hashCanonical(assertion.workspace_ref) !== hashCanonical(principal.workspace_ref)
    || assertion.principal_provenance_hash !== evidence.principal_provenance_hash
    || assertion.request_correlation_hash !== evidence.request_correlation_hash
    || assertion.client_mutation_id !== submit.client_echo.client_mutation_id
    || hashCanonical(assertion.workflow_step_ref) !== hashCanonical(claimed.driver.workflow_step_ref)
  ) throw actionError("action_request_invalid", "The claimed original Step evidence does not match.");
}

export function computeNurtureC30ActionContractHash(contract: ScenarioDomainActionContractV1): string {
  assertScenarioDomainActionContractV1(contract);
  return hashCanonical(contract);
}

export function computeNurtureC30ActionPayloadHash(
  actionInput: Readonly<Record<string, unknown>>,
): string {
  return hashCanonical(actionInput);
}

export function computeNurtureC30PrincipalBindingHash(
  principal: ScenarioHumanPrincipalV1,
  participant: AuthorizedNurtureParticipantV1,
): string {
  return hashCanonical({
    binding_hash_version: 1,
    principal,
    participant_ref: participant.participant_ref,
    represented_organization_ref: participant.represented_organization_ref ?? null,
    binding_revision: participant.binding_revision,
    authority_revision: participant.authority_revision,
  });
}

export function computeNurtureC30ActionEffectIdentityHash(
  binding: ScenarioDomainActionExecutionBindingV1,
): string {
  assertScenarioDomainActionExecutionBindingV1(binding);
  return hashCanonical(binding.effect_identity);
}

export function computeNurtureC30ActionCommandHash(
  command: Omit<NurtureC30ActionExecutionCommandV1, "scenario_command_hash">,
): string {
  return hashCanonical({
    command_hash_version: 1,
    command_version: command.command_version,
    contract_hash: command.prepared.action_contract_hash,
    effect_identity: command.execution_binding.effect_identity,
    canonical_payload_hash: command.execution_binding.canonical_payload_hash,
    principal_binding_hash: command.prepared.principal_binding_hash,
    target_ref_hash: hashCanonical(command.current_target.target_ref),
    target_version: command.current_target.current_version,
    authority_evidence_hash: command.current_target.authority_evidence_hash,
    client_mutation_id: command.submit.client_echo.client_mutation_id,
    handoff_request_snapshots: command.handoff_request_snapshots,
  });
}

export function assertNurtureC30ActionExecutionCommandV1(
  command: NurtureC30ActionExecutionCommandV1,
): void {
  assertDefinition(command.definition);
  assertPrepared(command.prepared, command.definition);
  assertScenarioDomainActionExecutionBindingV1(command.execution_binding);
  assertSubmitScenarioDomainActionInputV1(command.submit);
  assertInvocationEvidence(command.invocation_evidence, new Date(command.invocation_evidence.effect_deadline_at), true);
  if (
    command.command_version !== 1
    || !opaqueIdPattern.test(command.operation_id)
    || !opaqueIdPattern.test(command.execution_id)
    || !opaqueIdPattern.test(command.scenario_command_id)
    || command.scenario_command_hash !== computeNurtureC30ActionCommandHash(command)
    || command.execution_binding.canonical_payload_hash !== command.prepared.canonical_payload_hash
  ) throw actionError("action_request_invalid", "The action execution command is invalid.");
}

function assertDefinition(definition: NurtureC30ActionDefinitionV1): void {
  if (definition.definition_version !== 1) throw actionError("action_definition_invalid", "The action definition version is invalid.");
  assertScenarioDomainActionContractV1(definition.contract);
  if (definition.contract.scenario_key !== "nurture" || !safePromptPattern.test(definition.confirmation_prompt)) {
    throw actionError("action_definition_invalid", "The action definition is not Nurture-safe.");
  }
}

function assertPrepared(
  prepared: NurtureC30PreparedActionContextV1,
  definition: NurtureC30ActionDefinitionV1,
): void {
  if (
    prepared.preparation_version !== 1
    || prepared.action_contract_hash !== computeNurtureC30ActionContractHash(definition.contract)
    || hashCanonical(prepared.contract) !== hashCanonical(definition.contract)
    || prepared.canonical_payload_hash !== computeNurtureC30ActionPayloadHash(prepared.action_input)
  ) throw actionError("action_context_changed", "The prepared action context changed.");
  assertActionInput(definition, prepared.action_input);
}

function assertActionInput(definition: NurtureC30ActionDefinitionV1, value: unknown): void {
  try {
    definition.assert_action_input(value);
  } catch {
    throw actionError("action_request_invalid", "The action input is invalid.");
  }
}

function assertInvocationEvidence(
  evidence: NurtureC30ActionInvocationEvidenceV1,
  now: Date,
  allowDeadlineAsNow = false,
): void {
  if (evidence.evidence_version !== 1) throw actionError("action_request_invalid", "Invocation evidence version is invalid.");
  for (const value of [
    evidence.request_nonce_hash,
    evidence.host_identity_evidence_hash,
    evidence.principal_provenance_hash,
    evidence.request_correlation_hash,
    evidence.deadline_evidence_hash,
    evidence.attempt_ledger_hash,
    evidence.writer_fence_hash,
  ]) if (!sha256Pattern.test(value)) throw actionError("action_request_invalid", "Invocation evidence digest is invalid.");
  const deadline = Date.parse(evidence.effect_deadline_at);
  if (
    !canonicalInstantPattern.test(evidence.effect_deadline_at)
    || !Number.isFinite(deadline)
    || (allowDeadlineAsNow ? deadline < now.getTime() : deadline <= now.getTime())
    || deadline - now.getTime() > maximumEffectLifetimeMs
  ) throw actionError("action_request_invalid", "The action effect deadline is invalid.");
}

function closedPrepare(error: unknown): PrepareScenarioDomainActionResultV1 {
  if (error instanceof NurtureParticipantResolutionError) {
    return unavailable("authority_changed", "Current action authority is unavailable.");
  }
  if (error instanceof NurtureC30CanonicalActionError) {
    return error.code === "action_context_changed"
      ? { status: "context_changed", safe_reason: safeReason("authority_changed", "The action context changed.") }
      : unavailable("action_unavailable", "The action is unavailable.");
  }
  throw error;
}

function closedSubmit(error: unknown): SubmitScenarioDomainActionResultV1 {
  if (error instanceof NurtureParticipantResolutionError) {
    return unavailable("authority_changed", "Current action authority is unavailable.");
  }
  if (error instanceof NurtureC30CanonicalActionError && error.code === "action_context_changed") {
    return { status: "context_changed", safe_reason: safeReason("authority_changed", "The action context changed.") };
  }
  if (error instanceof NurtureC30CanonicalActionError) {
    return unavailable("action_unavailable", "The action is unavailable.");
  }
  throw error;
}

function unavailable(reasonCode: string, message: string) {
  return { status: "unavailable" as const, safe_reason: safeReason(reasonCode, message) };
}

function safeReason(reasonCode: string, message: string) {
  return { reason_code: reasonCode, message: safeText(message), retry_class: "refresh" as const };
}

function safeText(value: string) {
  return { kind: "plain_text" as const, value, locale: "en" };
}

function hashCanonical(value: unknown): string {
  return nurtureSha256Hex(nurtureCanonicalJsonBytes(value));
}

export type NurtureC30CanonicalActionErrorCode =
  | "action_not_declared"
  | "action_definition_invalid"
  | "action_request_invalid"
  | "action_context_changed"
  | "action_conflict"
  | "action_authority_denied";

export class NurtureC30CanonicalActionError extends Error {
  constructor(readonly code: NurtureC30CanonicalActionErrorCode, message: string) {
    super(message);
    this.name = "NurtureC30CanonicalActionError";
  }
}

function actionError(code: NurtureC30CanonicalActionErrorCode, message: string) {
  return new NurtureC30CanonicalActionError(code, message);
}

const preparationLifetimeMs = 5 * 60 * 1000;
const maximumEffectLifetimeMs = 60_000;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const safePromptPattern = /^[^\u0000-\u001f\u007f-\u009f<>`]{1,200}$/u;
