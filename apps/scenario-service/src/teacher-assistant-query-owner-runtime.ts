import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  TeacherAssistantQueryOwnerComposition,
  type TeacherAssistantQueryAuthorityResolverV1,
  type TeacherAssistantQueryOwnerV1,
} from "./teacher-assistant-query-owner-composition.js";

export type TeacherAssistantQueryOwnerBindingV1 = Readonly<{
  authorityResolver: TeacherAssistantQueryAuthorityResolverV1;
  owner: TeacherAssistantQueryOwnerV1;
}>;

export const createTeacherAssistantQueryOwnerComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: TeacherAssistantQueryOwnerBindingV1;
}): TeacherAssistantQueryOwnerComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new TeacherAssistantQueryOwnerComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
