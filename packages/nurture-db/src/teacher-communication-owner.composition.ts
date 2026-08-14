import type { PrismaClient } from "@prisma/client";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createTeacherCommunicationOwnerService,
  type ProtectedContentWritePort,
  type TeacherCommunicationOwnerServiceBindingV1,
} from "@the-nurture/scenario";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "./repositories/institution-core.repositories.js";
import { PrismaTeacherClassStreamReadPort } from "./repositories/teacher-class-stream.repository.js";
import { PrismaTeacherCommunicationReadPort } from "./repositories/teacher-communication-owner.repository.js";

/**
 * Assembles the real W8 owner binding: Prisma thread/message facts behind the
 * DB-free communication service, with the exchanges on the generic command
 * ledger. Dormant until the runtime gate, service auth and this binding are
 * supplied together.
 */
export const createPrismaTeacherCommunicationBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  protectedContent: ProtectedContentWritePort;
  now?: () => Date;
}): TeacherCommunicationOwnerServiceBindingV1 => {
  const now = input.now ?? (() => new Date());
  return createTeacherCommunicationOwnerService({
    contextReads: new PrismaTeacherClassStreamReadPort(input.prisma),
    threadReads: new PrismaTeacherCommunicationReadPort(input.prisma),
    interactionContexts: new NurtureInteractionContextService(
      new PrismaInteractionContextRepository(input.prisma),
      undefined,
      now,
    ),
    commands: new NurtureCommandRunner(
      new PrismaNurtureCommandRepository(input.prisma, now),
    ),
    protectedContent: input.protectedContent,
    integrityKey: input.integrityKey,
    now,
  });
};
