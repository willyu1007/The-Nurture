import { describe, expect, it, vi } from "vitest";
import {
  assertListScenarioSubjectContextsResultActiveV1,
  assertPresentScenarioSubjectContextExchangeV1,
  assertResolveScenarioSubjectContextResultActiveV1,
  type CanonicalRef,
  type ScenarioHumanPrincipalV1,
} from "@my-chat/workflow-contracts";
import {
  AesGcmNurtureC30SubjectLocatorCodec,
  NurtureC30ChildCareProcessPresentationOwner,
  nurtureC30PresentationKey,
  nurtureC30ProductSurfaceKey,
  nurtureC30SubjectProviderKey,
  nurtureScenarioManifest,
  type NurtureC30CurrentSubjectV1,
  type NurtureC30SubjectReadRepository,
} from "../../src/index.js";

const now = new Date("2026-08-06T12:00:00.000Z");
const principal: ScenarioHumanPrincipalV1 = {
  principal_version: 1,
  principal_kind: "human_user",
  account_ref: ref("my_chat", "user", "user-secret-1"),
  actor_ref: ref("my_chat", "actor", "actor-secret-1"),
  workspace_ref: ref("my_chat", "workspace", "workspace-secret-1"),
  principal_origin: "interactive_session",
};
const binding = {
  binding_version: 1 as const,
  binding_revision: 9,
  status: "active" as const,
  participant_ref: ref("nurture", "participant", "participant-secret-1", 4),
  account_ref: principal.account_ref,
  actor_ref: principal.actor_ref,
  workspace_ref: principal.workspace_ref,
};
const subject = (suffix: string, version = "a"): NurtureC30CurrentSubjectV1 => ({
  subject_version: 1,
  process_id: `process-secret-${suffix}`,
  context_version: `v1.${version.repeat(64)}`,
  process_revision: 7,
  updated_at: "2026-08-06T11:55:00.000Z",
});

function fixture(subjects: NurtureC30CurrentSubjectV1[] = [subject("1")]) {
  const byId = new Map(subjects.map((entry) => [entry.process_id, entry]));
  const bindingReader = { readCurrentBindings: vi.fn(async () => [binding]) };
  const authorityReader = {
    authorizeCurrent: vi.fn(async () => ({
      authority_version: 1 as const,
      authorized: true,
      authority_revision: 12,
      reason_code: "authorized",
    })),
  };
  const repository: NurtureC30SubjectReadRepository = {
    listCurrent: vi.fn(async ({ after_process_id: afterProcessId, page_size: pageSize }) => {
      const start = afterProcessId
        ? subjects.findIndex((entry) => entry.process_id === afterProcessId) + 1
        : 0;
      const page = subjects.slice(start, start + pageSize);
      return {
        subjects: page,
        ...(start + pageSize < subjects.length && page.at(-1)
          ? { next_after_process_id: page.at(-1)?.process_id }
          : {}),
      };
    }),
    resolveCurrent: vi.fn(async ({ process_id: processId }) => byId.get(processId) ?? null),
  };
  const owner = new NurtureC30ChildCareProcessPresentationOwner({
    binding_reader: bindingReader,
    authority_reader: authorityReader,
    subject_repository: repository,
    locator_codec: new AesGcmNurtureC30SubjectLocatorCodec(Buffer.alloc(32, 17)),
    clock: () => now,
  });
  return { owner, repository, bindingReader, authorityReader, byId };
}

