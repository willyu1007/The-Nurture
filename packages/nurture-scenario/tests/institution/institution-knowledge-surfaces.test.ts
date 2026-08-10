import { describe, expect, it, vi } from "vitest";
import {
  defaultNurtureInstitutionKnowledgeSurfaceDeps,
  NurtureInstitutionKnowledgeSurfaceHandler,
  parseNurtureInstitutionKnowledgeAdapterRequest,
  presentInstitutionKnowledgeAnswer,
  type NurtureInstitutionKnowledgeAdapterRequest,
  type NurtureInstitutionKnowledgePreparedBindingV1,
  type NurtureInstitutionKnowledgeSurfaceCapabilityKey,
  type NurtureInstitutionKnowledgeSurfaceDeps,
  type NurtureInstitutionKnowledgeTrustedContextV1,
} from "../../src/institution-knowledge-surfaces.js";
import { nurtureScenarioManifest, nurtureScenarioModule } from "../../src/index.js";

const now = "2026-08-10T12:00:00.000Z";
const canonicalRef = (
  namespace: "nurture" | "my_chat",
  objectType: string,
  objectId: string,
) => ({
  schema_version: 1 as const,
  namespace,
  object_type: objectType,
  object_id: objectId,
  version: 1,
});

const trusted = (
  clientSurface: NurtureInstitutionKnowledgeTrustedContextV1["client_surface"] =
    "web_run_workbench",
): NurtureInstitutionKnowledgeTrustedContextV1 => ({
  workspace_id: "workspace-01",
  actor_participant_ref: "participant-01",
  invocation_request_id: "invocation-01",
  command_request_id: "command-01",
  client_surface: clientSurface,
});

const authoritySnapshot = {
  authority_source_ref: canonicalRef("my_chat", "knowledge_source", "source-01"),
  source_version: "2026.08.10",
  publisher: "Health authority",
  title: "Safe care",
  source_date: "2026-08-01",
  deep_link: "https://authority.example/source",
  excerpt: "Bounded authority excerpt.",
  verified_at: now,
  snapshot_hash: "1".repeat(64),
};

const binding = (
  capabilityKey: NurtureInstitutionKnowledgeSurfaceCapabilityKey,
  targetOptionRef = "option-institution",
): NurtureInstitutionKnowledgePreparedBindingV1 => ({
  capability_key: capabilityKey,
  target_option_ref: targetOptionRef,
  ...(capabilityKey === "query_institution_knowledge_preview"
    ? {}
    : { confirmation_ref: "confirmation-01" }),
  workspace_id: "workspace-01",
  actor_participant_ref: "participant-01",
  surface_key: "institution_workbench",
  active_role: "institution_admin",
  institution_ref: "institution-01",
  role_assignment_ref: "role-admin-01",
  evaluated_at: now,
  item_ref: "item-01",
  revision_ref: "revision-01",
  expected_item_head: 2,
  authority_links: [],
});

const body = {
  title: "Safe pickup",
  summary: "How the Institution handles pickup.",
  sections: [{
    sectionKey: "pickup",
    heading: "Pickup",
    body: "Verify the authorized pickup contact.",
  }],
};

const operationInputs = {
  create_institution_knowledge_item: {
    category: "institution_policy" as const,
    body,
    intendedAudiences: ["institution_admin"] as const,
    safetyClass: "general_guidance" as const,
    authoritySourceOptionRefs: ["option-authority-01"],
  },
  create_institution_knowledge_revision: {
    body,
    intendedAudiences: ["institution_admin"] as const,
    safetyClass: "general_guidance" as const,
    validFrom: "2026-08-10T00:00:00.000Z",
    validUntil: "2026-08-11T00:00:00.000Z",
    authoritySourceOptionRefs: ["option-authority-01"],
  },
  record_institution_knowledge_review: {
    decision: "reviewed" as const,
    reasonKey: "review_complete",
  },
  publish_institution_knowledge_revision: {},
  revoke_institution_knowledge_revision: { reasonKey: "superseded" },
};

const request = <
  Key extends keyof typeof operationInputs,
>(capabilityKey: Key): NurtureInstitutionKnowledgeAdapterRequest<Key> => ({
  capabilityKey,
  capabilityVersion: "1.0.0",
  targetOptionRef: "option-institution",
  confirmationRef: "confirmation-01",
  operationInput: operationInputs[capabilityKey],
}) as NurtureInstitutionKnowledgeAdapterRequest<Key>;

