import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  DIRECTOR_PRESENTER_DRILLDOWN_PATH,
  DIRECTOR_PRESENTER_MATERIALS_PATH,
  DIRECTOR_PRESENTER_OVERVIEW_PATH,
  type DirectorPresenterOperation,
} from "@the-nurture/scenario";
import inject from "light-my-request";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { createBindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import {
  DirectorPresenterComposition,
  type DirectorPresenterAuthorityResolverV1,
  type DirectorPresenterOwnerResolutionV1,
  type DirectorPresenterOwnerV1,
} from "../src/director-presenter-composition.js";
import { createFamilyGrowthRenditionRuntime } from "../src/family-growth-runtime.js";
import { createDisabledFamilySharingPrivateRuntime } from "../src/family-sharing-private-runtime.js";
import { HarnessRuntime } from "../src/harness-runtime.js";
import { SafeExceptionFilter } from "../src/safe-exception.filter.js";
import { ScenarioStructuredLogger } from "../src/structured-logger.js";

const TOKEN = "director-presenter-service-token-32";
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: DirectorPresenterOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("director presenter formal ingress", () => {
  it("mounts all read-only operations with current authority and private headers", async () => {
    const selected = [
      fixture("w4-overview-ready-partial"),
      fixture("w4-drilldown-ready"),
      fixture("w4-material-ready-protected"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      DIRECTOR_PRESENTER_OVERVIEW_PATH,
      DIRECTOR_PRESENTER_DRILLDOWN_PATH,
      DIRECTOR_PRESENTER_MATERIALS_PATH,
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
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(3);
    expect(runtime.owner.overview).toHaveBeenCalledTimes(1);
    expect(runtime.owner.drilldown).toHaveBeenCalledTimes(1);
    expect(runtime.owner.materials).toHaveBeenCalledTimes(1);
  });

  it("keeps Institution Mobile read-only and exposes no action reference", async () => {
    const selected = fixture("w4-overview-ready-partial");
    const application = await start(fixtureComposition([selected]).composition);
    const response = await post(
      application,
      DIRECTOR_PRESENTER_OVERVIEW_PATH,
      selected.request,
    );
    const body = response.json() as Record<string, unknown>;
    const sections = body.sections as Array<Record<string, unknown>>;
    expect(sections.find((section) => section.section_key === "operation_entry"))
      .toMatchObject({
        status: "unavailable",
        availability: "web_workbench_required",
      });
    expect(JSON.stringify(body)).not.toContain("action_ref");
    expect(JSON.stringify(body)).not.toContain("confirmation_ref");
  });

  it("returns current fail-closed responses without calling owner reads", async () => {
    const selected = [
      fixture("w4-overview-scope-loss"),
      fixture("w4-drilldown-purpose-denied"),
      fixture("w4-material-protected-denied"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      DIRECTOR_PRESENTER_OVERVIEW_PATH,
      DIRECTOR_PRESENTER_DRILLDOWN_PATH,
      DIRECTOR_PRESENTER_MATERIALS_PATH,
    ];
    for (let index = 0; index < routes.length; index += 1) {
      const response = await post(
        application,
        routes[index] ?? "",
        selected[index]?.request,
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: "masked" });
    }
    expect(runtime.owner.overview).not.toHaveBeenCalled();
    expect(runtime.owner.drilldown).not.toHaveBeenCalled();
    expect(runtime.owner.materials).not.toHaveBeenCalled();
  });

  it("rejects foreign authority, pin drift, hidden data and owner binding drift", async () => {
    const selected = fixture("w4-overview-ready-partial");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const foreign = { ...selected.request, role: "institution_director" };
    expect(
      (await post(application, DIRECTOR_PRESENTER_OVERVIEW_PATH, foreign)).statusCode,
    ).toBe(400);
    const drifted = structuredClone(selected.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (await post(application, DIRECTOR_PRESENTER_OVERVIEW_PATH, drifted)).statusCode,
    ).toBe(400);

    const response = structuredClone(selected.response) as Record<string, unknown>;
    (response.owner_resolution as Record<string, unknown>).context_ref =
      "context:institution:foreign:v1";
    const invalidApplication = await start(
      fixtureComposition([selected], response).composition,
    );
    expect(
      (
        await post(
          invalidApplication,
          DIRECTOR_PRESENTER_OVERVIEW_PATH,
          selected.request,
        )
      ).statusCode,
    ).toBe(500);

    const actionResponse = structuredClone(selected.response) as Record<
      string,
      unknown
    >;
    const sections = actionResponse.sections as Array<Record<string, unknown>>;
    sections[10] = { ...sections[10], action_ref: "action:forbidden" };
    const actionApplication = await start(
      fixtureComposition([selected], actionResponse).composition,
    );
    expect(
      (
        await post(
          actionApplication,
          DIRECTOR_PRESENTER_OVERVIEW_PATH,
          selected.request,
        )
      ).statusCode,
    ).toBe(500);

    const hiddenDataResponse = structuredClone(selected.response) as Record<
      string,
      unknown
    >;
    const hiddenDataSections = hiddenDataResponse.sections as Array<
      Record<string, unknown>
    >;
    hiddenDataSections[4] = {
      ...hiddenDataSections[4],
      metric: {
        primary_value: 1,
        unit: "count",
        definition: "Forbidden hidden value.",
        time_window_label: "Current",
      },
    };
    const hiddenDataApplication = await start(
      fixtureComposition([selected], hiddenDataResponse).composition,
    );
    expect(
      (
        await post(
          hiddenDataApplication,
          DIRECTOR_PRESENTER_OVERVIEW_PATH,
          selected.request,
        )
      ).statusCode,
    ).toBe(500);

    const selectedPage = fixture("w4-material-ready-page-2");
    const cursorDriftResponse = structuredClone(selectedPage.response) as Record<
      string,
      unknown
    >;
    cursorDriftResponse.request_cursor = "cursor:materials:aster:wrong-page";
    const cursorDriftApplication = await start(
      fixtureComposition([selectedPage], cursorDriftResponse).composition,
    );
    expect(
      (
        await post(
          cursorDriftApplication,
          DIRECTOR_PRESENTER_MATERIALS_PATH,
          selectedPage.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w4-overview-ready-partial");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      DIRECTOR_PRESENTER_OVERVIEW_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({ error: "director_presenter_disabled" });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      DIRECTOR_PRESENTER_OVERVIEW_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(composition?: DirectorPresenterComposition) {
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
        directorPresenter: {
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
  if (!found) throw new Error(`Missing director presenter fixture ${fixtureId}`);
  return found;
}

function fixtureComposition(
  selected: readonly Fixture[],
  overrideResponse?: unknown,
) {
  const byRequest = new Map(
    selected.map((item) => [String(item.request.host_request_id), item] as const),
  );
  const authorityResolver: DirectorPresenterAuthorityResolverV1 = {
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
  const owner: DirectorPresenterOwnerV1 = {
    overview: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    drilldown: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    materials: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new DirectorPresenterComposition(authorityResolver, owner),
  };
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/director-presenter/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isReady(value: unknown): value is Readonly<{
  status: "ready";
  owner_resolution: DirectorPresenterOwnerResolutionV1;
}> {
  return isRecord(value)
    && value.status === "ready"
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
