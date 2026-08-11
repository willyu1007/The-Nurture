import { randomUUID } from "node:crypto";
import type { ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import type { NurtureInstitutionKnowledgeFormalPrepareInputV1 } from "@the-nurture/scenario";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import {
  bindPrismaNurtureInstitutionKnowledgeFormalOwners,
  createPrismaNurtureInstitutionKnowledgeFormalOwners,
} from
  "../src/institution-knowledge-formal-owners.composition.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("T-007 Prisma formal Institution Knowledge owners", () => {
  it("rechecks current authority and atomically replays one confirmed command", async () => {
    const suffix = randomUUID();
    const workspaceId = `workspace-${suffix}`;
    const participantId = `participant-${suffix}`;
    const institutionId = `institution-${suffix}`;
    const roleAssignmentId = `role-${suffix}`;
    const caregiverRoleAssignmentId = `caregiver-role-${suffix}`;
    const accountId = `account-${suffix}`;
    const actorId = `actor-${suffix}`;
    const now = new Date("2026-08-11T10:00:00.000Z");

    try {
      await prisma.nurtureParticipant.create({
        data: {
          id: participantId,
          workspaceId,
          myChatUserId: accountId,
          status: "active",
          aggregateVersion: 7,
        },
      });
      await prisma.nurtureParticipantPrincipalBinding.create({
        data: {
          participantId,
          workspaceId,
          accountObjectId: accountId,
          actorObjectId: actorId,
          status: "active",
          currentKey: "current",
          aggregateVersion: 9,
        },
      });
      await prisma.nurtureCareInstitution.create({
        data: {
          id: institutionId,
          workspaceId,
          displayName: "T-007 disposable institution",
          status: "active",
          aggregateVersion: 3,
        },
      });
      await prisma.nurtureCareRoleAssignment.create({
        data: {
          id: roleAssignmentId,
          workspaceId,
          participantId,
          role: "institution_admin",
          scopeType: "institution",
          scopeId: institutionId,
          status: "active",
          aggregateVersion: 5,
        },
      });
      await prisma.nurtureCareRoleAssignment.create({
        data: {
          id: caregiverRoleAssignmentId,
          workspaceId,
          participantId,
          role: "caregiver",
          scopeType: "institution",
          scopeId: institutionId,
          status: "active",
          aggregateVersion: 2,
        },
      });

      const owners = createPrismaNurtureInstitutionKnowledgeFormalOwners({
        prisma,
        targetOptionIntegrityKey: "t007-target-option-integrity-key-00000001",
        preparedCommandIntegrityKey: "t007-prepared-integrity-key-0000000001",
        preparedCommandEncryptionSecret: "t007-prepared-encryption-key-000000001",
        now: () => new Date(now),
      });
      const principal = humanPrincipal({ workspaceId, accountId, actorId });
      const moduleBinding = bindPrismaNurtureInstitutionKnowledgeFormalOwners({
        formalOwners: owners,
        authorizedRetrievalOwnerFactory: {
          createForPrincipal: () => ({
            retrieveCandidates: async () => ({ status: "unavailable" }),
            assertStillAuthorized: async () => "unavailable",
          }),
        },
        ownerIntegration: {
          q2_owner_pin: {},
          q3_adapter_qualification_pin: {},
          surface_deps: {
            optionIssuer: owners.institutionKnowledgeOptionIssuer,
          },
        } as never,
      });
      expect(moduleBinding.institutionKnowledgeFormalOwnerBinding.authorityResolver)
        .toBe(owners.institutionKnowledgeAuthorityResolver);
      expect(() => bindPrismaNurtureInstitutionKnowledgeFormalOwners({
        formalOwners: owners,
        authorizedRetrievalOwnerFactory: {
          createForPrincipal: () => ({
            retrieveCandidates: async () => ({ status: "unavailable" }),
            assertStillAuthorized: async () => "unavailable",
          }),
        },
        ownerIntegration: {
          surface_deps: { optionIssuer: { issue: () => null } },
        } as never,
      })).toThrow(/option issuer/u);

      const targetOptionRef = owners.institutionKnowledgeOptionIssuer.issueInstitution({
        workspace_id: workspaceId,
        participant_ref: participantId,
        institution_ref: institutionId,
        role_assignment_ref: roleAssignmentId,
        version: 3,
      });
      if (!targetOptionRef) throw new Error("target option issuance failed");
      const caregiverTargetOptionRef =
        owners.institutionKnowledgeOptionIssuer.issueInstitution({
          workspace_id: workspaceId,
          participant_ref: participantId,
          institution_ref: institutionId,
          role_assignment_ref: caregiverRoleAssignmentId,
          version: 3,
        });
      if (!caregiverTargetOptionRef) throw new Error("caregiver target option issuance failed");
      await expect(owners.institutionKnowledgeAuthorityResolver.resolveCurrent({
        principal,
        invocation_request_id: `caregiver-authority-${suffix}`,
        declared_operation_key: "query_institution_knowledge",
        capability_key: "query_institution_knowledge_preview",
        target_option_ref: caregiverTargetOptionRef,
      })).resolves.toEqual({
        status: "denied",
        reason_code: "institution_admin_role_not_current",
      });

      const authority = await owners.institutionKnowledgeAuthorityResolver.resolveCurrent({
        principal,
        invocation_request_id: `authority-${suffix}`,
        declared_operation_key: "prepare_institution_knowledge_command",
        capability_key: "create_institution_knowledge_item",
        target_option_ref: targetOptionRef,
      });
      expect(authority).toMatchObject({
        status: "resolved",
        authority: {
          workspace_id: workspaceId,
          participant_ref: participantId,
          institution_ref: institutionId,
          role_assignment_ref: roleAssignmentId,
          authority_version: "nurture.ik-authority.v1.b9.p7.r5.i3.t3",
        },
      });
      if (authority.status !== "resolved") throw new Error("authority resolution failed");

      const prepared = await owners.institutionKnowledgePreparedCommandOwner.prepare({
        principal,
        invocation_request_id: `prepare-${suffix}`,
        client_surface: "web_run_workbench",
        authority: authority.authority,
        command: {
          contractVersion: 1,
          clientCommandId: `client-command-${suffix}`,
          request: {
            capabilityKey: "create_institution_knowledge_item",
            capabilityVersion: "1.0.0",
            targetOptionRef,
            operationInput: {
              category: "institution_policy",
              body: {
                title: "Safe pickup",
                summary: "How the institution handles pickup.",
                sections: [{
                  sectionKey: "pickup",
                  heading: "Pickup",
                  body: "Verify the authorized pickup contact.",
                }],
              },
              intendedAudiences: ["institution_admin"],
              safetyClass: "general_guidance",
            },
          },
        },
      });
      expect(prepared).toMatchObject({
        status: "ready_to_confirm",
        effect: "create_institution_knowledge_item",
      });
      if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

      const execute = {
        principal,
        invocation_request_id: `execute-${suffix}`,
        client_surface: "web_run_workbench" as const,
        command: {
          contractVersion: 1 as const,
          commandRequestId: prepared.command_request_id,
          confirmationRef: prepared.confirmation_ref,
        },
      };
      const [first, replay] = await Promise.all([
        owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed(execute),
        owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed(execute),
      ]);
      expect(first).toEqual(replay);
      expect(first).toMatchObject({
        status: "resolved",
        command_request_id: prepared.command_request_id,
      });
      await expect(prisma.nurtureInstitutionKnowledgePreparedCommand.count({
        where: { workspaceId },
      })).resolves.toBe(1);

      await prisma.nurtureCareRoleAssignment.update({
        where: { id: roleAssignmentId },
        data: { status: "revoked", aggregateVersion: { increment: 1 } },
      });
      await expect(owners.institutionKnowledgeAuthorityResolver.resolveCurrent({
        principal,
        invocation_request_id: `authority-revoked-${suffix}`,
        declared_operation_key: "query_institution_knowledge",
        capability_key: "query_institution_knowledge_preview",
        target_option_ref: targetOptionRef,
      })).resolves.toEqual({
        status: "denied",
        reason_code: "institution_knowledge_participant_unauthorized",
      });
    } finally {
      await prisma.nurtureInstitutionKnowledgePreparedCommand.deleteMany({
        where: { workspaceId },
      });
      await prisma.nurtureCareRoleAssignment.deleteMany({ where: { workspaceId } });
      await prisma.nurtureCareInstitution.deleteMany({ where: { workspaceId } });
      await prisma.nurtureParticipantPrincipalBinding.deleteMany({ where: { workspaceId } });
      await prisma.nurtureParticipant.deleteMany({ where: { workspaceId } });
    }
  });

  it("deduplicates an exact prepare and rejects client-command reuse with another payload", async () => {
    const scope = await seedInstitutionAdminScope("dedup");
    const clock = { ms: Date.parse("2026-08-11T10:00:00.000Z") };
    const owners = createOwners(() => new Date(clock.ms));
    try {
      const principal = humanPrincipal(scope);
      const targetOptionRef = issueTarget(owners, scope);
      const authority = await resolvePreparedAuthority(
        owners,
        principal,
        targetOptionRef,
        `dedup-authority-${scope.suffix}`,
      );
      const command = knowledgeItemCommand(`client-command-${scope.suffix}`, targetOptionRef);
      const prepareInput = {
        principal,
        invocation_request_id: `prepare-${scope.suffix}`,
        client_surface: "web_run_workbench" as const,
        authority,
        command,
      };
      const first = await owners.institutionKnowledgePreparedCommandOwner.prepare(prepareInput);
      expect(first).toMatchObject({ status: "ready_to_confirm" });
      clock.ms += 1_000;
      const replay = await owners.institutionKnowledgePreparedCommandOwner.prepare(prepareInput);
      expect(replay).toEqual(first);
      await expect(prisma.nurtureInstitutionKnowledgePreparedCommand.count({
        where: { workspaceId: scope.workspaceId },
      })).resolves.toBe(1);

      await expect(owners.institutionKnowledgePreparedCommandOwner.prepare({
        ...prepareInput,
        invocation_request_id: `prepare-reuse-${scope.suffix}`,
        command: knowledgeItemCommand(
          `client-command-${scope.suffix}`,
          targetOptionRef,
          "Changed pickup title",
        ),
      })).resolves.toEqual({
        status: "not_prepared",
        reason_code: "prepared_client_command_reuse_conflict",
      });
      await expect(prisma.nurtureInstitutionKnowledgePreparedCommand.count({
        where: { workspaceId: scope.workspaceId },
      })).resolves.toBe(1);
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });

  it("expires an unconsumed prepare, scrubs the snapshot and never revives the client command id", async () => {
    const scope = await seedInstitutionAdminScope("expiry");
    const clock = { ms: Date.parse("2026-08-11T10:00:00.000Z") };
    const owners = createOwners(() => new Date(clock.ms));
    try {
      const principal = humanPrincipal(scope);
      const targetOptionRef = issueTarget(owners, scope);
      const authority = await resolvePreparedAuthority(
        owners,
        principal,
        targetOptionRef,
        `expiry-authority-${scope.suffix}`,
      );
      const command = knowledgeItemCommand(`client-command-${scope.suffix}`, targetOptionRef);
      const prepared = await owners.institutionKnowledgePreparedCommandOwner.prepare({
        principal,
        invocation_request_id: `prepare-${scope.suffix}`,
        client_surface: "web_run_workbench",
        authority,
        command,
      });
      expect(prepared).toMatchObject({ status: "ready_to_confirm" });
      if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");
      const before = await prisma.nurtureInstitutionKnowledgePreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: prepared.command_request_id },
      });
      expect(before.status).toBe("prepared");
      expect(before.snapshotCodecVersion).toBeGreaterThan(0);
      expect(before.frozenSnapshotCiphertext).not.toBe("");

      clock.ms += 10 * 60_000;
      await expect(owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed({
        principal,
        invocation_request_id: `execute-expired-${scope.suffix}`,
        client_surface: "web_run_workbench",
        command: {
          contractVersion: 1,
          commandRequestId: prepared.command_request_id,
          confirmationRef: prepared.confirmation_ref,
        },
      })).resolves.toEqual({
        status: "denied",
        reason_code: "prepared_command_expired",
      });
      const after = await prisma.nurtureInstitutionKnowledgePreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: prepared.command_request_id },
      });
      expect(after).toMatchObject({
        status: "expired",
        snapshotCodecVersion: 0,
        frozenSnapshotCiphertext: "",
      });
      expect(after.aggregateVersion).toBe(before.aggregateVersion + 1);

      const freshAuthority = await resolvePreparedAuthority(
        owners,
        principal,
        targetOptionRef,
        `expiry-fresh-authority-${scope.suffix}`,
      );
      await expect(owners.institutionKnowledgePreparedCommandOwner.prepare({
        principal,
        invocation_request_id: `prepare-revive-${scope.suffix}`,
        client_surface: "web_run_workbench",
        authority: freshAuthority,
        command,
      })).resolves.toEqual({
        status: "not_prepared",
        reason_code: "prepared_command_expired",
      });
      await expect(prisma.nurtureInstitutionKnowledgePreparedCommand.count({
        where: { workspaceId: scope.workspaceId },
      })).resolves.toBe(1);
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });

  it("rejects a mismatched confirmation and keeps the prepared command consumable", async () => {
    const scope = await seedInstitutionAdminScope("conflict");
    const clock = { ms: Date.parse("2026-08-11T10:00:00.000Z") };
    const owners = createOwners(() => new Date(clock.ms));
    try {
      const principal = humanPrincipal(scope);
      const targetOptionRef = issueTarget(owners, scope);
      const authority = await resolvePreparedAuthority(
        owners,
        principal,
        targetOptionRef,
        `conflict-authority-${scope.suffix}`,
      );
      const prepared = await owners.institutionKnowledgePreparedCommandOwner.prepare({
        principal,
        invocation_request_id: `prepare-${scope.suffix}`,
        client_surface: "web_run_workbench",
        authority,
        command: knowledgeItemCommand(`client-command-${scope.suffix}`, targetOptionRef),
      });
      expect(prepared).toMatchObject({ status: "ready_to_confirm" });
      if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

      await expect(owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed({
        principal,
        invocation_request_id: `execute-mismatch-${scope.suffix}`,
        client_surface: "web_run_workbench",
        command: {
          contractVersion: 1,
          commandRequestId: prepared.command_request_id,
          confirmationRef: "ikc1.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
      })).resolves.toEqual({
        status: "conflict",
        reason_code: "prepared_command_reuse_conflict",
      });
      await expect(prisma.nurtureInstitutionKnowledgePreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: prepared.command_request_id },
      })).resolves.toMatchObject({ status: "prepared" });

      await expect(owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed({
        principal,
        invocation_request_id: `execute-exact-${scope.suffix}`,
        client_surface: "web_run_workbench",
        command: {
          contractVersion: 1,
          commandRequestId: prepared.command_request_id,
          confirmationRef: prepared.confirmation_ref,
        },
      })).resolves.toMatchObject({
        status: "resolved",
        command_request_id: prepared.command_request_id,
      });
      await expect(prisma.nurtureInstitutionKnowledgePreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: prepared.command_request_id },
      })).resolves.toMatchObject({ status: "consumed" });
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });

  it("expires a consumed command after TTL while retaining the consumption audit time", async () => {
    const scope = await seedInstitutionAdminScope("consumed-expiry");
    const clock = { ms: Date.parse("2026-08-11T10:00:00.000Z") };
    const owners = createOwners(() => new Date(clock.ms));
    try {
      const principal = humanPrincipal(scope);
      const targetOptionRef = issueTarget(owners, scope);
      const authority = await resolvePreparedAuthority(
        owners,
        principal,
        targetOptionRef,
        `consumed-expiry-authority-${scope.suffix}`,
      );
      const prepared = await owners.institutionKnowledgePreparedCommandOwner.prepare({
        principal,
        invocation_request_id: `prepare-${scope.suffix}`,
        client_surface: "web_run_workbench",
        authority,
        command: knowledgeItemCommand(`client-command-${scope.suffix}`, targetOptionRef),
      });
      expect(prepared).toMatchObject({ status: "ready_to_confirm" });
      if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");
      const execute = {
        principal,
        invocation_request_id: `execute-${scope.suffix}`,
        client_surface: "web_run_workbench" as const,
        command: {
          contractVersion: 1 as const,
          commandRequestId: prepared.command_request_id,
          confirmationRef: prepared.confirmation_ref,
        },
      };
      await expect(owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed(execute))
        .resolves.toMatchObject({ status: "resolved" });

      clock.ms += 10 * 60_000;
      await expect(owners.institutionKnowledgePreparedCommandOwner.consumeConfirmed(execute))
        .resolves.toEqual({
          status: "denied",
          reason_code: "prepared_command_expired",
        });
      const row = await prisma.nurtureInstitutionKnowledgePreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: prepared.command_request_id },
      });
      expect(row).toMatchObject({
        status: "expired",
        snapshotCodecVersion: 0,
        frozenSnapshotCiphertext: "",
      });
      expect(row.consumedAt).not.toBeNull();
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });
});

