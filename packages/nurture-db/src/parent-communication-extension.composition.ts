import type { PrismaClient } from "@prisma/client";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createParentCommunicationExtensionService,
  type ParentCommunicationExtensionServiceBindingV1,
} from "@the-nurture/scenario";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "./repositories/institution-core.repositories.js";
import { PrismaFamilyCareCommandTransaction } from "./repositories/family-care-command.transaction.js";
import {
  PrismaParentCommunicationAuthorityResolver,
  PrismaParentCommunicationOwnerReadRepository,
} from "./repositories/parent-communication-owner.repository.js";
import { PrismaParentCommunicationExtensionReadPort } from "./repositories/parent-communication-extension.repository.js";

/**
 * Assembles the real W11 extension binding: the SAME v1 authority resolver
 * and read repository the frozen owner uses, the extension facts, the G2
 * message-change facts read, and the redact commit on the generic command
 * ledger. Dormant until the runtime gate, service auth and this binding
 * are supplied together.
 */
export const createPrismaParentCommunicationExtensionBinding = (input: {
  prisma: PrismaClient;
  integrityKey: string;
  now?: () => Date;
}): ParentCommunicationExtensionServiceBindingV1 => {
  const now = input.now ?? (() => new Date());
  return createParentCommunicationExtensionService({
    authority: new PrismaParentCommunicationAuthorityResolver(
      input.prisma,
      input.integrityKey,
      now,
    ),
    reads: new PrismaParentCommunicationOwnerReadRepository(
      input.prisma,
      input.integrityKey,
      now,
    ),
    extensionReads: new PrismaParentCommunicationExtensionReadPort(input.prisma),
    messageFacts: new PrismaFamilyCareCommandTransaction(input.prisma, now),
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
  });
};
