import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  buildQualificationManifest,
  computeFixtureInputDigest,
  computeServiceRequestDigest,
  computeStructuredDecisionResponseDigest,
  generatedManifestPath,
  repoRoot,
  sourceRoot,
  validateCandidateEvidence,
} from "./qualification-core.mjs";

const repoRelative = (targetPath) =>
  path.relative(repoRoot, targetPath).split(path.sep).join("/");

const candidateEvidence = (built) => {
  const service = {
    gateway_id: "my-chat-llm-gateway",
    gateway_version: "1.0.0",
    provider_id: "aliyun-bailian",
    provider_api_version: "dashscope-compatible-api-v1",
    model_id: "qwen-plus-2025-12-01",
    model_version: "2025-12-01",
    deployment_id: "aliyun-bailian-cn-qwen-plus-2025-12-01",
    prompt_template_id: "nurture-institution-knowledge-safety",
    prompt_version: "1",
    owner_contract_key:
      "my-chat.nurture-institution-knowledge-answer-safety-owner",
    owner_contract_version: "2.0.0",
    answer_safety_contract_key:
      "nurture.institution-knowledge-answer-safety",
    answer_safety_contract_version: "2.0.0",
  };
  let invocationSequence = 0;
  return {
    schemaVersion: 1,
    qualificationContract: built.manifest.qualificationContract,
    evidence_mode: "adapter_recorded",
    service,
    results: built.fixtures.fixtures.map((fixture) => {
      const decision = structuredClone(fixture.expected);
      const requestDigest = computeServiceRequestDigest({
        qualificationDigest: built.manifest.qualificationContract.digest,
        service,
        fixture,
      });
      const responseDigest = computeStructuredDecisionResponseDigest(decision);
      return {
        fixture_id: fixture.fixtureId,
        input_digest: computeFixtureInputDigest(fixture),
        attempts: Array.from({ length: fixture.invocationAttempts }, () => ({
          invocation_id: `qualification-invocation-${++invocationSequence}`,
          request_digest: requestDigest,
          response_digest: responseDigest,
          ...structuredClone(decision),
        })),
      };
    }),
  };
};

test("generated qualification manifest matches service regression source", async () => {
  const built = await buildQualificationManifest();
  assert.equal(await readFile(generatedManifestPath, "utf8"), built.output);
  assert.equal(built.manifest.qualificationContract.version, "2.1.0");
  assert.equal(built.manifest.answerSafetyContract.version, "2.0.0");
  assert.equal(built.manifest.fixtureSummary.total, 15);
  assert.equal(built.manifest.fixtureSummary.minimumInvocationAttempts, 2);
  assert.equal(built.manifest.regression.bitwiseDeterminism, "not_claimed");
  assert.deepEqual(
    built.manifest.requiredServicePins.slice(-4),
    [
      "owner_contract_key",
      "owner_contract_version",
      "answer_safety_contract_key",
      "answer_safety_contract_version",
    ],
  );
});

test("qualification layout is canonical under v2 with no v1 fallback", async () => {
  assert.equal(
    repoRelative(sourceRoot),
    "packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v2/source",
  );
  assert.equal(
    repoRelative(generatedManifestPath),
    "packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v2/generated/qualification.manifest.json",
  );
  await assert.rejects(
    access(path.join(
      repoRoot,
      "packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v1",
    )),
    { code: "ENOENT" },
  );
});

test("recorded adapter regression closes only the implementation gate", async () => {
  const built = await buildQualificationManifest();
  const evidence = candidateEvidence(built);
  assert.equal(
    evidence.service.provider_api_version,
    "dashscope-compatible-api-v1",
  );
  assert.equal(evidence.service.model_id, "qwen-plus-2025-12-01");
  assert.equal(evidence.service.model_version, "2025-12-01");
  assert.equal(
    evidence.service.deployment_id,
    "aliyun-bailian-cn-qwen-plus-2025-12-01",
  );
  assert.equal(evidence.service.prompt_version, "1");
  assert.equal(
    evidence.service.owner_contract_key,
    "my-chat.nurture-institution-knowledge-answer-safety-owner",
  );
  assert.equal(evidence.service.owner_contract_version, "2.0.0");
  assert.equal(
    evidence.service.answer_safety_contract_key,
    "nurture.institution-knowledge-answer-safety",
  );
  assert.equal(evidence.service.answer_safety_contract_version, "2.0.0");
  assert.deepEqual(
    validateCandidateEvidence(evidence, built),
    {
      provider_id: "aliyun-bailian",
      model_id: "qwen-plus-2025-12-01",
      deployment_id: "aliyun-bailian-cn-qwen-plus-2025-12-01",
      prompt_template_id: "nurture-institution-knowledge-safety",
      prompt_version: "1",
      qualification_digest: built.manifest.qualificationContract.digest,
      fixtures: 15,
      qualification_effect: "service_backed_regression_qualification",
      adapter_qualified: true,
      live_qualified: false,
      capability_posture: "default_off",
      bitwise_determinism: false,
    },
  );
});

