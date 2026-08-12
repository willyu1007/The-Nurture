import { generateKeyPairSync, randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaWorkflowRunReservationLifecycleRepository,
} from "@my-chat/db";
import {
  NURTURE_ENROLLMENT_JOURNEY_EXECUTE_OPERATION_V3,
  createSignedNurtureEnrollmentJourneyRunSettlementClient,
  createNurtureEnrollmentJourneyRunCoordinator,
  type VerifiedNurtureEnrollmentJourneyRunSettlementClientV3,
} from "@my-chat/scenario-integrations";
import {
  InMemoryAtomicScenarioNonceStore,
  signScenarioResponse,
  verifyScenarioInvocation,
  type ScenarioPrivateTransport,
} from "@my-chat/workflow-runtime";
import {
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS,
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1,
  createNurtureWorkflowRunSettlementOwner,
  createNurtureEnrollmentJourneyFormalInvocationHandlers,
  defaultNurtureEnrollmentJourneySurfaceDeps,
  NurtureCommandRunner,
  withNurtureWorkflowRunSettlementFinalizer,
  workflowRunSettlementBinding,
  type NurtureWorkflowRunSettlementOwnerV1,
} from "@the-nurture/scenario";
import {
  createPrismaClient as createNurturePrismaClient,
  PrismaNurtureCommandRepository,
  PrismaNurtureWorkflowRunSettlementRepository,
} from "../src/index.js";

const NURTURE_DATABASE_URL = process.env.X5_NURTURE_DATABASE_URL;
const MY_CHAT_DATABASE_URL = process.env.X5_MY_CHAT_DATABASE_URL;
if (!NURTURE_DATABASE_URL || !MY_CHAT_DATABASE_URL) {
  throw new Error(
    "X5_NURTURE_DATABASE_URL and X5_MY_CHAT_DATABASE_URL are required for the T-007/T-041 joint suite.",
  );
}

const nurture = createNurturePrismaClient(NURTURE_DATABASE_URL);
const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
const myChat = createMyChatPrismaClient();
if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = previousDatabaseUrl;

const BINDING = Object.freeze({
  scenario_key: "nurture",
  contract_hash: "a".repeat(64),
  capability_key: "start_enrollment_inquiry",
  entrypoint_key: "web_run_workbench",
  workflow_version_id: "nurture-enrollment-journey-v1",
});

type ProtocolMode =
  | "commit"
  | "commit_response_lost"
  | "no_effect_response_lost"
  | "unknown"
  | "writer_wins"
  | "no_effect_wins";
type ExecuteInput = Parameters<
  VerifiedNurtureEnrollmentJourneyRunSettlementClientV3["execute"]
>[0];
type StatusInput = Parameters<
  VerifiedNurtureEnrollmentJourneyRunSettlementClientV3["readStatus"]
>[0];
type NoEffectInput = Parameters<
  VerifiedNurtureEnrollmentJourneyRunSettlementClientV3["confirmNoEffect"]
>[0];

const workspaces = new Set<string>();

afterEach(async () => {
  for (const workspaceId of workspaces) {
    await nurture.nurtureWorkflowRunSettlement.deleteMany({
      where: { workspaceId },
    });
    await nurture.nurtureCommandExecution.deleteMany({
      where: { workspaceId },
    });
    await myChat.outboxEvent.deleteMany({ where: { workspaceId } });
    await myChat.workflowRun.deleteMany({ where: { workspaceId } });
    await myChat.workflowRunReservation.deleteMany({
      where: { workspaceId },
    });
  }
  workspaces.clear();
});

afterAll(async () => {
  await Promise.all([nurture.$disconnect(), myChat.$disconnect()]);
});

