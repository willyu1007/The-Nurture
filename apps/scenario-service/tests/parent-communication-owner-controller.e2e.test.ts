import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import inject from "light-my-request";
import {
  PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
  PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH,
  PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
} from "@the-nurture/scenario";
import { AppModule } from "../src/app.module.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { createBindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import { createFamilyGrowthRenditionRuntime } from "../src/family-growth-runtime.js";
import { createDisabledFamilySharingPrivateRuntime } from "../src/family-sharing-private-runtime.js";
import { HarnessRuntime } from "../src/harness-runtime.js";
import {
  ParentCommunicationOwnerComposition,
  type ParentCommunicationAsyncBoundaryV1,
  type ParentCommunicationAuthorityResolverV1,
  type ParentCommunicationAuthorityResultV1,
  type ParentCommunicationOwnerV1,
} from "../src/parent-communication-owner-composition.js";
import { SafeExceptionFilter } from "../src/safe-exception.filter.js";
import { ScenarioStructuredLogger } from "../src/structured-logger.js";
import { parentContextSelectionHeaderFor } from "./helpers/parent-context-selection-header.js";

const TOKEN = "parent-communication-owner-token-32";
const closes: Array<() => Promise<void>> = [];
const fixtureDocument = parseFixtureDocument();

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

async function start(composition?: ParentCommunicationOwnerComposition) {
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
        parentContextPresenter: { serviceAuth: auth },
        parentCommunicationOwner: {
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

async function post(
  application: RequestListener,
  requestPath: string,
  body: unknown,
  token = TOKEN,
  selectionHeader?: string | null,
) {
  return inject(application, {
    method: "POST",
    url: requestPath,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(selectionHeader === null
        ? {}
        : {
            "x-morethan-parent-context-selection": selectionHeader
              ?? parentContextSelectionHeaderFor(isRecord(body) ? body : {}),
          }),
    },
    payload: JSON.stringify(body),
  });
}

function fixture(fixtureId: string): Fixture {
  const selected = fixtureDocument.find((item) => item.fixture_id === fixtureId);
  if (!selected) throw new Error(`Missing parent-communication fixture ${fixtureId}`);
  return selected;
}

function resolvedAuthority(response: unknown): ParentCommunicationAuthorityResultV1 {
  const record = isRecord(response) ? response : {};
  const resolution = isRecord(record.owner_resolution)
    ? record.owner_resolution
    : {};
  return {
    status: "resolved",
    authority: {
      participant_id: "internal-participant-current",
      participant_version: 3,
      guardian_role_assignment_id: "internal-guardian-role-current",
      guardian_role_version: 4,
      association_ref: "internal-association-current",
      association_version: 2,
      child_anchor_ref: "internal-child-anchor-current",
      child_anchor_version: 2,
      family_anchor_ref: "internal-family-anchor-current",
      family_anchor_version: 3,
      parent_context_selection_version: 1,
      enrollment_ref: "internal-enrollment-current",
      enrollment_version: 5,
      care_group_ref: "internal-care-group-current",
      care_group_version: 6,
      institution_ref: "internal-institution-current",
      institution_version: 7,
      family_ref: "internal-family-current",
      family_version: 8,
      child_care_process_ref: "internal-process-current",
      child_care_process_version: 9,
      thread_ref: "internal-thread-current",
      thread_version: 10,
      membership_ref: "internal-membership-current",
      membership_version: 11,
      grant_ref: "internal-grant-current",
      grant_version: 12,
      context_version: "context-version-current",
      resolution_ref:
        typeof resolution.resolution_ref === "string"
          ? resolution.resolution_ref
          : "resolution-a",
      scope_ref: "internal-parent-communication-scope-current",
      scope_version:
        typeof resolution.scope_version === "number" ? resolution.scope_version : 7,
      context_ref:
        typeof resolution.context_ref === "string"
          ? resolution.context_ref
          : "context-a",
    },
  };
}

function stableAsyncBoundary(
  activeContextRef = "context-a",
  generation = 7,
): ParentCommunicationAsyncBoundaryV1 {
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
      return [String(selected.request.host_request_id), selected.response] as const;
    }),
  );
  const authorityResolver: ParentCommunicationAuthorityResolverV1 = {
    resolve: vi.fn(async (input) => {
      const response = byRequest.get(input.host_request_id);
      return response
        ? resolvedAuthority(response)
        : ({ status: "temporarily_unavailable" } as const);
    }),
  };
  const owner: ParentCommunicationOwnerV1 = {
    execute: vi.fn(async ({ request }) => {
      const response = byRequest.get(request.host_request_id);
      if (!response) throw new Error("No fixture response");
      return response;
    }),
  };
  const asyncBoundary = stableAsyncBoundary();
  return {
    authorityResolver,
    owner,
    asyncBoundary,
    composition: new ParentCommunicationOwnerComposition(
      authorityResolver,
      owner,
      asyncBoundary,
      () => new Date("2026-08-14T01:00:00.000Z"),
    ),
  };
}

