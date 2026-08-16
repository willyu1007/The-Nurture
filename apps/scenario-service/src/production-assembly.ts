import {
  createAesGcmProtectedContentPort,
  createPrismaDirectorPresenterBinding,
  createPrismaParentCommunicationExtensionBinding,
  createPrismaParentCommunicationOwnerBinding,
  createPrismaParentContextPresenterBinding,
  createPrismaClient,
  createPrismaTeacherAssistantQueryBinding,
  createPrismaTeacherClassStreamBinding,
  createPrismaTeacherCommunicationBinding,
  createPrismaTeacherMediaAssociationBinding,
  createPrismaTeacherOrganizationBinding,
  type NurturePrismaClient,
} from "@the-nurture/db";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type { ScenarioServiceConfig } from "./config.js";
import {
  ScenarioStructuredLogger,
  type ScenarioStructuredLogSink,
} from "./structured-logger.js";
import type { TeacherAssistantQueryOwnerBindingV1 } from "./teacher-assistant-query-owner-runtime.js";
import type { ParentCommunicationExtensionBindingV1 } from "./parent-communication-extension-runtime.js";
import type { ParentCommunicationOwnerBindingV1 } from "./parent-communication-owner-runtime.js";
import type { ParentContextPresenterOwnerBindingV1 } from "./parent-context-presenter-runtime.js";
import type { TeacherClassStreamOwnerBindingV1 } from "./teacher-class-stream-runtime.js";
import type { TeacherCommunicationOwnerBindingV1 } from "./teacher-communication-owner-runtime.js";
import type { TeacherMediaAssociationOwnerBindingV1 } from "./teacher-media-association-owner-runtime.js";
import type { TeacherOrganizationOwnerBindingV1 } from "./teacher-organization-owner-runtime.js";
import type { DirectorPresenterOwnerBindingV1 } from "./director-presenter-runtime.js";

const PROTECTED_CONTENT_KEY_REF = "nurture-protected-content-v1";
const MINIMUM_SECRET_LENGTH = 32;

type ProductionSurface =
  | "parent_context_presenter"
  | "parent_communication_owner"
  | "parent_communication_extension"
  | "director_presenter"
  | "teacher_class_stream_presenter"
  | "teacher_organization_owner"
  | "teacher_communication_owner"
  | "teacher_media_association_owner"
  | "teacher_assistant_query_owner";

export type ScenarioServiceProductionBindings = Readonly<{
  parentContextPresenterOwnerBinding?: ParentContextPresenterOwnerBindingV1;
  parentCommunicationOwnerBinding?: ParentCommunicationOwnerBindingV1;
  parentCommunicationExtensionBinding?: ParentCommunicationExtensionBindingV1;
  directorPresenterOwnerBinding?: DirectorPresenterOwnerBindingV1;
  teacherClassStreamOwnerBinding?: TeacherClassStreamOwnerBindingV1;
  teacherOrganizationOwnerBinding?: TeacherOrganizationOwnerBindingV1;
  teacherCommunicationOwnerBinding?: TeacherCommunicationOwnerBindingV1;
  teacherMediaAssociationOwnerBinding?: TeacherMediaAssociationOwnerBindingV1;
  teacherAssistantQueryOwnerBinding?: TeacherAssistantQueryOwnerBindingV1;
}>;

export type ScenarioServiceProductionAssembly = Readonly<{
  bindings: ScenarioServiceProductionBindings;
  prisma?: NurturePrismaClient;
  disconnect(): Promise<void>;
}>;

export type ScenarioServiceProductionAssemblyDependencies = Readonly<{
  createPrismaClient: typeof createPrismaClient;
  createProtectedContent: typeof createAesGcmProtectedContentPort;
  createParentContextPresenterBinding: typeof createPrismaParentContextPresenterBinding;
  createParentCommunicationOwnerBinding: typeof createPrismaParentCommunicationOwnerBinding;
  createParentCommunicationExtensionBinding: typeof createPrismaParentCommunicationExtensionBinding;
  createDirectorPresenterBinding: typeof createPrismaDirectorPresenterBinding;
  createTeacherClassStreamBinding: typeof createPrismaTeacherClassStreamBinding;
  createTeacherOrganizationBinding: typeof createPrismaTeacherOrganizationBinding;
  createTeacherCommunicationBinding: typeof createPrismaTeacherCommunicationBinding;
  createTeacherMediaAssociationBinding: typeof createPrismaTeacherMediaAssociationBinding;
  createTeacherAssistantQueryBinding: typeof createPrismaTeacherAssistantQueryBinding;
}>;

