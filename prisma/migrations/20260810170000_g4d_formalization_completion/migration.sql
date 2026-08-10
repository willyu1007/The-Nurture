-- G4-D increment 5 — immutable formal proposal plus the atomic
-- trial-to-formal completion transaction. This adds no public caller, Host
-- workflow outbox, settling stage, deadline state or blocker carrier.

CREATE TABLE "nurture_enrollment_formal_proposal" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "enrollment_id" TEXT NOT NULL,
  "grant_id" TEXT NOT NULL,
  "reservation_id" TEXT NOT NULL,
  "care_group_id" TEXT NOT NULL,
  "care_group_head" INTEGER NOT NULL,
  "proposal_head" INTEGER NOT NULL DEFAULT 1,
  "proposed_formal_start_at" TIMESTAMP(3) NOT NULL,
  "proposed_grant_purposes" TEXT[] NOT NULL,
  "proposed_grant_expires_at" TIMESTAMP(3) NOT NULL,
  "safe_family_summary" VARCHAR(500) NOT NULL,
  "issued_by_role_assignment_id" TEXT NOT NULL,
  "issue_reason_key" TEXT NOT NULL,
  "issued_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_enrollment_formal_proposal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_formal_proposal_contract" CHECK (
    "care_group_head" >= 0
    AND "proposal_head" = 1
    AND "proposed_formal_start_at" < "proposed_grant_expires_at"
    AND "proposed_formal_start_at" < "expires_at"
    AND "issued_at" < "expires_at"
    AND "created_at" >= "issued_at"
    AND length(btrim("safe_family_summary")) BETWEEN 1 AND 500
    AND "safe_family_summary" = btrim("safe_family_summary")
    AND "issue_reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND "nurture_enrollment_key_array_is_valid"(
      "proposed_grant_purposes", TRUE
    )
  )
);

CREATE UNIQUE INDEX "uq_nurture_formal_proposal_workflow"
  ON "nurture_enrollment_formal_proposal"
  ("workspace_id", "workflow_id");
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_workflow_id_fkey"
  FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_enrollment_id_fkey"
  FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_grant_id_fkey"
  FOREIGN KEY ("grant_id") REFERENCES "nurture_child_link_grant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_reservation_id_fkey"
  FOREIGN KEY ("reservation_id") REFERENCES "nurture_enrollment_trial_reservation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_care_group_id_fkey"
  FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_formal_proposal"
  ADD CONSTRAINT "nurture_formal_proposal_actor_role_id_fkey"
  FOREIGN KEY ("issued_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "nurture_formal_proposal_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_institution_workflow" workflow
    JOIN "nurture_enrollment" enrollment
      ON enrollment."id" = NEW."enrollment_id"
    JOIN "nurture_child_link_grant" grant_row
      ON grant_row."id" = NEW."grant_id"
    JOIN "nurture_enrollment_trial_reservation" reservation
      ON reservation."id" = NEW."reservation_id"
    JOIN "nurture_care_group" care_group
      ON care_group."id" = NEW."care_group_id"
    JOIN "nurture_care_role_assignment" role
      ON role."id" = NEW."issued_by_role_assignment_id"
    WHERE workflow."id" = NEW."workflow_id"
      AND workflow."workspace_id" = NEW."workspace_id"
      AND workflow."institution_id" = NEW."institution_id"
      AND workflow."child_care_process_id" = enrollment."child_care_process_id"
      AND workflow."lifecycle" = 'active'
      AND workflow."current_stage" = 'formal_enrollment_confirmation'
      AND workflow."waiting_state" = 'waiting_on_guardian'
      AND workflow."completed_milestones" @> ARRAY[
        'formal_proposed'
      ]::"NurtureEnrollmentJourneyMilestone"[]
      AND enrollment."workspace_id" = NEW."workspace_id"
      AND enrollment."institution_id" = NEW."institution_id"
      AND enrollment."care_group_id" = NEW."care_group_id"
      AND enrollment."status" = 'active'
      AND enrollment."participation_phase" = 'trial'
      AND grant_row."workspace_id" = NEW."workspace_id"
      AND grant_row."enrollment_id" = NEW."enrollment_id"
      AND grant_row."child_care_process_id" = enrollment."child_care_process_id"
      AND grant_row."status" = 'active'
      AND reservation."workspace_id" = NEW."workspace_id"
      AND reservation."institution_id" = NEW."institution_id"
      AND reservation."workflow_id" = NEW."workflow_id"
      AND reservation."target_care_group_id" = NEW."care_group_id"
      AND reservation."state" = 'converted_to_occupancy'
      AND NEW."expires_at" <= reservation."trial_ends_at"
      AND NEW."proposed_formal_start_at" >= reservation."trial_starts_at"
      AND care_group."workspace_id" = NEW."workspace_id"
      AND care_group."institution_id" = NEW."institution_id"
      AND care_group."aggregate_version" = NEW."care_group_head"
      AND care_group."status" = 'active'
      AND role."workspace_id" = NEW."workspace_id"
      AND role."role" = 'institution_admin'
      AND role."scope_type" = 'institution'
      AND role."scope_id" = NEW."institution_id"
      AND role."status" = 'active'
      AND role."deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture formal proposal scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."proposal_head" <> 1 OR EXISTS (
    SELECT 1 FROM "nurture_enrollment_formal_proposal"
    WHERE "workspace_id" = NEW."workspace_id"
      AND "workflow_id" = NEW."workflow_id"
  ) THEN
    RAISE EXCEPTION 'nurture formal proposal identity mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_formal_proposal_validate_scope"
