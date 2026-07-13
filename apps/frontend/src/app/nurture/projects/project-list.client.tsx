"use client";

import { ActionButton, EntityCard, ListView, Scene } from "@willyu1007/web-workbench";
import { projectToCard } from "@/lib/adapters";
import type { ProjectSummary } from "@/lib/api";

export function ProjectList({ projects, error }: { projects: ProjectSummary[]; error?: string }) {
  if (error) {
    return (
      <Scene intro="养育项目">
        <p className="mt-body">后端未连接（{error}）。请先启动 dev host：pnpm --filter @the-nurture/backend dev。</p>
      </Scene>
    );
  }

  return (
    <Scene
      intro="家庭规则试运行项目"
      actions={
        <ActionButton kind="primary" href="/nurture/projects/new">
          新建规则试运行
        </ActionButton>
      }
    >
      <ListView
        items={projects}
        empty={{ title: "暂无项目", desc: "新建一个家庭规则试运行项目开始。" }}
        present={(items) => (
          <div className="nurture-card-grid">
            {items.map((p) => (
              <EntityCard key={p.project_id} model={projectToCard(p)} />
            ))}
          </div>
        )}
      />
    </Scene>
  );
}
