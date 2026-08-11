import { createHmac, timingSafeEqual } from "node:crypto";
import {
  NurtureParticipantResolutionError,
  resolveAuthorizedNurtureParticipant,
  type NurtureParticipantAuthorityReader,
  type NurtureParticipantBindingReader,
} from "./c30/participant-binding.js";
import type {
  NurtureInstitutionKnowledgeFormalAuthorityResolverV1,
} from "./institution-knowledge-formal-ingress-contract.js";
import type {
  NurtureInstitutionKnowledgeOptionIssuer,
  NurtureInstitutionKnowledgeSurfaceCapabilityKey,
} from "./institution-knowledge-surfaces.js";

export type NurtureInstitutionKnowledgeTargetKind = "institution" | "item" | "revision";

export type NurtureInstitutionKnowledgeTargetSelectionV1 = {
  target_kind: NurtureInstitutionKnowledgeTargetKind;
  target_ref: string;
  role_assignment_ref: string;
  target_version?: number;
};

export type NurtureInstitutionKnowledgeTargetOptionResolverV1 = {
  resolve(input: {
    workspace_id: string;
    participant_ref: string;
    target_option_ref: string;
  }): NurtureInstitutionKnowledgeTargetSelectionV1 | null;
};

export type NurtureInstitutionKnowledgeCurrentTargetV1 = {
  institution_ref: string;
  institution_revision: number;
  target_revision: number;
};

export type NurtureInstitutionKnowledgeCurrentTargetReaderV1 = {
  resolveCurrent(input: {
    workspace_id: string;
    capability_key: NurtureInstitutionKnowledgeSurfaceCapabilityKey;
    selection: NurtureInstitutionKnowledgeTargetSelectionV1;
    at: string;
  }): Promise<
    | { status: "resolved"; target: NurtureInstitutionKnowledgeCurrentTargetV1 }
    | { status: "not_found" | "stale" }
  >;
};

export type NurtureInstitutionKnowledgeInstitutionAdminRoleV1 = {
  role_assignment_ref: string;
  role_assignment_revision: number;
  institution_ref: string;
  institution_revision: number;
};

export type NurtureInstitutionKnowledgeInstitutionAdminRoleReaderV1 = {
  readCurrent(input: {
    workspace_id: string;
    participant_ref: string;
    institution_ref: string;
    role_assignment_ref: string;
    at: string;
    limit: 1;
  }): Promise<readonly NurtureInstitutionKnowledgeInstitutionAdminRoleV1[]>;
};

type NurtureInstitutionKnowledgeCurrentAuthorityOwnerDeps = {
  participantBindings: NurtureParticipantBindingReader;
  participantAuthority: NurtureParticipantAuthorityReader;
  targetOptions: NurtureInstitutionKnowledgeTargetOptionResolverV1;
  targets: NurtureInstitutionKnowledgeCurrentTargetReaderV1;
  roles: NurtureInstitutionKnowledgeInstitutionAdminRoleReaderV1;
  now?: () => Date;
};

const OPERATION_BY_CAPABILITY: Readonly<
  Record<NurtureInstitutionKnowledgeSurfaceCapabilityKey, readonly string[]>
> = Object.freeze({
  query_institution_knowledge_preview: ["query_institution_knowledge"],
  answer_institution_knowledge: [
    "prepare_institution_knowledge_command",
    "execute_prepared_institution_knowledge_command",
  ],
  create_institution_knowledge_item: [
    "prepare_institution_knowledge_command",
    "execute_prepared_institution_knowledge_command",
  ],
  create_institution_knowledge_revision: [
    "prepare_institution_knowledge_command",
    "execute_prepared_institution_knowledge_command",
  ],
  record_institution_knowledge_review: [
    "prepare_institution_knowledge_command",
    "execute_prepared_institution_knowledge_command",
  ],
  publish_institution_knowledge_revision: [
    "prepare_institution_knowledge_command",
    "execute_prepared_institution_knowledge_command",
  ],
  revoke_institution_knowledge_revision: [
    "prepare_institution_knowledge_command",
    "execute_prepared_institution_knowledge_command",
  ],
});

const TARGET_KIND_BY_CAPABILITY: Readonly<
  Record<NurtureInstitutionKnowledgeSurfaceCapabilityKey, NurtureInstitutionKnowledgeTargetKind>
> = Object.freeze({
  query_institution_knowledge_preview: "institution",
  answer_institution_knowledge: "institution",
  create_institution_knowledge_item: "institution",
  create_institution_knowledge_revision: "item",
  record_institution_knowledge_review: "revision",
  publish_institution_knowledge_revision: "revision",
  revoke_institution_knowledge_revision: "revision",
});

/**
 * Resolves a verified My-Chat principal to one exact, current Institution Admin
 * assignment. The target option selects the institution; it never grants it.
 */