describe("T-007/T-041 two-database Workflow Run settlement", () => {
  it("accepts the exact signed My-Chat execute declaration at the Nurture formal ingress", async () => {
    const requestKeys = generateKeyPairSync("ed25519");
    const responseKeys = generateKeyPairSync("ed25519");
    const now = new Date("2026-08-12T09:00:00.000Z");
    const formalExecute = NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.execute;
    expect(NURTURE_ENROLLMENT_JOURNEY_EXECUTE_OPERATION_V3).toEqual({
      scenario_key: "nurture",
      endpoint_key: formalExecute.endpoint_key,
      method: formalExecute.method,
      ingress_category: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.ingress_category,
      ingress_key: formalExecute.ingress_key,
      principal_origin: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.principal_origin,
      operation_key: formalExecute.operation_key,
      input_schema_version: formalExecute.input_schema_version,
    });

    const handler = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
    })[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute];
    if (!handler) throw new Error("Nurture formal execute handler is absent");
    const nonceStore = new InMemoryAtomicScenarioNonceStore();
    const transport: ScenarioPrivateTransport = {
      async send(input) {
        const invocation = JSON.parse(Buffer.from(input.body).toString("utf8")) as unknown;
        const verified = await verifyScenarioInvocation({
          invocation,
          signature: input.signature,
          transport_credential_subject: "my-chat.scenario-runtime",
          trust_policies: [{
            issuer: "my-chat.host",
            assertion_audience: "nurture.scenario",
            caller_subject: "my-chat.scenario-runtime",
            credential_subject: "my-chat.scenario-runtime",
            key_id: "host-request-key-1",
            algorithm: "Ed25519",
            public_key: requestKeys.publicKey,
            declarations: [{
              scenario_key: "nurture",
              endpoint_key: formalExecute.endpoint_key,
              method: formalExecute.method,
              operation_key: formalExecute.operation_key,
              input_schema_version: formalExecute.input_schema_version,
              ingress_category:
                NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.ingress_category,
              ingress_key: formalExecute.ingress_key,
              principal_origins: [
                NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.principal_origin,
              ],
            }],
          }],
          nonce_store: nonceStore,
          now,
        });
        const result = await handler({
          invocation: verified.invocation,
          declaration: verified.declaration,
        });
        const body = Buffer.from(JSON.stringify(result), "utf8");
        return {
          status: 200,
          body,
          signature: signScenarioResponse({
            invocation: verified.invocation,
            response_status: 200,
            response_body: body,
            identity: {
              issuer: "nurture.scenario",
              assertion_audience: "my-chat.host",
              caller_subject: "my-chat.scenario-runtime",
              key_id: "nurture-response-key-1",
              algorithm: "Ed25519",
              private_key: responseKeys.privateKey,
              validity_ms: 30_000,
            },
            now,
          }),
          transport_credential_subject: "nurture.scenario-service",
        };
      },
    };
    const client = createSignedNurtureEnrollmentJourneyRunSettlementClient({
      contract_hash: "a".repeat(64),
      principal: {
        principal_version: 1,
        principal_kind: "human_user",
        account_ref: canonicalRef("user", "user-1"),
        actor_ref: canonicalRef("actor", "actor-1"),
        workspace_ref: canonicalRef("workspace", "workspace-1"),
        principal_origin: "interactive_session",
      },
      signing_identity: {
        issuer: "my-chat.host",
        assertion_audience: "nurture.scenario",
        caller_subject: "my-chat.scenario-runtime",
        key_id: "host-request-key-1",
        algorithm: "Ed25519",
        private_key: requestKeys.privateKey,
      },
      response_trust_policies: [{
        issuer: "nurture.scenario",
        assertion_audience: "my-chat.host",
        caller_subject: "my-chat.scenario-runtime",
        credential_subject: "nurture.scenario-service",
        key_id: "nurture-response-key-1",
        algorithm: "Ed25519",
        public_key: responseKeys.publicKey,
      }],
      transport,
      now: () => now,
      request_context: () => ({ correlation_id: "correlation-1" }),
    });

    await expect(client.execute({
      contractVersion: 3,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: reservationEvidence("signed-route"),
    })).resolves.toEqual({
      status: "unavailable",
      reason_code: "enrollment_journey_formal_ingress_unavailable",
    });
  });

  it("commits one Nurture execution before materializing one Host Run and body-free event", async () => {
    const request = protocolRequest("commit");
    const client = new DatabaseProtocolClient(request.workspace_id, "commit");
    const coordinator = createCoordinator(client);

    await expect(coordinator.execute(request)).resolves.toMatchObject({
      status: "confirmed",
      disposition: "settled",
      executable: true,
    });
    await expect(coordinator.execute(request)).resolves.toMatchObject({
      status: "confirmed",
      disposition: "replayed",
      executable: true,
    });

    expect(client.calls).toEqual({ execute: 1, confirmNoEffect: 0, readStatus: 1 });
    await expect(databaseState(request.workspace_id)).resolves.toMatchObject({
      host: {
        reservations: 1,
        runs: 1,
        createdEvents: 1,
        reservationState: "confirmed",
      },
      nurture: {
        settlements: 1,
        executions: 1,
        settlementState: "committed",
      },
    });
  });

  it("recovers an execute response loss through the writer-fenced committed history", async () => {
    const request = protocolRequest("commit-loss");
    const client = new DatabaseProtocolClient(
      request.workspace_id,
      "commit_response_lost",
    );

    await expect(createCoordinator(client).execute(request)).resolves.toMatchObject({
      status: "confirmed",
      executable: true,
    });
    expect(client.calls).toEqual({ execute: 1, confirmNoEffect: 1, readStatus: 1 });
    await expect(databaseState(request.workspace_id)).resolves.toMatchObject({
      host: { runs: 1, createdEvents: 1, reservationState: "confirmed" },
      nurture: { executions: 1, settlementState: "committed" },
    });
  });

  it("recovers a lost no-effect response from historical status without creating a Host Run", async () => {
    const request = protocolRequest("no-effect-loss");
    const client = new DatabaseProtocolClient(
      request.workspace_id,
      "no_effect_response_lost",
    );

    await expect(createCoordinator(client).execute(request)).resolves.toMatchObject({
      status: "abandoned",
      executable: false,
    });
    expect(client.calls).toEqual({ execute: 1, confirmNoEffect: 1, readStatus: 2 });
    await expect(databaseState(request.workspace_id)).resolves.toMatchObject({
      host: { runs: 0, createdEvents: 0, reservationState: "abandoned" },
      nurture: { executions: 0, settlementState: "confirmed_no_effect" },
    });
  });

  it("keeps an unresolved prepared settlement quarantined and non-executable", async () => {
    const request = protocolRequest("unknown");
    const client = new DatabaseProtocolClient(request.workspace_id, "unknown");

    await expect(createCoordinator(client).execute(request)).resolves.toEqual({
      status: "outcome_unknown",
      reason_code: "nurture_workflow_run_settlement_not_terminal",
      executable: false,
    });
    await expect(databaseState(request.workspace_id)).resolves.toMatchObject({
      host: { runs: 0, createdEvents: 0, reservationState: "reserved" },
      nurture: { executions: 0, settlementState: "prepared" },
    });
  });

  it("lets the command writer win the shared fence and denies concurrent no-effect", async () => {
    const request = protocolRequest("writer-wins");
    const client = new DatabaseProtocolClient(request.workspace_id, "writer_wins");
    const pending = createCoordinator(client).execute(request);
    await client.gate.started;

    const captured = client.requireExecuteInput();
    await expect(client.confirmNoEffect({
      contractVersion: 2,
      commandRequestId: captured.commandRequestId,
      confirmationRef: captured.confirmationRef,
      hostWorkflowRunReservation: captured.hostWorkflowRunReservation,
    })).resolves.toEqual({
      status: "unavailable",
      reason_code: "workflow_run_settlement_owner_unavailable",
    });
    client.gate.release();

    await expect(pending).resolves.toMatchObject({
      status: "confirmed",
      executable: true,
    });
    await expect(databaseState(request.workspace_id)).resolves.toMatchObject({
      host: { runs: 1, createdEvents: 1, reservationState: "confirmed" },
      nurture: { executions: 1, settlementState: "committed" },
    });
  });

  it("rolls the command execution back when writer-fenced no-effect wins first", async () => {
    const request = protocolRequest("no-effect-wins");
    const client = new DatabaseProtocolClient(
      request.workspace_id,
      "no_effect_wins",
    );
    const pending = createCoordinator(client).execute(request);
    await client.gate.started;

    const captured = client.requireExecuteInput();
    await expect(client.confirmNoEffect({
      contractVersion: 2,
      commandRequestId: captured.commandRequestId,
      confirmationRef: captured.confirmationRef,
      hostWorkflowRunReservation: captured.hostWorkflowRunReservation,
    })).resolves.toMatchObject({
      status: "confirmed_no_effect",
      outcome: "confirmed_no_effect",
    });
    client.gate.release();

    await expect(pending).resolves.toMatchObject({
      status: "abandoned",
      executable: false,
    });
    await expect(databaseState(request.workspace_id)).resolves.toMatchObject({
      host: { runs: 0, createdEvents: 0, reservationState: "abandoned" },
      nurture: { executions: 0, settlementState: "confirmed_no_effect" },
    });
  });
});

