import type { OnApplicationShutdown } from "@nestjs/common";
import {
  createPrismaClient,
  createScenarioBindingOwnerAuthorizer,
  type NurturePrismaClient,
} from "@the-nurture/db/binding-owner";
import type { ScenarioBindingOwnerAuthorizer } from "@the-nurture/scenario/binding-owner";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";

export class BindingOwnerRuntime implements OnApplicationShutdown {
  constructor(
    readonly authorizer: ScenarioBindingOwnerAuthorizer | undefined,
    private readonly nurturePrisma?: NurturePrismaClient,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.nurturePrisma?.$disconnect();
  }
}

/**
 * Build the owner runtime only from a complete fail-closed configuration.
 * Partial secret or database configuration never instantiates Prisma and
 * leaves the route disabled.
 */
export function createBindingOwnerRuntime(input: {
  env?: NodeJS.ProcessEnv;
  serviceAuth: BindingOwnerServiceAuth;
  authorizer?: ScenarioBindingOwnerAuthorizer;
}): BindingOwnerRuntime {
  if (input.authorizer) {
    return new BindingOwnerRuntime(input.authorizer);
  }

  const env = input.env ?? process.env;
  const evidenceKey = env.NURTURE_BINDING_EVIDENCE_KEY;
  const databaseUrl = env.DATABASE_URL;
  if (
    !input.serviceAuth.configured ||
    !evidenceKey ||
    Buffer.byteLength(evidenceKey, "utf8") < 32 ||
    !databaseUrl
  ) {
    return new BindingOwnerRuntime(undefined);
  }

  const nurturePrisma = createPrismaClient(databaseUrl);
  return new BindingOwnerRuntime(
    createScenarioBindingOwnerAuthorizer({
      nurturePrisma,
      evidenceKey,
    }),
    nurturePrisma,
  );
}
