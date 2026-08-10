import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");
const fixturesRoot = path.join(sourceRoot, "fixtures");

const SELECTION_PREFIX = "syn-sel-";
const JOURNEY_PREFIXES = ["syn-gj1-", "syn-gj2-", "syn-gj3-", "syn-gj4-", "syn-gj5-", "syn-rj1-"];
const FAMILIES = [
  "candidate_filtering",
  "correct_selection",
  "clarification_needed",
  "confirmation_needed",
  "unavailable",
] as const;

const selectionText = readFileSync(
  path.join(fixturesRoot, "selection/selection-cases.json"),
  "utf8",
);
const selection = record(JSON.parse(selectionText) as unknown);
const cases = records(selection.cases);

const world = record(
  JSON.parse(
    readFileSync(path.join(fixturesRoot, "world/world-v1.json"), "utf8"),
  ) as unknown,
);
const profile = record(
  JSON.parse(
    readFileSync(
      path.join(fixturesRoot, "world/profile-single-institution.json"),
      "utf8",
    ),
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

const capabilities = records(capabilityRegistry.capabilities);
// The dedicated I2-B suite owns this gate's exact inventory. Deriving the
// exclusion from the registry avoids copying 24 keys into historical fixtures.
const separatelyQualifiedI2BKeys = new Set(
  capabilities
    .filter((capability) =>
      records(capability.dependencyGates).some(
        (gate) => text(gate.dependencyKey) === "t007_enrollment_journey_runtime",
      ),
    )
    .map((capability) => text(capability.capabilityKey)),
);
const capabilityByKey = new Map(
  capabilities.map((capability) => [text(capability.capabilityKey), capability]),
);
const allCapabilityKeys = [...capabilityByKey.keys()]
  .filter((key) => !separatelyQualifiedI2BKeys.has(key))
  .sort();
const intentUnion = new Set(
  capabilities.flatMap((capability) => strings(capability.intentKeys)),
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
const guardianIds = new Set(
  records(world.families).flatMap((family) =>
    strings(family.guardianParticipantIds),
  ),
);
const familyOfGuardian = new Map(
  records(world.families).flatMap((family) =>
    strings(family.guardianParticipantIds).map((guardian) => [
      guardian,
      text(family.familyId),
    ]),
  ),
);
const caregiverRoleByParticipant = new Map(
  records(world.caregiverAssignments).map((assignment) => [
    text(assignment.participantId),
    text(assignment.actorRole),
  ]),
);
const worldGrants = records(world.familyCareGrants);

function caseOverlayIds(entry: Record<string, unknown>): Set<string> {
  const context = record(entry.context);
  return new Set([
    ...records(context.additionalFamilyCareGrants).map((grant) =>
      text(grant.grantId),
    ),
    ...records(context.additionalCareItems).map((item) => text(item.itemId)),
  ]);
}

describe("Phase 3 capability selection fixtures", () => {
  it("binds the exact world and covers all five families", () => {
    expect(record(selection.worldRef)).toEqual({
      worldKey: text(world.worldKey),
      worldVersion: text(world.worldVersion),
    });
    const present = new Set(cases.map((entry) => text(entry.family)));
    for (const family of FAMILIES) expect(present).toContain(family);
    const keys = cases.map((entry) => text(entry.caseKey));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("grounds every actor and intent in the world and registry", () => {
    for (const entry of cases) {
      const actor = record(entry.actor);
      const participantId = text(actor.participantId);
      const actorRole = text(actor.actorRole);
      expect(worldIds, participantId).toContain(participantId);
      if (actorRole === "guardian") {
        expect(guardianIds).toContain(participantId);
      } else {
        expect(caregiverRoleByParticipant.get(participantId)).toBe(actorRole);
      }
      expect(intentUnion, text(entry.caseKey)).toContain(text(entry.intentKey));
    }
  });

  it("keeps candidate filtering a complete role-consistent partition", () => {
    for (const entry of cases) {
      if (text(entry.family) !== "candidate_filtering") continue;
      const expected = record(entry.expected);
      const eligible = strings(expected.eligibleCapabilityKeys);
      const filteredOut = records(expected.filteredOut);
      const partition = [
        ...eligible,
        ...filteredOut.map((reason) => text(reason.capabilityKey)),
      ].sort();
      expect(partition, text(entry.caseKey)).toEqual(allCapabilityKeys);
      const actorRole = text(record(entry.actor).actorRole);
      for (const capabilityKey of eligible) {
        expect(
          strings(required(capabilityByKey.get(capabilityKey)).supportedRoles),
          `${text(entry.caseKey)} ${capabilityKey}`,
        ).toContain(actorRole);
      }
      for (const reason of filteredOut) {
        const capabilityKey = text(reason.capabilityKey);
        const supported = strings(
          required(capabilityByKey.get(capabilityKey)).supportedRoles,
        );
        if (text(reason.reasonKind) === "role_unsupported") {
          expect(supported, capabilityKey).not.toContain(actorRole);
        } else {
          expect(supported, capabilityKey).toContain(actorRole);
        }
      }
    }
  });

  it("selects deterministically only when the target is unique", () => {
    const profileResolution = new Map(
      records(profile.writeTargetResolution).map((entry) => [
        text(entry.processId),
        text(entry.enrollmentId),
      ]),
    );
    for (const entry of cases) {
      const family = text(entry.family);
      if (family === "correct_selection" || family === "confirmation_needed") {
        const expected = record(entry.expected);
        const selectedKey = text(expected.selectedCapabilityKey);
        const capability = required(capabilityByKey.get(selectedKey));
        expect(strings(capability.intentKeys)).toContain(text(entry.intentKey));
        expect(strings(capability.supportedRoles)).toContain(
          text(record(entry.actor).actorRole),
        );
        const target = record(expected.target);
        if (typeof target.enrollmentId === "string") {
          expect(text(record(entry.context).profile)).toBe(
            "single-institution-pilot",
          );
          expect([...profileResolution.values()]).toContain(target.enrollmentId);
        }
        if (family === "confirmation_needed") {
          expect(text(expected.confirmationPolicy)).toBe(
            text(capability.confirmationPolicy),
          );
        }
      }
      if (family === "clarification_needed") {
        const context = record(entry.context);
        expect(text(context.profile)).toBe("world");
        const actorFamily = required(
          familyOfGuardian.get(text(record(entry.actor).participantId)),
        );
        const grantedEnrollments = [
          ...worldGrants,
          ...records(context.additionalFamilyCareGrants),
        ]
          .filter((grant) => text(grant.familyId) === actorFamily)
          .map((grant) => text(grant.enrollmentId))
          .sort();
        const options = strings(record(entry.expected).options).sort();
        expect(options, text(entry.caseKey)).toEqual(grantedEnrollments);
        expect(options.length).toBeGreaterThanOrEqual(2);
      }
      if (family === "unavailable") {
        expect(text(record(entry.context).dependencyEvidence)).toBe("none");
        const gateKeys = records(
          required(
            capabilityByKey.get(
              intentCapability(text(entry.intentKey)),
            ),
          ).dependencyGates,
        ).map((gate) => text(gate.dependencyKey));
        expect(gateKeys).toContain(
          text(record(entry.expected).missingDependencyKey),
        );
      }
    }
  });

  it("namespaces overlay ids and stays independent of journey fixtures", () => {
    for (const entry of cases) {
      const overlayIds = caseOverlayIds(entry);
      for (const overlayId of overlayIds) {
        expect(
          overlayId.startsWith(SELECTION_PREFIX),
          `${text(entry.caseKey)} overlay id ${overlayId}`,
        ).toBe(true);
        expect(worldIds.has(overlayId)).toBe(false);
      }
      for (const value of stringValues(entry)) {
        if (!value.startsWith("syn-")) continue;
        expect(
          worldIds.has(value) || overlayIds.has(value),
          `${text(entry.caseKey)} unresolved ${value}`,
        ).toBe(true);
      }
    }
    for (const prefix of JOURNEY_PREFIXES) {
      expect(selectionText).not.toContain(prefix);
    }
  });

  it("contains only whitelisted synthetic vocabulary", () => {
    const allowed = [
      /^syn-[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^world-v[0-9]+$/,
      /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/,
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
    ];
    for (const value of stringValues(selection)) {
      expect(
        allowed.some((pattern) => pattern.test(value)),
        `non-whitelisted string: ${value}`,
      ).toBe(true);
    }
    const lowered = selectionText.toLowerCase();
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
      expect(lowered).not.toContain(forbidden);
    }
  });
});

function intentCapability(intentKey: string): string {
  const matches = capabilities.filter((capability) =>
    strings(capability.intentKeys).includes(intentKey),
  );
  if (matches.length !== 1) {
    throw new Error(`Intent ${intentKey} does not resolve to one capability`);
  }
  return text(matches[0].capabilityKey);
}

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

function required<T>(value: T | undefined, label = "value"): T {
  if (value === undefined) throw new Error(`Missing ${label}`);
  return value;
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringValues);
  }
  return [];
}
