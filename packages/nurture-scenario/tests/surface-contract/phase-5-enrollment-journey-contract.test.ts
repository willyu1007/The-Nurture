import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS,
  nurtureScenarioManifest,
  nurtureScenarioModule,
} from "../../src/index.js";
import {
  NURTURE_ENROLLMENT_JOURNEY_QUERY_KEYS,
  defaultNurtureEnrollmentJourneySurfaceDeps,
} from "../../src/enrollment-journey-surfaces.js";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const sourceRoot = path.join(packageRoot, "contracts/surfaces/v1/source");

const readJson = <Value>(relativePath: string): Value =>
  JSON.parse(readFileSync(path.join(sourceRoot, relativePath), "utf8")) as Value;

const I2_A_KEYS = [
  "accept_trial_offer",
  "cancel_trial_preparation",
  "close_inquiry",
  "confirm_intent_conversation",
  "confirm_native_touchpoint_note",
  "decline_or_expire_trial_offer",
  "end_trial",
  "extend_trial",
  "formalize_enrollment",
  "issue_trial_offer",
  "mark_trial_review_reached",
  "override_waitlist_category",
  "prepare_trial_relationship",
  "propose_formal_enrollment",
  "qualify_capacity_waitlist",
  "query_guardian_enrollment_waitlist",
  "query_institution_capacity_waitlist",
  "query_institution_enrollment_journey",
  "record_external_touchpoint",
  "record_or_skip_visit",
  "review_waitlist_interest",
  "start_enrollment_inquiry",
  "start_trial",
  "withdraw_from_waitlist",
] as const;

const QUERY_KEYS = new Set<string>([
  "query_guardian_enrollment_waitlist",
  "query_institution_capacity_waitlist",
  "query_institution_enrollment_journey",
]);
const GUARDIAN_ACTION_KEYS = new Set<string>([
  "accept_trial_offer",
  "formalize_enrollment",
  "withdraw_from_waitlist",
]);
const MIXED_ACTION_KEYS = new Set<string>([
  "cancel_trial_preparation",
  "decline_or_expire_trial_offer",
  "review_waitlist_interest",
]);

type HeadBinding = {
  headKey: string;
  mode: string;
};

type Capability = {
  capabilityKey: string;
  capabilityVersion: string;
  executionClass: string;
  inputSchemaRef: string;
  resultSchemaRef: string;
  confirmationPolicy: string;
  supportedRoles: string[];
  presenterBindings: Array<{ surfaceKey: string; presenterKey: string }>;
  concurrencyPolicy: { headBindings: HeadBinding[] };
  dependencyGates: Array<{ dependencyKey: string; requiredGate: string }>;
  eligibilityPolicyRef: { key: string; version: string };
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
    (gate) => gate.dependencyKey === "t007_enrollment_journey_runtime",
  ),
);

const resolvePointer = (document: unknown, pointer: string): unknown => {
  if (pointer === "") return document;
  return pointer
    .split("/")
    .slice(1)
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, part) => {
      if (current === null || typeof current !== "object" || Array.isArray(current)) {
        throw new Error(`cannot resolve ${pointer}`);
      }
      return (current as Record<string, unknown>)[part];
    }, document);
};

const schemaFor = (schemaRef: string): unknown => {
  const binding = schemaRegistry.schemas.find((entry) => entry.schemaRef === schemaRef);
  if (!binding) throw new Error(`missing schema binding ${schemaRef}`);
  return resolvePointer(readJson<unknown>(binding.artifactPath), binding.jsonPointer);
};

