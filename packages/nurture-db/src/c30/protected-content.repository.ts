import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Prisma, type NurtureC30ProtectedContent, type PrismaClient } from "@prisma/client";
import {
  assertNurtureC30ProtectedCommitCommandV1,
  assertNurtureC30ProtectedEraseCommandV1,
  assertNurtureC30ProtectedReadCommandV1,
  computeNurtureC30ProtectedContentRefHash,
  computeNurtureC30ProtectedEncryptionContextHash,
  DenyNurtureC30ProtectedIntegrityPort,
  DenyNurtureC30ProtectedKmsPort,
  DenyNurtureC30ProtectedReadBindingPort,
  nurtureCanonicalJsonBytes,
  nurtureC30ProtectedContentError,
  nurtureC30ProtectedEncryptionAlgorithm,
  nurtureC30ProtectedEncryptionVersion,
  nurtureSha256Hex,
  type NurtureC30ProtectedAuthorityEvidenceV1,
  type NurtureC30ProtectedCommitCommandV1,
  type NurtureC30ProtectedCommitResultV1,
  type NurtureC30ProtectedContentRepository,
  type NurtureC30ProtectedEraseCommandV1,
  type NurtureC30ProtectedEraseReasonV1,
  type NurtureC30ProtectedEraseResultV1,
  type NurtureC30ProtectedIntegrityPort,
  type NurtureC30ProtectedKmsPort,
  type NurtureC30ProtectedReadBindingPort,
  type NurtureC30ProtectedReadCommandV1,
  type NurtureC30ProtectedReadResultV1,
  type NurtureC30ProvisionedDataKeyV1,
  type NurtureC30WrappedDataKeyV1,
} from "@the-nurture/scenario";
import {
  assertReadScenarioProtectedDetailResultV1,
  assertScenarioCommittedProtectedContentControlV1,
  type CanonicalRef,
  type ScenarioCommittedProtectedContentControlV1,
  type ScenarioProtectedPlainTextCarrierV1,
} from "@my-chat/workflow-contracts";

export type NurtureC30ProtectedTransaction = Prisma.TransactionClient;

type ProtectedAuthorityCommand =
  | NurtureC30ProtectedCommitCommandV1
  | NurtureC30ProtectedReadCommandV1
  | NurtureC30ProtectedEraseCommandV1;

export type TransactionalNurtureC30ProtectedAuthorityReader = {
  verifyCurrent(
    transaction: NurtureC30ProtectedTransaction,
    input: {
      command: ProtectedAuthorityCommand;
      participant_binding_id: string;
      purpose: "commit_protected" | "read_protected" | "erase_protected";
      now: Date;
    },
  ): Promise<NurtureC30ProtectedAuthorityEvidenceV1>;
};

export class DenyTransactionalNurtureC30ProtectedAuthorityReader
implements TransactionalNurtureC30ProtectedAuthorityReader {
  async verifyCurrent(): Promise<never> {
    throw protectedError("protected_authority_denied", "Protected authority is not configured.");
  }
}

type ErasurePlan = {
  row: NurtureC30ProtectedContent;
  terminal_lifecycle: "tombstoned" | "erased";
};

type ReadAdmission =
  | { kind: "closed"; result: NurtureC30ProtectedReadResultV1 }
  | { kind: "erase"; plan: ErasurePlan }
  | {
      kind: "active";
      row: NurtureC30ProtectedContent;
      admitted_at: Date;
    };

