import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const worldRoot = path.join(
  packageRoot,
  "contracts/surfaces/v1/source/fixtures/world",
);
const generatedManifestPath = path.join(
  packageRoot,
  "contracts/surfaces/v1/generated/surface-contract.manifest.json",
);

const worldText = readFileSync(path.join(worldRoot, "world-v1.json"), "utf8");
const profileText = readFileSync(
  path.join(worldRoot, "profile-single-institution.json"),
  "utf8",
);
// Duplicate-key strictness for every source JSON file, fixtures included, is
// enforced by the deterministic build (`pnpm verify:surface-contract`).
const world = record(JSON.parse(worldText) as unknown);
const profile = record(JSON.parse(profileText) as unknown);
const manifest = record(
  JSON.parse(readFileSync(generatedManifestPath, "utf8")) as unknown,
);

// Frozen at the exact 1.0.1 quality-closed baseline. Adding fixture slices
// must never move the shared envelope layer or any existing slice.
const frozenSharedCoreHash =
  "sha256:be3da7b93e812f3a648adbb251525ef0f75d0c09988377c9e1904633f98c6312";
const frozenCapabilitySliceHashes: readonly (readonly [string, string])[] = [
  ["acknowledge_family_care_item", "sha256:b9c4ca09071121b04404ba88db3939cffa213a88848f79cd65dad936f6138037"],
  ["correct_family_care_message", "sha256:0680749bafda1f619d38b352e73f6e7338f92282bdc0d286da97468f2abea759"],
  ["policy_redact_family_care_message", "sha256:6ea83260c0ce7141ffdcc4b781ea28613feeb9f2be123131c0a3711f00612371"],
  ["query_caregiver_family_care_work", "sha256:a1cf57465ed3cf92f20b4ccb6f4fdd84ecf1184af3f3191b6916a8ab8c5baed1"],
  ["query_family_care_item", "sha256:5342ff415c90502ec7bbb8180e2e98e16c6d51b68d8a1c6aefd84d579b479383"],
  ["query_guardian_family_care_timeline", "sha256:a7134a4edbd03564fbe2e100964b4e1a4cbbb204de3a6f83bf74aa647c490a95"],
  ["redact_family_care_message", "sha256:4ee6651d7fea6484c26b91f4267225b8e7e08f903209ac9a9bd842132edd3e59"],
  ["reply_family_care_item", "sha256:1ecf2e934a61b4ffeefa84fafe26175e163ade011e38271437960073f851eb69"],
  ["submit_family_care_question", "sha256:f27fda9fcab235488e2a54528f6ef07128fb5195d0a0ff7683bbc424d41b2746"],
  ["withdraw_family_care_request", "sha256:c833a0e07149472232d7a314f731953ad83ce6d6aa05ef1ee846635e4ac38134"],
];
const frozenSurfaceSliceHashes: readonly (readonly [string, string])[] = [
  ["caregiver_nurture_chat", "sha256:34abcdaa268463807750ea5a8b4b6b6c73547aa644153db43a19271569247f4d"],
  ["caregiver_teacher_board", "sha256:f0b87088fcd2fcfc7569faefbbe6833c04269c009501f6f81f426ce47c8d1b61"],
  ["guardian_family_board", "sha256:cf8dcc935baac9510ccd5aedfe5a3fbc32e0dde28a6168efbebacaa52e4caff8"],
  ["guardian_nurture_chat", "sha256:9350a5ae228f3844ce5d03e11722012480ee8e2b6813ae676c6ead00a5248256"],
  ["institution_board", "sha256:c2d5c98223fb399bf0e3b86fdf005106b88902e55cd307c0550a9481ce677cdc"],
  ["institution_workbench", "sha256:ed2ad109da46672fb394eb77ceb818b14d6f318ce7af55797a25d500120b220d"],
];

const participants = records(world.participants);
const families = records(world.families);
const children = records(world.children);
const processes = records(world.childCareProcesses);
const institutions = records(world.institutions);
const careGroups = records(world.careGroups);
const assignments = records(world.caregiverAssignments);
const enrollments = records(world.enrollments);
const grants = records(world.familyCareGrants);

