import { randomUUID } from "node:crypto";
import {
  Prisma,
  type NurtureC30PairOperation,
  type PrismaClient,
} from "@prisma/client";
import {
  assertNurtureC30PairAssociationCommandV1,
  assertNurtureC30StatusLookupRequest,
  nurtureCanonicalJsonBytes,
  nurtureSha256Hex,
  NurtureC30PairAssociationError,
  type NurtureC30PairAssociationCommandV1,
  type NurtureC30PairAssociationRepository,
  type NurtureC30PairAssociationResultV1,
  type NurtureC30PairAttemptRegistrationV1,
} from "@the-nurture/scenario";
import type {
  ScenarioIdentityOperationStatusLookupRequestV1,
  ScenarioIdentityOperationStatusLookupResultV1,
} from "@my-chat/workflow-contracts";

type TransactionClient = Prisma.TransactionClient;

export type NurtureC30PairAuthorityInput = {
  workspaceId: string;
  participantId: string;
  accountObjectId: string;
  actorObjectId: string;
  representedOrganizationObjectId?: string;
  childAnchorId: string;
  familyAnchorId: string;
  purpose: "associate_canonical_pair";
  now: Date;
};

export type NurtureC30PairAuthorityEvidence = {
  authorized: true;
  authoritySourceRef: string;
  authoritySourceVersion: number;
};

export type TransactionalNurtureC30PairAuthorityReader = {
  verifyCurrent(
    transaction: TransactionClient,
    input: NurtureC30PairAuthorityInput,
  ): Promise<NurtureC30PairAuthorityEvidence>;
};

export class DenyTransactionalNurtureC30PairAuthorityReader
implements TransactionalNurtureC30PairAuthorityReader {
  async verifyCurrent(): Promise<never> {
    throw pairError(
      "pair_authority_denied",
      "C30 pair authority is not configured; pair association remains disabled.",
    );
  }
}

type LockedParticipant = {
  id: string;
  workspaceId: string;
  status: string;
  aggregateVersion: number;
};

type LockedAnchor = {
  id: string;
  status: string;
  aggregateVersion: number;
};

