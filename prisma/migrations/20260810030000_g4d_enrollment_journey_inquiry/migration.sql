-- G4-D increment 2 — private EnrollmentJourneyWorkflowV1 inquiry carrier.
--
-- My-Chat still owns the shared workflow runtime and its outbox. These rows
-- carry only Nurture's private workflow, provisional inquiry, confirmed
-- touchpoint and immutable transition facts. NurtureCommandExecution remains
-- the sole command ledger and exact-replay authority.

CREATE TYPE "NurtureInstitutionWorkflowStage" AS ENUM (
  'inquiry',
  'intent_conversation',
  'visit_or_consultation',
  'capacity_waitlist',
  'trial_preparation',
  'trial_in_progress',
  'trial_review',
  'formal_enrollment_confirmation',
  'completed',
  'closed'
);

CREATE TYPE "NurtureInstitutionWorkflowWaitingState" AS ENUM (
  'ready',
  'waiting_on_guardian',
  'waiting_on_caregiver',
  'waiting_on_system',
  'scheduled_future',
  'blocked'
);

CREATE TYPE "NurtureInstitutionWorkflowPendingTransition" AS ENUM (
  'none', 'trial_start_pending', 'formalization_pending', 'exit_pending'
);

CREATE TYPE "NurtureInstitutionWorkflowLifecycle" AS ENUM (
  'active', 'completed', 'closed_without_formalization'
);

CREATE TYPE "NurtureInstitutionWorkflowTerminalOutcome" AS ENUM (
  'none',
  'formalized',
  'inquiry_closed',
  'waitlist_withdrawn',
  'preparation_cancelled',
  'trial_ended'
);

CREATE TYPE "NurtureEnrollmentJourneyMilestone" AS ENUM (
  'inquiry_started',
  'intent_confirmed',
  'visit_recorded',
  'waitlist_qualified',
  'trial_offer_accepted',
  'trial_started',
  'trial_review_reached',
  'trial_extended',
  'formal_proposed',
  'guardian_formal_acceptance_recorded',
  'preparation_cancelled',
  'trial_ended',
  'formal_enrollment_committed',
  'journey_completed'
);

CREATE TYPE "NurtureEnrollmentTouchpointSourceKind" AS ENUM (
  'native_business_communication', 'external_structured_summary'
);

CREATE TYPE "NurtureEnrollmentVisitDisposition" AS ENUM (
  'not_decided', 'recorded', 'skipped'
);

CREATE TABLE "nurture_institution_workflow" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_run_ref" JSONB NOT NULL,
  "workflow_run_object_id" TEXT NOT NULL,
  "workflow_type" TEXT NOT NULL DEFAULT 'EnrollmentJourneyWorkflowV1',
  "provisional_subject_ref" TEXT NOT NULL,
  "child_care_process_id" TEXT,
  "lifecycle" "NurtureInstitutionWorkflowLifecycle" NOT NULL,
  "current_stage" "NurtureInstitutionWorkflowStage" NOT NULL,
  "waiting_state" "NurtureInstitutionWorkflowWaitingState" NOT NULL,
  "pending_transition" "NurtureInstitutionWorkflowPendingTransition" NOT NULL,
  "terminal_outcome" "NurtureInstitutionWorkflowTerminalOutcome" NOT NULL,
  "completed_milestones" "NurtureEnrollmentJourneyMilestone"[] NOT NULL,
  "due_at" TIMESTAMP(3),
  "workflow_head" INTEGER NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_institution_workflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_enrollment_inquiry" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "preferred_label" TEXT NOT NULL,
  "birth_year_month_protection_payload" JSONB,
  "age_band_key" TEXT,
  "expected_entry_start_date" DATE NOT NULL,
  "expected_entry_end_date" DATE NOT NULL,
  "target_class_type_key" TEXT NOT NULL,
  "target_age_band_key" TEXT NOT NULL,
  "target_care_group_id" TEXT,
  "care_schedule_need_keys" TEXT[] NOT NULL,
  "source_channel" TEXT NOT NULL,
  "host_contact_ref" JSONB NOT NULL,
  "contact_safe_label" TEXT NOT NULL,
  "safety_label_keys" TEXT[] NOT NULL,
  "last_touchpoint_at" TIMESTAMP(3) NOT NULL,
  "next_touchpoint_at" TIMESTAMP(3) NOT NULL,
  "visit_disposition" "NurtureEnrollmentVisitDisposition" NOT NULL DEFAULT 'not_decided',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_enrollment_inquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_enrollment_touchpoint" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "inquiry_id" TEXT NOT NULL,
  "source_kind" "NurtureEnrollmentTouchpointSourceKind" NOT NULL,
  "source_channel" TEXT NOT NULL,
  "native_source_ref" JSONB,
  "external_summary_body_envelope" JSONB,
  "confirmed_need_keys" TEXT[] NOT NULL,
  "safety_label_keys" TEXT[] NOT NULL,
  "next_action_key" TEXT NOT NULL,
  "responsible_role" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "due_at" TIMESTAMP(3) NOT NULL,
  "next_touchpoint_at" TIMESTAMP(3) NOT NULL,
  "actor_role_assignment_id" TEXT NOT NULL,
  "supersedes_touchpoint_id" TEXT,
  "correction_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_enrollment_touchpoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_institution_workflow_transition" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "command_execution_id" TEXT NOT NULL,
  "workflow_head_before" INTEGER NOT NULL,
  "workflow_head_after" INTEGER NOT NULL,
  "stage_before" "NurtureInstitutionWorkflowStage",
  "stage_after" "NurtureInstitutionWorkflowStage" NOT NULL,
  "waiting_state_before" "NurtureInstitutionWorkflowWaitingState",
  "waiting_state_after" "NurtureInstitutionWorkflowWaitingState" NOT NULL,
  "pending_transition_before" "NurtureInstitutionWorkflowPendingTransition",
  "pending_transition_after" "NurtureInstitutionWorkflowPendingTransition" NOT NULL,
  "lifecycle_before" "NurtureInstitutionWorkflowLifecycle",
  "lifecycle_after" "NurtureInstitutionWorkflowLifecycle" NOT NULL,
  "terminal_outcome_before" "NurtureInstitutionWorkflowTerminalOutcome",
  "terminal_outcome_after" "NurtureInstitutionWorkflowTerminalOutcome" NOT NULL,
  "added_milestones" "NurtureEnrollmentJourneyMilestone"[] NOT NULL,
  "command_key" TEXT NOT NULL,
  "actor_role_assignment_id" TEXT NOT NULL,
  "reason_key" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_institution_workflow_transition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nurture_institution_workflow_run"
  ON "nurture_institution_workflow"
  ("workspace_id", "workflow_run_object_id");
