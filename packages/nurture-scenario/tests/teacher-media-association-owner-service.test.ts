import { describe, expect, it, vi } from "vitest";
import type { NurtureCommandResult } from "../src/domain/commands/command-kernel.js";
import { issueBoardOpaqueRef } from "../src/harness/board-projection.js";
import type { MediaAttributionFactsV1 } from "../src/harness/media-attribution.js";
import {
  createTeacherMediaAssociationOwnerService,
  type TeacherMediaAssociationOwnerServiceDependenciesV1,
} from "../src/teacher-media-association-owner-service.js";

const INTEGRITY_KEY = "teacher-media-association-unit-key-0001";
const NOW = new Date("2026-08-14T09:00:00.000Z");
const WORKSPACE = "workspace-unit-01";
const USER = "user-unit-01";
const PARTICIPANT = "participant-unit-01";
const CARE_GROUP = "care-group-unit-01";
const MEDIA_A = "media-asset-0001";
const MEDIA_B = "media-asset-0002";
const CHILD = "child-process-unit-01";

const ref = (kind: string, id: string) =>
  issueBoardOpaqueRef(INTEGRITY_KEY, { workspace_id: WORKSPACE }, kind, id);

const context = () => ({
  participant_id: PARTICIPANT,
  participant_version: 2,
  classes: [
    {
      care_group_id: CARE_GROUP,
      care_group_label: "向日葵班",
      role: "lead_caregiver" as const,
      role_version: 3,
      care_group_version: 4,
      institution_id: "institution-unit-01",
      publication_policy_resolved: true,
    },
  ],
});

const baseRequest = () => ({
  workspace_id: WORKSPACE,
  my_chat_user_id: USER,
  host_request_id: "host-unit-01",
  context_ref: "context:teacher:unit:v1",
  class_ref: ref("care_group", CARE_GROUP),
});

const authority = (fact: Partial<MediaAttributionFactsV1["authority"]> = {}) =>
  ({
    role: "lead_caregiver",
    role_scope_type: "care_group",
    role_scope_matches_source: true,
    role_assignment_current: true,
    fact_visible: true,
    purpose_allowed: true,
    ...fact,
  }) as MediaAttributionFactsV1["authority"];

const FACTS: Record<string, MediaAttributionFactsV1> = {
  [MEDIA_A]: {
    authority: authority(),
    media_lifecycle: "ready",
    media_revision: 1,
    eligible_child_ids: [CHILD],
    attributions: [
      { attribution_id: "attr-1", child_care_process_id: CHILD, status: "candidate", revision: 1, source: "organizer_candidate" },
    ],
  },
  [MEDIA_B]: {
    authority: authority(),
    media_lifecycle: "ready",
    media_revision: 2,
    eligible_child_ids: [CHILD],
    attributions: [
      { attribution_id: "attr-2", child_care_process_id: CHILD, status: "confirmed", revision: 2, source: "manual", decided_at: "2026-08-14T08:45:00.000Z" },
    ],
  },
};

const deps = (
  overrides: Partial<TeacherMediaAssociationOwnerServiceDependenciesV1> & {
    result?: NurtureCommandResult;
    facts?: Record<string, MediaAttributionFactsV1>;
  } = {},
): TeacherMediaAssociationOwnerServiceDependenciesV1 & {
  execute: ReturnType<typeof vi.fn>;
} => {
  const facts = overrides.facts ?? FACTS;
  const execute = vi.fn(async () =>
    overrides.result
      ?? ({
        status: "not_committed",
        decision: "technical_error",
        reason_code: "unexpected",
      } satisfies NurtureCommandResult));
  return {
    contextReads: { loadCaregiverContext: async () => context() },
    mediaReads: {
      listAttributableMediaIds: async () => Object.keys(facts),
      listClassMediaIds: async () => [...Object.keys(facts), "media-asset-terminal"],
      loadMediaAttributionFacts: async ({ media_asset_id }) =>
        facts[media_asset_id] ?? null,
      loadAssetDisplay: async ({ media_asset_ids }) =>
        media_asset_ids.map((id) => ({
          media_asset_id: id,
          safe_title: `照片 ${id.slice(-4)}`,
          captured_at: "2026-08-14T08:30:00.000Z",
        })),
      loadDiscardHeads: async () => ({
        media_revision: 1,
        referencing_draft_count: 1,
      }),
    },
    childOptions: {
      resolveCaregiverDailyCareEligibility: async () => ({
        participant_active: true,
        children: [
          {
            child_care_process_id: CHILD,
            display_label: "小明",
            care_group_version: 4,
            caregiver_role_version: 3,
            enrollment_version: 5,
          },
        ],
      }),
    },
    commands: { execute },
    integrityKey: INTEGRITY_KEY,
    now: () => NOW,
    execute,
    ...overrides,
  };
};

