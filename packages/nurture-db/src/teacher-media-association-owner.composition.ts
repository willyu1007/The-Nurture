import type { PrismaClient } from "@prisma/client";
import {
  NurtureCommandRunner,
  createTeacherMediaAssociationOwnerService,
  type TeacherMediaAssociationOwnerServiceBindingV1,
} from "@the-nurture/scenario";
import { PrismaNurtureCommandRepository } from "./repositories/institution-core.repositories.js";
import { PrismaCaregiverDailyCareEligibilityReadPort } from "./repositories/board-mutation.transaction.js";
import { PrismaTeacherClassStreamReadPort } from "./repositories/teacher-class-stream.repository.js";
import { PrismaTeacherMediaAssociationReadPort } from "./repositories/teacher-media-association-owner.repository.js";

/**
 * Assembles the real W9 owner binding: G3-C1 attribution facts behind the
 * DB-free association service, with both exchanges on the generic command
 * ledger. Dormant until the runtime gate, service auth and this binding are
 * supplied together.
 */
export const createPrismaTeacherMediaAssociationBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  now?: () => Date;
}): TeacherMediaAssociationOwnerServiceBindingV1 => {
  const now = input.now ?? (() => new Date());
  return createTeacherMediaAssociationOwnerService({
    contextReads: new PrismaTeacherClassStreamReadPort(input.prisma),
    mediaReads: new PrismaTeacherMediaAssociationReadPort(input.prisma),
    childOptions: new PrismaCaregiverDailyCareEligibilityReadPort(input.prisma),
    commands: new NurtureCommandRunner(
      new PrismaNurtureCommandRepository(input.prisma, now),
    ),
    integrityKey: input.integrityKey,
    now,
  });
};
