export type NurtureZonedDate = { year: number; month: number; day: number };

export type NurtureZonedDateTime = NurtureZonedDate & {
  local_date: string;
  minutes_of_day: number;
};

/**
 * Resolves an instant into one Institution-local date/minute pair. Keeping the
 * conversion here gives every exact-owner adapter the same DST and midnight
 * behavior instead of letting each repository rebuild `Intl` parsing.
 */
export const zonedInstantToLocalDateTime = (
  instant: Date,
  timeZone: string,
): NurtureZonedDateTime | null => {
  if (Number.isNaN(instant.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(instant);
    const read = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    const year = read("year");
    const month = read("month");
    const day = read("day");
    const hour = read("hour") % 24;
    const minute = read("minute");
    if (!year || !month || !day || minute < 0 || minute > 59) return null;
    return {
      year,
      month,
      day,
      local_date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      minutes_of_day: hour * 60 + minute,
    };
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
};

const zonedOffsetMs = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour") % 24,
    read("minute"),
    read("second"),
  );
  return asUtc - instant.getTime();
};

/**
 * Turns a local wall-clock time into a UTC instant. The offset is applied
 * twice so a value spanning a DST change still lands on the configured wall
 * clock. Callers must also use `matchesZonedWallClock` to reject a local time
 * that does not exist during a DST gap.
 */
export const zonedLocalTimeToInstant = (
  date: NurtureZonedDate,
  minutesOfDay: number,
  timeZone: string,
): Date => {
  const naive = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    Math.floor(minutesOfDay / 60),
    minutesOfDay % 60,
  );
  let instant = naive;
  for (let pass = 0; pass < 2; pass += 1) {
    instant = naive - zonedOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
};

export const matchesZonedWallClock = (
  instant: Date,
  date: NurtureZonedDate,
  minutesOfDay: number,
  timeZone: string,
): boolean => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return (
    read("year") === date.year &&
    read("month") === date.month &&
    read("day") === date.day &&
    read("hour") % 24 === Math.floor(minutesOfDay / 60) &&
    read("minute") === minutesOfDay % 60
  );
};
