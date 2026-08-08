import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  assertReadScenarioProtectedDetailExchangeV1,
  type CanonicalRef,
  type ScenarioProtectedInteractionContractV1,
  type ScenarioProtectedPlainTextCarrierV1,
} from "@my-chat/workflow-contracts";
import {
  computeNurtureC30PrincipalBindingHash,
  DenyNurtureC30ProtectedKmsPort,
  nurtureCanonicalJsonBytes,
  nurtureC30ProtectedContentError,
  nurtureSha256Base64Url,
  nurtureSha256Hex,
  type NurtureC30ProtectedCommitCommandV1,
  type NurtureC30ProtectedIntegrityPort,
  type NurtureC30ProtectedKmsPort,
  type NurtureC30ProtectedReadBindingPort,
  type NurtureC30ProvisionedDataKeyV1,
  type NurtureC30WrappedDataKeyV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaNurtureC30ProtectedContentRepository,
  type TransactionalNurtureC30ProtectedAuthorityReader,
} from "../src/c30/protected-content.repository.js";

const prisma = createPrismaClient();
const masterKey = createHash("sha256").update("c30-i3-f-isolated-test-kms", "utf8").digest();
const integrityKey = "c30-i3-f-isolated-integrity-test-only";
const foregroundKey = "c30-i3-quality-repair-foreground-test-only";
const carrierBindingKey = "c30-i3-quality-repair-carrier-binding-test-only";
const protectedSurfaceKey = "fixture.neutral_surface_v1";

afterAll(async () => {
  masterKey.fill(0);
  await prisma.$disconnect();
});

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

const authorityReader: TransactionalNurtureC30ProtectedAuthorityReader = {
  verifyCurrent: async (transaction, { command }) => {
    const processId = command.current_target.child_care_process_ref?.object_id;
    const [role, process, associations] = await Promise.all([
      transaction.nurtureCareRoleAssignment.findFirst({
        where: {
          workspaceId: command.principal.workspace_ref.object_id,
          participantId: command.current_participant.participant_ref.object_id,
          scopeType: "child_care_process",
          scopeId: processId,
          status: "active",
          deletedAt: null,
        },
      }),
      transaction.nurtureChildCareProcess.findUnique({ where: { id: processId } }),
      transaction.nurtureFamilyAnchorAssociation.findMany({
        where: {
          workspaceId: command.principal.workspace_ref.object_id,
          childCareProcessId: processId,
          currentKey: "current",
          status: "active",
        },
        include: { childAssociation: true, childAnchor: true, familyAnchor: true },
        take: 2,
      }),
    ]);
    const association = associations[0];
    if (
      !role
      || !process
      || process.status !== "active"
      || process.deletedAt !== null
      || process.aggregateVersion !== command.current_target.child_care_process_ref?.version
      || command.current_target.current_version !== `v${process.aggregateVersion}`
      || associations.length !== 1
      || !association
      || association.childAssociation.status !== "active"
      || association.childAssociation.currentKey !== "current"
      || association.childAnchor.status !== "associated"
      || association.familyAnchor.status !== "associated"
    ) throw nurtureC30ProtectedContentError(
      "protected_authority_denied",
      "fixture protected authority denied",
    );
    return {
      authorized: true,
      authority_evidence_hash: authorityHash(process.id),
      authority_revision: 1,
      pair_evidence_hash: digest(JSON.stringify({
        child: association.childAnchorId,
        child_revision: association.childAnchor.aggregateVersion,
        family: association.familyAnchorId,
        family_revision: association.familyAnchor.aggregateVersion,
      })),
      policy_evidence_hash: digest(`policy:${role.id}:${role.aggregateVersion}`),
    };
  },
};

const integrity: NurtureC30ProtectedIntegrityPort = {
  verify: async (input) => input.expected_keyed_integrity_hash === integrityHash(
    input.carrier.plain_text,
    input.protected_content_ref,
    input.request_identity_hash,
  ),
};

const readBinding: NurtureC30ProtectedReadBindingPort = {
  bindCurrent: async (input) => {
    if (input.verified_foreground_context_hash !== foregroundHash(
      input.principal,
      input.request_identity_hash,
    )) throw nurtureC30ProtectedContentError(
      "protected_context_changed",
      "fixture foreground context changed",
    );
    return {
      keyed_binding_hash: carrierBindingHash(
        input.principal,
        input.request_identity_hash,
        input.contract,
        input.carrier,
      ),
      valid_until: new Date(input.now.getTime() + 45_000).toISOString(),
    };
  },
};

