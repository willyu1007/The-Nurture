import type {
  NurtureAuthorityChainRequest,
  NurtureAuthorityChainResult,
} from "./institution-authority-chain.js";
import type {
  NurtureGrantDataClass,
  NurtureGrantDirection,
  NurturePolicyReasonCode,
} from "./institution-context.js";
import type { NurtureEffectiveSchedule } from "./class-schedule-placement.js";

/**
 * I1 implementation of `InstitutionClassDayDetailProjectionV1`.
 *
 * The service owns projection and authority decisions. The repository returns
 * stored facts and sealed bodies only; it never decides who may see them and
 * never leaks an ORM value above the port.
 */

export type NurtureClassDayCaptureRow = {
  source_id: string;
  kind: "photo" | "text" | "voice_transcript";
  occurred_at: string;
  placement_state: "placed" | "unplaced";
  activity_ref?: string;
  media_ref?: string;
  body_envelope?: unknown;
};

export type NurtureClassDayAttendance =
  | { state: "unsubmitted" }
  | {
      state: "submitted" | "reopened";
      submission_head: number;
      submitted_at: string;
      reopened_at?: string;
    };

export type NurtureClassDayCommunicationRow = {
  message_id: string;
  child_process_ref: string;
  direction: "family_to_org" | "org_to_family";
  data_class: "family_care_question" | "direct_care_communication";
  author_side: "family" | "care_group";
  occurred_at: string;
  corrected: boolean;
  redacted: boolean;
  lifecycle: "active" | "closed" | "suppressed";
  lifecycle_reason?: "family_withdrawn" | "grant_revoked" | "source_redacted" | "expired";
  acknowledgement_state?: "pending" | "acknowledged";
  response_state?: "awaiting_reply" | "responded" | "not_applicable";
  due_at?: string;
};

export type NurtureInstitutionLocalDay = {
  storage_date: string;
  occurred_from: string;
  occurred_before: string;
};

export type NurtureClassDayCommunicationPage = {
  rows: NurtureClassDayCommunicationRow[];
  has_more: boolean;
};

export type NurtureChildDayEvidenceRow =
  | {
      kind: "daily_care_log";
      source_id: string;
      occurred_at: string;
      status: "recorded" | "shared" | "corrected";
      summary?: string;
    }
  | {
      kind: "attendance";
      source_id: string;
      occurred_at: string;
      state: "present" | "absent" | "excused_absent" | "not_expected";
    }
  | {
      kind: "communication";
      source_id: string;
      occurred_at: string;
      direction: "family_to_org" | "org_to_family";
      author_side: "family" | "care_group";
      response_state?: "awaiting_reply" | "responded" | "not_applicable";
    };

export type NurtureInstitutionClassDayDetailRepository = {
  loadInstitutionLocalDay(input: {
    workspace_id: string;
    institution_ref: string;
    local_date: string;
    snapshot_at: string;
  }): Promise<NurtureInstitutionLocalDay | null>;
  loadEffectiveSchedule(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureEffectiveSchedule | null>;
  loadClassDayCaptures(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
    local_day: NurtureInstitutionLocalDay;
  }): Promise<NurtureClassDayCaptureRow[]>;
  loadAttendanceState(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
    local_day: NurtureInstitutionLocalDay;
  }): Promise<NurtureClassDayAttendance>;
  listAuthorizedCommunications(input: {
    workspace_id: string;
    participant_id: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
    limit: number;
    local_day: NurtureInstitutionLocalDay;
  }): Promise<NurtureClassDayCommunicationPage>;
  loadChildDayEvidence(input: {
    workspace_id: string;
    participant_id: string;
    child_process_ref: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
    direction: NurtureGrantDirection;
    data_class: NurtureGrantDataClass;
    local_day: NurtureInstitutionLocalDay;
  }): Promise<{ rows: NurtureChildDayEvidenceRow[]; has_more: boolean }>;
};

export type NurtureClassDayTimelineEntry =
  | {
      kind: "photo";
      source_ref: string;
      occurred_at: string;
      media_ref: string;
    }
  | {
      kind: "text" | "voice_transcript";
      source_ref: string;
      occurred_at: string;
      body: string;
    };

