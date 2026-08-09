-- G4-C 0D-3 — append-only content revision/downscope owner.
--
-- This is not the T-006 publish-process revision lane. It records Admin
-- placement, visibility and institution-note decisions beside immutable
-- teacher originals. Placement's current projection advances in the same
-- transaction; visibility and notes have no mutable shadow column.

-- No legacy Admin projection may enter the new world without its required
-- audit row. This migration has no truthful previous value/actor/reason from
-- which to backfill one, so a non-empty legacy lane is an adoption decision,
-- not something migration SQL may invent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "nurture_activity_placement" WHERE "decided_by" = 'admin'
  ) THEN
    RAISE EXCEPTION 'untracked Admin placement requires explicit adoption before 0D-3';
  END IF;
END;
$$;

CREATE TYPE "NurtureContentRevisionSubjectKind" AS ENUM (
  'placement', 'visibility', 'institution_note'
);

CREATE TABLE "nurture_content_revision" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "subject_ref" TEXT NOT NULL,
    "subject_kind" "NurtureContentRevisionSubjectKind" NOT NULL,
    "previous_value" JSONB NOT NULL,
    "new_value" JSONB NOT NULL,
    "decided_by_before" "NurtureActivityPlacementDecidedBy",
    "actor_role_assignment_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supersedes_ref" TEXT,
    "revision_head" INTEGER NOT NULL,
    "command_request_id_hash" CHAR(64) NOT NULL,
    "contract_version" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_content_revision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nurture_content_revision_supersedes"
  ON "nurture_content_revision" ("supersedes_ref");

CREATE UNIQUE INDEX "uq_nurture_content_revision_head"
  ON "nurture_content_revision"
  ("workspace_id", "subject_kind", "subject_ref", "revision_head");

CREATE UNIQUE INDEX "uq_nurture_content_revision_request"
  ON "nurture_content_revision" ("workspace_id", "command_request_id_hash");

CREATE INDEX "ix_nurture_content_revision_subject"
  ON "nurture_content_revision"
  ("workspace_id", "subject_kind", "subject_ref", "occurred_at");

CREATE INDEX "ix_nurture_content_revision_actor"
  ON "nurture_content_revision"
  ("workspace_id", "actor_role_assignment_id", "occurred_at");

ALTER TABLE "nurture_content_revision"
ADD CONSTRAINT "ck_nurture_content_revision_head"
CHECK (
  ("revision_head" = 1 AND "supersedes_ref" IS NULL)
  OR ("revision_head" > 1 AND "supersedes_ref" IS NOT NULL)
);

ALTER TABLE "nurture_content_revision"
ADD CONSTRAINT "ck_nurture_content_revision_nonempty"
CHECK (
  length(btrim("subject_ref")) > 0
  AND length(btrim("reason")) > 0
  AND length("reason") <= 1000
  AND "contract_version" = '1.0.0'
  AND "command_request_id_hash" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "nurture_content_revision"
ADD CONSTRAINT "ck_nurture_content_revision_json_objects"
CHECK (
  jsonb_typeof("previous_value") = 'object'
  AND jsonb_typeof("new_value") = 'object'
);

ALTER TABLE "nurture_content_revision"
ADD CONSTRAINT "ck_nurture_content_revision_lane"
CHECK (
  (
    "subject_kind" = 'placement'
    AND "subject_ref" LIKE 'nurture:activity_placement:%'
    AND "decided_by_before" IS NOT NULL
  )
  OR (
    "subject_kind" IN ('visibility', 'institution_note')
    AND (
      "subject_ref" LIKE 'nurture:care_capture:%'
      OR "subject_ref" LIKE 'nurture:media_asset_ref:%'
    )
    AND "decided_by_before" IS NULL
  )
);

ALTER TABLE "nurture_content_revision"
ADD CONSTRAINT "nurture_content_revision_actor_role_assignment_id_fkey"
FOREIGN KEY ("actor_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_content_revision"
ADD CONSTRAINT "nurture_content_revision_supersedes_ref_fkey"
FOREIGN KEY ("supersedes_ref") REFERENCES "nurture_content_revision"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- A successor must continue the exact same lane, name the immediately prior
-- head and carry that row's new value as its own previous value. This closes
-- gaps and cross-subject supersession even for a writer outside Prisma.
CREATE FUNCTION "nurture_content_revision_validate_append"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior "nurture_content_revision"%ROWTYPE;
BEGIN
  IF NEW."revision_head" = 1 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO prior
  FROM "nurture_content_revision"
  WHERE "id" = NEW."supersedes_ref";

  IF NOT FOUND
    OR prior."workspace_id" <> NEW."workspace_id"
    OR prior."subject_kind" <> NEW."subject_kind"
    OR prior."subject_ref" <> NEW."subject_ref"
    OR prior."revision_head" + 1 <> NEW."revision_head"
    OR prior."new_value" <> NEW."previous_value"
  THEN
    RAISE EXCEPTION 'nurture content revision chain is not contiguous'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_content_revision_validate_append"
BEFORE INSERT ON "nurture_content_revision"
FOR EACH ROW EXECUTE FUNCTION "nurture_content_revision_validate_append"();

-- Mistakes are corrected by another append. No capability, ORM call or
-- maintenance path may silently rewrite/delete the audit fact.
CREATE FUNCTION "nurture_content_revision_reject_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'nurture content revisions are append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "trg_nurture_content_revision_reject_mutation"
BEFORE UPDATE OR DELETE ON "nurture_content_revision"
FOR EACH ROW EXECUTE FUNCTION "nurture_content_revision_reject_mutation"();
