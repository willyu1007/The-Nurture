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
  JourneyStage,
  ResponsibleRole,
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
