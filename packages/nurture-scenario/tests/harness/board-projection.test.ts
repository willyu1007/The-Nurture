import { describe, expect, it } from "vitest";
import {
  resolveBoardSealedRef,
  issueBoardSealedRef,
  buildPageInfo,
  caregiverFactVisible,
  computeDriftHead,
  guardianFactVisible,
  issueBoardCursor,
  issueBoardOpaqueRef,
  issueSnapshotRef,
  parseBoardPageSize,
  projectOwnerActions,
  projectSourceHeads,
  resolveBoardCursor,
  scanBoardPage,
  type BoardCursorIdentityV1,
  type BoardScopeV1,
} from "../../src/harness/board-projection.js";
import {
  BOARD_INTEGRITY_KEY,
  caregiverAuthority,
  driftHeads,
  guardianAuthority,
  sourceHead,
} from "./board-fixtures.js";

const scope: BoardScopeV1 = { workspace_id: "ws-1", participant_id: "actor-1" };
const otherScope: BoardScopeV1 = { workspace_id: "ws-1", participant_id: "actor-2" };

const identity: BoardCursorIdentityV1 = {
  contract_digest: `sha256:${"a".repeat(64)}`,
  capability_key: "query_guardian_enrollment_activity",
  capability_version: "1.0.0",
  query_key: "guardian_enrollment_activity",
  scope_ref: "scope-ref-1",
  order: "occurred_at_desc,id_desc",
  page_size: 20,
};

const state = {
  snapshot_version: 7,
  snapshot_at: "2026-08-02T00:00:00.000Z",
  drift_head: computeDriftHead(driftHeads()),
};

const at = (iso: string) => () => new Date(iso);

