import {
  PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH,
  PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH,
  PARENT_CONTEXT_PRESENTER_DAY_PATH,
  PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH,
  PARENT_CONTEXT_PRESENTER_INTERFACE,
  PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
} from "@the-nurture/scenario";

export {
  PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH,
  PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH,
  PARENT_CONTEXT_PRESENTER_DAY_PATH,
  PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH,
  PARENT_CONTEXT_PRESENTER_INTERFACE,
  PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
};

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~:/+@=-]{0,2047}$/u;
const DATE_PATTERN = /^[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/u;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const CONFIRMATION_PATTERN = /^[A-Za-z0-9_-]{32,256}$/u;
const COMMON_KEYS = [
  "interface_contract",
  "workspace_id",
  "my_chat_user_id",
  "host_request_id",
  "context_ref",
] as const;

export type ParentContextPresenterIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type ParentContextPresenterDateRequestV1 =
  ParentContextPresenterIdentityV1 & Readonly<{ local_date: string }>;

export type ParentContextPresenterActivityDetailRequestV1 =
  ParentContextPresenterDateRequestV1 & Readonly<{ activity_ref: string }>;

export type ParentContextPresenterNoticeListRequestV1 =
  ParentContextPresenterIdentityV1 &
  Readonly<{
    kind: "list";
    page_size?: number;
    cursor?: string;
  }>;

export type ParentContextPresenterNoticePrepareRequestV1 =
  ParentContextPresenterIdentityV1 &
  Readonly<{
    kind: "prepare_confirmation";
    notice_ref: string;
    action_ref: string;
    action_version: number;
    expected_notice_version: number;
  }>;

export type ParentContextPresenterNoticeConfirmRequestV1 =
  ParentContextPresenterIdentityV1 &
  Readonly<{
    kind: "confirm";
    invocation_request_id: string;
    command_request_id: string;
    confirmation_ref: string;
    action_ref: string;
    action_version: number;
    prepared_preview_digest: string;
  }>;

export type ParentContextPresenterNoticeRequestV1 =
  | ParentContextPresenterNoticeListRequestV1
  | ParentContextPresenterNoticePrepareRequestV1
  | ParentContextPresenterNoticeConfirmRequestV1;

export class ParentContextPresenterRequestParseError extends Error {
  constructor(
    readonly code:
      | "invalid_parent_context_presenter_request"
      | "parent_context_presenter_contract_mismatch",
  ) {
    super(code);
    this.name = "ParentContextPresenterRequestParseError";
  }
}

export const parseParentContextPresenterDayRequestV1 = (
  body: unknown,
): ParentContextPresenterDateRequestV1 => parseDateRequest(body);

export const parseParentContextPresenterDailyCareRequestV1 = (
  body: unknown,
): ParentContextPresenterDateRequestV1 => parseDateRequest(body);

export const parseParentContextPresenterFreshnessAttendanceRequestV1 = (
  body: unknown,
): ParentContextPresenterDateRequestV1 => parseDateRequest(body);

export const parseParentContextPresenterActivityDetailRequestV1 = (
  body: unknown,
): ParentContextPresenterActivityDetailRequestV1 => {
  const { record, identity } = parseIdentity(body, ["local_date", "activity_ref"]);
  if (!isLocalDate(record.local_date) || !isRef(record.activity_ref)) {
    throw invalidRequest();
  }
  return {
    ...identity,
    local_date: record.local_date,
    activity_ref: record.activity_ref,
  };
};

export const parseParentContextPresenterNoticeRequestV1 = (
  body: unknown,
): ParentContextPresenterNoticeRequestV1 => {
  if (!isRecord(body) || typeof body.kind !== "string") throw invalidRequest();
  if (body.kind === "list") {
    const { record, identity } = parseIdentity(body, ["kind", "page_size", "cursor"]);
    if (
      (record.page_size !== undefined && !isBoundedVersion(record.page_size, 1, 20))
      || (record.cursor !== undefined && !isRef(record.cursor))
    ) {
      throw invalidRequest();
    }
    return {
      ...identity,
      kind: "list",
      ...(typeof record.page_size === "number" ? { page_size: record.page_size } : {}),
      ...(typeof record.cursor === "string" ? { cursor: record.cursor } : {}),
    };
  }
  if (body.kind === "prepare_confirmation") {
    const { record, identity } = parseIdentity(body, [
      "kind",
      "notice_ref",
      "action_ref",
      "action_version",
      "expected_notice_version",
    ]);
    if (
      !isRef(record.notice_ref)
      || !isRef(record.action_ref)
      || !isBoundedVersion(record.action_version)
      || !isBoundedVersion(record.expected_notice_version)
    ) {
      throw invalidRequest();
    }
    return {
      ...identity,
      kind: "prepare_confirmation",
      notice_ref: record.notice_ref,
      action_ref: record.action_ref,
      action_version: record.action_version,
      expected_notice_version: record.expected_notice_version,
    };
  }
  if (body.kind === "confirm") {
    const { record, identity } = parseIdentity(body, [
      "kind",
      "invocation_request_id",
      "command_request_id",
      "confirmation_ref",
      "action_ref",
      "action_version",
      "prepared_preview_digest",
    ]);
    if (
      !isId(record.invocation_request_id)
      || !isId(record.command_request_id)
      || typeof record.confirmation_ref !== "string"
      || !CONFIRMATION_PATTERN.test(record.confirmation_ref)
      || !isRef(record.action_ref)
      || !isBoundedVersion(record.action_version)
      || typeof record.prepared_preview_digest !== "string"
      || !DIGEST_PATTERN.test(record.prepared_preview_digest)
    ) {
      throw invalidRequest();
    }
    return {
      ...identity,
      kind: "confirm",
      invocation_request_id: record.invocation_request_id,
      command_request_id: record.command_request_id,
      confirmation_ref: record.confirmation_ref,
      action_ref: record.action_ref,
      action_version: record.action_version,
      prepared_preview_digest: record.prepared_preview_digest,
    };
  }
  throw invalidRequest();
};

const parseDateRequest = (body: unknown): ParentContextPresenterDateRequestV1 => {
  const { record, identity } = parseIdentity(body, ["local_date"]);
  if (!isLocalDate(record.local_date)) throw invalidRequest();
  return { ...identity, local_date: record.local_date };
};

const parseIdentity = (
  body: unknown,
  operationKeys: readonly string[],
): Readonly<{
  record: Record<string, unknown>;
  identity: ParentContextPresenterIdentityV1;
}> => {
  if (!isRecord(body)) throw invalidRequest();
  const allowed = new Set<string>([...COMMON_KEYS, ...operationKeys]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw invalidRequest();
  if (
    !isRecord(body.interface_contract)
    || Object.keys(body.interface_contract).length !== 3
    || body.interface_contract.key !== PARENT_CONTEXT_PRESENTER_INTERFACE.key
    || body.interface_contract.version !== PARENT_CONTEXT_PRESENTER_INTERFACE.version
    || body.interface_contract.digest !== PARENT_CONTEXT_PRESENTER_INTERFACE.digest
  ) {
    throw new ParentContextPresenterRequestParseError(
      "parent_context_presenter_contract_mismatch",
    );
  }
  if (
    !isId(body.workspace_id)
    || !isId(body.my_chat_user_id)
    || !isId(body.host_request_id)
    || !isRef(body.context_ref)
  ) {
    throw invalidRequest();
  }
  return {
    record: body,
    identity: {
      workspace_id: body.workspace_id,
      my_chat_user_id: body.my_chat_user_id,
      host_request_id: body.host_request_id,
      context_ref: body.context_ref,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value);

const isRef = (value: unknown): value is string =>
  typeof value === "string" && REF_PATTERN.test(value);

const isLocalDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const isBoundedVersion = (
  value: unknown,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): value is number =>
  typeof value === "number"
  && Number.isSafeInteger(value)
  && value >= minimum
  && value <= maximum;

const invalidRequest = (): ParentContextPresenterRequestParseError =>
  new ParentContextPresenterRequestParseError(
    "invalid_parent_context_presenter_request",
  );
