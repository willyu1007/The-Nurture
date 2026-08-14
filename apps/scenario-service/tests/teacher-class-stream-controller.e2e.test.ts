import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
  TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
  TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
  TEACHER_CLASS_STREAM_SCHEDULE_PATH,
  type TeacherClassStreamOperation,
} from "@the-nurture/scenario";
import inject from "light-my-request";
import { afterEach, describe, expect, it, vi } from "vitest";
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
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: TeacherClassStreamOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("teacher class-stream formal ingress", () => {
  it("mounts all four read operations with current authority and private headers", async () => {
    const selected = [
      fixture("w6-class-context-ready-two-classes"),
      fixture("w6-child-strip-ready"),
      fixture("w6-child-day-detail-ready-full"),
      fixture("w6-schedule-ready-day-override"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
      TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
      TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
      TEACHER_CLASS_STREAM_SCHEDULE_PATH,
    ];
    for (let index = 0; index < routes.length; index += 1) {
      const response = await post(
        application,
        routes[index] ?? "",
        selected[index]?.request,
      );
      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("private, no-store");
      expect(response.headers.pragma).toBe("no-cache");
    }
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(4);
    expect(runtime.owner.classContext).toHaveBeenCalledTimes(1);
    expect(runtime.owner.childStrip).toHaveBeenCalledTimes(1);
    expect(runtime.owner.childDayDetail).toHaveBeenCalledTimes(1);
    expect(runtime.owner.schedule).toHaveBeenCalledTimes(1);
  });

  it("stays read-only: availability descriptors only, no executable reference", async () => {
    const selected = fixture("w6-child-day-detail-ready-full");
    const application = await start(fixtureComposition([selected]).composition);
    const response = await post(
      application,
      TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
      selected.request,
    );
    const body = response.json() as Record<string, unknown>;
    const sections = body.sections as Array<Record<string, unknown>>;
    expect(sections.find((section) => section.section_key === "daily_care"))
      .toMatchObject({
        supplement_action: {
          capability_key: "record_caregiver_daily_care",
          availability: "available",
        },
      });
    expect(JSON.stringify(body)).not.toContain("action_ref");
    expect(JSON.stringify(body)).not.toContain("confirmation_ref");
    expect(JSON.stringify(body)).not.toContain("command_request_id");
  });

  it("returns current fail-closed responses without calling owner reads", async () => {
    const selected = fixture("w6-masked-access-changed");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const response = await post(
      application,
      TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
    expect(runtime.owner.childStrip).not.toHaveBeenCalled();
  });

  it("rejects foreign authority, pin drift, hidden payloads and owner binding drift", async () => {
    const selected = fixture("w6-child-strip-ready");
    const application = await start(fixtureComposition([selected]).composition);
    const foreign = { ...selected.request, care_group_id: "care-group-raw" };
    expect(
      (await post(application, TEACHER_CLASS_STREAM_CHILD_STRIP_PATH, foreign))
        .statusCode,
    ).toBe(400);
    const drifted = structuredClone(selected.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (await post(application, TEACHER_CLASS_STREAM_CHILD_STRIP_PATH, drifted))
        .statusCode,
    ).toBe(400);

    const scopeDrift = structuredClone(selected.response) as Record<string, unknown>;
    (scopeDrift.owner_resolution as Record<string, unknown>).scope_ref =
      "class:ref:maple-02";
    expect(
      (
        await post(
          await start(fixtureComposition([selected], scopeDrift).composition),
          TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
          selected.request,
        )
      ).statusCode,
    ).toBe(500);

    const queryKeyDrift = structuredClone(selected.response) as Record<string, unknown>;
    (queryKeyDrift.cache_partition as Record<string, unknown>).query_key =
      "class:ref:maple-02|2026-08-14";
    expect(
      (
        await post(
          await start(fixtureComposition([selected], queryKeyDrift).composition),
          TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
          selected.request,
        )
      ).statusCode,
    ).toBe(500);

    const detail = fixture("w6-child-day-detail-ready-partial");
    const hiddenPayload = structuredClone(detail.response) as Record<string, unknown>;
    const sections = hiddenPayload.sections as Array<Record<string, unknown>>;
    sections[0] = { ...sections[0], arrival_state: "arrived" };
    expect(
      (
        await post(
          await start(fixtureComposition([detail], hiddenPayload).composition),
          TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
          detail.request,
        )
      ).statusCode,
    ).toBe(500);

    const context = fixture("w6-class-context-ready-two-classes");
    const doubleCurrent = structuredClone(context.response) as Record<string, unknown>;
    const classes = doubleCurrent.classes as Array<Record<string, unknown>>;
    classes[1] = { ...classes[1], current: true };
    expect(
      (
        await post(
          await start(fixtureComposition([context], doubleCurrent).composition),
          TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
          context.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w6-class-context-ready-two-classes");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({
      error: "teacher_class_stream_presenter_disabled",
    });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(composition?: TeacherClassStreamComposition) {
  const auth = createBindingOwnerServiceAuth(TOKEN);
  const logger = new ScenarioStructuredLogger(() => undefined);
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppModule.register({
        logger,
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
          ...(composition ? { composition } : {}),
          serviceAuth: auth,
        },
        familySharingPrivate: {
          runtime: createDisabledFamilySharingPrivateRuntime(),
          serviceAuth: auth,
        },
      }),
    ],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useGlobalFilters(moduleRef.get(SafeExceptionFilter));
  await app.init();
  closes.push(() => app.close());
  return app.getHttpAdapter().getInstance() as RequestListener;
}

const post = (
  application: RequestListener,
  path: string,
  body: unknown,
  token = TOKEN,
) =>
  inject(application, {
    method: "POST",
    url: path,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    payload: JSON.stringify(body),
  });

function fixture(fixtureId: string): Fixture {
  const found = fixtures.find((candidate) => candidate.fixture_id === fixtureId);
  if (!found) throw new Error(`Missing teacher class-stream fixture ${fixtureId}`);
  return found;
}

function fixtureComposition(
  selected: readonly Fixture[],
  overrideResponse?: unknown,
) {
  const byRequest = new Map(
    selected.map((item) => [String(item.request.host_request_id), item] as const),
  );
  const authorityResolver: TeacherClassStreamAuthorityResolverV1 = {
    resolve: vi.fn(async (input) => {
      const item = byRequest.get(input.host_request_id);
      if (!item) throw new Error("Missing fixture request");
      if (isReady(item.response)) {
        return {
          status: "resolved",
          owner_resolution: item.response.owner_resolution,
        } as const;
      }
      return { status: "closed", response: item.response } as const;
    }),
  };
  const responseFor = (hostRequestId: string): unknown => {
    if (overrideResponse !== undefined) return overrideResponse;
    const item = byRequest.get(hostRequestId);
    if (!item) throw new Error("Missing owner fixture response");
    return item.response;
  };
  const owner: TeacherClassStreamOwnerV1 = {
    classContext: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    childStrip: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    childDayDetail: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    schedule: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new TeacherClassStreamComposition(authorityResolver, owner),
  };
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
  return isRecord(value)
    && value.status === "ready"
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
