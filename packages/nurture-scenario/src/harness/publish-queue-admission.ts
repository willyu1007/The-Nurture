import type {
  NurturePublishQueueAdmissionFacts,
  NurturePublishQueueAdmissionTransaction,
} from "../domain/institution/publish-queue-admission.js";
import { DEFAULT_QUICK_ADJUST_SECONDS } from "./publish-process.js";
import {
  resolvePublishSchedule,
  type ResolvedPublishScheduleV1,
} from "./publish-schedule.js";

export type PublishQueueAdmissionDecisionV1 =
  | { status: "ready"; schedule: ResolvedPublishScheduleV1 }
  | { status: "already_satisfied"; schedule: ResolvedPublishScheduleV1 }
  | { status: "waiting"; reason_code: "quick_adjust_active" | "edit_hold_active" }
  | {
      status: "blocked";
      reason_code:
        | "target_unavailable"
        | "needs_review"
        | "process_not_draft"
        | "unsaved_revision"
        | "authorizing_role_lapsed"
        | "publication_policy_unavailable";
    };

/**
 * Scenario-owned admission rule called by a host-owned timer. The host decides
 * when to retry; Nurture alone decides whether the owner fact may enter the
 * queue and freezes the T-007 schedule in the same transaction.
 */
export const evaluatePublishQueueAdmission = (
  facts: NurturePublishQueueAdmissionFacts,
): PublishQueueAdmissionDecisionV1 => {
  if (facts.process_state === "pending_release" && facts.schedule) {
    return { status: "already_satisfied", schedule: facts.schedule };
  }
  if (facts.process_state === "needs_review") {
    return { status: "blocked", reason_code: "needs_review" };
  }
  if (facts.process_state !== "draft") {
    return { status: "blocked", reason_code: "process_not_draft" };
  }
  if (facts.current_revision < 1) {
    return { status: "blocked", reason_code: "unsaved_revision" };
  }
  if (!facts.authorizing_role_assignment_id || !facts.authorizing_role_current) {
    return { status: "blocked", reason_code: "authorizing_role_lapsed" };
  }

  const now = new Date(facts.read_at);
  const createdAt = new Date(facts.created_at);
  if (Number.isNaN(now.getTime()) || Number.isNaN(createdAt.getTime())) {
    return { status: "blocked", reason_code: "target_unavailable" };
  }
  if (
    facts.current_hold_expires_at &&
    Date.parse(facts.current_hold_expires_at) > now.getTime()
  ) {
    return { status: "waiting", reason_code: "edit_hold_active" };
  }
  if (
    now.getTime() <
    createdAt.getTime() + DEFAULT_QUICK_ADJUST_SECONDS * 1_000
  ) {
    return { status: "waiting", reason_code: "quick_adjust_active" };
  }

  const resolution = resolvePublishSchedule({ policy: facts.current_policy, now });
  return resolution.status === "resolved"
    ? { status: "ready", schedule: resolution.schedule }
    : { status: "blocked", reason_code: "publication_policy_unavailable" };
};

export type PublishQueueAdmissionResultV1 =
  | { status: "queued"; schedule: ResolvedPublishScheduleV1 }
  | Exclude<PublishQueueAdmissionDecisionV1, { status: "ready" }>;

export const admitPublishProcessToQueue = async (
  owner: NurturePublishQueueAdmissionTransaction,
  input: { workspace_id: string; process_key: string; now: Date },
): Promise<PublishQueueAdmissionResultV1> => {
  const readAt = input.now.toISOString();
  const facts = await owner.loadPublishQueueAdmissionFacts({
    workspace_id: input.workspace_id,
    process_key: input.process_key,
    read_at: readAt,
  });
  if (!facts) return { status: "blocked", reason_code: "target_unavailable" };
  const decision = evaluatePublishQueueAdmission(facts);
  if (decision.status !== "ready") return decision;
  const applied = await owner.applyPublishQueueAdmission({
    workspace_id: input.workspace_id,
    process_key: input.process_key,
    expected_process_version: facts.process_version,
    authorizing_role_assignment_id: facts.authorizing_role_assignment_id!,
    admitted_at: readAt,
    schedule: decision.schedule,
  });
  return { status: "queued", schedule: applied.schedule };
};