test("hand-authored JSON cannot claim live qualification", async () => {
  const built = await buildQualificationManifest();
  const liveClaim = candidateEvidence(built);
  liveClaim.evidence_mode = "live_gateway";
  assert.throws(
    () => validateCandidateEvidence(liveClaim, built),
    /adapter_recorded evidence only/u,
  );
});

test("moving service versions and identifiers fail closed", async () => {
  const built = await buildQualificationManifest();

  for (const field of [
    "model_version",
    "owner_contract_version",
    "answer_safety_contract_version",
  ]) {
    for (const version of ["latest", "main", "stable", "1.x", "^1.2.3"]) {
      const movingVersion = candidateEvidence(built);
      movingVersion.service[field] = version;
      assert.throws(
        () => validateCandidateEvidence(movingVersion, built),
        /invalid characters|exact immutable value/u,
      );
    }
  }

  for (const [field, movingId] of [
    ["gateway_id", "my-chat/latest"],
    ["model_id", "models/main"],
    ["deployment_id", "deployments/current"],
    ["prompt_template_id", "prompts/stable"],
    ["owner_contract_key", "owners/current"],
    ["answer_safety_contract_key", "contracts/latest"],
  ]) {
    const movingService = candidateEvidence(built);
    movingService.service[field] = movingId;
    assert.throws(
      () => validateCandidateEvidence(movingService, built),
      /moving alias or range/u,
    );
  }
});

test("coverage, input, call digests and invocation independence fail closed", async () => {
  const built = await buildQualificationManifest();

  const missingFixture = candidateEvidence(built);
  missingFixture.results.pop();
  assert.throws(
    () => validateCandidateEvidence(missingFixture, built),
    /cover every fixture/u,
  );

  const inputDrift = candidateEvidence(built);
  inputDrift.results[0].input_digest = `sha256:${"a".repeat(64)}`;
  assert.throws(
    () => validateCandidateEvidence(inputDrift, built),
    /input digest mismatch/u,
  );

  const duplicateInvocation = candidateEvidence(built);
  duplicateInvocation.results[0].attempts[1].invocation_id =
    duplicateInvocation.results[0].attempts[0].invocation_id;
  assert.throws(
    () => validateCandidateEvidence(duplicateInvocation, built),
    /duplicate invocation id/u,
  );

  const requestDrift = candidateEvidence(built);
  requestDrift.results[0].attempts[0].request_digest =
    `sha256:${"b".repeat(64)}`;
  assert.throws(
    () => validateCandidateEvidence(requestDrift, built),
    /request digest mismatch/u,
  );

  const responseDrift = candidateEvidence(built);
  responseDrift.results[0].attempts[0].response_digest =
    `sha256:${"c".repeat(64)}`;
  assert.throws(
    () => validateCandidateEvidence(responseDrift, built),
    /response digest mismatch/u,
  );
});

test("strict response schema and unavailable outcomes fail closed", async () => {
  const built = await buildQualificationManifest();

  const extraResponseField = candidateEvidence(built);
  extraResponseField.results[0].attempts[0].raw_response = "not admitted";
  assert.throws(
    () => validateCandidateEvidence(extraResponseField, built),
    /unexpected key/u,
  );

  const unsafeSuccess = candidateEvidence(built);
  const unavailableResult = unsafeSuccess.results.find(
    ({ fixture_id: fixtureId }) => fixtureId === "q3-provider-unavailable",
  );
  unavailableResult.attempts[0].status = "general_clear";
  assert.throws(
    () => validateCandidateEvidence(unsafeSuccess, built),
    /must fail closed/u,
  );
});
