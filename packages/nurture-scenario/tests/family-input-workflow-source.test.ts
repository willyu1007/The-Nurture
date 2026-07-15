import { describe, expect, it, vi } from "vitest";
import {
  createNurtureFamilyInputWorkflowPort,
  parseNurtureFamilyInputWorkflowSeed,
  type NurtureInstitutionContextRepository,
} from "../src/index.js";

const seed = () => ({
  schema_version: 1,
  invocation_request_id: "invocation-1",
  command_request_id: "command-1",
  handoff_request_id: "attention-1",
  payload: {
    participant_id: "participant-1",
    role_assignment_id: "role-1",
    child_care_process_id: "process-1",
    family_id: "family-1",
    enrollment_id: "enrollment-1",
    care_group_id: "group-1",
    thread_id: "thread-1",
    data_class: "family_care_question",
    category: "question",
    urgency: "today_attention",
    safe_summary: "Please review the current family input.",
    protected_content_ref: {
      namespace: "nurture",
      consumer_scenario_key: "nurture",
      object_type: "protected_content",
      object_id: "content-1",
      version: 1,
      owner_scope: "workspace",
    },
    attachment_refs: [],
    source_surface: "mobile",
    routing_attempt_key: "route-1",
    route_mode: "immediate",
    requires_ack: true,
    requires_reply: true,
  },
});

describe("Nurture family-input workflow source", () => {
  it("parses the bounded scenario-owned seed without host interpretation", () => {
    expect(parseNurtureFamilyInputWorkflowSeed(seed())).toMatchObject({
      command_request_id: "command-1",
      payload: { participant_id: "participant-1", route_mode: "immediate" },
    });
  });

  it("rejects unknown fields, body fields, and non-immediate activation", () => {
    expect(
      parseNurtureFamilyInputWorkflowSeed({ ...seed(), claim_token: "secret" }),
    ).toBeNull();
    expect(
      parseNurtureFamilyInputWorkflowSeed({
        ...seed(),
        payload: { ...seed().payload, body: "private", route_mode: "immediate" },
      }),
    ).toBeNull();
    expect(
      parseNurtureFamilyInputWorkflowSeed({
        ...seed(),
        payload: { ...seed().payload, route_mode: "pending_workflow" },
      }),
    ).toBeNull();
  });

  it("rebinds the host actor to exactly one current Nurture participant", async () => {
    const institution = {
      listActiveParticipants: vi.fn(async () => [
        {
          workspace_id: "workspace-1",
          participant_id: "participant-1",
          my_chat_user_id: "user-1",
        },
      ]),
    } as unknown as NurtureInstitutionContextRepository;
    const port = createNurtureFamilyInputWorkflowPort({
      seedReader: { readSeed: vi.fn(async () => seed()) },
      actorIdentity: {
        resolveMyChatUserId: vi.fn(async () => "user-1"),
      },
      institution,
    });

    await expect(
      port.resolveCommand({
        workspace_id: "workspace-1",
        run_id: "run-1",
        step_id: "step-1",
        actor_id: "actor-1",
        correlation_id: "correlation-1",
      }),
    ).resolves.toMatchObject({ command_request_id: "command-1" });
    expect(institution.listActiveParticipants).toHaveBeenCalledWith({
      workspace_id: "workspace-1",
      my_chat_user_id: "user-1",
      limit: 2,
    });
  });

  it("fails closed for a missing or mismatched actor binding", async () => {
    const institution = {
      listActiveParticipants: vi.fn(async () => [
        {
          workspace_id: "workspace-1",
          participant_id: "participant-other",
          my_chat_user_id: "user-1",
        },
      ]),
    } as unknown as NurtureInstitutionContextRepository;
    const port = createNurtureFamilyInputWorkflowPort({
      seedReader: { readSeed: vi.fn(async () => seed()) },
      actorIdentity: {
        resolveMyChatUserId: vi.fn(async () => "user-1"),
      },
      institution,
    });
    await expect(
      port.resolveCommand({
        workspace_id: "workspace-1",
        run_id: "run-1",
        step_id: "step-1",
        correlation_id: "correlation-1",
      }),
    ).resolves.toBeNull();
    await expect(
      port.resolveCommand({
        workspace_id: "workspace-1",
        run_id: "run-1",
        step_id: "step-1",
        actor_id: "actor-1",
        correlation_id: "correlation-1",
      }),
    ).resolves.toBeNull();
  });
});
