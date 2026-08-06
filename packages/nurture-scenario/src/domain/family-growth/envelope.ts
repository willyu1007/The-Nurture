/**
 * Wire types for the frozen My-Chat `family growth material` v1 contract
 * (My-Chat `d4ed0ce`, `family-growth-material-contract-v1.schema.json`).
 *
 * These mirror the frozen schema exactly — no private extension, no copy of
 * the schema file into `contracts/`. The only sanctioned divergence from a
 * plain mirror is that provider-side helpers live beside the types.
 */

export const FAMILY_GROWTH_RELEASE_CONTRACT_KEY = "family_growth_material_release" as const;
export const FAMILY_GROWTH_LIFECYCLE_CONTRACT_KEY = "family_growth_material_lifecycle" as const;
export const FAMILY_GROWTH_RECEIPT_CONTRACT_KEY =
  "family_growth_material_admission_receipt" as const;
export const FAMILY_GROWTH_CONTRACT_VERSION = "1.0.0" as const;

export type FamilyGrowthAdmissionModeV1 = "direct_family_release" | "guardian_confirmation";
export type FamilyGrowthRetentionModeV1 = "family_retained" | "source_linked";
export type FamilyGrowthLifecycleKindV1 = "correction" | "target_removal" | "redaction";
export type FamilyGrowthLifecycleReasonV1 =
  | "wrong_target"
  | "wrong_media"
  | "wrong_attribution"
  | "content_error"
  | "family_request"
  | "policy_requirement";
export type FamilyGrowthReceiptStatusV1 =
  | "applied"
  | "pending_guardian_confirmation"
  | "duplicate"
  | "tombstoned"
  | "rejected"
  | "conflict";

export type FamilyGrowthCanonicalTargetV1 = {
  child_id: string;
  family_id: string;
};

export type FamilyGrowthReleaseSourceV1 = {
  scenario_key: string;
  publication_release_ref: string;
  publish_process_ref: string;
  publish_revision_ref: string;
  publish_revision: number;
  content_digest: string;
  receipt_ref: string;
  source_target_ref: string;
  committed_at: string;
};

export type FamilyGrowthAdmissionV1 = {
  mode: FamilyGrowthAdmissionModeV1;
  policy_ref: string;
  policy_version: number;
};

export type FamilyGrowthDisplaySnapshotV1 = {
  title: string;
  summary?: string;
  source_label: string;
  contributor_label?: string;
};

export type FamilyGrowthAttributionV1 = {
  source_contributor_ref: string;
  source_organization_ref: string;
  contributed_at: string;
};

export type FamilyGrowthMediaItemV1 = {
  source_asset_ref: string;
  source_media_revision: number;
  content_digest: string;
  family_rendition_ref: string;
  mime_type: string;
  access_mode: "authorized_short_lived_url";
  width?: number;
  height?: number;
};

export type FamilyGrowthMaterialV1 = {
  material_kind: "photo";
  data_class: "child_growth_record";
  purpose_key: "child_growth_publication";
  occurred_at: string;
  display_snapshot: FamilyGrowthDisplaySnapshotV1;
  attribution: FamilyGrowthAttributionV1;
  media: FamilyGrowthMediaItemV1[];
};

export type FamilyGrowthRetentionV1 = {
  retention_mode: FamilyGrowthRetentionModeV1;
  redaction_policy: "cascade_required";
};

export type FamilyGrowthReleaseEventV1 = {
  contract_key: typeof FAMILY_GROWTH_RELEASE_CONTRACT_KEY;
  contract_version: typeof FAMILY_GROWTH_CONTRACT_VERSION;
  event_id: string;
  event_kind: "released";
  occurred_at: string;
  payload_digest: string;
  source: FamilyGrowthReleaseSourceV1;
  target: FamilyGrowthCanonicalTargetV1;
  admission: FamilyGrowthAdmissionV1;
  material: FamilyGrowthMaterialV1;
  retention: FamilyGrowthRetentionV1;
};

export type FamilyGrowthLifecycleSourceV1 = {
  scenario_key: string;
  publication_release_ref: string;
  event_ref: string;
  source_release_revision: number;
  reason_key: FamilyGrowthLifecycleReasonV1;
};

export type FamilyGrowthCorrectionV1 = {
  display_safe_text: string;
  content_digest: string;
};

