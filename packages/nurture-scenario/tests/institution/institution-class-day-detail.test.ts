import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionClassDayDetailService,
  type NurtureAuthorityChainResult,
  type NurtureInstitutionClassDayDetailRepository,
  type NurtureInstitutionClassDayDetailRequest,
} from "../../src/index.js";

const resolvedClassScope = (): NurtureAuthorityChainResult => ({
  status: "resolved",
  level: "institution_scope",
  active_role: {
    contract_version: "1.0.0",
    participant_ref: "admin-1",
    role_assignment_ref: "admin-role-1",
    role_kind: "institution_admin",
    scope_type: "institution",
    scope_ref: "institution-1",
    selection_mode: "unique",
  },
  institution_scope: {
    contract_version: "1.0.0",
    active_role: {
      contract_version: "1.0.0",
      participant_ref: "admin-1",
      role_assignment_ref: "admin-role-1",
      role_kind: "institution_admin",
      scope_type: "institution",
      scope_ref: "institution-1",
      selection_mode: "unique",
    },
    institution_ref: "institution-1",
    institution_state: "active",
  },
});

const resolvedChildScope = (): NurtureAuthorityChainResult => {
  const base = resolvedClassScope();
  if (base.status !== "resolved") throw new Error("unreachable");
  return {
    ...base,
    level: "grant_scope",
    child_scope: {
      contract_version: "1.0.0",
      institution_scope: base.institution_scope,
      care_group_ref: "class-1",
      child_process_ref: "child-process-1",
      purpose_key: "care_coordination",
    },
  };
};

const repository = (
  overrides: Partial<NurtureInstitutionClassDayDetailRepository> = {},
): NurtureInstitutionClassDayDetailRepository => ({
  loadInstitutionLocalDay: async () => ({
    storage_date: "2026-08-09T00:00:00.000Z",
    occurred_from: "2026-08-09T00:00:00.000Z",
    occurred_before: "2026-08-10T00:00:00.000Z",
  }),
  loadEffectiveSchedule: async () => ({
    contract_version: "1.0.0",
    care_group_ref: "class-1",
    local_date: "2026-08-09",
    schedule_version: 3,
    resolved_from: "class_standing",
    slots: [
      {
        slot_ref: "morning",
        label: "Morning",
        starts_at_minute: 540,
        ends_at_minute: 660,
      },
    ],
  }),
  loadClassDayCaptures: async () => [],
  loadAttendanceState: async () => ({ state: "unsubmitted" }),
  listAuthorizedCommunications: async () => ({ rows: [], has_more: false }),
  loadChildDayEvidence: async () => ({ rows: [], has_more: false }),
  ...overrides,
});

const request = (
  overrides: Partial<NurtureInstitutionClassDayDetailRequest> = {},
): NurtureInstitutionClassDayDetailRequest => ({
  workspace_id: "workspace-1",
  participant_ref: "admin-1",
  role_assignment_ref: "admin-role-1",
  institution_ref: "institution-1",
  care_group_ref: "class-1",
  local_date: "2026-08-09",
  snapshot_at: "2026-08-09T12:00:00.000Z",
  ...overrides,
});

const unseal = (envelope: unknown): string => {
  if (
    !envelope ||
    typeof envelope !== "object" ||
    Array.isArray(envelope) ||
    typeof (envelope as Record<string, unknown>).body !== "string"
  ) {
    throw new Error("invalid envelope");
  }
  return (envelope as { body: string }).body;
};

const issueRef = (input: {
  kind: "capture" | "daily_care_log" | "attendance" | "communication";
  source_id: string;
}) => `sealed:${input.kind}:${input.source_id}`;

