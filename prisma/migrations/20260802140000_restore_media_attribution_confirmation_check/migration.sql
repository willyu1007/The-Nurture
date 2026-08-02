-- Restores ck_nurture_media_attribution_confirmation.
--
-- The G3 delta (20260802120000) replaced the legacy `status` column with
-- `state`. `ALTER TABLE ... DROP COLUMN "status"` silently drops every
-- constraint that referenced it, so the confirmation-completeness CHECK
-- disappeared with the column and nothing re-created it over `state`. Between
-- that migration and this one the database accepted a `confirmed` attribution
-- with no confirming role, no timestamp and no exposure policy, and accepted an
-- out-of-range confidence.
--
-- The rule itself is unchanged from 20260713150000; only the column it reads
-- is. It is added NOT VALID and then validated explicitly, so any row written
-- while the guarantee was absent fails this migration loudly instead of being
-- grandfathered in.

ALTER TABLE "nurture_child_media_attribution"
ADD CONSTRAINT "ck_nurture_media_attribution_confirmation"
CHECK (
  ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1))
  AND (
    "state" <> 'confirmed'
    OR (
      "confirmed_by_role_assignment_id" IS NOT NULL
      AND "confirmed_at" IS NOT NULL
      AND "exposure_policy_payload" IS NOT NULL
    )
  )
) NOT VALID;

ALTER TABLE "nurture_child_media_attribution"
VALIDATE CONSTRAINT "ck_nurture_media_attribution_confirmation";