export class PrismaNurtureC30PairAssociationRepository
implements NurtureC30PairAssociationRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly authorityReader: TransactionalNurtureC30PairAuthorityReader =
      new DenyTransactionalNurtureC30PairAuthorityReader(),
  ) {}

  async registerEligibleAttempt(
    command: NurtureC30PairAssociationCommandV1,
  ): Promise<NurtureC30PairAttemptRegistrationV1> {
    assertNurtureC30PairAssociationCommandV1(command);
    return this.retrySerializable(async (transaction) => {
      const existing = await lockOperation(transaction, command.pair_request.identity_operation_id);
      if (existing) {
        assertOperationMatches(existing, command);
        return registration(existing, "exact_replay");
      }
      const now = await databaseNow(transaction);
      assertOpenDeadline(command.effect_deadline_at, now);
      const context = await lockBootstrapContext(transaction, command);
      const authority = await this.verifyAuthority(transaction, command, context.participant, now);
      await transaction.nurtureC30PairOperation.create({
        data: {
          id: command.pair_request.identity_operation_id,
          workspaceId: command.principal.workspace_ref.object_id,
          scenarioKey: "nurture",
          participantId: command.local_seed.participant_id,
          accountObjectId: command.principal.account_ref.object_id,
          actorObjectId: command.principal.actor_ref.object_id,
          representedOrganizationObjectId: undefined,
          childAnchorId: context.childAnchor.id,
          familyAnchorId: context.familyAnchor.id,
          childOwnerVersion: context.childAnchor.aggregateVersion,
          familyOwnerVersion: context.familyAnchor.aggregateVersion,
          authoritySourceRef: authority.authoritySourceRef,
          authoritySourceVersion: authority.authoritySourceVersion,
          principalProvenanceHash: command.pair_request.principal_provenance_hash,
          continuationContextHash: command.pair_request.continuation_context_hash,
          pairRelationEvidenceHash: command.pair_request.pair_relation_evidence_hash,
          currentOwnerEvidenceHash: command.current_owner_evidence.current_owner_evidence_hash,
          canonicalInputHash: command.pair_request.canonical_input_hash,
          pairCommitEvidenceHash: command.pair_result.pair_commit_evidence_hash,
          associationExpectationHash: command.association_expectation_hash,
          scenarioCommandId: command.scenario_command_id,
          scenarioCommandHash: command.scenario_command_hash,
          requestNonceHash: command.request_nonce_hash,
          hostIdentityEvidenceHash: command.host_identity_evidence_hash,
          deadlineEvidenceHash: command.deadline_evidence_hash,
          attemptLedgerHash: command.attempt_ledger_hash,
          writerFenceHash: command.writer_fence_hash,
          effectDeadlineAt: new Date(command.effect_deadline_at),
          state: "eligible",
        },
      });
      return {
        registration_version: 1,
        identity_operation_id: command.pair_request.identity_operation_id,
        disposition: "eligible",
        effect_deadline_at: command.effect_deadline_at,
      };
    });
  }

  async commitAssociation(
    command: NurtureC30PairAssociationCommandV1,
  ): Promise<NurtureC30PairAssociationResultV1> {
    assertNurtureC30PairAssociationCommandV1(command);
    return this.retrySerializable(async (transaction) => {
      const operation = await lockOperation(transaction, command.pair_request.identity_operation_id);
      if (!operation) throw pairError("pair_attempt_not_current", "The eligible pair attempt was not found.");
      assertOperationMatches(operation, command);
      if (operation.state === "committed") return resultFromCommand(command, operation, "exact_replay");
      if (operation.state !== "eligible") {
        throw pairError("pair_attempt_not_current", "The pair attempt is not eligible for dispatch.");
      }
      const now = await databaseNow(transaction);
      assertOpenDeadline(command.effect_deadline_at, now);
      const context = await lockBootstrapContext(transaction, command);
      const authority = await this.verifyAuthority(transaction, command, context.participant, now);
      if (
        authority.authoritySourceRef !== operation.authoritySourceRef
        || authority.authoritySourceVersion !== operation.authoritySourceVersion
      ) {
        throw pairError("pair_authority_denied", "Current local authority differs from admission.");
      }
      const claimed = await transaction.nurtureC30PairOperation.updateMany({
        where: { id: operation.id, state: "eligible", writerFenceHash: command.writer_fence_hash },
        data: { state: "dispatching" },
      });
      if (claimed.count !== 1) {
        throw pairError("pair_concurrency_conflict", "The pair writer fence was lost.");
      }

      const binding = await ensurePrincipalBinding(transaction, command);
      await ensureLocalObjects(transaction, command);
      await assertNoCurrentAssociationConflict(transaction, command);
      await transaction.nurtureChildAnchorAssociation.create({
        data: {
          id: command.local_seed.child_association_id,
          workspaceId: command.principal.workspace_ref.object_id,
          childAnchorId: context.childAnchor.id,
          childId: command.local_seed.child_id,
          status: "active",
          currentKey: "current",
        },
      });
      await transaction.nurtureFamilyAnchorAssociation.create({
        data: {
          id: command.local_seed.family_association_id,
          workspaceId: command.principal.workspace_ref.object_id,
          familyAnchorId: context.familyAnchor.id,
          childAnchorId: context.childAnchor.id,
          childAssociationId: command.local_seed.child_association_id,
          currentChildAssociationId: command.local_seed.child_association_id,
          childId: command.local_seed.child_id,
          childCareProcessId: command.local_seed.child_care_process_id,
          familyId: command.local_seed.family_id,
          status: "active",
          currentKey: "current",
        },
      });
      await transaction.nurtureChildCareProcess.update({
        where: { id: command.local_seed.child_care_process_id },
        data: { primaryFamilyId: command.local_seed.family_id },
      });
      await ensureInitialRole(transaction, command);

      const scenarioCommitEvidenceHash = commitEvidenceHash(command, binding.aggregateVersion, now);
      const executionRef = executionRefValue(command.local_seed.command_execution_id);
      const participantRef = participantRefValue(command.local_seed.participant_id, binding.aggregateVersion);
      await transaction.nurtureCommandExecution.create({
        data: {
          id: command.local_seed.command_execution_id,
          workspaceId: command.principal.workspace_ref.object_id,
          commandRequestIdHash: command.scenario_command_hash,
          originInvocationRequestIdHash: command.request_nonce_hash,
          commandKey: "c30_associate_canonical_pair",
          commandScope: "canonical_pair",
          commandContractVersion: 1,
          payloadHash: command.association_expectation_hash,
          businessActorRef: participantRef,
          actorPrincipalBindingId: binding.id,
          actorBindingVersion: binding.aggregateVersion,
          actorAccountRef: command.principal.account_ref,
          actorRef: command.principal.actor_ref,
          actorWorkspaceRef: command.principal.workspace_ref,
          invocationProvenance: {
            provenance_version: 1,
            principal_origin: command.principal.principal_origin,
            identity_operation_id: command.pair_request.identity_operation_id,
            request_nonce_hash: command.request_nonce_hash,
          },
          scenarioKey: "nurture",
          scenarioEffectIdentityHash: scenarioCommitEvidenceHash,
          executionDriver: null,
          childCareProcessId: command.local_seed.child_care_process_id,
          targetRefs: [
            localRef("child_care_process", command.local_seed.child_care_process_id, 1),
            localRef("family", command.local_seed.family_id, 1),
          ],
          businessOutcome: "applied",
          outputRefs: [
            localRef("child_care_process", command.local_seed.child_care_process_id, 1),
            localRef("family", command.local_seed.family_id, 1),
          ],
          handoffRequestSnapshotsPayload: [],
          resultSchemaVersion: 1,
          committedResultPayload: {
            result_version: 1,
            body: "no_body",
            identity_operation_id: command.pair_request.identity_operation_id,
            scenario_commit_evidence_hash: scenarioCommitEvidenceHash,
          },
          committedAt: now,
        },
      });
      await transaction.nurtureC30AuditRecord.create({
        data: {
          id: randomUUID(),
          operationId: operation.id,
          eventKey: "canonical_pair_associated",
          aggregateRef: pairOperationRef(operation.id),
          executionRef,
          evidenceHash: scenarioCommitEvidenceHash,
          correlationRef: command.scenario_command_id,
        },
      });
      await transaction.nurtureC30OutboxEvent.create({
        data: {
          id: randomUUID(),
          operationId: operation.id,
          eventType: "nurture.canonical_pair.associated",
          aggregateRef: pairOperationRef(operation.id),
          executionRef,
          participantRef,
          correlationRef: command.scenario_command_id,
          evidenceHash: scenarioCommitEvidenceHash,
        },
      });
      await transitionAnchor(transaction, "child", context.childAnchor);
      await transitionAnchor(transaction, "family", context.familyAnchor);
      const updated = await transaction.nurtureC30PairOperation.update({
        where: { id: operation.id },
        data: {
          state: "committed",
          participantBindingId: binding.id,
          childAssociationId: command.local_seed.child_association_id,
          familyAssociationId: command.local_seed.family_association_id,
          commandExecutionId: command.local_seed.command_execution_id,
          scenarioCommitEvidenceHash,
          committedAt: now,
        },
      });
      return resultFromCommand(command, updated, "committed");
    });
  }

  async lookupStatus(
    request: ScenarioIdentityOperationStatusLookupRequestV1,
    now: Date,
  ): Promise<ScenarioIdentityOperationStatusLookupResultV1> {
    assertNurtureC30StatusLookupRequest(request);
    return this.retrySerializable(async (transaction) => {
      const checkedAt = await databaseNow(transaction);
      if (Math.abs(checkedAt.getTime() - now.getTime()) > 60_000) {
        throw pairError("pair_command_invalid", "Status lookup clock is not current.");
      }
      const operation = await lockOperation(transaction, request.identity_operation_id);
      if (!operation || !statusEvidenceMatches(operation, request)) {
        return unknownStatus(request, checkedAt, "compatible_evidence_ambiguous");
      }
      if (operation.state === "committed" && operation.commandExecutionId && operation.scenarioCommitEvidenceHash) {
        return {
          status_lookup_result_version: 1,
          identity_operation_id: operation.id,
          scenario_command_id: operation.scenarioCommandId,
          checked_at: checkedAt.toISOString(),
          request_nonce_hash: operation.requestNonceHash,
          status: "committed",
          scenario_execution_ref: localRef("command_execution", operation.commandExecutionId, 1),
          scenario_commit_evidence_hash: operation.scenarioCommitEvidenceHash,
        };
      }
      if (operation.state === "confirmed_no_effect" && operation.noEffectFenceEvidenceHash) {
        return noEffectStatus(operation, checkedAt);
      }
      if (operation.state !== "eligible" || checkedAt < operation.effectDeadlineAt) {
        return unknownStatus(request, checkedAt, "possible_inflight");
      }
      const noEffectFenceEvidenceHash = hashCanonical({
        evidence_version: 1,
        identity_operation_id: operation.id,
        scenario_command_id: operation.scenarioCommandId,
        writer_fence_hash: operation.writerFenceHash,
        attempt_ledger_hash: operation.attemptLedgerHash,
        effect_deadline_at: operation.effectDeadlineAt.toISOString(),
        checked_at: checkedAt.toISOString(),
      });
      const closed = await transaction.nurtureC30PairOperation.update({
        where: { id: operation.id },
        data: {
          state: "confirmed_no_effect",
          noEffectFenceEvidenceHash,
          recoveryCheckedAt: checkedAt,
        },
      });
      await transaction.nurtureC30AuditRecord.create({
        data: {
          id: randomUUID(),
          operationId: operation.id,
          eventKey: "canonical_pair_confirmed_no_effect",
          aggregateRef: pairOperationRef(operation.id),
          evidenceHash: noEffectFenceEvidenceHash,
          correlationRef: request.scenario_command_id,
        },
      });
      await transaction.nurtureC30OutboxEvent.create({
        data: {
          id: randomUUID(),
          operationId: operation.id,
          eventType: "nurture.canonical_pair.confirmed_no_effect",
          aggregateRef: pairOperationRef(operation.id),
          participantRef: participantRefValue(operation.participantId, 1),
          correlationRef: request.scenario_command_id,
          evidenceHash: noEffectFenceEvidenceHash,
        },
      });
      return noEffectStatus(closed, checkedAt);
    });
  }

  private verifyAuthority(
    transaction: TransactionClient,
    command: NurtureC30PairAssociationCommandV1,
    participant: LockedParticipant,
    now: Date,
  ): Promise<NurtureC30PairAuthorityEvidence> {
    return this.authorityReader.verifyCurrent(transaction, {
      workspaceId: participant.workspaceId,
      participantId: participant.id,
      accountObjectId: command.principal.account_ref.object_id,
      actorObjectId: command.principal.actor_ref.object_id,
      childAnchorId: command.pair_result.bindings[0].scenario_owner_ref.object_id,
      familyAnchorId: command.pair_result.bindings[1].scenario_owner_ref.object_id,
      purpose: "associate_canonical_pair",
      now,
    }).then((evidence) => {
      if (
        evidence.authorized !== true
        || !evidence.authoritySourceRef
        || evidence.authoritySourceRef.length > 256
        || !Number.isSafeInteger(evidence.authoritySourceVersion)
        || evidence.authoritySourceVersion < 1
      ) {
        throw pairError("pair_authority_denied", "Current local authority evidence is invalid.");
      }
      return evidence;
    });
  }

  private async retrySerializable<TResult>(
    work: (transaction: TransactionClient) => Promise<TResult>,
  ): Promise<TResult> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        lastError = error;
        if (!isRetryableRace(error) || attempt === 2) throw error;
      }
    }
    throw lastError;
  }
}

