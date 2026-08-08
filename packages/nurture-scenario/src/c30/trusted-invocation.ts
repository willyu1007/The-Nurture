import {
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";
import {
  assertScenarioPrivateInvocationV1,
  ScenarioInvocationValidationError,
  type ScenarioPrivateInvocationV1,
} from "@my-chat/workflow-contracts";
import {
  nurtureCanonicalJsonBytes,
  nurtureSha256Base64Url,
  nurtureSha256Hex,
} from "./canonical-json.js";

export type NurtureDetachedRequestSignatureV1 = {
  signature_version: 1;
  algorithm: "Ed25519";
  key_id: string;
  body_sha256: string;
  signature: string;
};

export type NurtureInvocationDeclarationV1 = {
  scenario_key: string;
  endpoint_key: string;
  method: "POST";
  operation_key: string;
  input_schema_version: number;
  ingress_category: ScenarioPrivateInvocationV1["route"]["ingress"]["ingress_category"];
  ingress_key: string;
  principal_origins: readonly ScenarioPrivateInvocationV1["principal"]["principal_origin"][];
};

export type NurtureInvocationTrustPolicyV1 = {
  trust_version: 1;
  policy_revision: number;
  state: "active" | "revoked";
  issuer: string;
  assertion_audience: string;
  caller_subject: string;
  credential_subject: string;
  key_id: string;
  algorithm: "Ed25519";
  public_key: KeyObject | string | Buffer;
  valid_from: string;
  valid_until: string;
  declarations: readonly NurtureInvocationDeclarationV1[];
};

export type NurtureScenarioNonceConsumptionV1 = {
  issuer: string;
  assertion_audience: string;
  caller_subject: string;
  credential_subject: string;
  nonce: string;
  request_id: string;
  body_sha256: string;
  expires_at: string;
};

export type NurtureScenarioNonceStore = {
  consumeOnce(input: NurtureScenarioNonceConsumptionV1, now: Date): Promise<boolean>;
};

export type NurtureResponseSigningIdentityV1 = {
  identity_version: 1;
  issuer: string;
  assertion_audience: string;
  caller_subject: string;
  key_id: string;
  algorithm: "Ed25519";
  private_key: KeyObject | string | Buffer;
  validity_ms: number;
};

export type NurtureDetachedResponseSignatureV1 = {
  signature_version: 1;
  algorithm: "Ed25519";
  key_id: string;
  issuer: string;
  assertion_audience: string;
  caller_subject: string;
  request_binding: {
    request_id: string;
    request_nonce_sha256: string;
  };
  route: ScenarioPrivateInvocationV1["route"];
  operation_key: string;
  response_status: number;
  response_body_sha256: string;
  issued_at: string;
  expires_at: string;
  signature: string;
};

export type VerifiedNurtureInvocationV1 = {
  invocation: ScenarioPrivateInvocationV1;
  declaration: NurtureInvocationDeclarationV1;
  trust_policy_revision: number;
  credential_subject: string;
};

export type NurtureInvocationVerificationErrorCode =
  | "transport_unauthenticated"
  | "signature_metadata_invalid"
  | "trust_not_found"
  | "trust_ambiguous"
  | "trust_revoked"
  | "trust_not_current"
  | "signature_invalid"
  | "body_hash_mismatch"
  | "invocation_invalid"
  | "route_mismatch"
  | "clock_invalid"
  | "nonce_replayed";

export class NurtureInvocationVerificationError extends Error {
  constructor(
    readonly code: NurtureInvocationVerificationErrorCode,
    readonly phase: "transport" | "signature" | "trust" | "contract" | "clock" | "nonce",
    message: string,
  ) {
    super(message);
    this.name = "NurtureInvocationVerificationError";
  }
}

type NonceRecord = { expires_at_ms: number };

export class InMemoryAtomicNurtureScenarioNonceStore implements NurtureScenarioNonceStore {
  private readonly records = new Map<string, NonceRecord>();

  constructor(private readonly maximumRecords = 10_000) {
    if (!Number.isSafeInteger(maximumRecords) || maximumRecords < 1) {
      throw new Error("maximumRecords must be a positive safe integer");
    }
  }

  async consumeOnce(input: NurtureScenarioNonceConsumptionV1, now: Date): Promise<boolean> {
    const nowMs = now.getTime();
    for (const [key, record] of this.records) {
      if (record.expires_at_ms <= nowMs) this.records.delete(key);
    }
    const key = hashLengthPrefixed([
      input.issuer,
      input.assertion_audience,
      input.caller_subject,
      input.credential_subject,
      input.nonce,
    ]);
    if (this.records.has(key)) return false;
    if (this.records.size >= this.maximumRecords) return false;
    this.records.set(key, { expires_at_ms: Date.parse(input.expires_at) });
    return true;
  }
}

export async function verifyNurtureScenarioInvocation(input: {
  invocation: unknown;
  signature: unknown;
  transport_credential_subject?: string;
  trust_policies: readonly NurtureInvocationTrustPolicyV1[];
  nonce_store: NurtureScenarioNonceStore;
  now: Date;
  maximum_clock_skew_ms?: number;
}): Promise<VerifiedNurtureInvocationV1> {
  const credentialSubject = requireTransportSubject(input.transport_credential_subject);
  const signature = parseRequestSignature(input.signature);
  const candidate = readUntrustedIdentity(input.invocation);
  const candidates = input.trust_policies.filter((policy) =>
    policy.issuer === candidate.issuer
    && policy.assertion_audience === candidate.assertion_audience
    && policy.caller_subject === candidate.caller_subject
    && policy.credential_subject === credentialSubject
    && policy.key_id === signature.key_id
    && policy.algorithm === signature.algorithm);
  if (candidates.length === 0) fail("trust_not_found", "trust", "Invocation trust policy was not found.");
  if (candidates.length !== 1) fail("trust_ambiguous", "trust", "Invocation trust policy is ambiguous.");
  const trustPolicy = candidates[0];
  if (!trustPolicy) throw new Error("unreachable trust policy selection");
  assertTrustPolicyCurrent(trustPolicy, input.now);

  const unsignedSignature = {
    signature_version: signature.signature_version,
    algorithm: signature.algorithm,
    key_id: signature.key_id,
    body_sha256: signature.body_sha256,
  };
  if (!verifyDetached(unsignedSignature, signature.signature, trustPolicy.public_key)) {
    fail("signature_invalid", "signature", "Invocation signature is invalid.");
  }

  const bodySha256 = nurtureSha256Base64Url(nurtureCanonicalJsonBytes(input.invocation));
  if (bodySha256 !== signature.body_sha256) {
    fail("body_hash_mismatch", "signature", "Invocation body hash does not match.");
  }
  try {
    assertScenarioPrivateInvocationV1(input.invocation);
  } catch (error) {
    const detail = error instanceof ScenarioInvocationValidationError
      ? `${error.code}:${error.path}`
      : "unknown_contract_error";
    fail("invocation_invalid", "contract", `Invocation contract is invalid: ${detail}`);
  }
  const invocation = input.invocation as ScenarioPrivateInvocationV1;
  const declarations = trustPolicy.declarations.filter((item) =>
    item.scenario_key === invocation.route.scenario_key
    && item.endpoint_key === invocation.route.endpoint_key
    && item.method === invocation.route.method
    && item.operation_key === invocation.operation.operation_key
    && item.input_schema_version === invocation.operation.input_schema_version
    && item.ingress_category === invocation.route.ingress.ingress_category
    && item.ingress_key === invocation.route.ingress.ingress_key
    && item.principal_origins.includes(invocation.principal.principal_origin));
  if (declarations.length !== 1) {
    fail("route_mismatch", "contract", "Invocation route is absent or ambiguous.");
  }
  const declaration = declarations[0];
  if (!declaration) throw new Error("unreachable declaration selection");
  assertCurrentWindow(
    invocation.request.issued_at,
    invocation.request.expires_at,
    input.now,
    input.maximum_clock_skew_ms,
  );
  const consumed = await input.nonce_store.consumeOnce({
    issuer: invocation.issuer,
    assertion_audience: invocation.assertion_audience,
    caller_subject: invocation.caller_binding.caller_subject,
    credential_subject: credentialSubject,
    nonce: invocation.request.nonce,
    request_id: invocation.request.request_id,
    body_sha256: bodySha256,
    expires_at: invocation.request.expires_at,
  }, input.now);
  if (!consumed) fail("nonce_replayed", "nonce", "Invocation nonce was already consumed.");
  return {
    invocation,
    declaration,
    trust_policy_revision: trustPolicy.policy_revision,
    credential_subject: credentialSubject,
  };
}

export function signNurtureScenarioResponse(input: {
  verified: VerifiedNurtureInvocationV1;
  response_status: number;
  response_body: Uint8Array;
  identity: NurtureResponseSigningIdentityV1;
  now: Date;
}): NurtureDetachedResponseSignatureV1 {
  assertResponseIdentity(input.identity);
  if (!Number.isInteger(input.response_status) || input.response_status < 100 || input.response_status > 599) {
    fail("signature_metadata_invalid", "contract", "Response status is invalid.");
  }
  const invocation = input.verified.invocation;
  if (
    input.identity.issuer !== invocation.assertion_audience
    || input.identity.assertion_audience !== invocation.issuer
  ) {
    fail(
      "trust_not_found",
      "trust",
      "Response identity must reverse the verified request issuer and audience.",
    );
  }
  const unsigned = {
    signature_version: 1,
    algorithm: input.identity.algorithm,
    key_id: input.identity.key_id,
    issuer: input.identity.issuer,
    assertion_audience: input.identity.assertion_audience,
    caller_subject: input.identity.caller_subject,
    request_binding: {
      request_id: invocation.request.request_id,
      request_nonce_sha256: nurtureSha256Base64Url(Buffer.from(invocation.request.nonce, "utf8")),
    },
    route: invocation.route,
    operation_key: invocation.operation.operation_key,
    response_status: input.response_status,
    response_body_sha256: nurtureSha256Base64Url(input.response_body),
    issued_at: input.now.toISOString(),
    expires_at: new Date(input.now.getTime() + input.identity.validity_ms).toISOString(),
  } as const;
  return { ...unsigned, signature: signDetached(unsigned, input.identity.private_key) };
}

function parseRequestSignature(value: unknown): NurtureDetachedRequestSignatureV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("signature_metadata_invalid", "signature", "Request signature metadata is invalid.");
  }
  const record = value as Record<string, unknown>;
  const expectedKeys = ["algorithm", "body_sha256", "key_id", "signature", "signature_version"];
  if (Object.keys(record).sort().join("|") !== expectedKeys.join("|")) {
    fail("signature_metadata_invalid", "signature", "Request signature fields are invalid.");
  }
  if (
    record.signature_version !== 1
    || record.algorithm !== "Ed25519"
    || typeof record.key_id !== "string"
    || !machineKeyPattern.test(record.key_id)
    || typeof record.body_sha256 !== "string"
    || !digestPattern.test(record.body_sha256)
    || typeof record.signature !== "string"
    || !signaturePattern.test(record.signature)
  ) {
    fail("signature_metadata_invalid", "signature", "Request signature metadata is invalid.");
  }
  return record as NurtureDetachedRequestSignatureV1;
}

