import {
  PrismaNurtureFamilySharingCleanupLedger,
  PrismaNurtureFamilySharingCurrentAuthorityRepository,
  PrismaNurtureFamilySharingExactLocalPairResolver,
  PrismaNurtureScenarioNonceStore,
} from "@the-nurture/db";
import {
  NurtureFamilySharingCleanupOwner,
  type NurtureFamilySharingDerivedStoreCleanupOwnerV1,
  type NurtureInvocationTrustPolicyV1,
  type NurtureResponseSigningIdentityV1,
} from "@the-nurture/scenario";
import {
  createFamilySharingPrivateRuntime,
  type FamilySharingPrivateRuntime,
} from "./family-sharing-private-runtime.js";

type FamilySharingPrismaClient = ConstructorParameters<
  typeof PrismaNurtureScenarioNonceStore
>[0];

/**
 * Complete durable C3 composition. Production does not call this factory by
 * default; an explicit caller must provide reviewed trust/signing material,
 * a Prisma client and the complete Nurture-derived-store purge registry.
 */
export function createPrismaFamilySharingPrivateRuntime(input: Readonly<{
  prisma: FamilySharingPrismaClient;
  trustPolicies: readonly NurtureInvocationTrustPolicyV1[];
  responseIdentity: NurtureResponseSigningIdentityV1;
  cleanupStores: readonly NurtureFamilySharingDerivedStoreCleanupOwnerV1[];
  now?: () => Date;
}>): FamilySharingPrivateRuntime {
  return createFamilySharingPrivateRuntime({
    trustPolicies: input.trustPolicies,
    nonceStore: new PrismaNurtureScenarioNonceStore(input.prisma),
    responseIdentity: input.responseIdentity,
    localPairResolver: new PrismaNurtureFamilySharingExactLocalPairResolver(
      input.prisma,
    ),
    authority: new PrismaNurtureFamilySharingCurrentAuthorityRepository(
      input.prisma,
    ),
    cleanupOwner: new NurtureFamilySharingCleanupOwner(
      new PrismaNurtureFamilySharingCleanupLedger(input.prisma),
      input.cleanupStores,
      input.now,
    ),
    now: input.now,
  });
}
