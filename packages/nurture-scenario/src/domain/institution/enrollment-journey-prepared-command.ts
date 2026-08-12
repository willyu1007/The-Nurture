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
import {
  NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS,
  type NurtureEnrollmentJourneyLedgeredCommandKey,
  type NurtureEnrollmentJourneyLocalAuthorityV1,
  type NurtureEnrollmentJourneyPreparedCommandOwnerV1,
} from "../../enrollment-journey-formal-ingress-contract.js";
import {
  parseNurtureEnrollmentJourneyCommandIntent,
  type NurtureEnrollmentJourneyAdapterRequest,
  type NurtureEnrollmentJourneyCommandIntentV1,
} from "../../enrollment-journey-surfaces.js";

/** Exact ledgered request frozen by the prepare owner with its confirmation. */
type NurtureEnrollmentJourneyFrozenCommandV1 =
  NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyLedgeredCommandKey>;

export type NurtureEnrollmentJourneyPreparedCommandStatus =
  | "prepared"
  | "consumed"
  | "expired";

export type NurtureEnrollmentJourneyPreparedCommandRecordV1 = {
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
  capability_key: NurtureEnrollmentJourneyLedgeredCommandKey;
  snapshot_codec_version: number;
  frozen_snapshot_ciphertext: string;
  status: NurtureEnrollmentJourneyPreparedCommandStatus;
  prepared_at: string;
  expires_at: string;
  consumed_at?: string;
  aggregate_version: number;
};

/**
 * Durable ledger port. `readExact` is the non-mutating verify used by the
 * execute handler; `consumeExact` runs inside the same transaction as the I1
 * effect (record 63/86), which is why the repository accepts a
 * transaction-scoped client.
 */
export type NurtureEnrollmentJourneyPreparedCommandLedgerV1 = {
  getOrCreate(input: NurtureEnrollmentJourneyPreparedCommandRecordV1): Promise<{
    status: "created" | "existing";
    record: NurtureEnrollmentJourneyPreparedCommandRecordV1;
  }>;
  readExact(input: {
    workspace_id: string;
    participant_ref: string;
    command_request_id: string;
  }): Promise<
    | { status: "found"; record: NurtureEnrollmentJourneyPreparedCommandRecordV1 }
    | { status: "not_found" }
  >;
  readHistoricalExact(input: {
    workspace_id: string;
    command_request_id: string;
  }): Promise<
    | { status: "found"; record: NurtureEnrollmentJourneyPreparedCommandRecordV1 }
    | { status: "not_found" }
  >;
  consumeExact(input: {
    workspace_id: string;
    participant_ref: string;
    command_request_id: string;
    confirmation_ref_hash: string;
    consumed_at: string;
  }): Promise<
    | {
        status: "consumed" | "replayed";
        record: NurtureEnrollmentJourneyPreparedCommandRecordV1;
      }
    | { status: "not_found" | "expired" | "conflict" }
  >;
};

type NurtureEnrollmentJourneyPreparedCommandProtectionV1 = {
  tag(input: { purpose: string; values: readonly string[] }): string;
  issueConfirmation(input: { command_request_id: string; prepare_fingerprint: string }): string;
  sealSnapshot(value: unknown): { codec_version: number; ciphertext: string };
  openSnapshot(input: { codec_version: number; ciphertext: string }): unknown | null;
};

type NurtureEnrollmentJourneyPreparedCommandOwnerDeps = {
  ledger: NurtureEnrollmentJourneyPreparedCommandLedgerV1;
  participantBindings: NurtureParticipantBindingReader;
  participantAuthority: NurtureParticipantAuthorityReader;
  protection: NurtureEnrollmentJourneyPreparedCommandProtectionV1;
  now?: () => Date;
  createCommandRequestId?: () => string;
  ttlMs?: number;
};

const NURTURE_ENROLLMENT_JOURNEY_PREPARED_COMMAND_TTL_MS = 5 * 60_000;

