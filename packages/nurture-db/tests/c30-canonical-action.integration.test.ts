import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { CanonicalRef, ScenarioDomainActionContractV1 } from "@my-chat/workflow-contracts";
import {
  computeNurtureC30ActionCommandHash,
  computeNurtureC30ActionContractHash,
  computeNurtureC30ActionEffectIdentityHash,
  computeNurtureC30ActionPayloadHash,
  computeNurtureC30PrincipalBindingHash,
  nurtureSha256Base64Url,
  nurtureSha256Hex,
  type NurtureC30ActionExecutionCommandV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaNurtureC30ActionExecutionRepository,
  type TransactionalNurtureC30ActionAuthorityReader,
  type TransactionalNurtureC30ActionEffectWriter,
} from "../src/c30/canonical-action.repository.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const authorityReader: TransactionalNurtureC30ActionAuthorityReader = {
  verifyCurrent: async (transaction, { command }) => {
    const role = await transaction.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: command.principal.workspace_ref.object_id,
        participantId: command.current_participant.participant_ref.object_id,
        scopeType: "child_care_process",
        scopeId: command.current_target.child_care_process_ref?.object_id,
        status: "active",
      },
    });
    if (!role) throw new Error("fixture current authority denied");
    return {
      authorized: true,
      authorityEvidenceHash: command.current_target.authority_evidence_hash,
      authorityRevision: command.current_target.authority_revision,
    };
  },
};

const effectWriter: TransactionalNurtureC30ActionEffectWriter = {
  apply: async (transaction, { command }) => {
    const effectId = effectIdFor(command);
    await transaction.nurtureActivityOption.create({
      data: {
        id: effectId,
        workspaceId: command.principal.workspace_ref.object_id,
        version: 1,
      },
    });
    return {
      businessOutcome: "applied",
      outputRefs: [ref("nurture", "neutral_effect", effectId, 1)],
    };
  },
};