export class PrismaNurtureC30ProtectedContentRepository
implements NurtureC30ProtectedContentRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly authorityReader: TransactionalNurtureC30ProtectedAuthorityReader =
      new DenyTransactionalNurtureC30ProtectedAuthorityReader(),
    private readonly kms: NurtureC30ProtectedKmsPort = new DenyNurtureC30ProtectedKmsPort(),
    private readonly integrity: NurtureC30ProtectedIntegrityPort =
      new DenyNurtureC30ProtectedIntegrityPort(),
    private readonly readBinding: NurtureC30ProtectedReadBindingPort =
      new DenyNurtureC30ProtectedReadBindingPort(),
  ) {}

  async commit(
    command: NurtureC30ProtectedCommitCommandV1,
  ): Promise<NurtureC30ProtectedCommitResultV1> {
    assertNurtureC30ProtectedCommitCommandV1(command);
    await this.retrySerializable((transaction) => this.admitCommit(transaction, command));
    if (!await this.integrity.verify({
      carrier: command.carrier,
      protected_content_ref: command.prepared_content.protected_content_ref,
      request_identity_hash: command.request_identity_hash,
      expected_keyed_integrity_hash: command.prepared_content.keyed_integrity_hash,
    })) throw protectedError("protected_integrity_failed", "Protected carrier integrity failed.");

    const reservation = await this.retrySerializable((transaction) =>
      this.reserveCommit(transaction, command));
    if (reservation.lifecycle === "active") {
      return {
        result_version: 1,
        disposition: "replayed",
        committed_content: committedControl(reservation),
      };
    }

    const contentRefHash = computeNurtureC30ProtectedContentRefHash(reservation.protectedContentRef);
    const provisioned = await this.kms.provisionDataKey({
      provisioning_key: reservation.kmsProvisioningKey,
      content_ref_hash: contentRefHash,
      encryption_context_hash: reservation.encryptionContextHash,
    });
    assertProvisionedDataKey(provisioned);
    const plaintextDek = Buffer.from(provisioned.plaintext_dek);
    try {
      const sealed = encrypt(command.carrier.plain_text, plaintextDek, encryptionAadFromRow(reservation));
      return await this.retrySerializable((transaction) =>
        this.finalizeCommit(transaction, command, provisioned, sealed));
    } finally {
      plaintextDek.fill(0);
      provisioned.plaintext_dek.fill(0);
    }
  }

  async read(command: NurtureC30ProtectedReadCommandV1): Promise<NurtureC30ProtectedReadResultV1> {
    assertNurtureC30ProtectedReadCommandV1(command);
    await this.reconcilePendingErasure(command.request.protected_content_ref);
    const admission = await this.retrySerializable((transaction) =>
      this.admitRead(transaction, command));
    if (admission.kind === "closed") return admission.result;
    if (admission.kind === "erase") {
      await this.completeErasure(admission.plan);
      return closedRead("tombstone", "Protected content is no longer available.");
    }

    const row = admission.row;
    assertEncryptionContext(row);
    const plaintextDek = Buffer.from(await this.kms.unwrapDataKey({
      ...wrappedDataKey(row),
      content_ref_hash: computeNurtureC30ProtectedContentRefHash(row.protectedContentRef),
      encryption_context_hash: row.encryptionContextHash,
    }));
    try {
      if (plaintextDek.byteLength !== 32) {
        throw protectedError("protected_kms_unavailable", "Protected KMS returned an invalid key.");
      }
      const carrier: ScenarioProtectedPlainTextCarrierV1 = {
        protected_carrier_version: 1,
        protected_field_key: row.protectedFieldKey,
        media_type: "text/plain; charset=utf-8",
        plain_text: decrypt(row, plaintextDek, encryptionAadFromRow(row)),
        attachment_refs: [],
      };
      if (!await this.integrity.verify({
        carrier,
        protected_content_ref: row.protectedContentRef,
        request_identity_hash: row.requestIdentityHash,
        expected_keyed_integrity_hash: row.keyedIntegrityHash,
      })) throw protectedError("protected_integrity_failed", "Protected plaintext integrity failed.");
      const binding = await this.readBinding.bindCurrent({
        verified_foreground_context_hash: command.verified_foreground_context_hash,
        request_identity_hash: command.request_identity_hash,
        principal: command.principal,
        current_participant: command.current_participant,
        contract: command.contract,
        protected_content_ref: row.protectedContentRef,
        protected_content_version: row.committedContentVersion,
        carrier,
        now: admission.admitted_at,
      });
      assertReadBinding(binding);
      return this.retrySerializable((transaction) =>
        this.finalizeRead(transaction, command, row, carrier, binding));
    } finally {
      plaintextDek.fill(0);
    }
  }

  async erase(
    command: NurtureC30ProtectedEraseCommandV1,
  ): Promise<NurtureC30ProtectedEraseResultV1> {
    assertNurtureC30ProtectedEraseCommandV1(command);
    await this.reconcilePendingErasure(command.protected_content_ref);
    const admission = await this.retrySerializable(async (transaction) => {
      const now = await databaseNow(transaction);
      const participantBindingId = await assertCurrentActor(transaction, command);
      const authority = await this.verifyAuthority(
        transaction,
        command,
        participantBindingId,
        "erase_protected",
        now,
      );
      const row = await lockContentByRef(transaction, command.protected_content_ref);
      if (!row || !eraseContextMatches(row, command)) {
        throw protectedError("protected_context_changed", "Protected erase target changed.");
      }
      assertEraseTime(row, command.reason, now);
      const desiredLifecycle = terminalLifecycle(command.reason);
      if (row.lifecycle === "erased" || row.lifecycle === desiredLifecycle) {
        return {
          kind: "terminal" as const,
          result: {
            result_version: 1 as const,
            lifecycle: row.lifecycle,
            disposition: "already_terminal" as const,
          },
        };
      }
      if (row.lifecycle === "provisioning") {
        throw protectedError("protected_conflict", "Protected content provisioning is incomplete.");
      }
      if (row.lifecycle === "tombstoned") {
        if (desiredLifecycle !== "erased") {
          return {
            kind: "terminal" as const,
            result: {
              result_version: 1 as const,
              lifecycle: "tombstoned" as const,
              disposition: "already_terminal" as const,
            },
          };
        }
        await finishErasedTransition(
          transaction,
          row,
          command,
          participantBindingId,
          authority,
          now,
        );
        return {
          kind: "terminal" as const,
          result: {
            result_version: 1 as const,
            lifecycle: "erased" as const,
            disposition: "transitioned" as const,
          },
        };
      }
      if (row.lifecycle === "erasing") {
        return { kind: "erase" as const, plan: erasurePlan(row) };
      }
      const started = await beginErasure(
        transaction,
        row,
        command,
        participantBindingId,
        authority,
        command.reason,
        now,
      );
      return { kind: "erase" as const, plan: erasurePlan(started) };
    });
    if (admission.kind === "terminal") return admission.result;
    await this.completeErasure(admission.plan);
    return {
      result_version: 1,
      lifecycle: admission.plan.terminal_lifecycle,
      disposition: "transitioned",
    };
  }

  private async reserveCommit(
    transaction: Prisma.TransactionClient,
    command: NurtureC30ProtectedCommitCommandV1,
  ): Promise<NurtureC30ProtectedContent> {
    const now = await databaseNow(transaction);
    const participantBindingId = await assertCurrentActor(transaction, command);
    const authority = await this.verifyAuthority(
      transaction,
      command,
      participantBindingId,
      "commit_protected",
      now,
    );
    const existing = await lockContentByIdentity(transaction, command);
    if (existing) {
      assertCommitReplay(existing, command);
      if (!['provisioning', 'active'].includes(existing.lifecycle)) {
        throw protectedError("protected_conflict", "Protected content is terminal.");
      }
      return existing;
    }
    assertCommitTimes(command, now);
    const committedContentVersion = committedVersion(command);
    const encryptionContextHash = computeNurtureC30ProtectedEncryptionContextHash({
      protected_content_ref: command.prepared_content.protected_content_ref,
      workspace_ref: command.principal.workspace_ref,
      scenario_key: "nurture",
      action_key: command.contract.action_key,
      content_kind: command.contract.content_kind,
      protected_field_key: command.contract.protected_field_key,
      aggregate_ref: command.aggregate_ref,
      committed_content_version: committedContentVersion,
    });
    const contentRefHash = computeNurtureC30ProtectedContentRefHash(
      command.prepared_content.protected_content_ref,
    );
    const transitionEvidenceHash = hashCanonical({
      transition_version: 2,
      event: "provisioning_reserved",
      content_ref_hash: contentRefHash,
      authority,
      reserved_at: now.toISOString(),
    });
    return transaction.nurtureC30ProtectedContent.create({
      data: {
        id: command.content_id,
        workspaceId: command.principal.workspace_ref.object_id,
        scenarioKey: "nurture",
        actionKey: command.contract.action_key,
        protectedContentRef: command.prepared_content.protected_content_ref,
        contentKind: command.contract.content_kind,
        protectedFieldKey: command.contract.protected_field_key,
        owningActionRef: json(command.owning_action_ref),
        aggregateRef: json(command.aggregate_ref),
        creatorParticipantId: command.current_participant.participant_ref.object_id,
        creatorParticipantBindingId: participantBindingId,
        creatorAccountObjectId: command.principal.account_ref.object_id,
        creatorActorObjectId: command.principal.actor_ref.object_id,
        creatorRepresentedOrganizationObjectId:
          command.current_participant.represented_organization_ref?.object_id,
        principalBindingHash: principalBindingHash(command),
        requestIdentityHash: command.request_identity_hash,
        acceptedCarrierBindingHash: command.accepted_carrier_binding_hash,
        canonicalPayloadHash: command.canonical_payload_hash,
        keyedIntegrityHash: command.prepared_content.keyed_integrity_hash,
        authorityEvidenceHash: authority.authority_evidence_hash,
        authorityRevision: authority.authority_revision,
        pairEvidenceHash: authority.pair_evidence_hash,
        policyEvidenceHash: authority.policy_evidence_hash,
        preparedContentVersion: command.prepared_content.protected_content_version,
        committedContentVersion,
        encryptionAlgorithm: nurtureC30ProtectedEncryptionAlgorithm,
        encryptionVersion: nurtureC30ProtectedEncryptionVersion,
        encryptionContextHash,
        kmsProvisioningKey: hashCanonical({
          provisioning_key_version: 1,
          content_ref_hash: contentRefHash,
          request_identity_hash: command.request_identity_hash,
        }),
        lifecycle: "provisioning",
        readableUntil: new Date(command.readable_until),
        retentionUntil: new Date(command.retention_until),
        lastTransitionParticipantId: command.current_participant.participant_ref.object_id,
        lastTransitionParticipantBindingId: participantBindingId,
        lastTransitionEvidenceHash: transitionEvidenceHash,
        lastTransitionAuthorityRevision: authority.authority_revision,
      },
    });
  }

  private async admitCommit(
    transaction: Prisma.TransactionClient,
    command: NurtureC30ProtectedCommitCommandV1,
  ): Promise<void> {
    const now = await databaseNow(transaction);
    const participantBindingId = await assertCurrentActor(transaction, command);
    await this.verifyAuthority(
      transaction,
      command,
      participantBindingId,
      "commit_protected",
      now,
    );
    const existing = await lockContentByIdentity(transaction, command);
    if (existing) {
      assertCommitReplay(existing, command);
      if (!["provisioning", "active"].includes(existing.lifecycle)) {
        throw protectedError("protected_conflict", "Protected content is terminal.");
      }
      return;
    }
    assertCommitTimes(command, now);
  }

  private async finalizeCommit(
    transaction: Prisma.TransactionClient,
    command: NurtureC30ProtectedCommitCommandV1,
    provisioned: NurtureC30ProvisionedDataKeyV1,
    sealed: { ciphertext: Buffer; nonce: Buffer; authenticationTag: Buffer },
  ): Promise<NurtureC30ProtectedCommitResultV1> {
    const now = await databaseNow(transaction);
    const participantBindingId = await assertCurrentActor(transaction, command);
    const authority = await this.verifyAuthority(
      transaction,
      command,
      participantBindingId,
      "commit_protected",
      now,
    );
    const row = await lockContentByIdentity(transaction, command);
    if (!row) throw protectedError("protected_conflict", "Protected reservation is absent.");
    assertCommitReplay(row, command);
    if (row.lifecycle === "active") {
      return {
        result_version: 1,
        disposition: "replayed",
        committed_content: committedControl(row),
      };
    }
    if (row.lifecycle !== "provisioning") {
      throw protectedError("protected_conflict", "Protected reservation is no longer provisionable.");
    }
    assertCommitTimes(command, now);
    if (
      authority.authority_evidence_hash !== row.authorityEvidenceHash
      || authority.authority_revision !== row.authorityRevision
      || authority.pair_evidence_hash !== row.pairEvidenceHash
      || authority.policy_evidence_hash !== row.policyEvidenceHash
    ) throw protectedError("protected_authority_denied", "Protected authority changed during provisioning.");
    const transitionEvidenceHash = hashCanonical({
      transition_version: 2,
      event: "committed",
      content_ref_hash: computeNurtureC30ProtectedContentRefHash(row.protectedContentRef),
      authority,
      committed_at: now.toISOString(),
    });
    const committed = await transaction.nurtureC30ProtectedContent.update({
      where: { id: row.id },
      data: {
        lifecycle: "active",
        ciphertext: sealed.ciphertext,
        nonce: sealed.nonce,
        authenticationTag: sealed.authenticationTag,
        wrappedDek: Buffer.from(provisioned.wrapped_dek),
        kmsKeyDomain: provisioned.kms_key_domain,
        kmsKeyVersion: provisioned.kms_key_version,
        kmsKeyHandle: provisioned.kms_key_handle,
        kmsKeyHandleHash: hashString(provisioned.kms_key_handle),
        wrappingAlgorithm: provisioned.wrapping_algorithm,
        committedAt: now,
        lastTransitionParticipantId: command.current_participant.participant_ref.object_id,
        lastTransitionParticipantBindingId: participantBindingId,
        lastTransitionEvidenceHash: transitionEvidenceHash,
        lastTransitionAuthorityRevision: authority.authority_revision,
        aggregateVersion: { increment: 1 },
      },
    });
    await createAudit(
      transaction,
      committed,
      "committed",
      participantRefValue(command.current_participant),
      principalBindingRef(participantBindingId),
      transitionEvidenceHash,
    );
    return {
      result_version: 1,
      disposition: "committed",
      committed_content: committedControl(committed),
    };
  }

  private async admitRead(
    transaction: Prisma.TransactionClient,
    command: NurtureC30ProtectedReadCommandV1,
  ): Promise<ReadAdmission> {
    const now = await databaseNow(transaction);
    if (now < new Date(command.locator.issued_at) || now >= new Date(command.locator.expires_at)) {
      return { kind: "closed", result: closedRead("context_changed", "Protected foreground context changed.") };
    }
    const participantBindingId = await assertCurrentActor(transaction, command);
    const authority = await this.verifyAuthority(
      transaction,
      command,
      participantBindingId,
      "read_protected",
      now,
    );
    const row = await lockContentByRef(transaction, command.request.protected_content_ref);
    if (!row || !readContextMatches(row, command)) {
      return { kind: "closed", result: closedRead("unavailable", "Protected content is unavailable.") };
    }
    if (row.lifecycle === "provisioning") {
      return { kind: "closed", result: closedRead("unavailable", "Protected content is unavailable.") };
    }
    if (["tombstoned", "erased"].includes(row.lifecycle)) {
      return { kind: "closed", result: closedRead("tombstone", "Protected content is no longer available.") };
    }
    if (row.lifecycle === "erasing") return { kind: "erase", plan: erasurePlan(row) };
    if (
      command.request.known_content_version !== undefined
      && command.request.known_content_version !== row.committedContentVersion
    ) return { kind: "closed", result: closedRead("context_changed", "Protected content changed.") };
    if (now >= row.readableUntil || now >= row.retentionUntil) {
      const reason: NurtureC30ProtectedEraseReasonV1 = now >= row.retentionUntil
        ? "retention_elapsed"
        : "expired";
      const started = await beginErasure(
        transaction,
        row,
        command,
        participantBindingId,
        authority,
        reason,
        now,
      );
      return { kind: "erase", plan: erasurePlan(started) };
    }
    return { kind: "active", row, admitted_at: now };
  }

  private async finalizeRead(
    transaction: Prisma.TransactionClient,
    command: NurtureC30ProtectedReadCommandV1,
    admittedRow: NurtureC30ProtectedContent,
    carrier: ScenarioProtectedPlainTextCarrierV1,
    binding: { keyed_binding_hash: string; valid_until: string },
  ): Promise<NurtureC30ProtectedReadResultV1> {
    const now = await databaseNow(transaction);
    if (now >= new Date(command.locator.expires_at) || now >= new Date(binding.valid_until)) {
      return closedRead("context_changed", "Protected foreground context changed.");
    }
    const participantBindingId = await assertCurrentActor(transaction, command);
    await this.verifyAuthority(transaction, command, participantBindingId, "read_protected", now);
    const current = await lockContentByRef(transaction, command.request.protected_content_ref);
    if (
      !current
      || current.lifecycle !== "active"
      || current.aggregateVersion !== admittedRow.aggregateVersion
      || current.encryptionContextHash !== admittedRow.encryptionContextHash
      || current.committedContentVersion !== admittedRow.committedContentVersion
      || !readContextMatches(current, command)
      || now >= current.readableUntil
      || now >= current.retentionUntil
    ) return closedRead("context_changed", "Protected content changed.");
    const leaseExpiry = new Date(Math.min(
      now.getTime() + displayLeaseMs,
      new Date(command.locator.expires_at).getTime(),
      new Date(binding.valid_until).getTime(),
      current.readableUntil.getTime(),
    ));
    if (leaseExpiry <= now) return closedRead("context_changed", "Protected foreground context changed.");
    const result = {
      protected_read_result_version: 1 as const,
      status: "ready" as const,
      protected_content_version: current.committedContentVersion,
      content_kind: current.contentKind,
      carrier_binding: {
        carrier_binding_version: 1 as const,
        carrier_scope: "read_output" as const,
        protected_field_key: current.protectedFieldKey,
        keyed_binding_hash: binding.keyed_binding_hash,
      },
      display_lease: {
        display_lease_version: 1 as const,
        cache_policy: "no_store" as const,
        issued_at: now.toISOString(),
        expires_at: leaseExpiry.toISOString(),
      },
    };
    assertReadScenarioProtectedDetailResultV1(result);
    return { result, carrier, cache_control: "no-store" };
  }

  private async completeErasure(plan: ErasurePlan): Promise<void> {
    const row = plan.row;
    const key = wrappedDataKey(row);
    if (!row.erasureEvidenceHash) {
      throw protectedError("protected_conflict", "Protected erasure evidence is absent.");
    }
    await this.kms.destroyDataKey({
      kms_key_domain: key.kms_key_domain,
      kms_key_version: key.kms_key_version,
      kms_key_handle: key.kms_key_handle,
      content_ref_hash: computeNurtureC30ProtectedContentRefHash(row.protectedContentRef),
      erasure_evidence_hash: row.erasureEvidenceHash,
    });
    await this.retrySerializable(async (transaction) => {
      const current = await lockContentByRef(transaction, row.protectedContentRef);
      if (!current) throw protectedError("protected_conflict", "Protected erasure target is absent.");
      if (current.lifecycle === plan.terminal_lifecycle || current.lifecycle === "erased") return;
      if (
        current.lifecycle !== "erasing"
        || current.erasureEvidenceHash !== row.erasureEvidenceHash
        || current.kmsKeyHandleHash !== row.kmsKeyHandleHash
      ) throw protectedError("protected_conflict", "Protected erasure coordination changed.");
      const completedAt = await databaseNow(transaction);
      const transitionEvidenceHash = hashCanonical({
        transition_version: 2,
        event: plan.terminal_lifecycle,
        erasure_evidence_hash: current.erasureEvidenceHash,
        completed_at: completedAt.toISOString(),
      });
      const completed = await transaction.nurtureC30ProtectedContent.update({
        where: { id: current.id },
        data: {
          lifecycle: plan.terminal_lifecycle,
          ciphertext: null,
          nonce: null,
          authenticationTag: null,
          wrappedDek: null,
          kmsKeyDomain: null,
          kmsKeyVersion: null,
          kmsKeyHandle: null,
          kmsKeyHandleHash: null,
          wrappingAlgorithm: null,
          erasedAt: plan.terminal_lifecycle === "erased" ? completedAt : null,
          lastTransitionEvidenceHash: transitionEvidenceHash,
          aggregateVersion: { increment: 1 },
        },
      });
      await createAudit(
        transaction,
        completed,
        plan.terminal_lifecycle,
        participantRefValueFromRow(current),
        principalBindingRef(current.lastTransitionParticipantBindingId),
        transitionEvidenceHash,
      );
    });
  }

  private async reconcilePendingErasure(protectedContentRef: string): Promise<void> {
    const plan = await this.retrySerializable(async (transaction) => {
      const row = await lockContentByRef(transaction, protectedContentRef);
      return row?.lifecycle === "erasing" ? erasurePlan(row) : undefined;
    });
    if (plan) await this.completeErasure(plan);
  }

  private async verifyAuthority(
    transaction: Prisma.TransactionClient,
    command: ProtectedAuthorityCommand,
    participantBindingId: string,
    purpose: "commit_protected" | "read_protected" | "erase_protected",
    now: Date,
  ): Promise<NurtureC30ProtectedAuthorityEvidenceV1> {
    const authority = await this.authorityReader.verifyCurrent(transaction, {
      command,
      participant_binding_id: participantBindingId,
      purpose,
      now,
    });
    assertAuthority(authority);
    if (
      authority.authority_evidence_hash !== command.current_target.authority_evidence_hash
      || authority.authority_revision !== command.current_target.authority_revision
    ) throw protectedError("protected_authority_denied", "Protected current authority changed.");
    return authority;
  }

  private async retrySerializable<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
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
    throw protectedError("protected_conflict", "Protected transaction retry was exhausted.");
  }
}

