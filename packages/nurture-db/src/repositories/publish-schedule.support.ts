import type { ResolvedPublishScheduleV1 } from "@the-nurture/scenario/harness";

/** A partially persisted schedule is unavailable, never guessed from row metadata. */
export const readResolvedPublishSchedule = (process: {
  scheduledAt: Date | null;
  notAfter: Date | null;
  scheduleTimeZone: string | null;
  schedulePolicyRef: string | null;
  schedulePolicyHead: number | null;
  schedulePolicyVersion: number | null;
  scheduleResolvedAt: Date | null;
}): ResolvedPublishScheduleV1 | null => {
  if (
    !process.scheduledAt ||
    !process.notAfter ||
    !process.scheduleTimeZone ||
    !process.schedulePolicyRef ||
    process.schedulePolicyHead === null ||
    process.schedulePolicyVersion === null ||
    !process.scheduleResolvedAt
  ) {
    return null;
  }
  return {
    scheduledAt: process.scheduledAt.toISOString(),
    notAfter: process.notAfter.toISOString(),
    timeZone: process.scheduleTimeZone,
    policyRef: process.schedulePolicyRef,
    policyHead: process.schedulePolicyHead,
    policyVersion: process.schedulePolicyVersion,
    resolvedAt: process.scheduleResolvedAt.toISOString(),
  };
};