class DatabaseProtocolClient
implements VerifiedNurtureEnrollmentJourneyRunSettlementClientV3 {
  readonly calls = { execute: 0, confirmNoEffect: 0, readStatus: 0 };
  readonly gate = executionGate();
  private readonly owner: NurtureWorkflowRunSettlementOwnerV1;
  private executeInput: ExecuteInput | undefined;

  constructor(
    private readonly workspaceId: string,
    private readonly mode: ProtocolMode,
  ) {
    this.owner = createNurtureWorkflowRunSettlementOwner({
      repository: new PrismaNurtureWorkflowRunSettlementRepository(nurture),
    });
  }

  async execute(input: ExecuteInput): Promise<unknown> {
    this.calls.execute += 1;
    this.executeInput = input;
    if (input.confirmationRef !== expectedConfirmation(this.workspaceId)) {
      return { status: "denied", reason_code: "confirmation_mismatch" };
    }
    const registration = await this.owner.register(ownerRequest(
      this.workspaceId,
      input.commandRequestId,
      input.hostWorkflowRunReservation,
    ));
    if (registration.status !== "prepared") return registration;

    if (this.mode === "unknown") {
      throw new Error("qualification execute unavailable before command commit");
    }
    if (this.mode === "no_effect_response_lost") {
      return { status: "denied", reason_code: "qualification_precondition_denied" };
    }
    if (this.mode === "no_effect_wins") {
      this.gate.markStarted();
      await this.gate.mayContinue;
    }

    const binding = workflowRunSettlementBinding(ownerRequest(
      this.workspaceId,
      input.commandRequestId,
      input.hostWorkflowRunReservation,
    ));
    if (!binding) throw new Error("qualification settlement binding is invalid");
    const spec = withNurtureWorkflowRunSettlementFinalizer({
      command_key: "nurture.start_enrollment_inquiry",
      command_scope: "institution_enrollment_journey",
      contract_version: 1,
      canonicalize: () => ({}),
      checkPreconditions: async () => {
        if (this.mode === "writer_wins") {
          this.gate.markStarted();
          await this.gate.mayContinue;
        }
        return { status: "ready" as const };
      },
      apply: async () => ({ output_refs: [] }),
    }, binding);
    const command = await new NurtureCommandRunner(
      new PrismaNurtureCommandRepository(nurture),
    ).execute({
      workspace_id: this.workspaceId,
      invocation_request_id: `t007-joint-invocation-${randomUUID()}`,
      command_request_id: input.commandRequestId,
      business_actor_ref: "my-chat-host",
      payload: {},
      spec,
    });
    if (command.status !== "ok") return command;
    const terminal = await this.owner.readStatus(ownerRequest(
      this.workspaceId,
      input.commandRequestId,
      input.hostWorkflowRunReservation,
    ));
    if (this.mode === "commit_response_lost") {
      throw new Error("qualification execute response lost after commit");
    }
    return { status: "ok", workflow_run_settlement: terminal };
  }

  async readStatus(input: StatusInput): Promise<unknown> {
    this.calls.readStatus += 1;
    return this.owner.readStatus(ownerRequest(
      this.workspaceId,
      input.commandRequestId,
      input.hostWorkflowRunReservation,
    ));
  }

  async confirmNoEffect(input: NoEffectInput): Promise<unknown> {
    this.calls.confirmNoEffect += 1;
    if (this.mode === "unknown") {
      throw new Error("qualification no-effect fence unavailable");
    }
    if (input.confirmationRef !== expectedConfirmation(this.workspaceId)) {
      return { status: "denied", reason_code: "confirmation_mismatch" };
    }
    const terminal = await this.owner.confirmNoEffect(ownerRequest(
      this.workspaceId,
      input.commandRequestId,
      input.hostWorkflowRunReservation,
    ));
    if (this.mode === "no_effect_response_lost") {
      throw new Error("qualification no-effect response lost after settlement");
    }
    return terminal;
  }

  requireExecuteInput(): ExecuteInput {
    if (!this.executeInput) throw new Error("execute input was not captured");
    return this.executeInput;
  }
}

