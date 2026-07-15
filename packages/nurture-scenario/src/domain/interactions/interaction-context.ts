import { createHash, randomBytes } from "node:crypto";

export type NurtureInteractionPurpose = "clarify" | "submit_action" | "open_notification";
export type NurtureInteractionContextStatus = "active" | "consumed" | "revoked";

export type NurtureInteractionContextRecord = {
  id: string;
  workspace_id: string;
  participant_id: string;
  purpose: NurtureInteractionPurpose;
  surface: string;
  token_hash: string;
  token_hash_version: 1;
  host_conversation_ref_hash?: string;
  payload_schema_version: number;
  state_payload: unknown;
  status: NurtureInteractionContextStatus;
  expires_at: string;
  consumed_at?: string;
  revoked_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type NurtureInteractionContextRepository = {
  create(input: Omit<NurtureInteractionContextRecord, "id" | "created_at" | "updated_at">): Promise<NurtureInteractionContextRecord>;
  findByTokenHash(input: { workspace_id: string; token_hash: string }): Promise<NurtureInteractionContextRecord | null>;
  findLatestActiveByConversationHash(input: {
    workspace_id: string;
    participant_id: string;
    purpose: NurtureInteractionPurpose;
    surface: string;
    host_conversation_ref_hash: string;
    at: string;
  }): Promise<NurtureInteractionContextRecord | null>;
  consume(input: {
    workspace_id: string;
    context_id: string;
    expected_version: number;
    consumed_at: string;
  }): Promise<NurtureInteractionContextRecord | null>;
  revoke(input: {
    workspace_id: string;
    context_id: string;
    expected_version: number;
    revoked_at: string;
  }): Promise<NurtureInteractionContextRecord | null>;
};

export type IssuedScenarioToken = {
  token: string;
  purpose: NurtureInteractionPurpose;
  expires_at: string;
  context_id: string;
};

export type InteractionTokenClassification =
  | { status: "current"; context: NurtureInteractionContextRecord }
  | { status: "expired"; reason_code: "token_expired" }
  | {
      status: "blocked";
      reason_code: "token_mismatch" | "token_replayed" | "token_revoked";
    };

export type InteractionTokenConsumeResult =
  | { status: "consumed"; context: NurtureInteractionContextRecord }
  | Exclude<InteractionTokenClassification, { status: "current" }>;

const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;
const MAX_STATE_PAYLOAD_BYTES = 16_384;
const FORBIDDEN_STATE_KEYS = new Set([
  "body",
  "rawbody",
  "rawinput",
  "targetaccountids",
  "deviceids",
  "channels",
  "authorizationdecision",
  "authorization",
  "allowed",
  "policydecision",
  "policyseed",
  "grantdecision",
  "grantstatus",
  "rolestatus",
  "claimtoken",
  "leasetoken",
  "retrycount",
  "attemptcount",
  "providerresponse",
  "modeloutput",
]);

const sha256 = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");

export const hashScenarioToken = (workspaceId: string, token: string): string =>
  sha256(`nurture.scenario-token.v1\0${workspaceId}\0${token}`);

export const hashHostConversationRef = (workspaceId: string, conversationRef: string): string =>
  sha256(`nurture.host-conversation.v1\0${workspaceId}\0${conversationRef}`);

const assertStatePayload = (value: unknown): void => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined || Buffer.byteLength(serialized, "utf8") > MAX_STATE_PAYLOAD_BYTES) {
    throw new Error("interaction state payload is invalid or too large");
  }
  const walk = (current: unknown): void => {
    if (Array.isArray(current)) {
      for (const entry of current) walk(entry);
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
      if (FORBIDDEN_STATE_KEYS.has(key.replace(/[_-]/g, "").toLowerCase())) {
        throw new Error(`interaction state payload contains forbidden key ${key}`);
      }
      walk(nested);
    }
  };
  walk(value);
};

