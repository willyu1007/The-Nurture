import { describe, expect, it } from "vitest";
import {
  createFamilyGrowthServiceAuth,
  deriveFamilyRenditionLeaseKey,
  FAMILY_GROWTH_RENDITION_LEASE_TTL_MS,
  loadFamilyGrowthDeliveryConfig,
  mintFamilyRenditionLeaseV1,
  verifyFamilyRenditionLeaseV1,
} from "../src/family-growth-runtime.js";

const NOW = new Date("2026-08-07T12:00:00.000Z");
const KEY = deriveFamilyRenditionLeaseKey("rendition-service-token-32-chars!!");

describe("loadFamilyGrowthDeliveryConfig", () => {
  it("requires both keys and a 16+ character token", () => {
    expect(loadFamilyGrowthDeliveryConfig({})).toBeNull();
    expect(
      loadFamilyGrowthDeliveryConfig({ MY_CHAT_INTERNAL_BASE_URL: "http://mc.local" }),
    ).toBeNull();
    expect(
      loadFamilyGrowthDeliveryConfig({
        FAMILY_GROWTH_EVENTS_SERVICE_TOKEN: "events-token-32-characters-long!",
      }),
    ).toBeNull();
    expect(
      loadFamilyGrowthDeliveryConfig({
        MY_CHAT_INTERNAL_BASE_URL: "http://mc.local",
        FAMILY_GROWTH_EVENTS_SERVICE_TOKEN: "short",
      }),
    ).toBeNull();
    expect(
      loadFamilyGrowthDeliveryConfig({
        MY_CHAT_INTERNAL_BASE_URL: "http://mc.local/",
        FAMILY_GROWTH_EVENTS_SERVICE_TOKEN: "events-token-32-characters-long!",
      }),
    ).toEqual({ baseUrl: "http://mc.local", token: "events-token-32-characters-long!" });
  });
});

describe("createFamilyGrowthServiceAuth", () => {
  const current = "current-token-32-characters-long";
  const previous = "previous-token-32-characters-lng";

  it("accepts current and previous during rotation, nothing else", () => {
    const auth = createFamilyGrowthServiceAuth(current, previous);
    expect(auth.configured).toBe(true);
    expect(auth.bearerAuthorized(`Bearer ${current}`)).toBe(true);
    expect(auth.bearerAuthorized(`Bearer ${previous}`)).toBe(true);
    expect(auth.bearerAuthorized(`Bearer wrong-token-32-characters-long!!`)).toBe(false);
    expect(auth.bearerAuthorized(current)).toBe(false);
    expect(auth.bearerAuthorized(undefined)).toBe(false);
  });

  it("refuses everything when unconfigured or under-length", () => {
    const unconfigured = createFamilyGrowthServiceAuth(undefined);
    expect(unconfigured.configured).toBe(false);
    expect(unconfigured.bearerAuthorized(`Bearer ${current}`)).toBe(false);
    const short = createFamilyGrowthServiceAuth("short");
    expect(short.configured).toBe(false);
    expect(short.bearerAuthorized("Bearer short")).toBe(false);
  });
});

describe("family rendition lease", () => {
  const assetId = "0d4f8f4e-6f0a-4bfa-9a25-0a2ba32e6f01";

  it("round-trips within the TTL and expires at the boundary", () => {
    const expiresAt = new Date(NOW.getTime() + FAMILY_GROWTH_RENDITION_LEASE_TTL_MS);
    const token = mintFamilyRenditionLeaseV1({ key: KEY, assetId, mediaRevision: 3, expiresAt });
    expect(verifyFamilyRenditionLeaseV1({ key: KEY, token, now: NOW })).toEqual({
      assetId,
      mediaRevision: 3,
    });
    expect(verifyFamilyRenditionLeaseV1({ key: KEY, token, now: expiresAt })).toBeNull();
  });

  it("rejects tampered payloads and foreign keys", () => {
    const expiresAt = new Date(NOW.getTime() + 60_000);
    const token = mintFamilyRenditionLeaseV1({ key: KEY, assetId, mediaRevision: 1, expiresAt });
    const [version, , signature] = token.split(".");
    const forgedPayload = Buffer.from(`${assetId}:2:${expiresAt.getTime()}`, "utf8").toString(
      "base64url",
    );
    expect(
      verifyFamilyRenditionLeaseV1({
        key: KEY,
        token: `${version}.${forgedPayload}.${signature}`,
        now: NOW,
      }),
    ).toBeNull();
    const otherKey = deriveFamilyRenditionLeaseKey("another-service-token-32-chars!!");
    expect(verifyFamilyRenditionLeaseV1({ key: otherKey, token, now: NOW })).toBeNull();
    expect(verifyFamilyRenditionLeaseV1({ key: KEY, token: "garbage", now: NOW })).toBeNull();
  });
});
