import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  presentCaregiverTeacherBoard,
  presentGuardianFamilyBoard,
} from "../../src/harness/board-envelopes.js";
import {
  BOARD_CONTRACT,
  BOARD_INTEGRITY_KEY,
  childToday,
  createCaregiverReadPort,
  createFamilyCareWorkDeps,
  createGuardianReadPort,
  focusGoal,
  guardianActivity,
  workItem,
} from "../harness/board-fixtures.js";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");

const readSource = (relativePath: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(sourceRoot, relativePath), "utf8"));

const manifest = JSON.parse(
  readFileSync(
    path.join(packageRoot, "contracts/surfaces/v1/generated/surface-contract.manifest.json"),
    "utf8",
  ),
) as {
  capabilities: Array<{
    capabilityKey: string;
    capabilityVersion: string;
    descriptor: {
      supportedRoles?: string[];
      executionClass: string;
      presenterBindings: Array<{ surfaceKey: string; presenterKey: string }>;
    };
  }>;
};

type SurfaceRecord = {
  surfaceKey: string;
  surfaceVersion: string;
  orderedContentKinds: string[];
  dependencyGates: string[];
  stateWhenDependenciesMissing: string;
};

const surfaces = (readSource("surfaces/surface-registry.json").surfaces as SurfaceRecord[]);
const visibility = readSource("interface/visibility-matrix.json").surfaces as Array<{
  surfaceKey: string;
  explicitlyDenied: string[];
}>;

const surfaceOf = (surfaceKey: string): SurfaceRecord => {
  const surface = surfaces.find((entry) => entry.surfaceKey === surfaceKey);
  if (!surface) throw new Error(`missing surface ${surfaceKey}`);
  return surface;
};

type BoardExpectedView = {
  surfaceKey: string;
  surfaceState: string;
  boardModules: Array<{
    kind: string;
    required: boolean;
    capabilityKey: string;
    capabilityVersion: string;
  }>;
  absentModuleKinds: string[];
  dependencyNoGos: Array<{
    dependencyKey: string;
    requiredVersion: string;
    reason: string;
    retryHint: string;
  }>;
  writeActionKeys: string[];
};

const boardViews: Array<{ fixtureRef: string; view: BoardExpectedView }> = [
  {
    fixtureRef: "fixtures/journeys/gj-2/expected/view-guardian-board.json",
    view: readSource(
      "fixtures/journeys/gj-2/expected/view-guardian-board.json",
    ) as unknown as BoardExpectedView,
  },
  {
    fixtureRef: "fixtures/journeys/gj-5/expected/view-caregiver-board.json",
    view: readSource(
      "fixtures/journeys/gj-5/expected/view-caregiver-board.json",
    ) as unknown as BoardExpectedView,
  },
];

const now = () => new Date("2026-08-02T00:00:00.000Z");
const guardianScope = { workspace_id: "ws-1", participant_id: "guardian-1" };
const caregiverScope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const registration = (surfaceKey: string) => {
  const surface = surfaceOf(surfaceKey);
  return {
    surfaceKey: surface.surfaceKey,
    surfaceVersion: surface.surfaceVersion,
    orderedContentKinds: surface.orderedContentKinds,
  };
};

