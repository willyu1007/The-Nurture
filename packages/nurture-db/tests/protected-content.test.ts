import { describe, expect, it } from "vitest";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";

const KEY = "protected-content-key-material-32chars!!";

describe("AES-GCM protected content port", () => {
  it("round-trips a protected body through the closed envelope", () => {
    const port = createAesGcmProtectedContentPort({ keyRef: "k1", keyMaterial: KEY });
    const envelope = port.seal("私密照护正文 body");
    expect(envelope).toMatchObject({ algVersion: 1, keyRef: "k1" });
    expect(envelope.ciphertext).not.toContain("私密");
    expect(port.unseal(envelope)).toBe("私密照护正文 body");
  });

  it("produces distinct ciphertexts per seal and never embeds plaintext", () => {
    const port = createAesGcmProtectedContentPort({ keyRef: "k1", keyMaterial: KEY });
    const first = port.seal("same body");
    const second = port.seal("same body");
    expect(first.ciphertext).not.toBe(second.ciphertext);
    for (const envelope of [first, second]) {
      expect(JSON.stringify(envelope)).not.toContain("same body");
    }
  });

  it("fails closed on tamper, wrong key and wrong key reference", () => {
    const port = createAesGcmProtectedContentPort({ keyRef: "k1", keyMaterial: KEY });
    const other = createAesGcmProtectedContentPort({ keyRef: "k1", keyMaterial: `${KEY}x` });
    const envelope = port.seal("body");
    const tampered = {
      ...envelope,
      ciphertext: `${envelope.ciphertext.slice(0, -2)}AA`,
    };
    expect(() => port.unseal(tampered)).toThrow(/integrity check failed|invalid/);
    expect(() => other.unseal(envelope)).toThrow(/integrity check failed/);
    expect(() =>
      createAesGcmProtectedContentPort({ keyRef: "k2", keyMaterial: KEY }).unseal(envelope),
    ).toThrow(/unknown key/);
  });

  it("rejects weak key material and oversized plaintext", () => {
    expect(() =>
      createAesGcmProtectedContentPort({ keyRef: "k1", keyMaterial: "short" }),
    ).toThrow(/32 characters/);
    const port = createAesGcmProtectedContentPort({ keyRef: "k1", keyMaterial: KEY });
    expect(() => port.seal("")).toThrow(/empty or too large/);
    expect(() => port.seal("x".repeat(9_000))).toThrow(/empty or too large/);
  });
});
