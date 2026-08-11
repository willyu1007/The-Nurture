import {
  NurtureInstitutionResolver,
  NurtureInteractionContextService,
} from "@the-nurture/scenario";
import {
  PrismaInstitutionContextRepository,
  PrismaInteractionContextRepository,
} from "@the-nurture/db/harness";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type { HarnessRuntime } from "./harness-runtime.js";
import { TeacherReleaseOwnerComposition } from "./teacher-release-owner-composition.js";

export const createTeacherReleaseOwnerComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  harnessRuntime: HarnessRuntime;
}): TeacherReleaseOwnerComposition | undefined => {
  const prisma = input.harnessRuntime.databaseClient;
  const engine = input.harnessRuntime.engine;
  if (!input.enabled || !input.serviceAuth.configured || !prisma || !engine) {
    return undefined;
  }
  return new TeacherReleaseOwnerComposition(
    new NurtureInstitutionResolver(
      new PrismaInstitutionContextRepository(prisma),
      new NurtureInteractionContextService(
        new PrismaInteractionContextRepository(prisma),
      ),
    ),
    engine,
  );
};
