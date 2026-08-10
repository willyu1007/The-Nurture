-- G4-E increment 3 — immutable Institution Knowledge conflict-review input.
-- Authored only in this node; no database is contacted or mutated here.
-- The row is not a source, hold, decision, deadline or second review lifecycle.

CREATE TABLE "nurture_institution_knowledge_conflict_review_candidate" (
  "id" TEXT NOT NULL,
  "candidate_ref" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "candidate_identity_hash" CHAR(64) NOT NULL,
  "rule_set_ref" TEXT NOT NULL,
  "rule_version" TEXT NOT NULL,
  "conflict_class" TEXT NOT NULL,
  "finding_fingerprint" CHAR(64) NOT NULL,
  "source_tuples" JSONB NOT NULL,
  "targeted_nurture_revision_refs" TEXT[] NOT NULL,
  "evidence_mode" TEXT NOT NULL,
  "evidence_envelope" JSONB NOT NULL,
  "command_execution_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_knowledge_conflict_candidate_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_knowledge_conflict_scalar_contract" CHECK (
    "candidate_ref" = 'institution-knowledge-conflict-' || "candidate_identity_hash"
    AND "candidate_identity_hash" ~ '^[0-9a-f]{64}$'
    AND "finding_fingerprint" ~ '^[0-9a-f]{64}$'
    AND "rule_set_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND "rule_version" ~ '^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$'
    AND "conflict_class" IN (
      'contradictory_action',
      'contradictory_sequence',
      'contradictory_escalation',
      'contraindication_conflict'
    )
    AND "evidence_mode" = 'none'
  ),
  CONSTRAINT "ck_nurture_knowledge_conflict_evidence_envelope" CHECK (
    "nurture_jsonb_has_exact_keys"(
      "evidence_envelope",
      ARRAY['algVersion', 'keyRef', 'ciphertext', 'integrityTag']
    )
    AND "evidence_envelope" -> 'algVersion' = '1'::JSONB
    AND "evidence_envelope" ->> 'keyRef'
      ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$'
    AND "evidence_envelope" ->> 'ciphertext' ~ '^[A-Za-z0-9_-]+$'
    AND length("evidence_envelope" ->> 'ciphertext') <= 32768
    AND "evidence_envelope" ->> 'integrityTag' ~ '^[A-Za-z0-9_-]+$'
    AND length("evidence_envelope" ->> 'integrityTag') <= 64
  )
);

CREATE FUNCTION "nurture_knowledge_conflict_source_tuples_are_valid"(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN jsonb_typeof(value) <> 'array' THEN FALSE
    ELSE COALESCE(
      jsonb_array_length(value) BETWEEN 2 AND 8
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(value) AS source
          WHERE NOT "nurture_jsonb_has_exact_keys"(
            source,
            ARRAY['source_ref', 'source_version', 'content_hash']
          )
            OR NOT "nurture_knowledge_source_ref_is_valid"(source -> 'source_ref')
            OR source ->> 'source_version'
              !~ '^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$'
            OR source ->> 'content_hash' !~ '^[0-9a-f]{64}$'
        )
        AND jsonb_array_length(value) = (
          SELECT count(DISTINCT source)
          FROM jsonb_array_elements(value) AS source
        ),
      FALSE
    )
  END;
$$;

CREATE FUNCTION "nurture_knowledge_conflict_revision_refs_are_valid"(value TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    cardinality(value) BETWEEN 0 AND 8
      AND NOT EXISTS (
        SELECT 1 FROM unnest(value) AS revision_ref
        WHERE revision_ref !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
      )
      AND cardinality(value) = (
        SELECT count(DISTINCT revision_ref) FROM unnest(value) AS revision_ref
      ),
    FALSE
  );
$$;

ALTER TABLE "nurture_institution_knowledge_conflict_review_candidate"
  ADD CONSTRAINT "ck_nurture_knowledge_conflict_sources" CHECK (
    "nurture_knowledge_conflict_source_tuples_are_valid"("source_tuples")
    AND "nurture_knowledge_conflict_revision_refs_are_valid"(
      "targeted_nurture_revision_refs"
    )
  );

CREATE UNIQUE INDEX "uq_nurture_knowledge_conflict_candidate_ref"
  ON "nurture_institution_knowledge_conflict_review_candidate" ("candidate_ref");
CREATE UNIQUE INDEX "uq_nurture_knowledge_conflict_execution"
  ON "nurture_institution_knowledge_conflict_review_candidate" ("command_execution_id");
CREATE UNIQUE INDEX "uq_nurture_knowledge_conflict_identity"
  ON "nurture_institution_knowledge_conflict_review_candidate"
  ("workspace_id", "institution_id", "candidate_identity_hash");
CREATE INDEX "ix_nurture_knowledge_conflict_created"
  ON "nurture_institution_knowledge_conflict_review_candidate"
  ("workspace_id", "institution_id", "created_at");

ALTER TABLE "nurture_institution_knowledge_conflict_review_candidate"
  ADD CONSTRAINT "nurture_knowledge_conflict_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_conflict_execution_id_fkey"
  FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "trg_nurture_knowledge_conflict_append_only"
BEFORE UPDATE OR DELETE
ON "nurture_institution_knowledge_conflict_review_candidate"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_append_only"();

CREATE FUNCTION "nurture_knowledge_conflict_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_care_institution" institution
    JOIN "nurture_command_execution" execution
      ON execution."id" = NEW."command_execution_id"
    WHERE institution."id" = NEW."institution_id"
      AND institution."workspace_id" = NEW."workspace_id"
      AND institution."status" = 'active'
      AND institution."deleted_at" IS NULL
      AND execution."workspace_id" = NEW."workspace_id"
      AND execution."command_key" =
        'nurture.record_institution_knowledge_conflict_candidate'
      AND execution."command_scope" = 'institution_knowledge_conflict_review'
      AND execution."business_actor_ref" = 'institution-knowledge-answer-safety'
      AND execution."result_schema_version" = 1
      AND execution."committed_result_payload" ->> 'candidate_ref' = NEW."candidate_ref"
      AND execution."committed_result_payload" ->> 'candidate_identity_hash' =
        NEW."candidate_identity_hash"
  ) THEN
    RAISE EXCEPTION 'institution knowledge conflict candidate scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_knowledge_conflict_validate_scope"
BEFORE INSERT
ON "nurture_institution_knowledge_conflict_review_candidate"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_conflict_validate_scope"();