describe("parent-communication owner formal ingress", () => {
  it("requires one identity-bound canonical selection carrier", async () => {
    const selected = fixture("summary-ready-minimized");
    const runtime = fixtureComposition([selected.fixture_id]);
    const application = await start(runtime.composition);
    const missing = await post(
      application,
      PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
      selected.request,
      TOKEN,
      null,
    );
    expect(missing.statusCode).toBe(400);
    expect(missing.json()).toEqual({ error: "invalid_request" });

    const foreignHeader = parentContextSelectionHeaderFor({
      ...selected.request,
      context_ref: "foreign-context",
    });
    const foreign = await post(
      application,
      PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
      selected.request,
      TOKEN,
      foreignHeader,
    );
    expect(foreign.statusCode).toBe(400);
    expect(runtime.authorityResolver.resolve).not.toHaveBeenCalled();
  });

  it("mounts the four private operations and resolves current authority every time", async () => {
    const ids = [
      "summary-ready-minimized",
      "detail-ready-bounded",
      "media-access-owner-stream",
      "send-text-ready-to-confirm",
      "send-text-committed",
    ] as const;
    const runtime = fixtureComposition(ids);
    const application = await start(runtime.composition);
    const requests = [
      [PARENT_COMMUNICATION_OWNER_SUMMARY_PATH, fixture(ids[0])],
      [PARENT_COMMUNICATION_OWNER_DETAIL_PATH, fixture(ids[1])],
      [PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH, fixture(ids[2])],
      [PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH, fixture(ids[3])],
      [PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH, fixture(ids[4])],
    ] as const;
    for (const [requestPath, selected] of requests) {
      const response = await post(application, requestPath, selected.request);
      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("private, no-store");
      expect(response.headers.pragma).toBe("no-cache");
      expect(response.json()).toEqual(
        requestPath === PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH
          ? {
              status: "unavailable",
              context_ref: "context-a",
              failed_at: "2026-08-14T01:00:00.000Z",
              reason_code: "content_unavailable",
              retryable: false,
            }
          : selected.response,
      );
    }
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(requests.length);
    expect(runtime.owner.execute).toHaveBeenCalledTimes(requests.length - 1);
    for (const call of vi.mocked(runtime.owner.execute).mock.calls) {
      expect(call[0].authority.participant_id).toBe("internal-participant-current");
    }
    for (const call of vi.mocked(runtime.authorityResolver.resolve).mock.calls) {
      expect(call[0].context_selection.context_ref).toBe("context-a");
    }
  });

  it("is default-off and rejects wrong auth, contract drift and caller authority", async () => {
    const disabledApplication = await start();
    const disabled = await post(
      disabledApplication,
      PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
      fixture("summary-ready-minimized").request,
    );
    expect(disabled.statusCode).toBe(503);
    expect(disabled.headers["cache-control"]).toBe("private, no-store");
    expect(disabled.headers.pragma).toBe("no-cache");
    // The controller's own documented code: it was previously missing from
    // the safe-code allowlist and degraded to the generic service_unavailable.
    expect(disabled.json()).toEqual({ error: "parent_communication_owner_disabled" });

    const runtime = fixtureComposition(["summary-ready-minimized"]);
    const application = await start(runtime.composition);
    const wrongAuth = await post(
      application,
      PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
      fixture("summary-ready-minimized").request,
      "wrong-token",
    );
    expect(wrongAuth.statusCode).toBe(401);
    const drift = structuredClone(fixture("summary-ready-minimized").request);
    (drift.interface_contract as Record<string, unknown>).digest = `sha256:${"0".repeat(64)}`;
    expect(
      (await post(application, PARENT_COMMUNICATION_OWNER_SUMMARY_PATH, drift)).statusCode,
    ).toBe(400);
    const authority = {
      ...fixture("summary-ready-minimized").request,
      participant_id: "fabricated-participant",
    };
    expect(
      (await post(application, PARENT_COMMUNICATION_OWNER_SUMMARY_PATH, authority)).statusCode,
    ).toBe(400);
    const classGroupSend = {
      ...fixture("send-text-ready-to-confirm").request,
      segment: "class_group",
    };
    expect(
      (await post(application, PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH, classGroupSend)).statusCode,
    ).toBe(400);
    expect(runtime.owner.execute).not.toHaveBeenCalled();
  });

  it.each([
    ["scope_loss", "access_changed"],
    ["revoked", "access_changed"],
    ["stale_context_ref", "context_changed"],
    ["ambiguous_enrollment", "ambiguous_context"],
    ["protected_display_denial", "protected_display_denied"],
  ] as const)("masks %s before owner detail executes", async (status, reasonCode) => {
    const selected = fixture("detail-ready-bounded");
    const authorityResolver: ParentCommunicationAuthorityResolverV1 = {
      resolve: vi.fn(async () => ({ status })),
    };
    const owner: ParentCommunicationOwnerV1 = {
      execute: vi.fn(async () => selected.response),
    };
    const composition = new ParentCommunicationOwnerComposition(
      authorityResolver,
      owner,
      stableAsyncBoundary(),
      () => new Date("2026-08-14T01:00:00.000Z"),
    );
    const response = await post(
      await start(composition),
      PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      context_ref: "context-a",
      mask_signal: { reason_code: reasonCode, purge_partition: true },
    });
    expect(owner.execute).not.toHaveBeenCalled();
  });

  it("turns a late confirm result into same-command outcome_unknown", async () => {
    const selected = fixture("send-text-committed");
    const authorityResolver: ParentCommunicationAuthorityResolverV1 = {
      resolve: vi.fn(async () => resolvedAuthority(fixture("send-text-ready-to-confirm").response)),
    };
    const owner: ParentCommunicationOwnerV1 = {
      execute: vi.fn(async () => selected.response),
    };
    const asyncBoundary: ParentCommunicationAsyncBoundaryV1 = {
      capture: vi.fn(async () => ({ response_generation: 7 })),
      current: vi.fn(async () => ({
        active_generation: 8,
        active_context_ref: "context-a",
      })),
    };
    const lateComposition = new ParentCommunicationOwnerComposition(
      authorityResolver,
      owner,
      asyncBoundary,
      () => new Date("2026-08-14T01:00:00.000Z"),
    );
    const response = await post(
      await start(lateComposition),
      PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "outcome_unknown",
      command_request_id: "command-a",
      reason_code: "send_outcome_unknown",
      recovery: "reconcile_same_command",
    });
  });

  it("turns an owner confirm exception into same-command outcome_unknown", async () => {
    const selected = fixture("send-text-committed");
    const composition = new ParentCommunicationOwnerComposition(
      {
        resolve: vi.fn(async () =>
          resolvedAuthority(fixture("send-text-ready-to-confirm").response),
        ),
      },
      { execute: vi.fn(async () => Promise.reject(new Error("commit uncertain"))) },
      stableAsyncBoundary(),
      () => new Date("2026-08-14T01:00:00.000Z"),
    );
    const response = await post(
      await start(composition),
      PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "outcome_unknown",
      command_request_id: "command-a",
      reason_code: "send_outcome_unknown",
      recovery: "reconcile_same_command",
    });
  });

  it("turns an invalid owner confirm receipt into same-command outcome_unknown", async () => {
    const selected = fixture("send-text-committed");
    const composition = new ParentCommunicationOwnerComposition(
      {
        resolve: vi.fn(async () =>
          resolvedAuthority(fixture("send-text-ready-to-confirm").response),
        ),
      },
      {
        execute: vi.fn(async () => ({
          ...(isRecord(selected.response) ? selected.response : {}),
          command_request_id: "foreign-command",
        })),
      },
      stableAsyncBoundary(),
      () => new Date("2026-08-14T01:00:00.000Z"),
    );
    const response = await post(
      await start(composition),
      PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "outcome_unknown",
      command_request_id: "command-a",
      reason_code: "send_outcome_unknown",
      recovery: "reconcile_same_command",
    });
  });

  it("rejects owner leakage and response schema drift as private 500", async () => {
    const selected = fixture("detail-ready-bounded");
    const authorityResolver: ParentCommunicationAuthorityResolverV1 = {
      resolve: vi.fn(async () => resolvedAuthority(selected.response)),
    };
    const safeResponse = isRecord(selected.response) ? selected.response : {};
    const owner: ParentCommunicationOwnerV1 = {
      execute: vi.fn(async () => ({
        ...safeResponse,
        family_id: "private-family-id",
      })),
    };
    const composition = new ParentCommunicationOwnerComposition(
      authorityResolver,
      owner,
      stableAsyncBoundary(),
    );
    const response = await post(
      await start(composition),
      PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(500);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers.pragma).toBe("no-cache");
    expect(JSON.stringify(response.json())).not.toContain("private-family-id");
  });
});

type Fixture = {
  fixture_id: string;
  operation: string;
  request: Record<string, unknown>;
  response: unknown;
};

function parseFixtureDocument(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/parent-communication-owner/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures?: Fixture[] };
  if (!Array.isArray(value.fixtures)) throw new Error("Invalid parent-communication fixtures");
  return value.fixtures;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
