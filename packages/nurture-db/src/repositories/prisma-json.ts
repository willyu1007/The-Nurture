import type { Prisma } from "@prisma/client";

/** Prisma cannot infer that domain JSON values contain only input-safe JSON data. */
export const asJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;
