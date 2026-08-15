import { describe, expect, it, vi } from "vitest";
import {
  createPrismaParentContextPresenterBinding,
  createPrismaTeacherAssistantQueryBinding,
  createPrismaTeacherClassStreamBinding,
  createPrismaTeacherCommunicationBinding,
  createPrismaTeacherMediaAssociationBinding,
  createPrismaTeacherOrganizationBinding,
  type NurturePrismaClient,
} from "@the-nurture/db";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import {
  loadScenarioServiceConfig,
  type ScenarioServiceConfig,
} from "../src/config.js";
import {
  createScenarioServiceProductionAssembly,
  type ScenarioServiceProductionAssemblyDependencies,
} from "../src/production-assembly.js";
import type { ScenarioStructuredLogRecord } from "../src/structured-logger.js";

const INTEGRITY_KEY = "integrity-key-material-at-least-32-characters";
const CONTENT_KEY = "protected-content-key-at-least-32-characters";
const DATABASE_URL = "postgresql://unused/production-assembly";
const configuredServiceAuth = createBindingOwnerServiceAuth("service-token");
const defaultConfig = loadScenarioServiceConfig({});

type ReadyGate =
  | "parentContextPresenterEnabled"
  | "teacherClassStreamPresenterEnabled"
  | "teacherOrganizationOwnerEnabled"
  | "teacherCommunicationOwnerEnabled"
  | "teacherMediaAssociationOwnerEnabled"
  | "teacherAssistantQueryOwnerEnabled";

type UnreadyGate =
  | "parentCommunicationOwnerEnabled"
  | "parentCommunicationExtensionEnabled"
  | "directorPresenterEnabled";

const readyCases = [
  {
    gate: "parentContextPresenterEnabled",
    factory: "createParentContextPresenterBinding",
    binding: "parentContextPresenterOwnerBinding",
    needsProtectedContent: false,
  },
  {
    gate: "teacherClassStreamPresenterEnabled",
    factory: "createTeacherClassStreamBinding",
    binding: "teacherClassStreamOwnerBinding",
    needsProtectedContent: false,
  },
  {
    gate: "teacherOrganizationOwnerEnabled",
    factory: "createTeacherOrganizationBinding",
    binding: "teacherOrganizationOwnerBinding",
    needsProtectedContent: true,
  },
  {
    gate: "teacherCommunicationOwnerEnabled",
    factory: "createTeacherCommunicationBinding",
    binding: "teacherCommunicationOwnerBinding",
    needsProtectedContent: true,
  },
  {
    gate: "teacherMediaAssociationOwnerEnabled",
    factory: "createTeacherMediaAssociationBinding",
    binding: "teacherMediaAssociationOwnerBinding",
    needsProtectedContent: false,
  },
  {
    gate: "teacherAssistantQueryOwnerEnabled",
    factory: "createTeacherAssistantQueryBinding",
    binding: "teacherAssistantQueryOwnerBinding",
    needsProtectedContent: true,
  },
] as const satisfies readonly Readonly<{
  gate: ReadyGate;
  factory: keyof ScenarioServiceProductionAssemblyDependencies;
  binding: string;
  needsProtectedContent: boolean;
}>[];

const unreadyCases = [
  {
    gate: "parentCommunicationOwnerEnabled",
    surface: "parent_communication_owner",
    reason: "parent communication has not cut over to Nurture-owned enrollment selection",
  },
  {
    gate: "parentCommunicationExtensionEnabled",
    surface: "parent_communication_extension",
    reason: "parent communication has not cut over to Nurture-owned enrollment selection",
  },
  {
    gate: "directorPresenterEnabled",
    surface: "director_presenter",
    reason: "no Prisma owner composition exists yet for this surface",
  },
] as const satisfies readonly Readonly<{
  gate: UnreadyGate;
  surface: string;
  reason: string;
}>[];