describe("C30 authoritative protected-content lifecycle", () => {
  it("commits/replays one ciphertext and returns only a no-store foreground carrier", async () => {
    const fixture = await createFixture();
    const kms = new IsolatedTestKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    const [first, replay] = await Promise.all([
      repository.commit(fixture.command),
      repository.commit(fixture.command),
    ]);
    expect(new Set([first.disposition, replay.disposition])).toEqual(new Set(["committed", "replayed"]));
    const row = await prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    });
    expect(row.ciphertext?.toString("utf8")).not.toContain(fixture.plaintext);
    expect(row.wrappedDek).not.toEqual(row.ciphertext);
    expect(await prisma.nurtureC30ProtectedContent.count({
      where: { requestIdentityHash: fixture.command.request_identity_hash },
    })).toBe(1);
    expect(await prisma.nurtureC30ProtectedContentAuditRecord.count({
      where: { protectedContentId: row.id },
    })).toBe(1);
    await expect(repository.commit({
      ...fixture.command,
      carrier: { ...fixture.command.carrier, plain_text: "changed private body" },
    })).rejects.toMatchObject({ code: "protected_integrity_failed" });

    const readInput = readCommand(fixture, first.committed_content.committed_content_version);
    const read = await repository.read(readInput);
    expect(read.result).toMatchObject({ status: "ready", content_kind: contract.content_kind });
    expect(read.carrier?.plain_text).toBe(fixture.plaintext);
    expect(read.cache_control).toBe("no-store");
    if (read.result.status !== "ready" || !read.carrier) throw new Error("expected ready protected read");
    const readyResult = read.result;
    const readyCarrier = read.carrier;
    expect(() => assertReadScenarioProtectedDetailExchangeV1(
      contract,
      readInput.locator,
      readInput.request,
      first.committed_content,
      readyResult,
      readyCarrier,
      {
        now: readyResult.display_lease.issued_at,
        locator_verification: {
          access_mode: "foreground_current",
          request_identity_hash: readInput.request_identity_hash,
          workspace_ref: readInput.principal.workspace_ref,
          principal_binding_hash: computeNurtureC30PrincipalBindingHash(
            readInput.principal,
            readInput.current_participant,
          ),
          scenario_key: "nurture",
          action_key: contract.action_key,
          surface_key: protectedSurfaceKey,
          protected_content_ref: readInput.locator.protected_content_ref,
          content_kind: contract.content_kind,
          issued_at: readInput.locator.issued_at,
          expires_at: readInput.locator.expires_at,
          verified_foreground_context_hash: readInput.verified_foreground_context_hash,
        },
        carrier_binding_verification: {
          carrier_scope: "read_output",
          protected_field_key: contract.protected_field_key,
          verified_keyed_binding_hash: readyResult.carrier_binding.keyed_binding_hash,
          request_identity_hash: readInput.request_identity_hash,
          workspace_ref: readInput.principal.workspace_ref,
          principal_binding_hash: computeNurtureC30PrincipalBindingHash(
            readInput.principal,
            readInput.current_participant,
          ),
          scenario_key: "nurture",
          action_key: contract.action_key,
          surface_key: protectedSurfaceKey,
        },
        decrypted_content_verification: {
          protected_content_ref: readInput.locator.protected_content_ref,
          protected_content_version: first.committed_content.committed_content_version,
          protected_field_key: contract.protected_field_key,
          content_kind: contract.content_kind,
          read_carrier_binding_hash: readyResult.carrier_binding.keyed_binding_hash,
          request_identity_hash: readInput.request_identity_hash,
          verified_keyed_integrity_hash: first.committed_content.keyed_integrity_hash,
        },
      },
    )).not.toThrow();
    expect(readyResult.carrier_binding.keyed_binding_hash).toBe(
      carrierBindingHash(
        readInput.principal,
        readInput.request_identity_hash,
        contract,
        readyCarrier,
      ),
    );
    await expect(repository.read({
      ...readInput,
      verified_foreground_context_hash: digest("caller-invented-foreground"),
    })).rejects.toMatchObject({ code: "protected_context_changed" });
    const durable = JSON.stringify({
      row: { ...row, ciphertext: row.ciphertext?.toString("base64"), wrappedDek: row.wrappedDek?.toString("base64") },
      audits: await prisma.nurtureC30ProtectedContentAuditRecord.findMany({
        where: { protectedContentId: row.id },
      }),
      generic_destinations: {
        executions: await prisma.nurtureCommandExecution.findMany({ where: { workspaceId: fixture.command.principal.workspace_ref.object_id } }),
        action_operations: await prisma.nurtureC30ActionOperation.findMany({ where: { workspaceId: fixture.command.principal.workspace_ref.object_id } }),
        action_audits: await prisma.nurtureC30ActionAuditRecord.findMany({ where: { actionOperation: { workspaceId: fixture.command.principal.workspace_ref.object_id } } }),
        action_outbox: await prisma.nurtureC30ActionOutboxEvent.findMany({ where: { actionOperation: { workspaceId: fixture.command.principal.workspace_ref.object_id } } }),
        legacy_messages: await prisma.nurtureFamilyCareMessage.findMany({ where: { workspaceId: fixture.command.principal.workspace_ref.object_id } }),
      },
    });
    expect(durable).not.toContain(fixture.plaintext);
  });

  it("uses distinct per-content DEKs and fails closed on ciphertext tamper", async () => {
    const fixture = await createFixture();
    const kms = new IsolatedTestKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    await repository.commit(fixture.command);
    const secondCommand = reidentify(fixture.command);
    await repository.commit(secondCommand);
    const [firstRow, secondRow] = await Promise.all([
      prisma.nurtureC30ProtectedContent.findUniqueOrThrow({ where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref } }),
      prisma.nurtureC30ProtectedContent.findUniqueOrThrow({ where: { protectedContentRef: secondCommand.prepared_content.protected_content_ref } }),
    ]);
    expect(firstRow.kmsKeyHandle).not.toBe(secondRow.kmsKeyHandle);
    expect(firstRow.ciphertext).not.toEqual(secondRow.ciphertext);
    if (!firstRow.ciphertext) throw new Error("expected ciphertext");
    const tampered = Buffer.from(firstRow.ciphertext);
    tampered[0] = (tampered[0] ?? 0) ^ 1;
    await prisma.nurtureC30ProtectedContent.update({
      where: { id: firstRow.id },
      data: { ciphertext: tampered },
    });
    await expect(repository.read(readCommand(fixture, firstRow.committedContentVersion)))
      .rejects.toMatchObject({ code: "protected_integrity_failed" });
  });

  it("recovers an ambiguous KMS provision response without minting or destroying a second key", async () => {
    const fixture = await createFixture();
    const kms = new FailAfterProvisionOnceKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    await expect(repository.commit(fixture.command)).rejects.toThrow("ambiguous provision response");
    await expect(prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    })).resolves.toMatchObject({ lifecycle: "provisioning", committedAt: null });
    await expect(repository.commit(fixture.command)).resolves.toMatchObject({ disposition: "committed" });
    expect(kms.provisionedCount()).toBe(1);
  });

  it("denies unconfigured integrity/KMS and never falls back to the legacy static-key port", async () => {
    const fixture = await createFixture();
    await expect(new PrismaNurtureC30ProtectedContentRepository(prisma).commit(fixture.command))
      .rejects.toMatchObject({ code: "protected_authority_denied" });
    await expect(new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      new IsolatedTestKms(),
    ).commit(fixture.command)).rejects.toMatchObject({ code: "protected_integrity_failed" });
    await expect(new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      new DenyNurtureC30ProtectedKmsPort(),
      integrity,
    ).commit(fixture.command)).rejects.toMatchObject({ code: "protected_kms_unavailable" });
    await expect(prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    })).resolves.toMatchObject({ lifecycle: "provisioning", committedAt: null });
  });

  it("rereads current pair/local authority before read and erase", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      new IsolatedTestKms(),
      integrity,
      readBinding,
    );
    const committed = await repository.commit(fixture.command);
    await prisma.nurtureFamilyAnchorAssociation.update({
      where: { id: fixture.familyAssociationId },
      data: {
        status: "revoked",
        currentKey: null,
        currentChildAssociationId: null,
        revokedAt: new Date(),
      },
    });
    await expect(repository.read(readCommand(fixture, committed.committed_content.committed_content_version)))
      .rejects.toMatchObject({ code: "protected_authority_denied" });
    await expect(repository.erase(eraseCommand(fixture, "redacted")))
      .rejects.toMatchObject({ code: "protected_authority_denied" });
  });

  it("rereads authority after decrypt and foreground binding before returning plaintext", async () => {
    const fixture = await createFixture();
    const kms = new IsolatedTestKms();
    const revokingBinding: NurtureC30ProtectedReadBindingPort = {
      bindCurrent: async (input) => {
        const binding = await readBinding.bindCurrent(input);
        await prisma.nurtureParticipant.update({
          where: { id: fixture.command.current_participant.participant_ref.object_id },
          data: { status: "suspended", aggregateVersion: { increment: 1 } },
        });
        return binding;
      },
    };
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      revokingBinding,
    );
    const committed = await repository.commit(fixture.command);
    await expect(repository.read(readCommand(
      fixture,
      committed.committed_content.committed_content_version,
    ))).rejects.toMatchObject({ code: "protected_authority_denied" });
  });

  it("cryptographically erases, exact-replays, and rejects a pre-erasure DB snapshot", async () => {
    const fixture = await createFixture();
    const kms = new IsolatedTestKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    const committed = await repository.commit(fixture.command);
    const snapshot = await prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    });
    const first = await repository.erase(eraseCommand(fixture, "crypto_erasure"));
    const replay = await repository.erase(eraseCommand(fixture, "crypto_erasure"));
    expect(first).toEqual({ result_version: 1, lifecycle: "erased", disposition: "transitioned" });
    expect(replay).toEqual({ result_version: 1, lifecycle: "erased", disposition: "already_terminal" });
    const erased = await prisma.nurtureC30ProtectedContent.findUniqueOrThrow({ where: { id: snapshot.id } });
    expect(erased).toMatchObject({
      lifecycle: "erased",
      ciphertext: null,
      wrappedDek: null,
      kmsKeyHandle: null,
    });
    expect((await repository.read(readCommand(fixture, committed.committed_content.committed_content_version))).result.status)
      .toBe("tombstone");
    if (
      !snapshot.wrappedDek
      || !snapshot.kmsKeyDomain
      || !snapshot.kmsKeyVersion
      || !snapshot.kmsKeyHandle
      || !snapshot.wrappingAlgorithm
    ) throw new Error("expected snapshot key material");
    await expect(kms.unwrapDataKey({
      wrapped_dek: snapshot.wrappedDek,
      kms_key_domain: snapshot.kmsKeyDomain,
      kms_key_version: snapshot.kmsKeyVersion,
      kms_key_handle: snapshot.kmsKeyHandle,
      wrapping_algorithm: snapshot.wrappingAlgorithm,
      content_ref_hash: digest(fixture.command.prepared_content.protected_content_ref),
      encryption_context_hash: snapshot.encryptionContextHash,
    })).rejects.toThrow("destroyed");
  });

  it("keeps ambiguous KMS destruction fail-closed in erasing and converges on retry", async () => {
    const fixture = await createFixture();
    const kms = new FailDestroyOnceKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    const committed = await repository.commit(fixture.command);
    await expect(repository.erase(eraseCommand(fixture, "crypto_erasure")))
      .rejects.toThrow("ambiguous destroy response");
    await expect(prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    })).resolves.toMatchObject({ lifecycle: "erasing", ciphertext: expect.any(Buffer) });
    await prisma.nurtureParticipant.update({
      where: { id: fixture.command.current_participant.participant_ref.object_id },
      data: { status: "suspended", aggregateVersion: { increment: 1 } },
    });
    await expect(repository.read(readCommand(
      fixture,
      committed.committed_content.committed_content_version,
    ))).rejects.toMatchObject({ code: "protected_authority_denied" });
    await expect(prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    })).resolves.toMatchObject({ lifecycle: "erased", ciphertext: null, kmsKeyHandle: null });
  });

  it("expires to a carrier-free tombstone and destroys its data key", async () => {
    const fixture = await createFixture({ preparedMs: 1_000, readableMs: 1_200, retentionMs: 1_600 });
    const kms = new IsolatedTestKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    const committed = await repository.commit(fixture.command);
    const row = await prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    });
    await new Promise((resolve) => setTimeout(resolve, 1_250));
    const read = await repository.read(readCommand(fixture, committed.committed_content.committed_content_version));
    expect(read).toMatchObject({ result: { status: "tombstone" }, cache_control: "no-store" });
    expect(read.carrier).toBeUndefined();
    expect(await prisma.nurtureC30ProtectedContent.findUniqueOrThrow({ where: { id: row.id } }))
      .toMatchObject({ lifecycle: "tombstoned", ciphertext: null, wrappedDek: null });
    expect(row.kmsKeyHandle && kms.isDestroyed(row.kmsKeyHandle)).toBe(true);
  });

  it("retention expiry converges directly to erased with no carrier", async () => {
    const fixture = await createFixture({ preparedMs: 1_000, readableMs: 1_100, retentionMs: 1_200 });
    const kms = new IsolatedTestKms();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      kms,
      integrity,
      readBinding,
    );
    const committed = await repository.commit(fixture.command);
    await new Promise((resolve) => setTimeout(resolve, 1_250));
    const read = await repository.read(readCommand(fixture, committed.committed_content.committed_content_version));
    expect(read).toMatchObject({ result: { status: "tombstone" }, cache_control: "no-store" });
    expect(read.carrier).toBeUndefined();
    expect(await prisma.nurtureC30ProtectedContent.findUniqueOrThrow({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
    })).toMatchObject({ lifecycle: "erased", ciphertext: null, wrappedDek: null });
  });

  it("enforces ciphertext/lifecycle all-or-none invariants in PostgreSQL", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30ProtectedContentRepository(
      prisma,
      authorityReader,
      new IsolatedTestKms(),
      integrity,
      readBinding,
    );
    await repository.commit(fixture.command);
    await expect(prisma.nurtureC30ProtectedContent.update({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
      data: { wrappedDek: null },
    })).rejects.toBeDefined();
    await expect(prisma.nurtureC30ProtectedContent.update({
      where: { protectedContentRef: fixture.command.prepared_content.protected_content_ref },
      data: { lifecycle: "erased" },
    })).rejects.toBeDefined();
  });
});