type SeededScope = {
  suffix: string;
  workspaceId: string;
  participantId: string;
  institutionId: string;
  roleAssignmentId: string;
  accountId: string;
  actorId: string;
};

async function seedInstitutionAdminScope(label: string): Promise<SeededScope> {
  const suffix = `${label}-${randomUUID()}`;
  const scope: SeededScope = {
    suffix,
    workspaceId: `workspace-${suffix}`,
    participantId: `participant-${suffix}`,
    institutionId: `institution-${suffix}`,
    roleAssignmentId: `role-${suffix}`,
    accountId: `account-${suffix}`,
    actorId: `actor-${suffix}`,
  };
  await prisma.nurtureParticipant.create({
    data: {
      id: scope.participantId,
      workspaceId: scope.workspaceId,
      myChatUserId: scope.accountId,
      status: "active",
      aggregateVersion: 7,
    },
  });
  await prisma.nurtureParticipantPrincipalBinding.create({
    data: {
      participantId: scope.participantId,
      workspaceId: scope.workspaceId,
      accountObjectId: scope.accountId,
      actorObjectId: scope.actorId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 9,
    },
  });
  await prisma.nurtureCareInstitution.create({
    data: {
      id: scope.institutionId,
      workspaceId: scope.workspaceId,
      displayName: "T-007 disposable institution",
      status: "active",
      aggregateVersion: 3,
    },
  });
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      id: scope.roleAssignmentId,
      workspaceId: scope.workspaceId,
      participantId: scope.participantId,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: scope.institutionId,
      status: "active",
      aggregateVersion: 5,
    },
  });
  return scope;
}

