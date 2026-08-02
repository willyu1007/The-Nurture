import { CAREGIVER_BOARD_ROLES, type CaregiverFactAuthorityV1 } from "./board-projection.js";

/**
 * G3-B1 capture lane (01-plan.md D-10, decision status locked).
 *
 * A photo, a note, a finished upload or a ready media asset is never a family
 * publication candidate and never starts the quick-adjust window. Everything
 * lands in the current CareGroup's pending-organize batch first, and only an
 * explicit organize trigger cuts a batch at a stable source watermark.
 *
 * This module is pure: it decides, it never writes and it never reads a clock
 * of its own.
 */
export const ORGANIZE_CARE_CAPTURE_BATCH_CAPABILITY = {
  key: "organize_care_capture_batch",
  version: "1.0.0",
} as const;

/**
 * Pilot values from the T-007 publication-policy contract. They are operating
 * parameters, not correctness constants: an institution may retune or disable
 * an automatic trigger without changing any authority or idempotency rule.
 */
export const PILOT_ORGANIZE_TRIGGER_DEFAULTS = {
  organize_idle_seconds: 600,
  organize_fallback_lead_seconds: 1800,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 60,
  default_release_local_time: "17:00",
} as const;

/** The gate is configurable but can never be disabled while auto-organize is on. */
export const QUIESCENCE_MIN_SECONDS = 30;
export const QUIESCENCE_MAX_SECONDS = 180;

export type OrganizeTriggerPolicyV1 = {
  policy_ref: string;
  policy_head: number;
  time_zone: string;
  default_release_local_time: string;
  organize_idle_seconds: number;
  organize_fallback_lead_seconds: number;
  automatic_quiescence_seconds: number;
  capture_activity_lease_seconds: number;
  automatic_organize_enabled: boolean;
};

export type CaptureBatchStateV1 = "collecting" | "cut" | "organized" | "cancelled";

export type CaptureIntakeKindV1 = "text" | "voice_transcript" | "media";

export type RawCaptureRow = {
  capture_id: string;
  kind: CaptureIntakeKindV1;
  /**
   * True only once the owner holds a durable source head: text saved, media
   * settled. An upload still in flight is never stable, however far along its
   * progress bar is.
   */
  stable: boolean;
  /** Monotonic intake order inside the batch; the watermark is expressed in it. */
  source_sequence: number;
  occurred_at: string;
  authority: CaregiverFactAuthorityV1;
};

/**
 * The class-level activity head the automatic triggers observe. Only real user
 * operations advance `last_user_activity_at`; upload percentages, thumbnails,
 * sync heartbeats and provider jobs are recorded separately precisely so they
 * cannot reset a gate or block a cut.
 */
export type CaptureActivityHeadV1 = {
  last_user_activity_at: string;
  last_machine_progress_at?: string;
  /** Short-TTL lease meaning "someone is capturing right now". Never authority. */
  activity_lease_expires_at?: string;
};

export type CaptureWatermarkV1 = {
  /** Highest source sequence whose entire prefix is stable. */
  source_sequence: number;
  cut_at: string;
};

export type OrganizeTriggerKindV1 = "manual" | "idle" | "daily_fallback";

export type OrganizeTriggerEvidenceV1 = {
  trigger: OrganizeTriggerKindV1;
  triggerRequestId: string;
  policyRef: string;
  policyHead: number;
  timeZone: string;
  quiescenceSeconds: number;
  observedUserActivityAt: string;
  leaseActive: boolean;
  watermark: CaptureWatermarkV1;
};

export type OrganizeWaitReasonV1 =
  | "automatic_disabled"
  | "batch_not_collecting"
  | "empty_stable_batch"
  | "idle_not_reached"
  | "fallback_not_due"
  | "quiescence_gate";

