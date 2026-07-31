import type { ExecutionContext } from "@nestjs/common";
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  type BindingOwnerGuardConfig,
  BindingOwnerServiceAuthGuard,
} from "../src/binding-owner-service-auth.guard.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { BindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import type { ScenarioBindingOwnerAuthorizer } from "@the-nurture/scenario/binding-owner";

const TOKEN = "m2-service-token-marker";
const SAME_LENGTH_WRONG_TOKEN = `${TOKEN.slice(0, -1)}x`;

describe("BindingOwnerServiceAuthGuard", () => {
  it.each([
    {
      name: "authorizer absent",
      config: guardConfig(false, TOKEN),
    },
    {
      name: "service token absent",
      config: guardConfig(true, undefined),
    },
  ])("returns disabled before inspecting credentials: $name", ({ config }) => {
    const guard = new BindingOwnerServiceAuthGuard(config);

    expect(() => guard.canActivate(context(`Bearer ${TOKEN}`))).toThrow(
      ServiceUnavailableException,
    );
    expectHttpError(
      () => guard.canActivate(context(`Bearer ${TOKEN}`)),
      503,
      "binding_owner_disabled",
    );
  });

  it.each([
    undefined,
    "",
    "Basic marker",
    "Bearer wrong-token",
    `Bearer ${SAME_LENGTH_WRONG_TOKEN}`,
  ])(
    "returns unauthorized for a missing or wrong bearer: %s",
    (header) => {
      const guard = new BindingOwnerServiceAuthGuard(
        guardConfig(true, TOKEN),
      );

      expect(() => guard.canActivate(context(header))).toThrow(
        UnauthorizedException,
      );
      expectHttpError(
        () => guard.canActivate(context(header)),
        401,
        "service_auth_required",
      );
    },
  );

  it("allows the exact bearer when the authorizer and token are configured", () => {
    const guard = new BindingOwnerServiceAuthGuard(guardConfig(true, TOKEN));

    expect(guard.canActivate(context(`Bearer ${TOKEN}`))).toBe(true);
  });
});

function guardConfig(
  authorizerAvailable: boolean,
  token: string | undefined,
): BindingOwnerGuardConfig {
  return {
    runtime: new BindingOwnerRuntime(
      authorizerAvailable ? fakeAuthorizer : undefined,
    ),
    serviceAuth: createBindingOwnerServiceAuth(token),
  };
}

const fakeAuthorizer: ScenarioBindingOwnerAuthorizer = {
  authorize: async () => {
    throw new Error("The guard test must not invoke the authorizer.");
  },
};

function context(authorization: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  } as ExecutionContext;
}

function expectHttpError(
  action: () => unknown,
  status: number,
  error: string,
): void {
  try {
    action();
    throw new Error("Expected guard to reject the request.");
  } catch (caught) {
    expect(caught).toMatchObject({
      status,
      response: { error },
    });
  }
}
