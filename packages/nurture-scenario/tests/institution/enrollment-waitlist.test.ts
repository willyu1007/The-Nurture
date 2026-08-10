import { describe, expect, it } from "vitest";
import {
  validateEnrollmentGuardianActionOwnerSnapshotV1,
  validateEnrollmentFormalizationOwnerEvidenceV1,
  validateFormalizeEnrollmentPayload,
  validateProposeFormalEnrollmentPayload,
  validatePrepareTrialRelationshipPayload,
  validateQualifyCapacityWaitlistPayload,
  validateTrialGrantTermsSnapshotV1,
  validateTrialPairOwnerSnapshotV1,
} from "../../src/index.js";

const guardianAction = () => ({
  contract_version: "1.0.0" as const,
  actor_ref: {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: "guardian_actor",
    object_id: "guardian-01",
    version: 1,
  },
  contact_ref: {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: "prospective_contact",
    object_id: "contact-01",
    version: 1,
  },
  action_ref: {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: "enrollment_action",
    object_id: "action-01",
    version: 1,
  },
  occurred_at: "2026-08-10T01:00:00.000Z",
  verified_at: "2026-08-10T01:00:01.000Z",
});

const qualification = () => ({
  workspace_id: "workspace-01",
  institution_ref: "institution-01",
  role_assignment_ref: "role-admin-01",
  workflow_ref: "workflow-01",
  expected_workflow_head: 4,
  target_care_group_ref: "class-01",
  expected_capacity_revision: 0,
  category_key: "standard",
  category_basis_key: "family_confirmed",
  next_review_at: "2026-08-20T01:00:00.000Z",
  family_acceptance_owner_snapshot: guardianAction(),
});