type FrozenSnapshotV1 = {
  snapshot_version: 1;
  frozen_request: NurtureEnrollmentJourneyFrozenCommandV1;
  authority: NurtureEnrollmentJourneyLocalAuthorityV1;
};

/**
 * Durable prepare/verify owner. It persists the exact encrypted command and
 * authority snapshot; the repository owns concurrent dedup, and consumption
 * belongs to the command executor's transaction, never to this owner.
 */
export class NurtureEnrollmentJourneyPreparedCommandOwner
implements NurtureEnrollmentJourneyPreparedCommandOwnerV1 {
  private readonly now: () => Date;
  private readonly createCommandRequestId: () => string;
  private readonly ttlMs: number;

  constructor(private readonly deps: NurtureEnrollmentJourneyPreparedCommandOwnerDeps) {
    this.now = deps.now ?? (() => new Date());
    this.createCommandRequestId = deps.createCommandRequestId ?? (() => randomUUID());
    this.ttlMs = deps.ttlMs ?? NURTURE_ENROLLMENT_JOURNEY_PREPARED_COMMAND_TTL_MS;
    if (!Number.isSafeInteger(this.ttlMs) || this.ttlMs < 1_000 || this.ttlMs > 15 * 60_000) {
      throw new Error("prepared command TTL must be between one second and fifteen minutes");
    }
  }

  async prepare(
    input: Parameters<NurtureEnrollmentJourneyPreparedCommandOwnerV1["prepare"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyPreparedCommandOwnerV1["prepare"]> {
    const participant = await this.resolveParticipant(
      input.principal,
      "prepare_enrollment_journey_command",
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
    const intent = parseNurtureEnrollmentJourneyCommandIntent(input.command.request);
    if (!intent || !isLedgeredKey(intent.capabilityKey)) {
      return { status: "not_prepared", reason_code: "prepared_command_intent_invalid" };
    }
    const command = intent as NurtureEnrollmentJourneyCommandIntentV1<
      NurtureEnrollmentJourneyLedgeredCommandKey
    >;

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
    const frozenRequest: NurtureEnrollmentJourneyFrozenCommandV1 = {
      ...command,
      confirmationRef,
    } as NurtureEnrollmentJourneyFrozenCommandV1;
    const sealed = this.deps.protection.sealSnapshot({
      snapshot_version: 1,
      frozen_request: frozenRequest,
      authority: input.authority,
    } satisfies FrozenSnapshotV1);
    if (!validSealedSnapshot(sealed)) {
      return { status: "unavailable", reason_code: "prepared_snapshot_owner_invalid" };
    }

    const candidate: NurtureEnrollmentJourneyPreparedCommandRecordV1 = {
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

  async verifyConfirmed(
    input: Parameters<NurtureEnrollmentJourneyPreparedCommandOwnerV1["verifyConfirmed"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyPreparedCommandOwnerV1["verifyConfirmed"]> {
    const participant = await this.resolveParticipant(
      input.principal,
      "execute_prepared_enrollment_journey_command",
    );
    if (participant.status !== "resolved") return participant;
    if (
      input.client_surface !== "web_run_workbench"
      || !opaqueId(input.invocation_request_id)
      || !opaqueId(input.command.commandRequestId)
      || !opaqueConfirmation(input.command.confirmationRef)
    ) return { status: "denied", reason_code: "prepared_confirmation_invalid" };

    const confirmationRefHash = this.tag("confirmation-ref", [input.command.confirmationRef]);
    let read;
    try {
      read = await this.deps.ledger.readExact({
        workspace_id: participant.workspace_id,
        participant_ref: participant.participant_ref,
        command_request_id: input.command.commandRequestId,
      });
    } catch {
      return { status: "unavailable", reason_code: "prepared_command_ledger_unavailable" };
    }
    if (read.status !== "found") {
      return { status: "denied", reason_code: "prepared_command_not_found" };
    }
    const record = read.record;
    if (!validRecord(record)
      || record.command_request_id !== input.command.commandRequestId
      || record.workspace_id !== participant.workspace_id
      || record.participant_ref !== participant.participant_ref
    ) return { status: "unavailable", reason_code: "prepared_command_ledger_drift" };
    if (record.confirmation_ref_hash !== confirmationRefHash) {
      return { status: "conflict", reason_code: "prepared_command_reuse_conflict" };
    }
    if (
      record.status === "expired"
      || Date.parse(record.expires_at) <= this.now().getTime()
    ) {
      return { status: "denied", reason_code: "prepared_command_expired" };
    }

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

  async verifyHistoricalConfirmation(
    input: Parameters<
      NurtureEnrollmentJourneyPreparedCommandOwnerV1["verifyHistoricalConfirmation"]
    >[0],
  ): ReturnType<
    NurtureEnrollmentJourneyPreparedCommandOwnerV1["verifyHistoricalConfirmation"]
  > {
    if (
      !opaqueId(input.workspace_id)
      || !opaqueId(input.command.commandRequestId)
      || !opaqueConfirmation(input.command.confirmationRef)
    ) return { status: "denied", reason_code: "prepared_confirmation_invalid" };

    let read;
    try {
      read = await this.deps.ledger.readHistoricalExact({
        workspace_id: input.workspace_id,
        command_request_id: input.command.commandRequestId,
      });
    } catch {
      return { status: "unavailable", reason_code: "prepared_command_ledger_unavailable" };
    }
    if (read.status !== "found") {
      return { status: "denied", reason_code: "prepared_command_not_found" };
    }
    const record = read.record;
    if (
      !validRecord(record)
      || record.command_request_id !== input.command.commandRequestId
      || record.workspace_id !== input.workspace_id
    ) return { status: "unavailable", reason_code: "prepared_command_ledger_drift" };
    if (
      this.deps.protection.issueConfirmation({
        command_request_id: record.command_request_id,
        prepare_fingerprint: record.prepare_fingerprint,
      }) !== input.command.confirmationRef
      || record.confirmation_ref_hash
        !== this.tag("confirmation-ref", [input.command.confirmationRef])
    ) return { status: "conflict", reason_code: "prepared_command_reuse_conflict" };
    if (record.capability_key !== "start_enrollment_inquiry") {
      return { status: "denied", reason_code: "workflow_run_settlement_command_not_supported" };
    }
    if (record.status !== "expired") {
      const snapshot = parseSnapshot(this.deps.protection.openSnapshot({
        codec_version: record.snapshot_codec_version,
        ciphertext: record.frozen_snapshot_ciphertext,
      }));
      if (
        !snapshot
        || snapshot.frozen_request.confirmationRef !== input.command.confirmationRef
        || snapshot.frozen_request.capabilityKey !== record.capability_key
        || snapshot.authority.workspace_id !== record.workspace_id
      ) return { status: "unavailable", reason_code: "prepared_command_snapshot_drift" };
    }
    return {
      status: "resolved",
      command_request_id: record.command_request_id,
      effect: record.capability_key,
    };
  }

  async deriveDirectContext(
    input: Parameters<NurtureEnrollmentJourneyPreparedCommandOwnerV1["deriveDirectContext"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyPreparedCommandOwnerV1["deriveDirectContext"]> {
    const participant = await this.resolveParticipant(
      input.principal,
      "execute_prepared_enrollment_journey_command",
    );
    if (participant.status !== "resolved") return participant;
    if (
      input.client_surface !== "web_run_workbench"
      || !opaqueId(input.invocation_request_id)
      || !opaqueId(input.command.clientCommandId)
    ) return { status: "denied", reason_code: "direct_command_context_invalid" };
    const intent = parseNurtureEnrollmentJourneyCommandIntent(input.command.request);
    if (!intent || isLedgeredKey(intent.capabilityKey)) {
      return { status: "denied", reason_code: "direct_command_intent_invalid" };
    }
    const commandRequestId = this.tag("direct-command-id", [
      participant.workspace_id,
      participant.participant_ref,
      input.client_surface,
      input.command.clientCommandId,
      canonicalJsonV1(intent),
    ]);
    return {
      status: "resolved",
      command_request_id: commandRequestId,
      confirmation_ref: `ejd1.${commandRequestId}`,
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
const CONFIRMATION_PREFIX = "ejc1";

/**
 * Production HMAC + AES-256-GCM protection. The HMAC/AEAD domain strings are
 * enrollment-specific so a knowledge-lane confirmation can never validate
 * here even under shared secrets, and vice versa.
 */
export class NurtureEnrollmentJourneyPreparedCommandCrypto
implements NurtureEnrollmentJourneyPreparedCommandProtectionV1 {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly integrityKey: string,
    encryptionSecret: string,
  ) {
    if (Buffer.byteLength(integrityKey, "utf8") < 32 || Buffer.byteLength(encryptionSecret, "utf8") < 32) {
      throw new Error("prepared command integrity and encryption secrets must be at least 32 bytes");
    }
    this.encryptionKey = createHash("sha256")
      .update("nurture.enrollment-prepared-command.encryption-key.v1\0", "utf8")
      .update(encryptionSecret, "utf8")
      .digest();
  }

  tag(input: { purpose: string; values: readonly string[] }): string {
    if (!/^[a-z][a-z0-9-]{0,63}$/u.test(input.purpose)) {
      throw new Error("prepared command tag purpose is invalid");
    }
    const hmac = createHmac("sha256", this.integrityKey)
      .update(`nurture.enrollment-prepared-command.${input.purpose}.v1\0`, "utf8");
    for (const value of input.values) {
      hmac.update(String(Buffer.byteLength(value, "utf8")), "utf8")
        .update(":", "utf8")
        .update(value, "utf8");
    }
    return hmac.digest("hex");
  }

  issueConfirmation(input: { command_request_id: string; prepare_fingerprint: string }): string {
    const tag = createHmac("sha256", this.integrityKey)
      .update("nurture.enrollment-prepared-command.confirmation.v1\0", "utf8")
      .update(input.command_request_id, "utf8")
      .update("\0", "utf8")
      .update(input.prepare_fingerprint, "utf8")
      .digest("base64url");
    return `${CONFIRMATION_PREFIX}.${tag}`;
  }

  sealSnapshot(value: unknown): { codec_version: number; ciphertext: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    cipher.setAAD(Buffer.from("nurture.enrollment-prepared-command.snapshot.v1", "utf8"));
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
      decipher.setAAD(Buffer.from("nurture.enrollment-prepared-command.snapshot.v1", "utf8"));
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
  const intent = parseNurtureEnrollmentJourneyCommandIntent(intentValue);
  if (!intent || !isLedgeredKey(intent.capabilityKey) || !validAuthority(value.authority)) return null;
  return {
    snapshot_version: 1,
    frozen_request: { ...intent, confirmationRef } as NurtureEnrollmentJourneyFrozenCommandV1,
    authority: value.authority,
  };
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function validRecord(value: NurtureEnrollmentJourneyPreparedCommandRecordV1): boolean {
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
    && isLedgeredKey(value.capability_key)
    && ["prepared", "consumed", "expired"].includes(value.status)
    && instant(value.prepared_at)
    && instant(value.expires_at)
    && Date.parse(value.expires_at) > Date.parse(value.prepared_at)
    && consumedPairIsValid
    && Number.isSafeInteger(value.aggregate_version)
    && value.aggregate_version >= 1;
}

function isLedgeredKey(value: unknown): value is NurtureEnrollmentJourneyLedgeredCommandKey {
  return (NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS as readonly string[])
    .includes(String(value));
}

function validAuthority(value: unknown): value is NurtureEnrollmentJourneyLocalAuthorityV1 {
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
