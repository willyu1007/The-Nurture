-- T-009 fact preparer (I3c): the family-growth envelope requires each media
-- item's MIME type. Same posture as `content_digest`: nullable for pre-T-009
-- rows, fail-closed at envelope assembly when absent, format-guarded here.

ALTER TABLE "nurture_media_asset_ref" ADD COLUMN "content_mime_type" TEXT;

ALTER TABLE "nurture_media_asset_ref"
ADD CONSTRAINT "ck_nurture_media_asset_mime_type" CHECK (
  "content_mime_type" IS NULL
  OR ("content_mime_type" ~ '^[a-z0-9][a-z0-9.+-]*/[a-z0-9][a-z0-9.+-]*$'
    AND char_length("content_mime_type") <= 127)
);