BEFORE INSERT ON "nurture_enrollment_formal_proposal"
FOR EACH ROW
EXECUTE FUNCTION "nurture_formal_proposal_validate_scope"();

CREATE FUNCTION "nurture_formal_proposal_is_immutable"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'nurture formal proposal is immutable'
    USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER "trg_nurture_formal_proposal_is_immutable"
BEFORE UPDATE OR DELETE ON "nurture_enrollment_formal_proposal"
FOR EACH ROW
EXECUTE FUNCTION "nurture_formal_proposal_is_immutable"();

ALTER TABLE "nurture_institution_workflow_transition"
  ADD COLUMN "formal_proposal_id" TEXT,
  ADD COLUMN "owner_evidence_hash" CHAR(64),
  ADD COLUMN "owner_evidence_metadata" JSONB;
ALTER TABLE "nurture_institution_workflow_transition"
  ADD CONSTRAINT "nurture_workflow_transition_formal_proposal_id_fkey"
  FOREIGN KEY ("formal_proposal_id")
  REFERENCES "nurture_enrollment_formal_proposal"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "ix_nurture_workflow_transition_formal_proposal"
  ON "nurture_institution_workflow_transition"("formal_proposal_id");

CREATE FUNCTION "nurture_formalization_evidence_metadata_is_valid"(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT jsonb_typeof(value) = 'object'
    AND value ?& ARRAY[
      'contract_version', 'purpose_key', 'audience', 'request_nonce_hash',
      'verified_at', 'expires_at'
    ]
    AND (SELECT count(*) FROM jsonb_object_keys(value)) = 6
    AND value ->> 'contract_version' = '1.0.0'
    AND value ->> 'purpose_key' = 'formalize_enrollment'
    AND value ->> 'audience' = 'nurture'
    AND value ->> 'request_nonce_hash' ~ '^[0-9a-f]{64}$'
    AND (value ->> 'verified_at')::TIMESTAMPTZ
      < (value ->> 'expires_at')::TIMESTAMPTZ;
$$;

CREATE UNIQUE INDEX "uq_nurture_formal_acceptance_action"
  ON "nurture_institution_workflow_transition"
  ("workspace_id", (("owner_action_ref" ->> 'object_id')))
  WHERE "command_key" = 'formalize_enrollment';

-- Permit the one frozen formal-confirmation -> completed transition to clear
-- its due time. All earlier monotonicity rules remain unchanged.
CREATE OR REPLACE FUNCTION "nurture_institution_workflow_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."workflow_run_ref" IS DISTINCT FROM OLD."workflow_run_ref"
    OR NEW."workflow_run_object_id" IS DISTINCT FROM OLD."workflow_run_object_id"
    OR NEW."workflow_type" IS DISTINCT FROM OLD."workflow_type"
    OR NEW."provisional_subject_ref" IS DISTINCT FROM OLD."provisional_subject_ref"
    OR (
      OLD."child_care_process_id" IS NOT NULL
      AND NEW."child_care_process_id" IS DISTINCT FROM OLD."child_care_process_id"
    )
    OR NEW."workflow_head" <> OLD."workflow_head" + 1
    OR (
      NEW."current_stage" < OLD."current_stage"
      AND NOT (
        OLD."current_stage" = 'trial_review'
        AND NEW."current_stage" = 'trial_in_progress'
        AND NEW."lifecycle" = 'active'
        AND NEW."completed_milestones" @> ARRAY[
          'trial_extended'
        ]::"NurtureEnrollmentJourneyMilestone"[]
      )
    )
    OR NOT (NEW."completed_milestones" @> OLD."completed_milestones")
    OR (
      OLD."lifecycle" <> 'active'
      AND NOT (
        NEW."lifecycle" = OLD."lifecycle"
        AND NEW."current_stage" = OLD."current_stage"
        AND NEW."waiting_state" = 'ready'
        AND OLD."waiting_state" = 'waiting_on_system'
        AND NEW."pending_transition" = 'none'
        AND OLD."pending_transition" = 'none'
        AND NEW."terminal_outcome" = OLD."terminal_outcome"
        AND NEW."completed_milestones" = OLD."completed_milestones"
      )
    )
    OR NEW."started_at" IS DISTINCT FROM OLD."started_at"
    OR (
      NEW."due_at" IS DISTINCT FROM OLD."due_at"
      AND NOT (
        OLD."lifecycle" = 'active'
        AND (
          (OLD."current_stage" = 'trial_preparation'
            AND NEW."current_stage" = 'trial_in_progress'
            AND NEW."due_at" IS NOT NULL)
          OR (OLD."current_stage" = 'trial_in_progress'
            AND NEW."current_stage" = 'trial_review'
            AND NEW."due_at" IS NOT NULL)
          OR (OLD."current_stage" = 'trial_review'
            AND NEW."current_stage" IN (
              'trial_in_progress', 'formal_enrollment_confirmation'
            )
            AND NEW."due_at" IS NOT NULL)
          OR (NEW."current_stage" = 'closed' AND NEW."due_at" IS NULL)
          OR (OLD."current_stage" = 'formal_enrollment_confirmation'
            AND NEW."current_stage" = 'completed'
            AND NEW."lifecycle" = 'completed'
            AND NEW."terminal_outcome" = 'formalized'
            AND NEW."due_at" IS NULL)
        )
      )
    )
    OR NEW."updated_at" < OLD."updated_at"
  ) THEN
    RAISE EXCEPTION 'nurture institution workflow update is not monotone'
      USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "nurture_care_institution"
    WHERE "id" = NEW."institution_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture institution workflow scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  IF NEW."child_care_process_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "nurture_child_care_process"
    WHERE "id" = NEW."child_care_process_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture institution workflow child process scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

