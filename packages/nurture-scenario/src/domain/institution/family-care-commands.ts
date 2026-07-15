import type { DomainContextRef } from "@my-chat/workflow-contracts";
import type {
  NurtureCommandPreconditionDecision,
  NurtureCommandSpec,
  NurtureCommandTransaction,
} from "../commands/command-kernel.js";
import type {
  FamilyCareCancelRoutePayload,
  FamilyCareGrantRevokePayload,
  FamilyCareItemActionFacts,
  FamilyCareItemActionPayload,
  FamilyCareRedactionPayload,
  FamilyCareReplyPayload,
  FamilyInputRoutePayload,
} from "./family-care-transaction.js";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const REASON_CODE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const DATA_CLASSES = new Set([
  "daily_care_log",
  "care_day_note",
  "care_constraint_update",
  "family_care_question",
  "family_follow_up_request",
]);
const CATEGORIES = new Set([
  "today_attention",
  "constraint",
  "question",
  "follow_up",
  "schedule",
  "admin",
  "other",
]);
const URGENCIES = new Set([
  "normal",
  "today_attention",
  "time_sensitive",
  "urgent_non_emergency",
]);
const REF_KEYS = new Set([
  "namespace",
  "consumer_scenario_key",
  "object_type",
  "object_id",
  "version",
  "owner_scope",
  "canonical_ref",
]);
const validId = (value: unknown): value is string => typeof value === "string" && ID.test(value);

const ref = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  namespace: "nurture",
  consumer_scenario_key: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
  owner_scope: "workspace",
});

const validRef = (value: DomainContextRef | undefined): value is DomainContextRef => {
  if (!value || typeof value !== "object") return false;
  if (Object.keys(value).some((key) => !REF_KEYS.has(key))) return false;
  if (
    !validId(value.namespace) ||
    !validId(value.object_type) ||
    !validId(value.object_id) ||
    !["workspace", "organization", "platform", "external"].includes(value.owner_scope) ||
    (value.consumer_scenario_key !== undefined && !validId(value.consumer_scenario_key)) ||
    (value.version !== undefined &&
      (!Number.isSafeInteger(value.version) || value.version < 0))
  ) {
    return false;
  }
  if (value.canonical_ref) {
    if (
      Object.keys(value.canonical_ref).some(
        (key) => !["service", "object_type", "object_id"].includes(key),
      ) ||
      !validId(value.canonical_ref.service) ||
      !validId(value.canonical_ref.object_type) ||
      !validId(value.canonical_ref.object_id)
    ) {
      return false;
    }
  }
  return JSON.stringify(value).length <= 2_000;
};

const validProtectedContentRef = (value: DomainContextRef | undefined): value is DomainContextRef =>
  validRef(value) &&
  value.namespace === "nurture" &&
  value.object_type === "protected_message_content" &&
  value.owner_scope === "workspace";

const validAttachmentRef = (value: DomainContextRef | undefined): value is DomainContextRef =>
  validRef(value) &&
  value.namespace === "nurture" &&
  value.object_type === "media_asset_ref" &&
  value.owner_scope === "workspace";

const validWorkflowDriverRef = (value: DomainContextRef | undefined): value is DomainContextRef =>
  validRef(value) &&
  value.namespace === "host.workflow" &&
  value.consumer_scenario_key === "nurture" &&
  value.object_type === "workflow_step" &&
  value.owner_scope === "workspace" &&
  value.version === undefined;

const requireFamilyCare = (
  transaction: NurtureCommandTransaction,
): NurtureCommandPreconditionDecision | null =>
  transaction.familyCare
    ? null
    : { status: "blocked", reason_code: "institution_command_adapter_missing" };

const commandIdentityValid = (input: {
  participant_id: string;
  child_care_process_id?: string;
  context: { business_actor_ref: string; child_care_process_id?: string };
}): boolean =>
  input.participant_id === input.context.business_actor_ref &&
  Boolean(input.context.child_care_process_id) &&
  input.child_care_process_id === input.context.child_care_process_id;