describe("G3-A shared board projection", () => {
  it("issues irreversible, workspace-bound opaque refs that are never locators", () => {
    const ref = issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", "goal-1");
    expect(ref).toMatch(/^1\.[0-9a-f]{32}$/);
    expect(ref).not.toContain("goal-1");
    expect(ref).toBe(
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", "goal-1"),
    );
    expect(ref).not.toBe(
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "focus_cycle", "goal-1"),
    );
    expect(ref).not.toBe(
      issueBoardOpaqueRef(
        BOARD_INTEGRITY_KEY,
        { workspace_id: "ws-2" },
        "focus_goal",
        "goal-1",
      ),
    );
  });

  it("resolves an owner-issued target ref only for the exact actor, kind and eligible id", () => {
    const ref = issueBoardSealedRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", "goal-1");
    const eligible = ["goal-1", "goal-2"];
    expect(resolveBoardSealedRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", ref, eligible)).toBe(
      "goal-1",
    );
    expect(
      resolveBoardSealedRef(BOARD_INTEGRITY_KEY, otherScope, "focus_goal", ref, eligible),
    ).toBeNull();
    expect(
      resolveBoardSealedRef(BOARD_INTEGRITY_KEY, scope, "daily_care_log", ref, eligible),
    ).toBeNull();
    expect(
      resolveBoardSealedRef("another-integrity-key-0123456789abcd", scope, "focus_goal", ref, eligible),
    ).toBeNull();
    // A raw canonical identifier is never a locator.
    expect(
      resolveBoardSealedRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", "goal-1", eligible),
    ).toBeNull();
    // Losing eligibility makes an already-issued ref stop resolving — the whole
    // point of resolving against a candidate set rather than reading the ref.
    expect(
      resolveBoardSealedRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", ref, ["goal-2"]),
    ).toBeNull();
  });

  it("seals the cursor so a holder cannot read the position it carries", () => {
    const raw = {
      childCareProcessId: "ccp-9f3a-raw-uuid",
      childName: "Li Ming",
      processKey: "publish:2026-08-02:class-a",
    };
    const sortKey = {
      rank: raw.childName,
      occurred_at: state.snapshot_at,
      id: raw.childCareProcessId,
    };
    const token = issueBoardCursor(
      BOARD_INTEGRITY_KEY,
      scope,
      { ...identity, ...state, sort_key: sortKey },
      at(state.snapshot_at),
    );

    // The earlier cursor was base64url over the binding, so this decode read the
    // child's id and name straight out of a public `nextCursor`.
    const decoded = Buffer.from(token.slice(0, token.lastIndexOf(".")), "base64url").toString(
      "utf8",
    );
    for (const secret of Object.values(raw)) {
      expect(token, secret).not.toContain(secret);
      expect(decoded, secret).not.toContain(secret);
    }

    // It still resolves for its own actor, and for nobody else.
    expect(
      resolveBoardCursor(BOARD_INTEGRITY_KEY, scope, identity, token, at(state.snapshot_at)),
    ).toEqual({ ...state, sort_key: sortKey });
    expect(
      resolveBoardCursor(BOARD_INTEGRITY_KEY, otherScope, identity, token, at(state.snapshot_at)),
    ).toBeNull();
  });

  it("never lets a target ref carry any part of the identifier it stands for", () => {
    // The defect this replaced published `1.focus_goal.<raw id>.<tag>` beside the
    // opaque ref that existed to hide that same id.
    for (const [kind, id] of [
      ["focus_goal", "goal-1"],
      ["child_care_process", "ccp-9f3a-raw-uuid"],
      ["publish_process", "publish:2026-08-02:class-a"],
    ] as const) {
      const ref = issueBoardSealedRef(BOARD_INTEGRITY_KEY, scope, kind, id);
      expect(ref, kind).not.toContain(id);
      expect(ref, kind).not.toContain(kind);
      expect(ref, kind).toMatch(/^[0-9]+\.[0-9a-f]{32}$/);
    }
  });

  it("projects deduplicated, stably ordered source heads at their freshest version", () => {
    const heads = projectSourceHeads(BOARD_INTEGRITY_KEY, scope, [
      sourceHead({ source_kind: "focus_goal", source_id: "goal-2", fact_version: 3 }),
      sourceHead({ source_kind: "focus_goal", source_id: "goal-2", fact_version: 5 }),
      sourceHead({ source_kind: "focus_goal", source_id: "goal-2", fact_version: 4 }),
      sourceHead({ source_kind: "family_charter", source_id: "charter-1" }),
    ]);
    expect(heads).toHaveLength(2);
    expect(heads.map((head) => head.sourceKind)).toEqual([
      "family_charter",
      "focus_goal",
    ]);
    expect(heads[1]?.factVersion).toBe(5);
    expect(JSON.stringify(heads)).not.toContain("goal-2");
    expect(
      projectSourceHeads(BOARD_INTEGRITY_KEY, scope, [
        sourceHead({ source_kind: "family_charter", source_id: "charter-1" }),
        sourceHead({ source_kind: "focus_goal", source_id: "goal-2", fact_version: 5 }),
      ]),
    ).toEqual(heads);
  });

  it("binds the snapshot ref to contract, capability, actor and scope", () => {
    const base = {
      contractDigest: identity.contract_digest,
      capabilityKey: identity.capability_key,
      capabilityVersion: identity.capability_version,
      scopeRef: identity.scope_ref,
      snapshotAt: state.snapshot_at,
    };
    const reference = issueSnapshotRef(BOARD_INTEGRITY_KEY, scope, base);
    for (const drift of [
      { ...base, contractDigest: `sha256:${"b".repeat(64)}` },
      { ...base, capabilityKey: "query_guardian_current_focus" },
      { ...base, capabilityVersion: "1.0.1" },
      { ...base, scopeRef: "scope-ref-2" },
      { ...base, snapshotAt: "2026-08-02T00:00:01.000Z" },
    ]) {
      expect(issueSnapshotRef(BOARD_INTEGRITY_KEY, scope, drift)).not.toBe(reference);
    }
    expect(issueSnapshotRef(BOARD_INTEGRITY_KEY, otherScope, base)).not.toBe(reference);
  });

  it("accepts a cursor only under the exact contract, capability, actor, scope, order and page size", () => {
    const token = issueBoardCursor(
      BOARD_INTEGRITY_KEY,
      scope,
      { ...identity, ...state, sort_key: { occurred_at: state.snapshot_at, id: "a-9" } },
      at(state.snapshot_at),
    );
    expect(
      resolveBoardCursor(BOARD_INTEGRITY_KEY, scope, identity, token, at(state.snapshot_at)),
    ).toEqual({ ...state, sort_key: { occurred_at: state.snapshot_at, id: "a-9" } });

    for (const drifted of [
      { ...identity, contract_digest: `sha256:${"b".repeat(64)}` },
      { ...identity, capability_key: "query_guardian_current_focus" },
      { ...identity, capability_version: "1.1.0" },
      { ...identity, query_key: "guardian_current_focus" },
      { ...identity, scope_ref: "scope-ref-2" },
      { ...identity, order: "occurred_at_asc,id_asc" },
      { ...identity, page_size: 19 },
    ]) {
      expect(
        resolveBoardCursor(BOARD_INTEGRITY_KEY, scope, drifted, token, at(state.snapshot_at)),
      ).toBeNull();
    }
    expect(
      resolveBoardCursor(BOARD_INTEGRITY_KEY, otherScope, identity, token, at(state.snapshot_at)),
    ).toBeNull();
    expect(
      resolveBoardCursor(BOARD_INTEGRITY_KEY, scope, identity, token, at("2026-08-02T00:11:00.000Z")),
    ).toBeNull();
    expect(
      resolveBoardCursor(BOARD_INTEGRITY_KEY, scope, identity, `${token}x`, at(state.snapshot_at)),
    ).toBeNull();
  });

  it("changes the drift head after source, authority, correction, redaction or Grant drift", () => {
    const base = computeDriftHead(driftHeads());
    for (const field of [
      "source_head",
      "authority_head",
      "correction_head",
      "redaction_head",
      "grant_head",
    ] as const) {
      expect(computeDriftHead(driftHeads({ [field]: "drifted" }))).not.toBe(base);
    }
    expect(computeDriftHead(driftHeads())).toBe(base);
  });

  it("bounds page size and defaults without accepting a client-chosen unbounded scan", () => {
    expect(parseBoardPageSize(undefined)).toBe(10);
    expect(parseBoardPageSize(1)).toBe(1);
    // The generic query invocation caps pageSize at 20; the board lane matches it.
    expect(parseBoardPageSize(20)).toBe(20);
    for (const invalid of [0, -1, 21, 100, 1.5, "20", null, Number.NaN]) {
      expect(parseBoardPageSize(invalid)).toBeNull();
    }
  });

  it("requires every Guardian fact-level authority axis", () => {
    expect(guardianFactVisible(guardianAuthority())).toBe(true);
    for (const field of [
      "guardian_authority_current",
      "child_association_exact",
      "enrollment_visible",
      "grant_visible",
      "purpose_allowed",
    ] as const) {
      expect(guardianFactVisible(guardianAuthority({ [field]: false }))).toBe(false);
    }
  });

  it("requires an exact-CareGroup caregiver RoleAssignment and rejects every wider identity", () => {
    expect(caregiverFactVisible(caregiverAuthority())).toBe(true);
    expect(caregiverFactVisible(caregiverAuthority({ role: "lead_caregiver" }))).toBe(true);
    for (const wider of [
      { role: "institution_admin" },
      { role: "guardian" },
      { role: "institution_member" },
      { role_scope_type: "institution" },
      { role_scope_matches_source: false },
      { role_assignment_current: false },
      { fact_visible: false },
      { purpose_allowed: false },
    ]) {
      expect(caregiverFactVisible(caregiverAuthority(wider))).toBe(false);
    }
  });

  it("builds action refs only from an owner eligibility grant", () => {
    expect(projectOwnerActions(BOARD_INTEGRITY_KEY, scope, [])).toEqual([]);
    const actions = projectOwnerActions(BOARD_INTEGRITY_KEY, scope, [
      {
        capability_key: "update_guardian_current_focus",
        capability_version: "1.0.0",
        availability: "available",
        target_kind: "focus_goal",
        target_option_id: "goal-1",
      },
      {
        capability_key: "record_caregiver_daily_care",
        capability_version: "1.0.0",
        availability: "needs_input",
      },
    ]);
    expect(actions[0]?.targetOptionRef).toBe(
      issueBoardSealedRef(BOARD_INTEGRITY_KEY, scope, "focus_goal", "goal-1"),
    );
    expect(actions[1]).toEqual({
      capabilityKey: "record_caregiver_daily_care",
      capabilityVersion: "1.0.0",
      availability: "needs_input",
    });
    expect(actions[1]).not.toHaveProperty("targetOptionRef");
  });

  it("fills a page across scan rounds when fact-level policy drops rows", async () => {
    const takes: Array<{ take: number; before?: unknown }> = [];
    const batches = [
      { rows: ["a1", "x2", "a3"], has_more: true },
      { rows: ["x4", "a5", "a6"], has_more: true },
      { rows: ["a7"], has_more: false },
    ];
    const page = await scanBoardPage<string, string>({
      pageSize: 4,
      read: async ({ take, before }) => {
        takes.push({ take, ...(before ? { before } : {}) });
        return batches[takes.length - 1] ?? { rows: [], has_more: false };
      },
      sortKey: (row) => ({ occurred_at: "2026-08-01T00:00:00.000Z", id: row }),
      project: (row) => (row.startsWith("a") ? row.toUpperCase() : null),
    });
    // A fixed take would have returned two of four rows and stopped.
    expect(page.items).toEqual(["A1", "A3", "A5", "A6"]);
    expect(takes).toHaveLength(2);
    expect(takes[1]).toMatchObject({
      take: 4,
      before: { id: "a3" },
    });
    // The last row of batch two was consumed exactly when the page filled.
    expect(page.tail).toEqual({ occurred_at: "2026-08-01T00:00:00.000Z", id: "a6" });
    expect(page.hasMore).toBe(true);
  });

  it("closes the page set instead of stopping early when the source is exhausted", async () => {
    const batches = [
      { rows: ["x1", "x2"], has_more: true },
      { rows: ["x3", "a4"], has_more: false },
    ];
    let round = 0;
    const page = await scanBoardPage<string, string>({
      pageSize: 10,
      read: async () => batches[round++] ?? { rows: [], has_more: false },
      sortKey: (row) => ({ occurred_at: "2026-08-01T00:00:00.000Z", id: row }),
      project: (row) => (row.startsWith("a") ? row : null),
    });
    expect(page.items).toEqual(["a4"]);
    expect(page.hasMore).toBe(false);
    expect(round).toBe(2);
  });

  it("stops a port that reports more while returning nothing", async () => {
    let rounds = 0;
    const page = await scanBoardPage<string, string>({
      pageSize: 5,
      read: async () => {
        rounds += 1;
        return { rows: [], has_more: true };
      },
      sortKey: () => ({ occurred_at: "2026-08-01T00:00:00.000Z", id: "none" }),
      project: (row) => row,
    });
    expect(page.items).toEqual([]);
    expect(rounds).toBeLessThanOrEqual(2);
  });

  it("emits a next cursor only when the source can still yield a page", () => {
    expect(
      buildPageInfo(BOARD_INTEGRITY_KEY, scope, identity, state, {
        hasMore: false,
        tail: { occurred_at: state.snapshot_at, id: "a-9" },
      }),
    ).toEqual({ hasMore: false });
    expect(
      buildPageInfo(BOARD_INTEGRITY_KEY, scope, identity, state, { hasMore: true }),
    ).toEqual({ hasMore: true });
    const withCursor = buildPageInfo(
      BOARD_INTEGRITY_KEY,
      scope,
      identity,
      state,
      { hasMore: true, tail: { occurred_at: state.snapshot_at, id: "a-9" } },
      at(state.snapshot_at),
    );
    expect(withCursor.hasMore).toBe(true);
    expect(
      resolveBoardCursor(
        BOARD_INTEGRITY_KEY,
        scope,
        identity,
        withCursor.nextCursor ?? "",
        at(state.snapshot_at),
      ),
    ).toMatchObject({ sort_key: { id: "a-9" }, snapshot_version: 7 });
  });
});
