import { randomUUID } from "node:crypto";
import type { NurtureCommandExecutionContext } from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import type {
  NurtureCareCaptureTransaction,
  NurtureOrganizeCaptureRow,
  NurtureOrganizeCutFacts,
} from "../domain/institution/care-capture-transaction.js";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardSealedRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import {
  createBoardWriteSpec,
  type NurtureBoardWriteSpec,
} from "./board-write-spec.js";
import { NurtureDeterministicRollback } from "../domain/commands/command-kernel.js";
import {
  ORGANIZE_CARE_CAPTURE_BATCH_CAPABILITY,
  resolveCaptureWatermark,
  validateOrganizeTriggerPolicy,
  type CaptureBatchReadPort,
  type OrganizeCareCaptureBatchResultV1,
  type OrganizeTriggerEvidenceV1,
  type OrganizeTriggerPolicyV1,
} from "./care-capture-batch.js";
import type { CaregiverDirectMessageEligibilityReadPort } from "./caregiver-direct-message.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import {
  assembleDeterministicDraft,
  type AssemblerSourceV1,
} from "./content-assembler.js";
import {
  evaluateContentSafetyRoute,
  type ContentSafetySourceSignalV1,
} from "./content-safety-policy.js";
import type {
  ProtectedContentEnvelopeV1,
  ProtectedContentWritePort,
} from "./protected-content.js";
import {
  createPublishCandidate,
  publishProcessKey,
  publishTargetKey,
  type DirectInteractionActionV1,
  type PublishTargetCandidateV1,
} from "./publish-process.js";
import type {
  AssembledDraftContentV1,
} from "./content-assembler.js";
import type { OrganizeDirectInteractionActionV1 } from "./care-capture-batch.js";

/**
 * G3-B1 organize on the formal ingress: the manual "整理" route.
 *
 * The teacher explicitly cuts the collecting batch of one exact CareGroup.
 * Idle and daily-fallback triggers stay server-side schedulers — the manual
 * route bypasses their gates by design ("手动整理绕过"), but never the policy
 * resolution, the stable-prefix watermark or the safety route.
 */
export const ORGANIZE_COMMAND_SCOPE = "care_capture_organize";

export const CARE_GROUP_TARGET_KIND = "care_group";

export type OrganizeCareCaptureBatchCommandV1 = {
  care_group_id: string;
  expected_batch_version: number;
};

export const canonicalizeOrganizeCareCaptureBatchCommand = (
  input: OrganizeCareCaptureBatchCommandV1,
): unknown => ({
  care_group_id: input.care_group_id,
  expected_batch_version: input.expected_batch_version,
});

const FACT_KIND_BY_CAPTURE: Record<
  NurtureOrganizeCaptureRow["kind"],
  ContentSafetySourceSignalV1["fact_kind"]
> = {
  text: "teacher_text",
  voice_transcript: "voice_transcript",
  media: "media_photo",
};

/**
 * Everything the synchronous authorization derived; `apply` may use these
 * values and no others. The candidate decision itself is completed in apply —
 * its only asynchronous ingredient is the T-005 eligibility read that
 * decorates the direct-interaction route, and every refusal path is already
 * decided here.
 */
type OrganizeWritePlan = {
  batch_id: string;
  evidence: OrganizeTriggerEvidenceV1;
  included: NurtureOrganizeCaptureRow[];
  deferred_count: number;
  assessment: ReturnType<typeof evaluateContentSafetyRoute>["assessment"];
  content: AssembledDraftContentV1;
  targets: PublishTargetCandidateV1[];
};

type OrganizeSpecDeps = {
  integrity_key: string;
  protected_content: ProtectedContentWritePort;
  direct_message_eligibility: CaregiverDirectMessageEligibilityReadPort;
};

const organizeScope = (context: NurtureCommandExecutionContext): BoardScopeV1 => ({
  workspace_id: context.workspace_id,
  participant_id: context.business_actor_ref,
});

const actorEligible = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current;

/**
 * The manual cut over owner facts. Shared verbatim by prepare (through the
 * read port's identical fact shape) and the execute spec, so what prepare
 * previews is what the command commits.
 */
