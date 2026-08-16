import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
  TEACHER_ORGANIZATION_OWNER_FEED_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
  TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
  TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
  type TeacherOrganizationOwnerOperation,
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
import {
  type ScenarioStructuredLogRecord,
  type ScenarioStructuredLogSink,
  ScenarioStructuredLogger,
} from "../src/structured-logger.js";
import {
  TeacherOrganizationOwnerComposition,
  type TeacherOrganizationAuthorityResolverV1,
  type TeacherOrganizationOwnerResolutionV1,
  type TeacherOrganizationOwnerV1,
} from "../src/teacher-organization-owner-composition.js";

const TOKEN = "teacher-organization-owner-service-token";
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: TeacherOrganizationOwnerOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("teacher organization-owner formal ingress", () => {
  it("mounts all six operations with current authority and private headers", async () => {
    const selected = [
      fixture("w7-feed-ready"),
      fixture("w7-organization-ready"),
      fixture("w7-organize-committed-organized"),
      fixture("w7-supplement-prepare-ready"),
      fixture("w7-class-note-committed"),
      fixture("w7-admission-committed-queued"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      TEACHER_ORGANIZATION_OWNER_FEED_PATH,
      TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
      TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
      TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
      TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
      TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
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
      expect(JSON.stringify(response.json())).not.toContain("participant_id");
    }
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(6);
    expect(runtime.owner.organize).toHaveBeenCalledTimes(1);
    expect(runtime.owner.supplement).toHaveBeenCalledTimes(1);
    expect(runtime.owner.classNote).toHaveBeenCalledTimes(1);
    expect(runtime.owner.queueAdmission).toHaveBeenCalledTimes(1);
  });

  it("echoes command identity and replay/settlement shape on the exchanges", async () => {
    const replayed = fixture("w7-admission-replayed-already-satisfied");
    const unknown = fixture("w7-supplement-outcome-unknown");
    const runtime = fixtureComposition([replayed, unknown]);
    const records: ScenarioStructuredLogRecord[] = [];
    const application = await start(
      runtime.composition,
      (record) => records.push(record),
    );
    const replayResponse = await post(
      application,
      TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
      replayed.request,
    );
    expect(replayResponse.json()).toMatchObject({
      status: "committed",
      executed: "replayed",
      disposition: "already_satisfied",
      command_request_id: replayed.request.command_request_id,
    });
    const unknownResponse = await post(
      application,
      TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
      unknown.request,
    );
    expect(unknownResponse.json()).toMatchObject({
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
      command_request_id: unknown.request.command_request_id,
    });
    expect(
      records.filter((record) => record.event === "scenario_command_settled"),
    ).toEqual([
      expect.objectContaining({
        schema: "nurture_scenario_service_log_v1",
        event: "scenario_command_settled",
        surface: "teacher_organization_owner",
        outcome: "already_satisfied",
        duration_ms: expect.any(Number),
      }),
      expect.objectContaining({
        schema: "nurture_scenario_service_log_v1",
        event: "scenario_command_settled",
        surface: "teacher_organization_owner",
        outcome: "reconciled",
        duration_ms: expect.any(Number),
      }),
    ]);
  });

  it("returns current fail-closed responses without calling owner ports", async () => {
    const selected = fixture("w7-masked-access-changed");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const response = await post(
      application,
      TEACHER_ORGANIZATION_OWNER_FEED_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
    expect(runtime.owner.feed).not.toHaveBeenCalled();
  });

  it("rejects caller authority, pin drift and malformed command payloads at parse", async () => {
    const organize = fixture("w7-organize-committed-organized");
    const note = fixture("w7-class-note-committed");
    const application = await start(
      fixtureComposition([organize, note]).composition,
    );
    const foreign = { ...organize.request, care_group_id: "care-group-raw" };
    expect(
      (await post(application, TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH, foreign))
        .statusCode,
    ).toBe(400);
    const drifted = structuredClone(organize.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (await post(application, TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH, drifted))
        .statusCode,
    ).toBe(400);
    const automatic = { ...organize.request, trigger: "automatic" };
    expect(
      (
        await post(
          application,
          TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
          automatic,
        )
      ).statusCode,
    ).toBe(400);
    const oversized = { ...note.request, text: "超".repeat(501) };
    expect(
      (
        await post(
          application,
          TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
          oversized,
        )
      ).statusCode,
    ).toBe(400);
  });

  it("kills command identity drift and prepare/confirm pairing violations", async () => {
    const organize = fixture("w7-organize-committed-organized");
    const commandDrift = structuredClone(organize.response) as Record<string, unknown>;
    commandDrift.command_request_id = "command-w7-organize-9999";
    expect(
      (
        await post(
          await start(fixtureComposition([organize], commandDrift).composition),
          TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
          organize.request,
        )
      ).statusCode,
    ).toBe(500);

    const prepare = fixture("w7-supplement-prepare-ready");
    const confirmShape = fixture("w7-supplement-confirm-committed")
      .response as Record<string, unknown>;
    const paired = {
      ...structuredClone(confirmShape),
      command_request_id: prepare.request.command_request_id,
      context_ref: prepare.request.context_ref,
    };
    expect(
      (
        await post(
          await start(fixtureComposition([prepare], paired).composition),
          TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
          prepare.request,
        )
      ).statusCode,
    ).toBe(500);

    const admission = fixture("w7-admission-committed-queued");
    const foreignProcess = structuredClone(admission.response) as Record<string, unknown>;
    foreignProcess.process_ref = "process:ref:foreign-0001";
    expect(
      (
        await post(
          await start(fixtureComposition([admission], foreignProcess).composition),
          TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
          admission.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("kills read binding drift on scope, query key and quick-adjust invariants", async () => {
    const feed = fixture("w7-feed-ready");
    const scopeDrift = structuredClone(feed.response) as Record<string, unknown>;
    (scopeDrift.owner_resolution as Record<string, unknown>).scope_ref =
      "class:ref:willow-02";
    (scopeDrift.cache_partition as Record<string, unknown>).query_key =
      "class:ref:willow-02";
    expect(
      (
        await post(
          await start(fixtureComposition([feed], scopeDrift).composition),
          TEACHER_ORGANIZATION_OWNER_FEED_PATH,
          feed.request,
        )
      ).statusCode,
    ).toBe(500);

    const organization = fixture("w7-organization-ready");
    const doubleQuickAdjust = structuredClone(
      organization.response,
    ) as Record<string, unknown>;
    const lane = doubleQuickAdjust.lane as Array<Record<string, unknown>>;
    expect(lane.length).toBeGreaterThanOrEqual(2);
    const active = lane.find((card) => card.quick_adjust_until !== undefined);
    const second = lane.find((card) => card.quick_adjust_until === undefined);
    expect(active && second).toBeTruthy();
    if (second && active) {
      second.quick_adjust_until = active.quick_adjust_until;
    }
    expect(
      (
        await post(
          await start(
            fixtureComposition([organization], doubleQuickAdjust).composition,
          ),
          TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
          organization.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w7-feed-ready");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      TEACHER_ORGANIZATION_OWNER_FEED_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({
      error: "teacher_organization_owner_disabled",
    });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      TEACHER_ORGANIZATION_OWNER_FEED_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(
  composition?: TeacherOrganizationOwnerComposition,
  logSink: ScenarioStructuredLogSink = () => undefined,
) {
  const auth = createBindingOwnerServiceAuth(TOKEN);
  const logger = new ScenarioStructuredLogger(logSink);
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
        teacherOrganizationOwner: {
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
  if (!found) {
    throw new Error(`Missing teacher organization fixture ${fixtureId}`);
  }
  return found;
}

// Exchange responses carry no owner_resolution, so the resolver fabricates the
// care-group resolution from the request; reads reuse the fixture resolution.
function fixtureComposition(
  selected: readonly Fixture[],
  overrideResponse?: unknown,
) {
  const byRequest = new Map(
    selected.map((item) => [String(item.request.host_request_id), item] as const),
  );
  const authorityResolver: TeacherOrganizationAuthorityResolverV1 = {
    resolve: vi.fn(async (input) => {
      const item = byRequest.get(input.host_request_id);
      if (!item) throw new Error("Missing fixture request");
      const status = isRecord(item.response) ? item.response.status : undefined;
      if (status === "masked" || status === "unavailable") {
        return { status: "closed", response: item.response } as const;
      }
      if (isReady(item.response)) {
        return {
          status: "resolved",
          owner_resolution: item.response.owner_resolution,
        } as const;
      }
      return {
        status: "resolved",
        owner_resolution: {
          resolution_ref: "resolution:w7:e2e",
          presentation_role: "caregiver",
          scope_kind: "care_group",
          scope_ref: String(item.request.class_ref),
          context_ref: String(item.request.context_ref),
          scope_version: 3,
          resolved_at: "2026-08-14T09:00:00.000Z",
        },
      } as const;
    }),
  };
  const responseFor = (hostRequestId: string): unknown => {
    if (overrideResponse !== undefined) return overrideResponse;
    const item = byRequest.get(hostRequestId);
    if (!item) throw new Error("Missing owner fixture response");
    return item.response;
  };
  const owner: TeacherOrganizationOwnerV1 = {
    feed: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    organization: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    organize: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    supplement: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    classNote: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    queueAdmission: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new TeacherOrganizationOwnerComposition(authorityResolver, owner),
  };
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/teacher-organization-owner/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isReady(value: unknown): value is Readonly<{
  status: "ready";
  owner_resolution: TeacherOrganizationOwnerResolutionV1;
}> {
  return isRecord(value)
    && value.status === "ready"
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
