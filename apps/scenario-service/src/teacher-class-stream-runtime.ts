import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  TeacherClassStreamComposition,
  type TeacherClassStreamAuthorityResolverV1,
  type TeacherClassStreamOwnerV1,
} from "./teacher-class-stream-composition.js";

export type TeacherClassStreamOwnerBindingV1 = Readonly<{
  authorityResolver: TeacherClassStreamAuthorityResolverV1;
  owner: TeacherClassStreamOwnerV1;
}>;

export const createTeacherClassStreamComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: TeacherClassStreamOwnerBindingV1;
}): TeacherClassStreamComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new TeacherClassStreamComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