async function lockBootstrapContext(
  transaction: TransactionClient,
  command: NurtureC30PairAssociationCommandV1,
): Promise<{ participant: LockedParticipant; childAnchor: LockedAnchor; familyAnchor: LockedAnchor }> {
  const participantRows = await transaction.$queryRaw<LockedParticipant[]>(Prisma.sql`
    SELECT "id", "workspace_id" AS "workspaceId", "status", "aggregate_version" AS "aggregateVersion"
    FROM "nurture_participant"
    WHERE "id" = ${command.local_seed.participant_id}
    FOR UPDATE
  `);
  const participant = participantRows[0];
  if (
    !participant
    || participant.workspaceId !== command.principal.workspace_ref.object_id
    || participant.status !== "active"
  ) {
    throw pairError("pair_authority_denied", "The current local Participant is unavailable.");
  }
  const childAnchor = await lockAnchor(
    transaction,
    "child",
    command.pair_result.bindings[0].scenario_owner_ref.object_id,
  );
  const familyAnchor = await lockAnchor(
    transaction,
    "family",
    command.pair_result.bindings[1].scenario_owner_ref.object_id,
  );
  if (
    childAnchor.aggregateVersion !== command.pair_result.bindings[0].scenario_owner_ref.version
    || familyAnchor.aggregateVersion !== command.pair_result.bindings[1].scenario_owner_ref.version
  ) {
    throw pairError("pair_evidence_mismatch", "The owner anchor version is stale.");
  }
  return { participant, childAnchor, familyAnchor };
}