describe("scenario-service production assembly", () => {
  it("does not assemble bindings, log, or create Prisma when all nine gates are off", async () => {
    const fixture = createDependencies();
    const logs: ScenarioStructuredLogRecord[] = [];

    const assembly = createScenarioServiceProductionAssembly({
      config: defaultConfig,
      serviceAuth: createBindingOwnerServiceAuth(undefined),
      env: {},
      logSink: (record) => logs.push(record),
      dependencies: fixture.dependencies,
    });

    expect(assembly.bindings).toEqual({});
    expect(fixture.createPrisma).not.toHaveBeenCalled();
    expect(fixture.bindingFactories).toSatisfy(
      (factories: readonly ReturnType<typeof vi.fn>[]) =>
        factories.every((factory) => factory.mock.calls.length === 0),
    );
    expect(logs).toEqual([]);
    await assembly.disconnect();
    expect(fixture.disconnect).not.toHaveBeenCalled();
  });

  it.each(readyCases)(
    "requests the $factory composition binding when $gate is enabled",
    async ({ gate, factory, binding, needsProtectedContent }) => {
      const fixture = createDependencies();
      const assembly = createScenarioServiceProductionAssembly({
        config: enable(defaultConfig, gate),
        serviceAuth: configuredServiceAuth,
        env: completeEnvironment(),
        dependencies: fixture.dependencies,
      });

      expect(fixture.createPrisma).toHaveBeenCalledOnce();
      expect(fixture.createPrisma).toHaveBeenCalledWith(DATABASE_URL);
      expect(fixture.dependencies[factory]).toHaveBeenCalledOnce();
      expect(binding in assembly.bindings).toBe(true);
      expect(fixture.bindingFactories).toSatisfy(
        (factories: readonly ReturnType<typeof vi.fn>[]) =>
          factories.reduce(
            (calls, bindingFactory) => calls + bindingFactory.mock.calls.length,
            0,
          ) === 1,
      );
      expect(fixture.createProtectedContent).toHaveBeenCalledTimes(
        needsProtectedContent ? 1 : 0,
      );

      await assembly.disconnect();
      expect(fixture.disconnect).toHaveBeenCalledOnce();
    },
  );

  it.each(unreadyCases)(
    "refuses $surface because its production owner dependency is unavailable",
    ({ gate, surface, reason }) => {
      const fixture = createDependencies();
      const logs: ScenarioStructuredLogRecord[] = [];

      expect(() =>
        createScenarioServiceProductionAssembly({
          config: enable(defaultConfig, gate),
          serviceAuth: configuredServiceAuth,
          env: completeEnvironment(),
          logSink: (record) => logs.push(record),
          dependencies: fixture.dependencies,
        }),
      ).toThrow(reason);

      expect(logs).toEqual([
        {
          schema: "nurture_scenario_service_log_v1",
          event: "scenario_service_production_assembly_refused",
          surface,
          reason,
        },
      ]);
      expect(fixture.createPrisma).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      name: "service auth",
      gate: "teacherClassStreamPresenterEnabled" as const,
      surface: "teacher_class_stream_presenter",
      serviceAuth: createBindingOwnerServiceAuth(undefined),
      env: completeEnvironment(),
      reason: "missing NURTURE_INTERNAL_SERVICE_TOKEN",
    },
    {
      name: "DATABASE_URL",
      gate: "teacherClassStreamPresenterEnabled" as const,
      surface: "teacher_class_stream_presenter",
      serviceAuth: configuredServiceAuth,
      env: completeEnvironment({ DATABASE_URL: undefined }),
      reason: "missing DATABASE_URL",
    },
    {
      name: "integrity key",
      gate: "teacherClassStreamPresenterEnabled" as const,
      surface: "teacher_class_stream_presenter",
      serviceAuth: configuredServiceAuth,
      env: completeEnvironment({ NURTURE_HARNESS_INTEGRITY_KEY: undefined }),
      reason: "missing or invalid NURTURE_HARNESS_INTEGRITY_KEY",
    },
    {
      name: "protected-content key",
      gate: "teacherOrganizationOwnerEnabled" as const,
      surface: "teacher_organization_owner",
      serviceAuth: configuredServiceAuth,
      env: completeEnvironment({ NURTURE_PROTECTED_CONTENT_KEY: undefined }),
      reason: "missing or invalid NURTURE_PROTECTED_CONTENT_KEY",
    },
  ])("refuses an enabled ready surface when $name is missing", ({
    gate,
    surface,
    serviceAuth,
    env,
    reason,
  }) => {
    const fixture = createDependencies();
    const logs: ScenarioStructuredLogRecord[] = [];

    expect(() =>
      createScenarioServiceProductionAssembly({
        config: enable(defaultConfig, gate),
        serviceAuth,
        env,
        logSink: (record) => logs.push(record),
        dependencies: fixture.dependencies,
      }),
    ).toThrow(reason);

    expect(logs).toEqual([
      {
        schema: "nurture_scenario_service_log_v1",
        event: "scenario_service_production_assembly_refused",
        surface,
        reason,
      },
    ]);
    expect(fixture.createPrisma).not.toHaveBeenCalled();
  });

  it("shares one Prisma client across all six bindings and disconnects it once", async () => {
    const fixture = createDependencies();
    const allReadyConfig = readyCases.reduce(
      (config, { gate }) => enable(config, gate),
      defaultConfig,
    );
    const assembly = createScenarioServiceProductionAssembly({
      config: allReadyConfig,
      serviceAuth: configuredServiceAuth,
      env: completeEnvironment(),
      dependencies: fixture.dependencies,
    });

    expect(fixture.createPrisma).toHaveBeenCalledOnce();
    expect(fixture.bindingPrisma).toEqual(Array(6).fill(fixture.prisma));

    await assembly.disconnect();
    await assembly.disconnect();
    expect(fixture.disconnect).toHaveBeenCalledOnce();
  });
});