describe("C30 canonical action transaction", () => {
  it("commits one direct effect/execution/audit/outbox and exact-replays concurrently", async () => {
    const fixture = await createFixture("scenario_direct_empty_v1");
    const repository = new PrismaNurtureC30ActionExecutionRepository(
      prisma,
      authorityReader,
      effectWriter,
    );
    const results = await Promise.all([
      repository.execute(fixture.command),
      repository.execute(fixture.command),
    ]);
    expect(new Set(results.map((result) => result.status === "committed" && result.disposition))).toEqual(
      new Set(["executed", "replayed"]),
    );
    const effectIdentityHash = computeNurtureC30ActionEffectIdentityHash(
      fixture.command.execution_binding,
    );
    const [operations, effects, executions, audits, outbox] = await Promise.all([
      prisma.nurtureC30ActionOperation.findMany({ where: { effectIdentityHash } }),
      prisma.nurtureActivityOption.findMany({ where: { id: effectIdFor(fixture.command) } }),
      prisma.nurtureCommandExecution.findMany({ where: { scenarioEffectIdentityHash: effectIdentityHash } }),
      prisma.nurtureC30ActionAuditRecord.findMany({ where: { actionOperation: { effectIdentityHash } } }),
      prisma.nurtureC30ActionOutboxEvent.findMany({ where: { actionOperation: { effectIdentityHash } } }),
    ]);
    expect(operations).toHaveLength(1);
    expect(effects).toHaveLength(1);
    expect(executions).toHaveLength(1);
    expect(audits).toHaveLength(1);
    expect(outbox).toHaveLength(1);
    expect(executions[0]).toMatchObject({
      scenarioKey: "nurture",
      executionDriver: "scenario_direct_empty_v1",
      actorPrincipalBindingId: fixture.bindingId,
      handoffRequestSnapshotsPayload: [],
    });
    await prisma.nurtureCareRoleAssignment.updateMany({
      where: {
        workspaceId: fixture.command.principal.workspace_ref.object_id,
        scopeId: fixture.command.current_target.child_care_process_ref?.object_id,
      },
      data: { status: "revoked" },
    });
    await expect(repository.execute(fixture.command)).rejects.toThrow("fixture current authority denied");
  });

  it("rejects changed payload for the same direct effect identity", async () => {
    const fixture = await createFixture("scenario_direct_empty_v1");
    const repository = new PrismaNurtureC30ActionExecutionRepository(prisma, authorityReader, effectWriter);
    await repository.execute(fixture.command);
    const changedActionInput = { fixture_value: "changed" };
    const changedPayloadHash = computeNurtureC30ActionPayloadHash(changedActionInput);
    const changed: NurtureC30ActionExecutionCommandV1 = {
      ...fixture.command,
      prepared: {
        ...fixture.command.prepared,
        action_input: changedActionInput,
        canonical_payload_hash: changedPayloadHash,
      },
      execution_binding: {
        ...fixture.command.execution_binding,
        canonical_payload_hash: changedPayloadHash,
      },
    };
    changed.scenario_command_hash = computeNurtureC30ActionCommandHash(changed);
    await expect(repository.execute(changed)).rejects.toMatchObject({ code: "action_conflict" });
    expect(await prisma.nurtureActivityOption.count({
      where: { id: effectIdFor(fixture.command) },
    })).toBe(1);
  });

  it("rolls back a faulting effect and writer-fences confirmed no effect after deadline", async () => {
    const fixture = await createFixture("scenario_direct_empty_v1", 200);
    const faultingWriter: TransactionalNurtureC30ActionEffectWriter = {
      apply: async (transaction, { command }) => {
        await transaction.nurtureActivityOption.create({
          data: {
            id: effectIdFor(command),
            workspaceId: command.principal.workspace_ref.object_id,
            version: 1,
          },
        });
        throw new Error("synthetic effect fault");
      },
    };
    const repository = new PrismaNurtureC30ActionExecutionRepository(
      prisma,
      authorityReader,
      faultingWriter,
    );
    await expect(repository.execute(fixture.command)).rejects.toThrow("synthetic effect fault");
    expect(await prisma.nurtureActivityOption.count({ where: { id: effectIdFor(fixture.command) } })).toBe(0);
    expect(await prisma.nurtureCommandExecution.count({ where: { id: fixture.command.execution_id } })).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 240));
    await expect(repository.lookup(fixture.command, new Date())).resolves.toEqual({
      status_version: 1,
      status: "confirmed_no_effect",
    });
    await expect(repository.execute(fixture.command)).resolves.toMatchObject({
      status: "not_committed",
      decision: "request_conflict",
    });
    expect(await prisma.nurtureC30ActionAuditRecord.count({
      where: { actionOperation: { effectIdentityHash: computeNurtureC30ActionEffectIdentityHash(fixture.command.execution_binding) } },
    })).toBe(1);
    await expect(prisma.nurtureC30ActionOutboxEvent.findFirstOrThrow({
      where: {
        actionOperation: {
          effectIdentityHash: computeNurtureC30ActionEffectIdentityHash(
            fixture.command.execution_binding,
          ),
        },
      },
    })).resolves.toMatchObject({
      participantRef: `nurture:participant:${fixture.command.current_participant.participant_ref.object_id}:v3`,
    });
  });

  it("preserves claimed original-Step identity and stores no claim token", async () => {
    const fixture = await createFixture("workflow_claimed_step_v1");
    const repository = new PrismaNurtureC30ActionExecutionRepository(prisma, authorityReader, effectWriter);
    const result = await repository.execute(fixture.command);
    expect(result).toMatchObject({ status: "committed", disposition: "executed" });
    const operation = await prisma.nurtureC30ActionOperation.findUnique({
      where: { effectIdentityHash: computeNurtureC30ActionEffectIdentityHash(fixture.command.execution_binding) },
    });
    expect(operation?.driver).toBe("workflow_claimed_step_v1");
    expect(operation?.submitContextRef).toBeNull();
    expect(operation?.originalWorkflowStepRef).toEqual(
      fixture.command.execution_binding.effect_identity.driver === "workflow_claimed_step_v1"
        ? fixture.command.execution_binding.effect_identity.original_workflow_step_ref
        : undefined,
    );
    const durable = JSON.stringify({
      operation,
      execution: await prisma.nurtureCommandExecution.findUnique({ where: { id: fixture.command.execution_id } }),
      audit: await prisma.nurtureC30ActionAuditRecord.findMany({ where: { actionOperationId: operation?.id } }),
      outbox: await prisma.nurtureC30ActionOutboxEvent.findMany({ where: { actionOperationId: operation?.id } }),
    });
    expect(durable).not.toContain("claim-token-secret");
    expect(durable).not.toContain("empty-neutral");
  });

  it("keeps unconfigured production authority and effect hard default-deny", async () => {
    const fixture = await createFixture("scenario_direct_empty_v1");
    await expect(new PrismaNurtureC30ActionExecutionRepository(prisma).execute(fixture.command))
      .rejects.toMatchObject({ code: "action_authority_denied" });
    expect(await prisma.nurtureC30ActionOperation.count({
      where: { effectIdentityHash: computeNurtureC30ActionEffectIdentityHash(fixture.command.execution_binding) },
    })).toBe(0);
  });

  it("enforces driver/state lifecycle invariants in PostgreSQL", async () => {
    const fixture = await createFixture("scenario_direct_empty_v1");
    const repository = new PrismaNurtureC30ActionExecutionRepository(prisma, authorityReader, effectWriter);
    await repository.execute(fixture.command);
    const effectIdentityHash = computeNurtureC30ActionEffectIdentityHash(fixture.command.execution_binding);
    await expect(prisma.nurtureC30ActionOperation.update({
      where: { effectIdentityHash },
      data: { driver: "workflow_claimed_step_v1" },
    })).rejects.toBeDefined();
    await expect(prisma.nurtureC30ActionOperation.update({
      where: { effectIdentityHash },
      data: { state: "confirmed_no_effect" },
    })).rejects.toBeDefined();
  });
});

