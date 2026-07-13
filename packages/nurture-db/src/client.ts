import { PrismaClient } from "@prisma/client";

export type NurturePrismaClient = PrismaClient;

/**
 * Create a Prisma client. Pass an explicit URL to override DATABASE_URL
 * (used by tests and the dev host). With no argument it reads DATABASE_URL.
 */
export const createPrismaClient = (databaseUrl?: string): PrismaClient =>
  new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
  );