export type FamilyGrowthLifecycleEventV1 = {
  contract_key: typeof FAMILY_GROWTH_LIFECYCLE_CONTRACT_KEY;
  contract_version: typeof FAMILY_GROWTH_CONTRACT_VERSION;
  event_id: string;
  event_kind: FamilyGrowthLifecycleKindV1;
  occurred_at: string;
  payload_digest: string;
  source: FamilyGrowthLifecycleSourceV1;
  target: FamilyGrowthCanonicalTargetV1;
  correction?: FamilyGrowthCorrectionV1;
};

export type FamilyGrowthAdmissionReceiptV1 = {
  contract_key: typeof FAMILY_GROWTH_RECEIPT_CONTRACT_KEY;
  contract_version: typeof FAMILY_GROWTH_CONTRACT_VERSION;
  receipt_id: string;
  release_event_id: string;
  source_scenario_key: string;
  source_release_ref: string;
  family_id: string;
  status: FamilyGrowthReceiptStatusV1;
  processed_at: string;
  consumer_contract_version: typeof FAMILY_GROWTH_CONTRACT_VERSION;
  admission_ref?: string;
  material_ref?: string;
  suppression_ref?: string;
  reason_code?: string;
};

// --- structural validation -------------------------------------------------

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const STABLE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const MIME_PATTERN = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

export type EnvelopeViolationV1 = { path: string; message: string };

class Violations {
  readonly items: EnvelopeViolationV1[] = [];
  add(path: string, message: string): void {
    this.items.push({ path, message });
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const checkExactKeys = (
  v: Violations,
  record: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): void => {
  for (const key of required) {
    if (!(key in record)) v.add(`${path}.${key}`, "required");
  }
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) v.add(`${path}.${key}`, "unknown field");
  }
};

const checkOpaqueRef = (v: Violations, value: unknown, path: string): void => {
  if (typeof value !== "string" || value.length < 1 || value.length > 256) {
    v.add(path, "must be an opaque ref (string, 1..256)");
  }
};

const checkDigest = (v: Violations, value: unknown, path: string): void => {
  if (typeof value !== "string" || !DIGEST_PATTERN.test(value)) {
    v.add(path, "must be a lowercase hex sha-256 digest");
  }
};

const checkStableKey = (v: Violations, value: unknown, path: string): void => {
  if (typeof value !== "string" || !STABLE_KEY_PATTERN.test(value)) {
    v.add(path, "must be a stable key");
  }
};

const checkDateTime = (v: Violations, value: unknown, path: string): void => {
  if (
    typeof value !== "string" ||
    !DATE_TIME_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    v.add(path, "must be an RFC 3339 date-time");
  }
};

const checkPositiveInteger = (v: Violations, value: unknown, path: string): void => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    v.add(path, "must be a positive integer");
  }
};

const checkConst = (v: Violations, value: unknown, expected: string, path: string): void => {
  if (value !== expected) v.add(path, `must be "${expected}"`);
};

const checkEnum = (
  v: Violations,
  value: unknown,
  allowed: readonly string[],
  path: string,
): void => {
  if (typeof value !== "string" || !allowed.includes(value)) {
    v.add(path, `must be one of ${allowed.join(", ")}`);
  }
};

const checkBoundedString = (
  v: Violations,
  value: unknown,
  min: number,
  max: number,
  path: string,
): void => {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    v.add(path, `must be a string (${min}..${max})`);
  }
};

const checkMediaItem = (v: Violations, value: unknown, path: string): void => {
  if (!isRecord(value)) {
    v.add(path, "must be an object");
    return;
  }
  checkExactKeys(
    v,
    value,
    [
      "source_asset_ref",
      "source_media_revision",
      "content_digest",
      "family_rendition_ref",
      "mime_type",
      "access_mode",
    ],
    ["width", "height"],
    path,
  );
  checkOpaqueRef(v, value.source_asset_ref, `${path}.source_asset_ref`);
  checkPositiveInteger(v, value.source_media_revision, `${path}.source_media_revision`);
  checkDigest(v, value.content_digest, `${path}.content_digest`);
  checkOpaqueRef(v, value.family_rendition_ref, `${path}.family_rendition_ref`);
  if (
    typeof value.mime_type !== "string" ||
    value.mime_type.length > 127 ||
    !MIME_PATTERN.test(value.mime_type)
  ) {
    v.add(`${path}.mime_type`, "must be a mime type (max 127)");
  }
  checkConst(v, value.access_mode, "authorized_short_lived_url", `${path}.access_mode`);
  if (value.width !== undefined) checkPositiveInteger(v, value.width, `${path}.width`);
  if (value.height !== undefined) checkPositiveInteger(v, value.height, `${path}.height`);
};

