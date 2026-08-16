import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createAjvRuntime,
  hasForbiddenKey,
  parsePublishedContract,
  type ValidateFunction,
} from "./response-validator-core.js";
import {
  TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE,
  type TeacherMediaAssociationOwnerOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/teacher-media-association-owner/v1/teacher-media-association-owner.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly TeacherMediaAssociationOwnerOperation[] = [
  "unassociated_query",
  "association_query",
  "associate_exchange",
  "discard_exchange",
];

export class TeacherMediaAssociationResponseContractError extends Error {
  constructor() {
    super("teacher_media_association_response_contract_violation");
    this.name = "TeacherMediaAssociationResponseContractError";
  }
}

const compileValidators = (): ReadonlyMap<
  TeacherMediaAssociationOwnerOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
    OPERATIONS,
    "schemas",
    "Teacher media-association runtime contract is invalid",
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.key
    || artifact.interface.version !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.version
    || digest !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.digest
  ) {
    throw new Error("Teacher media-association runtime contract pin mismatch");
  }
  const ajv = createAjvRuntime();
  ajv.addSchema(artifact.schemas);
  return new Map(
    OPERATIONS.map((operation) => {
      const validator = ajv.getSchema(
        artifact.operations[operation].response_schema_ref,
      );
      if (!validator) {
        throw new Error(
          `Teacher media-association schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedTeacherMediaAssociationResponse = (
  operation: TeacherMediaAssociationOwnerOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasOwnerExchangeSemantics(operation, response)
  ) {
    throw new TeacherMediaAssociationResponseContractError();
  }
};

// Exchange responses legitimately carry command identity and confirmation
// refs; the forbidden set keeps raw-identity and storage leaks out.
const forbiddenResponseFields = new Set([
  "action_ref",
  "participant_id",
  "role_assignment_id",
  "institution_id",
  "family_id",
  "child_id",
  "care_group_id",
  "enrollment_id",
  "grant_id",
  "media_asset_id",
  "attribution_id",
  "storage_ref",
  "signed_url",
  "url",
  "thumbnail_url",
  "preview_ref",
]);

function hasOwnerExchangeSemantics(
  operation: TeacherMediaAssociationOwnerOperation,
  response: unknown,
): boolean {
  if (hasForbiddenKey(response, forbiddenResponseFields)) {
    return false;
  }
  if (!isRecord(response)) return false;
  if (response.status === "unavailable") {
    return response.retryable === (response.reason_code === "temporarily_unavailable");
  }
  if (response.status !== "ready") return true;
  const owner = response.owner_resolution;
  const cache = response.cache_partition;
  const freshness = response.freshness;
  if (
    !isRecord(owner)
    || !isRecord(cache)
    || !isRecord(freshness)
    || !orderedReadyLifetime(owner.resolved_at, response.generated_at, cache.expires_at)
    || freshness.resolved_at !== owner.resolved_at
    || cache.resolution_ref !== owner.resolution_ref
    || cache.scope_version !== owner.scope_version
    || cache.presentation_role !== owner.presentation_role
    || cache.context_ref !== owner.context_ref
    || cache.operation !== operation
  ) {
    return false;
  }
  if (operation === "unassociated_query") {
    if (!Array.isArray(response.assets) || !Array.isArray(response.children)) {
      return false;
    }
    const assetRefs = response.assets.flatMap((asset) =>
      isRecord(asset) && typeof asset.media_ref === "string"
        ? [asset.media_ref]
        : []);
    const childRefs = response.children.flatMap((child) =>
      isRecord(child) && typeof child.child_ref === "string"
        ? [child.child_ref]
        : []);
    return new Set(assetRefs).size === response.assets.length
      && new Set(childRefs).size === response.children.length
      && Number(response.unassociated_count) >= response.assets.length;
  }
  if (operation === "association_query") {
    if (!Array.isArray(response.attributions)) return false;
    const refs = response.attributions.flatMap((attribution) =>
      isRecord(attribution) && typeof attribution.child_ref === "string"
        ? [attribution.child_ref]
        : []);
    return new Set(refs).size === response.attributions.length;
  }
  return true;
}

function orderedReadyLifetime(
  resolvedAt: unknown,
  generatedAt: unknown,
  expiresAt: unknown,
): boolean {
  const resolved = instantMillis(resolvedAt);
  const generated = instantMillis(generatedAt);
  const expires = instantMillis(expiresAt);
  return resolved !== null
    && generated !== null
    && expires !== null
    && resolved <= generated
    && generated < expires;
}

function instantMillis(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