const grantDecision = (input: {
  status: "active" | "revoked" | "missing";
  directions: string[];
  data_classes: string[];
  required_direction: string;
  data_class: string;
}): NurtureCommandPreconditionDecision => {
  if (input.status === "revoked") return { status: "blocked", reason_code: "grant_revoked" };
  if (input.status !== "active") return { status: "blocked", reason_code: "grant_missing" };
  if (
    !input.directions.includes(input.required_direction) ||
    !input.data_classes.includes(input.data_class)
  ) {
    return { status: "blocked", reason_code: "data_class_mismatch" };
  }
  return { status: "ready" };
};

export const revokeFamilyCareGrantSpec: NurtureCommandSpec<FamilyCareGrantRevokePayload> = {
  command_key: "nurture.family_care.revoke_grant",
  command_scope: "child_link_grant",
  contract_version: 1,
  canonicalize: (input) => input,
  async checkPreconditions(transaction, input, context) {
    const missing = requireFamilyCare(transaction);
    if (missing) return missing;
    if (
      !input ||
      typeof input !== "object" ||
      !validId(input.participant_id) ||
      !validId(input.role_assignment_id) ||
      !validId(input.grant_id) ||
      !Number.isSafeInteger(input.expected_version) ||
      input.expected_version < 0 ||
      typeof input.reason_code !== "string" ||
      !REASON_CODE.test(input.reason_code)
    ) {
      return { status: "invalid", reason_code: "invalid_grant_revoke" };
    }
    const facts = await transaction.familyCare!.loadFamilyCareGrantRevokeFacts({
      ...input,
      workspace_id: context.workspace_id,
    });
    if (!facts.participant_active) return { status: "blocked", reason_code: "participant_missing" };
    if (!facts.guardian_role_active || !facts.actor_owns_grant || !facts.role_reaches_grant) {
      return { status: "blocked", reason_code: "role_missing" };
    }
    if (
      !commandIdentityValid({
        participant_id: input.participant_id,
        child_care_process_id: facts.child_care_process_id,
        context,
      })
    ) {
      return { status: "invalid", reason_code: "invalid_command_identity" };
    }
    if (facts.grant_status === "revoked") {
      return { status: "already_satisfied", output_refs: facts.output_refs };
    }
    if (facts.grant_status !== "active") {
      return { status: "blocked", reason_code: "grant_not_revocable" };
    }
    return facts.grant_version === input.expected_version
      ? { status: "ready" }
      : { status: "conflict", reason_code: "grant_version_conflict" };
  },
  async apply(transaction, input, context) {
    const applied = await transaction.familyCare!.revokeFamilyCareGrant({
      ...input,
      workspace_id: context.workspace_id,
    });
    return {
      output_refs: [
        applied.grant_ref,
        ...applied.affected_item_refs,
        ...applied.affected_receipt_refs,
      ],
    };
  },
};

const validateFamilyInput = (input: FamilyInputRoutePayload): boolean =>
  Boolean(input && typeof input === "object") &&
  [
    input.participant_id,
    input.role_assignment_id,
    input.child_care_process_id,
    input.family_id,
    input.enrollment_id,
    input.care_group_id,
    input.thread_id,
    input.routing_attempt_key,
  ].every(validId) &&
  DATA_CLASSES.has(input.data_class) &&
  CATEGORIES.has(input.category) &&
  URGENCIES.has(input.urgency) &&
  typeof input.safe_summary === "string" &&
  input.safe_summary.trim().length > 0 &&
  input.safe_summary.length <= 240 &&
  validProtectedContentRef(input.protected_content_ref) &&
  Array.isArray(input.attachment_refs) &&
  input.attachment_refs.length <= 10 &&
  input.attachment_refs.every(validAttachmentRef) &&
  ["mobile", "web", "system_import", "workflow"].includes(input.source_surface) &&
  typeof input.requires_ack === "boolean" &&
  typeof input.requires_reply === "boolean" &&
  (input.route_mode === "immediate" ||
    (input.route_mode === "pending_workflow" && validWorkflowDriverRef(input.pending_driver_ref)));

