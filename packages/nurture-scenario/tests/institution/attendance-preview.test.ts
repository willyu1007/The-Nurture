import { describe, expect, it, vi } from "vitest";
import {
  NurtureAttendancePreviewService,
  deterministicAttendanceInference,
  suggestedEntryStateFor,
  type NurtureAttendanceEvidence,
  type NurtureAttendanceInferenceProvider,
  type NurtureAttendancePreviewRepository,
} from "../../src/index.js";

/**
 * G4-B increment 2 — 0D-1 §2's type separation.
 *
 * Every failure mode here is two of the five types collapsing into one, so
 * most of these assert what must NOT happen: no default answer, no probability,
 * no attendance fact, and no presence inferred from silence.
 */

const evidence = (
  child_process_ref: string,
  overrides: Partial<NurtureAttendanceEvidence> = {},
): NurtureAttendanceEvidence => ({
  child_process_ref,
  sources: ["daily_care_log"],
  observation_count: 1,
  ...overrides,
});

const repositoryWith = (
  members: NurtureAttendanceEvidence[],
  overrides: Partial<NurtureAttendancePreviewRepository> = {},
): NurtureAttendancePreviewRepository => ({
  loadPreviewFacts: async () => ({ members }),
  recordInferenceRun: async () => undefined,
  ...overrides,
});

const compose = (
  members: NurtureAttendanceEvidence[],
  provider: NurtureAttendanceInferenceProvider = deterministicAttendanceInference,
  repository = repositoryWith(members),
) =>
  new NurtureAttendancePreviewService(repository, provider).compose({
    workspace_id: "workspace-1",
    care_group_ref: "group-1",
    local_date: "2026-08-09",
    current: { kind: "unsubmitted" },
  });

