import type { PrismaClient } from "@prisma/client";
import {
  NurtureInstitutionKnowledgeCurrentAuthorityOwner,
  NurtureInstitutionKnowledgePreparedCommandCrypto,
  NurtureInstitutionKnowledgePreparedCommandOwner,
  NurtureInstitutionKnowledgeTargetOptionCodec,
  type NurtureInstitutionKnowledgeFormalAuthorityResolverV1,
  type NurtureInstitutionKnowledgeOwnerIntegration,
  type NurtureInstitutionKnowledgePreparedCommandOwnerV1,
} from "@the-nurture/scenario";
import { PrismaNurtureParticipantBindingReader } from "./c30/participant-binding.js";
import {
  PrismaNurtureInstitutionKnowledgeCurrentTargetReader,
  PrismaNurtureInstitutionKnowledgeInstitutionAdminRoleReader,
  PrismaNurtureInstitutionKnowledgeParticipantAuthorityReader,
} from "./repositories/institution-knowledge-current-authority.repository.js";
import { PrismaNurtureInstitutionKnowledgePreparedCommandLedger } from "./repositories/institution-knowledge-prepared-command.repository.js";

export type PrismaNurtureInstitutionKnowledgeFormalOwners = Readonly<{
  institutionKnowledgeAuthorityResolver: NurtureInstitutionKnowledgeFormalAuthorityResolverV1;
  institutionKnowledgePreparedCommandOwner: NurtureInstitutionKnowledgePreparedCommandOwnerV1;
  institutionKnowledgeOptionIssuer: NurtureInstitutionKnowledgeTargetOptionCodec;
}>;

export type PrismaNurtureInstitutionKnowledgeFormalModuleBinding = Readonly<{
  institutionKnowledgeOwnerIntegration: NurtureInstitutionKnowledgeOwnerIntegration;
  institutionKnowledgeAuthorityResolver: NurtureInstitutionKnowledgeFormalAuthorityResolverV1;
  institutionKnowledgePreparedCommandOwner: NurtureInstitutionKnowledgePreparedCommandOwnerV1;
}>;

/**
 * Composes the Nurture-owned pieces of the formal Institution Knowledge
 * ingress. Supplying this bundle does not register a route, enable a feature,
 * bind the My-Chat retrieval owner, or create external traffic.
 */
export function createPrismaNurtureInstitutionKnowledgeFormalOwners(input: {
  prisma: PrismaClient;
  targetOptionIntegrityKey: string;
  preparedCommandIntegrityKey: string;
  preparedCommandEncryptionSecret: string;
  now?: () => Date;
  preparedCommandTtlMs?: number;
}): PrismaNurtureInstitutionKnowledgeFormalOwners {
  const now = input.now ?? (() => new Date());
  const participantBindings = new PrismaNurtureParticipantBindingReader(input.prisma);
  const participantAuthority =
    new PrismaNurtureInstitutionKnowledgeParticipantAuthorityReader(input.prisma, now);
  const targetOptions = new NurtureInstitutionKnowledgeTargetOptionCodec(
    input.targetOptionIntegrityKey,
  );
  const institutionKnowledgeAuthorityResolver =
    new NurtureInstitutionKnowledgeCurrentAuthorityOwner({
      participantBindings,
      participantAuthority,
      targetOptions,
      targets: new PrismaNurtureInstitutionKnowledgeCurrentTargetReader(input.prisma),
      roles: new PrismaNurtureInstitutionKnowledgeInstitutionAdminRoleReader(input.prisma),
      now,
    });
  const protection = new NurtureInstitutionKnowledgePreparedCommandCrypto(
    input.preparedCommandIntegrityKey,
    input.preparedCommandEncryptionSecret,
  );
  const institutionKnowledgePreparedCommandOwner =
    new NurtureInstitutionKnowledgePreparedCommandOwner({
      ledger: new PrismaNurtureInstitutionKnowledgePreparedCommandLedger(input.prisma),
      participantBindings,
      participantAuthority,
      protection,
      now,
      ...(input.preparedCommandTtlMs === undefined
        ? {}
        : { ttlMs: input.preparedCommandTtlMs }),
    });

  return Object.freeze({
    institutionKnowledgeAuthorityResolver,
    institutionKnowledgePreparedCommandOwner,
    institutionKnowledgeOptionIssuer: targetOptions,
  });
}

/**
 * Creates the one module binding for the local formal owners. The admitted
 * surface dependencies must use the very same option codec instance; a second
 * codec/key would create an unverifiable target-option track.
 */
export function bindPrismaNurtureInstitutionKnowledgeFormalOwners(input: {
  formalOwners: PrismaNurtureInstitutionKnowledgeFormalOwners;
  ownerIntegration: NurtureInstitutionKnowledgeOwnerIntegration;
}): PrismaNurtureInstitutionKnowledgeFormalModuleBinding {
  if (
    input.ownerIntegration.surface_deps.optionIssuer
    !== input.formalOwners.institutionKnowledgeOptionIssuer
  ) {
    throw new Error("Institution Knowledge option issuer must be the formal owner codec instance");
  }
  return Object.freeze({
    institutionKnowledgeOwnerIntegration: input.ownerIntegration,
    institutionKnowledgeAuthorityResolver:
      input.formalOwners.institutionKnowledgeAuthorityResolver,
    institutionKnowledgePreparedCommandOwner:
      input.formalOwners.institutionKnowledgePreparedCommandOwner,
  });
}
