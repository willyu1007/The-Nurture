/**
 * Consequence disclosure for the journey's admin actions.
 *
 * The capability contract carries `confirmationPolicy` and `concurrencyPolicy`
 * but no prose: nothing returns the sentences a person needs to read before
 * committing. So the wording lives here, written from the locked semantics in
 * `dev-docs/active/nurture-institution-mode/09-pilot-readiness.md` (B3-1c) and
 * the trial lifecycle rules in the mobile UX contract (D-07C/D/E).
 *
 * `willNotHappen` is as load-bearing as `willHappen`. For irreversible actions
 * the dangerous misreading is usually about what the system will do next on its
 * own — ending a trial does not call the next family on the waitlist, and does
 * not mean the family withdrew.
 */

import type { JourneyStage } from "@/lib/contracts/enrollment-journey";

export interface ConsequenceDisclosure {
  readonly actionKey: string;
  readonly title: string;
  readonly confirmLabel: string;
  readonly willHappen: readonly string[];
  readonly willNotHappen: readonly string[];
  readonly reversible: boolean;
  readonly acknowledgement: string;
}

/**
 * Actions that take the whole screen instead of a drawer: irreversible and
 * affecting someone other than the person clicking. The other two are declared
 * for when their capabilities exist; today only `end_trial` is contracted.
 */
export const FULLSCREEN_ACTIONS: ReadonlySet<string> = new Set([
  "end_trial",
  "close_enrollment",
  "revoke_child_link_grant",
]);

export const DISCLOSURES: Readonly<Record<string, ConsequenceDisclosure>> = {
  start_trial: {
    actionKey: "start_trial",
    title: "开始试入园",
    confirmLabel: "开始试入园",
    willHappen: [
      "Enrollment 转为 active，参与阶段为 trial",
      "占用目标班级的一个名额预留",
      "孩子进入班级的普通花名册、出勤与照护记录",
    ],
    willNotHappen: [
      "不建立独立的试入园身份、同意书或留存管道",
      "参与阶段本身不授予任何权限",
      "不计入正式在园统计——那只计 formal 阶段",
    ],
    reversible: true,
    acknowledgement: "我确认身份绑定、待定 Enrollment、授权与班级分配都已就绪。",
  },
  cancel_trial_preparation: {
    actionKey: "cancel_trial_preparation",
    title: "取消试入园准备",
    confirmLabel: "取消准备",
    willHappen: ["关闭准备中的流程壳", "释放为其保留的名额"],
    willNotHappen: [
      "不影响已经开始的试入园——那要走结束试入园",
      "不删除已建立的身份绑定或授权",
    ],
    reversible: false,
    acknowledgement: "我确认这条流程尚未开始试入园。",
  },
  extend_trial: {
    actionKey: "extend_trial",
    title: "延长试入园",
    confirmLabel: "延长试入园",
    willHappen: ["设定新的试入园结束日期与复盘时间", "名额继续占位"],
    willNotHappen: [
      "不改变参与阶段，仍为 trial",
      "到期仍只生成园长任务，系统不自动处置",
    ],
    reversible: true,
    acknowledgement: "我确认新的复盘时间不晚于新的试入园结束日期。",
  },
  propose_formal_enrollment: {
    actionKey: "propose_formal_enrollment",
    title: "提出正式入园",
    confirmLabel: "提出方案",
    willHappen: ["向家庭发出正式入园方案", "等待期间名额继续占位"],
    willNotHappen: [
      "不直接转为正式——必须家长明确接受后才提交",
      "不结束当前试入园",
    ],
    reversible: true,
    acknowledgement: "我确认已完成复盘，并准备好向家庭提出正式入园。",
  },
  end_trial: {
    actionKey: "end_trial",
    title: "结束试入园并释放名额",
    confirmLabel: "结束试入园",
    willHappen: [
      "Enrollment 状态转为 ended",
      "结束班级分配与试入园期授权",
      "释放该班级的一个预留名额",
      "生成一条园长任务：是否联系候补下一位",
    ],
    willNotHappen: [
      "不删除 My-Chat 身份、绑定或历史照护事实",
      "不自动联系候补队列的下一位",
      "不恢复任何原有候补名次；继续等待需重新取得资格",
      "不代表家庭主动退园，也不是班级调整",
    ],
    reversible: false,
    acknowledgement: "我已理解上述后果，并确认这不是家庭主动退园，也不是班级调整。",
  },
  close_inquiry: {
    actionKey: "close_inquiry",
    title: "关闭意向",
    confirmLabel: "关闭意向",
    willHappen: ["结束这条意向流程", "停止后续跟进提醒"],
    willNotHappen: ["不删除已记录的联系历史", "家庭之后仍可重新发起意向"],
    reversible: false,
    acknowledgement: "我确认这个家庭当前没有继续入园的意向。",
  },
  decline_or_expire_trial_offer: {
    actionKey: "decline_or_expire_trial_offer",
    title: "处理限时 offer 的谢绝或过期",
    confirmLabel: "确认处理",
    willHappen: ["关闭这次限时 offer", "该家庭保留在候补列表中"],
    willNotHappen: [
      "不自动向下一位发出 offer——空位只生成园长任务",
      "不改变该家庭的候补资格时间",
    ],
    reversible: false,
    acknowledgement: "我确认已与家庭确认，或 offer 已到期。",
  },
};

/** Admin actions offered at a stage, in the order they should be presented. */
export function actionsForStage(stage: JourneyStage): readonly string[] {
  switch (stage) {
    case "inquiry":
    case "intent_conversation":
    case "visit_or_consultation":
      return ["close_inquiry"];
    case "capacity_waitlist":
      return ["decline_or_expire_trial_offer"];
    case "trial_preparation":
      return ["start_trial", "cancel_trial_preparation"];
    case "trial_review":
      return ["extend_trial", "propose_formal_enrollment", "end_trial"];
    case "trial_in_progress":
    case "formal_enrollment_confirmation":
    case "completed":
    case "closed":
      return [];
  }
}
