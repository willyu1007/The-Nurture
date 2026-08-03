-- Reserve `aggregate_version = 0` for "there is no live hold".
--
-- The `publish_edit_hold must_equal` head binding needs a value to freeze even
-- when a process carries no hold, and the natural encoding for "absent" is 0.
-- But `aggregate_version` defaults to 0, so a hold created a moment ago would
-- report the same 0 as no hold at all — and an acquire prepared against "no
-- hold" would then pass its head check against a hold another class teacher had
-- just taken, and overwrite it. That is exactly the concurrency the head exists
-- to stop.
--
-- Making 0 unreachable for a real row turns "0 means absent" from a convention
-- into a fact the database enforces. No row can exist yet — the edit hold has
-- had no owner write until now — so the floor is a pure forward guarantee and
-- the census below states that rather than assuming it.

DO $$
DECLARE floorless BIGINT;
BEGIN
  SELECT count(*) INTO floorless
  FROM "nurture_publish_edit_hold"
  WHERE "aggregate_version" < 1;
  IF floorless > 0 THEN
    RAISE EXCEPTION
      'g3 publish edit hold version floor migration gate: % holds sit below the reserved absence value; a hold at 0 is indistinguishable from no hold, so resolve the pre-migration census before applying',
      floorless;
  END IF;
END $$;

ALTER TABLE "nurture_publish_edit_hold"
ALTER COLUMN "aggregate_version" SET DEFAULT 1;

ALTER TABLE "nurture_publish_edit_hold"
ADD CONSTRAINT "ck_nurture_publish_edit_hold_version_floor"
CHECK ("aggregate_version" >= 1);