export type OrganizeTriggerDecisionV1 =
  | {
      status: "cut";
      evidence: OrganizeTriggerEvidenceV1;
      /** Captures the organizer input revision is frozen from. */
      includedCaptureIds: string[];
      /** Unstable or post-watermark captures; they belong to the next batch. */
      deferredCaptureIds: string[];
    }
  | { status: "waiting"; reason: OrganizeWaitReasonV1 }
  | { status: "invalid"; reason_code: string };

export type OrganizeTriggerRequestV1 = {
  trigger: OrganizeTriggerKindV1;
  trigger_request_id: string;
  now: Date;
  policy: OrganizeTriggerPolicyV1;
  batch: {
    state: CaptureBatchStateV1;
    captures: RawCaptureRow[];
    activity: CaptureActivityHeadV1;
  };
  /** Set by the owner when the daily fallback point has already been reached. */
  fallback_due_at?: string;
};

const LOCAL_TIME_PATTERN = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

export const validateOrganizeTriggerPolicy = (
  policy: OrganizeTriggerPolicyV1,
): { status: "ok" } | { status: "invalid"; reason_code: string } => {
  if (!policy.policy_ref || !Number.isSafeInteger(policy.policy_head) || policy.policy_head < 1) {
    return { status: "invalid", reason_code: "invalid_policy_head" };
  }
  if (!LOCAL_TIME_PATTERN.test(policy.default_release_local_time)) {
    return { status: "invalid", reason_code: "invalid_release_local_time" };
  }
  if (!isResolvableTimeZone(policy.time_zone)) {
    return { status: "invalid", reason_code: "invalid_time_zone" };
  }
  for (const seconds of [
    policy.organize_idle_seconds,
    policy.organize_fallback_lead_seconds,
    policy.capture_activity_lease_seconds,
  ]) {
    if (!Number.isSafeInteger(seconds) || seconds < 0) {
      return { status: "invalid", reason_code: "invalid_policy_interval" };
    }
  }
  if (policy.automatic_organize_enabled) {
    // A zero gate would let an automatic trigger interrupt an active teacher.
    if (
      !Number.isSafeInteger(policy.automatic_quiescence_seconds) ||
      policy.automatic_quiescence_seconds < QUIESCENCE_MIN_SECONDS ||
      policy.automatic_quiescence_seconds > QUIESCENCE_MAX_SECONDS
    ) {
      return { status: "invalid", reason_code: "invalid_quiescence_gate" };
    }
    if (policy.organize_idle_seconds < policy.automatic_quiescence_seconds) {
      return { status: "invalid", reason_code: "idle_below_quiescence_gate" };
    }
  }
  return { status: "ok" };
};

const isResolvableTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

/** Institution-local minutes since midnight, from the server clock. */
export const localMinutesOfDay = (now: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return (hour % 24) * 60 + minute;
};

/** `default send window - autoOrganizeLeadTime`, in institution-local minutes. */
export const fallbackLocalMinutes = (policy: OrganizeTriggerPolicyV1): number => {
  const [hour, minute] = policy.default_release_local_time.split(":").map(Number);
  const releaseMinutes = (hour ?? 0) * 60 + (minute ?? 0);
  const leadMinutes = Math.floor(policy.organize_fallback_lead_seconds / 60);
  return ((releaseMinutes - leadMinutes) % 1440 + 1440) % 1440;
};

/**
 * The stable prefix of the batch. Using a true low-water mark keeps an in-flight
 * upload from being skipped over and stranded behind a later, already-settled
 * capture: everything from the first unstable capture onwards moves together
 * into the next batch.
 */
