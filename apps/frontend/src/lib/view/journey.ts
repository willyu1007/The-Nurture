/**
 * Display vocabulary for the enrollment journey. The contract carries stable
 * keys; the Chinese wording lives here so it is stated once.
 *
 * Grouping is by `responsibleRole`, whose five values map one-to-one onto the
 * queue's groups. Deriving groups from `waitingState` instead would be wrong:
 * that enum has no "waiting on the institution admin" value, so "waiting on me"
 * is exactly `responsibleRole === "institution_admin"`.
 */

import type {
  EnrollmentJourneyProjection,
  JourneyLifecycle,
  JourneyMilestone,
  JourneyStage,
  PendingTransition,
  ProjectionState,
  ResponsibleRole,
  WaitingState,
} from "@/lib/contracts/enrollment-journey";

export const ROLE_GROUP_LABEL: Record<ResponsibleRole, string> = {
  institution_admin: "等我",
  guardian: "等家庭",
  caregiver: "等老师",
  system_owner: "等系统",
  none: "推进中",
};

/** Why a group exists, shown as the group's quiet right-hand note. */
export const ROLE_GROUP_NOTE: Record<ResponsibleRole, string> = {
  institution_admin: "园长是唯一可执行角色",
  guardian: "不催办则不动；一次未回复不自动删除",
  caregiver: "园长可催办、退回，不可代确认",
  system_owner: "跨 owner 校验中，园长无动作",
  none: "无阻塞，无需干预",
};

/** Order the groups appear in. Work the admin owns comes first. */
export const ROLE_GROUP_ORDER: readonly ResponsibleRole[] = [
  "institution_admin",
  "guardian",
  "caregiver",
  "system_owner",
  "none",
];

export const STAGE_LABEL: Record<JourneyStage, string> = {
  inquiry: "意向登记",
  intent_conversation: "意向沟通",
  visit_or_consultation: "到访咨询",
  capacity_waitlist: "满班候补",
  trial_preparation: "试入园准备",
  trial_in_progress: "试入园中",
  trial_review: "试入园复盘",
  formal_enrollment_confirmation: "待正式激活",
  completed: "已完成",
  closed: "已关闭",
};

export const STATE_LABEL: Record<ProjectionState, string> = {
  active: "进行中",
  waiting: "等待中",
  blocked: "已阻塞",
  completed: "已完成",
  closed: "已关闭",
};

export const LIFECYCLE_LABEL: Record<JourneyLifecycle, string> = {
  active: "进行中",
  completed: "已完成正式入园",
  closed_without_formalization: "未转正式即结束",
};

export const WAITING_LABEL: Record<WaitingState, string> = {
  ready: "可推进",
  waiting_on_guardian: "等待家庭",
  waiting_on_caregiver: "等待老师",
  waiting_on_system: "等待系统校验",
  scheduled_future: "已排期，未到时间",
  blocked: "已阻塞",
};

export const PENDING_TRANSITION_LABEL: Record<PendingTransition, string> = {
  none: "无",
  trial_start_pending: "待开始试入园",
  formalization_pending: "待转为正式",
  exit_pending: "待退出",
};

export const MILESTONE_LABEL: Record<JourneyMilestone, string> = {
  inquiry_started: "意向登记",
  intent_confirmed: "意向确认",
  visit_recorded: "到访记录",
  waitlist_qualified: "取得候补资格",
  trial_offer_accepted: "接受试入园 offer",
  trial_started: "试入园开始",
  trial_review_reached: "到达复盘节点",
  trial_extended: "试入园已延长",
  formal_proposed: "提出正式入园",
  guardian_formal_acceptance_recorded: "家长已接受",
  preparation_cancelled: "准备已取消",
  trial_ended: "试入园结束",
  formal_enrollment_committed: "正式入园已提交",
  journey_completed: "流程完成",
};

/**
 * Display order for completed milestones. Only reached ones are ever shown:
 * rendering the unreached ones as a ladder would turn this into the percentage
 * progress the product contract rules out, and several of them are branches
 * that legitimately never happen.
 */
const MILESTONE_ORDER: readonly JourneyMilestone[] = [
  "inquiry_started",
  "intent_confirmed",
  "visit_recorded",
  "waitlist_qualified",
  "trial_offer_accepted",
  "trial_started",
  "trial_review_reached",
  "trial_extended",
  "preparation_cancelled",
  "formal_proposed",
  "guardian_formal_acceptance_recorded",
  "trial_ended",
  "formal_enrollment_committed",
  "journey_completed",
];

/** Reached milestones, in canonical order. Unreached ones are never returned. */
export function orderedMilestones(
  journey: EnrollmentJourneyProjection,
): readonly JourneyMilestone[] {
  const reached = new Set(journey.completedMilestones);
  return MILESTONE_ORDER.filter((milestone) => reached.has(milestone));
}

/**
 * Whether a journey needs the admin now. Only a canonical overdue date or a
 * blocked state qualifies — the product shows two levels, and this is the
 * gate for the upper one.
 */
export function needsAdminNow(
  journey: EnrollmentJourneyProjection,
  now: number,
): boolean {
  if (journey.responsibleRole !== "institution_admin") return false;
  if (journey.state === "blocked") return true;
  return journey.dueAt !== undefined && Date.parse(journey.dueAt) <= now;
}

/** Journeys still in play. Completed and closed ones leave the working views. */
export function isOpen(journey: EnrollmentJourneyProjection): boolean {
  return journey.lifecycle === "active";
}

/**
 * The verb on an admin row's action button. Only journeys the admin owns get a
 * button at all, so this is never asked about someone else's work.
 */
export function adminActionVerb(stage: JourneyStage): string {
  switch (stage) {
    case "trial_review":
      return "复盘";
    case "trial_preparation":
      return "开始试入园";
    case "capacity_waitlist":
      return "处理候补";
    case "trial_in_progress":
      return "处理";
    case "inquiry":
    case "intent_conversation":
    case "visit_or_consultation":
      return "跟进";
    case "formal_enrollment_confirmation":
      return "处理转正式";
    case "completed":
    case "closed":
      return "查看";
  }
}
