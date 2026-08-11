import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import type { ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import {
  NurtureParticipantResolutionError,
  resolveAuthorizedNurtureParticipant,
  type NurtureParticipantAuthorityReader,
  type NurtureParticipantBindingReader,
} from "../../c30/participant-binding.js";
import { canonicalJsonV1 } from "../commands/command-kernel.js";
import type {
  NurtureInstitutionKnowledgeLocalAuthorityV1,
  NurtureInstitutionKnowledgePreparedCommandOwnerV1,
} from "../../institution-knowledge-formal-ingress-contract.js";
import {
  parseNurtureInstitutionKnowledgeCommandIntent,
  type NurtureInstitutionKnowledgeActionKey,
  type NurtureInstitutionKnowledgeCommandIntentV1,
} from "../../institution-knowledge-surfaces.js";

type WithConfirmation<T> = T extends unknown ? T & { confirmationRef: string } : never;

/** Exact action request frozen by the prepare owner with its issued confirmation. */
type NurtureInstitutionKnowledgeFrozenCommandV1 =
  WithConfirmation<NurtureInstitutionKnowledgeCommandIntentV1>;

export type NurtureInstitutionKnowledgePreparedCommandStatus =
  | "prepared"
  | "consumed"
  | "expired";

export type NurtureInstitutionKnowledgePreparedCommandRecordV1 = {
  command_request_id: string;
  workspace_id: string;
  participant_ref: string;
  institution_ref: string;
  role_assignment_ref: string;
  client_surface: "web_run_workbench";
  client_command_id_hash: string;
  prepare_fingerprint: string;
  origin_invocation_request_id_hash: string;
  confirmation_ref_hash: string;
  capability_key: NurtureInstitutionKnowledgeActionKey;
  snapshot_codec_version: number;
  frozen_snapshot_ciphertext: string;
  status: NurtureInstitutionKnowledgePreparedCommandStatus;
  prepared_at: string;
  expires_at: string;
  consumed_at?: string;
  aggregate_version: number;
};

export type NurtureInstitutionKnowledgePreparedCommandLedgerV1 = {
  getOrCreate(input: NurtureInstitutionKnowledgePreparedCommandRecordV1): Promise<{
    status: "created" | "existing";
    record: NurtureInstitutionKnowledgePreparedCommandRecordV1;
  }>;
  consumeExact(input: {
    workspace_id: string;
    participant_ref: string;
    command_request_id: string;
    confirmation_ref_hash: string;
    consumed_at: string;
  }): Promise<
    | {
        status: "consumed" | "replayed";
        record: NurtureInstitutionKnowledgePreparedCommandRecordV1;
      }
    | { status: "not_found" | "expired" | "conflict" }
  >;
};

type NurtureInstitutionKnowledgePreparedCommandProtectionV1 = {
  tag(input: { purpose: string; values: readonly string[] }): string;
  issueConfirmation(input: { command_request_id: string; prepare_fingerprint: string }): string;
  sealSnapshot(value: unknown): { codec_version: number; ciphertext: string };
  openSnapshot(input: { codec_version: number; ciphertext: string }): unknown | null;
};

type NurtureInstitutionKnowledgePreparedCommandOwnerDeps = {
  ledger: NurtureInstitutionKnowledgePreparedCommandLedgerV1;
  participantBindings: NurtureParticipantBindingReader;
  participantAuthority: NurtureParticipantAuthorityReader;
  protection: NurtureInstitutionKnowledgePreparedCommandProtectionV1;
  now?: () => Date;
  createCommandRequestId?: () => string;
  ttlMs?: number;
};

const NURTURE_INSTITUTION_KNOWLEDGE_PREPARED_COMMAND_TTL_MS = 5 * 60_000;

type FrozenSnapshotV1 = {
  snapshot_version: 1;
  frozen_request: NurtureInstitutionKnowledgeFrozenCommandV1;
  authority: NurtureInstitutionKnowledgeLocalAuthorityV1;
};

/**
 * Durable prepare/confirm owner. It persists the exact encrypted command and
 * authority snapshot, while the repository owns concurrent dedup and consume.
 */
export class NurtureInstitutionKnowledgePreparedCommandOwner
implements NurtureInstitutionKnowledgePreparedCommandOwnerV1 {
  private readonly now: () => Date;
  private readonly createCommandRequestId: () => string;
  private readonly ttlMs: number;

  constructor(private readonly deps: NurtureInstitutionKnowledgePreparedCommandOwnerDeps) {
    this.now = deps.now ?? (() => new Date());
    this.createCommandRequestId = deps.createCommandRequestId ?? (() => randomUUID());
    this.ttlMs = deps.ttlMs ?? NURTURE_INSTITUTION_KNOWLEDGE_PREPARED_COMMAND_TTL_MS;
    if (!Number.isSafeInteger(this.ttlMs) || this.ttlMs < 1_000 || this.ttlMs > 15 * 60_000) {
      throw new Error("prepared command TTL must be between one second and fifteen minutes");
    }
  }

  async prepare(
    input: Parameters<NurtureInstitutionKnowledgePreparedCommandOwnerV1["prepare"]>[0],
  ): ReturnType<NurtureInstitutionKnowledgePreparedCommandOwnerV1["prepare"]> {
    const participant = await this.resolveParticipant(
      input.principal,
      "prepare_institution_knowledge_command",
    );
    if (participant.status !== "resolved") {
      if (participant.status === "denied") {
        return { status: "not_prepared", reason_code: participant.reason_code };
      }
      return { status: "unavailable", reason_code: participant.reason_code };
    }
    if (
      input.client_surface !== "web_run_workbench"
      || input.command.contractVersion !== 1
      || !opaqueId(input.invocation_request_id)
      || !opaqueId(input.command.clientCommandId)
      || !validAuthority(input.authority)
      || input.authority.workspace_id !== participant.workspace_id
      || input.authority.participant_ref !== participant.participant_ref
    ) {
      return {
        status: "not_prepared",
        reason_code: "prepared_command_authority_principal_mismatch",
      };
    }
    const command = parseNurtureInstitutionKnowledgeCommandIntent(input.command.request);
    if (!command) {
      return { status: "not_prepared", reason_code: "prepared_command_intent_invalid" };
    }

    const preparedAt = this.now();
    const commandRequestId = this.createCommandRequestId();
    if (!opaqueId(commandRequestId)) {
      return { status: "unavailable", reason_code: "prepared_command_id_owner_invalid" };
    }
    const clientCommandIdHash = this.tag("client-command-id", [
      participant.workspace_id,
      participant.participant_ref,
      input.client_surface,
      input.command.clientCommandId,
    ]);
    const prepareFingerprint = this.tag("prepare-fingerprint", [canonicalJsonV1({
      workspace_id: participant.workspace_id,
      participant_ref: participant.participant_ref,
      client_surface: input.client_surface,
      client_command_id: input.command.clientCommandId,
      authority: {
        workspace_id: input.authority.workspace_id,
        participant_ref: input.authority.participant_ref,
        institution_ref: input.authority.institution_ref,
        role_assignment_ref: input.authority.role_assignment_ref,
        active_role: input.authority.active_role,
        surface_key: input.authority.surface_key,
        authority_version: input.authority.authority_version,
      },
      command,
    })]);
    const confirmationRef = this.deps.protection.issueConfirmation({
      command_request_id: commandRequestId,
      prepare_fingerprint: prepareFingerprint,
    });
    if (!opaqueConfirmation(confirmationRef)) {
      return { status: "unavailable", reason_code: "prepared_confirmation_owner_invalid" };
    }
    const confirmationRefHash = this.tag("confirmation-ref", [confirmationRef]);
    const frozenRequest: NurtureInstitutionKnowledgeFrozenCommandV1 = {
      ...command,
      confirmationRef,
    };
    const sealed = this.deps.protection.sealSnapshot({
      snapshot_version: 1,
      frozen_request: frozenRequest,
      authority: input.authority,
    } satisfies FrozenSnapshotV1);
    if (!validSealedSnapshot(sealed)) {
      return { status: "unavailable", reason_code: "prepared_snapshot_owner_invalid" };
    }

    const candidate: NurtureInstitutionKnowledgePreparedCommandRecordV1 = {
      command_request_id: commandRequestId,
      workspace_id: participant.workspace_id,
      participant_ref: participant.participant_ref,
      institution_ref: input.authority.institution_ref,
      role_assignment_ref: input.authority.role_assignment_ref,
      client_surface: input.client_surface,
      client_command_id_hash: clientCommandIdHash,
      prepare_fingerprint: prepareFingerprint,
      origin_invocation_request_id_hash: this.tag("invocation-request-id", [
        participant.workspace_id,
        input.invocation_request_id,
      ]),
      confirmation_ref_hash: confirmationRefHash,
      capability_key: command.capabilityKey,
      snapshot_codec_version: sealed.codec_version,
      frozen_snapshot_ciphertext: sealed.ciphertext,
      status: "prepared",
      prepared_at: preparedAt.toISOString(),
      expires_at: new Date(preparedAt.getTime() + this.ttlMs).toISOString(),
      aggregate_version: 1,
    };

    let result;
    try {
      result = await this.deps.ledger.getOrCreate(candidate);
    } catch {
      return { status: "unavailable", reason_code: "prepared_command_ledger_unavailable" };
    }
    const record = result.record;
    if (!validRecord(record) || record.client_command_id_hash !== clientCommandIdHash) {
      return { status: "unavailable", reason_code: "prepared_command_ledger_invalid" };
    }
    if (record.prepare_fingerprint !== prepareFingerprint) {
      return { status: "not_prepared", reason_code: "prepared_client_command_reuse_conflict" };
    }
    if (
      record.workspace_id !== participant.workspace_id
      || record.participant_ref !== participant.participant_ref
      || record.institution_ref !== input.authority.institution_ref
      || record.role_assignment_ref !== input.authority.role_assignment_ref
      || record.client_surface !== input.client_surface
      || record.capability_key !== command.capabilityKey
    ) {
      return { status: "unavailable", reason_code: "prepared_command_ledger_scope_drift" };
    }
    if (record.status === "consumed") {
      return { status: "not_prepared", reason_code: "prepared_command_already_consumed" };
    }
    if (record.status === "expired" || Date.parse(record.expires_at) <= preparedAt.getTime()) {
      return { status: "not_prepared", reason_code: "prepared_command_expired" };
    }

    const replayConfirmation = this.deps.protection.issueConfirmation({
      command_request_id: record.command_request_id,
      prepare_fingerprint: record.prepare_fingerprint,
    });
    if (
      !opaqueConfirmation(replayConfirmation)
      || this.tag("confirmation-ref", [replayConfirmation]) !== record.confirmation_ref_hash
    ) {
      return { status: "unavailable", reason_code: "prepared_confirmation_ledger_drift" };
    }
    return {
      status: "ready_to_confirm",
      command_request_id: record.command_request_id,
      confirmation_ref: replayConfirmation,
      expires_at: record.expires_at,
      effect: record.capability_key,
    };
  }

  async consumeConfirmed(
    input: Parameters<NurtureInstitutionKnowledgePreparedCommandOwnerV1["consumeConfirmed"]>[0],
  ): ReturnType<NurtureInstitutionKnowledgePreparedCommandOwnerV1["consumeConfirmed"]> {
    const participant = await this.resolveParticipant(
      input.principal,
      "execute_prepared_institution_knowledge_command",
    );
    if (participant.status !== "resolved") return participant;
    if (
      input.client_surface !== "web_run_workbench"
      || input.command.contractVersion !== 1
      || !opaqueId(input.invocation_request_id)
      || !opaqueId(input.command.commandRequestId)
      || !opaqueConfirmation(input.command.confirmationRef)
    ) return { status: "denied", reason_code: "prepared_confirmation_invalid" };

    const confirmationRefHash = this.tag("confirmation-ref", [input.command.confirmationRef]);
    let consumed;
    try {
      consumed = await this.deps.ledger.consumeExact({
        workspace_id: participant.workspace_id,
        participant_ref: participant.participant_ref,
        command_request_id: input.command.commandRequestId,
        confirmation_ref_hash: confirmationRefHash,
        consumed_at: this.now().toISOString(),
      });
    } catch {
      return { status: "unavailable", reason_code: "prepared_command_ledger_unavailable" };
    }
    if (consumed.status === "not_found") {
      return { status: "denied", reason_code: "prepared_command_not_found" };
    }
    if (consumed.status === "expired") {
      return { status: "denied", reason_code: "prepared_command_expired" };
    }
    if (consumed.status === "conflict") {
      return { status: "conflict", reason_code: "prepared_command_reuse_conflict" };
    }
    if (!("record" in consumed)) {
      return { status: "unavailable", reason_code: "prepared_command_ledger_invalid" };
    }
    const record = consumed.record;
    if (
      !validRecord(record)
      || record.command_request_id !== input.command.commandRequestId
      || record.workspace_id !== participant.workspace_id
      || record.participant_ref !== participant.participant_ref
      || record.confirmation_ref_hash !== confirmationRefHash
      || record.status !== "consumed"
    ) return { status: "unavailable", reason_code: "prepared_command_ledger_drift" };

    const snapshot = parseSnapshot(this.deps.protection.openSnapshot({
      codec_version: record.snapshot_codec_version,
      ciphertext: record.frozen_snapshot_ciphertext,
    }));
    if (
      !snapshot
      || snapshot.frozen_request.confirmationRef !== input.command.confirmationRef
      || snapshot.frozen_request.capabilityKey !== record.capability_key
      || snapshot.authority.workspace_id !== record.workspace_id
      || snapshot.authority.participant_ref !== record.participant_ref
      || snapshot.authority.institution_ref !== record.institution_ref
      || snapshot.authority.role_assignment_ref !== record.role_assignment_ref
    ) return { status: "unavailable", reason_code: "prepared_command_snapshot_drift" };

    return {
      status: "resolved",
      command_request_id: record.command_request_id,
      frozen_request: snapshot.frozen_request,
      authority: snapshot.authority,
    };
  }

  private async resolveParticipant(
    principal: ScenarioHumanPrincipalV1,
    operationKey: string,
  ): Promise<
    | { status: "resolved"; workspace_id: string; participant_ref: string }
    | { status: "denied" | "unavailable"; reason_code: string }
  > {
    if (principal.principal_origin !== "interactive_session") {
      return { status: "denied", reason_code: "prepared_command_principal_origin_denied" };
    }
    try {
      const participant = await resolveAuthorizedNurtureParticipant({
        principal,
        operation_key: operationKey,
        binding_reader: this.deps.participantBindings,
        authority_reader: this.deps.participantAuthority,
      });
      return {
        status: "resolved",
        workspace_id: participant.workspace_ref.object_id,
        participant_ref: participant.participant_ref.object_id,
      };
    } catch (error) {
      if (!(error instanceof NurtureParticipantResolutionError)) {
        return { status: "unavailable", reason_code: "prepared_command_participant_owner_unavailable" };
      }
      if (error.code === "participant_ambiguous" || error.code === "participant_binding_invalid") {
        return { status: "unavailable", reason_code: `prepared_command_${error.code}` };
      }
      return { status: "denied", reason_code: `prepared_command_${error.code}` };
    }
  }

  private tag(purpose: string, values: readonly string[]): string {
    const result = this.deps.protection.tag({ purpose, values });
    if (!/^[0-9a-f]{64}$/u.test(result)) {
      throw new Error("prepared command protection returned an invalid tag");
    }
    return result;
  }
}

const CRYPTO_VERSION = 1;
const CONFIRMATION_PREFIX = "ikc1";

/** Production HMAC + AES-256-GCM protection; no secret is stored in the ledger. */
export class NurtureInstitutionKnowledgePreparedCommandCrypto
implements NurtureInstitutionKnowledgePreparedCommandProtectionV1 {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly integrityKey: string,
    encryptionSecret: string,
  ) {
    if (Buffer.byteLength(integrityKey, "utf8") < 32 || Buffer.byteLength(encryptionSecret, "utf8") < 32) {
      throw new Error("prepared command integrity and encryption secrets must be at least 32 bytes");
    }
    this.encryptionKey = createHash("sha256")
      .update("nurture.prepared-command.encryption-key.v1\0", "utf8")
      .update(encryptionSecret, "utf8")
      .digest();
  }

  tag(input: { purpose: string; values: readonly string[] }): string {
    if (!/^[a-z][a-z0-9-]{0,63}$/u.test(input.purpose)) {
      throw new Error("prepared command tag purpose is invalid");
    }
    const hmac = createHmac("sha256", this.integrityKey)
      .update(`nurture.prepared-command.${input.purpose}.v1\0`, "utf8");
    for (const value of input.values) {
      hmac.update(String(Buffer.byteLength(value, "utf8")), "utf8")
        .update(":", "utf8")
        .update(value, "utf8");
    }
    return hmac.digest("hex");
  }

  issueConfirmation(input: { command_request_id: string; prepare_fingerprint: string }): string {
    const tag = createHmac("sha256", this.integrityKey)
      .update("nurture.prepared-command.confirmation.v1\0", "utf8")
      .update(input.command_request_id, "utf8")
      .update("\0", "utf8")
      .update(input.prepare_fingerprint, "utf8")
      .digest("base64url");
    return `${CONFIRMATION_PREFIX}.${tag}`;
  }

  sealSnapshot(value: unknown): { codec_version: number; ciphertext: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    cipher.setAAD(Buffer.from("nurture.prepared-command.snapshot.v1", "utf8"));
    const ciphertext = Buffer.concat([
      cipher.update(canonicalJsonV1(value), "utf8"),
      cipher.final(),
    ]);
    return {
      codec_version: CRYPTO_VERSION,
      ciphertext: [iv, cipher.getAuthTag(), ciphertext]
        .map((part) => part.toString("base64url"))
        .join("."),
    };
  }

  openSnapshot(input: { codec_version: number; ciphertext: string }): unknown | null {
    if (input.codec_version !== CRYPTO_VERSION) return null;
    const parts = input.ciphertext.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) return null;
    try {
      const iv = Buffer.from(parts[0] as string, "base64url");
      const authTag = Buffer.from(parts[1] as string, "base64url");
      const ciphertext = Buffer.from(parts[2] as string, "base64url");
      if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) return null;
      const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey, iv);
      decipher.setAAD(Buffer.from("nurture.prepared-command.snapshot.v1", "utf8"));
      decipher.setAuthTag(authTag);
      return JSON.parse(Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString("utf8"));
    } catch {
      return null;
    }
  }
}