export type NurtureClassDayCommunication = {
  message_target_ref: string;
  occurred_at: string;
  direction: "family_to_org" | "org_to_family";
  data_class: "family_care_question" | "direct_care_communication";
  author_side: "family" | "care_group";
  content_state: "original" | "corrected" | "redacted";
  lifecycle: "active" | "closed" | "suppressed";
  lifecycle_reason?: "family_withdrawn" | "grant_revoked" | "source_redacted" | "expired";
  acknowledgement_state?: "pending" | "acknowledged";
  response_state?: "awaiting_reply" | "responded" | "not_applicable";
  due_at?: string;
};

export type NurtureChildDayEvidence =
  | {
      kind: "daily_care_log";
      source_ref: string;
      occurred_at: string;
      status: "recorded" | "shared" | "corrected";
      summary?: string;
    }
  | {
      kind: "attendance";
      source_ref: string;
      occurred_at: string;
      state: "present" | "absent" | "excused_absent" | "not_expected";
    }
  | {
      kind: "communication";
      source_ref: string;
      occurred_at: string;
      direction: "family_to_org" | "org_to_family";
      author_side: "family" | "care_group";
      response_state?: "awaiting_reply" | "responded" | "not_applicable";
    };

export type NurtureInstitutionClassDayDetailProjectionV1 = {
  contract_version: "1.0.0";
  institution_ref: string;
  care_group_ref: string;
  local_date: string;
  snapshot_at: string;
  schedule: NurtureEffectiveSchedule | null;
  activities: Array<{
    activity_ref: string;
    label: string;
    starts_at_minute: number;
    ends_at_minute: number;
    timeline: NurtureClassDayTimelineEntry[];
  }>;
  unplaced: NurtureClassDayTimelineEntry[];
  communications: NurtureClassDayCommunication[];
  communications_has_more: boolean;
  home_institution_dynamics: {
    institution_outreach: NurtureClassDayCommunication[];
    family_feedback: NurtureClassDayCommunication[];
  };
  attendance: NurtureClassDayAttendance;
  child_drilldown?:
    | { status: "unavailable"; reason_code: NurturePolicyReasonCode }
    | {
        status: "available";
        child_process_ref: string;
        purpose_key: string;
        direction: NurtureGrantDirection;
        data_class: NurtureGrantDataClass;
        evidence: NurtureChildDayEvidence[];
        evidence_has_more: boolean;
      };
  projection_version: 1;
};

export type NurtureInstitutionClassDayDetailDecision =
  | { status: "ok"; output: NurtureInstitutionClassDayDetailProjectionV1 }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | {
      status: "unavailable";
      reason_code: "projection_unavailable" | "protected_content_unavailable";
    };

export type NurtureInstitutionClassDayDetailRequest = {
  workspace_id: string;
  participant_ref: string;
  role_assignment_ref?: string;
  institution_ref: string;
  care_group_ref: string;
  local_date: string;
  snapshot_at: string;
  child_drilldown?: {
    target: NonNullable<NurtureAuthorityChainRequest["target"]>;
    purpose_key: string;
    direction: NurtureGrantDirection;
    data_class: NurtureGrantDataClass;
  };
};

type DetailAuthorityPort = {
  resolve(request: NurtureAuthorityChainRequest): Promise<NurtureAuthorityChainResult>;
};

type DetailRefIssuer = (input: {
  workspace_id: string;
  participant_id: string;
  kind: "capture" | "daily_care_log" | "attendance" | "communication";
  source_id: string;
}) => string;

class NurtureProtectedContentUnavailableError extends Error {
  constructor() {
    super("class-day protected content is unavailable");
  }
}

const orderByOccurrence = <T extends { occurred_at: string; source_ref: string }>(
  rows: T[],
): T[] =>
  [...rows].sort((left, right) => {
    const byTime = left.occurred_at.localeCompare(right.occurred_at);
    return byTime !== 0 ? byTime : left.source_ref.localeCompare(right.source_ref);
  });

export class NurtureInstitutionClassDayDetailService {
  constructor(
    private readonly repository: NurtureInstitutionClassDayDetailRepository,
    private readonly authority: DetailAuthorityPort,
    private readonly unseal: (envelope: unknown) => string,
    private readonly issueRef: DetailRefIssuer,
  ) {}

