import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  ParentCommunicationOwnerComposition,
  type ParentCommunicationAsyncBoundaryV1,
  type ParentCommunicationAuthorityResolverV1,
  type ParentCommunicationOwnerV1,
} from "./parent-communication-owner-composition.js";

export type ParentCommunicationOwnerBindingV1 = Readonly<{
  authorityResolver: ParentCommunicationAuthorityResolverV1;
  owner: ParentCommunicationOwnerV1;
  asyncBoundary: ParentCommunicationAsyncBoundaryV1;
}>;

export const createParentCommunicationOwnerComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: ParentCommunicationOwnerBindingV1;
}): ParentCommunicationOwnerComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
    || !binding.asyncBoundary
  ) {
    return undefined;
  }
  return new ParentCommunicationOwnerComposition(
    binding.authorityResolver,
    binding.owner,
    binding.asyncBoundary,
  );
};
