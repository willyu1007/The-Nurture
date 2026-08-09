import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_CORRECTION_CONTRACT,
  NurtureAttributionCorrectionCandidateQueryService,
  decideAttributionCorrectionCandidate,
  validateAttributionCorrectionCommand,
  type NurtureAttributionCorrectionCandidateV1,
  type NurtureAttributionCorrectionFacts,
  type NurtureRaiseAttributionCorrectionCommand,
} from "../../src/index.js";

const command = (
  overrides: Partial<NurtureRaiseAttributionCorrectionCommand> = {},
): NurtureRaiseAttributionCorrectionCommand => ({
  action: "raise_attribution_correction",
  workspace_id: "workspace-1",
  role_assignment_ref: "admin-role-1",
  source_attribution_ref: "attribution-revision-1",
  reason: "The pictured child appears to be different",
  ...overrides,
});

const facts = (
  overrides: Partial<NurtureAttributionCorrectionFacts> = {},
): NurtureAttributionCorrectionFacts => ({
  source_attribution_ref: "attribution-revision-1",
  actor_role_assignment_ref: "admin-role-1",
  actor_role_kind: "institution_admin",
  ...overrides,
});

describe("0D-4 attribution correction candidate", () => {
  it("lets only the explicitly selected Admin role raise a sourced report", () => {
    expect(
      decideAttributionCorrectionCandidate({ command: command(), facts: facts() }),
    ).toEqual({
      status: "ready",
      source_attribution_ref: "attribution-revision-1",
      actor_role_assignment_ref: "admin-role-1",
      reason: "The pictured child appears to be different",
    });
    expect(
      decideAttributionCorrectionCandidate({
        command: command({ role_assignment_ref: "caregiver-role-1" }),
        facts: facts({
          actor_role_assignment_ref: "caregiver-role-1",
          actor_role_kind: "caregiver",
        }),
      }),
    ).toEqual({ status: "denied", layer: "authority", reason_code: "not_authorized" });
    expect(
      decideAttributionCorrectionCandidate({
        command: command(),
        facts: facts({ actor_role_assignment_ref: "different-admin-role" }),
      }),
    ).toEqual({ status: "unavailable", reason_code: "attribution_owner_unavailable" });
  });

  it("denies a missing source as contract_mismatch", () => {
    expect(validateAttributionCorrectionCommand(command({ source_attribution_ref: "" }))).toEqual({
      status: "invalid",
      reason_code: "contract_mismatch",
    });
  });

  it("has no lifecycle that time can advance into canonical attribution", async () => {
    const candidate: NurtureAttributionCorrectionCandidateV1 = {
      contract_version: ATTRIBUTION_CORRECTION_CONTRACT.version,
      candidate_ref: "candidate-1",
      source_attribution_ref: "attribution-revision-1",
      raised_by_role_assignment_ref: "admin-role-1",
      reason: "Review the attribution",
      occurred_at: "2020-01-01T00:00:00.000Z",
    };
    const service = new NurtureAttributionCorrectionCandidateQueryService({
      loadAttributionCorrectionFacts: async () => ({
        status: "resolved",
        facts: facts({ actor_role_kind: "caregiver" }),
      }),
      listAttributionCorrectionCandidates: async () => ({
        status: "resolved",
        source_attribution_ref: candidate.source_attribution_ref,
        candidates: [candidate],
      }),
    });
    const result = await service.query({
      workspace_id: "workspace-1",
      participant_ref: "caregiver-1",
      role_assignment_ref: "caregiver-role-1",
      source_attribution_ref: "attribution-revision-1",
    });
    expect(result).toMatchObject({ status: "resolved", candidates: [candidate] });
    const storedShape = Object.keys(candidate);
    expect(storedShape).not.toContain("state");
    expect(storedShape).not.toContain("head");
    expect(storedShape).not.toContain("expires_at");
    expect(storedShape).not.toContain("resolved_at");
    expect(JSON.stringify(result)).not.toMatch(/publishable|embedding/i);
  });
});
