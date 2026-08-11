import {
  FAMILY_GROWTH_LIFECYCLE_STATES,
  FAMILY_GROWTH_QUEUE_STATES,
  PUBLISH_PROCESS_STATES,
  RELEASE_PUBLISH_PROCESS_CAPABILITY,
  TEACHER_PUBLISH_QUEUE_ORDER,
  TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR,
  type TargetReleaseOutcomeV1,
  type TeacherPublishQueueOutputV1,
  type ReleaseTargetPresentationDecisionV1,
} from "@the-nurture/scenario";
import type {
  HarnessExecuteResponseV1,
  HarnessPrepareResponseV1,
  HarnessQueryResponseV1,
} from "./harness-http.js";

const SAFE_CONFIRM_REASON_VALUES = [
  "confirmation_expired",
  "confirmation_replayed",
  "invalid_confirmation",
  "stale_confirmation",
] as const;
export type SafeConfirmReason = (typeof SAFE_CONFIRM_REASON_VALUES)[number];
const SAFE_CONFIRM_REASONS = new Set<string>(SAFE_CONFIRM_REASON_VALUES);
const SAFE_CONFIRM_RESULT_BY_REASON = {
  confirmation_expired: { decision: "conflict", recovery: "reprepare" },
  confirmation_replayed: { decision: "conflict", recovery: "refresh" },
  invalid_confirmation: { decision: "blocked", recovery: "none" },
  stale_confirmation: { decision: "conflict", recovery: "reprepare" },
} as const satisfies Record<
  SafeConfirmReason,
  {
    decision: "blocked" | "conflict";
    recovery: "none" | "refresh" | "reprepare";
  }
>;
const PROCESS_STATE_SET = new Set<string>(PUBLISH_PROCESS_STATES);
const FAMILY_GROWTH_STATE_SET = new Set<string>(FAMILY_GROWTH_QUEUE_STATES);
const FAMILY_GROWTH_LIFECYCLE_SET = new Set<string>(
  FAMILY_GROWTH_LIFECYCLE_STATES,
);
const SOURCE_KIND_SET = new Set([
  "family_charter",
  "family_charter_item",
  "focus_cycle",
  "focus_goal",
  "focus_goal_child_scope",
  "publication_release",
  "daily_care_log",
  "teacher_attention_item",
  "care_interaction_item",
  "enrollment",
  "care_group_role",
  "child_link_grant",
]);
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,2047}$/;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const CONFIRMATION_REF_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const CANONICAL_UTC_INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return (
    required.every((key) => key in value) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
};

const isRef = (value: unknown): value is string =>
  typeof value === "string" && REF_PATTERN.test(value);
const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isInstant = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !CANONICAL_UTC_INSTANT_PATTERN.test(value)
  ) {
    return false;
  }
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value;
};
const isBoundedText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const isSafeDisplayText = (value: unknown, max: number): value is string =>
  isBoundedText(value, max) &&
  value === value.trim() &&
  !hasControlCharacter(value);
const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  });

export type TeacherReleaseOwnerTargetResultV3 = {
  targetRef: string;
  outcome: TargetReleaseOutcomeV1;
  publicationRef?: string;
  receiptRef?: string;
  reasonCode?: "target_not_released";
};

export type TeacherReleaseOwnerCommittedResultV3 = {
  processState: "released";
  frozenRevision: number;
  results: TeacherReleaseOwnerTargetResultV3[];
  summary: {
    total: number;
    committed: number;
    rejected: number;
    outcomeUnknown: number;
  };
  missedSendAttention: boolean;
};

export type TeacherReleaseOwnerQueryResultV3 =
  | { status: "ok"; output: TeacherPublishQueueOutputV1 }
  | { status: "refresh_required" };

export type TeacherReleaseOwnerTargetsResultV3 = {
  status: "ok";
  detail: {
    selectionMode: "fixed_process_targets";
    processRef: string;
    targetSnapshotRef: string;
    snapshotVersion: string;
    generatedAt: string;
    expiresAt: string;
    targets: Array<
      | {
          targetRef: string;
          availability: "available" | "already_released";
          displayLabel: string;
          safeDisambiguation?: string;
        }
      | {
          targetRef: string;
          availability: "unavailable";
          safeReasonCode: "target_unavailable";
        }
    >;
  };
};

