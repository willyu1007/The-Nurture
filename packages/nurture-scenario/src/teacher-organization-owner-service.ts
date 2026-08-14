import { createHash, createHmac } from "node:crypto";
import { nurtureCanonicalJson } from "./c30/canonical-json.js";
import type {
  NurtureCommandInput,
  NurtureCommandResult,
  NurtureCommandSpec,
} from "./domain/commands/command-kernel.js";
import { NurtureDeterministicRollback } from "./domain/commands/command-kernel.js";
import type { NurturePublishQueueAdmissionTransaction } from "./domain/institution/publish-queue-admission.js";
import {
  classifyInteractionContextRow,
  hashScenarioToken,
  type NurtureInteractionContextService,
} from "./domain/interactions/interaction-context.js";

export type TeacherOrganizationConfirmationIssuerV1 = Readonly<{
  issue: NurtureInteractionContextService["issue"];
}>;
import {
  evaluateOrganizeTrigger,
  type CaptureBatchReadPort,
  type CaptureIntakeKindV1,
  type OrganizeCareCaptureBatchResultV1,
} from "./harness/care-capture-batch.js";
import type { CaregiverDirectMessageEligibilityReadPort } from "./harness/caregiver-direct-message.js";
import {
  createOrganizeCareCaptureBatchSpec,
  type OrganizeCareCaptureBatchCommandV1,
} from "./harness/organize-cut.js";
import { issueBoardOpaqueRef } from "./harness/board-projection.js";
import {
  canonicalizeRecordCaregiverDailyCareCommand,
  type CaregiverDailyCareEligibilityReadPort,
  type RecordCaregiverDailyCareCommandV1,
} from "./harness/board-mutations.js";
import { DEFAULT_QUICK_ADJUST_SECONDS } from "./harness/publish-process.js";
import {
  admitPublishProcessToQueue,
  evaluatePublishQueueAdmission,
} from "./harness/publish-queue-admission.js";
import type { ProtectedContentWritePort } from "./harness/protected-content.js";
import { assertProtectedContentEnvelopeV1 } from "./harness/protected-content.js";
import {
  TEACHER_ORGANIZATION_OWNER_INTERFACE,
  type TeacherOrganizationOwnerOperation,
} from "./teacher-organization-owner-contract.js";
import type {
  TeacherCaregiverContextV1,
  TeacherClassFactsV1,
} from "./teacher-class-stream-service.js";

/**
 * W7 real-owner service for `nurture.teacher-organization-owner@1.0.0`. Reads
 * follow the W6 discipline (current caregiver authority, workspace-bound
 * opaque refs by candidate matching); the four exchanges run through the
 * generic Nurture command ledger with the actor binding folded into every
 * canonical payload, so an exact same-command replay answers the recorded
 * result and any cross-actor or divergent-payload reuse is refused.
 */

const RESPONSE_TTL_MS = 300_000;
const MAX_FEED_CAPTURES = 50;
const MAX_LANE_CARDS = 30;
const MAX_EXCERPT_CHARS = 120;
const MAX_SAFE_LABELS = 6;

type CaregiverRole = "caregiver" | "lead_caregiver";

type BaseRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  class_ref: string;
}>;

export type TeacherOrganizationFeedRequest = BaseRequestV1;
export type TeacherOrganizationOrganizationRequest = BaseRequestV1;
export type TeacherOrganizationOrganizeRequest = BaseRequestV1 &
  Readonly<{ command_request_id: string; trigger: "manual" }>;
export type TeacherOrganizationSupplementRequest = BaseRequestV1 &
  Readonly<{ child_ref: string; command_request_id: string }> &
  (
    | Readonly<{
        kind: "prepare";
        prepare: Readonly<{
          local_date: string;
          care_kind: "meal" | "nap" | "mood" | "activity" | "health_observation";
          text: string;
        }>;
      }>
    | Readonly<{
        kind: "confirm";
        confirm: Readonly<{
          confirmation_ref: string;
          prepared_preview_digest: string;
        }>;
      }>
  );
export type TeacherOrganizationClassNoteRequest = BaseRequestV1 &
  Readonly<{ command_request_id: string; text: string }>;
export type TeacherOrganizationQueueAdmissionRequest = BaseRequestV1 &
  Readonly<{ process_ref: string; command_request_id: string }>;

export type TeacherOrganizationResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: CaregiverRole;
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

export type TeacherOrganizationAuthorityDecisionV1 =
  | Readonly<{ status: "resolved"; owner_resolution: TeacherOrganizationResolutionV1 }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface TeacherOrganizationAuthorityPortV1 {
  resolve(
    input: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      host_request_id: string;
      context_ref: string;
      operation: TeacherOrganizationOwnerOperation;
      class_ref: string;
    }>,
  ): Promise<TeacherOrganizationAuthorityDecisionV1>;
}

