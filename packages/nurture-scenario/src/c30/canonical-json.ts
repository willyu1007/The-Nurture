import { createHash } from "node:crypto";

export class NurtureCanonicalJsonError extends Error {
  constructor(readonly path: string, message: string) {
    super(message);
    this.name = "NurtureCanonicalJsonError";
  }
}

export function nurtureCanonicalJsonBytes(value: unknown): Buffer {
  return Buffer.from(encodeCanonicalJson(value, "$"), "utf8");
}

export function nurtureSha256Base64Url(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function nurtureSha256Hex(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function encodeCanonicalJson(value: unknown, path: string): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new NurtureCanonicalJsonError(path, `${path} contains a non-finite number`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item, index) => encodeCanonicalJson(item, `${path}[${index}]`)).join(",")}]`;
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new NurtureCanonicalJsonError(path, `${path} must contain only plain JSON objects`);
    }
    const record = value as Record<string, unknown>;
    const members = Object.keys(record).sort().map((key) => {
      if (record[key] === undefined) {
        throw new NurtureCanonicalJsonError(`${path}.${key}`, `${path}.${key} cannot be undefined`);
      }
      return `${JSON.stringify(key)}:${encodeCanonicalJson(record[key], `${path}.${key}`)}`;
    });
    return `{${members.join(",")}}`;
  }
  throw new NurtureCanonicalJsonError(path, `${path} contains a non-JSON value`);
}
