import { describe, expect, it } from "vitest";
import {
  CONTENT_REVISION_CONTRACT,
  currentContentRevisionValue,
  decideContentRevision,
  validateContentRevisionCommand,
  type NurtureContentRevisionCommand,
  type NurtureContentRevisionFacts,
  type NurtureContentRevisionV1,
} from "../../src/index.js";

const envelope = (ciphertext = "bm90ZQ") => ({
  algVersion: 1 as const,
  keyRef: "institution-note-key",
  ciphertext,
  integrityTag: "dGFn",
});

const placementFacts = (
  overrides: Partial<NurtureContentRevisionFacts> = {},
): NurtureContentRevisionFacts => ({
  subject_ref: "nurture:activity_placement:placement-1",
  subject_kind: "placement",
  actor_role_assignment_ref: "admin-role-1",
  revisions: [],
  current_placement: {
    state: "placed",
    activity_ref: "morning",
    decided_by: "schedule_window",
    placement_head: 1,
  },
  available_activity_refs: ["morning", "afternoon"],
  ...overrides,
});

const placementCommand = (
  overrides: Partial<Extract<NurtureContentRevisionCommand, { action: "adjust_activity_placement" }>> = {},
): Extract<NurtureContentRevisionCommand, { action: "adjust_activity_placement" }> => ({
  action: "adjust_activity_placement",
  workspace_id: "workspace-1",
  role_assignment_ref: "admin-role-1",
  expected_revision_head: 0,
  expected_placement_head: 1,
  source_kind: "care_capture",
  source_ref: "capture-1",
  activity_ref: "afternoon",
  reason: "Correct the activity",
  ...overrides,
});

const revision = (
  input: Partial<NurtureContentRevisionV1> & Pick<NurtureContentRevisionV1, "revision_head">,
): NurtureContentRevisionV1 => ({
  contract_version: CONTENT_REVISION_CONTRACT.version,
  revision_ref: `revision-${input.revision_head}`,
  subject_ref: "nurture:care_capture:capture-1",
  subject_kind: "visibility",
  previous_value: {
    hidden: false,
    publication_eligible: true,
    restricted_audiences: [],
  },
  new_value: {
    hidden: true,
    publication_eligible: true,
    restricted_audiences: [],
  },
  actor_ref: "admin-role-1",
  reason: "Narrow visibility",
  occurred_at: "2026-08-09T00:00:00.000Z",
  ...input,
});

