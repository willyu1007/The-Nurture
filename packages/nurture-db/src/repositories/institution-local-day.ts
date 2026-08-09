import {
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
): Promise<NurtureInstitutionLocalDay | null> => {
  const date = parseLocalDate(input.local_date);
  if (!date || Number.isNaN(input.at.getTime())) return null;
  const policy = await loadCurrentInstitutionPublicationPolicy(prisma, {
    workspace_id: input.workspace_id,
    institution_id: input.institution_id,
    at: input.at,
  });
  if (!policy) return null;
  return {
    storage_date: new Date(Date.UTC(date.year, date.month - 1, date.day)).toISOString(),
    occurred_from: zonedLocalTimeToInstant(date, 0, policy.time_zone).toISOString(),
    occurred_before: zonedLocalTimeToInstant(nextDay(date), 0, policy.time_zone).toISOString(),
  };
};