async function beginErasure(
  transaction: Prisma.TransactionClient,
  row: NurtureC30ProtectedContent,
  command: NurtureC30ProtectedReadCommandV1 | NurtureC30ProtectedEraseCommandV1,
  participantBindingId: string,
  authority: NurtureC30ProtectedAuthorityEvidenceV1,
  reason: NurtureC30ProtectedEraseReasonV1,
  now: Date,
): Promise<NurtureC30ProtectedContent> {
  if (!row.kmsKeyHandle || !row.kmsKeyHandleHash) {
    throw protectedError("protected_conflict", "Protected key handle is missing.");
  }
  const erasureEvidenceHash = hashCanonical({
    erasure_version: 2,
    content_ref_hash: computeNurtureC30ProtectedContentRefHash(row.protectedContentRef),
    kms_key_handle_hash: row.kmsKeyHandleHash,
    reason,
    transition_evidence_hash: "transition_evidence_hash" in command
      ? command.transition_evidence_hash
      : command.request_identity_hash,
    requested_at: now.toISOString(),
  });
  const transitionEvidenceHash = hashCanonical({
    transition_version: 2,
    event: "erasure_started",
    erasure_evidence_hash: erasureEvidenceHash,
    authority,
    at: now.toISOString(),
  });
  const started = await transaction.nurtureC30ProtectedContent.update({
    where: { id: row.id },
    data: {
      lifecycle: "erasing",
      tombstoneReason: reason,
      tombstonedAt: now,
      erasureEvidenceHash,
      lastTransitionParticipantId: command.current_participant.participant_ref.object_id,
      lastTransitionParticipantBindingId: participantBindingId,
      lastTransitionEvidenceHash: transitionEvidenceHash,
      lastTransitionAuthorityRevision: authority.authority_revision,
      aggregateVersion: { increment: 1 },
    },
  });
  await createAudit(
    transaction,
    started,
    "erasure_started",
    participantRefValue(command.current_participant),
    principalBindingRef(participantBindingId),
    transitionEvidenceHash,
  );
  return started;
}