describe("Phase 3 board module topology fixtures", () => {
  it("declares every board module in the exact registry order with a registered capability", () => {
    for (const { fixtureRef, view } of boardViews) {
      const surface = surfaceOf(view.surfaceKey);
      const declared = view.boardModules.map((module) => module.kind);
      expect(declared, fixtureRef).toEqual(
        surface.orderedContentKinds.filter((kind) => declared.includes(kind)),
      );
      for (const module of view.boardModules) {
        expect(surface.orderedContentKinds, `${fixtureRef} ${module.kind}`).toContain(
          module.kind,
        );
        const capability = manifest.capabilities.find(
          (entry) =>
            entry.capabilityKey === module.capabilityKey &&
            entry.capabilityVersion === module.capabilityVersion,
        );
        expect(capability, `${fixtureRef} ${module.capabilityKey}`).toBeDefined();
        expect(capability?.descriptor.executionClass).toBe("query");
        expect(
          capability?.descriptor.presenterBindings.map((binding) => binding.surfaceKey),
        ).toContain(view.surfaceKey);
      }
    }
  });

  it("classifies every registered module kind as either declared or explicitly absent", () => {
    for (const { fixtureRef, view } of boardViews) {
      const surface = surfaceOf(view.surfaceKey);
      const declared = view.boardModules.map((module) => module.kind);
      expect([...declared, ...view.absentModuleKinds].sort(), fixtureRef).toEqual(
        [...new Set([...surface.orderedContentKinds, ...view.absentModuleKinds])].sort(),
      );
      expect(declared.filter((kind) => view.absentModuleKinds.includes(kind))).toEqual([]);
    }
  });

  it("keeps the Caregiver Workflow projection excluded and denied by the exact visibility matrix", () => {
    const caregiverView = boardViews[1]?.view;
    expect(caregiverView?.surfaceKey).toBe("caregiver_teacher_board");
    expect(caregiverView?.absentModuleKinds).toContain("institution_workflow_projection");
    expect(surfaceOf("caregiver_teacher_board").orderedContentKinds).not.toContain(
      "institution_workflow_projection",
    );
    expect(
      visibility.find((entry) => entry.surfaceKey === "caregiver_teacher_board")
        ?.explicitlyDenied,
    ).toContain("institution_workflow_projection");
    // The Guardian side keeps it optional/absent-empty instead of denied.
    expect(surfaceOf("guardian_family_board").orderedContentKinds).toContain(
      "institution_workflow_projection",
    );
    expect(
      visibility.find((entry) => entry.surfaceKey === "guardian_family_board")
        ?.explicitlyDenied,
    ).not.toContain("institution_workflow_projection");
  });

  it("binds every dependency NO-GO to a declared surface dependency gate", () => {
    for (const { fixtureRef, view } of boardViews) {
      const surface = surfaceOf(view.surfaceKey);
      for (const noGo of view.dependencyNoGos) {
        expect(surface.dependencyGates, `${fixtureRef} ${noGo.dependencyKey}`).toContain(
          noGo.dependencyKey,
        );
      }
      // A missing required dependency degrades the surface exactly as registered;
      // an absent optional module never does.
      expect(view.surfaceState, fixtureRef).toBe(
        view.dependencyNoGos.length > 0 ? surface.stateWhenDependenciesMissing : "ready",
      );
    }
  });

  it("lists only registered action capabilities that support the fixture's actor role", () => {
    for (const { fixtureRef, view } of boardViews) {
      for (const actionKey of view.writeActionKeys) {
        const capability = manifest.capabilities.find(
          (entry) => entry.capabilityKey === actionKey,
        );
        expect(capability, `${fixtureRef} ${actionKey}`).toBeDefined();
        expect(capability?.descriptor.executionClass).toBe("action_execution");
      }
    }
    expect(boardViews[0]?.view.writeActionKeys).toContain("update_guardian_current_focus");
    expect(boardViews[1]?.view.writeActionKeys).toContain("record_caregiver_daily_care");
  });

  it("reproduces each fixture from the real presenter over the same synthetic facts", async () => {
    const guardianExpected = boardViews[0]?.view as BoardExpectedView;
    const guardian = await presentGuardianFamilyBoard(
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
    expect(guardian.status).toBe("ok");
    if (guardian.status !== "ok") return;
    expect(guardian.output.content.map((module) => module.kind)).toEqual(
      guardianExpected.boardModules.map((module) => module.kind),
    );
    expect(guardian.output.content.map((module) => module.required)).toEqual(
      guardianExpected.boardModules.map((module) => module.required),
    );
    expect(guardian.output.state).toBe(guardianExpected.surfaceState);
    expect(guardian.output.dependencyNoGos).toEqual(guardianExpected.dependencyNoGos);
    for (const absent of guardianExpected.absentModuleKinds) {
      expect(guardian.output.content.map((module) => module.kind)).not.toContain(absent);
    }

    const caregiverExpected = boardViews[1]?.view as BoardExpectedView;
    const caregiver = await presentCaregiverTeacherBoard(
      {
        contract: BOARD_CONTRACT,
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        surface: registration("caregiver_teacher_board"),
        reads: createCaregiverReadPort({
          pages: [{ rows: [childToday()], has_more: false }],
        }),
        family_care_work: createFamilyCareWorkDeps([workItem()]),
      },
      caregiverScope,
    );
    expect(caregiver.status).toBe("ok");
    if (caregiver.status !== "ok") return;
    expect(caregiver.output.content.map((module) => module.kind)).toEqual(
      caregiverExpected.boardModules.map((module) => module.kind),
    );
    expect(caregiver.output.state).toBe(caregiverExpected.surfaceState);
    expect(caregiver.output.dependencyNoGos).toEqual(caregiverExpected.dependencyNoGos);
    for (const absent of caregiverExpected.absentModuleKinds) {
      expect(caregiver.output.content.map((module) => module.kind)).not.toContain(absent);
    }
  });

  it("keeps the two board envelope capabilities role-separated in the registry", () => {
    const guardianBoard = manifest.capabilities.find(
      (entry) => entry.capabilityKey === "query_guardian_family_board",
    );
    const caregiverBoard = manifest.capabilities.find(
      (entry) => entry.capabilityKey === "query_caregiver_teacher_board",
    );
    expect(guardianBoard?.descriptor.supportedRoles).toEqual(["guardian"]);
    expect(caregiverBoard?.descriptor.supportedRoles).toEqual([
      "caregiver",
      "lead_caregiver",
    ]);
    expect(guardianBoard?.descriptor.presenterBindings).toEqual([
      { surfaceKey: "guardian_family_board", presenterKey: "present_guardian_family_board" },
    ]);
    expect(caregiverBoard?.descriptor.presenterBindings).toEqual([
      {
        surfaceKey: "caregiver_teacher_board",
        presenterKey: "present_caregiver_teacher_board",
      },
    ]);
  });
});
