import { createHmac } from "node:crypto";

/**
 * Keyed, actor-bound handles shared by every G2 capability. They are the only
 * way a target travels to and from a caller: the embedded id is unusable
 * without the signature, and execute still re-reads current authority.
 * Keeping them in one module also keeps the capability modules acyclic.
 */
const OPTION_REF_VERSION = "1";
const ITEM_REF_VERSION = "1";
const MESSAGE_REF_VERSION = "1";

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
  return `${OPTION_REF_VERSION}.${scope.enrollment_id}.${tag}`;
};

export const resolveTargetOptionRef = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  ref: string,
): string | null => {
  const parts = ref.split(".");
  if (parts.length !== 3 || parts[0] !== OPTION_REF_VERSION) return null;
  const [, enrollmentId] = parts;
  if (!enrollmentId) return null;
  return issueTargetOptionRef(integrityKey, { ...scope, enrollment_id: enrollmentId }) === ref
    ? enrollmentId
    : null;
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
