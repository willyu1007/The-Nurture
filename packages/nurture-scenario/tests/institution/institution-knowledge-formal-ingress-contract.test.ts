import { describe, expect, it } from "vitest";
import {
  NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1,
  parseNurtureInstitutionKnowledgeFormalExecuteInputV1,
  parseNurtureInstitutionKnowledgeFormalPrepareInputV1,
  parseNurtureInstitutionKnowledgeFormalQueryInputV1,
} from "../../src/institution-knowledge-formal-ingress-contract.js";
import { nurtureScenarioManifest } from "../../src/registry.js";

describe("Institution Knowledge formal ingress contract freeze", () => {
  it("freezes one host transition and one non-caller-supplied client surface", () => {
    expect(NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1).toMatchObject({
      contract_version: 1,
      principal_origin: "interactive_session",
      client_surface: "web_run_workbench",
      ingress_category: "host_transition",
      idempotency: "owner_command_request_id_replayed_with_exact_confirmation",
      confirmation: "owner_held_frozen_payload",
    });
    expect(Object.isFrozen(NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1)).toBe(true);
  });

  it("accepts only the read-only preview capability on the query lane", () => {
    expect(parseNurtureInstitutionKnowledgeFormalQueryInputV1({
      contractVersion: 1,
      request: {
        capabilityKey: "query_institution_knowledge_preview",
        capabilityVersion: "1.0.0",
        targetOptionRef: "institution-option-01",
        operationInput: { revisionOptionRefs: ["revision-option-01"] },
      },
    })).not.toBeNull();
    expect(parseNurtureInstitutionKnowledgeFormalQueryInputV1({
      contractVersion: 1,
      request: commandIntent(),
    })).toBeNull();
  });

  it("freezes the complete declaration tuple for every lane", () => {
    expect(NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.query).toEqual({
      endpoint_key: "nurture.institution_knowledge.query",
      method: "POST",
      operation_key: "query_institution_knowledge",
      input_schema_key: "nurture.institution_knowledge.query.input",
      input_schema_version: 1,
      handler_key: "nurture.institution_knowledge.query.formal.v1",
      ingress_key: "nurture.institution_knowledge.query",
    });
    expect(NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.prepare.handler_key)
      .toBe("nurture.institution_knowledge.command.prepare.formal.v1");
    expect(NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.execute.handler_key)
      .toBe("nurture.institution_knowledge.command.execute.formal.v1");
    const operations = nurtureScenarioManifest.scenario_contracts
      ?.trusted_invocation.operations ?? [];
    for (const lane of ["query", "prepare", "execute"] as const) {
      const contract = NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1[lane];
      expect(operations.find(({ handler_key }) => handler_key === contract.handler_key))
        .toEqual({
          endpoint_key: contract.endpoint_key,
          method: contract.method,
          operation_key: contract.operation_key,
          input_schema_key: contract.input_schema_key,
          input_schema_version: contract.input_schema_version,
          handler_key: contract.handler_key,
          ingress: [{
            ingress_category: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.ingress_category,
            ingress_key: contract.ingress_key,
            principal_origins: [
              NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.principal_origin,
            ],
          }],
        });
    }
  });

  it("prepares typed intent without accepting a caller confirmation or authority", () => {
    expect(parseNurtureInstitutionKnowledgeFormalPrepareInputV1({
      contractVersion: 1,
      clientCommandId: "client-command-01",
      request: commandIntent(),
    })).toEqual({
      contractVersion: 1,
      clientCommandId: "client-command-01",
      request: commandIntent(),
    });
    for (const injected of [
      { confirmationRef: "caller-confirmation-ref-01" },
      { clientSurface: "mobile_dashboard" },
      { participantRef: "participant-caller-01" },
      { roleAssignmentRef: "role-caller-01" },
    ]) {
      expect(parseNurtureInstitutionKnowledgeFormalPrepareInputV1({
        contractVersion: 1,
        clientCommandId: "client-command-01",
        request: { ...commandIntent(), ...injected },
      })).toBeNull();
    }
  });

  it("executes only the owner-issued command and confirmation pair", () => {
    const exact = {
      contractVersion: 1,
      commandRequestId: "command-request-01",
      confirmationRef: "owner-confirmation-ref-01",
    };
    expect(parseNurtureInstitutionKnowledgeFormalExecuteInputV1(exact)).toEqual(exact);
    for (const injected of [
      { targetOptionRef: "revision-option-01" },
      { operationInput: {} },
      { clientSurface: "web_run_workbench" },
      { participantRef: "participant-caller-01" },
      { institutionRef: "institution-caller-01" },
    ]) {
      expect(parseNurtureInstitutionKnowledgeFormalExecuteInputV1({
        ...exact,
        ...injected,
      })).toBeNull();
    }
  });
});

function commandIntent() {
  return {
    capabilityKey: "publish_institution_knowledge_revision" as const,
    capabilityVersion: "1.0.0" as const,
    targetOptionRef: "revision-option-01",
    operationInput: {},
  };
}
