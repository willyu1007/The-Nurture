export type NurtureDerivedAgeStage = {
  ageBandKey: string;
  stageKey: string;
  asOfDate: string;
  sourceVersion: number;
  expiresAt: Date;
};

export class NurtureDerivedAgeStageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NurtureDerivedAgeStageError";
  }
}

const allowedFields = new Set([
  "age_band_key",
  "stage_key",
  "as_of_date",
  "source_version",
  "expires_at",
]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const keyPattern = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export function parseNurtureDerivedAgeStage(
  value: unknown,
  now: Date = new Date(),
): NurtureDerivedAgeStage {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NurtureDerivedAgeStageError(
      "The derived age/stage result must be an object.",
    );
  }
  const record = value as Record<string, unknown>;
  const unknownFields = Object.keys(record).filter(
    (field) => !allowedFields.has(field),
  );
  if (unknownFields.length > 0 || Object.keys(record).length !== 5) {
    throw new NurtureDerivedAgeStageError(
      "The derived age/stage result contains an invalid field set.",
    );
  }

  const ageBandKey = key(record.age_band_key, "age_band_key");
  const stageKey = key(record.stage_key, "stage_key");
  if (
    typeof record.as_of_date !== "string" ||
    !datePattern.test(record.as_of_date) ||
    !isCalendarDate(record.as_of_date)
  ) {
    throw new NurtureDerivedAgeStageError("as_of_date must be YYYY-MM-DD.");
  }
  if (
    !Number.isSafeInteger(record.source_version) ||
    (record.source_version as number) < 1
  ) {
    throw new NurtureDerivedAgeStageError(
      "source_version must be a positive integer.",
    );
  }
  if (typeof record.expires_at !== "string") {
    throw new NurtureDerivedAgeStageError(
      "expires_at must be an ISO timestamp.",
    );
  }
  const expiresAt = new Date(record.expires_at);
  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.toISOString() !== record.expires_at ||
    expiresAt <= now
  ) {
    throw new NurtureDerivedAgeStageError(
      "expires_at must be a current canonical UTC ISO timestamp.",
    );
  }
  const currentDate = now.toISOString().slice(0, 10);
  if (record.as_of_date > currentDate) {
    throw new NurtureDerivedAgeStageError(
      "as_of_date cannot be in the future.",
    );
  }

  return {
    ageBandKey,
    stageKey,
    asOfDate: record.as_of_date,
    sourceVersion: record.source_version as number,
    expiresAt,
  };
}

function isCalendarDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function key(value: unknown, field: string): string {
  if (typeof value !== "string" || !keyPattern.test(value)) {
    throw new NurtureDerivedAgeStageError(`${field} is invalid.`);
  }
  return value;
}