function createCoordinator(
  client: VerifiedNurtureEnrollmentJourneyRunSettlementClientV3,
) {
  return createNurtureEnrollmentJourneyRunCoordinator({
    repository: new PrismaWorkflowRunReservationLifecycleRepository(myChat),
    binding: BINDING,
    client,
  });
}

function protocolRequest(tag: string) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 20);
  const workspaceId = `t007-joint-${tag}-${suffix}`;
  workspaces.add(workspaceId);
  return {
    workspace_id: workspaceId,
    logical_operation_id: `logical-${suffix}`,
    command_request_id: `command-${suffix}`,
    confirmation_ref: expectedConfirmation(workspaceId),
  };
}

function expectedConfirmation(workspaceId: string): string {
  const seed = workspaceId.replaceAll(/[^A-Za-z0-9_-]/gu, "a");
  return `ejc1.${seed.padEnd(43, "a").slice(0, 43)}`;
}

function canonicalRef(objectType: string, objectId: string) {
  return {
    schema_version: 1 as const,
    namespace: "my_chat" as const,
    object_type: objectType,
    object_id: objectId,
  };
}

function reservationEvidence(tag: string): ExecuteInput["hostWorkflowRunReservation"] {
  return {
    evidence_version: 1,
    logical_operation_id: `logical-${tag}`,
    reservation_ref: {
      ...canonicalRef("workflow_run_reservation", `reservation-${tag}`),
      version: 1,
    },
    run_ref: canonicalRef("workflow_run", `run-${tag}`),
    binding_fingerprint_sha256: "b".repeat(64),
    reservation_evidence_sha256: "e".repeat(64),
  };
}

