import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";
import { issueBoardSealedRef } from "../../src/harness/board-projection.js";
import {
  evaluateOrganizeTrigger,
  projectOrganizeResult,
  type OrganizeTriggerPolicyV1,
} from "../../src/harness/care-capture-batch.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  issuePublicationRef,
  createRecordCaregiverDailyCareSpec,
  createUpdateGuardianCurrentFocusSpec,
} from "../../src/index.js";
import * as nurtureScenario from "../../src/index.js";
import {
  presentCaregiverTeacherBoard,
  presentGuardianFamilyBoard,
} from "../../src/harness/board-envelopes.js";
import {
  queryGuardianCurrentFocus,
  queryGuardianEnrollmentActivity,
} from "../../src/harness/guardian-board-queries.js";
import { queryCaregiverChildToday } from "../../src/harness/caregiver-board-queries.js";
import { queryTeacherPublishQueue } from "../../src/harness/teacher-publish-queue.js";
import {
  acquirePublishEditHold,
  cancelPublishProcess,
  releasePublishEditHold,
  renewPublishEditHold,
  savePublishProcessDraft,
} from "../../src/harness/publish-process-editing.js";
import {
  confirmChildMediaAttribution,
  issueChildOptionRef,
  issueMediaAssetTargetRef,
  rejectChildMediaAttribution,
  supersedeChildMediaAttribution,
} from "../../src/harness/media-attribution.js";
import {
  evaluateReschedule,
  resolvePublishSchedule,
} from "../../src/harness/publish-schedule.js";
import { releasePublishProcess } from "../../src/harness/publication-release.js";
import {
  correctPublication,
  detachPublishProcessMedia,
  discardMediaAsset,
  redactPublication,
  removePublicationTargetVisibility,
} from "../../src/harness/publication-safety.js";
import {
  BOARD_CONTRACT,
  BOARD_INTEGRITY_KEY,
  caregiverAuthority,
  childToday,
  createCaregiverReadPort,
  createFamilyCareWorkDeps,
  createGuardianReadPort,
  createPublishQueueReadPort,
  focusGoal,
  guardianActivity,
  publishQueueRow,
  surfaceRegistrySource,
  workItem,
} from "../harness/board-fixtures.js";
import { issueTargetOptionRef } from "../../src/harness/keyed-refs.js";

/**
 * Every checkpoint claims its capability returns a "typed result". Nothing
 * checked that until now: the schemas compiled and the runtime was tested, but
 * no test ever ran one against the other. This suite validates the actual
 * runtime payload of every registered T-006 capability against the exact result
 * schema its descriptor references.
 */
const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");

const manifest = JSON.parse(
  readFileSync(
    path.join(packageRoot, "contracts/surfaces/v1/generated/surface-contract.manifest.json"),
    "utf8",
  ),
) as {
  capabilities: Array<{
    capabilityKey: string;
    capabilityVersion: string;
    descriptor: { resultSchemaRef: string };
  }>;
};
const schemaRegistry = JSON.parse(
  readFileSync(path.join(sourceRoot, "interface/schema-registry.json"), "utf8"),
) as { schemas: Array<{ schemaRef: string; artifactPath: string; jsonPointer: string }> };

const collectSchemaPaths = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSchemaPaths(entryPath);
    return entry.isFile() && entry.name.endsWith(".schema.json") ? [entryPath] : [];
  });

// Ajv and ajv-formats ship CommonJS defaults; under NodeNext the callable is
// on `.default` depending on the resolver.
const Ajv2020 = ((Ajv2020Module as unknown as { default?: unknown }).default ??
  Ajv2020Module) as new (options: object) => {
  addSchema(schema: unknown): unknown;
  getSchema(ref: string): ((data: unknown) => boolean) & { errors?: unknown };
};
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default ??
  addFormatsModule) as (ajv: unknown) => unknown;

const validator = new Ajv2020({ strict: true, allErrors: true });
addFormats(validator);
for (const schemaPath of collectSchemaPaths(sourceRoot)) {
  validator.addSchema(JSON.parse(readFileSync(schemaPath, "utf8")));
}