const validateItemAction = (input: FamilyCareItemActionPayload): boolean =>
  Boolean(input && typeof input === "object") &&
  [input.participant_id, input.role_assignment_id, input.item_id].every(validId) &&
  Number.isSafeInteger(input.expected_version) &&
  input.expected_version >= 0;

const outputRefs = (value: {
  message_ref: DomainContextRef;
  receipt_ref: DomainContextRef;
  item_ref?: DomainContextRef;
  attention_ref?: DomainContextRef;
}): DomainContextRef[] =>
  [value.message_ref, value.receipt_ref, value.item_ref, value.attention_ref].filter(
    (entry): entry is DomainContextRef => entry !== undefined,
  );

export const familyInputRouteCommandKey =
  "nurture.family_care.capture_and_route" as const;

export const familyInputRouteSpec: NurtureCommandSpec<FamilyInputRoutePayload> = {
  command_key: familyInputRouteCommandKey,
  command_scope: "family_care",
  contract_version: 1,
  canonicalize: (input) => input,
  async checkPreconditions(transaction, input, context) {
    const missing = requireFamilyCare(transaction);
    if (missing) return missing;
    if (!validateFamilyInput(input)) return { status: "invalid", reason_code: "invalid_family_input" };
    if (
      !commandIdentityValid({
        participant_id: input.participant_id,
        child_care_process_id: input.child_care_process_id,
        context,
      })
    ) {
      return { status: "invalid", reason_code: "invalid_command_identity" };
    }
    const facts = await transaction.familyCare!.loadFamilyInputRouteFacts({
      ...input,
      workspace_id: context.workspace_id,
    });
    if (!facts.participant_active) return { status: "blocked", reason_code: "participant_missing" };
    if (!facts.guardian_role_active) return { status: "blocked", reason_code: "role_missing" };
    if (!facts.role_reaches_family) return { status: "blocked", reason_code: "scope_mismatch" };
    if (!facts.child_process_active) return { status: "blocked", reason_code: "child_not_visible" };
    if (!facts.family_active) return { status: "blocked", reason_code: "family_not_active" };
    if (!facts.enrollment_active) return { status: "blocked", reason_code: "enrollment_inactive" };
    if (!facts.thread_active || !facts.thread_membership_active) {
      return { status: "blocked", reason_code: "thread_inactive" };
    }
    if (input.route_mode === "pending_workflow") return { status: "ready" };
    return grantDecision({
      ...facts.grant,
      required_direction: "family_to_org",
      data_class: input.data_class,
    });
  },
  async apply(transaction, input, context) {
    return {
      output_refs: outputRefs(
        await transaction.familyCare!.applyFamilyInputRoute({
          ...input,
          workspace_id: context.workspace_id,
        }),
      ),
    };
  },
  handoff: {
    capability_key: "class_family_inbox",
    entrypoint_key: "capture_family_input",
    handoff_key: "user_attention",
    requested_purpose: "user_attention",
    validate_input: (input) =>
      input.route_mode === "immediate" ? null : "invalid_handoff_activation_route",
    select_source_context_refs: (_input, refs) => {
      const sourceTypes = [
        "family_care_message",
        "child_link_receipt",
        "family_care_item",
      ];
      return sourceTypes.map((objectType) => {
        const matches = refs.filter(
          (candidate) =>
            candidate.namespace === "nurture" && candidate.object_type === objectType,
        );
        if (matches.length !== 1) {
          throw new Error(`user_attention requires exactly one ${objectType} ref`);
        }
        return matches[0]!;
      });
    },
  },
};

