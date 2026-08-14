import type { PrismaClient } from "@prisma/client";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createTeacherOrganizationOwnerService,
  type ProtectedContentWritePort,
  type TeacherOrganizationOwnerServiceBindingV1,
} from "@the-nurture/scenario";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "./repositories/institution-core.repositories.js";
import { PrismaCaregiverDailyCareEligibilityReadPort } from "./repositories/board-mutation.transaction.js";
import { PrismaCareCaptureReadPort } from "./repositories/care-capture.read.js";
import { PrismaCaregiverDirectMessageEligibilityReadPort } from "./repositories/caregiver-direct-message-eligibility.read.js";
import { PrismaPublishQueueAdmissionTransaction } from "./repositories/publish-queue-admission.service.js";
import { PrismaTeacherClassStreamReadPort } from "./repositories/teacher-class-stream.repository.js";
import { PrismaTeacherOrganizationBatchReadPort } from "./repositories/teacher-organization-owner.repository.js";

/**
 * Assembles the real W7 owner binding: Prisma facts behind the DB-free
 * organization service, with every exchange running through the generic
 * Nurture command ledger. Dormant until the runtime gate, service auth and
 * this binding are supplied together.
 */
export const createPrismaTeacherOrganizationBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  protectedContent: ProtectedContentWritePort;
  now?: () => Date;
}): TeacherOrganizationOwnerServiceBindingV1 => {
  const now = input.now ?? (() => new Date());
  return createTeacherOrganizationOwnerService({
    contextReads: new PrismaTeacherClassStreamReadPort(input.prisma),
    batchReads: new PrismaTeacherOrganizationBatchReadPort(input.prisma),
    captureReads: new PrismaCareCaptureReadPort(input.prisma),
    admissionPreview: new PrismaPublishQueueAdmissionTransaction(input.prisma),
    supplementEligibility: new PrismaCaregiverDailyCareEligibilityReadPort(
      input.prisma,
    ),
    directMessageEligibility:
      new PrismaCaregiverDirectMessageEligibilityReadPort(input.prisma),
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
