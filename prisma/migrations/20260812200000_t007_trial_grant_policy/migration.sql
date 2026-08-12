-- T-007 G4-D I4-B: canonical exact-Institution trial Grant policy owner.
-- The production current-owner derivation fails closed when no single current
-- row exists; Host evidence never supplies these Nurture business terms.

CREATE TABLE "nurture_enrollment_trial_grant_policy" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "contract_version" TEXT NOT NULL,
    "policy_ref" TEXT NOT NULL,
    "policy_revision" INTEGER NOT NULL,
    "directions" "NurtureGrantDirection"[],
    "data_classes" "NurtureGrantDataClass"[],
    "purposes" TEXT[],
    "effective_from" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "superseded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_enrollment_trial_grant_policy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nurture_trial_grant_policy_revision"
  ON "nurture_enrollment_trial_grant_policy"
  ("workspace_id", "institution_id", "policy_ref", "policy_revision");

CREATE INDEX "ix_nurture_trial_grant_policy_effective"
  ON "nurture_enrollment_trial_grant_policy"
  ("workspace_id", "institution_id", "effective_from", "expires_at", "superseded_at");

-- Only one unsuperseded owner may exist for an Institution. Future scheduling
-- is deliberately absent in v1; rotation supersedes the old row first.
CREATE UNIQUE INDEX "uq_nurture_trial_grant_policy_current"
  ON "nurture_enrollment_trial_grant_policy" ("workspace_id", "institution_id")
  WHERE "superseded_at" IS NULL;

ALTER TABLE "nurture_enrollment_trial_grant_policy"
  ADD CONSTRAINT "nurture_trial_grant_policy_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_enrollment_trial_grant_policy"
  ADD CONSTRAINT "ck_nurture_trial_grant_policy_contract" CHECK (
    "contract_version" = '1.0.0'
    AND "policy_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND "policy_revision" >= 1
    AND "directions" = ARRAY[
      'family_to_org'::"NurtureGrantDirection",
      'org_to_family'::"NurtureGrantDirection"
    ]
    AND cardinality("data_classes") BETWEEN 1 AND 7
    AND cardinality("purposes") BETWEEN 1 AND 16
    AND array_to_string("purposes", ',')
      ~ '^[a-z][a-z0-9_:-]{0,99}(,[a-z][a-z0-9_:-]{0,99})*$'
    AND "effective_from" < "expires_at"
    AND ("superseded_at" IS NULL OR "superseded_at" >= "effective_from")
  );

CREATE FUNCTION "enforce_nurture_trial_grant_policy_immutability"()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'nurture trial Grant policy row cannot be deleted';
  END IF;
  IF OLD."superseded_at" IS NOT NULL
    OR NEW."superseded_at" IS NULL
    OR NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."contract_version" IS DISTINCT FROM OLD."contract_version"
    OR NEW."policy_ref" IS DISTINCT FROM OLD."policy_ref"
    OR NEW."policy_revision" IS DISTINCT FROM OLD."policy_revision"
    OR NEW."directions" IS DISTINCT FROM OLD."directions"
    OR NEW."data_classes" IS DISTINCT FROM OLD."data_classes"
    OR NEW."purposes" IS DISTINCT FROM OLD."purposes"
    OR NEW."effective_from" IS DISTINCT FROM OLD."effective_from"
    OR NEW."expires_at" IS DISTINCT FROM OLD."expires_at"
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
  THEN
    RAISE EXCEPTION 'nurture trial Grant policy row is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_nurture_trial_grant_policy_immutable"
BEFORE UPDATE OR DELETE ON "nurture_enrollment_trial_grant_policy"
FOR EACH ROW EXECUTE FUNCTION "enforce_nurture_trial_grant_policy_immutability"();
