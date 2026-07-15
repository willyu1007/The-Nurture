#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8');
const migrationPath = 'prisma/migrations/20260713150000_nurture_institution_n1_core/migration.sql';

const expectedTables = [
  'nurture_participant',
  'nurture_child',
  'nurture_child_care_process',
  'nurture_family',
  'nurture_care_institution',
  'nurture_care_group',
  'nurture_enrollment',
  'nurture_care_role_assignment',
  'nurture_child_link_grant',
  'nurture_child_link_receipt',
  'nurture_family_care_thread',
  'nurture_family_care_thread_participant',
  'nurture_family_care_message',
  'nurture_family_care_item',
  'nurture_family_care_item_event',
  'nurture_daily_care_log',
  'nurture_teacher_attention_item',
  'nurture_media_asset_ref',
  'nurture_child_media_attribution',
  'nurture_interaction_context',
  'nurture_command_execution',
];

const expectedPartialIndexes = [
  'uq_nurture_participant_active_user',
  'uq_nurture_child_process_active_child',
  'uq_nurture_family_active_process',
  'uq_nurture_care_group_active_name',
  'uq_nurture_enrollment_active_process_institution',
  'uq_nurture_role_assignment_active_scope',
  'uq_nurture_thread_active_private_scope',
];

const expectedChecks = [
  'ck_nurture_grant_scope',
  'ck_nurture_receipt_route_lifecycle',
  'ck_nurture_message_redaction',
  'ck_nurture_item_state',
  'ck_nurture_interaction_context',
  'ck_nurture_media_attribution_confirmation',
  'ck_nurture_command_execution_n1',
];

const [schema, migration, contextText, devHostSchema] = await Promise.all([
  read('prisma/schema.prisma'),
  read(migrationPath),
  read('docs/context/db/schema.json'),
  read('apps/backend/prisma/schema.prisma'),
]);
const context = JSON.parse(contextText);
const contextTables = new Set(context.tables.map((table) => table.dbName));

const failures = [];
for (const table of expectedTables) {
  if (!migration.includes(`CREATE TABLE "${table}"`)) failures.push(`migration missing table ${table}`);
  if (!contextTables.has(table)) failures.push(`DB context missing table ${table}`);
}
for (const index of expectedPartialIndexes) {
  const pattern = new RegExp(`CREATE UNIQUE INDEX "${index}"[\\s\\S]+?WHERE`, 'm');
  if (!pattern.test(migration)) failures.push(`migration missing partial unique index ${index}`);
}
for (const constraint of expectedChecks) {
  if (!migration.includes(`CONSTRAINT "${constraint}"`)) failures.push(`migration missing check ${constraint}`);
}

if (/\b(?:DROP|TRUNCATE)\b/i.test(migration)) failures.push('N1 migration is not additive');
if (/"workflow_/i.test(migration) || /^(?:model|enum) Workflow/m.test(schema)) {
  failures.push('production persistence contains My-Chat Workflow runtime state');
}
if (/^(?:model|enum) Nurture/m.test(devHostSchema) || /@@map\("nurture_/m.test(devHostSchema)) {
  failures.push('dev-host persistence contains Nurture business state');
}
if (!/handoffRequestSnapshotsPayload\s+Json/.test(schema)) {
  failures.push('Execution snapshot payload is not required JSON in Prisma');
}
if (!/"handoff_request_snapshots_payload"\s*=\s*'\[\]'::jsonb/.test(migration)) {
  failures.push('N1 database gate does not force explicit empty handoff snapshots');
}
if (!/"handoff_driver_ref"\s+IS NULL/.test(migration)) {
  failures.push('N1 database gate permits a persisted handoff driver');
}

if (failures.length > 0) throw new Error(`N1 schema contract violations:\n- ${failures.join('\n- ')}`);
process.stdout.write(
  `[ok] N1 schema contract tables=${expectedTables.length} partial-unique=${expectedPartialIndexes.length} checks=${expectedChecks.length}\n`,
);