const evaluateManualCut = (
  facts: NurtureOrganizeCutFacts,
  triggerRequestId: string,
):
  | { status: "blocked"; reason_code: string }
  | {
      status: "cut";
      evidence: OrganizeTriggerEvidenceV1;
      included: NurtureOrganizeCaptureRow[];
      deferred_count: number;
    } => {
  if (!facts.organize_policy) {
    // Not resolved is not a default window: the T-007 subset fails closed.
    return { status: "blocked", reason_code: "policy_unavailable" };
  }
  const policy: OrganizeTriggerPolicyV1 = facts.organize_policy;
  if (validateOrganizeTriggerPolicy(policy).status === "invalid") {
    return { status: "blocked", reason_code: "policy_unavailable" };
  }
  if (!facts.batch || facts.batch.state !== "collecting") {
    return { status: "blocked", reason_code: "nothing_to_organize" };
  }
  const cutAt = facts.read_at;
  const { watermark, included, deferred } = resolveCaptureWatermark(
    facts.batch.captures.map((capture) => ({
      capture_id: capture.capture_id,
      kind: capture.kind,
      stable: capture.stable,
      source_sequence: capture.source_sequence,
      occurred_at: capture.occurred_at,
      authority: facts.authority as CaregiverFactAuthorityV1,
    })),
    cutAt,
  );
  if (included.length === 0) {
    return { status: "blocked", reason_code: "nothing_to_organize" };
  }
  return {
    status: "cut",
    evidence: {
      trigger: "manual",
      triggerRequestId,
      policyRef: policy.policy_ref,
      policyHead: policy.policy_head,
      timeZone: policy.time_zone,
      quiescenceSeconds: policy.automatic_quiescence_seconds,
      observedUserActivityAt: facts.read_at,
      leaseActive: false,
      watermark,
    },
    included: facts.batch.captures.filter((capture) =>
      included.some((entry) => entry.capture_id === capture.capture_id),
    ),
    deferred_count: deferred.length,
  };
};

/**
 * The synchronous remainder of authorization: safety route from stored
 * markers, deterministic assembly from sealed bodies, and the class target
 * set. Every refusal the candidate could produce is decided here — apply only
 * finishes the decision with the one asynchronous ingredient (the T-005
 * eligibility read that decorates the direct-interaction route).
 */
const authorizeCut = (
  deps: OrganizeSpecDeps,
  scope: BoardScopeV1,
  facts: NurtureOrganizeCutFacts,
  cut: {
    batch_id: string;
    evidence: OrganizeTriggerEvidenceV1;
    included: NurtureOrganizeCaptureRow[];
    deferred_count: number;
  },
): { status: "blocked"; reason_code: string } | { status: "authorized"; write: OrganizeWritePlan } => {
  if (!facts.safety_policy) {
    return { status: "blocked", reason_code: "safety_route_unavailable" };
  }
  const signals: ContentSafetySourceSignalV1[] = [];
  for (const capture of cut.included) {
    if (capture.safety_markers === undefined) {
      // NULL markers mean "never derived" — an unread source, so the route
      // fails closed rather than treating it as clean.
      return { status: "blocked", reason_code: "safety_route_unavailable" };
    }
    signals.push({
      source_id: capture.capture_id,
      fact_kind: FACT_KIND_BY_CAPTURE[capture.kind],
      markers: capture.safety_markers,
    });
  }
  const evaluation = evaluateContentSafetyRoute({
    policy_ref: facts.safety_policy.policy_ref,
    policy_head: facts.safety_policy.policy_head,
    sources: signals,
    // The deterministic path is complete on its own; no classifier opinion
    // participates in the manual route.
    classifier: null,
  });

  const sources: AssemblerSourceV1[] = cut.included.map((capture) => ({
    capture_id: capture.capture_id,
    kind: capture.kind,
    source_sequence: capture.source_sequence,
    occurred_at: capture.occurred_at,
    ...(capture.kind === "media" && capture.media_asset_id
      ? { media_asset_id: capture.media_asset_id }
      : {}),
    ...(capture.kind !== "media" && capture.body_envelope !== undefined
      ? {
          text: deps.protected_content.unseal(
            capture.body_envelope as ProtectedContentEnvelopeV1,
          ),
        }
      : {}),
  }));
  const assembled = assembleDeterministicDraft(deps.integrity_key, scope, {
    // Deterministic per cut: the same watermark of the same trigger identity
    // assembles the same organizer input.
    organizer_input_revision: `${cut.evidence.watermark.source_sequence}@${cut.evidence.triggerRequestId}`,
    sources,
  });
  if (assembled.status === "invalid") {
    return { status: "blocked", reason_code: assembled.reason_code };
  }
  if (assembled.status === "empty") {
    return { status: "blocked", reason_code: "nothing_to_organize" };
  }

  const targets: PublishTargetCandidateV1[] = facts.targets
    .filter((target) => target.enrollment_active && target.grant_allows)
    .map((target) => ({
      child_care_process_id: target.child_care_process_id,
      enrollment_id: target.enrollment_id,
      family_id: target.family_id,
      grant_id: target.grant_id,
      data_class: "daily_care_log",
      purpose_key: "family_daily_care_update",
      authority: facts.authority as CaregiverFactAuthorityV1,
    }));
  if (targets.length === 0) {
    return { status: "blocked", reason_code: "no_eligible_target" };
  }

  return {
    status: "authorized",
    write: {
      batch_id: cut.batch_id,
      evidence: cut.evidence,
      included: cut.included,
      deferred_count: cut.deferred_count,
      assessment: evaluation.assessment,
      content: assembled.content,
      targets,
    },
  };
};