function parseSnapshot(value: unknown): FrozenSnapshotV1 | null {
  if (
    !record(value)
    || !exactKeys(value, ["authority", "frozen_request", "snapshot_version"])
    || value.snapshot_version !== 1
    || !record(value.frozen_request)
  ) return null;
  const { confirmationRef, ...intentValue } = value.frozen_request;
  if (!opaqueConfirmation(confirmationRef)) return null;
  const intent = parseNurtureInstitutionKnowledgeCommandIntent(intentValue);
  if (!intent || !validAuthority(value.authority)) return null;
  return {
    snapshot_version: 1,
    frozen_request: { ...intent, confirmationRef },
    authority: value.authority,
  };
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function validRecord(value: NurtureInstitutionKnowledgePreparedCommandRecordV1): boolean {
  const consumedPairIsValid = value.status === "prepared"
    ? value.consumed_at === undefined
    : value.status === "consumed"
      ? value.consumed_at !== undefined && instant(value.consumed_at)
      : value.consumed_at === undefined || instant(value.consumed_at);
  return opaqueId(value.command_request_id)
    && opaqueId(value.workspace_id)
    && opaqueId(value.participant_ref)
    && opaqueId(value.institution_ref)
    && opaqueId(value.role_assignment_ref)
    && value.client_surface === "web_run_workbench"
    && [
      value.client_command_id_hash,
      value.prepare_fingerprint,
      value.origin_invocation_request_id_hash,
      value.confirmation_ref_hash,
    ].every((entry) => /^[0-9a-f]{64}$/u.test(entry))
    && (value.status === "expired"
      ? value.snapshot_codec_version === 0 && value.frozen_snapshot_ciphertext === ""
      : Number.isSafeInteger(value.snapshot_codec_version)
        && value.snapshot_codec_version >= 1
        && typeof value.frozen_snapshot_ciphertext === "string"
        && value.frozen_snapshot_ciphertext.length >= 20
        && value.frozen_snapshot_ciphertext.length <= 1_000_000)
    && isActionKey(value.capability_key)
    && ["prepared", "consumed", "expired"].includes(value.status)
    && instant(value.prepared_at)
    && instant(value.expires_at)
    && Date.parse(value.expires_at) > Date.parse(value.prepared_at)
    && consumedPairIsValid
    && Number.isSafeInteger(value.aggregate_version)
    && value.aggregate_version >= 1;
}

function isActionKey(value: unknown): value is NurtureInstitutionKnowledgeActionKey {
  return [
    "answer_institution_knowledge",
    "create_institution_knowledge_item",
    "create_institution_knowledge_revision",
    "record_institution_knowledge_review",
    "publish_institution_knowledge_revision",
    "revoke_institution_knowledge_revision",
  ].includes(String(value));
}

function validAuthority(value: unknown): value is NurtureInstitutionKnowledgeLocalAuthorityV1 {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 8
    && [
      "workspace_id",
      "participant_ref",
      "institution_ref",
      "role_assignment_ref",
      "active_role",
      "surface_key",
      "authority_version",
      "evaluated_at",
    ].every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && opaqueId(value.workspace_id)
    && opaqueId(value.participant_ref)
    && opaqueId(value.institution_ref)
    && opaqueId(value.role_assignment_ref)
    && value.active_role === "institution_admin"
    && value.surface_key === "institution_workbench"
    && opaqueId(value.authority_version)
    && instant(value.evaluated_at);
}

function validSealedSnapshot(value: { codec_version: number; ciphertext: string }): boolean {
  return Number.isSafeInteger(value.codec_version)
    && value.codec_version >= 1
    && typeof value.ciphertext === "string"
    && value.ciphertext.length >= 20
    && value.ciphertext.length <= 1_000_000;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string"
    && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}

function opaqueConfirmation(value: unknown): value is string {
  return typeof value === "string"
    && /^[A-Za-z0-9][A-Za-z0-9._:~=-]{15,511}$/u.test(value);
}

function instant(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}