const deps = (
  overrides: Partial<NurtureInstitutionKnowledgeSurfaceDeps> = {},
): NurtureInstitutionKnowledgeSurfaceDeps => ({
  ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
  bindings: {
    resolve: async ({ request: value }) => {
      const prepared = binding(value.capabilityKey, value.targetOptionRef);
      const sourceRefs = value.capabilityKey === "create_institution_knowledge_item" ||
        value.capabilityKey === "create_institution_knowledge_revision"
        ? value.operationInput.authoritySourceOptionRefs ?? []
        : [];
      return {
        status: "resolved" as const,
        binding: {
          ...prepared,
          authority_links: sourceRefs.map((optionRef) => ({
            option_ref: optionRef,
            snapshot: authoritySnapshot,
          })),
        },
      };
    },
  },
  commands: {
    execute: async ({ capability_key }) => ({
      status: "committed" as const,
      disposition: "executed" as const,
      result: {
        item_ref: capability_key === "create_institution_knowledge_item" ? "item-new" : "item-01",
        revision_ref:
          capability_key === "create_institution_knowledge_item" ||
          capability_key === "create_institution_knowledge_revision"
            ? "revision-new"
            : "revision-01",
        item_head: 3,
        revision_number: 2,
        revision_state: "draft" as const,
        committed_at: now,
      },
    }),
  },
  preview: {
    preview: async ({ request: value }) => ({
      status: "resolved" as const,
      options: [{
        revision_option_ref: (value as { revision_option_refs: string[] }).revision_option_refs[0]!,
        source_ref: canonicalRef("nurture", "institution_knowledge_revision", "revision-01"),
        source_version: "2",
        revision_number: 2,
        state: "draft" as const,
        body,
        warnings: ["draft" as const],
      }],
    }),
  },
  protectedContent: {
    seal: () => ({
      algVersion: 1,
      keyRef: "key-01",
      ciphertext: "Y2lwaGVydGV4dA",
      integrityTag: "dGFn",
    }),
  },
  adminAuthority: { authorize: async () => "authorized" as const },
  retrievalOwner: {
    retrieveCandidates: async () => ({ status: "resolved" as const, candidates: [] }),
  },
  optionIssuer: {
    issue: ({ kind, target_ref, version }) =>
      `option:${kind}:${target_ref}:${version ?? "current"}`,
  },
  answerPolicy: {
    answer_policy_version: "1.0.0",
    rule_set_ref: "institution-knowledge-safety",
    rule_version: "1.0.0",
  },
  ...overrides,
});

