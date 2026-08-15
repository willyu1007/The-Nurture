import {
  MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  nurtureCanonicalJson,
  type ParentContextSelectionV1,
} from "@the-nurture/scenario";

const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~:/+@=-]{0,2047}$/u;

export class ParentContextSelectionHeaderParseError extends Error {
  constructor(
    readonly code:
      | "invalid_parent_context_selection"
      | "parent_context_selection_contract_mismatch",
  ) {
    super(code);
    this.name = "ParentContextSelectionHeaderParseError";
  }
}

export const parseParentContextSelectionHeaderV1 = (
  header: string | string[] | undefined,
  identity: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    context_ref: string;
  }>,
): ParentContextSelectionV1 => {
  if (
    typeof header !== "string"
    || header.length === 0
    || header.length > 8_192
    || !/^[A-Za-z0-9_-]+$/u.test(header)
  ) {
    throw invalidSelection();
  }
  const bytes = Buffer.from(header, "base64url");
  if (bytes.length === 0 || bytes.length > 4_096 || bytes.toString("base64url") !== header) {
    throw invalidSelection();
  }
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw invalidSelection();
  }
  if (bytes.toString("utf8") !== nurtureCanonicalJson(value)) {
    throw invalidSelection();
  }
  if (!isRecord(value)) throw invalidSelection();
  if (
    !hasExactKeys(value, [
      "interface_contract",
      "workspace_id",
      "my_chat_user_id",
      "host_request_id",
      "context_ref",
      "context_version",
      "child_binding",
      "family_binding",
    ])
    || !isRecord(value.interface_contract)
    || !hasExactKeys(value.interface_contract, ["key", "version", "digest"])
    || value.interface_contract.key !== MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE.key
    || value.interface_contract.version !== MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE.version
    || value.interface_contract.digest !== MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE.digest
  ) {
    throw new ParentContextSelectionHeaderParseError(
      "parent_context_selection_contract_mismatch",
    );
  }
  if (
    value.workspace_id !== identity.workspace_id
    || value.my_chat_user_id !== identity.my_chat_user_id
    || value.host_request_id !== identity.host_request_id
    || value.context_ref !== identity.context_ref
    || !isRef(value.context_version)
    || !isBindingSelection(value.child_binding)
    || !isBindingSelection(value.family_binding)
  ) {
    throw invalidSelection();
  }
  return value as ParentContextSelectionV1;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value);

const isBindingSelection = (value: unknown): boolean =>
  isRecord(value)
  && hasExactKeys(value, ["owner_ref", "owner_version"])
  && isRef(value.owner_ref)
  && typeof value.owner_version === "number"
  && Number.isSafeInteger(value.owner_version)
  && value.owner_version >= 1;

const isRef = (value: unknown): value is string =>
  typeof value === "string" && REF_PATTERN.test(value);

const invalidSelection = (): ParentContextSelectionHeaderParseError =>
  new ParentContextSelectionHeaderParseError("invalid_parent_context_selection");
