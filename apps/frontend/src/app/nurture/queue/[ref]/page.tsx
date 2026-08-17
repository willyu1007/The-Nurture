import { EmptyState, Section, SetBreadcrumb, Stat, StatStrip } from "@willyu1007/web-workbench";
import { EntityRow } from "@willyu1007/web-workbench/list";
import { Record as RecordView } from "@willyu1007/web-workbench/record";
import type { TabItem } from "@willyu1007/web-workbench";
import { notFound } from "next/navigation";
import {
  now,
  queryEnrollmentJourney,
  waitlistPlacementOf,
} from "@/lib/queries/enrollment-journey";
import { dueLabel } from "@/lib/view/due";
import {
  LIFECYCLE_LABEL,
  MILESTONE_LABEL,
  orderedMilestones,
  PENDING_TRANSITION_LABEL,
  ROLE_GROUP_LABEL,
  STAGE_LABEL,
  STATE_LABEL,
  WAITING_LABEL,
} from "@/lib/view/journey";

const date = (iso: string) => iso.slice(0, 10);

/**
 * One journey, showing exactly what the projection carries. There is no intake,
 * grant or care-record facet: no capability exposes those fields, and inventing
 * them would misreport the surface as further along than it is.
 */
export default async function JourneyRecordPage({
  params,
}: {
  readonly params: Promise<{ readonly ref: string }>;
}) {
  const { ref } = await params;
  const targetOptionRef = decodeURIComponent(ref);
  const journey = await queryEnrollmentJourney(targetOptionRef);
  if (journey === null) notFound();

  const clock = now();
  const placement = await waitlistPlacementOf(targetOptionRef);
  const milestones = orderedMilestones(journey);

  const overview = (
    <>
      {/* The full summary lives here, not in Record's intro: the breadcrumb
          already carries a truncation of it, and printing both would put the
          same sentence twice within a few pixels. */}
      <Section title="概要">
        <p className="mt-body">{journey.safeSummary}</p>
      </Section>
      {journey.safeBlocker === undefined ? null : (
        <Section title="当前阻塞">
          <p className="mt-body">{journey.safeBlocker}</p>
        </Section>
      )}
      <Section title="下一步">
        <p className="mt-body">{journey.nextAction}</p>
        <p className="mt-value-label">
          责任角色：{ROLE_GROUP_LABEL[journey.responsibleRole]}
        </p>
      </Section>
      <Section title="状态">
        <EntityRow model={{ title: "流程状态", meta: [{ text: STATE_LABEL[journey.state] }] }} />
        <EntityRow model={{ title: "生命周期", meta: [{ text: LIFECYCLE_LABEL[journey.lifecycle] }] }} />
        <EntityRow model={{ title: "等待状态", meta: [{ text: WAITING_LABEL[journey.waitingState] }] }} />
        <EntityRow
          model={{
            title: "待定转换",
            meta: [{ text: PENDING_TRANSITION_LABEL[journey.pendingTransition] }],
          }}
        />
      </Section>
      <Section title="时间">
        <EntityRow model={{ title: "开始", meta: [{ text: date(journey.startedAt) }] }} />
        <EntityRow model={{ title: "最近更新", meta: [{ text: date(journey.updatedAt) }] }} />
        <EntityRow
          model={{
            title: "到期",
            meta: [{ text: journey.dueAt === undefined ? "无时限" : date(journey.dueAt) }],
          }}
        />
      </Section>
    </>
  );

  // Reached milestones only. A ladder of unreached steps would read as progress
  // toward a fixed total, which is exactly the pseudo-percentage the product
  // contract rules out — and several milestones are branches that never happen.
  const timeline =
    milestones.length === 0 ? (
      <EmptyState title="尚无已完成的里程碑" />
    ) : (
      <Section title="已完成里程碑">
        {milestones.map((milestone) => (
          <EntityRow key={milestone} model={{ title: MILESTONE_LABEL[milestone] }} />
        ))}
        <EntityRow
          model={{
            title: `当前停在：${STAGE_LABEL[journey.currentStage]}`,
            note: journey.nextAction,
          }}
        />
      </Section>
    );

  const tabs: TabItem[] = [
    { key: "overview", label: "概览", content: overview },
    { key: "milestones", label: "里程碑", count: milestones.length, content: timeline },
  ];

  if (placement !== null) {
    tabs.push({
      key: "waitlist",
      label: "候补",
      content: (
        <Section title={`${placement.careGroupLabel} · 第 ${placement.position} 位`}>
          <p className="mt-value-label">
            名次来自该班级候补列表的当前顺序，不是存储字段。
          </p>
          <EntityRow model={{ title: "资格时间", meta: [{ text: date(placement.entry.waitlistQualifiedAt) }] }} />
          <EntityRow model={{ title: "下次复核", meta: [{ text: date(placement.entry.nextReviewAt) }] }} />
          <EntityRow model={{ title: "最近确认", meta: [{ text: date(placement.entry.lastConfirmedAt) }] }} />
          <EntityRow
            model={{
              title: "继续意愿",
              meta: [
                {
                  text:
                    placement.entry.continuedInterest === "confirmed"
                      ? "已确认"
                      : "等待家庭确认",
                },
              ],
            }}
          />
          <EntityRow
            model={{
              title: "限时 offer",
              meta: [{ text: placement.entry.hasOpenOffer ? "进行中" : "无" }],
            }}
          />
          <EntityRow
            model={{
              title: "优先类别",
              meta: [{ text: `${placement.entry.categoryKey} · v${placement.entry.policyRevision}` }],
            }}
          />
        </Section>
      ),
    });
  }

  // The bold trailing crumb is the page title, so a detail page has to supply
  // one. It is a truncation of safeSummary rather than a part of it: the
  // contract promises no structure inside that string, so splitting it on the
  // separator the fixtures happen to use would be reading a format that is not
  // guaranteed.
  const crumbLabel =
    journey.safeSummary.length > 24
      ? `${journey.safeSummary.slice(0, 24)}…`
      : journey.safeSummary;

  return (
    <>
      <SetBreadcrumb items={[{ label: crumbLabel }]} />
      <StatStrip>
        <Stat label="当前阶段" value={STAGE_LABEL[journey.currentStage]} />
        <Stat label="责任角色" value={ROLE_GROUP_LABEL[journey.responsibleRole]} />
        <Stat label="到期" value={dueLabel(journey.dueAt, clock)} />
        <Stat label="已完成里程碑" value={milestones.length} />
      </StatStrip>
      <RecordView tabs={tabs} />
    </>
  );
}
