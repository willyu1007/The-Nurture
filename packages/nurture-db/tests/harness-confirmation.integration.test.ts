import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
  withHarnessConfirmation,
  type HarnessConfirmationBinding,
  type NurtureCommandSpec,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "../src/repositories/institution-core.repositories.js";

// Transactional proof of the G2 Harness confirmation contract: single
// consumption inside the command transaction, exact replay after commit,
// integrity/expiry refusals without consumption.
const prisma = createPrismaClient();
const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma));
const contextService = new NurtureInteractionContextService(
  new PrismaInteractionContextRepository(prisma),
);

const INTEGRITY_KEY = "harness-integration-integrity-key-32chars";

afterAll(async () => {
  await prisma.$disconnect();
});

type TestInput = { body: string };

const testSpec: NurtureCommandSpec<TestInput> = {
  command_key: "harness_confirmation_probe",
  command_scope: "family_care",
  contract_version: 1,
  canonicalize: (input) => input,
  checkPreconditions: async () => ({ status: "ready" }),
  apply: async () => ({
    output_refs: [
      {
        schema_version: 1,
        namespace: "nurture",
        object_type: "command_execution",
        object_id: randomUUID(),
      },
    ],
  }),
};

const seedParticipant = async (workspaceId: string) =>
  prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `guardian:${workspaceId}`,
      status: "active",
    },
  });

const prepareConfirmation = async (input: {
  workspaceId: string;
  participantId: string;
  commandRequestId: string;
  body: string;
}) =>
  issueHarnessConfirmation(contextService, {
    workspace_id: input.workspaceId,
    participant_id: input.participantId,
    surface: "chat",
    payload: {
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      command_request_id: input.commandRequestId,
      target_refs: {},
      expected_heads: {},
      input_integrity_tag: computeHarnessInputIntegrityTag(INTEGRITY_KEY, {
        body: input.body,
      }),
      integrity_tag_version: 1,
    },
  });

const executeWith = (input: {
  workspaceId: string;
  participantId: string;
  commandRequestId: string;
  confirmationRef: string;
  body: string;
  now?: () => Date;
}) =>
  runner.execute({
    workspace_id: input.workspaceId,
    invocation_request_id: `invocation:${input.commandRequestId}`,
    command_request_id: input.commandRequestId,
    business_actor_ref: input.participantId,
    payload: { body: input.body },
    spec: withHarnessConfirmation(testSpec, {
      confirmation_ref: input.confirmationRef,
      actor_participant_id: input.participantId,
      surface: "chat",
      command_request_id: input.commandRequestId,
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      integrity_key: INTEGRITY_KEY,
      ...(input.now ? { now: input.now } : {}),
    } satisfies HarnessConfirmationBinding),
  });

describe("Harness confirmation inside the command transaction", () => {
  it("consumes once, commits, and exact-replays without reconsuming", async () => {
    const workspaceId = `harness-${randomUUID()}`;
    const participant = await seedParticipant(workspaceId);
    const commandRequestId = `command:harness:${randomUUID()}`;
    const issued = await prepareConfirmation({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      body: "hello caregivers",
    });

    const first = await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      confirmationRef: issued.token,
      body: "hello caregivers",
    });
    expect(first).toMatchObject({
      status: "ok",
      disposition: "executed",
      business_outcome: "applied",
    });
    await expect(
      prisma.nurtureInteractionContext.findUniqueOrThrow({
        where: { id: issued.context_id },
      }),
    ).resolves.toMatchObject({ status: "consumed", version: 1 });

    const replay = await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      confirmationRef: issued.token,
      body: "hello caregivers",
    });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    if (first.status !== "ok" || replay.status !== "ok") throw new Error("unreachable");
    expect(replay.execution_ref).toEqual(first.execution_ref);
    await expect(
      prisma.nurtureInteractionContext.findUniqueOrThrow({
        where: { id: issued.context_id },
      }),
    ).resolves.toMatchObject({ version: 1 });
  });

  it("refuses a consumed confirmation for a new effect", async () => {
    const workspaceId = `harness-${randomUUID()}`;
    const participant = await seedParticipant(workspaceId);
    const firstCommand = `command:harness:${randomUUID()}`;
    const issued = await prepareConfirmation({
      workspaceId,
      participantId: participant.id,
      commandRequestId: firstCommand,
      body: "hello",
    });
    await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId: firstCommand,
      confirmationRef: issued.token,
      body: "hello",
    });

    const second = await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId: `command:harness:${randomUUID()}`,
      confirmationRef: issued.token,
      body: "hello",
    });
    expect(second).toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "confirmation_replayed",
    });
  });

  it("refuses drifted input and never consumes the confirmation", async () => {
    const workspaceId = `harness-${randomUUID()}`;
    const participant = await seedParticipant(workspaceId);
    const commandRequestId = `command:harness:${randomUUID()}`;
    const issued = await prepareConfirmation({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      body: "confirmed body",
    });

    const drifted = await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      confirmationRef: issued.token,
      body: "tampered body",
    });
    expect(drifted).toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "input_integrity_mismatch",
    });
    await expect(
      prisma.nurtureInteractionContext.findUniqueOrThrow({
        where: { id: issued.context_id },
      }),
    ).resolves.toMatchObject({ status: "active" });

    const recovered = await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      confirmationRef: issued.token,
      body: "confirmed body",
    });
    expect(recovered).toMatchObject({ status: "ok", disposition: "executed" });
  });

  it("refuses an expired confirmation with a reprepare conflict", async () => {
    const workspaceId = `harness-${randomUUID()}`;
    const participant = await seedParticipant(workspaceId);
    const commandRequestId = `command:harness:${randomUUID()}`;
    const issued = await prepareConfirmation({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      body: "hello",
    });

    const expired = await executeWith({
      workspaceId,
      participantId: participant.id,
      commandRequestId,
      confirmationRef: issued.token,
      body: "hello",
      now: () => new Date(Date.now() + 6 * 60_000),
    });
    expect(expired).toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "confirmation_expired",
    });
    await expect(
      prisma.nurtureCommandExecution.count({ where: { workspaceId } }),
    ).resolves.toBe(0);
  });

  it("refuses a cross-actor confirmation", async () => {
    const workspaceId = `harness-${randomUUID()}`;
    const owner = await seedParticipant(workspaceId);
    const other = await prisma.nurtureParticipant.create({
      data: {
        workspaceId,
        myChatUserId: `caregiver:${workspaceId}`,
        status: "active",
      },
    });
    const commandRequestId = `command:harness:${randomUUID()}`;
    const issued = await prepareConfirmation({
      workspaceId,
      participantId: owner.id,
      commandRequestId,
      body: "hello",
    });

    const crossActor = await executeWith({
      workspaceId,
      participantId: other.id,
      commandRequestId,
      confirmationRef: issued.token,
      body: "hello",
    });
    expect(crossActor).toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "invalid_confirmation",
    });
  });
});