async function lockAnchor(
  transaction: TransactionClient,
  kind: "child" | "family",
  id: string,
): Promise<LockedAnchor> {
  const rows = kind === "child"
    ? await transaction.$queryRaw<LockedAnchor[]>(Prisma.sql`
        SELECT "id", "status", "aggregate_version" AS "aggregateVersion"
        FROM "nurture_child_binding_anchor" WHERE "id" = ${id} FOR UPDATE
      `)
    : await transaction.$queryRaw<LockedAnchor[]>(Prisma.sql`
        SELECT "id", "status", "aggregate_version" AS "aggregateVersion"
        FROM "nurture_family_binding_anchor" WHERE "id" = ${id} FOR UPDATE
      `);
  const anchor = rows[0];
  if (!anchor || !["reserved", "bound_empty", "associated"].includes(anchor.status)) {
    throw pairError("pair_evidence_mismatch", `The ${kind} owner anchor is not current.`);
  }
  return anchor;
}

async function ensurePrincipalBinding(
  transaction: TransactionClient,
  command: NurtureC30PairAssociationCommandV1,
) {
  const workspaceId = command.principal.workspace_ref.object_id;
  const rows = await transaction.nurtureParticipantPrincipalBinding.findMany({
    where: {
      workspaceId,
      currentKey: "current",
      OR: [
        { participantId: command.local_seed.participant_id },
        {
          accountObjectId: command.principal.account_ref.object_id,
          actorObjectId: command.principal.actor_ref.object_id,
        },
      ],
    },
    take: 2,
  });
  if (rows.length > 1) throw pairError("pair_local_conflict", "Current principal binding is ambiguous.");
  const current = rows[0];
  if (current) {
    if (
      current.id !== command.local_seed.principal_binding_id
      || current.participantId !== command.local_seed.participant_id
      || current.accountObjectId !== command.principal.account_ref.object_id
      || current.actorObjectId !== command.principal.actor_ref.object_id
      || current.representedOrganizationObjectId !== null
      || current.status !== "active"
    ) {
      throw pairError("pair_local_conflict", "Current principal binding conflicts with the command.");
    }
    return current;
  }
  return transaction.nurtureParticipantPrincipalBinding.create({
    data: {
      id: command.local_seed.principal_binding_id,
      participantId: command.local_seed.participant_id,
      workspaceId,
      accountObjectId: command.principal.account_ref.object_id,
      actorObjectId: command.principal.actor_ref.object_id,
      status: "active",
      currentKey: "current",
    },
  });
}

