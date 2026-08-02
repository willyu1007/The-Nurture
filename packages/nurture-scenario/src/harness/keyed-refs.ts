import { createHmac } from "node:crypto";

/**
 * Keyed, actor-bound handles shared by every G2 capability. They are the only
 * way a target travels to and from a caller. Target-option refs are
 * non-reversible HMAC handles; execute still re-reads current authority.
 * Keeping them in one module also keeps the capability modules acyclic.
 */
const OPTION_REF_VERSION = "1";
const ITEM_REF_VERSION = "1";
const MESSAGE_REF_VERSION = "1";
const POLICY_DECISION_REF_VERSION = "1";

type CapabilityResultSourceRef = {
  namespace: string;
  object_type: string;
  object_id: string;
};

/**
 * Keyed body digest used inside the canonical command payload so neither the
 * CommandExecution payload hash nor the confirmation stores an enumerable
 * bare hash of a low-entropy protected body.
 */
export const computeProtectedBodyTag = (integrityKey: string, body: string): string => {
  if (typeof integrityKey !== "string" || integrityKey.length < 32) {
    throw new Error("harness integrity key must contain at least 32 characters");
  }
  return createHmac("sha256", integrityKey)
    .update("nurture.protected-body.v1\0", "utf8")
    .update(body, "utf8")
    .digest("hex");
};

/**
 * Stable display-only reference for a committed capability result. The
 * purpose discriminator lets one canonical object safely back distinct
 * public concepts (for example a Message and its redaction tombstone)
 * without leaking the canonical id or making the result ref executable.
 */
export const issueCapabilityResultRef = (
  integrityKey: string,
  scope: { workspace_id: string },
  purpose: string,
  source: CapabilityResultSourceRef,
): string =>
  createHmac("sha256", integrityKey)
    .update(
      `nurture.capability-result.v1\0${scope.workspace_id}\0${purpose}\0${source.namespace}\0${source.object_type}\0${source.object_id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);

export const issueTargetOptionRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string; enrollment_id: string },
): string => {
  const tag = createHmac("sha256", integrityKey)
    .update(
      `nurture.target-option.v${OPTION_REF_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${scope.enrollment_id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `${OPTION_REF_VERSION}.${tag}`;
};

export const resolveTargetOptionRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
  eligibleEnrollmentIds: Iterable<string>,
): string | null => {
  const parts = ref.split(".");
  if (parts.length !== 2 || parts[0] !== OPTION_REF_VERSION) return null;
  for (const enrollmentId of eligibleEnrollmentIds) {
    if (issueTargetOptionRef(integrityKey, { ...scope, enrollment_id: enrollmentId }) === ref) {
      return enrollmentId;
    }
  }
  return null;
};

export const issueCareItemTargetRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string; item_id: string },
): string => {
  const tag = createHmac("sha256", integrityKey)
    .update(
      `nurture.care-item-target.v${ITEM_REF_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${scope.item_id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `${ITEM_REF_VERSION}.${scope.item_id}.${tag}`;
};

export const resolveCareItemTargetRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
): string | null => {
  const parts = ref.split(".");
  if (parts.length !== 3 || parts[0] !== ITEM_REF_VERSION || !parts[1]) return null;
  return issueCareItemTargetRef(integrityKey, { ...scope, item_id: parts[1] }) === ref
    ? parts[1]
    : null;
};

export const issueFamilyCareMessageTargetRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string; message_id: string },
): string => {
  const tag = createHmac("sha256", integrityKey)
    .update(
      `nurture.family-care-message-target.v${MESSAGE_REF_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${scope.message_id}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `${MESSAGE_REF_VERSION}.${scope.message_id}.${tag}`;
};

export const resolveFamilyCareMessageTargetRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
): string | null => {
  const parts = ref.split(".");
  if (parts.length !== 3 || parts[0] !== MESSAGE_REF_VERSION || !parts[1]) return null;
  return issueFamilyCareMessageTargetRef(integrityKey, {
    ...scope,
    message_id: parts[1],
  }) === ref
    ? parts[1]
    : null;
};

export type PolicyRedactionDecisionBindingV1 = {
  message_id: string;
  message_version: number;
};

/**
 * Owner-issued policy evidence for the system-only redaction capability.
 * It is actor/workspace bound and pins the exact Message head. Execute still
 * re-reads the current system role and Message facts; this reference is never
 * sufficient authority by itself.
 */
export const issuePolicyRedactionDecisionRef = (
  integrityKey: string,
  scope: {
    workspace_id: string;
    participant_id: string;
    message_id: string;
    message_version: number;
  },
): string => {
  if (!Number.isSafeInteger(scope.message_version) || scope.message_version < 0) {
    throw new Error("policy decision message version must be a non-negative safe integer");
  }
  const payload = Buffer.from(
    JSON.stringify({
      message_id: scope.message_id,
      message_version: scope.message_version,
    }),
    "utf8",
  ).toString("base64url");
  const tag = createHmac("sha256", integrityKey)
    .update(
      `nurture.policy-redaction-decision.v${POLICY_DECISION_REF_VERSION}\0${scope.workspace_id}\0${scope.participant_id}\0${payload}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `${POLICY_DECISION_REF_VERSION}.${payload}.${tag}`;
};

export const resolvePolicyRedactionDecisionRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
): PolicyRedactionDecisionBindingV1 | null => {
  const parts = ref.split(".");
  if (parts.length !== 3 || parts[0] !== POLICY_DECISION_REF_VERSION) return null;
  const [, payload] = parts;
  if (!payload) return null;
  let binding: PolicyRedactionDecisionBindingV1;
  try {
    binding = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !binding ||
    typeof binding.message_id !== "string" ||
    binding.message_id.length === 0 ||
    !Number.isSafeInteger(binding.message_version) ||
    binding.message_version < 0
  ) {
    return null;
  }
  return issuePolicyRedactionDecisionRef(integrityKey, { ...scope, ...binding }) === ref
    ? binding
    : null;
};
