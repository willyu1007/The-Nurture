import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as harness from "../../src/index.js";
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

const expectedCapabilityVersions: Record<string, string> = {
  acknowledge_family_care_item: "1.0.0",
  acquire_publish_edit_hold: "1.0.0",
  cancel_publish_process: "1.0.0",
  confirm_child_media_attribution: "1.0.0",
  correct_publication: "1.0.0",
  correct_family_care_message: "1.0.0",
  initiate_caregiver_direct_message: "1.0.0",
  detach_publish_process_media: "1.0.0",
  discard_media_asset: "1.0.0",
  organize_care_capture_batch: "1.0.0",
  policy_redact_family_care_message: "1.0.0",
  query_caregiver_child_today: "1.0.0",
  query_caregiver_family_care_work: "1.1.0",
  query_caregiver_teacher_board: "1.0.0",
  query_family_care_item: "1.1.0",
  query_guardian_current_focus: "1.0.0",
  query_guardian_enrollment_activity: "1.0.0",
  query_guardian_family_board: "1.0.0",
  query_guardian_family_care_timeline: "1.1.0",
  query_teacher_publish_queue: "1.0.0",
  record_caregiver_daily_care: "1.0.0",
  redact_family_care_message: "1.0.0",
  redact_publication: "1.0.0",
  reject_child_media_attribution: "1.0.0",
  release_publish_edit_hold: "1.0.0",
  release_publish_process: "1.0.0",
  remove_publication_target_visibility: "1.0.0",
  renew_publish_edit_hold: "1.0.0",
  reschedule_publish_process: "1.0.0",
  reply_family_care_item: "1.0.0",
  save_publish_process_draft: "1.0.0",
  submit_family_care_question: "1.0.0",
  supersede_child_media_attribution: "1.0.0",
  update_guardian_current_focus: "1.0.0",
  withdraw_family_care_request: "1.0.0",
};

