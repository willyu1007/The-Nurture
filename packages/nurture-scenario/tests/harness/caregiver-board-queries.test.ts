import { describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "../../src/harness/board-projection.js";
import {
  CAREGIVER_CHILD_TODAY_ORDER,
  QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY,
  queryCaregiverChildToday,
  type CaregiverBoardDependencies,
  type CaregiverBoardReadPort,
} from "../../src/harness/caregiver-board-queries.js";
import {
  BOARD_CONTRACT,
  BOARD_INTEGRITY_KEY,
  caregiverAuthority,
  childToday,
  createCaregiverReadPort,
  driftHeads,
} from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const now = () => new Date("2026-08-02T00:00:00.000Z");

const deps = (reads: CaregiverBoardReadPort): CaregiverBoardDependencies => ({
  contract: BOARD_CONTRACT,
  integrity_key: BOARD_INTEGRITY_KEY,
  reads,
  now,
});

describe("G3-A query_caregiver_child_today", () => {
  it("binds contract, capability, CareGroup scope, snapshot, order and source heads", async () => {
    const result = await queryCaregiverChildToday(
      deps(createCaregiverReadPort({ pages: [{ rows: [childToday()], has_more: false }] })),
      scope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const { binding } = result.output;
    expect(binding.contract).toEqual(BOARD_CONTRACT);
    expect(binding.capability).toEqual({ ...QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY });
    expect(binding.actor).toEqual({
      role: "caregiver",
      scopeKind: "care_group",
      scopeRef: issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "care_group", "care-group-1"),
    });
    expect(binding.snapshot.snapshotVersion).toBe(11);
    expect(binding.order).toBe(CAREGIVER_CHILD_TODAY_ORDER);
    expect(binding.sourceHeads.map((head) => head.sourceKind)).toEqual(["daily_care_log"]);
    expect(result.output.careGroupRef).toBe(binding.actor.scopeRef);
    expect(JSON.stringify(result.output)).not.toContain("care-group-1");
    expect(JSON.stringify(result.output)).not.toContain("child-1");
  });

  it("refuses every identity that is not an exact-CareGroup caregiver RoleAssignment", async () => {
    for (const authority of [
      caregiverAuthority({ role: "institution_admin" }),
      caregiverAuthority({ role: "lead_caregiver", role_scope_type: "institution" }),
      caregiverAuthority({ role: "institution_member" }),
      caregiverAuthority({ role_scope_matches_source: false }),
      caregiverAuthority({ role_assignment_current: false }),
    ]) {
      const port = createCaregiverReadPort({ scope: { authority } });
      await expect(queryCaregiverChildToday(deps(port), scope)).resolves.toEqual({
        status: "denied",
        reason_code: "not_authorized",
      });
      expect(port.requests).toEqual([]);
    }
  });

  it("accepts an exact-CareGroup lead_caregiver as an ordinary class caregiver", async () => {
    const result = await queryCaregiverChildToday(
      deps(
        createCaregiverReadPort({
          scope: { authority: caregiverAuthority({ role: "lead_caregiver" }) },
          pages: [{ rows: [childToday()], has_more: false }],
        }),
      ),
      scope,
    );
    expect(result.status).toBe("ok");
  });

  it("drops daily-care and attention facts the current policy hides", async () => {
    const result = await queryCaregiverChildToday(
      deps(
        createCaregiverReadPort({
          pages: [
            {
              rows: [
                childToday({
                  daily_care: [
                    {
                      log_id: "log-1",
                      kind: "nap",
                      summary: "Syn Nap",
                      occurred_at: "2026-08-01T12:00:00.000Z",
                      authority: caregiverAuthority(),
                      action_grants: [],
                    },
                    {
                      log_id: "log-2",
                      kind: "health_observation",
                      summary: "Syn Restricted",
                      occurred_at: "2026-08-01T13:00:00.000Z",
                      authority: caregiverAuthority({ fact_visible: false }),
                      action_grants: [],
                    },
                  ],
                  attention: [
                    {
                      attention_item_id: "attention-1",
                      priority: "attention",
                      summary: "Syn Attention",
                      source_kind: "daily_care_log",
                      authority: caregiverAuthority(),
                      action_grants: [],
                    },
                    {
                      attention_item_id: "attention-2",
                      priority: "urgent",
                      summary: "Syn Other Group",
                      source_kind: "daily_care_log",
                      authority: caregiverAuthority({ role_scope_matches_source: false }),
                      action_grants: [],
                    },
                  ],
                }),
              ],
              has_more: false,
            },
          ],
        }),
      ),
      scope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const card = result.output.children[0];
    expect(card?.dailyCare.map((entry) => entry.kind)).toEqual(["nap"]);
    expect(card?.attention.map((entry) => entry.priority)).toEqual(["attention"]);
    expect(JSON.stringify(result.output)).not.toContain("Syn Restricted");
    expect(JSON.stringify(result.output)).not.toContain("Syn Other Group");
  });

  it("routes an attention action to the source owner's capability only when granted", async () => {
    const result = await queryCaregiverChildToday(
      deps(
        createCaregiverReadPort({
          pages: [
            {
              rows: [
                childToday({
                  attention: [
                    {
                      attention_item_id: "attention-1",
                      priority: "routine",
                      summary: "Syn Attention",
                      source_kind: "daily_care_log",
                      authority: caregiverAuthority(),
                      action_grants: [
                        {
                          capability_key: "record_caregiver_daily_care",
                          capability_version: "1.0.0",
                          availability: "available",
                          target_kind: "daily_care_log",
                          target_option_id: "log-1",
                        },
                      ],
                    },
                    {
                      attention_item_id: "attention-2",
                      priority: "routine",
                      summary: "Syn Attention Without Grant",
                      source_kind: "care_interaction_item",
                      authority: caregiverAuthority(),
                      action_grants: [],
                    },
                  ],
                }),
              ],
              has_more: false,
            },
          ],
        }),
      ),
      scope,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const attention = result.output.children[0]?.attention ?? [];
    expect(attention[0]?.actions.map((action) => action.capabilityKey)).toEqual([
      "record_caregiver_daily_care",
    ]);
    // No board-level "resolve everything" write is invented for the second item.
    expect(attention[1]?.actions).toEqual([]);
  });

  it("fills the page across scan rounds and refuses a drifted cursor", async () => {
    const port = createCaregiverReadPort({
      pages: [
        {
          rows: [
            childToday({ child_care_process_id: "child-1" }),
            childToday({
              child_care_process_id: "child-2",
              authority: caregiverAuthority({ purpose_allowed: false }),
            }),
          ],
          has_more: true,
        },
        { rows: [childToday({ child_care_process_id: "child-3" })], has_more: true },
      ],
    });
    const first = await queryCaregiverChildToday(deps(port), { ...scope, page_size: 2 });
    expect(first.status).toBe("ok");
    if (first.status !== "ok") return;
    expect(first.output.children).toHaveLength(2);
    expect(port.requests).toHaveLength(2);

    const cursor = first.output.pageInfo.nextCursor;
    expect(cursor).toBeDefined();
    await expect(
      queryCaregiverChildToday(
        deps(
          createCaregiverReadPort({
            scope: { drift_heads: driftHeads({ authority_head: "authority-2" }) },
          }),
        ),
        { ...scope, page_size: 2, cursor: cursor ?? "" },
      ),
    ).resolves.toEqual({ status: "refresh_required" });
  });
});
