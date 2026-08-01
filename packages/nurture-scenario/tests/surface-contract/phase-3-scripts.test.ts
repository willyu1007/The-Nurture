import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");
const fixturesRoot = path.join(sourceRoot, "fixtures");

const JOURNEY_KEYS = ["gj-1", "gj-2", "gj-3", "gj-4", "gj-5", "rj-1"] as const;

interface CapabilityShape {
  target: "enrollmentId" | "careItemRef" | "messageRef";
  input: "body" | "empty" | "policyDecisionRef";
  effects: readonly string[];
}

const CAPABILITY_SHAPES: Record<string, CapabilityShape> = {
  submit_family_care_question: {
    target: "enrollmentId",
    input: "body",
    effects: ["question_created"],
  },
  acknowledge_family_care_item: {
    target: "careItemRef",
    input: "empty",
    effects: ["acknowledged", "already_satisfied"],
  },
  reply_family_care_item: {
    target: "careItemRef",
    input: "body",
    effects: ["reply_appended"],
  },
  withdraw_family_care_request: {
    target: "careItemRef",
    input: "empty",
    effects: ["request_withdrawn"],
  },
  correct_family_care_message: {
    target: "messageRef",
    input: "body",
    effects: ["correction_appended"],
  },
  redact_family_care_message: {
    target: "messageRef",
    input: "empty",
    effects: ["content_redacted"],
  },
  policy_redact_family_care_message: {
    target: "messageRef",
    input: "policyDecisionRef",
    effects: ["policy_content_redacted"],
  },
  query_guardian_family_care_timeline: {
    target: "enrollmentId",
    input: "empty",
    effects: [],
  },
  query_caregiver_family_care_work: {
    target: "enrollmentId",
    input: "empty",
    effects: [],
  },
  query_family_care_item: {
    target: "careItemRef",
    input: "empty",
    effects: [],
  },
};

const world = record(
  JSON.parse(
    readFileSync(path.join(fixturesRoot, "world/world-v1.json"), "utf8"),
  ) as unknown,
);
const capabilityRegistry = record(
  JSON.parse(
    readFileSync(
      path.join(sourceRoot, "capabilities/capability-registry.json"),
      "utf8",
    ),
  ) as unknown,
);
const surfaceRegistry = record(
  JSON.parse(
    readFileSync(path.join(sourceRoot, "surfaces/surface-registry.json"), "utf8"),
  ) as unknown,
);

const supportedRolesByCapability = new Map(
  records(capabilityRegistry.capabilities).map((capability) => [
    text(capability.capabilityKey),
    strings(capability.supportedRoles),
  ]),
);
const actorRolesBySurface = new Map(
  records(surfaceRegistry.surfaces).map((surface) => [
    text(surface.surfaceKey),
    strings(surface.actorRoles),
  ]),
);

const worldIds = new Set(
  [
    ["participants", "participantId"],
    ["families", "familyId"],
    ["children", "childId"],
    ["childCareProcesses", "processId"],
    ["institutions", "institutionId"],
    ["careGroups", "careGroupId"],
    ["caregiverAssignments", "assignmentId"],
    ["enrollments", "enrollmentId"],
    ["familyCareGrants", "grantId"],
  ].flatMap(([collection, key]) =>
    records(world[collection]).map((entry) => text(entry[key])),
  ),
);

const scriptedJourneys = JOURNEY_KEYS.filter((journeyKey) =>
  existsSync(path.join(fixturesRoot, `journeys/${journeyKey}/script.json`)),
).map((journeyKey) => {
  const journeyRoot = path.join(fixturesRoot, `journeys/${journeyKey}`);
  const initialState = record(
    JSON.parse(readFileSync(path.join(journeyRoot, "initial-state.json"), "utf8")) as unknown,
  );
  const scriptText = readFileSync(path.join(journeyRoot, "script.json"), "utf8");
  const script = record(JSON.parse(scriptText) as unknown);
  const expectedDirectory = path.join(journeyRoot, "expected");
  const views = readdirSync(expectedDirectory)
    .sort()
    .map((name) => {
      const viewText = readFileSync(path.join(expectedDirectory, name), "utf8");
      return { name: `expected/${name}`, viewText, view: record(JSON.parse(viewText) as unknown) };
    });
  return {
    journeyKey,
    prefix: `syn-${journeyKey.replace("-", "")}-`,
    initialState,
    script,
    scriptText,
    views,
  };
});

function journeyKnownIds(entry: (typeof scriptedJourneys)[number]): Set<string> {
  const overlay = record(entry.initialState.overlay);
  const known = new Set(worldIds);
  for (const participant of records(overlay.additionalParticipants)) {
    known.add(text(participant.participantId));
  }
  for (const assignment of records(overlay.institutionAdminAssignments)) {
    known.add(text(assignment.assignmentId));
  }
  for (const grant of records(overlay.additionalFamilyCareGrants)) {
    known.add(text(grant.grantId));
  }
  for (const item of records(overlay.preexistingCareItems)) {
    const itemId = text(item.itemId);
    known.add(itemId);
    known.add(`${itemId}-msg-question`);
    if (text(item.state) === "responded") known.add(`${itemId}-msg-reply`);
  }
  for (const step of allSteps(entry.script)) {
    const aliases = step.createsAliases;
    if (aliases) {
      for (const alias of Object.values(record(aliases))) known.add(text(alias));
    }
    if (step.kind === "world_transition" && step.grant) {
      known.add(text(record(step.grant).grantId));
    }
    const input = step.input ? record(step.input) : undefined;
    if (input && typeof input.policyDecisionRef === "string") {
      known.add(input.policyDecisionRef);
    }
  }
  return known;
}

