-- G4-D increment 3 — versioned waitlist policy, exact ordered entries,
-- explicit trial offers and bounded exact-class reservations. No timer owns a
-- transition and no row creates Enrollment, Grant or My-Chat identity.

CREATE TYPE "NurtureEnrollmentWaitlistInterestState" AS ENUM (
  'confirmed', 'waiting_on_guardian'
);
CREATE TYPE "NurtureEnrollmentWaitlistEntryLifecycle" AS ENUM (
  'active', 'offer_open', 'accepted', 'withdrawn'
);
CREATE TYPE "NurtureEnrollmentTrialOfferLifecycle" AS ENUM (
  'open', 'accepted', 'declined', 'expired', 'withdrawn'
);
CREATE TYPE "NurtureEnrollmentTrialReservationState" AS ENUM (
  'held', 'converted_to_occupancy', 'released'
);

ALTER TABLE "nurture_institution_workflow_transition"
  ADD COLUMN "actor_ref" JSONB,
  ADD COLUMN "owner_action_ref" JSONB,
  ALTER COLUMN "actor_role_assignment_id" DROP NOT NULL;

CREATE TABLE "nurture_enrollment_waitlist_policy" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "contract_version" TEXT NOT NULL,
  "policy_ref" TEXT NOT NULL,
  "policy_revision" INTEGER NOT NULL,
  "category_keys" TEXT[],
  "review_reminder_minutes" INTEGER NOT NULL,
  "review_deadline_minutes" INTEGER NOT NULL,
  "offer_validity_min_minutes" INTEGER NOT NULL,
  "offer_validity_max_minutes" INTEGER NOT NULL,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "changed_by_role_assignment_id" TEXT NOT NULL,
  "change_reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_enrollment_waitlist_policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_enrollment_waitlist_entry" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "inquiry_id" TEXT NOT NULL,
  "target_care_group_id" TEXT NOT NULL,
  "policy_id" TEXT,
  "policy_ref" TEXT NOT NULL,
  "policy_revision" INTEGER NOT NULL,
  "category_key" TEXT NOT NULL,
  "category_order" INTEGER NOT NULL,
  "category_basis_key" TEXT NOT NULL,
  "expected_entry_start_date" DATE NOT NULL,
  "expected_entry_end_date" DATE NOT NULL,
  "waitlist_qualified_at" TIMESTAMP(3) NOT NULL,
  "order_key" TEXT NOT NULL,
  "capacity_source_revision" INTEGER NOT NULL,
  "qualified_occupancy_count" INTEGER NOT NULL,
  "family_acceptance_action_ref" JSONB NOT NULL,
  "family_acceptance_actor_ref" JSONB NOT NULL,
  "family_contact_ref" JSONB NOT NULL,
  "family_accepted_at" TIMESTAMP(3) NOT NULL,
  "interest_state" "NurtureEnrollmentWaitlistInterestState" NOT NULL,
  "next_review_at" TIMESTAMP(3) NOT NULL,
  "last_confirmed_at" TIMESTAMP(3) NOT NULL,
  "last_reviewed_at" TIMESTAMP(3),
  "current_offer_id" TEXT,
  "lifecycle" "NurtureEnrollmentWaitlistEntryLifecycle" NOT NULL,
  "entry_head" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nurture_enrollment_waitlist_entry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_enrollment_waitlist_override" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "command_execution_id" TEXT NOT NULL,
  "entry_head_before" INTEGER NOT NULL,
  "entry_head_after" INTEGER NOT NULL,
  "before_policy_ref" TEXT NOT NULL,
  "before_policy_revision" INTEGER NOT NULL,
  "before_category_key" TEXT NOT NULL,
  "before_category_order" INTEGER NOT NULL,
  "after_policy_ref" TEXT NOT NULL,
  "after_policy_revision" INTEGER NOT NULL,
  "after_category_key" TEXT NOT NULL,
  "after_category_order" INTEGER NOT NULL,
  "after_category_basis_key" TEXT NOT NULL,
  "actor_role_assignment_id" TEXT NOT NULL,
  "reason_key" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_enrollment_waitlist_override_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_enrollment_trial_offer" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "target_care_group_id" TEXT NOT NULL,
  "issued_by_role_assignment_id" TEXT NOT NULL,
  "issued_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "trial_starts_at" TIMESTAMP(3) NOT NULL,
  "trial_ends_at" TIMESTAMP(3) NOT NULL,
  "review_at" TIMESTAMP(3) NOT NULL,
  "lifecycle" "NurtureEnrollmentTrialOfferLifecycle" NOT NULL,
  "offer_head" INTEGER NOT NULL,
  "decided_at" TIMESTAMP(3),
  "decision_reason_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nurture_enrollment_trial_offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_enrollment_trial_reservation" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "offer_id" TEXT NOT NULL,
  "target_care_group_id" TEXT NOT NULL,
  "accepted_action_ref" JSONB NOT NULL,
  "accepted_actor_ref" JSONB NOT NULL,
  "held_at" TIMESTAMP(3) NOT NULL,
  "trial_starts_at" TIMESTAMP(3) NOT NULL,
  "trial_ends_at" TIMESTAMP(3) NOT NULL,
  "review_at" TIMESTAMP(3) NOT NULL,
  "state" "NurtureEnrollmentTrialReservationState" NOT NULL,
  "reservation_head" INTEGER NOT NULL,
  "released_at" TIMESTAMP(3),
  "release_reason_key" TEXT,
  "converted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nurture_enrollment_trial_reservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ix_nurture_waitlist_policy_effective"
  ON "nurture_enrollment_waitlist_policy"
  ("workspace_id", "institution_id", "effective_from", "effective_to");
CREATE UNIQUE INDEX "uq_nurture_waitlist_policy_revision"
  ON "nurture_enrollment_waitlist_policy"
  ("workspace_id", "institution_id", "policy_revision");
CREATE UNIQUE INDEX "uq_nurture_waitlist_entry_current_offer"
  ON "nurture_enrollment_waitlist_entry" ("current_offer_id");
CREATE INDEX "ix_nurture_waitlist_entry_order"
  ON "nurture_enrollment_waitlist_entry"
  ("workspace_id", "institution_id", "target_care_group_id", "lifecycle",
   "category_order", "waitlist_qualified_at", "order_key");
CREATE INDEX "ix_nurture_waitlist_entry_workflow"
  ON "nurture_enrollment_waitlist_entry"
  ("workspace_id", "workflow_id", "entry_head");
CREATE UNIQUE INDEX "uq_nurture_waitlist_entry_active_workflow"
  ON "nurture_enrollment_waitlist_entry" ("workspace_id", "workflow_id")
  WHERE "lifecycle" IN ('active', 'offer_open');
