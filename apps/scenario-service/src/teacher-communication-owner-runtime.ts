import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  TeacherCommunicationOwnerComposition,
  type TeacherCommunicationAuthorityResolverV1,
  type TeacherCommunicationOwnerV1,
} from "./teacher-communication-owner-composition.js";

export type TeacherCommunicationOwnerBindingV1 = Readonly<{
  authorityResolver: TeacherCommunicationAuthorityResolverV1;
  owner: TeacherCommunicationOwnerV1;
}>;

export const createTeacherCommunicationOwnerComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: TeacherCommunicationOwnerBindingV1;
}): TeacherCommunicationOwnerComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new TeacherCommunicationOwnerComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
