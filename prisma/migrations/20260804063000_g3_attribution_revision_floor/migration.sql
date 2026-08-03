-- Reserve `attribution_revision = 0` for "this child has no attribution".
--
-- The `child_media_attribution must_equal` head has to freeze a value even for
-- a child with no attribution row, and the natural encoding for absence is 0.
-- The column defaults to 1, so unlike the edit hold no live row carries 0
-- today — but nothing stopped a writer from inserting one, and the moment a
-- row can legally sit at 0, an attribution prepared against "no fact" would
-- pass its head check against a fact that exists. Flooring the column turns
-- the reservation into something the database keeps.

DO $$
DECLARE floorless BIGINT;
BEGIN
  SELECT count(*) INTO floorless
  FROM "nurture_child_media_attribution"
  WHERE "attribution_revision" < 1;
  IF floorless > 0 THEN
    RAISE EXCEPTION
      'g3 attribution revision floor migration gate: % attributions sit below the reserved absence value; a revision at 0 is indistinguishable from no attribution, so resolve the pre-migration census before applying',
      floorless;
  END IF;
END $$;

ALTER TABLE "nurture_child_media_attribution"
ADD CONSTRAINT "ck_nurture_media_attribution_revision_floor"
CHECK ("attribution_revision" >= 1);