function assertTrustPolicyCurrent(policy: NurtureInvocationTrustPolicyV1, now: Date): void {
  if (policy.trust_version !== 1 || !Number.isSafeInteger(policy.policy_revision) || policy.policy_revision < 1) {
    fail("trust_not_found", "trust", "Invocation trust policy metadata is invalid.");
  }
  if (policy.state === "revoked") {
    fail("trust_revoked", "trust", "Invocation trust policy is revoked.");
  }
  if (policy.state !== "active") {
    fail("trust_not_found", "trust", "Invocation trust policy state is invalid.");
  }
  const validFrom = Date.parse(policy.valid_from);
  const validUntil = Date.parse(policy.valid_until);
  if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil)
      || validUntil <= validFrom || now.getTime() < validFrom || now.getTime() >= validUntil) {
    fail("trust_not_current", "trust", "Invocation trust policy is outside its validity window.");
  }
}

function assertResponseIdentity(identity: NurtureResponseSigningIdentityV1): void {
  if (
    identity.identity_version !== 1
    || identity.algorithm !== "Ed25519"
    || !machineKeyPattern.test(identity.issuer)
    || !machineKeyPattern.test(identity.assertion_audience)
    || !opaqueIdPattern.test(identity.caller_subject)
    || !machineKeyPattern.test(identity.key_id)
    || !Number.isSafeInteger(identity.validity_ms)
    || identity.validity_ms < 1
    || identity.validity_ms > 60_000
  ) {
    fail("signature_metadata_invalid", "signature", "Response signing identity is invalid.");
  }
}