async function createFixture(
  driver: ScenarioDomainActionContractV1["driver"],
  deadlineOffsetMs = 30_000,
) {
  const workspaceId = randomUUID();
  const participantId = randomUUID();
  const bindingId = randomUUID();
  const processId = randomUUID();
  const childId = randomUUID();
  const accountId = randomUUID();
  const actorId = randomUUID();
  await prisma.nurtureParticipant.create({
    data: {
      id: participantId,
      workspaceId,
      myChatUserId: `legacy:${randomUUID()}`,
      status: "active",
      aggregateVersion: 3,
    },
  });
  await prisma.nurtureParticipantPrincipalBinding.create({
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
  await prisma.nurtureChild.create({
    data: { id: childId, workspaceId, displayName: "Synthetic", status: "active", aggregateVersion: 1 },
  });
  await prisma.nurtureChildCareProcess.create({
    data: { id: processId, workspaceId, childId, status: "active", aggregateVersion: 7 },
  });
  await prisma.nurtureCareRoleAssignment.create({
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
  const principal = {
    principal_version: 1 as const,
    principal_kind: "human_user" as const,
    account_ref: ref("my_chat", "user", accountId),
    actor_ref: ref("my_chat", "actor", actorId),
    workspace_ref: ref("my_chat", "workspace", workspaceId),
    principal_origin: "interactive_session" as const,
  };
  const currentParticipant = {
    participant_ref: ref("nurture", "participant", participantId, 3),
    workspace_ref: principal.workspace_ref,
    principal_origin: "interactive_session" as const,
    binding_revision: 4,
    authority_revision: 5,
  };
  const actionKey = driver === "scenario_direct_empty_v1"
    ? "fixture.neutral_direct_v1"
    : "fixture.neutral_claimed_v1";
  const contract: ScenarioDomainActionContractV1 = {
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
  const primaryScopeRef = ref("nurture", "child_care_process", processId, 7);
  const targetRef = nurtureSha256Base64Url(Buffer.from(`target:${processId}`, "utf8"));
  const prepared = {
    preparation_version: 1 as const,
    contract,
    action_contract_hash: computeNurtureC30ActionContractHash(contract),
    principal_binding_hash: computeNurtureC30PrincipalBindingHash(principal, currentParticipant),
    participant: currentParticipant,
    principal,
    target: {
      target_version: 1 as const,
      target_ref: targetRef,
      target_ref_class: "fixture.neutral_target_v1",
      workspace_ref: principal.workspace_ref,
      current_version: "v7",
      primary_scope_ref: primaryScopeRef,
      child_care_process_ref: primaryScopeRef,
      target_principal_binding_hash: computeNurtureC30PrincipalBindingHash(principal, currentParticipant),
      authority_evidence_hash: digest(`authority:${processId}`),
      authority_revision: 1,
    },
    action_input: { fixture_value: "empty-neutral" },
    canonical_payload_hash: computeNurtureC30ActionPayloadHash({ fixture_value: "empty-neutral" }),
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  };
  const stepRef = {
    schema_version: 1 as const,
    namespace: "my_chat" as const,
    object_type: "workflow_step" as const,
    object_id: `step-${randomUUID()}`,
  };
  const executionBinding = driver === "scenario_direct_empty_v1"
    ? {
        execution_binding_version: 1 as const,
        effect_identity: {
          effect_identity_version: 1 as const,
          driver,
          workspace_ref: principal.workspace_ref,
          scenario_key: "nurture",
          action_key: actionKey,
          submit_context_ref: ref("nurture", "action_submit_context", digest(`submit:${processId}`), 1),
        },
        canonical_payload_hash: prepared.canonical_payload_hash,
      }
    : {
        execution_binding_version: 1 as const,
        effect_identity: {
          effect_identity_version: 1 as const,
          driver,
          workspace_ref: principal.workspace_ref,
          scenario_key: "nurture",
          action_key: actionKey,
          original_workflow_step_ref: stepRef,
        },
        canonical_payload_hash: prepared.canonical_payload_hash,
      };
  const requestNonceHash = digest(`nonce:${randomUUID()}`);
  const command: NurtureC30ActionExecutionCommandV1 = {
    command_version: 1,
    operation_id: randomUUID(),
    execution_id: randomUUID(),
    scenario_command_id: randomUUID(),
    scenario_command_hash: "0".repeat(64),
    definition: {
      definition_version: 1,
      contract,
      assert_action_input: (value) => {
        if (
          typeof value !== "object"
          || value === null
          || typeof (value as { fixture_value?: unknown }).fixture_value !== "string"
        ) throw new Error("fixture action input invalid");
      },
      confirmation_prompt: "Confirm the neutral fixture action.",
    },
    prepared,
    current_participant: currentParticipant,
    current_target: prepared.target,
    principal,
    submit: {
      submit_request_version: 1,
      client_echo: {
        submit_version: 1,
        submit_token: nurtureSha256Base64Url(Buffer.from(`submit-token:${processId}`, "utf8")),
        confirmation: "confirmed",
        client_mutation_id: `mutation-${randomUUID()}`,
      },
    },
    execution_binding: executionBinding,
    handoff_request_snapshots: driver === "scenario_direct_empty_v1"
      ? []
      : [{
          requestId: `handoff-${randomUUID()}`,
          handoffKey: "fixture.neutral_handoff",
          requestedPurpose: "fixture.neutral_purpose",
          sourceContextRefs: [primaryScopeRef],
        }],
    invocation_evidence: {
      evidence_version: 1,
      request_nonce_hash: requestNonceHash,
      host_identity_evidence_hash: digest(`host:${processId}`),
      principal_provenance_hash: digest(`principal:${processId}`),
      request_correlation_hash: digest(`correlation:${processId}`),
      deadline_evidence_hash: digest(`deadline:${processId}`),
      attempt_ledger_hash: digest(`attempt:${processId}`),
      writer_fence_hash: digest(`writer:${processId}`),
      effect_deadline_at: new Date(Date.now() + deadlineOffsetMs).toISOString(),
    },
  };
  command.scenario_command_hash = computeNurtureC30ActionCommandHash(command);
  return { command, bindingId };
}

function effectIdFor(command: NurtureC30ActionExecutionCommandV1): string {
  return `neutral-${computeNurtureC30ActionEffectIdentityHash(command.execution_binding).slice(0, 24)}`;
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
