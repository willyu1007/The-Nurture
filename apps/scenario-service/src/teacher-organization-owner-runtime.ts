import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  TeacherOrganizationOwnerComposition,
  type TeacherOrganizationAuthorityResolverV1,
  type TeacherOrganizationOwnerV1,
} from "./teacher-organization-owner-composition.js";

export type TeacherOrganizationOwnerBindingV1 = Readonly<{
  authorityResolver: TeacherOrganizationAuthorityResolverV1;
  owner: TeacherOrganizationOwnerV1;
}>;

export const createTeacherOrganizationOwnerComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: TeacherOrganizationOwnerBindingV1;
}): TeacherOrganizationOwnerComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new TeacherOrganizationOwnerComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