async function finishErasedTransition(
  transaction: Prisma.TransactionClient,
  row: NurtureC30ProtectedContent,
  command: NurtureC30ProtectedEraseCommandV1,
  participantBindingId: string,
  authority: NurtureC30ProtectedAuthorityEvidenceV1,
  now: Date,
): Promise<void> {
  const transitionEvidenceHash = hashCanonical({
    transition_version: 2,
    event: "erased",
    prior_erasure_evidence_hash: row.erasureEvidenceHash,
    requested_evidence_hash: command.transition_evidence_hash,
    authority,
    at: now.toISOString(),
  });
  const completed = await transaction.nurtureC30ProtectedContent.update({
    where: { id: row.id },
    data: {
      lifecycle: "erased",
      tombstoneReason: command.reason,
      erasedAt: now,
      lastTransitionParticipantId: command.current_participant.participant_ref.object_id,
      lastTransitionParticipantBindingId: participantBindingId,
      lastTransitionEvidenceHash: transitionEvidenceHash,
      lastTransitionAuthorityRevision: authority.authority_revision,
      aggregateVersion: { increment: 1 },
    },
  });
  await createAudit(
    transaction,
    completed,
    "erased",
    participantRefValue(command.current_participant),
    principalBindingRef(participantBindingId),
    transitionEvidenceHash,
  );
}