export class NurtureInstitutionKnowledgeCurrentAuthorityOwner
implements NurtureInstitutionKnowledgeFormalAuthorityResolverV1 {
  private readonly now: () => Date;

  constructor(private readonly deps: NurtureInstitutionKnowledgeCurrentAuthorityOwnerDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async resolveCurrent(
    input: Parameters<NurtureInstitutionKnowledgeFormalAuthorityResolverV1["resolveCurrent"]>[0],
  ): ReturnType<NurtureInstitutionKnowledgeFormalAuthorityResolverV1["resolveCurrent"]> {
    if (
      input.principal.principal_origin !== "interactive_session"
      || !opaqueId(input.invocation_request_id)
      || !OPERATION_BY_CAPABILITY[input.capability_key]?.includes(input.declared_operation_key)
    ) {
      return denied("institution_knowledge_invocation_not_authorized");
    }

    let participant;
    try {
      participant = await resolveAuthorizedNurtureParticipant({
        principal: input.principal,
        operation_key: input.declared_operation_key,
        binding_reader: this.deps.participantBindings,
        authority_reader: this.deps.participantAuthority,
      });
    } catch (error) {
      return participantFailure(error);
    }

    const workspaceId = participant.workspace_ref.object_id;
    const participantId = participant.participant_ref.object_id;
    const selection = this.deps.targetOptions.resolve({
      workspace_id: workspaceId,
      participant_ref: participantId,
      target_option_ref: input.target_option_ref,
    });
    if (!selection || selection.target_kind !== TARGET_KIND_BY_CAPABILITY[input.capability_key]) {
      return denied("institution_knowledge_target_option_invalid");
    }

    const evaluatedAt = this.now().toISOString();
    let currentTarget;
    try {
      currentTarget = await this.deps.targets.resolveCurrent({
        workspace_id: workspaceId,
        capability_key: input.capability_key,
        selection,
        at: evaluatedAt,
      });
    } catch {
      return unavailable("institution_knowledge_target_owner_unavailable");
    }
    if (currentTarget.status !== "resolved") {
      return denied(currentTarget.status === "stale"
        ? "institution_knowledge_target_option_stale"
        : "institution_knowledge_target_not_found");
    }
    if (!validCurrentTarget(currentTarget.target)) {
      return unavailable("institution_knowledge_target_owner_invalid");
    }

    let roles;
    try {
      roles = await this.deps.roles.readCurrent({
        workspace_id: workspaceId,
        participant_ref: participantId,
        institution_ref: currentTarget.target.institution_ref,
        role_assignment_ref: selection.role_assignment_ref,
        at: evaluatedAt,
        limit: 1,
      });
    } catch {
      return unavailable("institution_knowledge_role_owner_unavailable");
    }
    if (roles.length === 0) return denied("institution_admin_role_not_current");
    const role = roles[0];
    if (
      !role
      || !validRole(
        role,
        selection.role_assignment_ref,
        currentTarget.target,
      )
    ) {
      return unavailable("institution_admin_role_invalid");
    }

    return {
      status: "resolved",
      authority: {
        workspace_id: workspaceId,
        participant_ref: participantId,
        institution_ref: role.institution_ref,
        role_assignment_ref: role.role_assignment_ref,
        active_role: "institution_admin",
        surface_key: "institution_workbench",
        authority_version: [
          "nurture.ik-authority.v1",
          `b${participant.binding_revision}`,
          `p${participant.authority_revision}`,
          `r${role.role_assignment_revision}`,
          `i${role.institution_revision}`,
          `t${currentTarget.target.target_revision}`,
        ].join("."),
        evaluated_at: evaluatedAt,
      },
    };
  }
}

const OPTION_VERSION = "ik2";
const OPTION_CONTEXT = "nurture.institution-knowledge-target-option.v2\0";

/**
 * Actor-bound target selection codec. Its authenticated payload is routing
 * input only; the current-target reader must still re-read the target and its
 * owning institution before authority can resolve.
 */
export class NurtureInstitutionKnowledgeTargetOptionCodec
implements NurtureInstitutionKnowledgeOptionIssuer,
NurtureInstitutionKnowledgeTargetOptionResolverV1 {
  constructor(private readonly integrityKey: string) {
    if (Buffer.byteLength(integrityKey, "utf8") < 32) {
      throw new Error("institution knowledge option integrity key must be at least 32 bytes");
    }
  }

  issue(input: {
    workspace_id: string;
    actor_participant_ref: string;
    kind: "item" | "revision";
    target_ref: string;
    role_assignment_ref: string;
    version?: number;
  }): string | null {
    return this.issueSelection({
      workspace_id: input.workspace_id,
      participant_ref: input.actor_participant_ref,
      selection: {
        target_kind: input.kind,
        target_ref: input.target_ref,
        role_assignment_ref: input.role_assignment_ref,
        ...(input.version === undefined ? {} : { target_version: input.version }),
      },
    });
  }

  issueInstitution(input: {
    workspace_id: string;
    participant_ref: string;
    institution_ref: string;
    role_assignment_ref: string;
    version?: number;
  }): string | null {
    return this.issueSelection({
      workspace_id: input.workspace_id,
      participant_ref: input.participant_ref,
      selection: {
        target_kind: "institution",
        target_ref: input.institution_ref,
        role_assignment_ref: input.role_assignment_ref,
        ...(input.version === undefined ? {} : { target_version: input.version }),
      },
    });
  }

  resolve(input: {
    workspace_id: string;
    participant_ref: string;
    target_option_ref: string;
  }): NurtureInstitutionKnowledgeTargetSelectionV1 | null {
    const parts = input.target_option_ref.split(".");
    if (parts.length !== 3 || parts[0] !== OPTION_VERSION || !parts[1] || !parts[2]) return null;
    const expected = this.tag(input.workspace_id, input.participant_ref, parts[1]);
    if (!safeEqual(expected, parts[2])) return null;
    let value: unknown;
    try {
      value = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    } catch {
      return null;
    }
    return parseWireSelection(value);
  }

  private issueSelection(input: {
    workspace_id: string;
    participant_ref: string;
    selection: NurtureInstitutionKnowledgeTargetSelectionV1;
  }): string | null {
    const selection = parseSelection(input.selection);
    if (!selection || !opaqueId(input.workspace_id) || !opaqueId(input.participant_ref)) return null;
    const payload = Buffer.from(JSON.stringify({
      k: selection.target_kind,
      r: selection.target_ref,
      a: selection.role_assignment_ref,
      ...(selection.target_version === undefined ? {} : { v: selection.target_version }),
    }), "utf8").toString("base64url");
    const ref = `${OPTION_VERSION}.${payload}.${this.tag(
      input.workspace_id,
      input.participant_ref,
      payload,
    )}`;
    return ref.length <= 512 ? ref : null;
  }

  private tag(workspaceId: string, participantRef: string, payload: string): string {
    return createHmac("sha256", this.integrityKey)
      .update(OPTION_CONTEXT, "utf8")
      .update(workspaceId, "utf8")
      .update("\0", "utf8")
      .update(participantRef, "utf8")
      .update("\0", "utf8")
      .update(payload, "utf8")
      .digest("base64url");
  }
}

function parseSelection(value: unknown): NurtureInstitutionKnowledgeTargetSelectionV1 | null {
  if (!record(value)) return null;
  const keys = Object.keys(value).filter((key) => value[key] !== undefined);
  if (
    !keys.every((key) => [
      "target_kind",
      "target_ref",
      "role_assignment_ref",
      "target_version",
    ].includes(key))
    || keys.length < 3
    || !["institution", "item", "revision"].includes(String(value.target_kind))
    || !opaqueId(value.target_ref)
    || !opaqueId(value.role_assignment_ref)
    || (value.target_version !== undefined && !nonNegativeVersion(value.target_version))
  ) return null;
  return {
    target_kind: value.target_kind as NurtureInstitutionKnowledgeTargetKind,
    target_ref: value.target_ref,
    role_assignment_ref: value.role_assignment_ref,
    ...(value.target_version === undefined ? {} : { target_version: value.target_version }),
  };
}

function parseWireSelection(value: unknown): NurtureInstitutionKnowledgeTargetSelectionV1 | null {
  if (!record(value)) return null;
  const keys = Object.keys(value).sort();
  const expected = value.v === undefined ? ["a", "k", "r"] : ["a", "k", "r", "v"];
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    return null;
  }
  return parseSelection({
    target_kind: value.k,
    target_ref: value.r,
    role_assignment_ref: value.a,
    ...(value.v === undefined ? {} : { target_version: value.v }),
  });
}

