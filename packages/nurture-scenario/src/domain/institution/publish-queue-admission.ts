import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type { NurtureStoredPublishSchedule } from "./publish-process-transaction.js";

export type NurturePublishQueueAdmissionFacts = {
  publish_process_ref: CanonicalRef;
  process_state: string;
  process_version: number;
  current_revision: number;
  created_at: string;
  read_at: string;
  authorizing_role_assignment_id: string | null;
  authorizing_role_current: boolean;
  current_hold_expires_at?: string;
  schedule: NurtureStoredPublishSchedule | null;
  current_policy: {
    policy_ref: string;
    policy_head: number;
    institution_ref: string;
    policy_version: number;
    time_zone: string;
    default_release_local_time: string;
    retry_cutoff_local_time: string;
    organize_idle_seconds: number;
    organize_fallback_lead_seconds: number;
    automatic_quiescence_seconds: number;
    capture_activity_lease_seconds: number;
    automatic_organize_enabled: boolean;
    effective_from: string;
    effective_to?: string;
  } | null;
};

/** Owner operations used by the host-owned timer inside one DB transaction. */
export type NurturePublishQueueAdmissionTransaction = {
  loadPublishQueueAdmissionFacts(input: {
    workspace_id: string;
    process_key: string;
    read_at: string;
  }): Promise<NurturePublishQueueAdmissionFacts | null>;
  applyPublishQueueAdmission(input: {
    workspace_id: string;
    process_key: string;
    expected_process_version: number;
    authorizing_role_assignment_id: string;
    admitted_at: string;
    schedule: NurtureStoredPublishSchedule;
  }): Promise<{
    publish_process_ref: CanonicalRef;
    schedule: NurtureStoredPublishSchedule;
  }>;
};
