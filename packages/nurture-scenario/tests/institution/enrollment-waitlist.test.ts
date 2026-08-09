import { describe, expect, it } from "vitest";
import {
  validateEnrollmentGuardianActionOwnerSnapshotV1,
  validateQualifyCapacityWaitlistPayload,
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
