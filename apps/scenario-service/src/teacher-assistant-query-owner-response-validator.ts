import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createAjvRuntime,
  hasForbiddenKey,
  parsePublishedContract,
  type ValidateFunction,
} from "./response-validator-core.js";
import {
  TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE,
  type TeacherAssistantQueryOwnerOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/teacher-assistant-query-owner/v1/teacher-assistant-query-owner.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly TeacherAssistantQueryOwnerOperation[] = [
  "missing_records_query",
  "weekly_source_query",
  "weekly_draft_exchange",
];
const CARE_KINDS = [
  "meal",
  "nap",
  "mood",
  "activity",
  "health_observation",
] as const;

export class TeacherAssistantQueryResponseContractError extends Error {
  constructor() {
    super("teacher_assistant_query_response_contract_violation");
    this.name = "TeacherAssistantQueryResponseContractError";
  }
}

const compileValidators = (): ReadonlyMap<
  TeacherAssistantQueryOwnerOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
    OPERATIONS,
    "schemas",
    "Teacher assistant-query runtime contract is invalid",
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.key
    || artifact.interface.version !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.version
    || digest !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.digest
  ) {
    throw new Error("Teacher assistant-query runtime contract pin mismatch");
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
          `Teacher assistant-query schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedTeacherAssistantQueryResponse = (
  operation: TeacherAssistantQueryOwnerOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasOwnerExchangeSemantics(operation, response)
  ) {
    throw new TeacherAssistantQueryResponseContractError();
  }
};

// Exchange responses legitimately carry command identity and the process
// ref; the forbidden set keeps raw identity, storage and executable
// handoffs out.
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
  operation: TeacherAssistantQueryOwnerOperation,
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
  if (operation === "missing_records_query") {
    return hasMissingRecordsSemantics(response);
  }
  return hasWeeklySourceSemantics(response);
}

function hasMissingRecordsSemantics(response: Record<string, unknown>): boolean {
  if (!Array.isArray(response.children)) return false;
  const refs: string[] = [];
  let missingTotal = 0;
  for (const child of response.children) {
    if (!isRecord(child) || typeof child.child_ref !== "string") return false;
    refs.push(child.child_ref);
    const present = child.present_kinds;
    const missing = child.missing_kinds;
    if (!Array.isArray(present) || !Array.isArray(missing)) return false;
    missingTotal += missing.length;
    const union = [...present, ...missing].sort();
    if (union.join("|") !== [...CARE_KINDS].sort().join("|")) return false;
    if (missing.length > 0) {
      if (
        !isRecord(child.handoff)
        || child.handoff.child_ref !== child.child_ref
      ) {
        return false;
      }
    } else if ("handoff" in child) {
      return false;
    }
  }
  return new Set(refs).size === response.children.length
    && response.missing_count === missingTotal;
}

function hasWeeklySourceSemantics(response: Record<string, unknown>): boolean {
  const weekStart = instantMillis(`${String(response.week_start)}T00:00:00.000Z`);
  const weekEnd = instantMillis(`${String(response.week_end)}T00:00:00.000Z`);
  if (
    weekStart === null
    || weekEnd === null
    || weekEnd - weekStart !== 6 * 86_400_000
  ) {
    return false;
  }
  if (!Array.isArray(response.children)) return false;
  const refs: string[] = [];
  let recordTotal = 0;
  let mediaTotal = 0;
  for (const child of response.children) {
    if (!isRecord(child) || typeof child.child_ref !== "string") return false;
    refs.push(child.child_ref);
    const counts = child.care_counts;
    if (!isRecord(counts)) return false;
    for (const kind of CARE_KINDS) recordTotal += Number(counts[kind]);
    mediaTotal += Number(child.confirmed_media_count);
  }
  return new Set(refs).size === response.children.length
    && response.class_total_records === recordTotal
    && response.class_total_confirmed_media === mediaTotal;
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