export const resolveCaptureWatermark = (
  captures: readonly RawCaptureRow[],
  cutAt: string,
): { watermark: CaptureWatermarkV1; included: RawCaptureRow[]; deferred: RawCaptureRow[] } => {
  const ordered = [...captures].sort((left, right) => left.source_sequence - right.source_sequence);
  const included: RawCaptureRow[] = [];
  let deferredFrom = ordered.length;
  for (const [index, capture] of ordered.entries()) {
    if (!capture.stable || !captureVisible(capture)) {
      deferredFrom = index;
      break;
    }
    included.push(capture);
  }
  return {
    watermark: {
      source_sequence: included.at(-1)?.source_sequence ?? 0,
      cut_at: cutAt,
    },
    included,
    deferred: ordered.slice(deferredFrom),
  };
};

const captureVisible = (capture: RawCaptureRow): boolean =>
  CAREGIVER_BOARD_ROLES.includes(capture.authority.role) &&
  capture.authority.role_scope_type === "care_group" &&
  capture.authority.role_scope_matches_source &&
  capture.authority.role_assignment_current;

const leaseActive = (activity: CaptureActivityHeadV1, now: Date): boolean =>
  activity.activity_lease_expires_at !== undefined &&
  new Date(activity.activity_lease_expires_at).getTime() > now.getTime();

const idleSeconds = (activity: CaptureActivityHeadV1, now: Date): number =>
  (now.getTime() - new Date(activity.last_user_activity_at).getTime()) / 1000;

/**
 * Resolves exactly one organize trigger.
 *
 * The one-minute quiescence gate is an anti-interruption guard on the automatic
 * triggers, never a fourth trigger of its own: manual bypasses it, and a mature
 * idle period already satisfies it, so it is only consulted when the daily
 * fallback comes due while someone is still working.
 */
export const evaluateOrganizeTrigger = (
  request: OrganizeTriggerRequestV1,
): OrganizeTriggerDecisionV1 => {
  const policyCheck = validateOrganizeTriggerPolicy(request.policy);
  if (policyCheck.status === "invalid") {
    return { status: "invalid", reason_code: policyCheck.reason_code };
  }
  if (request.batch.state !== "collecting") {
    return { status: "waiting", reason: "batch_not_collecting" };
  }
  const { policy, batch, now } = request;
  const automatic = request.trigger !== "manual";
  if (automatic && !policy.automatic_organize_enabled) {
    return { status: "waiting", reason: "automatic_disabled" };
  }

  const lease = leaseActive(batch.activity, now);
  if (request.trigger === "idle") {
    // An active capture lease suspends idle maturity as well as the gate.
    if (lease || idleSeconds(batch.activity, now) < policy.organize_idle_seconds) {
      return { status: "waiting", reason: "idle_not_reached" };
    }
  }
  if (request.trigger === "daily_fallback") {
    if (request.fallback_due_at === undefined) {
      const localMinutes = localMinutesOfDay(now, policy.time_zone);
      if (localMinutes < fallbackLocalMinutes(policy)) {
        return { status: "waiting", reason: "fallback_not_due" };
      }
    }
    // Due, but never mid-activity: wait out the gate instead of the full idle
    // period, then cut immediately.
    if (lease || idleSeconds(batch.activity, now) < policy.automatic_quiescence_seconds) {
      return { status: "waiting", reason: "quiescence_gate" };
    }
  }

  const cutAt = now.toISOString();
  const { watermark, included, deferred } = resolveCaptureWatermark(batch.captures, cutAt);
  if (included.length === 0) {
    // An empty cut produces no organizer job and no publication candidate.
    return { status: "waiting", reason: "empty_stable_batch" };
  }

  return {
    status: "cut",
    evidence: {
      trigger: request.trigger,
      triggerRequestId: request.trigger_request_id,
      policyRef: policy.policy_ref,
      policyHead: policy.policy_head,
      timeZone: policy.time_zone,
      quiescenceSeconds: policy.automatic_quiescence_seconds,
      observedUserActivityAt: batch.activity.last_user_activity_at,
      leaseActive: lease,
      watermark,
    },
    includedCaptureIds: included.map((capture) => capture.capture_id),
    deferredCaptureIds: deferred.map((capture) => capture.capture_id),
  };
};
