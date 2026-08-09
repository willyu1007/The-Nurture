export { createPrismaClient, type NurturePrismaClient } from "./client.js";
// Re-export the Prisma namespace so the host (apps/backend) can type Json
// inputs without importing @prisma/client directly (db stays the sole importer).
export { Prisma } from "@prisma/client";
export * from "./repositories/port-repositories.js";
export * from "./repositories/institution-core.repositories.js";
export * from "./repositories/institution-context.repository.js";
export * from "./repositories/attendance-closeout.repository.js";
export * from "./repositories/attendance-preview.repository.js";
export * from "./repositories/institution-class-list.repository.js";
export * from "./repositories/institution-class-day-detail.repository.js";
export * from "./repositories/institution-support-signal.repository.js";
export * from "./repositories/institution-support-signal.owner-providers.js";
export * from "./repositories/class-schedule-placement.repository.js";
export * from "./repositories/care-capture-placement-intake.js";
export * from "./repositories/content-revision.repository.js";
export * from "./repositories/attribution-correction-candidate.repository.js";
export * from "./repositories/family-care-query.repository.js";
export * from "./repositories/user-attention.repository.js";
export * from "./repositories/family-care-command.transaction.js";
export * from "./repositories/scenario-repositories.js";
export * from "./repositories/scenario-binding-owner.repository.js";
export * from "./binding-evidence-hasher.js";
export * from "./protected-content.js";
export * from "./repositories/submit-eligibility.read.js";
export * from "./repositories/caregiver-direct-message-eligibility.read.js";
export * from "./repositories/family-care-harness-query.read.js";
export * from "./repositories/institution-business-communication.read.js";
export * from "./repositories/board-read-support.js";
export * from "./repositories/guardian-board.read.js";
export * from "./repositories/caregiver-board.read.js";
export * from "./repositories/board-mutation.transaction.js";
export * from "./repositories/publish-process.transaction.js";
export * from "./repositories/publish-schedule.support.js";
export * from "./repositories/publish-queue-admission.service.js";
export * from "./repositories/media-attribution.transaction.js";
export * from "./repositories/publication-safety.transaction.js";
export * from "./repositories/care-capture.transaction.js";
export * from "./repositories/publish-lane.read.js";
export * from "./repositories/care-capture.read.js";
export * from "./repositories/institution-publication-policy.read.js";
export * from "./repositories/media-safety.read.js";
export * from "./repositories/publication-release.transaction.js";
export * from "./repositories/family-growth-binding.read.js";
export * from "./repositories/family-growth-outbox.transaction.js";
export * from "./repositories/family-growth-emission.preparer.js";
export * from "./repositories/family-growth-rendition.read.js";
export * from "./c30/nonce-store.js";
export * from "./c30/participant-binding.js";
export * from "./c30/pair-association.repository.js";
export * from "./c30/subject-presentation.repository.js";
export * from "./c30/canonical-action.repository.js";
export * from "./c30/protected-content.repository.js";

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
