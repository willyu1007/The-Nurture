import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  computeNurtureC30AssociationExpectationHash,
  computeNurtureC30PairCommandHash,
  nurtureSha256Base64Url,
  nurtureSha256Hex,
  type NurtureC30PairAssociationCommandV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaNurtureScenarioNonceStore } from "../src/c30/nonce-store.js";
import { PrismaNurtureParticipantBindingReader } from "../src/c30/participant-binding.js";
import {
  PrismaNurtureC30PairAssociationRepository,
  type TransactionalNurtureC30PairAuthorityReader,
} from "../src/c30/pair-association.repository.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const authorityReader: TransactionalNurtureC30PairAuthorityReader = {
  verifyCurrent: async (_transaction, input) => ({
    authorized: true,
    authoritySourceRef: `nurture:local_onboarding:${input.participantId}`,
    authoritySourceVersion: 1,
  }),
};

describe("C30 Scenario-private nonce persistence", () => {
  it("allows one concurrent consumer and stores only scoped hashes", async () => {
    const storeA = new PrismaNurtureScenarioNonceStore(prisma);
    const storeB = new PrismaNurtureScenarioNonceStore(prisma);
    const now = new Date();
    const input = {
      issuer: "my-chat.host",
      assertion_audience: "nurture.scenario",
      caller_subject: "my-chat-runtime",
      credential_subject: "my-chat-workload",
      nonce: randomUUID().replaceAll("-", "").padEnd(32, "n"),
      request_id: randomUUID(),
      body_sha256: nurtureSha256Base64Url(Buffer.from(randomUUID(), "utf8")),
      expires_at: new Date(now.getTime() + 30_000).toISOString(),
    };
    const results = await Promise.all([storeA.consumeOnce(input, now), storeB.consumeOnce(input, now)]);
    expect(results.sort()).toEqual([false, true]);
    const row = await prisma.nurtureScenarioInvocationNonce.findFirst({
      where: { bodySha256: input.body_sha256 },
    });
    expect(row).not.toBeNull();
    const serialized = JSON.stringify(row);
    expect(serialized).not.toContain(input.nonce);
    expect(serialized).not.toContain(input.request_id);
    expect(serialized).not.toContain(input.credential_subject);
  });
});

