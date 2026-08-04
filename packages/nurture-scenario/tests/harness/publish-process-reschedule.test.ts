import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type {
  NurtureCommandExecutionContext,
  NurtureCommandTransaction,
} from "../../src/domain/commands/command-kernel.js";
import {
  NurtureInteractionContextService,
  type NurtureInteractionContextRepository,
} from "../../src/domain/interactions/interaction-context.js";
import type { NurturePublishProcessRescheduleFacts } from "../../src/domain/institution/publish-process-transaction.js";
import { issueBoardSealedRef } from "../../src/harness/board-projection.js";
import { PUBLISH_PROCESS_TARGET_KIND } from "../../src/harness/publish-process.js";
import {
  createReschedulePublishProcessSpec,
  prepareReschedulePublishProcess,
  type PublishProcessRescheduleFactsV1,
  type ReschedulePublishProcessCommandV1,
} from "../../src/harness/publish-process-reschedule.js";
import { caregiverAuthority, BOARD_INTEGRITY_KEY } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const processKey = "care-group-1~trigger-1";
const processRef = issueBoardSealedRef(
  BOARD_INTEGRITY_KEY,
  scope,
  PUBLISH_PROCESS_TARGET_KIND,
  processKey,
);
const schedule = {
  scheduledAt: "2026-08-01T09:00:00.000Z",
  notAfter: "2026-08-01T11:00:00.000Z",
  timeZone: "Asia/Shanghai",
  policyRef: "nurture.institution-publication-policy@1.0.0",
  policyHead: 5,
  policyVersion: 2,
  resolvedAt: "2026-08-01T07:00:00.000Z",
};

const facts = (
  overrides: Partial<PublishProcessRescheduleFactsV1> = {},
): PublishProcessRescheduleFactsV1 => ({
  authority: caregiverAuthority(),
  authorizing_role_assignment_id: "role-1",
  process_state: "pending_release",
  process_version: 7,
  read_at: "2026-08-01T08:00:00.000Z",
  schedule,
  committed_release_count: 0,
  current_policy: {
    policy_ref: schedule.policyRef,
    policy_head: schedule.policyHead,
    policy_version: schedule.policyVersion,
  },
  ...overrides,
});

const contexts = (): NurtureInteractionContextService =>
  new NurtureInteractionContextService({
    create: async (input: unknown) =>
      ({
        ...(input as object),
        id: randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as never,
    findByTokenHash: async () => null,
    findLatestActiveByConversationHash: async () => null,
    consume: async () => null,
    revoke: async () => null,
  } satisfies NurtureInteractionContextRepository);

const command: ReschedulePublishProcessCommandV1 = {
  process_key: processKey,
  scheduled_at: "2026-08-01T10:00:00.000Z",
  expected_schedule_version: 7,
};

const context: NurtureCommandExecutionContext = {
  workspace_id: scope.workspace_id,
  business_actor_ref: scope.participant_id,
  command_request_id: "command:reschedule-1",
};

const ownerFacts = (
  overrides: Partial<NurturePublishProcessRescheduleFacts> = {},
): NurturePublishProcessRescheduleFacts => ({
  ...facts(),
  publish_process_ref: {
    schema_version: 1,
    namespace: "nurture",
    object_type: "publish_process",
    object_id: "process-1",
    version: 7,
  },
  ...overrides,
});

const transaction = (
  loaded: NurturePublishProcessRescheduleFacts | null = ownerFacts(),
): NurtureCommandTransaction =>
  ({
    publishProcess: {
      loadPublishProcessRescheduleFacts: async () => loaded,
      applyPublishProcessReschedule: async () => ({
        publish_process_ref: ownerFacts().publish_process_ref,
        schedule: { ...schedule, scheduledAt: command.scheduled_at },
      }),
    },
  }) as unknown as NurtureCommandTransaction;

describe("reschedule_publish_process provider-backed lane", () => {
  it("prepares only from an owner ref and freezes the publication schedule head", async () => {
    const prepared = await prepareReschedulePublishProcess(
      {
        integrity_key: BOARD_INTEGRITY_KEY,
        contexts: contexts(),
        create_command_id: () => "command:reschedule-1",
        reads: {
          listEditableProcessKeys: async () => [processKey],
          loadRescheduleFacts: async () => facts(),
        },
      },
      {
        ...scope,
        surface: "board",
        target_option_ref: processRef,
        operation_input: { scheduledAt: command.scheduled_at },
      },
    );
    expect(prepared).toMatchObject({
      status: "ready_to_confirm",
      command_request_id: "command:reschedule-1",
      preview: {
        effect: "reschedule_publish_process",
        scheduledAt: command.scheduled_at,
        notAfter: schedule.notAfter,
      },
    });
  });

  it("fails closed when the provider is absent or has drifted", async () => {
    const run = (loaded: PublishProcessRescheduleFactsV1) =>
      prepareReschedulePublishProcess(
        {
          integrity_key: BOARD_INTEGRITY_KEY,
          contexts: contexts(),
          reads: {
            listEditableProcessKeys: async () => [processKey],
            loadRescheduleFacts: async () => loaded,
          },
        },
        {
          ...scope,
          surface: "board",
          target_option_ref: processRef,
          operation_input: { scheduledAt: command.scheduled_at },
        },
      );
    await expect(run(facts({ current_policy: null }))).resolves.toEqual({
      status: "denied",
      reason_code: "publication_policy_unavailable",
    });
    await expect(
      run(facts({ current_policy: { ...facts().current_policy!, policy_head: 6 } })),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "publication_policy_drift",
    });
  });

  it("re-reads lifecycle, hold and release state inside the command", async () => {
    const spec = createReschedulePublishProcessSpec();
    await expect(
      spec.checkPreconditions(transaction(), command, context),
    ).resolves.toEqual({ status: "ready" });
    await expect(
      spec.checkPreconditions(
        transaction(ownerFacts({ committed_release_count: 1 })),
        command,
        context,
      ),
    ).resolves.toEqual({ status: "blocked", reason_code: "already_released" });
    await expect(
      spec.checkPreconditions(
        transaction(
          ownerFacts({
            current_hold: {
              holder_participant_id: "caregiver-2",
              holder_label: "Colleague",
              expires_at: "2026-08-01T08:05:00.000Z",
              hold_version: 2,
            },
          }),
        ),
        command,
        context,
      ),
    ).resolves.toEqual({ status: "blocked", reason_code: "edit_hold_active" });
  });

  it("conflicts when the schedule head moved after confirmation", async () => {
    const spec = createReschedulePublishProcessSpec();
    await expect(
      spec.checkPreconditions(
        transaction(ownerFacts({ process_version: 8 })),
        command,
        context,
      ),
    ).resolves.toEqual({ status: "conflict", reason_code: "stale_confirmation" });
  });

  it("persists only scheduledAt and returns the frozen window", async () => {
    const result = await createReschedulePublishProcessSpec().apply(
      transaction(),
      command,
      context,
    );
    expect(result).toMatchObject({
      result_schema_version: 1,
      committed_result: {
        scheduledAt: command.scheduled_at,
        notAfter: schedule.notAfter,
        policyHead: schedule.policyHead,
        policyVersion: schedule.policyVersion,
        resolvedAt: schedule.resolvedAt,
      },
    });
  });
});
