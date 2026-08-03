import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type { NurtureCaregiverWriteAuthority } from "./publish-process-transaction.js";

type DomainContextRef = CanonicalRef;

/**
 * The head value that means "this child has no attribution at all". A real
 * revision is floored at 1 by `ck_nurture_media_attribution_revision_floor`,
 * so absence and a first fact can never report the same number — the same
 * reservation the edit hold needed for version 0.
 */
export const NO_CHILD_ATTRIBUTION_REVISION = 0;

export type NurtureChildAttributionRowFacts = {
  attribution_id: string;
  child_care_process_id: string;
  status: string;
  revision: number;
  source: string;
  /** Stored decision instant; absent exactly while the fact is a candidate. */
  decided_at?: string;
};

/**
 * The owner's answer, re-read inside the command transaction, for the three
 * child-media attribution decisions. `attributions` is one CURRENT fact per
 * child — the highest revision — never the history.
 */
export type NurtureMediaAttributionWriteFacts = {
  authority: NurtureCaregiverWriteAuthority;
  /** The owner's own handle for the asset row, for `output_refs`. */
  media_asset_ref: DomainContextRef;
  media_lifecycle: string;
  /** The exact immutable original-media revision the decision binds to. */
  media_revision: number;
  /** Children of the asset's exact CareGroup the actor may attribute to. */
  eligible_child_ids: string[];
  attributions: NurtureChildAttributionRowFacts[];
};

export type NurtureAttributionAppendInput = {
  child_care_process_id: string;
  /** `NO_CHILD_ATTRIBUTION_REVISION` when the child has no attribution yet. */
  expected_revision: number;
  /**
   * The source is the owner's call: a `confirmed` append is always recorded as
   * `manual` (whatever proposed the candidate), and a rejected or superseded
   * append inherits the row's own stored source — the owner copies it from the
   * row rather than round-tripping it through the domain's lossy display
   * mapping.
   */
  state: "confirmed" | "rejected" | "superseded";
};

export type NurtureAttributionAppendedRow = {
  attribution_ref: DomainContextRef;
  child_care_process_id: string;
  revision: number;
  state: string;
  source: string;
  /** The instant the owner stored, which every later read reproduces. */
  decided_at: string;
};

/**
 * Canonical-owner writes behind the G3-C1 attribution decisions. Every
 * decision APPENDS a new revision per (asset, child) — confirmed history is
 * never overwritten — and the per-revision unique is the compare-and-set: a
 * concurrent decision on the same child collides on the revision it also
 * tried to append.
 */
export type NurtureMediaAttributionTransaction = {
  loadMediaAttributionWriteFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<NurtureMediaAttributionWriteFacts | null>;
  /**
   * Appends every decision row atomically. For a supersession the first
   * append is the from-child's superseded revision and the second the
   * to-child's confirmed one; the owner links the superseded row to the
   * confirmed row it was corrected in favour of.
   */
  applyChildAttributionAppends(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
    appends: NurtureAttributionAppendInput[];
    link_supersession: boolean;
  }): Promise<{
    media_asset_ref: DomainContextRef;
    rows: NurtureAttributionAppendedRow[];
  }>;
};
