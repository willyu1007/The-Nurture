/**
 * The workbench's read surface. Every screen goes through these functions and
 * none of them import fixtures directly, so swapping in the real ingress is a
 * change to this file alone.
 *
 * The call shapes deliberately match the frozen contract rather than what the
 * screens would prefer:
 *
 *   openWorkbench()          -> the surface envelope; queue content is a list
 *                               of opaque itemRefs, not of displayable rows
 *   queryEnrollmentJourney() -> ONE projection for ONE target option
 *
 * Rendering a queue therefore means resolving each ref. That N+1 shape is the
 * contract's, not an implementation shortcut: `query_institution_enrollment_journey`
 * takes an empty input under an `owner_option_required` target policy and
 * returns a single `workflow`. No capability returns a list of projections.
 * `listQueueRows` below concentrates that fan-out in one place so a future
 * list capability replaces exactly one function.
 */

import type {
  AdminWaitlist,
  EnrollmentJourneyProjection,
  OpaqueRef,
  OwnerTargetOption,
  SurfaceEnvelope,
} from "@/lib/contracts/enrollment-journey";
import {
  ENVELOPE,
  FIXTURE_NOW,
  JOURNEYS,
  TARGET_OPTIONS,
  WAITLISTS,
} from "@/lib/fixtures/enrollment-journey";

/**
 * The clock the screens measure due dates against. Pinned to the fixture clock
 * today; becomes `Date.now()` when the real ingress lands.
 */
export function now(): number {
  return FIXTURE_NOW;
}

/** The workbench envelope for the current actor. */
export async function openWorkbench(): Promise<SurfaceEnvelope> {
  return ENVELOPE;
}

/** Owner-issued target options behind a module's itemRefs. */
export async function listTargetOptions(
  itemRefs: readonly OpaqueRef[],
): Promise<readonly OwnerTargetOption[]> {
  const byRef = new Map(TARGET_OPTIONS.map((option) => [option.targetOptionRef, option]));
  return itemRefs.flatMap((ref) => {
    const option = byRef.get(ref);
    return option ? [option] : [];
  });
}

/** One journey's projection. Returns null when the option no longer resolves. */
export async function queryEnrollmentJourney(
  targetOptionRef: OpaqueRef,
): Promise<EnrollmentJourneyProjection | null> {
  const runRef = targetOptionRef.replace(/^opt_/, "");
  return JOURNEYS.find((journey) => journey.workflowRunRef === runRef) ?? null;
}

/** A queue row: the projection plus the ref the actions need. */
export interface QueueRow {
  readonly targetOptionRef: OpaqueRef;
  readonly journey: EnrollmentJourneyProjection;
}

/**
 * Every journey in the queue module, resolved. This is the one place that pays
 * the per-item fan-out; when a list capability exists, only this body changes.
 * Refs that no longer resolve are dropped rather than rendered as blanks — an
 * expired option is not a row with missing data.
 */
export async function listQueueRows(): Promise<readonly QueueRow[]> {
  const envelope = await openWorkbench();
  const queue = envelope.content.find((module) => module.kind === "institution_workflow_queue");
  if (!queue?.itemRefs) return [];

  const resolved = await Promise.all(
    queue.itemRefs.map(async (targetOptionRef) => {
      const journey = await queryEnrollmentJourney(targetOptionRef);
      return journey ? { targetOptionRef, journey } : null;
    }),
  );
  return resolved.filter((row): row is QueueRow => row !== null);
}

/** Ordered waitlists, one per care group. Position is the entry's index. */
export async function listCapacityWaitlists(): Promise<readonly AdminWaitlist[]> {
  return WAITLISTS;
}

/** The waitlist position of a journey, 1-based, or null when not waitlisted. */
export async function waitlistPositionOf(targetOptionRef: OpaqueRef): Promise<number | null> {
  for (const waitlist of await listCapacityWaitlists()) {
    const index = waitlist.orderedEntries.findIndex(
      (entry) => entry.journeyTargetOptionRef === targetOptionRef,
    );
    if (index >= 0) return index + 1;
  }
  return null;
}