export interface TeacherOrganizationOwnerPortV1 {
  feed(input: Readonly<{
    request: TeacherOrganizationFeedRequest;
    authority: TeacherOrganizationResolutionV1;
  }>): Promise<unknown>;
  organization(input: Readonly<{
    request: TeacherOrganizationOrganizationRequest;
    authority: TeacherOrganizationResolutionV1;
  }>): Promise<unknown>;
  organize(input: Readonly<{
    request: TeacherOrganizationOrganizeRequest;
    authority: TeacherOrganizationResolutionV1;
  }>): Promise<unknown>;
  supplement(input: Readonly<{
    request: TeacherOrganizationSupplementRequest;
    authority: TeacherOrganizationResolutionV1;
  }>): Promise<unknown>;
  classNote(input: Readonly<{
    request: TeacherOrganizationClassNoteRequest;
    authority: TeacherOrganizationResolutionV1;
  }>): Promise<unknown>;
  queueAdmission(input: Readonly<{
    request: TeacherOrganizationQueueAdmissionRequest;
    authority: TeacherOrganizationResolutionV1;
  }>): Promise<unknown>;
}

export type TeacherOrganizationOwnerServiceBindingV1 = Readonly<{
  authorityResolver: TeacherOrganizationAuthorityPortV1;
  owner: TeacherOrganizationOwnerPortV1;
}>;

// ---------------------------------------------------------------------------
// Owner-internal read facts.

export interface TeacherOrganizationContextReadPortV1 {
  loadCaregiverContext(input: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }>): Promise<TeacherCaregiverContextV1 | null>;
}

export type TeacherOrganizationBatchFactsV1 = Readonly<{
  batch_id: string;
  state: "collecting" | "cut" | "organized";
  watermark_sequence: number;
  captures: readonly Readonly<{
    capture_id: string;
    kind: CaptureIntakeKindV1;
    occurred_at: string;
    stable: boolean;
    has_media: boolean;
    body_envelope?: unknown;
  }>[];
}>;

export const TEACHER_ORGANIZATION_DATA_CLASSES = [
  "daily_care_log",
  "care_day_note",
  "care_constraint_update",
  "family_care_question",
  "family_follow_up_request",
  "direct_care_communication",
  "child_growth_record",
] as const;

export type TeacherOrganizationLaneRowV1 = Readonly<{
  process_id: string;
  process_key: string;
  origin: "agent_organized" | "manual";
  data_class: (typeof TEACHER_ORGANIZATION_DATA_CLASSES)[number];
  purpose_key: string;
  state: "draft" | "needs_review" | "pending_release";
  recipients_count: number;
  safe_labels: readonly string[];
}>;

export interface TeacherOrganizationBatchReadPortV1 {
  /** The most recent non-cancelled batch of the class, or null when none exists. */
  loadCurrentBatch(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
  }>): Promise<TeacherOrganizationBatchFactsV1 | null>;
  /** The owner-ordered draft lane of the class (draft/needs_review/pending_release). */
  listLaneProcesses(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
  }>): Promise<readonly TeacherOrganizationLaneRowV1[]>;
}

export type TeacherOrganizationAdmissionPreviewPortV1 = Pick<
  NurturePublishQueueAdmissionTransaction,
  "loadPublishQueueAdmissionFacts"
>;

// Structurally the NurtureCommandRunner; the port keeps the service testable
// without importing the concrete class.
export type TeacherOrganizationCommandRunnerV1 = Readonly<{
  execute<Input>(input: NurtureCommandInput<Input>): Promise<NurtureCommandResult>;
}>;

export type TeacherOrganizationOwnerServiceDependenciesV1 = Readonly<{
  contextReads: TeacherOrganizationContextReadPortV1;
  batchReads: TeacherOrganizationBatchReadPortV1;
  captureReads: CaptureBatchReadPort;
  admissionPreview: TeacherOrganizationAdmissionPreviewPortV1;
  supplementEligibility: CaregiverDailyCareEligibilityReadPort;
  directMessageEligibility: CaregiverDirectMessageEligibilityReadPort;
  interactionContexts: TeacherOrganizationConfirmationIssuerV1;
  commands: TeacherOrganizationCommandRunnerV1;
  protectedContent: ProtectedContentWritePort;
  integrityKey: string;
  now?: () => Date;
}>;

// ---------------------------------------------------------------------------

const compareClasses = (
  left: TeacherClassFactsV1,
  right: TeacherClassFactsV1,
): number =>
  left.care_group_label.localeCompare(right.care_group_label, "zh-Hans-CN")
  || left.care_group_id.localeCompare(right.care_group_id);