CREATE UNIQUE INDEX "uq_nurture_waitlist_acceptance_action"
  ON "nurture_enrollment_waitlist_entry"
  ("workspace_id", (("family_acceptance_action_ref" ->> 'object_type')),
   (("family_acceptance_action_ref" ->> 'object_id')));
CREATE UNIQUE INDEX "uq_nurture_waitlist_override_execution"
  ON "nurture_enrollment_waitlist_override" ("command_execution_id");
CREATE INDEX "ix_nurture_waitlist_override_entry"
  ON "nurture_enrollment_waitlist_override"
  ("workspace_id", "institution_id", "entry_id", "occurred_at");
CREATE UNIQUE INDEX "uq_nurture_waitlist_override_entry_head"
  ON "nurture_enrollment_waitlist_override" ("entry_id", "entry_head_after");
CREATE INDEX "ix_nurture_trial_offer_class_state"
  ON "nurture_enrollment_trial_offer"
  ("workspace_id", "target_care_group_id", "lifecycle", "expires_at");
CREATE INDEX "ix_nurture_trial_offer_workflow"
  ON "nurture_enrollment_trial_offer" ("workspace_id", "workflow_id", "created_at");
CREATE UNIQUE INDEX "uq_nurture_trial_reservation_workflow_held"
  ON "nurture_enrollment_trial_reservation" ("workspace_id", "workflow_id")
  WHERE "state" = 'held';
CREATE UNIQUE INDEX "uq_nurture_trial_reservation_offer"
  ON "nurture_enrollment_trial_reservation" ("offer_id");
CREATE UNIQUE INDEX "uq_nurture_trial_reservation_action"
  ON "nurture_enrollment_trial_reservation"
  ("workspace_id", (("accepted_action_ref" ->> 'object_type')),
   (("accepted_action_ref" ->> 'object_id')));
CREATE INDEX "ix_nurture_trial_reservation_class_state"
  ON "nurture_enrollment_trial_reservation"
  ("workspace_id", "target_care_group_id", "state", "trial_starts_at");
CREATE UNIQUE INDEX "uq_nurture_workflow_transition_owner_action"
  ON "nurture_institution_workflow_transition"
  ("workspace_id", (("owner_action_ref" ->> 'object_type')),
   (("owner_action_ref" ->> 'object_id')))
  WHERE "owner_action_ref" IS NOT NULL;

