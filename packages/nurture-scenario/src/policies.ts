import type { WorkflowPolicies } from "./types.js";

const valueAsString = (input: Record<string, unknown>, key: string): string | undefined => {
  const value = input[key];
  return typeof value === "string" ? value : undefined;
};

const hasApprovedExposure = (input: Record<string, unknown>): boolean => {
  const exposureLevel = valueAsString(input, "exposure_level");
  return exposureLevel === "L1" || exposureLevel === "L2";
};

const hasGuardianApproval = (input: Record<string, unknown>): boolean => input["guardian_approval"] === true;

const isMedicalEscalationRequired = (input: Record<string, unknown>): boolean => {
  const safetyFlag = valueAsString(input, "health_safety_flag");
  return safetyFlag === "urgent" || safetyFlag === "diagnosis_requested" || safetyFlag === "medication_requested";
};

export const nurturePolicies: WorkflowPolicies = {
  async "nurture.can_create_public_draft_handoff"(input) {
    return hasApprovedExposure(input) && hasGuardianApproval(input) && !isMedicalEscalationRequired(input);
  },
  async "nurture.can_create_knowledge_candidate_handoff"(input) {
    return hasApprovedExposure(input) && !isMedicalEscalationRequired(input);
  },
  async "nurture.can_create_notification_handoff"(input) {
    return !isMedicalEscalationRequired(input);
  },
  async "nurture.can_expose_artifact"(input) {
    return hasApprovedExposure(input) || valueAsString(input, "exposure_level") === "L3";
  },
  async "nurture.medical_safety_boundary"(input) {
    return !isMedicalEscalationRequired(input);
  },
};
