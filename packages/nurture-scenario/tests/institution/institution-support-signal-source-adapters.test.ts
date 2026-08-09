import { describe, expect, it, vi } from "vitest";
import {
  NurtureExactOwnerSupportSignalSourceReader,
  type NurtureAttendanceSubmissionOwnerFactV1,
  type NurtureAuthoritySourceBlockerOwnerFactV1,
  type NurtureBusinessResponseOwnerFactV1,
  type NurtureConfiguredLoadOwnerFactV1,
  type NurtureInstitutionSupportSignalOwnerReadRequest,
  type NurtureReviewBacklogOwnerFactV1,
  type NurtureWorkItemWorkflowBlockerOwnerFactV1,
} from "../../src/index.js";

const deterministicCategories = [
  "attendance_submission_overdue",
  "business_response_overdue",
  "review_backlog_threshold",
  "authority_or_source_blocked",
  "work_item_or_workflow_blocked",
  "configured_load_threshold",
] as const;

const request: NurtureInstitutionSupportSignalOwnerReadRequest = {
  workspace_id: "workspace-1",
  participant_ref: "admin-1",
  role_assignment_ref: "admin-role-1",
  institution_ref: "institution-1",
  snapshot_at: "2026-08-09T12:00:00.000Z",
  policies: deterministicCategories.map((category, index) => ({
    contract_version: "1.0.0",
    policy_ref: `policy-${category}`,
    workspace_id: "workspace-1",
    institution_ref: "institution-1",
    category,
    ...(category === "review_backlog_threshold" || category === "configured_load_threshold"
      ? { absolute_threshold: 1 }
      : {}),
    window_key: "local-day:2026-08-09",
    checkpoint_ref: `checkpoint-${index}`,
    enabled: true,
    policy_revision: 1,
    effective_from: "2026-08-01T00:00:00.000Z",
    changed_by_role_assignment_ref: "admin-role-1",
    change_reason: "test",
  })),
};

const common = {
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  scope_ref: "class-a",
  scope_kind: "care_group" as const,
  subject_order: { age_band_key: "01", name: "Class A" },
  occurred_at: "2026-08-09T08:00:00.000Z",
};

const aggregate = {
  members: [
    {
      member_ref: "child-1",
      grant_state: "active" as const,
      grant_terms: [
        {
          directions: ["family_to_org" as const],
          data_classes: ["daily_care_log" as const],
          purposes: ["care_coordination"],
        },
      ],
      current_count: 2,
    },
  ],
  ask: {
    direction: "family_to_org" as const,
    data_class: "daily_care_log" as const,
    purpose_key: "care_coordination",
  },
};

const attendance: NurtureAttendanceSubmissionOwnerFactV1 = {
  ...common,
  source_type: "daily_attendance_closeout",
  opaque_source_ref: "opaque-attendance",
  checkpoint_ref: "attendance:class-day-closeout",
  submission_state: "unsubmitted",
  checkpoint_deadline_at: "2026-08-09T10:00:00.000Z",
};

const businessResponse: NurtureBusinessResponseOwnerFactV1 = {
  ...common,
  source_type: "institution_business_communication",
  opaque_source_ref: "opaque-communication",
  checkpoint_ref: "family-care:response",
  response_state: "awaiting_reply",
  lifecycle: "active",
  response_deadline_at: "2026-08-09T11:00:00.000Z",
};

const reviewBacklog: NurtureReviewBacklogOwnerFactV1 = {
  ...common,
  source_type: "activity_review_backlog",
  opaque_source_ref: "opaque-review-backlog",
  checkpoint_ref: "placement:daily-review",
  condition: "open",
  aggregate,
};

const authorityBlocker: NurtureAuthoritySourceBlockerOwnerFactV1 = {
  ...common,
  source_type: "publish_process_authority",
  opaque_source_ref: "opaque-authority-blocker",
  checkpoint_ref: "publish:eligibility",
  condition: "blocked",
};

const workflowBlocker: NurtureWorkItemWorkflowBlockerOwnerFactV1 = {
  ...common,
  source_type: "institution_work_item",
  opaque_source_ref: "opaque-work-item",
  checkpoint_ref: "work-item:current-blocker",
  condition: "blocked",
};

const configuredLoad: NurtureConfiguredLoadOwnerFactV1 = {
  ...common,
  source_type: "institution_pending_work",
  opaque_source_ref: "opaque-load",
  checkpoint_ref: "pending-work:current",
  condition: "open",
  aggregate,
};