const authorityFor = async (
  binding: ReturnType<typeof createTeacherMediaAssociationOwnerService>,
  operation:
    | "unassociated_query"
    | "association_query"
    | "associate_exchange"
    | "discard_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...baseRequest(),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

describe("teacher media-association owner service", () => {
  it("masks foreign classes and reports resolver read failures as retryable", async () => {
    const binding = createTeacherMediaAssociationOwnerService(deps());
    const foreign = await binding.authorityResolver.resolve({
      ...baseRequest(),
      class_ref: ref("care_group", "care-group-foreign"),
      operation: "unassociated_query",
    });
    expect((foreign as { response: { status: string } }).response.status).toBe(
      "masked",
    );
    const failing = createTeacherMediaAssociationOwnerService(
      deps({
        contextReads: {
          loadCaregiverContext: async () => {
            throw new Error("db down");
          },
        },
      }),
    );
    const unavailable = await failing.authorityResolver.resolve({
      ...baseRequest(),
      operation: "association_query",
    });
    expect(
      (unavailable as { response: { retryable: boolean } }).response.retryable,
    ).toBe(true);
  });

  it("lists only assets still needing a decision with display and options", async () => {
    const binding = createTeacherMediaAssociationOwnerService(deps());
    const response = (await binding.owner.unassociated({
      request: baseRequest(),
      authority: await authorityFor(binding, "unassociated_query"),
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    const assets = response.assets as Array<Record<string, unknown>>;
    // MEDIA_B already has a confirmed attribution and drops out.
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      media_ref: ref("media_asset", MEDIA_A),
      lifecycle: "ready",
      candidate_count: 1,
      confirmed_count: 0,
      safe_title: "照片 0001",
    });
    expect(response.unassociated_count).toBe(1);
    const children = response.children as Array<Record<string, unknown>>;
    expect(children[0]).toMatchObject({
      child_ref: ref("child_care_process", CHILD),
      child_safe_label: "小明",
    });
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(baseRequest().class_ref);
  });

  it("serves one asset's attribution facts with the media echo", async () => {
    const binding = createTeacherMediaAssociationOwnerService(deps());
    const request = {
      ...baseRequest(),
      media_ref: ref("media_asset", MEDIA_B),
    };
    const response = (await binding.owner.association({
      request,
      authority: await authorityFor(binding, "association_query"),
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "ready",
      media_ref: request.media_ref,
      lifecycle: "ready",
      media_revision: 2,
    });
    const attributions = response.attributions as Array<Record<string, unknown>>;
    expect(attributions[0]).toMatchObject({
      child_ref: ref("child_care_process", CHILD),
      state: "confirmed",
      revision: 2,
      decided_at: "2026-08-14T08:45:00.000Z",
    });
  });

  it("commits an associate decision with the actor bound and maps the record", async () => {
    const dependencies = deps({
      result: {
        status: "ok",
        disposition: "executed",
        business_outcome: "applied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "execution",
          object_id: "execution-1",
          version: 1,
        } as never,
        output_refs: [],
        handoff_request_snapshots: [],
        committed_result: {
          mediaRef: "sealed",
          mediaRevision: 1,
          records: [
            {
              attributionRef: "record-ref",
              childRef: "sealed-child",
              status: "confirmed",
              revision: 2,
              source: "manual",
              decidedAt: "2026-08-14T09:00:02.000Z",
            },
          ],
        },
      },
    });
    const binding = createTeacherMediaAssociationOwnerService(dependencies);
    const request = {
      ...baseRequest(),
      media_ref: ref("media_asset", MEDIA_A),
      child_ref: ref("child_care_process", CHILD),
      command_request_id: "command-unit-associate-0001",
      decision: "confirm" as const,
      expected_attribution_revision: 1,
      expected_media_revision: 1,
    };
    const response = (await binding.owner.associate({
      request,
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      disposition: "applied",
      media_ref: request.media_ref,
      child_ref: request.child_ref,
      state: "confirmed",
      revision: 2,
      decided_at: "2026-08-14T09:00:02.000Z",
    });
    const call = dependencies.execute.mock.calls[0]?.[0] as {
      payload: Record<string, unknown>;
      spec: { canonicalize: (input: unknown) => Record<string, unknown> };
    };
    const canonical = call.spec.canonicalize(call.payload);
    expect(canonical.media_asset_id).toBe(MEDIA_A);
    expect(typeof canonical.actor_binding_ref).toBe("string");

    const foreignChild = (await binding.owner.associate({
      request: { ...request, child_ref: ref("child_care_process", "child-foreign") },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(foreignChild.status).toBe("masked");
  });

  it("attributes head drift to the moved revision on the failure path", async () => {
    const request = {
      ...baseRequest(),
      media_ref: ref("media_asset", MEDIA_A),
      child_ref: ref("child_care_process", CHILD),
      command_request_id: "command-unit-associate-0002",
      decision: "confirm" as const,
      expected_attribution_revision: 1,
      expected_media_revision: 1,
    };
    const conflict: NurtureCommandResult = {
      status: "not_committed",
      decision: "conflict",
      reason_code: "stale_confirmation",
    };
    const attributionMoved = createTeacherMediaAssociationOwnerService(
      deps({ result: conflict }),
    );
    expect(
      (
        (await attributionMoved.owner.associate({
          request,
          authority: {} as never,
        })) as Record<string, unknown>
      ).reason_code,
    ).toBe("attribution_revision_moved");

    const movedFacts = structuredClone(FACTS);
    movedFacts[MEDIA_A] = { ...movedFacts[MEDIA_A]!, media_revision: 3 };
    const mediaMoved = createTeacherMediaAssociationOwnerService(
      deps({ result: conflict, facts: movedFacts }),
    );
    expect(
      (
        (await mediaMoved.owner.associate({
          request,
          authority: {} as never,
        })) as Record<string, unknown>
      ).reason_code,
    ).toBe("media_revision_moved");
  });

  it("discards with head-free command identity and the recorded instant", async () => {
    const dependencies = deps({
      result: {
        status: "ok",
        disposition: "replayed",
        business_outcome: "applied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "execution",
          object_id: "execution-2",
          version: 1,
        } as never,
        output_refs: [],
        handoff_request_snapshots: [],
        committed_result: {
          mediaRef: "sealed",
          affectedDraftCount: 1,
          discardedAt: "2026-08-14T09:00:04.000Z",
        },
      },
    });
    const binding = createTeacherMediaAssociationOwnerService(dependencies);
    const request = {
      ...baseRequest(),
      media_ref: ref("media_asset", MEDIA_A),
      command_request_id: "command-unit-discard-0001",
    };
    const response = (await binding.owner.discard({
      request,
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "replayed",
      media_ref: request.media_ref,
      discarded_at: "2026-08-14T09:00:04.000Z",
      affected_draft_count: 1,
    });
    const call = dependencies.execute.mock.calls[0]?.[0] as {
      payload: Record<string, unknown>;
      spec: { canonicalize: (input: unknown) => Record<string, unknown> };
    };
    const canonical = call.spec.canonicalize(call.payload);
    expect(canonical).toEqual({
      media_asset_id: MEDIA_A,
      actor_binding_ref: canonical.actor_binding_ref,
    });

    const blocked = createTeacherMediaAssociationOwnerService(
      deps({
        result: {
          status: "not_committed",
          decision: "blocked",
          reason_code: "already_released",
        },
      }),
    );
    expect(
      (
        (await blocked.owner.discard({
          request: { ...request, command_request_id: "command-unit-discard-0002" },
          authority: {} as never,
        })) as Record<string, unknown>
      ).reason_code,
    ).toBe("already_released");
  });
});
