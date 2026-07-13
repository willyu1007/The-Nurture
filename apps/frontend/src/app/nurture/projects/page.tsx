import { listProjects, type ProjectSummary } from "@/lib/api";
import { ProjectList } from "./project-list.client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let projects: ProjectSummary[] = [];
  let error: string | undefined;
  try {
    projects = await listProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return <ProjectList projects={projects} error={error} />;
}
