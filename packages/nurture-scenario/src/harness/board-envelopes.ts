import {
  issueSnapshotRef,
  projectOwnerActions,
  type BoardActionRefV1,
  type BoardPageInfoV1,
  type BoardQueryDecision,
  type BoardScopeV1,
} from "./board-projection.js";
import {
  QUERY_GUARDIAN_CURRENT_FOCUS_CAPABILITY,
  QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY,
  queryGuardianCurrentFocus,
  queryGuardianEnrollmentActivity,
  type GuardianBoardDependencies,
} from "./guardian-board-queries.js";
import {
  QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY,
  queryCaregiverChildToday,
  type CaregiverBoardDependencies,
} from "./caregiver-board-queries.js";
import {
  QUERY_CAREGIVER_FAMILY_CARE_WORK_CAPABILITY,
  queryCaregiverFamilyCareWork,
  type FamilyCareQueryDependencies,
} from "./family-care-queries.js";
import {
  QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY,
  queryTeacherPublishQueue,
  type TeacherPublishQueueReadPort,
} from "./teacher-publish-queue.js";
import { issueTargetOptionRef, resolveTargetOptionRef } from "./keyed-refs.js";
import type { InterfaceContractRefV1 } from "../surface-contract/types.js";

/**
 * G3-A role-safe board envelopes.
 *
 * An envelope is a derived result: it carries module order, counts, opaque
 * item refs, current-eligibility actions and dependency NO-GOs. It is never
 * persisted as a unified child-state row and is never mutation authority. The
 * two presenters are separate on purpose — neither loads the other role's facts
 * and then hides fields.
 */
export const QUERY_GUARDIAN_FAMILY_BOARD_CAPABILITY = {
  key: "query_guardian_family_board",
  version: "1.0.0",
} as const;

export const QUERY_CAREGIVER_TEACHER_BOARD_CAPABILITY = {
  key: "query_caregiver_teacher_board",
  version: "1.0.0",
} as const;

export type BoardSurfaceStateV1 = "ready" | "limited" | "needs_setup" | "unavailable";

export type BoardDependencyNoGoV1 = {
  dependencyKey: string;
  requiredVersion: string;
  reason: "missing" | "unqualified" | "unavailable" | "contract_mismatch";
  retryHint: "retry" | "setup" | "required_upgrade" | "contact_admin" | "none";
};

export type BoardModuleV1 = {
  moduleKey: string;
  kind: string;
  required: boolean;
  title?: string;
  summary?: string;
  count?: number;
  sourceLabel?: string;
  itemRefs?: string[];
  actionRefs: BoardActionRefV1[];
  pageInfo?: BoardPageInfoV1;
};

export type BoardSurfaceEnvelopeV1 = {
  contract: InterfaceContractRefV1;
  surfaceKey: string;
  surfaceVersion: string;
  state: BoardSurfaceStateV1;
  snapshotRef: string;
  snapshotVersion: number;
  generatedAt: string;
  actorContext: {
    role: "guardian" | "caregiver" | "lead_caregiver" | "institution_admin";
    scopeRef: string;
    scopeLabel: string;
    subjectRef?: string;
    subjectLabel?: string;
  };
  contentFamily: "board";
  content: BoardModuleV1[];
  actions: BoardActionRefV1[];
  pageInfo?: BoardPageInfoV1;
  dependencyNoGos: BoardDependencyNoGoV1[];
};

/**
 * Registry-sourced surface identity. Module order is never re-declared here:
 * the caller passes the exact `orderedContentKinds` of the admitted surface
 * contract, so the envelope cannot drift from the registry it claims.
 */
export type BoardSurfaceRegistrationV1 = {
  surfaceKey: string;
  surfaceVersion: string;
  orderedContentKinds: readonly string[];
};

/**
 * The Guardian Workflow projection is optional in the first G3 profile and the
 * Caregiver one is explicitly denied by the exact `1.8.0` visibility matrix.
 * The Caregiver presenter therefore has no branch that can emit it at all.
 */
const CAREGIVER_DENIED_MODULE_KINDS: readonly string[] = ["institution_workflow_projection"];

