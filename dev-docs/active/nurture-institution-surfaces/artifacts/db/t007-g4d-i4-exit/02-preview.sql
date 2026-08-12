# Migration preview

The repository Prisma schema remains the SSOT. The exact additive migration is
`prisma/migrations/20260812230000_t007_guardian_formal_ingress/migration.sql`.

```sql
ALTER TABLE "nurture_enrollment_journey_prepared_command"
  ALTER COLUMN "role_assignment_id" DROP NOT NULL;

ALTER TABLE "nurture_enrollment_journey_prepared_command"
  DROP CONSTRAINT "ck_nurture_enrollment_prepared_command_contract";

ALTER TABLE "nurture_enrollment_journey_prepared_command"
  ADD CONSTRAINT "ck_nurture_enrollment_prepared_command_contract" CHECK (
    "command_request_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
    AND "client_surface" IN (
      'web_run_workbench',
      'chat_workflow_control',
      'mobile_dashboard'
    )
    AND (("client_surface" = 'web_run_workbench'
          AND "role_assignment_id" IS NOT NULL)
      OR ("client_surface" IN (
            'chat_workflow_control',
            'mobile_dashboard'
          )
          AND "role_assignment_id" IS NULL))
    AND "client_command_id_hash" ~ '^[0-9a-f]{64}$'
    AND "prepare_fingerprint" ~ '^[0-9a-f]{64}$'
    AND "origin_invocation_request_id_hash" ~ '^[0-9a-f]{64}$'
    AND "confirmation_ref_hash" ~ '^[0-9a-f]{64}$'
    AND "capability_key" IN (
      'start_enrollment_inquiry',
      'record_external_touchpoint',
      'confirm_native_touchpoint_note',
      'confirm_intent_conversation',
      'close_inquiry',
      'qualify_capacity_waitlist',
      'override_waitlist_category',
      'issue_trial_offer',
      'accept_trial_offer',
      'decline_or_expire_trial_offer',
      'withdraw_from_waitlist',
      'cancel_trial_preparation',
      'prepare_trial_relationship',
      'start_trial',
      'extend_trial',
      'propose_formal_enrollment',
      'formalize_enrollment',
      'end_trial'
    )
    AND (("status" = 'expired'
          AND "snapshot_codec_version" = 0
          AND "frozen_snapshot_ciphertext" = '')
      OR ("status" <> 'expired'
          AND "snapshot_codec_version" >= 1
          AND length("frozen_snapshot_ciphertext") BETWEEN 20 AND 1000000))
    AND "aggregate_version" >= 1
    AND "prepared_at" < "expires_at"
    AND (("status" = 'consumed' AND "consumed_at" IS NOT NULL)
      OR ("status" = 'prepared' AND "consumed_at" IS NULL)
      OR "status" = 'expired')
  );
```

The preview is intentionally identical to the committed migration. It does
not contain data backfill, compatibility columns or a second authority track.
