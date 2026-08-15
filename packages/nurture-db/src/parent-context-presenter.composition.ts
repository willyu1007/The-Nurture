import type { PrismaClient } from "@prisma/client";
import {
  LatestParentContextPresenterAsyncBoundary,
  NurtureCommandRunner,
  NurtureInteractionContextService,
  NurtureParentContextPresenter,
  type ParentContextPresenterOwnerBindingV1,
} from "@the-nurture/scenario";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "./repositories/institution-core.repositories.js";
import {
  PrismaParentContextPresenterAuthorityResolver,
  PrismaParentContextPresenterReadRepository,
} from "./repositories/parent-context-presenter.repository.js";

export const createPrismaParentContextPresenterBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  now?: () => Date;
}): ParentContextPresenterOwnerBindingV1 => {
  const now = input.now ?? (() => new Date());
  return {
    authorityResolver: new PrismaParentContextPresenterAuthorityResolver(
      input.prisma,
      input.integrityKey,
      now,
    ),
    owner: new NurtureParentContextPresenter({
      reads: new PrismaParentContextPresenterReadRepository(
        input.prisma,
        input.integrityKey,
        now,
      ),
      interactionContexts: new NurtureInteractionContextService(
        new PrismaInteractionContextRepository(input.prisma),
        undefined,
        now,
      ),
      commands: new NurtureCommandRunner(
        new PrismaNurtureCommandRepository(input.prisma, now),
      ),
      integrityKey: input.integrityKey,
      now,
    }),
    asyncBoundary: new LatestParentContextPresenterAsyncBoundary(now),
  };
};
