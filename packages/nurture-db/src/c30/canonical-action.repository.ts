import { Prisma, type NurtureC30ActionOperation, type PrismaClient } from "@prisma/client";
import {
  assertNurtureC30ActionExecutionCommandV1,
  computeNurtureC30ActionEffectIdentityHash,
  nurtureCanonicalJsonBytes,
  nurtureSha256Hex,
  NurtureC30CanonicalActionError,
  type NurtureC30ActionExecutionCommandV1,
  type NurtureC30ActionExecutionRepository,
  type NurtureC30ActionExecutionStatusV1,
} from "@the-nurture/scenario";
import type {
  CanonicalRef,
  ScenarioDomainActionExecutionResultV1,
} from "@my-chat/workflow-contracts";
import { assertScenarioDomainActionExecutionResultV1 } from "@my-chat/workflow-contracts";

export type NurtureC30ActionTransaction = Prisma.TransactionClient;

export type TransactionalNurtureC30ActionAuthorityReader = {
  verifyCurrent(
    transaction: NurtureC30ActionTransaction,
    input: {
      command: NurtureC30ActionExecutionCommandV1;
      participantBindingId: string;
      purpose: "admit_action" | "commit_action" | "recover_action";
      now: Date;
    },
  ): Promise<{
    authorized: true;
    authorityEvidenceHash: string;
    authorityRevision: number;
  }>;
};

export type TransactionalNurtureC30ActionEffectWriter = {
  apply(
    transaction: NurtureC30ActionTransaction,
    input: { command: NurtureC30ActionExecutionCommandV1 },
  ): Promise<{
    businessOutcome: "applied" | "already_satisfied";
    outputRefs: CanonicalRef[];
  }>;
};

export class DenyTransactionalNurtureC30ActionAuthorityReader
implements TransactionalNurtureC30ActionAuthorityReader {
  async verifyCurrent(): Promise<never> {
    throw actionError("action_authority_denied", "C30 action authority is not configured.");
  }
}

export class DenyTransactionalNurtureC30ActionEffectWriter
implements TransactionalNurtureC30ActionEffectWriter {
  async apply(): Promise<never> {
    throw actionError("action_authority_denied", "No C30 product action effect is configured.");
  }
}

