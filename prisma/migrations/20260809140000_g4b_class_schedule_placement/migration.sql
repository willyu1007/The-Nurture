-- G4-B increment 4 — class schedule and activity placement, frozen by 0D-2
-- (27-g4-0d-2-schedule-placement-freeze.md).
--
-- Three tables. The two derived projections 0D-2 names — the effective
-- schedule and the latest-photo selection — get none: persisting a resolution
-- would let it drift from the inputs that produced it.

CREATE TYPE "NurtureClassScheduleLayer" AS ENUM ('institution_default', 'class_standing');

CREATE TYPE "NurtureActivityPlacementDecidedBy" AS ENUM (
  'source_binding', 'day_override', 'schedule_window', 'assisted', 'admin'
);

CREATE TYPE "NurtureActivityPlacementState" AS ENUM ('placed', 'unplaced');

CREATE TABLE "nurture_class_schedule_template" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "care_group_id" TEXT,
    "layer" "NurtureClassScheduleLayer" NOT NULL,
    "slots_payload" JSONB NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_class_schedule_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_class_schedule_day_override" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "local_date" DATE NOT NULL,
    "slots_payload" JSONB NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_class_schedule_day_override_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_activity_placement" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_kind" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "local_date" DATE NOT NULL,
    "state" "NurtureActivityPlacementState" NOT NULL,
    "activity_ref" TEXT,
    "decided_by" "NurtureActivityPlacementDecidedBy" NOT NULL,
    "placement_head" INTEGER NOT NULL DEFAULT 1,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_activity_placement_pkey" PRIMARY KEY ("id")
);

-- One live layer per scope. Partial, so a soft-deleted row does not block the
-- replacement that supersedes it — and soft deletion is what keeps the
-- effective schedule's version moving forward rather than backwards when a
-- layer is removed.
CREATE UNIQUE INDEX "uq_nurture_class_schedule_institution_default"
  ON "nurture_class_schedule_template" ("workspace_id", "institution_id")
  WHERE "layer" = 'institution_default' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_class_schedule_class_standing"
  ON "nurture_class_schedule_template" ("workspace_id", "care_group_id")
  WHERE "layer" = 'class_standing' AND "deleted_at" IS NULL;

CREATE INDEX "ix_nurture_class_schedule_template_scope"
  ON "nurture_class_schedule_template" ("workspace_id", "institution_id", "layer");

CREATE UNIQUE INDEX "uq_nurture_class_schedule_day_override"
  ON "nurture_class_schedule_day_override" ("workspace_id", "care_group_id", "local_date");

-- One source has one placement. Re-placing updates this row and increments the
-- head; it never creates a second.
CREATE UNIQUE INDEX "uq_nurture_activity_placement_source"
  ON "nurture_activity_placement" ("workspace_id", "source_kind", "source_id");

CREATE INDEX "ix_nurture_activity_placement_class_day"
  ON "nurture_activity_placement" ("workspace_id", "care_group_id", "local_date", "state");

-- A class_standing layer must name its class and an institution_default must
-- not, or "which scope does this layer serve" stops being answerable from the
-- row.
ALTER TABLE "nurture_class_schedule_template"
ADD CONSTRAINT "ck_nurture_class_schedule_layer_scope" CHECK (
  ("layer" = 'institution_default' AND "care_group_id" IS NULL)
  OR ("layer" = 'class_standing' AND "care_group_id" IS NOT NULL)
);

-- `unplaced` is a state, not an absence — but it is the one state with no
-- activity. Pairing them here means a placed row can never lack its slot and
-- an unplaced row can never carry a stale one.
ALTER TABLE "nurture_activity_placement"
ADD CONSTRAINT "ck_nurture_activity_placement_state" CHECK (
  ("state" = 'placed' AND "activity_ref" IS NOT NULL)
  OR ("state" = 'unplaced' AND "activity_ref" IS NULL)
);

ALTER TABLE "nurture_activity_placement"
ADD CONSTRAINT "ck_nurture_activity_placement_head" CHECK ("placement_head" >= 1);

ALTER TABLE "nurture_class_schedule_template"
ADD CONSTRAINT "nurture_class_schedule_template_institution_id_fkey"
FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_class_schedule_template"
ADD CONSTRAINT "nurture_class_schedule_template_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_class_schedule_day_override"
ADD CONSTRAINT "nurture_class_schedule_day_override_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_activity_placement"
ADD CONSTRAINT "nurture_activity_placement_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