ALTER TABLE "nurture_enrollment_waitlist_policy"
  ADD CONSTRAINT "nurture_waitlist_policy_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_policy_actor_role_id_fkey"
  FOREIGN KEY ("changed_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_waitlist_entry"
  ADD CONSTRAINT "nurture_waitlist_entry_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_entry_workflow_id_fkey"
  FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_entry_inquiry_id_fkey"
  FOREIGN KEY ("inquiry_id") REFERENCES "nurture_enrollment_inquiry"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_entry_care_group_id_fkey"
  FOREIGN KEY ("target_care_group_id") REFERENCES "nurture_care_group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_entry_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "nurture_enrollment_waitlist_policy"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_waitlist_override"
  ADD CONSTRAINT "nurture_waitlist_override_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_override_entry_id_fkey"
  FOREIGN KEY ("entry_id") REFERENCES "nurture_enrollment_waitlist_entry"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_override_execution_id_fkey"
  FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_waitlist_override_actor_role_id_fkey"
  FOREIGN KEY ("actor_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_trial_offer"
  ADD CONSTRAINT "nurture_trial_offer_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_offer_workflow_id_fkey"
  FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_offer_entry_id_fkey"
  FOREIGN KEY ("entry_id") REFERENCES "nurture_enrollment_waitlist_entry"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_offer_care_group_id_fkey"
  FOREIGN KEY ("target_care_group_id") REFERENCES "nurture_care_group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_offer_actor_role_id_fkey"
  FOREIGN KEY ("issued_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_trial_reservation"
  ADD CONSTRAINT "nurture_trial_reservation_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_reservation_workflow_id_fkey"
  FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_reservation_entry_id_fkey"
  FOREIGN KEY ("entry_id") REFERENCES "nurture_enrollment_waitlist_entry"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_reservation_offer_id_fkey"
  FOREIGN KEY ("offer_id") REFERENCES "nurture_enrollment_trial_offer"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_trial_reservation_care_group_id_fkey"
  FOREIGN KEY ("target_care_group_id") REFERENCES "nurture_care_group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- The circular current-offer reference is added only after both tables exist.
ALTER TABLE "nurture_enrollment_waitlist_entry"
  ADD CONSTRAINT "nurture_waitlist_entry_current_offer_id_fkey"
  FOREIGN KEY ("current_offer_id") REFERENCES "nurture_enrollment_trial_offer"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_enrollment_waitlist_policy"
  ADD CONSTRAINT "ck_nurture_waitlist_policy_contract" CHECK (
    "contract_version" = '1.0.0'
    AND "policy_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND "policy_revision" >= 1
    AND "category_keys" IS NOT NULL
    AND "nurture_enrollment_key_array_is_valid"("category_keys", TRUE)
    AND cardinality("category_keys") BETWEEN 1 AND 8
    AND 'standard' = ANY("category_keys")
    AND "review_reminder_minutes" >= 1
    AND "review_deadline_minutes" >= "review_reminder_minutes"
    AND "offer_validity_min_minutes" >= 1
    AND "offer_validity_max_minutes" >= "offer_validity_min_minutes"
    AND ("effective_to" IS NULL OR "effective_to" > "effective_from")
    AND length(btrim("change_reason")) BETWEEN 1 AND 1000
  );

ALTER TABLE "nurture_enrollment_waitlist_entry"
  ADD CONSTRAINT "ck_nurture_waitlist_entry_contract" CHECK (
    "entry_head" >= 1
    AND "policy_revision" >= 0
    AND "category_order" >= 0
    AND "category_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND "category_basis_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND "expected_entry_end_date" >= "expected_entry_start_date"
    AND "capacity_source_revision" >= 0
    AND "qualified_occupancy_count" >= 1
    AND "family_accepted_at" <= "waitlist_qualified_at"
    AND "last_confirmed_at" >= "family_accepted_at"
    AND "next_review_at" > "waitlist_qualified_at"
    AND ("last_reviewed_at" IS NULL OR "last_reviewed_at" >= "waitlist_qualified_at")
    AND "updated_at" >= "created_at"
    AND "nurture_canonical_ref_v1_is_valid"(
      "family_acceptance_action_ref", 'my_chat', NULL
    )
    AND "nurture_canonical_ref_v1_is_valid"(
      "family_acceptance_actor_ref", 'my_chat', NULL
    )
    AND "nurture_canonical_ref_v1_is_valid"(
      "family_contact_ref", 'my_chat', NULL
    )
    AND (
      ("policy_id" IS NULL
        AND "policy_ref" = 'nurture.default-standard-fifo'
        AND "policy_revision" = 0
        AND "category_key" = 'standard'
        AND "category_order" = 0)
      OR ("policy_id" IS NOT NULL AND "policy_revision" >= 1)
    )
    AND (
      ("lifecycle" = 'active' AND "current_offer_id" IS NULL)
      OR ("lifecycle" = 'offer_open' AND "current_offer_id" IS NOT NULL)
      OR ("lifecycle" = 'accepted')
      OR ("lifecycle" = 'withdrawn' AND "current_offer_id" IS NULL)
    )
  );

ALTER TABLE "nurture_enrollment_waitlist_override"
  ADD CONSTRAINT "ck_nurture_waitlist_override_contract" CHECK (
    "entry_head_before" >= 1
    AND "entry_head_after" = "entry_head_before" + 1
    AND "before_policy_revision" >= 0
    AND "after_policy_revision" >= 0
    AND "before_category_order" >= 0
    AND "after_category_order" >= 0
    AND "before_category_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND "after_category_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND "after_category_basis_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND "reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND ("before_policy_ref", "before_policy_revision", "before_category_key", "before_category_order")
      IS DISTINCT FROM
      ("after_policy_ref", "after_policy_revision", "after_category_key", "after_category_order")
  );

ALTER TABLE "nurture_enrollment_trial_offer"
  ADD CONSTRAINT "ck_nurture_trial_offer_contract" CHECK (
    "offer_head" >= 1
    AND "expires_at" > "issued_at"
    AND "trial_starts_at" > "expires_at"
    AND "trial_ends_at" > "trial_starts_at"
    AND "review_at" BETWEEN "trial_starts_at" AND "trial_ends_at"
    AND "updated_at" >= "created_at"
    AND (
      ("lifecycle" = 'open' AND "decided_at" IS NULL AND "decision_reason_key" IS NULL)
      OR (
        "lifecycle" <> 'open'
        AND "decided_at" IS NOT NULL
        AND "decision_reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
      )
    )
    AND ("lifecycle" <> 'expired' OR "decided_at" >= "expires_at")
    AND ("lifecycle" <> 'declined' OR "decided_at" < "expires_at")
  );

ALTER TABLE "nurture_enrollment_trial_reservation"
  ADD CONSTRAINT "ck_nurture_trial_reservation_contract" CHECK (
    "reservation_head" >= 1
    AND "trial_ends_at" > "trial_starts_at"
    AND "review_at" BETWEEN "trial_starts_at" AND "trial_ends_at"
    AND "held_at" <= "trial_starts_at"
    AND "updated_at" >= "created_at"
    AND "nurture_canonical_ref_v1_is_valid"(
      "accepted_action_ref", 'my_chat', NULL
    )
    AND "nurture_canonical_ref_v1_is_valid"(
      "accepted_actor_ref", 'my_chat', NULL
    )
    AND (
      ("state" = 'held' AND "released_at" IS NULL
        AND "release_reason_key" IS NULL AND "converted_at" IS NULL)
      OR ("state" = 'released' AND "released_at" IS NOT NULL
        AND "release_reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
        AND "converted_at" IS NULL)
      OR ("state" = 'converted_to_occupancy' AND "converted_at" IS NOT NULL
        AND "released_at" IS NULL AND "release_reason_key" IS NULL)
    )
  );

CREATE FUNCTION "nurture_waitlist_policy_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "nurture_care_institution"
    WHERE "id" = NEW."institution_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "status" = 'active'
      AND "deleted_at" IS NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM "nurture_care_role_assignment"
    WHERE "id" = NEW."changed_by_role_assignment_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "role" = 'institution_admin'
      AND "scope_type" = 'institution'
      AND "scope_id" = NEW."institution_id"
      AND "status" = 'active'
      AND "deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture waitlist policy scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  IF NEW."policy_revision" <> COALESCE((
    SELECT max(policy."policy_revision") + 1
    FROM "nurture_enrollment_waitlist_policy" policy
    WHERE policy."workspace_id" = NEW."workspace_id"
      AND policy."institution_id" = NEW."institution_id"
  ), 1) OR NEW."effective_from" <= COALESCE((
    SELECT max(policy."effective_from")
    FROM "nurture_enrollment_waitlist_policy" policy
    WHERE policy."workspace_id" = NEW."workspace_id"
      AND policy."institution_id" = NEW."institution_id"
  ), '-infinity'::timestamp) THEN
    RAISE EXCEPTION 'nurture waitlist policy revision is not monotone'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_waitlist_policy_validate_scope"
BEFORE INSERT ON "nurture_enrollment_waitlist_policy"
FOR EACH ROW EXECUTE FUNCTION "nurture_waitlist_policy_validate_scope"();
CREATE TRIGGER "trg_nurture_waitlist_policy_reject_mutation"
BEFORE UPDATE OR DELETE ON "nurture_enrollment_waitlist_policy"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_update_or_delete"();

CREATE FUNCTION "nurture_waitlist_entry_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."workflow_id" IS DISTINCT FROM OLD."workflow_id"
    OR NEW."inquiry_id" IS DISTINCT FROM OLD."inquiry_id"
    OR NEW."target_care_group_id" IS DISTINCT FROM OLD."target_care_group_id"
    OR NEW."expected_entry_start_date" IS DISTINCT FROM OLD."expected_entry_start_date"
    OR NEW."expected_entry_end_date" IS DISTINCT FROM OLD."expected_entry_end_date"
    OR NEW."waitlist_qualified_at" IS DISTINCT FROM OLD."waitlist_qualified_at"
    OR NEW."order_key" IS DISTINCT FROM OLD."order_key"
    OR NEW."capacity_source_revision" IS DISTINCT FROM OLD."capacity_source_revision"
    OR NEW."qualified_occupancy_count" IS DISTINCT FROM OLD."qualified_occupancy_count"
    OR NEW."family_acceptance_action_ref" IS DISTINCT FROM OLD."family_acceptance_action_ref"
    OR NEW."family_acceptance_actor_ref" IS DISTINCT FROM OLD."family_acceptance_actor_ref"
    OR NEW."family_contact_ref" IS DISTINCT FROM OLD."family_contact_ref"
    OR NEW."family_accepted_at" IS DISTINCT FROM OLD."family_accepted_at"
    OR NEW."entry_head" <> OLD."entry_head" + 1
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR NEW."updated_at" < OLD."updated_at"
    OR (OLD."lifecycle" = 'active' AND NEW."lifecycle" NOT IN ('active', 'offer_open', 'withdrawn'))
    OR (OLD."lifecycle" = 'offer_open' AND NEW."lifecycle" NOT IN ('active', 'accepted', 'withdrawn'))
    OR (OLD."lifecycle" = 'accepted' AND NEW."lifecycle" <> 'accepted')
    OR OLD."lifecycle" = 'withdrawn'
  ) THEN
    RAISE EXCEPTION 'nurture waitlist entry update is not monotone'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_institution_workflow" workflow
    JOIN "nurture_enrollment_inquiry" inquiry
      ON inquiry."workflow_id" = workflow."id"
    JOIN "nurture_care_group" care_group
      ON care_group."id" = inquiry."target_care_group_id"
    WHERE workflow."id" = NEW."workflow_id"
      AND inquiry."id" = NEW."inquiry_id"
      AND care_group."id" = NEW."target_care_group_id"
      AND workflow."workspace_id" = NEW."workspace_id"
      AND workflow."institution_id" = NEW."institution_id"
      AND inquiry."workspace_id" = NEW."workspace_id"
      AND inquiry."institution_id" = NEW."institution_id"
      AND care_group."workspace_id" = NEW."workspace_id"
      AND care_group."institution_id" = NEW."institution_id"
      AND inquiry."host_contact_ref" = NEW."family_contact_ref"
      AND care_group."status" = 'active'
      AND care_group."deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture waitlist entry scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."policy_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "nurture_enrollment_waitlist_policy" policy
    WHERE policy."id" = NEW."policy_id"
      AND policy."workspace_id" = NEW."workspace_id"
      AND policy."institution_id" = NEW."institution_id"
      AND policy."policy_ref" = NEW."policy_ref"
      AND policy."policy_revision" = NEW."policy_revision"
      AND NEW."category_key" = ANY(policy."category_keys")
      AND NEW."category_order" = array_position(
        policy."category_keys", NEW."category_key"
      ) - 1
  ) THEN
    RAISE EXCEPTION 'nurture waitlist entry policy mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."current_offer_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "nurture_enrollment_trial_offer" offer
    WHERE offer."id" = NEW."current_offer_id"
      AND offer."workspace_id" = NEW."workspace_id"
      AND offer."institution_id" = NEW."institution_id"
      AND offer."workflow_id" = NEW."workflow_id"
      AND offer."entry_id" = NEW."id"
      AND offer."target_care_group_id" = NEW."target_care_group_id"
      AND (
        (NEW."lifecycle" = 'offer_open' AND offer."lifecycle" = 'open')
        OR (NEW."lifecycle" = 'accepted' AND offer."lifecycle" = 'accepted')
      )
  ) THEN
    RAISE EXCEPTION 'nurture waitlist entry current offer mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_waitlist_entry_validate_scope"