async function assertCurrentActor(
  transaction: Prisma.TransactionClient,
  command: ProtectedAuthorityCommand,
): Promise<string> {
  const participant = await transaction.nurtureParticipant.findUnique({
    where: { id: command.current_participant.participant_ref.object_id },
  });
  if (
    !participant
    || participant.workspaceId !== command.principal.workspace_ref.object_id
    || participant.status !== "active"
    || participant.aggregateVersion !== command.current_participant.participant_ref.version
  ) throw protectedError("protected_authority_denied", "Current protected Participant changed.");
  const bindings = await transaction.nurtureParticipantPrincipalBinding.findMany({
    where: { participantId: participant.id, workspaceId: participant.workspaceId, currentKey: "current" },
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
  ) throw protectedError("protected_authority_denied", "Current protected principal binding changed.");
  return binding.id;
}

async function lockContentByIdentity(
  transaction: Prisma.TransactionClient,
  command: NurtureC30ProtectedCommitCommandV1,
): Promise<NurtureC30ProtectedContent | null> {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "nurture_c30_protected_content"
    WHERE "protected_content_ref" = ${command.prepared_content.protected_content_ref}
       OR (
         "workspace_id" = ${command.principal.workspace_ref.object_id}
         AND "action_key" = ${command.contract.action_key}
         AND "request_identity_hash" = ${command.request_identity_hash}
       )
    ORDER BY "id"
    FOR UPDATE
  `);
  if (rows.length > 1) throw protectedError("protected_conflict", "Protected identity is ambiguous.");
  return rows[0]
    ? transaction.nurtureC30ProtectedContent.findUnique({ where: { id: rows[0].id } })
    : null;
}

async function lockContentByRef(
  transaction: Prisma.TransactionClient,
  protectedContentRef: string,
): Promise<NurtureC30ProtectedContent | null> {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "nurture_c30_protected_content"
    WHERE "protected_content_ref" = ${protectedContentRef}
    FOR UPDATE
  `);
  return rows[0]
    ? transaction.nurtureC30ProtectedContent.findUnique({ where: { id: rows[0].id } })
    : null;
}