export class PrismaNurtureC30ActionExecutionRepository
implements NurtureC30ActionExecutionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly authorityReader: TransactionalNurtureC30ActionAuthorityReader =
      new DenyTransactionalNurtureC30ActionAuthorityReader(),
    private readonly effectWriter: TransactionalNurtureC30ActionEffectWriter =
      new DenyTransactionalNurtureC30ActionEffectWriter(),
  ) {}

  async execute(command: NurtureC30ActionExecutionCommandV1): Promise<ScenarioDomainActionExecutionResultV1> {
    assertNurtureC30ActionExecutionCommandV1(command);
    await this.register(command);
    return this.retrySerializable(async (transaction) => {
      const effectIdentityHash = computeNurtureC30ActionEffectIdentityHash(command.execution_binding);
      const operation = await lockOperation(transaction, effectIdentityHash);
      if (!operation) throw actionError("action_conflict", "The eligible action operation was not found.");
      assertOperationMatches(operation, command);
      const now = await databaseNow(transaction);
      const participantBindingId = await assertCurrentActor(transaction, command);
      const authority = await this.authorityReader.verifyCurrent(transaction, {
        command,
        participantBindingId,
        purpose: "commit_action",
        now,
      });
      assertAuthority(authority);
      if (operation.state === "committed") return committedResult(operation, "replayed");
      if (operation.state !== "eligible") {
        return notCommitted("request_conflict", "The action operation is no longer eligible.");
      }
      assertOpenDeadline(operation.effectDeadlineAt, now);
      if (
        authority.authorityEvidenceHash !== operation.authorityEvidenceHash
        || authority.authorityRevision !== operation.authorityRevision
      ) throw actionError("action_authority_denied", "Current action authority changed after admission.");
      const claimed = await transaction.nurtureC30ActionOperation.updateMany({
        where: {
          id: operation.id,
          state: "eligible",
          writerFenceHash: operation.writerFenceHash,
        },
        data: { state: "dispatching" },
      });
      if (claimed.count !== 1) throw actionError("action_conflict", "The action writer fence was lost.");

      const effect = await this.effectWriter.apply(transaction, { command });
      const executionRef = localRef("command_execution", command.execution_id, 1);
      const result: Extract<ScenarioDomainActionExecutionResultV1, { status: "committed" }> = {
        status: "committed",
        disposition: "executed",
        business_outcome: effect.businessOutcome,
        execution_ref: executionRef,
        output_refs: structuredClone(effect.outputRefs),
        handoff_request_snapshots: structuredClone(command.handoff_request_snapshots),
      };
      assertScenarioDomainActionExecutionResultV1(result);
      const commitEvidenceHash = hashCanonical({
        commit_evidence_version: 1,
        effect_identity_hash: effectIdentityHash,
        canonical_payload_hash: command.execution_binding.canonical_payload_hash,
        execution_ref: executionRef,
        business_outcome: effect.businessOutcome,
        output_refs: effect.outputRefs,
        handoff_request_snapshots: command.handoff_request_snapshots,
        committed_at: now.toISOString(),
      });
      const participantRef = participantRefValue(
        command.current_participant.participant_ref.object_id,
        command.current_participant.participant_ref.version ?? 1,
      );
      await transaction.nurtureCommandExecution.create({
        data: {
          id: command.execution_id,
          workspaceId: command.principal.workspace_ref.object_id,
          commandRequestIdHash: command.scenario_command_hash,
          originInvocationRequestIdHash: command.invocation_evidence.request_nonce_hash,
          commandKey: command.definition.contract.command_contract.command_key,
          commandScope: command.current_target.primary_scope_ref.object_type,
          commandContractVersion:
            command.definition.contract.command_contract.command_contract_version,
          payloadHash: command.execution_binding.canonical_payload_hash,
          businessActorRef: participantRef,
          actorPrincipalBindingId: participantBindingId,
          actorBindingVersion: command.current_participant.binding_revision,
          actorAccountRef: clonedJson(command.principal.account_ref),
          actorRef: clonedJson(command.principal.actor_ref),
          actorWorkspaceRef: clonedJson(command.principal.workspace_ref),
          ...(command.current_participant.represented_organization_ref
            ? {
                actorRepresentedOrganizationRef: clonedJson(
                  command.current_participant.represented_organization_ref,
                ),
              }
            : {}),
          invocationProvenance: clonedJson({
            provenance_version: 1,
            principal_origin: command.principal.principal_origin,
            principal_provenance_hash: command.invocation_evidence.principal_provenance_hash,
            host_identity_evidence_hash: command.invocation_evidence.host_identity_evidence_hash,
            request_correlation_hash: command.invocation_evidence.request_correlation_hash,
          }),
          scenarioKey: "nurture",
          scenarioEffectIdentityHash: effectIdentityHash,
          executionDriver: command.definition.contract.driver,
          primaryScopeRef: clonedJson(command.current_target.primary_scope_ref),
          childCareProcessId: command.current_target.child_care_process_ref?.object_id,
          targetRefs: clonedJson([command.current_target.primary_scope_ref]),
          businessOutcome: effect.businessOutcome,
          outputRefs: clonedJson(effect.outputRefs),
          handoffRequestSnapshotsPayload: clonedJson(command.handoff_request_snapshots),
          resultSchemaVersion: 1,
          committedResultPayload: clonedJson({
            result_version: 1,
            body: "no_body",
            effect_identity_hash: effectIdentityHash,
            commit_evidence_hash: commitEvidenceHash,
            output_refs: effect.outputRefs,
          }),
        },
      });
      const aggregateRef = actionOperationRef(operation.id);
      const executionRefValue = commandExecutionRef(command.execution_id);
      await transaction.nurtureC30ActionAuditRecord.create({
        data: {
          actionOperationId: operation.id,
          eventKey: "c30.action.committed",
          aggregateRef,
          executionRef: executionRefValue,
          evidenceHash: commitEvidenceHash,
          correlationRef: correlationRef(command.invocation_evidence.request_correlation_hash),
        },
      });
      await transaction.nurtureC30ActionOutboxEvent.create({
        data: {
          actionOperationId: operation.id,
          eventType: "nurture.c30.action.committed",
          aggregateRef,
          executionRef: executionRefValue,
          participantRef,
          correlationRef: correlationRef(command.invocation_evidence.request_correlation_hash),
          evidenceHash: commitEvidenceHash,
        },
      });
      const committed = await transaction.nurtureC30ActionOperation.update({
        where: { id: operation.id },
        data: {
          state: "committed",
          commandExecutionId: command.execution_id,
          businessOutcome: effect.businessOutcome,
          outputRefs: clonedJson(effect.outputRefs),
          handoffRequestSnapshots: clonedJson(command.handoff_request_snapshots),
          commitEvidenceHash,
          committedAt: now,
        },
      });
      return committedResult(committed, "executed");
    });
  }

  async lookup(
    command: NurtureC30ActionExecutionCommandV1,
    _now: Date,
  ): Promise<NurtureC30ActionExecutionStatusV1> {
    assertNurtureC30ActionExecutionCommandV1(command);
    return this.retrySerializable(async (transaction) => {
      const checkedAt = await databaseNow(transaction);
      const participantBindingId = await assertCurrentActor(transaction, command);
      const authority = await this.authorityReader.verifyCurrent(transaction, {
        command,
        participantBindingId,
        purpose: "recover_action",
        now: checkedAt,
      });
      assertAuthority(authority);
      const effectIdentityHash = computeNurtureC30ActionEffectIdentityHash(command.execution_binding);
      const operation = await lockOperation(transaction, effectIdentityHash);
      if (!operation) return { status_version: 1, status: "unknown" };
      assertOperationMatches(operation, command);
      if (operation.state === "committed") {
        return {
          status_version: 1,
          status: "committed",
          result: committedResult(operation, "replayed"),
        };
      }
      if (operation.state === "confirmed_no_effect") {
        return { status_version: 1, status: "confirmed_no_effect" };
      }
      if (operation.state !== "eligible" || checkedAt < operation.effectDeadlineAt) {
        return { status_version: 1, status: "unknown" };
      }
      const noEffectEvidenceHash = hashCanonical({
        no_effect_version: 1,
        effect_identity_hash: operation.effectIdentityHash,
        canonical_payload_hash: operation.canonicalPayloadHash,
        writer_fence_hash: operation.writerFenceHash,
        checked_at: checkedAt.toISOString(),
      });
      const fenced = await transaction.nurtureC30ActionOperation.updateMany({
        where: { id: operation.id, state: "eligible", writerFenceHash: operation.writerFenceHash },
        data: {
          state: "confirmed_no_effect",
          noEffectFenceEvidenceHash: noEffectEvidenceHash,
          recoveryCheckedAt: checkedAt,
        },
      });
      if (fenced.count !== 1) return { status_version: 1, status: "unknown" };
      const aggregateRef = actionOperationRef(operation.id);
      await transaction.nurtureC30ActionAuditRecord.create({
        data: {
          actionOperationId: operation.id,
          eventKey: "c30.action.confirmed_no_effect",
          aggregateRef,
          evidenceHash: noEffectEvidenceHash,
          correlationRef: correlationRef(operation.requestCorrelationHash),
        },
      });
      await transaction.nurtureC30ActionOutboxEvent.create({
        data: {
          actionOperationId: operation.id,
          eventType: "nurture.c30.action.confirmed_no_effect",
          aggregateRef,
          participantRef: participantRefValue(
            operation.participantId,
            command.current_participant.participant_ref.version ?? 1,
          ),
          correlationRef: correlationRef(operation.requestCorrelationHash),
          evidenceHash: noEffectEvidenceHash,
        },
      });
      return { status_version: 1, status: "confirmed_no_effect" };
    });
  }

  private async register(command: NurtureC30ActionExecutionCommandV1): Promise<void> {
    await this.retrySerializable(async (transaction) => {
      const effectIdentityHash = computeNurtureC30ActionEffectIdentityHash(command.execution_binding);
      const existing = await lockOperation(transaction, effectIdentityHash);
      if (existing) {
        assertOperationMatches(existing, command);
        return;
      }
      const now = await databaseNow(transaction);
      assertOpenDeadline(new Date(command.invocation_evidence.effect_deadline_at), now);
      const participantBindingId = await assertCurrentActor(transaction, command);
      const authority = await this.authorityReader.verifyCurrent(transaction, {
        command,
        participantBindingId,
        purpose: "admit_action",
        now,
      });
      assertAuthority(authority);
      if (
        authority.authorityEvidenceHash !== command.current_target.authority_evidence_hash
        || authority.authorityRevision !== command.current_target.authority_revision
      ) throw actionError("action_authority_denied", "Admission authority evidence does not match.");
      const identity = command.execution_binding.effect_identity;
      await transaction.nurtureC30ActionOperation.create({
        data: {
          id: command.operation_id,
          workspaceId: command.principal.workspace_ref.object_id,
          scenarioKey: "nurture",
          actionKey: command.definition.contract.action_key,
          driver: command.definition.contract.driver,
          effectIdentityHash,
          canonicalPayloadHash: command.execution_binding.canonical_payload_hash,
          participantId: command.current_participant.participant_ref.object_id,
          participantBindingId,
          principalBindingHash: command.prepared.principal_binding_hash,
          accountObjectId: command.principal.account_ref.object_id,
          actorObjectId: command.principal.actor_ref.object_id,
          representedOrganizationObjectId:
            command.current_participant.represented_organization_ref?.object_id,
          targetRefHash: hashCanonical(command.current_target.target_ref),
          targetVersion: command.current_target.current_version,
          primaryScopeRef: clonedJson(command.current_target.primary_scope_ref),
          childCareProcessId: command.current_target.child_care_process_ref?.object_id,
          submitContextRef: identity.driver === "scenario_direct_empty_v1"
            ? clonedJson(identity.submit_context_ref)
            : undefined,
          originalWorkflowStepRef: identity.driver === "workflow_claimed_step_v1"
            ? clonedJson(identity.original_workflow_step_ref)
            : undefined,
          actionContractHash: command.prepared.action_contract_hash,
          authorityEvidenceHash: authority.authorityEvidenceHash,
          authorityRevision: authority.authorityRevision,
          scenarioCommandId: command.scenario_command_id,
          scenarioCommandHash: command.scenario_command_hash,
          clientMutationIdHash: nurtureSha256Hex(
            Buffer.from(command.submit.client_echo.client_mutation_id, "utf8"),
          ),
          requestNonceHash: command.invocation_evidence.request_nonce_hash,
          hostIdentityEvidenceHash: command.invocation_evidence.host_identity_evidence_hash,
          principalProvenanceHash: command.invocation_evidence.principal_provenance_hash,
          requestCorrelationHash: command.invocation_evidence.request_correlation_hash,
          deadlineEvidenceHash: command.invocation_evidence.deadline_evidence_hash,
          attemptLedgerHash: command.invocation_evidence.attempt_ledger_hash,
          writerFenceHash: command.invocation_evidence.writer_fence_hash,
          effectDeadlineAt: new Date(command.invocation_evidence.effect_deadline_at),
          state: "eligible",
        },
      });
    });
  }

  private async retrySerializable<T>(work: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (attempt < 2 && isRetryable(error)) continue;
        throw error;
      }
    }
    throw actionError("action_conflict", "The action transaction retry was exhausted.");
  }
}

