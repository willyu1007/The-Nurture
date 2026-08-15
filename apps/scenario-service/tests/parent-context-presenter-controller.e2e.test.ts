import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import inject from "light-my-request";
import {
  encodeMyChatParentContextSelection,
  MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER,
} from "@my-chat/scenario-integrations/parent-context-selection";
import {
  nurtureCanonicalJson,
  PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH,
  PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH,
  PARENT_CONTEXT_PRESENTER_DAY_PATH,
  PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH,
  PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
} from "@the-nurture/scenario";
import { AppModule } from "../src/app.module.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { createBindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import { createFamilyGrowthRenditionRuntime } from "../src/family-growth-runtime.js";
import { createDisabledFamilySharingPrivateRuntime } from "../src/family-sharing-private-runtime.js";
import { HarnessRuntime } from "../src/harness-runtime.js";
import {
  ParentContextPresenterComposition,
  type ParentContextPresenterAsyncBoundaryV1,
  type ParentContextPresenterAuthorityResolverV1,
  type ParentContextPresenterAuthorityResultV1,
  type ParentContextPresenterOwnerV1,
} from "../src/parent-context-presenter-composition.js";
import { SafeExceptionFilter } from "../src/safe-exception.filter.js";
import { ScenarioStructuredLogger } from "../src/structured-logger.js";

const TOKEN = "parent-context-presenter-token-32";
const closes: Array<() => Promise<void>> = [];
const fixtureDocument = parseFixtureDocument();

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

async function start(composition?: ParentContextPresenterComposition) {
  const auth = createBindingOwnerServiceAuth(TOKEN);
  const logger = new ScenarioStructuredLogger(() => undefined);
  const familyGrowthRendition = createFamilyGrowthRenditionRuntime();
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
        familyGrowthRendition,
        teacherReleaseOwner: { serviceAuth: auth },
        parentContextPresenter: {
          ...(composition ? { composition } : {}),
          serviceAuth: auth,
        },
        familySharingPrivate: {
          runtime: createDisabledFamilySharingPrivateRuntime(),
          serviceAuth: auth,
        },
      }),
    ],
  })
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useGlobalFilters(moduleRef.get(SafeExceptionFilter));
  await app.init();
  closes.push(() => app.close());
  return app.getHttpAdapter().getInstance() as RequestListener;
}

async function post(
  application: RequestListener,
  requestPath: string,
  body: unknown,
  token = TOKEN,
  selectionHeaderOverride?: string | null,
): Promise<TestHttpResponse> {
  const selectionHeader = selectionHeaderOverride === undefined
    ? parentContextSelectionHeader(body)
    : selectionHeaderOverride;
  const response = await inject(application, {
    method: "POST",
    url: requestPath,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(selectionHeader === null
        ? {}
        : { [MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER]: selectionHeader }),
    },
    payload: JSON.stringify(body),
  });
  const headers = new Headers();
  for (const [name, value] of Object.entries(response.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, String(value));
    }
  }
  return {
    status: response.statusCode,
    headers,
    json: async () => response.json<unknown>(),
  };
}

function parentContextSelectionHeader(body: unknown): string {
  const request = requireRecord(body);
  return encodeMyChatParentContextSelection({
    workspaceId: String(request.workspace_id),
    myChatUserId: String(request.my_chat_user_id),
    hostRequestId: String(request.host_request_id),
    contextRef: String(request.context_ref),
    contextVersion: "pcv1:test-context-version",
    childBinding: {
      ownerRef: "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
      ownerVersion: 4,
    },
    familyBinding: {
      ownerRef: "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
      ownerVersion: 5,
    },
  });
}

function fixture(fixtureId: string): Fixture {
  const found = fixtureDocument.find((candidate) => candidate.fixture_id === fixtureId);
  if (!found) throw new Error(`Missing parent-context fixture ${fixtureId}`);
  return found;
}