describe("G4-D I2-A enrollment journey wire contract", () => {
  it("rotates one exact contract with the complete I1 query and command inventory", () => {
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

  it("keeps every I2-A capability behind the unqualified runtime owner gate", () => {
    for (const capability of capabilities) {
      expect(capability.dependencyGates).toContainEqual({
        dependencyKey: "t007_enrollment_journey_runtime",
        minimumVersion: "1.0.0",
        requiredGate: "owner_integration",
      });
      expect(capability.dependencyGates).toContainEqual({
        dependencyKey: "t007_enrollment_journey_i1",
        minimumVersion: "1.0.0",
        requiredGate: "contract_boundary",
      });
    }
  });

  it("keeps institution mobile read-only and exposes institution actions only in Workbench", () => {
    for (const capability of capabilities) {
      const surfaces = capability.presenterBindings.map((binding) => binding.surfaceKey);
      if (capability.supportedRoles.includes("institution_admin")) {
        if (capability.executionClass === "query") {
          expect(surfaces).toContain("institution_board");
        } else {
          expect(surfaces).not.toContain("institution_board");
          expect(surfaces).toContain("institution_workbench");
        }
      }
      expect(surfaces).not.toContain("caregiver_nurture_chat");
      expect(surfaces).not.toContain("caregiver_teacher_board");
    }
  });

  it("offers Guardians only their waitlist and formalization operations", () => {
    const guardianActions = capabilities
      .filter(
        (capability) =>
          capability.executionClass !== "query" &&
          capability.supportedRoles.includes("guardian"),
      )
      .map((capability) => capability.capabilityKey)
      .sort();
    expect(guardianActions).toEqual(
      [...GUARDIAN_ACTION_KEYS, ...MIXED_ACTION_KEYS].sort(),
    );
  });

  it("keeps trusted scope, owner evidence and private heads out of public inputs", () => {
    const forbidden = [
      "workspace_id",
      "workspaceId",
      "role_assignment_ref",
      "roleAssignmentRef",
      "owner_snapshot",
      "ownerSnapshot",
      "owner_evidence",
      "ownerEvidence",
      "workflow_ref",
      "workflowRef",
      "expected_workflow_head",
      "expectedWorkflowHead",
      "currentStage",
      "waitingState",
      "pendingTransition",
      "lifecycle",
      "prisma",
    ];
    for (const capability of capabilities.filter(
      (entry) => !QUERY_KEYS.has(entry.capabilityKey),
    )) {
      const serialized = JSON.stringify(schemaFor(capability.inputSchemaRef));
      for (const field of forbidden) {
        expect(serialized, `${capability.capabilityKey} must not expose ${field}`).not.toContain(
          field,
        );
      }
    }
  });

  it("keeps Guardian waitlist output family-safe and rank-free", () => {
    const capability = capabilities.find(
      (entry) => entry.capabilityKey === "query_guardian_enrollment_waitlist",
    );
    expect(capability).toBeDefined();
    const serialized = JSON.stringify(schemaFor(capability?.resultSchemaRef ?? ""));
    for (const forbidden of [
      "entryRef",
      "entryHead",
      "workflowRef",
      "rank",
      "position",
      "orderedEntries",
      "policyRef",
      "categoryKey",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("binds action concurrency to private prepared heads instead of caller fields", () => {
    for (const capability of capabilities.filter(
      (entry) => !QUERY_KEYS.has(entry.capabilityKey),
    )) {
      expect(capability.concurrencyPolicy.headBindings.length).toBeGreaterThan(0);
      if (capability.capabilityKey !== "start_enrollment_inquiry") {
        expect(
          capability.concurrencyPolicy.headBindings.some(
            (binding) => binding.headKey === "workflow_head",
          ),
        ).toBe(true);
      }
    }
  });

  it("closes the shared action result to the exact I1 command set", () => {
    const types = readJson<{
      $defs: { actionEffect: { enum: string[] } };
    }>("capabilities/contracts/enrollment-journey-types.schema.json");
    const actionKeys = I2_A_KEYS.filter((key) => !QUERY_KEYS.has(key)).sort();
    expect([...types.$defs.actionEffect.enum].sort()).toEqual(actionKeys);
  });

  it("registers only the I2-B fail-closed surface composition, not a legacy Workflow capability", () => {
    for (const surface of [
      "chat_workflow_control",
      "web_run_workbench",
      "mobile_dashboard",
    ] as const) {
      expect(nurtureScenarioManifest.surface_mapping[surface]?.enrollment_journey)
        .toEqual({
          workflow_type: "EnrollmentJourneyWorkflowV1",
          contract_version: "1.0.0",
          query_handler_key: "nurture.internal.query_enrollment_journey",
          command_handler_key: "nurture.internal.execute_enrollment_journey",
          enablement_policy: "disabled",
        });
    }
    expect(
      nurtureScenarioManifest.capabilities.some((capability) =>
        JSON.stringify(capability).includes("EnrollmentJourneyWorkflowV1"),
      ),
    ).toBe(false);
    expect(nurtureScenarioModule.internal_api_handlers).toHaveProperty(
      "nurture.internal.query_enrollment_journey",
    );
    expect(nurtureScenarioModule.internal_api_handlers).toHaveProperty(
      "nurture.internal.execute_enrollment_journey",
    );
    expect([
      ...NURTURE_ENROLLMENT_JOURNEY_QUERY_KEYS,
      ...NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS,
    ].sort()).toEqual([...I2_A_KEYS].sort());
    expect(Object.isFrozen(defaultNurtureEnrollmentJourneySurfaceDeps)).toBe(true);
  });
});
