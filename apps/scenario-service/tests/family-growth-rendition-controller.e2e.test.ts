import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { familyRenditionRefV1, type ResolvedFamilyRenditionV1 } from "@the-nurture/db";
import { createScenarioServiceApplication } from "../src/application.js";
import {
  createFamilyGrowthServiceAuth,
  deriveFamilyRenditionLeaseKey,
  type FamilyGrowthRenditionRuntime,
  type FamilyGrowthRenditionStoragePort,
} from "../src/family-growth-runtime.js";
import { FAMILY_GROWTH_RENDITION_RESOLVE_PATH } from "../src/family-growth-rendition.controller.js";

const TOKEN = "rendition-e2e-service-token-32-ch";
const NOW = new Date("2026-08-07T12:00:00.000Z");
const ASSET_ID = "0d4f8f4e-6f0a-4bfa-9a25-0a2ba32e6f01";
const REF = familyRenditionRefV1(ASSET_ID, 1);

let close: (() => Promise<void>) | undefined;
afterEach(async () => {
  await close?.();
  close = undefined;
});

const resolved = (): ResolvedFamilyRenditionV1 => ({
  assetId: ASSET_ID,
  mediaRevision: 1,
  workspaceId: "ws-1",
  contentDigest: "b".repeat(64),
  contentMimeType: "image/jpeg",
  storageRefPayload: { bucket: "media", key: "k1" },
});

const start = async (input: {
  resolutions?: Map<string, ResolvedFamilyRenditionV1>;
  storage?: FamilyGrowthRenditionStoragePort;
}) => {
  const runtime: FamilyGrowthRenditionRuntime = Object.freeze({
    auth: createFamilyGrowthServiceAuth(TOKEN),
    resolveRendition: async (ref: string) => input.resolutions?.get(ref) ?? null,
    leaseKey: deriveFamilyRenditionLeaseKey(TOKEN),
    ...(input.storage ? { storage: input.storage } : {}),
    now: () => NOW,
    shutdown: async () => undefined,
  });
  const { app } = await createScenarioServiceApplication({
    familyGrowthRendition: runtime,
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  close = () => app.close();
  return `http://127.0.0.1:${address.port}`;
};

const resolve = (baseUrl: string, body: unknown, token = TOKEN) =>
  fetch(`${baseUrl}${FAMILY_GROWTH_RENDITION_RESOLVE_PATH}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

describe("family growth rendition exchange", () => {
  it("refuses a wrong bearer with service_unauthorized", async () => {
    const baseUrl = await start({});
    const response = await resolve(baseUrl, { rendition_ref: REF }, "wrong-token-32-chars-long!!!");
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: "service_unauthorized" });
  });

  it("rejects malformed refs and collapses unknown ones to 404", async () => {
    const baseUrl = await start({});
    const malformed = await resolve(baseUrl, { rendition_ref: "not-a-ref" });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ error: "rendition_ref_invalid" });

    const unknown = await resolve(baseUrl, { rendition_ref: REF });
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({ error: "rendition_unavailable" });
  });

  it("resolves, serves bytes within the lease, and re-authorizes the download", async () => {
    const resolutions = new Map([[REF, resolved()]]);
    const bytes = new TextEncoder().encode("jpeg-bytes");
    const baseUrl = await start({
      resolutions,
      storage: { read: async () => bytes },
    });
    const response = await resolve(baseUrl, { rendition_ref: REF });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      url: string;
      expires_at: string;
      content_digest: string;
      mime_type: string;
    };
    expect(payload.content_digest).toBe("b".repeat(64));
    expect(payload.mime_type).toBe("image/jpeg");
    expect(Date.parse(payload.expires_at)).toBe(NOW.getTime() + 300_000);

    const media = await fetch(`${baseUrl}${payload.url}`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    expect(media.status).toBe(200);
    expect(media.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await media.arrayBuffer())).toEqual(bytes);

    // Revocation between resolve and GET: the same lease now answers 404.
    resolutions.delete(REF);
    const revoked = await fetch(`${baseUrl}${payload.url}`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    expect(revoked.status).toBe(404);
    expect(await revoked.json()).toMatchObject({ error: "rendition_unavailable" });
  });

  it("answers 503 when storage is unbound or unreadable", async () => {
    const resolutions = new Map([[REF, resolved()]]);
    const baseUrl = await start({ resolutions });
    const response = await resolve(baseUrl, { rendition_ref: REF });
    const payload = (await response.json()) as { url: string };
    const media = await fetch(`${baseUrl}${payload.url}`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    expect(media.status).toBe(503);
    expect(await media.json()).toMatchObject({ error: "rendition_temporarily_unavailable" });
  });
});