const resultValidator = (capabilityKey: string) => {
  const descriptor = manifest.capabilities.find(
    (entry) => entry.capabilityKey === capabilityKey,
  )?.descriptor;
  expect(descriptor, `${capabilityKey} descriptor`).toBeDefined();
  const binding = schemaRegistry.schemas.find(
    (entry) => entry.schemaRef === descriptor?.resultSchemaRef,
  );
  expect(binding, `${capabilityKey} result schema binding`).toBeDefined();
  const artifact = JSON.parse(
    readFileSync(path.join(sourceRoot, binding?.artifactPath ?? ""), "utf8"),
  ) as { $id: string };
  const pointer = binding?.jsonPointer ?? "";
  const compiled = validator.getSchema(
    pointer ? `${artifact.$id}#${pointer}` : artifact.$id,
  );
  expect(compiled, `${capabilityKey} compiled result schema`).toBeDefined();
  return compiled!;
};

/** The `status` discriminator belongs to the invocation envelope, not the payload. */
const payloadOf = (decision: Record<string, unknown>): Record<string, unknown> => {
  const { status: _status, ...payload } = decision;
  return payload;
};

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const guardianScope = { workspace_id: "ws-1", participant_id: "guardian-1" };
const now = () => new Date("2026-08-01T09:30:00.000Z");
const PROCESS_KEY = "care-group-1~trigger-1";
const processRef = () =>
  issueBoardSealedRef(BOARD_INTEGRITY_KEY, scope, PUBLISH_PROCESS_TARGET_KIND, PROCESS_KEY);
const mediaRef = () => issueMediaAssetTargetRef(BOARD_INTEGRITY_KEY, scope, "media-1");

const registration = (surfaceKey: string) => {
  const surface = surfaceRegistrySource().surfaces.find(
    (entry) => entry.surfaceKey === surfaceKey,
  );
  if (!surface) throw new Error(`missing surface ${surfaceKey}`);
  return {
    surfaceKey: surface.surfaceKey,
    surfaceVersion: surface.surfaceVersion,
    orderedContentKinds: surface.orderedContentKinds,
  };
};

const policy: OrganizeTriggerPolicyV1 = {
  policy_ref: "syn-policy-1",
  policy_head: 3,
  time_zone: "Asia/Shanghai",
  default_release_local_time: "17:00",
  organize_idle_seconds: 600,
  organize_fallback_lead_seconds: 1800,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 60,
  automatic_organize_enabled: true,
};

const publicationPolicy = {
  ...policy,
  institution_ref: "syn-institution-1",
  policy_version: 2,
  retry_cutoff_local_time: "19:00",
  effective_from: "2026-01-01T00:00:00.000Z",
};

const mediaAttributionDeps = (
  attributions: Array<{
    attribution_id: string;
    child_care_process_id: string;
    status: "candidate" | "confirmed" | "rejected" | "superseded";
    revision: number;
    source: "manual" | "organizer_candidate" | "automatic_face_match";
  }>,
) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listAttributableMediaIds: async () => ["media-1"],
    loadMediaAttributionFacts: async () => ({
      authority: caregiverAuthority(),
      media_lifecycle: "ready" as const,
      media_revision: 3,
      eligible_child_ids: ["child-1", "child-2"],
      attributions,
    }),
  },
});

const editingDeps = (overrides: Record<string, unknown> = {}) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listEditableProcessKeys: async () => [PROCESS_KEY],
    loadEditHoldFacts: async () => ({
      process_state: "draft" as const,
      authority: caregiverAuthority(),
      ...overrides,
    }),
    loadDraftFacts: async () => ({
      process_state: "draft" as const,
      authority: caregiverAuthority(),
      current_revision: 4,
      known_source_refs: [],
      ...overrides,
    }),
    loadCancelFacts: async () => ({
      process_state: "draft" as const,
      authority: caregiverAuthority(),
      committed_release_count: 0,
      process_version: 3,
      ...overrides,
    }),
  },
});