export class NurtureInteractionContextService {
  constructor(
    private readonly repository: NurtureInteractionContextRepository,
    private readonly generateToken: () => string = () => randomBytes(32).toString("base64url"),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async issue(input: {
    workspace_id: string;
    participant_id: string;
    purpose: NurtureInteractionPurpose;
    surface: string;
    host_conversation_ref?: string;
    payload_schema_version: number;
    state_payload: unknown;
    ttl_ms: number;
  }): Promise<IssuedScenarioToken> {
    if (
      !input.workspace_id ||
      !input.participant_id ||
      !input.surface ||
      input.payload_schema_version < 1 ||
      !Number.isSafeInteger(input.ttl_ms) ||
      input.ttl_ms <= 0
    ) {
      throw new Error("invalid interaction context input");
    }
    assertStatePayload(input.state_payload);
    const token = this.generateToken();
    if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) throw new Error("scenario token generator returned an unsafe token");
    const issuedAt = this.now();
    const expiresAt = new Date(issuedAt.getTime() + input.ttl_ms);
    const row = await this.repository.create({
      workspace_id: input.workspace_id,
      participant_id: input.participant_id,
      purpose: input.purpose,
      surface: input.surface,
      token_hash: hashScenarioToken(input.workspace_id, token),
      token_hash_version: 1,
      ...(input.host_conversation_ref
        ? {
            host_conversation_ref_hash: hashHostConversationRef(
              input.workspace_id,
              input.host_conversation_ref,
            ),
          }
        : {}),
      payload_schema_version: input.payload_schema_version,
      state_payload: input.state_payload,
      status: "active",
      expires_at: expiresAt.toISOString(),
      version: 0,
    });
    return { token, purpose: row.purpose, expires_at: row.expires_at, context_id: row.id };
  }

  async classify(input: {
    workspace_id: string;
    token: string;
    participant_id: string;
    purpose: NurtureInteractionPurpose;
    surface: string;
    host_conversation_ref?: string;
  }): Promise<InteractionTokenClassification> {
    const tokenHash = hashScenarioToken(input.workspace_id, input.token);
    const row = await this.repository.findByTokenHash({
      workspace_id: input.workspace_id,
      token_hash: tokenHash,
    });
    if (!row || !TOKEN_HASH_PATTERN.test(row.token_hash)) {
      return { status: "blocked", reason_code: "token_mismatch" };
    }
    if (row.status === "consumed") return { status: "blocked", reason_code: "token_replayed" };
    if (row.status === "revoked") return { status: "blocked", reason_code: "token_revoked" };
    const expectedConversationHash = input.host_conversation_ref
      ? hashHostConversationRef(input.workspace_id, input.host_conversation_ref)
      : undefined;
    if (
      row.participant_id !== input.participant_id ||
      row.purpose !== input.purpose ||
      row.surface !== input.surface ||
      row.host_conversation_ref_hash !== expectedConversationHash
    ) {
      return { status: "blocked", reason_code: "token_mismatch" };
    }
    if (new Date(row.expires_at).getTime() <= this.now().getTime()) {
      return { status: "expired", reason_code: "token_expired" };
    }
    return { status: "current", context: row };
  }

  async consume(input: {
    workspace_id: string;
    token: string;
    participant_id: string;
    purpose: "clarify" | "submit_action";
    surface: string;
    host_conversation_ref?: string;
  }): Promise<InteractionTokenConsumeResult> {
    const classified = await this.classify(input);
    if (classified.status !== "current") return classified;
    const consumed = await this.repository.consume({
      workspace_id: input.workspace_id,
      context_id: classified.context.id,
      expected_version: classified.context.version,
      consumed_at: this.now().toISOString(),
    });
    return consumed
      ? { status: "consumed", context: consumed }
      : { status: "blocked", reason_code: "token_replayed" };
  }

  async recoverCurrentConversation(input: {
    workspace_id: string;
    participant_id: string;
    purpose: NurtureInteractionPurpose;
    surface: string;
    host_conversation_ref: string;
  }): Promise<NurtureInteractionContextRecord | null> {
    const row = await this.repository.findLatestActiveByConversationHash({
      workspace_id: input.workspace_id,
      participant_id: input.participant_id,
      purpose: input.purpose,
      surface: input.surface,
      host_conversation_ref_hash: hashHostConversationRef(
        input.workspace_id,
        input.host_conversation_ref,
      ),
      at: this.now().toISOString(),
    });
    if (!row || row.status !== "active" || new Date(row.expires_at).getTime() <= this.now().getTime()) {
      return null;
    }
    return row;
  }

  async revoke(input: {
    workspace_id: string;
    context_id: string;
    expected_version: number;
  }): Promise<boolean> {
    return Boolean(
      await this.repository.revoke({
        ...input,
        revoked_at: this.now().toISOString(),
      }),
    );
  }
}