const asWireAction = (
  action: DirectInteractionActionV1,
): OrganizeDirectInteractionActionV1 =>
  action.status === "available"
    ? {
        status: "available",
        capabilityKey: action.capability_key,
        capabilityVersion: action.capability_version,
        targetOptions: action.target_options.map((option) => ({
          targetOptionRef: option.target_option_ref,
          displayLabel: option.display_label,
        })),
      }
    : { status: "unavailable", reasonCode: action.reason_code };

export const createOrganizeCareCaptureBatchSpec = (
  deps: OrganizeSpecDeps,
): NurtureBoardWriteSpec<OrganizeCareCaptureBatchCommandV1> =>
  createBoardWriteSpec<
    OrganizeCareCaptureBatchCommandV1,
    NurtureCareCaptureTransaction,
    NurtureOrganizeCutFacts,
    OrganizeWritePlan
  >({
    capability: ORGANIZE_CARE_CAPTURE_BATCH_CAPABILITY,
    command_scope: ORGANIZE_COMMAND_SCOPE,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizeOrganizeCareCaptureBatchCommand,
    port: {
      select: (tx) => tx.careCapture,
      unavailable_reason_code: "care_capture_port_unavailable",
    },
    revalidateInput: (input) =>
      input.care_group_id.length > 0 &&
      Number.isSafeInteger(input.expected_batch_version) &&
      input.expected_batch_version >= 0
        ? null
        : { status: "invalid", reason_code: "invalid_organize_input" },
    loadFacts: (owner, input, context) =>
      owner.loadOrganizeCutFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        care_group_id: input.care_group_id,
        command_request_id: context.command_request_id,
      }),
    facts_absent_reason_code: "target_unavailable",
    head_keys: ["capture_batch"],
    expectedHeads: (input) => ({ capture_batch: input.expected_batch_version }),
    // Refusals (no batch at all) are decided by authorize BEFORE the head
    // comparison runs, so `-1` is unreachable when a comparison happens.
    currentHeads: (facts) => ({ capture_batch: facts.batch?.batch_version ?? -1 }),
    authorize: (facts, _input, context) => {
      if (!actorEligible(facts.authority as CaregiverFactAuthorityV1)) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      const cut = evaluateManualCut(facts, context.command_request_id);
      if (cut.status === "blocked") return cut;
      return authorizeCut(deps, organizeScope(context), facts, {
        batch_id: facts.batch!.batch_id,
        evidence: cut.evidence,
        included: cut.included,
        deferred_count: cut.deferred_count,
      });
    },
    apply: async (owner, input, context, plan) => {
      const scope = organizeScope(context);
      const decision = await createPublishCandidate(
        {
          integrity_key: deps.integrity_key,
          // The route was derived by authorize from stored markers; the
          // candidate consumes exactly that assessment, not a second one.
          safety: { deriveRoute: async () => plan.assessment },
          direct_message_eligibility: deps.direct_message_eligibility,
          now: () => new Date(plan.evidence.watermark.cut_at),
        },
        scope,
        {
          care_group_id: input.care_group_id,
          organizer_input_revision: plan.content.organizerInputRevision,
          source_ids: plan.included.map((capture) => capture.capture_id),
          content: plan.content,
          targets: plan.targets,
          watermark: plan.evidence.watermark,
          trigger_evidence: plan.evidence,
        },
      );
      if (decision.status === "denied" || decision.status === "skipped") {
        // Authorization pre-decided every refusal path; reaching one here is
        // a defect, and the transaction certainly rolls back.
        throw new NurtureDeterministicRollback(
          decision.status === "denied" ? decision.reason_code : "nothing_to_organize",
        );
      }

      const processKey = publishProcessKey(input.care_group_id, context.command_request_id);
      const applied = await owner.applyOrganizeCut({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        command_request_id: context.command_request_id,
        batch_id: plan.batch_id,
        expected_batch_version: input.expected_batch_version,
        included_capture_ids: plan.included.map((capture) => capture.capture_id),
        organizer_input_revision: plan.content.organizerInputRevision,
        safety: {
          route: plan.assessment.route,
          policy_ref: plan.assessment.policyRef,
          policy_head: plan.assessment.policyHead,
          rule_revision: plan.assessment.ruleRevision,
          risk_codes: plan.assessment.riskCodes,
        },
        watermark: plan.evidence.watermark,
        ...(decision.status !== "direct_interaction_required"
          ? {
              process: {
                process_key: processKey,
                state: decision.status === "draft_created" ? "draft" : "needs_review",
                data_class: "daily_care_log",
                purpose_key: "family_daily_care_update",
                content_digest: decision.process.currentRevision.contentDigest,
                title_envelope: deps.protected_content.seal(plan.content.title),
                ...(plan.content.body
                  ? {
                      body_envelope: deps.protected_content.seal(
                        JSON.stringify(plan.content.body.segments),
                      ),
                    }
                  : {}),
                media_asset_ids: plan.content.mediaRefs,
                source_refs: plan.content.sourceRefs,
                targets: plan.targets.map((target) => ({
                  target_key: publishTargetKey(target),
                  child_care_process_id: target.child_care_process_id,
                  enrollment_id: target.enrollment_id,
                  family_id: target.family_id,
                  grant_id: target.grant_id,
                })),
              },
            }
          : {}),
      });

      const result: OrganizeCareCaptureBatchResultV1 = {
        batchRef: issueBoardSealedRef(
          deps.integrity_key,
          scope,
          "care_capture_batch",
          plan.batch_id,
        ),
        outcome:
          decision.status === "draft_created"
            ? "organized"
            : decision.status === "needs_review"
              ? "needs_review"
              : "direct_interaction_required",
        ...(decision.status !== "direct_interaction_required"
          ? { processRef: decision.process.processRef }
          : { directInteractionAction: asWireAction(decision.action) }),
        watermarkSequence: plan.evidence.watermark.source_sequence,
        includedCaptureCount: plan.included.length,
        deferredCaptureCount: plan.deferred_count,
      };
      return {
        output_refs: [
          applied.batch_ref,
          ...(applied.process_ref ? [applied.process_ref] : []),
        ],
        committed_result: result,
      };
    },
  });

