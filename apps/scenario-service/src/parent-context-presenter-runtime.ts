import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type { ParentContextPresenterOwnerBindingV1 } from "@the-nurture/scenario";
import { ParentContextPresenterComposition } from "./parent-context-presenter-composition.js";

export type { ParentContextPresenterOwnerBindingV1 } from "@the-nurture/scenario";

export const createParentContextPresenterComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: ParentContextPresenterOwnerBindingV1;
}): ParentContextPresenterComposition | undefined => {
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
  return new ParentContextPresenterComposition(
    binding.authorityResolver,
    binding.owner,
    binding.asyncBoundary,
  );
};