describe("G4-E I2-B Institution Knowledge Surface adapters", () => {
  it("validates exact public shapes before resolving trusted owner data", async () => {
    const resolve = vi.fn(defaultNurtureInstitutionKnowledgeSurfaceDeps.bindings.resolve);
    const handler = new NurtureInstitutionKnowledgeSurfaceHandler(deps({
      bindings: { resolve },
    }));
    const invalidInputs = [
      {
        ...request("create_institution_knowledge_item"),
        operationInput: {
          ...operationInputs.create_institution_knowledge_item,
          workspaceId: "caller-workspace",
        },
      },
      {
        ...request("create_institution_knowledge_revision"),
        operationInput: {
          ...operationInputs.create_institution_knowledge_revision,
          validUntil: "2026-08-09T00:00:00.000Z",
        },
      },
      {
        ...request("create_institution_knowledge_revision"),
        operationInput: {
          ...operationInputs.create_institution_knowledge_revision,
          body: { ...body, sections: [body.sections[0], body.sections[0]] },
        },
      },
      {
        ...request("create_institution_knowledge_revision"),
        operationInput: {
          ...operationInputs.create_institution_knowledge_revision,
          body: {
            ...body,
            sections: [{ ...body.sections[0], body: "界".repeat(4_000) }],
          },
        },
      },
    ];
    for (const invalid of invalidInputs) {
      await expect(handler.handle(invalid, trusted())).resolves.toEqual({
        status: "invalid",
        reason_code: "invalid_institution_knowledge_request",
      });
    }
    expect(resolve).not.toHaveBeenCalled();
    expect(() => parseNurtureInstitutionKnowledgeAdapterRequest({
      ...request("create_institution_knowledge_revision"),
      operationInput: {
        ...operationInputs.create_institution_knowledge_revision,
        validFrom: "2026-99-99T00:00:00.000Z",
      },
    })).not.toThrow();
  });

  it("maps all five lifecycle actions to their exact I1 specs and trusted fields", async () => {
    const calls: Array<{
      capabilityKey: string;
      commandKey: string;
      payload: unknown;
      confirmationRef: string;
    }> = [];
    const configured = deps({
      commands: {
        execute: async (input) => {
          calls.push({
            capabilityKey: input.capability_key,
            commandKey: input.spec.command_key,
            payload: input.payload,
            confirmationRef: input.confirmation_ref,
          });
          return deps().commands.execute(input);
        },
      },
    });
    const handler = new NurtureInstitutionKnowledgeSurfaceHandler(configured);
    for (const capabilityKey of Object.keys(operationInputs) as Array<keyof typeof operationInputs>) {
      const result = await handler.handle(request(capabilityKey), trusted());
      expect(result).toMatchObject({
        status: "ok",
        disposition: "executed",
        result: { effect: capabilityKey, itemHead: 3 },
      });
    }
    expect(calls.map(({ capabilityKey, commandKey }) => [capabilityKey, commandKey])).toEqual(
      Object.keys(operationInputs).map((key) => [key, `nurture.${key}`]),
    );
    for (const call of calls) {
      expect(call.payload).toMatchObject({
        workspace_id: "workspace-01",
        institution_ref: "institution-01",
        role_assignment_ref: "role-admin-01",
      });
      expect(call.confirmationRef).toBe("confirmation-01");
    }
    expect(calls[0]?.payload).toMatchObject({
      verified_authority_links: [authoritySnapshot],
    });
  });

  it("maps preview to the exact I1 request and role-safe presenter", async () => {
    const preview = vi.fn(deps().preview.preview);
    const handler = new NurtureInstitutionKnowledgeSurfaceHandler(deps({ preview: { preview } }));
    const result = await handler.handle({
      capabilityKey: "query_institution_knowledge_preview",
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-institution",
      operationInput: { revisionOptionRefs: ["option-revision-01"] },
    }, trusted());
    expect(preview).toHaveBeenCalledWith({
      context: expect.objectContaining({
        workspace_id: "workspace-01",
        institution_ref: "institution-01",
        participant_ref: "participant-01",
        role_assignment_ref: "role-admin-01",
        surface: "institution_workbench",
        purpose: "institution_admin_editor_preview",
      }),
      request: { revision_option_refs: ["option-revision-01"] },
    });
    expect(result).toEqual({
      status: "ok",
      result: {
        options: [{
          revisionOptionRef: "option-revision-01",
          sourceRef: "revision-01",
          sourceVersion: "2",
          revisionNumber: 2,
          state: "draft",
          body,
          warnings: ["draft"],
        }],
      },
    });
  });

  it("keeps answer effectful while delegating to the exact I1 answer operation", async () => {
    const retrieveCandidates = vi.fn(async () => ({
      status: "resolved" as const,
      candidates: [],
    }));
    const handler = new NurtureInstitutionKnowledgeSurfaceHandler(deps({
      retrievalOwner: { retrieveCandidates },
    }));
    const result = await handler.handle({
      capabilityKey: "answer_institution_knowledge",
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-institution",
      confirmationRef: "confirmation-01",
      operationInput: {
        question: "What is the pickup process?",
        scenarioKeys: ["pickup"],
      },
    }, trusted());
    expect(retrieveCandidates).toHaveBeenCalledWith({
      context: expect.objectContaining({
        purpose: "institution_admin_online_answer",
        scenario_keys: ["pickup"],
      }),
      question: "What is the pickup process?",
    });
    expect(result).toEqual({
      status: "ok",
      result: {
        status: "abstained_no_source",
        contractVersion: "1.0.0",
      },
    });
  });

  it("presents cited answers without leaking private item or revision refs", () => {
    const presented = presentInstitutionKnowledgeAnswer({
      status: "answered",
      contract_version: "1.0.0",
      generation_ref: "generation-01",
      generated_at: now,
      assistance_kind: "ai_generated_with_retrieved_sources",
      claims: [{
        text: "Use the documented pickup process.",
        claim_kind: "institution_process",
        citation_refs: ["citation-01"],
      }],
      citations: [{
        citation_ref: "citation-01",
        source_ref: canonicalRef("nurture", "institution_knowledge_revision", "source-01"),
        source_version: "2",
        content_hash: "2".repeat(64),
        source_kind: "institution_material",
        label: "园区材料",
        provenance_kind: "institution_authored",
        title: "Pickup",
        excerpt: "Verify the authorized pickup contact.",
        item_ref: "private-item-01",
        revision_ref: "private-revision-01",
        revision_number: 2,
        publication_event_ref: canonicalRef(
          "nurture",
          "institution_knowledge_revision_event",
          "event-01",
        ),
        published_at: now,
      }],
    }, trusted(), deps().optionIssuer);
    expect(presented).toMatchObject({
      status: "answered",
      citations: [{
        itemOptionRef: "option:item:private-item-01:current",
        revisionOptionRef: "option:revision:private-revision-01:2",
        publicationEventRef: "event-01",
      }],
    });
    expect(JSON.stringify(presented)).not.toContain('"item_ref"');
    expect(JSON.stringify(presented)).not.toContain('"revision_ref"');
  });

  it("fails closed on role, target, trusted-context and committed-result drift", async () => {
    let executeCalls = 0;
    const deniedRole = new NurtureInstitutionKnowledgeSurfaceHandler(deps({
      bindings: {
        resolve: async () => ({
          status: "denied",
          reason_code: "institution_admin_role_required",
        }),
      },
    }));
    await expect(deniedRole.handle(
      request("publish_institution_knowledge_revision"),
      trusted(),
    )).resolves.toEqual({
      status: "denied",
      reason_code: "institution_admin_role_required",
    });

    const wrongTarget = new NurtureInstitutionKnowledgeSurfaceHandler(deps({
      bindings: {
        resolve: async ({ request: value }) => ({
          status: "resolved",
          binding: {
            ...binding(value.capabilityKey, value.targetOptionRef),
            target_option_ref: "other-option",
          },
        }),
      },
      commands: {
        execute: async () => {
          executeCalls += 1;
          return {
            status: "not_committed" as const,
            decision: "blocked" as const,
            reason_code: "unexpected_execution",
          };
        },
      },
    }));
    await expect(wrongTarget.handle(request("publish_institution_knowledge_revision"), trusted()))
      .resolves.toMatchObject({ status: "unavailable", reason_code: "institution_knowledge_binding_drift" });
    await expect(wrongTarget.handle(request("publish_institution_knowledge_revision"), {
      ...trusted(), workspace_id: "",
    })).resolves.toMatchObject({ status: "unavailable" });
    expect(executeCalls).toBe(0);

    const drifted = new NurtureInstitutionKnowledgeSurfaceHandler(deps({
      commands: {
        execute: async () => ({
          status: "committed",
          disposition: "executed",
          result: {
            item_ref: "other-item",
            revision_ref: "revision-01",
            item_head: 3,
            revision_number: 2,
            revision_state: "published",
            committed_at: now,
          },
        }),
      },
    }));
    await expect(drifted.handle(request("publish_institution_knowledge_revision"), trusted()))
      .resolves.toEqual({
        status: "unavailable",
        reason_code: "institution_knowledge_committed_result_drift",
      });
  });

  it("registers only disabled Workbench composition and fail-closed handlers", async () => {
    expect(Object.isFrozen(defaultNurtureInstitutionKnowledgeSurfaceDeps)).toBe(true);
    expect(Object.isFrozen(defaultNurtureInstitutionKnowledgeSurfaceDeps.bindings)).toBe(true);
    expect(nurtureScenarioManifest.surface_mapping.web_run_workbench.institution_knowledge)
      .toEqual({
        contract_version: "1.0.0",
        query_handler_key: "nurture.internal.query_institution_knowledge",
        command_handler_key: "nurture.internal.execute_institution_knowledge",
        enablement_policy: "disabled",
      });
    expect(nurtureScenarioManifest.surface_mapping.chat_workflow_control)
      .not.toHaveProperty("institution_knowledge");
    expect(nurtureScenarioManifest.surface_mapping.mobile_dashboard)
      .not.toHaveProperty("institution_knowledge");
    const internal = nurtureScenarioModule.internal_api_handlers;
    const meta = {
      workspace_id: "workspace-01",
      actor_id: "participant-01",
      idempotency_key: "command-01",
      correlation_id: "invocation-01",
      client_surface: "web_run_workbench" as const,
    };
    const previewRequest = {
      capabilityKey: "query_institution_knowledge_preview",
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-institution",
      operationInput: { revisionOptionRefs: ["option-revision-01"] },
    };
    await expect(internal["nurture.internal.query_institution_knowledge"]?.({
      method: "POST", path: "/synthetic", payload: previewRequest, meta,
    })).resolves.toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_runtime_unavailable",
    });
    await expect(internal["nurture.internal.execute_institution_knowledge"]?.({
      method: "POST", path: "/synthetic", payload: previewRequest, meta,
    })).resolves.toEqual({
      status: "invalid",
      reason_code: "invalid_institution_knowledge_request",
    });
  });
});
