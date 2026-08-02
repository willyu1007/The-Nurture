-- CHECK constraints for the ten additive T-006 fact tables.
--
-- Every T-005 fact table got one; none of the T-006 tables did. The database
-- therefore accepted states the domain treats as impossible: a `released`
-- process with no frozen revision, a `cut` batch with no cut instant or
-- watermark, a half-recorded release window, a negative policy head. Those are
-- the invariants the read ports already assume, so nothing but a wrong row can
-- fail these.

ALTER TABLE "nurture_publish_process"
ADD CONSTRAINT "ck_nurture_publish_process_state"
CHECK (
  -- The first committed target freezes the shared revision, so a released
  -- process without one cannot be reconstructed.
  ("state" <> 'released' OR "frozen_revision_id" IS NOT NULL)
  -- A resolved schedule is all five fields or none: readResolvedSchedule
  -- refuses a partial window, and a partial row can only mislead.
  AND (
    (
      "scheduled_at" IS NULL AND "not_after" IS NULL AND "schedule_time_zone" IS NULL
      AND "schedule_policy_ref" IS NULL AND "schedule_policy_head" IS NULL
    )
    OR (
      "scheduled_at" IS NOT NULL AND "not_after" IS NOT NULL AND "schedule_time_zone" IS NOT NULL
      AND "schedule_policy_ref" IS NOT NULL AND "schedule_policy_head" IS NOT NULL
      AND "not_after" > "scheduled_at"
      AND "schedule_policy_head" >= 1
    )
  )
);

ALTER TABLE "nurture_publish_process_revision"
ADD CONSTRAINT "ck_nurture_publish_revision_number"
CHECK ("revision" >= 1);

ALTER TABLE "nurture_care_capture_batch"
ADD CONSTRAINT "ck_nurture_capture_batch_cut"
CHECK (
  -- A cut batch carries the instant it was cut and the watermark it cut at;
  -- without both, the organizer input revision cannot be reproduced.
  ("state" NOT IN ('cut', 'organized') OR ("cut_at" IS NOT NULL AND "watermark_source_sequence" IS NOT NULL))
  AND ("quiescence_seconds" IS NULL OR "quiescence_seconds" >= 0)
  AND ("policy_head" IS NULL OR "policy_head" >= 1)
  AND ("watermark_source_sequence" IS NULL OR "watermark_source_sequence" >= 0)
);

ALTER TABLE "nurture_care_capture"
ADD CONSTRAINT "ck_nurture_care_capture_sequence_range"
CHECK ("source_sequence" >= 1);

ALTER TABLE "nurture_publish_edit_hold"
ADD CONSTRAINT "ck_nurture_publish_edit_hold_window"
CHECK ("expires_at" > "created_at");

ALTER TABLE "nurture_content_safety_assessment"
ADD CONSTRAINT "ck_nurture_content_safety_evidence"
CHECK (
  "policy_head" >= 1
  AND jsonb_typeof("risk_codes_payload") = 'array'
  AND jsonb_typeof("source_heads_payload") = 'object'
);

ALTER TABLE "nurture_publication_release"
ADD CONSTRAINT "ck_nurture_publication_release_identity"
CHECK ("command_request_id_hash" ~ '^[0-9a-f]{64}$');

ALTER TABLE "nurture_publication_visibility_event"
ADD CONSTRAINT "ck_nurture_publication_visibility_event"
CHECK ("source_release_revision" >= 1 AND length("reason_key") > 0);

ALTER TABLE "nurture_publish_process_target"
ADD CONSTRAINT "ck_nurture_publish_target_keys"
CHECK (length("target_key") > 0 AND length("family_ref_key") > 0);

ALTER TABLE "nurture_focus_goal_child_scope"
ADD CONSTRAINT "ck_nurture_focus_goal_child_scope_version"
CHECK ("scope_version" >= 1);