const safetyDeps = () => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listSafetyProcessKeys: async () => [PROCESS_KEY],
    loadPublicationSafetyFacts: async () => ({
      authority: caregiverAuthority(),
      process_state: "released" as const,
      publications: [
        {
          publication_id: "pub-1",
          target_key: "t-1",
          receipt_id: "receipt-1",
          release_revision: 4,
          visibility: "visible" as const,
          events: [],
        },
      ],
    }),
    listMediaLifecycleAssetIds: async () => ["media-1"],
    loadMediaLifecycleFacts: async () => ({
      authority: caregiverAuthority(),
      process_state: "draft" as const,
      read_at: "2026-08-03T10:00:00.000Z",
      draft_revision: 1,
      composition_media_ids: ["media-1", "media-2"],
      media_revision: 3,
      media_lifecycle: "ready" as const,
      committed_release_count: 0,
      referencing_draft_count: 2,
    }),
  },
});

/**
 * One producer per registered T-006 capability. A capability without an entry
 * fails the census below, so a contract can never be published with a result
 * shape nothing in the runtime produces.
 */
const producers: Record<string, () => Promise<unknown>> = {
  query_guardian_family_board: async () => {
    const result = await presentGuardianFamilyBoard(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        surface: registration("guardian_family_board"),
        reads: createGuardianReadPort({
          goals: [focusGoal()],
          activityPages: [{ rows: [guardianActivity()], has_more: false }],
        }),
      },
      guardianScope,
    );
    if (result.status !== "ok") throw new Error("guardian board fixture failed");
    return result.output;
  },
  query_guardian_current_focus: async () => {
    const result = await queryGuardianCurrentFocus(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        reads: createGuardianReadPort({ goals: [focusGoal()] }),
      },
      guardianScope,
    );
    if (result.status !== "ok") throw new Error("current focus fixture failed");
    return result.output;
  },
  query_guardian_enrollment_activity: async () => {
    const result = await queryGuardianEnrollmentActivity(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        reads: createGuardianReadPort({
          activityPages: [{ rows: [guardianActivity()], has_more: false }],
        }),
      },
      {
        ...guardianScope,
        enrollment_target_ref: issueTargetOptionRef(BOARD_INTEGRITY_KEY, {
          ...guardianScope,
          enrollment_id: "enrollment-1",
        }),
      },
    );
    if (result.status !== "ok") throw new Error("enrollment activity fixture failed");
    return result.output;
  },
  query_caregiver_teacher_board: async () => {
    const result = await presentCaregiverTeacherBoard(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        surface: registration("caregiver_teacher_board"),
        reads: createCaregiverReadPort({ pages: [{ rows: [childToday()], has_more: false }] }),
        family_care_work: createFamilyCareWorkDeps([workItem()]),
        publish_queue: createPublishQueueReadPort([
          { rows: [publishQueueRow()], has_more: false },
        ]),
      },
      scope,
    );
    if (result.status !== "ok") throw new Error("teacher board fixture failed");
    return result.output;
  },
  query_caregiver_child_today: async () => {
    const result = await queryCaregiverChildToday(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        reads: createCaregiverReadPort({ pages: [{ rows: [childToday()], has_more: false }] }),
      },
      scope,
    );
    if (result.status !== "ok") throw new Error("child today fixture failed");
    return result.output;
  },
  query_teacher_publish_queue: async () => {
    const result = await queryTeacherPublishQueue(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        reads: createPublishQueueReadPort([{ rows: [publishQueueRow()], has_more: false }]),
      },
      {
        authorized: true,
        care_group_id: "care-group-1",
        care_group_label: "Syn Class A",
        snapshot_version: 11,
        drift_heads: {
          source_head: "s",
          authority_head: "a",
          correction_head: "c",
          redaction_head: "r",
          grant_head: "g",
        },
        authority: caregiverAuthority(),
        surface_action_grants: [],
        module_action_grants: {},
        publication_policy_resolved: true,
      },
      scope,
    );
    if (result.status !== "ok") throw new Error("publish queue fixture failed");
    return result.output;
  },
  update_guardian_current_focus: async () => {
    const spec = createUpdateGuardianCurrentFocusSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    const applied = await spec.apply(
      {
        boardMutations: {
          loadGuardianFocusGoalFacts: async () => ({
            participant_active: true,
            guardian_authority_current: true,
            family_ref_key: "family-1",
            focus_cycle_id: "cycle-1",
            focus_cycle_version: 3,
            focus_goal_version: 4,
            child_scope_explicit: false,
          }),
          applyGuardianFocusGoalUpdate: async () => ({
            focus_goal_ref: {
              schema_version: 1,
              namespace: "nurture",
              object_type: "focus_goal",
              object_id: "goal-1",
              version: 5,
            },
            revision: 5,
          }),
          loadCaregiverDailyCareFacts: async () => {
            throw new Error("unused");
          },
          applyCaregiverDailyCareRecord: async () => {
            throw new Error("unused");
          },
        },
      } as never,
      {
        label: "Syn Updated Focus",
        priority: 2,
        focus_goal_id: "goal-1",
        focus_cycle_id: "cycle-1",
        expected_focus_cycle_version: 3,
        expected_focus_goal_version: 4,
      },
      { workspace_id: "ws-1", business_actor_ref: "guardian-1", command_request_id: "command:fixture-1" },
    );
    return applied.committed_result;
  },
  record_caregiver_daily_care: async () => {
    const spec = createRecordCaregiverDailyCareSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    const applied = await spec.apply(
      {
        boardMutations: {
          loadGuardianFocusGoalFacts: async () => {
            throw new Error("unused");
          },
          applyGuardianFocusGoalUpdate: async () => {
            throw new Error("unused");
          },
          loadCaregiverDailyCareFacts: async () => ({
            participant_active: true,
            caregiver_role: "caregiver",
            role_scope_type: "care_group",
            role_scope_matches_source: true,
            caregiver_role_assignment_id: "role-1",
            care_group_id: "care-group-1",
            enrollment_id: "enrollment-1",
            enrollment_active: true,
            care_group_version: 2,
            caregiver_role_version: 5,
            enrollment_version: 6,
          }),
          applyCaregiverDailyCareRecord: async () => ({
            daily_care_log_ref: {
              schema_version: 1,
              namespace: "nurture",
              object_type: "daily_care_log",
              object_id: "log-1",
              version: 1,
            },
            recorded_at: "2026-08-02T10:00:00.000Z",
          }),
        },
      } as never,
      {
        kind: "nap",
        summary: "Syn Nap Record",
        child_care_process_id: "child-1",
        expected_care_group_version: 2,
        expected_role_version: 5,
        expected_enrollment_version: 6,
      },
      { workspace_id: "ws-1", business_actor_ref: "caregiver-1", command_request_id: "command:fixture-1" },
    );
    return applied.committed_result;
  },
  organize_care_capture_batch: async () =>
    projectOrganizeResult(BOARD_INTEGRITY_KEY, scope, {
      batch_id: "batch-1",
      decision: evaluateOrganizeTrigger({
        trigger: "manual",
        trigger_request_id: "trigger-1",
        now: now(),
        policy,
        batch: {
          state: "collecting",
          captures: [
            {
              capture_id: "c-1",
              kind: "media",
              stable: true,
              source_sequence: 1,
              occurred_at: "2026-08-01T09:00:00.000Z",
              authority: caregiverAuthority(),
            },
          ],
          activity: { last_user_activity_at: "2026-08-01T09:00:00.000Z" },
        },
      }),
    }),
  save_publish_process_draft: async () => {
    const decision = await savePublishProcessDraft(editingDeps(), scope, {
      process_ref: processRef(),
      command_request_id: "command:save-1",
      operation_input: {
        expectedDraftRevision: 4,
        title: "标题",
        segments: [{ text: "原文" }],
      },
    });
    if (decision.status !== "saved") throw new Error("save fixture failed");
    const { contentDigest: _digest, ...payload } = decision.result;
    return payload;
  },
  acquire_publish_edit_hold: async () => {
    const decision = await acquirePublishEditHold(editingDeps(), scope, {
      process_ref: processRef(),
    });
    if (decision.status !== "granted") throw new Error("acquire fixture failed");
    return decision.hold;
  },
  renew_publish_edit_hold: async () => {
    const decision = await renewPublishEditHold(
      editingDeps({
        current_hold: {
          holder_participant_id: "caregiver-1",
          holder_label: "Syn Colleague",
          expires_at: "2026-08-01T09:31:00.000Z",
        },
      }),
      scope,
      { process_ref: processRef() },
    );
    if (decision.status !== "granted") throw new Error("renew fixture failed");
    return decision.hold;
  },
  release_publish_edit_hold: async () => {
    const decision = await releasePublishEditHold(editingDeps(), scope, {
      process_ref: processRef(),
    });
    if (decision.status !== "released") throw new Error("release hold fixture failed");
    return { processRef: processRef(), released: true };
  },
  cancel_publish_process: async () => {
    const decision = await cancelPublishProcess(editingDeps(), scope, {
      process_ref: processRef(),
    });
    if (decision.status !== "cancelled") throw new Error("cancel fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  confirm_child_media_attribution: async () => {
    const decision = await confirmChildMediaAttribution(
      mediaAttributionDeps([
        {
          attribution_id: "attr-1",
          child_care_process_id: "child-1",
          status: "candidate",
          revision: 1,
          source: "organizer_candidate",
        },
      ]),
      scope,
      { media_ref: mediaRef(), operation_input: { childRef: issueChildOptionRef(BOARD_INTEGRITY_KEY, scope, "child-1") } },
    );
    if (decision.status !== "committed") throw new Error("confirm fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  reject_child_media_attribution: async () => {
    const decision = await rejectChildMediaAttribution(
      mediaAttributionDeps([
        {
          attribution_id: "attr-1",
          child_care_process_id: "child-1",
          status: "candidate",
          revision: 1,
          source: "organizer_candidate",
        },
      ]),
      scope,
      { media_ref: mediaRef(), operation_input: { childRef: issueChildOptionRef(BOARD_INTEGRITY_KEY, scope, "child-1") } },
    );
    if (decision.status !== "committed") throw new Error("reject fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  supersede_child_media_attribution: async () => {
    const decision = await supersedeChildMediaAttribution(
      mediaAttributionDeps([
        {
          attribution_id: "attr-1",
          child_care_process_id: "child-1",
          status: "confirmed",
          revision: 2,
          source: "manual",
        },
      ]),
      scope,
      {
        media_ref: mediaRef(),
        operation_input: {
          fromChildRef: issueChildOptionRef(BOARD_INTEGRITY_KEY, scope, "child-1"),
          toChildRef: issueChildOptionRef(BOARD_INTEGRITY_KEY, scope, "child-2"),
        },
      },
    );
    if (decision.status !== "committed") throw new Error("supersede fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  release_publish_process: async () => {
    const resolved = resolvePublishSchedule({
      policy: publicationPolicy,
      now: new Date("2026-08-01T02:00:00.000Z"),
    });
    if (resolved.status !== "resolved") throw new Error("schedule fixture failed");
    const decision = await releasePublishProcess(
      {
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        reads: {
          listReleasableProcessKeys: async () => [PROCESS_KEY],
          loadReleaseFacts: async () => ({
            authority: caregiverAuthority(),
            authorizing_role_current: true,
            process_state: "pending_release" as const,
            current_revision: 4,
            has_unsaved_revision: false,
            edit_hold_active: false,
            schedule: resolved.schedule,
            media: [
              {
                media_asset_id: "media-1",
                media_revision: 3,
                current_media_revision: 3,
                lifecycle: "ready" as const,
                visible_children: [
                  {
                    child_care_process_id: "child-1",
                    attribution_status: "confirmed" as const,
                    clearly_visible: true,
                  },
                ],
              },
            ],
            targets: [
              {
                target_key: "t-1",
                child_care_process_id: "child-1",
                enrollment_active: true,
                grant_allows: true,
                data_class_allowed: true,
                purpose_allowed: true,
                exposure_allows_child_ids: ["child-1"],
              },
            ],
          }),
          commitTargetRelease: async () => ({
            status: "committed" as const,
            publication_ref: "pub-1",
            receipt_ref: "receipt-1",
          }),
        },
      },
      scope,
      { process_ref: processRef(), command_request_id: "command:release-1", trigger: "scheduler" },
    );
    if (decision.status === "denied") throw new Error("release fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  reschedule_publish_process: async () => {
    const resolved = resolvePublishSchedule({
      policy: publicationPolicy,
      now: new Date("2026-08-01T02:00:00.000Z"),
    });
    if (resolved.status !== "resolved") throw new Error("schedule fixture failed");
    const decision = evaluateReschedule({
      now: new Date("2026-08-01T08:00:00.000Z"),
      state: "pending_release",
      frozen: resolved.schedule,
      edit_hold_held_by_other: false,
      has_committed_release: false,
      operation_input: { scheduledAt: "2026-08-01T10:00:00.000Z" },
    });
    if (decision.status !== "rescheduled") throw new Error("reschedule fixture failed");
    return decision.schedule;
  },
  correct_publication: async () => {
    const decision = await correctPublication(safetyDeps(), scope, {
      process_ref: processRef(),
      operation_input: { reason: "content_error", correctionText: "更正。" },
    });
    if (decision.status !== "appended") throw new Error("correct fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  remove_publication_target_visibility: async () => {
    const decision = await removePublicationTargetVisibility(safetyDeps(), scope, {
      process_ref: processRef(),
      operation_input: {
        reason: "wrong_target",
        publicationRef: issuePublicationRef(BOARD_INTEGRITY_KEY, scope, "pub-1"),
      },
    });
    if (decision.status !== "appended") throw new Error("remove fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  redact_publication: async () => {
    const decision = await redactPublication(safetyDeps(), scope, {
      process_ref: processRef(),
      operation_input: { reason: "policy_requirement" },
    });
    if (decision.status !== "appended") throw new Error("redact fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  detach_publish_process_media: async () => {
    const decision = await detachPublishProcessMedia(safetyDeps(), scope, {
      process_ref: processRef(),
      media_ref: mediaRef(),
    });
    if (decision.status !== "detached") throw new Error("detach fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
  discard_media_asset: async () => {
    const decision = await discardMediaAsset(safetyDeps(), scope, { media_ref: mediaRef() });
    if (decision.status !== "discardable") throw new Error("discard fixture failed");
    return payloadOf(decision as unknown as Record<string, unknown>);
  },
};

/** Capabilities T-005 owns; their runtime is qualified by the T-005 suites. */
const PRE_G3_KEYS = new Set([
  "acknowledge_family_care_item",
  "correct_family_care_message",
  "initiate_caregiver_direct_message",
  "policy_redact_family_care_message",
  "query_caregiver_family_care_work",
  "query_family_care_item",
  "query_guardian_family_care_timeline",
  "redact_family_care_message",
  "reply_family_care_item",
  "submit_family_care_question",
  "withdraw_family_care_request",
]);

const t006Keys = manifest.capabilities
  .map((entry) => entry.capabilityKey)
  .filter((key) => !PRE_G3_KEYS.has(key));

/**
 * Every runtime module declares its own `{key, version}` identity constant.
 * Nothing bound those to the registry, so a renamed or re-versioned descriptor
 * would have left the runtime quietly pointing at a capability that no longer
 * exists.
 */
const runtimeCapabilityConstants = Object.entries(nurtureScenario)
  .filter(([name]) => name.endsWith("_CAPABILITY"))
  .map(([name, value]) => [name, value as { key: string; version: string }] as const);

describe("Phase 3 typed results match their registered schemas", () => {
  it("binds every runtime capability constant to a registered descriptor", () => {
    expect(runtimeCapabilityConstants.length).toBeGreaterThanOrEqual(20);
    const registered = new Map(
      manifest.capabilities.map((entry) => [entry.capabilityKey, entry.capabilityVersion]),
    );
    for (const [name, constant] of runtimeCapabilityConstants) {
      expect(registered.get(constant.key), `${name} (${constant.key})`).toBe(
        constant.version,
      );
    }
    // And every registered T-006 capability has a runtime constant naming it.
    const declaredKeys = new Set(runtimeCapabilityConstants.map(([, value]) => value.key));
    for (const key of t006Keys) {
      expect(declaredKeys, key).toContain(key);
    }
  });

  it("has a runtime producer for every registered T-006 capability", () => {
    expect(t006Keys.length).toBeGreaterThan(0);
    for (const key of t006Keys) {
      expect(Object.keys(producers), key).toContain(key);
    }
  });

  for (const key of t006Keys) {
    it(`produces a ${key} result the contract accepts`, async () => {
      const produce = producers[key];
      expect(produce, key).toBeDefined();
      const payload = JSON.parse(JSON.stringify(await produce!()));
      const validate = resultValidator(key);
      const valid = validate(payload);
      expect(
        valid,
        `${key}: ${JSON.stringify(validate.errors)}`,
      ).toBe(true);
    });
  }
});
