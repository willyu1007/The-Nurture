import { createHmac, timingSafeEqual } from "node:crypto";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import {
  NurtureParticipantResolutionError,
  resolveAuthorizedNurtureParticipant,
  type NurtureParticipantAuthorityReader,
  type NurtureParticipantBindingReader,
} from "./c30/participant-binding.js";
import {
  NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS,
  NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS,
  type NurtureEnrollmentJourneyFormalAuthorityResolverV1,
} from "./enrollment-journey-formal-ingress-contract.js";
import type {
  NurtureEnrollmentJourneySurfaceCapabilityKey,
  NurtureEnrollmentJourneyTargetOptionIssuer,
} from "./enrollment-journey-surfaces.js";

/**
 * `prospective_contact` binds the Host-owned contact selection for
 * `start_enrollment_inquiry` (`current_prospective_contact_authority` head);
 * `care_group` binds capacity targets; `journey` binds one existing workflow
 * plus its waitlist-entry head. The option selects — it never grants.
 */
export type NurtureEnrollmentJourneyTargetSelectionV1 =
  | { target_kind: "care_group"; target_ref: string }
  | {
      target_kind: "journey";
      target_ref: string;
      waitlist_entry_ref: string;
      waitlist_entry_head: number;
    }
  | {
      target_kind: "prospective_contact";
      target_ref: string;
      institution_ref: string;
      contact_version: number;
    };

export type NurtureEnrollmentJourneyTargetOptionResolverV1 = {
  resolve(input: {
    workspace_id: string;
    participant_ref: string;
    target_option_ref: string;
  }): NurtureEnrollmentJourneyTargetSelectionV1 | null;
};

export type NurtureEnrollmentJourneyCurrentTargetV1 = {
  institution_ref: string;
  institution_revision: number;
  target_revision: number;
  host_contact_ref?: CanonicalRef;
};

export type NurtureEnrollmentJourneyCurrentTargetReaderV1 = {
  resolveCurrent(input: {
    workspace_id: string;
    capability_key: NurtureEnrollmentJourneySurfaceCapabilityKey;
    selection: NurtureEnrollmentJourneyTargetSelectionV1;
    at: string;
  }): Promise<
    | { status: "resolved"; target: NurtureEnrollmentJourneyCurrentTargetV1 }
    | { status: "not_found" | "stale" }
  >;
};

export type NurtureEnrollmentJourneyAdminRoleV1 = {
  role_assignment_ref: string;
  role_assignment_revision: number;
  institution_ref: string;
  institution_revision: number;
};

/**
 * The enrollment option carries no role-assignment pin, so the reader loads
 * the participant's current institution_admin assignments at the target
 * institution; the owner requires exactly one — never an ordering choice.
 */
export type NurtureEnrollmentJourneyAdminRoleReaderV1 = {
  readCurrent(input: {
    workspace_id: string;
    participant_ref: string;
    institution_ref: string;
    at: string;
    limit: 2;
  }): Promise<readonly NurtureEnrollmentJourneyAdminRoleV1[]>;
};

type NurtureEnrollmentJourneyCurrentAuthorityOwnerDeps = {
  participantBindings: NurtureParticipantBindingReader;
  participantAuthority: NurtureParticipantAuthorityReader;
  targetOptions: NurtureEnrollmentJourneyTargetOptionResolverV1;
  targets: NurtureEnrollmentJourneyCurrentTargetReaderV1;
  roles: NurtureEnrollmentJourneyAdminRoleReaderV1;
  now?: () => Date;
};

const PREPARE_EXECUTE = Object.freeze([
  "prepare_enrollment_journey_command",
  "execute_prepared_enrollment_journey_command",
]);

const OPERATION_BY_CAPABILITY: Readonly<
  Record<NurtureEnrollmentJourneySurfaceCapabilityKey, readonly string[]>
