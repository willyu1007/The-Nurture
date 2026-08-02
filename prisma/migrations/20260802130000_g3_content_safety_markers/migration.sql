-- G3-C1 content safety markers (freeze amendment 2026-08-02).
--
-- Purely additive and nullable on purpose: NULL means the owner never derived
-- markers for this source, which is a different fact from "derived, none found".
-- The safety read port fails closed on the former, so no pre-existing row is
-- silently treated as ordinary content.
-- AlterTable
ALTER TABLE "nurture_care_capture" ADD COLUMN     "safety_markers_payload" JSONB;

-- AlterTable
ALTER TABLE "nurture_media_asset_ref" ADD COLUMN     "safety_markers_payload" JSONB;