class IsolatedTestKms implements NurtureC30ProtectedKmsPort {
  private readonly keys = new Map<string, {
    contentRefHash: string;
    destroyed: boolean;
    plaintextDek: Buffer;
    wrappedDek: Buffer;
  }>();
  private readonly provisioning = new Map<string, string>();
  private sequence = 0;

  async provisionDataKey(input: {
    provisioning_key: string;
    content_ref_hash: string;
    encryption_context_hash: string;
  }): Promise<NurtureC30ProvisionedDataKeyV1> {
    const replayHandle = this.provisioning.get(input.provisioning_key);
    if (replayHandle) {
      const replay = this.keys.get(replayHandle);
      if (!replay || replay.destroyed || replay.contentRefHash !== input.content_ref_hash) {
        throw new Error("invalid test KMS provisioning replay");
      }
      return this.result(replayHandle, replay);
    }
    this.sequence += 1;
    const plaintextDek = deterministicBytes(
      `dek:${this.sequence}:${input.provisioning_key}:${input.encryption_context_hash}`,
      32,
    );
    const nonce = deterministicBytes(`nonce:${this.sequence}:${input.encryption_context_hash}`, 12);
    const cipher = createCipheriv("aes-256-gcm", masterKey, nonce);
    cipher.setAAD(Buffer.from(input.encryption_context_hash, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(plaintextDek), cipher.final()]);
    const handle = nurtureSha256Base64Url(
      deterministicBytes(`handle:${this.sequence}:${input.content_ref_hash}`, 32),
    );
    const key = {
      contentRefHash: input.content_ref_hash,
      destroyed: false,
      plaintextDek,
      wrappedDek: Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]),
    };
    this.keys.set(handle, key);
    this.provisioning.set(input.provisioning_key, handle);
    return this.result(handle, key);
  }

  private result(
    handle: string,
    key: { plaintextDek: Buffer; wrappedDek: Buffer },
  ): NurtureC30ProvisionedDataKeyV1 {
    return {
      plaintext_dek: Buffer.from(key.plaintextDek),
      wrapped_dek: Buffer.from(key.wrappedDek),
      kms_key_domain: "fixture.kms",
      kms_key_version: "v1",
      kms_key_handle: handle,
      wrapping_algorithm: "aes-256-gcm",
    };
  }

  async unwrapDataKey(input: NurtureC30WrappedDataKeyV1 & {
    content_ref_hash: string;
    encryption_context_hash: string;
  }): Promise<Uint8Array> {
    const key = this.keys.get(input.kms_key_handle);
    if (!key || key.contentRefHash !== input.content_ref_hash) throw new Error("unknown test KMS key");
    if (key.destroyed) throw new Error("test KMS key destroyed");
    const wrapped = Buffer.from(input.wrapped_dek);
    const decipher = createDecipheriv("aes-256-gcm", masterKey, wrapped.subarray(0, 12));
    decipher.setAAD(Buffer.from(input.encryption_context_hash, "utf8"));
    decipher.setAuthTag(wrapped.subarray(12, 28));
    return Buffer.concat([decipher.update(wrapped.subarray(28)), decipher.final()]);
  }

  async destroyDataKey(input: {
    kms_key_handle: string;
    content_ref_hash: string;
  }): Promise<void> {
    const key = this.keys.get(input.kms_key_handle);
    if (!key || key.contentRefHash !== input.content_ref_hash) throw new Error("unknown test KMS key");
    key.destroyed = true;
  }

  isDestroyed(handle: string): boolean {
    return this.keys.get(handle)?.destroyed === true;
  }

  provisionedCount(): number {
    return this.provisioning.size;
  }
}

