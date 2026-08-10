-- G4-E increment 1 — private Institution Knowledge lifecycle/provenance.
-- This migration is authored but intentionally not applied in this node.
-- It adds no retrieval/index/model runtime, public Surface, child/family link,
-- Host outbox or second command/idempotency ledger.

CREATE TYPE "NurtureInstitutionKnowledgeCategory" AS ENUM (
  'child_communication_development',
  'daily_care_safety',
  'institution_policy',
  'activity_resource',
  'guardian_communication',
  'basic_health_first_aid'
);
CREATE TYPE "NurtureInstitutionKnowledgeSafetyClass" AS ENUM (
  'general_guidance', 'care_safety', 'basic_health_first_aid'
);
CREATE TYPE "NurtureInstitutionKnowledgeRevisionEventType" AS ENUM (
  'revision_created',
  'revision_superseded',
  'reviewed',
  'changes_requested',
  'published',
  'publication_superseded',
  'revoked'
);

CREATE TABLE "nurture_institution_knowledge_item" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "category" "NurtureInstitutionKnowledgeCategory" NOT NULL,
  "item_head" INTEGER NOT NULL,
  "latest_revision_id" TEXT,
  "current_published_revision_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_institution_knowledge_item_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_knowledge_item_head" CHECK ("item_head" >= 1)
);

CREATE TABLE "nurture_institution_knowledge_revision" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "revision_number" INTEGER NOT NULL,
  "body_envelope" JSONB NOT NULL,
  "content_hash" CHAR(64) NOT NULL,
  "intended_audiences" TEXT[] NOT NULL,
  "age_band_keys" TEXT[] NOT NULL,
  "scenario_keys" TEXT[] NOT NULL,
  "safety_class" "NurtureInstitutionKnowledgeSafetyClass" NOT NULL,
  "valid_from" TIMESTAMP(3),
  "valid_until" TIMESTAMP(3),
  "author_participant_id" TEXT NOT NULL,
  "author_role_assignment_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_institution_knowledge_revision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_knowledge_revision_scalar_contract" CHECK (
    "revision_number" >= 1
    AND "content_hash" ~ '^[0-9a-f]{64}$'
    AND ("valid_from" IS NULL OR "valid_until" IS NULL
      OR "valid_from" < "valid_until")
  ),
  CONSTRAINT "ck_nurture_knowledge_revision_body_envelope" CHECK (
    "nurture_jsonb_has_exact_keys"(
      "body_envelope",
      ARRAY['algVersion', 'keyRef', 'ciphertext', 'integrityTag']
    )
    AND "body_envelope" -> 'algVersion' = '1'::JSONB
    AND "body_envelope" ->> 'keyRef'
      ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$'
    AND "body_envelope" ->> 'ciphertext' ~ '^[A-Za-z0-9_-]+$'
    AND length("body_envelope" ->> 'ciphertext') <= 32768
    AND "body_envelope" ->> 'integrityTag' ~ '^[A-Za-z0-9_-]+$'
    AND length("body_envelope" ->> 'integrityTag') <= 64
  )
);

CREATE TABLE "nurture_institution_knowledge_authority_link" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "revision_id" TEXT NOT NULL,
  "authority_source_ref" JSONB NOT NULL,
  "source_ref_hash" CHAR(64) NOT NULL,
  "source_version" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "source_date" DATE NOT NULL,
  "deep_link" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "verified_at" TIMESTAMP(3) NOT NULL,
  "snapshot_hash" CHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_institution_knowledge_authority_link_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_knowledge_authority_link_contract" CHECK (
    "source_ref_hash" ~ '^[0-9a-f]{64}$'
    AND "snapshot_hash" ~ '^[0-9a-f]{64}$'
    AND "source_version" ~ '^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$'
    AND length(btrim("publisher")) BETWEEN 1 AND 200
    AND length(btrim("title")) BETWEEN 1 AND 300
    AND "deep_link" ~ '^https://'
    AND length("deep_link") BETWEEN 1 AND 2048
    AND length(btrim("excerpt")) BETWEEN 1 AND 1000
  )
);

