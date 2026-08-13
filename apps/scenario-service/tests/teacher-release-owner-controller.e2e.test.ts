import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createNurtureTeacherReleaseOwnerHttpSource } from "@my-chat/scenario-integrations";
import type { NurtureResolverResult } from "@the-nurture/scenario";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { HarnessRuntime } from "../src/harness-runtime.js";
import {
  TeacherReleaseOwnerComposition,
  type TeacherReleaseOwnerEngine,
} from "../src/teacher-release-owner-composition.js";
import {
  TEACHER_RELEASE_OWNER_INTERFACE,
  TEACHER_RELEASE_OWNER_QUERY_PATH,
} from "../src/teacher-release-owner-http.js";

const TOKEN = "teacher-release-owner-service-token-32";
const closes: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

const resolvedOwner = (): NurtureResolverResult => ({
  status: "resolved",
  context: {
    actor: {
      participant_id: "participant-current",
      my_chat_user_id: "user-1",
      role_assignment_id: "role-current",
      role_kind: "caregiver",
      scope_type: "care_group",
      scope_id: "group-current",
    },
    work_scope: { kind: "care_group", care_group_id: "group-current" },
    continuity: {},
    policy_seed: { action_key: "query_teacher_publish_queue" },
  },
});

const queueOutput = () => ({
  binding: {
    contract: {
      key: "nurture.surface-contract",
      version: "1.20.0",
      digest:
        "sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273",
    },
    capability: { key: "query_teacher_publish_queue", version: "1.0.0" },
    actor: { role: "caregiver", scopeKind: "care_group", scopeRef: "1.group" },
    snapshot: { snapshotRef: "1.snapshot", snapshotVersion: 1 },
    order: "state_rank_asc,occurred_at_desc,id_desc",
    sourceHeads: [],
  },
  careGroupRef: "1.group",
  counts: {
    draft: 0,
    needs_review: 0,
    pending_release: 1,
    released: 0,
    cancelled: 0,
  },
  items: [
    {
      processRef: "1.process",
      state: "pending_release",
      dataClass: "child_growth_record",
      title: "Today’s class update",
      revision: 1,
      targetSummary: { total: 1, released: 0 },
      occurredAt: "2026-08-09T08:00:00.000Z",
      editHoldActive: false,
      actions: [
        {
          capabilityKey: "release_publish_process",
          capabilityVersion: "1.0.0",
          targetOptionRef: "1.process",
          availability: "available",
        },
      ],
    },
  ],
  pageInfo: { hasMore: false },
});

const engine = (): TeacherReleaseOwnerEngine => ({
  query: vi.fn<TeacherReleaseOwnerEngine["query"]>(async () => ({
    status: "ok",
    output: queueOutput(),
  })),
  prepare: vi.fn<TeacherReleaseOwnerEngine["prepare"]>(async () => ({
    status: "ready_to_confirm",
    preview: {
      effect: "release_publish_process",
      target_count: 1,
      already_committed_count: 0,
      release_revision: 1,
    },
    confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    expires_at: "2026-08-09T10:05:00.000Z",
    command_request_id: "command-1",
  })),
  presentReleaseTargets: vi.fn<
    TeacherReleaseOwnerEngine["presentReleaseTargets"]
  >(async () => ({
    status: "ready",
    presentation: {
      selectionMode: "fixed_process_targets",
      processRef: "1.process",
      targetSnapshotRef: `1.1786269900000.${"a".repeat(64)}`,
      snapshotVersion: "1.snapshot-version",
      generatedAt: "2026-08-09T10:00:00.000Z",
      expiresAt: "2026-08-09T10:05:00.000Z",
      targets: [
        {
          targetRef: "1.target",
          availability: "available",
          displayLabel: "小雨家庭",
        },
      ],
    },
  })),
  execute: vi.fn<TeacherReleaseOwnerEngine["execute"]>(async () => ({
    status: "committed",
    execution_disposition: "executed",
    business_outcome: "applied",
    execution_ref: { private: "removed" },
    output_refs: [{ private: "removed" }],
    committed_result: {
      processState: "released",
      frozenRevision: 1,
      results: [
        {
          targetRef: "1.target",
          outcome: "committed",
          publicationRef: "1.publication",
          receiptRef: "1.receipt",
        },
      ],
      summary: { total: 1, committed: 1, rejected: 0, outcomeUnknown: 0 },
      missedSendAttention: false,
    },
  })),
});