const productionDependencies: ScenarioServiceProductionAssemblyDependencies = {
  createPrismaClient,
  createProtectedContent: createAesGcmProtectedContentPort,
  createParentContextPresenterBinding: createPrismaParentContextPresenterBinding,
  createParentCommunicationOwnerBinding: createPrismaParentCommunicationOwnerBinding,
  createParentCommunicationExtensionBinding:
    createPrismaParentCommunicationExtensionBinding,
  createDirectorPresenterBinding: createPrismaDirectorPresenterBinding,
  createTeacherClassStreamBinding: createPrismaTeacherClassStreamBinding,
  createTeacherOrganizationBinding: createPrismaTeacherOrganizationBinding,
  createTeacherCommunicationBinding: createPrismaTeacherCommunicationBinding,
  createTeacherMediaAssociationBinding: createPrismaTeacherMediaAssociationBinding,
  createTeacherAssistantQueryBinding: createPrismaTeacherAssistantQueryBinding,
};

/**
 * Builds only explicitly enabled production owner bindings. The existing
 * application runtimes remain responsible for turning these bindings into
 * route compositions.
 */
export function createScenarioServiceProductionAssembly(input: {
  config: ScenarioServiceConfig;
  serviceAuth: BindingOwnerServiceAuth;
  env?: NodeJS.ProcessEnv;
  logSink?: ScenarioStructuredLogSink;
  dependencies?: ScenarioServiceProductionAssemblyDependencies;
}): ScenarioServiceProductionAssembly {
  const logger = new ScenarioStructuredLogger(input.logSink);

  const enabledSurface = firstEnabledReadySurface(input.config);
  if (!enabledSurface) {
    return createAssembly({});
  }

  const env = input.env ?? process.env;
  requireDependency(
    input.serviceAuth.configured,
    enabledSurface,
    "missing NURTURE_INTERNAL_SERVICE_TOKEN",
    logger,
  );
  requireDependency(
    Boolean(env.DATABASE_URL),
    enabledSurface,
    "missing DATABASE_URL",
    logger,
  );
  requireDependency(
    hasMinimumLength(env.NURTURE_HARNESS_INTEGRITY_KEY),
    enabledSurface,
    "missing or invalid NURTURE_HARNESS_INTEGRITY_KEY",
    logger,
  );

  const protectedContentRequired =
    input.config.parentCommunicationOwnerEnabled
    || input.config.teacherOrganizationOwnerEnabled
    || input.config.teacherCommunicationOwnerEnabled
    || input.config.teacherAssistantQueryOwnerEnabled;
  if (protectedContentRequired) {
    requireDependency(
      hasMinimumLength(env.NURTURE_PROTECTED_CONTENT_KEY),
      firstEnabledProtectedContentSurface(input.config),
      "missing or invalid NURTURE_PROTECTED_CONTENT_KEY",
      logger,
    );
  }

  const dependencies = input.dependencies ?? productionDependencies;
  const prisma = dependencies.createPrismaClient(env.DATABASE_URL);
  const integrityKey = env.NURTURE_HARNESS_INTEGRITY_KEY;
  if (!integrityKey) {
    throw new Error("Production assembly integrity key validation invariant failed.");
  }
  const protectedContent = protectedContentRequired
    ? dependencies.createProtectedContent({
        keyRef: PROTECTED_CONTENT_KEY_REF,
        keyMaterial: env.NURTURE_PROTECTED_CONTENT_KEY ?? "",
      })
    : undefined;

  const bindings: ScenarioServiceProductionBindings = {
    ...(input.config.parentContextPresenterEnabled
      ? {
          parentContextPresenterOwnerBinding:
            dependencies.createParentContextPresenterBinding({
              prisma,
              integrityKey,
            }),
        }
      : {}),
    ...(input.config.parentCommunicationOwnerEnabled
      ? {
          parentCommunicationOwnerBinding:
            dependencies.createParentCommunicationOwnerBinding({
              prisma,
              integrityKey,
              protectedContent: requireProtectedContent(protectedContent),
            }),
        }
      : {}),
    ...(input.config.parentCommunicationExtensionEnabled
      ? {
          parentCommunicationExtensionBinding:
            dependencies.createParentCommunicationExtensionBinding({
              prisma,
              integrityKey,
            }),
        }
      : {}),
    ...(input.config.directorPresenterEnabled
      ? {
          directorPresenterOwnerBinding:
            dependencies.createDirectorPresenterBinding({
              prisma,
              integrityKey,
            }),
        }
      : {}),
    ...(input.config.teacherClassStreamPresenterEnabled
      ? {
          teacherClassStreamOwnerBinding:
            dependencies.createTeacherClassStreamBinding({
              prisma,
              integrityKey,
            }),
        }
      : {}),
    ...(input.config.teacherOrganizationOwnerEnabled
      ? {
          teacherOrganizationOwnerBinding:
            dependencies.createTeacherOrganizationBinding({
              prisma,
              integrityKey,
              protectedContent: requireProtectedContent(protectedContent),
            }),
        }
      : {}),
    ...(input.config.teacherCommunicationOwnerEnabled
      ? {
          teacherCommunicationOwnerBinding:
            dependencies.createTeacherCommunicationBinding({
              prisma,
              integrityKey,
              protectedContent: requireProtectedContent(protectedContent),
            }),
        }
      : {}),
    ...(input.config.teacherMediaAssociationOwnerEnabled
      ? {
          teacherMediaAssociationOwnerBinding:
            dependencies.createTeacherMediaAssociationBinding({
              prisma,
              integrityKey,
            }),
        }
      : {}),
    ...(input.config.teacherAssistantQueryOwnerEnabled
      ? {
          teacherAssistantQueryOwnerBinding:
            dependencies.createTeacherAssistantQueryBinding({
              prisma,
              integrityKey,
              protectedContent: requireProtectedContent(protectedContent),
            }),
        }
      : {}),
  };

  return createAssembly(bindings, prisma);
}