export type TeacherReleaseOwnerPrepareResultV3 =
  | {
      status: "ready_to_confirm";
      preview: {
        effect: "release_publish_process";
        target_count: number;
        already_committed_count: number;
        release_revision: number;
      };
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | {
      status: "needs_input";
      fields: ["target"] | ["target_snapshot"];
    };

export type TeacherReleaseOwnerConfirmResultV3 =
  | {
      status: "committed";
      execution_disposition: "executed" | "replayed";
      business_outcome: "applied" | "already_satisfied";
      committed_result: TeacherReleaseOwnerCommittedResultV3;
    }
  | {
      status: "not_committed";
      decision: "blocked" | "conflict";
      reason_code: SafeConfirmReason;
      recovery: "none" | "refresh" | "reprepare";
    }
  | {
      status: "outcome_unknown";
      reason_code: "release_outcome_unknown";
      recovery: "reconcile_same_command";
    };

const parseSourceHead = (value: unknown) => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "sourceKind",
      "sourceRef",
      "factVersion",
      "lifecycleHead",
      "visibilityHead",
    ]) ||
    typeof value.sourceKind !== "string" ||
    !SOURCE_KIND_SET.has(value.sourceKind) ||
    !isRef(value.sourceRef) ||
    !isNonNegativeInteger(value.factVersion) ||
    !isBoundedText(value.lifecycleHead, 512) ||
    !isBoundedText(value.visibilityHead, 512)
  ) {
    return null;
  }
  return {
    sourceKind:
      value.sourceKind as TeacherPublishQueueOutputV1["binding"]["sourceHeads"][number]["sourceKind"],
    sourceRef: value.sourceRef,
    factVersion: value.factVersion,
    lifecycleHead: value.lifecycleHead,
    visibilityHead: value.visibilityHead,
  };
};

const parseReleaseAction = (value: unknown) => {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      ["capabilityKey", "capabilityVersion", "availability"],
      ["targetOptionRef"],
    ) ||
    value.capabilityKey !== RELEASE_PUBLISH_PROCESS_CAPABILITY.key ||
    value.capabilityVersion !== RELEASE_PUBLISH_PROCESS_CAPABILITY.version ||
    !["available", "already_satisfied", "needs_input"].includes(
      typeof value.availability === "string" ? value.availability : "",
    ) ||
    (value.targetOptionRef !== undefined && !isRef(value.targetOptionRef))
  ) {
    return null;
  }
  return {
    capabilityKey: RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
    capabilityVersion: RELEASE_PUBLISH_PROCESS_CAPABILITY.version,
    ...(isRef(value.targetOptionRef)
      ? { targetOptionRef: value.targetOptionRef }
      : {}),
    availability: value.availability as
      | "available"
      | "already_satisfied"
      | "needs_input",
  };
};

