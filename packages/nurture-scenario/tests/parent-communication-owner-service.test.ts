import { describe, expect, it } from "vitest";
import { LatestParentCommunicationAsyncBoundary } from "../src/parent-communication-owner-service.js";

describe("parent communication async boundary", () => {
  it("rejects older generations after context replacement and isolates operations", async () => {
    const boundary = new LatestParentCommunicationAsyncBoundary();
    const base = {
      workspace_id: "workspace-a",
      my_chat_user_id: "user-a",
      host_request_id: "host-a",
    };
    const first = await boundary.capture({
      ...base,
      operation: "detail_query",
      context_ref: "context-a",
    });
    const second = await boundary.capture({
      ...base,
      host_request_id: "host-b",
      operation: "detail_query",
      context_ref: "context-b",
    });
    expect(first.response_generation).toBe(1);
    expect(second.response_generation).toBe(2);
    await expect(boundary.current({
      ...base,
      operation: "detail_query",
    })).resolves.toEqual({
      active_generation: 2,
      active_context_ref: "context-b",
    });
    const summary = await boundary.capture({
      ...base,
      operation: "summary_query",
      context_ref: "context-a",
    });
    expect(summary.response_generation).toBe(1);
  });

  it("expires stale state and bounds process-local presentation entries", async () => {
    let now = 0;
    const boundary = new LatestParentCommunicationAsyncBoundary(
      () => new Date(now),
      1,
      100,
    );
    await boundary.capture({
      operation: "summary_query",
      workspace_id: "workspace-a",
      my_chat_user_id: "user-a",
      host_request_id: "host-a",
      context_ref: "context-a",
    });
    await boundary.capture({
      operation: "summary_query",
      workspace_id: "workspace-b",
      my_chat_user_id: "user-b",
      host_request_id: "host-b",
      context_ref: "context-b",
    });
    await expect(boundary.current({
      operation: "summary_query",
      workspace_id: "workspace-a",
      my_chat_user_id: "user-a",
      host_request_id: "host-a",
    })).rejects.toThrow("generation missing");
    now = 101;
    await expect(boundary.current({
      operation: "summary_query",
      workspace_id: "workspace-b",
      my_chat_user_id: "user-b",
      host_request_id: "host-b",
    })).rejects.toThrow("generation missing");
  });

  it("keeps a refreshed generation when the bounded map evicts its oldest entry", async () => {
    let now = 0;
    const boundary = new LatestParentCommunicationAsyncBoundary(
      () => new Date(now),
      2,
      1_000,
    );
    const capture = (user: string, context: string) => boundary.capture({
      operation: "detail_query",
      workspace_id: "workspace-a",
      my_chat_user_id: user,
      host_request_id: `host-${user}`,
      context_ref: context,
    });
    await capture("user-a", "context-a1");
    now = 1;
    await capture("user-b", "context-b");
    now = 2;
    await capture("user-a", "context-a2");
    now = 3;
    await capture("user-c", "context-c");

    await expect(boundary.current({
      operation: "detail_query",
      workspace_id: "workspace-a",
      my_chat_user_id: "user-a",
      host_request_id: "host-user-a",
    })).resolves.toEqual({
      active_generation: 2,
      active_context_ref: "context-a2",
    });
    await expect(boundary.current({
      operation: "detail_query",
      workspace_id: "workspace-a",
      my_chat_user_id: "user-b",
      host_request_id: "host-user-b",
    })).rejects.toThrow("generation missing");
  });
});
