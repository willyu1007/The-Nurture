import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createAjvRuntime,
  parsePublishedContract,
  type ValidateFunction,
} from "./response-validator-core.js";
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
    OPERATIONS,
    "schemas",
    "Parent-context presenter runtime contract is invalid",
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

  const ajv = createAjvRuntime();
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