CREATE TABLE "nurture_institution_knowledge_revision_event" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "revision_id" TEXT NOT NULL,
  "command_execution_id" TEXT NOT NULL,
  "event_type" "NurtureInstitutionKnowledgeRevisionEventType" NOT NULL,
  "item_head" INTEGER NOT NULL,
  "event_ordinal" INTEGER NOT NULL,
  "actor_participant_id" TEXT NOT NULL,
  "actor_role_assignment_id" TEXT NOT NULL,
  "reason_key" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_institution_knowledge_revision_event_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_knowledge_event_contract" CHECK (
    "item_head" >= 1
    AND "event_ordinal" BETWEEN 0 AND 1
    AND "reason_key" ~ '^[a-z][a-z0-9._:-]{0,99}$'
  )
);

CREATE INDEX "ix_nurture_knowledge_item_category"
  ON "nurture_institution_knowledge_item"
  ("workspace_id", "institution_id", "category", "updated_at");
CREATE UNIQUE INDEX "uq_nurture_knowledge_item_scope"
  ON "nurture_institution_knowledge_item"
  ("workspace_id", "id", "institution_id");
CREATE INDEX "ix_nurture_knowledge_revision_safety"
  ON "nurture_institution_knowledge_revision"
  ("workspace_id", "institution_id", "safety_class", "created_at");
CREATE UNIQUE INDEX "uq_nurture_knowledge_revision_number"
  ON "nurture_institution_knowledge_revision" ("item_id", "revision_number");
CREATE UNIQUE INDEX "uq_nurture_knowledge_revision_scope"
  ON "nurture_institution_knowledge_revision"
  ("workspace_id", "id", "item_id");
CREATE INDEX "ix_nurture_knowledge_link_source"
  ON "nurture_institution_knowledge_authority_link"
  ("workspace_id", "institution_id", "source_ref_hash");
CREATE UNIQUE INDEX "uq_nurture_knowledge_link_source"
  ON "nurture_institution_knowledge_authority_link"
  ("revision_id", "source_ref_hash", "source_version");
CREATE INDEX "ix_nurture_knowledge_event_occurred"
  ON "nurture_institution_knowledge_revision_event"
  ("workspace_id", "institution_id", "occurred_at");
CREATE INDEX "ix_nurture_knowledge_event_revision"
  ON "nurture_institution_knowledge_revision_event"
  ("revision_id", "item_head", "event_ordinal");
CREATE UNIQUE INDEX "uq_nurture_knowledge_event_head_ordinal"
  ON "nurture_institution_knowledge_revision_event"
  ("item_id", "item_head", "event_ordinal");
CREATE UNIQUE INDEX "uq_nurture_knowledge_event_execution_ordinal"
  ON "nurture_institution_knowledge_revision_event"
  ("command_execution_id", "event_ordinal");