function ownerRequest(
  workspaceId: string,
  commandRequestId: string,
  hostReservation: ExecuteInput["hostWorkflowRunReservation"],
) {
  return {
    workspace_id: workspaceId,
    command_request_id: commandRequestId,
    host_reservation: hostReservation,
  };
}

function executionGate() {
  let markStarted!: () => void;
  let release!: () => void;
  const started = new Promise<void>((resolve) => { markStarted = resolve; });
  const mayContinue = new Promise<void>((resolve) => { release = resolve; });
  return { started, mayContinue, markStarted, release };
}

async function databaseState(workspaceId: string) {
  const [
    reservations,
    runs,
    createdEvents,
    settlements,
    executions,
  ] = await Promise.all([
    myChat.workflowRunReservation.findMany({ where: { workspaceId } }),
    myChat.workflowRun.count({ where: { workspaceId } }),
    myChat.outboxEvent.count({
      where: { workspaceId, eventType: "workflow.run.created" },
    }),
    nurture.nurtureWorkflowRunSettlement.findMany({ where: { workspaceId } }),
    nurture.nurtureCommandExecution.count({ where: { workspaceId } }),
  ]);
  return {
    host: {
      reservations: reservations.length,
      runs,
      createdEvents,
      reservationState: reservations[0]?.state,
    },
    nurture: {
      settlements: settlements.length,
      executions,
      settlementState: settlements[0]?.state,
    },
  };
}
