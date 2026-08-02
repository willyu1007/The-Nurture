#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the G2 Exit database census.");
}

const prisma = new PrismaClient();

try {
  const [itemWriters, messageWriters] = await Promise.all([
    prisma.$queryRaw`
      SELECT writer_contract::text AS writer_contract, COUNT(*)::int AS count
      FROM nurture_family_care_item
      GROUP BY writer_contract
      ORDER BY writer_contract
    `,
    prisma.$queryRaw`
      SELECT writer_contract::text AS writer_contract, COUNT(*)::int AS count
      FROM nurture_family_care_message
      GROUP BY writer_contract
      ORDER BY writer_contract
    `,
  ]);

  assertWriterPopulation(itemWriters, "item");
  assertWriterPopulation(messageWriters, "message");

  const violations = await prisma.$queryRaw`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM nurture_family_care_message
        WHERE writer_contract = 'harness_g2_v1'
          AND status <> 'redacted'
          AND (
            body IS NOT NULL
            OR body_storage_mode <> 'encrypted'
            OR body_protection_payload IS NULL
          )
      ) AS active_protected_storage,
      (
        SELECT COUNT(*)::int
        FROM nurture_family_care_message
        WHERE writer_contract = 'harness_g2_v1'
          AND status = 'redacted'
          AND (
            body IS NOT NULL
            OR body_storage_mode <> 'redacted'
            OR body_protection_payload IS NOT NULL
          )
      ) AS redacted_erasure,
      (
        SELECT COUNT(*)::int
        FROM nurture_family_care_item
        WHERE writer_contract = 'harness_g2_v1'
          AND (
            source_message_id IS NULL
            OR enrollment_id IS NULL
            OR care_group_id IS NULL
            OR grant_id IS NULL
          )
      ) AS item_scope,
      (
        SELECT COUNT(*)::int
        FROM nurture_family_care_message
        WHERE writer_contract = 'harness_g2_v1'
          AND (
            enrollment_id IS NULL
            OR care_group_id IS NULL
            OR grant_id IS NULL
            OR direction IS NULL
          )
      ) AS message_scope,
      (
        SELECT COUNT(*)::int
        FROM nurture_family_care_message
        WHERE writer_contract = 'harness_g2_v1'
          AND message_kind = 'caregiver_reply'
          AND reply_order_key IS NULL
      ) AS reply_order
  `;

  const row = violations[0];
  if (!row) throw new Error("G2 Exit database census returned no result.");
  for (const [key, count] of Object.entries(row)) {
    if (count !== 0) {
      throw new Error(`G2 Exit database census ${key}: expected 0, received ${count}`);
    }
  }

  process.stdout.write(
    `[ok] G2 Exit DB census items=${formatWriters(itemWriters)} ` +
      `messages=${formatWriters(messageWriters)} violations=0\n`,
  );
} finally {
  await prisma.$disconnect();
}

function assertWriterPopulation(rows, label) {
  const population = new Map(
    rows.map((row) => [row.writer_contract, row.count]),
  );
  for (const writer of ["harness_g2_v1", "legacy_v1"]) {
    if (!Number.isInteger(population.get(writer)) || population.get(writer) < 1) {
      throw new Error(
        `G2 Exit ${label} census requires a non-empty ${writer} test population.`,
      );
    }
  }
  if ((population.get("legacy_migrated_v1") ?? 0) !== 0) {
    throw new Error(
      `G2 Exit ${label} census found an unqualified legacy_migrated_v1 row.`,
    );
  }
}

function formatWriters(rows) {
  return rows
    .map((row) => `${row.writer_contract}:${row.count}`)
    .join(",");
}