function firstEnabledReadySurface(
  config: ScenarioServiceConfig,
): ProductionSurface | undefined {
  if (config.parentContextPresenterEnabled) {
    return "parent_context_presenter";
  }
  if (config.parentCommunicationOwnerEnabled) {
    return "parent_communication_owner";
  }
  if (config.parentCommunicationExtensionEnabled) {
    return "parent_communication_extension";
  }
  if (config.directorPresenterEnabled) {
    return "director_presenter";
  }
  if (config.teacherClassStreamPresenterEnabled) {
    return "teacher_class_stream_presenter";
  }
  if (config.teacherOrganizationOwnerEnabled) {
    return "teacher_organization_owner";
  }
  if (config.teacherCommunicationOwnerEnabled) {
    return "teacher_communication_owner";
  }
  if (config.teacherMediaAssociationOwnerEnabled) {
    return "teacher_media_association_owner";
  }
  if (config.teacherAssistantQueryOwnerEnabled) {
    return "teacher_assistant_query_owner";
  }
  return undefined;
}

function firstEnabledProtectedContentSurface(
  config: ScenarioServiceConfig,
): ProductionSurface {
  if (config.parentCommunicationOwnerEnabled) {
    return "parent_communication_owner";
  }
  if (config.teacherOrganizationOwnerEnabled) {
    return "teacher_organization_owner";
  }
  if (config.teacherCommunicationOwnerEnabled) {
    return "teacher_communication_owner";
  }
  return "teacher_assistant_query_owner";
}

function requireDependency(
  available: boolean,
  surface: ProductionSurface,
  reason: string,
  logger: ScenarioStructuredLogger,
): void {
  if (!available) {
    refuse(surface, reason, logger);
  }
}

function refuse(
  surface: ProductionSurface,
  reason: string,
  logger: ScenarioStructuredLogger,
): never {
  logger.productionAssemblyRefused({ surface, reason });
  throw new Error(`Scenario-service production assembly refused for ${surface}: ${reason}`);
}

function hasMinimumLength(value: string | undefined): value is string {
  return Boolean(value && Buffer.byteLength(value, "utf8") >= MINIMUM_SECRET_LENGTH);
}

function requireProtectedContent<T>(value: T | undefined): T {
  if (!value) {
    throw new Error("Production assembly protected-content validation invariant failed.");
  }
  return value;
}

function createAssembly(
  bindings: ScenarioServiceProductionBindings,
  prisma?: NurturePrismaClient,
): ScenarioServiceProductionAssembly {
  let disconnected = false;
  return Object.freeze({
    bindings: Object.freeze(bindings),
    ...(prisma ? { prisma } : {}),
    async disconnect(): Promise<void> {
      if (disconnected) return;
      disconnected = true;
      await prisma?.$disconnect();
    },
  });
}
