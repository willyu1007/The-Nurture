import type { PrismaClient } from "@prisma/client";
import {
  createDirectorPresenterService,
  NurtureInstitutionAuthorityChain,
  NurtureInstitutionSupportSignalService,
  type DirectorPresenterOwnerBindingV1,
} from "@the-nurture/scenario";
import { PrismaDirectorPresenterReadRepository } from "./repositories/director-presenter.repository.js";
import { PrismaInstitutionContextRepository } from "./repositories/institution-context.repository.js";
import { createPrismaInstitutionSupportSignalRepository } from "./repositories/institution-support-signal.owner-providers.js";

/** One production W4 owner over current canonical rows and policy owners. */
export const createPrismaDirectorPresenterBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  now?: () => Date;
}): DirectorPresenterOwnerBindingV1 =>
  createDirectorPresenterService({
    reads: new PrismaDirectorPresenterReadRepository(input.prisma),
    supportSignals: new NurtureInstitutionSupportSignalService(
      createPrismaInstitutionSupportSignalRepository({
        prisma: input.prisma,
        owner_ref_integrity_key: input.integrityKey,
      }),
      new NurtureInstitutionAuthorityChain(
        new PrismaInstitutionContextRepository(input.prisma),
      ),
    ),
    integrityKey: input.integrityKey,
    ...(input.now ? { now: input.now } : {}),
  });