-- A converted reservation is the same occupied seat before and after
-- formalization. The deferred invariant now accepts either active/trial or
-- completed/formal without releasing and reacquiring it.
CREATE OR REPLACE FUNCTION "nurture_trial_reservation_require_state"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_enrollment_waitlist_entry" entry
    JOIN "nurture_enrollment_trial_offer" offer ON offer."id" = NEW."offer_id"
    JOIN "nurture_institution_workflow" workflow ON workflow."id" = NEW."workflow_id"
    WHERE entry."id" = NEW."entry_id"
      AND (
        (NEW."state" = 'held'
          AND entry."lifecycle" = 'accepted'
          AND offer."lifecycle" = 'accepted'
          AND workflow."lifecycle" = 'active'
          AND workflow."current_stage" = 'trial_preparation'
          AND workflow."pending_transition" = 'trial_start_pending')
        OR (NEW."state" = 'converted_to_occupancy'
          AND entry."lifecycle" = 'accepted'
          AND offer."lifecycle" = 'accepted'
          AND (
            (workflow."lifecycle" = 'active'
              AND workflow."current_stage" IN (
                'trial_in_progress', 'trial_review',
                'formal_enrollment_confirmation'
              )
              AND workflow."due_at" = CASE workflow."current_stage"
                WHEN 'trial_in_progress' THEN NEW."review_at"
                ELSE NEW."trial_ends_at"
              END
              AND EXISTS (
                SELECT 1
                FROM "nurture_enrollment" enrollment
                JOIN "nurture_child_link_grant" grant_row
                  ON grant_row."enrollment_id" = enrollment."id"
                WHERE enrollment."workspace_id" = NEW."workspace_id"
                  AND enrollment."institution_id" = NEW."institution_id"
                  AND enrollment."child_care_process_id" = workflow."child_care_process_id"
                  AND enrollment."care_group_id" = NEW."target_care_group_id"
                  AND enrollment."status" = 'active'
                  AND enrollment."participation_phase" = 'trial'
                  AND enrollment."deleted_at" IS NULL
                  AND grant_row."workspace_id" = NEW."workspace_id"
                  AND grant_row."child_care_process_id" = enrollment."child_care_process_id"
                  AND grant_row."status" = 'active'
                  AND grant_row."expires_at" = NEW."trial_ends_at"
                  AND grant_row."deleted_at" IS NULL
              ))
            OR (workflow."lifecycle" = 'completed'
              AND workflow."current_stage" = 'completed'
              AND workflow."terminal_outcome" = 'formalized'
              AND workflow."due_at" IS NULL
              AND EXISTS (
                SELECT 1
                FROM "nurture_enrollment" enrollment
                JOIN "nurture_child_link_grant" grant_row
                  ON grant_row."enrollment_id" = enrollment."id"
                WHERE enrollment."workspace_id" = NEW."workspace_id"
                  AND enrollment."institution_id" = NEW."institution_id"
                  AND enrollment."child_care_process_id" = workflow."child_care_process_id"
                  AND enrollment."care_group_id" = NEW."target_care_group_id"
                  AND enrollment."status" = 'active'
                  AND enrollment."participation_phase" = 'formal'
                  AND enrollment."deleted_at" IS NULL
                  AND grant_row."workspace_id" = NEW."workspace_id"
                  AND grant_row."child_care_process_id" = enrollment."child_care_process_id"
                  AND grant_row."status" = 'active'
                  AND grant_row."deleted_at" IS NULL
              ))
          ))
        OR (NEW."state" = 'released'
          AND (
            (entry."lifecycle" = 'accepted'
              AND offer."lifecycle" = 'withdrawn'
              AND workflow."lifecycle" = 'closed_without_formalization'
              AND workflow."current_stage" = 'closed'
              AND workflow."terminal_outcome" = 'preparation_cancelled')
            OR (entry."lifecycle" = 'accepted'
              AND offer."lifecycle" = 'accepted'
              AND workflow."lifecycle" = 'closed_without_formalization'
              AND workflow."current_stage" = 'closed'
              AND workflow."terminal_outcome" = 'trial_ended'
              AND EXISTS (
                SELECT 1
                FROM "nurture_enrollment" enrollment
                JOIN "nurture_child_link_grant" grant_row
                  ON grant_row."enrollment_id" = enrollment."id"
                WHERE enrollment."workspace_id" = NEW."workspace_id"
                  AND enrollment."institution_id" = NEW."institution_id"
                  AND enrollment."child_care_process_id" = workflow."child_care_process_id"
                  AND enrollment."care_group_id" = NEW."target_care_group_id"
                  AND enrollment."status" = 'ended'
                  AND enrollment."participation_phase" = 'trial'
                  AND grant_row."status" = 'revoked'
              ))
          ))
      )
  ) THEN
    RAISE EXCEPTION 'nurture trial reservation final state mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;

