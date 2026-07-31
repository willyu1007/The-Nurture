import {
  NurtureDerivedAgeStageError,
  parseNurtureDerivedAgeStage,
  type NurtureDerivedAgeStage,
} from "../domain/identity/derived-age-stage.js";

export const DERIVED_AGE_STAGE_PATH = "/internal/child/derived-age-stage";
export const DERIVED_AGE_STAGE_PURPOSE = "derived_age_stage_read" as const;

const MAX_IDENTIFIER_LENGTH = 128;

export type DerivedAgeStageReadRequest = {
  childId: string;
  asOfDate?: string;
};

export type DerivedAgeStageResolution =
  | { status: "issued"; result: NurtureDerivedAgeStage }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string };

export type DerivedAgeStageSource = {
  read(request: DerivedAgeStageReadRequest): Promise<DerivedAgeStageResolution>;
};

type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status" | "json">>;

/**
 * Host-ward read client for the ST-5 derived age/stage envelope. Nurture
 * presents its shared internal service token, its own scenario key, and the
 * literal read purpose; the response passes the strict domain parser, so a
 * raw birth date, an exact age, an extra field, or an expired envelope can
 * never enter Nurture state. Denials and transport failures are typed
 * resolutions - never partial data.
 */
export function createMyChatDerivedAgeStageHttpSource(input: {
  baseUrl: string;
  serviceToken: string;
  timeoutMs?: number;
  fetch?: FetchLike;
  now?: () => Date;
}): DerivedAgeStageSource {
  const baseUrl = new URL(input.baseUrl);
  if (!input.serviceToken || input.serviceToken.length < 16) {
    throw new NurtureDerivedAgeStageError(
      "The shared internal service token must contain at least 16 characters.",
    );
  }
  const timeoutMs = input.timeoutMs ?? 5_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30_000) {
    throw new NurtureDerivedAgeStageError(
      "The derived-read timeout must be between 1 and 30000ms.",
    );
  }
  const fetcher = input.fetch ?? fetch;
  const clock = input.now ?? (() => new Date());
  return {
    async read(request) {
      if (
        typeof request.childId !== "string" ||
        request.childId.length === 0 ||
        request.childId.length > MAX_IDENTIFIER_LENGTH ||
        request.childId !== request.childId.trim()
      ) {
        return { status: "unavailable", reason_code: "invalid_child_id" };
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(
          new URL(DERIVED_AGE_STAGE_PATH, baseUrl),
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${input.serviceToken}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              scenario_key: "nurture",
              child_id: request.childId,
              purpose: DERIVED_AGE_STAGE_PURPOSE,
              ...(request.asOfDate ? { as_of_date: request.asOfDate } : {}),
            }),
            signal: controller.signal,
          },
        );
        if (response.status === 401 || response.status === 403) {
          return {
            status: "denied",
            reason_code: await readErrorCode(response, "derived_read_denied"),
          };
        }
        if (!response.ok) {
          return {
            status: "unavailable",
            reason_code: await readErrorCode(response, "derived_unavailable"),
          };
        }
        const result = parseNurtureDerivedAgeStage(
          await response.json(),
          clock(),
        );
        return { status: "issued", result };
      } catch (error) {
        if (error instanceof NurtureDerivedAgeStageError) {
          return { status: "unavailable", reason_code: "invalid_envelope" };
        }
        return { status: "unavailable", reason_code: "derived_read_failed" };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

async function readErrorCode(
  response: Pick<Response, "json">,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as unknown;
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      typeof (body as Record<string, unknown>).error === "string" &&
      /^[a-z][a-z0-9_]*$/.test((body as Record<string, unknown>).error as string)
    ) {
      return (body as Record<string, unknown>).error as string;
    }
  } catch {
    // fall through to the fallback code
  }
  return fallback;
}