class FailAfterProvisionOnceKms extends IsolatedTestKms {
  private shouldFail = true;

  override async provisionDataKey(
    input: Parameters<NurtureC30ProtectedKmsPort["provisionDataKey"]>[0],
  ): Promise<NurtureC30ProvisionedDataKeyV1> {
    const result = await super.provisionDataKey(input);
    if (this.shouldFail) {
      this.shouldFail = false;
      throw new Error("ambiguous provision response");
    }
    return result;
  }
}

class FailDestroyOnceKms extends IsolatedTestKms {
  private shouldFail = true;

  override async destroyDataKey(
    input: Parameters<NurtureC30ProtectedKmsPort["destroyDataKey"]>[0],
  ): Promise<void> {
    await super.destroyDataKey(input);
    if (this.shouldFail) {
      this.shouldFail = false;
      throw new Error("ambiguous destroy response");
    }
  }
}

async function createFixture(options: {
  preparedMs?: number;
  readableMs?: number;
  retentionMs?: number;
} = {}) {
  const now = Date.now();
  const workspaceId = randomUUID();
  const participantId = randomUUID();
  const bindingId = randomUUID();
  const childId = randomUUID();
  const processId = randomUUID();
  const familyId = randomUUID();
  const childAnchorId = randomUUID();
  const familyAnchorId = randomUUID();
  const childAssociationId = randomUUID();
  const familyAssociationId = randomUUID();
  const accountId = randomUUID();
  const actorId = randomUUID();
  await prisma.$transaction(async (transaction) => {
    await transaction.nurtureParticipant.create({
      data: {
        id: participantId,
        workspaceId,
        myChatUserId: `legacy:${randomUUID()}`,
        status: "active",
        aggregateVersion: 3,
      },
    });
    await transaction.nurtureParticipantPrincipalBinding.create({
      data: {
        id: bindingId,
        participantId,
        workspaceId,
        accountObjectId: accountId,
        actorObjectId: actorId,
        status: "active",
        currentKey: "current",
        aggregateVersion: 4,
      },
    });
    await transaction.nurtureChild.create({
      data: { id: childId, workspaceId, displayName: "Synthetic", status: "active", aggregateVersion: 1 },
    });
    await transaction.nurtureChildCareProcess.create({
      data: { id: processId, workspaceId, childId, status: "active", aggregateVersion: 7 },
    });
    await transaction.nurtureFamily.create({
      data: { id: familyId, workspaceId, childCareProcessId: processId, status: "active", aggregateVersion: 2 },
    });
    await transaction.nurtureChildCareProcess.update({
      where: { id: processId },
      data: { primaryFamilyId: familyId },
    });
    await transaction.nurtureCareRoleAssignment.create({
      data: {
        participantId,
        workspaceId,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: processId,
        status: "active",
        aggregateVersion: 2,
      },
    });
    await transaction.nurtureChildBindingAnchor.create({
      data: { id: childAnchorId, reservationKeyHash: digest(randomUUID()), status: "associated" },
    });
    await transaction.nurtureFamilyBindingAnchor.create({
      data: { id: familyAnchorId, reservationKeyHash: digest(randomUUID()), status: "associated" },
    });
    await transaction.nurtureChildAnchorAssociation.create({
      data: {
        id: childAssociationId,
        workspaceId,
        childAnchorId,
        childId,
        status: "active",
        currentKey: "current",
      },
    });
    await transaction.nurtureFamilyAnchorAssociation.create({
      data: {
        id: familyAssociationId,
        workspaceId,
        familyAnchorId,
        childAnchorId,
        childAssociationId,
        currentChildAssociationId: childAssociationId,
        childId,
        childCareProcessId: processId,
        familyId,
        status: "active",
        currentKey: "current",
      },
    });
  });
  const principal = {
    principal_version: 1 as const,
    principal_kind: "human_user" as const,
    account_ref: ref("my_chat", "user", accountId),
    actor_ref: ref("my_chat", "actor", actorId),
    workspace_ref: ref("my_chat", "workspace", workspaceId),
    principal_origin: "interactive_session" as const,
  };
  const participant = {
    participant_ref: ref("nurture", "participant", participantId, 3),
    workspace_ref: principal.workspace_ref,
    principal_origin: "interactive_session" as const,
    binding_revision: 4,
    authority_revision: 5,
  };
  const aggregateRef = ref("nurture", "child_care_process", processId, 7);
  const protectedContentRef = nurtureSha256Base64Url(randomBytes(32));
  const requestIdentityHash = digest(`request:${randomUUID()}`);
  const plaintext = "private fixture body\n第二行";
  const preparedMs = options.preparedMs ?? 60_000;
  const readableMs = options.readableMs ?? 24 * 60 * 60_000;
  const retentionMs = options.retentionMs ?? 2 * 24 * 60 * 60_000;
  const command: NurtureC30ProtectedCommitCommandV1 = {
    protected_store_command_version: 1,
    content_id: randomUUID(),
    contract,
    carrier: {
      protected_carrier_version: 1,
      protected_field_key: contract.protected_field_key,
      media_type: "text/plain; charset=utf-8",
      plain_text: plaintext,
      attachment_refs: [],
    },
    prepared_content: {
      protected_content_control_version: 1,
      state: "prepared",
      protected_content_ref: protectedContentRef,
      protected_content_version: `prepared-${randomUUID()}`,
      content_kind: contract.content_kind,
      keyed_integrity_hash: integrityHash(plaintext, protectedContentRef, requestIdentityHash),
      issued_at: new Date(now - 1_000).toISOString(),
      expires_at: new Date(now + preparedMs).toISOString(),
    },
    principal,
    current_participant: participant,
    current_target: {
      target_version: 1,
      target_ref: nurtureSha256Base64Url(randomBytes(32)),
      target_ref_class: "fixture.neutral_target_v1",
      workspace_ref: principal.workspace_ref,
      current_version: "v7",
      primary_scope_ref: aggregateRef,
      child_care_process_ref: aggregateRef,
      target_principal_binding_hash: computeNurtureC30PrincipalBindingHash(principal, participant),
      authority_evidence_hash: authorityHash(processId),
      authority_revision: 1,
    },
    owning_action_ref: ref("nurture", "action_operation", randomUUID(), 1),
    aggregate_ref: aggregateRef,
    request_identity_hash: requestIdentityHash,
    accepted_carrier_binding_hash: digest(`binding:${randomUUID()}`),
    canonical_payload_hash: digest(`payload:${randomUUID()}`),
    readable_until: new Date(now + readableMs).toISOString(),
    retention_until: new Date(now + retentionMs).toISOString(),
  };
  return { command, plaintext, familyAssociationId };
}