function resolvedAuthority(response: unknown): ParentContextPresenterAuthorityResultV1 {
  const record = isRecord(response) ? response : {};
  const resolution = isRecord(record.owner_resolution)
    ? record.owner_resolution
    : {};
  return {
    status: "resolved",
    authority: {
      participant_id: "internal-participant-current",
      guardian_role_assignment_id: "internal-guardian-role-current",
      association_ref: "internal-association-current",
      enrollment_ref: "internal-enrollment-current",
      care_group_ref: "internal-care-group-current",
      grant_ref: "internal-grant-current",
      resolution_ref:
        typeof resolution.resolution_ref === "string"
          ? resolution.resolution_ref
          : "resolution:parent-context:0005",
      scope_ref:
        typeof resolution.scope_ref === "string"
          ? resolution.scope_ref
          : "scope:parent-context:family-a-child-a",
      scope_version:
        typeof resolution.scope_version === "number" ? resolution.scope_version : 7,
      context_ref:
        typeof resolution.context_ref === "string"
          ? resolution.context_ref
          : "context:parent-a-child-a:v7",
    },
  };
}

function stableAsyncBoundary(
  activeContextRef = "context:parent-a-child-a:v7",
  generation = 7,
): ParentContextPresenterAsyncBoundaryV1 {
  return {
    capture: vi.fn(async () => ({ response_generation: generation })),
    current: vi.fn(async () => ({
      active_generation: generation,
      active_context_ref: activeContextRef,
    })),
  };
}

function fixtureComposition(fixtureIds: readonly string[]) {
  const byRequest = new Map(
    fixtureIds.map((fixtureId) => {
      const selected = fixture(fixtureId);
      const hostRequestId = selected.request.host_request_id;
      if (typeof hostRequestId !== "string") throw new Error("Fixture lacks host_request_id");
      return [hostRequestId, selected.response] as const;
    }),
  );
  const authorityResolver: ParentContextPresenterAuthorityResolverV1 = {
    resolve: vi.fn(async (input) => {
      const response = byRequest.get(input.host_request_id);
      if (!response) return { status: "temporarily_unavailable" } as const;
      return resolvedAuthority(response);
    }),
  };
  const owner: ParentContextPresenterOwnerV1 = {
    present: vi.fn(async ({ request }) => {
      const response = byRequest.get(request.host_request_id);
      if (!response) throw new Error("No owner response for request");
      return response;
    }),
  };
  const asyncBoundary = stableAsyncBoundary();
  return {
    authorityResolver,
    owner,
    asyncBoundary,
    composition: new ParentContextPresenterComposition(
      authorityResolver,
      owner,
      asyncBoundary,
      () => new Date("2026-08-13T04:15:00.000Z"),
    ),
  };
}

function singleResponseComposition(
  selected: Fixture,
  response: unknown,
): ParentContextPresenterComposition {
  const authorityResolver: ParentContextPresenterAuthorityResolverV1 = {
    resolve: vi.fn(async () => resolvedAuthority(selected.response)),
  };
  const owner: ParentContextPresenterOwnerV1 = {
    present: vi.fn(async () => response),
  };
  return new ParentContextPresenterComposition(
    authorityResolver,
    owner,
    stableAsyncBoundary(),
    () => new Date("2026-08-13T04:15:00.000Z"),
  );
}