CREATE UNIQUE INDEX "uq_nurture_institution_workflow_subject"
  ON "nurture_institution_workflow" ("workspace_id", "provisional_subject_ref");
CREATE INDEX "ix_nurture_institution_workflow_stage"
  ON "nurture_institution_workflow"
  ("workspace_id", "institution_id", "lifecycle", "current_stage");
CREATE INDEX "ix_nurture_institution_workflow_updated"
  ON "nurture_institution_workflow"
  ("workspace_id", "institution_id", "updated_at");

CREATE UNIQUE INDEX "uq_nurture_enrollment_inquiry_workflow"
  ON "nurture_enrollment_inquiry" ("workflow_id");
CREATE INDEX "ix_nurture_enrollment_inquiry_next_touchpoint"
  ON "nurture_enrollment_inquiry"
  ("workspace_id", "institution_id", "next_touchpoint_at");
CREATE INDEX "ix_nurture_enrollment_inquiry_target_group"
  ON "nurture_enrollment_inquiry"
  ("workspace_id", "target_care_group_id", "expected_entry_start_date");

CREATE UNIQUE INDEX "uq_nurture_enrollment_touchpoint_supersedes"
  ON "nurture_enrollment_touchpoint" ("supersedes_touchpoint_id");
CREATE UNIQUE INDEX "uq_nurture_enrollment_touchpoint_native_source"
  ON "nurture_enrollment_touchpoint"
  ("workspace_id", "workflow_id", (("native_source_ref" ->> 'object_id')))
  WHERE "source_kind" = 'native_business_communication';
CREATE INDEX "ix_nurture_enrollment_touchpoint_occurred"
  ON "nurture_enrollment_touchpoint"
  ("workspace_id", "institution_id", "occurred_at");
CREATE INDEX "ix_nurture_enrollment_touchpoint_workflow"
  ON "nurture_enrollment_touchpoint"
  ("workspace_id", "workflow_id", "created_at");

CREATE UNIQUE INDEX "uq_nurture_institution_workflow_transition_execution"
  ON "nurture_institution_workflow_transition" ("command_execution_id");
CREATE UNIQUE INDEX "uq_nurture_institution_workflow_transition_head"
  ON "nurture_institution_workflow_transition" ("workflow_id", "workflow_head_after");
CREATE INDEX "ix_nurture_institution_workflow_transition"
  ON "nurture_institution_workflow_transition"
  ("workspace_id", "institution_id", "workflow_id", "occurred_at");