async function ensureLocalObjects(
  transaction: TransactionClient,
  command: NurtureC30PairAssociationCommandV1,
): Promise<void> {
  const workspaceId = command.principal.workspace_ref.object_id;
  const child = await transaction.nurtureChild.findUnique({ where: { id: command.local_seed.child_id } });
  if (child) {
    if (
      child.workspaceId !== workspaceId
      || child.status !== "active"
      || child.displayName !== command.local_seed.child_display_name
    ) {
      throw pairError("pair_local_conflict", "The local child conflicts with the command.");
    }
  } else {
    await transaction.nurtureChild.create({
      data: {
        id: command.local_seed.child_id,
        workspaceId,
        displayName: command.local_seed.child_display_name,
        status: "active",
        aggregateVersion: 1,
      },
    });
  }
  const process = await transaction.nurtureChildCareProcess.findUnique({
    where: { id: command.local_seed.child_care_process_id },
  });
  if (process) {
    if (
      process.workspaceId !== workspaceId
      || process.childId !== command.local_seed.child_id
      || process.status !== "active"
      || (process.primaryFamilyId !== null && process.primaryFamilyId !== command.local_seed.family_id)
    ) {
      throw pairError("pair_local_conflict", "The local care process conflicts with the command.");
    }
  } else {
    await transaction.nurtureChildCareProcess.create({
      data: {
        id: command.local_seed.child_care_process_id,
        workspaceId,
        childId: command.local_seed.child_id,
        status: "active",
        aggregateVersion: 1,
      },
    });
  }
  const family = await transaction.nurtureFamily.findUnique({ where: { id: command.local_seed.family_id } });
  if (family) {
    if (
      family.workspaceId !== workspaceId
      || family.childCareProcessId !== command.local_seed.child_care_process_id
      || family.status !== "active"
      || family.displayName !== (command.local_seed.family_display_name ?? null)
    ) {
      throw pairError("pair_local_conflict", "The local family conflicts with the command.");
    }
  } else {
    await transaction.nurtureFamily.create({
      data: {
        id: command.local_seed.family_id,
        workspaceId,
        childCareProcessId: command.local_seed.child_care_process_id,
        displayName: command.local_seed.family_display_name,
        status: "active",
        aggregateVersion: 1,
      },
    });
  }
}