const start = async (composition?: TeacherReleaseOwnerComposition) => {
  const auth = createBindingOwnerServiceAuth(TOKEN);
  const { app } = await createScenarioServiceApplication({
    bindingOwnerServiceAuth: auth,
    harnessRuntime: new HarnessRuntime(undefined),
    ...(composition ? { teacherReleaseOwnerComposition: composition } : {}),
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  closes.push(() => app.close());
  const address = app.getHttpServer().address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
};

describe("teacher release owner formal ingress", () => {
  it("runs the strict My-Chat adapter through query, targets, prepare and confirm", async () => {
    const ownerEngine = engine();
    const baseUrl = await start(
      new TeacherReleaseOwnerComposition(
        { resolve: async () => resolvedOwner() },
        ownerEngine,
      ),
    );
    const source = createNurtureTeacherReleaseOwnerHttpSource({
      baseUrl,
      serviceToken: TOKEN,
    });
    const identity = {
      workspaceId: "workspace-1",
      myChatUserId: "user-1",
      hostRequestId: "host-request-1",
    } as const;

    const queried = await source.query(identity);
    expect(queried).toMatchObject({
      status: "ready",
      result: { status: "ok", output: { counts: { pending_release: 1 } } },
    });
    const targets = await source.targets({
      ...identity,
      hostRequestId: "host-request-targets",
      processRef: "1.process",
      actionOptionRef: "1.process",
    });
    expect(targets).toMatchObject({
      status: "ready",
      result: {
        status: "ok",
        detail: { selectionMode: "fixed_process_targets" },
      },
    });
    if (targets.status !== "ready") {
      throw new Error("expected ready target review");
    }
    const prepared = await source.prepare({
      ...identity,
      hostRequestId: "host-request-2",
      processRef: "1.process",
      actionOptionRef: "1.process",
      targetSnapshotRef: targets.result.detail.targetSnapshotRef,
    });
    expect(prepared).toMatchObject({
      status: "ready",
      result: { status: "ready_to_confirm" },
    });
    const confirmed = await source.confirm({
      ...identity,
      hostRequestId: "host-request-3",
      invocationRequestId: "invocation-1",
      commandRequestId: "command-1",
      confirmationRef: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    });
    expect(confirmed).toMatchObject({
      status: "ready",
      result: {
        status: "committed",
        committed_result: { processState: "released" },
      },
    });
    expect(JSON.stringify(confirmed)).not.toContain("private");
    expect(ownerEngine.query).toHaveBeenCalledWith(
      expect.objectContaining({ actor_participant_id: "participant-current" }),
    );
    expect(ownerEngine.presentReleaseTargets).toHaveBeenCalledWith({
      workspace_id: "workspace-1",
      actor_participant_id: "participant-current",
      process_ref: "1.process",
    });
  });

  it("carries only reviewed stale and outcome-unknown recovery through HTTP", async () => {
    let attempt = 0;
    const recoveryEngine: TeacherReleaseOwnerEngine = {
      ...engine(),
      execute: async () => {
        attempt += 1;
        return attempt === 1
          ? {
              status: "not_committed",
              decision: "conflict",
              reason_code: "stale_confirmation",
              recovery: "reprepare",
            }
          : {
              status: "outcome_unknown",
              reason_code: "database_timeout_after_commit",
              recovery: "reconcile_same_command",
            };
      },
    };
    const baseUrl = await start(
      new TeacherReleaseOwnerComposition(
        { resolve: async () => resolvedOwner() },
        recoveryEngine,
      ),
    );
    const source = createNurtureTeacherReleaseOwnerHttpSource({
      baseUrl,
      serviceToken: TOKEN,
    });
    const request = (suffix: string) => ({
      workspaceId: "workspace-1",
      myChatUserId: "user-1",
      hostRequestId: `host-${suffix}`,
      invocationRequestId: `invocation-${suffix}`,
      commandRequestId: "command-1",
      confirmationRef: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    });

    await expect(source.confirm(request("stale"))).resolves.toEqual({
      status: "ready",
      result: {
        status: "not_committed",
        decision: "conflict",
        reason_code: "stale_confirmation",
        recovery: "reprepare",
      },
    });
    await expect(source.confirm(request("unknown"))).resolves.toEqual({
      status: "ready",
      result: {
        status: "outcome_unknown",
        reason_code: "release_outcome_unknown",
        recovery: "reconcile_same_command",
      },
    });
  });

  it("stays default-off and rejects auth or foreign request claims before composition", async () => {
    const disabledUrl = await start();
    const disabled = await fetch(
      `${disabledUrl}${TEACHER_RELEASE_OWNER_QUERY_PATH}`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );
    expect(disabled.status).toBe(503);
    expect(disabled.headers.get("cache-control")).toBe("private, no-store");
    expect(disabled.headers.get("pragma")).toBe("no-cache");
    await expect(disabled.json()).resolves.toEqual({
      error: "teacher_release_owner_disabled",
    });

    const ownerEngine = engine();
    const activeUrl = await start(
      new TeacherReleaseOwnerComposition(
        { resolve: async () => resolvedOwner() },
        ownerEngine,
      ),
    );
    const unauthorized = await fetch(
      `${activeUrl}${TEACHER_RELEASE_OWNER_QUERY_PATH}`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer wrong",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("cache-control")).toBe("private, no-store");
    expect(unauthorized.headers.get("pragma")).toBe("no-cache");

    const foreign = await fetch(
      `${activeUrl}${TEACHER_RELEASE_OWNER_QUERY_PATH}`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          interface_contract: TEACHER_RELEASE_OWNER_INTERFACE,
          workspace_id: "workspace-1",
          my_chat_user_id: "user-1",
          host_request_id: "host-request-1",
          actor_participant_id: "forged",
        }),
      },
    );
    expect(foreign.status).toBe(400);
    await expect(foreign.json()).resolves.toEqual({
      error: "invalid_teacher_release_owner_request",
    });
    expect(ownerEngine.query).not.toHaveBeenCalled();
  });
});
