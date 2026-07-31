import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceRoot = new URL(
  "../../contracts/surfaces/v1/source/",
  import.meta.url,
);

const expectedSurfaceKeys = [
  "guardian_nurture_chat",
  "guardian_family_board",
  "caregiver_nurture_chat",
  "caregiver_teacher_board",
  "institution_board",
  "institution_workbench",
];

const surfaceRecordKeys = [
  "surfaceKey",
  "surfaceVersion",
  "actorRoles",
  "workspaceScope",
  "primaryMode",
  "contentFamily",
  "writeBoundary",
  "targetSelection",
  "stateWhenDependenciesMissing",
  "presenterBinding",
  "orderedContentKinds",
  "dependencyGates",
];

const visibilityRecordKeys = [
  "surfaceKey",
  "read",
  "write",
  "explicitlyDenied",
  "authorityRules",
];

const descriptorSchema = readJson(
  "capabilities/capability-descriptor.schema.json",
);
const primitiveSchema = readJson(
  "interface/contract-primitives.schema.json",
);
const interfaceRefSchema = readJson(
  "interface/interface-contract-ref.schema.json",
);
const envelopeSchema = readJson("surfaces/surface-envelope.schema.json");
const surfaceRegistry = readJson("surfaces/surface-registry.json");
const visibilityMatrix = readJson("interface/visibility-matrix.json");
const surfaceRules = readJson("interface/surface-rules.json");

