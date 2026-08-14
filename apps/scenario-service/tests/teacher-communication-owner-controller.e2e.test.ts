import { readFileSync } from "node:fs";
import type { RequestListener } from "node:http";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import {
  TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
  TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH,
  TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
  TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
  TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
  type TeacherCommunicationOwnerOperation,
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
  TeacherCommunicationOwnerComposition,
  type TeacherCommunicationAuthorityResolverV1,
  type TeacherCommunicationOwnerResolutionV1,
  type TeacherCommunicationOwnerV1,
} from "../src/teacher-communication-owner-composition.js";

const TOKEN = "teacher-communication-owner-service-token";
const closes: Array<() => Promise<void>> = [];
const fixtures = loadFixtures();

type Fixture = Readonly<{
  fixture_id: string;
  operation: TeacherCommunicationOwnerOperation;
  request: Record<string, unknown>;
  response: unknown;
}>;

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

describe("teacher communication-owner formal ingress", () => {
  it("mounts all six operations with current authority and private headers", async () => {
    const selected = [
      fixture("w8-targets-ready"),
      fixture("w8-membership-ready"),
      fixture("w8-timeline-ready-first-page"),
      fixture("w8-send-prepare-ready"),
      fixture("w8-withdraw-committed"),
      fixture("w8-mark-read-committed-advanced"),
    ];
    const runtime = fixtureComposition(selected);
    const application = await start(runtime.composition);
    const routes = [
      TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
      TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH,
      TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
      TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
      TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
      TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
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
    expect(runtime.owner.sendText).toHaveBeenCalledTimes(1);
    expect(runtime.owner.withdrawStaged).toHaveBeenCalledTimes(1);
    expect(runtime.owner.markRead).toHaveBeenCalledTimes(1);
  });

  it("echoes command identity and replay shape on the exchanges", async () => {
    const replayed = fixture("w8-send-confirm-replayed");
    const unknown = fixture("w8-send-outcome-unknown");
    const runtime = fixtureComposition([replayed, unknown]);
    const application = await start(runtime.composition);
    const replayResponse = await post(
      application,
      TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
      replayed.request,
    );
    expect(replayResponse.json()).toMatchObject({
      status: "committed",
      executed: "replayed",
      command_request_id: replayed.request.command_request_id,
    });
    const unknownResponse = await post(
      application,
      TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
      unknown.request,
    );
    expect(unknownResponse.json()).toMatchObject({
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
      command_request_id: unknown.request.command_request_id,
    });
  });

  it("returns current fail-closed responses without calling owner ports", async () => {
    const selected = fixture("w8-masked-access-changed");
    const runtime = fixtureComposition([selected]);
    const application = await start(runtime.composition);
    const response = await post(
      application,
      TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
      selected.request,
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
    expect(runtime.owner.targets).not.toHaveBeenCalled();
  });

  it("rejects caller authority, pin drift and malformed payloads at parse", async () => {
    const send = fixture("w8-send-prepare-ready");
    const application = await start(fixtureComposition([send]).composition);
    const foreign = { ...send.request, family_id: "family-raw" };
    expect(
      (await post(application, TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH, foreign))
        .statusCode,
    ).toBe(400);
    const drifted = structuredClone(send.request);
    (drifted.interface_contract as Record<string, unknown>).digest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(
      (await post(application, TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH, drifted))
        .statusCode,
    ).toBe(400);
    const oversized = structuredClone(send.request) as Record<string, unknown>;
    (oversized.prepare as Record<string, unknown>).text = "长".repeat(2001);
    expect(
      (
        await post(
          application,
          TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
          oversized,
        )
      ).statusCode,
    ).toBe(400);
    const bothPayloads = structuredClone(send.request) as Record<string, unknown>;
    bothPayloads.confirm = {
      confirmation_ref: "confirmation:ref:send-0001",
      prepared_preview_digest: `sha256:${"ab".repeat(32)}`,
    };
    expect(
      (
        await post(
          application,
          TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
          bothPayloads,
        )
      ).statusCode,
    ).toBe(400);
  });

  it("kills command identity drift and prepare/confirm pairing violations", async () => {
    const send = fixture("w8-send-confirm-committed");
    const commandDrift = structuredClone(send.response) as Record<string, unknown>;
    commandDrift.command_request_id = "command-w8-send-9999";
    expect(
      (
        await post(
          await start(fixtureComposition([send], commandDrift).composition),
          TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
          send.request,
        )
      ).statusCode,
    ).toBe(500);

    const prepare = fixture("w8-send-prepare-ready");
    const committedShape = structuredClone(
      fixture("w8-send-confirm-committed").response,
    ) as Record<string, unknown>;
    committedShape.command_request_id = prepare.request.command_request_id;
    expect(
      (
        await post(
          await start(fixtureComposition([prepare], committedShape).composition),
          TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
          prepare.request,
        )
      ).statusCode,
    ).toBe(500);

    const withdraw = fixture("w8-withdraw-committed");
    const foreignProcess = structuredClone(withdraw.response) as Record<string, unknown>;
    foreignProcess.process_ref = "process:ref:foreign-0001";
    expect(
      (
        await post(
          await start(fixtureComposition([withdraw], foreignProcess).composition),
          TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
          withdraw.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("kills read binding drift on scope, cursor echo and unread summary", async () => {
    const targets = fixture("w8-targets-ready");
    const summaryDrift = structuredClone(targets.response) as Record<string, unknown>;
    (summaryDrift.unread_summary as Record<string, unknown>).total_unread = 9;
    expect(
      (
        await post(
          await start(fixtureComposition([targets], summaryDrift).composition),
          TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
          targets.request,
        )
      ).statusCode,
    ).toBe(500);

    const timeline = fixture("w8-timeline-ready-cursored");
    const echoDrift = structuredClone(timeline.response) as Record<string, unknown>;
    echoDrift.cursor_echo = null;
    expect(
      (
        await post(
          await start(fixtureComposition([timeline], echoDrift).composition),
          TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
          timeline.request,
        )
      ).statusCode,
    ).toBe(500);
  });

  it("is unavailable by default and requires service authentication", async () => {
    const selected = fixture("w8-targets-ready");
    const disabled = await start();
    const disabledResponse = await post(
      disabled,
      TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
      selected.request,
    );
    expect(disabledResponse.statusCode).toBe(503);
    expect(disabledResponse.json()).toEqual({
      error: "teacher_communication_owner_disabled",
    });
    expect(disabledResponse.headers["cache-control"]).toBe("private, no-store");

    const enabled = await start(fixtureComposition([selected]).composition);
    const unauthorized = await post(
      enabled,
      TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
      selected.request,
      "wrong-token",
    );
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json()).toEqual({ error: "service_auth_required" });
  });
});

async function start(composition?: TeacherCommunicationOwnerComposition) {
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
        teacherCommunicationOwner: {
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
    throw new Error(`Missing teacher communication fixture ${fixtureId}`);
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
  const authorityResolver: TeacherCommunicationAuthorityResolverV1 = {
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
          resolution_ref: "resolution:w8:e2e",
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
  const owner: TeacherCommunicationOwnerV1 = {
    targets: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    membership: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    timeline: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    sendText: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
    withdrawStaged: vi.fn(async ({ request }) =>
      responseFor(request.host_request_id)),
    markRead: vi.fn(async ({ request }) => responseFor(request.host_request_id)),
  };
  return {
    authorityResolver,
    owner,
    composition: new TeacherCommunicationOwnerComposition(authorityResolver, owner),
  };
}

function loadFixtures(): Fixture[] {
  const value = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/nurture-scenario/contracts/teacher-communication-owner/v1/conformance-fixtures.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { fixtures: Fixture[] };
  return value.fixtures;
}

function isReady(value: unknown): value is Readonly<{
  status: "ready";
  owner_resolution: TeacherCommunicationOwnerResolutionV1;
}> {
  return isRecord(value)
    && value.status === "ready"
    && isRecord(value.owner_resolution);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
