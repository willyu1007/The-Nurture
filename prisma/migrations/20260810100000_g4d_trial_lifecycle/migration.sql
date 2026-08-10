-- G4-D increment 4 — I1 trial relationship lifecycle. Reuses Enrollment,
-- ChildLinkGrant, the exact-class reservation, workflow and command ledger.
-- No public caller, TrialChild table, timer transition, or My-Chat write.

CREATE TYPE "NurtureEnrollmentParticipationPhase" AS ENUM ('trial', 'formal');

ALTER TABLE "nurture_enrollment"
  ADD COLUMN "participation_phase" "NurtureEnrollmentParticipationPhase";

-- Existing active rows are the pre-0E-3 formal population. Terminal legacy
-- rows remain nullable so the migration does not invent historical phase.
UPDATE "nurture_enrollment"
SET "participation_phase" = 'formal'
WHERE "status" = 'active' AND "participation_phase" IS NULL;

ALTER TABLE "nurture_enrollment"
  ADD CONSTRAINT "ck_nurture_enrollment_participation_phase" CHECK (
    ("status" = 'pending' AND "participation_phase" IS NULL)
    OR ("status" = 'active' AND "participation_phase" IS NOT NULL)
    OR ("status" = 'ended')
    OR ("status" IN ('paused', 'withdrawn', 'deleted')
      AND "participation_phase" IS DISTINCT FROM 'trial')
  );

-- Replace the now-subsumed active-only uniqueness and group lookup indexes;
-- keeping both would create two physical enforcement/read tracks.
DROP INDEX "uq_nurture_enrollment_active_process_institution";
DROP INDEX "ix_nurture_enrollment_group";

CREATE UNIQUE INDEX "uq_nurture_enrollment_current_process_institution"
  ON "nurture_enrollment" ("workspace_id", "child_care_process_id", "institution_id")
  WHERE "status" IN ('pending', 'active', 'paused') AND "deleted_at" IS NULL;
CREATE UNIQUE INDEX "uq_nurture_grant_current_enrollment"
  ON "nurture_child_link_grant" ("workspace_id", "enrollment_id")
  WHERE "status" = 'pending' AND "deleted_at" IS NULL;
CREATE INDEX "ix_nurture_enrollment_group_phase"
  ON "nurture_enrollment"
  ("workspace_id", "care_group_id", "status", "participation_phase");

ALTER TABLE "nurture_enrollment_trial_reservation"
  DROP CONSTRAINT "ck_nurture_trial_reservation_contract";
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
        AND "release_reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$')
      OR ("state" = 'converted_to_occupancy' AND "converted_at" IS NOT NULL
        AND "released_at" IS NULL AND "release_reason_key" IS NULL)
    )
  );

-- Increment 2 allowed a canonical child binding only at formal completion.
-- 0E-3 requires that exact binding during preparation/trial and retains it in
-- the terminal trial history; the provisional subject remains non-identity.
ALTER TABLE "nurture_institution_workflow"
  DROP CONSTRAINT "ck_nurture_institution_workflow_identity";
ALTER TABLE "nurture_institution_workflow"
  ADD CONSTRAINT "ck_nurture_institution_workflow_identity" CHECK (
    "workflow_type" = 'EnrollmentJourneyWorkflowV1'
    AND "workflow_head" >= 1
    AND "nurture_canonical_ref_v1_is_valid"(
      "workflow_run_ref", 'my_chat', 'workflow_run'
    )
    AND "workflow_run_object_id" = "workflow_run_ref" ->> 'object_id'
    AND "updated_at" >= "started_at"
    AND (
      "child_care_process_id" IS NULL
      OR ("lifecycle" = 'active'
        AND "current_stage" IN (
          'trial_preparation', 'trial_in_progress', 'trial_review',
          'formal_enrollment_confirmation'
        )
        AND "terminal_outcome" = 'none')
      OR ("lifecycle" = 'closed_without_formalization'
        AND "current_stage" = 'closed'
        AND "terminal_outcome" = 'trial_ended')
      OR ("lifecycle" = 'completed'
        AND "current_stage" = 'completed'
        AND "terminal_outcome" = 'formalized')
    )
  );

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