const GUARDIAN_MODULE_POLICY: Record<string, { required: boolean }> = {
  guardian_current_focus: { required: true },
  guardian_enrollment_activity: { required: true },
  institution_workflow_projection: { required: false },
};

/**
 * The publish queue lists class work as soon as G3-B1 exists, but nothing can
 * be scheduled until the T-007 publication-policy provider resolves a send
 * window, so the board reports that dependency rather than implying it can send.
 */
export const PUBLICATION_POLICY_NO_GO: BoardDependencyNoGoV1 = {
  dependencyKey: "t007_publication_policy",
  requiredVersion: "1.0.0",
  reason: "missing",
  retryHint: "contact_admin",
};

// ---------------------------------------------------------------------------

export type GuardianBoardEnvelopeDependencies = GuardianBoardDependencies & {
  surface: BoardSurfaceRegistrationV1;
};

export const presentGuardianFamilyBoard = async (
  deps: GuardianBoardEnvelopeDependencies,
  request: BoardScopeV1 & { enrollment_target_ref?: string; page_size?: unknown },
): Promise<BoardQueryDecision<BoardSurfaceEnvelopeV1>> => {
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const now = (deps.now ?? (() => new Date()))();
  const generatedAt = now.toISOString();
  let scopeFacts = await deps.reads.loadGuardianScope({
    ...scope,
    snapshot_at: generatedAt,
  });
  if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };

  // unique_eligible_default at the family level: an option ref naming an
  // enrollment of ANOTHER reachable family rebinds the whole board to that
  // family — label, focus and activity together — rather than mixing two
  // families in one envelope.
  if (request.enrollment_target_ref) {
    const selected = resolveTargetOptionRef(
      deps.integrity_key,
      scope,
      request.enrollment_target_ref,
      scopeFacts.eligible_enrollments.map((entry) => entry.enrollment_id),
    );
    const selectedFamily = scopeFacts.eligible_enrollments.find(
      (entry) => entry.enrollment_id === selected,
    )?.family_id;
    if (selectedFamily && selectedFamily !== scopeFacts.family_id) {
      scopeFacts = await deps.reads.loadGuardianScope({
        ...scope,
        snapshot_at: generatedAt,
        bind_family_id: selectedFamily,
      });
      if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };
    }
  }

  // One scope, one instant, shared by every module in this envelope.
  const resolvedScope = { facts: scopeFacts, snapshot_at: generatedAt };
  const focus = await queryGuardianCurrentFocus(deps, { ...scope, resolved_scope: resolvedScope });
  if (focus.status !== "ok") return focus;

  // Owner target selection: an explicit owner-issued option ref, or the unique
  // eligible Enrollment. With several eligible Enrollments and no option the
  // activity module stays empty rather than guessing a child.
  const uniqueEnrollment =
    scopeFacts.eligible_enrollments.length === 1
      ? scopeFacts.eligible_enrollments[0]
      : undefined;
  const enrollmentTargetRef =
    request.enrollment_target_ref ??
    (uniqueEnrollment
      ? issueTargetOptionRef(deps.integrity_key, {
          ...scope,
          enrollment_id: uniqueEnrollment.enrollment_id,
        })
      : undefined);

  const activity = enrollmentTargetRef
    ? await queryGuardianEnrollmentActivity(deps, {
        ...scope,
        enrollment_target_ref: enrollmentTargetRef,
        resolved_scope: resolvedScope,
        ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
      })
    : undefined;
  if (activity && activity.status !== "ok") return activity;

  const modules = new Map<string, BoardModuleV1>();
  const focusItems = [...focus.output.childFocus, ...focus.output.familyFocus];
  modules.set("guardian_current_focus", {
    moduleKey: "guardian_current_focus",
    kind: "guardian_current_focus",
    required: true,
    count: focusItems.length,
    itemRefs: focusItems.map((card) => card.focusRef),
    actionRefs: projectOwnerActions(
      deps.integrity_key,
      scope,
      scopeFacts.module_action_grants.guardian_current_focus ?? [],
    ),
    pageInfo: focus.output.pageInfo,
  });
  modules.set("guardian_enrollment_activity", {
    moduleKey: "guardian_enrollment_activity",
    kind: "guardian_enrollment_activity",
    required: true,
    count: activity ? activity.output.items.length : 0,
    itemRefs: activity ? activity.output.items.map((item) => item.activityRef) : [],
    actionRefs: projectOwnerActions(
      deps.integrity_key,
      scope,
      scopeFacts.module_action_grants.guardian_enrollment_activity ?? [],
    ),
    ...(activity ? { pageInfo: activity.output.pageInfo } : {}),
  });

  const scopeRef = focus.output.binding.actor.scopeRef;
  return {
    status: "ok",
    output: {
      contract: deps.contract,
      surfaceKey: deps.surface.surfaceKey,
      surfaceVersion: deps.surface.surfaceVersion,
      // An absent optional Workflow projection never degrades the core board.
      state: scopeFacts.eligible_enrollments.length === 0 ? "needs_setup" : "ready",
      snapshotRef: issueSnapshotRef(deps.integrity_key, scope, {
        contractDigest: deps.contract.digest,
        capabilityKey: QUERY_GUARDIAN_FAMILY_BOARD_CAPABILITY.key,
        capabilityVersion: QUERY_GUARDIAN_FAMILY_BOARD_CAPABILITY.version,
        scopeRef,
        snapshotAt: generatedAt,
      }),
      snapshotVersion: scopeFacts.snapshot_version,
      generatedAt,
      actorContext: {
        role: "guardian",
        scopeRef,
        scopeLabel: scopeFacts.family_label,
      },
      contentFamily: "board",
      content: orderModules(deps.surface, modules, GUARDIAN_MODULE_POLICY),
      actions: projectOwnerActions(deps.integrity_key, scope, scopeFacts.surface_action_grants),
      dependencyNoGos: [],
    },
  };
};