describe("0D-1 attendance preview and inference boundary (G4-B increment 2)", () => {
  it("suggests present only where evidence exists", async () => {
    const preview = await compose([evidence("child-1")]);
    expect(preview.members[0]).toMatchObject({
      inference: { state: "likely_present" },
      suggested_entry_state: "present",
    });
  });

  /**
   * The rule the deterministic provider exists to hold. Absence of evidence is
   * not evidence of absence — a child may have been present and unphotographed
   * — which is 0D-2's "missing records never mean no activity" applied to a
   * person.
   */
  it("never infers absence from silence", async () => {
    const preview = await compose([evidence("child-1", { sources: [], observation_count: 0 })]);
    expect(preview.members[0]!.inference.state).toBe("insufficient_evidence");
    expect(preview.members[0]!.inference.state).not.toBe("likely_absent");
  });

  /**
   * 0D-1 §2: `insufficient_evidence` is a first-class outcome, not a
   * low-confidence guess. It must reach the teacher as a blank, because a
   * pre-filled answer is what gets confirmed without being read.
   */
  it("hands the teacher no default when the inference cannot tell", async () => {
    const preview = await compose([evidence("child-1", { sources: [], observation_count: 0 })]);
    expect(preview.members[0]!.suggested_entry_state).toBeNull();
    expect(suggestedEntryStateFor("insufficient_evidence")).toBeNull();
  });

  it("carries no probability, score or confidence under any name", async () => {
    const preview = await compose([evidence("child-1")]);
    expect(Object.keys(preview.members[0]!.inference).sort()).toEqual([
      "child_process_ref",
      "evidence_refs",
      "state",
    ]);
    expect(Object.keys(preview.members[0]!.evidence).sort()).toEqual([
      "child_process_ref",
      "observation_count",
      "sources",
    ]);
  });

  /**
   * The hardest invariant in 0D-1: an inference can never produce an
   * `AttendanceFact`. The service holds it by having no path that writes one —
   * asserted as a runtime fact, not read off the code.
   */
  it("writes only the inference-run audit and nothing else", async () => {
    const recordInferenceRun = vi.fn(async () => undefined);
    const loadPreviewFacts = vi.fn(async () => ({ members: [evidence("child-1")] }));
    const repository: NurtureAttendancePreviewRepository = {
      loadPreviewFacts,
      recordInferenceRun,
    };
    await compose([evidence("child-1")], deterministicAttendanceInference, repository);
    expect(recordInferenceRun).toHaveBeenCalledTimes(1);
    // The port has exactly two methods, and neither writes a submission or an
    // entry. There is no third to call.
    expect(Object.keys(repository).sort()).toEqual(["loadPreviewFacts", "recordInferenceRun"]);
  });

  it("records the policy version the run was produced under", async () => {
    const recordInferenceRun = vi.fn(async () => undefined);
    await compose([evidence("child-1")], deterministicAttendanceInference, {
      loadPreviewFacts: async () => ({ members: [evidence("child-1")] }),
      recordInferenceRun,
    });
    expect(recordInferenceRun).toHaveBeenCalledWith(
      expect.objectContaining({
        policy_version: "nurture.attendance-inference.deterministic@1.0.0",
      }),
    );
  });

  /**
   * 0D-1 §6: a provider outage leaves the preview usable. Denying a teacher
   * the ability to close out their day because a suggestion service is down
   * would make the inference load-bearing, which is exactly what it is not.
   */
  it("opens with evidence and no inference when the provider fails", async () => {
    const recordInferenceRun = vi.fn(async () => undefined);
    const failing: NurtureAttendanceInferenceProvider = {
      policy_version: "failing@1.0.0",
      infer: async () => {
        throw new Error("provider unavailable");
      },
    };
    const preview = await compose([evidence("child-1")], failing, {
      loadPreviewFacts: async () => ({ members: [evidence("child-1")] }),
      recordInferenceRun,
    });
    expect(preview.members).toHaveLength(1);
    expect(preview.members[0]).toMatchObject({
      inference: { state: "insufficient_evidence" },
      suggested_entry_state: null,
    });
    // No run happened, so none is recorded — an audit row for a run that never
    // produced anything would misreport what the teacher was shown.
    expect(recordInferenceRun).not.toHaveBeenCalled();
  });

  it("keeps a member the provider skipped, as insufficient evidence", async () => {
    const partial: NurtureAttendanceInferenceProvider = {
      policy_version: "partial@1.0.0",
      infer: async () => [
        { child_process_ref: "child-1", state: "likely_present", evidence_refs: [] },
      ],
    };
    const preview = await compose([evidence("child-1"), evidence("child-2")], partial);
    // The class does not shrink because a provider returned a short list.
    expect(preview.members).toHaveLength(2);
    expect(preview.members[1]).toMatchObject({
      child_process_ref: "child-2",
      inference: { state: "insufficient_evidence" },
      suggested_entry_state: null,
    });
  });

  it("carries the head a submission built from this preview must use", async () => {
    const service = new NurtureAttendancePreviewService(
      repositoryWith([evidence("child-1")]),
      deterministicAttendanceInference,
    );
    await expect(
      service.compose({
        workspace_id: "workspace-1",
        care_group_ref: "group-1",
        local_date: "2026-08-09",
        current: { kind: "unsubmitted" },
      }),
    ).resolves.toMatchObject({ expected_head: 0, current_state: "unsubmitted" });
    await expect(
      service.compose({
        workspace_id: "workspace-1",
        care_group_ref: "group-1",
        local_date: "2026-08-09",
        current: { kind: "submitted", submission_head: 3, local_date: "2026-08-09" },
      }),
    ).resolves.toMatchObject({ expected_head: 3, current_state: "submitted" });
  });

  it("maps every inference state exactly once, with no default arm", () => {
    expect(suggestedEntryStateFor("likely_present")).toBe("present");
    expect(suggestedEntryStateFor("likely_absent")).toBe("absent");
    expect(suggestedEntryStateFor("insufficient_evidence")).toBeNull();
  });
});
