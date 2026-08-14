import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  ParentCommunicationExtensionComposition,
  type ParentCommunicationExtensionAuthorityResolverV1,
  type ParentCommunicationExtensionOwnerV1,
} from "./parent-communication-extension-composition.js";

export type ParentCommunicationExtensionBindingV1 = Readonly<{
  authorityResolver: ParentCommunicationExtensionAuthorityResolverV1;
  owner: ParentCommunicationExtensionOwnerV1;
}>;

export const createParentCommunicationExtensionComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: ParentCommunicationExtensionBindingV1;
}): ParentCommunicationExtensionComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new ParentCommunicationExtensionComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
