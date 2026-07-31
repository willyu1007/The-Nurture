/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import {
  buildSurfaceContract,
  canonicalStringify,
  parseStrictJson,
  repoRoot,
} from "./contract-core.mjs";

test("strict JSON parser rejects duplicate object keys", () => {
  assert.throws(
    () => parseStrictJson('{"key":"first","key":"second"}', "duplicate.json"),
    /duplicate object key 'key'/,
  );
});

test("canonical JSON sorts object keys and preserves semantic array order", () => {
  assert.equal(
    canonicalStringify({
      z: 1,
      a: {
        z: true,
        a: false,
      },
      items: ["second", "first"],
    }),
    '{"a":{"a":false,"z":true},"items":["second","first"],"z":1}',
  );
});

test("strict JSON parser rejects non-finite numbers", () => {
  assert.throws(
    () => parseStrictJson('{"value":1e400}', "number.json"),
    /number must be finite/,
  );
});

test("generator rejects non-contract output filenames before writing", async () => {
  await assert.rejects(
    buildSurfaceContract(path.join(repoRoot, ".ai/.tmp/not-a-contract.json")),
    /output filename must be surface-contract\.manifest\.json/,
  );
});

test("generator rejects semantic drift without an interface version rotation", async () => {
  const temporaryRoot = path.join(repoRoot, ".ai/.tmp");
  await mkdir(temporaryRoot, { recursive: true });
  const temporaryDirectory = await mkdtemp(
    path.join(temporaryRoot, "surface-contract-version-test-"),
  );
  const outputPath = path.join(
    temporaryDirectory,
    "surface-contract.manifest.json",
  );
  try {
    await writeFile(
      outputPath,
      JSON.stringify({
        interfaceContract: {
          key: "nurture.surface-contract",
          version: "1.6.0",
          digest: `sha256:${"0".repeat(64)}`,
        },
      }),
      "utf8",
    );
    await assert.rejects(
      buildSurfaceContract(outputPath),
      /content changed without a version rotation from 1\.6\.0/,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