const participantIds = idSet(participants, "participantId");
const familyIds = idSet(families, "familyId");
const childIds = idSet(children, "childId");
const processIds = idSet(processes, "processId");
const institutionIds = idSet(institutions, "institutionId");
const careGroupIds = idSet(careGroups, "careGroupId");
const enrollmentIds = idSet(enrollments, "enrollmentId");

const careGroupInstitution = new Map(
  careGroups.map((group) => [text(group.careGroupId), text(group.institutionId)]),
);
const enrollmentById = new Map(
  enrollments.map((enrollment) => [text(enrollment.enrollmentId), enrollment]),
);

describe("Phase 3 synthetic world", () => {
  it("holds globally unique synthetic identifiers", () => {
    const allIds = [
      ...participantIds,
      ...familyIds,
      ...childIds,
      ...processIds,
      ...institutionIds,
      ...careGroupIds,
      ...idSet(assignments, "assignmentId"),
      ...enrollmentIds,
      ...idSet(grants, "grantId"),
    ];
    expect(new Set(allIds).size).toBe(allIds.length);
    for (const id of allIds) expect(id).toMatch(/^syn-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("resolves every cross-reference", () => {
    for (const family of families) {
      for (const guardian of strings(family.guardianParticipantIds)) {
        expect(participantIds, `guardian ${guardian}`).toContain(guardian);
      }
    }
    for (const child of children) {
      expect(familyIds).toContain(text(child.familyId));
    }
    for (const process of processes) {
      expect(childIds).toContain(text(process.childId));
    }
    for (const group of careGroups) {
      expect(institutionIds).toContain(text(group.institutionId));
    }
    for (const assignment of assignments) {
      expect(participantIds).toContain(text(assignment.participantId));
      expect(careGroupIds).toContain(text(assignment.careGroupId));
    }
    for (const enrollment of enrollments) {
      expect(processIds).toContain(text(enrollment.processId));
      expect(institutionIds).toContain(text(enrollment.institutionId));
      expect(careGroupIds).toContain(text(enrollment.careGroupId));
    }
    for (const grant of grants) {
      expect(enrollmentIds).toContain(text(grant.enrollmentId));
      expect(familyIds).toContain(text(grant.familyId));
    }
  });

  it("keeps the two institutions structurally isolated", () => {
    for (const enrollment of enrollments) {
      expect(careGroupInstitution.get(text(enrollment.careGroupId))).toBe(
        text(enrollment.institutionId),
      );
    }
    const reachable = (institutionId: string) => {
      const scoped = enrollments.filter(
        (enrollment) => text(enrollment.institutionId) === institutionId,
      );
      return {
        processes: new Set(scoped.map((enrollment) => text(enrollment.processId))),
        careGroups: new Set(scoped.map((enrollment) => text(enrollment.careGroupId))),
        caregivers: new Set(
          assignments
            .filter((assignment) =>
              scoped.some(
                (enrollment) =>
                  text(enrollment.careGroupId) === text(assignment.careGroupId),
              ),
            )
            .map((assignment) => text(assignment.participantId)),
        ),
        grants: new Set(
          grants
            .filter((grant) =>
              scoped.some(
                (enrollment) =>
                  text(enrollment.enrollmentId) === text(grant.enrollmentId),
              ),
            )
            .map((grant) => text(grant.grantId)),
        ),
      };
    };
    const aster = reachable("syn-institution-ia");
    const birch = reachable("syn-institution-ib");
    expect(intersect(aster.careGroups, birch.careGroups).size).toBe(0);
    expect(intersect(aster.caregivers, birch.caregivers).size).toBe(0);
    expect(intersect(aster.grants, birch.grants).size).toBe(0);
    // The only shared object is the child-care process reached through two
    // separate enrollments — never a group, caregiver or grant.
    expect([...intersect(aster.processes, birch.processes)]).toEqual([
      "syn-process-c1",
    ]);
  });

  it("provides both readiness-axis variants for the shared process", () => {
    const grantedEnrollments = new Set(
      grants.map((grant) => text(grant.enrollmentId)),
    );
    expect(grantedEnrollments).toContain("syn-enrollment-c1-ia");
    expect(grantedEnrollments).not.toContain("syn-enrollment-c1-ib");
  });

  it("converges the single-institution profile to unique write targets", () => {
    expect(text(profile.worldKey)).toBe(text(world.worldKey));
    const selected = text(profile.selectedInstitutionId);
    expect(institutionIds).toContain(selected);
    const resolutions = records(profile.writeTargetResolution);
    const resolvedProcesses = resolutions.map((entry) => text(entry.processId));
    expect(new Set(resolvedProcesses).size).toBe(resolutions.length);
    for (const entry of resolutions) {
      const enrollment = enrollmentById.get(text(entry.enrollmentId));
      expect(enrollment, text(entry.enrollmentId)).toBeDefined();
      expect(text(record(enrollment).processId)).toBe(text(entry.processId));
      expect(text(record(enrollment).institutionId)).toBe(selected);
      const alternatives = enrollments.filter(
        (candidate) =>
          text(candidate.processId) === text(entry.processId) &&
          text(candidate.institutionId) === selected,
      );
      expect(alternatives).toHaveLength(1);
    }
    // Every process enrolled at the selected institution has a resolution.
    const enrolledProcesses = new Set(
      enrollments
        .filter((enrollment) => text(enrollment.institutionId) === selected)
        .map((enrollment) => text(enrollment.processId)),
    );
    expect(new Set(resolvedProcesses)).toEqual(enrolledProcesses);
  });

  it("contains only whitelisted synthetic string values", () => {
    const allowed = [
      /^syn-[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^Syn(?: [A-Z][a-z0-9]+)+$/,
      /^world-v[0-9]+$/,
      /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/,
      /^(?:bound|provisional|caregiver|lead_caregiver|active|current|family_care_interaction|single-institution-pilot)$/,
    ];
    for (const value of stringValues([world, profile])) {
      expect(
        allowed.some((pattern) => pattern.test(value)),
        `non-whitelisted string: ${value}`,
      ).toBe(true);
    }
  });

  it("excludes private identity and runtime vocabulary", () => {
    const combined = `${worldText}\n${profileText}`.toLowerCase();
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
      expect(combined).not.toContain(forbidden);
    }
  });

  it("rotates the root identity while preserving every existing slice", () => {
    const contract = record(manifest.interfaceContract);
    expect(contract.key).toBe("nurture.surface-contract");
    expect(contract.version).toBe("1.1.0");
    expect(contract.digest).not.toBe(
      "sha256:ee3f83626f6b948ae3e8791890c0c6fafcb2a2c7c4523500cee7c71cf3837f59",
    );
    expect(manifest.sharedCoreHash).toBe(frozenSharedCoreHash);
    const capabilityHashes = records(manifest.capabilities).map((entry) => [
      text(entry.capabilityKey),
      text(entry.sliceHash),
    ]);
    expect(capabilityHashes).toEqual(
      frozenCapabilitySliceHashes.map((entry) => [...entry]),
    );
    const surfaceHashes = records(manifest.surfaces).map((entry) => [
      text(entry.surfaceKey),
      text(entry.sliceHash),
    ]);
    expect(surfaceHashes).toEqual(
      frozenSurfaceSliceHashes.map((entry) => [...entry]),
    );
    const inventoryPaths = records(record(manifest.sourceSet).inventory).map(
      (entry) => text(entry.path),
    );
    expect(inventoryPaths).toContain("fixtures/world/synthetic-world.schema.json");
    expect(inventoryPaths).toContain("fixtures/world/world-v1.json");
    expect(inventoryPaths).toContain(
      "fixtures/world/profile-single-institution.json",
    );
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

function idSet(values: readonly JsonRecord[], key: string): string[] {
  return values.map((value) => text(value[key]));
}

function intersect(left: ReadonlySet<string>, right: ReadonlySet<string>): Set<string> {
  return new Set([...left].filter((value) => right.has(value)));
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringValues);
  }
  return [];
}
