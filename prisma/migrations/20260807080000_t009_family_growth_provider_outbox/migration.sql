-- T-009 family-growth provider outbox and receipt store (I2).
--
-- Additive only: the media content digest is nullable for pre-T-009 rows and
-- envelope assembly fails closed without a real digest; the outbox row is
-- appended inside the per-target release transaction (N5) and the receipt
-- store is append-only delivery evidence (N7), never authorization.

-- CreateEnum
CREATE TYPE "NurtureFamilyGrowthEventKind" AS ENUM ('released', 'correction', 'target_removal', 'redaction');

-- CreateEnum
CREATE TYPE "NurtureFamilyGrowthDeliveryState" AS ENUM ('pending', 'delivering', 'delivered', 'failed', 'outcome_unknown');

-- CreateEnum
CREATE TYPE "NurtureFamilyGrowthReceiptStatus" AS ENUM ('applied', 'pending_guardian_confirmation', 'duplicate', 'tombstoned', 'rejected', 'conflict');

-- AlterTable
ALTER TABLE "nurture_media_asset_ref" ADD COLUMN     "content_digest" CHAR(64);

-- CreateTable
CREATE TABLE "nurture_family_growth_outbox_event" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" "NurtureFamilyGrowthEventKind" NOT NULL,
    "publication_release_id" TEXT NOT NULL,
    "visibility_event_id" TEXT,
    "payload_digest" CHAR(64) NOT NULL,
    "envelope_payload" JSONB NOT NULL,
    "delivery_state" "NurtureFamilyGrowthDeliveryState" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "next_attempt_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_family_growth_outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_growth_admission_receipt" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "outbox_event_id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "status" "NurtureFamilyGrowthReceiptStatus" NOT NULL,
    "admission_ref" TEXT,
    "material_ref" TEXT,
    "suppression_ref" TEXT,
    "reason_code" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "receipt_payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_family_growth_admission_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_family_growth_outbox_visibility" ON "nurture_family_growth_outbox_event"("visibility_event_id");

-- CreateIndex
CREATE INDEX "ix_nurture_family_growth_outbox_claim" ON "nurture_family_growth_outbox_event"("delivery_state", "next_attempt_at");

-- CreateIndex
CREATE INDEX "ix_nurture_family_growth_outbox_release" ON "nurture_family_growth_outbox_event"("workspace_id", "publication_release_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_family_growth_receipt_status" ON "nurture_family_growth_admission_receipt"("workspace_id", "status", "processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_family_growth_receipt_identity" ON "nurture_family_growth_admission_receipt"("workspace_id", "outbox_event_id", "receipt_id");

-- AddForeignKey
ALTER TABLE "nurture_family_growth_outbox_event" ADD CONSTRAINT "nurture_family_growth_outbox_event_publication_release_id_fkey" FOREIGN KEY ("publication_release_id") REFERENCES "nurture_publication_release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_growth_outbox_event" ADD CONSTRAINT "nurture_family_growth_outbox_event_visibility_event_id_fkey" FOREIGN KEY ("visibility_event_id") REFERENCES "nurture_publication_visibility_event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_growth_admission_receipt" ADD CONSTRAINT "nurture_family_growth_admission_receipt_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "nurture_family_growth_outbox_event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Hand-authored invariants (Prisma cannot express partial or conditional
-- constraints). T-009 I2; see dev-docs/active/nurture-family-growth-provider.

-- One `released` outbox event per publication release. Lifecycle kinds are
-- instead unique per visibility event via the column unique above.
CREATE UNIQUE INDEX "uq_nurture_family_growth_outbox_release_once"
ON "nurture_family_growth_outbox_event" ("publication_release_id")
WHERE "kind" = 'released';

-- `released` rows carry no visibility event; every lifecycle row names one.
ALTER TABLE "nurture_family_growth_outbox_event"
ADD CONSTRAINT "ck_nurture_family_growth_outbox_kind_source" CHECK (
  ("kind" = 'released' AND "visibility_event_id" IS NULL)
  OR ("kind" <> 'released' AND "visibility_event_id" IS NOT NULL)
);

-- Digests are real lowercase hex SHA-256 values, never placeholders.
ALTER TABLE "nurture_family_growth_outbox_event"
ADD CONSTRAINT "ck_nurture_family_growth_outbox_digest" CHECK (
  "payload_digest" ~ '^[a-f0-9]{64}$'
);

ALTER TABLE "nurture_media_asset_ref"
ADD CONSTRAINT "ck_nurture_media_asset_content_digest" CHECK (
  "content_digest" IS NULL OR "content_digest" ~ '^[a-f0-9]{64}$'
);

-- Receipt companion refs per the frozen v1 receipt schema: applied/duplicate
-- carry admission+material refs, pending carries admission only (no material
-- yet), tombstoned names its suppression, rejected/conflict name a reason.
ALTER TABLE "nurture_family_growth_admission_receipt"
ADD CONSTRAINT "ck_nurture_family_growth_receipt_companions" CHECK (
  ("status" IN ('applied', 'duplicate')
    AND "admission_ref" IS NOT NULL AND "material_ref" IS NOT NULL)
  OR ("status" = 'pending_guardian_confirmation'
    AND "admission_ref" IS NOT NULL AND "material_ref" IS NULL)
  OR ("status" = 'tombstoned' AND "suppression_ref" IS NOT NULL)
  OR ("status" IN ('rejected', 'conflict') AND "reason_code" IS NOT NULL)
);