const parseQueueItem = (
  value: unknown,
): TeacherPublishQueueOutputV1["items"][number] | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "processRef",
        "state",
        "dataClass",
        "title",
        "revision",
        "targetSummary",
        "occurredAt",
        "editHoldActive",
        "actions",
      ],
      ["scheduledAt", "familyGrowth"],
    ) ||
    !isRef(value.processRef) ||
    typeof value.state !== "string" ||
    !PROCESS_STATE_SET.has(value.state) ||
    !["daily_care_log", "child_growth_record"].includes(
      typeof value.dataClass === "string" ? value.dataClass : "",
    ) ||
    !isBoundedText(value.title, 200) ||
    !isNonNegativeInteger(value.revision) ||
    !isInstant(value.occurredAt) ||
    (value.scheduledAt !== undefined && !isInstant(value.scheduledAt)) ||
    typeof value.editHoldActive !== "boolean" ||
    !isRecord(value.targetSummary) ||
    !hasExactKeys(value.targetSummary, ["total", "released"]) ||
    !isNonNegativeInteger(value.targetSummary.total) ||
    !isNonNegativeInteger(value.targetSummary.released) ||
    value.targetSummary.released > value.targetSummary.total ||
    !Array.isArray(value.actions)
  ) {
    return null;
  }
  const actions = value.actions
    .filter(
      (action) =>
        isRecord(action) &&
        action.capabilityKey === RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
    )
    .map(parseReleaseAction);
  if (actions.some((action) => action === null)) return null;

  let familyGrowth:
    | NonNullable<TeacherPublishQueueOutputV1["items"][number]["familyGrowth"]>
    | undefined;
  if (value.familyGrowth !== undefined) {
    if (!Array.isArray(value.familyGrowth)) return null;
    familyGrowth = [];
    for (const raw of value.familyGrowth) {
      if (
        !isRecord(raw) ||
        !hasExactKeys(raw, ["targetRef", "state"], ["lifecycle"]) ||
        !isRef(raw.targetRef) ||
        typeof raw.state !== "string" ||
        !FAMILY_GROWTH_STATE_SET.has(raw.state) ||
        (raw.lifecycle !== undefined &&
          (typeof raw.lifecycle !== "string" ||
            !FAMILY_GROWTH_LIFECYCLE_SET.has(raw.lifecycle)))
      ) {
        return null;
      }
      familyGrowth.push({
        targetRef: raw.targetRef,
        state: raw.state as NonNullable<
          TeacherPublishQueueOutputV1["items"][number]["familyGrowth"]
        >[number]["state"],
        ...(typeof raw.lifecycle === "string"
          ? {
              lifecycle: raw.lifecycle as NonNullable<
                TeacherPublishQueueOutputV1["items"][number]["familyGrowth"]
              >[number]["lifecycle"],
            }
          : {}),
      });
    }
  }

  return {
    processRef: value.processRef,
    state: value.state as TeacherPublishQueueOutputV1["items"][number]["state"],
    dataClass:
      value.dataClass as TeacherPublishQueueOutputV1["items"][number]["dataClass"],
    title: value.title,
    revision: value.revision,
    targetSummary: {
      total: value.targetSummary.total,
      released: value.targetSummary.released,
    },
    occurredAt: value.occurredAt,
    ...(typeof value.scheduledAt === "string"
      ? { scheduledAt: value.scheduledAt }
      : {}),
    editHoldActive: value.editHoldActive,
    actions: actions.filter((action) => action !== null),
    ...(familyGrowth ? { familyGrowth } : {}),
  };
};

