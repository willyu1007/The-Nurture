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
  "sha256:042272641eb98cb934acfe902259ea93502be92ffa8e95257ddc63abf48c0ae2";
const frozenCapabilitySliceHashes: readonly (readonly [string, string])[] = [
  ["acknowledge_family_care_item", "sha256:6237365e4a1538de56f71abec0b1bf387180d29740c455a4246b5721a2a35cf7"],
  ["acquire_publish_edit_hold", "sha256:7f57a8b16247d0efe58f946533a241b61f8c09f8451bb2995474f53e4e0fd9d9"],
  ["cancel_publish_process", "sha256:4caa1700e16cc7d66f7db822ce2a55769a99a73c2ae4d0e63d95b6af7133a3b0"],
  ["confirm_child_media_attribution", "sha256:d160735c5b03fadd6d738e8026faa9784772dfd035d3a0553d97b0d5077e2a06"],
  ["correct_family_care_message", "sha256:111c258019da3988278ca94156436d38b2d1e3f002306e17cb8fec4ad8c856c3"],
  ["correct_publication", "sha256:61c3cdea9d35982ab7da14aa2f968e2d15874374f30fab69abb3830c7434fda8"],
  ["detach_publish_process_media", "sha256:f520e1987e2e6f2835a219eca3e0dde3544ffa8aa4157284bf3841c5fed97f38"],
  ["discard_media_asset", "sha256:252c1824e9bd4e48dace40c8446b388edfb38dc4ace1bfe3b9104ad237949da3"],
  ["initiate_caregiver_direct_message", "sha256:d88aec58676ddc83c5a1e7e437a12aec97e056f351f386d1017ec4bf6349ac05"],
  ["organize_care_capture_batch", "sha256:c1fc8655c655641d76998392a2635eb8aa46d744a6b2a060a7d4f233ffcc7bb1"],
  ["policy_redact_family_care_message", "sha256:6ea83260c0ce7141ffdcc4b781ea28613feeb9f2be123131c0a3711f00612371"],
  ["query_caregiver_child_today", "sha256:bf1b9bd160bd6c962d7020cfb46074d902ddd2ec10efff6c9b3c895e2a94a5c0"],
  ["query_caregiver_family_care_work", "sha256:c670fee50cee1cd814ac376c0f2933ba621deb3c1d6502c2253b4c956f32b9b7"],
  ["query_caregiver_teacher_board", "sha256:e54fd33fff1ca72ecfec7983a95bad58575d3696d053975f82d811a7e164de19"],
  ["query_family_care_item", "sha256:1bfdbb7f79b68a929799fd8959d20e5c95b6bef7d517780a35f7d076286ef323"],
  ["query_guardian_current_focus", "sha256:a38a1ec2a279af26295fc867ca8e66d8fda097139955acb247a32524e681947b"],
  ["query_guardian_enrollment_activity", "sha256:bad468244dd328c8efdccade21d9ade6bd7c2342bc777227547fcd1928156516"],
  ["query_guardian_family_board", "sha256:3428ce684cb827ba2b6aa4383a184252338018a059d3d4f6022817a237158080"],
  ["query_guardian_family_care_timeline", "sha256:4834eb685080ad38befdcf157af3ddc392763a77331251c2722c4b2253b08793"],
  ["query_teacher_publish_queue", "sha256:a30ee141327d0ba44098f59a42db612c4fa6ee9e9a3a7a2299db2de8b36a441c"],
  ["record_caregiver_daily_care", "sha256:e49064ae5691abfaae62ddb278ec31c8188f5bf30bde51d8b5b3c0825e0a02c8"],
  ["redact_family_care_message", "sha256:136ad70d1d4f0eb84a3417cfc5c5274f95cb2d134a03551a13a48843204cbbe5"],
  ["redact_publication", "sha256:b5e91547d02b3874b7e94db9a525a921c14848c1104be14500eeecde633bf42f"],
  ["reject_child_media_attribution", "sha256:04cd0965b4115b9531a448e887e214d021380fae20bb08d2d2057a6270d92044"],
  ["release_publish_edit_hold", "sha256:f1a1ae66af280659dd9882db10e2c42e53d5e2560a87dc860201db512995a1b1"],
  ["release_publish_process", "sha256:7af67a5f71a0ba4e229b27243b51ad7b8aba8043db1a0ee09858614bc192dded"],
  ["remove_publication_target_visibility", "sha256:2b9a4b35f7061a208a52aa606753b5c75eddc90ea3ad8ec2ac6fad43fc06657c"],
  ["renew_publish_edit_hold", "sha256:4c6071b4fa3b6a6041b0d2a7fa4ac25ed58316ec831a6abe492aa3f66f14d851"],
  ["reply_family_care_item", "sha256:6b726c8e5aafd945c624c1b460aa1307b37a975119b43363a6d6579640d70da6"],
  ["reschedule_publish_process", "sha256:de3e89f85b4299321e777749a3953f5d2d5c1f9dfed095fc96cbc554361c2c81"],
  ["save_publish_process_draft", "sha256:ab39d1a6cea379996c7152436cb898ac10381970a186afcd8ea414f6e4d256df"],
  ["submit_family_care_question", "sha256:1c85661fb834cbf937548f7bc28aa2df963a6c27b7ed4464598887b4e6a10d68"],
  ["supersede_child_media_attribution", "sha256:b4b9ea873c8dde19ecfb1a21e7f5524aba2bd02bb84ebd08d885c1e43e5e692f"],
  ["update_guardian_current_focus", "sha256:b959809c1f0737be5ea71a0b08ce03a77286a409f079406d26573c3e37b9471b"],
  ["withdraw_family_care_request", "sha256:9f76604c4ad892d8d5b9740390e6493b5026f5ced678e42c1ff3fd3d5988612b"],
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

  it("pins the deliberate G2-C contract and slice rotation", () => {
    const contract = record(manifest.interfaceContract);
    expect(contract.key).toBe("nurture.surface-contract");
    expect(contract.version).toBe("1.14.0");
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
