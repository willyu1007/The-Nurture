import { createHash } from "node:crypto";
import { issueDisplayRef } from "./family-care-queries.js";
import { resolveFamilyCareMessageTargetRef } from "./keyed-refs.js";
import type {
  ProtectedContentEnvelopeV1,
  ProtectedContentWritePort,
} from "./protected-content.js";

/**
 * Provider-owned protected read interface introduced by T-005 G2-B for the
 * later T-007 Admin surface composition. It is intentionally separate from
 * the public surface capability registry and from all action authority.
 */
export const INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_SCHEMA_V1 = {
  key: "nurture.institution-business-communication-owner-read",
  version: "1.0.0",
  request: [
    "workspace_id",
    "actor_participant_id",
    "surface",
    "interface_contract",
    "target_option_ref",
  ],
  projection: {
    role: "institution_admin",
    refs: ["messageRef", "enrollmentRef", "careGroupRef", "institutionRef"],
    businessScope: ["dataClass", "direction", "purpose", "adminSupervision"],
    author: ["side", "role"],
    changeState: ["content", "lifecycle", "lifecycleReason"],
    protectedContent: ["body", "attachments"],
    actions: [],
  },
  security: {
    carrier: "private_service_authenticated_no_store",
    authority: "current_exact_owner_read",
    action_authority: "none",
    protected_content_copy: "forbidden",
  },
} as const;

const computedInterfaceDigest = `sha256:${createHash("sha256")
  .update(JSON.stringify(INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_SCHEMA_V1), "utf8")
  .digest("hex")}` as const;

export const INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_DIGEST =
  "sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921" as const;

if (computedInterfaceDigest !== INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_DIGEST) {
  throw new Error(
    "Institution business-communication interface changed without an exact digest rotation",
  );
}

export const INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE = {
  key: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_SCHEMA_V1.key,
  version: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_SCHEMA_V1.version,
  digest: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE_DIGEST,
} as const;

export const INSTITUTION_ADMIN_BUSINESS_COMMUNICATION_DISCLOSURE_KEY =
  "institution_admin_business_communication" as const;

/** Closed policy-snapshot predicate. Missing/legacy/partially shaped values deny. */
export const institutionAdminDisclosureAuthorizes = (
  policySnapshot: unknown,
  expected: {
    institution_id: string;
    enrollment_id: string;
    care_group_id: string;
    direction: "family_to_org" | "org_to_family";
    data_class: "family_care_question" | "direct_care_communication";
    purpose: "family_care_workflow";
  },
): boolean => {
  if (!policySnapshot || typeof policySnapshot !== "object" || Array.isArray(policySnapshot)) {
    return false;
  }
  const disclosure = (
    policySnapshot as Record<string, unknown>
  )[INSTITUTION_ADMIN_BUSINESS_COMMUNICATION_DISCLOSURE_KEY];
  if (!disclosure || typeof disclosure !== "object" || Array.isArray(disclosure)) {
    return false;
  }
  const record = disclosure as Record<string, unknown>;
  return (
    record.schema_version === 1 &&
    record.disclosed === true &&
    record.institution_id === expected.institution_id &&
    record.enrollment_id === expected.enrollment_id &&
    record.care_group_id === expected.care_group_id &&
    Array.isArray(record.directions) &&
    record.directions.includes(expected.direction) &&
    Array.isArray(record.data_classes) &&
    record.data_classes.includes(expected.data_class) &&
    Array.isArray(record.purposes) &&
    record.purposes.includes(expected.purpose)
  );
};

export type InstitutionBusinessCommunicationRawV1 = {
  message_id: string;
  enrollment_id: string;
  care_group_id: string;
  institution_id: string;
  direction: "family_to_org" | "org_to_family";
  data_class: "family_care_question" | "direct_care_communication";
  purpose: "family_care_workflow";
  author_side: "family" | "care_group";
  author_role: "guardian" | "caregiver" | "lead_caregiver";
  occurred_at: string;
  corrected: boolean;
  redacted: boolean;
  lifecycle: "active" | "closed" | "suppressed";
  lifecycle_reason?: "family_withdrawn" | "grant_revoked" | "source_redacted" | "expired";
  body_envelope?: unknown;
  correction_body_envelope?: unknown;
};

