import type { PrismaClient } from "@prisma/client";
import {
  LatestParentCommunicationAsyncBoundary,
  NurtureCommandRunner,
  NurtureInteractionContextService,
  NurtureParentCommunicationOwner,
  type ParentCommunicationOwnerBindingV1,
  type ProtectedContentWritePort,
} from "@the-nurture/scenario";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "./repositories/institution-core.repositories.js";
import {
  PrismaParentCommunicationAuthorityResolver,
  PrismaParentCommunicationOwnerReadRepository,
} from "./repositories/parent-communication-owner.repository.js";

export const createPrismaParentCommunicationOwnerBinding = (input: {
  prisma: PrismaClient;
  protectedContent: ProtectedContentWritePort;
  integrityKey: string;
  now?: () => Date;
}): ParentCommunicationOwnerBindingV1 => {
  const now = input.now ?? (() => new Date());
  const authorityResolver = new PrismaParentCommunicationAuthorityResolver(
    input.prisma,
    input.integrityKey,
    now,
  );
  const reads = new PrismaParentCommunicationOwnerReadRepository(
    input.prisma,
    input.integrityKey,
    now,
  );
  const interactionContexts = new NurtureInteractionContextService(
    new PrismaInteractionContextRepository(input.prisma),
    undefined,
    now,
  );
  const commands = new NurtureCommandRunner(
    new PrismaNurtureCommandRepository(input.prisma, now),
  );
  return {
    authorityResolver,
    owner: new NurtureParentCommunicationOwner({
      reads,
      interactionContexts,
      commands,
      protectedContent: input.protectedContent,
      integrityKey: input.integrityKey,
      now,
    }),
    asyncBoundary: new LatestParentCommunicationAsyncBoundary(now),
  };
};
