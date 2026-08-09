import type {
  NurtureAttendanceEntryState,
  NurtureAttendanceCurrentState,
} from "./attendance-closeout.js";

/**
 * G4-B increment 2 — preview and the inference boundary, frozen by 0D-1 §2.
 *
 * Increment 1 built the write path and took entries from the caller. This
 * builds what a teacher actually confirms: the day's evidence, a non-canonical
 * suggestion over it, and the watermark saying where the read cut.
 *
 * The whole point of the unit is the separation. Every failure mode here is
 * two of the five 0D-1 types collapsing into one.
 */

/**
 * `AttendanceEvidence` — a derived projection over rows that already have
 * owners. It gets no table: persisting it would be a second copy of facts the
 * care log, the capture and the attribution already hold.
 */
export type NurtureAttendanceEvidence = {
  child_process_ref: string;
  /** Which owners contributed, never their bodies. */
  sources: Array<"daily_care_log" | "care_capture" | "confirmed_media_attribution">;
  /** How many corroborating rows, for the teacher to judge — never a score. */
  observation_count: number;
};

/**
 * 0D-1 §2. Discrete semantics only — no probability, score or percentage.
 *
 * `insufficient_evidence` is a first-class outcome rather than a low-confidence
 * guess. An inference forced to answer will answer wrongly, and the teacher
 * confirming it cannot tell the difference.
 */
export type NurtureAttendanceInferenceState =
  | "likely_present"
  | "likely_absent"
  | "insufficient_evidence";

export type NurtureAttendanceInference = {
  child_process_ref: string;
  state: NurtureAttendanceInferenceState;
  /** Opaque refs the suggestion rests on, for audit. Never content. */
  evidence_refs: string[];
};

/**
 * Where the read cut. 0D-1 §5 requires reusing the stable-prefix shape
 * `NurtureCareCaptureBatch` already carries rather than inventing a second
 * watermark whose drift against the first would be undetectable — so the cut
 * is expressed in the batch's own already-cut sequence, not in a counter this
 * unit maintains.
 */
export type NurtureAttendanceWatermark = {
  source_kind: "care_capture_batch";
  source_sequence: number;
};

export type NurtureAttendancePreview = {
  care_group_ref: string;
  local_date: string;
  /** The class's enrolled population — scope, never a protected fact. */
  members: Array<{
    child_process_ref: string;
    evidence: NurtureAttendanceEvidence;
    inference: NurtureAttendanceInference;
    /** What a submission would carry if the teacher accepted the suggestion. */
    suggested_entry_state: NurtureAttendanceEntryState | null;
  }>;
  /** Absent when the day has no cut batch to anchor to. */
  watermark?: NurtureAttendanceWatermark;
  /** The head a submission built from this preview must carry. */
  expected_head: number;
  current_state: NurtureAttendanceCurrentState["kind"];
};

/**
 * The evidence read, inside whatever transaction the caller holds. The
 * population comes from enrolment — who is in the class is scope, not a
 * protected fact, exactly as 0C-5 §5 established for aggregates.
 */
export type NurtureAttendancePreviewRepository = {
  loadPreviewFacts(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<{
    members: NurtureAttendanceEvidence[];
    watermark?: NurtureAttendanceWatermark;
  }>;
  recordInferenceRun(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    policy_version: string;
    evidence_refs: string[];
  }): Promise<void>;
};

/**
 * The inference provider. Deliberately a port: 0D-1 freezes what an inference
 * MAY be, not how it is produced, and a model belongs behind this boundary
 * rather than inside it.
 */
export type NurtureAttendanceInferenceProvider = {
  policy_version: string;
  infer(input: {
    care_group_ref: string;
    local_date: string;
    evidence: NurtureAttendanceEvidence[];
  }): Promise<NurtureAttendanceInference[]>;
};