const parseQueueOutput = (
  value: unknown,
): TeacherPublishQueueOutputV1 | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "binding",
      "careGroupRef",
      "counts",
      "items",
      "pageInfo",
    ]) ||
    !isRef(value.careGroupRef) ||
    !isRecord(value.binding) ||
    !hasExactKeys(value.binding, [
      "contract",
      "capability",
      "actor",
      "snapshot",
      "order",
      "sourceHeads",
    ]) ||
    !isRecord(value.binding.contract) ||
    !hasExactKeys(value.binding.contract, ["key", "version", "digest"]) ||
    value.binding.contract.key !==
      TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.surface_contract
        .key ||
    value.binding.contract.version !==
      TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.surface_contract
        .version ||
    value.binding.contract.digest !==
      TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.surface_contract
        .digest ||
    !isRecord(value.binding.capability) ||
    !hasExactKeys(value.binding.capability, ["key", "version"]) ||
    value.binding.capability.key !==
      TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.query_capability
        .key ||
    value.binding.capability.version !==
      TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.query_capability
        .version ||
    !isRecord(value.binding.actor) ||
    !hasExactKeys(value.binding.actor, ["role", "scopeKind", "scopeRef"]) ||
    !["caregiver", "lead_caregiver"].includes(
      typeof value.binding.actor.role === "string"
        ? value.binding.actor.role
        : "",
    ) ||
    value.binding.actor.scopeKind !== "care_group" ||
    !isRef(value.binding.actor.scopeRef) ||
    !isRecord(value.binding.snapshot) ||
    !hasExactKeys(value.binding.snapshot, ["snapshotRef", "snapshotVersion"]) ||
    !isRef(value.binding.snapshot.snapshotRef) ||
    !isNonNegativeInteger(value.binding.snapshot.snapshotVersion) ||
    value.binding.order !== TEACHER_PUBLISH_QUEUE_ORDER ||
    !Array.isArray(value.binding.sourceHeads) ||
    !isRecord(value.counts) ||
    !hasExactKeys(value.counts, PUBLISH_PROCESS_STATES) ||
    PUBLISH_PROCESS_STATES.some(
      (state) =>
        !isNonNegativeInteger((value.counts as Record<string, unknown>)[state]),
    ) ||
    !Array.isArray(value.items) ||
    value.items.length > 20 ||
    !isRecord(value.pageInfo) ||
    !hasExactKeys(value.pageInfo, ["hasMore"], ["nextCursor"]) ||
    typeof value.pageInfo.hasMore !== "boolean" ||
    (value.pageInfo.nextCursor !== undefined &&
      !isBoundedText(value.pageInfo.nextCursor, 2048)) ||
    value.pageInfo.hasMore !== (typeof value.pageInfo.nextCursor === "string")
  ) {
    return null;
  }
  const sourceHeads = value.binding.sourceHeads.map(parseSourceHead);
  const items = value.items.map(parseQueueItem);
  if (
    sourceHeads.some((head) => head === null) ||
    items.some((item) => item === null)
  ) {
    return null;
  }
  const counts = value.counts as Record<string, unknown>;
  return {
    binding: {
      contract:
        TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.surface_contract,
      capability:
        TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.dependencies.query_capability,
      actor: {
        role: value.binding.actor.role as "caregiver" | "lead_caregiver",
        scopeKind: "care_group",
        scopeRef: value.binding.actor.scopeRef,
      },
      snapshot: {
        snapshotRef: value.binding.snapshot.snapshotRef,
        snapshotVersion: value.binding.snapshot.snapshotVersion,
      },
      order: TEACHER_PUBLISH_QUEUE_ORDER,
      sourceHeads: sourceHeads.filter((head) => head !== null),
    },
    careGroupRef: value.careGroupRef,
    counts: Object.fromEntries(
      PUBLISH_PROCESS_STATES.map((state) => [state, counts[state]]),
    ) as TeacherPublishQueueOutputV1["counts"],
    items: items.filter((item) => item !== null),
    pageInfo: {
      hasMore: value.pageInfo.hasMore,
      ...(typeof value.pageInfo.nextCursor === "string"
        ? { nextCursor: value.pageInfo.nextCursor }
        : {}),
    },
  };
};

export const sanitizeTeacherReleaseOwnerQuery = (
  response: Exclude<HarnessQueryResponseV1, { status: "denied" }>,
): TeacherReleaseOwnerQueryResultV3 | null => {
  if (response.status === "refresh_required") {
    return hasExactKeys(response, ["status"]) ? response : null;
  }
  if (!hasExactKeys(response, ["status", "output"])) return null;
  const output = parseQueueOutput(response.output);
  return output ? { status: "ok", output } : null;
};

export const sanitizeTeacherReleaseOwnerTargets = (
  response: Extract<ReleaseTargetPresentationDecisionV1, { status: "ready" }>,
): TeacherReleaseOwnerTargetsResultV3 | null => {
  if (!hasExactKeys(response, ["status", "presentation"])) return null;
  const detail = response.presentation;
  if (
    !isRecord(detail) ||
    !hasExactKeys(detail, [
      "selectionMode",
      "processRef",
      "targetSnapshotRef",
      "snapshotVersion",
      "generatedAt",
      "expiresAt",
      "targets",
    ]) ||
    detail.selectionMode !== "fixed_process_targets" ||
    !isRef(detail.processRef) ||
    !isRef(detail.targetSnapshotRef) ||
    !isRef(detail.snapshotVersion) ||
    !isInstant(detail.generatedAt) ||
    !isInstant(detail.expiresAt) ||
    Date.parse(detail.expiresAt) <= Date.parse(detail.generatedAt) ||
    !Array.isArray(detail.targets) ||
    detail.targets.length === 0
  ) {
    return null;
  }
  const targets: TeacherReleaseOwnerTargetsResultV3["detail"]["targets"] = [];
  const refs = new Set<string>();
  for (const value of detail.targets) {
    if (
      !isRecord(value) ||
      !isRef(value.targetRef) ||
      typeof value.availability !== "string" ||
      refs.has(value.targetRef)
    ) {
      return null;
    }
    refs.add(value.targetRef);
    if (value.availability === "unavailable") {
      if (
        !hasExactKeys(value, [
          "targetRef",
          "availability",
          "safeReasonCode",
        ]) ||
        value.safeReasonCode !== "target_unavailable"
      ) {
        return null;
      }
      targets.push({
        targetRef: value.targetRef,
        availability: "unavailable",
        safeReasonCode: "target_unavailable",
      });
      continue;
    }
    if (
      (value.availability !== "available" &&
        value.availability !== "already_released") ||
      !hasExactKeys(
        value,
        ["targetRef", "availability", "displayLabel"],
        ["safeDisambiguation"],
      ) ||
      !isSafeDisplayText(value.displayLabel, 80) ||
      (value.safeDisambiguation !== undefined &&
        !isSafeDisplayText(value.safeDisambiguation, 80))
    ) {
      return null;
    }
    targets.push({
      targetRef: value.targetRef,
      availability: value.availability,
      displayLabel: value.displayLabel,
      ...(typeof value.safeDisambiguation === "string"
        ? { safeDisambiguation: value.safeDisambiguation }
        : {}),
    });
  }
  return {
    status: "ok",
    detail: {
      selectionMode: "fixed_process_targets",
      processRef: detail.processRef,
      targetSnapshotRef: detail.targetSnapshotRef,
      snapshotVersion: detail.snapshotVersion,
      generatedAt: detail.generatedAt,
      expiresAt: detail.expiresAt,
      targets,
    },
  };
};

