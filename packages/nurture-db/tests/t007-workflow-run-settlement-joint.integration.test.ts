import {
  createHash,
  generateKeyPairSync,
  randomUUID,
  type KeyObject,
} from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaNurtureProspectiveContactRepository,
  PrismaScenarioBindingPairRepository,
  PrismaWorkflowRunReservationLifecycleRepository,
} from "@my-chat/db";
import {
  createScenarioBindingReservationRequests,
  createScenarioCanonicalBindingPairRequest,
  type PreparedScenarioBindingPair,
} from "@my-chat/domain/child-identity";
import type {
  CanonicalRef,
  ScenarioHumanPrincipalV1,
  ScenarioOwnerBindingReservationResultV1,
  WorkflowTrustedInvocationHandlerRegistry,
} from "@my-chat/workflow-contracts";
import {
  NURTURE_ENROLLMENT_JOURNEY_EXECUTE_OPERATION_V3,
  NURTURE_ENROLLMENT_JOURNEY_PREPARE_OPERATION_V2,
  createNurtureEnrollmentContactOwner,
  createNurtureEnrollmentJourneyCurrentOwnerCarrierProducer,
  createSignedNurtureEnrollmentJourneyRunSettlementClient,
  createSignedNurtureEnrollmentJourneyCurrentOwnerCommandClient,
  createNurtureEnrollmentJourneyRunCoordinator,
  type NurtureEnrollmentContactOwnerV1,
  type NurtureEnrollmentJourneyCurrentOwnerCarrierProducerV1,
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
  acceptTrialOfferSpec,
  confirmIntentConversationSpec,
  createNurtureWorkflowRunSettlementOwner,
  createNurtureEnrollmentJourneyFormalInvocationHandlers,
  defaultNurtureEnrollmentJourneySurfaceDeps,
  issueTrialOfferSpec,
  NurtureCommandRunner,
  qualifyCapacityWaitlistSpec,
  recordExternalTouchpointSpec,
  startEnrollmentInquirySpec,
  withNurtureWorkflowRunSettlementFinalizer,
  workflowRunSettlementBinding,
  type InstitutionBusinessCommunicationReadPort,
  type NurtureCommandSpec,
  type NurtureWorkflowRunSettlementOwnerV1,
} from "@the-nurture/scenario";
import {
  bindPrismaNurtureEnrollmentJourneyFormalOwners,
  createAesGcmProtectedContentPort,
  createPrismaClient as createNurturePrismaClient,
  createPrismaNurtureEnrollmentJourneyFormalOwners,
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

  it("carries real My-Chat current owners through signed prepare and fresh execute", async () => {
    const now = new Date();
    const world = await seedSignedCurrentOwnerWorld(now);
    const pairRepository = new PrismaScenarioBindingPairRepository(myChat);
    const producer = createNurtureEnrollmentJourneyCurrentOwnerCarrierProducer({
      pairRepository,
      contactOwner: world.contactOwner,
      now: () => now,
    });
    const reads: InstitutionBusinessCommunicationReadPort = {
      loadInstitutionBusinessCommunication: async () => ({ authorized: false }),
    };
    const formalOwners = createPrismaNurtureEnrollmentJourneyFormalOwners({
      prisma: nurture,
      targetOptionIntegrityKey: "t007-joint-current-owner-option-key-0001",
      preparedCommandIntegrityKey: "t007-joint-current-owner-prepare-key-001",
      preparedCommandEncryptionSecret: "t007-joint-current-owner-encryption-key-01",
      messageRefIntegrityKey: "t007-joint-current-owner-message-key-0001",
      contactOwner: world.contactOwner,
      businessCommunicationReads: reads,
      protectedContent: createAesGcmProtectedContentPort({
        keyRef: "t007-joint-current-owner-protected-key",
        keyMaterial: "t007-joint-current-owner-protected-key-material-0001",
      }),
      now: () => now,
    });
    const moduleBinding = bindPrismaNurtureEnrollmentJourneyFormalOwners({
      formalOwners,
    });
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers(
      moduleBinding.enrollmentJourneyFormalOwnerBinding,
    );
    const requestKeys = generateKeyPairSync("ed25519");
    const responseKeys = generateKeyPairSync("ed25519");
    const client = createSignedNurtureEnrollmentJourneyCurrentOwnerCommandClient({
      contract_hash: "a".repeat(64),
      principal: world.adminPrincipal,
      signing_identity: {
        issuer: "my-chat.host",
        assertion_audience: "nurture.scenario",
        caller_subject: "my-chat.scenario-runtime",
        key_id: "host-current-owner-key-1",
        algorithm: "Ed25519",
        private_key: requestKeys.privateKey,
      },
      response_trust_policies: [{
        issuer: "nurture.scenario",
        assertion_audience: "my-chat.host",
        caller_subject: "my-chat.scenario-runtime",
        credential_subject: "nurture.scenario-service",
        key_id: "nurture-current-owner-key-1",
        algorithm: "Ed25519",
        public_key: responseKeys.publicKey,
      }],
      transport: signedCurrentOwnerTransport({
        handlers,
        requestPublicKey: requestKeys.publicKey,
        responsePrivateKey: responseKeys.privateKey,
        now,
      }),
      now: () => now,
      request_context: () => ({
        correlation_id: `correlation-${world.suffix}`,
        trace_id: `trace-${world.suffix}`,
      }),
    });
    const targetOptionRef = formalOwners.enrollmentJourneyOptionIssuer.issue({
      workspace_id: world.workspaceId,
      actor_participant_ref: world.adminParticipantId,
      kind: "journey",
      target_ref: world.workflowId,
      waitlist_entry_ref: world.entryId,
      waitlist_entry_head: world.entryHead,
    });
    if (!targetOptionRef) throw new Error("joint journey option was not issued");

    await expect(producer.issue({
      purpose_key: "enrollment_family_acceptance",
      identity_operation_id: world.identityOperationId,
      owner_actor_id: world.ownerActorId,
      workspace_id: world.workspaceId,
      institution_ref: world.institutionId,
      action: {
        actor_ref: canonicalRef("actor", world.ownerActorId),
        contact_ref: world.contactRef,
        action_ref: canonicalRef("enrollment_action", `foreground-${world.suffix}`),
        occurred_at: new Date(now.getTime() - 1_000).toISOString(),
      },
    })).resolves.toMatchObject({
      status: "resolved",
      carrier: {
        currentOwnerEvidence: {
          purpose_key: "enrollment_family_acceptance",
        },
        guardianAction: {
          contact_ref: world.contactRef,
        },
      },
    });

    const prepareCarrier = await resolvedTrialCarrier(producer, world);
    const prepared = asRecord(await client.prepare({
      contractVersion: 2,
      clientCommandId: `client-${world.suffix}`,
      request: {
        capabilityKey: "prepare_trial_relationship",
        capabilityVersion: "1.0.0",
        targetOptionRef,
        operationInput: {},
      },
      currentOwnerCarrier: prepareCarrier,
    }));
    expect(prepared).toMatchObject({
      status: "ready_to_confirm",
      effect: "prepare_trial_relationship",
    });
    if (
      typeof prepared.command_request_id !== "string" ||
      typeof prepared.confirmation_ref !== "string"
    ) throw new Error("joint prepare response was malformed");

    const executeCarrier = await resolvedTrialCarrier(producer, world);
    const executed = await client.execute({
      contractVersion: 3,
      commandRequestId: prepared.command_request_id,
      confirmationRef: prepared.confirmation_ref,
      currentOwnerCarrier: executeCarrier,
    });
    expect(executed).toMatchObject({
      status: "ok",
      disposition: "executed",
      result: {
        effect: "prepare_trial_relationship",
        workflowHead: world.workflowHead + 1,
      },
    });

    const [workflow, enrollments, grants, preparedRows] = await Promise.all([
      nurture.nurtureInstitutionWorkflow.findUniqueOrThrow({
        where: { id: world.workflowId },
      }),
      nurture.nurtureEnrollment.findMany({
        where: {
          workspaceId: world.workspaceId,
          childCareProcessId: world.childCareProcessId,
        },
      }),
      nurture.nurtureChildLinkGrant.findMany({
        where: { workspaceId: world.workspaceId },
      }),
      nurture.nurtureEnrollmentJourneyPreparedCommand.findMany({
        where: { workspaceId: world.workspaceId },
      }),
    ]);
    expect(workflow.childCareProcessId).toBe(world.childCareProcessId);
    expect(enrollments).toHaveLength(1);
    expect(grants).toHaveLength(1);
    expect(preparedRows).toHaveLength(1);
    const persistedPrepared = JSON.stringify(preparedRows);
    expect(persistedPrepared).not.toContain(
      prepareCarrier.currentOwnerEvidence.current_owner_evidence_hash,
    );
    expect(persistedPrepared).not.toContain(world.childOwnerRef);
    expect(persistedPrepared).not.toContain(world.familyOwnerRef);
    expect(JSON.stringify(await nurture.nurtureEnrollmentInquiry.findMany({
      where: { workspaceId: world.workspaceId },
    }))).not.toContain(world.rawContactValue);
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

type SignedCurrentOwnerWorld = Readonly<{
  suffix: string;
  workspaceId: string;
  institutionId: string;
  identityOperationId: string;
  ownerActorId: string;
  adminParticipantId: string;
  adminPrincipal: ScenarioHumanPrincipalV1;
  workflowId: string;
  workflowHead: number;
  entryId: string;
  entryHead: number;
  childCareProcessId: string;
  childOwnerRef: string;
  familyOwnerRef: string;
  rawContactValue: string;
  contactRef: CanonicalRef;
  contactOwner: NurtureEnrollmentContactOwnerV1;
}>;

async function seedSignedCurrentOwnerWorld(
  now: Date,
): Promise<SignedCurrentOwnerWorld> {
  const suffix = randomUUID().replaceAll("-", "");
  const workspaceId = `t007-owner-${suffix}`;
  const ownerUserId = `guardian-user-${suffix}`;
  const ownerActorId = `guardian-actor-${suffix}`;
  const childId = `child-${suffix}`;
  const familyId = `family-${suffix}`;
  const identityOperationId = `identity-operation-${suffix}`;
  const adminAccountId = `admin-account-${suffix}`;
  const adminActorId = `admin-actor-${suffix}`;
  const adminParticipantId = `admin-participant-${suffix}`;
  const guardianParticipantId = `guardian-participant-${suffix}`;
  const institutionId = `institution-${suffix}`;
  const adminRoleId = `admin-role-${suffix}`;
  const guardianRoleId = `guardian-role-${suffix}`;
  const careGroupId = `care-group-${suffix}`;
  const nurtureChildId = `nurture-child-${suffix}`;
  const childCareProcessId = `care-process-${suffix}`;
  const nurtureFamilyId = `nurture-family-${suffix}`;
  const childAnchorId = randomUUID();
  const familyAnchorId = randomUUID();
  const childOwnerRef = `nurture_child_binding_anchor_v1:${childAnchorId}`;
  const familyOwnerRef = `nurture_family_binding_anchor_v1:${familyAnchorId}`;
  const effectiveAt = new Date(now.getTime() - 24 * 60 * 60_000);
  const ownerExpiresAt = new Date(now.getTime() + 8 * 24 * 60 * 60_000);
  const policyExpiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60_000);
  const trialStartsAt = new Date(now.getTime() + 3 * 60 * 60_000);
  const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60_000);
  const reviewAt = new Date(trialEndsAt.getTime() - 24 * 60 * 60_000);
  const rawContactValue = `wx-private-${suffix}`;

  await myChat.user.create({ data: { id: ownerUserId } });
  await myChat.workspace.create({
    data: {
      id: workspaceId,
      createdByUserId: ownerUserId,
      type: "personal",
      name: "T-007 signed current-owner disposable workspace",
    },
  });
  await myChat.actor.create({
    data: {
      id: ownerActorId,
      actorType: "human_user",
      ownerUserId,
      defaultHumanUserId: ownerUserId,
      workspaceId,
      displayName: "T-007 guardian owner",
    },
  });
  await myChat.child.create({
    data: { id: childId, displayName: "T-007 child", createdByActorId: ownerActorId },
  });
  await myChat.family.create({
    data: { id: familyId, displayName: "T-007 family", createdByActorId: ownerActorId },
  });
  await myChat.childStewardship.create({
    data: {
      id: `child-stewardship-${suffix}`,
      childId,
      stewardActorId: ownerActorId,
      grantedByActorId: ownerActorId,
      authorityType: "guardian",
      effectiveAt,
    },
  });
  await myChat.familyStewardship.create({
    data: {
      id: `family-stewardship-${suffix}`,
      familyId,
      stewardActorId: ownerActorId,
      grantedByActorId: ownerActorId,
      authorityType: "guardian",
      effectiveAt,
    },
  });
  await myChat.familyMembership.create({
    data: {
      id: `family-membership-${suffix}`,
      familyId,
      actorId: ownerActorId,
      grantedByActorId: ownerActorId,
      membershipType: "parent",
      effectiveAt,
    },
  });
  await myChat.familyChildMembership.create({
    data: {
      id: `family-child-${suffix}`,
      familyId,
      childId,
      createdByActorId: ownerActorId,
      effectiveAt,
    },
  });
  await myChat.scenario.upsert({
    where: { scenarioKey: "nurture" },
    update: { status: "active" },
    create: {
      scenarioKey: "nurture",
      displayName: "Nurture",
      status: "active",
    },
  });
  const contactStore = new PrismaNurtureProspectiveContactRepository(
    myChat,
    () => now,
  );
  const contact = await contactStore.register({
    workspaceId,
    institutionScopeRef: institutionId,
    contactKind: "wechat",
    contactValue: rawContactValue,
    safeLabel: "Trial family contact",
  });
  const contactOwner = createNurtureEnrollmentContactOwner({ store: contactStore });
  const contactRef = {
    ...canonicalRef("nurture_prospective_contact", contact.id),
    version: contact.aggregateVersion,
  };
  const guardianActorRef = canonicalRef("actor", ownerActorId);

  await nurture.nurtureParticipant.createMany({
    data: [
      {
        id: adminParticipantId,
        workspaceId,
        myChatUserId: adminAccountId,
        status: "active",
      },
      {
        id: guardianParticipantId,
        workspaceId,
        myChatUserId: ownerUserId,
        status: "active",
      },
    ],
  });
  await nurture.nurtureParticipantPrincipalBinding.createMany({
    data: [
      {
        workspaceId,
        participantId: adminParticipantId,
        accountObjectId: adminAccountId,
        actorObjectId: adminActorId,
        status: "active",
      },
      {
        workspaceId,
        participantId: guardianParticipantId,
        accountObjectId: ownerUserId,
        actorObjectId: ownerActorId,
        status: "active",
      },
    ],
  });
  await nurture.nurtureCareInstitution.create({
    data: {
      id: institutionId,
      workspaceId,
      displayName: "T-007 signed current-owner institution",
      status: "active",
    },
  });
  await nurture.nurtureCareRoleAssignment.createMany({
    data: [
      {
        id: adminRoleId,
        workspaceId,
        participantId: adminParticipantId,
        role: "institution_admin",
        scopeType: "institution",
        scopeId: institutionId,
        status: "active",
      },
      {
        id: guardianRoleId,
        workspaceId,
        participantId: guardianParticipantId,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: childCareProcessId,
        status: "active",
        endsAt: ownerExpiresAt,
      },
    ],
  });
  await nurture.nurtureCareGroup.create({
    data: {
      id: careGroupId,
      workspaceId,
      institutionId,
      name: "T-007 trial group",
      capacity: 1,
      status: "active",
      aggregateVersion: 3,
    },
  });
  const occupyingChild = await nurture.nurtureChild.create({
    data: {
      workspaceId,
      displayName: "T-007 occupying child",
      status: "active",
    },
  });
  const occupyingProcess = await nurture.nurtureChildCareProcess.create({
    data: {
      workspaceId,
      childId: occupyingChild.id,
      status: "active",
    },
  });
  const occupyingEnrollment = await nurture.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: occupyingProcess.id,
      institutionId,
      careGroupId,
      status: "active",
      participationPhase: "formal",
    },
  });
  await nurture.nurtureChild.create({
    data: {
      id: nurtureChildId,
      workspaceId,
      displayName: "T-007 Nurture child",
      status: "active",
    },
  });
  await nurture.nurtureChildCareProcess.create({
    data: {
      id: childCareProcessId,
      workspaceId,
      childId: nurtureChildId,
      status: "active",
    },
  });
  await nurture.nurtureFamily.create({
    data: {
      id: nurtureFamilyId,
      workspaceId,
      childCareProcessId,
      displayName: "T-007 Nurture family",
      status: "active",
    },
  });
  await nurture.nurtureChildBindingAnchor.create({
    data: { id: childAnchorId, reservationKeyHash: digest(`child:${suffix}`), status: "associated" },
  });
  await nurture.nurtureFamilyBindingAnchor.create({
    data: { id: familyAnchorId, reservationKeyHash: digest(`family:${suffix}`), status: "associated" },
  });
  const childAssociation = await nurture.nurtureChildAnchorAssociation.create({
    data: { workspaceId, childAnchorId, childId: nurtureChildId },
  });
  await nurture.nurtureFamilyAnchorAssociation.create({
    data: {
      workspaceId,
      familyAnchorId,
      childAnchorId,
      childAssociationId: childAssociation.id,
      currentChildAssociationId: childAssociation.id,
      childId: nurtureChildId,
      childCareProcessId,
      familyId: nurtureFamilyId,
    },
  });
  for (const [subjectType, anchorId, ownerRef] of [
    ["child", childAnchorId, childOwnerRef],
    ["family", familyAnchorId, familyOwnerRef],
  ] as const) {
    await nurture.nurtureScenarioBindingAuthorization.create({
      data: {
        workspaceId,
        subjectType,
        ...(subjectType === "child"
          ? { childAnchorId: anchorId }
          : { familyAnchorId: anchorId }),
        ownerRef,
        ownerVersion: 1,
        idempotencyKeyHash: digest(`authorization:${subjectType}:${suffix}`),
        requestFingerprint: digest(`request:${subjectType}:${suffix}`),
        subjectEvidenceHash: digest(`subject:${subjectType}:${suffix}`),
        userEvidenceHash: digest(`user:${subjectType}:${suffix}`),
        actorEvidenceHash: digest(`actor:${subjectType}:${suffix}`),
        purpose: "scenario_binding_write",
        authorizationSourceRef: "my_chat_child_identity",
        authorizationSourceVersion: 1,
        status: "active",
        verifiedAt: effectiveAt,
        expiresAt: ownerExpiresAt,
      },
    });
  }
  await nurture.nurtureEnrollmentTrialGrantPolicy.create({
    data: {
      workspaceId,
      institutionId,
      contractVersion: "1.0.0",
      policyRef: `trial-policy-${suffix}`,
      policyRevision: 1,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["daily_care_log", "care_day_note"],
      purposes: ["trial_care"],
      effectiveFrom: effectiveAt,
      expiresAt: policyExpiresAt,
    },
  });
  const seedRunner = new NurtureCommandRunner(
    new PrismaNurtureCommandRepository(nurture, () => now),
  );
  const runSeedCommand = async <Payload>(input: {
    actorRef: string;
    payload: Payload;
    spec: NurtureCommandSpec<Payload>;
  }) => {
    const result = await seedRunner.execute({
      workspace_id: workspaceId,
      invocation_request_id: `seed-invocation-${randomUUID()}`,
      command_request_id: `seed-command-${randomUUID()}`,
      business_actor_ref: input.actorRef,
      payload: input.payload,
      spec: input.spec,
    });
    if (result.status !== "ok") {
      throw new Error(
        `${input.spec.command_key}:${result.status}:${result.reason_code}`,
      );
    }
  };
  await runSeedCommand({
    actorRef: adminParticipantId,
    payload: {
      workspace_id: workspaceId,
      institution_ref: institutionId,
      role_assignment_ref: adminRoleId,
      expected_workflow_head: 0,
      workflow_run_ref: canonicalRef("workflow_run", `run-${suffix}`),
      contact_owner_snapshot: {
        contract_version: "1.0.0" as const,
        contact_ref: contactRef,
        safe_label: "Trial family contact",
        verified_at: now.toISOString(),
      },
      preferred_label: "Trial family",
      age_band_key: "age_2_3",
      expected_entry_start_date: "2026-09-01",
      expected_entry_end_date: "2026-10-01",
      target_class_type_key: "toddler",
      target_age_band_key: "age_2_3",
      target_care_group_ref: careGroupId,
      care_schedule_need_keys: ["full_day"],
      source_channel: "walk_in",
      safety_label_keys: [],
      initial_contact_at: new Date(now.getTime() - 3 * 60 * 60_000).toISOString(),
      next_touchpoint_at: trialStartsAt.toISOString(),
    },
    spec: startEnrollmentInquirySpec,
  });
  const workflow = await nurture.nurtureInstitutionWorkflow.findFirstOrThrow({
    where: { workspaceId },
  });
  await runSeedCommand({
    actorRef: adminParticipantId,
    payload: {
      workspace_id: workspaceId,
      institution_ref: institutionId,
      workflow_ref: workflow.id,
      expected_workflow_head: 1,
      role_assignment_ref: adminRoleId,
      source_channel: "phone",
      confirmed_need_keys: ["weekday_care"],
      safety_label_keys: [],
      next_action_key: "confirm_intent",
      responsible_role: "institution_admin" as const,
      occurred_at: new Date(now.getTime() - 2 * 60 * 60_000).toISOString(),
      due_at: new Date(now.getTime() + 60 * 60_000).toISOString(),
      next_touchpoint_at: new Date(now.getTime() + 60 * 60_000).toISOString(),
      external_summary_body_envelope: {
        algVersion: 1,
        keyRef: "t007-joint-seed-summary-key",
        ciphertext: "c3VtbWFyeQ",
        integrityTag: "dGFn",
      },
    },
    spec: recordExternalTouchpointSpec,
  });
  await runSeedCommand({
    actorRef: adminParticipantId,
    payload: {
      workspace_id: workspaceId,
      institution_ref: institutionId,
      workflow_ref: workflow.id,
      expected_workflow_head: 2,
      role_assignment_ref: adminRoleId,
    },
    spec: confirmIntentConversationSpec,
  });
  const familyAcceptance = {
    contract_version: "1.0.0" as const,
    actor_ref: guardianActorRef,
    contact_ref: contactRef,
    action_ref: canonicalRef("enrollment_action", `qualify-${suffix}`),
    occurred_at: new Date(now.getTime() - 1_000).toISOString(),
    verified_at: now.toISOString(),
  };
  await runSeedCommand({
    actorRef: adminParticipantId,
    payload: {
      workspace_id: workspaceId,
      institution_ref: institutionId,
      workflow_ref: workflow.id,
      expected_workflow_head: 3,
      role_assignment_ref: adminRoleId,
      target_care_group_ref: careGroupId,
      expected_capacity_revision: 3,
      category_key: "standard",
      category_basis_key: "family_confirmed",
      next_review_at: new Date(now.getTime() + 24 * 60 * 60_000).toISOString(),
      family_acceptance_owner_snapshot: familyAcceptance,
    },
    spec: qualifyCapacityWaitlistSpec,
  });
  const entry = await nurture.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
    where: { workspaceId, workflowId: workflow.id },
  });
  await nurture.nurtureEnrollment.update({
    where: { id: occupyingEnrollment.id },
    data: { status: "ended", leftAt: now },
  });
  await runSeedCommand({
    actorRef: adminParticipantId,
    payload: {
      workspace_id: workspaceId,
      institution_ref: institutionId,
      workflow_ref: workflow.id,
      expected_workflow_head: 4,
      role_assignment_ref: adminRoleId,
      entry_ref: entry.id,
      expected_entry_head: 1,
      expires_at: new Date(now.getTime() + 2 * 60 * 60_000).toISOString(),
      trial_starts_at: trialStartsAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      review_at: reviewAt.toISOString(),
      reason_key: "admin_issued_trial_offer",
    },
    spec: issueTrialOfferSpec,
  });
  const offer = await nurture.nurtureEnrollmentTrialOffer.findFirstOrThrow({
    where: { workspaceId, workflowId: workflow.id },
  });
  await runSeedCommand({
    actorRef: ownerActorId,
    payload: {
      workspace_id: workspaceId,
      institution_ref: institutionId,
      workflow_ref: workflow.id,
      expected_workflow_head: 5,
      entry_ref: entry.id,
      expected_entry_head: 2,
      offer_ref: offer.id,
      expected_offer_head: 1,
      guardian_action_owner_snapshot: {
        ...familyAcceptance,
        action_ref: canonicalRef("enrollment_action", `accept-${suffix}`),
        occurred_at: now.toISOString(),
      },
    },
    spec: acceptTrialOfferSpec,
  });
  const [currentWorkflow, currentEntry] = await Promise.all([
    nurture.nurtureInstitutionWorkflow.findUniqueOrThrow({
      where: { id: workflow.id },
    }),
    nurture.nurtureEnrollmentWaitlistEntry.findUniqueOrThrow({
      where: { id: entry.id },
    }),
  ]);
  const workflowId = currentWorkflow.id;
  const workflowHead = currentWorkflow.workflowHead;
  const entryId = currentEntry.id;
  const entryHead = currentEntry.entryHead;

  const pairRepository = new PrismaScenarioBindingPairRepository(myChat);
  const prepared = await pairRepository.prepareBindingPair({
    identityOperationId,
    workspaceId,
    userId: ownerUserId,
    actorId: ownerActorId,
    childId,
    familyId,
    scenarioKey: "nurture",
    continuationContextHash: digest(`continuation:${suffix}`),
    idempotencyKey: `idempotency-${suffix}`,
    correlationId: `correlation-${suffix}`,
  });
  await pairRepository.commitBindingPair(
    signedOwnerPairInput(prepared, childOwnerRef, familyOwnerRef, suffix),
  );

  return {
    suffix,
    workspaceId,
    institutionId,
    identityOperationId,
    ownerActorId,
    adminParticipantId,
    adminPrincipal: {
      principal_version: 1,
      principal_kind: "human_user",
      account_ref: canonicalRef("user", adminAccountId),
      actor_ref: canonicalRef("actor", adminActorId),
      workspace_ref: canonicalRef("workspace", workspaceId),
      principal_origin: "interactive_session",
    },
    workflowId,
    workflowHead,
    entryId,
    entryHead,
    childCareProcessId,
    childOwnerRef,
    familyOwnerRef,
    rawContactValue,
    contactRef,
    contactOwner,
  };
}

