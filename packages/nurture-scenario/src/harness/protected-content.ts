/**
 * G2 protected-content boundary (10-g2-schema-freeze.md D6): the closed
 * inline encryption envelope stored in `bodyProtectionPayload`, and the
 * no-store write port the execute transaction uses to seal a protected body.
 * Plaintext never persists, never enters logs, refs, receipts or presenters.
 */
export const PROTECTED_CONTENT_ALG_VERSION = 1;
const MAX_PLAINTEXT_BYTES = 8_192;
const ENVELOPE_KEYS = new Set(["algVersion", "keyRef", "ciphertext", "integrityTag"]);
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export type ProtectedContentEnvelopeV1 = {
  algVersion: typeof PROTECTED_CONTENT_ALG_VERSION;
  keyRef: string;
  ciphertext: string;
  integrityTag: string;
};

export type ProtectedContentWritePort = {
  seal(plaintext: string): ProtectedContentEnvelopeV1;
  unseal(envelope: ProtectedContentEnvelopeV1): string;
};

export const assertProtectedContentPlaintext = (plaintext: string): string => {
  if (
    typeof plaintext !== "string" ||
    plaintext.length === 0 ||
    Buffer.byteLength(plaintext, "utf8") > MAX_PLAINTEXT_BYTES
  ) {
    throw new Error("protected content plaintext is empty or too large");
  }
  return plaintext;
};

export const assertProtectedContentEnvelopeV1 = (
  value: unknown,
): ProtectedContentEnvelopeV1 => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !ENVELOPE_KEYS.has(key))
  ) {
    throw new Error("protected content envelope has an invalid shape");
  }
  const { algVersion, keyRef, ciphertext, integrityTag } = value as Record<string, unknown>;
  if (algVersion !== PROTECTED_CONTENT_ALG_VERSION) {
    throw new Error("protected content envelope algorithm version is unsupported");
  }
  if (typeof keyRef !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(keyRef)) {
    throw new Error("protected content envelope key reference is invalid");
  }
  if (
    typeof ciphertext !== "string" ||
    !ciphertext ||
    ciphertext.length > 32_768 ||
    !BASE64URL_PATTERN.test(ciphertext)
  ) {
    throw new Error("protected content envelope ciphertext is invalid");
  }
  if (
    typeof integrityTag !== "string" ||
    !integrityTag ||
    integrityTag.length > 64 ||
    !BASE64URL_PATTERN.test(integrityTag)
  ) {
    throw new Error("protected content envelope integrity tag is invalid");
  }
  return {
    algVersion: PROTECTED_CONTENT_ALG_VERSION,
    keyRef,
    ciphertext,
    integrityTag,
  };
};