describe("G4-D increment 3 waitlist command contracts", () => {
  it("accepts exact owner facts and rejects future-before-source verification", () => {
    expect(validateEnrollmentGuardianActionOwnerSnapshotV1(guardianAction())).toBe(true);
    expect(
      validateEnrollmentGuardianActionOwnerSnapshotV1({
        ...guardianAction(),
        verified_at: "2026-08-10T00:59:59.000Z",
      }),
    ).toBe(false);
  });

  it("requires exact full-class qualification inputs", () => {
    expect(validateQualifyCapacityWaitlistPayload(qualification())).toBe(true);
    expect(
      validateQualifyCapacityWaitlistPayload({
        ...qualification(),
        family_value_score: 99,
      }),
    ).toBe(false);
    expect(
      validateQualifyCapacityWaitlistPayload({
        ...qualification(),
        next_review_at: "not-an-instant",
      }),
    ).toBe(false);
  });

  it("does not accept a caller-issued waitlist ordering instant", () => {
    expect(
      validateQualifyCapacityWaitlistPayload({
        ...qualification(),
        waitlist_qualified_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});

const pairOwner = () => ({
  contract_version: "1.0.0" as const,
  actor_ref: {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: "actor",
    object_id: "guardian-01",
    version: 1,
  },
  guardian_participant_ref: "guardian-participant-01",
  guardian_role_assignment_ref: "guardian-role-01",
  child_owner_ref:
    "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
  child_owner_version: 1,
  family_owner_ref:
    "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
  family_owner_version: 1,
  child_association_ref: "child-association-01",
  child_association_head: 1,
  family_association_ref: "family-association-01",
  family_association_head: 1,
  child_care_process_ref: "child-process-01",
  verified_at: "2026-08-10T01:00:00.000Z",
  expires_at: "2026-08-11T01:00:00.000Z",
});

const grantTerms = () => ({
  contract_version: "1.0.0" as const,
  policy_ref: "trial-care-policy",
  policy_revision: 1,
  directions: ["family_to_org", "org_to_family"] as const,
  data_classes: ["daily_care_log"] as const,
  purposes: ["trial_care"] as const,
  verified_at: "2026-08-10T01:00:00.000Z",
  expires_at: "2026-08-20T01:00:00.000Z",
});

describe("G4-D increment 4 trial lifecycle command contracts", () => {
  it("requires current pair heads and exact bidirectional Grant terms", () => {
    expect(validateTrialPairOwnerSnapshotV1(pairOwner())).toBe(true);
    expect(validateTrialGrantTermsSnapshotV1(grantTerms())).toBe(true);
    expect(
      validateTrialGrantTermsSnapshotV1({
        ...grantTerms(),
        directions: ["org_to_family", "family_to_org"],
      }),
    ).toBe(false);
    expect(
      validateTrialPairOwnerSnapshotV1({
        ...pairOwner(),
        family_owner_ref: "my_chat:family:01",
      }),
    ).toBe(false);
    expect(
      validateTrialPairOwnerSnapshotV1({
        ...pairOwner(),
        actor_ref: { ...pairOwner().actor_ref, object_type: "guardian_actor" },
      }),
    ).toBe(false);
  });

  it("does not accept caller-created deadline, blocker, or automatic-transition state", () => {
    const payload = {
      workspace_id: "workspace-01",
      institution_ref: "institution-01",
      workflow_ref: "workflow-01",
      expected_workflow_head: 6,
      role_assignment_ref: "role-admin-01",
      reservation_ref: "reservation-01",
      expected_reservation_head: 1,
      expected_capacity_revision: 0,
      pair_owner_snapshot: pairOwner(),
      grant_terms_snapshot: grantTerms(),
    };
    expect(validatePrepareTrialRelationshipPayload(payload)).toBe(true);
    expect(
      validatePrepareTrialRelationshipPayload({
        ...payload,
        automatic_start_at: "2026-08-10T03:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      validatePrepareTrialRelationshipPayload({
        ...payload,
        blocker_state: "waiting_for_owner",
      }),
    ).toBe(false);
  });
});

const currentOwnerEvidence = () => ({
  contract_version: "1.0.0" as const,
  actor_ref: {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: "actor",
    object_id: "guardian-01",
    version: 1,
  },
  audience: "nurture" as const,
  current_owner_evidence: {
    binding_evidence_version: 1 as const,
    purpose_key: "formalize_enrollment",
    owner_bindings: [
      {
        owner_binding_ref_version: 1 as const,
        binding_slot: "child",
        owner_ref: {
          schema_version: 1 as const,
          namespace: "scenario-owner",
          object_type: "child_binding_owner",
          object_id:
            "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
          version: 1,
        },
      },
      {
        owner_binding_ref_version: 1 as const,
        binding_slot: "family",
        owner_ref: {
          schema_version: 1 as const,
          namespace: "scenario-owner",
          object_type: "family_binding_owner",
          object_id:
            "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
          version: 1,
        },
      },
    ] as const,
    pair_relation_evidence_hash: "1".repeat(64),
    current_owner_evidence_hash: "2".repeat(64),
  },
  request_nonce_hash: "3".repeat(64),
  verified_at: "2026-08-10T02:00:00.000Z",
  expires_at: "2026-08-10T02:01:00.000Z",
});

describe("G4-D increment 5 formalization command contracts", () => {
  it("accepts only the frozen proposal and purpose-bound current-owner evidence", () => {
    const proposal = {
      workspace_id: "workspace-01",
      institution_ref: "institution-01",
      workflow_ref: "workflow-01",
      expected_workflow_head: 11,
      role_assignment_ref: "admin-role-01",
      reservation_ref: "reservation-01",
      expected_reservation_head: 3,
      enrollment_ref: "enrollment-01",
      expected_enrollment_head: 1,
      grant_ref: "grant-01",
      expected_grant_head: 2,
      expected_capacity_revision: 0,
      proposed_formal_start_at: "2026-08-10T03:00:00.000Z",
      proposed_grant_purposes: ["trial_care"],
      proposed_grant_expires_at: "2026-08-20T03:00:00.000Z",
      safe_family_summary: "Guardian reviewed the formal continuation.",
      proposal_expires_at: "2026-08-11T03:00:00.000Z",
      reason_key: "admin_proposed_formal_continuation",
    };
    expect(validateProposeFormalEnrollmentPayload(proposal)).toBe(true);
    expect(
      validateProposeFormalEnrollmentPayload({
        ...proposal,
        formalization_deadline_state: "blocked",
      }),
    ).toBe(false);
    expect(validateEnrollmentFormalizationOwnerEvidenceV1(currentOwnerEvidence())).toBe(true);
    expect(
      validateEnrollmentFormalizationOwnerEvidenceV1({
        ...currentOwnerEvidence(),
        current_owner_evidence: {
          ...currentOwnerEvidence().current_owner_evidence,
          purpose_key: "start_trial",
        },
      }),
    ).toBe(false);
  });

  it("does not accept local scope, role, lifecycle, or evidence hash overrides", () => {
    const payload = {
      workflow_ref: "workflow-01",
      proposal_ref: "proposal-01",
      acceptance_ref: {
        schema_version: 1 as const,
        namespace: "my_chat",
        object_type: "enrollment_action",
        object_id: "formal-acceptance-01",
        version: 1,
      },
      accepted_at: "2026-08-10T02:00:00.000Z",
      expected_workflow_head: 12,
      expected_proposal_head: 1,
      expected_enrollment_head: 1,
      expected_grant_head: 2,
      expected_reservation_head: 3,
      owner_evidence: currentOwnerEvidence(),
    };
    expect(validateFormalizeEnrollmentPayload(payload)).toBe(true);
    expect(
      validateFormalizeEnrollmentPayload({
        ...payload,
        expected_proposal_head: 2,
      }),
    ).toBe(false);
    for (const forbidden of [
      "workspace_id",
      "institution_ref",
      "role_assignment_ref",
      "participation_phase",
      "owner_evidence_hash",
    ]) {
      expect(validateFormalizeEnrollmentPayload({ ...payload, [forbidden]: "forged" })).toBe(false);
    }
  });
});
