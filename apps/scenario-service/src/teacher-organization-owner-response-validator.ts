import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  TEACHER_ORGANIZATION_OWNER_INTERFACE,
  type TeacherOrganizationOwnerOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/teacher-organization-owner/v1/teacher-organization-owner.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly TeacherOrganizationOwnerOperation[] = [
  "feed_query",
  "organization_query",
  "organize_exchange",
  "supplement_exchange",
  "class_note_exchange",
  "queue_admission_exchange",
];

type PublishedContract = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Record<
    TeacherOrganizationOwnerOperation,
    Readonly<{ response_schema_ref: string }>
  >;
  schemas: AnySchema;
}>;

type AjvRuntime = Readonly<{
  addSchema(schema: AnySchema): unknown;
  getSchema(ref: string): ValidateFunction | undefined;
}>;

const Ajv2020 = ((Ajv2020Module as unknown as { default?: unknown }).default
  ?? Ajv2020Module) as new (options: object) => AjvRuntime;
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default
  ?? addFormatsModule) as (ajv: AjvRuntime) => unknown;

export class TeacherOrganizationResponseContractError extends Error {
  constructor() {
    super("teacher_organization_response_contract_violation");
    this.name = "TeacherOrganizationResponseContractError";
  }
}

const parsePublishedContract = (value: unknown): PublishedContract => {
  if (!isRecord(value) || !isRecord(value.interface)) {
    throw new Error("Teacher organization runtime contract is invalid");
  }
  if (
    typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value.schemas)
  ) {
    throw new Error("Teacher organization runtime contract is invalid");
  }
  for (const operation of OPERATIONS) {
    const definition = value.operations[operation];
    if (
      !isRecord(definition)
      || typeof definition.response_schema_ref !== "string"
    ) {
      throw new Error("Teacher organization runtime contract is invalid");
    }
  }
  return value as PublishedContract;
};

const compileValidators = (): ReadonlyMap<
  TeacherOrganizationOwnerOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== TEACHER_ORGANIZATION_OWNER_INTERFACE.key
    || artifact.interface.version !== TEACHER_ORGANIZATION_OWNER_INTERFACE.version
    || digest !== TEACHER_ORGANIZATION_OWNER_INTERFACE.digest
  ) {
    throw new Error("Teacher organization runtime contract pin mismatch");
  }
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(artifact.schemas);
  return new Map(
    OPERATIONS.map((operation) => {
      const validator = ajv.getSchema(
        artifact.operations[operation].response_schema_ref,
      );
      if (!validator) {
        throw new Error(
          `Teacher organization schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedTeacherOrganizationResponse = (
  operation: TeacherOrganizationOwnerOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasOwnerExchangeSemantics(operation, response)
  ) {
    throw new TeacherOrganizationResponseContractError();
  }
};

// Unlike the read-only class-stream presenter, exchange responses here carry
// command_request_id and confirmation_ref by design; the forbidden set keeps
// only raw-identity and storage leaks.
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
  "storage_ref",
  "signed_url",
  "url",
]);

function hasOwnerExchangeSemantics(
  operation: TeacherOrganizationOwnerOperation,
  response: unknown,
): boolean {
  if (collectKeys(response).some((key) => forbiddenResponseFields.has(key))) {
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
    || cache.query_key !== owner.scope_ref
  ) {
    return false;
  }
  if (operation === "feed_query") {
    if (!Array.isArray(response.captures)) return false;
    const refs = response.captures.flatMap((capture) =>
      isRecord(capture) && typeof capture.capture_ref === "string"
        ? [capture.capture_ref]
        : []);
    return new Set(refs).size === response.captures.length;
  }
  if (!Array.isArray(response.lane) || !isRecord(response.batch)) return false;
  const batch = response.batch;
  if (
    typeof batch.capture_count !== "number"
    || typeof batch.stable_capture_count !== "number"
    || batch.stable_capture_count > batch.capture_count
  ) {
    return false;
  }
  const processRefs: string[] = [];
  let activeQuickAdjust = 0;
  for (const card of response.lane) {
    if (!isRecord(card) || typeof card.process_ref !== "string") return false;
    processRefs.push(card.process_ref);
    if (card.quick_adjust_until !== undefined) activeQuickAdjust += 1;
    if (card.state === "pending_release") {
      const preview = card.admission_preview;
      if (!isRecord(preview) || preview.status !== "already_satisfied") {
        return false;
      }
    }
  }
  return new Set(processRefs).size === response.lane.length
    && activeQuickAdjust <= 1;
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

function collectKeys(value: unknown, output: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, output);
    return output;
  }
  if (!isRecord(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    output.push(key);
    collectKeys(child, output);
  }
  return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
