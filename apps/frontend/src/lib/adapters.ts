import type { CardModel, CardTone, RowModel } from "@willyu1007/web-workbench";
import type { ArtifactPreview, ProjectSummary } from "./api";

// Status is pre-resolved to a single semantic tone source (kit governance:
// EntityCard never sees raw status strings).
const STATUS_TONE: Record<string, CardTone> = {
  draft: "muted",
  confirmed: "info",
  active: "accent",
  checkpoint: "info",
  adjusted: "warning",
  completed: "success",
  archived: "muted",
  escalated: "danger",
  cancelled: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  confirmed: "已确认",
  active: "进行中",
  checkpoint: "检查点",
  adjusted: "已调整",
  completed: "已完成",
  archived: "已归档",
  escalated: "已升级",
  cancelled: "已取消",
};

export const statusTone = (status: string): CardTone => STATUS_TONE[status] ?? "muted";
// Never emit a raw domain status string to the kit — fall back to a localized 未知.
export const statusLabel = (status: string): string => STATUS_LABEL[status] ?? "未知";

// Domain enums (NurtureIssueType / NurtureCaptureType) and host reason codes are
// localized here so kit components never receive raw domain vocabulary.
const ISSUE_LABEL: Record<string, string> = {
  bedtime: "就寝",
  screen: "屏幕时间",
  homework: "作业",
  snack: "零食",
  custom: "自定义",
};
export const issueLabel = (issue: string): string => ISSUE_LABEL[issue] ?? issue;

const CAPTURE_TYPE_LABEL: Record<string, string> = {
  checkin: "签到",
  observation: "观察",
  conflict_event: "冲突事件",
  rule_execution: "规则执行",
  burden_report: "负担反馈",
  child_response: "孩子反应",
  adjustment_request: "调整请求",
  free_note: "随手记",
  media_ref: "媒体",
};
export const captureTypeLabel = (t: string): string => CAPTURE_TYPE_LABEL[t] ?? t;

// Exposure levels are manifest-defined named buckets (no universal semantics);
// present as a tier label rather than a bare code.
export const exposureLevelLabel = (level: string): string => `曝光级 ${level}`;

const REASON_CODE_LABEL: Record<string, string> = {
  no_pending_approval: "没有待处理的审批",
  unsupported_action: "不支持的操作",
  action_failed: "操作失败",
};
export const reasonCodeLabel = (code: string): string => REASON_CODE_LABEL[code] ?? code;

const fmtDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleString("zh-CN") : "—");

/** Timeline entries -> RowModel (Record detail tabs). */
export const captureRow = (c: { id: string; capture_type: string; captured_at: string }): RowModel => ({
  title: `记录 · ${captureTypeLabel(c.capture_type)}`,
  sub: `#${c.id.slice(0, 8)}`,
  meta: [{ text: fmtDate(c.captured_at) }],
});

export const checkpointRow = (c: { id: string; scheduled_at: string | null }): RowModel => ({
  title: "检查点",
  sub: `#${c.id.slice(0, 8)}`,
  meta: [{ text: fmtDate(c.scheduled_at) }],
});

export const reviewRow = (r: { id: string; completed_at: string | null }): RowModel => ({
  title: "复盘",
  sub: `#${r.id.slice(0, 8)}`,
  meta: [{ text: fmtDate(r.completed_at) }],
});

/** Artifact preview -> RowModel; ref-only (restricted) artifacts show no body. */
export const artifactRow = (a: ArtifactPreview): RowModel =>
  a.unavailable_reason
    ? { title: a.artifact_type, status: { tone: "muted", label: "受限" }, note: "（曝光级别受限，仅引用）" }
    : {
        title: a.safe_title ?? a.artifact_type,
        sub: a.artifact_type,
        note: a.safe_summary,
        status: { tone: "info", label: exposureLevelLabel(a.exposure_level) },
      };

/** Adapter: a family_rule_trial project -> the List paradigm's CardModel. */
export const projectToCard = (p: ProjectSummary): CardModel => ({
  href: `/nurture/projects/${p.project_id}`,
  title: p.title ?? `${issueLabel(p.issue_type)} · 规则试运行`,
  status: { tone: statusTone(p.status), label: statusLabel(p.status) },
  aside: issueLabel(p.issue_type),
  primary: { kind: "text", text: p.workflow_run_id ? "已绑定运行" : "未开始运行", muted: !p.workflow_run_id },
  meta: [{ text: `更新于 ${new Date(p.updated_at).toLocaleDateString("zh-CN")}` }],
  entryLabel: "查看详情",
});