const checkTarget = (v: Violations, value: unknown, path: string): void => {
  if (!isRecord(value)) {
    v.add(path, "must be an object");
    return;
  }
  checkExactKeys(v, value, ["child_id", "family_id"], [], path);
  checkOpaqueRef(v, value.child_id, `${path}.child_id`);
  checkOpaqueRef(v, value.family_id, `${path}.family_id`);
};

/**
 * Structural validation of a release event against the frozen v1 schema.
 * Returns every violation rather than throwing on the first, so assembly
 * defects surface completely in one pass.
 */
export const validateReleaseEventV1 = (value: unknown): EnvelopeViolationV1[] => {
  const v = new Violations();
  if (!isRecord(value)) return [{ path: "release", message: "must be an object" }];
  checkExactKeys(
    v,
    value,
    [
      "contract_key",
      "contract_version",
      "event_id",
      "event_kind",
      "occurred_at",
      "payload_digest",
      "source",
      "target",
      "admission",
      "material",
      "retention",
    ],
    [],
    "release",
  );
  checkConst(v, value.contract_key, FAMILY_GROWTH_RELEASE_CONTRACT_KEY, "release.contract_key");
  checkConst(v, value.contract_version, FAMILY_GROWTH_CONTRACT_VERSION, "release.contract_version");
  checkOpaqueRef(v, value.event_id, "release.event_id");
  checkConst(v, value.event_kind, "released", "release.event_kind");
  checkDateTime(v, value.occurred_at, "release.occurred_at");
  checkDigest(v, value.payload_digest, "release.payload_digest");

  if (isRecord(value.source)) {
    const s = value.source;
    checkExactKeys(
      v,
      s,
      [
        "scenario_key",
        "publication_release_ref",
        "publish_process_ref",
        "publish_revision_ref",
        "publish_revision",
        "content_digest",
        "receipt_ref",
        "source_target_ref",
        "committed_at",
      ],
      [],
      "release.source",
    );
    checkStableKey(v, s.scenario_key, "release.source.scenario_key");
    checkOpaqueRef(v, s.publication_release_ref, "release.source.publication_release_ref");
    checkOpaqueRef(v, s.publish_process_ref, "release.source.publish_process_ref");
    checkOpaqueRef(v, s.publish_revision_ref, "release.source.publish_revision_ref");
    checkPositiveInteger(v, s.publish_revision, "release.source.publish_revision");
    checkDigest(v, s.content_digest, "release.source.content_digest");
    checkOpaqueRef(v, s.receipt_ref, "release.source.receipt_ref");
    checkOpaqueRef(v, s.source_target_ref, "release.source.source_target_ref");
    checkDateTime(v, s.committed_at, "release.source.committed_at");
  } else {
    v.add("release.source", "must be an object");
  }

  checkTarget(v, value.target, "release.target");

  if (isRecord(value.admission)) {
    const a = value.admission;
    checkExactKeys(v, a, ["mode", "policy_ref", "policy_version"], [], "release.admission");
    checkEnum(
      v,
      a.mode,
      ["direct_family_release", "guardian_confirmation"],
      "release.admission.mode",
    );
    checkOpaqueRef(v, a.policy_ref, "release.admission.policy_ref");
    checkPositiveInteger(v, a.policy_version, "release.admission.policy_version");
  } else {
    v.add("release.admission", "must be an object");
  }

  if (isRecord(value.material)) {
    const m = value.material;
    checkExactKeys(
      v,
      m,
      [
        "material_kind",
        "data_class",
        "purpose_key",
        "occurred_at",
        "display_snapshot",
        "attribution",
        "media",
      ],
      [],
      "release.material",
    );
    checkConst(v, m.material_kind, "photo", "release.material.material_kind");
    checkConst(v, m.data_class, "child_growth_record", "release.material.data_class");
    checkConst(v, m.purpose_key, "child_growth_publication", "release.material.purpose_key");
    checkDateTime(v, m.occurred_at, "release.material.occurred_at");
    if (isRecord(m.display_snapshot)) {
      const d = m.display_snapshot;
      checkExactKeys(
        v,
        d,
        ["title", "source_label"],
        ["summary", "contributor_label"],
        "release.material.display_snapshot",
      );
      checkBoundedString(v, d.title, 1, 120, "release.material.display_snapshot.title");
      if (d.summary !== undefined) {
        checkBoundedString(v, d.summary, 0, 500, "release.material.display_snapshot.summary");
      }
      checkBoundedString(v, d.source_label, 1, 80, "release.material.display_snapshot.source_label");
      if (d.contributor_label !== undefined) {
        checkBoundedString(
          v,
          d.contributor_label,
          0,
          80,
          "release.material.display_snapshot.contributor_label",
        );
      }
    } else {
      v.add("release.material.display_snapshot", "must be an object");
    }
    if (isRecord(m.attribution)) {
      const at = m.attribution;
      checkExactKeys(
        v,
        at,
        ["source_contributor_ref", "source_organization_ref", "contributed_at"],
        [],
        "release.material.attribution",
      );
      checkOpaqueRef(
        v,
        at.source_contributor_ref,
        "release.material.attribution.source_contributor_ref",
      );
      checkOpaqueRef(
        v,
        at.source_organization_ref,
        "release.material.attribution.source_organization_ref",
      );
      checkDateTime(v, at.contributed_at, "release.material.attribution.contributed_at");
    } else {
      v.add("release.material.attribution", "must be an object");
    }
    if (Array.isArray(m.media)) {
      if (m.media.length < 1 || m.media.length > 20) {
        v.add("release.material.media", "must contain 1..20 items");
      }
      m.media.forEach((item, index) =>
        checkMediaItem(v, item, `release.material.media[${index}]`),
      );
    } else {
      v.add("release.material.media", "must be an array");
    }
  } else {
    v.add("release.material", "must be an object");
  }

  if (isRecord(value.retention)) {
    const r = value.retention;
    checkExactKeys(v, r, ["retention_mode", "redaction_policy"], [], "release.retention");
    checkEnum(v, r.retention_mode, ["family_retained", "source_linked"], "release.retention.retention_mode");
    checkConst(v, r.redaction_policy, "cascade_required", "release.retention.redaction_policy");
  } else {
    v.add("release.retention", "must be an object");
  }

  return v.items;
};