function assertCommitReplay(
  row: NurtureC30ProtectedContent,
  command: NurtureC30ProtectedCommitCommandV1,
): void {
  if (
    row.id !== command.content_id
    || row.workspaceId !== command.principal.workspace_ref.object_id
    || row.scenarioKey !== "nurture"
    || row.actionKey !== command.contract.action_key
    || row.protectedContentRef !== command.prepared_content.protected_content_ref
    || row.contentKind !== command.contract.content_kind
    || row.protectedFieldKey !== command.contract.protected_field_key
    || row.creatorParticipantId !== command.current_participant.participant_ref.object_id
    || row.principalBindingHash !== principalBindingHash(command)
    || row.requestIdentityHash !== command.request_identity_hash
    || row.acceptedCarrierBindingHash !== command.accepted_carrier_binding_hash
    || row.canonicalPayloadHash !== command.canonical_payload_hash
    || row.keyedIntegrityHash !== command.prepared_content.keyed_integrity_hash
    || row.preparedContentVersion !== command.prepared_content.protected_content_version
    || row.committedContentVersion !== committedVersion(command)
    || hashCanonical(row.owningActionRef) !== hashCanonical(command.owning_action_ref)
    || hashCanonical(row.aggregateRef) !== hashCanonical(command.aggregate_ref)
    || row.readableUntil.toISOString() !== command.readable_until
    || row.retentionUntil.toISOString() !== command.retention_until
  ) throw protectedError("protected_conflict", "Protected identity was reused with changed input.");
}

function assertCommitTimes(command: NurtureC30ProtectedCommitCommandV1, now: Date): void {
  if (
    now < new Date(command.prepared_content.issued_at)
    || now >= new Date(command.prepared_content.expires_at)
    || now >= new Date(command.readable_until)
    || new Date(command.retention_until) < new Date(command.readable_until)
  ) throw protectedError("protected_context_changed", "Protected commit time is not current.");
}

function assertEraseTime(
  row: NurtureC30ProtectedContent,
  reason: NurtureC30ProtectedEraseReasonV1,
  now: Date,
): void {
  if (reason === "expired" && now < row.readableUntil) {
    throw protectedError("protected_context_changed", "Protected content is not expired.");
  }
  if (reason === "retention_elapsed" && now < row.retentionUntil) {
    throw protectedError("protected_context_changed", "Protected retention is still active.");
  }
}