function createOwners(now: () => Date) {
  return createPrismaNurtureInstitutionKnowledgeFormalOwners({
    prisma,
    targetOptionIntegrityKey: "t007-target-option-integrity-key-00000001",
    preparedCommandIntegrityKey: "t007-prepared-integrity-key-0000000001",
    preparedCommandEncryptionSecret: "t007-prepared-encryption-key-000000001",
    now,
  });
}

function issueTarget(
  owners: ReturnType<typeof createPrismaNurtureInstitutionKnowledgeFormalOwners>,
  scope: SeededScope,
): string {
  const targetOptionRef = owners.institutionKnowledgeOptionIssuer.issueInstitution({
    workspace_id: scope.workspaceId,
    participant_ref: scope.participantId,
    institution_ref: scope.institutionId,
    role_assignment_ref: scope.roleAssignmentId,
    version: 3,
  });
  if (!targetOptionRef) throw new Error("target option issuance failed");
  return targetOptionRef;
}

async function resolvePreparedAuthority(
  owners: ReturnType<typeof createPrismaNurtureInstitutionKnowledgeFormalOwners>,
  principal: ScenarioHumanPrincipalV1,
  targetOptionRef: string,
  invocationRequestId: string,
) {
  const authority = await owners.institutionKnowledgeAuthorityResolver.resolveCurrent({
    principal,
    invocation_request_id: invocationRequestId,
    declared_operation_key: "prepare_institution_knowledge_command",
    capability_key: "create_institution_knowledge_item",
    target_option_ref: targetOptionRef,
  });
  if (authority.status !== "resolved") throw new Error("authority resolution failed");
  return authority.authority;
}

