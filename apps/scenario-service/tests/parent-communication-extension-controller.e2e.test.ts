import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
  PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
  PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
  type ParentCommunicationExtensionOperation,
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
  ParentCommunicationExtensionComposition,
  type ParentCommunicationExtensionAuthorityResolverV1,
  type ParentCommunicationExtensionOwnerV1,
  type ParentCommunicationExtensionResolutionV1,
} from "../src/parent-communication-extension-composition.js";

const TOKEN = "parent-communication-extension-service-token";
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: ParentCommunicationExtensionOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("parent-communication extension formal ingress", () => {
  it("mounts all three operations with private headers and no receipt leakage", async () => {
    const selected = [
      fixture("w11-redaction-preview-ready"),
      fixture("w11-redact-committed-applied"),
      fixture("w11-delivery-receipt-ready-read"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
      PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
      PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
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
      const payload = JSON.stringify(response.json());
      expect(payload).not.toContain("receipt_ref");
      expect(payload).not.toContain("participant_id");
    }
    expect(runtime.authorityResolver.resolve).toHaveBeenCalledTimes(3);
    expect(runtime.owner.redact).toHaveBeenCalledTimes(1);
  });

  it("echoes command identity across replayed, already_satisfied and unknown outcomes", async () => {
    const replayed = fixture("w11-redact-replayed");
    const satisfied = fixture("w11-redact-already-satisfied");
    const unknown = fixture("w11-redact-outcome-unknown");
    const runtime = fixtureComposition([replayed, satisfied, unknown]);
    const application = await start(runtime.composition);
    const replayResponse = await post(
      application,
      PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
      replayed.request,
    );
    expect(replayResponse.json()).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      command_request_id: replayed.request.command_request_id,
    });
    const satisfiedResponse = await post(
      application,
      PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
      satisfied.request,
    );
    expect(satisfiedResponse.json()).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
    });
    expect(satisfiedResponse.json()).not.toHaveProperty("redacted_at");
    const unknownResponse = await post(
      application,
      PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
      unknown.request,
    );
    expect(unknownResponse.json()).toMatchObject({
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
    });
  });

  it("returns current fail-closed responses without calling owner ports", async () => {
    const selected = fixture("w11-masked-foreign-message");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const response = await post(
      application,
      PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
    expect(runtime.owner.redactionPreview).not.toHaveBeenCalled();
  });

  it("rejects caller authority, pin drift and malformed confirmations at parse", async () => {
    const redact = fixture("w11-redact-committed-applied");
    const application = await start(fixtureComposition([redact]).composition);
    const foreign = { ...redact.request, participant_id: "participant-raw" };
    expect(
      (
        await post(
          application,
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          foreign,
        )
      ).statusCode,
    ).toBe(400);
    const drifted = structuredClone(redact.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (
        await post(
          application,
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          drifted,
        )
      ).statusCode,
    ).toBe(400);
    const shortConfirmation = { ...redact.request, confirmation_ref: "short" };
    expect(
      (
        await post(
          application,
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          shortConfirmation,
        )
      ).statusCode,
    ).toBe(400);
    const malformedDigest = {
      ...redact.request,
      prepared_preview_digest: "sha256:not-a-hex-digest",
    };
    expect(
      (
        await post(
          application,
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          malformedDigest,
        )
      ).statusCode,
    ).toBe(400);
  });

  it("kills command drift and fabricated already-satisfied evidence", async () => {
    const redact = fixture("w11-redact-committed-applied");
    const commandDrift = structuredClone(redact.response) as Record<string, unknown>;
    commandDrift.command_request_id = "command-w11-redact-9999";
    expect(
      (
        await post(
          await start(fixtureComposition([redact], commandDrift).composition),
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          redact.request,
        )
      ).statusCode,
    ).toBe(500);

    const satisfied = fixture("w11-redact-already-satisfied");
    const fabricated = structuredClone(satisfied.response) as Record<string, unknown>;
    fabricated.redacted_at = "2026-08-14T09:02:00.000Z";
    fabricated.cascade = { scope: "source_question", affected_count: 1 };
    expect(
      (
        await post(
          await start(fixtureComposition([satisfied], fabricated).composition),
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          satisfied.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("kills read binding drift on message echo, presentation and recovery pairing", async () => {
    const preview = fixture("w11-redaction-preview-ready");
    const messageDrift = structuredClone(preview.response) as Record<string, unknown>;
    (messageDrift.preview as Record<string, unknown>).message_ref =
      "message:ref:foreign-0001";
    expect(
      (
        await post(
          await start(fixtureComposition([preview], messageDrift).composition),
          PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
          preview.request,
        )
      ).statusCode,
    ).toBe(500);

    const receipt = fixture("w11-delivery-receipt-ready-read");
    const echoDrift = structuredClone(receipt.response) as Record<string, unknown>;
    echoDrift.message_ref = "message:ref:foreign-0001";
    expect(
      (
        await post(
          await start(fixtureComposition([receipt], echoDrift).composition),
          PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
          receipt.request,
        )
      ).statusCode,
    ).toBe(500);

    const stale = fixture("w11-redact-not-committed-stale");
    const wrongRecovery = structuredClone(stale.response) as Record<string, unknown>;
    wrongRecovery.recovery = "none";
    expect(
      (
        await post(
          await start(fixtureComposition([stale], wrongRecovery).composition),
          PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
          stale.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w11-delivery-receipt-ready-read");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({
      error: "parent_communication_extension_disabled",
    });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(composition?: ParentCommunicationExtensionComposition) {
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
        parentCommunicationExtension: {
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
    throw new Error(`Missing parent-communication extension fixture ${fixtureId}`);
  }
  return found;
}

// Exchange responses carry no owner_resolution; the resolver fabricates the
// parent resolution from the request. Reads reuse the fixture resolution.
function fixtureComposition(
  selected: readonly Fixture[],
  overrideResponse?: unknown,
) {
  const byRequest = new Map(
    selected.map((item) => [String(item.request.host_request_id), item] as const),
  );
  const authorityResolver: ParentCommunicationExtensionAuthorityResolverV1 = {
    resolve: vi.fn(async (input) => {
      const item = byRequest.get(input.host_request_id);
      if (!item) throw new Error("Missing fixture request");
      const status = isRecord(item.response) ? item.response.status : undefined;
      if (status === "masked" || status === "unavailable") {
        return { status: "closed", response: item.response } as const;
      }
      if (isEnvelope(item.response)) {
        return {
          status: "resolved",
          owner_resolution: item.response.owner_resolution,
        } as const;
      }
      return {
        status: "resolved",
        owner_resolution: {
          presentation_role: "parent",
          scope_kind: "parent_communication",
          context_ref: String(item.request.context_ref),
          resolution_ref: "resolution:parent:e2e",
          scope_version: 5,
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
  const owner: ParentCommunicationExtensionOwnerV1 = {
    redactionPreview: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    redact: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    deliveryReceipt: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new ParentCommunicationExtensionComposition(
      authorityResolver,
      owner,
    ),
  };
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/parent-communication-owner/v1-1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isEnvelope(value: unknown): value is Readonly<{
  status: "ready" | "ready_to_confirm";
  owner_resolution: ParentCommunicationExtensionResolutionV1;
}> {
  return isRecord(value)
    && (value.status === "ready" || value.status === "ready_to_confirm")
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