/**
 * The deterministic provider, and the reason it cannot say `likely_absent`.
 *
 * Evidence of presence is evidence; **absence of evidence is not evidence of
 * absence**. A child with no record today may have been present and
 * unphotographed — the same rule 0D-2 froze for activities, where missing
 * records never mean "no activity". So this provider answers
 * `insufficient_evidence`, and a teacher decides.
 *
 * `likely_absent` stays in the union because a later provider with a real
 * absence signal — a leave record, a guardian notification — could justify it.
 * Nothing in this one can.
 */
export const deterministicAttendanceInference: NurtureAttendanceInferenceProvider = {
  policy_version: "nurture.attendance-inference.deterministic@1.0.0",
  async infer({ evidence }) {
    return evidence.map((entry) => ({
      child_process_ref: entry.child_process_ref,
      state:
        entry.observation_count > 0
          ? ("likely_present" as const)
          : ("insufficient_evidence" as const),
      evidence_refs: entry.sources,
    }));
  },
};

/**
 * What a submission would carry if the teacher accepted the suggestion.
 *
 * `insufficient_evidence` maps to **nothing**, not to a default. This is the
 * boundary 0D-1 §2 exists to hold: an inference that cannot tell must not
 * hand the teacher a pre-filled answer, because a pre-filled answer is what
 * gets confirmed without being read.
 */
export const suggestedEntryStateFor = (
  inference: NurtureAttendanceInferenceState,
): NurtureAttendanceEntryState | null => {
  switch (inference) {
    case "likely_present":
      return "present";
    case "likely_absent":
      return "absent";
    case "insufficient_evidence":
      return null;
  }
};

/**
 * Composes the preview. It writes an inference-run audit row and **nothing
 * else** — no submission, no entry, no attendance fact. 0D-1's hardest
 * invariant is that an inference can never produce an `AttendanceFact`, and
 * the way this service holds it is by having no path that writes one.
 */
export class NurtureAttendancePreviewService {
  constructor(
    private readonly repository: NurtureAttendancePreviewRepository,
    private readonly provider: NurtureAttendanceInferenceProvider,
  ) {}

  async compose(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    current: NurtureAttendanceCurrentState;
  }): Promise<NurtureAttendancePreview> {
    const facts = await this.repository.loadPreviewFacts({
      workspace_id: input.workspace_id,
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
    });

    let inferences: NurtureAttendanceInference[] = [];
    try {
      inferences = await this.provider.infer({
        care_group_ref: input.care_group_ref,
        local_date: input.local_date,
        evidence: facts.members,
      });
    } catch {
      // 0D-1 §6: the preview still opens with evidence and no inference, and
      // the teacher confirms without one. A provider outage must not deny a
      // teacher the ability to close out their day.
      inferences = [];
    }
    const byChild = new Map(inferences.map((entry) => [entry.child_process_ref, entry]));

    if (inferences.length > 0) {
      await this.repository.recordInferenceRun({
        workspace_id: input.workspace_id,
        care_group_ref: input.care_group_ref,
        local_date: input.local_date,
        policy_version: this.provider.policy_version,
        evidence_refs: inferences.flatMap((entry) => entry.evidence_refs),
      });
    }

    return {
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
      members: facts.members.map((evidence) => {
        // A member the provider skipped is not left without an answer: the
        // absent inference IS insufficient evidence, which is the honest
        // reading and keeps the member list and the inference list from
        // disagreeing about who is in the class.
        const inference = byChild.get(evidence.child_process_ref) ?? {
          child_process_ref: evidence.child_process_ref,
          state: "insufficient_evidence" as const,
          evidence_refs: [],
        };
        return {
          child_process_ref: evidence.child_process_ref,
          evidence,
          inference,
          suggested_entry_state: suggestedEntryStateFor(inference.state),
        };
      }),
      ...(facts.watermark ? { watermark: facts.watermark } : {}),
      expected_head: input.current.kind === "unsubmitted" ? 0 : input.current.submission_head,
      current_state: input.current.kind,
    };
  }
}