function knowledgeItemCommand(
  clientCommandId: string,
  targetOptionRef: string,
  title = "Safe pickup",
): NurtureInstitutionKnowledgeFormalPrepareInputV1 {
  return {
    contractVersion: 1 as const,
    clientCommandId,
    request: {
      capabilityKey: "create_institution_knowledge_item",
      capabilityVersion: "1.0.0" as const,
      targetOptionRef,
      operationInput: {
        category: "institution_policy",
        body: {
          title,
          summary: "How the institution handles pickup.",
          sections: [{
            sectionKey: "pickup",
            heading: "Pickup",
            body: "Verify the authorized pickup contact.",
          }],
        },
        intendedAudiences: ["institution_admin"],
        safetyClass: "general_guidance",
      },
    },
  };
}

async function cleanupScope(workspaceId: string) {
  await prisma.nurtureInstitutionKnowledgePreparedCommand.deleteMany({ where: { workspaceId } });
  await prisma.nurtureCareRoleAssignment.deleteMany({ where: { workspaceId } });
  await prisma.nurtureCareInstitution.deleteMany({ where: { workspaceId } });
  await prisma.nurtureParticipantPrincipalBinding.deleteMany({ where: { workspaceId } });
  await prisma.nurtureParticipant.deleteMany({ where: { workspaceId } });
}

function humanPrincipal(input: {
  workspaceId: string;
  accountId: string;
  actorId: string;
}): ScenarioHumanPrincipalV1 {
  return {
    principal_version: 1,
    principal_kind: "human_user",
    account_ref: canonicalRef("user", input.accountId),
    actor_ref: canonicalRef("actor", input.actorId),
    workspace_ref: canonicalRef("workspace", input.workspaceId),
    principal_origin: "interactive_session",
  };
}

function canonicalRef(object_type: string, object_id: string) {
  return {
    schema_version: 1 as const,
    namespace: "my_chat" as const,
    object_type,
    object_id,
  };
}
