/**
 * The single source for how a due date becomes a bucket, a tone and a label.
 * Every screen imports these; none re-derives them. Two screens disagreeing on
 * what "overdue" looks like is the failure this file exists to prevent.
 */

import type { CardTone } from "@willyu1007/web-workbench";

export type DueBucket = "overdue" | "today" | "upcoming" | "none";

const DAY_MS = 86_400_000;

/** Calendar-day difference, so "today" means the same date, not 24 hours. */
function dayDelta(dueAt: string, now: number): number {
  const due = new Date(dueAt);
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const ref = new Date(now);
  const nowDay = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
  return Math.round((dueDay - nowDay) / DAY_MS);
}

export function dueBucket(dueAt: string | undefined, now: number): DueBucket {
  if (dueAt === undefined) return "none";
  const delta = dayDelta(dueAt, now);
  if (delta < 0) return "overdue";
  if (delta === 0) return "today";
  return "upcoming";
}

export function dueTone(bucket: DueBucket): CardTone {
  switch (bucket) {
    case "overdue":
      return "danger";
    case "today":
      return "warning";
    case "upcoming":
      return "info";
    case "none":
      return "muted";
  }
}

/** Short label for a row's leading slot. */
export function dueLabel(dueAt: string | undefined, now: number): string {
  if (dueAt === undefined) return "无时限";
  const delta = dayDelta(dueAt, now);
  if (delta < 0) return `逾期 ${-delta} 天`;
  if (delta === 0) {
    const due = new Date(dueAt);
    const hh = String(due.getUTCHours()).padStart(2, "0");
    const mm = String(due.getUTCMinutes()).padStart(2, "0");
    return `今天 ${hh}:${mm}`;
  }
  const due = new Date(dueAt);
  return `${String(due.getUTCMonth() + 1).padStart(2, "0")}-${String(due.getUTCDate()).padStart(2, "0")}`;
}

/** Sort key: overdue first, then today, then soonest, then undated. */
export function dueSortKey(dueAt: string | undefined): number {
  return dueAt === undefined ? Number.MAX_SAFE_INTEGER : Date.parse(dueAt);
}
