import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SurfaceContractPortError,
  SurfaceContractValidationError,
  admitSurfaceContract,
  evaluateDependencyReadiness,
  findCapabilityExact,
  loadSurfaceContractManifest,
  requireExactPortBinding,
  type CapabilityDescriptorV1,
  type SurfaceContractManifestV1,
} from "../../src/surface-contract/index.js";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(
  packageRoot,
  "contracts/surfaces/v1/source",
);
const generatedManifestPath = path.join(
  packageRoot,
  "contracts/surfaces/v1/generated/surface-contract.manifest.json",
);
const generatedArtifactPinPath = path.join(
  packageRoot,
  "contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
);

const expectedCapabilityKeys = [
  "acknowledge_family_care_item",
  "correct_family_care_message",
  "policy_redact_family_care_message",
  "query_caregiver_family_care_work",
  "query_family_care_item",
  "query_guardian_family_care_timeline",
  "redact_family_care_message",
  "reply_family_care_item",
  "submit_family_care_question",
  "withdraw_family_care_request",
];

const expectedSurfaceKeys = [
  "caregiver_nurture_chat",
  "caregiver_teacher_board",
  "guardian_family_board",
  "guardian_nurture_chat",
  "institution_board",
  "institution_workbench",
];

const artifactPin = readJson(generatedArtifactPinPath);
const manifest = loadSurfaceContractManifest(
  readJson(generatedManifestPath),
  artifactPin,
);

