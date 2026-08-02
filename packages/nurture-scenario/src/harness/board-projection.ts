import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import type { NurtureCaregiverWriteAuthority } from "../domain/institution/publish-process-transaction.js";
import type { InterfaceContractRefV1 } from "../surface-contract/types.js";

/**
 * G3-A shared board read pipeline (06-g3-0-fact-contract-schema-freeze.md).
 *
 * Both boards project the same canonical facts, but each role reads through its
 * own query and presenter. This module owns everything the two lanes must share
 * and nothing they must not: source-head projection, snapshot/cursor identity,
 * the row-level authority predicates and the single constructor for a board
 * action ref. It holds no fact, performs no write and never composes a
 * cross-role DTO.
 */

export const BOARD_PROJECTION_VERSION = "1";

const CURSOR_TTL_MS = 10 * 60_000;
/** The generic query invocation bounds `pageSize` to 1..20; the board lane
 * never accepts a wider page than the contract it travels through. */
const MAX_PAGE_SIZE = 20;
const DEFAULT_PAGE_SIZE = 10;
/**
 * Refill rounds end when the source closes; this only stops a port that reports
 * `has_more` while returning nothing from spinning forever.
 */
const MAX_EMPTY_SCAN_ROUNDS = 1;

export type BoardActorRoleV1 = "guardian" | "caregiver" | "lead_caregiver";

export type BoardScopeV1 = {
  workspace_id: string;
  participant_id: string;
};

/**
 * The position a page continues from. Some modules declare an order whose
 * leading term is not temporal — a class list is ordered by child label, a
 * publish queue by state — so the key carries that term explicitly. Without it
 * the advertised order and the order a cursor can actually page over would
 * differ, and continuation would skip or repeat rows.
 */
export type BoardSortKeyV1 = { rank?: string; occurred_at: string; id: string };

/**
 * Canonical source families a board module may explain freshness from. A module
 * never invents a source kind: every returned card cites the owner fact it was
 * derived from.
 */
export type BoardSourceKindV1 =
  | "family_charter"
  | "family_charter_item"
  | "focus_cycle"
  | "focus_goal"
  | "focus_goal_child_scope"
  | "publication_release"
  | "daily_care_log"
  | "teacher_attention_item"
  | "care_interaction_item"
  | "enrollment"
  | "care_group_role"
  | "child_link_grant";

/**
 * One source head identifies an opaque canonical source plus the fact
 * version/lifecycle head and the visibility/policy head needed to explain why
 * the projection currently looks the way it does.
 */
export type BoardSourceHeadV1 = {
  sourceKind: BoardSourceKindV1;
  sourceRef: string;
  factVersion: number;
  lifecycleHead: string;
  visibilityHead: string;
};

export type RawBoardSourceHead = {
  source_kind: BoardSourceKindV1;
  source_id: string;
  fact_version: number;
  lifecycle_head: string;
  visibility_head: string;
};

export type BoardModuleBindingV1 = {
  contract: InterfaceContractRefV1;
  capability: { key: string; version: string };
  actor: {
    role: BoardActorRoleV1;
    scopeKind: "family" | "care_group";
    scopeRef: string;
  };
  snapshot: { snapshotRef: string; snapshotVersion: number };
  order: string;
  sourceHeads: BoardSourceHeadV1[];
};

export type BoardPageInfoV1 = { nextCursor?: string; hasMore: boolean };

export type BoardActionRefV1 = {
  capabilityKey: string;
  capabilityVersion: string;
  targetOptionRef?: string;
  availability: "available" | "already_satisfied" | "needs_input";
};

/**
 * The only shape a presenter may turn into an action ref. It is produced by the
 * canonical owner's current eligibility read, so a role name, a module's
 * presence or a cached positive result can never manufacture an action.
 */
export type OwnerEligibilityGrantV1 = {
  capability_key: string;
  capability_version: string;
  availability: "available" | "already_satisfied" | "needs_input";
  target_option_id?: string;
  target_kind?: string;
};

