import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
  type TeacherAssistantQueryOwnerOperation,
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
  TeacherAssistantQueryOwnerComposition,
  type TeacherAssistantQueryAuthorityResolverV1,
  type TeacherAssistantQueryOwnerResolutionV1,
  type TeacherAssistantQueryOwnerV1,
} from "../src/teacher-assistant-query-owner-composition.js";

const TOKEN = "teacher-assistant-query-owner-service-token";
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: TeacherAssistantQueryOwnerOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("teacher assistant-query formal ingress", () => {
  it("mounts all three operations with current authority and private headers", async () => {
    const selected = [
      fixture("w10-missing-records-ready"),
      fixture("w10-weekly-source-ready"),
      fixture("w10-weekly-draft-committed-created"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
      TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
      TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
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
      // The supplement handoff stays a typed descriptor, never executable.
      expect(JSON.stringify(response.json())).not.toContain("action_ref");
    }
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(3);
    expect(runtime.owner.weeklyDraft).toHaveBeenCalledTimes(1);
  });

  it("echoes command identity across executed, replayed and duplicate weeks", async () => {
    const replayed = fixture("w10-weekly-draft-replayed");
    const satisfied = fixture("w10-weekly-draft-already-satisfied");
    const unknown = fixture("w10-weekly-draft-outcome-unknown");
    const runtime = fixtureComposition([replayed, satisfied, unknown]);
    const application = await start(runtime.composition);
    const replayResponse = await post(
      application,
      TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
      replayed.request,
    );
    expect(replayResponse.json()).toMatchObject({
      status: "committed",
      executed: "replayed",
      command_request_id: replayed.request.command_request_id,
    });
    const satisfiedResponse = await post(
      application,
      TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
      satisfied.request,
    );
    expect(satisfiedResponse.json()).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
      process_ref: "process:ref:weekly-0001",
    });
    const unknownResponse = await post(
      application,
      TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
      unknown.request,
    );
    expect(unknownResponse.json()).toMatchObject({
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
    });
  });

  it("returns current fail-closed responses without calling owner ports", async () => {
    const selected = fixture("w10-masked-access-changed");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const response = await post(
      application,
      TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
    expect(runtime.owner.missingRecords).not.toHaveBeenCalled();
  });

  it("rejects caller authority, pin drift, bad dates and week claims at parse", async () => {
    const draft = fixture("w10-weekly-draft-committed-created");
    const application = await start(fixtureComposition([draft]).composition);
    const foreign = { ...draft.request, participant_id: "participant-raw" };
    expect(
      (
        await post(
          application,
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
          foreign,
        )
      ).statusCode,
    ).toBe(400);
    const drifted = structuredClone(draft.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (
        await post(
          application,
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
          drifted,
        )
      ).statusCode,
    ).toBe(400);
    const badDate = { ...draft.request, local_date: "2026-08-32" };
    expect(
      (
        await post(
          application,
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
          badDate,
        )
      ).statusCode,
    ).toBe(400);
    // Week identity is owner-computed: caller week boundaries never parse.
    const weekClaim = { ...draft.request, week_start: "2026-08-10" };
    expect(
      (
        await post(
          application,
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
          weekClaim,
        )
      ).statusCode,
    ).toBe(400);
  });

  it("kills command identity drift and unpublished draft shapes", async () => {
    const draft = fixture("w10-weekly-draft-committed-created");
    const commandDrift = structuredClone(draft.response) as Record<string, unknown>;
    commandDrift.command_request_id = "command-w10-draft-9999";
    expect(
      (
        await post(
          await start(fixtureComposition([draft], commandDrift).composition),
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
          draft.request,
        )
      ).statusCode,
    ).toBe(500);

    const openDisposition = structuredClone(draft.response) as Record<string, unknown>;
    openDisposition.disposition = "duplicated";
    expect(
      (
        await post(
          await start(fixtureComposition([draft], openDisposition).composition),
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
          draft.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("kills read binding drift on date echo, week window and missing counts", async () => {
    const missing = fixture("w10-missing-records-ready");
    const dateDrift = structuredClone(missing.response) as Record<string, unknown>;
    dateDrift.local_date = "2026-08-13";
    expect(
      (
        await post(
          await start(fixtureComposition([missing], dateDrift).composition),
          TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
          missing.request,
        )
      ).statusCode,
    ).toBe(500);

    const countDrift = structuredClone(missing.response) as Record<string, unknown>;
    countDrift.missing_count = 0;
    expect(
      (
        await post(
          await start(fixtureComposition([missing], countDrift).composition),
          TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
          missing.request,
        )
      ).statusCode,
    ).toBe(500);

    const weekly = fixture("w10-weekly-source-ready");
    const windowDrift = structuredClone(weekly.response) as Record<string, unknown>;
    windowDrift.week_start = "2026-08-11";
    expect(
      (
        await post(
          await start(fixtureComposition([weekly], windowDrift).composition),
          TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
          weekly.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w10-missing-records-ready");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({
      error: "teacher_assistant_query_owner_disabled",
    });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(composition?: TeacherAssistantQueryOwnerComposition) {
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
        teacherAssistantQueryOwner: {
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
    throw new Error(`Missing teacher assistant-query fixture ${fixtureId}`);
  }
  return found;
}

// The exchange response carries no owner_resolution; the resolver fabricates
// the care-group resolution from the request. Reads reuse the fixture
// resolution.
function fixtureComposition(
  selected: readonly Fixture[],
  overrideResponse?: unknown,
) {
  const byRequest = new Map(
    selected.map((item) => [String(item.request.host_request_id), item] as const),
  );
  const authorityResolver: TeacherAssistantQueryAuthorityResolverV1 = {
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
          resolution_ref: "resolution:w10:e2e",
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
  const owner: TeacherAssistantQueryOwnerV1 = {
    missingRecords: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    weeklySource: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    weeklyDraft: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new TeacherAssistantQueryOwnerComposition(
      authorityResolver,
      owner,
    ),
  };
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/teacher-assistant-query-owner/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isReady(value: unknown): value is Readonly<{
  status: "ready";
  owner_resolution: TeacherAssistantQueryOwnerResolutionV1;
}> {
  return isRecord(value)
    && value.status === "ready"
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