CREATE FUNCTION "nurture_jsonb_has_exact_keys"(value JSONB, expected TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT COALESCE(
    jsonb_typeof(value) = 'object'
      AND (
        SELECT array_agg(key ORDER BY key)
        FROM jsonb_object_keys(value) AS keys(key)
      ) = (
        SELECT array_agg(key ORDER BY key)
        FROM unnest(expected) AS keys(key)
      ),
    FALSE
  );
$$;

CREATE FUNCTION "nurture_canonical_ref_v1_is_valid"(
  value JSONB,
  expected_namespace TEXT,
  expected_object_type TEXT
)
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
    AND value ->> 'namespace' = expected_namespace
    AND value ->> 'object_type' ~ '^[a-z][a-z0-9._-]*$'
    AND (
      expected_object_type IS NULL
      OR value ->> 'object_type' = expected_object_type
    )
    AND length(value ->> 'object_id') BETWEEN 1 AND 256
    AND (
      NOT value ? 'version'
      OR (
        jsonb_typeof(value -> 'version') = 'number'
        AND value ->> 'version' ~ '^(0|[1-9][0-9]*)$'
      )
    ),
    FALSE
  );
$$;

CREATE FUNCTION "nurture_enrollment_key_array_is_valid"(
  value TEXT[],
  require_value BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT COALESCE(array_ndims(value), 1) = 1
    AND COALESCE(array_lower(value, 1), 1) = 1
    AND cardinality(value) <= 32
    AND (NOT require_value OR cardinality(value) > 0)
    AND cardinality(value) = (
      SELECT count(DISTINCT item)
      FROM unnest(value) AS items(item)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(value) AS items(item)
      WHERE item IS NULL OR item !~ '^[a-z][a-z0-9_:-]{0,99}$'
    );
$$;

CREATE FUNCTION "nurture_enrollment_milestone_delta_is_canonical"(
  value "NurtureEnrollmentJourneyMilestone"[]
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT COALESCE(array_ndims(value), 1) = 1
    AND COALESCE(array_lower(value, 1), 1) = 1
    AND cardinality(value) <= 14
    AND cardinality(value) = (
      SELECT count(DISTINCT milestone)
      FROM unnest(value) AS milestones(milestone)
    )
    AND value = ARRAY(
      SELECT milestone
      FROM unnest(value) AS milestones(milestone)
      ORDER BY milestone
    );
$$;

CREATE FUNCTION "nurture_enrollment_milestones_are_valid"(
  value "NurtureEnrollmentJourneyMilestone"[]
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT cardinality(value) > 0
    AND "nurture_enrollment_milestone_delta_is_canonical"(value)
    AND 'inquiry_started' = ANY(value)
    AND (NOT ('intent_confirmed' = ANY(value)) OR 'inquiry_started' = ANY(value))
    AND (NOT ('visit_recorded' = ANY(value)) OR 'intent_confirmed' = ANY(value))
    AND (NOT ('waitlist_qualified' = ANY(value)) OR 'intent_confirmed' = ANY(value))
    AND (NOT ('trial_offer_accepted' = ANY(value)) OR 'intent_confirmed' = ANY(value))
    AND (NOT ('trial_started' = ANY(value)) OR 'trial_offer_accepted' = ANY(value))
    AND (NOT ('trial_review_reached' = ANY(value)) OR 'trial_started' = ANY(value))
    AND (NOT ('trial_extended' = ANY(value)) OR 'trial_review_reached' = ANY(value))
    AND (NOT ('formal_proposed' = ANY(value)) OR 'trial_review_reached' = ANY(value))
    AND (
      NOT ('guardian_formal_acceptance_recorded' = ANY(value))
      OR 'formal_proposed' = ANY(value)
    )
    AND (
      NOT ('preparation_cancelled' = ANY(value))
      OR 'trial_offer_accepted' = ANY(value)
    )
    AND (NOT ('trial_ended' = ANY(value)) OR 'trial_started' = ANY(value))
    AND (
      NOT ('formal_enrollment_committed' = ANY(value))
      OR 'guardian_formal_acceptance_recorded' = ANY(value)
    )
    AND (
      NOT ('journey_completed' = ANY(value))
      OR 'formal_enrollment_committed' = ANY(value)
    );
$$;

CREATE FUNCTION "nurture_enrollment_journey_state_is_valid"(
  p_lifecycle "NurtureInstitutionWorkflowLifecycle",
  p_stage "NurtureInstitutionWorkflowStage",
  p_waiting "NurtureInstitutionWorkflowWaitingState",
  p_terminal "NurtureInstitutionWorkflowTerminalOutcome",
  p_milestones "NurtureEnrollmentJourneyMilestone"[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
BEGIN
  IF NOT "nurture_enrollment_milestones_are_valid"(p_milestones) THEN
    RETURN FALSE;
  END IF;

  IF p_lifecycle = 'active' THEN
    IF p_stage IN ('completed', 'closed')
      OR p_terminal <> 'none'
    THEN
      RETURN FALSE;
    END IF;

    CASE p_stage
      WHEN 'inquiry' THEN
        RETURN p_milestones <@ ARRAY[
          'inquiry_started'
        ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'intent_conversation' THEN
        RETURN 'intent_confirmed' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'visit_or_consultation' THEN
        RETURN 'intent_confirmed' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed', 'visit_recorded'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'capacity_waitlist' THEN
        RETURN 'intent_confirmed' = ANY(p_milestones)
          AND 'waitlist_qualified' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed', 'visit_recorded',
            'waitlist_qualified'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'trial_preparation' THEN
        RETURN 'intent_confirmed' = ANY(p_milestones)
          AND 'trial_offer_accepted' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed', 'visit_recorded',
            'waitlist_qualified', 'trial_offer_accepted'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'trial_in_progress' THEN
        RETURN 'trial_started' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed', 'visit_recorded',
            'waitlist_qualified', 'trial_offer_accepted', 'trial_started',
            'trial_review_reached', 'trial_extended'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'trial_review' THEN
        RETURN 'trial_started' = ANY(p_milestones)
          AND 'trial_review_reached' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed', 'visit_recorded',
            'waitlist_qualified', 'trial_offer_accepted', 'trial_started',
            'trial_review_reached', 'trial_extended'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      WHEN 'formal_enrollment_confirmation' THEN
        RETURN 'trial_started' = ANY(p_milestones)
          AND 'trial_review_reached' = ANY(p_milestones)
          AND 'formal_proposed' = ANY(p_milestones)
          AND p_milestones <@ ARRAY[
            'inquiry_started', 'intent_confirmed', 'visit_recorded',
            'waitlist_qualified', 'trial_offer_accepted', 'trial_started',
            'trial_review_reached', 'trial_extended', 'formal_proposed',
            'guardian_formal_acceptance_recorded'
          ]::"NurtureEnrollmentJourneyMilestone"[];
      ELSE
        RETURN FALSE;
    END CASE;
  END IF;

  IF p_lifecycle = 'completed' THEN
    RETURN p_stage = 'completed'
      AND p_terminal = 'formalized'
      AND p_waiting IN ('ready', 'waiting_on_system')
      AND 'intent_confirmed' = ANY(p_milestones)
      AND 'trial_started' = ANY(p_milestones)
      AND 'trial_review_reached' = ANY(p_milestones)
      AND 'formal_proposed' = ANY(p_milestones)
      AND 'guardian_formal_acceptance_recorded' = ANY(p_milestones)
      AND 'formal_enrollment_committed' = ANY(p_milestones)
      AND 'journey_completed' = ANY(p_milestones)
      AND NOT ('preparation_cancelled' = ANY(p_milestones))
      AND NOT ('trial_ended' = ANY(p_milestones));
  END IF;

  IF p_lifecycle <> 'closed_without_formalization'
    OR p_stage <> 'closed'
    OR p_terminal IN ('none', 'formalized')
    OR p_waiting NOT IN ('ready', 'waiting_on_system')
    OR 'formal_enrollment_committed' = ANY(p_milestones)
    OR 'journey_completed' = ANY(p_milestones)
  THEN
    RETURN FALSE;
  END IF;

  CASE p_terminal
    WHEN 'preparation_cancelled' THEN
      RETURN 'trial_offer_accepted' = ANY(p_milestones)
        AND 'preparation_cancelled' = ANY(p_milestones)
        AND NOT ('trial_started' = ANY(p_milestones))
        AND NOT ('trial_ended' = ANY(p_milestones))
        AND p_milestones <@ ARRAY[
          'inquiry_started', 'intent_confirmed', 'visit_recorded',
          'waitlist_qualified', 'trial_offer_accepted',
          'preparation_cancelled'
        ]::"NurtureEnrollmentJourneyMilestone"[];
    WHEN 'trial_ended' THEN
      RETURN 'trial_started' = ANY(p_milestones)
        AND 'trial_ended' = ANY(p_milestones)
        AND NOT ('preparation_cancelled' = ANY(p_milestones))
        AND p_milestones <@ ARRAY[
          'inquiry_started', 'intent_confirmed', 'visit_recorded',
          'waitlist_qualified', 'trial_offer_accepted', 'trial_started',
          'trial_review_reached', 'trial_extended', 'formal_proposed',
          'guardian_formal_acceptance_recorded', 'trial_ended'
        ]::"NurtureEnrollmentJourneyMilestone"[];
    WHEN 'waitlist_withdrawn' THEN
      RETURN 'waitlist_qualified' = ANY(p_milestones)
        AND p_milestones <@ ARRAY[
          'inquiry_started', 'intent_confirmed', 'visit_recorded',
          'waitlist_qualified'
        ]::"NurtureEnrollmentJourneyMilestone"[];
    WHEN 'inquiry_closed' THEN
      RETURN p_milestones <@ ARRAY[
        'inquiry_started', 'intent_confirmed', 'visit_recorded'
      ]::"NurtureEnrollmentJourneyMilestone"[];
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

ALTER TABLE "nurture_institution_workflow"
ADD CONSTRAINT "ck_nurture_institution_workflow_identity"
CHECK (
  "workflow_type" = 'EnrollmentJourneyWorkflowV1'
  AND "workflow_head" >= 1
  AND "nurture_canonical_ref_v1_is_valid"(
    "workflow_run_ref", 'my_chat', 'workflow_run'
  )
  AND "workflow_run_object_id" = "workflow_run_ref" ->> 'object_id'
  AND "updated_at" >= "started_at"
  AND (
    "child_care_process_id" IS NULL
    OR (
      "lifecycle" = 'completed'
      AND "current_stage" = 'completed'
      AND "terminal_outcome" = 'formalized'
    )
  )
);

ALTER TABLE "nurture_institution_workflow"
ADD CONSTRAINT "ck_nurture_institution_workflow_lifecycle"
CHECK (
  "nurture_enrollment_journey_state_is_valid"(
    "lifecycle",
    "current_stage",
    "waiting_state",
    "terminal_outcome",
    "completed_milestones"
  )
  AND (
    "lifecycle" = 'active'
    OR "pending_transition" = 'none'
  )
);

ALTER TABLE "nurture_institution_workflow"
ADD CONSTRAINT "ck_nurture_institution_workflow_pending_transition"
CHECK (
  "pending_transition" = 'none'
  OR (
    "pending_transition" = 'trial_start_pending'
    AND "current_stage" = 'trial_preparation'
    AND "waiting_state" = 'waiting_on_system'
  )
  OR (
    "pending_transition" = 'formalization_pending'
    AND "current_stage" = 'formal_enrollment_confirmation'
    AND "waiting_state" = 'waiting_on_system'
  )
  OR (
    "pending_transition" = 'exit_pending'
    AND "current_stage" IN ('trial_in_progress', 'trial_review')
    AND "waiting_state" = 'waiting_on_system'
  )
);

ALTER TABLE "nurture_enrollment_inquiry"
ADD CONSTRAINT "ck_nurture_enrollment_inquiry_minimal_identity"
CHECK (
  ("birth_year_month_protection_payload" IS NULL) <> ("age_band_key" IS NULL)
  AND length(btrim("preferred_label")) BETWEEN 1 AND 120
  AND length(btrim("contact_safe_label")) BETWEEN 1 AND 200
  AND ("age_band_key" IS NULL OR "age_band_key" ~ '^[a-z][a-z0-9_:-]{0,99}$')
  AND "target_class_type_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
  AND "target_age_band_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
  AND "source_channel" ~ '^[a-z][a-z0-9_:-]{0,99}$'
  AND "nurture_enrollment_key_array_is_valid"(
    "care_schedule_need_keys", TRUE
  )
  AND "nurture_enrollment_key_array_is_valid"("safety_label_keys", FALSE)
  AND "expected_entry_end_date" >= "expected_entry_start_date"
  AND "next_touchpoint_at" >= "last_touchpoint_at"
  AND "updated_at" >= "created_at"
  AND "nurture_canonical_ref_v1_is_valid"(
    "host_contact_ref", 'my_chat', NULL
  )
);

ALTER TABLE "nurture_enrollment_inquiry"
ADD CONSTRAINT "ck_nurture_enrollment_inquiry_protected_birth_month"
CHECK (
  "birth_year_month_protection_payload" IS NULL OR (
    "nurture_jsonb_has_exact_keys"(
      "birth_year_month_protection_payload",
      ARRAY['algVersion', 'keyRef', 'ciphertext', 'integrityTag']
    )
    AND ("birth_year_month_protection_payload" ->> 'algVersion')::INTEGER = 1
    AND "birth_year_month_protection_payload" ->> 'keyRef' ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$'
    AND length("birth_year_month_protection_payload" ->> 'ciphertext') BETWEEN 1 AND 32768
    AND "birth_year_month_protection_payload" ->> 'ciphertext' ~ '^[A-Za-z0-9_-]+$'
    AND length("birth_year_month_protection_payload" ->> 'integrityTag') BETWEEN 1 AND 64
    AND "birth_year_month_protection_payload" ->> 'integrityTag' ~ '^[A-Za-z0-9_-]+$'
    AND NOT "birth_year_month_protection_payload" ?| ARRAY['plaintext', 'body', 'text']
  )
);

ALTER TABLE "nurture_enrollment_touchpoint"
ADD CONSTRAINT "ck_nurture_enrollment_touchpoint_source"
CHECK (
  (
    "source_kind" = 'native_business_communication'
    AND "native_source_ref" IS NOT NULL
    AND "external_summary_body_envelope" IS NULL
    AND "nurture_canonical_ref_v1_is_valid"(
      "native_source_ref", 'nurture', 'family_care_message'
    )
  ) OR (
    "source_kind" = 'external_structured_summary'
    AND "native_source_ref" IS NULL
    AND "external_summary_body_envelope" IS NOT NULL
    AND "nurture_jsonb_has_exact_keys"(
      "external_summary_body_envelope",
      ARRAY['algVersion', 'keyRef', 'ciphertext', 'integrityTag']
    )
    AND ("external_summary_body_envelope" ->> 'algVersion')::INTEGER = 1
    AND "external_summary_body_envelope" ->> 'keyRef' ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$'
    AND length("external_summary_body_envelope" ->> 'ciphertext') BETWEEN 1 AND 32768
    AND "external_summary_body_envelope" ->> 'ciphertext' ~ '^[A-Za-z0-9_-]+$'
    AND length("external_summary_body_envelope" ->> 'integrityTag') BETWEEN 1 AND 64
    AND "external_summary_body_envelope" ->> 'integrityTag' ~ '^[A-Za-z0-9_-]+$'
    AND NOT "external_summary_body_envelope" ?| ARRAY['plaintext', 'body', 'text']
  )
);

ALTER TABLE "nurture_enrollment_touchpoint"
ADD CONSTRAINT "ck_nurture_enrollment_touchpoint_contract"
CHECK (
  "source_channel" ~ '^[a-z][a-z0-9_:-]{0,99}$'
  AND "next_action_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
  AND "responsible_role" IN (
    'institution_admin', 'guardian', 'caregiver', 'system_owner', 'none'
  )
  AND "nurture_enrollment_key_array_is_valid"("confirmed_need_keys", FALSE)
  AND "nurture_enrollment_key_array_is_valid"("safety_label_keys", FALSE)
  AND "due_at" >= "occurred_at"
  AND "next_touchpoint_at" >= "due_at"
  AND (
    ("supersedes_touchpoint_id" IS NULL AND "correction_reason" IS NULL)
    OR (
      "supersedes_touchpoint_id" IS NOT NULL
      AND "source_kind" = 'external_structured_summary'
      AND "correction_reason" IS NOT NULL
      AND length(btrim("correction_reason")) BETWEEN 1 AND 1000
    )
  )
);

ALTER TABLE "nurture_institution_workflow_transition"
ADD CONSTRAINT "ck_nurture_institution_workflow_transition_contract"
CHECK (
  "workflow_head_before" >= 0
  AND "workflow_head_after" = "workflow_head_before" + 1
  AND "nurture_enrollment_milestone_delta_is_canonical"("added_milestones")
  AND "command_key" IN (
    'start_enrollment_inquiry',
    'record_external_touchpoint',
    'confirm_native_touchpoint_note',
    'confirm_intent_conversation',
    'record_or_skip_visit',
    'close_inquiry'
  )
  AND "reason_key" ~ '^[a-z][a-z0-9_:-]{0,99}$'
  AND (
    (
      "workflow_head_before" = 0
      AND "stage_before" IS NULL
      AND "waiting_state_before" IS NULL
      AND "pending_transition_before" IS NULL
      AND "lifecycle_before" IS NULL
      AND "terminal_outcome_before" IS NULL
    ) OR (
      "workflow_head_before" > 0
      AND "stage_before" IS NOT NULL
      AND "waiting_state_before" IS NOT NULL
      AND "pending_transition_before" IS NOT NULL
      AND "lifecycle_before" IS NOT NULL
      AND "terminal_outcome_before" IS NOT NULL
    )
  )
);

ALTER TABLE "nurture_institution_workflow"
ADD CONSTRAINT "nurture_institution_workflow_institution_id_fkey"
FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_workflow"
ADD CONSTRAINT "nurture_institution_workflow_child_process_id_fkey"
FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_enrollment_inquiry"
ADD CONSTRAINT "nurture_enrollment_inquiry_workflow_id_fkey"
FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_inquiry"
ADD CONSTRAINT "nurture_enrollment_inquiry_target_group_id_fkey"
FOREIGN KEY ("target_care_group_id") REFERENCES "nurture_care_group"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_enrollment_touchpoint"
ADD CONSTRAINT "nurture_enrollment_touchpoint_workflow_id_fkey"
FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_touchpoint"
ADD CONSTRAINT "nurture_enrollment_touchpoint_inquiry_id_fkey"
FOREIGN KEY ("inquiry_id") REFERENCES "nurture_enrollment_inquiry"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_touchpoint"
ADD CONSTRAINT "nurture_enrollment_touchpoint_actor_role_id_fkey"
FOREIGN KEY ("actor_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_enrollment_touchpoint"
ADD CONSTRAINT "nurture_enrollment_touchpoint_supersedes_id_fkey"
FOREIGN KEY ("supersedes_touchpoint_id") REFERENCES "nurture_enrollment_touchpoint"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_institution_workflow_transition"
ADD CONSTRAINT "nurture_workflow_transition_workflow_id_fkey"
FOREIGN KEY ("workflow_id") REFERENCES "nurture_institution_workflow"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_workflow_transition"
ADD CONSTRAINT "nurture_workflow_transition_execution_id_fkey"
FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_institution_workflow_transition"
ADD CONSTRAINT "nurture_workflow_transition_actor_role_id_fkey"
FOREIGN KEY ("actor_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cross-table ownership and scope checks. Ordinary foreign keys prove row
-- identity; these triggers prevent direct SQL writers from composing rows
-- across Workspaces or Institutions.
CREATE FUNCTION "nurture_institution_workflow_validate_scope"()
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
    OR NEW."current_stage" < OLD."current_stage"
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
    OR NEW."due_at" IS DISTINCT FROM OLD."due_at"
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

CREATE TRIGGER "trg_nurture_institution_workflow_validate_scope"
BEFORE INSERT OR UPDATE ON "nurture_institution_workflow"
FOR EACH ROW EXECUTE FUNCTION "nurture_institution_workflow_validate_scope"();

CREATE FUNCTION "nurture_enrollment_inquiry_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."workspace_id" IS DISTINCT FROM OLD."workspace_id"
    OR NEW."institution_id" IS DISTINCT FROM OLD."institution_id"
    OR NEW."workflow_id" IS DISTINCT FROM OLD."workflow_id"
    OR NEW."preferred_label" IS DISTINCT FROM OLD."preferred_label"
    OR NEW."birth_year_month_protection_payload" IS DISTINCT FROM OLD."birth_year_month_protection_payload"
    OR NEW."age_band_key" IS DISTINCT FROM OLD."age_band_key"
    OR NEW."expected_entry_start_date" IS DISTINCT FROM OLD."expected_entry_start_date"
    OR NEW."expected_entry_end_date" IS DISTINCT FROM OLD."expected_entry_end_date"
    OR NEW."target_class_type_key" IS DISTINCT FROM OLD."target_class_type_key"
    OR NEW."target_age_band_key" IS DISTINCT FROM OLD."target_age_band_key"
    OR NEW."target_care_group_id" IS DISTINCT FROM OLD."target_care_group_id"
    OR NEW."care_schedule_need_keys" IS DISTINCT FROM OLD."care_schedule_need_keys"
    OR NEW."source_channel" IS DISTINCT FROM OLD."source_channel"
    OR NEW."host_contact_ref" IS DISTINCT FROM OLD."host_contact_ref"
    OR NEW."contact_safe_label" IS DISTINCT FROM OLD."contact_safe_label"
    OR NEW."safety_label_keys" IS DISTINCT FROM OLD."safety_label_keys"
    OR NEW."last_touchpoint_at" < OLD."last_touchpoint_at"
    OR (
      OLD."visit_disposition" <> 'not_decided'
      AND NEW."visit_disposition" IS DISTINCT FROM OLD."visit_disposition"
    )
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR NEW."updated_at" < OLD."updated_at"
  ) THEN
    RAISE EXCEPTION 'nurture enrollment inquiry update is not monotone'
      USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "nurture_institution_workflow"
    WHERE "id" = NEW."workflow_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "institution_id" = NEW."institution_id"
  ) THEN
    RAISE EXCEPTION 'nurture enrollment inquiry workflow scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  IF NEW."target_care_group_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "nurture_care_group"
    WHERE "id" = NEW."target_care_group_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "institution_id" = NEW."institution_id"
      AND "deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture enrollment inquiry target group scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_enrollment_inquiry_validate_scope"
BEFORE INSERT OR UPDATE ON "nurture_enrollment_inquiry"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_inquiry_validate_scope"();

CREATE FUNCTION "nurture_enrollment_touchpoint_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_institution_workflow" w
    JOIN "nurture_enrollment_inquiry" i ON i."workflow_id" = w."id"
    WHERE w."id" = NEW."workflow_id"
      AND i."id" = NEW."inquiry_id"
      AND w."workspace_id" = NEW."workspace_id"
      AND w."institution_id" = NEW."institution_id"
      AND i."workspace_id" = NEW."workspace_id"
      AND i."institution_id" = NEW."institution_id"
  ) OR NOT EXISTS (
    SELECT 1 FROM "nurture_care_role_assignment"
    WHERE "id" = NEW."actor_role_assignment_id"
      AND "workspace_id" = NEW."workspace_id"
      AND "role" = 'institution_admin'
      AND "scope_type" = 'institution'
      AND "scope_id" = NEW."institution_id"
      AND "status" = 'active'
      AND "deleted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'nurture enrollment touchpoint scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  IF NEW."supersedes_touchpoint_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "nurture_enrollment_touchpoint"
    WHERE "id" = NEW."supersedes_touchpoint_id"
      AND "workflow_id" = NEW."workflow_id"
      AND "inquiry_id" = NEW."inquiry_id"
      AND "source_kind" = 'external_structured_summary'
      AND "occurred_at" <= NEW."occurred_at"
  ) THEN
    RAISE EXCEPTION 'nurture enrollment touchpoint correction scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_enrollment_touchpoint_validate_scope"
BEFORE INSERT ON "nurture_enrollment_touchpoint"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_touchpoint_validate_scope"();

CREATE FUNCTION "nurture_workflow_transition_validate_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_workflow "nurture_institution_workflow"%ROWTYPE;
  previous_transition "nurture_institution_workflow_transition"%ROWTYPE;
  transition_milestones "NurtureEnrollmentJourneyMilestone"[];
  workflow_found BOOLEAN;
  business_state_unchanged BOOLEAN;
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
          (
            NEW."reason_key" = 'visit_recorded'
            AND NEW."added_milestones" = ARRAY[
              'visit_recorded'
            ]::"NurtureEnrollmentJourneyMilestone"[]
          ) OR (
            NEW."reason_key" = 'visit_skipped'
            AND cardinality(NEW."added_milestones") = 0
          )
        )
      WHEN 'close_inquiry' THEN
        NEW."stage_before" IN (
          'inquiry', 'intent_conversation', 'visit_or_consultation'
        )
        AND NEW."stage_after" = 'closed'
        AND NEW."waiting_state_after" = 'ready'
        AND NEW."pending_transition_after" = 'none'
        AND NEW."lifecycle_after" = 'closed_without_formalization'
        AND NEW."terminal_outcome_after" = 'inquiry_closed'
        AND cardinality(NEW."added_milestones") = 0
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
    SELECT 1
    FROM "nurture_institution_workflow_transition"
    WHERE "workflow_id" = NEW."workflow_id"
      AND "added_milestones" && NEW."added_milestones"
  ) THEN
    RAISE EXCEPTION 'nurture institution workflow milestone was added twice'
      USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(
    array_agg(milestone ORDER BY milestone),
    ARRAY[]::"NurtureEnrollmentJourneyMilestone"[]
  )
  INTO transition_milestones
  FROM (
    SELECT unnest("added_milestones") AS milestone
    FROM "nurture_institution_workflow_transition"
    WHERE "workflow_id" = NEW."workflow_id"
    UNION
    SELECT unnest(NEW."added_milestones") AS milestone
  ) AS transition_milestone_rows;

  IF NOT workflow_found
    OR current_workflow."workflow_head" <> NEW."workflow_head_after"
    OR current_workflow."current_stage" <> NEW."stage_after"
    OR current_workflow."waiting_state" <> NEW."waiting_state_after"
    OR current_workflow."pending_transition" <> NEW."pending_transition_after"
    OR current_workflow."lifecycle" <> NEW."lifecycle_after"
    OR current_workflow."terminal_outcome" <> NEW."terminal_outcome_after"
    OR current_workflow."completed_milestones" IS DISTINCT FROM transition_milestones
    OR NOT EXISTS (
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
    )
  THEN
    RAISE EXCEPTION 'nurture institution workflow transition scope mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_nurture_workflow_transition_validate_scope"
BEFORE INSERT ON "nurture_institution_workflow_transition"
FOR EACH ROW EXECUTE FUNCTION "nurture_workflow_transition_validate_scope"();

-- A workflow head and its immutable transition are one transaction-level
-- fact. The repository writes the workflow first and finalizes the transition
-- after CommandExecution exists, so this bijection must be checked at commit.
CREATE FUNCTION "nurture_institution_workflow_require_transition"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "nurture_institution_workflow_transition" transition
    WHERE transition."workflow_id" = NEW."id"
      AND transition."workspace_id" = NEW."workspace_id"
      AND transition."institution_id" = NEW."institution_id"
      AND transition."workflow_head_after" = NEW."workflow_head"
      AND transition."stage_after" = NEW."current_stage"
      AND transition."waiting_state_after" = NEW."waiting_state"
      AND transition."pending_transition_after" = NEW."pending_transition"
      AND transition."lifecycle_after" = NEW."lifecycle"
      AND transition."terminal_outcome_after" = NEW."terminal_outcome"
  ) THEN
    RAISE EXCEPTION 'nurture institution workflow head has no exact transition'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "trg_nurture_institution_workflow_require_transition"
AFTER INSERT OR UPDATE ON "nurture_institution_workflow"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "nurture_institution_workflow_require_transition"();

CREATE FUNCTION "nurture_enrollment_carrier_reject_update_or_delete"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'nurture enrollment carrier row is append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "trg_nurture_enrollment_touchpoint_reject_mutation"
BEFORE UPDATE OR DELETE ON "nurture_enrollment_touchpoint"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_update_or_delete"();
CREATE TRIGGER "trg_nurture_workflow_transition_reject_mutation"
BEFORE UPDATE OR DELETE ON "nurture_institution_workflow_transition"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_update_or_delete"();

CREATE FUNCTION "nurture_enrollment_carrier_reject_delete"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'nurture enrollment carrier row cannot be deleted'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "trg_nurture_institution_workflow_reject_delete"
BEFORE DELETE ON "nurture_institution_workflow"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_delete"();
CREATE TRIGGER "trg_nurture_enrollment_inquiry_reject_delete"
BEFORE DELETE ON "nurture_enrollment_inquiry"
FOR EACH ROW EXECUTE FUNCTION "nurture_enrollment_carrier_reject_delete"();
