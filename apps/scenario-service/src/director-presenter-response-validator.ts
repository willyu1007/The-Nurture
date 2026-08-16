import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createAjvRuntime,
  hasForbiddenKey,
  parsePublishedContract,
  type ValidateFunction,
} from "./response-validator-core.js";
import {
  DIRECTOR_PRESENTER_INTERFACE,
  type DirectorPresenterOperation,
  nurtureCanonicalJson,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/director-presenter/v1/director-presenter.owner-contract.json",
  import.meta.url,
);
const OPERATIONS: readonly DirectorPresenterOperation[] = [
  "overview_query",
  "drilldown_query",
  "material_query",
];

export class DirectorPresenterResponseContractError extends Error {
  constructor() {
    super("director_presenter_response_contract_violation");
    this.name = "DirectorPresenterResponseContractError";
  }
}

const compileValidators = (): ReadonlyMap<
  DirectorPresenterOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
    OPERATIONS,
    "schemas",
    "Director presenter runtime contract is invalid",
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== DIRECTOR_PRESENTER_INTERFACE.key
    || artifact.interface.version !== DIRECTOR_PRESENTER_INTERFACE.version
    || digest !== DIRECTOR_PRESENTER_INTERFACE.digest
  ) {
    throw new Error("Director presenter runtime contract pin mismatch");
  }
  const ajv = createAjvRuntime();
  ajv.addSchema(artifact.schemas);
  return new Map(
    OPERATIONS.map((operation) => {
      const validator = ajv.getSchema(
        artifact.operations[operation].response_schema_ref,
      );
      if (!validator) {
        throw new Error(`Director presenter schema did not compile: ${operation}`);
      }
      return [operation, validator] as const;
    }),
  );
};

const validators = compileValidators();

export const assertPublishedDirectorPresenterResponse = (
  operation: DirectorPresenterOperation,
  response: unknown,
): void => {
  const validator = validators.get(operation);
  if (
    !validator
    || !validator(response)
    || !hasReadOnlyPresenterSemantics(operation, response)
  ) {
    throw new DirectorPresenterResponseContractError();
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
  "grant_id",
  "storage_ref",
  "signed_url",
  "url",
]);

const overviewSectionKeys = new Set([
  "attendance",
  "activity",
  "message_response",
  "home_kindergarten_flow",
  "authorization_changes",
  "philosophy_observation",
  "trend",
  "class_load_attention",
  "family_focus_attention",
  "organized_materials",
  "operation_entry",
]);

function hasReadOnlyPresenterSemantics(
  operation: DirectorPresenterOperation,
  response: unknown,
): boolean {
  if (hasForbiddenKey(response, forbiddenResponseFields)) {
    return false;
  }
  if (isRecord(response) && response.status === "ready") {
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
    if (
      operation === "material_query"
      && (
        !Array.isArray(response.items)
        || response.items.some((item) =>
          isRecord(item)
          && isRecord(item.access)
          && item.access.status === "protected_available"
          && !withinReadyLifetime(
            item.access.access_expires_at,
            response.generated_at,
            cache.expires_at,
          ))
      )
    ) {
      return false;
    }
  }
  if (
    operation !== "overview_query"
    || !isRecord(response)
    || response.status !== "ready"
  ) {
    return true;
  }
  if (!Array.isArray(response.sections)) return false;
  if (
    response.sections.some((section) => {
      if (!isRecord(section) || !isRecord(section.metric)) return false;
      const metric = section.metric;
      return metric.unit === "ratio"
        && (
          typeof metric.primary_value !== "number"
          || typeof metric.secondary_value !== "number"
          || metric.primary_value > metric.secondary_value
        );
    })
  ) {
    return false;
  }
  if (
    response.sections.some((section) =>
      isRecord(section)
      && section.status !== "ready"
      && [
        "metric",
        "trend",
        "drilldown_ref",
        "material_collection_ref",
      ].some((key) => Object.hasOwn(section, key)))
  ) {
    return false;
  }
  const keys = response.sections.flatMap((section) =>
    isRecord(section) && typeof section.section_key === "string"
      ? [section.section_key]
      : []);
  if (
    keys.length !== overviewSectionKeys.size
    || new Set(keys).size !== overviewSectionKeys.size
    || keys.some((key) => !overviewSectionKeys.has(key))
  ) {
    return false;
  }
  const operationEntry = response.sections.find(
    (section) =>
      isRecord(section) && section.section_key === "operation_entry",
  );
  return isRecord(operationEntry)
    && operationEntry.status === "unavailable"
    && operationEntry.availability === "web_workbench_required";
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

function withinReadyLifetime(
  accessExpiresAt: unknown,
  generatedAt: unknown,
  cacheExpiresAt: unknown,
): boolean {
  const accessExpires = instantMillis(accessExpiresAt);
  const generated = instantMillis(generatedAt);
  const cacheExpires = instantMillis(cacheExpiresAt);
  return accessExpires !== null
    && generated !== null
    && cacheExpires !== null
    && generated < accessExpires
    && accessExpires <= cacheExpires;
}

function instantMillis(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
