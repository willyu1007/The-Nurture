import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurtureCaregiverWriteAuthority,
} from "./publish-process-transaction.js";

type DomainContextRef = CanonicalRef;

/** One capture row as the organize cut consumes it: sealed body, stored markers. */
export type NurtureOrganizeCaptureRow = {
  capture_id: string;
  kind: "text" | "voice_transcript" | "media";
  stable: boolean;
  source_sequence: number;
  occurred_at: string;
  /** Sealed envelope; only the command layer, which holds the key, may open it. */
  body_envelope?: unknown;
  transcript_revision?: string;
  /**
   * Stored intake-time safety rule keys. `undefined` means "never derived" —
   * a different fact from an empty list, and the route must fail closed on it.
   */
  safety_markers?: string[];
  media_asset_id?: string;
};

/** One class family the cut may target: identity plus the authorizing Grant. */
export type NurtureOrganizeTargetFact = {
  child_care_process_id: string;
  enrollment_id: string;
  family_id: string;
  grant_id: string;
  enrollment_active: boolean;
  grant_allows: boolean;
};

export type NurtureOrganizeCutFacts = {
  authority: NurtureCaregiverWriteAuthority;
  /** Exact role episode that authorizes the future scheduler attempt. */
  authorizing_role_assignment_id: string;
  care_group_id: string;
  /** The instant this read was true at; every window decision is judged here. */
  read_at: string;
  /** The institution's content-safety policy identity; absent fails the route closed. */
  safety_policy?: { policy_ref: string; policy_head: number };
  /**
   * The T-007 organize-parameter subset, resolved from the institution's
   * explicit policy payload. Absent means "not resolved" — the cut fails
   * closed, never a default window.
   */
  organize_policy?: {
    policy_ref: string;
    policy_head: number;
    institution_ref: string;
    policy_version: number;
    time_zone: string;
    default_release_local_time: string;
    retry_cutoff_local_time: string;
    organize_idle_seconds: number;
    organize_fallback_lead_seconds: number;
    automatic_quiescence_seconds: number;
    capture_activity_lease_seconds: number;
    automatic_organize_enabled: boolean;
    effective_from: string;
    effective_to?: string;
  };
  batch?: {
    batch_id: string;
    /** The `capture_batch must_equal` head. */
    batch_version: number;
    state: string;
    captures: NurtureOrganizeCaptureRow[];
  };
  /** Families of this exact CareGroup eligible for a daily-care publication. */
  targets: NurtureOrganizeTargetFact[];
};

export type NurtureOrganizeCutApplyInput = {
  workspace_id: string;
  participant_id: string;
  command_request_id: string;
  batch_id: string;
  expected_batch_version: number;
  included_capture_ids: string[];
  organizer_input_revision: string;
  /**
   * The exact policy-backed trigger evidence that cut this batch. The owner
   * persists the durable subset instead of reconstructing it from the route.
   */
  trigger_evidence: {
    trigger: "manual" | "idle" | "daily_fallback";
    policy_ref: string;
    policy_head: number;
    time_zone: string;
    quiescence_seconds: number;
    observed_user_activity_at: string;
  };
  /**
   * Recorded for every route. `direct_interaction_required` deliberately
   * creates no process, and the most safety-relevant decision of all must
   * still be addressable — the assessment anchors on the CareGroup.
   */
  safety: {
    route: string;
    policy_ref: string;
    policy_head: number;
    rule_revision: string;
    risk_codes: string[];
  };
  watermark: { source_sequence: number; cut_at: string };
  /**
   * Present only when the cut produced a publication candidate. A
   * direct-interaction cut organizes the batch without creating any process.
   */
  process?: {
    process_key: string;
    state: "draft" | "needs_review";
    data_class: string;
    purpose_key: string;
    content_digest: string;
    title_envelope: unknown;
    body_envelope?: unknown;
    /** The owner binds each to the asset's own immutable media revision. */
    media_asset_ids: string[];
    /** The owner-issued source refs later edits must retain provenance from. */
    source_refs: string[];
    authorizing_role_assignment_id: string;
    targets: Array<{
      target_key: string;
      child_care_process_id: string;
      enrollment_id: string;
      family_id: string;
      grant_id: string;
    }>;
  };
};

export type NurtureOrganizeCutApplied = {
  batch_ref: DomainContextRef;
  process_ref?: DomainContextRef;
  process_revision?: number;
};

/**
 * Canonical-owner writes behind the organize cut. One command commits the
 * batch transition and — when the route allows one — the PublishProcess, its
 * first revision and its target rows together: a cut that organized the batch
 * but lost its candidate would strand the captures invisibly.
 */
export type NurtureClassNoteCaptureApplied =
  | { status: "applied"; capture_id: string; batch_id: string }
  | { status: "not_authorized" }
  | { status: "batch_unavailable" };

export type NurtureCareCaptureTransaction = {
  loadOrganizeCutFacts(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    command_request_id: string;
  }): Promise<NurtureOrganizeCutFacts | null>;

  applyOrganizeCut(input: NurtureOrganizeCutApplyInput): Promise<NurtureOrganizeCutApplied>;

  /**
   * W7 single-step class note: a stable text capture appended to the class's
   * collecting batch (opening one when none is collecting). Class-internal —
   * no publication candidate, release or family-visibility claim is produced.
   * Optional so pre-W7 adapters keep compiling; the W7 command fails closed
   * when it is absent.
   */
  applyClassNoteCapture?(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    body_envelope: unknown;
    occurred_at: string;
  }): Promise<NurtureClassNoteCaptureApplied>;
};
