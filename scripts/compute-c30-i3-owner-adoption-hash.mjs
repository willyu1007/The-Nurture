import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkIndex = process.argv.indexOf("--check");
const lockPath = checkIndex === -1 ? undefined : process.argv[checkIndex + 1];
if (checkIndex !== -1 && !lockPath) throw new Error("--check requires a lock path");
const expectedLock = lockPath
  ? JSON.parse(readFileSync(resolve(repositoryRoot, lockPath), "utf8"))
  : undefined;
const sourceRevision = process.env.C30_I3_SOURCE_REVISION ?? expectedLock?.source_revision;
if (!sourceRevision || !/^[a-f0-9]{40}$/u.test(sourceRevision)) {
  throw new Error("C30_I3_SOURCE_REVISION must be an exact committed revision");
}

const profileDefinitions = [
  {
    source_identity: "nurture_c30_manifest_foundation_v1",
    files: [
      "package.json",
      "packages/nurture-scenario/package.json",
      "packages/nurture-scenario/scenario.manifest.yaml",
      "packages/nurture-scenario/src/generated/manifest.generated.ts",
      "packages/nurture-scenario/src/index.ts",
      "packages/nurture-scenario/src/module.ts",
      "packages/nurture-scenario/src/policies.ts",
      "packages/nurture-scenario/src/registry.ts",
      "packages/nurture-scenario/tests/conformance.test.ts",
      "packages/nurture-scenario/tests/institution/family-input-workflow-handler.test.ts",
      "packages/nurture-scenario/tests/module-factory.test.ts",
      "scripts/assert-g2-exit-contract.mjs",
      "scripts/compute-c30-i3-owner-adoption-hash.mjs",
      "scripts/generate-nurture-scenario-manifest.mjs",
      "scripts/verify-c30-i3-upstream.mjs",
    ],
  },
  {
    source_identity: "nurture_c30_private_trust_participant_v1",
    files: [
      "packages/nurture-scenario/src/c30/canonical-json.ts",
      "packages/nurture-scenario/src/c30/participant-binding.ts",
      "packages/nurture-scenario/src/c30/trusted-invocation.ts",
      "packages/nurture-scenario/tests/c30/participant-binding.test.ts",
      "packages/nurture-scenario/tests/c30/trusted-invocation.test.ts",
    ],
  },
  {
    source_identity: "nurture_c30_pair_local_persistence_v1",
    files: [
      "docs/context/db/schema.json",
      "docs/context/registry.json",
      "packages/nurture-db/src/c30/nonce-store.ts",
      "packages/nurture-db/src/c30/pair-association.repository.ts",
      "packages/nurture-db/src/c30/participant-binding.ts",
      "packages/nurture-db/src/index.ts",
      "packages/nurture-db/tests/c30-pair-owner.integration.test.ts",
      "packages/nurture-scenario/src/c30/pair-association.ts",
      "prisma/migrations/20260806120000_c30_i3_pair_owner_foundation/migration.sql",
      "prisma/schema.prisma",
    ],
  },
  {
    source_identity: "nurture_c30_subject_presentation_v1",
    files: [
      "packages/nurture-db/src/c30/subject-presentation.repository.ts",
      "packages/nurture-db/tests/c30-pair-owner.integration.test.ts",
      "packages/nurture-scenario/scenario.manifest.yaml",
      "packages/nurture-scenario/src/c30/subject-presentation.ts",
      "packages/nurture-scenario/src/generated/manifest.generated.ts",
      "packages/nurture-scenario/tests/c30/subject-presentation.test.ts",
    ],
  },
  {
    source_identity: "nurture_c30_canonical_action_v1",
    files: [
      "docs/context/db/schema.json",
      "docs/context/registry.json",
      "packages/nurture-db/src/c30/canonical-action.repository.ts",
      "packages/nurture-db/tests/c30-canonical-action.integration.test.ts",
      "packages/nurture-scenario/scenario.manifest.yaml",
      "packages/nurture-scenario/src/c30/canonical-action.ts",
      "packages/nurture-scenario/src/generated/manifest.generated.ts",
      "packages/nurture-scenario/tests/c30/canonical-action.test.ts",
      "prisma/migrations/20260806130000_c30_i3_canonical_action_runtime/migration.sql",
      "prisma/schema.prisma",
    ],
  },
  {
    source_identity: "nurture_c30_protected_owner_lifecycle_v1",
    files: [
      "docs/context/db/schema.json",
      "docs/context/registry.json",
      "packages/nurture-db/src/c30/protected-content.repository.ts",
      "packages/nurture-db/src/protected-content.ts",
      "packages/nurture-db/tests/c30-protected-content.integration.test.ts",
      "packages/nurture-scenario/scenario.manifest.yaml",
      "packages/nurture-scenario/src/c30/protected-content.ts",
      "packages/nurture-scenario/src/generated/manifest.generated.ts",
      "packages/nurture-scenario/src/harness/protected-content.ts",
      "packages/nurture-scenario/tests/c30/protected-content.test.ts",
      "prisma/migrations/20260806140000_c30_i3_protected_owner_lifecycle/migration.sql",
      "prisma/schema.prisma",
    ],
  },
  {
    source_identity: "nurture_c30_cumulative_convergence_v1",
    files: [
      "package.json",
      "packages/nurture-scenario/scenario.manifest.yaml",
      "packages/nurture-scenario/src/generated/manifest.generated.ts",
      "packages/nurture-scenario/src/module.ts",
      "packages/nurture-scenario/tests/c30/cumulative-convergence.test.ts",
      "packages/nurture-scenario/tests/c30/full-graph.fixture.ts",
      "prisma/schema.prisma",
      "scripts/assert-test-routing.mjs",
      "scripts/compute-c30-i3-owner-adoption-hash.mjs",
      "scripts/generate-nurture-scenario-manifest.mjs",
      "scripts/verify-c30-i3-default-off.mjs",
      "scripts/verify-c30-i3-upstream.mjs",
    ],
  },
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const normalizeSource = (path) => {
  const absolutePath = resolve(repositoryRoot, path);
  const repositoryRealPath = realpathSync(repositoryRoot);
  const fileRealPath = realpathSync(absolutePath);
  const relativeRealPath = relative(repositoryRealPath, fileRealPath);
  if (
    relativeRealPath === "" ||
    relativeRealPath === ".." ||
    relativeRealPath.startsWith(`..${sep}`) ||
    lstatSync(absolutePath).isSymbolicLink()
  ) {
    throw new Error(`C30-I3 source path escapes the repository or is a symlink: ${path}`);
  }
  return readFileSync(absolutePath, "utf8")
    .replace(/^\uFEFF/u, "")
    .replace(/\r\n?/gu, "\n");
};

const computeProfile = (profile) => {
  const files = [...profile.files].sort().map((path) => {
    const source = normalizeSource(path);
    return {
      path,
      bytes: Buffer.byteLength(source, "utf8"),
      sha256: sha256(source),
    };
  });
  return {
    source_identity: profile.source_identity,
    source_hash: sha256(
      files.map(({ path, bytes, sha256: fileHash }) =>
        `${path}\0${bytes}\0${fileHash}\n`).join(""),
    ),
    files: files.map(({ path }) => path),
  };
};

const computeLock = () => {
  const sourceProfiles = profileDefinitions.map(computeProfile);
  return {
    schema_version: 1,
    algorithm: "sha256(path_nul_bytes_nul_sha256_lf)_v1",
    source_revision: sourceRevision,
    base: {
      head_revision: "4350086993d837baa8030564f4e19593dedd96b0",
      source_revision: "15ff031ed16897920c13fe24c9849531d98607ad",
      aggregate_source_hash: "d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383",
    },
    host: {
      head_revision: "cd7bbc2623dff8621c2c7155b04d1bf759e8404a",
      runtime_revision: "658b897360734dfa916ce25abda7a8db5fb3f27d",
      aggregate_source_hash: "8172e370dfb5db0876709c6f7a01999314ac266bf71ba166854f9effa510a5ad",
    },
    source_hash: sha256(
      sourceProfiles.map(({ source_identity, source_hash }) =>
        `${source_identity}\0${source_hash}\n`).join(""),
    ),
    source_profiles: sourceProfiles,
  };
};

const assertSourceRevision = (lock) => {
  execFileSync("git", ["merge-base", "--is-ancestor", lock.source_revision, "HEAD"], {
    cwd: repositoryRoot,
    stdio: "ignore",
  });
  const files = lock.source_profiles.flatMap(({ files }) => files);
  execFileSync("git", ["diff", "--quiet", lock.source_revision, "--", ...files], {
    cwd: repositoryRoot,
    stdio: "ignore",
  });
};

const actual = computeLock();
if (checkIndex === -1) {
  process.stdout.write(`${JSON.stringify(actual, null, 2)}\n`);
} else {
  if (JSON.stringify(actual) !== JSON.stringify(expectedLock)) {
    throw new Error("C30-I3 owner adoption source lock does not match current bytes");
  }
  assertSourceRevision(expectedLock);
  console.log(`C30-I3 owner adoption source lock ok: ${actual.source_hash}`);
}
