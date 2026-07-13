"use client";

import { ActionButton, EmptyState, EntityRow, Record, Section, Stat, StatStrip, type TabItem } from "@willyu1007/web-workbench";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { artifactRow, captureRow, checkpointRow, issueLabel, reasonCodeLabel, reviewRow, statusLabel } from "@/lib/adapters";
import { runAction, type ProjectTimeline, type RunDetail } from "@/lib/api";

export function ProjectDetail({
  projectId,
  timeline,
  run,
  error,
}: {
  projectId: string;
  timeline?: ProjectTimeline;
  run?: RunDetail;
  error?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();

  if (error || !timeline) {
    return <Record intro="项目详情" tabs={[{ key: "error", label: "错误", content: <p className="mt-body">无法加载项目（{error ?? "未找到"}）。</p> }]} />;
  }

  const p = timeline.project;
  const timelineCount = timeline.captures.length + timeline.checkpoints.length + timeline.reviews.length;
  // Authoritative gate signal from the host: a pending approval row exists.
  // (A collect_context pause is also manual_review_required but has no approval
  // to resolve, so step status alone would mis-offer the approve action.)
  const awaitingApproval = !!run?.pending_approval;

  const act = (action: "approve" | "reject") => async () => {
    if (!run || busy) return;
    setActionError(undefined);
    setBusy(true);
    try {
      const res = await runAction(run.run.run_id, action);
      if (!res.ok) {
        setActionError(reasonCodeLabel(res.reason ?? "action_failed"));
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const actions = awaitingApproval ? (
    <>
      <ActionButton kind="primary" onClick={act("approve")} disabled={pending || busy}>
        批准
      </ActionButton>
      <ActionButton kind="ghost" onClick={act("reject")} disabled={pending || busy}>
        驳回
      </ActionButton>
    </>
  ) : undefined;

  const tabs: TabItem[] = [
    {
      key: "overview",
      label: "概览",
      content: (
        <>
          {awaitingApproval ? (
            <Section title="待家长确认">
              <p className="mt-body">工作流已暂停在审批闸，确认后继续推进。{pending || busy ? "处理中…" : ""}</p>
              {actionError ? (
                <p className="mt-body" role="alert">
                  操作失败：{actionError}
                </p>
              ) : null}
            </Section>
          ) : null}
          <StatStrip>
            <Stat label="状态" value={statusLabel(p.status)} />
            <Stat label="议题" value={issueLabel(p.issue_type)} />
            <Stat label="运行" value={p.workflow_run_id ? "已绑定" : "未开始"} />
            {run ? <Stat label="步骤" value={`${run.steps.filter((s) => s.status === "completed").length}/${run.steps.length}`} foot={awaitingApproval ? "待批准" : "已完成"} /> : null}
          </StatStrip>
        </>
      ),
    },
    {
      key: "artifacts",
      label: "产物",
      count: run?.artifacts.length,
      content:
        run && run.artifacts.length ? (
          <Section title="工作流产物">
            {run.artifacts.map((a) => (
              <EntityRow key={a.artifact_id} model={artifactRow(a)} />
            ))}
          </Section>
        ) : (
          <EmptyState title="暂无产物" desc="运行推进后，产物会出现在这里。" />
        ),
    },
    {
      key: "timeline",
      label: "时间线",
      count: timelineCount,
      content: (
        <>
          <Section title="记录">
            {timeline.captures.length ? timeline.captures.map((c) => <EntityRow key={c.id} model={captureRow(c)} />) : <EmptyState title="暂无记录" />}
          </Section>
          <Section title="检查点">
            {timeline.checkpoints.length ? timeline.checkpoints.map((c) => <EntityRow key={c.id} model={checkpointRow(c)} />) : <EmptyState title="暂无检查点" />}
          </Section>
          <Section title="复盘">
            {timeline.reviews.length ? timeline.reviews.map((r) => <EntityRow key={r.id} model={reviewRow(r)} />) : <EmptyState title="暂无复盘" />}
          </Section>
        </>
      ),
    },
  ];

  return <Record intro={`${issueLabel(p.issue_type)} · 规则试运行 #${projectId.slice(0, 8)} · ${statusLabel(p.status)}`} actions={actions} tabs={tabs} />;
}
