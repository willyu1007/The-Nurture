import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  TEACHER_CLASS_STREAM_INTERFACE,
  type TeacherClassStreamOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/teacher-class-stream/v1/teacher-class-stream.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly TeacherClassStreamOperation[] = [
  "class_context_query",
  "child_strip_query",
  "child_day_detail_query",
  "schedule_query",
];

type PublishedContract = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Record<
    TeacherClassStreamOperation,
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

export class TeacherClassStreamResponseContractError extends Error {
  constructor() {
    super("teacher_class_stream_response_contract_violation");
    this.name = "TeacherClassStreamResponseContractError";
  }
}

const parsePublishedContract = (value: unknown): PublishedContract => {
  if (!isRecord(value) || !isRecord(value.interface)) {
    throw new Error("Teacher class-stream runtime contract is invalid");
  }
  if (
    typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value.schemas)
  ) {
    throw new Error("Teacher class-stream runtime contract is invalid");
  }
  for (const operation of OPERATIONS) {
    const definition = value.operations[operation];
    if (
      !isRecord(definition)
      || typeof definition.response_schema_ref !== "string"
    ) {
      throw new Error("Teacher class-stream runtime contract is invalid");
    }
  }
  return value as PublishedContract;
};

const compileValidators = (): ReadonlyMap<
  TeacherClassStreamOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== TEACHER_CLASS_STREAM_INTERFACE.key
    || artifact.interface.version !== TEACHER_CLASS_STREAM_INTERFACE.version
    || digest !== TEACHER_CLASS_STREAM_INTERFACE.digest
  ) {
    throw new Error("Teacher class-stream runtime contract pin mismatch");
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
          `Teacher class-stream schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedTeacherClassStreamResponse = (
  operation: TeacherClassStreamOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasReadOnlyPresenterSemantics(operation, response)
  ) {
    throw new TeacherClassStreamResponseContractError();
  }
};

const forbiddenResponseFields = new Set([
  "action_ref",
  "confirmation_ref",
  "command_request_id",
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

const detailSectionOrder = [
  "arrival",
  "daily_care",
  "family_instructions",
  "observations",
  "focus_link",
];

function hasReadOnlyPresenterSemantics(
  operation: TeacherClassStreamOperation,
  response: unknown,
): boolean {
  if (collectKeys(response).some((key) => forbiddenResponseFields.has(key))) {
    return false;
  }
  if (!isRecord(response) || response.status !== "ready") return true;
  const owner = response.owner_resolution;
  const cache = response.cache_partition;
  if (
    !isRecord(owner)
    || !isRecord(cache)
    || !orderedReadyLifetime(
      owner.resolved_at,
      response.generated_at,
      cache.expires_at,
    )
  ) {
    return false;
  }
  if (operation === "class_context_query") {
    if (!Array.isArray(response.classes)) return false;
    const current = response.classes.filter(
      (entry) => isRecord(entry) && entry.current === true,
    );
    if (current.length !== 1) return false;
    const header = response.day_header;
    return isRecord(header)
      && isRecord(current[0])
      && header.class_ref === current[0].class_ref;
  }
  if (operation === "child_strip_query") {
    if (!Array.isArray(response.children)) return false;
    return response.children.every((card) => {
      if (!isRecord(card) || !isRecord(card.attention)) return false;
      const attention = card.attention;
      return attention.count === 0
        ? attention.highest_priority === "none"
        : attention.highest_priority !== "none";
    });
  }
  if (operation === "child_day_detail_query") {
    if (!Array.isArray(response.sections)) return false;
    const keys = response.sections.flatMap((section) =>
      isRecord(section) && typeof section.section_key === "string"
        ? [section.section_key]
        : []);
    if (keys.join("|") !== detailSectionOrder.join("|")) return false;
    return response.sections.every((section) => {
      if (!isRecord(section)) return false;
      if (section.status !== "ready") return true;
      if (section.generated_at === undefined || section.source_head === undefined) {
        return false;
      }
      if (
        section.section_key === "daily_care"
        || section.section_key === "family_instructions"
        || section.section_key === "observations"
      ) {
        return Array.isArray(section.entries) && section.entries.length > 0;
      }
      if (section.section_key === "arrival") {
        return section.arrival_state !== undefined;
      }
      if (section.section_key === "focus_link") {
        return section.focus_ref !== undefined
          && section.focus_label !== undefined;
      }
      return true;
    });
  }
  if (!Array.isArray(response.slots)) return false;
  const currentSlots = response.slots.filter(
    (slot) => isRecord(slot) && slot.current === true,
  );
  if (currentSlots.length > 1) return false;
  if (
    response.slots.some((slot) =>
      isRecord(slot)
      && typeof slot.starts_at === "string"
      && typeof slot.ends_at === "string"
      && slot.starts_at >= slot.ends_at)
  ) {
    return false;
  }
  if (response.resolution === "none") {
    return response.slots.length === 0 && response.schedule_version_head === 0;
  }
  return typeof response.schedule_version_head === "number"
    && response.schedule_version_head >= 1;
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
