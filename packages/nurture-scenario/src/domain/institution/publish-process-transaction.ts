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
};