BEFORE INSERT OR UPDATE ON "nurture_enrollment_waitlist_entry"
FOR EACH ROW EXECUTE FUNCTION "nurture_waitlist_entry_validate_scope"();
CREATE TRIGGER "trg_nurture_waitlist_entry_reject_delete"
BEFORE DELETE ON "nurture_enrollment_waitlist_entry"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_delete"();

CREATE FUNCTION "nurture_waitlist_entry_require_override"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    NEW."policy_ref", NEW."policy_revision", NEW."category_key", NEW."category_order"
  ) IS DISTINCT FROM (
    OLD."policy_ref", OLD."policy_revision", OLD."category_key", OLD."category_order"
  ) AND NOT EXISTS (
    SELECT 1 FROM "nurture_enrollment_waitlist_override" override_row
    WHERE override_row."entry_id" = NEW."id"
      AND override_row."workspace_id" = NEW."workspace_id"
      AND override_row."institution_id" = NEW."institution_id"
      AND override_row."entry_head_before" = OLD."entry_head"
      AND override_row."entry_head_after" = NEW."entry_head"
      AND override_row."before_policy_ref" = OLD."policy_ref"
      AND override_row."before_policy_revision" = OLD."policy_revision"
      AND override_row."before_category_key" = OLD."category_key"
      AND override_row."before_category_order" = OLD."category_order"
      AND override_row."after_policy_ref" = NEW."policy_ref"
      AND override_row."after_policy_revision" = NEW."policy_revision"
      AND override_row."after_category_key" = NEW."category_key"
      AND override_row."after_category_order" = NEW."category_order"
  ) THEN
    RAISE EXCEPTION 'nurture waitlist category change has no exact override'
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "trg_nurture_waitlist_entry_require_override"
AFTER UPDATE ON "nurture_enrollment_waitlist_entry"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "nurture_waitlist_entry_require_override"();

CREATE FUNCTION "nurture_waitlist_override_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_enrollment_waitlist_entry" entry
    JOIN "nurture_command_execution" execution
      ON execution."id" = NEW."command_execution_id"
    JOIN "nurture_care_role_assignment" role
      ON role."id" = NEW."actor_role_assignment_id"
    WHERE entry."id" = NEW."entry_id"
      AND entry."workspace_id" = NEW."workspace_id"
      AND entry."institution_id" = NEW."institution_id"
      AND entry."entry_head" = NEW."entry_head_after"
      AND entry."policy_ref" = NEW."after_policy_ref"
      AND entry."policy_revision" = NEW."after_policy_revision"
      AND entry."category_key" = NEW."after_category_key"
      AND entry."category_order" = NEW."after_category_order"
      AND entry."category_basis_key" = NEW."after_category_basis_key"
      AND execution."workspace_id" = NEW."workspace_id"
      AND execution."command_key" = 'nurture.override_waitlist_category'
      AND execution."command_scope" = 'institution_enrollment_journey'
      AND execution."business_actor_ref" = role."participant_id"
      AND execution."committed_at" = NEW."occurred_at"
      AND role."workspace_id" = NEW."workspace_id"
      AND role."role" = 'institution_admin'
      AND role."scope_type" = 'institution'
      AND role."scope_id" = NEW."institution_id"
      AND role."status" = 'active'
      AND role."deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture waitlist override scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_waitlist_override_validate_scope"
BEFORE INSERT ON "nurture_enrollment_waitlist_override"
FOR EACH ROW EXECUTE FUNCTION "nurture_waitlist_override_validate_scope"();
CREATE TRIGGER "trg_nurture_waitlist_override_reject_mutation"
BEFORE UPDATE OR DELETE ON "nurture_enrollment_waitlist_override"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_update_or_delete"();