function readCommand(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  committedContentVersion: string,
) {
  const now = Date.now();
  const requestIdentityHash = digest(`read:${randomUUID()}`);
  return {
    protected_store_read_version: 1 as const,
    contract,
    locator: {
      protected_read_locator_version: 1 as const,
      protected_content_ref: fixture.command.prepared_content.protected_content_ref,
      content_kind: contract.content_kind,
      issued_at: new Date(now - 1_000).toISOString(),
      expires_at: new Date(now + 60_000).toISOString(),
    },
    request: {
      protected_read_version: 1 as const,
      protected_content_ref: fixture.command.prepared_content.protected_content_ref,
      known_content_version: committedContentVersion,
    },
    principal: fixture.command.principal,
    current_participant: fixture.command.current_participant,
    current_target: fixture.command.current_target,
    request_identity_hash: requestIdentityHash,
    verified_foreground_context_hash: foregroundHash(
      fixture.command.principal,
      requestIdentityHash,
    ),
  };
}

function eraseCommand(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  reason: "redacted" | "crypto_erasure",
) {
  return {
    protected_store_erase_version: 1 as const,
    contract,
    protected_content_ref: fixture.command.prepared_content.protected_content_ref,
    principal: fixture.command.principal,
    current_participant: fixture.command.current_participant,
    current_target: fixture.command.current_target,
    reason,
    transition_evidence_hash: digest(`erase:${reason}`),
  };
}

