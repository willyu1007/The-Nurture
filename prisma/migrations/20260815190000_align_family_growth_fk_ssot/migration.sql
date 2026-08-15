-- Retire the original id-only family-growth foreign keys after the scoped
-- replacements added by 20260813120000_t011_family_growth_outbox_scope.
-- The composite constraints retain the same referential guarantees and also
-- enforce workspace/release lineage, so keeping both sets creates Prisma SSOT
-- drift without adding an independent invariant.

ALTER TABLE "nurture_family_growth_admission_receipt"
  DROP CONSTRAINT "nurture_family_growth_admission_receipt_outbox_event_id_fkey";

ALTER TABLE "nurture_family_growth_outbox_event"
  DROP CONSTRAINT "nurture_family_growth_outbox_event_publication_release_id_fkey";

ALTER TABLE "nurture_family_growth_outbox_event"
  DROP CONSTRAINT "nurture_family_growth_outbox_event_visibility_event_id_fkey";
