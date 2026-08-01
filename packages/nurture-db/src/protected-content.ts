import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import {
  assertProtectedContentEnvelopeV1,
  assertProtectedContentPlaintext,
  PROTECTED_CONTENT_ALG_VERSION,
  type ProtectedContentEnvelopeV1,
  type ProtectedContentWritePort,
} from "@the-nurture/scenario";

/**
 * AES-256-GCM implementation of the G2 no-store protected-content boundary
 * (10-g2-schema-freeze.md D6). The IV is prefixed into the ciphertext field
 * so the envelope keeps its closed four-field shape; the GCM auth tag is the
 * integrity tag. Key material is injected by the composing ingress — absence
 * of the key keeps the whole Harness path disabled (default-off).
 */
const IV_BYTES = 12;

export const createAesGcmProtectedContentPort = (input: {
  keyRef: string;
  keyMaterial: string;
}): ProtectedContentWritePort => {
  if (typeof input.keyMaterial !== "string" || input.keyMaterial.length < 32) {
    throw new Error("protected content key material must contain at least 32 characters");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(input.keyRef)) {
    throw new Error("protected content key reference is invalid");
  }
  const key = createHash("sha256").update(input.keyMaterial, "utf8").digest();

  return {
    seal(plaintext: string): ProtectedContentEnvelopeV1 {
      assertProtectedContentPlaintext(plaintext);
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      return {
        algVersion: PROTECTED_CONTENT_ALG_VERSION,
        keyRef: input.keyRef,
        ciphertext: Buffer.concat([iv, ciphertext]).toString("base64url"),
        integrityTag: cipher.getAuthTag().toString("base64url"),
      };
    },

    unseal(envelope: ProtectedContentEnvelopeV1): string {
      const parsed = assertProtectedContentEnvelopeV1(envelope);
      if (parsed.keyRef !== input.keyRef) {
        throw new Error("protected content envelope references an unknown key");
      }
      const combined = Buffer.from(parsed.ciphertext, "base64url");
      if (combined.byteLength <= IV_BYTES) {
        throw new Error("protected content envelope ciphertext is invalid");
      }
      const decipher = createDecipheriv("aes-256-gcm", key, combined.subarray(0, IV_BYTES));
      decipher.setAuthTag(Buffer.from(parsed.integrityTag, "base64url"));
      try {
        return Buffer.concat([
          decipher.update(combined.subarray(IV_BYTES)),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        throw new Error("protected content integrity check failed");
      }
    },
  };
};
