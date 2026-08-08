import {
  assertCanonicalRef,
  assertScenarioHumanPrincipalV1,
  type CanonicalRef,
  type ScenarioHumanPrincipalV1,
} from "@my-chat/workflow-contracts";

export type NurtureParticipantPrincipalBindingV1 = {
  binding_version: 1;
  binding_revision: number;
  status: "active" | "suspended" | "revoked";
  participant_ref: CanonicalRef;
  account_ref: CanonicalRef;
  actor_ref: CanonicalRef;
  workspace_ref: CanonicalRef;
  represented_organization_ref?: CanonicalRef;
};

export type NurtureParticipantBindingReader = {
  readCurrentBindings(input: {
    account_ref: CanonicalRef;
    actor_ref: CanonicalRef;
    workspace_ref: CanonicalRef;
  }): Promise<readonly NurtureParticipantPrincipalBindingV1[]>;
};

export type NurtureParticipantAuthorityDecisionV1 = {
  authority_version: 1;
  authorized: boolean;
  authority_revision: number;
  reason_code: string;
};

export type NurtureParticipantAuthorityReader = {
  authorizeCurrent(input: {
    participant_ref: CanonicalRef;
    workspace_ref: CanonicalRef;
    represented_organization_ref?: CanonicalRef;
    operation_key: string;
    principal_origin: ScenarioHumanPrincipalV1["principal_origin"];
  }): Promise<NurtureParticipantAuthorityDecisionV1>;
};

export type AuthorizedNurtureParticipantV1 = {
  participant_ref: CanonicalRef;
  workspace_ref: CanonicalRef;
  represented_organization_ref?: CanonicalRef;
  principal_origin: ScenarioHumanPrincipalV1["principal_origin"];
  binding_revision: number;
  authority_revision: number;
};

export type NurtureParticipantResolutionErrorCode =
  | "participant_unbound"
  | "participant_ambiguous"
  | "participant_binding_inactive"
  | "participant_binding_invalid"
  | "participant_unauthorized";

export class NurtureParticipantResolutionError extends Error {
  constructor(readonly code: NurtureParticipantResolutionErrorCode, message: string) {
    super(message);
    this.name = "NurtureParticipantResolutionError";
  }
}

export async function resolveAuthorizedNurtureParticipant(input: {
  principal: ScenarioHumanPrincipalV1;
  operation_key: string;
  binding_reader: NurtureParticipantBindingReader;
  authority_reader: NurtureParticipantAuthorityReader;
}): Promise<AuthorizedNurtureParticipantV1> {
  assertScenarioHumanPrincipalV1(input.principal);
  if (!machineKeyPattern.test(input.operation_key)) {
    throw new NurtureParticipantResolutionError(
      "participant_binding_invalid",
      "The operation key is invalid.",
    );
  }
  const bindings = await input.binding_reader.readCurrentBindings({
    account_ref: input.principal.account_ref,
    actor_ref: input.principal.actor_ref,
    workspace_ref: input.principal.workspace_ref,
  });
  if (bindings.length === 0) {
    throw new NurtureParticipantResolutionError("participant_unbound", "No Participant binding exists.");
  }
  if (bindings.length !== 1) {
    throw new NurtureParticipantResolutionError(
      "participant_ambiguous",
      "Participant binding is ambiguous.",
    );
  }
  const binding = bindings[0];
  if (!binding) throw new Error("unreachable Participant binding selection");
  assertBindingShape(binding);
  if (binding.status !== "active") {
    throw new NurtureParticipantResolutionError(
      "participant_binding_inactive",
      "Participant binding is not active.",
    );
  }
  if (
    !sameRef(binding.account_ref, input.principal.account_ref)
    || !sameRef(binding.actor_ref, input.principal.actor_ref)
    || !sameRef(binding.workspace_ref, input.principal.workspace_ref)
  ) {
    throw new NurtureParticipantResolutionError(
      "participant_binding_invalid",
      "Participant binding does not match the verified principal.",
    );
  }
  const authority = await input.authority_reader.authorizeCurrent({
    participant_ref: binding.participant_ref,
    workspace_ref: binding.workspace_ref,
    ...(binding.represented_organization_ref
      ? { represented_organization_ref: binding.represented_organization_ref }
      : {}),
    operation_key: input.operation_key,
    principal_origin: input.principal.principal_origin,
  });
  if (
    authority.authority_version !== 1
    || !Number.isSafeInteger(authority.authority_revision)
    || authority.authority_revision < 0
    || !machineKeyPattern.test(authority.reason_code)
    || !authority.authorized
  ) {
    throw new NurtureParticipantResolutionError(
      "participant_unauthorized",
      "Current Nurture business authority denied the operation.",
    );
  }
  return {
    participant_ref: binding.participant_ref,
    workspace_ref: binding.workspace_ref,
    ...(binding.represented_organization_ref
      ? { represented_organization_ref: binding.represented_organization_ref }
      : {}),
    principal_origin: input.principal.principal_origin,
    binding_revision: binding.binding_revision,
    authority_revision: authority.authority_revision,
  };
}

function assertBindingShape(binding: NurtureParticipantPrincipalBindingV1): void {
  try {
    assertCanonicalRef(binding.participant_ref, "binding.participant_ref");
    assertCanonicalRef(binding.account_ref, "binding.account_ref");
    assertCanonicalRef(binding.actor_ref, "binding.actor_ref");
    assertCanonicalRef(binding.workspace_ref, "binding.workspace_ref");
    if (binding.represented_organization_ref) {
      assertCanonicalRef(binding.represented_organization_ref, "binding.represented_organization_ref");
    }
  } catch {
    throw new NurtureParticipantResolutionError(
      "participant_binding_invalid",
      "Participant binding contains an invalid canonical ref.",
    );
  }
  if (
    binding.binding_version !== 1
    || !Number.isSafeInteger(binding.binding_revision)
    || binding.binding_revision < 1
    || binding.participant_ref.namespace !== "nurture"
    || binding.participant_ref.object_type !== "participant"
    || binding.account_ref.namespace !== "my_chat"
    || binding.account_ref.object_type !== "user"
    || binding.actor_ref.namespace !== "my_chat"
    || binding.actor_ref.object_type !== "actor"
    || binding.workspace_ref.namespace !== "my_chat"
    || binding.workspace_ref.object_type !== "workspace"
    || (binding.represented_organization_ref !== undefined && (
      binding.represented_organization_ref.namespace !== "my_chat"
      || binding.represented_organization_ref.object_type !== "organization"
    ))
  ) {
    throw new NurtureParticipantResolutionError(
      "participant_binding_invalid",
      "Participant binding shape is invalid.",
    );
  }
}

function sameRef(left: CanonicalRef, right: CanonicalRef): boolean {
  return left.schema_version === right.schema_version
    && left.namespace === right.namespace
    && left.object_type === right.object_type
    && left.object_id === right.object_id
    && left.version === right.version;
}

const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