async function ensureInitialRole(
  transaction: TransactionClient,
  command: NurtureC30PairAssociationCommandV1,
): Promise<void> {
  const existing = await transaction.nurtureCareRoleAssignment.findFirst({
    where: {
      workspaceId: command.principal.workspace_ref.object_id,
      participantId: command.local_seed.participant_id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: command.local_seed.child_care_process_id,
      status: "active",
    },
  });
  if (existing) {
    if (
      existing.workspaceId !== command.principal.workspace_ref.object_id
      || existing.id !== command.local_seed.initial_role_assignment_id
      || existing.participantId !== command.local_seed.participant_id
      || existing.role !== "guardian"
      || existing.scopeType !== "child_care_process"
      || existing.scopeId !== command.local_seed.child_care_process_id
      || existing.status !== "active"
    ) {
      throw pairError("pair_local_conflict", "The initial local role conflicts with the command.");
    }
    return;
  }
  await transaction.nurtureCareRoleAssignment.create({
    data: {
      id: command.local_seed.initial_role_assignment_id,
      workspaceId: command.principal.workspace_ref.object_id,
      participantId: command.local_seed.participant_id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: command.local_seed.child_care_process_id,
      status: "active",
      aggregateVersion: 1,
    },
  });
}

async function assertNoCurrentAssociationConflict(
  transaction: TransactionClient,
  command: NurtureC30PairAssociationCommandV1,
): Promise<void> {
  const workspaceId = command.principal.workspace_ref.object_id;
  const [child, family] = await Promise.all([
    transaction.nurtureChildAnchorAssociation.findFirst({
      where: {
        workspaceId,
        currentKey: "current",
        OR: [
          { childAnchorId: command.pair_result.bindings[0].scenario_owner_ref.object_id },
          { childId: command.local_seed.child_id },
        ],
      },
    }),
    transaction.nurtureFamilyAnchorAssociation.findFirst({
      where: {
        workspaceId,
        currentKey: "current",
        OR: [
          { familyAnchorId: command.pair_result.bindings[1].scenario_owner_ref.object_id },
          { familyId: command.local_seed.family_id },
          { childCareProcessId: command.local_seed.child_care_process_id },
        ],
      },
    }),
  ]);
  if (child || family) throw pairError("pair_local_conflict", "A current local pair association already exists.");
}

async function transitionAnchor(
  transaction: TransactionClient,
  kind: "child" | "family",
  anchor: LockedAnchor,
): Promise<void> {
  const result = kind === "child"
    ? await transaction.nurtureChildBindingAnchor.updateMany({
        where: { id: anchor.id, aggregateVersion: anchor.aggregateVersion, status: { in: ["reserved", "bound_empty", "associated"] } },
        data: { status: "associated" },
      })
    : await transaction.nurtureFamilyBindingAnchor.updateMany({
        where: { id: anchor.id, aggregateVersion: anchor.aggregateVersion, status: { in: ["reserved", "bound_empty", "associated"] } },
        data: { status: "associated" },
      });
  if (result.count !== 1) throw pairError("pair_concurrency_conflict", `The ${kind} anchor changed concurrently.`);
}

