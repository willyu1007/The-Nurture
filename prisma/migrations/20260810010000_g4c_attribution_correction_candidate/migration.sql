-- G4-C 0D-4 — non-canonical child-attribution correction candidates.
--
-- An Institution Admin can report that one exact attribution revision looks
-- wrong. This row never becomes an attribution and has no mutable lifecycle;
-- a current exact caregiver acts, if appropriate, through T-006's existing
-- append-only canonical attribution owner.

CREATE TABLE "nurture_attribution_correction_candidate" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_attribution_id" TEXT NOT NULL,
    "raised_by_role_assignment_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "command_request_id_hash" CHAR(64) NOT NULL,
    "contract_version" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_attribution_correction_candidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nurture_attribution_correction_request"
  ON "nurture_attribution_correction_candidate" ("workspace_id", "command_request_id_hash");

CREATE INDEX "ix_nurture_attribution_correction_source"
  ON "nurture_attribution_correction_candidate"
  ("workspace_id", "source_attribution_id", "occurred_at");

CREATE INDEX "ix_nurture_attribution_correction_actor"
  ON "nurture_attribution_correction_candidate"
  ("workspace_id", "raised_by_role_assignment_id", "occurred_at");

ALTER TABLE "nurture_attribution_correction_candidate"
ADD CONSTRAINT "ck_nurture_attribution_correction_contract"
CHECK (
  length(btrim("reason")) > 0
  AND length("reason") <= 1000
  AND "contract_version" = '1.0.0'
  AND "command_request_id_hash" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "nurture_attribution_correction_candidate"
ADD CONSTRAINT "nurture_attribution_correction_candidate_source_attributio_fkey"
FOREIGN KEY ("source_attribution_id") REFERENCES "nurture_child_media_attribution"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_attribution_correction_candidate"
ADD CONSTRAINT "nurture_attribution_correction_candidate_raised_by_role_as_fkey"
FOREIGN KEY ("raised_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- The foreign keys name exact owner rows; this trigger additionally prevents
-- a direct SQL writer from composing a candidate across Workspaces.
CREATE FUNCTION "nurture_attribution_correction_validate_owner_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "nurture_child_media_attribution"
    WHERE "id" = NEW."source_attribution_id"
      AND "workspace_id" = NEW."workspace_id"
  ) OR NOT EXISTS (
    SELECT 1 FROM "nurture_care_role_assignment"
    WHERE "id" = NEW."raised_by_role_assignment_id"
      AND "workspace_id" = NEW."workspace_id"
  ) THEN
    RAISE EXCEPTION 'nurture attribution correction owner scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_attribution_correction_validate_owner_scope"
BEFORE INSERT ON "nurture_attribution_correction_candidate"
FOR EACH ROW EXECUTE FUNCTION "nurture_attribution_correction_validate_owner_scope"();

-- A candidate has no lifecycle. A later caregiver action appends to the
-- canonical T-006 attribution chain and does not update this report.
CREATE FUNCTION "nurture_attribution_correction_reject_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'nurture attribution correction candidates are append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "trg_nurture_attribution_correction_reject_mutation"
BEFORE UPDATE OR DELETE ON "nurture_attribution_correction_candidate"
FOR EACH ROW EXECUTE FUNCTION "nurture_attribution_correction_reject_mutation"();
