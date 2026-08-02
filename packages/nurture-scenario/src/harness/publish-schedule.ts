import {
  validateOrganizeTriggerPolicy,
  type OrganizeTriggerPolicyV1,
} from "./care-capture-batch.js";
import {
  evaluateQuickAdjust,
  isLegalPublishProcessTransition,
  type PublishProcessStateV1,
  type QuickAdjustPostureV1,
} from "./publish-process.js";

/**
 * G3-D schedule resolution (02-architecture.md D-09).
 *
 * T-006 consumes `nurture.institution-publication-policy@1.0.0` exactly and
 * owns none of it. A process resolves its send window once, from the server
 * clock and the institution timezone, and freezes the policy identity with it —
 * a later policy edit never silently moves content that is already queued.
 *
 * The provider itself is still absent, so every resolution here runs against an
 * exact isolated fixture and no real schedule is claimed.
 */
export const INSTITUTION_PUBLICATION_POLICY_CONTRACT = {
  key: "nurture.institution-publication-policy",
  version: "1.0.0",
} as const;

/** Pilot operating values from the T-007 freeze; not correctness constants. */
export const PILOT_RELEASE_DEFAULTS = {
  default_release_local_time: "17:00",
  retry_cutoff_local_time: "19:00",
} as const;

export type InstitutionPublicationPolicyV1 = OrganizeTriggerPolicyV1 & {
  institution_ref: string;
  policy_version: number;
  retry_cutoff_local_time: string;
  effective_from: string;
  effective_to?: string;
};

const LOCAL_TIME_PATTERN = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

export type PolicyValidationV1 =
  | { status: "ok" }
  | { status: "invalid"; reason_code: string };

export const validateInstitutionPublicationPolicy = (
  policy: InstitutionPublicationPolicyV1,
  now: Date,
): PolicyValidationV1 => {
  const organize = validateOrganizeTriggerPolicy(policy);
  if (organize.status === "invalid") return organize;
  if (!policy.institution_ref) {
    return { status: "invalid", reason_code: "missing_institution_ref" };
  }
  if (!Number.isSafeInteger(policy.policy_version) || policy.policy_version < 1) {
    return { status: "invalid", reason_code: "invalid_policy_version" };
  }
  if (!LOCAL_TIME_PATTERN.test(policy.retry_cutoff_local_time)) {
    return { status: "invalid", reason_code: "invalid_retry_cutoff_local_time" };
  }
  if (localMinutes(policy.retry_cutoff_local_time) <= localMinutes(policy.default_release_local_time)) {
    // A cutoff at or before the send time would leave no retry window at all.
    return { status: "invalid", reason_code: "cutoff_not_after_release" };
  }
  const from = Date.parse(policy.effective_from);
  if (Number.isNaN(from) || from > now.getTime()) {
    return { status: "invalid", reason_code: "policy_not_yet_effective" };
  }
  if (policy.effective_to !== undefined) {
    const to = Date.parse(policy.effective_to);
    if (Number.isNaN(to) || to <= now.getTime()) {
      return { status: "invalid", reason_code: "policy_expired" };
    }
  }
  return { status: "ok" };
};

const localMinutes = (value: string): number => {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
};

type ZonedParts = { year: number; month: number; day: number };

const zonedParts = (instant: Date, timeZone: string): ZonedParts => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day") };
};

const zonedOffsetMs = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour") % 24,
    read("minute"),
    read("second"),
  );
  return asUtc - instant.getTime();
};

/**
 * Turns an institution-local wall-clock time into a UTC instant. The offset is
 * applied twice so a send window that straddles a DST change still lands on the
 * wall-clock time the institution configured.
 */
export const zonedLocalTimeToInstant = (
  date: ZonedParts,
  minutesOfDay: number,
  timeZone: string,
): Date => {
  const naive = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    Math.floor(minutesOfDay / 60),
    minutesOfDay % 60,
  );
  let instant = naive;
  for (let pass = 0; pass < 2; pass += 1) {
    instant = naive - zonedOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
};