function reidentify(command: NurtureC30ProtectedCommitCommandV1): NurtureC30ProtectedCommitCommandV1 {
  const protectedContentRef = nurtureSha256Base64Url(randomBytes(32));
  const requestIdentityHash = digest(`request:${randomUUID()}`);
  return {
    ...command,
    content_id: randomUUID(),
    prepared_content: {
      ...command.prepared_content,
      protected_content_ref: protectedContentRef,
      protected_content_version: `prepared-${randomUUID()}`,
      keyed_integrity_hash: integrityHash(command.carrier.plain_text, protectedContentRef, requestIdentityHash),
    },
    owning_action_ref: ref("nurture", "action_operation", randomUUID(), 1),
    request_identity_hash: requestIdentityHash,
    accepted_carrier_binding_hash: digest(`binding:${randomUUID()}`),
    canonical_payload_hash: digest(`payload:${randomUUID()}`),
  };
}

function integrityHash(plaintext: string, contentRef: string, requestIdentityHash: string): string {
  return createHmac("sha256", integrityKey)
    .update(nurtureCanonicalJsonBytes({
      integrity_version: 1,
      plaintext,
      protected_content_ref: contentRef,
      request_identity_hash: requestIdentityHash,
    }))
    .digest("hex");
}

function authorityHash(processId: string): string {
  return digest(`authority:${processId}`);
}

