-- The pre-release cancel needs somewhere to record *when* it happened.
--
-- `cancel_publish_process` is idempotent: a repeat on an already-cancelled
-- process answers `already_satisfied`, and its frozen result requires
-- `cancelledAt`. Without a stored instant that answer would have to be invented
-- — `updated_at` is the obvious candidate and is wrong, because anything else
-- touching the row moves it, so the repeat would report a cancel at a moment
-- the cancel did not happen.
--
-- The column is nullable because only cancelled rows have the fact. A cancelled
-- row without it is not a row to fill in: nothing in the row, and nothing
-- related to it, records the instant, so the gate below aborts the migration
-- rather than guessing. The CHECK then keeps that true for every future row.

-- AlterTable
ALTER TABLE "nurture_publish_process" ADD COLUMN "cancelled_at" TIMESTAMP(3);

DO $$
DECLARE unrecorded BIGINT;
BEGIN
  SELECT count(*) INTO unrecorded
  FROM "nurture_publish_process"
  WHERE "state" = 'cancelled' AND "cancelled_at" IS NULL;
  IF unrecorded > 0 THEN
    RAISE EXCEPTION
      'g3 publish cancel instant migration gate: % cancelled processes have no recorded cancel instant and none can be derived; resolve the pre-migration census before applying',
      unrecorded;
  END IF;
END $$;

ALTER TABLE "nurture_publish_process"
ADD CONSTRAINT "ck_nurture_publish_process_cancelled"
CHECK ("state" <> 'cancelled' OR "cancelled_at" IS NOT NULL);
