import { readFileSync } from "node:fs";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { createNurtureTeacherClassStreamHttpSource } from "@my-chat/scenario-integrations/nurture-teacher-class-stream";
import type { TeacherClassStreamOperation } from "@the-nurture/scenario";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { createBindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import { createFamilyGrowthRenditionRuntime } from "../src/family-growth-runtime.js";
import { createDisabledFamilySharingPrivateRuntime } from "../src/family-sharing-private-runtime.js";
import { HarnessRuntime } from "../src/harness-runtime.js";
import { SafeExceptionFilter } from "../src/safe-exception.filter.js";
import { ScenarioStructuredLogger } from "../src/structured-logger.js";
import {
  TeacherClassStreamComposition,
  type TeacherClassStreamAuthorityResolverV1,
  type TeacherClassStreamOwnerResolutionV1,
  type TeacherClassStreamOwnerV1,
} from "../src/teacher-class-stream-composition.js";

const TOKEN = "teacher-class-stream-service-token";

type Fixture = Readonly<{
  fixture_id: string;
  operation: TeacherClassStreamOperation;
  response: unknown;
}>;

describe("W6 My-Chat and Nurture joint HTTP boundary", () => {
  let app: NestExpressApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const auth = createBindingOwnerServiceAuth(TOKEN);
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule.register({
          logger: new ScenarioStructuredLogger(() => undefined),
          bindingOwner: {
            runtime: createBindingOwnerRuntime({ serviceAuth: auth }),
            serviceAuth: auth,
          },
          harness: {
            runtime: new HarnessRuntime(undefined),
            serviceAuth: auth,
          },
          familyGrowthRendition: createFamilyGrowthRenditionRuntime(),
          teacherReleaseOwner: { serviceAuth: auth },
          parentContextPresenter: { serviceAuth: auth },
          teacherClassStream: {
            composition: operationComposition(loadFixtures()),
            serviceAuth: auth,
          },
          familySharingPrivate: {
            runtime: createDisabledFamilySharingPrivateRuntime(),
            serviceAuth: auth,
          },
        }),
      ],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useGlobalFilters(moduleRef.get(SafeExceptionFilter));
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it("validates all four owner reads through TCP, auth and strict codecs", async () => {
    const source = createNurtureTeacherClassStreamHttpSource({
      baseUrl,
      serviceToken: TOKEN,
      now: () => Date.parse("2026-08-14T09:01:00.000Z"),
    });
    const identity = {
      workspaceId: "workspace-teacher-01",
      myChatUserId: "user-teacher-01",
      hostRequestId: "joint-w6-http-01",
      contextRef: "context:teacher:sunflower:v3",
    };

    const classContext = await source.classContext({
      ...identity,
      localDate: "2026-08-14",
    });
    expect(classContext.status).toBe("ready");
    if (classContext.status !== "ready") return;
    const classRef = classContext.day_header.class_ref;
    const [childStrip, schedule] = await Promise.all([
      source.childStrip({ ...identity, classRef, localDate: "2026-08-14" }),
      source.schedule({ ...identity, classRef, localDate: "2026-08-14" }),
    ]);
    expect(childStrip.status).toBe("ready");
    expect(schedule.status).toBe("ready");
    if (childStrip.status !== "ready") return;
    const childRef = "child:ref:rain-02";
    expect(childStrip.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ child_ref: childRef })]),
    );
    await expect(
      source.childDayDetail({
        ...identity,
        classRef,
        childRef,
        localDate: "2026-08-14",
      }),
    ).resolves.toMatchObject({
      status: "ready",
      child_ref: childRef,
      local_date: "2026-08-14",
    });
  });
});

function operationComposition(fixtures: readonly Fixture[]) {
  const selectedIds = new Set([
    "w6-class-context-ready-two-classes",
    "w6-child-strip-ready",
    "w6-child-day-detail-ready-full",
    "w6-schedule-ready-day-override",
  ]);
  const byOperation = new Map(
    fixtures
      .filter((item) => selectedIds.has(item.fixture_id))
      .map((item) => [item.operation, item.response] as const),
  );
  const responseFor = (operation: TeacherClassStreamOperation): unknown => {
    const response = byOperation.get(operation);
    if (!response) throw new Error(`Missing fixture operation ${operation}`);
    return response;
  };
  const authorityResolver: TeacherClassStreamAuthorityResolverV1 = {
    async resolve(input) {
      const response = responseFor(input.operation);
      if (!isReady(response)) return { status: "closed", response };
      return {
        status: "resolved",
        owner_resolution: response.owner_resolution,
      };
    },
  };
  const owner: TeacherClassStreamOwnerV1 = {
    classContext: async () => responseFor("class_context_query"),
    childStrip: async () => responseFor("child_strip_query"),
    childDayDetail: async () => responseFor("child_day_detail_query"),
    schedule: async () => responseFor("schedule_query"),
  };
  return new TeacherClassStreamComposition(authorityResolver, owner);
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/teacher-class-stream/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isReady(value: unknown): value is Readonly<{
  status: "ready";
  owner_resolution: TeacherClassStreamOwnerResolutionV1;
}> {
  return isRecord(value) &&
    value.status === "ready" &&
    isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
