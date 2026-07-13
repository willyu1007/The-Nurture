import {
  Prisma,
  PrismaClient,
  WorkflowApprovalStatus,
  WorkflowStepResultStatus,
} from "../generated/dev-host-prisma/index.js";

export type DevHostPrismaClient = PrismaClient;

export const createDevHostPrismaClient = (databaseUrl?: string): PrismaClient =>
  new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
  );

export { Prisma, WorkflowApprovalStatus, WorkflowStepResultStatus };
