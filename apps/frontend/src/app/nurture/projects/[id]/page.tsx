import { getProjectTimeline, getRunDetail, type ProjectTimeline, type RunDetail } from "@/lib/api";
import { ProjectDetail } from "./project-detail.client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let timeline: ProjectTimeline | undefined;
  let run: RunDetail | undefined;
  let error: string | undefined;
  try {
    timeline = await getProjectTimeline(id);
    if (timeline.project.workflow_run_id) {
      try {
        run = await getRunDetail(timeline.project.workflow_run_id);
      } catch {
        // the bound run may not be readable yet; detail still renders without it.
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return <ProjectDetail projectId={id} timeline={timeline} run={run} error={error} />;
}
