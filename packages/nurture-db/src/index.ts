export { createPrismaClient, type NurturePrismaClient } from "./client.js";
// Re-export the Prisma namespace so the host (apps/backend) can type Json
// inputs without importing @prisma/client directly (db stays the sole importer).
export { Prisma } from "@prisma/client";
export * from "./repositories/port-repositories.js";
export * from "./repositories/scenario-repositories.js";

// Re-export Prisma-generated model TYPES as the data layer's domain entities,
// so host consumers depend on @the-nurture/db (not @prisma/client) and the
// scenario business layer stays Prisma-free (it depends only on the ports).
export type {
  NurtureFamilyProfileSnapshot,
  NurtureChildProfileSnapshot,
  NurtureFamilyCharter,
  NurtureFamilyCharterItem,
  NurtureFocusCycle,
  NurtureFocusGoal,
  NurtureFamilyQuantificationSnapshot,
  NurtureMetricDefinition,
  NurtureMetricObservation,
  NurtureContextMaterial,
  NurtureRuntimeContextPack,
  NurtureWorkflowProject,
  NurtureWorkflowCapture,
  NurtureWorkflowCheckpoint,
  NurtureWorkflowReview,
  NurtureFamilyPolicy,
  NurtureEvidence,
  NurtureProfileProjection as NurtureProfileProjectionRow,
  NurtureActivityComparisonDraft as NurtureActivityComparisonDraftRow,
  NurtureEvidenceRef,
  NurtureActivityOption,
  NurtureHealthStateSummary,
} from "@prisma/client";

// Re-export Prisma enum runtime values (usable by the host / internal API).
export {
  NurtureIssueType,
  NurtureProjectStatus,
  NurtureCaptureType,
  NurtureCaptureSourceSurface,
  NurtureCaptureInputModality,
  NurtureCaptureExtractionStatus,
  NurtureCaptureStatus,
  NurtureMetricValueKind,
  NurtureMetricSubjectType,
  NurtureMetricSourceType,
  NurtureMetricObservationStatus,
  NurtureSnapshotType,
  NurtureSnapshotSourceType,
  NurtureSnapshotStatus,
  NurtureContextLayer,
  NurtureMaterialAudience,
  NurtureMaterialSubjectType,
  NurtureFreshnessLevel,
  NurtureSensitivityLevel,
  NurtureMaterialStatus,
  NurtureMaterialSourceType,
  NurtureMaterialType,
  NurturePackType,
  NurturePackAudience,
  NurturePackPurpose,
  NurturePackTriggerType,
  NurturePackStatus,
} from "@prisma/client";