CREATE FUNCTION "nurture_trial_offer_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."workflow_id" IS DISTINCT FROM OLD."workflow_id"
    OR NEW."entry_id" IS DISTINCT FROM OLD."entry_id"
    OR NEW."target_care_group_id" IS DISTINCT FROM OLD."target_care_group_id"
    OR NEW."issued_by_role_assignment_id" IS DISTINCT FROM OLD."issued_by_role_assignment_id"
    OR NEW."issued_at" IS DISTINCT FROM OLD."issued_at"
    OR NEW."expires_at" IS DISTINCT FROM OLD."expires_at"
    OR NEW."trial_starts_at" IS DISTINCT FROM OLD."trial_starts_at"
    OR NEW."trial_ends_at" IS DISTINCT FROM OLD."trial_ends_at"
    OR NEW."review_at" IS DISTINCT FROM OLD."review_at"
    OR NEW."offer_head" <> OLD."offer_head" + 1
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR NEW."updated_at" < OLD."updated_at"
    OR (OLD."lifecycle" = 'open' AND NEW."lifecycle" NOT IN ('accepted', 'declined', 'expired', 'withdrawn'))
    OR (OLD."lifecycle" = 'accepted' AND NEW."lifecycle" <> 'withdrawn')
    OR OLD."lifecycle" IN ('declined', 'expired', 'withdrawn')
  ) THEN
    RAISE EXCEPTION 'nurture trial offer update is not monotone'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_enrollment_waitlist_entry" entry
    JOIN "nurture_institution_workflow" workflow
      ON workflow."id" = entry."workflow_id"
    JOIN "nurture_care_group" care_group
      ON care_group."id" = entry."target_care_group_id"
    JOIN "nurture_care_role_assignment" role
      ON role."id" = NEW."issued_by_role_assignment_id"
    WHERE entry."id" = NEW."entry_id"
      AND entry."workflow_id" = NEW."workflow_id"
      AND entry."target_care_group_id" = NEW."target_care_group_id"
      AND entry."workspace_id" = NEW."workspace_id"
      AND entry."institution_id" = NEW."institution_id"
      AND workflow."workspace_id" = NEW."workspace_id"
      AND workflow."institution_id" = NEW."institution_id"
      AND care_group."workspace_id" = NEW."workspace_id"
      AND care_group."institution_id" = NEW."institution_id"
      AND role."workspace_id" = NEW."workspace_id"
      AND role."role" = 'institution_admin'
      AND role."scope_type" = 'institution'
      AND role."scope_id" = NEW."institution_id"
      AND role."status" = 'active'
      AND role."deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture trial offer scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_trial_offer_validate_scope"
BEFORE INSERT OR UPDATE ON "nurture_enrollment_trial_offer"
FOR EACH ROW EXECUTE FUNCTION "nurture_trial_offer_validate_scope"();
CREATE TRIGGER "trg_nurture_trial_offer_reject_delete"
BEFORE DELETE ON "nurture_enrollment_trial_offer"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_delete"();

CREATE FUNCTION "nurture_trial_reservation_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  class_capacity INTEGER;
  active_occupancy INTEGER;
  held_reservations INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."workflow_id" IS DISTINCT FROM OLD."workflow_id"
    OR NEW."entry_id" IS DISTINCT FROM OLD."entry_id"
    OR NEW."offer_id" IS DISTINCT FROM OLD."offer_id"
    OR NEW."target_care_group_id" IS DISTINCT FROM OLD."target_care_group_id"
    OR NEW."accepted_action_ref" IS DISTINCT FROM OLD."accepted_action_ref"
    OR NEW."accepted_actor_ref" IS DISTINCT FROM OLD."accepted_actor_ref"
    OR NEW."held_at" IS DISTINCT FROM OLD."held_at"
    OR NEW."trial_starts_at" IS DISTINCT FROM OLD."trial_starts_at"
    OR NEW."trial_ends_at" IS DISTINCT FROM OLD."trial_ends_at"
    OR NEW."review_at" IS DISTINCT FROM OLD."review_at"
    OR NEW."reservation_head" <> OLD."reservation_head" + 1
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR NEW."updated_at" < OLD."updated_at"
    OR OLD."state" <> 'held'
    OR NEW."state" NOT IN ('released', 'converted_to_occupancy')
  ) THEN
    RAISE EXCEPTION 'nurture trial reservation update is not monotone'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_enrollment_waitlist_entry" entry
    JOIN "nurture_enrollment_trial_offer" offer
      ON offer."entry_id" = entry."id"
    JOIN "nurture_institution_workflow" workflow
      ON workflow."id" = entry."workflow_id"
    WHERE entry."id" = NEW."entry_id"
      AND offer."id" = NEW."offer_id"
      AND workflow."id" = NEW."workflow_id"
      AND entry."target_care_group_id" = NEW."target_care_group_id"
      AND offer."target_care_group_id" = NEW."target_care_group_id"
      AND entry."workspace_id" = NEW."workspace_id"
      AND offer."workspace_id" = NEW."workspace_id"
      AND workflow."workspace_id" = NEW."workspace_id"
      AND entry."institution_id" = NEW."institution_id"
      AND offer."institution_id" = NEW."institution_id"
      AND workflow."institution_id" = NEW."institution_id"
      AND offer."trial_starts_at" = NEW."trial_starts_at"
      AND offer."trial_ends_at" = NEW."trial_ends_at"
      AND offer."review_at" = NEW."review_at"
  ) THEN
    RAISE EXCEPTION 'nurture trial reservation scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' AND NEW."state" = 'held' THEN
    SELECT "capacity" INTO class_capacity
    FROM "nurture_care_group"
    WHERE "id" = NEW."target_care_group_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "institution_id" = NEW."institution_id"
      AND "status" = 'active'
      AND "deleted_at" IS NULL
    FOR UPDATE;
    IF class_capacity IS NULL OR class_capacity < 1 THEN
      RAISE EXCEPTION 'nurture trial reservation capacity unavailable'
        USING ERRCODE = '23514';
    END IF;
    SELECT count(*) INTO active_occupancy
    FROM "nurture_enrollment"
    WHERE "workspace_id" = NEW."workspace_id"
      AND "care_group_id" = NEW."target_care_group_id"
      AND "status" = 'active'
      AND "deleted_at" IS NULL;
    SELECT count(*) INTO held_reservations
    FROM "nurture_enrollment_trial_reservation"
    WHERE "workspace_id" = NEW."workspace_id"
      AND "target_care_group_id" = NEW."target_care_group_id"
      AND "state" = 'held';
    IF active_occupancy + held_reservations >= class_capacity THEN
      RAISE EXCEPTION 'nurture trial reservation exceeds exact class capacity'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_trial_reservation_validate_scope"
BEFORE INSERT OR UPDATE ON "nurture_enrollment_trial_reservation"
FOR EACH ROW EXECUTE FUNCTION "nurture_trial_reservation_validate_scope"();
CREATE TRIGGER "trg_nurture_trial_reservation_reject_delete"
BEFORE DELETE ON "nurture_enrollment_trial_reservation"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_delete"();

