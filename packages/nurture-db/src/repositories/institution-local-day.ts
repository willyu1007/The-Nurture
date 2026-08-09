import {
  zonedInstantToLocalDateTime,
  zonedLocalTimeToInstant,
  type NurtureInstitutionLocalDay,
} from "@the-nurture/scenario/harness";
import type { BoardPrisma } from "./board-read-support.js";
import { loadCurrentInstitutionPublicationPolicy } from "./institution-publication-policy.read.js";

const parseLocalDate = (
  value: string,
): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const roundTrip = new Date(Date.UTC(year, month - 1, day));
  return roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day
    ? { year, month, day }
    : null;
};

const nextDay = (date: { year: number; month: number; day: number }) => {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
};

const buildInstitutionLocalDay = (
  date: { year: number; month: number; day: number },
  timeZone: string,
): NurtureInstitutionLocalDay & { time_zone: string } => ({
  storage_date: new Date(Date.UTC(date.year, date.month - 1, date.day)).toISOString(),
  occurred_from: zonedLocalTimeToInstant(date, 0, timeZone).toISOString(),
  occurred_before: zonedLocalTimeToInstant(nextDay(date), 0, timeZone).toISOString(),
  time_zone: timeZone,
});

/**
 * Resolves one policy-backed institution-local day. Missing or malformed
 * policy/date input is unavailable; UTC is never guessed as a fallback.
 */
export const loadInstitutionLocalDay = async (
  prisma: BoardPrisma,
  input: {
    workspace_id: string;
    institution_id: string;
    local_date: string;
    at: Date;
  },
): Promise<(NurtureInstitutionLocalDay & { time_zone: string }) | null> => {
  const date = parseLocalDate(input.local_date);
  if (!date || Number.isNaN(input.at.getTime())) return null;
  const policy = await loadCurrentInstitutionPublicationPolicy(prisma, {
    workspace_id: input.workspace_id,
    institution_id: input.institution_id,
    at: input.at,
  });
  if (!policy) return null;
  return buildInstitutionLocalDay(date, policy.time_zone);
};

/**
 * Resolves the exact local class/date facts for a stored source instant. The
 * effective publication policy remains the sole timezone owner; callers do
 * not supply either the local date or the minute used by placement.
 */
export const loadInstitutionLocalDayAtInstant = async (
  prisma: BoardPrisma,
  input: {
    workspace_id: string;
    institution_id: string;
    instant: Date;
  },
): Promise<
  | (NurtureInstitutionLocalDay & {
      time_zone: string;
      local_date: string;
      occurred_at_minute: number;
    })
  | null
> => {
  if (Number.isNaN(input.instant.getTime())) return null;
  const policy = await loadCurrentInstitutionPublicationPolicy(prisma, {
    workspace_id: input.workspace_id,
    institution_id: input.institution_id,
    at: input.instant,
  });
  if (!policy) return null;
  const local = zonedInstantToLocalDateTime(input.instant, policy.time_zone);
  if (!local) return null;
  return {
    ...buildInstitutionLocalDay(local, policy.time_zone),
    local_date: local.local_date,
    occurred_at_minute: local.minutes_of_day,
  };
};
