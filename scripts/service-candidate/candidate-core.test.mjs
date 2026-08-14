import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CANDIDATE_KIND,
  CANDIDATE_REF,
  assertCandidateIntegrity,
  candidateDigest,
  canonicalJson,
} from "./candidate-core.mjs";

const fixtureCandidate = () => {
  const candidate = {
    schema_version: 1,
    candidate_kind: CANDIDATE_KIND,
    candidate_ref: CANDIDATE_REF,
    candidate_digest: "",
    frozen_on: "2026-08-14",
    lifecycle: "frozen",
    qualification_state: "not_run",
    deployment_state: "undeployed",
    identity_inputs: {
      source: { repository: "willyu1007/The-Nurture", revision: "a".repeat(40) },
      freeze_posture: { capabilities: "default_off" },
    },
    boundaries: {
      contains_secrets: false,
      contains_pii: false,
      contains_my_chat_runtime_or_client_bundle: false,
      authorizes_database_apply: false,
      authorizes_deployment: false,
      authorizes_activation: false,
      authorizes_internal_testing: false,
      authorizes_traffic: false,
    },
  };
  candidate.candidate_digest = candidateDigest(candidate);
  return candidate;
};

test("canonical JSON is independent of object insertion order", () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 3 } }), canonicalJson({ a: { x: 3, y: 2 }, z: 1 }));
});

test("candidate integrity accepts one exact frozen default-off identity", () => {
  assert.doesNotThrow(() => assertCandidateIntegrity(fixtureCandidate()));
});

test("candidate identity drift invalidates the digest", () => {
  const candidate = fixtureCandidate();
  candidate.identity_inputs.source.revision = "b".repeat(40);
  assert.throws(() => assertCandidateIntegrity(candidate), /digest mismatch/u);
});

test("frozen manifest metadata drift invalidates the digest", () => {
  const candidate = fixtureCandidate();
  candidate.frozen_on = "2026-08-15";
  assert.throws(() => assertCandidateIntegrity(candidate), /digest mismatch/u);
});

test("qualification and deployment claims are forbidden during Freeze", () => {
  const qualified = fixtureCandidate();
  qualified.qualification_state = "passed";
  qualified.candidate_digest = candidateDigest(qualified);
  assert.throws(() => assertCandidateIntegrity(qualified), /cannot claim qualification/u);

  const deployed = fixtureCandidate();
  deployed.deployment_state = "deployed";
  deployed.candidate_digest = candidateDigest(deployed);
  assert.throws(() => assertCandidateIntegrity(deployed), /cannot claim deployment/u);
});

test("authorization boundary drift fails closed", () => {
  const candidate = fixtureCandidate();
  candidate.boundaries.authorizes_activation = true;
  candidate.candidate_digest = candidateDigest(candidate);
  assert.throws(() => assertCandidateIntegrity(candidate), /boundary flags/u);
});

test("canonical JSON rejects ambiguous unsupported values", () => {
  assert.throws(() => canonicalJson({ invalid: undefined }), /rejects undefined/u);
  assert.throws(() => canonicalJson(Number.NaN), /non-finite/u);
});