ALTER TABLE "nurture_institution_knowledge_item"
  ADD CONSTRAINT "nurture_knowledge_item_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_knowledge_revision"
  ADD CONSTRAINT "nurture_knowledge_revision_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_revision_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "nurture_institution_knowledge_item"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_revision_author_id_fkey"
  FOREIGN KEY ("author_participant_id") REFERENCES "nurture_participant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_revision_author_role_id_fkey"
  FOREIGN KEY ("author_role_assignment_id")
  REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_knowledge_item"
  ADD CONSTRAINT "nurture_knowledge_item_latest_revision_id_fkey"
  FOREIGN KEY ("latest_revision_id")
  REFERENCES "nurture_institution_knowledge_revision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_item_published_revision_id_fkey"
  FOREIGN KEY ("current_published_revision_id")
  REFERENCES "nurture_institution_knowledge_revision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_knowledge_authority_link"
  ADD CONSTRAINT "nurture_knowledge_link_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_link_revision_id_fkey"
  FOREIGN KEY ("revision_id")
  REFERENCES "nurture_institution_knowledge_revision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_knowledge_revision_event"
  ADD CONSTRAINT "nurture_knowledge_event_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_event_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "nurture_institution_knowledge_item"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_event_revision_id_fkey"
  FOREIGN KEY ("revision_id")
  REFERENCES "nurture_institution_knowledge_revision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_event_execution_id_fkey"
  FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_event_actor_id_fkey"
  FOREIGN KEY ("actor_participant_id") REFERENCES "nurture_participant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_event_actor_role_id_fkey"
  FOREIGN KEY ("actor_role_assignment_id")
  REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "nurture_knowledge_text_set_is_valid"(
  value TEXT[], min_count INTEGER, max_count INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    cardinality(value) BETWEEN min_count AND max_count
      AND NOT EXISTS (
        SELECT 1 FROM unnest(value) AS entry
        WHERE entry !~ '^[a-z][a-z0-9._:-]{0,99}$'
      )
      AND cardinality(value) = (
        SELECT count(DISTINCT entry) FROM unnest(value) AS entry
      ),
    FALSE
  );
$$;

ALTER TABLE "nurture_institution_knowledge_revision"
  ADD CONSTRAINT "ck_nurture_knowledge_revision_sets" CHECK (
    "nurture_knowledge_text_set_is_valid"("intended_audiences", 1, 3)
    AND "intended_audiences" <@ ARRAY[
      'institution_admin', 'caregiver', 'guardian'
    ]::TEXT[]
    AND "nurture_knowledge_text_set_is_valid"("age_band_keys", 0, 16)
    AND "nurture_knowledge_text_set_is_valid"("scenario_keys", 0, 16)
  );

CREATE FUNCTION "nurture_knowledge_source_ref_is_valid"(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (
      "nurture_jsonb_has_exact_keys"(
        value,
        ARRAY['schema_version', 'namespace', 'object_type', 'object_id']
      )
      OR "nurture_jsonb_has_exact_keys"(
        value,
        ARRAY['schema_version', 'namespace', 'object_type', 'object_id', 'version']
      )
    )
    AND value -> 'schema_version' = '1'::JSONB
    AND value ->> 'namespace' ~ '^[a-z][a-z0-9._-]*$'
    AND value ->> 'object_type' ~ '^[a-z][a-z0-9._-]*$'
    AND value ->> 'object_id' ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND (NOT value ? 'version' OR (
      jsonb_typeof(value -> 'version') = 'number'
      AND value ->> 'version' ~ '^[1-9][0-9]*$'
    )),
    FALSE
  );
$$;

ALTER TABLE "nurture_institution_knowledge_authority_link"
  ADD CONSTRAINT "ck_nurture_knowledge_authority_source_ref" CHECK (
    "nurture_knowledge_source_ref_is_valid"("authority_source_ref")
  );

CREATE FUNCTION "nurture_knowledge_append_only"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'institution knowledge history is append-only'
    USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER "trg_nurture_knowledge_revision_append_only"
BEFORE UPDATE OR DELETE ON "nurture_institution_knowledge_revision"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_append_only"();
CREATE TRIGGER "trg_nurture_knowledge_link_append_only"
BEFORE UPDATE OR DELETE ON "nurture_institution_knowledge_authority_link"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_append_only"();
CREATE TRIGGER "trg_nurture_knowledge_event_append_only"
BEFORE UPDATE OR DELETE ON "nurture_institution_knowledge_revision_event"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_append_only"();