const itemActionDecision = (
  input: FamilyCareItemActionPayload,
  facts: FamilyCareItemActionFacts,
  context: { business_actor_ref: string; child_care_process_id?: string },
): NurtureCommandPreconditionDecision => {
  if (!facts.participant_active) return { status: "blocked", reason_code: "participant_missing" };
  if (!facts.caregiver_role_active) return { status: "blocked", reason_code: "role_missing" };
  if (!facts.caregiver_scope_matches) return { status: "blocked", reason_code: "care_group_mismatch" };
  if (!facts.enrollment_active) return { status: "blocked", reason_code: "enrollment_inactive" };
  if (!facts.thread_active || !facts.thread_membership_active) {
    return { status: "blocked", reason_code: "thread_inactive" };
  }
  if (facts.item_status === "missing") return { status: "blocked", reason_code: "item_missing" };
  if (
    !commandIdentityValid({
      participant_id: input.participant_id,
      child_care_process_id: facts.child_care_process_id,
      context,
    })
  ) {
    return { status: "invalid", reason_code: "invalid_command_identity" };
  }
  if (facts.item_version !== input.expected_version) {
    return { status: "conflict", reason_code: "item_version_conflict" };
  }
  if (!facts.item_data_class) return { status: "blocked", reason_code: "data_class_mismatch" };
  return grantDecision({
    ...facts.grant,
    required_direction: input.required_direction,
    data_class: facts.item_data_class,
  });
};