function validCurrentTarget(target: NurtureInstitutionKnowledgeCurrentTargetV1): boolean {
  return opaqueId(target.institution_ref)
    && nonNegativeVersion(target.institution_revision)
    && nonNegativeVersion(target.target_revision);
}

function validRole(
  role: NurtureInstitutionKnowledgeInstitutionAdminRoleV1,
  expectedRoleAssignmentRef: string,
  target: NurtureInstitutionKnowledgeCurrentTargetV1,
): boolean {
  return role.role_assignment_ref === expectedRoleAssignmentRef
    && role.institution_ref === target.institution_ref
    && role.institution_revision === target.institution_revision
    && nonNegativeVersion(role.role_assignment_revision)
    && nonNegativeVersion(role.institution_revision);
}

function participantFailure(error: unknown):
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string } {
  if (!(error instanceof NurtureParticipantResolutionError)) {
    return unavailable("institution_knowledge_participant_owner_unavailable");
  }
  if (error.code === "participant_ambiguous" || error.code === "participant_binding_invalid") {
    return unavailable(`institution_knowledge_${error.code}`);
  }
  return denied(`institution_knowledge_${error.code}`);
}

function denied(reason_code: string) {
  return { status: "denied" as const, reason_code };
}

function unavailable(reason_code: string) {
  return { status: "unavailable" as const, reason_code };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string"
    && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}

function nonNegativeVersion(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.length === rightBytes.length
    && leftBytes.length === 43
    && timingSafeEqual(leftBytes, rightBytes);
}