CREATE FUNCTION "nurture_knowledge_revision_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_institution_knowledge_item" item
    JOIN "nurture_care_institution" institution
      ON institution."id" = item."institution_id"
    JOIN "nurture_care_role_assignment" role
      ON role."id" = NEW."author_role_assignment_id"
    JOIN "nurture_participant" participant
      ON participant."id" = NEW."author_participant_id"
    WHERE item."id" = NEW."item_id"
      AND item."workspace_id" = NEW."workspace_id"
      AND item."institution_id" = NEW."institution_id"
      AND institution."workspace_id" = NEW."workspace_id"
      AND institution."status" = 'active'
      AND institution."deleted_at" IS NULL
      AND role."workspace_id" = NEW."workspace_id"
      AND role."participant_id" = NEW."author_participant_id"
      AND role."role" = 'institution_admin'
      AND role."scope_type" = 'institution'
      AND role."scope_id" = NEW."institution_id"
      AND role."status" = 'active'
      AND role."deleted_at" IS NULL
      AND (role."starts_at" IS NULL OR role."starts_at" <= NEW."created_at")
      AND (role."ends_at" IS NULL OR role."ends_at" > NEW."created_at")
      AND participant."workspace_id" = NEW."workspace_id"
      AND participant."status" = 'active'
      AND participant."deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'institution knowledge revision scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_knowledge_revision_validate_scope"
BEFORE INSERT ON "nurture_institution_knowledge_revision"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_revision_validate_scope"();

CREATE FUNCTION "nurture_knowledge_link_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "nurture_institution_knowledge_revision" revision
    WHERE revision."id" = NEW."revision_id"
      AND revision."workspace_id" = NEW."workspace_id"
      AND revision."institution_id" = NEW."institution_id"
  ) THEN
    RAISE EXCEPTION 'institution knowledge authority link scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_knowledge_link_validate_scope"
BEFORE INSERT ON "nurture_institution_knowledge_authority_link"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_link_validate_scope"();

CREATE FUNCTION "nurture_knowledge_event_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_institution_knowledge_item" item
    JOIN "nurture_institution_knowledge_revision" revision
      ON revision."id" = NEW."revision_id"
    JOIN "nurture_command_execution" execution
      ON execution."id" = NEW."command_execution_id"
    JOIN "nurture_care_role_assignment" role
      ON role."id" = NEW."actor_role_assignment_id"
    JOIN "nurture_participant" participant
      ON participant."id" = NEW."actor_participant_id"
    WHERE item."id" = NEW."item_id"
      AND item."workspace_id" = NEW."workspace_id"
      AND item."institution_id" = NEW."institution_id"
      AND item."item_head" = NEW."item_head"
      AND revision."item_id" = NEW."item_id"
      AND revision."workspace_id" = NEW."workspace_id"
      AND revision."institution_id" = NEW."institution_id"
      AND execution."workspace_id" = NEW."workspace_id"
      AND execution."command_scope" = 'institution_knowledge'
      AND execution."business_actor_ref" = NEW."actor_participant_id"
      AND NEW."occurred_at" <= execution."committed_at"
      AND (
        (execution."command_key" IN (
          'nurture.create_institution_knowledge_item',
          'nurture.create_institution_knowledge_revision'
        ) AND NEW."event_type" IN ('revision_created', 'revision_superseded'))
        OR (execution."command_key" = 'nurture.record_institution_knowledge_review'
          AND NEW."event_type" IN ('reviewed', 'changes_requested'))
        OR (execution."command_key" = 'nurture.publish_institution_knowledge_revision'
          AND NEW."event_type" IN ('published', 'publication_superseded'))
        OR (execution."command_key" = 'nurture.revoke_institution_knowledge_revision'
          AND NEW."event_type" = 'revoked')
      )
      AND role."workspace_id" = NEW."workspace_id"
      AND role."participant_id" = NEW."actor_participant_id"
      AND role."role" = 'institution_admin'
      AND role."scope_type" = 'institution'
      AND role."scope_id" = NEW."institution_id"
      AND role."status" = 'active'
      AND role."deleted_at" IS NULL
      AND (role."starts_at" IS NULL OR role."starts_at" <= NEW."occurred_at")
      AND (role."ends_at" IS NULL OR role."ends_at" > NEW."occurred_at")
      AND participant."workspace_id" = NEW."workspace_id"
      AND participant."status" = 'active'
      AND participant."deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'institution knowledge event scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_knowledge_event_validate_scope"
