"use client";

import { ActionButton } from "@willyu1007/web-workbench";
import { Queue } from "@willyu1007/web-workbench/queue";
import type { CardTone } from "@willyu1007/web-workbench";

/**
 * A queue row, already resolved and localized by the server component. Kept to
 * plain data because Queue is a client component and the props it takes —
 * toRow, drawer, actionLabel — are functions that cannot cross the boundary.
 */
export interface QueueRowView {
  readonly ref: string;
  readonly href: string;
  readonly summary: string;
  readonly stage: string;
  readonly dueLabel: string;
  readonly dueTone: CardTone;
  readonly actionVerb: string;
  readonly nextAction: string;
  readonly blocker?: string;
  readonly waitlistPosition: number | null;
  readonly milestoneCount: number;
}

/**
 * The journeys the admin owns. This is the only group that gets action buttons:
 * an inline button means 去做, and nobody else's work is the admin's to do.
 *
 * The drawer is read-only in this slice. P7 puts the confirmation flow in its
 * footer, which is why the action already opens a drawer rather than navigating
 * — the Queue paradigm locks that shape and changing it later would be rework.
 */
export function AdminQueue({ rows }: { readonly rows: readonly QueueRowView[] }) {
  return (
    <Queue
      items={rows}
      rowKey={(row) => row.ref}
      actionLabel={(row) => row.actionVerb}
      toRow={(row) => ({
        title: row.summary,
        note: row.blocker ?? row.nextAction,
        meta: [
          { text: row.stage },
          { text: row.dueLabel, tone: row.dueTone },
          ...(row.waitlistPosition === null
            ? []
            : [{ text: `候补第 ${row.waitlistPosition} 位` }]),
        ],
      })}
      drawer={(row) => ({
        title: row.summary,
        desc: `${row.stage} · ${row.dueLabel}`,
        body: (
          <>
            {row.blocker ? (
              <p className="mt-body">
                <b>当前阻塞：</b>
                {row.blocker}
              </p>
            ) : null}
            <p className="mt-body">
              <b>下一步：</b>
              {row.nextAction}
            </p>
            <p className="mt-value-label">已完成 {row.milestoneCount} 个里程碑</p>
          </>
        ),
        footer: (
          <ActionButton kind="primary" href={row.href}>
            打开完整详情
          </ActionButton>
        ),
      })}
      empty={{ title: "没有等待你处理的流程", desc: "其他角色推进时会回到这里。" }}
    />
  );
}
