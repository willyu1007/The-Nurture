import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { RequestTimeoutException } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { delay } from "rxjs/operators";
import { describe, expect, it } from "vitest";
import { RequestTimeoutInterceptor } from "../src/request-timeout.interceptor.js";

const executionContext = {} as ExecutionContext;

describe("RequestTimeoutInterceptor", () => {
  it("passes through a response inside the deadline", async () => {
    const interceptor = new RequestTimeoutInterceptor(50);
    const next: CallHandler = { handle: () => of({ ok: true }) };

    await expect(
      lastValueFrom(interceptor.intercept(executionContext, next)),
    ).resolves.toEqual({ ok: true });
  });

  it("maps an over-deadline response to a safe timeout exception", async () => {
    const interceptor = new RequestTimeoutInterceptor(5);
    const next: CallHandler = {
      handle: () => of({ ok: true }).pipe(delay(30)),
    };

    await expect(
      lastValueFrom(interceptor.intercept(executionContext, next)),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });
});
