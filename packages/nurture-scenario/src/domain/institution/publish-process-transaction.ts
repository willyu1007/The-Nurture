import type { CanonicalRef } from "@my-chat/workflow-contracts";

type DomainContextRef = CanonicalRef;

/**
 * The four facts that decide whether a caregiver may *write* a CareGroup-owned
 * fact: a current `caregiver | lead_caregiver` RoleAssignment whose own scope is
 * the exact source CareGroup. An Institution-scoped Lead designation, an Admin
 * role, Institution membership or a same-Institution role in another CareGroup
 * is insufficient.
 *
 * It is declared here, on the owner-write side, and the board read projection's
 * `CaregiverFactAuthorityV1` extends it. One declaration means the prepare step
 * (which reads through the query port) and the execute step (which re-reads
 * through this transaction port) cannot drift into two vocabularies for the
 * same rule — the eligibility predicate is literally the same function.
 */
export type NurtureCaregiverWriteAuthority = {
  role: string;
  role_scope_type: string;
  role_scope_matches_source: boolean;
  role_assignment_current: boolean;
};

/**
 * The owner's answer, re-read inside the command transaction, for a pre-release
 * `cancel_publish_process`.
 */
export type NurturePublishProcessCancelFacts = {
  authority: NurtureCaregiverWriteAuthority;
  /**
   * The owner's own handle for the row it found. An idempotent repeat names
   * this ref, so `already_satisfied` points at a fact the owner just returned
   * rather than at one the capability reconstructed.
   */
  publish_process_ref: DomainContextRef;
  process_state: string;
  /** The head the compare-and-set writes against. */
  process_version: number;
  /** Any committed per-target release closes the pre-release cancel window. */
  committed_release_count: number;
  /**
   * Present exactly while the process is already cancelled. It is the instant
   * the owner recorded, so an idempotent repeat answers from the stored fact
   * rather than inventing one.
   */
  cancelled_at?: string;
};

/**
 * The head the `publish_edit_hold must_equal` binding freezes.
 *
 * `0` means "no live hold" and is reserved: a real row is floored at 1 by
 * `ck_nurture_publish_edit_hold_version_floor`. Sharing 0 between absence and a
 * freshly created hold would let an acquire prepared against absence pass its
 * head check against a hold another class teacher took in between.
 */
export const NO_PUBLISH_EDIT_HOLD_VERSION = 0;

export type NurturePublishEditHoldFacts = {
  authority: NurtureCaregiverWriteAuthority;
  publish_process_ref: DomainContextRef;
  process_state: string;
  /**
   * The instant this read was true at. Every expiry decision and every new hold
   * window is measured from exactly this value: a rule that read its own clock
   * would answer at a different moment than the row it is judging, and "the hold
   * was live when the owner looked" would stop being checkable.
   */
  read_at: string;
  /** The stored hold, whether or not it has expired; expiry is the rule's call. */
  current_hold?: {
    holder_participant_id: string;
    holder_label: string;
    expires_at: string;
    hold_version: number;
  };
};

export type NurturePublishDraftFacts = NurturePublishEditHoldFacts & {
  /** `0` while the process has no saved revision at all. */
  current_revision: number;
  known_source_refs: string[];
  /** The current revision's media composition, in stored order. */
  composition: Array<{ media_asset_id: string; media_revision: number }>;
  /** Set when this exact command identity already produced a revision. */
  replayed_revision?: { revision: number; content_digest: string; saved_at: string };
};

/**
 * The protected shape a draft save hands the owner. The command layer seals the
 * plaintext; the owner stores envelopes and never derives, logs or re-reads the
 * body.
 */
export type NurturePublishDraftContent = {
  title_envelope: unknown;
  body_envelope: unknown;
  content_digest: string;
};

/**
 * Canonical-owner writes behind the T-006 publish-process lifecycle. The board
 * is an operable projection, not a fact owner: each write re-reads the owner
 * inside the command transaction and updates the owner row under its own
 * expected version, so a concurrent change makes the write match zero rows
 * instead of overwriting a newer one.
 */
export type NurturePublishProcessTransaction = {
  loadPublishProcessCancelFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<NurturePublishProcessCancelFacts | null>;
  applyPublishProcessCancel(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    expected_process_version: number;
    cancelled_at: string;
  }): Promise<{ publish_process_ref: DomainContextRef; cancelled_at: string }>;

  loadPublishEditHoldFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<NurturePublishEditHoldFacts | null>;
  /**
   * Take or extend the one hold on this process. `expected_hold_version` is
   * `NO_PUBLISH_EDIT_HOLD_VERSION` when the caller prepared against no hold, and
   * the exact row version when extending one it already holds.
   */
  applyPublishEditHoldGrant(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    expected_hold_version: number;
    expires_at: string;
  }): Promise<{ publish_process_ref: DomainContextRef; expires_at: string }>;
  applyPublishEditHoldRelease(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    expected_hold_version: number;
  }): Promise<{ publish_process_ref: DomainContextRef }>;

  loadPublishDraftFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
  }): Promise<NurturePublishDraftFacts | null>;
  applyPublishProcessDraftSave(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
    expected_draft_revision: number;
    content: NurturePublishDraftContent;
  }): Promise<{
    publish_process_ref: DomainContextRef;
    revision: number;
    saved_at: string;
  }>;

  /**
   * Detach one media reference: appends a new revision whose composition no
   * longer carries the asset. Everything else — title, body, sources, the
   * assembler lineage — is carried forward unchanged; the asset itself, other
   * drafts and anything published are untouched.
   */
  applyPublishProcessMediaDetach(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
    expected_draft_revision: number;
    media_asset_id: string;
  }): Promise<{
    publish_process_ref: DomainContextRef;
    revision: number;
    remaining_media_count: number;
    /** The composed revision of the entry that was removed, for the display ref. */
    detached_media_revision: number;
  }>;
};
