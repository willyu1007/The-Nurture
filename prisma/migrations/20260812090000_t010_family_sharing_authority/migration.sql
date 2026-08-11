-- T-010 family-sharing eligibility owner: dedicated category authority and
-- disjoint release/receiving policy rows (I4-C1, decisions D-I4C-01..04).
-- Preview only: this migration is intentionally not applied by this task.

-- CreateEnum
CREATE TYPE "NurtureFamilySharingCategory" AS ENUM ('daily_activity', 'media', 'focus_collaboration');

-- CreateEnum
CREATE TYPE "NurtureFamilySharingDirection" AS ENUM ('nurture_to_family', 'family_to_nurture');

-- CreateEnum
CREATE TYPE "NurtureFamilySharingPolicyAxis" AS ENUM ('release', 'receiving');

-- CreateEnum
CREATE TYPE "NurtureFamilySharingRecordStatus" AS ENUM ('active', 'revoked', 'superseded');

-- CreateTable
CREATE TABLE "nurture_family_sharing_authority" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "category" "NurtureFamilySharingCategory" NOT NULL,
    "direction" "NurtureFamilySharingDirection" NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'family_nurture_sharing_authorization',
    "status" "NurtureFamilySharingRecordStatus" NOT NULL DEFAULT 'active',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "authorizing_role" "NurtureCareRole" NOT NULL,
    "authorizing_role_assignment_id" TEXT NOT NULL,
    "authority_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_family_sharing_authority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_sharing_policy" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "category" "NurtureFamilySharingCategory" NOT NULL,
    "direction" "NurtureFamilySharingDirection" NOT NULL,
    "axis" "NurtureFamilySharingPolicyAxis" NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'family_nurture_sharing_authorization',
    "status" "NurtureFamilySharingRecordStatus" NOT NULL DEFAULT 'active',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "authorizing_role" "NurtureCareRole" NOT NULL,
    "authorizing_role_assignment_id" TEXT NOT NULL,
    "policy_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_family_sharing_policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_nurture_family_sharing_authority_scope" ON "nurture_family_sharing_authority"("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_family_sharing_authority_enrollment" ON "nurture_family_sharing_authority"("workspace_id", "enrollment_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_family_sharing_policy_scope" ON "nurture_family_sharing_policy"("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category", "axis", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_family_sharing_policy_enrollment" ON "nurture_family_sharing_policy"("workspace_id", "enrollment_id", "status");

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_authority" ADD CONSTRAINT "nurture_family_sharing_authority_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_authority" ADD CONSTRAINT "nurture_family_sharing_authority_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "nurture_family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_authority" ADD CONSTRAINT "nurture_family_sharing_authority_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_authority" ADD CONSTRAINT "nurture_family_sharing_authority_role_assignment_id_fkey" FOREIGN KEY ("authorizing_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_policy" ADD CONSTRAINT "nurture_family_sharing_policy_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_policy" ADD CONSTRAINT "nurture_family_sharing_policy_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "nurture_family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_policy" ADD CONSTRAINT "nurture_family_sharing_policy_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_sharing_policy" ADD CONSTRAINT "nurture_family_sharing_policy_role_assignment_id_fkey" FOREIGN KEY ("authorizing_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Hand-authored guarantees Prisma cannot express (reviewed at I4-C1).
-- ---------------------------------------------------------------------------

-- Fixed direction-by-category map (frozen contract vocabulary; D-I4C-01).
ALTER TABLE "nurture_family_sharing_authority"
  ADD CONSTRAINT "ck_nurture_family_sharing_authority_direction" CHECK (
    ("category" = 'daily_activity' AND "direction" = 'nurture_to_family')
    OR ("category" IN ('media', 'focus_collaboration') AND "direction" = 'family_to_nurture')
  );
ALTER TABLE "nurture_family_sharing_policy"
  ADD CONSTRAINT "ck_nurture_family_sharing_policy_direction" CHECK (
    ("category" = 'daily_activity' AND "direction" = 'nurture_to_family')
    OR ("category" IN ('media', 'focus_collaboration') AND "direction" = 'family_to_nurture')
  );

-- Purpose is bound to the single frozen eligibility purpose.
ALTER TABLE "nurture_family_sharing_authority"
  ADD CONSTRAINT "ck_nurture_family_sharing_authority_purpose"
  CHECK ("purpose" = 'family_nurture_sharing_authorization');
ALTER TABLE "nurture_family_sharing_policy"
  ADD CONSTRAINT "ck_nurture_family_sharing_policy_purpose"
  CHECK ("purpose" = 'family_nurture_sharing_authorization');

-- Revocation is explicit and atomic: revoked status iff revoked_at is set.
ALTER TABLE "nurture_family_sharing_authority"
  ADD CONSTRAINT "ck_nurture_family_sharing_authority_revocation"
  CHECK (("status" = 'revoked') = ("revoked_at" IS NOT NULL));
ALTER TABLE "nurture_family_sharing_policy"
  ADD CONSTRAINT "ck_nurture_family_sharing_policy_revocation"
  CHECK (("status" = 'revoked') = ("revoked_at" IS NOT NULL));

-- Expiry, when present, must postdate the effective start.
ALTER TABLE "nurture_family_sharing_authority"
  ADD CONSTRAINT "ck_nurture_family_sharing_authority_expiry"
  CHECK ("expires_at" IS NULL OR "expires_at" > "effective_from");
ALTER TABLE "nurture_family_sharing_policy"
  ADD CONSTRAINT "ck_nurture_family_sharing_policy_expiry"
  CHECK ("expires_at" IS NULL OR "expires_at" > "effective_from");

-- Exactly one current (active) row per exact pair/enrollment/category — and,
-- for policies, per release/receiving axis (D-I4C-02/03: missing or duplicate
-- rows deny; repository ordering never chooses a winner). Writers supersede or
-- revoke the previous row in the same transaction.
CREATE UNIQUE INDEX "uq_nurture_family_sharing_authority_current"
  ON "nurture_family_sharing_authority"
  ("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category")
  WHERE "status" = 'active';
CREATE UNIQUE INDEX "uq_nurture_family_sharing_policy_current"
  ON "nurture_family_sharing_policy"
  ("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category", "axis")
  WHERE "status" = 'active';