export const sanitizeTeacherReleaseOwnerPrepare = (
  response: Exclude<
    HarnessPrepareResponseV1,
    { status: "denied" | "unavailable" }
  >,
): TeacherReleaseOwnerPrepareResultV3 | null => {
  if (response.status === "needs_input") {
    if (
      !hasExactKeys(response, ["status", "fields"]) ||
      !Array.isArray(response.fields) ||
      response.fields.length !== 1 ||
      (response.fields[0] !== "target" &&
        response.fields[0] !== "target_snapshot")
    ) {
      return null;
    }
    return {
      status: "needs_input",
      fields: response.fields[0] === "target_snapshot" ? ["target_snapshot"] : ["target"],
    };
  }
  const preview = response.preview;
  if (
    !hasExactKeys(response, [
      "status",
      "preview",
      "confirmation_ref",
      "expires_at",
      "command_request_id",
    ]) ||
    !isRecord(preview) ||
    !hasExactKeys(preview, [
      "effect",
      "target_count",
      "already_committed_count",
      "release_revision",
    ]) ||
    preview.effect !== RELEASE_PUBLISH_PROCESS_CAPABILITY.key ||
    !isNonNegativeInteger(preview.target_count) ||
    !isNonNegativeInteger(preview.already_committed_count) ||
    preview.already_committed_count > preview.target_count ||
    !isNonNegativeInteger(preview.release_revision) ||
    typeof response.confirmation_ref !== "string" ||
    !CONFIRMATION_REF_PATTERN.test(response.confirmation_ref) ||
    !isInstant(response.expires_at) ||
    typeof response.command_request_id !== "string" ||
    !ID_PATTERN.test(response.command_request_id)
  ) {
    return null;
  }
  return {
    status: "ready_to_confirm",
    preview: {
      effect: RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
      target_count: preview.target_count,
      already_committed_count: preview.already_committed_count,
      release_revision: preview.release_revision,
    },
    confirmation_ref: response.confirmation_ref,
    expires_at: response.expires_at,
    command_request_id: response.command_request_id,
  };
};

export const isSafeConfirmReason = (
  value: string,
): value is SafeConfirmReason => SAFE_CONFIRM_REASONS.has(value);

export const sanitizeTeacherReleaseOwnerNotCommitted = (
  response: Extract<HarnessExecuteResponseV1, { status: "not_committed" }>,
): Extract<
  TeacherReleaseOwnerConfirmResultV3,
  { status: "not_committed" }
> | null => {
  const reasonCode = isSafeConfirmReason(response.reason_code)
    ? response.reason_code
    : undefined;
  const expected = reasonCode
    ? SAFE_CONFIRM_RESULT_BY_REASON[reasonCode]
    : undefined;
  if (
    !hasExactKeys(response, [
      "status",
      "decision",
      "reason_code",
      "recovery",
    ]) ||
    !reasonCode ||
    !expected ||
    response.decision !== expected.decision ||
    response.recovery !== expected.recovery
  ) {
    return null;
  }
  return {
    status: "not_committed",
    decision: expected.decision,
    reason_code: reasonCode,
    recovery: expected.recovery,
  };
};