const digestOf = (value: unknown): string =>
  `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(value), "utf8")
    .digest("hex")}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

type PreparedSupplementState = Readonly<{
  schema_version: 1;
  command_request_id: string;
  context_ref: string;
  prepared_preview_digest: string;
  resolution_ref: string;
  scope_version: number;
  command: RecordCaregiverDailyCareCommandV1;
}>;

const parsePreparedSupplementState = (
  value: unknown,
): PreparedSupplementState | null => {
  if (!isRecord(value) || value.schema_version !== 1) return null;
  if (
    typeof value.command_request_id !== "string"
    || typeof value.context_ref !== "string"
    || typeof value.prepared_preview_digest !== "string"
    || typeof value.resolution_ref !== "string"
    || typeof value.scope_version !== "number"
    || !isRecord(value.command)
  ) {
    return null;
  }
  return value as PreparedSupplementState;
};

export const createTeacherOrganizationOwnerService = (
  deps: TeacherOrganizationOwnerServiceDependenciesV1,
): TeacherOrganizationOwnerServiceBindingV1 => {
  const now = deps.now ?? (() => new Date());
  if (deps.integrityKey.length < 32) {
    throw new Error(
      "Teacher organization integrity key must be at least 32 characters",
    );
  }

  const scopeOf = (workspaceId: string) => ({ workspace_id: workspaceId });
  const refOf = (workspaceId: string, kind: string, id: string): string =>
    issueBoardOpaqueRef(deps.integrityKey, scopeOf(workspaceId), kind, id);
  const classRefOf = (workspaceId: string, careGroupId: string): string =>
    refOf(workspaceId, "care_group", careGroupId);
  const actorBindingOf = (workspaceId: string, participantId: string): string =>
    createHmac("sha256", deps.integrityKey)
      .update(
        `nurture.teacher-organization-actor.v1\0${workspaceId}\0${participantId}`,
        "utf8",
      )
      .digest("hex");

  const masked = (
    contextRef: string,
    reason: "access_changed" | "context_changed" | "refresh_not_retryable",
  ): unknown => ({
    status: "masked",
    context_ref: contextRef,
    masked_at: now().toISOString(),
    mask_signal: {
      kind: "mask",
      reason_code: reason,
      purge_partition: true,
      content_masked: true,
    },
  });

  const unavailable = (
    contextRef: string,
    reason: "content_unavailable" | "temporarily_unavailable" | "request_invalid",
  ): unknown => ({
    status: "unavailable",
    context_ref: contextRef,
    failed_at: now().toISOString(),
    reason_code: reason,
    retryable: reason === "temporarily_unavailable",
  });

  const outcomeUnknown = (contextRef: string, commandRequestId: string): unknown => ({
    status: "outcome_unknown",
    context_ref: contextRef,
    command_request_id: commandRequestId,
    recovery: "reconcile_same_command",
  });

  const findByClassRef = (
    workspaceId: string,
    context: TeacherCaregiverContextV1,
    classRef: string,
  ): TeacherClassFactsV1 | undefined =>
    context.classes.find(
      (entry) => classRefOf(workspaceId, entry.care_group_id) === classRef,
    );

  const loadContext = (request: BaseRequestV1) =>
    deps.contextReads.loadCaregiverContext({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      at: now(),
    });

  const resolveMembership = async (
    request: BaseRequestV1,
  ): Promise<TeacherClassFactsV1 | null> => {
    const context = await loadContext(request);
    if (!context) return null;
    return findByClassRef(request.workspace_id, context, request.class_ref) ?? null;
  };

  const classResolution = (
    request: BaseRequestV1,
    entry: TeacherClassFactsV1,
    resolvedAt: string,
  ): TeacherOrganizationResolutionV1 => {
    const scopeVersion = Math.max(1, entry.role_version, entry.care_group_version);
    return Object.freeze({
      resolution_ref: refOf(
        request.workspace_id,
        "resolution",
        `organization:${entry.care_group_id}:${scopeVersion}`,
      ),
      presentation_role: entry.role,
      scope_kind: "care_group" as const,
      scope_ref: request.class_ref,
      context_ref: request.context_ref,
      scope_version: scopeVersion,
      resolved_at: resolvedAt,
    });
  };

  const readyEnvelope = (
    request: BaseRequestV1,
    authority: TeacherOrganizationResolutionV1,
    operation: "feed_query" | "organization_query",
  ) => {
    const generatedAt = now();
    return {
      status: "ready" as const,
      owner_resolution: authority,
      cache_partition: {
        partition_key: refOf(
          request.workspace_id,
          "partition",
          `${operation}\0${request.my_chat_user_id}\0${authority.resolution_ref}\0${request.class_ref}`,
        ),
        interface_key: TEACHER_ORGANIZATION_OWNER_INTERFACE.key,
        interface_version: TEACHER_ORGANIZATION_OWNER_INTERFACE.version,
        contract_digest: TEACHER_ORGANIZATION_OWNER_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        presentation_role: authority.presentation_role,
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        query_key: request.class_ref,
        expires_at: new Date(generatedAt.getTime() + RESPONSE_TTL_MS).toISOString(),
      },
      generated_at: generatedAt.toISOString(),
      freshness: {
        resolved_at: authority.resolved_at,
        source: "current_owner_read" as const,
      },
    };
  };

  const authorityResolver: TeacherOrganizationAuthorityPortV1 = {
    async resolve(input) {
      let context: TeacherCaregiverContextV1 | null;
      try {
        context = await deps.contextReads.loadCaregiverContext({
          workspace_id: input.workspace_id,
          my_chat_user_id: input.my_chat_user_id,
          at: now(),
        });
      } catch {
        return {
          status: "closed",
          response: unavailable(input.context_ref, "temporarily_unavailable"),
        };
      }
      const entry = context
        ? findByClassRef(input.workspace_id, context, input.class_ref)
        : undefined;
      if (!entry) {
        // Foreign scope, revoked assignment and stale cache are one signal.
        return {
          status: "closed",
          response: masked(input.context_ref, "access_changed"),
        };
      }
      return {
        status: "resolved",
        owner_resolution: classResolution(input, entry, now().toISOString()),
      };
    },
  };

  const excerptOf = (envelope: unknown): string | undefined => {
    try {
      const plaintext = deps.protectedContent.unseal(
        assertProtectedContentEnvelopeV1(envelope),
      );
      const bounded = plaintext.slice(0, MAX_EXCERPT_CHARS);
      return bounded.length > 0 ? bounded : undefined;
    } catch {
      return undefined;
    }
  };

  const triggerPreview = async (
    request: BaseRequestV1,
    membership: TeacherClassFactsV1,
    participantId: string,
  ): Promise<Record<string, unknown>> => {
    const source = await deps.captureReads.loadOrganizeSource({
      workspace_id: request.workspace_id,
      participant_id: participantId,
      care_group_id: membership.care_group_id,
      snapshot_at: now().toISOString(),
    });
    if (!source) return { availability: "waiting", reason_code: "batch_not_collecting" };
    if (!source.organize_policy) {
      return { availability: "unavailable", reason_code: "policy_unavailable" };
    }
    const decision = evaluateOrganizeTrigger({
      trigger: "manual",
      trigger_request_id: `preview:${request.host_request_id}`,
      now: now(),
      policy: source.organize_policy,
      batch: {
        state: source.state,
        captures: source.captures,
        activity: source.activity,
      },
      ...(source.fallback_due_at ? { fallback_due_at: source.fallback_due_at } : {}),
    });
    if (decision.status === "cut") return { availability: "available" };
    if (decision.status === "waiting") {
      return { availability: "waiting", reason_code: decision.reason };
    }
    return { availability: "unavailable", reason_code: "policy_unavailable" };
  };

  const admissionPreviewOf = async (
    workspaceId: string,
    processKey: string,
  ): Promise<{
    preview: Record<string, unknown>;
    quick_adjust_until?: string;
    edit_hold_until?: string;
    scheduled_at?: string;
  } | null> => {
    const readAt = now();
    const facts = await deps.admissionPreview.loadPublishQueueAdmissionFacts({
      workspace_id: workspaceId,
      process_key: processKey,
      read_at: readAt.toISOString(),
    });
    if (!facts) return null;
    const decision = evaluatePublishQueueAdmission(facts);
    const preview: Record<string, unknown> =
      decision.status === "ready" || decision.status === "already_satisfied"
        ? { status: decision.status }
        : { status: decision.status, reason_code: decision.reason_code };
    const quickAdjustUntil = new Date(
      new Date(facts.created_at).getTime() + DEFAULT_QUICK_ADJUST_SECONDS * 1_000,
    );
    return {
      preview,
      ...(quickAdjustUntil.getTime() > readAt.getTime()
        ? { quick_adjust_until: quickAdjustUntil.toISOString() }
        : {}),
      ...(facts.current_hold_expires_at
        && Date.parse(facts.current_hold_expires_at) > readAt.getTime()
        ? { edit_hold_until: facts.current_hold_expires_at }
        : {}),
      ...(facts.schedule ? { scheduled_at: facts.schedule.scheduledAt } : {}),
    };
  };

  const runOrganize = async (
    request: TeacherOrganizationOrganizeRequest,
    membership: TeacherClassFactsV1,
    participantId: string,
  ): Promise<unknown> => {
    const source = await deps.captureReads.loadOrganizeSource({
      workspace_id: request.workspace_id,
      participant_id: participantId,
      care_group_id: membership.care_group_id,
      snapshot_at: now().toISOString(),
    });
    if (source?.organize_policy) {
      const decision = evaluateOrganizeTrigger({
        trigger: "manual",
        trigger_request_id: request.command_request_id,
        now: now(),
        policy: source.organize_policy,
        batch: {
          state: source.state,
          captures: source.captures,
          activity: source.activity,
        },
        ...(source.fallback_due_at
          ? { fallback_due_at: source.fallback_due_at }
          : {}),
      });
      if (decision.status === "invalid") {
        return unavailable(request.context_ref, "content_unavailable");
      }
      if (decision.status === "waiting") {
        // Nothing is cut and nothing enters the ledger; the honest committed
        // shape mirrors OrganizeCareCaptureBatchResultV1's nothing branch.
        return {
          status: "committed",
          context_ref: request.context_ref,
          command_request_id: request.command_request_id,
          executed: "executed",
          outcome: "nothing_to_organize",
          batch_ref: refOf(request.workspace_id, "care_capture_batch", source.batch_id),
          watermark_sequence: 0,
          included_capture_count: 0,
          deferred_capture_count: 0,
        };
      }
    }
    // No collecting batch (or a cuttable one): the ledger decides. An exact
    // replay after the batch left `collecting` must still answer the recorded
    // result, so command identity must not depend on the volatile batch head —
    // the head is compared by the spec's expected-heads check, not the hash.
    const spec = createOrganizeCareCaptureBatchSpec({
      integrity_key: deps.integrityKey,
      protected_content: deps.protectedContent,
      direct_message_eligibility: deps.directMessageEligibility,
    });
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        care_group_id: membership.care_group_id,
        expected_batch_version: source?.batch_version ?? 0,
      } satisfies OrganizeCareCaptureBatchCommandV1,
      spec: {
        ...spec,
        canonicalize: (input: OrganizeCareCaptureBatchCommandV1) => ({
          care_group_id: input.care_group_id,
          trigger: "manual",
          actor_binding_ref: actorBinding,
        }),
      },
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = result.committed_result as
        | OrganizeCareCaptureBatchResultV1
        | undefined;
      if (!committed) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      const batchId = result.output_refs.find(
        (ref) => ref.object_type === "care_capture_batch",
      )?.object_id
        ?? source?.batch_id;
      const processId = result.output_refs.find(
        (ref) => ref.object_type === "publish_process",
      )?.object_id;
      if (!batchId) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        outcome: committed.outcome,
        batch_ref: refOf(request.workspace_id, "care_capture_batch", batchId),
        ...(committed.outcome === "organized" && processId
          ? { process_ref: refOf(request.workspace_id, "publish_process", processId) }
          : {}),
        watermark_sequence: committed.watermarkSequence,
        included_capture_count: committed.includedCaptureCount,
        deferred_capture_count: committed.deferredCaptureCount,
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    if (result.decision === "conflict") {
      return notCommitted(request, "batch_head_moved");
    }
    if (result.reason_code === "not_authorized") {
      return masked(request.context_ref, "access_changed");
    }
    if (result.reason_code === "nothing_to_organize") {
      // The batch left `collecting` between the read and the command.
      return notCommitted(request, "batch_head_moved");
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  const notCommitted = (
    request: Readonly<{ context_ref: string; command_request_id: string }>,
    reason: string,
  ): unknown => ({
    status: "not_committed",
    context_ref: request.context_ref,
    command_request_id: request.command_request_id,
    reason_code: reason,
  });

  const supplementPrepare = async (
    request: Extract<TeacherOrganizationSupplementRequest, { kind: "prepare" }>,
    authority: TeacherOrganizationResolutionV1,
    participantId: string,
  ): Promise<unknown> => {
    const eligibility =
      await deps.supplementEligibility.resolveCaregiverDailyCareEligibility({
        workspace_id: request.workspace_id,
        participant_id: participantId,
      });
    if (!eligibility.participant_active || eligibility.children.length === 0) {
      return masked(request.context_ref, "access_changed");
    }
    const target = eligibility.children.find(
      (child) =>
        refOf(request.workspace_id, "child_care_process", child.child_care_process_id)
        === request.child_ref,
    );
    if (!target) return masked(request.context_ref, "access_changed");
    const command: RecordCaregiverDailyCareCommandV1 = {
      kind: request.prepare.care_kind,
      summary: request.prepare.text,
      child_care_process_id: target.child_care_process_id,
      expected_care_group_version: target.care_group_version,
      expected_role_version: target.caregiver_role_version,
      expected_enrollment_version: target.enrollment_version,
    };
    const digest = digestOf({
      local_date: request.prepare.local_date,
      command: canonicalizeRecordCaregiverDailyCareCommand(command),
    });
    const issued = await deps.interactionContexts.issue({
      workspace_id: request.workspace_id,
      participant_id: participantId,
      purpose: "prepare_action",
      surface: "teacher_organization",
      host_conversation_ref: request.command_request_id,
      payload_schema_version: 1,
      state_payload: {
        schema_version: 1,
        command_request_id: request.command_request_id,
        context_ref: request.context_ref,
        prepared_preview_digest: digest,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        command,
      } satisfies PreparedSupplementState,
      ttl_ms: 5 * 60_000,
    });
    return {
      status: "ready_to_confirm",
      context_ref: request.context_ref,
      command_request_id: request.command_request_id,
      confirmation_ref: issued.token,
      prepared_preview_digest: digest,
      expires_at: issued.expires_at,
    };
  };

  const supplementConfirm = async (
    request: Extract<TeacherOrganizationSupplementRequest, { kind: "confirm" }>,
    authority: TeacherOrganizationResolutionV1,
    participantId: string,
  ): Promise<unknown> => {
    let prepared: PreparedSupplementState | undefined;
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const spec: NurtureCommandSpec<Record<string, unknown>> = {
      command_key: "teacher_organization_supplement",
      command_scope: "teacher_organization",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) => {
        if (!transaction.interactionContexts || !transaction.boardMutations) {
          return {
            status: "blocked",
            reason_code: "teacher_organization_ports_unavailable",
          };
        }
        const row = await transaction.interactionContexts.findByTokenHash({
          workspace_id: request.workspace_id,
          token_hash: hashScenarioToken(
            request.workspace_id,
            request.confirm.confirmation_ref,
          ),
        });
        const classified = classifyInteractionContextRow(
          row,
          {
            workspace_id: request.workspace_id,
            participant_id: participantId,
            purpose: "prepare_action",
            surface: "teacher_organization",
            host_conversation_ref: request.command_request_id,
          },
          now(),
        );
        if (classified.status === "expired") {
          return { status: "blocked", reason_code: "confirmation_expired" };
        }
        if (classified.status === "blocked") {
          return { status: "blocked", reason_code: "confirmation_foreign" };
        }
        const state = parsePreparedSupplementState(
          classified.context.state_payload,
        );
        if (
          !state
          || state.command_request_id !== request.command_request_id
          || state.context_ref !== request.context_ref
          || state.resolution_ref !== authority.resolution_ref
          || state.scope_version !== authority.scope_version
        ) {
          return { status: "blocked", reason_code: "confirmation_foreign" };
        }
        if (state.prepared_preview_digest !== request.confirm.prepared_preview_digest) {
          return { status: "blocked", reason_code: "preview_digest_mismatch" };
        }
        const consumed = await transaction.interactionContexts.consume({
          workspace_id: request.workspace_id,
          context_id: classified.context.id,
          expected_version: classified.context.version,
          consumed_at: now().toISOString(),
        });
        if (!consumed) {
          return { status: "blocked", reason_code: "confirmation_consumed" };
        }
        prepared = state;
        return { status: "ready" };
      },
      apply: async (transaction) => {
        if (!prepared || !transaction.boardMutations) {
          throw new Error("teacher organization supplement apply port unavailable");
        }
        // Confirm re-evaluates current authority on execution; the prepared
        // heads describe the preview moment, not a stale-write license.
        const facts = await transaction.boardMutations.loadCaregiverDailyCareFacts({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          child_care_process_id: prepared.command.child_care_process_id,
        });
        if (
          !facts
          || !facts.participant_active
          || !facts.enrollment_active
          || facts.role_scope_type !== "care_group"
          || !facts.role_scope_matches_source
          || !facts.caregiver_role_assignment_id
          || !facts.care_group_id
          || !facts.enrollment_id
        ) {
          throw new NurtureDeterministicRollback("not_authorized");
        }
        const applied = await transaction.boardMutations.applyCaregiverDailyCareRecord({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          child_care_process_id: prepared.command.child_care_process_id,
          care_group_id: facts.care_group_id,
          enrollment_id: facts.enrollment_id,
          recorded_by_role_assignment_id: facts.caregiver_role_assignment_id,
          kind: prepared.command.kind,
          summary: prepared.command.summary,
          expected_enrollment_version: facts.enrollment_version,
        });
        return {
          output_refs: [applied.daily_care_log_ref],
          result_schema_version: 1,
          committed_result: {
            schema_version: 1,
            daily_care_log_id: applied.daily_care_log_ref.object_id,
            source_head: Math.max(1, applied.daily_care_log_ref.version ?? 1),
          },
        };
      },
    };
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        confirmation_digest: digestOf({
          confirmation_ref: request.confirm.confirmation_ref,
          prepared_preview_digest: request.confirm.prepared_preview_digest,
        }),
        actor_binding_ref: actorBinding,
      },
      spec,
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = isRecord(result.committed_result)
        ? result.committed_result
        : undefined;
      if (
        !committed
        || typeof committed.daily_care_log_id !== "string"
        || typeof committed.source_head !== "number"
      ) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        log_ref: refOf(
          request.workspace_id,
          "daily_care_log",
          committed.daily_care_log_id,
        ),
        source_head: Math.max(1, Math.trunc(committed.source_head)),
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    if (
      [
        "confirmation_expired",
        "confirmation_consumed",
        "confirmation_foreign",
        "preview_digest_mismatch",
      ].includes(result.reason_code)
    ) {
      return notCommitted(request, result.reason_code);
    }
    if (result.reason_code === "not_authorized") {
      return masked(request.context_ref, "access_changed");
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  const runClassNote = async (
    request: TeacherOrganizationClassNoteRequest,
    membership: TeacherClassFactsV1,
    participantId: string,
  ): Promise<unknown> => {
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const sealed = deps.protectedContent.seal(request.text);
    const spec: NurtureCommandSpec<Record<string, unknown>> = {
      command_key: "teacher_organization_class_note",
      command_scope: "teacher_organization",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) =>
        transaction.careCapture?.applyClassNoteCapture
          ? { status: "ready" }
          : { status: "blocked", reason_code: "teacher_organization_ports_unavailable" },
      apply: async (transaction) => {
        const applied = await transaction.careCapture!.applyClassNoteCapture!({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          care_group_id: membership.care_group_id,
          body_envelope: sealed,
          occurred_at: now().toISOString(),
        });
        if (applied.status !== "applied") {
          throw new NurtureDeterministicRollback(
            applied.status === "not_authorized" ? "not_authorized" : "batch_unavailable",
          );
        }
        return {
          output_refs: [
            {
              schema_version: 1,
              namespace: "nurture",
              object_type: "care_capture",
              object_id: applied.capture_id,
              version: 1,
            },
          ],
          result_schema_version: 1,
          committed_result: {
            schema_version: 1,
            capture_id: applied.capture_id,
          },
        };
      },
    };
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        care_group_id: membership.care_group_id,
        text_digest: digestOf(request.text),
        actor_binding_ref: actorBinding,
      },
      spec,
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = isRecord(result.committed_result)
        ? result.committed_result
        : undefined;
      if (!committed || typeof committed.capture_id !== "string") {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        capture_ref: refOf(request.workspace_id, "care_capture", committed.capture_id),
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    if (result.reason_code === "not_authorized") {
      return masked(request.context_ref, "access_changed");
    }
    if (result.reason_code === "batch_unavailable") {
      return notCommitted(request, "batch_unavailable");
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  const runQueueAdmission = async (
    request: TeacherOrganizationQueueAdmissionRequest,
    membership: TeacherClassFactsV1,
    participantId: string,
  ): Promise<unknown> => {
    const lane = await deps.batchReads.listLaneProcesses({
      workspace_id: request.workspace_id,
      care_group_id: membership.care_group_id,
    });
    const target = lane.find(
      (row) =>
        refOf(request.workspace_id, "publish_process", row.process_id)
        === request.process_ref,
    );
    if (!target) return masked(request.context_ref, "access_changed");
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const spec: NurtureCommandSpec<Record<string, unknown>> = {
      command_key: "teacher_organization_queue_admission",
      command_scope: "teacher_organization",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) =>
        transaction.publishQueueAdmission
          ? { status: "ready" }
          : { status: "blocked", reason_code: "teacher_organization_ports_unavailable" },
      apply: async (transaction) => {
        const admitted = await admitPublishProcessToQueue(
          transaction.publishQueueAdmission!,
          {
            workspace_id: request.workspace_id,
            process_key: target.process_key,
            now: now(),
          },
        );
        if (admitted.status === "waiting" || admitted.status === "blocked") {
          throw new NurtureDeterministicRollback(admitted.reason_code);
        }
        return {
          output_refs: [
            {
              schema_version: 1,
              namespace: "nurture",
              object_type: "publish_process",
              object_id: target.process_id,
              version: 1,
            },
          ],
          result_schema_version: 1,
          committed_result: {
            schema_version: 1,
            disposition: admitted.status === "queued" ? "queued" : "already_satisfied",
            scheduled_at: admitted.schedule.scheduledAt,
            not_after: admitted.schedule.notAfter,
            schedule_policy_ref: admitted.schedule.policyRef,
            schedule_policy_head: admitted.schedule.policyHead,
          },
        };
      },
    };
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        process_key: target.process_key,
        actor_binding_ref: actorBinding,
      },
      spec,
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = isRecord(result.committed_result)
        ? result.committed_result
        : undefined;
      if (
        !committed
        || (committed.disposition !== "queued"
          && committed.disposition !== "already_satisfied")
        || typeof committed.scheduled_at !== "string"
        || typeof committed.schedule_policy_ref !== "string"
        || typeof committed.schedule_policy_head !== "number"
      ) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        disposition: committed.disposition,
        process_ref: request.process_ref,
        scheduled_at: committed.scheduled_at,
        ...(typeof committed.not_after === "string"
          ? { not_after: committed.not_after }
          : {}),
        schedule_policy_ref: committed.schedule_policy_ref,
        schedule_policy_head: Math.max(1, Math.trunc(committed.schedule_policy_head)),
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    const admissionReasons = new Set([
      "quick_adjust_active",
      "edit_hold_active",
      "target_unavailable",
      "needs_review",
      "process_not_draft",
      "unsaved_revision",
      "authorizing_role_lapsed",
      "publication_policy_unavailable",
    ]);
    if (admissionReasons.has(result.reason_code)) {
      return notCommitted(request, result.reason_code);
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  const owner: TeacherOrganizationOwnerPortV1 = {
    async feed({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const batch = await deps.batchReads.loadCurrentBatch({
        workspace_id: request.workspace_id,
        care_group_id: membership.care_group_id,
      });
      const captures = batch
        ? batch.captures.slice(-MAX_FEED_CAPTURES).map((capture) => {
            const excerpt =
              capture.kind !== "media" && capture.stable && capture.body_envelope
                ? excerptOf(capture.body_envelope)
                : undefined;
            return {
              capture_ref: refOf(request.workspace_id, "care_capture", capture.capture_id),
              kind: capture.kind,
              occurred_at: capture.occurred_at,
              stability: capture.stable ? ("stable" as const) : ("processing" as const),
              // No owner failure column exists yet; failed uploads surface as
              // still-processing until the W9 stream ingress lands the fact.
              failure: "none" as const,
              has_media: capture.has_media,
              ...(excerpt ? { text_excerpt: excerpt } : {}),
            };
          })
        : [];
      return {
        ...readyEnvelope(request, authority, "feed_query"),
        batch_state: batch ? batch.state : ("none" as const),
        captures,
      };
    },

    async organization({ request, authority }) {
      const context = await loadContext(request);
      const membership = context
        ? findByClassRef(request.workspace_id, context, request.class_ref)
        : undefined;
      if (!context || !membership) {
        return masked(request.context_ref, "access_changed");
      }
      const participantId = context.participant_id;
      const [batch, trigger, laneRows] = await Promise.all([
        deps.batchReads.loadCurrentBatch({
          workspace_id: request.workspace_id,
          care_group_id: membership.care_group_id,
        }),
        triggerPreview(request, membership, participantId),
        deps.batchReads.listLaneProcesses({
          workspace_id: request.workspace_id,
          care_group_id: membership.care_group_id,
        }),
      ]);
      const lane = [];
      for (const row of laneRows.slice(0, MAX_LANE_CARDS)) {
        const admission = await admissionPreviewOf(
          request.workspace_id,
          row.process_key,
        );
        if (!admission) continue;
        lane.push({
          process_ref: refOf(request.workspace_id, "publish_process", row.process_id),
          origin: row.origin,
          data_class: row.data_class,
          purpose_key: row.purpose_key,
          state: row.state,
          recipients: {
            count: row.recipients_count,
            safe_labels: row.safe_labels.slice(0, MAX_SAFE_LABELS),
          },
          ...(admission.quick_adjust_until
            ? { quick_adjust_until: admission.quick_adjust_until }
            : {}),
          ...(admission.edit_hold_until
            ? { edit_hold_until: admission.edit_hold_until }
            : {}),
          ...(admission.scheduled_at ? { scheduled_at: admission.scheduled_at } : {}),
          admission_preview: admission.preview,
        });
      }
      const stableCount = batch
        ? batch.captures.filter((capture) => capture.stable).length
        : 0;
      return {
        ...readyEnvelope(request, authority, "organization_query"),
        batch: {
          ...(batch
            ? {
                batch_ref: refOf(
                  request.workspace_id,
                  "care_capture_batch",
                  batch.batch_id,
                ),
              }
            : {}),
          state: batch ? batch.state : ("none" as const),
          capture_count: batch ? Math.min(batch.captures.length, 999) : 0,
          stable_capture_count: Math.min(stableCount, 999),
          watermark_sequence: batch ? batch.watermark_sequence : 0,
          trigger,
        },
        lane,
      };
    },

    async organize({ request }) {
      const context = await loadContext(request);
      const membership = context
        ? findByClassRef(request.workspace_id, context, request.class_ref)
        : undefined;
      if (!context || !membership) {
        return masked(request.context_ref, "access_changed");
      }
      return runOrganize(request, membership, context.participant_id);
    },

    async supplement({ request, authority }) {
      const context = await loadContext(request);
      const membership = context
        ? findByClassRef(request.workspace_id, context, request.class_ref)
        : undefined;
      if (!context || !membership) {
        return masked(request.context_ref, "access_changed");
      }
      return request.kind === "prepare"
        ? supplementPrepare(request, authority, context.participant_id)
        : supplementConfirm(request, authority, context.participant_id);
    },

    async classNote({ request }) {
      const context = await loadContext(request);
      const membership = context
        ? findByClassRef(request.workspace_id, context, request.class_ref)
        : undefined;
      if (!context || !membership) {
        return masked(request.context_ref, "access_changed");
      }
      return runClassNote(request, membership, context.participant_id);
    },

    async queueAdmission({ request }) {
      const context = await loadContext(request);
      const membership = context
        ? findByClassRef(request.workspace_id, context, request.class_ref)
        : undefined;
      if (!context || !membership) {
        return masked(request.context_ref, "access_changed");
      }
      return runQueueAdmission(request, membership, context.participant_id);
    },
  };

  return { authorityResolver, owner };
};

export { compareClasses as compareTeacherOrganizationClasses };