describe("0D-3 append-only content revision", () => {
  it("turns an Admin placement change into a revision with the exact previous level", () => {
    expect(
      decideContentRevision({ command: placementCommand(), facts: placementFacts() }),
    ).toMatchObject({
      status: "ready",
      subject_kind: "placement",
      revision_head: 1,
      decided_by_before: "schedule_window",
      previous_value: {
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      },
      new_value: {
        state: "placed",
        activity_ref: "afternoon",
        decided_by: "admin",
      },
    });
  });

  it("refuses stale revision and placement heads instead of merging", () => {
    expect(
      decideContentRevision({
        command: placementCommand({ expected_revision_head: 1 }),
        facts: placementFacts(),
      }),
    ).toMatchObject({ status: "denied", layer: "concurrency", reason_code: "conflict" });
    expect(
      decideContentRevision({
        command: placementCommand({ expected_placement_head: 2 }),
        facts: placementFacts(),
      }),
    ).toMatchObject({ status: "denied", layer: "concurrency", reason_code: "conflict" });
  });

  it("refuses an empty reason before a revision can be prepared", () => {
    expect(
      validateContentRevisionCommand(placementCommand({ reason: "   " })),
    ).toEqual({ status: "invalid", reason_code: "contract_mismatch" });
  });

  it("does not manufacture a revision when the requested placement is already current", () => {
    const first: NurtureContentRevisionV1 = {
      contract_version: CONTENT_REVISION_CONTRACT.version,
      revision_ref: "placement-revision-1",
      subject_ref: "nurture:activity_placement:placement-1",
      subject_kind: "placement",
      previous_value: {
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      },
      new_value: { state: "placed", activity_ref: "morning", decided_by: "admin" },
      decided_by_before: "schedule_window",
      actor_ref: "admin-role-1",
      reason: "Confirm the placement",
      revision_head: 1,
      occurred_at: "2026-08-09T00:00:00.000Z",
    };
    expect(
      decideContentRevision({
        command: placementCommand({
          activity_ref: "morning",
          expected_revision_head: 1,
        }),
        facts: placementFacts({
          revisions: [first],
          current_placement: {
            state: "placed",
            activity_ref: "morning",
            decided_by: "admin",
            placement_head: 2,
          },
        }),
      }),
    ).toMatchObject({ status: "denied", reason_code: "conflict" });

    expect(
      decideContentRevision({
        command: placementCommand({
          activity_ref: "morning",
          expected_placement_head: 2,
          expected_revision_head: 1,
        }),
        facts: placementFacts({
          revisions: [first],
          current_placement: {
            state: "placed",
            activity_ref: "morning",
            decided_by: "admin",
            placement_head: 2,
          },
        }),
      }),
    ).toMatchObject({
      status: "already_satisfied",
      placement_head: 2,
      revision: { revision_head: 1 },
    });
  });

  it("makes widening and restoration unrepresentable at the command boundary", () => {
    const attempts = [
      {
        action: "downscope_content_visibility",
        workspace_id: "workspace-1",
        role_assignment_ref: "admin-role-1",
        expected_revision_head: 0,
        target_kind: "care_capture",
        target_ref: "capture-1",
        reason: "Try to unhide",
        hide: false,
      },
      {
        action: "downscope_content_visibility",
        workspace_id: "workspace-1",
        role_assignment_ref: "admin-role-1",
        expected_revision_head: 0,
        target_kind: "care_capture",
        target_ref: "capture-1",
        reason: "Try to restore",
        restore_publication: true,
      },
    ];
    for (const attempt of attempts) {
      expect(
        validateContentRevisionCommand(attempt as unknown as NurtureContentRevisionCommand),
      ).toEqual({ status: "invalid", reason_code: "contract_mismatch" });
    }
  });

  it("only accepts a closed protected envelope for institution notes", () => {
    const base = {
      action: "add_institution_note" as const,
      workspace_id: "workspace-1",
      role_assignment_ref: "admin-role-1",
      expected_revision_head: 0,
      target_kind: "care_capture" as const,
      target_ref: "capture-1",
      reason: "Add context",
    };
    expect(
      validateContentRevisionCommand({ ...base, note_body_envelope: envelope() }),
    ).toEqual({ status: "valid" });
    expect(
      validateContentRevisionCommand({
        ...base,
        note_body_envelope: {
          ...envelope(),
          embedding: [0.1, 0.2],
        },
      } as unknown as NurtureContentRevisionCommand),
    ).toEqual({ status: "invalid", reason_code: "contract_mismatch" });
  });

  it("rejects a partial or forked chain instead of returning it as complete", () => {
    const first = revision({ revision_head: 1 });
    const broken = revision({
      revision_head: 3,
      revision_ref: "revision-3",
      supersedes_ref: first.revision_ref,
      previous_value: first.new_value,
    });
    expect(
      currentContentRevisionValue({
        subject_ref: first.subject_ref,
        subject_kind: "visibility",
        actor_role_assignment_ref: "admin-role-1",
        revisions: [first, broken],
      }),
    ).toEqual({ status: "unavailable", reason_code: "incomplete_revision_chain" });
  });

  it("keeps mistaken and corrective revisions linked and readable", () => {
    const first = revision({ revision_head: 1 });
    const second = revision({
      revision_head: 2,
      revision_ref: "revision-2",
      supersedes_ref: first.revision_ref,
      previous_value: first.new_value,
      new_value: {
        hidden: true,
        publication_eligible: false,
        restricted_audiences: ["attributed_guardians"],
      },
      reason: "Further narrow after review",
    });
    expect(
      currentContentRevisionValue({
        subject_ref: first.subject_ref,
        subject_kind: "visibility",
        actor_role_assignment_ref: "admin-role-1",
        revisions: [first, second],
      }),
    ).toMatchObject({
      status: "valid",
      current_revision: { revision_ref: "revision-2", revision_head: 2 },
    });
  });
});