function enable(
  config: ScenarioServiceConfig,
  gate: ReadyGate | UnreadyGate,
): ScenarioServiceConfig {
  return Object.freeze({ ...config, [gate]: true });
}

function completeEnvironment(
  overrides: Partial<NodeJS.ProcessEnv> = {},
): NodeJS.ProcessEnv {
  return {
    DATABASE_URL,
    NURTURE_HARNESS_INTEGRITY_KEY: INTEGRITY_KEY,
    NURTURE_PROTECTED_CONTENT_KEY: CONTENT_KEY,
    ...overrides,
  };
}

function createDependencies() {
  const disconnect = vi.fn(async () => undefined);
  const prisma = { $disconnect: disconnect } as unknown as NurturePrismaClient;
  const createPrisma = vi.fn(() => prisma);
  const createProtectedContent = vi.fn(() => ({
    seal: vi.fn(),
    unseal: vi.fn(),
  }));
  const classStreamBinding = Object.freeze(
    {},
  ) as ReturnType<typeof createPrismaTeacherClassStreamBinding>;
  const parentContextBinding = Object.freeze(
    {},
  ) as ReturnType<typeof createPrismaParentContextPresenterBinding>;
  const organizationBinding = Object.freeze(
    {},
  ) as ReturnType<typeof createPrismaTeacherOrganizationBinding>;
  const communicationBinding = Object.freeze(
    {},
  ) as ReturnType<typeof createPrismaTeacherCommunicationBinding>;
  const mediaAssociationBinding = Object.freeze(
    {},
  ) as ReturnType<typeof createPrismaTeacherMediaAssociationBinding>;
  const assistantQueryBinding = Object.freeze(
    {},
  ) as ReturnType<typeof createPrismaTeacherAssistantQueryBinding>;
  const bindingPrisma: NurturePrismaClient[] = [];
  const createParentContextPresenterBinding = vi.fn((
    input: Parameters<typeof createPrismaParentContextPresenterBinding>[0],
  ) => {
    bindingPrisma.push(input.prisma);
    return parentContextBinding;
  });
  const createTeacherClassStreamBinding = vi.fn((
    input: Parameters<typeof createPrismaTeacherClassStreamBinding>[0],
  ) => {
    bindingPrisma.push(input.prisma);
    return classStreamBinding;
  });
  const createTeacherOrganizationBinding = vi.fn((
    input: Parameters<typeof createPrismaTeacherOrganizationBinding>[0],
  ) => {
    bindingPrisma.push(input.prisma);
    return organizationBinding;
  });
  const createTeacherCommunicationBinding = vi.fn((
    input: Parameters<typeof createPrismaTeacherCommunicationBinding>[0],
  ) => {
    bindingPrisma.push(input.prisma);
    return communicationBinding;
  });
  const createTeacherMediaAssociationBinding = vi.fn((
    input: Parameters<typeof createPrismaTeacherMediaAssociationBinding>[0],
  ) => {
    bindingPrisma.push(input.prisma);
    return mediaAssociationBinding;
  });
  const createTeacherAssistantQueryBinding = vi.fn((
    input: Parameters<typeof createPrismaTeacherAssistantQueryBinding>[0],
  ) => {
    bindingPrisma.push(input.prisma);
    return assistantQueryBinding;
  });
  const dependencies: ScenarioServiceProductionAssemblyDependencies = {
    createPrismaClient: createPrisma,
    createProtectedContent,
    createParentContextPresenterBinding,
    createTeacherClassStreamBinding,
    createTeacherOrganizationBinding,
    createTeacherCommunicationBinding,
    createTeacherMediaAssociationBinding,
    createTeacherAssistantQueryBinding,
  };

  return {
    dependencies,
    prisma,
    disconnect,
    createPrisma,
    createProtectedContent,
    bindingPrisma,
    bindingFactories: [
      createParentContextPresenterBinding,
      createTeacherClassStreamBinding,
      createTeacherOrganizationBinding,
      createTeacherCommunicationBinding,
      createTeacherMediaAssociationBinding,
      createTeacherAssistantQueryBinding,
    ],
  };
}
