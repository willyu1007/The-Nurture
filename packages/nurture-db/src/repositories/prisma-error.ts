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
