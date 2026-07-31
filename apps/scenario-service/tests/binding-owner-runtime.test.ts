import { describe, expect, it } from "vitest";
import type { ScenarioBindingOwnerAuthorizer } from "@the-nurture/scenario/binding-owner";
import { createBindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";

const fakeAuthorizer: ScenarioBindingOwnerAuthorizer = {
  authorize: async () => {
    throw new Error("Not used by the runtime composition test.");
  },
};

describe("BindingOwnerRuntime", () => {
  it("uses one injected authorizer object without requiring database config", () => {
    const runtime = createBindingOwnerRuntime({
      env: {},
      serviceAuth: createBindingOwnerServiceAuth("token"),
      authorizer: fakeAuthorizer,
    });

    expect(runtime.authorizer).toBe(fakeAuthorizer);
  });

  it.each([
    {
      name: "service token absent",
      env: {
        DATABASE_URL: "postgresql://unused/unused",
        NURTURE_BINDING_EVIDENCE_KEY: "k".repeat(32),
      },
      token: undefined,
    },
    {
      name: "evidence key absent",
      env: { DATABASE_URL: "postgresql://unused/unused" },
      token: "token",
    },
    {
      name: "evidence key weak in UTF-8 bytes",
      env: {
        DATABASE_URL: "postgresql://unused/unused",
        NURTURE_BINDING_EVIDENCE_KEY: "short",
      },
      token: "token",
    },
    {
      name: "database URL absent",
      env: { NURTURE_BINDING_EVIDENCE_KEY: "k".repeat(32) },
      token: "token",
    },
  ])("stays disabled when $name", ({ env, token }) => {
    const runtime = createBindingOwnerRuntime({
      env,
      serviceAuth: createBindingOwnerServiceAuth(token),
    });

    expect(runtime.authorizer).toBeUndefined();
  });
});