CREATE FUNCTION "nurture_trial_reservation_require_state"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_enrollment_waitlist_entry" entry
    JOIN "nurture_enrollment_trial_offer" offer
      ON offer."id" = NEW."offer_id"
    JOIN "nurture_institution_workflow" workflow
      ON workflow."id" = NEW."workflow_id"
    WHERE entry."id" = NEW."entry_id"
      AND (
        (NEW."state" = 'held'
          AND entry."lifecycle" = 'accepted'
          AND offer."lifecycle" = 'accepted'
          AND workflow."lifecycle" = 'active'
          AND workflow."current_stage" = 'trial_preparation'
          AND workflow."pending_transition" = 'trial_start_pending')
        OR (NEW."state" = 'released'
          AND entry."lifecycle" = 'accepted'
          AND offer."lifecycle" = 'withdrawn'
          AND workflow."lifecycle" = 'closed_without_formalization'
          AND workflow."current_stage" = 'closed'
          AND workflow."terminal_outcome" = 'preparation_cancelled')
        OR NEW."state" = 'converted_to_occupancy'
      )
  ) THEN
    RAISE EXCEPTION 'nurture trial reservation final state mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "trg_nurture_trial_reservation_require_state"
AFTER INSERT OR UPDATE ON "nurture_enrollment_trial_reservation"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "nurture_trial_reservation_require_state"();

CREATE FUNCTION "nurture_enrollment_guard_held_capacity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  class_capacity INTEGER;
  active_occupancy INTEGER;
  held_reservations INTEGER;
BEGIN
  IF NEW."status" <> 'active' OR NEW."deleted_at" IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT "capacity" INTO class_capacity
  FROM "nurture_care_group"
  WHERE "id" = NEW."care_group_id"
    AND "workspace_id" = NEW."workspace_id"
  FOR UPDATE;
  IF class_capacity IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO active_occupancy
  FROM "nurture_enrollment"
  WHERE "workspace_id" = NEW."workspace_id"
    AND "care_group_id" = NEW."care_group_id"
    AND "status" = 'active'
    AND "deleted_at" IS NULL
    AND "id" <> NEW."id";
  SELECT count(*) INTO held_reservations
  FROM "nurture_enrollment_trial_reservation"
  WHERE "workspace_id" = NEW."workspace_id"
    AND "target_care_group_id" = NEW."care_group_id"
    AND "state" = 'held';
  IF active_occupancy + held_reservations >= class_capacity THEN
    RAISE EXCEPTION 'nurture enrollment exceeds held exact class capacity'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_enrollment_guard_held_capacity"
BEFORE INSERT OR UPDATE OF "status", "care_group_id", "deleted_at"
ON "nurture_enrollment"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_guard_held_capacity"();

CREATE FUNCTION "nurture_care_group_guard_held_capacity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_occupancy INTEGER;
  held_reservations INTEGER;
BEGIN
  SELECT count(*) INTO held_reservations
  FROM "nurture_enrollment_trial_reservation"
  WHERE "workspace_id" = OLD."workspace_id"
    AND "target_care_group_id" = OLD."id"
    AND "state" = 'held';
  IF held_reservations = 0 THEN RETURN NEW; END IF;
  IF NEW."status" <> 'active'
    OR NEW."deleted_at" IS NOT NULL
    OR NEW."capacity" IS NULL
  THEN
    RAISE EXCEPTION 'nurture care group cannot invalidate held trial capacity'
      USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO active_occupancy
  FROM "nurture_enrollment"
  WHERE "workspace_id" = NEW."workspace_id"
    AND "care_group_id" = NEW."id"
    AND "status" = 'active'
    AND "deleted_at" IS NULL;
  IF active_occupancy + held_reservations > NEW."capacity" THEN
    RAISE EXCEPTION 'nurture care group capacity is below held trial use'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_care_group_guard_held_capacity"
BEFORE UPDATE OF "capacity", "status", "deleted_at"
ON "nurture_care_group"
FOR EACH ROW EXECUTE FUNCTION "nurture_care_group_guard_held_capacity"();

ALTER TABLE "nurture_institution_workflow_transition"
  DROP CONSTRAINT "ck_nurture_institution_workflow_transition_contract";
ALTER TABLE "nurture_institution_workflow_transition"
  ADD CONSTRAINT "ck_nurture_institution_workflow_transition_contract" CHECK (
    "workflow_head_before" >= 0
    AND "workflow_head_after" = "workflow_head_before" + 1
    AND "nurture_enrollment_milestone_delta_is_canonical"("added_milestones")
    AND "command_key" IN (
      'start_enrollment_inquiry',
      'record_external_touchpoint',
      'confirm_native_touchpoint_note',
      'confirm_intent_conversation',
      'record_or_skip_visit',
      'close_inquiry',
      'qualify_capacity_waitlist',
      'review_waitlist_interest',
      'override_waitlist_category',
      'issue_trial_offer',
      'accept_trial_offer',
      'decline_or_expire_trial_offer',
      'withdraw_from_waitlist',
      'cancel_trial_preparation'
    )
    AND "reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND (
      ("actor_role_assignment_id" IS NOT NULL
        AND "actor_ref" IS NULL AND "owner_action_ref" IS NULL)
      OR ("actor_role_assignment_id" IS NULL
        AND "nurture_canonical_ref_v1_is_valid"("actor_ref", 'my_chat', NULL)
        AND "nurture_canonical_ref_v1_is_valid"("owner_action_ref", 'my_chat', NULL))
    )
    AND (
      ("workflow_head_before" = 0
        AND "stage_before" IS NULL
        AND "waiting_state_before" IS NULL
        AND "pending_transition_before" IS NULL
        AND "lifecycle_before" IS NULL
        AND "terminal_outcome_before" IS NULL)
      OR ("workflow_head_before" > 0
        AND "stage_before" IS NOT NULL
        AND "waiting_state_before" IS NOT NULL
        AND "pending_transition_before" IS NOT NULL
        AND "lifecycle_before" IS NOT NULL
        AND "terminal_outcome_before" IS NOT NULL)
    )
  );

CREATE OR REPLACE FUNCTION "nurture_workflow_transition_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_workflow "nurture_institution_workflow"%ROWTYPE;
  previous_transition "nurture_institution_workflow_transition"%ROWTYPE;
  transition_milestones "NurtureEnrollmentJourneyMilestone"[];
  workflow_found BOOLEAN;
  business_state_unchanged BOOLEAN;
  stage_shell_unchanged BOOLEAN;
  actor_valid BOOLEAN;
