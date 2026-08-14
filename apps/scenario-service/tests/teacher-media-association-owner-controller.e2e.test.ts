import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
  type TeacherMediaAssociationOwnerOperation,
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
  TeacherMediaAssociationOwnerComposition,
  type TeacherMediaAssociationAuthorityResolverV1,
  type TeacherMediaAssociationOwnerResolutionV1,
  type TeacherMediaAssociationOwnerV1,
} from "../src/teacher-media-association-owner-composition.js";

const TOKEN = "teacher-media-association-owner-service-token";
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: TeacherMediaAssociationOwnerOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("teacher media-association formal ingress", () => {
  it("mounts all four operations with current authority and private headers", async () => {
    const selected = [
      fixture("w9-unassociated-ready"),
      fixture("w9-association-ready"),
      fixture("w9-associate-committed-confirmed"),
      fixture("w9-discard-committed"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
      TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
      TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
      TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
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
      expect(JSON.stringify(response.json())).not.toContain("media_asset_id");
    }
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(4);
    expect(runtime.owner.associate).toHaveBeenCalledTimes(1);
    expect(runtime.owner.discard).toHaveBeenCalledTimes(1);
  });

  it("echoes command identity and replay shape on the exchanges", async () => {
    const replayed = fixture("w9-associate-replayed");
    const unknown = fixture("w9-associate-outcome-unknown");
    const runtime = fixtureComposition([replayed, unknown]);
    const application = await start(runtime.composition);
    const replayResponse = await post(
      application,
      TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
      replayed.request,
    );
    expect(replayResponse.json()).toMatchObject({
      status: "committed",
      executed: "replayed",
      command_request_id: replayed.request.command_request_id,
    });
    const unknownResponse = await post(
      application,
      TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
      unknown.request,
    );
    expect(unknownResponse.json()).toMatchObject({
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
    });
  });

  it("returns current fail-closed responses without calling owner ports", async () => {
    const selected = fixture("w9-masked-access-changed");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const response = await post(
      application,
      TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
    expect(runtime.owner.unassociated).not.toHaveBeenCalled();
  });

  it("rejects caller authority, pin drift and malformed payloads at parse", async () => {
    const associate = fixture("w9-associate-committed-confirmed");
    const application = await start(fixtureComposition([associate]).composition);
    const foreign = { ...associate.request, child_id: "child-raw" };
    expect(
      (
        await post(
          application,
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
          foreign,
        )
      ).statusCode,
    ).toBe(400);
    const drifted = structuredClone(associate.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (
        await post(
          application,
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
          drifted,
        )
      ).statusCode,
    ).toBe(400);
    const badDecision = { ...associate.request, decision: "supersede" };
    expect(
      (
        await post(
          application,
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
          badDecision,
        )
      ).statusCode,
    ).toBe(400);
    const zeroRevision = { ...associate.request, expected_media_revision: 0 };
    expect(
      (
        await post(
          application,
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
          zeroRevision,
        )
      ).statusCode,
    ).toBe(400);
  });

  it("kills command identity drift and target/decision pairing violations", async () => {
    const associate = fixture("w9-associate-committed-confirmed");
    const commandDrift = structuredClone(associate.response) as Record<string, unknown>;
    commandDrift.command_request_id = "command-w9-associate-9999";
    expect(
      (
        await post(
          await start(fixtureComposition([associate], commandDrift).composition),
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
          associate.request,
        )
      ).statusCode,
    ).toBe(500);

    const statePairing = structuredClone(associate.response) as Record<string, unknown>;
    statePairing.state = "rejected";
    expect(
      (
        await post(
          await start(fixtureComposition([associate], statePairing).composition),
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
          associate.request,
        )
      ).statusCode,
    ).toBe(500);

    const discard = fixture("w9-discard-committed");
    const foreignAsset = structuredClone(discard.response) as Record<string, unknown>;
    foreignAsset.media_ref = "media:ref:foreign-0001";
    expect(
      (
        await post(
          await start(fixtureComposition([discard], foreignAsset).composition),
          TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
          discard.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("kills read binding drift on scope, query key and count consistency", async () => {
    const unassociated = fixture("w9-unassociated-ready");
    const countDrift = structuredClone(unassociated.response) as Record<string, unknown>;
    countDrift.unassociated_count = 1;
    expect(
      (
        await post(
          await start(
            fixtureComposition([unassociated], countDrift).composition,
          ),
          TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
          unassociated.request,
        )
      ).statusCode,
    ).toBe(500);

    const association = fixture("w9-association-ready");
    const mediaDrift = structuredClone(association.response) as Record<string, unknown>;
    mediaDrift.media_ref = "media:ref:foreign-0001";
    expect(
      (
        await post(
          await start(fixtureComposition([association], mediaDrift).composition),
          TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
          association.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w9-unassociated-ready");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({
      error: "teacher_media_association_owner_disabled",
    });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(composition?: TeacherMediaAssociationOwnerComposition) {
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
        teacherMediaAssociationOwner: {
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
    throw new Error(`Missing teacher media-association fixture ${fixtureId}`);
  }
  return found;
}

// Exchange responses carry no owner_resolution; the resolver fabricates the
// care-group resolution from the request. Reads reuse the fixture resolution.
function fixtureComposition(
  selected: readonly Fixture[],
  overrideResponse?: unknown,
) {
  const byRequest = new Map(
    selected.map((item) => [String(item.request.host_request_id), item] as const),
  );
  const authorityResolver: TeacherMediaAssociationAuthorityResolverV1 = {
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
          resolution_ref: "resolution:w9:e2e",
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
  const owner: TeacherMediaAssociationOwnerV1 = {
    unassociated: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    association: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    associate: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    discard: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new TeacherMediaAssociationOwnerComposition(
      authorityResolver,
      owner,
    ),
  };
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/teacher-media-association-owner/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isReady(value: unknown): value is Readonly<{
  status: "ready";
  owner_resolution: TeacherMediaAssociationOwnerResolutionV1;
}> {
  return isRecord(value)
    && value.status === "ready"
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
