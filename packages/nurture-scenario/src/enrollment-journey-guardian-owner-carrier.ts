import {
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  type ScenarioCurrentOwnerBindingPairEvidenceV1,
} from "@my-chat/workflow-contracts";
import {
  validateEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
} from "./domain/institution/enrollment-waitlist.js";
import { isValidNurtureOwnerPairEvidence } from "./enrollment-journey-current-owner-carrier.js";

/**
 * Host-owned Guardian action evidence for chat/mobile Enrollment Journey
 * operations. Formalization additionally carries the current Child/Family
 * pair; Nurture derives every local role, association and Grant fact again.
 */
export type NurtureEnrollmentJourneyGuardianOwnerCarrierV1 =
  | {
      carrierVersion: 1;
      guardianAction: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
    }
  | {
      carrierVersion: 1;
      guardianAction: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
      currentOwnerEvidence: ScenarioCurrentOwnerBindingPairEvidenceV1 & {
        purpose_key: "formalize_enrollment";
      };
    };

export function parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1(
  value: unknown,
): NurtureEnrollmentJourneyGuardianOwnerCarrierV1 | null {
  if (
    !isRecord(value)
    || value.carrierVersion !== 1
    || !validateEnrollmentGuardianActionOwnerSnapshotV1(value.guardianAction)
  ) return null;
  const keys = Object.keys(value).sort();
  if (sameKeys(keys, ["carrierVersion", "guardianAction"])) {
    return {
      carrierVersion: 1,
      guardianAction: value.guardianAction,
    };
  }
  if (!sameKeys(keys, [
    "carrierVersion",
    "currentOwnerEvidence",
    "guardianAction",
  ])) return null;
  try {
    assertScenarioCurrentOwnerBindingPairEvidenceV1(
      value.currentOwnerEvidence,
      "guardian_owner_carrier.current_owner_evidence",
    );
  } catch {
    return null;
  }
  return value.currentOwnerEvidence.purpose_key === "formalize_enrollment"
    && isValidNurtureOwnerPairEvidence(value.currentOwnerEvidence)
    ? {
        carrierVersion: 1,
        guardianAction: value.guardianAction,
        currentOwnerEvidence: {
          ...value.currentOwnerEvidence,
          purpose_key: "formalize_enrollment",
        },
      }
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameKeys(actual: readonly string[], expected: readonly string[]): boolean {
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}
