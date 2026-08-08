import { describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "../../src/harness/board-projection.js";
import type { CaregiverBoardScopeFacts } from "../../src/harness/caregiver-board-queries.js";
import {
  QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY,
  TEACHER_PUBLISH_QUEUE_ORDER,
  queryTeacherPublishQueue,
  type TeacherPublishQueueReadPort,
} from "../../src/harness/teacher-publish-queue.js";
import {
  BOARD_CONTRACT,
  BOARD_INTEGRITY_KEY,
  caregiverAuthority,
  createPublishQueueReadPort,
  driftHeads,
  publishQueueRow,
} from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const now = () => new Date("2026-08-02T00:00:00.000Z");

const scopeFacts = (
  overrides: Partial<CaregiverBoardScopeFacts> = {},
): CaregiverBoardScopeFacts => ({
  authorized: true,
  care_group_id: "care-group-1",
  care_group_label: "Syn Class A",
  snapshot_version: 11,
  drift_heads: driftHeads(),
  authority: caregiverAuthority(),
  surface_action_grants: [],
  module_action_grants: {},
  publication_policy_resolved: false,
  ...overrides,
});

const deps = (reads: TeacherPublishQueueReadPort) => ({
  contract: BOARD_CONTRACT,
  integrity_key: BOARD_INTEGRITY_KEY,
  reads,
  now,
});

describe("G3-B1 query_teacher_publish_queue", () => {
  it("binds contract, capability, CareGroup scope, snapshot, order and source heads", async () => {
    const result = await queryTeacherPublishQueue(
      deps(createPublishQueueReadPort([{ rows: [publishQueueRow()], has_more: false }])),
      scopeFacts(),
      scope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.output.binding.capability).toEqual({
      ...QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY,
    });
    expect(result.output.binding.order).toBe(TEACHER_PUBLISH_QUEUE_ORDER);
    expect(result.output.binding.snapshot.snapshotVersion).toBe(11);
    expect(result.output.careGroupRef).toBe(
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "care_group", "care-group-1"),
    );
    expect(result.output.binding.sourceHeads).toHaveLength(1);
  });

  it("reports the owner's queue-wide census, not a count of the returned page", async () => {
    const result = await queryTeacherPublishQueue(
      deps(
        createPublishQueueReadPort(
          [
            {
              rows: [publishQueueRow({ process_key: "p-1", state: "draft" })],
              has_more: true,
            },
          ],
          // The queue holds far more than this page shows.
          { draft: 9, needs_review: 2, pending_release: 4, released: 7, cancelled: 1 },
        ),
      ),
      scopeFacts(),
      { ...scope, page_size: 1 },
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.output.items).toHaveLength(1);
    expect(result.output.counts).toEqual({
      draft: 9,
      needs_review: 2,
      pending_release: 4,
      released: 7,
      cancelled: 1,
    });
    // Exactly the five business states, and never a sixth.
    expect(Object.keys(result.output.counts).sort()).toEqual([
      "cancelled",
      "draft",
      "needs_review",
      "pending_release",
      "released",
    ]);
  });

  it("keeps a partial release visible instead of showing a bare published label", async () => {
    const result = await queryTeacherPublishQueue(
      deps(
        createPublishQueueReadPort([
          {
            rows: [
              publishQueueRow({
                process_key: "p-partial",
                state: "released",
                target_count: 3,
                released_target_count: 2,
              }),
            ],
            has_more: false,
          },
        ]),
      ),
      scopeFacts(),
      scope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const item = result.output.items[0];
    expect(item?.targetSummary).toEqual({ total: 3, released: 2 });
    // The summary never collapses into a single "published" claim.
    expect(item?.state).toBe("released");
    expect(JSON.stringify(item)).not.toContain("p-partial");
  });

  it("omits a scheduled time until an institution schedule has actually resolved", async () => {
    const unscheduled = await queryTeacherPublishQueue(
      deps(createPublishQueueReadPort([{ rows: [publishQueueRow()], has_more: false }])),
      scopeFacts(),
      scope,
    );
    expect(unscheduled.status).toBe("ok");
    if (unscheduled.status !== "ok") return;
    expect(unscheduled.output.items[0]).not.toHaveProperty("scheduledAt");

    const scheduled = await queryTeacherPublishQueue(
      deps(
        createPublishQueueReadPort([
          {
            rows: [
              publishQueueRow({
                state: "pending_release",
                scheduled_at: "2026-08-01T09:00:00.000Z",
              }),
            ],
            has_more: false,
          },
        ]),
      ),
      scopeFacts({ publication_policy_resolved: true }),
      scope,
    );
    expect(scheduled.status).toBe("ok");
    if (scheduled.status !== "ok") return;
    expect(scheduled.output.items[0]?.scheduledAt).toBe("2026-08-01T09:00:00.000Z");
  });

  it("projects per-target family-growth states behind owner-issued refs only", async () => {
    const result = await queryTeacherPublishQueue(
      deps(
        createPublishQueueReadPort([
          {
            rows: [
              publishQueueRow({
                process_key: "process-1",
                family_growth: [
                  { target_key: "target:child-A", state: "applied" },
                  { target_key: "target:child-B", state: "outcome_unknown" },
                ],
              }),
              publishQueueRow({ process_key: "process-2" }),
            ],
            has_more: false,
          },
        ]),
      ),
      scopeFacts(),
      scope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const [withStates, without] = result.output.items;
    expect(withStates?.familyGrowth).toHaveLength(2);
    expect(withStates?.familyGrowth?.map((entry) => entry.state)).toEqual([
      "applied",
      "outcome_unknown",
    ]);
    // Owner-issued sealed refs only: no raw target key crosses the surface.
    for (const entry of withStates?.familyGrowth ?? []) {
      expect(entry.targetRef).not.toContain("target:child");
    }
    expect(without?.familyGrowth).toBeUndefined();
  });

  it("refuses every identity that is not an exact-CareGroup caregiver", async () => {
    for (const authority of [
      caregiverAuthority({ role: "institution_admin" }),
      caregiverAuthority({ role_scope_type: "institution" }),
      caregiverAuthority({ role_scope_matches_source: false }),
    ]) {
      const port = createPublishQueueReadPort();
      await expect(
        queryTeacherPublishQueue(deps(port), scopeFacts({ authority }), scope),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
      expect(port.requests).toEqual([]);
    }
  });

  it("drops a row whose own class scope no longer matches and fills across scan rounds", async () => {
    const port = createPublishQueueReadPort([
      {
        rows: [
          publishQueueRow({ process_key: "p-1" }),
          publishQueueRow({
            process_key: "p-2",
            authority: caregiverAuthority({ role_scope_matches_source: false }),
          }),
        ],
        has_more: true,
      },
      { rows: [publishQueueRow({ process_key: "p-3" })], has_more: false },
    ]);
    const result = await queryTeacherPublishQueue(deps(port), scopeFacts(), {
      ...scope,
      page_size: 2,
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.output.items).toHaveLength(2);
    expect(port.requests).toHaveLength(2);
  });

  it("refuses a cursor after drift and an out-of-range page size", async () => {
    const first = await queryTeacherPublishQueue(
      deps(
        createPublishQueueReadPort([
          { rows: [publishQueueRow({ process_key: "p-1" })], has_more: true },
        ]),
      ),
      scopeFacts(),
      { ...scope, page_size: 1 },
    );
    expect(first.status).toBe("ok");
    if (first.status !== "ok") return;
    const cursor = first.output.pageInfo.nextCursor ?? "";
    expect(cursor).not.toBe("");

    await expect(
      queryTeacherPublishQueue(
        deps(createPublishQueueReadPort()),
        scopeFacts({ drift_heads: driftHeads({ redaction_head: "redaction-2" }) }),
        { ...scope, page_size: 1, cursor },
      ),
    ).resolves.toEqual({ status: "refresh_required" });

    await expect(
      queryTeacherPublishQueue(deps(createPublishQueueReadPort()), scopeFacts(), {
        ...scope,
        page_size: 21,
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "invalid_query_input" });
  });

  it("emits an action only from owner eligibility", async () => {
    const withoutGrant = await queryTeacherPublishQueue(
      deps(createPublishQueueReadPort([{ rows: [publishQueueRow()], has_more: false }])),
      scopeFacts(),
      scope,
    );
    expect(withoutGrant.status).toBe("ok");
    if (withoutGrant.status !== "ok") return;
    expect(withoutGrant.output.items[0]?.actions).toEqual([]);

    const withGrant = await queryTeacherPublishQueue(
      deps(
        createPublishQueueReadPort([
          {
            rows: [
              publishQueueRow({
                action_grants: [
                  {
                    capability_key: "save_publish_process_draft",
                    capability_version: "1.0.0",
                    availability: "available",
                  },
                ],
              }),
            ],
            has_more: false,
          },
        ]),
      ),
      scopeFacts(),
      scope,
    );
    expect(withGrant.status).toBe("ok");
    if (withGrant.status !== "ok") return;
    expect(withGrant.output.items[0]?.actions.map((action) => action.capabilityKey)).toEqual([
      "save_publish_process_draft",
    ]);
  });
});