const owners = (overrides: {
  workItemRead?: { status: "available"; facts: NurtureWorkItemWorkflowBlockerOwnerFactV1[] } | { status: "unavailable" };
} = {}) => ({
  attendance: {
    loadAttendanceSubmissionFacts: vi.fn(async () => ({
      status: "available" as const,
      facts: [attendance],
    })),
  },
  business_response: {
    loadBusinessResponseFacts: vi.fn(async () => ({
      status: "available" as const,
      facts: [businessResponse],
    })),
  },
  review_backlog: {
    loadReviewBacklogFacts: vi.fn(async () => ({
      status: "available" as const,
      facts: [reviewBacklog],
    })),
  },
  authority_source_blocker: {
    loadAuthoritySourceBlockerFacts: vi.fn(async () => ({
      status: "available" as const,
      facts: [authorityBlocker],
    })),
  },
  work_item_workflow_blocker: {
    loadWorkItemWorkflowBlockerFacts: vi.fn(async () =>
      overrides.workItemRead ?? {
        status: "available" as const,
        facts: [workflowBlocker],
      },
    ),
  },
  configured_load: {
    loadConfiguredLoadFacts: vi.fn(async () => ({
      status: "available" as const,
      facts: [configuredLoad],
    })),
  },
});

describe("six deterministic exact-owner source adapters", () => {
  it("maps each owner vocabulary once and preserves owner deadlines/blockers", async () => {
    const exactOwners = owners();
    const reader = new NurtureExactOwnerSupportSignalSourceReader(exactOwners);
    const result = await reader.loadAuthorizedSources(request);
    expect(result.status).toBe("available");
    expect(result.sources.map((source) => source.category)).toEqual([
      "attendance_submission_overdue",
      "business_response_overdue",
      "review_backlog_threshold",
      "authority_or_source_blocked",
      "work_item_or_workflow_blocked",
      "configured_load_threshold",
    ]);
    expect(result.sources[0]).toMatchObject({
      source_ref: "opaque-attendance",
      deadline_at: attendance.checkpoint_deadline_at,
      condition: "open",
    });
    expect(result.sources[1]).toMatchObject({
      source_ref: "opaque-communication",
      deadline_at: businessResponse.response_deadline_at,
      condition: "open",
    });
    expect(result.sources[3]).toMatchObject({ condition: authorityBlocker.condition });
    expect(result.sources[4]).toMatchObject({ condition: workflowBlocker.condition });
    expect(result.sources[2]?.aggregate).toBe(reviewBacklog.aggregate);
    expect(result.sources[5]?.aggregate).toBe(configuredLoad.aggregate);
    expect(exactOwners.attendance.loadAttendanceSubmissionFacts).toHaveBeenCalledWith(request);
  });

  it("turns only canonical resolved states into resolved sources", async () => {
    const exactOwners = owners();
    exactOwners.attendance.loadAttendanceSubmissionFacts.mockResolvedValue({
      status: "available",
      facts: [{ ...attendance, submission_state: "submitted" }],
    });
    exactOwners.business_response.loadBusinessResponseFacts.mockResolvedValue({
      status: "available",
      facts: [{ ...businessResponse, response_state: "responded" }],
    });
    const result = await new NurtureExactOwnerSupportSignalSourceReader(
      exactOwners,
    ).loadAuthorizedSources(request);
    expect(result.sources[0]?.condition).toBe("resolved");
    expect(result.sources[1]?.condition).toBe("resolved");
  });

  it("fails the deterministic projection closed when one owner is unavailable", async () => {
    const reader = new NurtureExactOwnerSupportSignalSourceReader(
      owners({ workItemRead: { status: "unavailable" } }),
    );
    await expect(reader.loadAuthorizedSources(request)).resolves.toEqual({
      status: "unavailable",
      sources: [],
    });
  });

  it("does not call an owner for an absent or disabled category", async () => {
    const exactOwners = owners({ workItemRead: { status: "unavailable" } });
    const noPolicies = { ...request, policies: [] };
    await expect(
      new NurtureExactOwnerSupportSignalSourceReader(exactOwners).loadAuthorizedSources(
        noPolicies,
      ),
    ).resolves.toEqual({ status: "available", sources: [] });
    expect(exactOwners.work_item_workflow_blocker.loadWorkItemWorkflowBlockerFacts)
      .not.toHaveBeenCalled();
  });

  it("does not let one owner exception expose a partial list", async () => {
    const exactOwners = owners();
    exactOwners.authority_source_blocker.loadAuthoritySourceBlockerFacts.mockRejectedValue(
      new Error("owner unavailable"),
    );
    await expect(
      new NurtureExactOwnerSupportSignalSourceReader(exactOwners).loadAuthorizedSources(request),
    ).resolves.toEqual({ status: "unavailable", sources: [] });
  });
});