BEGIN
  SELECT * INTO current_workflow
  FROM "nurture_institution_workflow"
  WHERE "id" = NEW."workflow_id"
    AND "workspace_id" = NEW."workspace_id"
    AND "institution_id" = NEW."institution_id";
  workflow_found := FOUND;

  business_state_unchanged :=
    NEW."stage_before" IS NOT DISTINCT FROM NEW."stage_after"
    AND NEW."waiting_state_before" IS NOT DISTINCT FROM NEW."waiting_state_after"
    AND NEW."pending_transition_before" IS NOT DISTINCT FROM NEW."pending_transition_after"
    AND NEW."lifecycle_before" IS NOT DISTINCT FROM NEW."lifecycle_after"
    AND NEW."terminal_outcome_before" IS NOT DISTINCT FROM NEW."terminal_outcome_after";
  stage_shell_unchanged :=
    NEW."stage_before" IS NOT DISTINCT FROM NEW."stage_after"
    AND NEW."pending_transition_before" IS NOT DISTINCT FROM NEW."pending_transition_after"
    AND NEW."lifecycle_before" IS NOT DISTINCT FROM NEW."lifecycle_after"
    AND NEW."terminal_outcome_before" IS NOT DISTINCT FROM NEW."terminal_outcome_after";

  IF (
    CASE NEW."command_key"
      WHEN 'start_enrollment_inquiry' THEN
        NEW."workflow_head_before" = 0
        AND NEW."workflow_head_after" = 1
        AND NEW."stage_after" = 'inquiry'
        AND NEW."waiting_state_after" = 'ready'
        AND NEW."pending_transition_after" = 'none'
        AND NEW."lifecycle_after" = 'active'
        AND NEW."terminal_outcome_after" = 'none'
        AND NEW."added_milestones" = ARRAY[
          'inquiry_started'
        ]::"NurtureEnrollmentJourneyMilestone"[]
        AND NEW."reason_key" = 'inquiry_started'
      WHEN 'record_external_touchpoint' THEN
        NEW."workflow_head_before" > 0
        AND business_state_unchanged
        AND cardinality(NEW."added_milestones") = 0
        AND NEW."reason_key" IN (
          'external_touchpoint_recorded', 'external_touchpoint_corrected'
        )
      WHEN 'confirm_native_touchpoint_note' THEN
        NEW."workflow_head_before" > 0
        AND business_state_unchanged
        AND cardinality(NEW."added_milestones") = 0
        AND NEW."reason_key" = 'native_touchpoint_confirmed'
      WHEN 'confirm_intent_conversation' THEN
        NEW."stage_before" = 'inquiry'
        AND NEW."stage_after" = 'intent_conversation'
        AND NEW."waiting_state_before" IS NOT DISTINCT FROM NEW."waiting_state_after"
        AND NEW."pending_transition_before" IS NOT DISTINCT FROM NEW."pending_transition_after"
        AND NEW."lifecycle_before" IS NOT DISTINCT FROM NEW."lifecycle_after"
        AND NEW."terminal_outcome_before" IS NOT DISTINCT FROM NEW."terminal_outcome_after"
        AND NEW."added_milestones" = ARRAY[
          'intent_confirmed'
        ]::"NurtureEnrollmentJourneyMilestone"[]
        AND NEW."reason_key" = 'intent_confirmed'
      WHEN 'record_or_skip_visit' THEN
        NEW."stage_before" = 'intent_conversation'
        AND NEW."stage_after" = 'visit_or_consultation'
        AND NEW."waiting_state_before" IS NOT DISTINCT FROM NEW."waiting_state_after"
        AND NEW."pending_transition_before" IS NOT DISTINCT FROM NEW."pending_transition_after"
        AND NEW."lifecycle_before" IS NOT DISTINCT FROM NEW."lifecycle_after"
        AND NEW."terminal_outcome_before" IS NOT DISTINCT FROM NEW."terminal_outcome_after"
        AND (
          (NEW."reason_key" = 'visit_recorded'
            AND NEW."added_milestones" = ARRAY[
              'visit_recorded'
            ]::"NurtureEnrollmentJourneyMilestone"[])
          OR (NEW."reason_key" = 'visit_skipped'
            AND cardinality(NEW."added_milestones") = 0)
        )
      WHEN 'close_inquiry' THEN
        NEW."stage_before" IN ('inquiry', 'intent_conversation', 'visit_or_consultation')
        AND NEW."stage_after" = 'closed'
        AND NEW."waiting_state_after" = 'ready'
        AND NEW."pending_transition_after" = 'none'
        AND NEW."lifecycle_after" = 'closed_without_formalization'
        AND NEW."terminal_outcome_after" = 'inquiry_closed'
        AND cardinality(NEW."added_milestones") = 0
      WHEN 'qualify_capacity_waitlist' THEN
        NEW."stage_before" IN ('intent_conversation', 'visit_or_consultation')
        AND NEW."stage_after" = 'capacity_waitlist'
        AND NEW."waiting_state_after" = 'ready'
        AND NEW."pending_transition_after" = 'none'
        AND NEW."lifecycle_after" = 'active'
        AND NEW."terminal_outcome_after" = 'none'
        AND NEW."added_milestones" = ARRAY[
          'waitlist_qualified'
        ]::"NurtureEnrollmentJourneyMilestone"[]
        AND NEW."reason_key" = 'waitlist_qualified'
      WHEN 'review_waitlist_interest' THEN
        NEW."stage_before" = 'capacity_waitlist'
        AND stage_shell_unchanged
        AND NEW."waiting_state_after" IN ('ready', 'waiting_on_guardian')
        AND cardinality(NEW."added_milestones") = 0
        AND NEW."reason_key" IN (
          'waitlist_interest_confirmed', 'waitlist_review_unanswered'
        )
      WHEN 'override_waitlist_category' THEN
        NEW."stage_after" = 'capacity_waitlist'
        AND business_state_unchanged
        AND cardinality(NEW."added_milestones") = 0
      WHEN 'issue_trial_offer' THEN
        NEW."stage_after" = 'capacity_waitlist'
        AND business_state_unchanged
        AND cardinality(NEW."added_milestones") = 0
      WHEN 'accept_trial_offer' THEN
        NEW."stage_before" = 'capacity_waitlist'
        AND NEW."stage_after" = 'trial_preparation'
        AND NEW."waiting_state_after" = 'waiting_on_system'
        AND NEW."pending_transition_after" = 'trial_start_pending'
        AND NEW."lifecycle_after" = 'active'
        AND NEW."terminal_outcome_after" = 'none'
        AND NEW."added_milestones" = ARRAY[
          'trial_offer_accepted'
        ]::"NurtureEnrollmentJourneyMilestone"[]
        AND NEW."reason_key" = 'trial_offer_accepted'
      WHEN 'decline_or_expire_trial_offer' THEN
        NEW."stage_after" = 'capacity_waitlist'
        AND stage_shell_unchanged
        AND NEW."waiting_state_after" = 'waiting_on_guardian'
        AND cardinality(NEW."added_milestones") = 0
        AND NEW."reason_key" IN ('trial_offer_declined', 'trial_offer_expired')
      WHEN 'withdraw_from_waitlist' THEN
        NEW."stage_before" = 'capacity_waitlist'
        AND NEW."stage_after" = 'closed'
        AND NEW."waiting_state_after" = 'ready'
        AND NEW."pending_transition_after" = 'none'
        AND NEW."lifecycle_after" = 'closed_without_formalization'
        AND NEW."terminal_outcome_after" = 'waitlist_withdrawn'
        AND cardinality(NEW."added_milestones") = 0
      WHEN 'cancel_trial_preparation' THEN
        NEW."stage_before" = 'trial_preparation'
        AND NEW."stage_after" = 'closed'
        AND NEW."waiting_state_after" = 'ready'
        AND NEW."pending_transition_after" = 'none'
        AND NEW."lifecycle_after" = 'closed_without_formalization'
        AND NEW."terminal_outcome_after" = 'preparation_cancelled'
        AND NEW."added_milestones" = ARRAY[
          'preparation_cancelled'
        ]::"NurtureEnrollmentJourneyMilestone"[]
      ELSE FALSE
    END
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'nurture institution workflow command transition mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."workflow_head_before" = 0 THEN
    IF EXISTS (
      SELECT 1 FROM "nurture_institution_workflow_transition"
      WHERE "workflow_id" = NEW."workflow_id"
    ) THEN
      RAISE EXCEPTION 'nurture institution workflow transition first-head mismatch'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    SELECT * INTO previous_transition
    FROM "nurture_institution_workflow_transition"
    WHERE "workflow_id" = NEW."workflow_id"
      AND "workflow_head_after" = NEW."workflow_head_before";
    IF NOT FOUND
      OR previous_transition."stage_after" IS DISTINCT FROM NEW."stage_before"
      OR previous_transition."waiting_state_after" IS DISTINCT FROM NEW."waiting_state_before"
      OR previous_transition."pending_transition_after" IS DISTINCT FROM NEW."pending_transition_before"
      OR previous_transition."lifecycle_after" IS DISTINCT FROM NEW."lifecycle_before"
      OR previous_transition."terminal_outcome_after" IS DISTINCT FROM NEW."terminal_outcome_before"
    THEN
      RAISE EXCEPTION 'nurture institution workflow transition chain mismatch'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "nurture_institution_workflow_transition"
    WHERE "workflow_id" = NEW."workflow_id"
      AND "added_milestones" && NEW."added_milestones"
  ) THEN
    RAISE EXCEPTION 'nurture institution workflow milestone was added twice'
      USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(
    array_agg(milestone ORDER BY milestone),
    ARRAY[]::"NurtureEnrollmentJourneyMilestone"[]
  ) INTO transition_milestones
  FROM (
    SELECT unnest("added_milestones") AS milestone
    FROM "nurture_institution_workflow_transition"
    WHERE "workflow_id" = NEW."workflow_id"
    UNION
    SELECT unnest(NEW."added_milestones") AS milestone
  ) AS transition_milestone_rows;

  IF NEW."actor_role_assignment_id" IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM "nurture_command_execution" execution
      JOIN "nurture_care_role_assignment" role
        ON role."id" = NEW."actor_role_assignment_id"
       AND role."workspace_id" = NEW."workspace_id"
       AND role."participant_id" = execution."business_actor_ref"
       AND role."role" = 'institution_admin'
       AND role."scope_type" = 'institution'
       AND role."scope_id" = NEW."institution_id"
       AND role."status" = 'active'
       AND role."deleted_at" IS NULL
      WHERE execution."id" = NEW."command_execution_id"
        AND execution."workspace_id" = NEW."workspace_id"
        AND execution."command_key" = 'nurture.' || NEW."command_key"
        AND execution."command_scope" = 'institution_enrollment_journey'
        AND execution."committed_at" = NEW."occurred_at"
    ) INTO actor_valid;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM "nurture_command_execution" execution
      WHERE execution."id" = NEW."command_execution_id"
        AND execution."workspace_id" = NEW."workspace_id"
        AND execution."command_key" = 'nurture.' || NEW."command_key"
        AND execution."command_scope" = 'institution_enrollment_journey'
        AND execution."business_actor_ref" = NEW."actor_ref" ->> 'object_id'
        AND execution."committed_at" = NEW."occurred_at"
    ) INTO actor_valid;
  END IF;

  actor_valid := actor_valid AND (
    (NEW."command_key" IN (
      'start_enrollment_inquiry', 'record_external_touchpoint',
      'confirm_native_touchpoint_note', 'confirm_intent_conversation',
      'record_or_skip_visit', 'close_inquiry', 'qualify_capacity_waitlist',
      'override_waitlist_category', 'issue_trial_offer'
    ) AND NEW."actor_role_assignment_id" IS NOT NULL)
    OR (NEW."command_key" IN ('accept_trial_offer', 'withdraw_from_waitlist')
      AND NEW."owner_action_ref" IS NOT NULL)
    OR (NEW."command_key" = 'review_waitlist_interest' AND (
      (NEW."reason_key" = 'waitlist_interest_confirmed'
        AND NEW."owner_action_ref" IS NOT NULL)
      OR (NEW."reason_key" = 'waitlist_review_unanswered'
        AND NEW."actor_role_assignment_id" IS NOT NULL)
    ))
    OR (NEW."command_key" = 'decline_or_expire_trial_offer' AND (
      (NEW."reason_key" = 'trial_offer_declined'
        AND NEW."owner_action_ref" IS NOT NULL)
      OR (NEW."reason_key" = 'trial_offer_expired'
        AND NEW."actor_role_assignment_id" IS NOT NULL)
    ))
    OR (NEW."command_key" = 'cancel_trial_preparation')
  );

  IF NOT workflow_found
    OR current_workflow."workflow_head" <> NEW."workflow_head_after"
    OR current_workflow."current_stage" <> NEW."stage_after"
    OR current_workflow."waiting_state" <> NEW."waiting_state_after"
    OR current_workflow."pending_transition" <> NEW."pending_transition_after"
    OR current_workflow."lifecycle" <> NEW."lifecycle_after"
    OR current_workflow."terminal_outcome" <> NEW."terminal_outcome_after"
    OR current_workflow."completed_milestones" IS DISTINCT FROM transition_milestones
    OR actor_valid IS NOT TRUE
  THEN
    RAISE EXCEPTION 'nurture institution workflow transition scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