export const sanitizeTeacherReleaseOwnerCommitted = (
  response: Extract<HarnessExecuteResponseV1, { status: "committed" }>,
): Extract<
  TeacherReleaseOwnerConfirmResultV3,
  { status: "committed" }
> | null => {
  if (
    !hasExactKeys(response, [
      "status",
      "execution_disposition",
      "business_outcome",
      "execution_ref",
      "output_refs",
      "committed_result",
    ]) ||
    !["executed", "replayed"].includes(response.execution_disposition) ||
    !["applied", "already_satisfied"].includes(response.business_outcome) ||
    !isRecord(response.committed_result) ||
    !hasExactKeys(response.committed_result, [
      "processState",
      "frozenRevision",
      "results",
      "summary",
      "missedSendAttention",
    ]) ||
    response.committed_result.processState !== "released" ||
    !isNonNegativeInteger(response.committed_result.frozenRevision) ||
    !Array.isArray(response.committed_result.results) ||
    !isRecord(response.committed_result.summary) ||
    !hasExactKeys(response.committed_result.summary, [
      "total",
      "committed",
      "rejected",
      "outcomeUnknown",
    ]) ||
    typeof response.committed_result.missedSendAttention !== "boolean"
  ) {
    return null;
  }
  const results: TeacherReleaseOwnerTargetResultV3[] = [];
  for (const raw of response.committed_result.results) {
    if (
      !isRecord(raw) ||
      !hasExactKeys(
        raw,
        ["targetRef", "outcome"],
        ["publicationRef", "receiptRef", "reasonCode", "blockingReasons"],
      ) ||
      !isRef(raw.targetRef) ||
      ![
        "committed",
        "already_committed",
        "rejected",
        "outcome_unknown",
      ].includes(typeof raw.outcome === "string" ? raw.outcome : "") ||
      (raw.publicationRef !== undefined && !isRef(raw.publicationRef)) ||
      (raw.receiptRef !== undefined && !isRef(raw.receiptRef))
    ) {
      return null;
    }
    const outcome = raw.outcome as TargetReleaseOutcomeV1;
    const committed =
      outcome === "committed" || outcome === "already_committed";
    if (
      committed !==
      (typeof raw.publicationRef === "string" &&
        typeof raw.receiptRef === "string")
    ) {
      return null;
    }
    results.push({
      targetRef: raw.targetRef,
      outcome,
      ...(typeof raw.publicationRef === "string"
        ? { publicationRef: raw.publicationRef }
        : {}),
      ...(typeof raw.receiptRef === "string"
        ? { receiptRef: raw.receiptRef }
        : {}),
      ...(outcome === "rejected"
        ? { reasonCode: "target_not_released" as const }
        : {}),
    });
  }
  const committed = results.filter(
    (target) =>
      target.outcome === "committed" || target.outcome === "already_committed",
  ).length;
  const rejected = results.filter(
    (target) => target.outcome === "rejected",
  ).length;
  const outcomeUnknown = results.filter(
    (target) => target.outcome === "outcome_unknown",
  ).length;
  const summary = response.committed_result.summary;
  if (
    !isNonNegativeInteger(summary.total) ||
    !isNonNegativeInteger(summary.committed) ||
    !isNonNegativeInteger(summary.rejected) ||
    !isNonNegativeInteger(summary.outcomeUnknown) ||
    summary.total !== results.length ||
    summary.committed !== committed ||
    summary.rejected !== rejected ||
    summary.outcomeUnknown !== outcomeUnknown ||
    committed === 0
  ) {
    return null;
  }
  return {
    status: "committed",
    execution_disposition: response.execution_disposition,
    business_outcome: response.business_outcome,
    committed_result: {
      processState: "released",
      frozenRevision: response.committed_result.frozenRevision,
      results,
      summary: { total: summary.total, committed, rejected, outcomeUnknown },
      missedSendAttention: response.committed_result.missedSendAttention,
    },
  };
};
