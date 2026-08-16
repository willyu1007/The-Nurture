/**
 * Types mirrored from the frozen surface contract. This file is the swap
 * boundary: when the scenario service exposes the workbench ingress, only
 * `lib/queries` changes and these shapes stay put.
 *
 * Sources, all under packages/nurture-scenario/contracts/surfaces/v1/source:
 *   capabilities/contracts/enrollment-journey-types.schema.json
 *   capabilities/contracts/query-enrollment-journey.schema.json
 *   surfaces/surface-envelope.schema.json
 *   invocation/target-option.schema.json
 *
 * Nothing here may gain a field the schema does not have. Display text the
 * schema does not carry is composed in the view layer, never invented here.
 */

/** Owner-issued handle. Never a database id, never parsed by the client. */
export type OpaqueRef = string;

/** `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$` */
export type StableKey = string;

export type JourneyStage =
  | "inquiry"
  | "intent_conversation"
  | "visit_or_consultation"
  | "capacity_waitlist"
  | "trial_preparation"
  | "trial_in_progress"
  | "trial_review"
  | "formal_enrollment_confirmation"
  | "completed"
  | "closed";

export type WaitingState =
  | "ready"
  | "waiting_on_guardian"
  | "waiting_on_caregiver"
  | "waiting_on_system"
  | "scheduled_future"
  | "blocked";

export type PendingTransition =
  | "none"
  | "trial_start_pending"
  | "formalization_pending"
  | "exit_pending";

export type JourneyLifecycle = "active" | "completed" | "closed_without_formalization";

export type JourneyMilestone =
  | "inquiry_started"
  | "intent_confirmed"
  | "visit_recorded"
  | "waitlist_qualified"
  | "trial_offer_accepted"
  | "trial_started"
  | "trial_review_reached"
  | "trial_extended"
  | "formal_proposed"
  | "guardian_formal_acceptance_recorded"
  | "preparation_cancelled"
  | "trial_ended"
  | "formal_enrollment_committed"
  | "journey_completed";

export type ProjectionState = "active" | "waiting" | "blocked" | "completed" | "closed";

/** Who the journey is currently on. This is the queue's grouping key. */
export type ResponsibleRole =
  | "institution_admin"
  | "guardian"
  | "caregiver"
  | "system_owner"
  | "none";

/**
 * One journey's actor-safe read model. `safeSummary` is the only human-readable
 * line the contract carries — there is no structured child, class, or intake
 * field here, by design.
 */
export interface EnrollmentJourneyProjection {
  readonly contractVersion: "1.0.0";
  readonly workflowRunRef: OpaqueRef;
  readonly workflowType: "EnrollmentJourneyWorkflowV1";
  readonly safeTitle: "Enrollment journey";
  readonly safeSummary: string;
  readonly state: ProjectionState;
  readonly lifecycle: JourneyLifecycle;
  readonly currentStage: JourneyStage;
  readonly waitingState: WaitingState;
  readonly pendingTransition: PendingTransition;
  readonly completedMilestones: readonly JourneyMilestone[];
  readonly safeBlocker?: string;
  readonly nextAction: string;
  readonly responsibleRole: ResponsibleRole;
  readonly dueAt?: string;
  readonly workflowHead: number;
  readonly projectionVersion: 1;
  readonly startedAt: string;
  readonly updatedAt: string;
}

/** Owner-issued selectable target. The label is all the client gets up front. */
export interface OwnerTargetOption {
  readonly targetOptionRef: OpaqueRef;
  readonly label: string;
  readonly sourceLabel?: string;
  readonly expiresAt: string;
}

export type ActionAvailability = "available" | "already_satisfied" | "needs_input";

export interface ActionRef {
  readonly capabilityKey: StableKey;
  readonly capabilityVersion: string;
  readonly targetOptionRef?: OpaqueRef;
  readonly availability: ActionAvailability;
}

export interface PageInfo {
  readonly nextCursor?: OpaqueRef;
  readonly hasMore: boolean;
}

export type WorkbenchModuleKind =
  | "hub"
  | "list"
  | "insight"
  | "institution_workflow_queue"
  | "grant_request_management"
  | "people_operations"
  | "daily_operations"
  | "communication_review"
  | "knowledge_management";

/**
 * One module of the workbench envelope. `itemRefs` is a list of opaque handles,
 * not of displayable rows — resolving each one is a separate query.
 */
export interface WorkbenchModule {
  readonly moduleKey: StableKey;
  readonly kind: WorkbenchModuleKind;
  readonly required: boolean;
  readonly title?: string;
  readonly summary?: string;
  readonly collectionRef?: OpaqueRef;
  readonly itemRefs?: readonly OpaqueRef[];
  readonly actionRefs: readonly ActionRef[];
  readonly pageInfo?: PageInfo;
}

export type SurfaceState = "ready" | "limited" | "needs_setup" | "unavailable";

export interface SurfaceEnvelope {
  readonly surfaceKey: StableKey;
  readonly surfaceVersion: string;
  readonly state: SurfaceState;
  readonly snapshotRef: OpaqueRef;
  readonly snapshotVersion: number;
  readonly generatedAt: string;
  readonly contentFamily: "workbench";
  readonly content: readonly WorkbenchModule[];
  readonly actions: readonly ActionRef[];
  readonly pageInfo?: PageInfo;
  readonly dependencyNoGos: readonly StableKey[];
}

/** One waitlist row. There is no rank field: order is the array's order. */
export interface AdminWaitlistEntry {
  readonly journeyTargetOptionRef: OpaqueRef;
  readonly targetClassSafeLabel: string;
  readonly lifecycle: "active" | "offer_open";
  readonly continuedInterest: "confirmed" | "waiting_on_guardian";
  readonly categoryKey: StableKey;
  readonly categoryBasisKey: StableKey;
  readonly policyRef: OpaqueRef;
  readonly policyRevision: number;
  readonly waitlistQualifiedAt: string;
  readonly nextReviewAt: string;
  readonly lastConfirmedAt: string;
  readonly hasOpenOffer: boolean;
}

/** One care group's ordered waitlist. Position is meaningful only inside it. */
export interface AdminWaitlist {
  readonly contractVersion: "1.0.0";
  readonly targetCareGroupRef: OpaqueRef;
  readonly targetClassSafeLabel: string;
  readonly orderedEntries: readonly AdminWaitlistEntry[];
}