-- The original reservation carrier allowed only a held -> terminal update.
-- Increment 4 also permits monotone extension while converted and the final
-- converted -> released downscope. Offer schedule remains immutable history.
CREATE OR REPLACE FUNCTION "nurture_trial_reservation_validate_scope"()
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
    OR NEW."offer_id" IS DISTINCT FROM OLD."offer_id"
    OR NEW."target_care_group_id" IS DISTINCT FROM OLD."target_care_group_id"
    OR NEW."accepted_action_ref" IS DISTINCT FROM OLD."accepted_action_ref"
    OR NEW."accepted_actor_ref" IS DISTINCT FROM OLD."accepted_actor_ref"
    OR NEW."held_at" IS DISTINCT FROM OLD."held_at"
    OR NEW."trial_starts_at" IS DISTINCT FROM OLD."trial_starts_at"
    OR NEW."reservation_head" <> OLD."reservation_head" + 1
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR NEW."updated_at" < OLD."updated_at"
    OR (
      OLD."state" = 'held' AND (
        NEW."state" NOT IN ('released', 'converted_to_occupancy')
        OR NEW."trial_ends_at" IS DISTINCT FROM OLD."trial_ends_at"
        OR NEW."review_at" IS DISTINCT FROM OLD."review_at"
      )
    )
    OR (
      OLD."state" = 'converted_to_occupancy' AND (
        NEW."state" NOT IN ('converted_to_occupancy', 'released')
        OR NEW."trial_ends_at" < OLD."trial_ends_at"
        OR NEW."review_at" < OLD."review_at"
        OR NEW."review_at" > NEW."trial_ends_at"
        OR (NEW."state" = 'released' AND (
          NEW."trial_ends_at" IS DISTINCT FROM OLD."trial_ends_at"
          OR NEW."review_at" IS DISTINCT FROM OLD."review_at"
        ))
      )
    )
    OR OLD."state" = 'released'
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
      AND (
        (NEW."state" = 'held'
          AND offer."trial_ends_at" = NEW."trial_ends_at"
          AND offer."review_at" = NEW."review_at")
        OR (NEW."state" IN ('converted_to_occupancy', 'released')
          AND NEW."trial_ends_at" >= offer."trial_ends_at"
          AND NEW."review_at" >= offer."review_at"
          AND NEW."review_at" <= NEW."trial_ends_at")
      )
  ) THEN
    RAISE EXCEPTION 'nurture trial reservation scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

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
          AND workflow."lifecycle" = 'active'
          AND workflow."current_stage" IN (
            'trial_in_progress', 'trial_review', 'formal_enrollment_confirmation'
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
      'propose_formal_enrollment', 'end_trial'
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

-- Keep the proven increment-2/3 validator intact for its command set and add
-- a disjoint validator for the six increment-4 commands.
DROP TRIGGER "trg_nurture_workflow_transition_validate_scope"
  ON "nurture_institution_workflow_transition";
ALTER FUNCTION "nurture_workflow_transition_validate_scope"()
  RENAME TO "nurture_workflow_transition_validate_scope_g4d_i3";

CREATE TRIGGER "trg_nurture_workflow_transition_validate_scope_g4d_i3"
BEFORE INSERT ON "nurture_institution_workflow_transition"
FOR EACH ROW
WHEN (NEW."command_key" NOT IN (
  'prepare_trial_relationship', 'start_trial', 'mark_trial_review_reached',
  'extend_trial', 'propose_formal_enrollment', 'end_trial'
))
EXECUTE FUNCTION "nurture_workflow_transition_validate_scope_g4d_i3"();

CREATE FUNCTION "nurture_workflow_transition_validate_trial_lifecycle"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_workflow "nurture_institution_workflow"%ROWTYPE;
  previous_transition "nurture_institution_workflow_transition"%ROWTYPE;
  transition_milestones "NurtureEnrollmentJourneyMilestone"[];
  command_shape_valid BOOLEAN;
  actor_valid BOOLEAN;
BEGIN
  SELECT * INTO current_workflow
  FROM "nurture_institution_workflow"
  WHERE "id" = NEW."workflow_id"
    AND "workspace_id" = NEW."workspace_id"
    AND "institution_id" = NEW."institution_id";

  command_shape_valid := CASE NEW."command_key"
    WHEN 'prepare_trial_relationship' THEN
      NEW."stage_before" = 'trial_preparation'
      AND NEW."stage_after" = 'trial_preparation'
      AND NEW."waiting_state_before" = 'waiting_on_system'
      AND NEW."waiting_state_after" = 'waiting_on_system'
      AND NEW."pending_transition_before" = 'trial_start_pending'
      AND NEW."pending_transition_after" = 'trial_start_pending'
      AND NEW."lifecycle_before" = 'active'
      AND NEW."lifecycle_after" = 'active'
      AND NEW."terminal_outcome_before" = 'none'
      AND NEW."terminal_outcome_after" = 'none'
      AND cardinality(NEW."added_milestones") = 0
      AND NEW."reason_key" = 'trial_relationship_prepared'
    WHEN 'start_trial' THEN
      NEW."stage_before" = 'trial_preparation'
      AND NEW."stage_after" = 'trial_in_progress'
      AND NEW."waiting_state_before" = 'waiting_on_system'
      AND NEW."waiting_state_after" = 'ready'
      AND NEW."pending_transition_before" = 'trial_start_pending'
      AND NEW."pending_transition_after" = 'none'
      AND NEW."lifecycle_after" = 'active'
      AND NEW."terminal_outcome_after" = 'none'
      AND NEW."added_milestones" = ARRAY['trial_started']::"NurtureEnrollmentJourneyMilestone"[]
      AND NEW."reason_key" = 'trial_started'
      AND current_workflow."due_at" = (
        SELECT reservation."review_at"
        FROM "nurture_enrollment_trial_reservation" reservation
        WHERE reservation."workflow_id" = NEW."workflow_id"
          AND reservation."state" = 'converted_to_occupancy'
      )
    WHEN 'mark_trial_review_reached' THEN
      NEW."stage_before" = 'trial_in_progress'
      AND NEW."stage_after" = 'trial_review'
      AND NEW."waiting_state_before" = NEW."waiting_state_after"
      AND NEW."pending_transition_before" = NEW."pending_transition_after"
      AND NEW."lifecycle_before" = NEW."lifecycle_after"
      AND NEW."terminal_outcome_before" = NEW."terminal_outcome_after"
      AND (
        (NEW."added_milestones" = ARRAY[
          'trial_review_reached'
        ]::"NurtureEnrollmentJourneyMilestone"[]
          AND NOT EXISTS (
            SELECT 1 FROM "nurture_institution_workflow_transition"
            WHERE "workflow_id" = NEW."workflow_id"
              AND "added_milestones" && ARRAY[
                'trial_review_reached'
              ]::"NurtureEnrollmentJourneyMilestone"[]
          ))
        OR (cardinality(NEW."added_milestones") = 0
          AND EXISTS (
            SELECT 1 FROM "nurture_institution_workflow_transition"
            WHERE "workflow_id" = NEW."workflow_id"
              AND "added_milestones" && ARRAY[
                'trial_review_reached'
              ]::"NurtureEnrollmentJourneyMilestone"[]
          ))
      )
      AND NEW."reason_key" = 'trial_review_reached'
      AND current_workflow."due_at" = (
        SELECT reservation."trial_ends_at"
        FROM "nurture_enrollment_trial_reservation" reservation
        WHERE reservation."workflow_id" = NEW."workflow_id"
          AND reservation."state" = 'converted_to_occupancy'
      )
    WHEN 'extend_trial' THEN
      NEW."stage_before" = 'trial_review'
      AND NEW."stage_after" = 'trial_in_progress'
      AND NEW."waiting_state_before" = NEW."waiting_state_after"
      AND NEW."pending_transition_before" = NEW."pending_transition_after"
      AND NEW."lifecycle_before" = NEW."lifecycle_after"
      AND NEW."terminal_outcome_before" = NEW."terminal_outcome_after"
      AND NEW."added_milestones" = ARRAY['trial_extended']::"NurtureEnrollmentJourneyMilestone"[]
      AND current_workflow."due_at" = (
        SELECT reservation."review_at"
        FROM "nurture_enrollment_trial_reservation" reservation
        WHERE reservation."workflow_id" = NEW."workflow_id"
          AND reservation."state" = 'converted_to_occupancy'
      )
    WHEN 'propose_formal_enrollment' THEN
      NEW."stage_before" = 'trial_review'
      AND NEW."stage_after" = 'formal_enrollment_confirmation'
      AND NEW."waiting_state_after" = 'waiting_on_guardian'
      AND NEW."pending_transition_before" = NEW."pending_transition_after"
      AND NEW."lifecycle_before" = NEW."lifecycle_after"
      AND NEW."terminal_outcome_before" = NEW."terminal_outcome_after"
      AND NEW."added_milestones" = ARRAY['formal_proposed']::"NurtureEnrollmentJourneyMilestone"[]
      AND NEW."reason_key" = 'formal_enrollment_proposed'
      AND current_workflow."due_at" = (
        SELECT reservation."trial_ends_at"
        FROM "nurture_enrollment_trial_reservation" reservation
        WHERE reservation."workflow_id" = NEW."workflow_id"
          AND reservation."state" = 'converted_to_occupancy'
      )
    WHEN 'end_trial' THEN
      NEW."stage_before" IN (
        'trial_in_progress', 'trial_review', 'formal_enrollment_confirmation'
      )
      AND NEW."stage_after" = 'closed'
      AND NEW."waiting_state_after" = 'ready'
      AND NEW."pending_transition_after" = 'none'
      AND NEW."lifecycle_after" = 'closed_without_formalization'
      AND NEW."terminal_outcome_after" = 'trial_ended'
      AND NEW."added_milestones" = ARRAY['trial_ended']::"NurtureEnrollmentJourneyMilestone"[]
      AND current_workflow."due_at" IS NULL
    ELSE FALSE
  END;
  IF command_shape_valid IS NOT TRUE THEN
    RAISE EXCEPTION 'nurture trial lifecycle transition mismatch'
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
    RAISE EXCEPTION 'nurture trial lifecycle transition chain mismatch'
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

  IF current_workflow."workflow_head" <> NEW."workflow_head_after"
    OR current_workflow."current_stage" <> NEW."stage_after"
    OR current_workflow."waiting_state" <> NEW."waiting_state_after"
    OR current_workflow."pending_transition" <> NEW."pending_transition_after"
    OR current_workflow."lifecycle" <> NEW."lifecycle_after"
    OR current_workflow."terminal_outcome" <> NEW."terminal_outcome_after"
    OR current_workflow."completed_milestones" IS DISTINCT FROM transition_milestones
    OR actor_valid IS NOT TRUE
  THEN
    RAISE EXCEPTION 'nurture trial lifecycle transition scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_workflow_transition_validate_trial_lifecycle"
BEFORE INSERT ON "nurture_institution_workflow_transition"
FOR EACH ROW
WHEN (NEW."command_key" IN (
  'prepare_trial_relationship', 'start_trial', 'mark_trial_review_reached',
  'extend_trial', 'propose_formal_enrollment', 'end_trial'
))
EXECUTE FUNCTION "nurture_workflow_transition_validate_trial_lifecycle"();
