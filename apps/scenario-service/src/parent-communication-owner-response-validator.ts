import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv2020Module, {
  type AnySchema,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  nurtureCanonicalJson,
  PARENT_COMMUNICATION_OWNER_INTERFACE,
  type ParentCommunicationOwnerOperation,
} from "@the-nurture/scenario";

const CONTRACT_URL = new URL(
  "../../../packages/nurture-scenario/contracts/parent-communication-owner/v1/parent-communication-owner.owner-contract.json",
  import.meta.url,
);

const OPERATIONS = [
  "summary_query",
  "detail_query",
  "media_access_query",
  "send_text_exchange",
] as const satisfies readonly ParentCommunicationOwnerOperation[];

type PublishedContract = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Readonly<
    Record<
      ParentCommunicationOwnerOperation,
      Readonly<{ response_schema_ref: string }>
    >
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

export class ParentCommunicationOwnerResponseContractError extends Error {
  constructor() {
    super("parent_communication_owner_response_contract_violation");
    this.name = "ParentCommunicationOwnerResponseContractError";
  }
}

const parsePublishedContract = (value: unknown): PublishedContract => {
  if (
    !isRecord(value)
    || !isRecord(value.interface)
    || typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value.contract_schema)
  ) {
    throw new Error("Parent-communication owner runtime contract is invalid");
  }
  for (const operation of OPERATIONS) {
    const definition = value.operations[operation];
    if (!isRecord(definition) || typeof definition.response_schema_ref !== "string") {
      throw new Error("Parent-communication owner runtime contract is invalid");
    }
  }
  return value as PublishedContract;
};

const compilePublishedResponseValidators = (): ReadonlyMap<
  ParentCommunicationOwnerOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
  );
  const digest = `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(artifact), "utf8")
    .digest("hex")}`;
  if (
    artifact.interface.key !== PARENT_COMMUNICATION_OWNER_INTERFACE.key
    || artifact.interface.version !== PARENT_COMMUNICATION_OWNER_INTERFACE.version
    || digest !== PARENT_COMMUNICATION_OWNER_INTERFACE.digest
  ) {
    throw new Error("Parent-communication owner runtime contract pin mismatch");
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
          `Parent-communication owner response schema did not compile: ${operation}`,
        );
      }
      return [operation, validator] as const;
    }),
  );
};

const publishedResponseValidators = compilePublishedResponseValidators();

export const assertPublishedParentCommunicationOwnerResponse = (
  operation: ParentCommunicationOwnerOperation,
  response: unknown,
): void => {
  const validator = publishedResponseValidators.get(operation);
  if (!validator || !validator(response)) {
    throw new ParentCommunicationOwnerResponseContractError();
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
