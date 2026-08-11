import type { CanonicalRef, ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionKnowledgeCurrentAuthorityOwner,
  NurtureInstitutionKnowledgeTargetOptionCodec,
} from "../../src/institution-knowledge-current-authority-owner.js";
import type { NurtureParticipantPrincipalBindingV1 } from "../../src/c30/participant-binding.js";

const NOW = "2026-08-11T08:00:00.000Z";
const INTEGRITY_KEY = "institution-knowledge-target-integrity-key-v1";
const accountRef = ref("my_chat", "user", "user-1");
const actorRef = ref("my_chat", "actor", "actor-1");
const workspaceRef = ref("my_chat", "workspace", "workspace-1");
const participantRef = ref("nurture", "participant", "participant-1", 7);

const principal: ScenarioHumanPrincipalV1 = {
  principal_version: 1,
  principal_kind: "human_user",
  account_ref: accountRef,
  actor_ref: actorRef,
  workspace_ref: workspaceRef,
  principal_origin: "interactive_session",
};

const binding: NurtureParticipantPrincipalBindingV1 = {
  binding_version: 1,
  binding_revision: 9,
  status: "active",
  participant_ref: participantRef,
  account_ref: accountRef,
  actor_ref: actorRef,
  workspace_ref: workspaceRef,
};

function harness(options: {
  roles?: Array<{
    role_assignment_ref: string;
    role_assignment_revision: number;
    institution_ref: string;
    institution_revision: number;
  }>;
  targetStatus?: "resolved" | "not_found" | "stale";
  bindings?: NurtureParticipantPrincipalBindingV1[];
} = {}) {
  const codec = new NurtureInstitutionKnowledgeTargetOptionCodec(INTEGRITY_KEY);
  const readCurrent = vi.fn(async (input: {
    institution_ref: string;
    role_assignment_ref: string;
  }) => (options.roles ?? [{
    role_assignment_ref: "role-institution-2",
    role_assignment_revision: 4,
    institution_ref: input.institution_ref,
    institution_revision: 6,
  }]).filter((entry) => entry.role_assignment_ref === input.role_assignment_ref));
  const resolveCurrent = vi.fn(async () => options.targetStatus === "not_found"
    ? { status: "not_found" as const }
    : options.targetStatus === "stale"
      ? { status: "stale" as const }
      : {
          status: "resolved" as const,
          target: {
            institution_ref: "institution-2",
            institution_revision: 6,
            target_revision: 6,
          },
        });
  return {
    codec,
    readCurrent,
    resolveCurrent,
    owner: new NurtureInstitutionKnowledgeCurrentAuthorityOwner({
      participantBindings: {
        readCurrentBindings: vi.fn(async () => options.bindings ?? [binding]),
      },
      participantAuthority: {
        authorizeCurrent: vi.fn(async () => ({
          authority_version: 1 as const,
          authorized: true,
          authority_revision: 12,
          reason_code: "authorized",
        })),
      },
      targetOptions: codec,
      targets: { resolveCurrent },
      roles: { readCurrent },
      now: () => new Date(NOW),
    }),
  };
}

describe("Institution Knowledge current-authority owner", () => {
  it("uses the target option to select one exact institution across multiple possible roles", async () => {
    const test = harness();
    const targetOptionRef = test.codec.issueInstitution({
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-2",
      role_assignment_ref: "role-institution-2",
      version: 6,
    });

    await expect(test.owner.resolveCurrent({
      principal,
      invocation_request_id: "invocation-1",
      declared_operation_key: "query_institution_knowledge",
      capability_key: "query_institution_knowledge_preview",
      target_option_ref: String(targetOptionRef),
    })).resolves.toEqual({
      status: "resolved",
      authority: {
        workspace_id: "workspace-1",
        participant_ref: "participant-1",
        institution_ref: "institution-2",
        role_assignment_ref: "role-institution-2",
        active_role: "institution_admin",
        surface_key: "institution_workbench",
        authority_version: "nurture.ik-authority.v1.b9.p12.r4.i6.t6",
        evaluated_at: NOW,
      },
    });
    expect(test.readCurrent).toHaveBeenCalledWith(expect.objectContaining({
      participant_ref: "participant-1",
      institution_ref: "institution-2",
      role_assignment_ref: "role-institution-2",
      limit: 1,
    }));
  });

  it("requires and resolves the exact signed role assignment instead of merging roles", async () => {
    const test = harness({
      roles: [
        role("role-1"),
        role("role-2"),
      ],
    });
    const option = test.codec.issueInstitution({
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-2",
      role_assignment_ref: "role-1",
    });
    await expect(test.owner.resolveCurrent(queryInput(String(option)))).resolves.toMatchObject({
      status: "resolved",
      authority: { role_assignment_ref: "role-1" },
    });

    const missingRole = test.codec.issueInstitution({
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-2",
      role_assignment_ref: "role-missing",
    });
    await expect(test.owner.resolveCurrent(queryInput(String(missingRole)))).resolves.toEqual({
      status: "denied",
      reason_code: "institution_admin_role_not_current",
    });
  });

  it("rejects actor-bound option replay, tampering, and a wrong target kind", async () => {
    const test = harness();
    const institutionOption = test.codec.issueInstitution({
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-2",
      role_assignment_ref: "role-institution-2",
    });
    expect(test.codec.resolve({
      workspace_id: "workspace-1",
      participant_ref: "participant-2",
      target_option_ref: String(institutionOption),
    })).toBeNull();
    expect(test.codec.resolve({
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      target_option_ref: `${String(institutionOption)}x`,
    })).toBeNull();

    const revisionOption = test.codec.issue({
      workspace_id: "workspace-1",
      actor_participant_ref: "participant-1",
      role_assignment_ref: "role-institution-2",
      kind: "revision",
      target_ref: "revision-1",
    });
    await expect(test.owner.resolveCurrent(queryInput(String(revisionOption)))).resolves.toEqual({
      status: "denied",
      reason_code: "institution_knowledge_target_option_invalid",
    });
  });

  it("fails closed for stale targets, participant ambiguity, and operation drift", async () => {
    const stale = harness({ targetStatus: "stale" });
    const option = stale.codec.issueInstitution({
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-2",
      role_assignment_ref: "role-institution-2",
      version: 5,
    });
    await expect(stale.owner.resolveCurrent(queryInput(String(option)))).resolves.toEqual({
      status: "denied",
      reason_code: "institution_knowledge_target_option_stale",
    });

    const ambiguous = harness({ bindings: [binding, { ...binding, binding_revision: 10 }] });
    await expect(ambiguous.owner.resolveCurrent(queryInput(String(option)))).resolves.toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_participant_ambiguous",
    });

    await expect(stale.owner.resolveCurrent({
      ...queryInput(String(option)),
      declared_operation_key: "prepare_institution_knowledge_command",
    })).resolves.toEqual({
      status: "denied",
      reason_code: "institution_knowledge_invocation_not_authorized",
    });
  });
});

function queryInput(targetOptionRef: string) {
  return {
    principal,
    invocation_request_id: "invocation-1",
    declared_operation_key: "query_institution_knowledge" as const,
    capability_key: "query_institution_knowledge_preview" as const,
    target_option_ref: targetOptionRef,
  };
}

function role(roleRef: string) {
  return {
    role_assignment_ref: roleRef,
    role_assignment_revision: 4,
    institution_ref: "institution-2",
    institution_revision: 6,
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