> = Object.freeze({
  query_institution_enrollment_journey: Object.freeze(["query_enrollment_journey"]),
  query_institution_capacity_waitlist: Object.freeze(["query_enrollment_journey"]),
  query_guardian_enrollment_waitlist: Object.freeze(["query_enrollment_journey"]),
  ...Object.fromEntries(
    NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS.map((key) => [key, PREPARE_EXECUTE]),
  ),
  ...Object.fromEntries(
    NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS.map((key) => [
      key,
      Object.freeze(["execute_prepared_enrollment_journey_command"]),
    ]),
  ),
} as Record<NurtureEnrollmentJourneySurfaceCapabilityKey, readonly string[]>);

const TARGET_KIND_BY_CAPABILITY: Readonly<
  Record<
    NurtureEnrollmentJourneySurfaceCapabilityKey,
    NurtureEnrollmentJourneyTargetSelectionV1["target_kind"]
  >
> = Object.freeze({
  query_institution_capacity_waitlist: "care_group",
  start_enrollment_inquiry: "prospective_contact",
  ...Object.fromEntries(
    (
      [
        "query_institution_enrollment_journey",
        "query_guardian_enrollment_waitlist",
        ...NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS.filter(
          (key) => key !== "start_enrollment_inquiry",
        ),
        ...NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS,
      ] as const
    ).map((key) => [key, "journey"]),
  ),
} as Record<
  NurtureEnrollmentJourneySurfaceCapabilityKey,
  NurtureEnrollmentJourneyTargetSelectionV1["target_kind"]
>);

/**
 * Resolves a verified My-Chat principal to one exact current Admin assignment
 * or one current Host Guardian action bound to the selected journey.
 */