describe("C30 owner-resolved child care process presentation", () => {
  it("freezes the declared provider, presentation and action-free surface keys", () => {
    const contracts = nurtureScenarioManifest.scenario_contracts;
    expect(contracts?.subject_context_providers).toEqual([
      expect.objectContaining({ provider_key: nurtureC30SubjectProviderKey }),
    ]);
    expect(contracts?.semantic_presentations).toEqual([
      expect.objectContaining({ presentation_key: nurtureC30PresentationKey }),
    ]);
    expect(contracts?.product_surfaces).toEqual([
      expect.objectContaining({
        product_surface_key: nurtureC30ProductSurfaceKey,
        action_offer_policy: "none",
        action_keys: [],
      }),
    ]);
    expect(contracts?.domain_action_contracts).toEqual([]);
    expect(contracts?.protected_interaction_contracts).toEqual([]);
  });

  it("lists one opaque subject and renders all six closed block kinds action-free", async () => {
    const { owner } = fixture();
    const listed = await owner.list(principal, { provider_version: 1 });
    expect(listed.status).toBe("resolved");
    if (listed.status !== "resolved") throw new Error("expected resolved subject");
    assertListScenarioSubjectContextsResultActiveV1(listed, now.toISOString());
    expect(listed.context.subject_context_ref).not.toContain("process-secret-1");
    expect(listed.context.subject_context_ref).not.toContain("workspace-secret-1");

    const input = {
      presentation_version: 1 as const,
      presentation_key: nurtureC30PresentationKey,
      subject_context_ref: listed.context.subject_context_ref,
      view_query: { view_mode: "current" as const },
    };
    const presented = await owner.present(principal, input);
    assertPresentScenarioSubjectContextExchangeV1(input, presented);
    expect(presented.status).toBe("ready");
    if (presented.status !== "ready") throw new Error("expected ready presentation");
    expect(presented.presentation.blocks.map((block) => block.kind)).toEqual([
      "summary",
      "notice",
      "fact_group",
      "metric_group",
      "item_collection",
      "timeline",
    ]);
    expect(presented.presentation.actions).toEqual([]);
    expect(JSON.stringify(presented)).not.toContain("process-secret-1");
    expect(JSON.stringify(presented)).not.toContain("workspace-secret-1");
  });

  it("paginates bounded candidates with sealed cursors and no local identifiers", async () => {
    const { owner } = fixture([subject("1"), subject("2", "b"), subject("3", "c")]);
    const first = await owner.list(principal, { provider_version: 1, page_size: 2 });
    expect(first.status).toBe("needs_selection");
    if (first.status !== "needs_selection") throw new Error("expected selection");
    expect(first.candidates).toHaveLength(2);
    expect(first.next_cursor).toBeDefined();
    expect(JSON.stringify(first)).not.toContain("process-secret");
    const second = await owner.list(principal, {
      provider_version: 1,
      page_size: 2,
      cursor: first.next_cursor,
    });
    expect(second.status).toBe("resolved");
  });

  it("detects a changed snapshot during resolve and present", async () => {
    const { owner, byId } = fixture();
    const listed = await owner.list(principal, { provider_version: 1 });
    if (listed.status !== "resolved") throw new Error("expected resolved subject");
    byId.set("process-secret-1", subject("1", "d"));
    const resolved = await owner.resolve(principal, {
      provider_version: 1,
      subject_context_ref: listed.context.subject_context_ref,
      known_context_version: listed.context.context_version,
    });
    expect(resolved.status).toBe("context_changed");
    assertResolveScenarioSubjectContextResultActiveV1(resolved, now.toISOString());
    await expect(owner.present(principal, {
      presentation_version: 1,
      presentation_key: nurtureC30PresentationKey,
      subject_context_ref: listed.context.subject_context_ref,
    })).resolves.toMatchObject({ status: "context_changed" });
  });

  it("fails closed for cross-Workspace, tampered and expired opaque locators", async () => {
    const { owner } = fixture();
    const listed = await owner.list(principal, { provider_version: 1 });
    if (listed.status !== "resolved") throw new Error("expected resolved subject");
    const wrongWorkspace = {
      ...principal,
      workspace_ref: ref("my_chat", "workspace", "workspace-secret-2"),
    };
    await expect(owner.resolve(wrongWorkspace, {
      provider_version: 1,
      subject_context_ref: listed.context.subject_context_ref,
    })).resolves.toMatchObject({ status: "unavailable" });
    const last = listed.context.subject_context_ref.at(-1) === "A" ? "B" : "A";
    await expect(owner.resolve(principal, {
      provider_version: 1,
      subject_context_ref: `${listed.context.subject_context_ref.slice(0, -1)}${last}`,
    })).resolves.toMatchObject({ status: "unavailable" });

    const expiredOwner = new NurtureC30ChildCareProcessPresentationOwner({
      binding_reader: { readCurrentBindings: async () => [binding] },
      authority_reader: {
        authorizeCurrent: async () => ({
          authority_version: 1,
          authorized: true,
          authority_revision: 12,
          reason_code: "authorized",
        }),
      },
      subject_repository: fixture().repository,
      locator_codec: new AesGcmNurtureC30SubjectLocatorCodec(Buffer.alloc(32, 17)),
      clock: () => new Date(now.getTime() + 5 * 60 * 1000),
    });
    await expect(expiredOwner.resolve(principal, {
      provider_version: 1,
      subject_context_ref: listed.context.subject_context_ref,
    })).resolves.toMatchObject({ status: "unavailable" });
  });

  it("rereads binding and business authority on every list, resolve and present call", async () => {
    const { owner, bindingReader, authorityReader } = fixture();
    const listed = await owner.list(principal, { provider_version: 1 });
    if (listed.status !== "resolved") throw new Error("expected resolved subject");
    await owner.resolve(principal, {
      provider_version: 1,
      subject_context_ref: listed.context.subject_context_ref,
    });
    await owner.present(principal, {
      presentation_version: 1,
      presentation_key: nurtureC30PresentationKey,
      subject_context_ref: listed.context.subject_context_ref,
    });
    expect(bindingReader.readCurrentBindings).toHaveBeenCalledTimes(3);
    expect(authorityReader.authorizeCurrent).toHaveBeenCalledTimes(3);
  });

  it("denies durable principals and undeclared presentations without owner reads", async () => {
    const { owner, repository } = fixture();
    await expect(owner.list({ ...principal, principal_origin: "durable_run_actor" }, {
      provider_version: 1,
    })).resolves.toMatchObject({ status: "unavailable" });
    expect(repository.listCurrent).not.toHaveBeenCalled();
    await expect(owner.present(principal, {
      presentation_version: 1,
      presentation_key: "nurture.undeclared",
      subject_context_ref: "x".repeat(32),
    })).rejects.toMatchObject({ code: "subject_request_invalid" });
  });

  it("does not manufacture a structurally invalid one-candidate selection page", async () => {
    const { owner } = fixture([subject("1"), subject("2", "b")]);
    await expect(owner.list(principal, { provider_version: 1, page_size: 1 })).resolves.toMatchObject({
      status: "unavailable",
      safe_reason: { reason_code: "subject_unavailable" },
    });
  });
});

function ref(
  namespace: "my_chat" | "nurture",
  objectType: string,
  objectId: string,
  version?: number,
): CanonicalRef {
  return {
    schema_version: 1,
    namespace,
    object_type: objectType,
    object_id: objectId,
    ...(version === undefined ? {} : { version }),
  };
}