BEFORE INSERT ON "nurture_institution_knowledge_revision_event"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_event_validate_scope"();

CREATE FUNCTION "nurture_knowledge_item_validate_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_revision_number INTEGER;
  new_revision_number INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'institution knowledge item cannot be deleted'
      USING ERRCODE = '23514';
  END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."category" IS DISTINCT FROM OLD."category"
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR NEW."updated_at" < OLD."updated_at"
  THEN
    RAISE EXCEPTION 'institution knowledge item identity is immutable'
      USING ERRCODE = '23514';
  END IF;
  IF OLD."latest_revision_id" IS NULL THEN
    IF NEW."latest_revision_id" IS NULL
      OR NEW."item_head" <> OLD."item_head"
      OR NEW."current_published_revision_id" IS NOT NULL
    THEN
      RAISE EXCEPTION 'institution knowledge item initialization mismatch'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW."item_head" <> OLD."item_head" + 1 OR NEW."latest_revision_id" IS NULL THEN
    RAISE EXCEPTION 'institution knowledge item head is not monotone'
      USING ERRCODE = '23514';
  END IF;
  IF NEW."latest_revision_id" IS DISTINCT FROM OLD."latest_revision_id" THEN
    SELECT "revision_number" INTO old_revision_number
    FROM "nurture_institution_knowledge_revision"
    WHERE "id" = OLD."latest_revision_id";
    SELECT "revision_number" INTO new_revision_number
    FROM "nurture_institution_knowledge_revision"
    WHERE "id" = NEW."latest_revision_id";
    IF new_revision_number <> old_revision_number + 1 THEN
      RAISE EXCEPTION 'institution knowledge revision number is not monotone'
        USING ERRCODE = '23514';
    END IF;
    IF NEW."current_published_revision_id"
      IS DISTINCT FROM OLD."current_published_revision_id"
    THEN
      RAISE EXCEPTION 'institution knowledge revision creation cannot publish'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW."current_published_revision_id"
    IS DISTINCT FROM OLD."current_published_revision_id"
    AND NEW."current_published_revision_id" IS NOT NULL
    AND NEW."current_published_revision_id" <> NEW."latest_revision_id"
  THEN
    RAISE EXCEPTION 'institution knowledge publish target is not latest'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_knowledge_item_validate_mutation"
BEFORE UPDATE OR DELETE ON "nurture_institution_knowledge_item"
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_item_validate_mutation"();

CREATE FUNCTION "nurture_knowledge_item_validate_committed_state"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_item "nurture_institution_knowledge_item"%ROWTYPE;
BEGIN
  SELECT * INTO current_item
  FROM "nurture_institution_knowledge_item"
  WHERE "id" = NEW."id";
  IF current_item."latest_revision_id" IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM "nurture_institution_knowledge_revision" revision
      WHERE revision."id" = current_item."latest_revision_id"
        AND revision."item_id" = current_item."id"
        AND revision."workspace_id" = current_item."workspace_id"
        AND revision."institution_id" = current_item."institution_id"
    )
    OR (
      current_item."current_published_revision_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "nurture_institution_knowledge_revision" published
        WHERE published."id" = current_item."current_published_revision_id"
          AND published."item_id" = current_item."id"
          AND published."workspace_id" = current_item."workspace_id"
          AND published."institution_id" = current_item."institution_id"
      )
    )
    OR NOT EXISTS (
      SELECT 1 FROM "nurture_institution_knowledge_revision_event" event
      WHERE event."item_id" = current_item."id"
        AND event."item_head" = current_item."item_head"
    )
  THEN
    RAISE EXCEPTION 'institution knowledge item committed state is incomplete'
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "trg_nurture_knowledge_item_committed_state"
AFTER INSERT OR UPDATE ON "nurture_institution_knowledge_item"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "nurture_knowledge_item_validate_committed_state"();
