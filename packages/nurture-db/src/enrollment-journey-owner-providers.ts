import type { NurtureEnrollmentContactOwnerV1 } from "@my-chat/scenario-integrations";
import {
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  type ScenarioCurrentOwnerBindingPairEvidenceV1,
} from "@my-chat/workflow-contracts";
import {
  resolveFamilyCareMessageTargetRef,
  type InstitutionBusinessCommunicationReadPort,
  type NurtureEnrollmentContactOwnerSnapshotV1,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureEnrollmentNativeSourceOwnerSnapshotV1,
  type NurtureTrialGrantTermsSnapshotV1,
  type NurtureTrialPairOwnerSnapshotV1,
} from "@the-nurture/scenario";
import type { PrismaEnrollmentPairOwnerRepository } from "./repositories/enrollment-pair-owner.repository.js";

type ProviderFailure = { status: "denied" | "unavailable"; reason_code: string };

/**
 * G4-D I3 provider 1: the Host-owned prospective contact. Every resolve is a
 * live reread through the adopted My-Chat owner
 * (`my-chat.nurture-enrollment-prospective-contact-owner@1.0.0`); nothing is
 * cached and version drift fails closed.
 */
export type NurtureEnrollmentProspectiveContactProviderV1 = {
  resolveContact(input: {
    workspace_id: string;
    institution_ref: string;
    contact_object_id: string;
    contact_version: number;
  }): Promise<
    | { status: "resolved"; snapshot: NurtureEnrollmentContactOwnerSnapshotV1 }
    | ProviderFailure
  >;
};

export function createNurtureEnrollmentProspectiveContactProvider(input: {
  owner: NurtureEnrollmentContactOwnerV1;
}): NurtureEnrollmentProspectiveContactProviderV1 {
  return {
    async resolveContact(request) {
      let resolution;
      try {
        resolution = await input.owner.resolveCurrentContact({
          workspace_id: request.workspace_id,
          institution_ref: request.institution_ref,
          contact_ref: {
            schema_version: 1,
            namespace: "my_chat",
            object_type: "nurture_prospective_contact",
            object_id: request.contact_object_id,
            version: request.contact_version,
          },
        });
      } catch {
        return { status: "unavailable", reason_code: "prospective_contact_owner_unavailable" };
      }
      if (resolution.status === "resolved") {
        return { status: "resolved", snapshot: resolution.snapshot };
      }
      return resolution.status === "denied"
        ? { status: "denied", reason_code: resolution.reason_code }
        : { status: "unavailable", reason_code: "prospective_contact_owner_unavailable" };
    },
  };
}

/**
 * G4-D I3 provider 2: the native business-communication source
 * (`current_business_message_visibility` head). The message option is resolved
 * through the existing keyed-ref codec and the owner-read projection; the
 * snapshot never carries the sealed body.
 */
export type NurtureEnrollmentNativeSourceProviderV1 = {
  resolveNativeSource(input: {
    workspace_id: string;
    participant_id: string;
    source_message_option_ref: string;
  }): Promise<
    | { status: "resolved"; snapshot: NurtureEnrollmentNativeSourceOwnerSnapshotV1 }
    | ProviderFailure
  >;
};

export function createNurtureEnrollmentNativeSourceProvider(input: {
  reads: InstitutionBusinessCommunicationReadPort;
  messageRefIntegrityKey: string;
  now?: () => Date;
}): NurtureEnrollmentNativeSourceProviderV1 {
  const now = input.now ?? (() => new Date());
  return {
    async resolveNativeSource(request) {
      const messageId = resolveFamilyCareMessageTargetRef(
        input.messageRefIntegrityKey,
        {
          workspace_id: request.workspace_id,
          participant_id: request.participant_id,
        },
        request.source_message_option_ref,
      );
      if (!messageId) {
        return { status: "denied", reason_code: "native_source_option_invalid" };
      }
      let read;
      try {
        read = await input.reads.loadInstitutionBusinessCommunication({
          workspace_id: request.workspace_id,
          participant_id: request.participant_id,
          message_id: messageId,
        });
      } catch {
        return { status: "unavailable", reason_code: "native_source_owner_unavailable" };
      }
      if (!read.authorized) {
        return { status: "denied", reason_code: "native_source_not_visible" };
      }
      return {
        status: "resolved",
        snapshot: {
          contract_version: "1.0.0",
          source_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "family_care_message",
            object_id: read.communication.message_id,
          },
          occurred_at: read.communication.occurred_at,
          verified_at: now().toISOString(),
        },
      };
    },
  };
}