  async compose(
    request: NurtureInstitutionClassDayDetailRequest,
  ): Promise<NurtureInstitutionClassDayDetailDecision> {
    const classScope = await this.authority.resolve({
      workspace_id: request.workspace_id,
      participant_ref: request.participant_ref,
      ...(request.role_assignment_ref
        ? { role_assignment_ref: request.role_assignment_ref }
        : {}),
      at: request.snapshot_at,
      target: {
        object_type: "care_group",
        object_id: request.care_group_ref,
        lifecycle_state: "active",
      },
    });
    if (classScope.status === "denied") {
      return { status: "denied", reason_code: classScope.reason_code };
    }
    if (classScope.institution_scope.institution_ref !== request.institution_ref) {
      return { status: "denied", reason_code: "not_authorized" };
    }

    try {
      const localDay = await this.repository.loadInstitutionLocalDay(request);
      if (!localDay) throw new Error("institution-local day is unavailable");
      const dayScope = { ...request, local_day: localDay };
      const [schedule, captureRows, attendance, communicationPage] = await Promise.all([
        this.repository.loadEffectiveSchedule(request),
        this.repository.loadClassDayCaptures(dayScope),
        this.repository.loadAttendanceState(dayScope),
        this.repository.listAuthorizedCommunications({
          ...dayScope,
          participant_id: request.participant_ref,
          limit: 100,
        }),
      ]);
      const timelineRows = captureRows.map((row): {
        placement_state: "placed" | "unplaced";
        activity_ref?: string;
        entry: NurtureClassDayTimelineEntry;
      } => {
        const sourceRef = this.issueRef({
          workspace_id: request.workspace_id,
          participant_id: request.participant_ref,
          kind: "capture",
          source_id: row.source_id,
        });
        if (row.kind === "photo") {
          if (!row.media_ref) throw new Error("class-day photo has no media ref");
          return {
            placement_state: row.placement_state,
            ...(row.activity_ref ? { activity_ref: row.activity_ref } : {}),
            entry: {
              kind: "photo",
              source_ref: sourceRef,
              occurred_at: row.occurred_at,
              media_ref: row.media_ref,
            },
          };
        }
        if (!row.body_envelope) throw new NurtureProtectedContentUnavailableError();
        let body: string;
        try {
          body = this.unseal(row.body_envelope);
        } catch {
          throw new NurtureProtectedContentUnavailableError();
        }
        return {
          placement_state: row.placement_state,
          ...(row.activity_ref ? { activity_ref: row.activity_ref } : {}),
          entry: {
            kind: row.kind,
            source_ref: sourceRef,
            occurred_at: row.occurred_at,
            body,
          },
        };
      });
      const activityRefs = new Set(schedule?.slots.map((slot) => slot.slot_ref) ?? []);
      const activities =
        schedule?.slots.map((slot) => ({
          activity_ref: slot.slot_ref,
          label: slot.label,
          starts_at_minute: slot.starts_at_minute,
          ends_at_minute: slot.ends_at_minute,
          timeline: orderByOccurrence(
            timelineRows
              .filter(
                (row) =>
                  row.placement_state === "placed" && row.activity_ref === slot.slot_ref,
              )
              .map((row) => row.entry),
          ),
        })) ?? [];
      const unplaced = orderByOccurrence(
        timelineRows
          .filter(
            (row) =>
              row.placement_state === "unplaced" ||
              !row.activity_ref ||
              !activityRefs.has(row.activity_ref),
          )
          .map((row) => row.entry),
      );
      const communications = communicationPage.rows.map((row): NurtureClassDayCommunication => ({
        message_target_ref: this.issueRef({
          workspace_id: request.workspace_id,
          participant_id: request.participant_ref,
          kind: "communication",
          source_id: row.message_id,
        }),
        occurred_at: row.occurred_at,
        direction: row.direction,
        data_class: row.data_class,
        author_side: row.author_side,
        content_state: row.redacted ? "redacted" : row.corrected ? "corrected" : "original",
        lifecycle: row.lifecycle,
        ...(row.lifecycle_reason ? { lifecycle_reason: row.lifecycle_reason } : {}),
        ...(row.acknowledgement_state
          ? { acknowledgement_state: row.acknowledgement_state }
          : {}),
        ...(row.response_state ? { response_state: row.response_state } : {}),
        ...(row.due_at ? { due_at: row.due_at } : {}),
      }));
      const childDrilldown = request.child_drilldown
        ? await this.composeChildDrilldown(request, request.child_drilldown, localDay)
        : undefined;

      return {
        status: "ok",
        output: {
          contract_version: "1.0.0",
          institution_ref: classScope.institution_scope.institution_ref,
          care_group_ref: request.care_group_ref,
          local_date: request.local_date,
          snapshot_at: request.snapshot_at,
          schedule,
          activities,
          unplaced,
          communications,
          communications_has_more: communicationPage.has_more,
          home_institution_dynamics: {
            institution_outreach: communications.filter(
              (row) => row.direction === "org_to_family",
            ),
            family_feedback: communications.filter(
              (row) => row.direction === "family_to_org",
            ),
          },
          attendance,
          ...(childDrilldown ? { child_drilldown: childDrilldown } : {}),
          projection_version: 1,
        },
      };
    } catch (error) {
      return {
        status: "unavailable",
        reason_code:
          error instanceof NurtureProtectedContentUnavailableError
            ? "protected_content_unavailable"
            : "projection_unavailable",
      };
    }
  }