export class NurtureEnrollmentJourneyCurrentAuthorityOwner
implements NurtureEnrollmentJourneyFormalAuthorityResolverV1 {
  private readonly now: () => Date;

  constructor(private readonly deps: NurtureEnrollmentJourneyCurrentAuthorityOwnerDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async resolveCurrent(
    input: Parameters<NurtureEnrollmentJourneyFormalAuthorityResolverV1["resolveCurrent"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyFormalAuthorityResolverV1["resolveCurrent"]> {
    if (
      input.principal.principal_origin !== "interactive_session"
      || !opaqueId(input.invocation_request_id)
      || !OPERATION_BY_CAPABILITY[input.capability_key]?.includes(input.declared_operation_key)
    ) {
      return denied("enrollment_journey_invocation_not_authorized");
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
      return denied("enrollment_journey_target_option_invalid");
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
      return unavailable("enrollment_journey_target_owner_unavailable");
    }
    if (currentTarget.status !== "resolved") {
      return denied(currentTarget.status === "stale"
        ? "enrollment_journey_target_option_stale"
        : "enrollment_journey_target_not_found");
    }
    if (!validCurrentTarget(currentTarget.target)) {
      return unavailable("enrollment_journey_target_owner_invalid");
    }

    if (input.guardian_owner_carrier) {
      const action = input.guardian_owner_carrier.guardianAction;
      const contact = currentTarget.target.host_contact_ref;
      if (
        input.client_surface === "web_run_workbench"
        || selection.target_kind !== "journey"
        || input.principal.actor_ref.namespace !== "my_chat"
        || input.principal.actor_ref.object_type !== "actor"
        || action.actor_ref.namespace !== "my_chat"
        || action.actor_ref.object_type !== "actor"
        || action.actor_ref.object_id !== input.principal.actor_ref.object_id
        || !contact
        || action.contact_ref.namespace !== "my_chat"
        || action.contact_ref.object_type !== "nurture_prospective_contact"
        || contact.namespace !== "my_chat"
        || contact.object_type !== "nurture_prospective_contact"
        || action.contact_ref.object_id !== contact.object_id
        || (action.contact_ref.version ?? 0) < (contact.version ?? 0)
      ) return denied("enrollment_journey_guardian_action_not_current");
      return {
        status: "resolved",
        authority: {
          workspace_id: workspaceId,
          participant_ref: participantId,
          institution_ref: currentTarget.target.institution_ref,
          active_role: "guardian",
          surface_key: input.client_surface === "chat_workflow_control"
            ? "guardian_nurture_chat"
            : "guardian_family_board",
          authority_version: [
            "nurture.ej-guardian-authority.v1",
            `b${participant.binding_revision}`,
            `p${participant.authority_revision}`,
            `i${currentTarget.target.institution_revision}`,
            `t${currentTarget.target.target_revision}`,
            `c${action.contact_ref.version ?? 0}`,
            `a${action.action_ref.version ?? 0}`,
          ].join("."),
          evaluated_at: evaluatedAt,
        },
      };
    }

    if (
      input.client_surface === "chat_workflow_control"
      || (input.client_surface === "mobile_dashboard"
        && !input.capability_key.startsWith("query_institution_"))
    ) return denied("enrollment_journey_invocation_not_authorized");

    let roles;
    try {
      roles = await this.deps.roles.readCurrent({
        workspace_id: workspaceId,
        participant_ref: participantId,
        institution_ref: currentTarget.target.institution_ref,
        at: evaluatedAt,
        limit: 2,
      });
    } catch {
      return unavailable("enrollment_journey_role_owner_unavailable");
    }
    if (roles.length === 0) return denied("institution_admin_role_not_current");
    const role = roles[0];
    if (roles.length !== 1 || !role || !validRole(role, currentTarget.target)) {
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
        surface_key: input.client_surface === "mobile_dashboard"
          ? "institution_board"
          : "institution_workbench",
        authority_version: [
          "nurture.ej-authority.v1",
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

const OPTION_VERSION = "ej1";
const OPTION_CONTEXT = "nurture.enrollment-journey-target-option.v1\0";

/**
 * Actor-bound target selection codec. Its authenticated payload is routing
 * input only; the current-target reader must still re-read the target and its
 * owning institution before authority can resolve.
 */
export class NurtureEnrollmentJourneyTargetOptionCodec
implements NurtureEnrollmentJourneyTargetOptionIssuer,
NurtureEnrollmentJourneyTargetOptionResolverV1 {
  constructor(private readonly integrityKey: string) {
    if (Buffer.byteLength(integrityKey, "utf8") < 32) {
      throw new Error("enrollment journey option integrity key must be at least 32 bytes");
    }
  }

  issue(input: {
    workspace_id: string;
    actor_participant_ref: string;
  } & ({
    kind: "care_group";
    target_ref: string;
  } | {
    kind: "journey";
    target_ref: string;
    waitlist_entry_ref: string;
    waitlist_entry_head: number;
  })): string | null {
    const selection: NurtureEnrollmentJourneyTargetSelectionV1 =
      input.kind === "care_group"
        ? { target_kind: "care_group", target_ref: input.target_ref }
        : {
            target_kind: "journey",
            target_ref: input.target_ref,
            waitlist_entry_ref: input.waitlist_entry_ref,
            waitlist_entry_head: input.waitlist_entry_head,
          };
    return this.issueSelection({
      workspace_id: input.workspace_id,
      participant_ref: input.actor_participant_ref,
      selection,
    });
  }

  issueProspectiveContact(input: {
    workspace_id: string;
    participant_ref: string;
    contact_object_id: string;
    contact_version: number;
    institution_ref: string;
  }): string | null {
    return this.issueSelection({
      workspace_id: input.workspace_id,
      participant_ref: input.participant_ref,
      selection: {
        target_kind: "prospective_contact",
        target_ref: input.contact_object_id,
        institution_ref: input.institution_ref,
        contact_version: input.contact_version,
      },
    });
  }

  resolve(input: {
    workspace_id: string;
    participant_ref: string;
    target_option_ref: string;
  }): NurtureEnrollmentJourneyTargetSelectionV1 | null {
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
    selection: NurtureEnrollmentJourneyTargetSelectionV1;
  }): string | null {
    const selection = parseSelection(input.selection);
    if (!selection || !opaqueId(input.workspace_id) || !opaqueId(input.participant_ref)) return null;
    const payload = Buffer.from(JSON.stringify(wireSelection(selection)), "utf8")
      .toString("base64url");
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

function wireSelection(
  selection: NurtureEnrollmentJourneyTargetSelectionV1,
): Record<string, unknown> {
  if (selection.target_kind === "care_group") {
    return { k: "c", r: selection.target_ref };
  }
  if (selection.target_kind === "journey") {
    return {
      k: "j",
      r: selection.target_ref,
      w: selection.waitlist_entry_ref,
      h: selection.waitlist_entry_head,
    };
  }
  return {
    k: "p",
    r: selection.target_ref,
    i: selection.institution_ref,
    v: selection.contact_version,
  };
}

function parseWireSelection(value: unknown): NurtureEnrollmentJourneyTargetSelectionV1 | null {
  if (!record(value)) return null;
  const keys = Object.keys(value).sort();
  if (value.k === "c") {
    if (keys.length !== 2 || keys[0] !== "k" || keys[1] !== "r") return null;
    return parseSelection({ target_kind: "care_group", target_ref: value.r });
  }
  if (value.k === "j") {
    if (keys.join(",") !== "h,k,r,w") return null;
    return parseSelection({
      target_kind: "journey",
      target_ref: value.r,
      waitlist_entry_ref: value.w,
      waitlist_entry_head: value.h,
    });
  }
  if (value.k === "p") {
    if (keys.join(",") !== "i,k,r,v") return null;
    return parseSelection({
      target_kind: "prospective_contact",
      target_ref: value.r,
      institution_ref: value.i,
      contact_version: value.v,
    });
  }
  return null;
}

function parseSelection(value: unknown): NurtureEnrollmentJourneyTargetSelectionV1 | null {
  if (!record(value) || !opaqueId(value.target_ref)) return null;
  if (value.target_kind === "care_group") {
    return exactMemberCount(value, 2)
      ? { target_kind: "care_group", target_ref: value.target_ref }
      : null;
  }
  if (value.target_kind === "journey") {
    return exactMemberCount(value, 4)
      && opaqueId(value.waitlist_entry_ref)
      && nonNegativeVersion(value.waitlist_entry_head)
      ? {
          target_kind: "journey",
          target_ref: value.target_ref,
          waitlist_entry_ref: value.waitlist_entry_ref,
          waitlist_entry_head: value.waitlist_entry_head,
        }
      : null;
  }
  if (value.target_kind === "prospective_contact") {
    return exactMemberCount(value, 4)
      && opaqueId(value.institution_ref)
      && nonNegativeVersion(value.contact_version)
      ? {
          target_kind: "prospective_contact",
          target_ref: value.target_ref,
          institution_ref: value.institution_ref,
          contact_version: value.contact_version,
        }
      : null;
  }
  return null;
}

function exactMemberCount(value: Record<string, unknown>, expected: number): boolean {
  return Object.keys(value).filter((key) => value[key] !== undefined).length === expected;
}

function validCurrentTarget(target: NurtureEnrollmentJourneyCurrentTargetV1): boolean {
  return opaqueId(target.institution_ref)
    && nonNegativeVersion(target.institution_revision)
    && nonNegativeVersion(target.target_revision)
    && (target.host_contact_ref === undefined
      || validHostContactRef(target.host_contact_ref));
}

function validHostContactRef(value: unknown): value is CanonicalRef {
  try {
    assertCanonicalRef(value);
  } catch {
    return false;
  }
  return value.namespace === "my_chat"
    && value.object_type === "nurture_prospective_contact";
}

function validRole(
  role: NurtureEnrollmentJourneyAdminRoleV1,
  target: NurtureEnrollmentJourneyCurrentTargetV1,
): boolean {
  return opaqueId(role.role_assignment_ref)
    && role.institution_ref === target.institution_ref
    && role.institution_revision === target.institution_revision
    && nonNegativeVersion(role.role_assignment_revision)
    && nonNegativeVersion(role.institution_revision);
}

function participantFailure(error: unknown):
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string } {
  if (!(error instanceof NurtureParticipantResolutionError)) {
    return unavailable("enrollment_journey_participant_owner_unavailable");
  }
  if (error.code === "participant_ambiguous" || error.code === "participant_binding_invalid") {
    return unavailable(`enrollment_journey_${error.code}`);
  }
  return denied(`enrollment_journey_${error.code}`);
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