describe("C30 atomic canonical-pair association", () => {
  it("commits all local facts once and exact-replays the canonical result", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    const registration = await repository.registerEligibleAttempt(fixture.command);
    expect(registration.disposition).toBe("eligible");

    const results = await Promise.all([
      repository.commitAssociation(fixture.command),
      repository.commitAssociation(fixture.command),
    ]);
    expect(new Set(results.map((result) => result.disposition))).toEqual(
      new Set(["committed", "exact_replay"]),
    );
    expect(results[0]?.scenario_commit_evidence_hash).toBe(results[1]?.scenario_commit_evidence_hash);

    const [operation, binding, childAssociation, familyAssociation, execution, audits, outbox] =
      await Promise.all([
        prisma.nurtureC30PairOperation.findUnique({ where: { id: fixture.command.pair_request.identity_operation_id } }),
        prisma.nurtureParticipantPrincipalBinding.findMany({ where: { participantId: fixture.participant.id } }),
        prisma.nurtureChildAnchorAssociation.findMany({ where: { childAnchorId: fixture.childAnchor.id } }),
        prisma.nurtureFamilyAnchorAssociation.findMany({ where: { familyAnchorId: fixture.familyAnchor.id } }),
        prisma.nurtureCommandExecution.findMany({ where: { id: fixture.command.local_seed.command_execution_id } }),
        prisma.nurtureC30AuditRecord.findMany({ where: { operationId: fixture.command.pair_request.identity_operation_id } }),
        prisma.nurtureC30OutboxEvent.findMany({ where: { operationId: fixture.command.pair_request.identity_operation_id } }),
      ]);
    expect(operation).toMatchObject({ state: "committed", participantBindingId: fixture.command.local_seed.principal_binding_id });
    expect(binding).toHaveLength(1);
    expect(childAssociation).toHaveLength(1);
    expect(familyAssociation).toHaveLength(1);
    expect(execution).toHaveLength(1);
    expect(audits).toHaveLength(1);
    expect(outbox).toHaveLength(1);
    expect(execution[0]).toMatchObject({
      scenarioKey: "nurture",
      actorPrincipalBindingId: fixture.command.local_seed.principal_binding_id,
      executionDriver: null,
    });
    const refsOnly = JSON.stringify({ operation, audits, outbox });
    expect(refsOnly).not.toContain(fixture.command.local_seed.child_display_name);
    expect(refsOnly).not.toContain(fixture.command.local_seed.family_display_name);

    const reader = new PrismaNurtureParticipantBindingReader(prisma);
    await expect(reader.readCurrentBindings({
      account_ref: fixture.command.principal.account_ref,
      actor_ref: fixture.command.principal.actor_ref,
      workspace_ref: fixture.command.principal.workspace_ref,
    })).resolves.toHaveLength(1);
  });

  it("rejects same-operation changed input without adding an effect", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await repository.registerEligibleAttempt(fixture.command);
    const changed = rehash({
      ...fixture.command,
      local_seed: { ...fixture.command.local_seed, child_display_name: "Different child" },
    });
    await expect(repository.registerEligibleAttempt(changed)).rejects.toMatchObject({
      code: "pair_attempt_conflict",
    });
    expect(await prisma.nurtureCommandExecution.count({
      where: { id: fixture.command.local_seed.command_execution_id },
    })).toBe(0);
  });

  it("rolls back every local effect when current authority denies at dispatch", async () => {
    const fixture = await createFixture();
    const admitted = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await admitted.registerEligibleAttempt(fixture.command);
    const denied = new PrismaNurtureC30PairAssociationRepository(prisma);
    await expect(denied.commitAssociation(fixture.command)).rejects.toMatchObject({
      code: "pair_authority_denied",
    });
    const counts = await Promise.all([
      prisma.nurtureParticipantPrincipalBinding.count({ where: { id: fixture.command.local_seed.principal_binding_id } }),
      prisma.nurtureChild.count({ where: { id: fixture.command.local_seed.child_id } }),
      prisma.nurtureChildCareProcess.count({ where: { id: fixture.command.local_seed.child_care_process_id } }),
      prisma.nurtureFamily.count({ where: { id: fixture.command.local_seed.family_id } }),
      prisma.nurtureCommandExecution.count({ where: { id: fixture.command.local_seed.command_execution_id } }),
      prisma.nurtureC30AuditRecord.count({ where: { operationId: fixture.command.pair_request.identity_operation_id } }),
      prisma.nurtureC30OutboxEvent.count({ where: { operationId: fixture.command.pair_request.identity_operation_id } }),
    ]);
    expect(counts).toEqual([0, 0, 0, 0, 0, 0, 0]);
    await expect(prisma.nurtureC30PairOperation.findUnique({
      where: { id: fixture.command.pair_request.identity_operation_id },
    })).resolves.toMatchObject({ state: "eligible" });
  });

  it("denies revoke-before-lock and leaves the admitted attempt effect-free", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await repository.registerEligibleAttempt(fixture.command);
    await prisma.nurtureParticipant.update({
      where: { id: fixture.participant.id },
      data: { status: "suspended", aggregateVersion: { increment: 1 } },
    });
    await expect(repository.commitAssociation(fixture.command)).rejects.toMatchObject({
      code: "pair_authority_denied",
    });
    expect(await prisma.nurtureCommandExecution.count({
      where: { id: fixture.command.local_seed.command_execution_id },
    })).toBe(0);
    await expect(prisma.nurtureC30PairOperation.findUnique({
      where: { id: fixture.command.pair_request.identity_operation_id },
    })).resolves.toMatchObject({ state: "eligible" });
  });

  it("rolls back earlier creates when a later local object conflicts", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await repository.registerEligibleAttempt(fixture.command);
    const foreignChild = await prisma.nurtureChild.create({
      data: {
        workspaceId: fixture.command.principal.workspace_ref.object_id,
        displayName: "Foreign child",
        status: "active",
      },
    });
    const foreignProcess = await prisma.nurtureChildCareProcess.create({
      data: {
        id: randomUUID(),
        workspaceId: fixture.command.principal.workspace_ref.object_id,
        childId: foreignChild.id,
        status: "active",
      },
    });
    await prisma.nurtureFamily.create({
      data: {
        id: fixture.command.local_seed.family_id,
        workspaceId: fixture.command.principal.workspace_ref.object_id,
        childCareProcessId: foreignProcess.id,
        displayName: "Conflicting family",
        status: "active",
      },
    });
    await expect(repository.commitAssociation(fixture.command)).rejects.toMatchObject({
      code: "pair_local_conflict",
    });
    expect(await prisma.nurtureChild.count({
      where: { id: fixture.command.local_seed.child_id },
    })).toBe(0);
    expect(await prisma.nurtureChildCareProcess.count({
      where: { id: fixture.command.local_seed.child_care_process_id },
    })).toBe(0);
    expect(await prisma.nurtureParticipantPrincipalBinding.count({
      where: { id: fixture.command.local_seed.principal_binding_id },
    })).toBe(0);
  });

  it("writer-fences a timed-out eligible attempt as confirmed no effect", async () => {
    const fixture = await createFixture(40);
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await repository.registerEligibleAttempt(fixture.command);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const request = statusRequest(fixture.command);
    const result = await repository.lookupStatus(request, new Date());
    expect(result).toMatchObject({ status: "confirmed_no_effect" });
    await expect(repository.commitAssociation(fixture.command)).rejects.toMatchObject({
      code: "pair_attempt_not_current",
    });
    expect(await prisma.nurtureCommandExecution.count({
      where: { id: fixture.command.local_seed.command_execution_id },
    })).toBe(0);
    expect(await prisma.nurtureC30AuditRecord.count({
      where: { operationId: fixture.command.pair_request.identity_operation_id },
    })).toBe(1);
    expect(await prisma.nurtureC30OutboxEvent.count({
      where: { operationId: fixture.command.pair_request.identity_operation_id },
    })).toBe(1);
  });

  it("returns committed recovery only for the exact immutable evidence", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await repository.registerEligibleAttempt(fixture.command);
    const committed = await repository.commitAssociation(fixture.command);
    await expect(repository.lookupStatus(statusRequest(fixture.command), new Date())).resolves.toMatchObject({
      status: "committed",
      scenario_commit_evidence_hash: committed.scenario_commit_evidence_hash,
    });
    await expect(repository.lookupStatus({
      ...statusRequest(fixture.command),
      attempt_ledger_hash: digest("other-attempt"),
    }, new Date())).resolves.toMatchObject({
      status: "unknown",
      reason_code: "compatible_evidence_ambiguous",
    });
  });

  it("remains hard default-deny when no local authority reader is supplied", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma);
    await expect(repository.registerEligibleAttempt(fixture.command)).rejects.toMatchObject({
      code: "pair_authority_denied",
    });
    expect(await prisma.nurtureC30PairOperation.count({
      where: { id: fixture.command.pair_request.identity_operation_id },
    })).toBe(0);
  });

  it("enforces pair-state and principal-lifecycle invariants in PostgreSQL", async () => {
    const fixture = await createFixture();
    const repository = new PrismaNurtureC30PairAssociationRepository(prisma, authorityReader);
    await repository.registerEligibleAttempt(fixture.command);
    await expect(prisma.nurtureC30PairOperation.update({
      where: { id: fixture.command.pair_request.identity_operation_id },
      data: { state: "committed" },
    })).rejects.toBeDefined();
    await repository.commitAssociation(fixture.command);
    await expect(prisma.nurtureParticipantPrincipalBinding.update({
      where: { id: fixture.command.local_seed.principal_binding_id },
      data: { status: "suspended" },
    })).rejects.toBeDefined();
  });
});

