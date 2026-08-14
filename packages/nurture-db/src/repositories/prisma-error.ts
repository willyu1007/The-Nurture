export const prismaErrorCodes = (error: unknown): readonly string[] => {
  if (typeof error !== "object" || error === null) return [];
  const record = error as { code?: unknown; meta?: unknown };
  const meta =
    typeof record.meta === "object" && record.meta !== null
      ? record.meta as { code?: unknown }
      : undefined;
  return [record.code, meta?.code]
    .filter((code): code is string | number => code !== undefined)
    .map(String);
};

export const hasPrismaErrorCode = (
  error: unknown,
  ...expected: readonly string[]
): boolean => prismaErrorCodes(error).some((code) => expected.includes(code));

export const isPrismaSerializationAbort = (error: unknown): boolean =>
  hasPrismaErrorCode(error, "P2034", "40001");

/**
 * Write conflicts that certainly rolled the surrounding transaction back
 * and are safe to retry with the same command identity: serialization
 * aborts, plus unique-constraint violations (P2002) — a concurrent writer
 * landed the same natural key first, so a retry re-reads and answers the
 * replay/already-satisfied path instead of failing terminally.
 */
export const isPrismaWriteConflict = (error: unknown): boolean =>
  isPrismaSerializationAbort(error) || hasPrismaErrorCode(error, "P2002");