// ---------------------------------------------------------------------------
// Prepare.

export type OrganizePrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | {
      status: "needs_input";
      fields?: string[];
      choices?: Array<{ target_option_ref: string; display_label: string }>;
    }
  | { status: "denied"; reason_code: string };

export type OrganizePrepareDeps = {
  integrity_key: string;
  reads: CaptureBatchReadPort;
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
  now?: () => Date;
};

export const prepareOrganizeCareCaptureBatch = async (
  deps: OrganizePrepareDeps,
  request: BoardScopeV1 & {
    surface: string;
    host_conversation_ref?: string;
    operation_input?: unknown;
    target_option_ref?: string;
  },
): Promise<OrganizePrepareDecision> => {
  if (
    request.operation_input !== undefined &&
    (typeof request.operation_input !== "object" ||
      request.operation_input === null ||
      Array.isArray(request.operation_input) ||
      Object.keys(request.operation_input).length > 0)
  ) {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const groups = await deps.reads.listOrganizeCareGroups(scope);
  if (groups.length === 0) return { status: "denied", reason_code: "not_authorized" };
  if (!request.target_option_ref) {
    return {
      status: "needs_input",
      choices: groups.map((group) => ({
        target_option_ref: issueBoardSealedRef(
          deps.integrity_key,
          scope,
          CARE_GROUP_TARGET_KIND,
          group.care_group_id,
        ),
        display_label: group.display_label,
      })),
    };
  }
  const careGroupId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    CARE_GROUP_TARGET_KIND,
    request.target_option_ref,
    groups.map((group) => group.care_group_id),
  );
  if (!careGroupId) return { status: "denied", reason_code: "target_unavailable" };

  const now = (deps.now ?? (() => new Date()))();
  const source = await deps.reads.loadOrganizeSource({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    care_group_id: careGroupId,
    snapshot_at: now.toISOString(),
  });
  if (!source) return { status: "denied", reason_code: "nothing_to_organize" };
  if (!source.organize_policy) {
    return { status: "denied", reason_code: "policy_unavailable" };
  }
  if (source.state !== "collecting") {
    return { status: "denied", reason_code: "nothing_to_organize" };
  }
  const { included, deferred } = resolveCaptureWatermark(
    source.captures,
    now.toISOString(),
  );
  if (included.length === 0) {
    return { status: "denied", reason_code: "nothing_to_organize" };
  }

  const command: OrganizeCareCaptureBatchCommandV1 = {
    care_group_id: careGroupId,
    expected_batch_version: source.batch_version,
  };
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: ORGANIZE_CARE_CAPTURE_BATCH_CAPABILITY.key,
      capability_version: ORGANIZE_CARE_CAPTURE_BATCH_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { care_group: careGroupId },
      // A capture landing between prepare and execute bumps the batch
      // version: the cut the teacher confirmed is then stale, not silently
      // wider.
      expected_heads: { capture_batch: source.batch_version },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeOrganizeCareCaptureBatchCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: ORGANIZE_CARE_CAPTURE_BATCH_CAPABILITY.key,
      included_capture_count: included.length,
      deferred_capture_count: deferred.length,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};