// ---------------------------------------------------------------------------

export type CaregiverBoardEnvelopeDependencies = CaregiverBoardDependencies & {
  surface: BoardSurfaceRegistrationV1;
  /** The exact existing T-005 query is consumed directly; T-006 keeps no copy. */
  family_care_work: FamilyCareQueryDependencies;
  publish_queue: TeacherPublishQueueReadPort;
};

export const presentCaregiverTeacherBoard = async (
  deps: CaregiverBoardEnvelopeDependencies,
  request: BoardScopeV1 & { page_size?: unknown },
): Promise<BoardQueryDecision<BoardSurfaceEnvelopeV1>> => {
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const now = (deps.now ?? (() => new Date()))();
  const generatedAt = now.toISOString();
  const scopeFacts = await deps.reads.loadCaregiverScope({
    ...scope,
    snapshot_at: generatedAt,
  });
  if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };

  const childToday = await queryCaregiverChildToday(deps, {
    ...scope,
    // One scope, one instant, shared by every module in this envelope.
    resolved_scope: { facts: scopeFacts, snapshot_at: generatedAt },
    ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
  });
  if (childToday.status !== "ok") return childToday;

  const familyCareWork = await queryCaregiverFamilyCareWork(deps.family_care_work, scope);
  if (familyCareWork.status !== "ok") return familyCareWork;

  const publishQueue = await queryTeacherPublishQueue(
    { ...deps, reads: deps.publish_queue },
    scopeFacts,
    { ...scope, ...(request.page_size !== undefined ? { page_size: request.page_size } : {}) },
  );
  if (publishQueue.status !== "ok") return publishQueue;

  const modules = new Map<string, BoardModuleV1>();
  modules.set("caregiver_child_today", {
    moduleKey: "caregiver_child_today",
    kind: "caregiver_child_today",
    required: true,
    count: childToday.output.children.length,
    itemRefs: childToday.output.children.map((card) => card.childRef),
    actionRefs: projectOwnerActions(
      deps.integrity_key,
      scope,
      scopeFacts.module_action_grants.caregiver_child_today ?? [],
    ),
    pageInfo: childToday.output.pageInfo,
  });
  modules.set("caregiver_family_care_work", {
    moduleKey: "caregiver_family_care_work",
    kind: "caregiver_family_care_work",
    required: true,
    count: familyCareWork.output.items.length,
    itemRefs: familyCareWork.output.items.map((item) => item.careItemRef),
    // The T-005 query already projects its own current-eligibility actions;
    // the board never re-derives or widens them.
    actionRefs: dedupeActions(familyCareWork.output.items.flatMap((item) => item.actions)),
    pageInfo: familyCareWork.output.pageInfo,
  });
  modules.set("teacher_publish_queue", {
    moduleKey: "teacher_publish_queue",
    kind: "teacher_publish_queue",
    required: true,
    count: publishQueue.output.items.length,
    itemRefs: publishQueue.output.items.map((item) => item.processRef),
    actionRefs: projectOwnerActions(
      deps.integrity_key,
      scope,
      scopeFacts.module_action_grants.teacher_publish_queue ?? [],
    ),
    pageInfo: publishQueue.output.pageInfo,
  });

  const dependencyNoGos = scopeFacts.publication_policy_resolved ? [] : [PUBLICATION_POLICY_NO_GO];

  return {
    status: "ok",
    output: {
      contract: deps.contract,
      surfaceKey: deps.surface.surfaceKey,
      surfaceVersion: deps.surface.surfaceVersion,
      state: dependencyNoGos.length > 0 ? "limited" : "ready",
      snapshotRef: issueSnapshotRef(deps.integrity_key, scope, {
        contractDigest: deps.contract.digest,
        capabilityKey: QUERY_CAREGIVER_TEACHER_BOARD_CAPABILITY.key,
        capabilityVersion: QUERY_CAREGIVER_TEACHER_BOARD_CAPABILITY.version,
        scopeRef: childToday.output.careGroupRef,
        snapshotAt: generatedAt,
      }),
      snapshotVersion: scopeFacts.snapshot_version,
      generatedAt,
      actorContext: {
        role: "caregiver",
        scopeRef: childToday.output.careGroupRef,
        scopeLabel: scopeFacts.care_group_label,
      },
      contentFamily: "board",
      content: orderModules(deps.surface, modules, {
        caregiver_child_today: { required: true },
        caregiver_family_care_work: { required: true },
        teacher_publish_queue: { required: true },
      }).filter((module) => !CAREGIVER_DENIED_MODULE_KINDS.includes(module.kind)),
      actions: projectOwnerActions(deps.integrity_key, scope, scopeFacts.surface_action_grants),
      dependencyNoGos,
    },
  };
};