function allSteps(script: Record<string, unknown>): Record<string, unknown>[] {
  return [...records(script.valueLoop), record(script.refusal)];
}

describe("Phase 3 journey scripts", () => {
  it("covers each scripted journey with one refusal and consistent actors", () => {
    for (const entry of scriptedJourneys) {
      const declaredActors = new Set(
        records(entry.initialState.actorSet).map(
          (actor) => `${text(actor.participantId)}:${text(actor.actorRole)}`,
        ),
      );
      expect(text(entry.script.journeyKey)).toBe(entry.journeyKey);
      const loopKeys = records(entry.script.valueLoop).map((step) =>
        text(step.stepKey),
      );
      expect(new Set(loopKeys).size).toBe(loopKeys.length);
      const refusal = record(entry.script.refusal);
      if (typeof refusal.afterStepKey === "string") {
        expect(
          records(entry.script.valueLoop).map((step) => text(step.stepKey)),
          `${entry.journeyKey} afterStepKey`,
        ).toContain(refusal.afterStepKey);
      }
      for (const step of allSteps(entry.script)) {
        if (step.kind === "world_transition") continue;
        const actor = record(step.actor);
        if (actor.actorRole === "system_policy") {
          expect(step.capabilityKey).toBe("policy_redact_family_care_message");
          continue;
        }
        expect(
          declaredActors,
          `${entry.journeyKey}/${text(step.stepKey)} actor`,
        ).toContain(`${text(actor.participantId)}:${text(actor.actorRole)}`);
      }
    }
  });

  it("keeps every action consistent with its capability contract", () => {
    for (const entry of scriptedJourneys) {
      for (const step of allSteps(entry.script)) {
        if (step.kind !== "action" && step.kind !== "invocation_refused") continue;
        const capabilityKey = text(step.capabilityKey);
        const shape = CAPABILITY_SHAPES[capabilityKey];
        expect(shape, `${entry.journeyKey} unknown ${capabilityKey}`).toBeDefined();
        const target = record(step.target);
        expect(Object.keys(target)).toEqual([shape.target]);
        const input = record(step.input);
        if (shape.input === "body") {
          expect(Object.keys(input)).toEqual(["body"]);
          expect(text(input.body)).toMatch(/^Syn(?: [A-Z][a-z0-9]+)+$/);
        } else if (shape.input === "policyDecisionRef") {
          expect(Object.keys(input)).toEqual(["policyDecisionRef"]);
        } else {
          expect(Object.keys(input)).toEqual([]);
        }
        const actorRole = text(record(step.actor).actorRole);
        expect(
          supportedRolesByCapability.get(capabilityKey),
          `${entry.journeyKey}/${text(step.stepKey)} role`,
        ).toContain(actorRole);
        if (step.kind === "action") {
          expect(shape.effects).toContain(text(record(step.expected).effect));
        }
      }
    }
  });

  it("namespaces every created alias and resolves every reference", () => {
    for (const entry of scriptedJourneys) {
      const known = journeyKnownIds(entry);
      for (const step of allSteps(entry.script)) {
        const aliases = step.createsAliases;
        if (aliases) {
          for (const alias of Object.values(record(aliases))) {
            expect(
              text(alias).startsWith(entry.prefix),
              `${entry.journeyKey} alias ${alias}`,
            ).toBe(true);
            expect(worldIds.has(text(alias))).toBe(false);
          }
        }
      }
      const documents = [
        { label: "script.json", value: entry.script },
        ...entry.views.map((view) => ({ label: view.name, value: view.view })),
      ];
      for (const document of documents) {
        for (const value of stringValues(document.value)) {
          if (!value.startsWith("syn-")) continue;
          expect(
            known.has(value) || value.startsWith(entry.prefix),
            `${entry.journeyKey} ${document.label} unresolved ${value}`,
          ).toBe(true);
          expect(
            known.has(value),
            `${entry.journeyKey} ${document.label} unknown ${value}`,
          ).toBe(true);
        }
        for (const other of scriptedJourneys) {
          if (other.journeyKey === entry.journeyKey) continue;
          expect(JSON.stringify(document.value)).not.toContain(other.prefix);
        }
      }
    }
  });

  it("binds every expected view to its step, surface and known items", () => {
    for (const entry of scriptedJourneys) {
      const referenced = new Set(
        allSteps(entry.script)
          .flatMap((step) => [step.expectedViewRef, step.postConditionViewRef])
          .filter((ref): ref is string => typeof ref === "string"),
      );
      expect(new Set(entry.views.map((view) => view.name))).toEqual(referenced);
      const stepByViewRef = new Map(
        allSteps(entry.script)
          .filter((step) => typeof step.expectedViewRef === "string" || typeof step.postConditionViewRef === "string")
          .map((step) => [
            (step.expectedViewRef ?? step.postConditionViewRef) as string,
            step,
          ]),
      );
      const known = journeyKnownIds(entry);
      for (const { name, view } of entry.views) {
        expect(text(view.journeyKey)).toBe(entry.journeyKey);
        const owningStep = stepByViewRef.get(name);
        expect(owningStep, `${entry.journeyKey} ${name} owner`).toBeDefined();
        expect(text(view.stepKey)).toBe(text(record(owningStep).stepKey));
        const surfaceKey = text(view.surfaceKey);
        const actorRole = text(record(view.actor).actorRole);
        expect(
          actorRolesBySurface.get(surfaceKey),
          `${entry.journeyKey} ${name} role/surface`,
        ).toContain(actorRole);
        const owner = record(owningStep);
        if (typeof owner.surfaceKey === "string") {
          // View steps and affordance refusals declare the observing surface
          // and actor; a refusal post-condition may legitimately be another
          // actor's unchanged view, so only these bind actor identity.
          expect(surfaceKey).toBe(text(owner.surfaceKey));
          expect(record(view.actor)).toEqual(record(owner.actor));
        }
        for (const actionKey of strings(view.writeActionKeys)) {
          expect(
            supportedRolesByCapability.get(actionKey),
            `${entry.journeyKey} ${name} affordance ${actionKey}`,
          ).toContain(actorRole);
        }
        for (const item of records(view.careItems)) {
          expect(known, `${entry.journeyKey} ${name} item`).toContain(
            text(item.itemRef),
          );
        }
      }
    }
  });

  it("never references an alias before its creating step", () => {
    for (const entry of scriptedJourneys) {
      const base = journeyKnownIds(entry);
      for (const step of allSteps(entry.script)) {
        const aliases = step.createsAliases;
        if (aliases) for (const a of Object.values(record(aliases))) base.delete(text(a));
        if (step.kind === "world_transition" && step.grant) base.delete(text(record(step.grant).grantId));
      }
      const available = new Set(base);
      const loop = records(entry.script.valueLoop);
      const useSites = (step: Record<string, unknown>) =>
        [step.target, step.input].flatMap((value) => stringValues(value ?? {}));
      for (const step of loop) {
        for (const ref of useSites(step)) {
          if (!ref.startsWith("syn-")) continue;
          expect(available, `${entry.journeyKey}/${text(step.stepKey)} early ref ${ref}`).toContain(ref);
        }
        const aliases = step.createsAliases;
        if (aliases) for (const a of Object.values(record(aliases))) available.add(text(a));
        if (step.kind === "world_transition" && step.grant) available.add(text(record(step.grant).grantId));
      }
      const refusal = record(entry.script.refusal);
      if (refusal.kind === "invocation_refused") {
        const upTo = typeof refusal.afterStepKey === "string" ? refusal.afterStepKey : undefined;
        const refusalAvailable = new Set(base);
        for (const step of loop) {
          if (upTo === undefined) break;
          const aliases = step.createsAliases;
          if (aliases) for (const a of Object.values(record(aliases))) refusalAvailable.add(text(a));
          if (step.kind === "world_transition" && step.grant) refusalAvailable.add(text(record(step.grant).grantId));
          if (text(step.stepKey) === upTo) break;
        }
        for (const ref of useSites(refusal)) {
          if (!ref.startsWith("syn-")) continue;
          expect(refusalAvailable, `${entry.journeyKey} refusal early ref ${ref}`).toContain(ref);
        }
      }
    }
  });

  it("contains only whitelisted synthetic vocabulary", () => {
    const allowed = [
      /^syn-[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^Syn(?: [A-Z][a-z0-9]+)+$/,
      /^world-v[0-9]+$/,
      /^expected\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/,
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^[a-z]+(?:_[a-z0-9]+)*$/,
    ];
    for (const entry of scriptedJourneys) {
      const texts = [entry.scriptText, ...entry.views.map((view) => view.viewText)];
      const values = [
        ...stringValues(entry.script),
        ...entry.views.flatMap((view) => stringValues(view.view)),
      ];
      for (const value of values) {
        expect(
          allowed.some((pattern) => pattern.test(value)),
          `${entry.journeyKey} non-whitelisted string: ${value}`,
        ).toBe(true);
      }
      for (const raw of texts) {
        const lowered = raw.toLowerCase();
        for (const forbidden of [
          '"component"',
          '"props"',
          "child_id",
          "family_id",
          "binding_anchor",
          "role_assignment",
          "prisma",
          "workflow_step",
          "birth",
        ]) {
          expect(lowered, entry.journeyKey).not.toContain(forbidden);
        }
      }
    }
  });
});

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object");
  }
  return value as JsonRecord;
}

function records(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) throw new Error("Expected a JSON array");
  return value.map(record);
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected a string");
  return value;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Expected a string array");
  return value.map(text);
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringValues);
  }
  return [];
}
