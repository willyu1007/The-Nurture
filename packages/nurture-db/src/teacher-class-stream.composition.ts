import type { PrismaClient } from "@prisma/client";
import {
  createTeacherClassStreamService,
  type TeacherClassStreamServiceBindingV1,
} from "@the-nurture/scenario";
import { PrismaTeacherClassStreamReadPort } from "./repositories/teacher-class-stream.repository.js";

/**
 * Assembles the real W6 owner binding: Prisma reads behind the DB-free
 * domain service. The result is structurally the scenario-service
 * `TeacherClassStreamOwnerBindingV1` and stays dormant until the runtime
 * gate, service auth and this binding are all supplied together.
 */
export const createPrismaTeacherClassStreamBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  now?: () => Date;
}): TeacherClassStreamServiceBindingV1 =>
  createTeacherClassStreamService({
    reads: new PrismaTeacherClassStreamReadPort(input.prisma),
    integrityKey: input.integrityKey,
    ...(input.now ? { now: input.now } : {}),
  });