async function assertCurrentActor(
  transaction: Prisma.TransactionClient,
  command: NurtureC30ActionExecutionCommandV1,
): Promise<string> {
  const participant = await transaction.nurtureParticipant.findUnique({
    where: { id: command.current_participant.participant_ref.object_id },
  });
  if (
    !participant
    || participant.workspaceId !== command.principal.workspace_ref.object_id
    || participant.status !== "active"
    || participant.aggregateVersion !== command.current_participant.participant_ref.version
  ) throw actionError("action_authority_denied", "The current action Participant changed.");
  const bindings = await transaction.nurtureParticipantPrincipalBinding.findMany({
    where: {
      participantId: participant.id,
      workspaceId: participant.workspaceId,
      currentKey: "current",
    },
    take: 2,
  });
  const binding = bindings[0];
  if (
    bindings.length !== 1
    || !binding
    || binding.status !== "active"
    || binding.aggregateVersion !== command.current_participant.binding_revision
    || binding.accountObjectId !== command.principal.account_ref.object_id
    || binding.actorObjectId !== command.principal.actor_ref.object_id
    || binding.representedOrganizationObjectId
      !== (command.current_participant.represented_organization_ref?.object_id ?? null)
  ) throw actionError("action_authority_denied", "The current action principal binding changed.");
  return binding.id;
}