export type InstitutionBusinessCommunicationReadPort = {
  loadInstitutionBusinessCommunication(input: {
    workspace_id: string;
    participant_id: string;
    message_id: string;
  }): Promise<
    | { authorized: true; communication: InstitutionBusinessCommunicationRawV1 }
    | { authorized: false }
  >;
};

export type InstitutionBusinessCommunicationProjectionV1 = {
  interfaceContract: typeof INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE;
  projectionRole: "institution_admin";
  messageRef: string;
  occurredAt: string;
  businessScope: {
    enrollmentRef: string;
    careGroupRef: string;
    institutionRef: string;
    dataClass: "family_care_question" | "direct_care_communication";
    direction: "family_to_org" | "org_to_family";
    purpose: "family_care_workflow";
    adminSupervision: "pre_send_disclosed";
  };
  author: {
    side: "family" | "care_group";
    role: "guardian" | "caregiver" | "lead_caregiver";
  };
  changeState: {
    content: "original" | "corrected" | "redacted";
    lifecycle: "active" | "closed" | "suppressed";
    lifecycleReason?: "family_withdrawn" | "grant_revoked" | "source_redacted" | "expired";
  };
  content?: { body: string };
  attachments: [];
  actions: [];
};

export type InstitutionBusinessCommunicationDecisionV1 =
  | { status: "ok"; output: InstitutionBusinessCommunicationProjectionV1 }
  | { status: "denied"; reason_code: "not_authorized" }
  | { status: "unavailable"; reason_code: "protected_content_unavailable" };

export const readInstitutionBusinessCommunication = async (
  deps: {
    reads: InstitutionBusinessCommunicationReadPort;
    protected_content: Pick<ProtectedContentWritePort, "unseal">;
    integrity_key: string;
  },
  request: {
    workspace_id: string;
    participant_id: string;
    target_option_ref: string;
  },
): Promise<InstitutionBusinessCommunicationDecisionV1> => {
  const messageId = resolveFamilyCareMessageTargetRef(
    deps.integrity_key,
    {
      workspace_id: request.workspace_id,
      participant_id: request.participant_id,
    },
    request.target_option_ref,
  );
  if (!messageId) return { status: "denied", reason_code: "not_authorized" };
  const loaded = await deps.reads.loadInstitutionBusinessCommunication({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    message_id: messageId,
  });
  if (!loaded.authorized) return { status: "denied", reason_code: "not_authorized" };

  const row = loaded.communication;
  let content: { body: string } | undefined;
  if (!row.redacted) {
    const envelope = row.correction_body_envelope ?? row.body_envelope;
    if (!envelope) {
      return { status: "unavailable", reason_code: "protected_content_unavailable" };
    }
    try {
      content = {
        body: deps.protected_content.unseal(envelope as ProtectedContentEnvelopeV1),
      };
    } catch {
      return { status: "unavailable", reason_code: "protected_content_unavailable" };
    }
  }

  const displayScope = { workspace_id: request.workspace_id };
  return {
    status: "ok",
    output: {
      interfaceContract: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
      projectionRole: "institution_admin",
      messageRef: issueDisplayRef(
        deps.integrity_key,
        displayScope,
        "institution_business_communication",
        row.message_id,
      ),
      occurredAt: row.occurred_at,
      businessScope: {
        enrollmentRef: issueDisplayRef(
          deps.integrity_key,
          displayScope,
          "enrollment",
          row.enrollment_id,
        ),
        careGroupRef: issueDisplayRef(
          deps.integrity_key,
          displayScope,
          "care_group",
          row.care_group_id,
        ),
        institutionRef: issueDisplayRef(
          deps.integrity_key,
          displayScope,
          "institution",
          row.institution_id,
        ),
        dataClass: row.data_class,
        direction: row.direction,
        purpose: row.purpose,
        adminSupervision: "pre_send_disclosed",
      },
      author: { side: row.author_side, role: row.author_role },
      changeState: {
        content: row.redacted ? "redacted" : row.corrected ? "corrected" : "original",
        lifecycle: row.lifecycle,
        ...(row.lifecycle_reason ? { lifecycleReason: row.lifecycle_reason } : {}),
      },
      ...(content ? { content } : {}),
      attachments: [],
      actions: [],
    },
  };
};