function foregroundHash(
  principal: Awaited<ReturnType<typeof createFixture>>["command"]["principal"],
  requestIdentityHash: string,
): string {
  return createHmac("sha256", foregroundKey)
    .update(nurtureCanonicalJsonBytes({
      domain: "scenario_protected_foreground_context_v1",
      request_identity_hash: requestIdentityHash,
      workspace_ref: principal.workspace_ref,
      account_ref: principal.account_ref,
      actor_ref: principal.actor_ref,
      scenario_key: "nurture",
      action_key: contract.action_key,
      surface_key: protectedSurfaceKey,
    }))
    .digest("hex");
}

function carrierBindingHash(
  principal: Awaited<ReturnType<typeof createFixture>>["command"]["principal"],
  requestIdentityHash: string,
  protectedContract: ScenarioProtectedInteractionContractV1,
  carrier: ScenarioProtectedPlainTextCarrierV1,
): string {
  return createHmac("sha256", carrierBindingKey)
    .update(nurtureCanonicalJsonBytes({
      domain: "scenario_protected_carrier_binding_v1",
      scope: "read_output",
      request_identity_hash: requestIdentityHash,
      workspace_ref: principal.workspace_ref,
      scenario_key: protectedContract.scenario_key,
      action_key: protectedContract.action_key,
      surface_key: protectedSurfaceKey,
      protected_field_key: protectedContract.protected_field_key,
      media_type: carrier.media_type,
      plain_text: carrier.plain_text,
    }))
    .digest("hex");
}

function digest(value: string): string {
  return nurtureSha256Hex(Buffer.from(value, "utf8"));
}

function deterministicBytes(label: string, length: number): Buffer {
  return createHmac("sha256", masterKey).update(label, "utf8").digest().subarray(0, length);
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