describe("parent-context presenter formal ingress", () => {
  it("mounts all five operations and resolves Q6 authority before every owner call", async () => {
    const ids = [
      "w2-day-ready",
      "w2-daily-care-partial-ready",
      "w2-activity-protected-media-ready",
      "w2-notice-list-ready",
      "w2-notice-prepare-ready",
      "w2-notice-confirm-committed",
      "w2-freshness-attendance-ready",
    ] as const;
    const runtime = fixtureComposition(ids);
    const application = await start(runtime.composition);
    const routeFixtures = [
      [PARENT_CONTEXT_PRESENTER_DAY_PATH, fixture(ids[0])],
      [PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH, fixture(ids[1])],
      [PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH, fixture(ids[2])],
      [PARENT_CONTEXT_PRESENTER_NOTICES_PATH, fixture(ids[3])],
      [PARENT_CONTEXT_PRESENTER_NOTICES_PATH, fixture(ids[4])],
      [PARENT_CONTEXT_PRESENTER_NOTICES_PATH, fixture(ids[5])],
      [PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH, fixture(ids[6])],
    ] as const;
    const results: unknown[] = [];
    for (const [path, selected] of routeFixtures) {
      const response = await post(application, path, selected.request);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("pragma")).toBe("no-cache");
      results.push(await response.json());
    }
    expect(results[0]).toMatchObject({
      activities: [
        {
          activity_ref: "activity:outdoor-play:01",
          media_state: "protected",
        },
      ],
    });
    expect(results[2]).toMatchObject({
      activity: { activity_ref: "activity:outdoor-play:01" },
    });
    const listed = requireRecord(results[3]);
    const prepared = requireRecord(results[4]);
    const listedNotice = requireRecord(requireArray(listed.notices)[0]);
    const listedAction = requireRecord(listedNotice.action);
    const preview = requireRecord(prepared.preview);
    expect(prepared).toMatchObject({
      notice_ref: listedNotice.notice_ref,
      action_ref: listedAction.action_ref,
      action_version: listedAction.action_version,
      preview: {
        effect: listedAction.action_semantics,
        title: listedAction.confirmation_title,
        body: listedAction.confirmation_body,
      },
      prepared_preview_digest: digest(preview),
      confirmation_ref: "confirm_notice_actor_context_prepare_0001",
      command_request_id: "command-notice-confirm-01",
    });
    expect(confirmationTuple(fixture(ids[5]).request)).toEqual(
      confirmationTuple(prepared),
    );
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(routeFixtures.length);
    expect(runtime.owner.present).toHaveBeenCalledTimes(routeFixtures.length);
    for (const call of vi.mocked(runtime.owner.present).mock.calls) {
      expect(call[0].authority.participant_id).toBe("internal-participant-current");
      expect(JSON.stringify(results)).not.toContain(call[0].authority.participant_id);
    }
  });

  it("is default-off and rejects missing auth, wrong auth, contract drift and caller authority", async () => {
    const disabledApplication = await start();
    const disabled = await post(
      disabledApplication,
      PARENT_CONTEXT_PRESENTER_DAY_PATH,
      fixture("w2-day-ready").request,
    );
    expect(disabled.status).toBe(503);
    expect(disabled.headers.get("cache-control")).toBe("private, no-store");
    expect(disabled.headers.get("pragma")).toBe("no-cache");
    await expect(disabled.json()).resolves.toEqual({
      error: "parent_context_presenter_disabled",
    });

    const runtime = fixtureComposition(["w2-day-ready"]);
    const application = await start(runtime.composition);
    for (const token of ["", "wrong-token"]) {
      const response = await post(
        application,
        PARENT_CONTEXT_PRESENTER_DAY_PATH,
        fixture("w2-day-ready").request,
        token,
      );
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("pragma")).toBe("no-cache");
    }
    const foreign = structuredClone(fixture("w2-day-ready").request);
    foreign.participant_id = "forged-participant";
    expect((await post(application, PARENT_CONTEXT_PRESENTER_DAY_PATH, foreign)).status).toBe(400);
    const drifted = structuredClone(fixture("w2-day-ready").request);
    const interfaceContract = requireRecord(drifted.interface_contract);
    interfaceContract.digest = `sha256:${"0".repeat(64)}`;
    expect((await post(application, PARENT_CONTEXT_PRESENTER_DAY_PATH, drifted)).status).toBe(400);
    expect((await post(
      application,
      PARENT_CONTEXT_PRESENTER_DAY_PATH,
      fixture("w2-day-ready").request,
      TOKEN,
      null,
    )).status).toBe(400);
    const selectionDrift = JSON.parse(Buffer.from(
      parentContextSelectionHeader(fixture("w2-day-ready").request),
      "base64url",
    ).toString("utf8")) as Record<string, unknown>;
    requireRecord(selectionDrift.interface_contract).digest = `sha256:${"0".repeat(64)}`;
    expect((await post(
      application,
      PARENT_CONTEXT_PRESENTER_DAY_PATH,
      fixture("w2-day-ready").request,
      TOKEN,
      Buffer.from(nurtureCanonicalJson(selectionDrift), "utf8").toString("base64url"),
    )).status).toBe(400);
    expect(runtime.authorityResolver.resolve).not.toHaveBeenCalled();
    expect(runtime.owner.present).not.toHaveBeenCalled();
  });

  it.each([
    ["scope loss", "scope_loss", "access_changed"],
    ["revocation", "revoked", "access_changed"],
    ["stale context", "stale_context_ref", "context_changed"],
    ["ambiguous enrollment", "ambiguous_enrollment", "ambiguous_context"],
    ["protected display denial", "protected_display_denial", "protected_display_denied"],
    ["non-retryable refresh", "non_retryable_refresh", "refresh_not_retryable"],
  ] as const)("executes %s as a masking owner-state result", async (_label, state, reason) => {
    const authorityResolver: ParentContextPresenterAuthorityResolverV1 = {
      resolve: vi.fn(async () => ({ status: state })),
    };
    const owner: ParentContextPresenterOwnerV1 = {
      present: vi.fn(async () => fixture("w2-day-ready").response),
    };
    const application = await start(
      new ParentContextPresenterComposition(
        authorityResolver,
        owner,
        stableAsyncBoundary(),
        () => new Date("2026-08-13T04:15:00.000Z"),
      ),
    );
    const response = await post(
      application,
      PARENT_CONTEXT_PRESENTER_DAY_PATH,
      fixture("w2-day-ready").request,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "masked",
      context_ref: "context:parent-a-child-a:v7",
      mask_signal: {
        reason_code: reason,
        purge_partition: true,
        content_masked: true,
        actions_disabled: true,
        media_access_invalidated: true,
      },
    });
    expect(authorityResolver.resolve).toHaveBeenCalledOnce();
    expect(owner.present).not.toHaveBeenCalled();
  });

  it("executes prepared identity/digest equality and replay rejection", async () => {
    const listed = fixture("w2-notice-list-ready");
    const prepared = fixture("w2-notice-prepare-ready");
    const committed = fixture("w2-notice-confirm-committed");
    const replayed = fixture("w2-notice-confirmation-replayed");
    const invalidConfirmation = {
      status: "not_committed",
      reason_code: "invalid_confirmation",
      recovery: "none",
    } as const;
    let confirmationConsumed = false;
    const authorityResolver: ParentContextPresenterAuthorityResolverV1 = {
      resolve: vi.fn(async (input) => {
        const response = input.host_request_id.includes("list")
          ? listed.response
          : input.host_request_id.includes("prepare")
            ? prepared.response
            : committed.response;
        return resolvedAuthority(response);
      }),
    };
    const owner: ParentContextPresenterOwnerV1 = {
      present: vi.fn(async ({ request }) => {
        if (!("kind" in request)) throw new Error("Expected notice request");
        if (request.kind === "list") return listed.response;
        if (request.kind === "prepare_confirmation") return prepared.response;
        const expected = requireRecord(prepared.response);
        const identityMatches = JSON.stringify(confirmationTuple(request))
          === JSON.stringify(confirmationTuple(expected));
        if (!identityMatches) return invalidConfirmation;
        if (confirmationConsumed) return replayed.response;
        confirmationConsumed = true;
        return committed.response;
      }),
    };
    const application = await start(
      new ParentContextPresenterComposition(
        authorityResolver,
        owner,
        stableAsyncBoundary(),
      ),
    );
    const listedResponse = await post(
      application,
      PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
      listed.request,
    );
    expect(listedResponse.status).toBe(200);
    expect((await post(application, PARENT_CONTEXT_PRESENTER_NOTICES_PATH, prepared.request)).status).toBe(200);
    const first = await post(application, PARENT_CONTEXT_PRESENTER_NOTICES_PATH, committed.request);
    await expect(first.json()).resolves.toMatchObject({ status: "committed" });
    const second = await post(application, PARENT_CONTEXT_PRESENTER_NOTICES_PATH, committed.request);
    await expect(second.json()).resolves.toEqual(replayed.response);
    expect(confirmationTuple(committed.request)).toEqual(
      confirmationTuple(requireRecord(prepared.response)),
    );
    for (const [field, value] of [
      ["action_ref", "notice-action:confirm-read:foreign"],
      ["action_version", 2],
      ["prepared_preview_digest", `sha256:${"0".repeat(64)}`],
      ["confirmation_ref", "confirm_notice_actor_context_foreign_0001"],
      ["command_request_id", "command-notice-confirm-foreign"],
    ] as const) {
      const mismatched = structuredClone(committed.request);
      mismatched[field] = value;
      const rejected = await post(
        application,
        PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
        mismatched,
      );
      await expect(rejected.json()).resolves.toEqual(invalidConfirmation);
    }
  });

  it("fails closed when an owner response carries an unpublished field", async () => {
    const selected = fixture("w2-day-ready");
    const responseWithPrivateField = {
      ...requireRecord(structuredClone(selected.response)),
      private_care_note: "must-never-cross-the-owner-boundary",
    };
    const application = await start(
      singleResponseComposition(selected, responseWithPrivateField),
    );
    const response = await post(
      application,
      PARENT_CONTEXT_PRESENTER_DAY_PATH,
      selected.request,
    );
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    const body = await response.json();
    expect(body).toEqual({ error: "internal_error" });
    expect(JSON.stringify(body)).not.toContain("private_care_note");
    expect(JSON.stringify(body)).not.toContain("must-never-cross");
  });

  it("fails closed for a list + not_committed notice sub-exchange", async () => {
    const listed = fixture("w2-notice-list-ready");
    const confirmOnly = fixture("w2-notice-confirmation-replayed");
    const application = await start(
      singleResponseComposition(listed, confirmOnly.response),
    );
    const response = await post(
      application,
      PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
      listed.request,
    );
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    await expect(response.json()).resolves.toEqual({ error: "internal_error" });
  });

  it("executes the ASYNC-12 late-result gate after a context generation advances", async () => {
    const selected = fixture("w2-notice-late-completion");
    const selectedContextRef = selected.request.context_ref;
    if (typeof selectedContextRef !== "string") {
      throw new Error("Late-completion fixture lacks context_ref");
    }
    const authorityResolver: ParentContextPresenterAuthorityResolverV1 = {
      resolve: vi.fn(async () => resolvedAuthority(selected.response)),
    };
    let releaseOwner: ((response: unknown) => void) | undefined;
    let markOwnerStarted: (() => void) | undefined;
    const ownerStarted = new Promise<void>((resolve) => {
      markOwnerStarted = resolve;
    });
    const owner: ParentContextPresenterOwnerV1 = {
      present: vi.fn(
        () =>
          new Promise<unknown>((resolve) => {
            releaseOwner = resolve;
            markOwnerStarted?.();
          }),
      ),
    };
    let activeGeneration = 7;
    let activeContextRef = selectedContextRef;
    const asyncBoundary: ParentContextPresenterAsyncBoundaryV1 = {
      capture: vi.fn(async () => ({ response_generation: 7 })),
      current: vi.fn(async () => ({
        active_generation: activeGeneration,
        active_context_ref: activeContextRef,
      })),
    };
    const application = await start(
      new ParentContextPresenterComposition(
        authorityResolver,
        owner,
        asyncBoundary,
        () => new Date("2026-08-13T04:15:00.000Z"),
      ),
    );
    const pending = post(
      application,
      PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
      selected.request,
    ).then((response) => response.json());
    await ownerStarted;
    activeGeneration = 8;
    activeContextRef = "context:parent-b-child-b:v2";
    if (!releaseOwner) throw new Error("Owner request did not start");
    releaseOwner(selected.response);
    await expect(pending).resolves.toEqual({
      status: "unavailable",
      context_ref: selectedContextRef,
      failed_at: "2026-08-13T04:15:00.000Z",
      reason_code: "content_unavailable",
      retryable: false,
    });
    expect(asyncBoundary.capture).toHaveBeenCalledOnce();
    expect(asyncBoundary.current).toHaveBeenCalledOnce();
  });
});

type Fixture = {
  fixture_id: string;
  request: Record<string, unknown>;
  response: unknown;
};

type TestHttpResponse = Readonly<{
  status: number;
  headers: Headers;
  json(): Promise<unknown>;
}>;

function parseFixtureDocument(): Fixture[] {
  const raw = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/parent-context-presenter/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as unknown;
  const root = requireRecord(raw);
  return requireArray(root.fixtures).map((value) => {
    const record = requireRecord(value);
    if (typeof record.fixture_id !== "string") throw new Error("Fixture id is invalid");
    return {
      fixture_id: record.fixture_id,
      request: requireRecord(record.request),
      response: record.response,
    };
  });
}

function digest(value: Record<string, unknown>): string {
  return `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(value), "utf8")
    .digest("hex")}`;
}

function confirmationTuple(value: Record<string, unknown>) {
  return {
    action_ref: value.action_ref,
    action_version: value.action_version,
    prepared_preview_digest: value.prepared_preview_digest,
    confirmation_ref: value.confirmation_ref,
    command_request_id: value.command_request_id,
  };
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected an object");
  return value;
}

function requireArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Expected an array");
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
