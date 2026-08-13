import { createHash } from "node:crypto";

export class NurtureCanonicalJsonError extends Error {
  constructor(readonly path: string, message: string) {
    super(message);
    this.name = "NurtureCanonicalJsonError";
  }
}

/**
 * RFC 8785 serialization for already-parsed I-JSON values.
 *
 * For every valid JSON value this preserves the repository's existing bytes:
 * primitives still use JSON.stringify, arrays retain their order, and object
 * keys still sort by UTF-16 code units. The extra checks only reject values a
 * JSON parser cannot produce (for example Date, Map, undefined, sparse arrays,
 * cycles, and unpaired UTF-16 surrogates).
 */
export function nurtureCanonicalJson(value: unknown): string {
  return encodeCanonicalJson(value, "$", new Set<object>());
}

export function nurtureCanonicalJsonBytes(value: unknown): Buffer {
  return Buffer.from(nurtureCanonicalJson(value), "utf8");
}

export function nurtureSha256Base64Url(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function nurtureSha256Hex(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function encodeCanonicalJson(
  value: unknown,
  path: string,
  ancestors: Set<object>,
): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    assertPairedSurrogates(value, path);
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new NurtureCanonicalJsonError(path, `${path} contains a non-finite number`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      throw new NurtureCanonicalJsonError(path, `${path} must contain only plain JSON arrays`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new NurtureCanonicalJsonError(path, `${path} contains a non-JSON symbol property`);
    }
    enter(value, path, ancestors);
    try {
      const items: string[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new NurtureCanonicalJsonError(
            `${path}[${index}]`,
            `${path}[${index}] cannot be a sparse array entry`,
          );
        }
        items.push(encodeCanonicalJson(value[index], `${path}[${index}]`, ancestors));
      }
      const keys = Object.keys(value);
      if (
        keys.length !== value.length ||
        keys.some((key, index) => key !== String(index))
      ) {
        throw new NurtureCanonicalJsonError(path, `${path} contains a non-JSON array property`);
      }
      return `[${items.join(",")}]`;
    } finally {
      ancestors.delete(value);
    }
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new NurtureCanonicalJsonError(path, `${path} must contain only plain JSON objects`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new NurtureCanonicalJsonError(path, `${path} contains a non-JSON symbol property`);
    }
    enter(value, path, ancestors);
    const record = value as Record<string, unknown>;
    try {
      const members = Object.keys(record).sort().map((key) => {
        const memberPath = `${path}.${key}`;
        assertPairedSurrogates(key, memberPath);
        if (record[key] === undefined) {
          throw new NurtureCanonicalJsonError(memberPath, `${memberPath} cannot be undefined`);
        }
        return `${JSON.stringify(key)}:${encodeCanonicalJson(record[key], memberPath, ancestors)}`;
      });
      return `{${members.join(",")}}`;
    } finally {
      ancestors.delete(value);
    }
  }
  throw new NurtureCanonicalJsonError(path, `${path} contains a non-JSON value`);
}

function enter(value: object, path: string, ancestors: Set<object>): void {
  if (ancestors.has(value)) {
    throw new NurtureCanonicalJsonError(path, `${path} contains a cyclic value`);
  }
  ancestors.add(value);
}

function assertPairedSurrogates(value: string, path: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new NurtureCanonicalJsonError(path, `${path} contains an unpaired surrogate`);
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new NurtureCanonicalJsonError(path, `${path} contains an unpaired surrogate`);
    }
  }
}
