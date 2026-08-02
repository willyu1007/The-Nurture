import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Owner-side support for the G3-A board read ports.
 *
 * The board is a derived projection, so the owner never stores a board row. Its
 * only job here is to answer, per read, "what did this scope look like at
 * `snapshot_at`, and what would make that answer stale". Both halves are
 * computed from the fact tables themselves; nothing is cached and nothing is
 * written.
 */
export type BoardPrisma = PrismaClient | Prisma.TransactionClient;

/** Short, stable digest over an ordered list of census parts. */
export const boardHead = (label: string, parts: Array<string | number | null>): string =>
  createHash("sha256")
    .update(`nurture.board-head.v1\0${label}\0${JSON.stringify(parts)}`, "utf8")
    .digest("hex")
    .slice(0, 32);

/**
 * A census is `(row count, newest update)`. Any insert, update or soft delete
 * moves at least one of the two, so a head built from it goes stale exactly
 * when the underlying set does — without reading the rows themselves.
 */
export type BoardCensus = { count: number; newest: string };

export const censusOfTimes = (times: Date[]): BoardCensus => ({
  count: times.length,
  newest: times.reduce(
    (newest, time) => (time.toISOString() > newest ? time.toISOString() : newest),
    "",
  ),
});

export const censusOf = (rows: Array<{ updatedAt: Date }>): BoardCensus =>
  censusOfTimes(rows.map((row) => row.updatedAt));

/**
 * The same census taken by the database. A scope-level head must not depend on
 * loading every row it summarises: a busy class would pull its whole daily-care
 * history on every board read.
 */
export const aggregateCensus = async (
  aggregate: (args: {
    _count: { _all: true };
    _max: { updatedAt: true };
  }) => Promise<{ _count: { _all: number }; _max: { updatedAt: Date | null } }>,
): Promise<BoardCensus> => {
  const result = await aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  return {
    count: result._count._all,
    newest: result._max.updatedAt?.toISOString() ?? "",
  };
};

export const censusHead = (label: string, census: BoardCensus): string =>
  boardHead(label, [census.count, census.newest]);

/**
 * A role assignment counts only while it is active *and* inside its own
 * validity window at the read instant. A row that has not started or has ended
 * is not authority, whatever its status column says.
 */
export const activeRoleWindow = (at: Date) => ({
  status: "active" as const,
  deletedAt: null,
  OR: [{ startsAt: null }, { startsAt: { lte: at } }],
  AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: at } }] }],
});

/** The scope's highest observed fact version. Versions only ever increase. */
export const highestVersion = (...groups: Array<Array<{ aggregateVersion: number }>>): number => {
  let highest = 0;
  for (const rows of groups) {
    for (const row of rows) {
      if (row.aggregateVersion > highest) highest = row.aggregateVersion;
    }
  }
  return highest;
};

/**
 * Lifecycle and visibility heads for one source aggregate. Lifecycle covers
 * "does this fact still exist in this state"; visibility covers "may this actor
 * still see it", which is why the Grant census is folded into it — a revoked
 * Grant has to invalidate an open page even though the fact itself is untouched.
 */
export const sourceHeadPair = (
  label: string,
  lifecycle: Array<string | number | null>,
  visibility: BoardCensus,
): { lifecycle_head: string; visibility_head: string } => ({
  lifecycle_head: boardHead(`${label}.lifecycle`, lifecycle),
  visibility_head: censusHead(`${label}.visibility`, visibility),
});

/**
 * The one canonical reading of `mediaCompositionPayload`. Both the media lane
 * and the release lane consume this column, and a second reader that disagreed
 * about the shape would let one lane see media the other cannot.
 *
 * A malformed payload contributes nothing rather than a partial set: a partial
 * composition would silently release a card the owner cannot fully account for.
 */
export type ComposedMediaV1 = { media_asset_id: string; media_revision: number };

export const readMediaComposition = (payload: unknown): ComposedMediaV1[] => {
  if (typeof payload !== "object" || payload === null) return [];
  const entries = (payload as { media?: unknown }).media;
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as { mediaAssetId?: unknown; mediaRevision?: unknown };
    return typeof record.mediaAssetId === "string" && Number.isSafeInteger(record.mediaRevision)
      ? [{ media_asset_id: record.mediaAssetId, media_revision: record.mediaRevision as number }]
      : [];
  });
};

/**
 * The caregiver lanes all answer the same question — which CareGroup does this
 * participant currently hold — so they answer it in one place. An assignment
 * scoped to the institution or to a sibling class is deliberately not widened
 * here; a board that widened it would show one class another class's children.
 */
export type CaregiverReachV1 = {
  care_group_id: string;
  care_group_label: string;
  institution_id: string;
  role: string;
  role_assignment_id: string;
  role_version: number;
  care_group_version: number;
};

const CAREGIVER_BOARD_ROLES = ["caregiver", "lead_caregiver"] as const;

export const resolveCaregiverReach = async (
  prisma: BoardPrisma,
  workspaceId: string,
  participantId: string,
  at: Date,
): Promise<CaregiverReachV1 | null> => {
  const participant = await prisma.nurtureParticipant.findFirst({
    where: { id: participantId, workspaceId, status: "active", deletedAt: null },
  });
  if (!participant) return null;
  const roles = await prisma.nurtureCareRoleAssignment.findMany({
    where: {
      workspaceId,
      participantId,
      role: { in: [...CAREGIVER_BOARD_ROLES] },
      scopeType: "care_group",
      ...activeRoleWindow(at),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  for (const role of roles) {
    const group = await prisma.nurtureCareGroup.findFirst({
      where: { id: role.scopeId, workspaceId, status: "active", deletedAt: null },
    });
    if (!group) continue;
    return {
      care_group_id: group.id,
      care_group_label: group.name,
      institution_id: group.institutionId,
      role: role.role,
      role_assignment_id: role.id,
      role_version: role.aggregateVersion,
      care_group_version: group.aggregateVersion,
    };
  }
  return null;
};

/** The authority every caregiver-lane row carries, measured against its source. */
export const caregiverRowAuthority = (
  reach: CaregiverReachV1,
  sourceCareGroupId: string | null,
) => ({
  role: reach.role,
  role_scope_type: "care_group",
  role_scope_matches_source: sourceCareGroupId === reach.care_group_id,
  role_assignment_current: true,
  fact_visible: true,
  purpose_allowed: true,
});