function readUntrustedIdentity(value: unknown): {
  issuer?: unknown;
  assertion_audience?: unknown;
  caller_subject?: unknown;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const callerBinding = record.caller_binding;
  return {
    issuer: record.issuer,
    assertion_audience: record.assertion_audience,
    caller_subject: callerBinding && typeof callerBinding === "object" && !Array.isArray(callerBinding)
      ? (callerBinding as Record<string, unknown>).caller_subject
      : undefined,
  };
}

function requireTransportSubject(value: string | undefined): string {
  if (!value || !opaqueIdPattern.test(value)) {
    fail("transport_unauthenticated", "transport", "A valid service credential subject is required.");
  }
  return value;
}

function assertCurrentWindow(
  issuedAtValue: string,
  expiresAtValue: string,
  now: Date,
  maximumClockSkewMs = 5_000,
): void {
  const issuedAt = Date.parse(issuedAtValue);
  const expiresAt = Date.parse(expiresAtValue);
  if (
    !Number.isSafeInteger(maximumClockSkewMs)
    || maximumClockSkewMs < 0
    || maximumClockSkewMs > 60_000
    || !Number.isFinite(issuedAt)
    || !Number.isFinite(expiresAt)
    || issuedAt > now.getTime() + maximumClockSkewMs
    || expiresAt <= now.getTime()
  ) {
    fail("clock_invalid", "clock", "Invocation time window is not current.");
  }
}