  private async composeChildDrilldown(
    request: NurtureInstitutionClassDayDetailRequest,
    child: NonNullable<NurtureInstitutionClassDayDetailRequest["child_drilldown"]>,
    localDay: NurtureInstitutionLocalDay,
  ): Promise<NonNullable<NurtureInstitutionClassDayDetailProjectionV1["child_drilldown"]>> {
    const authority = await this.authority.resolve({
      workspace_id: request.workspace_id,
      participant_ref: request.participant_ref,
      ...(request.role_assignment_ref
        ? { role_assignment_ref: request.role_assignment_ref }
        : {}),
      at: request.snapshot_at,
      target: child.target,
      purpose_key: child.purpose_key,
      direction: child.direction,
      data_class: child.data_class,
    });
    if (
      authority.status === "denied" ||
      authority.level !== "grant_scope" ||
      !authority.child_scope?.child_process_ref ||
      authority.child_scope.care_group_ref !== request.care_group_ref
    ) {
      return {
        status: "unavailable",
        reason_code:
          authority.status === "denied" ? authority.reason_code : "not_authorized",
      };
    }
    const childProcessRef = authority.child_scope.child_process_ref;
    const evidencePage = await this.repository.loadChildDayEvidence({
      workspace_id: request.workspace_id,
      participant_id: request.participant_ref,
      child_process_ref: childProcessRef,
      care_group_ref: request.care_group_ref,
      local_date: request.local_date,
      snapshot_at: request.snapshot_at,
      direction: child.direction,
      data_class: child.data_class,
      local_day: localDay,
    });
    return {
      status: "available",
      child_process_ref: childProcessRef,
      purpose_key: child.purpose_key,
      direction: child.direction,
      data_class: child.data_class,
      evidence: evidencePage.rows.map((row): NurtureChildDayEvidence => {
        const sourceRef = this.issueRef({
          workspace_id: request.workspace_id,
          participant_id: request.participant_ref,
          kind:
            row.kind === "daily_care_log"
              ? "daily_care_log"
              : row.kind === "attendance"
                ? "attendance"
                : "communication",
          source_id: row.source_id,
        });
        switch (row.kind) {
          case "daily_care_log":
            return {
              kind: row.kind,
              source_ref: sourceRef,
              occurred_at: row.occurred_at,
              status: row.status,
              ...(row.summary ? { summary: row.summary } : {}),
            };
          case "attendance":
            return {
              kind: row.kind,
              source_ref: sourceRef,
              occurred_at: row.occurred_at,
              state: row.state,
            };
          case "communication":
            return {
              kind: row.kind,
              source_ref: sourceRef,
              occurred_at: row.occurred_at,
              direction: row.direction,
              author_side: row.author_side,
              ...(row.response_state ? { response_state: row.response_state } : {}),
            };
        }
      }),
      evidence_has_more: evidencePage.has_more,
    };
  }
}
