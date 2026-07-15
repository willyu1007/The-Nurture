import type { DomainContextRef } from "@my-chat/workflow-contracts";
import type {
  NurtureFamilyInputWorkflowCommand,
  NurtureFamilyInputWorkflowPort,
  NurtureFamilyInputWorkflowSeedReader,
  NurtureMyChatActorIdentityReader,
} from "./deps.js";
import type { NurtureInstitutionContextRepository } from "./domain/institution/institution-context.js";
import type { FamilyInputRoutePayload } from "./domain/institution/family-care-transaction.js";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const OUTER_KEYS = new Set([
  "schema_version",
  "invocation_request_id",
  "command_request_id",
  "handoff_request_id",
  "handoff_expires_at",
  "payload",
]);
const PAYLOAD_KEYS = new Set([
  "participant_id",
  "role_assignment_id",
  "child_care_process_id",
  "family_id",
  "enrollment_id",
  "care_group_id",
  "thread_id",
  "data_class",
  "category",
  "urgency",
  "safe_summary",
  "protected_content_ref",
  "attachment_refs",
  "source_surface",
  "routing_attempt_key",
  "route_mode",
  "requires_ack",
  "requires_reply",
]);
const REF_KEYS = new Set([
  "namespace",
  "consumer_scenario_key",
  "object_type",
  "object_id",
  "version",
  "owner_scope",
]);
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

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const onlyKeys = (value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean =>
  Object.keys(value).every((key) => allowed.has(key));

const id = (value: unknown): value is string => typeof value === "string" && ID.test(value);

const isoInstant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const contextRef = (value: unknown): DomainContextRef | null => {
  const input = record(value);
  if (!input || !onlyKeys(input, REF_KEYS)) return null;
  if (
    !id(input.namespace) ||
    !id(input.object_type) ||
    !id(input.object_id) ||
    input.owner_scope !== "workspace" ||
    (input.consumer_scenario_key !== undefined && input.consumer_scenario_key !== "nurture") ||
    (input.version !== undefined && (!Number.isSafeInteger(input.version) || Number(input.version) < 0))
  ) {
    return null;
  }
  return {
    namespace: input.namespace,
    ...(input.consumer_scenario_key ? { consumer_scenario_key: "nurture" } : {}),
    object_type: input.object_type,
    object_id: input.object_id,
    ...(input.version !== undefined ? { version: Number(input.version) } : {}),
    owner_scope: "workspace",
  };
};

const parsePayload = (value: unknown): FamilyInputRoutePayload | null => {
  const input = record(value);
  if (!input || !onlyKeys(input, PAYLOAD_KEYS)) return null;
  const stringIds = [
    input.participant_id,
    input.role_assignment_id,
    input.child_care_process_id,
    input.family_id,
    input.enrollment_id,
    input.care_group_id,
    input.thread_id,
    input.routing_attempt_key,
  ];
  const protectedContentRef = contextRef(input.protected_content_ref);
  const attachmentRefs = Array.isArray(input.attachment_refs)
    ? input.attachment_refs.map(contextRef)
    : [];
  if (
    !stringIds.every(id) ||
    !DATA_CLASSES.has(String(input.data_class)) ||
    !CATEGORIES.has(String(input.category)) ||
    !URGENCIES.has(String(input.urgency)) ||
    typeof input.safe_summary !== "string" ||
    input.safe_summary.trim().length === 0 ||
    input.safe_summary.length > 240 ||
    !protectedContentRef ||
    !Array.isArray(input.attachment_refs) ||
    attachmentRefs.length > 10 ||
    attachmentRefs.some((entry) => entry === null) ||
    !["mobile", "web", "system_import", "workflow"].includes(String(input.source_surface)) ||
    input.route_mode !== "immediate" ||
    typeof input.requires_ack !== "boolean" ||
    typeof input.requires_reply !== "boolean"
  ) {
    return null;
  }
  return {
    participant_id: input.participant_id as string,
    role_assignment_id: input.role_assignment_id as string,
    child_care_process_id: input.child_care_process_id as string,
    family_id: input.family_id as string,
    enrollment_id: input.enrollment_id as string,
    care_group_id: input.care_group_id as string,
    thread_id: input.thread_id as string,
    data_class: input.data_class as FamilyInputRoutePayload["data_class"],
    category: input.category as FamilyInputRoutePayload["category"],
    urgency: input.urgency as FamilyInputRoutePayload["urgency"],
    safe_summary: input.safe_summary.trim(),
    protected_content_ref: protectedContentRef,
    attachment_refs: attachmentRefs as DomainContextRef[],
    source_surface: input.source_surface as FamilyInputRoutePayload["source_surface"],
    routing_attempt_key: input.routing_attempt_key as string,
    route_mode: "immediate",
    requires_ack: input.requires_ack,
    requires_reply: input.requires_reply,
  };
};

export const parseNurtureFamilyInputWorkflowSeed = (
  value: unknown,
): NurtureFamilyInputWorkflowCommand | null => {
  const input = record(value);
  if (!input || !onlyKeys(input, OUTER_KEYS) || input.schema_version !== 1) return null;
  const payload = parsePayload(input.payload);
  if (
    !payload ||
    !id(input.invocation_request_id) ||
    !id(input.command_request_id) ||
    !id(input.handoff_request_id) ||
    (input.handoff_expires_at !== undefined && !isoInstant(input.handoff_expires_at))
  ) {
    return null;
  }
  return {
    invocation_request_id: input.invocation_request_id,
    command_request_id: input.command_request_id,
    handoff_request_id: input.handoff_request_id,
    ...(input.handoff_expires_at ? { handoff_expires_at: input.handoff_expires_at as string } : {}),
    payload,
  };
};

/**
 * Production scenario adapter. The host supplies only an opaque Run-input
 * reader; Nurture parses it and rebinds the claimed host actor to a current
 * participant before returning any executable business command.
 */
export const createNurtureFamilyInputWorkflowPort = (input: {
  seedReader: NurtureFamilyInputWorkflowSeedReader;
  actorIdentity: NurtureMyChatActorIdentityReader;
  institution: NurtureInstitutionContextRepository;
}): NurtureFamilyInputWorkflowPort => ({
  async resolveCommand(request) {
    if (!request.actor_id) return null;
    const [seedValue, myChatUserId] = await Promise.all([
      input.seedReader.readSeed({
        workspace_id: request.workspace_id,
        run_id: request.run_id,
        step_id: request.step_id,
      }),
      input.actorIdentity.resolveMyChatUserId({
        workspace_id: request.workspace_id,
        actor_id: request.actor_id,
      }),
    ]);
    const seed = parseNurtureFamilyInputWorkflowSeed(seedValue);
    if (!seed || !myChatUserId) return null;
    const participants = await input.institution.listActiveParticipants({
      workspace_id: request.workspace_id,
      my_chat_user_id: myChatUserId,
      limit: 2,
    });
    if (
      participants.length !== 1 ||
      participants[0]?.participant_id !== seed.payload.participant_id
    ) {
      return null;
    }
    return seed;
  },
});
