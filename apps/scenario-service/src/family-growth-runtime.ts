import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  createPrismaClient,
  PrismaFamilyGrowthRenditionReadPort,
  type NurturePrismaClient,
  type ResolvedFamilyRenditionV1,
} from "@the-nurture/db";

/**
 * T-009 I5 runtime pieces for the rendition exchange, bound by
 * `family_growth_transport@1.0.0` §1/§2/§4/§5.
 */

export type FamilyGrowthServiceAuth = Readonly<{
  configured: boolean;
  bearerAuthorized(header: string | undefined): boolean;
}>;

/**
 * Dual-token bearer validation (addendum §2): the validator accepts
 * `{current, previous}` so rotation deploys the receiver first. Unconfigured
 * = every request refused (the repo's default-off posture for service auth).
 */
export function createFamilyGrowthServiceAuth(
  current: string | undefined,
  previous?: string | undefined,
): FamilyGrowthServiceAuth {
  const expected = [current, previous]
    .filter((token): token is string => typeof token === "string" && token.length >= 16)
    .map((token) => Buffer.from(token, "utf8"));

  return Object.freeze({
    configured: expected.length > 0,
    bearerAuthorized(header: string | undefined): boolean {
      if (expected.length === 0 || !header?.startsWith("Bearer ")) return false;
      const supplied = Buffer.from(header.slice("Bearer ".length), "utf8");
      return expected.some(
        (candidate) =>
          supplied.length === candidate.length && timingSafeEqual(supplied, candidate),
      );
    },
  });
}

export type FamilyGrowthDeliveryConfig = Readonly<{
  baseUrl: string;
  token: string;
}>;

/** Both keys or nothing: a half-configured delivery capability stays off. */
export function loadFamilyGrowthDeliveryConfig(
  env: NodeJS.ProcessEnv = process.env,
): FamilyGrowthDeliveryConfig | null {
  const baseUrl = env.MY_CHAT_INTERNAL_BASE_URL;
  const token = env.FAMILY_GROWTH_EVENTS_SERVICE_TOKEN;
  if (!baseUrl || !token || token.length < 16) return null;
  return Object.freeze({ baseUrl: baseUrl.replace(/\/+$/, ""), token });
}

export function loadFamilyGrowthRenditionAuth(
  env: NodeJS.ProcessEnv = process.env,
): FamilyGrowthServiceAuth {
  return createFamilyGrowthServiceAuth(
    env.FAMILY_GROWTH_RENDITION_SERVICE_TOKEN,
    env.FAMILY_GROWTH_RENDITION_SERVICE_TOKEN_PREVIOUS,
  );
}

// --- lease (addendum §4: 5 minutes, re-resolvable, not single-use) --------

export const FAMILY_GROWTH_RENDITION_LEASE_TTL_MS = 300_000;

const LEASE_VERSION = "fgl1";

const leasePayload = (assetId: string, mediaRevision: number, expiresAtMs: number): string =>
  `${assetId}:${mediaRevision}:${expiresAtMs}`;

const leaseSignature = (key: Buffer, payload: string): string =>
  createHmac("sha256", key).update(payload, "utf8").digest("hex");

/**
 * Stateless lease token: version.payload(base64url).hmac. The key derives
 * from the rendition service token, so a token rotation also invalidates
 * open leases — acceptable at a 5-minute TTL, and re-resolving recovers.
 */
export const deriveFamilyRenditionLeaseKey = (serviceToken: string): Buffer =>
  createHash("sha256").update(`nurture.family-rendition-lease.v1\0${serviceToken}`).digest();

export const mintFamilyRenditionLeaseV1 = (input: {
  key: Buffer;
  assetId: string;
  mediaRevision: number;
  expiresAt: Date;
}): string => {
  const payload = leasePayload(input.assetId, input.mediaRevision, input.expiresAt.getTime());
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${LEASE_VERSION}.${encoded}.${leaseSignature(input.key, payload)}`;
};

export const verifyFamilyRenditionLeaseV1 = (input: {
  key: Buffer;
  token: string;
  now: Date;
}): { assetId: string; mediaRevision: number } | null => {
  const parts = input.token.split(".");
  if (parts.length !== 3 || parts[0] !== LEASE_VERSION) return null;
  let payload: string;
  try {
    payload = Buffer.from(parts[1]!, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const supplied = Buffer.from(parts[2]!, "utf8");
  const expectedSignature = Buffer.from(leaseSignature(input.key, payload), "utf8");
  if (supplied.length !== expectedSignature.length || !timingSafeEqual(supplied, expectedSignature)) {
    return null;
  }
  const [assetId, revisionText, expiresText] = payload.split(":");
  const mediaRevision = Number(revisionText);
  const expiresAtMs = Number(expiresText);
  if (
    !assetId ||
    !Number.isSafeInteger(mediaRevision) ||
    mediaRevision < 1 ||
    !Number.isSafeInteger(expiresAtMs) ||
    expiresAtMs <= input.now.getTime()
  ) {
    return null;
  }
  return { assetId, mediaRevision };
};

// --- runtime ---------------------------------------------------------------

/** Bytes for an authorized rendition; deployment infra provides this. */
export type FamilyGrowthRenditionStoragePort = {
  read(storageRefPayload: unknown): Promise<Uint8Array | null>;
};

export type FamilyGrowthRenditionRuntime = Readonly<{
  auth: FamilyGrowthServiceAuth;
  resolveRendition(ref: string): Promise<ResolvedFamilyRenditionV1 | null>;
  leaseKey: Buffer | null;
  storage?: FamilyGrowthRenditionStoragePort;
  now(): Date;
  shutdown(): Promise<void>;
}>;

export function createFamilyGrowthRenditionRuntime(input?: {
  env?: NodeJS.ProcessEnv;
  prisma?: NurturePrismaClient;
  auth?: FamilyGrowthServiceAuth;
  storage?: FamilyGrowthRenditionStoragePort;
  now?: () => Date;
}): FamilyGrowthRenditionRuntime {
  const env = input?.env ?? process.env;
  const ownsClient = !input?.prisma;
  const prisma = input?.prisma ?? createPrismaClient();
  const readPort = new PrismaFamilyGrowthRenditionReadPort(prisma);
  const serviceToken = env.FAMILY_GROWTH_RENDITION_SERVICE_TOKEN;
  return Object.freeze({
    auth: input?.auth ?? loadFamilyGrowthRenditionAuth(env),
    resolveRendition: (ref: string) => readPort.resolveRendition(ref),
    leaseKey: serviceToken ? deriveFamilyRenditionLeaseKey(serviceToken) : null,
    ...(input?.storage ? { storage: input.storage } : {}),
    now: input?.now ?? (() => new Date()),
    shutdown: async () => {
      if (ownsClient) await prisma.$disconnect();
    },
  });
}