function signedOwnerPairInput(
  prepared: PreparedScenarioBindingPair,
  childOwnerRef: string,
  familyOwnerRef: string,
  suffix: string,
) {
  const requests = createScenarioBindingReservationRequests(prepared);
  const reservations = requests.map((request, index) => {
    const slot = index === 0 ? "child" : "family";
    const ownerRef = slot === "child" ? childOwnerRef : familyOwnerRef;
    return {
      reservation_result_version: 1,
      identity_operation_id: request.identity_operation_id,
      disposition: "reserved",
      owner_binding: {
        owner_binding_ref_version: 1,
        binding_slot: slot,
        owner_ref: {
          schema_version: 1,
          namespace: "scenario-owner",
          object_type: `${slot}_binding_owner`,
          object_id: ownerRef,
          version: 1,
        },
      },
      reservation_version: 1,
      reservation_evidence_hash: digest(`reservation:${slot}:${suffix}`),
    } satisfies ScenarioOwnerBindingReservationResultV1;
  }) as [
    ScenarioOwnerBindingReservationResultV1,
    ScenarioOwnerBindingReservationResultV1,
  ];
  return {
    prepared,
    reservations,
    pairRequest: createScenarioCanonicalBindingPairRequest(prepared, reservations),
  };
}

function signedCurrentOwnerTransport(input: {
  handlers: WorkflowTrustedInvocationHandlerRegistry;
  requestPublicKey: KeyObject;
  responsePrivateKey: KeyObject;
  now: Date;
}): ScenarioPrivateTransport {
  const nonceStore = new InMemoryAtomicScenarioNonceStore();
  const declarations = [
    NURTURE_ENROLLMENT_JOURNEY_PREPARE_OPERATION_V2,
    NURTURE_ENROLLMENT_JOURNEY_EXECUTE_OPERATION_V3,
  ];
  return {
    async send(request) {
      const invocation = JSON.parse(
        Buffer.from(request.body).toString("utf8"),
      ) as unknown;
      const verified = await verifyScenarioInvocation({
        invocation,
        signature: request.signature,
        transport_credential_subject: "my-chat.scenario-runtime",
        trust_policies: [{
          issuer: "my-chat.host",
          assertion_audience: "nurture.scenario",
          caller_subject: "my-chat.scenario-runtime",
          credential_subject: "my-chat.scenario-runtime",
          key_id: "host-current-owner-key-1",
          algorithm: "Ed25519",
          public_key: input.requestPublicKey,
          declarations: declarations.map((declaration) => ({
            scenario_key: declaration.scenario_key,
            endpoint_key: declaration.endpoint_key,
            method: declaration.method,
            operation_key: declaration.operation_key,
            input_schema_version: declaration.input_schema_version,
            ingress_category: declaration.ingress_category,
            ingress_key: declaration.ingress_key,
            principal_origins: [declaration.principal_origin],
          })),
        }],
        nonce_store: nonceStore,
        now: input.now,
      });
      const handlerKey = verified.declaration.operation_key ===
          NURTURE_ENROLLMENT_JOURNEY_PREPARE_OPERATION_V2.operation_key
        ? NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.prepare
        : NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute;
      const handler = input.handlers[handlerKey];
      if (!handler) throw new Error(`formal handler ${handlerKey} is absent`);
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
            key_id: "nurture-current-owner-key-1",
            algorithm: "Ed25519",
            private_key: input.responsePrivateKey,
            validity_ms: 30_000,
          },
          now: input.now,
        }),
        transport_credential_subject: "nurture.scenario-service",
      };
    },
  };
}

async function resolvedTrialCarrier(
  producer: NurtureEnrollmentJourneyCurrentOwnerCarrierProducerV1,
  world: SignedCurrentOwnerWorld,
) {
  const resolved = await producer.issue({
    purpose_key: "enrollment_trial_pair",
    identity_operation_id: world.identityOperationId,
    owner_actor_id: world.ownerActorId,
    evidence_lifetime_ms: 30_000,
  });
  if (
    resolved.status !== "resolved" ||
    resolved.carrier.currentOwnerEvidence.purpose_key !== "enrollment_trial_pair"
  ) throw new Error(`Host current-owner carrier failed:${JSON.stringify(resolved)}`);
  return resolved.carrier;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an object result");
  }
  return value as Record<string, unknown>;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