/**
 * G4-D I3 provider 3: guardian/pair/grant current-owner snapshots. Pair and
 * acceptance facts are backed by wave4
 * `ScenarioCurrentOwnerBindingPairEvidenceV1`; the injected source owns the
 * signed transport (detached Ed25519 + nonce), this factory owns the C30
 * structural assertion and the local currency rereads, and I4 joint
 * conformance binds the real My-Chat endpoints to the source port.
 */
export type NurtureEnrollmentCurrentOwnerEvidenceV1 = {
  evidence: ScenarioCurrentOwnerBindingPairEvidenceV1;
  guardian_action: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  pair?: NurtureTrialPairOwnerSnapshotV1;
  grant_terms?: NurtureTrialGrantTermsSnapshotV1;
};

export type NurtureEnrollmentCurrentOwnerEvidenceSourceV1 = {
  fetchCurrentOwnerEvidence(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
    purpose_key: "enrollment_family_acceptance" | "enrollment_trial_pair";
  }): Promise<
    | { status: "resolved"; value: NurtureEnrollmentCurrentOwnerEvidenceV1 }
    | ProviderFailure
  >;
};

export type NurtureEnrollmentJourneyCurrentOwnerProviderV1 = {
  resolveFamilyAcceptance(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
  }): Promise<
    | { status: "resolved"; snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1 }
    | ProviderFailure
  >;
  resolveTrialPair(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
  }): Promise<
    | {
        status: "resolved";
        pair: NurtureTrialPairOwnerSnapshotV1;
        grant_terms: NurtureTrialGrantTermsSnapshotV1;
      }
    | ProviderFailure
  >;
};

export function createNurtureEnrollmentJourneyCurrentOwnerProvider(input: {
  source: NurtureEnrollmentCurrentOwnerEvidenceSourceV1;
  pairOwner: PrismaEnrollmentPairOwnerRepository;
}): NurtureEnrollmentJourneyCurrentOwnerProviderV1 {
  const fetchVerified = async (
    request: {
      workspace_id: string;
      institution_ref: string;
      workflow_ref: string;
    },
    purposeKey: "enrollment_family_acceptance" | "enrollment_trial_pair",
  ) => {
    let fetched;
    try {
      fetched = await input.source.fetchCurrentOwnerEvidence({
        ...request,
        purpose_key: purposeKey,
      });
    } catch {
      return {
        status: "unavailable" as const,
        reason_code: "current_owner_evidence_unavailable",
      };
    }
    if (fetched.status !== "resolved") return fetched;
    try {
      assertScenarioCurrentOwnerBindingPairEvidenceV1(
        fetched.value.evidence,
        "enrollment_current_owner_evidence",
      );
    } catch {
      return {
        status: "denied" as const,
        reason_code: "current_owner_evidence_invalid",
      };
    }
    if (fetched.value.evidence.purpose_key !== purposeKey) {
      return {
        status: "denied" as const,
        reason_code: "current_owner_evidence_purpose_drift",
      };
    }
    return { status: "resolved" as const, value: fetched.value };
  };

  return {
    async resolveFamilyAcceptance(request) {
      const verified = await fetchVerified(request, "enrollment_family_acceptance");
      if (verified.status !== "resolved") return verified;
      return { status: "resolved", snapshot: verified.value.guardian_action };
    },
    async resolveTrialPair(request) {
      const verified = await fetchVerified(request, "enrollment_trial_pair");
      if (verified.status !== "resolved") return verified;
      const pair = verified.value.pair;
      const grantTerms = verified.value.grant_terms;
      if (!pair || !grantTerms) {
        return { status: "denied", reason_code: "current_owner_pair_evidence_missing" };
      }
      let current;
      try {
        current = await input.pairOwner.isTrialSnapshotCurrent(request.workspace_id, pair);
      } catch {
        return { status: "unavailable", reason_code: "current_owner_reread_unavailable" };
      }
      if (!current) {
        return { status: "denied", reason_code: "current_owner_pair_not_current" };
      }
      return { status: "resolved", pair, grant_terms: grantTerms };
    },
  };
}