describe("Phase 2 exact surface contract", () => {
  it("loads one exact, closed manifest with ten capabilities and six surfaces", () => {
    expect(manifest.interfaceContract).toEqual({
      key: "nurture.surface-contract",
      version: "1.1.0",
      digest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
    });
    expect(artifactPin).toEqual({
      schemaVersion: 1,
      artifactKind: "surface_contract_manifest",
      interfaceContract: manifest.interfaceContract,
      manifestDigest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
    });
    expect(manifest.sourceSet.sourceDigest).toBe(
      manifest.interfaceContract.digest,
    );
    expect(manifest.capabilities.map((entry) => entry.capabilityKey)).toEqual(
      expectedCapabilityKeys,
    );
    expect(manifest.surfaces.map((entry) => entry.surfaceKey)).toEqual(
      expectedSurfaceKeys,
    );
    expect(manifest.admission).toEqual({
      mode: "exact_key_version_digest",
      versionRanges: "forbidden",
      latestAlias: "forbidden",
      fallback: "forbidden",
    });
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.capabilities[0]?.descriptor)).toBe(true);
  });

  it("rejects unknown manifest and descriptor fields", () => {
    const withUnknownRoot = structuredClone(manifest) as Record<string, unknown>;
    withUnknownRoot.latest = true;
    expect(() => loadSurfaceContractManifest(withUnknownRoot, artifactPin)).toThrow(
      SurfaceContractValidationError,
    );

    const withUnknownDescriptor = structuredClone(manifest);
    const descriptor = withUnknownDescriptor.capabilities[0]?.descriptor;
    expect(descriptor).toBeDefined();
    (descriptor as unknown as Record<string, unknown>).authorizationGrant =
      "forbidden";
    expect(() =>
      loadSurfaceContractManifest(withUnknownDescriptor, artifactPin),
    ).toThrow(
      SurfaceContractValidationError,
    );

    const withMismatchedRevision = structuredClone(manifest);
    withMismatchedRevision.sourceSet.sourceDigest =
      `sha256:${"0".repeat(64)}`;
    expect(() =>
      loadSurfaceContractManifest(withMismatchedRevision, artifactPin),
    ).toThrow(
      SurfaceContractValidationError,
    );
  });

  it("requires a trusted artifact pin and rejects valid-looking semantic tampering", () => {
    expect(() =>
      loadSurfaceContractManifest(structuredClone(manifest), undefined),
    ).toThrow(/trustedArtifactPin/);

    const withChangedConfirmation = structuredClone(manifest);
    const descriptor = withChangedConfirmation.capabilities.find(
      (entry) => entry.capabilityKey === "submit_family_care_question",
    )?.descriptor;
    expect(descriptor).toBeDefined();
    if (descriptor) descriptor.confirmationPolicy = "none";
    expect(() =>
      loadSurfaceContractManifest(withChangedConfirmation, artifactPin),
    ).toThrow(/trusted artifact pin/);

    const withMalformedHeadBinding = structuredClone(manifest);
    const reply = withMalformedHeadBinding.capabilities.find(
      (entry) => entry.capabilityKey === "reply_family_care_item",
    )?.descriptor;
    expect(reply).toBeDefined();
    if (reply) {
      reply.concurrencyPolicy.headBindings[0] = {
        headKey: "grant_authority",
        mode: "must_satisfy",
      };
    }
    expect(() =>
      loadSurfaceContractManifest(withMalformedHeadBinding, artifactPin),
    ).toThrow(/requires predicateRef only/);
  });

  it("admits only exact key, version and digest without negotiation", () => {
    expect(
      admitSurfaceContract(
        manifest.interfaceContract,
        manifest.interfaceContract,
      ),
    ).toEqual({
      admitted: true,
      contract: manifest.interfaceContract,
    });
    for (const mismatch of [
      {
        ...manifest.interfaceContract,
        version: "1.0.2",
      },
      {
        ...manifest.interfaceContract,
        digest: `sha256:${"0".repeat(64)}` as const,
      },
    ]) {
      expect(
        admitSurfaceContract(manifest.interfaceContract, mismatch),
      ).toEqual({
        admitted: false,
        error: {
          code: "contract_mismatch",
          retryHint: "required_upgrade",
          contract: mismatch,
        },
      });
    }
  });

  it("materializes the exact contract ref into every descriptor", () => {
    for (const entry of manifest.capabilities) {
      expect(entry.descriptor.contract).toEqual(manifest.interfaceContract);
      expect(entry.descriptor.capabilityKey).toBe(entry.capabilityKey);
      expect(entry.descriptor.capabilityVersion).toBe(
        entry.capabilityVersion,
      );
      expect(entry.sliceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
    for (const surface of manifest.surfaces) {
      expect(surface.sliceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
    expect(manifest.sharedCoreHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("keeps the V1 registry closed and system policy out of user presenters", () => {
    const systemPolicy = requireCapability(
      manifest,
      "policy_redact_family_care_message",
    );
    expect(systemPolicy.supportedRoles).toEqual(["system_policy"]);
    expect(systemPolicy.presenterBindings).toEqual([]);
    expect(
      manifest.capabilities.some((entry) =>
        entry.capabilityKey.includes("caregiver_initiated"),
      ),
    ).toBe(false);
    expect(
      manifest.capabilities.some(
        (entry) => entry.capabilityKey === "query_admin_family_care",
      ),
    ).toBe(false);
  });

  it("distinguishes acknowledge convergence from reply-compatible append", () => {
    const acknowledge = requireCapability(
      manifest,
      "acknowledge_family_care_item",
    );
    expect(acknowledge.concurrencyPolicy.class).toBe("exact_state");
    expect(acknowledge.concurrencyPolicy.headBindings).toContainEqual({
      headKey: "acknowledgement_head",
      mode: "convergent_postcondition",
      postconditionRef: {
        key: "family_care_item_acknowledged",
        version: "1.0.0",
      },
    });

    const reply = requireCapability(manifest, "reply_family_care_item");
    expect(reply.concurrencyPolicy.class).toBe("append_compatible");
    expect(reply.concurrencyPolicy.headBindings).toContainEqual({
      headKey: "reply_collection",
      mode: "compatible_append",
    });
    expect(
      reply.concurrencyPolicy.headBindings.some(
        (binding) => binding.mode === "convergent_postcondition",
      ),
    ).toBe(false);
  });

  it("keeps query operations outside confirmation and delivery semantics", () => {
    const queries = manifest.capabilities
      .map((entry) => entry.descriptor)
      .filter((descriptor) => descriptor.executionClass === "query");
    expect(queries).toHaveLength(3);
    for (const descriptor of queries) {
      expect(descriptor.confirmationPolicy).toBe("none");
      expect(descriptor.deliveryClass).toBe("none");
      expect(descriptor.handlerBinding.bindingKind).toBe("query");
    }
  });

  it("separates capability business input from generic invocation metadata", () => {
    const forbiddenBusinessFields = [
      "actor",
      "scopeRef",
      "targetOptionRef",
      "expectedHeads",
      "idempotencyKey",
      "commandIdentity",
      "confirmationRef",
      "grant",
      "role",
      "policy",
    ];
    const capabilitySchemas = listCapabilityContractSchemas();
    for (const schema of capabilitySchemas) {
      const input = record(record(schema["$defs"]).input);
      const serialized = JSON.stringify(input);
      for (const field of forbiddenBusinessFields) {
        expect(serialized).not.toContain(`"${field}"`);
      }
    }

    const prepare = readSource(
      "invocation/prepare-action-invocation.schema.json",
    );
    expect(strings(prepare.required)).not.toContain("targetOptionRef");
    expect(strings(prepare.required)).toEqual(
      expect.arrayContaining([
        "expectedContract",
        "scopeRef",
        "purposeKey",
        "requestNonce",
        "expiresAt",
        "commandIdentity",
        "idempotencyKey",
        "typedInput",
      ]),
    );
  });

  it("keeps acknowledge input empty and protected text bounded", () => {
    const acknowledge = readSource(
      "capabilities/contracts/acknowledge-family-care-item.schema.json",
    );
    expect(record(record(acknowledge["$defs"]).input)["$ref"]).toBe(
      "family-care-types.schema.json#/$defs/emptyInput",
    );
    const common = readSource(
      "capabilities/contracts/family-care-types.schema.json",
    );
    const protectedText = record(record(common["$defs"]).protectedPlainText);
    expect(protectedText.minLength).toBe(1);
    expect(protectedText.maxLength).toBe(2000);
    expect(JSON.stringify(common)).not.toContain("protectedContentRef");
  });

  it("keeps dependency-gated capabilities unavailable without the real owner", () => {
    const submit = requireCapability(
      manifest,
      "submit_family_care_question",
    );
    expect(
      evaluateDependencyReadiness(submit, [
        {
          dependencyKey: "t005_family_care",
          version: "1.0.0",
          achievedGate: "contract_boundary",
        },
      ]),
    ).toEqual({
      status: "unavailable",
      reasons: [
        {
          code: "dependency_no_go",
          dependencyKey: "t002_owner_integration",
          retryHint: "none",
        },
      ],
    });
    expect(
      evaluateDependencyReadiness(submit, [
        {
          dependencyKey: "t002_owner_integration",
          version: "1.0.0",
          achievedGate: "owner_integration",
        },
        {
          dependencyKey: "t005_family_care",
          version: "1.0.0",
          achievedGate: "contract_boundary",
        },
      ]),
    ).toEqual({ status: "eligible", reasons: [] });
  });

  it("rejects malformed or ambiguous dependency evidence before gate comparison", () => {
    const submit = requireCapability(
      manifest,
      "submit_family_care_question",
    );
    for (const invalidState of [
      {
        dependencyKey: "t002_owner_integration",
        version: "not-semver",
        achievedGate: "owner_integration",
      },
      {
        dependencyKey: "t002_owner_integration",
        version: "1.0.0",
        achievedGate: "not-a-gate",
      },
      {
        dependencyKey: "t002_owner_integration",
        version: "1.0.0",
        achievedGate: "owner_integration",
        trusted: true,
      },
    ]) {
      expect(() =>
        evaluateDependencyReadiness(submit, [
          invalidState as never,
          {
            dependencyKey: "t005_family_care",
            version: "1.0.0",
            achievedGate: "contract_boundary",
          },
        ]),
      ).toThrow(SurfaceContractValidationError);
    }
    expect(() =>
      evaluateDependencyReadiness(submit, [
        {
          dependencyKey: "t002_owner_integration",
          version: "1.0.0",
          achievedGate: "owner_integration",
        },
        {
          dependencyKey: "t002_owner_integration",
          version: "1.0.1",
          achievedGate: "owner_integration",
        },
      ]),
    ).toThrow(/duplicate t002_owner_integration/);
  });

  it("requires exact versioned ports and never supplies a fallback", () => {
    const implementation = { kind: "owner" } as const;
    expect(
      requireExactPortBinding(
        { key: "binding_owner_repository", version: "1.0.0" },
        {
          key: "binding_owner_repository",
          version: "1.0.0",
          implementation,
        },
      ),
    ).toBe(implementation);
    expect(() =>
      requireExactPortBinding(
        { key: "binding_owner_repository", version: "1.0.0" },
        undefined,
      ),
    ).toThrow(SurfaceContractPortError);
    expect(() =>
      requireExactPortBinding(
        { key: "binding_owner_repository", version: "1.0.0" },
        {
          key: "binding_owner_repository",
          version: "1.0.1",
          implementation,
        },
      ),
    ).toThrow(SurfaceContractPortError);
  });

  it("freezes presenter fields for all six surfaces and keeps admin board read-only", () => {
    const presenterRegistry = readSource(
      "surfaces/presenter-registry.json",
    );
    const presenters = records(presenterRegistry.presenters);
    expect(presenters.map((presenter) => text(presenter.surfaceKey)).sort()).toEqual(
      expectedSurfaceKeys,
    );
    for (const presenter of presenters) {
      expect(strings(presenter.stableRequiredFields)).toEqual(
        expect.arrayContaining([
          "contract",
          "snapshotRef",
          "snapshotVersion",
          "actorContext",
          "content",
          "actions",
          "dependencyNoGos",
        ]),
      );
      expect(strings(presenter.stableOptionalFields)).toEqual(["pageInfo"]);
    }
    const adminBoard = presenters.find(
      (presenter) => presenter.surfaceKey === "institution_board",
    );
    expect(adminBoard?.actionProjection).toBe("none");
  });

  it("uses a complete logical schema registry for every descriptor reference", () => {
    const schemaRegistry = readSource("interface/schema-registry.json");
    const refs = new Set(
      records(schemaRegistry.schemas).map((entry) => text(entry.schemaRef)),
    );
    for (const descriptor of manifest.capabilities.map(
      (entry) => entry.descriptor,
    )) {
      expect(refs.has(descriptor.inputSchemaRef)).toBe(true);
      expect(refs.has(descriptor.resultSchemaRef)).toBe(true);
      expect(refs.has(descriptor.errorSchemaRef)).toBe(true);
      if (descriptor.targetPolicy.optionSchemaRef !== null) {
        expect(refs.has(descriptor.targetPolicy.optionSchemaRef)).toBe(true);
      }
    }
  });

  it("keeps the generic error envelope closed and free of private state", () => {
    const errorSchema = readSource("invocation/operation-error.schema.json");
    expect(errorSchema.additionalProperties).toBe(false);
    const serialized = JSON.stringify(errorSchema);
    for (const forbidden of [
      "prisma",
      "child_id",
      "family_id",
      "anchor",
      "grantId",
      "policyOutcome",
      "internalRoute",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("binds confirmation and cursor state privately without exposing protected bodies", () => {
    const confirmation = readSource(
      "invocation/confirmation-binding.schema.json",
    );
    expect(strings(confirmation.required)).toEqual(
      expect.arrayContaining([
        "contract",
        "commandIdentity",
        "targetBindingTag",
        "actorScopeBindingTag",
        "inputIntegrity",
        "headBindings",
        "expiresAt",
      ]),
    );
    const confirmationProperties = record(confirmation.properties);
    const integrityProperties = record(
      record(confirmationProperties.inputIntegrity).properties,
    );
    expect(strings(record(integrityProperties.mode).enum)).toEqual([
      "canonical_hash",
      "protected_keyed_integrity_tag",
    ]);
    expect(JSON.stringify(confirmation)).not.toContain('"body"');

    const cursor = readSource("invocation/cursor-binding.schema.json");
    expect(strings(cursor.required)).toEqual(
      expect.arrayContaining([
        "contractDigest",
        "actorBindingTag",
        "scopeBindingTag",
        "queryKey",
        "sortKey",
        "snapshotRef",
        "snapshotVersion",
        "expiresAt",
      ]),
    );
    expect(JSON.stringify(cursor)).not.toContain("actorId");
    expect(JSON.stringify(cursor)).not.toContain("scopeId");
  });

  it("defines slice invalidation independently from exact root admission", () => {
    const compatibility = readSource("interface/compatibility-policy.json");
    expect(compatibility.admission).toBe("exact_key_version_digest");
    expect(compatibility.optionalAdditiveChange).toBe(
      "new_version_and_digest",
    );
    expect(record(compatibility.sliceInvalidation)).toEqual({
      changedCapabilitySlice: "invalidate_referencing_evidence",
      changedSurfaceSlice: "invalidate_referencing_evidence",
      additiveNewSlice: "preserve_existing_slice_evidence",
      changedSharedCore: "invalidate_all_surface_contract_evidence",
    });
    expect(record(compatibility.confirmationIntegrity)).toEqual({
      ordinaryInput: "canonical_hash_allowed",
      protectedLowEntropyInput: "secret_keyed_integrity_tag_required",
      bareProtectedBodyHash: "forbidden",
    });
    expect(record(compatibility.confirmationLifecycle)).toEqual({
      maximumLifetimeSeconds: 300,
      extendable: false,
      consumption: "single_new_effect",
      successfulRetry: "exact_command_execution_replay",
    });
  });

  it("records a path-sorted canonical inventory without build-time provenance", () => {
    const paths = manifest.sourceSet.inventory.map((entry) => entry.path);
    expect(paths).toEqual([...paths].sort());
    expect(new Set(paths).size).toBe(paths.length);
    expect(JSON.stringify(manifest)).not.toContain("builtAt");
    expect(JSON.stringify(manifest)).not.toContain("gitCommit");
    expect(manifest.admission.latestAlias).toBe("forbidden");
  });
});

function requireCapability(
  contractManifest: SurfaceContractManifestV1,
  key: string,
): CapabilityDescriptorV1 {
  const descriptor = findCapabilityExact(contractManifest, key, "1.0.0");
  expect(descriptor, `missing ${key}@1.0.0`).toBeDefined();
  return descriptor as CapabilityDescriptorV1;
}

function listCapabilityContractSchemas(): Record<string, unknown>[] {
  return expectedCapabilityKeys.map((key) => {
    const descriptor = requireCapability(manifest, key);
    const schemaRegistry = records(
      readSource("interface/schema-registry.json").schemas,
    );
    const inputBinding = schemaRegistry.find(
      (entry) => entry.schemaRef === descriptor.inputSchemaRef,
    );
    expect(inputBinding).toBeDefined();
    return readSource(text(inputBinding?.artifactPath));
  });
}

function readSource(relativePath: string): Record<string, unknown> {
  return readJson(path.join(sourceRoot, relativePath));
}

function readJson(absolutePath: string): Record<string, unknown> {
  return record(JSON.parse(readFileSync(absolutePath, "utf8")) as unknown);
}

function record(value: unknown): Record<string, unknown> {
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  expect(typeof value).toBe("object");
  return value as Record<string, unknown>;
}

function records(value: unknown): Record<string, unknown>[] {
  expect(Array.isArray(value)).toBe(true);
  return value as Record<string, unknown>[];
}

function strings(value: unknown): string[] {
  expect(Array.isArray(value)).toBe(true);
  return (value as unknown[]).map(text);
}

function text(value: unknown): string {
  expect(typeof value).toBe("string");
  return value as string;
}