async function createFixture(deadlineOffsetMs = 30_000) {
  const workspaceId = randomUUID();
  const accountId = randomUUID();
  const actorId = randomUUID();
  const participant = await prisma.nurtureParticipant.create({
    data: {
      id: randomUUID(),
      workspaceId,
      myChatUserId: `legacy:${randomUUID()}`,
      status: "active",
      aggregateVersion: 1,
    },
  });
  const [childAnchor, familyAnchor] = await Promise.all([
    prisma.nurtureChildBindingAnchor.create({
      data: { id: randomUUID(), reservationKeyHash: digest(randomUUID()), status: "reserved" },
    }),
    prisma.nurtureFamilyBindingAnchor.create({
      data: { id: randomUUID(), reservationKeyHash: digest(randomUUID()), status: "reserved" },
    }),
  ]);
  const childOwnerRef = ref("nurture", "child_binding_anchor", childAnchor.id, childAnchor.aggregateVersion);
  const familyOwnerRef = ref("nurture", "family_binding_anchor", familyAnchor.id, familyAnchor.aggregateVersion);
  const childCanonicalRef = ref("my_chat", "child", randomUUID(), 1);
  const familyCanonicalRef = ref("my_chat", "family", randomUUID(), 1);
  const identityOperationId = randomUUID();
  const pairRelationEvidenceHash = digest(`pair:${identityOperationId}`);
  const pairRequest = {
    pair_request_version: 1 as const,
    identity_operation_id: identityOperationId,
    workspace_ref: ref("my_chat", "workspace", workspaceId),
    scenario_key: "nurture",
    principal_provenance_hash: digest(`principal:${identityOperationId}`),
    continuation_context_hash: digest(`continuation:${identityOperationId}`),
    pair_relation_evidence_hash: pairRelationEvidenceHash,
    canonical_input_hash: digest(`input:${identityOperationId}`),
    bindings: [
      {
        binding_intent_version: 1 as const,
        binding_slot: "child",
        canonical_object_ref: childCanonicalRef,
        scenario_owner_ref: childOwnerRef,
        expected_head: { state: "absent" as const },
      },
      {
        binding_intent_version: 1 as const,
        binding_slot: "family",
        canonical_object_ref: familyCanonicalRef,
        scenario_owner_ref: familyOwnerRef,
        expected_head: { state: "absent" as const },
      },
    ] as const,
  };
  const pairResult = {
    pair_result_version: 1 as const,
    identity_operation_id: identityOperationId,
    canonical_input_hash: pairRequest.canonical_input_hash,
    disposition: "committed" as const,
    bindings: [
      {
        binding_result_version: 1 as const,
        binding_slot: "child",
        canonical_object_ref: childCanonicalRef,
        scenario_owner_ref: childOwnerRef,
        binding_ref: ref("my_chat", "scenario_binding", randomUUID(), 1),
        binding_version: 1,
        effect: "created" as const,
      },
      {
        binding_result_version: 1 as const,
        binding_slot: "family",
        canonical_object_ref: familyCanonicalRef,
        scenario_owner_ref: familyOwnerRef,
        binding_ref: ref("my_chat", "scenario_binding", randomUUID(), 1),
        binding_version: 1,
        effect: "created" as const,
      },
    ] as const,
    pair_commit_evidence_hash: digest(`pair-commit:${identityOperationId}`),
  };
  const command: NurtureC30PairAssociationCommandV1 = {
    command_version: 1,
    pair_request: pairRequest,
    pair_result: pairResult,
    current_owner_evidence: {
      binding_evidence_version: 1,
      purpose_key: "associate_canonical_pair",
      owner_bindings: [
        { owner_binding_ref_version: 1, binding_slot: "child", owner_ref: childOwnerRef },
        { owner_binding_ref_version: 1, binding_slot: "family", owner_ref: familyOwnerRef },
      ],
      pair_relation_evidence_hash: pairRelationEvidenceHash,
      current_owner_evidence_hash: digest(`current-owner:${identityOperationId}`),
    },
    principal: {
      principal_version: 1,
      principal_kind: "human_user",
      account_ref: ref("my_chat", "user", accountId),
      actor_ref: ref("my_chat", "actor", actorId),
      workspace_ref: ref("my_chat", "workspace", workspaceId),
      principal_origin: "interactive_session",
    },
    local_seed: {
      seed_version: 1,
      participant_id: participant.id,
      principal_binding_id: randomUUID(),
      child_id: randomUUID(),
      child_display_name: `Child ${randomUUID()}`,
      child_care_process_id: randomUUID(),
      family_id: randomUUID(),
      family_display_name: `Family ${randomUUID()}`,
      initial_role_assignment_id: randomUUID(),
      child_association_id: randomUUID(),
      family_association_id: randomUUID(),
      command_execution_id: randomUUID(),
    },
    scenario_command_id: randomUUID(),
    scenario_command_hash: "0".repeat(64),
    association_expectation_hash: "0".repeat(64),
    request_nonce_hash: digest(`nonce:${identityOperationId}`),
    host_identity_evidence_hash: digest(`host:${identityOperationId}`),
    deadline_evidence_hash: digest(`deadline:${identityOperationId}`),
    attempt_ledger_hash: digest(`attempt:${identityOperationId}`),
    writer_fence_hash: digest(`writer:${identityOperationId}`),
    effect_deadline_at: new Date(Date.now() + deadlineOffsetMs).toISOString(),
  };
  return {
    participant,
    childAnchor,
    familyAnchor,
    command: rehash(command),
  };
}

function rehash(command: NurtureC30PairAssociationCommandV1): NurtureC30PairAssociationCommandV1 {
  const next = { ...command };
  next.association_expectation_hash = computeNurtureC30AssociationExpectationHash(next);
  next.scenario_command_hash = computeNurtureC30PairCommandHash(next);
  return next;
}

function statusRequest(command: NurtureC30PairAssociationCommandV1) {
  return {
    status_lookup_request_version: 1 as const,
    identity_operation_id: command.pair_request.identity_operation_id,
    owner_bindings: command.current_owner_evidence.owner_bindings,
    association_expectation_hash: command.association_expectation_hash,
    scenario_command_id: command.scenario_command_id,
    scenario_command_hash: command.scenario_command_hash,
    principal_provenance_hash: command.pair_request.principal_provenance_hash,
    host_identity_evidence_hash: command.host_identity_evidence_hash,
    deadline_evidence_hash: command.deadline_evidence_hash,
    attempt_ledger_hash: command.attempt_ledger_hash,
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
