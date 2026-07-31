import { describe, expect, it } from "vitest";
import { createMyChatDerivedAgeStageHttpSource } from "../src/adapters/derived-age-stage-http.js";

type FetchImpl = NonNullable<
  Parameters<typeof createMyChatDerivedAgeStageHttpSource>[0]["fetch"]
>;

const now = () => new Date("2026-07-31T10:00:00.000Z");

const envelope = () => ({
  age_band_key: "m_0_3",
  stage_key: "newborn",
  as_of_date: "2026-07-30",
  source_version: 1,
  expires_at: "2026-08-01T10:00:00.000Z",
});

function recordingFetch(impl: FetchImpl): FetchImpl & {
  calls: Array<Parameters<FetchImpl>>;
} {
  const calls: Array<Parameters<FetchImpl>> = [];
  const fn = (async (...args: Parameters<FetchImpl>) => {
    calls.push(args);
    return impl(...args);
  }) as FetchImpl & { calls: Array<Parameters<FetchImpl>> };
  fn.calls = calls;
  return fn;
}

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const source = (fetchImpl: FetchImpl) =>
  createMyChatDerivedAgeStageHttpSource({
    baseUrl: "http://127.0.0.1:8000",
    serviceToken: "x".repeat(32),
    fetch: fetchImpl,
    now,
  });

describe("createMyChatDerivedAgeStageHttpSource", () => {
  it("posts the derived-read contract and parses a strict envelope", async () => {
    const fetchImpl = recordingFetch(async () => jsonResponse(200, envelope()));

    const resolution = await source(fetchImpl).read({
      childId: "child-1",
      asOfDate: "2026-07-30",
    });

    expect(resolution.status).toBe("issued");
    if (resolution.status !== "issued") return;
    expect(resolution.result.ageBandKey).toBe("m_0_3");
    expect(resolution.result.stageKey).toBe("newborn");
    const [url, init] = fetchImpl.calls[0]!;
    expect(String(url)).toBe("http://127.0.0.1:8000/internal/child/derived-age-stage");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toEqual({
      scenario_key: "nurture",
      child_id: "child-1",
      purpose: "derived_age_stage_read",
      as_of_date: "2026-07-30",
    });
    expect(
      (init?.headers as Record<string, string>).authorization.startsWith(
        "Bearer ",
      ),
    ).toBe(true);
  });

  it("rejects an envelope carrying extra fields (raw-date smuggling)", async () => {
    const fetchImpl = recordingFetch(async () =>
      jsonResponse(200, { ...envelope(), birth_date: "2026-05-01" }),
    );

    const resolution = await source(fetchImpl).read({ childId: "child-1" });

    expect(resolution).toEqual({
      status: "unavailable",
      reason_code: "invalid_envelope",
    });
  });

  it("rejects an expired envelope", async () => {
    const fetchImpl = recordingFetch(async () =>
      jsonResponse(200, {
        ...envelope(),
        expires_at: "2026-07-31T09:00:00.000Z",
      }),
    );

    const resolution = await source(fetchImpl).read({ childId: "child-1" });

    expect(resolution).toEqual({
      status: "unavailable",
      reason_code: "invalid_envelope",
    });
  });

  it("maps 403 to a denied resolution with the owner reason code", async () => {
    const fetchImpl = recordingFetch(async () =>
      jsonResponse(403, { error: "binding_required" }),
    );

    const resolution = await source(fetchImpl).read({ childId: "child-1" });

    expect(resolution).toEqual({
      status: "denied",
      reason_code: "binding_required",
    });
  });

  it("maps 503 and transport failures to unavailable", async () => {
    const disabled = await source(async () =>
      jsonResponse(503, { error: "derived_read_disabled" }),
    ).read({ childId: "child-1" });
    expect(disabled).toEqual({
      status: "unavailable",
      reason_code: "derived_read_disabled",
    });

    const failing = await source(async () => {
      throw new Error("connect ECONNREFUSED");
    }).read({ childId: "child-1" });
    expect(failing).toEqual({
      status: "unavailable",
      reason_code: "derived_read_failed",
    });
  });

  it("refuses malformed child ids without touching the network", async () => {
    const fetchImpl = recordingFetch(async () => jsonResponse(200, envelope()));

    const resolution = await source(fetchImpl).read({ childId: " padded " });

    expect(resolution).toEqual({
      status: "unavailable",
      reason_code: "invalid_child_id",
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it("refuses construction with a short service token", () => {
    expect(() =>
      createMyChatDerivedAgeStageHttpSource({
        baseUrl: "http://127.0.0.1:8000",
        serviceToken: "short",
      }),
    ).toThrowError("at least 16 characters");
  });
});
