#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import {
  assertCandidateIntegrity,
  buildCandidate,
  canonicalJson,
  candidateOutputPath,
  candidateSchemaPath,
} from "./candidate-core.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const candidate = JSON.parse(readFileSync(candidateOutputPath(repoRoot), "utf8"));
const schema = JSON.parse(readFileSync(candidateSchemaPath(repoRoot), "utf8"));
const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
if (!validate(candidate)) {
  throw new Error(`Candidate schema validation failed: ${JSON.stringify(validate.errors)}`);
}
assertCandidateIntegrity(candidate);

const sourceRevision = candidate.identity_inputs.source.revision;
execFileSync("git", ["cat-file", "-e", `${sourceRevision}^{commit}`], { cwd: repoRoot });
const expected = buildCandidate({
  repoRoot,
  sourceRevision,
  frozenOn: candidate.frozen_on,
});
if (canonicalJson(expected.identity_inputs) !== canonicalJson(candidate.identity_inputs)) {
  throw new Error("Current Candidate-defining inputs drifted from the frozen identity");
}
const frozenExecutable = candidate.identity_inputs.executable.inventory;

console.log(
  `[ok] candidate=${candidate.candidate_ref} digest=${candidate.candidate_digest} `
  + `source=${sourceRevision} executable=${frozenExecutable.digest} `
  + `files=${frozenExecutable.file_count} posture=default-off undeployed`,
);
