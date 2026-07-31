import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixturesRoot = path.join(
  packageRoot,
  "contracts/surfaces/v1/source/fixtures",
);

const JOURNEY_KEYS = ["gj-1", "gj-2", "gj-3", "gj-4", "gj-5", "rj-1"] as const;

const world = record(
  JSON.parse(
    readFileSync(path.join(fixturesRoot, "world/world-v1.json"), "utf8"),
  ) as unknown,
);

const journeys = JOURNEY_KEYS.map((journeyKey) => {
  const filePath = path.join(
    fixturesRoot,
    `journeys/${journeyKey}/initial-state.json`,
  );
  const text = readFileSync(filePath, "utf8");
  return {
    journeyKey,
    prefix: `syn-${journeyKey.replace("-", "")}-`,
    text,
    state: record(JSON.parse(text) as unknown),
  };
});

const worldIds = new Set([
  ...ids(world.participants, "participantId"),
  ...ids(world.families, "familyId"),
  ...ids(world.children, "childId"),
  ...ids(world.childCareProcesses, "processId"),
  ...ids(world.institutions, "institutionId"),
  ...ids(world.careGroups, "careGroupId"),
  ...ids(world.caregiverAssignments, "assignmentId"),
  ...ids(world.enrollments, "enrollmentId"),
  ...ids(world.familyCareGrants, "grantId"),
]);
const worldEnrollmentIds = new Set(ids(world.enrollments, "enrollmentId"));
const worldFamilyIds = new Set(ids(world.families, "familyId"));
const worldInstitutionIds = new Set(ids(world.institutions, "institutionId"));
const guardianIds = new Set(
  records(world.families).flatMap((family) =>
    strings(family.guardianParticipantIds),
  ),
);
const caregiverRoleByParticipant = new Map(
  records(world.caregiverAssignments).map((assignment) => [
    text(assignment.participantId),
    text(assignment.actorRole),
  ]),
);

