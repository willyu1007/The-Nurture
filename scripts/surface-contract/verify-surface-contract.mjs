/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildSurfaceContract,
  generatedManifestPath,
  repoRoot,
} from "./contract-core.mjs";

const temporaryRoot = path.join(repoRoot, ".ai/.tmp");
await mkdir(temporaryRoot, { recursive: true });
const verificationDirectory = await mkdtemp(
  path.join(temporaryRoot, "surface-contract-verify-"),
);

try {
  const rebuiltPath = path.join(
    verificationDirectory,
    "surface-contract.manifest.json",
  );
  const [{ output, manifest }, checkedOutput] = await Promise.all([
    buildSurfaceContract(rebuiltPath),
    readFile(generatedManifestPath, "utf8"),
  ]);
  if (output !== checkedOutput) {
    throw new Error(
      `Generated surface contract drifted; run pnpm build:surface-contract (${path.relative(
        repoRoot,
        generatedManifestPath,
      )})`,
    );
  }
  process.stdout.write(
    `[ok] deterministic surface contract ${manifest.interfaceContract.digest} shared=${manifest.sharedCoreHash} capabilities=${manifest.capabilities.length} surfaces=${manifest.surfaces.length}${os.EOL}`,
  );
} finally {
  await rm(verificationDirectory, { recursive: true, force: true });
}
