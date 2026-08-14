import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  TeacherMediaAssociationOwnerComposition,
  type TeacherMediaAssociationAuthorityResolverV1,
  type TeacherMediaAssociationOwnerV1,
} from "./teacher-media-association-owner-composition.js";

export type TeacherMediaAssociationOwnerBindingV1 = Readonly<{
  authorityResolver: TeacherMediaAssociationAuthorityResolverV1;
  owner: TeacherMediaAssociationOwnerV1;
}>;

export const createTeacherMediaAssociationOwnerComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: TeacherMediaAssociationOwnerBindingV1;
}): TeacherMediaAssociationOwnerComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new TeacherMediaAssociationOwnerComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