const addDays = (date: ZonedParts, days: number): ZonedParts => {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

/** The frozen schedule a process carries for its whole life. */
export type ResolvedPublishScheduleV1 = {
  scheduledAt: string;
  notAfter: string;
  timeZone: string;
  policyRef: string;
  policyHead: number;
  policyVersion: number;
  resolvedAt: string;
};

export type ScheduleResolutionV1 =
  | { status: "resolved"; schedule: ResolvedPublishScheduleV1 }
  | { status: "unavailable"; reason_code: string };

/**
 * Resolves one send window. Content queued after today's cutoff takes the next
 * day's window — that is a first resolution, not the silent roll-forward D-09
 * forbids for a process that already missed its own window.
 */
export const resolvePublishSchedule = (input: {
  policy: InstitutionPublicationPolicyV1 | null;
  now: Date;
}): ScheduleResolutionV1 => {
  if (!input.policy) return { status: "unavailable", reason_code: "policy_unavailable" };
  const validation = validateInstitutionPublicationPolicy(input.policy, input.now);
  if (validation.status === "invalid") {
    return { status: "unavailable", reason_code: validation.reason_code };
  }
  const { policy, now } = input;
  const today = zonedParts(now, policy.time_zone);
  const releaseMinutes = localMinutes(policy.default_release_local_time);
  const cutoffMinutes = localMinutes(policy.retry_cutoff_local_time);

  let day = today;
  let notAfter = zonedLocalTimeToInstant(day, cutoffMinutes, policy.time_zone);
  if (notAfter.getTime() <= now.getTime()) {
    day = addDays(today, 1);
    notAfter = zonedLocalTimeToInstant(day, cutoffMinutes, policy.time_zone);
  }
  const scheduledAt = zonedLocalTimeToInstant(day, releaseMinutes, policy.time_zone);

  return {
    status: "resolved",
    schedule: {
      scheduledAt: scheduledAt.toISOString(),
      notAfter: notAfter.toISOString(),
      timeZone: policy.time_zone,
      policyRef: policy.policy_ref,
      policyHead: policy.policy_head,
      policyVersion: policy.policy_version,
      resolvedAt: now.toISOString(),
    },
  };
};

/**
 * A later policy edit applies to content that has not been queued yet. An
 * already-resolved schedule keeps its frozen values, so nobody's card silently
 * moves to a new send time.
 */
export const scheduleAfterPolicyChange = (input: {
  frozen: ResolvedPublishScheduleV1;
  current_policy_head: number;
}): { moved: false; schedule: ResolvedPublishScheduleV1; policyDrift: boolean } => ({
  moved: false,
  schedule: input.frozen,
  policyDrift: input.current_policy_head !== input.frozen.policyHead,
});

// ---------------------------------------------------------------------------
// Reschedule

export const RESCHEDULE_PUBLISH_PROCESS_CAPABILITY = {
  key: "reschedule_publish_process",
  version: "1.0.0",
} as const;

export type RescheduleDecisionV1 =
  | { status: "rescheduled"; schedule: ResolvedPublishScheduleV1 }
  | { status: "denied"; reason_code: string }
  | { status: "needs_input"; fields: string[] };

export type RescheduleInputV1 = { scheduledAt: string };

export const parseRescheduleInputV1 = (
  value: unknown,
): { status: "ok"; input: RescheduleInputV1 } | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["scheduledAt"] };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => key !== "scheduledAt");
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  const scheduledAt = record.scheduledAt;
  if (
    typeof scheduledAt !== "string" ||
    Number.isNaN(Date.parse(scheduledAt)) ||
    new Date(scheduledAt).toISOString() !== scheduledAt
  ) {
    return { status: "invalid", fields: ["scheduledAt"] };
  }
  return { status: "ok", input: { scheduledAt } };
};

/**
 * A class teacher may move a queued card inside its own frozen window. Moving
 * past the cutoff would need a fresh resolution, and a released or cancelled
 * process is not reschedulable at all.
 */
