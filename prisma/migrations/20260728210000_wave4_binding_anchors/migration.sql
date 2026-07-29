-- Wave 4 P2 is additive and remains unapplied by this change. Existing
-- plaintext birth dates are retained for an owner-approved inventory and
-- deletion action. A column-scoped trigger blocks new non-null writes without
-- freezing unrelated updates to historical rows.

CREATE TYPE "NurtureBindingAnchorStatus" AS ENUM (
  'reserved',
  'bound_empty',
  'associated',
  'revoked',
  'quarantined',
  'retired'
);

CREATE TYPE "NurtureBindingAnchorAssociationStatus" AS ENUM (
  'active',
  'revoked',
  'quarantined'
);

CREATE TYPE "NurtureBindingSubjectType" AS ENUM (
  'child',
  'family'
);

CREATE TYPE "NurtureScenarioBindingAuthorizationStatus" AS ENUM (
  'active',
  'revoked'
);

CREATE FUNCTION "nurture_reject_new_plaintext_birth_date_v1"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."birth_date" IS NOT NULL THEN
    RAISE EXCEPTION 'New plaintext Nurture child birth dates are not allowed'
      USING
        ERRCODE = '23514',
        CONSTRAINT = 'ck_nurture_child_no_new_plaintext_birth_date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_child_no_new_plaintext_birth_date"
BEFORE INSERT OR UPDATE OF "birth_date"
ON "nurture_child"
FOR EACH ROW
EXECUTE FUNCTION "nurture_reject_new_plaintext_birth_date_v1"();

CREATE UNIQUE INDEX "uq_nurture_child_workspace_id"
ON "nurture_child"("workspace_id", "id");

CREATE UNIQUE INDEX "uq_nurture_child_process_integrity"
ON "nurture_child_care_process"("workspace_id", "id", "child_id");

CREATE UNIQUE INDEX "uq_nurture_family_process_integrity"
ON "nurture_family"("workspace_id", "id", "child_care_process_id");

