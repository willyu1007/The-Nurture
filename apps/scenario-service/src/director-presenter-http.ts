import {
  DIRECTOR_PRESENTER_DRILLDOWN_PATH,
  DIRECTOR_PRESENTER_INTERFACE,
  DIRECTOR_PRESENTER_MATERIALS_PATH,
  DIRECTOR_PRESENTER_OVERVIEW_PATH,
  type DirectorPresenterDrilldownRequestV1,
  type DirectorPresenterMaterialRequestV1,
  type DirectorPresenterOverviewRequestV1,
} from "@the-nurture/scenario";

export {
  DIRECTOR_PRESENTER_DRILLDOWN_PATH,
  DIRECTOR_PRESENTER_INTERFACE,
  DIRECTOR_PRESENTER_MATERIALS_PATH,
  DIRECTOR_PRESENTER_OVERVIEW_PATH,
};
export type {
  DirectorPresenterDrilldownRequestV1,
  DirectorPresenterMaterialRequestV1,
  DirectorPresenterOverviewRequestV1,
};

export class DirectorPresenterRequestParseError extends Error {
  readonly code:
    | "invalid_director_presenter_request"
    | "director_presenter_contract_mismatch";

  constructor(
    code:
      | "invalid_director_presenter_request"
      | "director_presenter_contract_mismatch",
  ) {
    super(code);
    this.name = "DirectorPresenterRequestParseError";
    this.code = code;
  }
}

export const parseDirectorPresenterOverviewRequestV1 = (
  value: unknown,
): DirectorPresenterOverviewRequestV1 => {
  const body = parseBase(value, ["local_date"]);
  const localDate = requiredString(body.local_date, 10);
  if (!validDate(localDate)) throw invalidRequest();
  return Object.freeze({ ...identity(body), local_date: localDate });
};

export const parseDirectorPresenterDrilldownRequestV1 = (
  value: unknown,
): DirectorPresenterDrilldownRequestV1 => {
  const body = parseBase(value, ["drilldown_ref"]);
  return Object.freeze({
    ...identity(body),
    drilldown_ref: requiredString(body.drilldown_ref, 512),
  });
};

export const parseDirectorPresenterMaterialRequestV1 = (
  value: unknown,
): DirectorPresenterMaterialRequestV1 => {
  const body = parseBase(value, ["collection_ref"], ["cursor"]);
  const cursor = optionalString(body.cursor, 512);
  return Object.freeze({
    ...identity(body),
    collection_ref: requiredString(body.collection_ref, 512),
    ...(cursor ? { cursor } : {}),
  });
};

const identity = (
  body: Record<string, unknown>,
): Omit<DirectorPresenterOverviewRequestV1, "local_date"> =>
  Object.freeze({
    interface_contract: DIRECTOR_PRESENTER_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 256),
    my_chat_user_id: requiredString(body.my_chat_user_id, 256),
    host_request_id: requiredString(body.host_request_id, 256),
    context_ref: requiredString(body.context_ref, 512),
  });

const parseBase = (
  value: unknown,
  operationRequired: readonly string[],
  operationOptional: readonly string[] = [],
): Record<string, unknown> => {
  if (!isRecord(value)) throw invalidRequest();
  const required = [
    "interface_contract",
    "workspace_id",
    "my_chat_user_id",
    "host_request_id",
    "context_ref",
    ...operationRequired,
  ];
  const allowed = new Set([...required, ...operationOptional]);
  const keys = Object.keys(value);
  if (
    required.some((key) => !Object.hasOwn(value, key))
    || keys.some((key) => !allowed.has(key))
  ) {
    throw invalidRequest();
  }
  const contract = value.interface_contract;
  if (
    !isRecord(contract)
    || Object.keys(contract).sort().join("|") !== "digest|key|version"
    || contract.key !== DIRECTOR_PRESENTER_INTERFACE.key
    || contract.version !== DIRECTOR_PRESENTER_INTERFACE.version
    || contract.digest !== DIRECTOR_PRESENTER_INTERFACE.digest
  ) {
    throw new DirectorPresenterRequestParseError(
      "director_presenter_contract_mismatch",
    );
  }
  return value;
};

const requiredString = (value: unknown, maxLength: number): string => {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > maxLength
  ) {
    throw invalidRequest();
  }
  return value;
};

const optionalString = (
  value: unknown,
  maxLength: number,
): string | undefined => {
  if (value === undefined) return undefined;
  return requiredString(value, maxLength);
};

const validDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
};

const invalidRequest = (): DirectorPresenterRequestParseError =>
  new DirectorPresenterRequestParseError("invalid_director_presenter_request");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
