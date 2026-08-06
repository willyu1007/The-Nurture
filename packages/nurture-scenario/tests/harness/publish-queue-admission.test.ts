import { describe, expect, it } from "vitest";
import type {
  NurturePublishQueueAdmissionFacts,
  NurturePublishQueueAdmissionTransaction,
} from "../../src/domain/institution/publish-queue-admission.js";
import {
  admitPublishProcessToQueue,
  evaluatePublishQueueAdmission,
} from "../../src/harness/publish-queue-admission.js";
import { INSTITUTION_PUBLICATION_POLICY_REF } from "../../src/harness/publish-schedule.js";

const policy = {
  policy_ref: INSTITUTION_PUBLICATION_POLICY_REF,
  policy_head: 5,
  institution_ref: "institution-1",
  policy_version: 2,
  time_zone: "Asia/Shanghai",
  default_release_local_time: "17:00",
  retry_cutoff_local_time: "19:00",
  organize_idle_seconds: 600,
  organize_fallback_lead_seconds: 1800,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 60,
  automatic_organize_enabled: true,
  effective_from: "2026-01-01T00:00:00.000Z",
};

const facts = (
  overrides: Partial<NurturePublishQueueAdmissionFacts> = {},
): NurturePublishQueueAdmissionFacts => ({
  publish_process_ref: {
    schema_version: 1,
    namespace: "nurture",
    object_type: "publish_process",
    object_id: "process-1",
    version: 3,
  },
  process_state: "draft",
  process_version: 3,
  current_revision: 1,
  created_at: "2026-08-05T01:00:00.000Z",
  read_at: "2026-08-05T01:00:31.000Z",
  authorizing_role_assignment_id: "role-1",
  authorizing_role_current: true,
  schedule: null,
  current_policy: policy,
  ...overrides,
});

describe("provider-backed publish queue admission", () => {
  it("freezes the exact T-007 schedule only after quick adjust elapses", () => {
    expect(
      evaluatePublishQueueAdmission(
        facts({ read_at: "2026-08-05T01:00:29.999Z" }),
      ),
    ).toEqual({ status: "waiting", reason_code: "quick_adjust_active" });
    const ready = evaluatePublishQueueAdmission(facts());
    expect(ready).toMatchObject({
      status: "ready",
      schedule: {
        policyRef: INSTITUTION_PUBLICATION_POLICY_REF,
        policyHead: 5,
        policyVersion: 2,
        timeZone: "Asia/Shanghai",
      },
    });
  });

  it("fails closed for a live hold, lapsed role, review state or absent policy", () => {
    expect(
      evaluatePublishQueueAdmission(
        facts({ current_hold_expires_at: "2026-08-05T01:01:00.000Z" }),
      ),
    ).toEqual({ status: "waiting", reason_code: "edit_hold_active" });
    expect(
      evaluatePublishQueueAdmission(facts({ authorizing_role_current: false })),
    ).toEqual({ status: "blocked", reason_code: "authorizing_role_lapsed" });
    expect(evaluatePublishQueueAdmission(facts({ process_state: "needs_review" }))).toEqual({
      status: "blocked",
      reason_code: "needs_review",
    });
    expect(evaluatePublishQueueAdmission(facts({ current_policy: null }))).toEqual({
      status: "blocked",
      reason_code: "publication_policy_unavailable",
    });
  });

  it("loads and applies through one owner transaction contract", async () => {
    let applied: Parameters<NurturePublishQueueAdmissionTransaction["applyPublishQueueAdmission"]>[0]
      | undefined;
    const owner: NurturePublishQueueAdmissionTransaction = {
      loadPublishQueueAdmissionFacts: async () => facts(),
      applyPublishQueueAdmission: async (input) => {
        applied = input;
        return {
          publish_process_ref: facts().publish_process_ref,
          schedule: input.schedule,
        };
      },
    };
    const result = await admitPublishProcessToQueue(owner, {
      workspace_id: "workspace-1",
      process_key: "process-key-1",
      now: new Date("2026-08-05T01:00:31.000Z"),
    });
    expect(result.status).toBe("queued");
    expect(applied).toMatchObject({
      expected_process_version: 3,
      authorizing_role_assignment_id: "role-1",
      schedule: { policyHead: 5, policyVersion: 2 },
    });
  });
});
