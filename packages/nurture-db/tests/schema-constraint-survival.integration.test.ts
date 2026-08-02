import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";

// Every CHECK constraint the migration history declares must still exist in the
// database.
//
// This exists because one did not. The G3 delta replaced the legacy `status`
// column on `nurture_child_media_attribution`; `ALTER TABLE ... DROP COLUMN`
// silently drops every constraint that referenced the column, so
// `ck_nurture_media_attribution_confirmation` disappeared and nothing noticed.
// The repo's static guard kept passing because it greps the frozen baseline SQL
// rather than the live database — it certified a constraint that was gone.
//
// A migration may legitimately supersede a constraint, so supersession is
// allowed but must be declared here, with the migration that did it. Anything
// else is a regression.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Constraints deliberately replaced by a later migration. Each entry names its
 * successor so "superseded" stays a claim someone made on purpose rather than a
 * place to quietly file a constraint that broke.
 */
const SUPERSEDED: Record<string, string> = {
  ck_nurture_command_execution_n1:
    "replaced by ck_nurture_command_execution_handoff_v1 in 20260715070000_nurture_handoff_replay_seed_x4",
  ck_nurture_command_execution_handoff_v1:
    "replaced by ck_nurture_command_execution_handoff_v2 in 20260728160000_nurture_canonical_ref_v1",
};

const migrationsRoot = new URL("../../../prisma/migrations", import.meta.url).pathname;

const declaredConstraints = (): Map<string, string> => {
  const declared = new Map<string, string>();
  for (const entry of readdirSync(migrationsRoot, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!entry.isDirectory()) continue;
    const sql = readFileSync(path.join(migrationsRoot, entry.name, "migration.sql"), "utf8");
    for (const match of sql.matchAll(/ADD CONSTRAINT "(ck_[a-z0-9_]+)"/g)) {
      declared.set(match[1]!, entry.name);
    }
  }
  return declared;
};

describe("declared CHECK constraints survive the migration chain", () => {
  it("keeps every declared constraint alive unless it is explicitly superseded", async () => {
    const declared = declaredConstraints();
    expect(declared.size).toBeGreaterThan(10);

    const live = new Set(
      (
        await prisma.$queryRaw<{ conname: string }[]>`
          SELECT conname FROM pg_constraint WHERE contype = 'c' AND conname LIKE 'ck\\_%'
        `
      ).map((row) => row.conname),
    );

    const missing = [...declared.keys()]
      .filter((name) => !live.has(name) && !(name in SUPERSEDED))
      .sort();
    expect(
      missing,
      `declared in a migration but absent from the database: ${missing
        .map((name) => `${name} (${declared.get(name)})`)
        .join(", ")}`,
    ).toEqual([]);
  });

  it("does not let a superseded entry hide a constraint that is actually alive", async () => {
    const live = new Set(
      (
        await prisma.$queryRaw<{ conname: string }[]>`
          SELECT conname FROM pg_constraint WHERE contype = 'c' AND conname LIKE 'ck\\_%'
        `
      ).map((row) => row.conname),
    );
    // A stale exemption is how a real regression later goes unnoticed.
    expect([...Object.keys(SUPERSEDED)].filter((name) => live.has(name))).toEqual([]);
  });

  it("still enforces the confirmation completeness rule the G3 delta dropped", async () => {
    const workspaceId = crypto.randomUUID();
    const institution = await prisma.nurtureCareInstitution.create({
      data: { workspaceId, displayName: "Care Center", status: "active" },
    });
    const child = await prisma.nurtureChild.create({
      data: { workspaceId, displayName: "Child", status: "active" },
    });
    const process = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId, childId: child.id, status: "active" },
    });
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId,
        institutionId: institution.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: "k" },
        lifecycle: "ready",
      },
    });
    const base = {
      workspaceId,
      mediaAssetRefId: asset.id,
      childCareProcessId: process.id,
      source: "manual" as const,
    };

    // A confirmed attribution with no confirming role, timestamp or exposure
    // policy is exactly what the database accepted while the constraint was gone.
    await expect(
      prisma.nurtureChildMediaAttribution.create({
        data: { ...base, state: "confirmed", attributionRevision: 1 },
      }),
    ).rejects.toThrow(/ck_nurture_media_attribution_confirmation/);

    // The same row is refused when any one of the three is missing.
    for (const partial of [
      { confirmedAt: new Date(), exposurePolicyPayload: { audience: "own_family" } },
      { confirmedByRoleAssignmentId: null, exposurePolicyPayload: { audience: "own_family" } },
      { confirmedAt: new Date() },
    ]) {
      await expect(
        prisma.nurtureChildMediaAttribution.create({
          data: { ...base, state: "confirmed", attributionRevision: 2, ...partial },
        }),
      ).rejects.toThrow();
    }

    // A candidate carries no such obligation.
    const candidate = await prisma.nurtureChildMediaAttribution.create({
      data: { ...base, state: "candidate", attributionRevision: 1 },
    });
    expect(candidate.state).toBe("candidate");

    // And confidence stays bounded.
    await expect(
      prisma.nurtureChildMediaAttribution.create({
        data: { ...base, state: "candidate", attributionRevision: 2, confidence: 1.5 },
      }),
    ).rejects.toThrow(/ck_nurture_media_attribution_confirmation/);
  });
});