CREATE TABLE "nurture_child_binding_anchor" (
  "id" TEXT NOT NULL,
  "reservation_key_hash" TEXT NOT NULL,
  "status" "NurtureBindingAnchorStatus" NOT NULL DEFAULT 'reserved',
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "revoked_at" TIMESTAMP(3),
  "quarantined_at" TIMESTAMP(3),
  "quarantine_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_child_binding_anchor_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_child_anchor_id"
    CHECK (
      "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  CONSTRAINT "ck_nurture_child_anchor_version"
    CHECK ("aggregate_version" >= 1),
  CONSTRAINT "ck_nurture_child_anchor_reservation_hash"
    CHECK ("reservation_key_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "ck_nurture_child_anchor_lifecycle"
    CHECK (
      (
        "status" IN ('reserved', 'bound_empty', 'associated', 'retired')
        AND "revoked_at" IS NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'revoked'
        AND "revoked_at" IS NOT NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'quarantined'
        AND "revoked_at" IS NULL
        AND (
          "quarantined_at" IS NOT NULL
          AND NULLIF(BTRIM("quarantine_reason"), '') IS NOT NULL
        )
      )
    )
);

CREATE TABLE "nurture_family_binding_anchor" (
  "id" TEXT NOT NULL,
  "reservation_key_hash" TEXT NOT NULL,
  "status" "NurtureBindingAnchorStatus" NOT NULL DEFAULT 'reserved',
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "revoked_at" TIMESTAMP(3),
  "quarantined_at" TIMESTAMP(3),
  "quarantine_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_family_binding_anchor_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_family_anchor_id"
    CHECK (
      "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  CONSTRAINT "ck_nurture_family_anchor_version"
    CHECK ("aggregate_version" >= 1),
  CONSTRAINT "ck_nurture_family_anchor_reservation_hash"
    CHECK ("reservation_key_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "ck_nurture_family_anchor_lifecycle"
    CHECK (
      (
        "status" IN ('reserved', 'bound_empty', 'associated', 'retired')
        AND "revoked_at" IS NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'revoked'
        AND "revoked_at" IS NOT NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'quarantined'
        AND "revoked_at" IS NULL
        AND (
          "quarantined_at" IS NOT NULL
          AND NULLIF(BTRIM("quarantine_reason"), '') IS NOT NULL
        )
      )
    )
);

CREATE TABLE "nurture_scenario_binding_authorization" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "subject_type" "NurtureBindingSubjectType" NOT NULL,
  "child_anchor_id" TEXT,
  "family_anchor_id" TEXT,
  "owner_ref" TEXT NOT NULL,
  "owner_version" INTEGER NOT NULL,
  "idempotency_key_hash" TEXT NOT NULL,
  "request_fingerprint" TEXT NOT NULL,
  "subject_evidence_hash" TEXT NOT NULL,
  "user_evidence_hash" TEXT NOT NULL,
  "actor_evidence_hash" TEXT NOT NULL,
  "organization_evidence_hash" TEXT,
  "purpose" TEXT NOT NULL,
  "authorization_source_ref" TEXT NOT NULL,
  "authorization_source_version" INTEGER NOT NULL,
  "status" "NurtureScenarioBindingAuthorizationStatus" NOT NULL DEFAULT 'active',
  "verified_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_scenario_binding_authorization_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_binding_auth_id"
    CHECK (
      "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  CONSTRAINT "ck_nurture_binding_auth_subject"
    CHECK (
      (
        "subject_type" = 'child'
        AND "child_anchor_id" IS NOT NULL
        AND "family_anchor_id" IS NULL
        AND "owner_ref" =
          'nurture_child_binding_anchor_v1:' || "child_anchor_id"
      )
      OR
      (
        "subject_type" = 'family'
        AND "family_anchor_id" IS NOT NULL
        AND "child_anchor_id" IS NULL
        AND "owner_ref" =
          'nurture_family_binding_anchor_v1:' || "family_anchor_id"
      )
    ),
  CONSTRAINT "ck_nurture_binding_auth_purpose"
    CHECK ("purpose" = 'scenario_binding_write'),
  CONSTRAINT "ck_nurture_binding_auth_versions"
    CHECK (
      "owner_version" >= 1
      AND "authorization_source_version" >= 1
      AND "aggregate_version" >= 1
    ),
  CONSTRAINT "ck_nurture_binding_auth_window"
    CHECK ("verified_at" < "expires_at"),
  CONSTRAINT "ck_nurture_binding_auth_lifecycle"
    CHECK (
      ("status" = 'active' AND "revoked_at" IS NULL)
      OR ("status" = 'revoked' AND "revoked_at" IS NOT NULL)
    ),
  CONSTRAINT "ck_nurture_binding_auth_text"
    CHECK (
      NULLIF(BTRIM("workspace_id"), '') IS NOT NULL
      AND CHAR_LENGTH("workspace_id") <= 128
      AND NULLIF(BTRIM("owner_ref"), '') IS NOT NULL
      AND CHAR_LENGTH("owner_ref") <= 256
      AND NULLIF(BTRIM("authorization_source_ref"), '') IS NOT NULL
      AND CHAR_LENGTH("authorization_source_ref") <= 512
    ),
  CONSTRAINT "ck_nurture_binding_auth_hashes"
    CHECK (
      "idempotency_key_hash" ~ '^[0-9a-f]{64}$'
      AND "request_fingerprint" ~ '^[0-9a-f]{64}$'
      AND "subject_evidence_hash" ~ '^[0-9a-f]{64}$'
      AND "user_evidence_hash" ~ '^[0-9a-f]{64}$'
      AND "actor_evidence_hash" ~ '^[0-9a-f]{64}$'
      AND (
        "organization_evidence_hash" IS NULL
        OR "organization_evidence_hash" ~ '^[0-9a-f]{64}$'
      )
    )
);

CREATE TABLE "nurture_child_anchor_association" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "child_anchor_id" TEXT NOT NULL,
  "child_id" TEXT NOT NULL,
  "status" "NurtureBindingAnchorAssociationStatus" NOT NULL DEFAULT 'active',
  "current_key" TEXT DEFAULT 'current',
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "revoked_at" TIMESTAMP(3),
  "quarantined_at" TIMESTAMP(3),
  "quarantine_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_child_anchor_association_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_child_anchor_assoc_id"
    CHECK (
      "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  CONSTRAINT "ck_nurture_child_anchor_assoc_version"
    CHECK ("aggregate_version" >= 1),
  CONSTRAINT "ck_nurture_child_anchor_assoc_workspace"
    CHECK (
      NULLIF(BTRIM("workspace_id"), '') IS NOT NULL
      AND CHAR_LENGTH("workspace_id") <= 128
    ),
  CONSTRAINT "ck_nurture_child_anchor_assoc_lifecycle"
    CHECK (
      (
        "status" = 'active'
        AND "current_key" IS NOT NULL
        AND "current_key" = 'current'
        AND "revoked_at" IS NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'revoked'
        AND "current_key" IS NULL
        AND "revoked_at" IS NOT NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'quarantined'
        AND "current_key" IS NULL
        AND "revoked_at" IS NULL
        AND "quarantined_at" IS NOT NULL
        AND NULLIF(BTRIM("quarantine_reason"), '') IS NOT NULL
      )
    )
);

CREATE TABLE "nurture_family_anchor_association" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "family_anchor_id" TEXT NOT NULL,
  "child_anchor_id" TEXT NOT NULL,
  "child_association_id" TEXT NOT NULL,
  "current_child_association_id" TEXT,
  "child_id" TEXT NOT NULL,
  "child_care_process_id" TEXT NOT NULL,
  "family_id" TEXT NOT NULL,
  "status" "NurtureBindingAnchorAssociationStatus" NOT NULL DEFAULT 'active',
  "current_key" TEXT DEFAULT 'current',
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "revoked_at" TIMESTAMP(3),
  "quarantined_at" TIMESTAMP(3),
  "quarantine_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_family_anchor_association_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_family_anchor_assoc_id"
    CHECK (
      "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  CONSTRAINT "ck_nurture_family_anchor_assoc_version"
    CHECK ("aggregate_version" >= 1),
  CONSTRAINT "ck_nurture_family_anchor_assoc_workspace"
    CHECK (
      NULLIF(BTRIM("workspace_id"), '') IS NOT NULL
      AND CHAR_LENGTH("workspace_id") <= 128
    ),
  CONSTRAINT "ck_nurture_family_anchor_assoc_lifecycle"
    CHECK (
      (
        "status" = 'active'
        AND "current_key" IS NOT NULL
        AND "current_key" = 'current'
        AND "current_child_association_id" IS NOT NULL
        AND "current_child_association_id" = "child_association_id"
        AND "revoked_at" IS NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'revoked'
        AND "current_key" IS NULL
        AND "current_child_association_id" IS NULL
        AND "revoked_at" IS NOT NULL
        AND "quarantined_at" IS NULL
        AND "quarantine_reason" IS NULL
      )
      OR (
        "status" = 'quarantined'
        AND "current_key" IS NULL
        AND "current_child_association_id" IS NULL
        AND "revoked_at" IS NULL
        AND "quarantined_at" IS NOT NULL
        AND NULLIF(BTRIM("quarantine_reason"), '') IS NOT NULL
      )
    )
);

CREATE UNIQUE INDEX "uq_nurture_child_anchor_reservation"
ON "nurture_child_binding_anchor"("reservation_key_hash");

CREATE INDEX "ix_nurture_child_anchor_status"
ON "nurture_child_binding_anchor"("status", "updated_at");

CREATE UNIQUE INDEX "uq_nurture_family_anchor_reservation"
ON "nurture_family_binding_anchor"("reservation_key_hash");

CREATE INDEX "ix_nurture_family_anchor_status"
ON "nurture_family_binding_anchor"("status", "updated_at");

CREATE UNIQUE INDEX "uq_nurture_binding_auth_idempotency"
ON "nurture_scenario_binding_authorization"("idempotency_key_hash");

CREATE INDEX "ix_nurture_binding_auth_current"
ON "nurture_scenario_binding_authorization"(
  "workspace_id",
  "subject_type",
  "status",
  "expires_at"
);

CREATE INDEX "ix_nurture_binding_auth_owner"
ON "nurture_scenario_binding_authorization"(
  "owner_ref",
  "owner_version",
  "status"
);

CREATE UNIQUE INDEX "uq_nurture_child_anchor_workspace"
ON "nurture_child_anchor_association"(
  "workspace_id",
  "child_anchor_id",
  "current_key"
);

CREATE UNIQUE INDEX "uq_nurture_child_anchor_local_child"
ON "nurture_child_anchor_association"(
  "workspace_id",
  "child_id",
  "current_key"
);

CREATE UNIQUE INDEX "uq_nurture_child_anchor_integrity"
ON "nurture_child_anchor_association"(
  "id",
  "workspace_id",
  "child_anchor_id",
  "child_id"
);

CREATE UNIQUE INDEX "uq_nurture_child_anchor_current"
ON "nurture_child_anchor_association"("id", "current_key");

CREATE INDEX "ix_nurture_child_anchor_assoc_status"
ON "nurture_child_anchor_association"(
  "workspace_id",
  "status",
  "updated_at"
);

CREATE UNIQUE INDEX "uq_nurture_family_anchor_pair"
ON "nurture_family_anchor_association"(
  "workspace_id",
  "family_anchor_id",
  "child_anchor_id",
  "current_key"
);

CREATE UNIQUE INDEX "uq_nurture_family_anchor_local_family"
ON "nurture_family_anchor_association"(
  "workspace_id",
  "family_id",
  "current_key"
);

CREATE UNIQUE INDEX "uq_nurture_family_anchor_process"
ON "nurture_family_anchor_association"(
  "workspace_id",
  "child_care_process_id",
  "current_key"
);

CREATE INDEX "ix_nurture_family_anchor_assoc_status"
ON "nurture_family_anchor_association"(
  "workspace_id",
  "status",
  "updated_at"
);

ALTER TABLE "nurture_scenario_binding_authorization"
ADD CONSTRAINT "nurture_binding_auth_child_anchor_fkey"
FOREIGN KEY ("child_anchor_id")
REFERENCES "nurture_child_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_scenario_binding_authorization"
ADD CONSTRAINT "nurture_binding_auth_family_anchor_fkey"
FOREIGN KEY ("family_anchor_id")
REFERENCES "nurture_family_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_child_anchor_association"
ADD CONSTRAINT "nurture_child_anchor_assoc_anchor_fkey"
FOREIGN KEY ("child_anchor_id")
REFERENCES "nurture_child_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_child_anchor_association"
ADD CONSTRAINT "nurture_child_anchor_assoc_child_fkey"
FOREIGN KEY ("workspace_id", "child_id")
REFERENCES "nurture_child"("workspace_id", "id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_anchor_association"
ADD CONSTRAINT "nurture_family_anchor_assoc_family_anchor_fkey"
FOREIGN KEY ("family_anchor_id")
REFERENCES "nurture_family_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_anchor_association"
ADD CONSTRAINT "nurture_family_anchor_assoc_child_anchor_fkey"
FOREIGN KEY ("child_anchor_id")
REFERENCES "nurture_child_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_anchor_association"
ADD CONSTRAINT "nurture_family_anchor_assoc_child_assoc_fkey"
FOREIGN KEY (
  "child_association_id",
  "workspace_id",
  "child_anchor_id",
  "child_id"
)
REFERENCES "nurture_child_anchor_association"(
  "id",
  "workspace_id",
  "child_anchor_id",
  "child_id"
)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_anchor_association"
ADD CONSTRAINT "nurture_family_anchor_assoc_current_child_fkey"
FOREIGN KEY ("current_child_association_id", "current_key")
REFERENCES "nurture_child_anchor_association"("id", "current_key")
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "nurture_family_anchor_association"
ADD CONSTRAINT "nurture_family_anchor_assoc_process_fkey"
FOREIGN KEY ("workspace_id", "child_care_process_id", "child_id")
REFERENCES "nurture_child_care_process"(
  "workspace_id",
  "id",
  "child_id"
)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_family_anchor_association"
ADD CONSTRAINT "nurture_family_anchor_assoc_family_fkey"
FOREIGN KEY ("workspace_id", "family_id", "child_care_process_id")
REFERENCES "nurture_family"(
  "workspace_id",
  "id",
  "child_care_process_id"
)
ON DELETE RESTRICT ON UPDATE CASCADE;
