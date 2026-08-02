import { describe, expect, it } from "vitest";
import {
  PUBLICATION_POLICY_NO_GO,
  QUERY_CAREGIVER_TEACHER_BOARD_CAPABILITY,
  QUERY_GUARDIAN_FAMILY_BOARD_CAPABILITY,
  presentCaregiverTeacherBoard,
  presentGuardianFamilyBoard,
  type BoardSurfaceRegistrationV1,
} from "../../src/harness/board-envelopes.js";
import { issueTargetOptionRef } from "../../src/harness/keyed-refs.js";
import {
  BOARD_CONTRACT,
  BOARD_INTEGRITY_KEY,
  caregiverAuthority,
  childToday,
  createCaregiverReadPort,
  createFamilyCareWorkDeps,
  createGuardianReadPort,
  createPublishQueueReadPort,
  publishQueueRow,
  focusGoal,
  guardianActivity,
  surfaceRegistrySource,
  workItem,
} from "./board-fixtures.js";

const now = () => new Date("2026-08-02T00:00:00.000Z");
const guardianScope = { workspace_id: "ws-1", participant_id: "guardian-1" };
const caregiverScope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const registeredSurface = (surfaceKey: string): BoardSurfaceRegistrationV1 => {
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

const guardianSurface = registeredSurface("guardian_family_board");
const caregiverSurface = registeredSurface("caregiver_teacher_board");

const guardianDeps = (
  port: ReturnType<typeof createGuardianReadPort>,
) => ({
  contract: BOARD_CONTRACT,
  integrity_key: BOARD_INTEGRITY_KEY,
  reads: port,
  now,
  surface: guardianSurface,
});

const caregiverDeps = (
  port: ReturnType<typeof createCaregiverReadPort>,
  familyCareRows = [workItem()],
  queuePages = [{ rows: [publishQueueRow()], has_more: false }],
) => ({
  contract: BOARD_CONTRACT,
  integrity_key: BOARD_INTEGRITY_KEY,
  reads: port,
  now,
  surface: caregiverSurface,
  family_care_work: createFamilyCareWorkDeps(familyCareRows),
  publish_queue: createPublishQueueReadPort(queuePages),
});

describe("G3-A guardian_family_board envelope", () => {
  it("emits the exact registry module order and the frozen envelope fields", async () => {
    const result = await presentGuardianFamilyBoard(
      guardianDeps(
        createGuardianReadPort({
          goals: [focusGoal()],
          activityPages: [{ rows: [guardianActivity()], has_more: false }],
        }),
      ),
      guardianScope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const envelope = result.output;
    expect(Object.keys(envelope).sort()).toEqual(
      [
        "actions",
        "actorContext",
        "content",
        "contentFamily",
        "contract",
        "dependencyNoGos",
        "generatedAt",
        "snapshotRef",
        "snapshotVersion",
        "state",
        "surfaceKey",
        "surfaceVersion",
      ].sort(),
    );
    expect(envelope.contract).toEqual(BOARD_CONTRACT);
    expect(envelope.surfaceKey).toBe("guardian_family_board");
    expect(envelope.surfaceVersion).toBe("1.0.0");
    expect(envelope.contentFamily).toBe("board");
    expect(envelope.snapshotVersion).toBe(7);
    expect(envelope.generatedAt).toBe("2026-08-02T00:00:00.000Z");
    expect(envelope.actorContext).toEqual({
      role: "guardian",
      scopeRef: expect.stringMatching(/^1\.[0-9a-f]{32}$/),
      scopeLabel: "Syn Family",
    });
    // The presenter takes its order from the registry, never from a local copy.
    const emitted = envelope.content.map((module) => module.kind);
    expect(emitted).toEqual(
      guardianSurface.orderedContentKinds.filter((kind) => emitted.includes(kind)),
    );
    expect(emitted).toEqual(["guardian_current_focus", "guardian_enrollment_activity"]);
    expect(envelope.content.every((module) => module.required)).toBe(true);
  });

  it("carries counts and opaque item refs instead of a second copy of the module payload", async () => {
    const result = await presentGuardianFamilyBoard(
      guardianDeps(
        createGuardianReadPort({
          goals: [
            focusGoal({ goal_id: "goal-1" }),
            focusGoal({
              goal_id: "goal-2",
              child_scope_explicit: true,
              child_care_process_id: "child-1",
              child_safe_label: "Syn Child A",
            }),
          ],
          activityPages: [
            {
              rows: [
                guardianActivity({ activity_id: "a-1" }),
                guardianActivity({ activity_id: "a-2" }),
              ],
              has_more: false,
            },
          ],
        }),
      ),
      guardianScope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const [focus, activity] = result.output.content;
    expect(focus?.count).toBe(2);
    expect(focus?.itemRefs).toHaveLength(2);
    expect(activity?.count).toBe(2);
    expect(activity?.pageInfo).toEqual({ hasMore: false });
    const serialized = JSON.stringify(result.output);
    expect(serialized).not.toContain("Syn Released Daily Care");
    expect(serialized).not.toContain("Syn Child A");
    expect(serialized).not.toContain("goal-1");
  });

  it("keeps the optional Workflow projection absent without a dependency NO-GO", async () => {
    const result = await presentGuardianFamilyBoard(
      guardianDeps(createGuardianReadPort({ goals: [focusGoal()] })),
      guardianScope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(guardianSurface.orderedContentKinds).toContain(
      "institution_workflow_projection",
    );
    expect(result.output.content.map((module) => module.kind)).not.toContain(
      "institution_workflow_projection",
    );
    // Optional absence must not become an implicit gate on the core board.
    expect(result.output.dependencyNoGos).toEqual([]);
    expect(result.output.state).toBe("ready");
  });

  it("defaults to the unique eligible Enrollment and never guesses among several", async () => {
    const single = await presentGuardianFamilyBoard(
      guardianDeps(
        createGuardianReadPort({
          activityPages: [{ rows: [guardianActivity()], has_more: false }],
        }),
      ),
      guardianScope,
    );
    expect(single.status).toBe("ok");
    if (single.status !== "ok") return;
    expect(single.output.content[1]?.count).toBe(1);

    const port = createGuardianReadPort({
      scope: {
        eligible_enrollments: [
          { enrollment_id: "enrollment-1", display_label: "Syn Class A" },
          { enrollment_id: "enrollment-2", display_label: "Syn Class B" },
        ],
      },
      activityPages: [{ rows: [guardianActivity()], has_more: false }],
    });
    const ambiguous = await presentGuardianFamilyBoard(guardianDeps(port), guardianScope);
    expect(ambiguous.status).toBe("ok");
    if (ambiguous.status !== "ok") return;
    expect(ambiguous.output.content[1]?.count).toBe(0);
    expect(ambiguous.output.content[1]?.itemRefs).toEqual([]);
    expect(port.activityRequests).toEqual([]);

    const chosen = await presentGuardianFamilyBoard(guardianDeps(port), {
      ...guardianScope,
      enrollment_target_ref: issueTargetOptionRef(BOARD_INTEGRITY_KEY, {
        ...guardianScope,
        enrollment_id: "enrollment-2",
      }),
    });
    expect(chosen.status).toBe("ok");
    if (chosen.status !== "ok") return;
    expect(chosen.output.content[1]?.count).toBe(1);
  });

  it("reports needs_setup with no eligible Enrollment and denies a non-current Guardian", async () => {
    const empty = await presentGuardianFamilyBoard(
      guardianDeps(createGuardianReadPort({ scope: { eligible_enrollments: [] } })),
      guardianScope,
    );
    expect(empty.status).toBe("ok");
    if (empty.status !== "ok") return;
    expect(empty.output.state).toBe("needs_setup");

    await expect(
      presentGuardianFamilyBoard(
        guardianDeps(createGuardianReadPort({ scope: { authorized: false } })),
        guardianScope,
      ),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("projects module and surface actions only from owner eligibility", async () => {
    const withoutGrants = await presentGuardianFamilyBoard(
      guardianDeps(createGuardianReadPort({ goals: [focusGoal()] })),
      guardianScope,
    );
    expect(withoutGrants.status).toBe("ok");
    if (withoutGrants.status !== "ok") return;
    expect(withoutGrants.output.actions).toEqual([]);
    expect(withoutGrants.output.content.every((module) => module.actionRefs.length === 0)).toBe(
      true,
    );

    const withGrants = await presentGuardianFamilyBoard(
      guardianDeps(
        createGuardianReadPort({
          goals: [focusGoal()],
          scope: {
            module_action_grants: {
              guardian_current_focus: [
                {
                  capability_key: "update_guardian_current_focus",
                  capability_version: "1.0.0",
                  availability: "available",
                },
              ],
            },
          },
        }),
      ),
      guardianScope,
    );
    expect(withGrants.status).toBe("ok");
    if (withGrants.status !== "ok") return;
    expect(withGrants.output.content[0]?.actionRefs).toEqual([
      {
        capabilityKey: "update_guardian_current_focus",
        capabilityVersion: "1.0.0",
        availability: "available",
      },
    ]);
  });
});

describe("G3-A caregiver_teacher_board envelope", () => {
  it("emits the registry order, reuses the exact T-005 query and stays limited on the missing publish queue", async () => {
    const result = await presentCaregiverTeacherBoard(
      caregiverDeps(
        createCaregiverReadPort({ pages: [{ rows: [childToday()], has_more: false }] }),
      ),
      caregiverScope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const envelope = result.output;
    expect(envelope.surfaceKey).toBe("caregiver_teacher_board");
    expect(envelope.content.map((module) => module.kind)).toEqual([
      "caregiver_child_today",
      "caregiver_family_care_work",
      "teacher_publish_queue",
    ]);
    expect(caregiverSurface.orderedContentKinds).toEqual([
      "caregiver_child_today",
      "caregiver_family_care_work",
      "teacher_publish_queue",
    ]);
    expect(envelope.dependencyNoGos).toEqual([PUBLICATION_POLICY_NO_GO]);
    expect(envelope.state).toBe("limited");
    expect(envelope.actorContext).toEqual({
      role: "caregiver",
      scopeRef: expect.stringMatching(/^1\.[0-9a-f]{32}$/),
      scopeLabel: "Syn Class A",
    });

    const familyCare = envelope.content[1];
    expect(familyCare?.count).toBe(1);
    expect(familyCare?.actionRefs.map((action) => action.capabilityKey).sort()).toEqual([
      "acknowledge_family_care_item",
      "reply_family_care_item",
    ]);
  });

  it("never emits the Workflow projection the exact 1.8.0 matrix denies", async () => {
    const result = await presentCaregiverTeacherBoard(
      caregiverDeps(
        createCaregiverReadPort({
          scope: {
            module_action_grants: {
              institution_workflow_projection: [
                {
                  capability_key: "query_institution_workflow_projection",
                  capability_version: "1.0.0",
                  availability: "available",
                },
              ],
            },
          },
          pages: [{ rows: [childToday()], has_more: false }],
        }),
      ),
      {
        ...caregiverScope,
      },
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const serialized = JSON.stringify(result.output);
    expect(result.output.content.map((module) => module.kind)).not.toContain(
      "institution_workflow_projection",
    );
    expect(serialized).not.toContain("institution_workflow_projection");
    expect(serialized).not.toContain("query_institution_workflow_projection");
  });

  it("denies a caregiver whose RoleAssignment is not scoped to the exact CareGroup", async () => {
    for (const authority of [
      caregiverAuthority({ role: "institution_admin" }),
      caregiverAuthority({ role_scope_type: "institution" }),
      caregiverAuthority({ role_scope_matches_source: false }),
    ]) {
      await expect(
        presentCaregiverTeacherBoard(
          caregiverDeps(createCaregiverReadPort({ scope: { authority } })),
          caregiverScope,
        ),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
  });

  it("propagates a denied T-005 family-care read instead of presenting a partial board", async () => {
    const deps = {
      ...caregiverDeps(createCaregiverReadPort()),
      family_care_work: createFamilyCareWorkDeps([], false),
    };
    await expect(
      presentCaregiverTeacherBoard(deps, caregiverScope),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("keeps the two role envelopes free of each other's fields", async () => {
    const guardian = await presentGuardianFamilyBoard(
      guardianDeps(
        createGuardianReadPort({
          goals: [focusGoal()],
          activityPages: [{ rows: [guardianActivity()], has_more: false }],
        }),
      ),
      guardianScope,
    );
    const caregiver = await presentCaregiverTeacherBoard(
      caregiverDeps(
        createCaregiverReadPort({ pages: [{ rows: [childToday()], has_more: false }] }),
      ),
      caregiverScope,
    );
    expect(guardian.status).toBe("ok");
    expect(caregiver.status).toBe("ok");
    if (guardian.status !== "ok" || caregiver.status !== "ok") return;
    const guardianKinds = guardian.output.content.map((module) => module.kind);
    const caregiverKinds = caregiver.output.content.map((module) => module.kind);
    expect(guardianKinds.filter((kind) => caregiverKinds.includes(kind))).toEqual([]);
    expect(guardian.output.snapshotRef).not.toBe(caregiver.output.snapshotRef);
    expect(QUERY_GUARDIAN_FAMILY_BOARD_CAPABILITY.key).not.toBe(
      QUERY_CAREGIVER_TEACHER_BOARD_CAPABILITY.key,
    );
  });
});
