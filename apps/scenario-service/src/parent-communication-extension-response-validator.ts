import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  PARENT_COMMUNICATION_EXTENSION_INTERFACE,
  type ParentCommunicationExtensionOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/parent-communication-owner/v1-1/parent-communication-owner-extension.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly ParentCommunicationExtensionOperation[] = [
  "redaction_preview_query",
  "redact_exchange",
  "delivery_receipt_query",
];

type PublishedContract = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Record<
    ParentCommunicationExtensionOperation,
    Readonly<{ response_schema_ref: string }>
  >;
  contract_schema: AnySchema;
}>;

type AjvRuntime = Readonly<{
  addSchema(schema: AnySchema): unknown;
  getSchema(ref: string): ValidateFunction | undefined;
}>;

const Ajv2020 = ((Ajv2020Module as unknown as { default?: unknown }).default
  ?? Ajv2020Module) as new (options: object) => AjvRuntime;
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default
  ?? addFormatsModule) as (ajv: AjvRuntime) => unknown;

export class ParentCommunicationExtensionResponseContractError extends Error {
  constructor() {
    super("parent_communication_extension_response_contract_violation");
    this.name = "ParentCommunicationExtensionResponseContractError";
  }
}

const parsePublishedContract = (value: unknown): PublishedContract => {
  if (!isRecord(value) || !isRecord(value.interface)) {
    throw new Error("Parent-communication extension runtime contract is invalid");
  }
  if (
    typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value.contract_schema)
  ) {
    throw new Error("Parent-communication extension runtime contract is invalid");
  }
  for (const operation of OPERATIONS) {
    const definition = value.operations[operation];
    if (
      !isRecord(definition)
      || typeof definition.response_schema_ref !== "string"
    ) {
      throw new Error("Parent-communication extension runtime contract is invalid");
    }
  }
  return value as PublishedContract;
};

const compileValidators = (): ReadonlyMap<
  ParentCommunicationExtensionOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.key
    || artifact.interface.version
      !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.version
    || digest !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.digest
  ) {
    throw new Error("Parent-communication extension runtime contract pin mismatch");
  }
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(artifact.contract_schema);
  return new Map(
    OPERATIONS.map((operation) => {
      const validator = ajv.getSchema(
        artifact.operations[operation].response_schema_ref,
      );
      if (!validator) {
        throw new Error(
          `Parent-communication extension schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedParentCommunicationExtensionResponse = (
  operation: ParentCommunicationExtensionOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasOwnerExchangeSemantics(operation, response)
  ) {
    throw new ParentCommunicationExtensionResponseContractError();
  }
};

// Raw identity, receipt internals and message bodies never leave the
// owner through the extension.
const forbiddenResponseFields = new Set([
  "participant_id",
  "role_assignment_id",
  "family_id",
  "enrollment_id",
  "child_id",
  "child_care_process_id",
  "grant_id",
  "receipt_id",
  "receipt_ref",
  "recipient_count",
  "message_id",
  "body",
]);

const recoveryByReason: Record<string, string> = {
  stale_confirmation: "re_prepare",
  confirmation_expired: "re_prepare",
  confirmation_foreign: "re_prepare",
  preview_digest_mismatch: "re_prepare",
  redaction_evidence_unavailable: "none",
  command_payload_conflict: "new_command",
};

function hasOwnerExchangeSemantics(
  operation: ParentCommunicationExtensionOperation,
  response: unknown,
): boolean {
  if (collectKeys(response).some((key) => forbiddenResponseFields.has(key))) {
    return false;
  }
  if (!isRecord(response)) return false;
  if (response.status === "unavailable") {
    return response.retryable === (response.reason_code === "temporarily_unavailable");
  }
  if (response.status === "not_committed") {
    return recoveryByReason[String(response.reason_code)] === response.recovery;
  }
  if (response.status === "committed") {
    if (response.disposition === "applied") {
      return typeof response.redacted_at === "string" && isRecord(response.cascade);
    }
    return !("redacted_at" in response) && !("cascade" in response);
  }
  if (response.status === "ready" || response.status === "ready_to_confirm") {
    // Envelope statuses only ever come from the two reads, so the cache
    // partition must name exactly the answering operation.
    const owner = response.owner_resolution;
    const cache = response.cache_partition;
    if (
      !isRecord(owner)
      || !isRecord(cache)
      || cache.resolution_ref !== owner.resolution_ref
      || cache.scope_version !== owner.scope_version
      || cache.context_ref !== owner.context_ref
      || cache.operation !== operation
      || cache.presentation_version !== response.presentation_version
    ) {
      return false;
    }
    if (response.status === "ready") {
      return String(response.refreshed_at) < String(cache.expires_at);
    }
  }
  return true;
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