async function lockOperation(
  transaction: TransactionClient,
  id: string,
): Promise<NurtureC30PairOperation | null> {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "nurture_c30_pair_operation" WHERE "id" = ${id} FOR UPDATE
  `);
  if (!rows[0]) return null;
  return transaction.nurtureC30PairOperation.findUnique({ where: { id } });
}

function assertOperationMatches(
  operation: NurtureC30PairOperation,
  command: NurtureC30PairAssociationCommandV1,
): void {
  const childOwner = command.pair_result.bindings[0].scenario_owner_ref;
  const familyOwner = command.pair_result.bindings[1].scenario_owner_ref;
  if (
    operation.workspaceId !== command.principal.workspace_ref.object_id
    || operation.scenarioKey !== "nurture"
    || operation.participantId !== command.local_seed.participant_id
    || operation.accountObjectId !== command.principal.account_ref.object_id
    || operation.actorObjectId !== command.principal.actor_ref.object_id
    || operation.childAnchorId !== childOwner.object_id
    || operation.familyAnchorId !== familyOwner.object_id
    || operation.childOwnerVersion !== childOwner.version
    || operation.familyOwnerVersion !== familyOwner.version
    || operation.principalProvenanceHash !== command.pair_request.principal_provenance_hash
    || operation.continuationContextHash !== command.pair_request.continuation_context_hash
    || operation.pairRelationEvidenceHash !== command.pair_request.pair_relation_evidence_hash
    || operation.currentOwnerEvidenceHash !== command.current_owner_evidence.current_owner_evidence_hash
    || operation.canonicalInputHash !== command.pair_request.canonical_input_hash
    || operation.pairCommitEvidenceHash !== command.pair_result.pair_commit_evidence_hash
    || operation.associationExpectationHash !== command.association_expectation_hash
    || operation.scenarioCommandId !== command.scenario_command_id
    || operation.scenarioCommandHash !== command.scenario_command_hash
    || operation.requestNonceHash !== command.request_nonce_hash
    || operation.hostIdentityEvidenceHash !== command.host_identity_evidence_hash
    || operation.deadlineEvidenceHash !== command.deadline_evidence_hash
    || operation.attemptLedgerHash !== command.attempt_ledger_hash
    || operation.writerFenceHash !== command.writer_fence_hash
    || operation.effectDeadlineAt.toISOString() !== command.effect_deadline_at
  ) {
    throw pairError("pair_attempt_conflict", "The identity operation was reused with different evidence.");
  }
}

function statusEvidenceMatches(
  operation: NurtureC30PairOperation,
  request: ScenarioIdentityOperationStatusLookupRequestV1,
): boolean {
  return operation.scenarioCommandId === request.scenario_command_id
    && operation.scenarioCommandHash === request.scenario_command_hash
    && operation.principalProvenanceHash === request.principal_provenance_hash
    && operation.hostIdentityEvidenceHash === request.host_identity_evidence_hash
    && operation.deadlineEvidenceHash === request.deadline_evidence_hash
    && operation.attemptLedgerHash === request.attempt_ledger_hash
    && operation.associationExpectationHash === request.association_expectation_hash
    && request.owner_bindings[0]?.owner_ref.object_id === operation.childAnchorId
    && request.owner_bindings[0]?.owner_ref.version === operation.childOwnerVersion
    && request.owner_bindings[1]?.owner_ref.object_id === operation.familyAnchorId
    && request.owner_bindings[1]?.owner_ref.version === operation.familyOwnerVersion;
}

function registration(
  operation: NurtureC30PairOperation,
  disposition: "exact_replay",
): NurtureC30PairAttemptRegistrationV1 {
  if (!["eligible", "committed"].includes(operation.state)) {
    throw pairError("pair_attempt_not_current", "The existing pair attempt is not replayable.");
  }
  return {
    registration_version: 1,
    identity_operation_id: operation.id,
    disposition,
    effect_deadline_at: operation.effectDeadlineAt.toISOString(),
  };
}

function resultFromCommand(
  command: NurtureC30PairAssociationCommandV1,
  operation: NurtureC30PairOperation,
  disposition: "committed" | "exact_replay",
): NurtureC30PairAssociationResultV1 {
  if (!operation.commandExecutionId || !operation.scenarioCommitEvidenceHash || !operation.participantBindingId) {
    throw pairError("pair_attempt_conflict", "The committed pair result is incomplete.");
  }
  return {
    result_version: 1,
    identity_operation_id: operation.id,
    scenario_command_id: operation.scenarioCommandId,
    disposition,
    participant_ref: localRef("participant", command.local_seed.participant_id, 1),
    child_care_process_ref: localRef("child_care_process", command.local_seed.child_care_process_id, 1),
    family_ref: localRef("family", command.local_seed.family_id, 1),
    scenario_execution_ref: localRef("command_execution", operation.commandExecutionId, 1),
    scenario_commit_evidence_hash: operation.scenarioCommitEvidenceHash,
  };
}

function noEffectStatus(
  operation: NurtureC30PairOperation,
  checkedAt: Date,
): ScenarioIdentityOperationStatusLookupResultV1 {
  if (!operation.noEffectFenceEvidenceHash) throw pairError("pair_attempt_conflict", "No-effect evidence is absent.");
  return {
    status_lookup_result_version: 1,
    identity_operation_id: operation.id,
    scenario_command_id: operation.scenarioCommandId,
    checked_at: checkedAt.toISOString(),
    request_nonce_hash: operation.requestNonceHash,
    status: "confirmed_no_effect",
    no_effect_fence_evidence_hash: operation.noEffectFenceEvidenceHash,
  };
}

function unknownStatus(
  request: ScenarioIdentityOperationStatusLookupRequestV1,
  checkedAt: Date,
  reasonCode: "possible_inflight" | "compatible_evidence_ambiguous",
): ScenarioIdentityOperationStatusLookupResultV1 {
  return {
    status_lookup_result_version: 1,
    identity_operation_id: request.identity_operation_id,
    scenario_command_id: request.scenario_command_id,
    checked_at: checkedAt.toISOString(),
    request_nonce_hash: hashCanonical({
      identity_operation_id: request.identity_operation_id,
      scenario_command_id: request.scenario_command_id,
      checked_at: checkedAt.toISOString(),
    }),
    status: "unknown",
    reason_code: reasonCode,
  };
}

function commitEvidenceHash(
  command: NurtureC30PairAssociationCommandV1,
  bindingVersion: number,
  committedAt: Date,
): string {
  return hashCanonical({
    evidence_version: 1,
    identity_operation_id: command.pair_request.identity_operation_id,
    scenario_command_hash: command.scenario_command_hash,
    association_expectation_hash: command.association_expectation_hash,
    participant_binding_version: bindingVersion,
    child_association_id: command.local_seed.child_association_id,
    family_association_id: command.local_seed.family_association_id,
    command_execution_id: command.local_seed.command_execution_id,
    committed_at: committedAt.toISOString(),
  });
}

function localRef(objectType: string, objectId: string, version: number) {
  return {
    schema_version: 1 as const,
    namespace: "nurture",
    object_type: objectType,
    object_id: objectId,
    version,
  };
}

function participantRefValue(participantId: string, version: number): string {
  return `nurture:participant:${participantId}:v${version}`;
}

function executionRefValue(executionId: string): string {
  return `nurture:command_execution:${executionId}:v1`;
}

function pairOperationRef(operationId: string): string {
  return `nurture:c30_pair_operation:${operationId}:v1`;
}

function hashCanonical(value: unknown): string {
  return nurtureSha256Hex(nurtureCanonicalJsonBytes(value));
}

function assertOpenDeadline(deadlineValue: string, now: Date): void {
  const deadline = Date.parse(deadlineValue);
  if (!Number.isFinite(deadline) || deadline <= now.getTime() || deadline - now.getTime() > 60_000) {
    throw pairError("pair_attempt_not_current", "The pair effect deadline is not current.");
  }
}

async function databaseNow(transaction: TransactionClient): Promise<Date> {
  const rows = await transaction.$queryRaw<Array<{ now: Date }>>(Prisma.sql`SELECT CURRENT_TIMESTAMP AS now`);
  const now = rows[0]?.now;
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error("Database time is invalid.");
  return now;
}

function isRetryableRace(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2002" || error.code === "P2034") return true;
  if (error.code !== "P2010" || !error.meta || typeof error.meta !== "object") return false;
  return (error.meta as Record<string, unknown>).code === "40001";
}

function pairError(
  code: NurtureC30PairAssociationError["code"],
  message: string,
): NurtureC30PairAssociationError {
  return new NurtureC30PairAssociationError(code, message);
}
