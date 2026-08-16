import { Scene } from "@willyu1007/web-workbench";

// Placeholder so the shell has a reachable home while P4 builds the real Hub.
// Deliberately carries no numbers: the queue data does not exist yet, and a
// fabricated count would misread as progress.
export default function OverviewPage() {
  return (
    // No `intro`: it is a one-line description, and the bold breadcrumb is
    // already the page title. Repeating it there would say the name twice.
    <Scene>
      <p className="mt-body">流程队列的概览将在此处呈现。</p>
    </Scene>
  );
}
