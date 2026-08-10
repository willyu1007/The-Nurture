import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * G4-0C-4 conformance for `query_institution_communication_review`.
 *
 * 0C is a freeze stage, so this asserts contract-level properties only: the
 * descriptor, the schema and the wiring. There is no handler yet, and a test
 * that pretended otherwise would be claiming implementation evidence the I1
 * gate has not opened.
 *
 * The properties below are the ones a later implementation could silently
 * violate while still producing a green build — an added action, a widened
 * role, a leaked child identity, a re-derived scope.
 */

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");
const readJson = (relativePath: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(sourceRoot, relativePath), "utf8")) as Record<
    string,
    unknown
  >;

const CAPABILITY_KEY = "query_institution_communication_review";

type Capability = {
  capabilityKey: string;
  capabilityVersion: string;
  executionClass: string;
  deliveryClass: string;
  confirmationPolicy: string;
  supportedRoles: string[];
  inputSchemaRef: string;
  resultSchemaRef: string;
  eligibilityPolicyRef: { key: string; version: string };
  presenterBindings: Array<{ surfaceKey: string; presenterKey: string }>;
  concurrencyPolicy: { headBindings: Array<{ headKey: string }> };
};

const capabilityRegistry = readJson("capabilities/capability-registry.json") as {
  contract: { key: string; version: string };
  capabilities: Capability[];
};
const capability = capabilityRegistry.capabilities.find(
  (entry) => entry.capabilityKey === CAPABILITY_KEY,
);

describe("G4-0C-4 institution communication review capability", () => {
  it("is registered at the rotated contract version", () => {
    expect(capabilityRegistry.contract.version).toBe("1.20.0");
    expect(capability).toBeDefined();
    expect(capability?.capabilityVersion).toBe("1.0.0");
  });

  it("is a read model with no delivery and no confirmation", () => {
    expect(capability?.executionClass).toBe("query");
    expect(capability?.deliveryClass).toBe("none");
    expect(capability?.confirmationPolicy).toBe("none");
  });

  it("admits institution_admin and nothing else", () => {
    // A widened role here is the single change that would turn an Admin
    // owner-read into a caregiver- or guardian-reachable surface.
    expect(capability?.supportedRoles).toEqual(["institution_admin"]);
  });

  it("binds institution scope and source visibility as must-satisfy heads", () => {
    const heads = (capability?.concurrencyPolicy.headBindings ?? []).map(
      (binding) => binding.headKey,
    );
    expect(heads).toEqual(["institution_scope", "source_visibility"]);
  });

  it("presents only through the institution workbench", () => {
    expect(capability?.presenterBindings).toEqual([
      { surfaceKey: "institution_workbench", presenterKey: "present_institution_workbench" },
    ]);
  });

  it("resolves its eligibility policy to a declared repository pair", () => {
    const portRegistry = readJson("interface/port-registry.json") as {
      repositories: Array<{ key: string; requiredGate: string }>;
      policies: Array<{ key: string; repositoryRefs: Array<{ key: string }> }>;
    };
    const policy = portRegistry.policies.find(
      (entry) => entry.key === capability?.eligibilityPolicyRef.key,
    );
    expect(policy).toBeDefined();
    const refs = (policy?.repositoryRefs ?? []).map((ref) => ref.key);
    expect(refs).toEqual([
      "binding_owner_repository",
      "institution_communication_repository",
    ]);
    // The reader is owner-integration gated: a contract-boundary gate would
    // let a synthetic double stand in for the real owner path.
    const repository = portRegistry.repositories.find(
      (entry) => entry.key === "institution_communication_repository",
    );
    expect(repository?.requiredGate).toBe("owner_integration");
  });

  it("resolves both schema refs to the frozen artifact", () => {
    const schemaRegistry = readJson("interface/schema-registry.json") as {
      schemas: Array<{ schemaRef: string; artifactPath: string; jsonPointer: string }>;
    };
    for (const [ref, pointer] of [
      [capability?.inputSchemaRef, "/$defs/input"],
      [capability?.resultSchemaRef, "/$defs/result"],
    ] as const) {
      const entry = schemaRegistry.schemas.find((schema) => schema.schemaRef === ref);
      expect(entry).toBeDefined();
      expect(entry?.artifactPath).toBe(
        "capabilities/contracts/query-institution-communication-review.schema.json",
      );
      expect(entry?.jsonPointer).toBe(pointer);
    }
  });
});

describe("G4-0C-4 result shape", () => {
  const schema = readJson(
    "capabilities/contracts/query-institution-communication-review.schema.json",
  ) as { $defs: Record<string, Record<string, unknown>> };
  const item = schema.$defs.communicationItem as {
    required: string[];
    properties: Record<string, Record<string, unknown>>;
    additionalProperties: boolean;
  };

  it("freezes actions as permanently empty", () => {
    // T-005 G2-B ships this projection with action_authority: none. The
    // promotion to a public capability must not quietly acquire one.
    expect(item.properties.actions).toEqual({ maxItems: 0, items: false, type: "array" });
    expect(item.required).toContain("actions");
  });

  it("keeps the body optional so a redacted message has no content", () => {
    expect(item.required).not.toContain("content");
    expect(item.properties.content).toBeDefined();
  });

  it("carries the disclosure and purpose constants the owner-read asserts", () => {
    const scope = schema.$defs.businessScope as {
      properties: Record<string, { const?: string; enum?: string[] }>;
    };
    expect(scope.properties.adminSupervision.const).toBe("pre_send_disclosed");
    expect(scope.properties.purpose.const).toBe("family_care_workflow");
    expect(scope.properties.dataClass.enum).toEqual([
      "family_care_question",
      "direct_care_communication",
    ]);
  });

  it("exposes no child, family or platform identity", () => {
    const serialized = JSON.stringify(schema);
    for (const forbidden of ["childId", "child_id", "familyId", "family_id", "myChatUserId"]) {
      expect(serialized).not.toContain(forbidden);
    }
    // Scope is echoed as opaque refs, never as ids the caller could reuse.
    const scope = schema.$defs.businessScope as { properties: Record<string, unknown> };
    expect(Object.keys(scope.properties).sort()).toEqual([
      "adminSupervision",
      "careGroupRef",
      "dataClass",
      "direction",
      "enrollmentRef",
      "institutionRef",
      "purpose",
    ]);
  });

  it("rejects unknown members everywhere it defines an object", () => {
    for (const [name, definition] of Object.entries(schema.$defs)) {
      if (definition.type !== "object") continue;
      expect(definition.additionalProperties, `${name} must be closed`).toBe(false);
    }
  });
});