describe("Phase 3 journey initial states", () => {
  it("binds every journey to the exact versioned world", () => {
    for (const { journeyKey, state } of journeys) {
      expect(text(state.journeyKey)).toBe(journeyKey);
      expect(record(state.worldRef)).toEqual({
        worldKey: text(world.worldKey),
        worldVersion: text(world.worldVersion),
      });
    }
  });

  it("resolves every actor to a consistent role source", () => {
    for (const { journeyKey, state } of journeys) {
      const overlay = record(state.overlay);
      const overlayParticipants = new Set(
        ids(overlay.additionalParticipants, "participantId"),
      );
      const adminAssignments = records(overlay.institutionAdminAssignments);
      for (const actor of records(state.actorSet)) {
        const participantId = text(actor.participantId);
        const actorRole = text(actor.actorRole);
        const known =
          worldIds.has(participantId) || overlayParticipants.has(participantId);
        expect(known, `${journeyKey} unknown actor ${participantId}`).toBe(true);
        if (actorRole === "guardian") {
          expect(guardianIds, `${journeyKey} ${participantId}`).toContain(
            participantId,
          );
        } else if (actorRole === "caregiver" || actorRole === "lead_caregiver") {
          expect(
            caregiverRoleByParticipant.get(participantId),
            `${journeyKey} ${participantId}`,
          ).toBe(actorRole);
        } else {
          expect(actorRole).toBe("institution_admin");
          expect(
            adminAssignments.some(
              (assignment) => text(assignment.participantId) === participantId,
            ),
            `${journeyKey} ${participantId} lacks an admin assignment`,
          ).toBe(true);
        }
      }
    }
  });

  it("keeps overlay references inside the world and namespaces overlay ids", () => {
    for (const { journeyKey, prefix, state } of journeys) {
      const overlay = record(state.overlay);
      const overlayParticipantIds = new Set(
        ids(overlay.additionalParticipants, "participantId"),
      );
      const definedIds = [
        ...ids(overlay.additionalParticipants, "participantId"),
        ...ids(overlay.institutionAdminAssignments, "assignmentId"),
        ...ids(overlay.additionalFamilyCareGrants, "grantId"),
        ...ids(overlay.preexistingCareItems, "itemId"),
      ];
      for (const definedId of definedIds) {
        expect(
          definedId.startsWith(prefix),
          `${journeyKey} overlay id ${definedId} must use prefix ${prefix}`,
        ).toBe(true);
        expect(worldIds.has(definedId)).toBe(false);
      }
      for (const assignment of records(overlay.institutionAdminAssignments)) {
        const participantId = text(assignment.participantId);
        expect(
          worldIds.has(participantId) || overlayParticipantIds.has(participantId),
        ).toBe(true);
        expect(worldInstitutionIds).toContain(text(assignment.institutionId));
      }
      for (const grant of records(overlay.additionalFamilyCareGrants)) {
        expect(worldEnrollmentIds).toContain(text(grant.enrollmentId));
        expect(worldFamilyIds).toContain(text(grant.familyId));
      }
      for (const item of records(overlay.preexistingCareItems)) {
        expect(worldEnrollmentIds).toContain(text(item.enrollmentId));
        const submitter = text(item.submittedByParticipantId);
        expect(
          worldIds.has(submitter) || overlayParticipantIds.has(submitter),
        ).toBe(true);
      }
    }
  });

  it("stays pairwise independent across journeys", () => {
    for (const { journeyKey, prefix, state } of journeys) {
      for (const value of stringValues(state)) {
        if (!value.startsWith("syn-")) continue;
        expect(
          worldIds.has(value) || value.startsWith(prefix),
          `${journeyKey} references foreign artifact ${value}`,
        ).toBe(true);
      }
      for (const other of journeys) {
        if (other.journeyKey === journeyKey) continue;
        expect(
          state && !JSON.stringify(state).includes(other.prefix),
          `${journeyKey} must not mention ${other.prefix}`,
        ).toBe(true);
      }
    }
  });

  it("provides the preconditions each journey narrative depends on", () => {
    const byKey = new Map(journeys.map((entry) => [entry.journeyKey, entry.state]));
    const overlayGrants = (state: Record<string, unknown>) =>
      records(record(state.overlay).additionalFamilyCareGrants);
    // GJ-1 refusal leg: the second enrollment stays ungranted.
    expect(
      overlayGrants(required(byKey.get("gj-1"))).some(
        (grant) => text(grant.enrollmentId) === "syn-enrollment-c1-ib",
      ),
    ).toBe(false);
    // GJ-2 value loop: an acknowledged item awaits the caregiver reply.
    expect(
      records(record(required(byKey.get("gj-2")).overlay).preexistingCareItems).map(
        (item) => text(item.state),
      ),
    ).toEqual(["acknowledged"]);
    // GJ-3 aggregation: both enrollments of the shared process are granted.
    expect(
      overlayGrants(required(byKey.get("gj-3"))).map((grant) =>
        text(grant.enrollmentId),
      ),
    ).toEqual(["syn-enrollment-c1-ib"]);
    // GJ-4 readiness progression starts from the world's pre-grant axis.
    expect(overlayGrants(required(byKey.get("gj-4")))).toEqual([]);
    // GJ-5 institution voice: exactly one admin actor bound to one institution.
    const gj5 = required(byKey.get("gj-5"));
    expect(
      records(gj5.actorSet).filter(
        (actor) => text(actor.actorRole) === "institution_admin",
      ),
    ).toHaveLength(1);
    // RJ-1 revoke/correct/recover: a responded history item plus an open item.
    expect(
      records(record(required(byKey.get("rj-1")).overlay).preexistingCareItems).map(
        (item) => text(item.state),
      ),
    ).toEqual(["responded", "submitted"]);
  });

  it("contains only whitelisted synthetic vocabulary", () => {
    const allowed = [
      /^syn-[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^Syn(?: [A-Z][a-z0-9]+)+$/,
      /^world-v[0-9]+$/,
      /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/,
      /^(?:gj|rj)-[1-9]$/,
      /^(?:guardian|caregiver|lead_caregiver|institution_admin)$/,
      /^(?:submitted|acknowledged|responded|current|family_care_interaction)$/,
    ];
    for (const { journeyKey, text: rawText, state } of journeys) {
      for (const value of stringValues(state)) {
        expect(
          allowed.some((pattern) => pattern.test(value)),
          `${journeyKey} non-whitelisted string: ${value}`,
        ).toBe(true);
      }
      const lowered = rawText.toLowerCase();
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
        expect(lowered, journeyKey).not.toContain(forbidden);
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

function ids(value: unknown, key: string): string[] {
  return records(value).map((entry) => text(entry[key]));
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing journey state");
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