describe("InstitutionClassDayDetailProjectionV1", () => {
  it("composes the actor-safe activity timeline, owner-read refs and formal attendance", async () => {
    const service = new NurtureInstitutionClassDayDetailService(
      repository({
        loadClassDayCaptures: async () => [
          {
            source_id: "text-1",
            kind: "text",
            occurred_at: "2026-08-09T09:15:00.000Z",
            placement_state: "placed",
            activity_ref: "morning",
            body_envelope: { body: "Painted with leaves" },
          },
          {
            source_id: "photo-1",
            kind: "photo",
            occurred_at: "2026-08-09T09:30:00.000Z",
            placement_state: "unplaced",
            media_ref: "media-1",
          },
        ],
        loadAttendanceState: async () => ({
          state: "reopened",
          submission_head: 2,
          submitted_at: "2026-08-09T10:00:00.000Z",
          reopened_at: "2026-08-09T11:00:00.000Z",
        }),
        listAuthorizedCommunications: async () => ({
          rows: [
            {
              message_id: "message-1",
              child_process_ref: "child-process-1",
              direction: "family_to_org",
              data_class: "family_care_question",
              author_side: "family",
              occurred_at: "2026-08-09T10:30:00.000Z",
              corrected: false,
              redacted: false,
              lifecycle: "closed",
              lifecycle_reason: "expired",
              acknowledgement_state: "acknowledged",
              response_state: "awaiting_reply",
            },
          ],
          has_more: true,
        }),
      }),
      { resolve: async () => resolvedClassScope() },
      unseal,
      issueRef,
    );

    const decision = await service.compose(request());
    expect(decision.status).toBe("ok");
    if (decision.status !== "ok") return;
    expect(decision.output.activities[0]!.timeline).toEqual([
      {
        kind: "text",
        source_ref: "sealed:capture:text-1",
        occurred_at: "2026-08-09T09:15:00.000Z",
        body: "Painted with leaves",
      },
    ]);
    expect(decision.output.unplaced).toEqual([
      {
        kind: "photo",
        source_ref: "sealed:capture:photo-1",
        occurred_at: "2026-08-09T09:30:00.000Z",
        media_ref: "media-1",
      },
    ]);
    expect(decision.output.communications[0]).toMatchObject({
      message_target_ref: "sealed:communication:message-1",
      response_state: "awaiting_reply",
      lifecycle: "closed",
      lifecycle_reason: "expired",
    });
    expect(decision.output.home_institution_dynamics.family_feedback).toHaveLength(1);
    expect(decision.output.home_institution_dynamics.institution_outreach).toHaveLength(0);
    expect(decision.output.communications_has_more).toBe(true);
    expect(decision.output.attendance).toMatchObject({ state: "reopened", submission_head: 2 });
    expect(JSON.stringify(decision.output)).not.toContain("body_envelope");
  });

  it("denies before reading detail facts when the class scope is not authorized", async () => {
    const loadEffectiveSchedule = vi.fn(async () => null);
    const service = new NurtureInstitutionClassDayDetailService(
      repository({ loadEffectiveSchedule }),
      {
        resolve: async () => ({
          status: "denied",
          level: "institution_scope",
          reason_code: "not_authorized",
        }),
      },
      unseal,
      issueRef,
    );
    await expect(service.compose(request())).resolves.toEqual({
      status: "denied",
      reason_code: "not_authorized",
    });
    expect(loadEffectiveSchedule).not.toHaveBeenCalled();
  });

  it("fails the whole projection closed when one protected timeline body cannot be opened", async () => {
    const service = new NurtureInstitutionClassDayDetailService(
      repository({
        loadClassDayCaptures: async () => [
          {
            source_id: "text-1",
            kind: "text",
            occurred_at: "2026-08-09T09:00:00.000Z",
            placement_state: "placed",
            activity_ref: "morning",
            body_envelope: { malformed: true },
          },
        ],
      }),
      { resolve: async () => resolvedClassScope() },
      unseal,
      issueRef,
    );
    await expect(service.compose(request())).resolves.toEqual({
      status: "unavailable",
      reason_code: "protected_content_unavailable",
    });
  });

  it("loads child evidence only after the exact purpose and grant scope resolve", async () => {
    const loadChildDayEvidence = vi.fn(async () => ({
      rows: [
        {
          kind: "daily_care_log" as const,
          source_id: "log-1",
          occurred_at: "2026-08-09T10:00:00.000Z",
          status: "recorded" as const,
          summary: "Ate lunch",
        },
      ],
      has_more: true,
    }));
    const service = new NurtureInstitutionClassDayDetailService(
      repository({ loadChildDayEvidence }),
      {
        resolve: async (input) =>
          input.target?.object_type === "care_group"
            ? resolvedClassScope()
            : resolvedChildScope(),
      },
      unseal,
      issueRef,
    );
    const decision = await service.compose(
      request({
        child_drilldown: {
          target: {
            object_type: "family_care_thread",
            object_id: "thread-1",
            lifecycle_state: "active",
          },
          purpose_key: "care_coordination",
          direction: "family_to_org",
          data_class: "daily_care_log",
        },
      }),
    );
    expect(decision.status).toBe("ok");
    if (decision.status !== "ok") return;
    expect(decision.output.child_drilldown).toEqual({
      status: "available",
      child_process_ref: "child-process-1",
      purpose_key: "care_coordination",
      direction: "family_to_org",
      data_class: "daily_care_log",
      evidence: [
        {
          kind: "daily_care_log",
          source_ref: "sealed:daily_care_log:log-1",
          occurred_at: "2026-08-09T10:00:00.000Z",
          status: "recorded",
          summary: "Ate lunch",
        },
      ],
      evidence_has_more: true,
    });
    expect(loadChildDayEvidence).toHaveBeenCalledOnce();
  });
});
