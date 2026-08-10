import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { nurtureScenarioManifest, nurtureScenarioModule } from "../../src/index.js";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");

const readJson = <Value>(relativePath: string): Value =>
  JSON.parse(readFileSync(path.join(sourceRoot, relativePath), "utf8")) as Value;

const I2_A_KEYS = [
  "answer_institution_knowledge",
  "create_institution_knowledge_item",
  "create_institution_knowledge_revision",
  "publish_institution_knowledge_revision",
  "query_institution_knowledge_preview",
  "record_institution_knowledge_review",
  "revoke_institution_knowledge_revision",
] as const;

const LIFECYCLE_ACTION_KEYS = new Set<string>([
  "create_institution_knowledge_item",
  "create_institution_knowledge_revision",
  "publish_institution_knowledge_revision",
  "record_institution_knowledge_review",
  "revoke_institution_knowledge_revision",
]);

type Capability = {
  capabilityKey: string;
  capabilityVersion: string;
  executionClass: string;
  inputSchemaRef: string;
  resultSchemaRef: string;
  confirmationPolicy: string;
  supportedRoles: string[];
  presenterBindings: Array<{ surfaceKey: string; presenterKey: string }>;
  concurrencyPolicy: { headBindings: Array<{ headKey: string; mode: string }> };
  dependencyGates: Array<{ dependencyKey: string; requiredGate: string }>;
};

type SchemaEntry = {
  schemaRef: string;
  artifactPath: string;
  jsonPointer: string;
};

const capabilityRegistry = readJson<{
  contract: { key: string; version: string };
  capabilities: Capability[];
}>("capabilities/capability-registry.json");
const schemaRegistry = readJson<{ schemas: SchemaEntry[] }>(
  "interface/schema-registry.json",
);
const capabilities = capabilityRegistry.capabilities.filter((capability) =>
  capability.dependencyGates.some(
    (gate) => gate.dependencyKey === "t007_institution_knowledge_runtime",
  ),
);

const resolvePointer = (document: unknown, pointer: string): unknown =>
  pointer
    .split("/")
    .slice(1)
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, part) => {
      if (current === null || typeof current !== "object" || Array.isArray(current)) {
        throw new Error(`cannot resolve ${pointer}`);
      }
      return (current as Record<string, unknown>)[part];
    }, document);

const schemaFor = (schemaRef: string): unknown => {
  const binding = schemaRegistry.schemas.find((entry) => entry.schemaRef === schemaRef);
  if (!binding) throw new Error(`missing schema binding ${schemaRef}`);
  return resolvePointer(readJson<unknown>(binding.artifactPath), binding.jsonPointer);
};