export type BoardQueryDecision<Output> =
  | { status: "ok"; output: Output }
  | { status: "refresh_required" }
  | { status: "denied"; reason_code: string };

// ---------------------------------------------------------------------------
// Opaque refs.

/**
 * Display-only board handle: stable per (workspace, kind, id), irreversible and
 * never accepted back as a locator. Raw child/family/Enrollment/CareGroup/Grant
 * identifiers never reach a public typed result.
 */
export const issueBoardOpaqueRef = (
  integrityKey: string,
  scope: Pick<BoardScopeV1, "workspace_id">,
  kind: string,
  id: string,
): string =>
  `${BOARD_PROJECTION_VERSION}.${createHmac("sha256", integrityKey)
    .update(
      `nurture.board-ref.v${BOARD_PROJECTION_VERSION}\0${scope.workspace_id}\0${kind}\0${id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32)}`;

/**
 * The only target handle. It carries no part of the identifier it stands for:
 * an earlier variant embedded the raw id in the ref and published it beside the
 * opaque ref that existed to hide the very same id. Resolution recomputes over
 * the owner's current candidate set, so an identifier the actor is no longer
 * eligible for simply stops resolving — which a self-describing ref could not
 * express at all.
 */
export const issueBoardSealedRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  kind: string,
  id: string,
): string =>
  `${BOARD_PROJECTION_VERSION}.${createHmac("sha256", integrityKey)
    .update(
      `nurture.board-sealed-target.v${BOARD_PROJECTION_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${kind}\0${id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32)}`;

export const resolveBoardSealedRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  kind: string,
  ref: string,
  candidateIds: Iterable<string>,
): string | null => {
  for (const candidate of candidateIds) {
    if (issueBoardSealedRef(integrityKey, scope, kind, candidate) === ref) return candidate;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Source heads, snapshot identity and drift.

const compareSourceHeads = (left: BoardSourceHeadV1, right: BoardSourceHeadV1): number =>
  left.sourceKind < right.sourceKind
    ? -1
    : left.sourceKind > right.sourceKind
      ? 1
      : left.sourceRef < right.sourceRef
        ? -1
        : left.sourceRef > right.sourceRef
          ? 1
          : 0;

/**
 * Projects raw owner heads into the deduplicated, stably ordered
 * `sourceHeads[]` every typed module result must carry.
 */
export const projectSourceHeads = (
  integrityKey: string,
  scope: Pick<BoardScopeV1, "workspace_id">,
  heads: readonly RawBoardSourceHead[],
): BoardSourceHeadV1[] => {
  const projected = new Map<string, BoardSourceHeadV1>();
  for (const head of heads) {
    const sourceRef = issueBoardOpaqueRef(
      integrityKey,
      scope,
      `source.${head.source_kind}`,
      head.source_id,
    );
    const key = `${head.source_kind}\0${sourceRef}`;
    const existing = projected.get(key);
    // A repeated head for the same source wins only when strictly fresher, so
    // one result cannot advertise a stale version for a source it also read.
    if (existing && existing.factVersion >= head.fact_version) continue;
    projected.set(key, {
      sourceKind: head.source_kind,
      sourceRef,
      factVersion: head.fact_version,
      lifecycleHead: head.lifecycle_head,
      visibilityHead: head.visibility_head,
    });
  }
  return [...projected.values()].sort(compareSourceHeads);
};

export const issueSnapshotRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  binding: {
    contractDigest: string;
    capabilityKey: string;
    capabilityVersion: string;
    scopeRef: string;
    snapshotAt: string;
  },
): string =>
  `${BOARD_PROJECTION_VERSION}.${createHmac("sha256", integrityKey)
    .update(
      [
        `nurture.board-snapshot.v${BOARD_PROJECTION_VERSION}`,
        scope.workspace_id,
        scope.participant_id,
        binding.contractDigest,
        binding.capabilityKey,
        binding.capabilityVersion,
        binding.scopeRef,
        binding.snapshotAt,
      ].join("\0"),
      "utf8",
    )
    .digest("hex")
    .slice(0, 32)}`;

/**
 * Scope-level heads a page set stays bound to. Source, authority, correction,
 * redaction or Grant drift all invalidate every cursor issued before them.
 * These are module-population heads, not per-page values: page two of the same
 * unchanged list must not look like drift.
 */
export type BoardDriftHeadsV1 = {
  source_head: string;
  authority_head: string;
  correction_head: string;
  redaction_head: string;
  grant_head: string;
};

export const computeDriftHead = (heads: BoardDriftHeadsV1): string =>
  createHmac("sha256", `nurture.board-drift.v${BOARD_PROJECTION_VERSION}`)
    .update(
      JSON.stringify([
        heads.source_head,
        heads.authority_head,
        heads.correction_head,
        heads.redaction_head,
        heads.grant_head,
      ]),
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);

// ---------------------------------------------------------------------------
// Cursor identity.

/**
 * Cursor identity binds the exact contract, capability, actor, scope, snapshot,
 * order and page size. `snapshot_at` travels with it so later pages are read as
 * of the instant the page set was opened.
 */
export type BoardCursorIdentityV1 = {
  contract_digest: string;
  capability_key: string;
  capability_version: string;
  query_key: string;
  scope_ref: string;
  order: string;
  page_size: number;
};

/**
 * The state a resumed page is checked against. `snapshot_version` and
 * `drift_head` are both compared by every caller; `snapshot_at` is what the
 * later pages are read as of; `sort_key` is the position. There is deliberately
 * no `snapshot_ref` here — it was carried and returned but never compared, so
 * it read as a check that did not exist.
 */
export type BoardCursorStateV1 = {
  snapshot_version: number;
  snapshot_at: string;
  drift_head: string;
  sort_key: BoardSortKeyV1;
};

export type BoardCursorBindingV1 = BoardCursorIdentityV1 & BoardCursorStateV1;

/**
 * The cursor is sealed, not merely signed. Its binding carries the position the
 * next page continues from — which for a class list is the child's own process
 * id and safe label, and for the publish queue is the process key that the
 * sealed `processRef` exists to hide. An earlier variant base64url-encoded the
 * binding, so any holder of a `nextCursor` could read all of it without a key.
 *
 * The key is derived from the integrity key and bound to the actor scope, so a
 * cursor issued for one participant cannot even be decrypted for another.
 */
const cursorKey = (integrityKey: string, scope: BoardScopeV1): Buffer =>
  createHash("sha256")
    .update(
      `nurture.board-cursor-key.v${BOARD_PROJECTION_VERSION}\0${integrityKey}\0${scope.workspace_id}\0${scope.participant_id}`,
      "utf8",
    )
    .digest();

const CURSOR_IV_BYTES = 12;

export const issueBoardCursor = (
  integrityKey: string,
  scope: BoardScopeV1,
  binding: BoardCursorBindingV1,
  now: () => Date = () => new Date(),
): string => {
  const iv = randomBytes(CURSOR_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", cursorKey(integrityKey, scope), iv);
  const sealed = Buffer.concat([
    cipher.update(JSON.stringify({ ...binding, issued_at: now().toISOString() }), "utf8"),
    cipher.final(),
  ]);
  const payload = Buffer.concat([iv, sealed]).toString("base64url");
  return `${payload}.${cipher.getAuthTag().toString("base64url")}`;
};

/**
 * Resolves the identity half of a cursor. Everything knowable before the read —
 * contract, capability, query, actor/scope binding, order and page size — must
 * match exactly; the caller then re-checks the returned snapshot and drift head
 * against the current read. Any mismatch is `refresh_required`, never a page
 * stitched across two versions.
 */
export const resolveBoardCursor = (
  integrityKey: string,
  scope: BoardScopeV1,
  expected: BoardCursorIdentityV1,
  token: string,
  now: () => Date = () => new Date(),
): BoardCursorStateV1 | null => {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = Buffer.from(token.slice(0, separator), "base64url");
  if (payload.length <= CURSOR_IV_BYTES) return null;
  let cursor: BoardCursorBindingV1 & { issued_at?: unknown };
  try {
    // GCM authenticates as it decrypts: a tampered or foreign cursor throws
    // here rather than yielding a binding the caller then has to distrust.
    const decipher = createDecipheriv(
      "aes-256-gcm",
      cursorKey(integrityKey, scope),
      payload.subarray(0, CURSOR_IV_BYTES),
    );
    decipher.setAuthTag(Buffer.from(token.slice(separator + 1), "base64url"));
    cursor = JSON.parse(
      Buffer.concat([
        decipher.update(payload.subarray(CURSOR_IV_BYTES)),
        decipher.final(),
      ]).toString("utf8"),
    );
  } catch {
    return null;
  }
  if (
    typeof cursor !== "object" ||
    cursor === null ||
    typeof cursor.issued_at !== "string" ||
    new Date(cursor.issued_at).getTime() + CURSOR_TTL_MS <= now().getTime()
  ) {
    return null;
  }
  for (const field of [
    "contract_digest",
    "capability_key",
    "capability_version",
    "query_key",
    "scope_ref",
    "order",
  ] as const) {
    if (cursor[field] !== expected[field]) return null;
  }
  if (cursor.page_size !== expected.page_size) return null;
  const sortKey = cursor.sort_key;
  if (
    !Number.isSafeInteger(cursor.snapshot_version) ||
    typeof cursor.snapshot_at !== "string" ||
    typeof cursor.drift_head !== "string" ||
    !sortKey ||
    typeof sortKey.occurred_at !== "string" ||
    typeof sortKey.id !== "string" ||
    (sortKey.rank !== undefined && typeof sortKey.rank !== "string")
  ) {
    return null;
  }
  return {
    snapshot_version: cursor.snapshot_version,
    snapshot_at: cursor.snapshot_at,
    drift_head: cursor.drift_head,
    sort_key: {
      ...(sortKey.rank === undefined ? {} : { rank: sortKey.rank }),
      occurred_at: sortKey.occurred_at,
      id: sortKey.id,
    },
  };
};

export const parseBoardPageSize = (value: unknown): number | null => {
  if (value === undefined) return DEFAULT_PAGE_SIZE;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > MAX_PAGE_SIZE
  ) {
    return null;
  }
  return value;
};

// ---------------------------------------------------------------------------
// Row-level authority predicates.

/**
 * Guardian reads require current family Guardian authority, the exact
 * child/family association and the original Enrollment/Grant/fact visibility
 * and purpose for every returned fact. Routing identifiers alone are never
 * permission.
 */
export type GuardianFactAuthorityV1 = {
  guardian_authority_current: boolean;
  child_association_exact: boolean;
  enrollment_visible: boolean;
  grant_visible: boolean;
  purpose_allowed: boolean;
};

export const guardianFactVisible = (authority: GuardianFactAuthorityV1): boolean =>
  authority.guardian_authority_current &&
  authority.child_association_exact &&
  authority.enrollment_visible &&
  authority.grant_visible &&
  authority.purpose_allowed;

export const CAREGIVER_BOARD_ROLES: readonly string[] = ["caregiver", "lead_caregiver"];

/**
 * Caregiver reads and writes require a current `caregiver | lead_caregiver`
 * RoleAssignment whose own scope is the exact source CareGroup. An
 * Institution-scoped Lead designation, an Admin role, Institution membership or
 * a same-Institution role in another CareGroup is insufficient.
 */
export type CaregiverFactAuthorityV1 = NurtureCaregiverWriteAuthority & {
  fact_visible: boolean;
  purpose_allowed: boolean;
};

export const caregiverFactVisible = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current &&
  authority.fact_visible &&
  authority.purpose_allowed;

// ---------------------------------------------------------------------------
// Owner-eligibility action projection.

/**
 * Turns current owner eligibility into public action refs. This is the single
 * constructor available to the board queries and presenters: without an owner
 * grant there is no action, whatever the role, module or previous answer said.
 */
export const projectOwnerActions = (
  integrityKey: string,
  scope: BoardScopeV1,
  grants: readonly OwnerEligibilityGrantV1[],
): BoardActionRefV1[] =>
  grants.map((grant) => ({
    capabilityKey: grant.capability_key,
    capabilityVersion: grant.capability_version,
    ...(grant.target_option_id && grant.target_kind
      ? {
          targetOptionRef: issueBoardSealedRef(
            integrityKey,
            scope,
            grant.target_kind,
            grant.target_option_id,
          ),
        }
      : {}),
    availability: grant.availability,
  }));

// ---------------------------------------------------------------------------
// Paged source scanning.

export type BoardSourcePage<Row> = {
  rows: Row[];
  has_more: boolean;
};

/**
 * Scans the canonical source until the page is filled or the source closes.
 *
 * Paging is driven by scanned source records, never by projected rows: a fact
 * the role may not see is dropped without shortening the page or terminating
 * paging early, and the continuation key is the last row actually consumed —
 * not the end of the last fetched batch. A fixed `take` would silently return a
 * short page whenever fact-level policy removed rows.
 */
export const scanBoardPage = async <Row, Projected>(input: {
  pageSize: number;
  before?: BoardSortKeyV1;
  read: (request: {
    take: number;
    before?: BoardSortKeyV1;
  }) => Promise<BoardSourcePage<Row>>;
  sortKey: (row: Row) => BoardSortKeyV1;
  project: (row: Row) => Projected | null;
}): Promise<{
  items: Projected[];
  hasMore: boolean;
  tail?: BoardSortKeyV1;
}> => {
  const items: Projected[] = [];
  let before = input.before;
  let tail: BoardSortKeyV1 | undefined;
  let hasMore = false;
  let emptyRounds = 0;

  for (;;) {
    const page = await input.read({
      take: input.pageSize,
      ...(before ? { before } : {}),
    });
    hasMore = page.has_more;
    if (page.rows.length === 0) {
      emptyRounds += 1;
      if (!hasMore || emptyRounds > MAX_EMPTY_SCAN_ROUNDS) break;
      continue;
    }
    emptyRounds = 0;

    let consumed = 0;
    let filled = false;
    for (const row of page.rows) {
      consumed += 1;
      const projected = input.project(row);
      if (projected !== null) items.push(projected);
      if (items.length === input.pageSize) {
        filled = true;
        break;
      }
    }
    const lastConsumed = page.rows[consumed - 1];
    if (lastConsumed !== undefined) tail = input.sortKey(lastConsumed);

    if (filled) {
      hasMore = consumed < page.rows.length || page.has_more;
      break;
    }
    if (!page.has_more) break;
    before = tail;
  }

  return {
    items,
    hasMore,
    ...(tail ? { tail } : {}),
  };
};

export const buildPageInfo = (
  integrityKey: string,
  scope: BoardScopeV1,
  identity: BoardCursorIdentityV1,
  state: Omit<BoardCursorStateV1, "sort_key">,
  page: { hasMore: boolean; tail?: BoardSortKeyV1 },
  now?: () => Date,
): BoardPageInfoV1 => ({
  hasMore: page.hasMore,
  ...(page.hasMore && page.tail
    ? {
        nextCursor: issueBoardCursor(
          integrityKey,
          scope,
          { ...identity, ...state, sort_key: page.tail },
          now,
        ),
      }
    : {}),
});