function readContextMatches(
  row: NurtureC30ProtectedContent,
  command: NurtureC30ProtectedReadCommandV1,
): boolean {
  return row.workspaceId === command.principal.workspace_ref.object_id
    && row.scenarioKey === "nurture"
    && row.actionKey === command.contract.action_key
    && row.contentKind === command.contract.content_kind
    && row.protectedFieldKey === command.contract.protected_field_key
    && hashCanonical(row.aggregateRef) === hashCanonical(command.current_target.primary_scope_ref);
}

function eraseContextMatches(
  row: NurtureC30ProtectedContent,
  command: NurtureC30ProtectedEraseCommandV1,
): boolean {
  return row.workspaceId === command.principal.workspace_ref.object_id
    && row.scenarioKey === "nurture"
    && row.actionKey === command.contract.action_key
    && row.contentKind === command.contract.content_kind
    && row.protectedFieldKey === command.contract.protected_field_key
    && hashCanonical(row.aggregateRef) === hashCanonical(command.current_target.primary_scope_ref);
}

function committedControl(row: NurtureC30ProtectedContent): ScenarioCommittedProtectedContentControlV1 {
  if (!row.committedAt) throw protectedError("protected_conflict", "Protected commit time is absent.");
  const control = {
    protected_content_control_version: 1 as const,
    state: "committed" as const,
    protected_content_ref: row.protectedContentRef,
    prepared_content_version: row.preparedContentVersion,
    committed_content_version: row.committedContentVersion,
    content_kind: row.contentKind,
    keyed_integrity_hash: row.keyedIntegrityHash,
    committed_at: row.committedAt.toISOString(),
  };
  assertScenarioCommittedProtectedContentControlV1(control);
  return control;
}

function wrappedDataKey(row: NurtureC30ProtectedContent): NurtureC30WrappedDataKeyV1 {
  if (
    !row.wrappedDek
    || !row.kmsKeyDomain
    || !row.kmsKeyVersion
    || !row.kmsKeyHandle
    || !row.wrappingAlgorithm
  ) throw protectedError("protected_conflict", "Protected key material is unavailable.");
  return {
    wrapped_dek: row.wrappedDek,
    kms_key_domain: row.kmsKeyDomain,
    kms_key_version: row.kmsKeyVersion,
    kms_key_handle: row.kmsKeyHandle,
    wrapping_algorithm: row.wrappingAlgorithm,
  };
}

function encryptionAadFromRow(row: NurtureC30ProtectedContent): Uint8Array {
  return nurtureCanonicalJsonBytes({
    aad_version: 1,
    protected_content_ref: row.protectedContentRef,
    workspace_ref: workspaceRef(row.workspaceId),
    scenario_key: row.scenarioKey,
    action_key: row.actionKey,
    content_kind: row.contentKind,
    protected_field_key: row.protectedFieldKey,
    aggregate_ref: row.aggregateRef,
    committed_content_version: row.committedContentVersion,
  });
}

function encrypt(plaintext: string, dek: Buffer, aad: Uint8Array) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dek, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { ciphertext, nonce, authenticationTag: cipher.getAuthTag() };
}

