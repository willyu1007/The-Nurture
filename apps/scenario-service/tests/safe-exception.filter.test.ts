import type { ArgumentsHost } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrivateResponseExceptionFilter } from "../src/private-response-exception.filter.js";
import { SafeExceptionFilter } from "../src/safe-exception.filter.js";
import {
  ScenarioStructuredLogger,
  type ScenarioStructuredLogRecord,
} from "../src/structured-logger.js";

describe("SafeExceptionFilter", () => {
  it("does not trust status-like fields on unknown exceptions", () => {
    const { filter, records, response, host } = harness();

    filter.catch({ status: 400, error: "attacker-controlled" }, host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ error: "internal_error" });
    expect(records).toContainEqual({
      schema: "nurture_scenario_service_log_v1",
      event: "unhandled_exception",
      request_id: "unavailable",
      route_class: "unknown",
    });
  });

  it("maps only recognized body-parser failures to body-safe statuses", () => {
    const { filter, records, response, host } = harness();

    filter.catch({ type: "entity.too.large", status: 599 }, host);

    expect(response.status).toHaveBeenCalledWith(413);
    expect(response.json).toHaveBeenCalledWith({
      error: "payload_too_large",
    });
    expect(records).toHaveLength(0);
  });

  it("adds private no-store headers before serializing private-controller errors", () => {
    const { filter: safeFilter, response, host } = harness();
    const filter = new PrivateResponseExceptionFilter(safeFilter);

    filter.catch({ status: 503 }, host);

    expect(response.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store",
    );
    expect(response.setHeader).toHaveBeenCalledWith("Pragma", "no-cache");
  });
});

function harness() {
  const records: ScenarioStructuredLogRecord[] = [];
  const logger = new ScenarioStructuredLogger((record) =>
    records.push(record),
  );
  const response = {
    headersSent: false,
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return {
    filter: new SafeExceptionFilter(logger),
    records,
    response,
    host,
  };
}
