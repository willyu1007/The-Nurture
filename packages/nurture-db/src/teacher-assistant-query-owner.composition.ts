import type { PrismaClient } from "@prisma/client";
import {
  NurtureCommandRunner,
  createTeacherAssistantQueryOwnerService,
  type ProtectedContentWritePort,
  type TeacherAssistantQueryOwnerServiceBindingV1,
} from "@the-nurture/scenario";
import { PrismaNurtureCommandRepository } from "./repositories/institution-core.repositories.js";
import { PrismaCaregiverDailyCareEligibilityReadPort } from "./repositories/board-mutation.transaction.js";
import { PrismaTeacherClassStreamReadPort } from "./repositories/teacher-class-stream.repository.js";
import { PrismaTeacherAssistantQueryReadPort } from "./repositories/teacher-assistant-query-owner.repository.js";

/**
 * Assembles the real W10 owner binding: daily-care and W9 attribution facts
 * behind the DB-free assistant-query service, with the weekly-draft
 * exchange on the generic command ledger. Dormant until the runtime gate,
 * service auth and this binding are supplied together.
 */
export const createPrismaTeacherAssistantQueryBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  protectedContent: ProtectedContentWritePort;
  now?: () => Date;
}): TeacherAssistantQueryOwnerServiceBindingV1 => {
  const now = input.now ?? (() => new Date());
  return createTeacherAssistantQueryOwnerService({
    contextReads: new PrismaTeacherClassStreamReadPort(input.prisma),
    assistantReads: new PrismaTeacherAssistantQueryReadPort(input.prisma),
    supplementEligibility: new PrismaCaregiverDailyCareEligibilityReadPort(
      input.prisma,
    ),
    protectedContent: input.protectedContent,
    commands: new NurtureCommandRunner(
      new PrismaNurtureCommandRepository(input.prisma, now),
    ),
    integrityKey: input.integrityKey,
    now,
  });
};