function decrypt(row: NurtureC30ProtectedContent, dek: Buffer, aad: Uint8Array): string {
  if (!row.ciphertext || !row.nonce || !row.authenticationTag) {
    throw protectedError("protected_conflict", "Protected ciphertext is unavailable.");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", dek, row.nonce);
    decipher.setAAD(aad);
    decipher.setAuthTag(row.authenticationTag);
    return Buffer.concat([decipher.update(row.ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw protectedError("protected_integrity_failed", "Protected ciphertext integrity failed.");
  }
}

function assertProvisionedDataKey(value: NurtureC30ProvisionedDataKeyV1): void {
  assertWrappedDataKey(value);
  if (!(value.plaintext_dek instanceof Uint8Array) || value.plaintext_dek.byteLength !== 32) {
    throw protectedError("protected_kms_unavailable", "Protected KMS data key is invalid.");
  }
}

function assertWrappedDataKey(value: NurtureC30WrappedDataKeyV1): void {
  if (
    !(value.wrapped_dek instanceof Uint8Array)
    || value.wrapped_dek.byteLength < 1
    || value.wrapped_dek.byteLength > 4096
    || !machineKeyPattern.test(value.kms_key_domain)
    || !opaqueValuePattern.test(value.kms_key_version)
    || !opaqueLocatorPattern.test(value.kms_key_handle)
    || !machineKeyPattern.test(value.wrapping_algorithm)
  ) throw protectedError("protected_kms_unavailable", "Protected KMS response is invalid.");
}

function assertEncryptionContext(row: NurtureC30ProtectedContent): void {
  const expected = computeNurtureC30ProtectedEncryptionContextHash({
    protected_content_ref: row.protectedContentRef,
    workspace_ref: workspaceRef(row.workspaceId),
    scenario_key: row.scenarioKey,
    action_key: row.actionKey,
    content_kind: row.contentKind,
    protected_field_key: row.protectedFieldKey,
    aggregate_ref: row.aggregateRef as CanonicalRef,
    committed_content_version: row.committedContentVersion,
  });
  if (row.encryptionContextHash !== expected) {
    throw protectedError("protected_integrity_failed", "Protected encryption context changed.");
  }
}

function assertAuthority(authority: NurtureC30ProtectedAuthorityEvidenceV1): void {
  if (
    authority.authorized !== true
    || !Number.isSafeInteger(authority.authority_revision)
    || authority.authority_revision < 1
    || !sha256Pattern.test(authority.authority_evidence_hash)
    || !sha256Pattern.test(authority.pair_evidence_hash)
    || !sha256Pattern.test(authority.policy_evidence_hash)
  ) throw protectedError("protected_authority_denied", "Protected authority evidence is invalid.");
}

function assertReadBinding(binding: { keyed_binding_hash: string; valid_until: string }): void {
  if (!sha256Pattern.test(binding.keyed_binding_hash)) {
    throw protectedError("protected_context_changed", "Protected carrier binding is invalid.");
  }
  const validUntil = Date.parse(binding.valid_until);
  if (!canonicalInstantPattern.test(binding.valid_until) || !Number.isFinite(validUntil)) {
    throw protectedError("protected_context_changed", "Protected foreground validity is invalid.");
  }
}

function principalBindingHash(command: ProtectedAuthorityCommand): string {
  return hashCanonical({
    binding_hash_version: 1,
    principal: command.principal,
    participant_ref: command.current_participant.participant_ref,
    represented_organization_ref: command.current_participant.represented_organization_ref ?? null,
    binding_revision: command.current_participant.binding_revision,
    authority_revision: command.current_participant.authority_revision,
  });
}

function committedVersion(command: NurtureC30ProtectedCommitCommandV1): string {
  return `committed-${hashCanonical({
    version_seed: 1,
    protected_content_ref: command.prepared_content.protected_content_ref,
    request_identity_hash: command.request_identity_hash,
  }).slice(0, 32)}`;
}

function terminalLifecycle(reason: NurtureC30ProtectedEraseReasonV1): "tombstoned" | "erased" {
  return reason === "retention_elapsed" || reason === "crypto_erasure" ? "erased" : "tombstoned";
}

function erasurePlan(row: NurtureC30ProtectedContent): ErasurePlan {
  if (!row.tombstoneReason) throw protectedError("protected_conflict", "Protected erasure reason is absent.");
  return {
    row,
    terminal_lifecycle: terminalLifecycle(row.tombstoneReason as NurtureC30ProtectedEraseReasonV1),
  };
}

function closedRead(
  status: "tombstone" | "context_changed" | "unavailable",
  message: string,
): NurtureC30ProtectedReadResultV1 {
  const result = {
    protected_read_result_version: 1 as const,
    status,
    safe_reason: {
      reason_code: status,
      message: { kind: "plain_text" as const, value: message, locale: "en" },
      retry_class: "refresh" as const,
    },
  };
  assertReadScenarioProtectedDetailResultV1(result);
  return { result, cache_control: "no-store" };
}

async function createAudit(
  transaction: Prisma.TransactionClient,
  row: NurtureC30ProtectedContent,
  event: "committed" | "erasure_started" | "tombstoned" | "erased",
  participantRef: string,
  bindingRef: string,
  evidenceHash: string,
): Promise<void> {
  await transaction.nurtureC30ProtectedContentAuditRecord.create({
    data: {
      protectedContentId: row.id,
      eventKey: `c30.protected.${event}`,
      contentRefHash: computeNurtureC30ProtectedContentRefHash(row.protectedContentRef),
      aggregateRef: canonicalRefValue(row.aggregateRef),
      participantRef,
      principalBindingRef: bindingRef,
      evidenceHash,
    },
  });
}

async function databaseNow(transaction: Prisma.TransactionClient): Promise<Date> {
  const rows = await transaction.$queryRaw<Array<{ now: Date }>>(Prisma.sql`
    SELECT transaction_timestamp() AS "now"
  `);
  const now = rows[0]?.now;
  if (!(now instanceof Date)) throw protectedError("protected_conflict", "Database time is unavailable.");
  return now;
}

function canonicalRefValue(
  value: Prisma.JsonValue | { namespace: string; object_type: string; object_id: string; version?: number },
): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw protectedError("protected_conflict", "Protected aggregate reference is invalid.");
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.namespace !== "string"
    || typeof record.object_type !== "string"
    || typeof record.object_id !== "string"
  ) throw protectedError("protected_conflict", "Protected aggregate reference is invalid.");
  return `${record.namespace}:${record.object_type}:${record.object_id}${
    typeof record.version === "number" ? `:v${record.version}` : ""
  }`;
}

function workspaceRef(workspaceId: string) {
  return {
    schema_version: 1 as const,
    namespace: "my_chat" as const,
    object_type: "workspace",
    object_id: workspaceId,
  };
}

function participantRefValue(participant: ProtectedAuthorityCommand["current_participant"]): string {
  return `nurture:participant:${participant.participant_ref.object_id}:v${participant.participant_ref.version ?? 1}`;
}

function participantRefValueFromRow(row: NurtureC30ProtectedContent): string {
  return `nurture:participant:${row.lastTransitionParticipantId}`;
}

function principalBindingRef(bindingId: string): string {
  return `nurture:participant_principal_binding:${bindingId}`;
}

function json(value: unknown): Prisma.InputJsonValue {
  return structuredClone(value) as Prisma.InputJsonValue;
}

function hashCanonical(value: unknown): string {
  return nurtureSha256Hex(nurtureCanonicalJsonBytes(value));
}

function hashString(value: string): string {
  return nurtureSha256Hex(Buffer.from(value, "utf8"));
}

function protectedError(
  code: Parameters<typeof nurtureC30ProtectedContentError>[0],
  message: string,
) {
  return nurtureC30ProtectedContentError(code, message);
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2034" || error.code === "P2002") return true;
  return error.code === "P2010"
    && typeof error.meta?.code === "string"
    && error.meta.code === "40001";
}

const displayLeaseMs = 30_000;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueValuePattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
