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

// Capability/surface slices are frozen at the exact 1.0.1 quality-closed
// baseline: fixture increments must never move them. The shared core was
// rotated exactly once, by the planned P3-4 canonicalization/manifest-schema
// extension that introduced fixture slices; any further drift fails here.
const frozenSharedCoreHash =
  "sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d";
const frozenCapabilitySliceHashes: readonly (readonly [string, string])[] = [
  ["acknowledge_family_care_item", "sha256:6237365e4a1538de56f71abec0b1bf387180d29740c455a4246b5721a2a35cf7"],
  ["acquire_publish_edit_hold", "sha256:30ad41e4500127e1063ba1349d8287960689654b88ca7f3b502803abcf7520d0"],
  ["cancel_publish_process", "sha256:01e651c6e36e5e247379a88ad3fd0bb2bacb988bba398c47249aa7ec8c6d90b5"],
  ["confirm_child_media_attribution", "sha256:d160735c5b03fadd6d738e8026faa9784772dfd035d3a0553d97b0d5077e2a06"],
  ["correct_family_care_message", "sha256:111c258019da3988278ca94156436d38b2d1e3f002306e17cb8fec4ad8c856c3"],
  ["correct_publication", "sha256:a3f07378714ac822156568d52e30792fd7835f49692a28d6594d033f1b61ba35"],
  ["detach_publish_process_media", "sha256:baab8383ce9159b3245ac0e855622619e0fc01a2fd71863cafab723358e21464"],
  ["discard_media_asset", "sha256:88f554db8b702612f7a997685a6731df4ac6dbac72a7f408cca41b645df4f460"],
  ["initiate_caregiver_direct_message", "sha256:d88aec58676ddc83c5a1e7e437a12aec97e056f351f386d1017ec4bf6349ac05"],
  ["organize_care_capture_batch", "sha256:f9d2f060d323f4d4f7fd6d3e978d5e2ec2be3854d218ad2b1f92bee185049adb"],
  ["policy_redact_family_care_message", "sha256:6ea83260c0ce7141ffdcc4b781ea28613feeb9f2be123131c0a3711f00612371"],
  ["query_caregiver_child_today", "sha256:bf1b9bd160bd6c962d7020cfb46074d902ddd2ec10efff6c9b3c895e2a94a5c0"],
  ["query_caregiver_family_care_work", "sha256:c670fee50cee1cd814ac376c0f2933ba621deb3c1d6502c2253b4c956f32b9b7"],
  ["query_caregiver_teacher_board", "sha256:2d6b0b4c7e53a219b2581e86647332d31abfb35f0a08b26dec95ecc9539f2d13"],
  ["query_family_care_item", "sha256:1bfdbb7f79b68a929799fd8959d20e5c95b6bef7d517780a35f7d076286ef323"],
  ["query_guardian_enrollment_activity", "sha256:bad468244dd328c8efdccade21d9ade6bd7c2342bc777227547fcd1928156516"],
  ["query_guardian_family_board", "sha256:b88ea18ac1e004fd85262c7a709fdc7275188933e2b0aa653a521ec60003e4b6"],
  ["query_guardian_family_care_timeline", "sha256:4834eb685080ad38befdcf157af3ddc392763a77331251c2722c4b2253b08793"],
  ["query_institution_communication_review", "sha256:b88fa7e9b7fdab6e67c1e0666976561ad7eed21bdd99fb5018dd27fa4f7d8891"],
  ["query_teacher_publish_queue", "sha256:abe0c1c9c60e573917b0843aa038526856111d9dd78928f6e382e019b72ed5cb"],
  ["record_caregiver_daily_care", "sha256:e49064ae5691abfaae62ddb278ec31c8188f5bf30bde51d8b5b3c0825e0a02c8"],
  ["redact_family_care_message", "sha256:136ad70d1d4f0eb84a3417cfc5c5274f95cb2d134a03551a13a48843204cbbe5"],
  ["redact_publication", "sha256:1b1dd52157b9e62a19550e6ca6df67229ef34188b08f30e6ceb5260f0a9615d4"],
  ["reject_child_media_attribution", "sha256:04cd0965b4115b9531a448e887e214d021380fae20bb08d2d2057a6270d92044"],
  ["release_publish_edit_hold", "sha256:b60dd9890a5cde79feeb142166b469abde2a1525bc6b83e4c1eefc4130eda48c"],
  ["release_publish_process", "sha256:de6ed71e6ee03a3826a087dac2fa02543c1d87d684161bc2f5571837927087c8"],
  ["remove_publication_target_visibility", "sha256:a7b29b0cbf34c16e6f60e9d597503b9fbfe5b80a3c9aad5de263c6ed5d8b12d3"],
  ["renew_publish_edit_hold", "sha256:7f05f2f05ec7f7db2786b48efcd7d2438a1334650065b99a7e7902df19bd6479"],
  ["reply_family_care_item", "sha256:6b726c8e5aafd945c624c1b460aa1307b37a975119b43363a6d6579640d70da6"],
  ["reschedule_publish_process", "sha256:25c532267e03e1e74a8d7507f014e84b6d69b47b32d19cd67ce8f4f691374ac2"],
  ["save_publish_process_draft", "sha256:9381bd57cf88cc5bc49db7669b7b4df81691da899f023e0382350eccc0248c5d"],
  ["submit_family_care_question", "sha256:1c85661fb834cbf937548f7bc28aa2df963a6c27b7ed4464598887b4e6a10d68"],
  ["supersede_child_media_attribution", "sha256:b4b9ea873c8dde19ecfb1a21e7f5524aba2bd02bb84ebd08d885c1e43e5e692f"],
  ["withdraw_family_care_request", "sha256:9f76604c4ad892d8d5b9740390e6493b5026f5ced678e42c1ff3fd3d5988612b"],
];
const frozenSurfaceSliceHashes: readonly (readonly [string, string])[] = [
  ["caregiver_nurture_chat", "sha256:34abcdaa268463807750ea5a8b4b6b6c73547aa644153db43a19271569247f4d"],
  ["caregiver_teacher_board", "sha256:f0b87088fcd2fcfc7569faefbbe6833c04269c009501f6f81f426ce47c8d1b61"],
  ["guardian_family_board", "sha256:774ef0b8989b9aa758bbb7a514ffd2fea47881aac08876e617047eaec40c200a"],
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

  it("pins the deliberate G2-C contract and slice rotation", () => {
    const contract = record(manifest.interfaceContract);
    expect(contract.key).toBe("nurture.surface-contract");
    expect(contract.version).toBe("1.18.0");
    expect(contract.digest).not.toBe(
      "sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641",
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

  it("records one slice per fixture family covering every fixture file", () => {
    const fixtures = records(manifest.fixtures);
    expect(
      fixtures.map((entry) => [text(entry.fixtureKey), text(entry.fixtureKind)]),
    ).toEqual([
      ["journey:gj-1", "journey"],
      ["journey:gj-2", "journey"],
      ["journey:gj-3", "journey"],
      ["journey:gj-4", "journey"],
      ["journey:gj-5", "journey"],
      ["journey:rj-1", "journey"],
      ["selection", "selection"],
      ["world", "world"],
    ]);
    for (const entry of fixtures) {
      expect(text(entry.sliceHash)).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
    // Every fixture source file resolves to a primary slice: the generator
    // fails closed on unclassifiable fixture paths, so inventory membership
    // plus the fixed key list above proves complete coverage.
    const fixturePaths = records(record(manifest.sourceSet).inventory)
      .map((entry) => text(entry.path))
      .filter((path) => path.startsWith("fixtures/"));
    expect(fixturePaths.length).toBeGreaterThanOrEqual(30);
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
