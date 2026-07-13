"use client";

import { ActionButton, Scene, SettingsFrame, type SettingsSchema, type SettingsValues } from "@willyu1007/web-workbench";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProject, runAction, startRun } from "@/lib/api";

// issue_type ∈ NurtureIssueType (prisma): screen | bedtime | homework | snack | custom.
const ISSUE_OPTIONS = [
  { value: "bedtime", label: "就寝" },
  { value: "screen", label: "屏幕时间" },
  { value: "homework", label: "作业" },
  { value: "snack", label: "零食" },
  { value: "custom", label: "自定义" },
] as const;

// family_rule_trial 主旅程能力——含一次 approval 闸，供 增量 4 的动作连线复用。
const CAPABILITY = "family_strategy";
const ENTRYPOINT = "calibrate_family_strategy";

const SCHEMA: SettingsSchema = {
  sections: [
    {
      key: "basics",
      label: "试运行设置",
      blocks: [
        {
          kind: "group",
          label: "目标家庭",
          fields: [
            { kind: "text", key: "family_ref_key", label: "家庭标识", placeholder: "family-...", desc: "My-Chat canonical 家庭对象的引用键。" },
            { kind: "text", key: "primary_child_ref_key", label: "主要孩子标识（可选）", placeholder: "child-..." },
          ],
        },
        {
          kind: "group",
          label: "议题",
          fields: [{ kind: "select", key: "issue_type", label: "议题类型", options: ISSUE_OPTIONS }],
        },
        {
          kind: "group",
          label: "工作流",
          fields: [
            {
              kind: "toggle",
              key: "start_run",
              label: "立即启动工作流运行",
              desc: "创建后启动 calibrate_family_strategy 运行并绑定到项目。",
            },
          ],
        },
      ],
    },
  ],
};

const INITIAL: SettingsValues = {
  family_ref_key: "",
  primary_child_ref_key: "",
  issue_type: "bedtime",
  start_run: true,
};

export function CreateProject() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  const onSave = async (values: SettingsValues) => {
    setError(undefined);
    const familyRefKey = String(values.family_ref_key ?? "").trim();
    if (!familyRefKey) throw new Error("请填写家庭标识。");
    const childRef = String(values.primary_child_ref_key ?? "").trim();
    const issueType = String(values.issue_type ?? "bedtime");
    // collect_context needs context_refs + issue_type to complete; without them
    // the run stalls at collect_context (start_requirements_missing) and never
    // reaches the approval gate.
    const familyRef = { service: "my_chat", object_type: "family", object_id: familyRefKey };
    const requirementValues = {
      issue_type: issueType,
      context_refs: [{ namespace: "my_chat", object_type: "family", object_id: familyRefKey, owner_scope: "workspace", canonical_ref: familyRef }],
    };
    // Start the run first (if requested) so the project is created already bound.
    const runId = values.start_run ? await startRun(CAPABILITY, ENTRYPOINT, requirementValues) : undefined;
    let projectId: string;
    try {
      const created = await createProject({
        family_ref_key: familyRefKey,
        issue_type: issueType,
        primary_child_ref_key: childRef || undefined,
        workflow_run_id: runId,
      });
      projectId = created.project_id;
    } catch (e) {
      // createProject failed after the run was started — cancel the orphan run so
      // it does not linger unbound, then surface the original error.
      if (runId) await runAction(runId, "reject").catch(() => {});
      throw e;
    }
    router.push(`/nurture/projects/${projectId}`);
  };

  return (
    <Scene
      intro="新建家庭规则试运行"
      actions={
        <ActionButton kind="ghost" href="/nurture/projects">
          返回列表
        </ActionButton>
      }
    >
      {error ? (
        <p className="mt-body" role="alert">
          创建失败：{error}
        </p>
      ) : null}
      <SettingsFrame
        schema={SCHEMA}
        values={INITIAL}
        onSave={onSave}
        onError={(e) => setError(e instanceof Error ? e.message : String(e))}
        navHeading="规则试运行"
        saveLabel="创建项目"
        dirtyLabel="未保存"
      />
    </Scene>
  );
}