export const acknowledgeFamilyCareItemSpec: NurtureCommandSpec<FamilyCareItemActionPayload> = {
  command_key: "nurture.family_care.acknowledge_item",
  command_scope: "family_care_item",
  contract_version: 1,
  canonicalize: (input) => input,
  async checkPreconditions(transaction, input, context) {
    const missing = requireFamilyCare(transaction);
    if (missing) return missing;
    if (
      !validateItemAction(input) ||
      input.required_direction !== "family_to_org"
    ) {
      return { status: "invalid", reason_code: "invalid_item_action" };
    }
    const facts = await transaction.familyCare!.loadFamilyCareItemActionFacts({
      ...input,
      workspace_id: context.workspace_id,
    });
    const policy = itemActionDecision(input, facts, context);
    if (policy.status !== "ready") return policy;
    if (["acknowledged", "replied", "followed_up", "closed"].includes(facts.item_status)) {
      return { status: "already_satisfied", output_refs: facts.output_refs };
    }
    if (!["open"].includes(facts.item_status)) {
      return { status: "blocked", reason_code: "item_not_actionable" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const applied = await transaction.familyCare!.acknowledgeFamilyCareItem({
      ...input,
      workspace_id: context.workspace_id,
    });
    return {
      output_refs: [applied.item_ref, applied.item_event_ref, applied.receipt_ref].filter(
        (entry): entry is DomainContextRef => entry !== undefined,
      ),
    };
  },
};

export const replyFamilyCareItemSpec: NurtureCommandSpec<FamilyCareReplyPayload> = {
  command_key: "nurture.family_care.reply_item",
  command_scope: "family_care_item",
  contract_version: 1,
  canonicalize: (input) => input,
  async checkPreconditions(transaction, input, context) {
    const missing = requireFamilyCare(transaction);
    if (missing) return missing;
    if (
      !validateItemAction(input) ||
      !validProtectedContentRef(input.protected_content_ref) ||
      typeof input.safe_summary !== "string" ||
      !input.safe_summary.trim() ||
      input.safe_summary.length > 240 ||
      typeof input.routing_attempt_key !== "string" ||
      !validId(input.routing_attempt_key) ||
      input.required_direction !== "org_to_family"
    ) {
      return { status: "invalid", reason_code: "invalid_family_reply" };
    }
    const facts = await transaction.familyCare!.loadFamilyCareItemActionFacts({
      ...input,
      workspace_id: context.workspace_id,
    });
    const policy = itemActionDecision(input, facts, context);
    if (policy.status !== "ready") return policy;
    if (!["open", "acknowledged", "waiting_for_family"].includes(facts.item_status)) {
      return { status: "conflict", reason_code: "item_not_replyable" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const applied = await transaction.familyCare!.replyToFamilyCareItem({
      ...input,
      workspace_id: context.workspace_id,
    });
    return { output_refs: [applied.item_ref, applied.item_event_ref, applied.message_ref, applied.receipt_ref] };
  },
};

export const redactFamilyCareMessageSpec: NurtureCommandSpec<FamilyCareRedactionPayload> = {
  command_key: "nurture.family_care.redact_message",
  command_scope: "family_care_message",
  contract_version: 1,
  canonicalize: (input) => input,
  async checkPreconditions(transaction, input, context) {
    const missing = requireFamilyCare(transaction);
    if (missing) return missing;
    if (
      !ID.test(input.participant_id) ||
      !ID.test(input.role_assignment_id) ||
      !ID.test(input.message_id) ||
      typeof input.reason_code !== "string" ||
      !REASON_CODE.test(input.reason_code) ||
      !Number.isSafeInteger(input.expected_version) ||
      input.expected_version < 0
    ) {
      return { status: "invalid", reason_code: "invalid_message_redaction" };
    }
    const facts = await transaction.familyCare!.loadFamilyCareRedactionFacts({
      ...input,
      workspace_id: context.workspace_id,
    });
    if (!facts.participant_active || !facts.author_role_active || !facts.actor_is_author) {
      return { status: "blocked", reason_code: "role_missing" };
    }
    if (
      !commandIdentityValid({
        participant_id: input.participant_id,
        child_care_process_id: facts.child_care_process_id,
        context,
      })
    ) {
      return { status: "invalid", reason_code: "invalid_command_identity" };
    }
    if (facts.message_status === "redacted") {
      return { status: "already_satisfied", output_refs: facts.output_refs };
    }
    if (facts.message_status !== "sent") {
      return { status: "blocked", reason_code: "message_not_redactable" };
    }
    return facts.message_version === input.expected_version
      ? { status: "ready" }
      : { status: "conflict", reason_code: "message_version_conflict" };
  },
  async apply(transaction, input, context) {
    const applied = await transaction.familyCare!.redactFamilyCareMessage({
      ...input,
      workspace_id: context.workspace_id,
    });
    return {
      output_refs: [
        applied.message_ref,
        ...applied.affected_item_refs,
        ...applied.affected_receipt_refs,
      ],
    };
  },
};

export const cancelFamilyCareRouteSpec: NurtureCommandSpec<FamilyCareCancelRoutePayload> = {
  command_key: "nurture.family_care.cancel_route",
  command_scope: "child_link_receipt",
  contract_version: 1,
  canonicalize: (input) => input,
  async checkPreconditions(transaction, input, context) {
    const missing = requireFamilyCare(transaction);
    if (missing) return missing;
    if (
      !ID.test(input.participant_id) ||
      !ID.test(input.role_assignment_id) ||
      !ID.test(input.receipt_id) ||
      !Number.isSafeInteger(input.expected_version) ||
      input.expected_version < 0
    ) {
      return { status: "invalid", reason_code: "invalid_route_cancel" };
    }
    const facts = await transaction.familyCare!.loadFamilyCareCancelRouteFacts({
      ...input,
      workspace_id: context.workspace_id,
    });
    if (!facts.participant_active || !facts.actor_owns_source) {
      return { status: "blocked", reason_code: "role_missing" };
    }
    if (
      !commandIdentityValid({
        participant_id: input.participant_id,
        child_care_process_id: facts.child_care_process_id,
        context,
      })
    ) {
      return { status: "invalid", reason_code: "invalid_command_identity" };
    }
    if (facts.receipt_status === "blocked" && facts.receipt_reason_code === "user_cancelled_before_delivery") {
      return { status: "already_satisfied", output_refs: facts.output_refs };
    }
    if (facts.receipt_status !== "pending") {
      return { status: "conflict", reason_code: "route_already_visible" };
    }
    return facts.receipt_version === input.expected_version
      ? { status: "ready" }
      : { status: "conflict", reason_code: "receipt_version_conflict" };
  },
  async apply(transaction, input, context) {
    const applied = await transaction.familyCare!.cancelFamilyCareRoute({
      ...input,
      workspace_id: context.workspace_id,
    });
    return { output_refs: [applied.receipt_ref] };
  },
};

export const familyCareRef = ref;