export const evaluateReschedule = (input: {
  now: Date;
  state: PublishProcessStateV1;
  frozen: ResolvedPublishScheduleV1;
  edit_hold_held_by_other: boolean;
  has_committed_release: boolean;
  operation_input: unknown;
}): RescheduleDecisionV1 => {
  const parsed = parseRescheduleInputV1(input.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (input.has_committed_release || input.state === "released") {
    return { status: "denied", reason_code: "already_released" };
  }
  if (input.state !== "pending_release") {
    return { status: "denied", reason_code: "process_not_queued" };
  }
  if (input.edit_hold_held_by_other) {
    return { status: "denied", reason_code: "edit_hold_active" };
  }
  const requested = Date.parse(parsed.input.scheduledAt);
  if (requested < input.now.getTime()) {
    return { status: "denied", reason_code: "scheduled_at_in_past" };
  }
  if (requested >= Date.parse(input.frozen.notAfter)) {
    return { status: "denied", reason_code: "scheduled_at_after_cutoff" };
  }
  return {
    status: "rescheduled",
    schedule: { ...input.frozen, scheduledAt: parsed.input.scheduledAt },
  };
};

// ---------------------------------------------------------------------------
// Scheduler attempt window

export type SchedulerAttemptDecisionV1 =
  | { status: "attempt" }
  | { status: "wait"; reason_code: "before_scheduled_at" }
  | {
      status: "skip";
      reason_code:
        | "not_queued"
        | "edit_hold_active"
        | "unsaved_revision"
        | "authorizing_role_lapsed"
        | "policy_drift"
        | "quick_adjust_active";
    }
  | { status: "missed"; reason_code: "past_cutoff" };

/**
 * One scheduler attempt. Every axis is re-read here: drift skips the process
 * rather than publishing an old revision, and a lapsed authorizing teacher is
 * never silently replaced by another. Past the cutoff the card stays queued and
 * surfaces a missed-send attention instead of publishing late at night.
 */
export const evaluateSchedulerAttempt = (input: {
  now: Date;
  state: PublishProcessStateV1;
  schedule: ResolvedPublishScheduleV1;
  authorizing_role_current: boolean;
  edit_hold_active: boolean;
  has_unsaved_revision: boolean;
  policy_head_current: number;
  quick_adjust_active: boolean;
  /** A released process is still attempted while some target has not committed. */
  has_uncommitted_targets?: boolean;
}): SchedulerAttemptDecisionV1 => {
  const retryingPartial =
    input.state === "released" && input.has_uncommitted_targets === true;
  if (input.state !== "pending_release" && !retryingPartial) {
    return { status: "skip", reason_code: "not_queued" };
  }
  if (input.now.getTime() >= Date.parse(input.schedule.notAfter)) {
    return { status: "missed", reason_code: "past_cutoff" };
  }
  if (input.now.getTime() < Date.parse(input.schedule.scheduledAt)) {
    return { status: "wait", reason_code: "before_scheduled_at" };
  }
  if (input.quick_adjust_active) {
    return { status: "skip", reason_code: "quick_adjust_active" };
  }
  if (input.edit_hold_active) return { status: "skip", reason_code: "edit_hold_active" };
  if (input.has_unsaved_revision) {
    return { status: "skip", reason_code: "unsaved_revision" };
  }
  if (!input.authorizing_role_current) {
    return { status: "skip", reason_code: "authorizing_role_lapsed" };
  }
  if (input.policy_head_current !== input.schedule.policyHead) {
    // Policy drift blocks an existing queued card; it never rewrites its window.
    return { status: "skip", reason_code: "policy_drift" };
  }
  return { status: "attempt" };
};

// ---------------------------------------------------------------------------
// Entering the send queue

export type PendingReleaseAdmissionV1 =
  | { status: "admitted"; schedule: ResolvedPublishScheduleV1 }
  | {
      status: "blocked";
      reason_code:
        | "quick_adjust_active"
        | "needs_review"
        | "edit_hold_active"
        | "unsaved_revision"
        | "illegal_transition"
        | "dependency_no_go";
    };

/**
 * Everything that must hold before content enters the send queue, including the
 * institution window it will carry from then on. `needs_review` is refused here
 * even though the state machine allows the transition: the gray-zone lane is
 * resolved by a class teacher, never advanced by a timeout.
 */
export const admitToPendingRelease = (input: {
  now: Date;
  state: PublishProcessStateV1;
  posture?: QuickAdjustPostureV1;
  editing: boolean;
  edit_hold_active: boolean;
  has_unsaved_revision: boolean;
  schedule: ScheduleResolutionV1;
}): PendingReleaseAdmissionV1 => {
  if (input.state === "needs_review") {
    return { status: "blocked", reason_code: "needs_review" };
  }
  if (!isLegalPublishProcessTransition(input.state, "pending_release")) {
    return { status: "blocked", reason_code: "illegal_transition" };
  }
  if (input.edit_hold_active) return { status: "blocked", reason_code: "edit_hold_active" };
  if (input.has_unsaved_revision) {
    return { status: "blocked", reason_code: "unsaved_revision" };
  }
  if (input.posture) {
    const quickAdjust = evaluateQuickAdjust({
      now: input.now,
      posture: input.posture,
      editing: input.editing,
      edit_hold_active: input.edit_hold_active,
    });
    // A scheduler may never publish before this candidate's own deadline.
    if (quickAdjust.status !== "elapsed") {
      return { status: "blocked", reason_code: "quick_adjust_active" };
    }
  }
  // Without a resolved institution window there is no send time to queue for.
  if (input.schedule.status !== "resolved") {
    return { status: "blocked", reason_code: "dependency_no_go" };
  }
  return { status: "admitted", schedule: input.schedule.schedule };
};