function signDetached(value: unknown, privateKey: KeyObject | string | Buffer): string {
  const key = typeof privateKey === "string" || Buffer.isBuffer(privateKey)
    ? createPrivateKey(privateKey)
    : privateKey;
  return sign(null, nurtureCanonicalJsonBytes(value), key).toString("base64url");
}

function verifyDetached(value: unknown, signatureValue: string, publicKey: KeyObject | string | Buffer): boolean {
  try {
    const key = typeof publicKey === "string" || Buffer.isBuffer(publicKey)
      ? createPublicKey(publicKey)
      : publicKey;
    return verify(
      null,
      nurtureCanonicalJsonBytes(value),
      key,
      Buffer.from(signatureValue, "base64url"),
    );
  } catch {
    return false;
  }
}

function hashLengthPrefixed(fields: readonly string[]): string {
  return nurtureSha256Hex(Buffer.from(fields.map((field) => `${field.length}:${field}`).join("|"), "utf8"));
}

const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const digestPattern = /^[A-Za-z0-9_-]{43}$/u;
const signaturePattern = /^[A-Za-z0-9_-]{80,128}$/u;

function fail(
  code: NurtureInvocationVerificationErrorCode,
  phase: NurtureInvocationVerificationError["phase"],
  message: string,
): never {
  throw new NurtureInvocationVerificationError(code, phase, message);
}
