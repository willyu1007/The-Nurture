import { describe, expect, it, vi } from "vitest";
import type { WorkflowRuntimePort } from "@my-chat/workflow-contracts";
import { defaultNurtureDeps, defaultPresenterDeps } from "../../src/deps.js";
import {
  admitNurtureInstitutionKnowledgeOwnerIntegration,
  NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN,
  NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN,
  type NurtureInstitutionKnowledgeOwnerIntegration,
} from "../../src/institution-knowledge-owner-integration.js";
import {
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
} from "../../src/domain/institution/institution-knowledge-answer-safety.js";
import {
  defaultNurtureInstitutionKnowledgeSurfaceDeps,
  type NurtureInstitutionKnowledgeSurfaceDeps,
} from "../../src/institution-knowledge-surfaces.js";
import { createNurtureScenarioModule } from "../../src/module.js";
import { nurtureScenarioManifest } from "../../src/registry.js";

const queryRequest = {
  capabilityKey: "query_institution_knowledge_preview",
  capabilityVersion: "1.0.0",
  targetOptionRef: "option-institution",
  operationInput: { revisionOptionRefs: ["option-revision-01"] },
};

const meta = {
  workspace_id: "workspace-01",
  actor_id: "participant-01",
  idempotency_key: "command-01",
  correlation_id: "invocation-01",
  client_surface: "web_run_workbench" as const,
};

describe("G4-E E7 exact owner integration admission", () => {
  it("binds exact Q2/Q3 owner deps only to the existing internal handler", async () => {
    const resolve = vi.fn(async () => ({
      status: "denied" as const,
      reason_code: "sentinel_owner_binding_denied",
    }));
    const surfaceDeps: NurtureInstitutionKnowledgeSurfaceDeps = {
      ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
      bindings: { resolve },
      answerPolicy: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
    };
    const module = createNurtureScenarioModule({
      handlerDeps: defaultNurtureDeps,
      presenterDeps: defaultPresenterDeps,
      workerRuntime: {} as WorkflowRuntimePort,
      institutionKnowledgeOwnerIntegration: integration(surfaceDeps),
    });

    await expect(module.internal_api_handlers[
      "nurture.internal.query_institution_knowledge"
    ]?.({ method: "POST", path: "/synthetic", payload: queryRequest, meta }))
      .resolves.toEqual({
        status: "denied",
        reason_code: "sentinel_owner_binding_denied",
      });
    expect(resolve).toHaveBeenCalledOnce();
    expect(
      nurtureScenarioManifest.internal_api.routes.map((route) => route.handler_key),
    ).not.toContain("nurture.internal.query_institution_knowledge");
    expect(
      nurtureScenarioManifest.internal_api.routes.map((route) => route.handler_key),
    ).not.toContain("nurture.internal.execute_institution_knowledge");
    expect(
      (nurtureScenarioManifest.surface_mapping.web_run_workbench
        .institution_knowledge as { enablement_policy: string }).enablement_policy,
    ).toBe("disabled");
  });

  it("fails closed when the integration or required dependency shape is absent", () => {
    expect(admitNurtureInstitutionKnowledgeOwnerIntegration(undefined)).toBe(
      defaultNurtureInstitutionKnowledgeSurfaceDeps,
    );
    expect(admitNurtureInstitutionKnowledgeOwnerIntegration({
      ...integration(defaultNurtureInstitutionKnowledgeSurfaceDeps),
      surface_deps: {} as NurtureInstitutionKnowledgeSurfaceDeps,
    })).toBe(defaultNurtureInstitutionKnowledgeSurfaceDeps);
  });

  it("fails closed for every Q2 or Q3 tuple leaf drift and for extra fields", () => {
    for (const [pinKey, expected] of [
      ["q2_owner_pin", NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN],
      [
        "q3_adapter_qualification_pin",
        NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN,
      ],
    ] as const) {
      for (const path of leafPaths(expected)) {
        const candidate = integration(admittedSurfaceDeps());
        const drifted = clone(candidate[pinKey]) as Record<string, unknown>;
        driftLeaf(drifted, path);
        const result = admitNurtureInstitutionKnowledgeOwnerIntegration({
          ...candidate,
          [pinKey]: drifted,
        });
        expect(result, `${pinKey}.${path.join(".")} must fail closed`).toBe(
          defaultNurtureInstitutionKnowledgeSurfaceDeps,
        );
      }

      const candidate = integration(admittedSurfaceDeps());
      expect(admitNurtureInstitutionKnowledgeOwnerIntegration({
        ...candidate,
        [pinKey]: { ...(candidate[pinKey] as object), compatibility_alias: "forbidden" },
      })).toBe(defaultNurtureInstitutionKnowledgeSurfaceDeps);
    }
  });

  it("fails closed when the external tuple is exact but the injected owner pin drifts", () => {
    const candidate = integration(admittedSurfaceDeps());
    const ownerPin = clone(
      INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
    ) as unknown as Record<string, string>;
    ownerPin.model_version = "moving-latest";

    expect(admitNurtureInstitutionKnowledgeOwnerIntegration({
      ...candidate,
      surface_deps: {
        ...candidate.surface_deps,
        safetyOwner: {
          ...candidate.surface_deps.safetyOwner,
          service_pin: ownerPin as unknown as
            typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
        },
      },
    })).toBe(defaultNurtureInstitutionKnowledgeSurfaceDeps);
  });

  it("fails closed when the answer policy is not the sole decision-rule pin", () => {
    const candidate = integration(admittedSurfaceDeps());
    expect(admitNurtureInstitutionKnowledgeOwnerIntegration({
      ...candidate,
      surface_deps: {
        ...candidate.surface_deps,
        answerPolicy: {
          ...INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
          rule_version: "1.0.1",
        },
      },
    })).toBe(defaultNurtureInstitutionKnowledgeSurfaceDeps);
  });
});

function integration(
  surfaceDeps: NurtureInstitutionKnowledgeSurfaceDeps,
): NurtureInstitutionKnowledgeOwnerIntegration {
  return {
    q2_owner_pin: clone(NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN),
    q3_adapter_qualification_pin: clone(
      NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN,
    ),
    surface_deps: surfaceDeps,
  };
}

function admittedSurfaceDeps(): NurtureInstitutionKnowledgeSurfaceDeps {
  return {
    ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
    answerPolicy: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
  };
}

function clone<Value>(value: Value): Value {
  return JSON.parse(JSON.stringify(value)) as Value;
}

function leafPaths(value: unknown, prefix: string[] = []): string[][] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, [...prefix, key]));
}

function driftLeaf(target: Record<string, unknown>, path: string[]): void {
  let owner = target;
  for (const key of path.slice(0, -1)) {
    owner = owner[key] as Record<string, unknown>;
  }
  const key = path.at(-1)!;
  const current = owner[key];
  owner[key] = typeof current === "boolean" ? !current
    : typeof current === "number" ? current + 1
    : `${String(current)}-drift`;
}