describe("Phase 1 surface-contract source", () => {
  it("uses closed, engine-ready descriptor axes without authorization shortcuts", () => {
    expect(strings(descriptorSchema.required)).toEqual([
      "capabilityKey",
      "capabilityVersion",
      "contract",
      "domainClass",
      "executionClass",
      "deliveryClass",
      "intentKeys",
      "inputSchemaRef",
      "resultSchemaRef",
      "errorSchemaRef",
      "targetPolicy",
      "confirmationPolicy",
      "concurrencyPolicy",
      "eligibilityPolicyRef",
      "handlerBinding",
      "presenterBindings",
      "invalidationScopeKinds",
      "dependencyGates",
    ]);

    const properties = record(descriptorSchema.properties);
    expect(enumValues(properties.domainClass)).toEqual([
      "care_interaction",
      "institution_management",
      "publish_process",
      "read_model",
    ]);
    expect(enumValues(properties.executionClass)).toEqual([
      "query",
      "action_execution",
      "institution_workflow_action",
      "publish_process_transition",
    ]);
    expect(enumValues(properties.deliveryClass)).toEqual([
      "none",
      "action_delivery_candidate",
    ]);

    const definitions = record(descriptorSchema["$defs"]);
    const concurrency = record(definitions.concurrencyPolicy);
    const concurrencyProperties = record(concurrency.properties);
    expect(enumValues(concurrencyProperties.class)).toEqual([
      "exact_state",
      "lifecycle_authority",
      "append_compatible",
    ]);
    const handlerBinding = record(definitions.handlerBinding);
    expect(strings(handlerBinding.required)).toEqual([
      "bindingKey",
      "bindingKind",
    ]);
    expect(JSON.stringify(handlerBinding)).not.toContain("availability");
    const presenterBindings = record(properties.presenterBindings);
    expect(presenterBindings.minItems).toBeUndefined();
    expect(JSON.stringify(descriptorSchema)).not.toContain("operationClass");
    expect(JSON.stringify(descriptorSchema)).not.toContain("authorizationGrant");
  });

  it("uses one primitive SSOT and resolves every local schema reference", () => {
    const primitiveDefinitions = record(primitiveSchema["$defs"]);
    expect(Object.keys(primitiveDefinitions).sort()).toEqual(
      [
        "stableKey",
        "semver",
        "schemaRef",
        "opaqueRef",
        "surfaceActorRole",
        "capabilityActorRole",
        "versionedRef",
      ].sort(),
    );
    const descriptorDefinitions = record(descriptorSchema["$defs"]);
    const envelopeDefinitions = record(envelopeSchema["$defs"]);
    for (const primitive of [
      "stableKey",
      "semver",
      "schemaRef",
      "opaqueRef",
      "surfaceActorRole",
      "capabilityActorRole",
      "versionedRef",
    ]) {
      expect(descriptorDefinitions[primitive]).toBeUndefined();
      expect(envelopeDefinitions[primitive]).toBeUndefined();
    }
    expect(enumValues(primitiveDefinitions.surfaceActorRole)).toEqual([
      "guardian",
      "caregiver",
      "lead_caregiver",
      "institution_admin",
    ]);
    expect(enumValues(primitiveDefinitions.capabilityActorRole)).toEqual([
      "guardian",
      "caregiver",
      "lead_caregiver",
      "institution_admin",
      "system_policy",
    ]);

    for (const [relativePath, schema] of [
      [
        "interface/interface-contract-ref.schema.json",
        interfaceRefSchema,
      ],
      [
        "capabilities/capability-descriptor.schema.json",
        descriptorSchema,
      ],
      ["surfaces/surface-envelope.schema.json", envelopeSchema],
      ["interface/contract-primitives.schema.json", primitiveSchema],
    ] as const) {
      const schemaUrl = new URL(relativePath, sourceRoot);
      for (const reference of collectRefs(schema)) {
        if (reference.startsWith("#") || reference.startsWith("https://")) {
          continue;
        }
        const [filePath] = reference.split("#", 1);
        expect(
          existsSync(fileURLToPath(new URL(filePath, schemaUrl))),
          `${relativePath} cannot resolve ${reference}`,
        ).toBe(true);
      }
    }
  });

  it("defines exactly six role-bound surfaces with stable semantic families", () => {
    expect(surfaceRegistry.schemaVersion).toBe(1);
    const surfaces = records(surfaceRegistry.surfaces);
    expect(surfaces.map((surface) => text(surface.surfaceKey))).toEqual(
      expectedSurfaceKeys,
    );
    expect(new Set(surfaces.map((surface) => text(surface.surfaceKey))).size).toBe(
      surfaces.length,
    );

    for (const surface of surfaces) {
      expect(Object.keys(surface).sort()).toEqual(
        [...surfaceRecordKeys].sort(),
      );
      expect(uniqueStrings(surface.actorRoles)).toEqual(
        strings(surface.actorRoles),
      );
      expect(uniqueStrings(surface.orderedContentKinds)).toEqual(
        strings(surface.orderedContentKinds),
      );
      expect(uniqueStrings(surface.dependencyGates)).toEqual(
        strings(surface.dependencyGates),
      );
    }

    const byKey = keyedBy(surfaces, "surfaceKey");
    expect(strings(byKey.get("institution_board")?.actorRoles)).toEqual([
      "institution_admin",
    ]);
    expect(text(byKey.get("institution_board")?.writeBoundary)).toBe("none");
    expect(strings(byKey.get("caregiver_nurture_chat")?.actorRoles)).toEqual([
      "caregiver",
      "lead_caregiver",
    ]);
    expect(text(byKey.get("guardian_nurture_chat")?.targetSelection)).toBe(
      "board_required_for_multiple_eligible_enrollments",
    );
    expect(text(byKey.get("guardian_family_board")?.targetSelection)).toBe(
      "owner_option_required_when_multiple",
    );
  });

  it("keeps every registered content kind inside its closed content-family union", () => {
    const definitions = record(envelopeSchema["$defs"]);
    const kindSets = new Map<string, Set<string>>([
      [
        "conversation",
        new Set(
          enumValues(
            record(record(definitions.conversationItem).properties).kind,
          ),
        ),
      ],
      [
        "board",
        new Set(
          enumValues(record(record(definitions.boardModule).properties).kind),
        ),
      ],
      [
        "workbench",
        new Set(
          enumValues(
            record(record(definitions.workbenchModule).properties).kind,
          ),
        ),
      ],
    ]);

    for (const surface of records(surfaceRegistry.surfaces)) {
      const family = text(surface.contentFamily);
      const allowed = kindSets.get(family);
      expect(allowed, `unknown content family ${family}`).toBeDefined();
      for (const kind of strings(surface.orderedContentKinds)) {
        expect(allowed?.has(kind), `${family} must declare ${kind}`).toBe(true);
      }
    }
  });

  it("separates Admin protected read from CareGroup action authority", () => {
    const recordsBySurface = keyedBy(
      records(visibilityMatrix.surfaces),
      "surfaceKey",
    );
    const institutionBoard = required(
      recordsBySurface.get("institution_board"),
      "institution board visibility",
    );
    expect(strings(institutionBoard.read)).toContain(
      "family_care_business_communication",
    );
    expect(strings(institutionBoard.write)).toEqual([]);
    expect(strings(institutionBoard.explicitlyDenied)).toEqual(
      expect.arrayContaining([
        "family_private_ai",
        "caregiver_unsent_publish_draft",
        "cross_institution_presence",
      ]),
    );
    expect(strings(institutionBoard.authorityRules)).toEqual(
      expect.arrayContaining([
        "current_institution_admin",
        "exact_institution_and_class_scope",
        "business_channel_disclosed_before_send",
        "original_grant_data_class_direction_purpose",
        "current_source_lifecycle",
        "admin_read_never_grants_care_group_action",
      ]),
    );

    const institutionWorkbench = required(
      recordsBySurface.get("institution_workbench"),
      "institution workbench visibility",
    );
    expect(strings(institutionWorkbench.write)).toContain("grant_request");
    expect(strings(institutionWorkbench.write)).toContain(
      "institution_workflow",
    );
    expect(strings(institutionWorkbench.write)).not.toContain("grant");
    expect(strings(institutionWorkbench.write)).not.toContain(
      "institution_workflow_projection",
    );
  });

  it("allows Guardian provenance while denying cross-Institution visibility to institution actors", () => {
    const recordsBySurface = keyedBy(
      records(visibilityMatrix.surfaces),
      "surfaceKey",
    );
    for (const key of ["guardian_nurture_chat", "guardian_family_board"]) {
      expect(strings(recordsBySurface.get(key)?.read)).toContain(
        "cross_institution_presence",
      );
      expect(strings(recordsBySurface.get(key)?.explicitlyDenied)).not.toContain(
        "cross_institution_presence",
      );
    }
    for (const key of [
      "caregiver_nurture_chat",
      "caregiver_teacher_board",
      "institution_board",
      "institution_workbench",
    ]) {
      expect(strings(recordsBySurface.get(key)?.explicitlyDenied)).toContain(
        "cross_institution_presence",
      );
    }
  });

  it("keeps visibility records closed, disjoint and aligned with the surface registry", () => {
    expect(visibilityMatrix.schemaVersion).toBe(1);
    const declaredDataClasses = new Set(strings(visibilityMatrix.dataClasses));
    const dataClassOwners = record(visibilityMatrix.dataClassOwners);
    expect(Object.keys(dataClassOwners).sort()).toEqual(
      [...declaredDataClasses].sort(),
    );
    expect(text(dataClassOwners.family_private_ai)).toBe("my_chat");
    for (const [dataClass, owner] of Object.entries(dataClassOwners)) {
      expect(
        owner === "my_chat" || owner === "nurture",
        `${dataClass} has an invalid canonical owner`,
      ).toBe(true);
    }
    const visibilityRecords = records(visibilityMatrix.surfaces);
    expect(visibilityRecords.map((entry) => text(entry.surfaceKey))).toEqual(
      expectedSurfaceKeys,
    );

    for (const entry of visibilityRecords) {
      expect(Object.keys(entry).sort()).toEqual(
        [...visibilityRecordKeys].sort(),
      );
      const read = strings(entry.read);
      const write = strings(entry.write);
      const denied = strings(entry.explicitlyDenied);
      expect(uniqueStrings(read)).toHaveLength(read.length);
      expect(uniqueStrings(write)).toHaveLength(write.length);
      expect(uniqueStrings(denied)).toHaveLength(denied.length);
      for (const dataClass of [...read, ...write, ...denied]) {
        expect(
          declaredDataClasses.has(dataClass),
          `${text(entry.surfaceKey)} uses undeclared ${dataClass}`,
        ).toBe(true);
      }
      expect(
        [...new Set([...read, ...write, ...denied])].sort(),
        `${text(entry.surfaceKey)} must classify every data class`,
      ).toEqual([...declaredDataClasses].sort());
      expect(read.filter((value) => denied.includes(value))).toEqual([]);
      expect(write.filter((value) => denied.includes(value))).toEqual([]);
    }
  });

  it("freezes four independent readiness axes and atomic cursor behavior", () => {
    const axes = records(surfaceRules.readinessAxes);
    expect(axes.map((axis) => text(axis.axisKey))).toEqual([
      "platform_identity_binding",
      "family_relationship",
      "institution_relationship",
      "data_authorization",
    ]);
    expect(strings(surfaceRules.surfaceStates)).toEqual([
      "ready",
      "limited",
      "needs_setup",
      "unavailable",
    ]);
    expect(record(surfaceRules.responseSemantics)).toEqual({
      loading: "host_request_state_not_surface_fact",
      empty: "authorized_zero_result_same_snapshot",
      failure: "safe_error_without_protected_state",
      permissionDenied: "omit_or_unavailable_without_object_existence",
      withdrawn: "typed_notice_preserves_history",
      corrected: "typed_notice_points_to_current_interpretation",
    });
    expect(strings(surfaceRules.projectionRules)).toEqual(
      expect.arrayContaining([
        "canonical_owner_query_before_projection",
        "role_specific_source_query",
        "current_authority_reread",
        "no_cross_role_super_dto",
        "no_other_institution_disclosure",
      ]),
    );

    const snapshotContract = record(surfaceRules.snapshotContract);
    expect(text(snapshotContract.initialRequiredContent)).toBe(
      "single_snapshot",
    );
    expect(strings(snapshotContract.cursorBindings)).toEqual([
      "contract_digest",
      "actor",
      "scope",
      "query",
      "sort",
      "snapshot",
      "expiry",
    ]);
    expect(strings(snapshotContract.driftOutcomes)).toEqual([
      "refresh",
      "rebase",
    ]);
    expect(text(snapshotContract.crossSnapshotAppend)).toBe("forbidden");
    expect(strings(surfaceRules.actionRules)).toContain(
      "write_boundary_none_requires_empty_actions",
    );
    expect(strings(surfaceRules.actionRules)).toContain(
      "surface_state_does_not_imply_capability_eligibility",
    );
  });

  it("excludes host layout and private identity/runtime shapes", () => {
    const source = [
      descriptorSchema,
      primitiveSchema,
      interfaceRefSchema,
      envelopeSchema,
      surfaceRegistry,
      visibilityMatrix,
      surfaceRules,
    ]
      .map((value) => JSON.stringify(value).toLowerCase())
      .join("\n");
    for (const forbidden of [
      "\"component\"",
      "\"props\"",
      "child_id",
      "family_id",
      "binding_anchor",
      "role_assignment",
      "prisma",
      "workflow_step",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("uses kebab-case for every new contract source path", () => {
    for (const name of collectRelativeNames(sourceRoot)) {
      expect(name).toMatch(
        /^(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*(?:\.schema)?\.json$/,
      );
    }
  });
});

function readJson(relativePath: string): JsonRecord {
  return record(
    JSON.parse(
      readFileSync(new URL(relativePath, sourceRoot), "utf8"),
    ) as unknown,
  );
}

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

function uniqueStrings(value: unknown): string[] {
  return [...new Set(strings(value))];
}

function enumValues(value: unknown): string[] {
  return strings(record(value).enum);
}

function keyedBy(
  values: readonly JsonRecord[],
  key: string,
): Map<string, JsonRecord> {
  return new Map(values.map((value) => [text(value[key]), value]));
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing ${label}`);
  return value;
}

function collectRelativeNames(root: URL): string[] {
  const rootPath = fileURLToPath(root);
  const names: string[] = [];
  visit(rootPath, "");
  return names.sort();

  function visit(directory: string, prefix: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        visit(path.join(directory, entry.name), relative);
      } else if (entry.isFile()) {
        names.push(relative);
      }
    }
  }
}

function collectRefs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectRefs);
  if (!value || typeof value !== "object") return [];
  const values: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (key === "$ref") values.push(text(child));
    else values.push(...collectRefs(child));
  }
  return values;
}
