import { randomUUID } from "node:crypto";
import type { ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
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
});

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