describe("G4-E I2-A institution knowledge wire contract", () => {
  it("rotates one exact artifact with one preview query and six effectful actions", () => {
    expect(capabilityRegistry.contract).toEqual({
      key: "nurture.surface-contract",
      version: "1.20.0",
    });
    expect(capabilities.map((capability) => capability.capabilityKey).sort()).toEqual(
      [...I2_A_KEYS].sort(),
    );
    expect(capabilities.every((capability) => capability.capabilityVersion === "1.0.0"))
      .toBe(true);
  });

  it("keeps every descriptor behind one unqualified runtime gate and the completed I1 gate", () => {
    for (const capability of capabilities) {
      expect(capability.dependencyGates).toContainEqual({
        dependencyKey: "t007_institution_knowledge_i1",
        minimumVersion: "1.0.0",
        requiredGate: "contract_boundary",
      });
      expect(capability.dependencyGates).toContainEqual({
        dependencyKey: "t007_institution_knowledge_runtime",
        minimumVersion: "1.0.0",
        requiredGate: "owner_integration",
      });
    }
  });

  it("exposes knowledge only to the Institution Admin Workbench", () => {
    for (const capability of capabilities) {
      expect(capability.supportedRoles).toEqual(["institution_admin"]);
      expect(capability.presenterBindings).toEqual([
        {
          surfaceKey: "institution_workbench",
          presenterKey: "present_institution_workbench",
        },
      ]);
    }
  });

  it("binds private currentness in prepared heads instead of caller fields", () => {
    for (const capability of capabilities) {
      expect(capability.concurrencyPolicy.headBindings).toContainEqual(
        expect.objectContaining({
          headKey: "institution_scope",
          mode: "must_satisfy",
        }),
      );
      if (
        LIFECYCLE_ACTION_KEYS.has(capability.capabilityKey) &&
        capability.capabilityKey !== "create_institution_knowledge_item"
      ) {
        expect(capability.concurrencyPolicy.headBindings).toContainEqual({
          headKey: "knowledge_item_head",
          mode: "must_equal",
        });
      }
    }
  });

  it("keeps trusted scope, currentness, provenance snapshots and private facts out of inputs", () => {
    const schemas = capabilities.map((capability) => schemaFor(capability.inputSchemaRef));
    const serialized = JSON.stringify(schemas);
    for (const forbidden of [
      "workspace_id",
      "workspaceId",
      "institution_ref",
      "institutionRef",
      "role_assignment_ref",
      "roleAssignmentRef",
      "expected_item_head",
      "expectedItemHead",
      "authority_source_ref",
      "authoritySourceRef",
      "source_version",
      "sourceVersion",
      "snapshot_hash",
      "snapshotHash",
      "publisher",
      "deep_link",
      "deepLink",
      "child_id",
      "childId",
      "family_id",
      "familyId",
      "deadline",
      "blocker",
    ]) {
      expect(serialized, `public inputs must not expose ${forbidden}`).not.toContain(forbidden);
    }
    expect(serialized).toContain("authoritySourceOptionRefs");
  });

  it("closes public answer and preview schemas to the exact I1 result families", () => {
    const querySchema = readJson<{
      $defs: Record<string, Record<string, unknown>>;
    }>("capabilities/contracts/institution-knowledge-operations.schema.json");
    const answerInput = querySchema.$defs.answerInput as {
      additionalProperties: boolean;
      properties: Record<string, unknown>;
    };
    const previewInput = querySchema.$defs.previewInput as {
      additionalProperties: boolean;
      properties: { revisionOptionRefs: { minItems: number; maxItems: number } };
    };
    expect(answerInput.additionalProperties).toBe(false);
    expect(Object.keys(answerInput.properties).sort()).toEqual([
      "ageBandKeys",
      "question",
      "scenarioKeys",
    ]);
    expect(previewInput.additionalProperties).toBe(false);
    expect(previewInput.properties.revisionOptionRefs).toMatchObject({
      minItems: 1,
      maxItems: 8,
    });
    expect(Object.keys(querySchema.$defs).sort()).toEqual([
      "answerInput",
      "answerResult",
      "answeredResult",
      "conflictAbstentionResult",
      "emptyAbstentionResult",
      "previewInput",
      "previewResult",
      "safetyAbstentionResult",
    ]);
  });

  it("closes the shared action result to the five public lifecycle actions only", () => {
    const types = readJson<{
      $defs: { actionEffect: { enum: string[] } };
    }>("capabilities/contracts/institution-knowledge-types.schema.json");
    const actionKeys = I2_A_KEYS.filter((key) => LIFECYCLE_ACTION_KEYS.has(key)).sort();
    expect([...types.$defs.actionEffect.enum].sort()).toEqual(actionKeys);
    expect(JSON.stringify(types)).not.toContain(
      "record_institution_knowledge_conflict_candidate",
    );
  });

  it("does not publish indexing, candidate, copy or export capabilities", () => {
    const keys = capabilities.map((capability) => capability.capabilityKey).join("|");
    for (const forbidden of ["index", "candidate", "copy", "export", "ingestion"] as const) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("admits only the E6 disabled internal composition and no formal caller", () => {
    expect(
      Object.keys(nurtureScenarioModule.internal_api_handlers).filter((key) =>
        key.includes("institution_knowledge"),
      ),
    ).toEqual([
      "nurture.internal.query_institution_knowledge",
      "nurture.internal.execute_institution_knowledge",
    ]);
    expect(
      nurtureScenarioManifest.surface_mapping.web_run_workbench.institution_knowledge,
    ).toMatchObject({
      contract_version: "1.0.0",
      enablement_policy: "disabled",
    });
    expect(nurtureScenarioManifest.surface_mapping.chat_workflow_control)
      .not.toHaveProperty("institution_knowledge");
    expect(nurtureScenarioManifest.surface_mapping.mobile_dashboard)
      .not.toHaveProperty("institution_knowledge");
    expect(
      nurtureScenarioManifest.internal_api.routes.map((route) => route.handler_key),
    ).not.toContain("nurture.internal.query_institution_knowledge");
    expect(
      nurtureScenarioManifest.internal_api.routes.map((route) => route.handler_key),
    ).not.toContain("nurture.internal.execute_institution_knowledge");
  });
});
