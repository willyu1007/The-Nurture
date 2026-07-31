import { createHmac } from "node:crypto";
import type { NurtureBindingEvidenceHasher } from "@the-nurture/scenario/binding-owner";

export class HmacNurtureBindingEvidenceHasher implements NurtureBindingEvidenceHasher {
  private readonly key: Buffer;

  constructor(key: string | Buffer) {
    this.key = Buffer.isBuffer(key) ? Buffer.from(key) : Buffer.from(key, "utf8");
    if (this.key.byteLength < 32) {
      throw new Error(
        "The Nurture binding evidence HMAC key must be at least 32 bytes.",
      );
    }
  }

  hash(parts: readonly string[]): string {
    const hmac = createHmac("sha256", this.key);
    for (const part of parts) {
      const value = Buffer.from(part, "utf8");
      const length = Buffer.allocUnsafe(4);
      length.writeUInt32BE(value.byteLength);
      hmac.update(length);
      hmac.update(value);
    }
    return hmac.digest("hex");
  }
}
