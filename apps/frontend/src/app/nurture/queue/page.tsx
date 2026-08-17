import { EmptyState, Scene, Section } from "@willyu1007/web-workbench";
import { EntityRow } from "@willyu1007/web-workbench/list";
import type { ResponsibleRole } from "@/lib/contracts/enrollment-journey";
import { listQueueRows, now, waitlistPositionOf } from "@/lib/queries/enrollment-journey";
import { dueBucket, dueLabel, dueSortKey, dueTone } from "@/lib/view/due";
import {
  adminActionVerb,
  isOpen,
  ROLE_GROUP_LABEL,
  ROLE_GROUP_NOTE,
  ROLE_GROUP_ORDER,
  STAGE_LABEL,
} from "@/lib/view/journey";
import { AdminQueue, type QueueRowView } from "./admin-queue.client";

/**
 * Grouped by `responsibleRole`, whose five values map onto the groups one to
 * one. Only the admin's own group gets action buttons; the rest are read-only
 * and navigate, which is the paradigm rule — inline button 去做, chevron 去看.
 */
export default async function QueuePage() {
  const clock = now();
  const rows = (await listQueueRows()).filter((row) => isOpen(row.journey));

  type GroupedRow = QueueRowView & { readonly role: ResponsibleRole; readonly sortKey: number };

  const views: readonly GroupedRow[] = await Promise.all(
    rows.map(async ({ targetOptionRef, journey }): Promise<GroupedRow> => ({
      role: journey.responsibleRole,
      ref: targetOptionRef,
      href: `/nurture/queue/${encodeURIComponent(targetOptionRef)}`,
      summary: journey.safeSummary,
      stage: STAGE_LABEL[journey.currentStage],
      dueLabel: dueLabel(journey.dueAt, clock),
      dueTone: dueTone(dueBucket(journey.dueAt, clock)),
      actionVerb: adminActionVerb(journey.currentStage),
      nextAction: journey.nextAction,
      ...(journey.safeBlocker === undefined ? {} : { blocker: journey.safeBlocker }),
      waitlistPosition: await waitlistPositionOf(targetOptionRef),
      milestoneCount: journey.completedMilestones.length,
      sortKey: dueSortKey(journey.dueAt),
    })),
  );

  const byRole = (role: ResponsibleRole) =>
    views
      .filter((view) => view.role === role)
      .sort((a, b) => a.sortKey - b.sortKey);

  const adminRows = byRole("institution_admin");

  return (
    <Scene intro={`共 ${views.length} 条进行中的入园流程`}>
      <Section title={`${ROLE_GROUP_LABEL.institution_admin}（${adminRows.length}）`}>
        <p className="mt-value-label">{ROLE_GROUP_NOTE.institution_admin}</p>
        <AdminQueue rows={adminRows} />
      </Section>

      {ROLE_GROUP_ORDER.filter((role) => role !== "institution_admin").map((role) => {
        const group = byRole(role);
        if (group.length === 0) return null;
        return (
          <Section key={role} title={`${ROLE_GROUP_LABEL[role]}（${group.length}）`}>
            <p className="mt-value-label">{ROLE_GROUP_NOTE[role]}</p>
            {group.map((view) => (
              <EntityRow
                key={view.ref}
                model={{
                  href: view.href,
                  title: view.summary,
                  note: view.nextAction,
                  meta: [
                    { text: view.stage },
                    { text: view.dueLabel, tone: view.dueTone },
                    ...(view.waitlistPosition === null
                      ? []
                      : [{ text: `候补第 ${view.waitlistPosition} 位` }]),
                  ],
                }}
              />
            ))}
          </Section>
        );
      })}

      {views.length === 0 ? (
        <EmptyState title="暂无进行中的入园流程" desc="登记新意向后会出现在这里。" />
      ) : null}
    </Scene>
  );
}