// ---------------------------------------------------------------------------

/**
 * Emits the modules the presenter actually resolved, in the exact registry
 * order. A registered kind with no resolved module is simply absent: its
 * dependency NO-GO, not a placeholder module, explains the gap.
 */
const orderModules = (
  surface: BoardSurfaceRegistrationV1,
  modules: ReadonlyMap<string, BoardModuleV1>,
  policy: Record<string, { required: boolean }>,
): BoardModuleV1[] => {
  const ordered: BoardModuleV1[] = [];
  for (const kind of surface.orderedContentKinds) {
    const module = modules.get(kind);
    if (!module) continue;
    ordered.push({ ...module, required: policy[kind]?.required ?? module.required });
  }
  return ordered;
};

const dedupeActions = (actions: readonly BoardActionRefV1[]): BoardActionRefV1[] => {
  const seen = new Map<string, BoardActionRefV1>();
  for (const action of actions) {
    const key = JSON.stringify([
      action.capabilityKey,
      action.capabilityVersion,
      action.targetOptionRef ?? null,
      action.availability,
    ]);
    if (!seen.has(key)) seen.set(key, action);
  }
  return [...seen.values()];
};

export const BOARD_MODULE_CAPABILITY_BINDINGS = {
  guardian_current_focus: QUERY_GUARDIAN_CURRENT_FOCUS_CAPABILITY,
  guardian_enrollment_activity: QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY,
  caregiver_child_today: QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY,
  caregiver_family_care_work: QUERY_CAREGIVER_FAMILY_CARE_WORK_CAPABILITY,
  teacher_publish_queue: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY,
} as const;
