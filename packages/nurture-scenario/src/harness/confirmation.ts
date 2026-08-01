import { createHmac } from "node:crypto";
import { canonicalJsonV1 } from "../domain/commands/command-kernel.js";
import {
  NurtureInteractionContextService,
  type IssuedScenarioToken,
} from "../domain/interactions/interaction-context.js";

/**
 * G2 Harness confirmation protocol (10-g2-schema-freeze.md D8): the
 * `confirmationRef` is a five-minute, body-free, single-consume
 * InteractionContext row with a closed payload-schema-v2 state payload.
 */
export const HARNESS_CONFIRMATION_TTL_MS = 5 * 60_000;
export const HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION = 2;
export const HARNESS_INTEGRITY_TAG_VERSION = 1;

const COMMAND_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const CAPABILITY_KEY_PATTERN = /^[a-z][a-z0-9_]{2,99}$/;
const CAPABILITY_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const INTEGRITY_TAG_PATTERN = /^[0-9a-f]{64}$/;
const MAX_TARGET_REFS = 16;
const MAX_HEADS = 16;

export type HarnessConfirmationPayloadV2 = {
  capability_key: string;
  capability_version: string;
  command_request_id: string;
  target_refs: Record<string, string>;
  expected_heads: Record<string, number>;
  input_integrity_tag: string;
  integrity_tag_version: typeof HARNESS_INTEGRITY_TAG_VERSION;
};

const PAYLOAD_KEYS = new Set([
  "capability_key",
  "capability_version",
  "command_request_id",
  "target_refs",
  "expected_heads",
  "input_integrity_tag",
  "integrity_tag_version",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Secret-keyed canonical-input integrity tag. The prepare step stores the tag
 * only; the raw typed input is resubmitted at execute and re-derived here, so
 * low-entropy protected bodies never persist as enumerable bare hashes.
 */
export const computeHarnessInputIntegrityTag = (
  integrityKey: string,
  canonicalizedInput: unknown,
): string => {
  if (typeof integrityKey !== "string" || integrityKey.length < 32) {
    throw new Error("harness integrity key must contain at least 32 characters");
  }
  return createHmac("sha256", integrityKey)
    .update(`nurture.harness-input.v${HARNESS_INTEGRITY_TAG_VERSION}\0`, "utf8")
    .update(canonicalJsonV1(canonicalizedInput), "utf8")
    .digest("hex");
};

export const parseHarnessConfirmationPayloadV2 = (
  value: unknown,
): HarnessConfirmationPayloadV2 => {
  if (!isRecord(value) || Object.keys(value).some((key) => !PAYLOAD_KEYS.has(key))) {
    throw new Error("harness confirmation payload has an invalid shape");
  }
  const {
    capability_key,
    capability_version,
    command_request_id,
    target_refs,
    expected_heads,
    input_integrity_tag,
    integrity_tag_version,
  } = value as Record<string, unknown>;
  if (typeof capability_key !== "string" || !CAPABILITY_KEY_PATTERN.test(capability_key)) {
    throw new Error("harness confirmation capability key is invalid");
  }
  if (
    typeof capability_version !== "string" ||
    !CAPABILITY_VERSION_PATTERN.test(capability_version)
  ) {
    throw new Error("harness confirmation capability version is invalid");
  }
  if (typeof command_request_id !== "string" || !COMMAND_ID_PATTERN.test(command_request_id)) {
    throw new Error("harness confirmation command identity is invalid");
  }
  if (!isRecord(target_refs) || Object.keys(target_refs).length > MAX_TARGET_REFS) {
    throw new Error("harness confirmation target refs are invalid");
  }
  for (const [key, ref] of Object.entries(target_refs)) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || typeof ref !== "string" || !ref || ref.length > 200) {
      throw new Error("harness confirmation target refs are invalid");
    }
  }
  if (!isRecord(expected_heads) || Object.keys(expected_heads).length > MAX_HEADS) {
    throw new Error("harness confirmation heads are invalid");
  }
  for (const [key, head] of Object.entries(expected_heads)) {
    if (
      !/^[a-z][a-z0-9_]{0,63}$/.test(key) ||
      typeof head !== "number" ||
      !Number.isSafeInteger(head) ||
      head < 0
    ) {
      throw new Error("harness confirmation heads are invalid");
    }
  }
  if (typeof input_integrity_tag !== "string" || !INTEGRITY_TAG_PATTERN.test(input_integrity_tag)) {
    throw new Error("harness confirmation integrity tag is invalid");
  }
  if (integrity_tag_version !== HARNESS_INTEGRITY_TAG_VERSION) {
    throw new Error("harness confirmation integrity tag version is invalid");
  }
  return {
    capability_key,
    capability_version,
    command_request_id,
    target_refs: target_refs as Record<string, string>,
    expected_heads: expected_heads as Record<string, number>,
    input_integrity_tag,
    integrity_tag_version: HARNESS_INTEGRITY_TAG_VERSION,
  };
};

/**
 * Issue one Harness confirmation. Fixed five-minute TTL, no extension and no
 * in-place revival; expiry or any binding drift requires a fresh prepare.
 */
export const issueHarnessConfirmation = (
  service: NurtureInteractionContextService,
  input: {
    workspace_id: string;
    participant_id: string;
    surface: string;
    host_conversation_ref?: string;
    payload: HarnessConfirmationPayloadV2;
  },
): Promise<IssuedScenarioToken> =>
  service.issue({
    workspace_id: input.workspace_id,
    participant_id: input.participant_id,
    purpose: "prepare_action",
    surface: input.surface,
    ...(input.host_conversation_ref
      ? { host_conversation_ref: input.host_conversation_ref }
      : {}),
    payload_schema_version: HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION,
    state_payload: parseHarnessConfirmationPayloadV2(input.payload),
    ttl_ms: HARNESS_CONFIRMATION_TTL_MS,
  });
