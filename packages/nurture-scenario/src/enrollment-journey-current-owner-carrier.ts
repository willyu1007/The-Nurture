import {
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  type ScenarioCurrentOwnerBindingPairEvidenceV1,
} from "@my-chat/workflow-contracts";
import {
  validateEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
} from "./domain/institution/enrollment-waitlist.js";
import { parseNurtureBindingOwnerRef } from "./domain/identity/scenario-binding-owner.js";

/**
 * Host evidence scoped by the enclosing verified invocation. The carrier is
 * never a cache key, a reverse-lookup request or a Nurture business snapshot.
 */
export type NurtureEnrollmentJourneyCurrentOwnerCarrierV1 =
  | {
      carrierVersion: 1;
      currentOwnerEvidence: ScenarioCurrentOwnerBindingPairEvidenceV1 & {
        purpose_key: "enrollment_family_acceptance";
      };
      guardianAction: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
    }
  | {
      carrierVersion: 1;
      currentOwnerEvidence: ScenarioCurrentOwnerBindingPairEvidenceV1 & {
        purpose_key: "enrollment_trial_pair";
      };
    };

export function parseNurtureEnrollmentJourneyCurrentOwnerCarrierV1(
  value: unknown,
): NurtureEnrollmentJourneyCurrentOwnerCarrierV1 | null {
  if (!exactRecordOneOf(value, [
    ["carrierVersion", "currentOwnerEvidence"],
    ["carrierVersion", "currentOwnerEvidence", "guardianAction"],
  ]) || value.carrierVersion !== 1) return null;
  try {
    assertScenarioCurrentOwnerBindingPairEvidenceV1(
      value.currentOwnerEvidence,
      "current_owner_carrier.current_owner_evidence",
    );
  } catch {
    return null;
  }
  if (!validNurtureOwnerPair(value.currentOwnerEvidence)) return null;
  if (value.currentOwnerEvidence.purpose_key === "enrollment_trial_pair") {
    return exactRecord(value, ["carrierVersion", "currentOwnerEvidence"])
      ? {
          carrierVersion: 1,
          currentOwnerEvidence: {
            ...value.currentOwnerEvidence,
            purpose_key: "enrollment_trial_pair",
          },
        }
      : null;
  }
  if (
    value.currentOwnerEvidence.purpose_key !== "enrollment_family_acceptance" ||
    !exactRecord(value, ["carrierVersion", "currentOwnerEvidence", "guardianAction"]) ||
    !validateEnrollmentGuardianActionOwnerSnapshotV1(value.guardianAction)
  ) return null;
  return {
    carrierVersion: 1,
    currentOwnerEvidence: {
      ...value.currentOwnerEvidence,
      purpose_key: "enrollment_family_acceptance",
    },
    guardianAction: value.guardianAction,
  };
}

function validNurtureOwnerPair(
  evidence: ScenarioCurrentOwnerBindingPairEvidenceV1,
): boolean {
  const [child, family] = evidence.owner_bindings;
  try {
    return child.binding_slot === "child" &&
      child.owner_ref.namespace === "scenario-owner" &&
      child.owner_ref.object_type === "child_binding_owner" &&
      parseNurtureBindingOwnerRef(child.owner_ref.object_id).subjectType === "child" &&
      family.binding_slot === "family" &&
      family.owner_ref.namespace === "scenario-owner" &&
      family.owner_ref.object_type === "family_binding_owner" &&
      parseNurtureBindingOwnerRef(family.owner_ref.object_id).subjectType === "family";
  } catch {
    return false;
  }
}

function exactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function exactRecordOneOf(
  value: unknown,
  expectedKeySets: readonly (readonly string[])[],
): value is Record<string, unknown> {
  return expectedKeySets.some((expectedKeys) => exactRecord(value, expectedKeys));
}
