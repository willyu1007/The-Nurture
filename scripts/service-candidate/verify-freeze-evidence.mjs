#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { canonicalJson, sha256Ref } from "./candidate-core.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));
const evidence = readJson(
  "release/candidates/nurture-service-candidate-1.0.0.freeze-evidence.json",
);
const schema = readJson(
  "release/candidates/nurture-service-candidate-freeze-evidence-v1.schema.json",
);
const candidate = readJson("release/candidates/nurture-service-candidate-1.0.0.json");
const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
if (!validate(evidence)) {
  throw new Error(`Freeze evidence schema validation failed: ${JSON.stringify(validate.errors)}`);
}
const digestInput = structuredClone(evidence);
delete digestInput.evidence_digest;
const digest = sha256Ref(Buffer.from(canonicalJson(digestInput), "utf8"));
if (digest !== evidence.evidence_digest) throw new Error("Freeze evidence digest mismatch");
const requiredCheckIds = new Set([
  "candidate_tooling",
  "source_typecheck",
  "source_unit",
  "scenario_service",
  "executable_reproducibility",
  "data_shape",
  "surface_and_ingress",
  "owner_pins",
  "context_and_governance",
  "default_off",
  "test_routing",
]);
const actualCheckIds = evidence.checks.map(({ id }) => id);
if (
  new Set(actualCheckIds).size !== actualCheckIds.length
  || actualCheckIds.length !== requiredCheckIds.size
  || actualCheckIds.some((id) => !requiredCheckIds.has(id))
) {
  throw new Error("Freeze evidence check set is incomplete or duplicated");
}
if (
  evidence.candidate_ref !== candidate.candidate_ref
  || evidence.candidate_digest !== candidate.candidate_digest
  || evidence.source_revision !== candidate.identity_inputs.source.revision
) {
  throw new Error("Freeze evidence does not bind the exact Candidate identity");
}

console.log(
  `[ok] evidence=${evidence.evidence_ref} digest=${evidence.evidence_digest} `
  + `candidate=${candidate.candidate_digest} result=${evidence.result}`,
);
