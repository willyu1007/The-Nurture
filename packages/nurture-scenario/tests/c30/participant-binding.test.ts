import { describe, expect, it, vi } from "vitest";
import type { CanonicalRef, ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import {
  resolveAuthorizedNurtureParticipant,
  type NurtureParticipantPrincipalBindingV1,
} from "../../src/index.js";

const accountRef = ref("my_chat", "user", "user-1");
const actorRef = ref("my_chat", "actor", "actor-1");
const workspaceRef = ref("my_chat", "workspace", "workspace-1");
const participantRef = ref("nurture", "participant", "participant-1", 4);
const organizationRef = ref("my_chat", "organization", "organization-1");

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
  represented_organization_ref: organizationRef,
};

function ports(bindings: readonly NurtureParticipantPrincipalBindingV1[] = [binding], authorized = true) {
  return {
    binding_reader: {
      readCurrentBindings: vi.fn(async () => bindings),
    },
    authority_reader: {
      authorizeCurrent: vi.fn(async () => ({
        authority_version: 1 as const,
        authorized,
        authority_revision: 12,
        reason_code: authorized ? "authorized" : "role_not_current",
      })),
    },
  };
}

describe("C30 typed Participant binding", () => {
  it.each(["interactive_session", "durable_run_actor"] as const)(
    "separates a verified %s identity from current Nurture authority",
    async (principalOrigin) => {
      const dependencies = ports();
      await expect(resolveAuthorizedNurtureParticipant({
        principal: { ...principal, principal_origin: principalOrigin },
        operation_key: "list_subject_contexts",
        ...dependencies,
      })).resolves.toEqual({
        participant_ref: participantRef,
        workspace_ref: workspaceRef,
        represented_organization_ref: organizationRef,
        principal_origin: principalOrigin,
        binding_revision: 9,
        authority_revision: 12,
      });
      expect(dependencies.authority_reader.authorizeCurrent).toHaveBeenCalledWith({
        participant_ref: participantRef,
        workspace_ref: workspaceRef,
        represented_organization_ref: organizationRef,
        operation_key: "list_subject_contexts",
        principal_origin: principalOrigin,
      });
    },
  );

  it("fails closed for no binding or multiple current bindings", async () => {
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([]),
    })).rejects.toMatchObject({ code: "participant_unbound" });
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([binding, { ...binding, binding_revision: 10 }]),
    })).rejects.toMatchObject({ code: "participant_ambiguous" });
  });

  it.each(["suspended", "revoked"] as const)("rejects a %s binding", async (status) => {
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([{ ...binding, status }]),
    })).rejects.toMatchObject({ code: "participant_binding_inactive" });
  });

  it.each([
    ["account", { account_ref: ref("my_chat", "user", "user-2") }],
    ["actor", { actor_ref: ref("my_chat", "actor", "actor-2") }],
    ["workspace", { workspace_ref: ref("my_chat", "workspace", "workspace-2") }],
  ] as const)("rejects a cross-principal %s binding", async (_label, change) => {
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([{ ...binding, ...change }]),
    })).rejects.toMatchObject({ code: "participant_binding_invalid" });
  });

  it("does not treat an exact identity binding as permission", async () => {
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([binding], false),
    })).rejects.toMatchObject({ code: "participant_unauthorized" });
  });

  it("rejects malformed local and represented-organization refs", async () => {
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([{ ...binding, participant_ref: ref("my_chat", "participant", "participant-1") }]),
    })).rejects.toMatchObject({ code: "participant_binding_invalid" });
    await expect(resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: "list_subject_contexts",
      ...ports([{ ...binding, represented_organization_ref: ref("nurture", "organization", "org-1") }]),
    })).rejects.toMatchObject({ code: "participant_binding_invalid" });
  });
});

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
