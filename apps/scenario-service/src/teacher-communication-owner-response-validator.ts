import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  TEACHER_COMMUNICATION_OWNER_INTERFACE,
  type TeacherCommunicationOwnerOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/teacher-communication-owner/v1/teacher-communication-owner.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly TeacherCommunicationOwnerOperation[] = [
  "targets_query",
  "membership_query",
  "timeline_query",
  "send_text_exchange",
  "withdraw_staged_exchange",
  "mark_read_exchange",
];

type PublishedContract = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Record<
    TeacherCommunicationOwnerOperation,
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

export class TeacherCommunicationResponseContractError extends Error {
  constructor() {
    super("teacher_communication_response_contract_violation");
    this.name = "TeacherCommunicationResponseContractError";
  }
}

const parsePublishedContract = (value: unknown): PublishedContract => {
  if (!isRecord(value) || !isRecord(value.interface)) {
    throw new Error("Teacher communication runtime contract is invalid");
  }
  if (
    typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value.schemas)
  ) {
    throw new Error("Teacher communication runtime contract is invalid");
  }
  for (const operation of OPERATIONS) {
    const definition = value.operations[operation];
    if (
      !isRecord(definition)
      || typeof definition.response_schema_ref !== "string"
    ) {
      throw new Error("Teacher communication runtime contract is invalid");
    }
  }
  return value as PublishedContract;
};

const compileValidators = (): ReadonlyMap<
  TeacherCommunicationOwnerOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== TEACHER_COMMUNICATION_OWNER_INTERFACE.key
    || artifact.interface.version !== TEACHER_COMMUNICATION_OWNER_INTERFACE.version
    || digest !== TEACHER_COMMUNICATION_OWNER_INTERFACE.digest
  ) {
    throw new Error("Teacher communication runtime contract pin mismatch");
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
          `Teacher communication schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedTeacherCommunicationResponse = (
  operation: TeacherCommunicationOwnerOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasOwnerExchangeSemantics(operation, response)
  ) {
    throw new TeacherCommunicationResponseContractError();
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
  "thread_id",
  "message_id",
  "storage_ref",
  "signed_url",
  "url",
]);

function hasOwnerExchangeSemantics(
  operation: TeacherCommunicationOwnerOperation,
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
  ) {
    return false;
  }
  if (operation === "targets_query") {
    if (!Array.isArray(response.threads) || !isRecord(response.unread_summary)) {
      return false;
    }
    const refs = new Set<string>();
    let total = 0;
    let withUnread = 0;
    for (const thread of response.threads) {
      if (!isRecord(thread) || typeof thread.thread_ref !== "string") return false;
      if (refs.has(thread.thread_ref)) return false;
      refs.add(thread.thread_ref);
      const unread = Number(thread.unread_count);
      total += unread;
      if (unread > 0) withUnread += 1;
    }
    return response.unread_summary.total_unread === Math.min(total, 999)
      && response.unread_summary.threads_with_unread === withUnread;
  }
  if (operation === "membership_query") {
    if (!Array.isArray(response.members)) return false;
    const refs = response.members.flatMap((member) =>
      isRecord(member) && typeof member.member_ref === "string"
        ? [member.member_ref]
        : []);
    return new Set(refs).size === response.members.length;
  }
  if (operation === "timeline_query") {
    if (!Array.isArray(response.messages)) return false;
    const refs = response.messages.flatMap((message) =>
      isRecord(message) && typeof message.message_ref === "string"
        ? [message.message_ref]
        : []);
    return new Set(refs).size === response.messages.length;
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