const expectedCapabilityKeys = Object.keys(expectedCapabilityVersions).sort();

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
  it("loads one exact, closed manifest with thirty-five capabilities and six surfaces", () => {
    expect(manifest.interfaceContract).toEqual({
      key: "nurture.surface-contract",
      version: "1.14.0",
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

  it("keeps the registry closed and system policy out of user presenters", () => {
    const systemPolicy = requireCapability(
      manifest,
      "policy_redact_family_care_message",
    );
    expect(systemPolicy.supportedRoles).toEqual(["system_policy"]);
    expect(systemPolicy.presenterBindings).toEqual([]);
    const direct = requireCapability(manifest, "initiate_caregiver_direct_message");
    expect(direct.supportedRoles).toEqual(["caregiver", "lead_caregiver"]);
    expect(direct.targetPolicy.kind).toBe("owner_option_required");
    expect(direct.confirmationPolicy).toBe("reviewable_commit");
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
    expect(queries).toHaveLength(9);
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
    const capabilityInputs = listCapabilityContractInputs();
    for (const input of capabilityInputs) {
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
  const version = expectedCapabilityVersions[key] ?? "1.0.0";
  const descriptor = findCapabilityExact(contractManifest, key, version);
  expect(descriptor, `missing ${key}@${version}`).toBeDefined();
  return descriptor as CapabilityDescriptorV1;
}

/**
 * Resolves each capability's typed input through the registry's own pointer, so
 * a contract file that hosts several capabilities is still checked at the exact
 * definition the descriptor references.
 */
function listCapabilityContractInputs(): unknown[] {
  const schemaRegistry = records(readSource("interface/schema-registry.json").schemas);
  return expectedCapabilityKeys.map((key) => {
    const descriptor = requireCapability(manifest, key);
    const inputBinding = schemaRegistry.find(
      (entry) => entry.schemaRef === descriptor.inputSchemaRef,
    );
    expect(inputBinding, `${key} input schema binding`).toBeDefined();
    const artifact = readSource(text(inputBinding?.artifactPath));
    const pointer = text(inputBinding?.jsonPointer);
    expect(pointer.startsWith("/$defs/"), `${key} input pointer`).toBe(true);
    const definition = record(artifact["$defs"])[pointer.replace("/$defs/", "")];
    expect(definition, `${key} input definition`).toBeDefined();
    return definition;
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

// ---------------------------------------------------------------------------
// Every board write command declares the head set it freezes. This binds that
// declaration to the registry's concurrency policy, across the boundary: the
// contract says which equalities a capability guarantees, and the runtime has to
// actually freeze at least that many. Comparing two empty head maps succeeds, so
// without this a capability that simply forgot its head would pass head
// comparison unconditionally.

/**
 * A capability that legitimately freezes no head at all. Each entry has to name
 * what stands in for the equality; an empty head set is otherwise the vacuous
 * case and must not be reachable by omission.
 */
const HEADLESS_BOARD_WRITES: Record<string, string> = {};

const boardWriteSpecDeps = {
  integrity_key: "phase-2-contract-integrity-key-32chars!",
  protected_content: {
    seal: (plaintext: string) => ({ sealed: plaintext }) as never,
    unseal: () => "",
  },
};

describe("board write commands conform to the registry's concurrency policy", () => {
  const registry = JSON.parse(
    readFileSync(path.join(sourceRoot, "capabilities/capability-registry.json"), "utf8"),
  ) as {
    capabilities: Array<{
      capabilityKey: string;
      concurrencyPolicy: { headBindings: Array<{ headKey: string; mode: string }> };
    }>;
  };

  /**
   * The exact set of board-write spec factories. New factories are still
   * discovered reflectively below — this list is what the discovery is checked
   * against, so a factory can neither hide from the census (discovery finds
   * it, the list rejects it) nor silently vanish from it (the list demands it).
   */
  const EXPECTED_BOARD_WRITE_FACTORIES = [
    "createUpdateGuardianCurrentFocusSpec",
    "createRecordCaregiverDailyCareSpec",
    "createCancelPublishProcessSpec",
    "createAcquirePublishEditHoldSpec",
    "createRenewPublishEditHoldSpec",
    "createReleasePublishEditHoldSpec",
    "createSavePublishProcessDraftSpec",
    "createConfirmChildMediaAttributionSpec",
    "createRejectChildMediaAttributionSpec",
    "createSupersedeChildMediaAttributionSpec",
  ].sort();

  /**
   * How each registry `must_equal` head name maps onto the spec's frozen head
   * name. Counting alone proved nothing — a spec could freeze the wrong head
   * and still count right — so the conformance below walks identities through
   * this table, and a registry head with no mapping fails rather than being
   * skipped.
   */
  const REGISTRY_HEAD_TO_SPEC_HEAD: Record<string, Record<string, string>> = {
    update_guardian_current_focus: { focus_cycle: "focus_cycle", focus_goal: "focus_goal" },
    record_caregiver_daily_care: { enrollment_lifecycle: "enrollment" },
    save_publish_process_draft: { draft_revision: "draft_revision" },
    acquire_publish_edit_hold: { publish_edit_hold: "publish_edit_hold" },
    renew_publish_edit_hold: { publish_edit_hold: "publish_edit_hold" },
    release_publish_edit_hold: { publish_edit_hold: "publish_edit_hold" },
    cancel_publish_process: {},
    confirm_child_media_attribution: {
      child_media_attribution: "child_media_attribution",
      media_asset_revision: "media_asset_revision",
    },
    reject_child_media_attribution: {
      child_media_attribution: "child_media_attribution",
      media_asset_revision: "media_asset_revision",
    },
    supersede_child_media_attribution: {
      child_media_attribution: "child_media_attribution",
      media_asset_revision: "media_asset_revision",
    },
  };

  /**
   * Registered capabilities that declare a `must_equal` head but have no
   * command spec yet — the unrouted write lanes. Each entry is a debt this
   * census carries visibly; a spec landing for one of these without removing
   * the entry fails below, so the list cannot go stale.
   */
  /**
   * T-005 capabilities whose specs predate the factory: hand-built, so they
   * publish no `board_write_head_keys` for this census to read. Their head
   * discipline is pinned by their own G2 suites; they are named here so the
   * reverse walk distinguishes "has a pre-factory spec" from "has none".
   */
  const HAND_BUILT_SPECS = [
    "correct_family_care_message",
    "withdraw_family_care_request",
    "redact_family_care_message",
    "policy_redact_family_care_message",
  ];

  const MUST_EQUAL_WITHOUT_SPEC = [
    "detach_publish_process_media",
    "discard_media_asset",
    "organize_care_capture_batch",
    "release_publish_process",
    "reschedule_publish_process",
  ];

  /**
   * `createBoardWriteSpec` is the factory the seven factories are built FROM —
   * it takes a definition, not deps, so the census constructs everything except
   * itself. Nothing else may join this list without a reason of the same kind.
   */
  const NOT_A_CAPABILITY_FACTORY = new Set(["createBoardWriteSpec"]);

  type ConstructedSpec = { name: string; command_key: string; head_keys: readonly string[] };
  const constructionFailures: Array<{ name: string; error: string }> = [];
  const builtSpecs: ConstructedSpec[] = [];
  for (const [name, factory] of Object.entries(harness)) {
    if (!/^create[A-Za-z]+Spec$/.test(name) || NOT_A_CAPABILITY_FACTORY.has(name)) continue;
    let spec: unknown;
    try {
      spec = (factory as (deps: unknown) => unknown)(boardWriteSpecDeps);
    } catch (error) {
      // A factory this census cannot construct is a spec it cannot check —
      // swallowing the throw is exactly how two of seven once went missing.
      constructionFailures.push({ name, error: String(error) });
      continue;
    }
    const built = spec as { command_key?: string; board_write_head_keys?: readonly string[] };
    if (built?.board_write_head_keys && built.command_key) {
      builtSpecs.push({ name, command_key: built.command_key, head_keys: built.board_write_head_keys });
    }
  }

  it("constructs every spec factory and finds exactly the declared census", () => {
    expect(constructionFailures).toEqual([]);
    expect(builtSpecs.map((entry) => entry.name).sort()).toEqual(EXPECTED_BOARD_WRITE_FACTORIES);
    expect(new Set(builtSpecs.map((entry) => entry.command_key)).size).toBe(builtSpecs.length);
  });

  it("freezes the exact head each declared equality maps to", () => {
    for (const spec of builtSpecs) {
      const capability = registry.capabilities.find(
        (entry) => entry.capabilityKey === spec.command_key,
      );
      expect(capability, `${spec.name} commits an unregistered capability`).toBeTruthy();
      const mapping = REGISTRY_HEAD_TO_SPEC_HEAD[spec.command_key];
      expect(mapping, `${spec.command_key} has no registry-head mapping`).toBeTruthy();
      for (const binding of capability!.concurrencyPolicy.headBindings) {
        if (binding.mode !== "must_equal") continue;
        const specHead = mapping![binding.headKey];
        expect(
          specHead,
          `${spec.command_key}: registry head ${binding.headKey} maps to no spec head`,
        ).toBeTruthy();
        expect(
          spec.head_keys,
          `${spec.command_key}: mapped head ${specHead} is not frozen`,
        ).toContain(specHead);
      }
      // And nothing in the mapping is fiction: every mapped name is declared.
      for (const specHead of Object.values(mapping!)) {
        expect(spec.head_keys, `${spec.command_key}: mapping names unknown head ${specHead}`).toContain(
          specHead,
        );
      }
    }
  });

  it("walks the reverse direction: every must_equal capability has a spec or a named debt", () => {
    const specKeys = new Set(builtSpecs.map((entry) => entry.command_key));
    const mustEqualKeys = registry.capabilities
      .filter((entry) =>
        entry.concurrencyPolicy.headBindings.some((binding) => binding.mode === "must_equal"),
      )
      .map((entry) => entry.capabilityKey);
    for (const key of mustEqualKeys) {
      if (specKeys.has(key) || HAND_BUILT_SPECS.includes(key)) continue;
      expect(
        MUST_EQUAL_WITHOUT_SPEC,
        `${key} declares a must_equal head, has no spec and is not carried as a named debt`,
      ).toContain(key);
    }
    // A hand-built entry that grows factory head keys belongs to the census,
    // not to this list.
    for (const key of HAND_BUILT_SPECS) {
      expect(specKeys.has(key), `${key} is listed as hand-built but the factory now builds it`).toBe(
        false,
      );
    }
    // A debt that has been paid must leave the list, or the next real gap
    // hides behind it. And a debt no registry entry backs is fiction.
    for (const key of MUST_EQUAL_WITHOUT_SPEC) {
      expect(specKeys.has(key), `${key} is listed as spec-less but a spec exists`).toBe(false);
      expect(mustEqualKeys, `${key} is listed but declares no must_equal head`).toContain(key);
    }
  });

  it("never reaches an empty head set by omission", () => {
    for (const spec of builtSpecs) {
      if (spec.head_keys.length > 0) continue;
      expect(
        HEADLESS_BOARD_WRITES[spec.command_key],
        `${spec.command_key} freezes no head and names no reason`,
      ).toBeTruthy();
    }
    // A stale exemption is how the next real omission gets ignored.
    for (const key of Object.keys(HEADLESS_BOARD_WRITES)) {
      const spec = builtSpecs.find((entry) => entry.command_key === key);
      expect(spec?.head_keys, `${key} is exempted but now freezes a head`).toEqual([]);
    }
  });
});
