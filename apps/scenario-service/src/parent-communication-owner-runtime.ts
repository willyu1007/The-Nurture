import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type {
  ParentCommunicationOwnerBindingV1,
} from "@the-nurture/scenario";
import {
  ParentCommunicationOwnerComposition,
} from "./parent-communication-owner-composition.js";

export type { ParentCommunicationOwnerBindingV1 } from "@the-nurture/scenario";

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
