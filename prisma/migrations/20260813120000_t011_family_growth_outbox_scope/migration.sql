-- T-011 W5 N3: strengthen family-growth provider-outbox tenant and lineage
-- scope without removing the original single-column foreign keys.
-- Preview only: this migration is intentionally not applied by this task.

-- Keep the populated-data validation fail-closed: if any stronger FK rejects
-- legacy data, none of the preceding indexes/constraints remain partially
-- installed and Prisma records the migration as failed.
BEGIN;

-- Composite FK targets. Each is implied-unique by an existing primary key or
-- single-column unique constraint, so creation cannot fail on duplicate data.
CREATE UNIQUE INDEX "uq_nurture_publication_release_workspace_id"
  ON "nurture_publication_release"("workspace_id", "id");

CREATE UNIQUE INDEX "uq_nurture_visibility_event_workspace_release_id"
  ON "nurture_publication_visibility_event"("workspace_id", "publication_release_id", "id");

CREATE UNIQUE INDEX "uq_nurture_family_growth_outbox_workspace_id"
  ON "nurture_family_growth_outbox_event"("workspace_id", "id");

-- Prisma's one-to-one relation validator requires the complete source tuple
-- to be unique. The existing global visibility_event_id unique remains too.
CREATE UNIQUE INDEX "uq_nurture_family_growth_outbox_workspace_visibility"
  ON "nurture_family_growth_outbox_event"("workspace_id", "publication_release_id", "visibility_event_id");

-- Additive stronger constraints. The original id-only foreign keys are kept;
-- no constraint is dropped or rewritten in this migration.
ALTER TABLE "nurture_family_growth_outbox_event"
  ADD CONSTRAINT "fk_nurture_fg_outbox_workspace_release"
  FOREIGN KEY ("workspace_id", "publication_release_id")
  REFERENCES "nurture_publication_release"("workspace_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_growth_outbox_event"
  ADD CONSTRAINT "fk_nurture_fg_outbox_workspace_release_visibility"
  FOREIGN KEY ("workspace_id", "publication_release_id", "visibility_event_id")
  REFERENCES "nurture_publication_visibility_event"("workspace_id", "publication_release_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_growth_admission_receipt"
  ADD CONSTRAINT "fk_nurture_fg_receipt_workspace_outbox"
  FOREIGN KEY ("workspace_id", "outbox_event_id")
  REFERENCES "nurture_family_growth_outbox_event"("workspace_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