/** Structural validation of a lifecycle event against the frozen v1 schema. */
export const validateLifecycleEventV1 = (value: unknown): EnvelopeViolationV1[] => {
  const v = new Violations();
  if (!isRecord(value)) return [{ path: "lifecycle", message: "must be an object" }];
  checkExactKeys(
    v,
    value,
    [
      "contract_key",
      "contract_version",
      "event_id",
      "event_kind",
      "occurred_at",
      "payload_digest",
      "source",
      "target",
    ],
    ["correction"],
    "lifecycle",
  );
  checkConst(v, value.contract_key, FAMILY_GROWTH_LIFECYCLE_CONTRACT_KEY, "lifecycle.contract_key");
  checkConst(v, value.contract_version, FAMILY_GROWTH_CONTRACT_VERSION, "lifecycle.contract_version");
  checkOpaqueRef(v, value.event_id, "lifecycle.event_id");
  checkEnum(
    v,
    value.event_kind,
    ["correction", "target_removal", "redaction"],
    "lifecycle.event_kind",
  );
  checkDateTime(v, value.occurred_at, "lifecycle.occurred_at");
  checkDigest(v, value.payload_digest, "lifecycle.payload_digest");

  if (isRecord(value.source)) {
    const s = value.source;
    checkExactKeys(
      v,
      s,
      [
        "scenario_key",
        "publication_release_ref",
        "event_ref",
        "source_release_revision",
        "reason_key",
      ],
      [],
      "lifecycle.source",
    );
    checkStableKey(v, s.scenario_key, "lifecycle.source.scenario_key");
    checkOpaqueRef(v, s.publication_release_ref, "lifecycle.source.publication_release_ref");
    checkOpaqueRef(v, s.event_ref, "lifecycle.source.event_ref");
    checkPositiveInteger(v, s.source_release_revision, "lifecycle.source.source_release_revision");
    checkEnum(
      v,
      s.reason_key,
      [
        "wrong_target",
        "wrong_media",
        "wrong_attribution",
        "content_error",
        "family_request",
        "policy_requirement",
      ],
      "lifecycle.source.reason_key",
    );
  } else {
    v.add("lifecycle.source", "must be an object");
  }

  checkTarget(v, value.target, "lifecycle.target");

  // The schema's allOf: correction body iff event_kind=correction.
  if (value.event_kind === "correction") {
    if (isRecord(value.correction)) {
      const c = value.correction;
      checkExactKeys(v, c, ["display_safe_text", "content_digest"], [], "lifecycle.correction");
      checkBoundedString(v, c.display_safe_text, 1, 2000, "lifecycle.correction.display_safe_text");
      checkDigest(v, c.content_digest, "lifecycle.correction.content_digest");
    } else {
      v.add("lifecycle.correction", "required for correction events");
    }
  } else if (value.correction !== undefined) {
    v.add("lifecycle.correction", "not allowed for this event kind");
  }

  return v.items;
};