ALTER TABLE "nurture_institution_workflow_transition"
  DROP CONSTRAINT "ck_nurture_institution_workflow_transition_contract";
ALTER TABLE "nurture_institution_workflow_transition"
  ADD CONSTRAINT "ck_nurture_institution_workflow_transition_contract" CHECK (
    "workflow_head_before" >= 0
    AND "workflow_head_after" = "workflow_head_before" + 1
    AND "nurture_enrollment_milestone_delta_is_canonical"("added_milestones")
    AND "command_key" IN (
      'start_enrollment_inquiry', 'record_external_touchpoint',
      'confirm_native_touchpoint_note', 'confirm_intent_conversation',
      'record_or_skip_visit', 'close_inquiry', 'qualify_capacity_waitlist',
      'review_waitlist_interest', 'override_waitlist_category',
      'issue_trial_offer', 'accept_trial_offer',
      'decline_or_expire_trial_offer', 'withdraw_from_waitlist',
      'cancel_trial_preparation', 'prepare_trial_relationship', 'start_trial',
      'mark_trial_review_reached', 'extend_trial',
      'propose_formal_enrollment', 'formalize_enrollment', 'end_trial'
    )
    AND "reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
    AND (
      ("actor_role_assignment_id" IS NOT NULL
        AND "actor_ref" IS NULL AND "owner_action_ref" IS NULL
        AND "owner_evidence_hash" IS NULL
        AND "owner_evidence_metadata" IS NULL)
      OR ("actor_role_assignment_id" IS NULL
        AND (
          ("command_key" <> 'formalize_enrollment'
            AND "nurture_canonical_ref_v1_is_valid"("actor_ref", 'my_chat', NULL)
            AND "nurture_canonical_ref_v1_is_valid"(
              "owner_action_ref", 'my_chat', NULL
            )
            AND "owner_evidence_hash" IS NULL
            AND "owner_evidence_metadata" IS NULL)
          OR ("command_key" = 'formalize_enrollment'
            AND "nurture_canonical_ref_v1_is_valid"(
              "actor_ref", 'my_chat', 'actor'
            )
            AND "nurture_canonical_ref_v1_is_valid"(
              "owner_action_ref", 'my_chat', 'enrollment_action'
            )
            AND "owner_evidence_hash" ~ '^[0-9a-f]{64}$'
            AND "nurture_formalization_evidence_metadata_is_valid"(
              "owner_evidence_metadata"
            ))
        ))
    )
    AND (
      ("command_key" IN ('propose_formal_enrollment', 'formalize_enrollment')
        AND "formal_proposal_id" IS NOT NULL)
      OR ("command_key" NOT IN ('propose_formal_enrollment', 'formalize_enrollment')
        AND "formal_proposal_id" IS NULL)
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

CREATE FUNCTION "nurture_workflow_transition_validate_formal_proposal_link"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."command_key" = 'propose_formal_enrollment' AND NOT EXISTS (
    SELECT 1
    FROM "nurture_enrollment_formal_proposal" proposal
    WHERE proposal."id" = NEW."formal_proposal_id"
      AND proposal."workspace_id" = NEW."workspace_id"
      AND proposal."institution_id" = NEW."institution_id"
      AND proposal."workflow_id" = NEW."workflow_id"
      AND proposal."issued_by_role_assignment_id" = NEW."actor_role_assignment_id"
  ) THEN
    RAISE EXCEPTION 'nurture formal proposal transition link mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_workflow_transition_formal_proposal_link"
BEFORE INSERT ON "nurture_institution_workflow_transition"
FOR EACH ROW
WHEN (NEW."command_key" = 'propose_formal_enrollment')
EXECUTE FUNCTION "nurture_workflow_transition_validate_formal_proposal_link"();

CREATE FUNCTION "nurture_workflow_transition_validate_formalization"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_workflow "nurture_institution_workflow"%ROWTYPE;
  previous_transition "nurture_institution_workflow_transition"%ROWTYPE;
  transition_milestones "NurtureEnrollmentJourneyMilestone"[];
  execution_valid BOOLEAN;
BEGIN
  SELECT * INTO current_workflow
  FROM "nurture_institution_workflow"
  WHERE "id" = NEW."workflow_id"
    AND "workspace_id" = NEW."workspace_id"
    AND "institution_id" = NEW."institution_id";

  IF NEW."stage_before" <> 'formal_enrollment_confirmation'
    OR NEW."stage_after" <> 'completed'
    OR NEW."waiting_state_before" <> 'waiting_on_guardian'
    OR NEW."waiting_state_after" <> 'ready'
    OR NEW."pending_transition_before" <> 'none'
    OR NEW."pending_transition_after" <> 'none'
    OR NEW."lifecycle_before" <> 'active'
    OR NEW."lifecycle_after" <> 'completed'
    OR NEW."terminal_outcome_before" <> 'none'
    OR NEW."terminal_outcome_after" <> 'formalized'
    OR NEW."added_milestones" <> ARRAY[
      'guardian_formal_acceptance_recorded',
      'formal_enrollment_committed',
      'journey_completed'
    ]::"NurtureEnrollmentJourneyMilestone"[]
    OR NEW."reason_key" <> 'formal_enrollment_committed'
  THEN
    RAISE EXCEPTION 'nurture formalization transition mismatch'
      USING ERRCODE = '23514';
  END IF;

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
    RAISE EXCEPTION 'nurture formalization transition chain mismatch'
      USING ERRCODE = '23514';
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

  SELECT EXISTS (
    SELECT 1
    FROM "nurture_command_execution" execution
    WHERE execution."id" = NEW."command_execution_id"
      AND execution."workspace_id" = NEW."workspace_id"
      AND execution."command_key" = 'nurture.formalize_enrollment'
      AND execution."command_scope" = 'institution_enrollment_journey'
      AND execution."business_actor_ref" = NEW."actor_ref" ->> 'object_id'
      AND execution."committed_at" = NEW."occurred_at"
  ) INTO execution_valid;

  IF current_workflow."workflow_head" <> NEW."workflow_head_after"
    OR current_workflow."current_stage" <> NEW."stage_after"
    OR current_workflow."waiting_state" <> NEW."waiting_state_after"
    OR current_workflow."pending_transition" <> NEW."pending_transition_after"
    OR current_workflow."lifecycle" <> NEW."lifecycle_after"
    OR current_workflow."terminal_outcome" <> NEW."terminal_outcome_after"
    OR current_workflow."completed_milestones" IS DISTINCT FROM transition_milestones
    OR execution_valid IS NOT TRUE
    OR NOT EXISTS (
      SELECT 1
      FROM "nurture_enrollment_formal_proposal" proposal
      JOIN "nurture_enrollment" enrollment
        ON enrollment."id" = proposal."enrollment_id"
      JOIN "nurture_child_link_grant" grant_row
        ON grant_row."id" = proposal."grant_id"
      JOIN "nurture_enrollment_trial_reservation" reservation
        ON reservation."id" = proposal."reservation_id"
      JOIN "nurture_care_group" care_group
        ON care_group."id" = proposal."care_group_id"
      WHERE proposal."id" = NEW."formal_proposal_id"
        AND proposal."workspace_id" = NEW."workspace_id"
        AND proposal."institution_id" = NEW."institution_id"
        AND proposal."workflow_id" = NEW."workflow_id"
        AND enrollment."workspace_id" = NEW."workspace_id"
        AND enrollment."institution_id" = NEW."institution_id"
        AND enrollment."care_group_id" = proposal."care_group_id"
        AND enrollment."status" = 'active'
        AND enrollment."participation_phase" = 'formal'
        AND grant_row."workspace_id" = NEW."workspace_id"
        AND grant_row."enrollment_id" = enrollment."id"
        AND grant_row."status" = 'active'
        AND grant_row."purposes" = proposal."proposed_grant_purposes"
        AND grant_row."expires_at" = proposal."proposed_grant_expires_at"
        AND reservation."workspace_id" = NEW."workspace_id"
        AND reservation."workflow_id" = NEW."workflow_id"
        AND reservation."target_care_group_id" = proposal."care_group_id"
        AND reservation."state" = 'converted_to_occupancy'
        AND care_group."workspace_id" = NEW."workspace_id"
        AND care_group."institution_id" = NEW."institution_id"
        AND care_group."aggregate_version" = proposal."care_group_head"
    )
    OR NOT EXISTS (
      SELECT 1 FROM "nurture_institution_workflow_transition" proposed
      WHERE proposed."formal_proposal_id" = NEW."formal_proposal_id"
        AND proposed."workflow_id" = NEW."workflow_id"
        AND proposed."command_key" = 'propose_formal_enrollment'
    )
  THEN
    RAISE EXCEPTION 'nurture formalization transition scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_workflow_transition_validate_formalization"
BEFORE INSERT ON "nurture_institution_workflow_transition"
FOR EACH ROW
WHEN (NEW."command_key" = 'formalize_enrollment')
EXECUTE FUNCTION "nurture_workflow_transition_validate_formalization"();

-- Increment 4's routing excluded its six private lifecycle commands from the
-- earlier inquiry/waitlist validator. Formalization is the seventh disjoint
-- shape and is owned exclusively by the trigger above.
DROP TRIGGER "trg_nurture_workflow_transition_validate_scope_g4d_i3"
  ON "nurture_institution_workflow_transition";
CREATE TRIGGER "trg_nurture_workflow_transition_validate_scope_g4d_i3"
BEFORE INSERT ON "nurture_institution_workflow_transition"
FOR EACH ROW
WHEN (NEW."command_key" NOT IN (
  'prepare_trial_relationship', 'start_trial', 'mark_trial_review_reached',
  'extend_trial', 'propose_formal_enrollment', 'formalize_enrollment',
  'end_trial'
))
EXECUTE FUNCTION "nurture_workflow_transition_validate_scope_g4d_i3"();
