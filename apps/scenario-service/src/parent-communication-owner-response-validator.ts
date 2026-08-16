import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createAjvRuntime,
  parsePublishedContract,
  type ValidateFunction,
} from "./response-validator-core.js";
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

export class ParentCommunicationOwnerResponseContractError extends Error {
  constructor() {
    super("parent_communication_owner_response_contract_violation");
    this.name = "ParentCommunicationOwnerResponseContractError";
  }
}

const compilePublishedResponseValidators = (): ReadonlyMap<
  ParentCommunicationOwnerOperation,
  ValidateFunction
> => {
  const artifact = parsePublishedContract(
    JSON.parse(readFileSync(CONTRACT_URL, "utf8")) as unknown,
    OPERATIONS,
    "contract_schema",
    "Parent-communication owner runtime contract is invalid",
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
  const ajv = createAjvRuntime();
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
