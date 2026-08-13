import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv2020Module, {
  type AnySchema,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  nurtureCanonicalJson,
  PARENT_CONTEXT_PRESENTER_INTERFACE,
  type ParentContextPresenterOperation,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/parent-context-presenter/v1/parent-context-presenter.owner-contract.json",
  import.meta.url,
);

const OPERATIONS = [
  "day_query",
  "daily_care_cards_query",
  "activity_detail_query",
  "notice_list_and_confirmation",
  "freshness_attendance_projection",
] as const satisfies readonly ParentContextPresenterOperation[];

type PublishedContract = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Readonly<
    Record<
      ParentContextPresenterOperation,
      Readonly<{ response_schema_ref: string }>
    >
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

export class ParentContextPresenterResponseContractError extends Error {
  constructor() {
    super("parent_context_presenter_response_contract_violation");
    this.name = "ParentContextPresenterResponseContractError";
  }
}

const compilePublishedResponseValidators = (): ReadonlyMap<
  ParentContextPresenterOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== PARENT_CONTEXT_PRESENTER_INTERFACE.key
    || artifact.interface.version !== PARENT_CONTEXT_PRESENTER_INTERFACE.version
    || digest !== PARENT_CONTEXT_PRESENTER_INTERFACE.digest
  ) {
    throw new Error("Parent-context presenter runtime contract pin mismatch");
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
          `Parent-context presenter response schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const parsePublishedContract = (value: unknown): PublishedContract => {
  if (!isRecord(value) || !isRecord(value.interface)) {
    throw new Error("Parent-context presenter runtime contract is invalid");
  }
  if (
    typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value.schemas)
  ) {
    throw new Error("Parent-context presenter runtime contract is invalid");
  }
  for (const operation of OPERATIONS) {
    const definition = value.operations[operation];
    if (
      !isRecord(definition)
      || typeof definition.response_schema_ref !== "string"
    ) {
      throw new Error("Parent-context presenter runtime contract is invalid");
    }
  }
  return value as PublishedContract;
};

const publishedResponseValidators = compilePublishedResponseValidators();

export const assertPublishedParentContextPresenterResponse = (
  operation: ParentContextPresenterOperation,
  response: unknown,
): void => {
  const validator = publishedResponseValidators.get(operation);
  if (!validator || !validator(response)) {
    throw new ParentContextPresenterResponseContractError();
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
