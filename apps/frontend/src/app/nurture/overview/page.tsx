import { Hub, type DashAttention, type DashStat, type WorkflowModule } from "@willyu1007/web-workbench/hub";
import type { ResponsibleRole } from "@/lib/contracts/enrollment-journey";
import { listQueueRows, now } from "@/lib/queries/enrollment-journey";
import { dueLabel, dueSortKey } from "@/lib/view/due";
import { isOpen, needsAdminNow, ROLE_GROUP_LABEL, ROLE_GROUP_ORDER, STAGE_LABEL } from "@/lib/view/journey";

// The hub aggregates one module today. Adding a workflow later means adding a
// module, not reworking this page.
const QUEUE_HREF = "/nurture/queue";

export default async function OverviewPage() {
  const clock = now();
  const rows = (await listQueueRows()).filter((row) => isOpen(row.journey));

  const counts = new Map<ResponsibleRole, number>();
  for (const { journey } of rows) {
    counts.set(journey.responsibleRole, (counts.get(journey.responsibleRole) ?? 0) + 1);
  }

  // Stats are the five responsible-role buckets, in the order the queue groups
  // them. Empty buckets stay visible: a zero is information, and a strip whose
  // columns move as data changes is unreadable.
  const stats: DashStat[] = ROLE_GROUP_ORDER.map((role) => ({
    label: ROLE_GROUP_LABEL[role],
    value: counts.get(role) ?? 0,
    unit: "条",
  }));

  // Two levels, per the support-signal rule: only a canonical overdue date or a
  // blocked state may reach the upper one. The kit's attention tone carries the
  // distinction (accent above, info below) — there is no third level.
  const sorted = [...rows].sort(
    (a, b) => dueSortKey(a.journey.dueAt) - dueSortKey(b.journey.dueAt),
  );
  const attention: DashAttention[] = sorted
    .filter(({ journey }) => journey.responsibleRole === "institution_admin")
    .map(({ targetOptionRef, journey }) => ({
      workflow: "入园流程",
      id: targetOptionRef,
      title: journey.safeSummary,
      detail: [
        STAGE_LABEL[journey.currentStage],
        dueLabel(journey.dueAt, clock),
        journey.safeBlocker ?? journey.nextAction,
      ].join(" · "),
      tone: needsAdminNow(journey, clock) ? "accent" : "info",
      href: QUEUE_HREF,
      cta: "去处理",
    }));

  const modules: WorkflowModule[] = [
    {
      key: "enrollment_journey",
      // The kit's stat-row label column is 44px — sized for two-character
      // category names (education uses 作业/学情). Four characters wrap.
      label: "入园",
      accent: "accent",
      stats,
      attention,
      highlights: [],
      quickActions: [],
    },
  ];

  // The Hub is its own scene: no bar, no intro. A total restating the stat row
  // (the five buckets already sum to it) is a second place to read one number.
  return <Hub modules={modules} />;
}