async function lockOperation(
  transaction: Prisma.TransactionClient,
  effectIdentityHash: string,
): Promise<NurtureC30ActionOperation | null> {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "nurture_c30_action_operation"
    WHERE "effect_identity_hash" = ${effectIdentityHash}
    FOR UPDATE
  `);
  return rows[0]
    ? transaction.nurtureC30ActionOperation.findUnique({ where: { id: rows[0].id } })
    : null;
}

function assertOperationMatches(
  operation: NurtureC30ActionOperation,
  command: NurtureC30ActionExecutionCommandV1,
): void {
  const identity = command.execution_binding.effect_identity;
  const storedIdentity = operation.driver === "scenario_direct_empty_v1"
    ? operation.submitContextRef
    : operation.originalWorkflowStepRef;
  const expectedIdentity = identity.driver === "scenario_direct_empty_v1"
    ? identity.submit_context_ref
    : identity.original_workflow_step_ref;
  if (
    operation.workspaceId !== command.principal.workspace_ref.object_id
    || operation.scenarioKey !== "nurture"
    || operation.actionKey !== command.definition.contract.action_key
    || operation.driver !== command.definition.contract.driver
    || operation.effectIdentityHash !== computeNurtureC30ActionEffectIdentityHash(command.execution_binding)
    || operation.canonicalPayloadHash !== command.execution_binding.canonical_payload_hash
    || operation.participantId !== command.current_participant.participant_ref.object_id
    || operation.principalBindingHash !== command.prepared.principal_binding_hash
    || operation.accountObjectId !== command.principal.account_ref.object_id
    || operation.actorObjectId !== command.principal.actor_ref.object_id
    || operation.representedOrganizationObjectId
      !== (command.current_participant.represented_organization_ref?.object_id ?? null)
    || operation.targetRefHash !== hashCanonical(command.current_target.target_ref)
    || operation.targetVersion !== command.current_target.current_version
    || hashCanonical(operation.primaryScopeRef) !== hashCanonical(command.current_target.primary_scope_ref)
    || operation.childCareProcessId !== (command.current_target.child_care_process_ref?.object_id ?? null)
    || hashCanonical(storedIdentity) !== hashCanonical(expectedIdentity)
    || operation.actionContractHash !== command.prepared.action_contract_hash
    || operation.scenarioCommandHash !== command.scenario_command_hash
    || operation.clientMutationIdHash !== nurtureSha256Hex(
      Buffer.from(command.submit.client_echo.client_mutation_id, "utf8"),
    )
    || hashCanonical(operation.handoffRequestSnapshots ?? command.handoff_request_snapshots)
      !== hashCanonical(command.handoff_request_snapshots)
  ) throw actionError("action_conflict", "The effect identity was reused with different immutable input.");
}

function committedResult(
  operation: NurtureC30ActionOperation,
  disposition: "executed" | "replayed",
): Extract<ScenarioDomainActionExecutionResultV1, { status: "committed" }> {
  if (
    operation.state !== "committed"
    || !operation.commandExecutionId
    || !operation.businessOutcome
    || !Array.isArray(operation.outputRefs)
    || !Array.isArray(operation.handoffRequestSnapshots)
  ) throw actionError("action_conflict", "The committed action result is incomplete.");
  const result: unknown = {
    status: "committed",
    disposition,
    business_outcome: operation.businessOutcome,
    execution_ref: localRef("command_execution", operation.commandExecutionId, 1),
    output_refs: operation.outputRefs,
    handoff_request_snapshots: operation.handoffRequestSnapshots,
  };
  assertScenarioDomainActionExecutionResultV1(result);
  if (result.status !== "committed") throw new Error("unreachable committed action result");
  return result;
}

function notCommitted(
  decision: "invalid_request" | "request_conflict" | "rate_limited",
  message: string,
): ScenarioDomainActionExecutionResultV1 {
  return {
    status: "not_committed",
    decision,
    safe_reason: {
      reason_code: decision,
      message: { kind: "plain_text", value: message, locale: "en" },
      retry_class: "refresh",
    },
  };
}

function assertAuthority(value: {
  authorized: true;
  authorityEvidenceHash: string;
  authorityRevision: number;
}): void {
  if (
    value.authorized !== true
    || !sha256Pattern.test(value.authorityEvidenceHash)
    || !Number.isSafeInteger(value.authorityRevision)
    || value.authorityRevision < 1
  ) throw actionError("action_authority_denied", "Current action authority evidence is invalid.");
}

async function databaseNow(transaction: Prisma.TransactionClient): Promise<Date> {
  const rows = await transaction.$queryRaw<Array<{ now: Date }>>(Prisma.sql`
    SELECT transaction_timestamp() AS "now"
  `);
  const now = rows[0]?.now;
  if (!(now instanceof Date)) throw actionError("action_conflict", "Database time is unavailable.");
  return now;
}

function assertOpenDeadline(deadline: Date, now: Date): void {
  if (
    !Number.isFinite(deadline.getTime())
    || deadline <= now
    || deadline.getTime() - now.getTime() > 60_000
  ) throw actionError("action_conflict", "The action effect deadline is not current.");
}

function clonedJson(value: unknown): Prisma.InputJsonValue {
  return structuredClone(value) as Prisma.InputJsonValue;
}

function localRef(objectType: string, objectId: string, version: number): CanonicalRef {
  return { schema_version: 1, namespace: "nurture", object_type: objectType, object_id: objectId, version };
}

function participantRefValue(participantId: string, version: number): string {
  return `nurture:participant:${participantId}:v${version}`;
}

function commandExecutionRef(executionId: string): string {
  return `nurture:command_execution:${executionId}:v1`;
}

function actionOperationRef(operationId: string): string {
  return `nurture:c30_action_operation:${operationId}:v1`;
}

function correlationRef(hash: string): string {
  return `sha256:${hash}`;
}

function hashCanonical(value: unknown): string {
  return nurtureSha256Hex(nurtureCanonicalJsonBytes(value));
}

function actionError(
  code: "action_conflict" | "action_authority_denied",
  message: string,
): NurtureC30CanonicalActionError {
  return new NurtureC30CanonicalActionError(code, message);
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2034" || error.code === "P2002") return true;
  return error.code === "P2010"
    && typeof error.meta?.code === "string"
    && error.meta.code === "40001";
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
