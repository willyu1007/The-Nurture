import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaFamilyGrowthParentContextRepository,
  PrismaFamilyNurtureAuthorizationRepository,
} from "@my-chat/db";
import type {
  CommitFamilyNurtureAuthorizationInput,
  FamilyNurtureAuthorizationRepository,
} from "@my-chat/domain/family-growth";
import {
  NURTURE_FAMILY_SHARING_ELIGIBILITY_CONTRACT,
  createPinnedNurtureFamilySharingEligibilityOwner,
  type NurtureFamilySharingEligibilityPrivateRequestV1,
} from "@my-chat/scenario-integrations";
import {
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  NurtureFamilySharingCleanupOwner,
  readFamilySharingEligibility,
  type NurtureFamilySharingCurrentAuthorityReadInputV1,
} from "@the-nurture/scenario";
import {
  FamilyNurtureAuthorizationService,
  HmacFamilyNurtureAuthorizationCodec,
} from "@my-chat/api/family-nurture-authorization";
import {
  createPrismaClient as createNurturePrismaClient,
  PrismaNurtureFamilySharingCleanupLedger,
  PrismaNurtureFamilySharingCurrentAuthorityRepository,
} from "../src/index.js";
import {
  T010_EVALUATED_AT,
  removeT010FamilySharingFixture,
  seedT010FamilySharingFixture,
  t010CleanupRequest,
  t010CurrentAuthorityInput,
  type T010FamilySharingFixture,
} from "./helpers/t010-family-sharing-fixture.js";

const NURTURE_DATABASE_URL = process.env.X5_NURTURE_DATABASE_URL;
const MY_CHAT_DATABASE_URL = process.env.X5_MY_CHAT_DATABASE_URL;
if (!NURTURE_DATABASE_URL || !MY_CHAT_DATABASE_URL) {
  throw new Error("X5_NURTURE_DATABASE_URL and X5_MY_CHAT_DATABASE_URL are required for the T-010 joint suite.");
}

const nurture = createNurturePrismaClient(NURTURE_DATABASE_URL);
const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
const myChat = createMyChatPrismaClient();
if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = previousDatabaseUrl;

const COMMAND_NOW = new Date(T010_EVALUATED_AT);
const CONFIRM_NOW = new Date(COMMAND_NOW.getTime() + 1_000);

type PreparedAuthorization = Readonly<{
  confirmationRef: string;
  contextVersion: string;
  presentationVersion: string;
}>;

type MyChatFixture = Readonly<{
  actorId: string;
  childId: string;
  familyId: string;
  membershipId: string;
  stewardshipId: string;
}>;

let nurtureFixture: T010FamilySharingFixture;
let myChatFixture: MyChatFixture;

beforeEach(async () => {
  nurtureFixture = await nurture.$transaction((transaction) => seedT010FamilySharingFixture(transaction, "t010-joint"));
  myChatFixture = await seedMyChatFixture();
});

afterEach(async () => {
  await cleanupMyChatFixture(myChatFixture, nurtureFixture.workspaceId);
  await removeT010FamilySharingFixture(nurture, nurtureFixture);
});

afterAll(async () => {
  await Promise.all([nurture.$disconnect(), myChat.$disconnect()]);
});

describe("T-010 My-Chat/Nurture two-database authorization conformance", () => {
  it("grants from fresh Nurture authority and exact-replays without rereading the owner", async () => {
    const transport = new JointEligibilityTransport(nurtureFixture, myChatFixture);
    const service = createService(transport);
    const prepared = await prepareMedia(service, "t010-joint-grant");

    const confirmed = await service.confirm(context(), confirmRequest(prepared, "t010-joint-grant"), () => CONFIRM_NOW);
    expect(confirmed).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "shared",
      receipt: { category_key: "media", effective_state: "shared" },
    });
    expect(transport.calls).toBe(3);

    await expect(
      service.confirm(
        context(),
        confirmRequest(prepared, "t010-joint-grant"),
        () => new Date(COMMAND_NOW.getTime() + 10 * 60_000),
      ),
    ).resolves.toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      business_outcome: "shared",
    });
    expect(transport.calls).toBe(3);
    await expect(
      myChat.familyNurtureAuthorizationReceipt.count({
        where: { authorization: { familyId: myChatFixture.familyId } },
      }),
    ).resolves.toBe(1);
  });

  it("refuses a grant when Nurture authority changes after prepare", async () => {
    const transport = new JointEligibilityTransport(nurtureFixture, myChatFixture);
    const service = createService(transport);
    const prepared = await prepareMedia(service, "t010-joint-stale-authority");

    await nurture.nurtureFamilySharingAuthority.updateMany({
      where: {
        workspaceId: nurtureFixture.workspaceId,
        category: "media",
      },
      data: { authorityVersion: { increment: 1 } },
    });

    await expect(
      service.confirm(context(), confirmRequest(prepared, "t010-joint-stale-authority"), () => CONFIRM_NOW),
    ).resolves.toEqual({
      contract_version: 1,
      status: "not_committed",
      decision: "access_changed",
      recovery: "refresh",
    });
    await expect(
      myChat.familyNurtureAuthorization.count({
        where: { familyId: myChatFixture.familyId },
      }),
    ).resolves.toBe(0);
  });

  it("keeps provider outage retryable and creates no authorization fact", async () => {
    const transport = new JointEligibilityTransport(nurtureFixture, myChatFixture);
    const service = createService(transport);
    const prepared = await prepareMedia(service, "t010-joint-owner-outage");
    transport.available = false;

    await expect(
      service.confirm(context(), confirmRequest(prepared, "t010-joint-owner-outage"), () => CONFIRM_NOW),
    ).resolves.toEqual({
      contract_version: 1,
      status: "not_committed",
      decision: "provider_unavailable",
      recovery: "retry",
    });
    await expect(
      myChat.familyNurtureAuthorization.count({
        where: { familyId: myChatFixture.familyId },
      }),
    ).resolves.toBe(0);
  });

  it("reconciles a lost commit response from outcome-unknown to exact replay", async () => {
    const transport = new JointEligibilityTransport(nurtureFixture, myChatFixture);
    const realRepository = new PrismaFamilyNurtureAuthorizationRepository(myChat);
    const service = createService(transport, new LoseFirstCommitResponseRepository(realRepository));
    const prepared = await prepareMedia(service, "t010-joint-response-loss");
    const request = confirmRequest(prepared, "t010-joint-response-loss");

    await expect(service.confirm(context(), request, () => CONFIRM_NOW)).resolves.toEqual({
      contract_version: 1,
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
    });
    await expect(service.confirm(context(), request, () => CONFIRM_NOW)).resolves.toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      business_outcome: "shared",
    });
    await expect(
      myChat.familyNurtureAuthorizationReceipt.count({
        where: { authorization: { familyId: myChatFixture.familyId } },
      }),
    ).resolves.toBe(1);
    await expect(
      myChat.outboxEvent.count({
        where: {
          workspaceId: nurtureFixture.workspaceId,
          eventType: "family_growth.nurture_authorization.changed",
        },
      }),
    ).resolves.toBe(1);
  });

  it("withdraws during owner outage and drives one replay-safe Nurture cleanup", async () => {
    const transport = new JointEligibilityTransport(nurtureFixture, myChatFixture);
    const service = createService(transport);
    const grant = await prepareMedia(service, "t010-joint-withdraw-grant");
    await service.confirm(context(), confirmRequest(grant, "t010-joint-withdraw-grant"), () => CONFIRM_NOW);

    const presentation = await service.query(context(), scopeRequest());
    const media = requireMediaChange(presentation);
    expect(media.decision).toBe("withdraw");
    const ownerCallsBeforeWithdrawal = transport.calls;
    transport.available = false;
    const prepared = await service.prepare(
      context(),
      {
        ...scopeRequest(),
        contract_version: 1,
        purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
        context_version: await contextVersion(),
        presentation_version: presentation.presentation_version,
        intent_ref: media.intent_ref,
        client_command_id: "t010-joint-withdraw",
      },
      () => COMMAND_NOW,
    );
    expect(prepared.status).toBe("ready_to_confirm");
    if (prepared.status !== "ready_to_confirm") return;

    const withdrawn = await service.confirm(
      context(),
      confirmRequest(
        {
          confirmationRef: prepared.confirmation_ref,
          contextVersion: await contextVersion(),
          presentationVersion: presentation.presentation_version,
        },
        "t010-joint-withdraw",
      ),
      () => CONFIRM_NOW,
    );
    expect(withdrawn).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "not_shared",
      receipt: { category_key: "media", effective_state: "not_shared" },
    });
    expect(transport.calls).toBe(ownerCallsBeforeWithdrawal);

    const event = await myChat.outboxEvent.findFirstOrThrow({
      where: {
        workspaceId: nurtureFixture.workspaceId,
        eventType: "family_growth.nurture_authorization.withdrawal_cleanup_requested",
      },
    });
    const cleanupEvent = parseCleanupEvent(event.payload);
    expect(cleanupEvent).toMatchObject({
      category: "media",
      decision: "withdrawn",
      effective_state: "not_shared",
    });
    expect(cleanupEvent.cleanup_targets).toContain("nurture_access");

    const purge = vi.fn(async () => ({
      store_ref: "t010.joint.derived-store",
      store_version: 1,
      disposition: "purged" as const,
    }));
    const cleanupOwner = new NurtureFamilySharingCleanupOwner(
      new PrismaNurtureFamilySharingCleanupLedger(nurture),
      [{ store_ref: "t010.joint.derived-store", purge }],
      () => CONFIRM_NOW,
    );
    const cleanupRequest = t010CleanupRequest(nurtureFixture, event.idempotencyKey, [cleanupEvent.category]);

    // Deliberately discard the first response to model worker response loss.
    await cleanupOwner.cleanup({
      invocation_request_ref: `t010-joint-cleanup-${randomUUID()}`,
      service_ref: "my-chat-family-sharing-runtime",
      request: cleanupRequest,
    });
    await expect(
      cleanupOwner.cleanup({
        invocation_request_ref: `t010-joint-cleanup-${randomUUID()}`,
        service_ref: "my-chat-family-sharing-runtime",
        request: cleanupRequest,
      }),
    ).resolves.toMatchObject({
      status: "cleaned",
      disposition: "replayed",
      cleanup_command_ref: event.idempotencyKey,
      categories: ["media"],
      purged_store_count: 1,
    });
    expect(purge).toHaveBeenCalledOnce();
    await expect(
      nurture.nurtureCommandExecution.count({
        where: {
          workspaceId: nurtureFixture.workspaceId,
          commandKey: "cleanup_family_sharing_withdrawal",
        },
      }),
    ).resolves.toBe(1);
    await expect(
      Promise.all([
        nurture.nurtureChild.count({ where: { id: nurtureFixture.childId } }),
        nurture.nurtureFamily.count({ where: { id: nurtureFixture.familyId } }),
        nurture.nurtureEnrollment.count({
          where: { id: nurtureFixture.enrollmentId },
        }),
      ]),
    ).resolves.toEqual([1, 1, 1]);
  });
});

class JointEligibilityTransport {
  available = true;
  calls = 0;

  constructor(
    private readonly fixture: T010FamilySharingFixture,
    private readonly hostFixture: MyChatFixture,
  ) {}

  async resolveCurrentEligibility(request: NurtureFamilySharingEligibilityPrivateRequestV1): Promise<unknown> {
    this.calls += 1;
    if (!this.available) throw new Error("qualification provider outage");
    if (
      request.workspace_id !== this.fixture.workspaceId ||
      request.my_chat_user_id !== this.fixture.myChatUserId ||
      request.parent_context_ref !== this.hostFixture.membershipId ||
      request.purpose !== NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE ||
      request.interface_contract.key !== NURTURE_FAMILY_SHARING_ELIGIBILITY_CONTRACT.key ||
      request.interface_contract.version !== NURTURE_FAMILY_SHARING_ELIGIBILITY_CONTRACT.version ||
      request.interface_contract.digest !== NURTURE_FAMILY_SHARING_ELIGIBILITY_CONTRACT.digest
    ) {
      throw new Error("qualification transport invariant mismatch");
    }
    const authorityInput = t010CurrentAuthorityInput(this.fixture);
    return readFamilySharingEligibility({
      authority: new PrismaNurtureFamilySharingCurrentAuthorityRepository(nurture),
      service_principal: authorityInput.principal,
      request: eligibilityRequest(authorityInput),
      local_pair: authorityInput.local_pair,
      evaluated_at: authorityInput.evaluated_at,
    });
  }
}

class LoseFirstCommitResponseRepository implements FamilyNurtureAuthorizationRepository {
  private loseNextResponse = true;

  constructor(private readonly delegate: FamilyNurtureAuthorizationRepository) {}

  readCurrent: FamilyNurtureAuthorizationRepository["readCurrent"] = (input) => this.delegate.readCurrent(input);

  findCommitted: FamilyNurtureAuthorizationRepository["findCommitted"] = (input) => this.delegate.findCommitted(input);

  async commit(input: CommitFamilyNurtureAuthorizationInput) {
    const result = await this.delegate.commit(input);
    if (this.loseNextResponse) {
      this.loseNextResponse = false;
      throw new Error("qualification response lost after commit");
    }
    return result;
  }
}

function createService(
  transport: JointEligibilityTransport,
  repository: FamilyNurtureAuthorizationRepository = new PrismaFamilyNurtureAuthorizationRepository(myChat),
): FamilyNurtureAuthorizationService {
  return new FamilyNurtureAuthorizationService(
    new PrismaFamilyGrowthParentContextRepository(myChat),
    repository,
    createPinnedNurtureFamilySharingEligibilityOwner(transport),
    new HmacFamilyNurtureAuthorizationCodec("t010-joint-codec-key-".repeat(4)),
  );
}

async function prepareMedia(
  service: FamilyNurtureAuthorizationService,
  clientCommandId: string,
): Promise<PreparedAuthorization> {
  const presentation = await service.query(context(), scopeRequest());
  const media = requireMediaChange(presentation);
  expect(media.decision).toBe("accept");
  const currentContextVersion = await contextVersion();
  const prepared = await service.prepare(
    context(),
    {
      ...scopeRequest(),
      contract_version: 1,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      context_version: currentContextVersion,
      presentation_version: presentation.presentation_version,
      intent_ref: media.intent_ref,
      client_command_id: clientCommandId,
    },
    () => COMMAND_NOW,
  );
  expect(prepared.status).toBe("ready_to_confirm");
  if (prepared.status !== "ready_to_confirm") {
    throw new Error("qualification prepare unexpectedly refused");
  }
  return {
    confirmationRef: prepared.confirmation_ref,
    contextVersion: currentContextVersion,
    presentationVersion: presentation.presentation_version,
  };
}

function confirmRequest(prepared: PreparedAuthorization, clientCommandId: string) {
  return {
    ...scopeRequest(),
    contract_version: 1 as const,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    context_version: prepared.contextVersion,
    presentation_version: prepared.presentationVersion,
    confirmation_ref: prepared.confirmationRef,
    client_command_id: clientCommandId,
  };
}

function requireMediaChange(presentation: Awaited<ReturnType<FamilyNurtureAuthorizationService["query"]>>) {
  const media = presentation.categories.find((category) => category.category_key === "media");
  if (!media || media.change.kind !== "available") {
    throw new Error("qualification media change is unavailable");
  }
  return media.change;
}

function eligibilityRequest(input: NurtureFamilySharingCurrentAuthorityReadInputV1) {
  return {
    interface_contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    pair_evidence: {
      evidence_ref: input.pair_evidence.evidence_ref,
      evidence_version: input.pair_evidence.evidence_version,
      verified_at: input.pair_evidence.verified_at,
      expires_at: input.pair_evidence.expires_at,
      child_anchor_ref: input.pair_evidence.child_anchor_ref,
      child_owner_version: input.pair_evidence.child_owner_version,
      family_anchor_ref: input.pair_evidence.family_anchor_ref,
      family_owner_version: input.pair_evidence.family_owner_version,
      my_chat_family_lifecycle: input.pair_evidence.my_chat_family_lifecycle,
    },
    target: {
      pair_evidence_ref: input.target.pair_evidence_ref,
      pair_evidence_version: input.target.pair_evidence_version,
      target_kind: "enrollment" as const,
      enrollment_ref: input.target.enrollment_ref,
      enrollment_revision: input.target.enrollment_revision,
    },
  };
}

function context() {
  return {
    userId: nurtureFixture.myChatUserId,
    actorId: myChatFixture.actorId,
    workspaceId: nurtureFixture.workspaceId,
    correlationId: `t010-joint-request-${nurtureFixture.runId}`,
    causationId: undefined,
    traceId: `t010-joint-trace-${nurtureFixture.runId}`,
  };
}

function scopeRequest() {
  return {
    familyId: myChatFixture.familyId,
    childId: myChatFixture.childId,
  };
}

async function contextVersion(): Promise<string> {
  const scope = await new PrismaFamilyGrowthParentContextRepository(myChat).resolveCurrentCommandScope({
    viewerActorId: myChatFixture.actorId,
    familyId: myChatFixture.familyId,
    childId: myChatFixture.childId,
  });
  return scope.contextVersion;
}

async function seedMyChatFixture(): Promise<MyChatFixture> {
  const run = randomUUID();
  const fixture = {
    actorId: `t010-joint-actor-${run}`,
    childId: `t010-joint-child-${run}`,
    familyId: `t010-joint-family-${run}`,
    membershipId: `t010-joint-membership-${run}`,
    stewardshipId: `t010-joint-stewardship-${run}`,
  } satisfies MyChatFixture;
  await myChat.actor.create({
    data: {
      id: fixture.actorId,
      actorType: "human_user",
      displayName: "T010 joint guardian",
    },
  });
  await Promise.all([
    myChat.child.create({
      data: {
        id: fixture.childId,
        displayName: "T010 joint child",
        createdByActorId: fixture.actorId,
      },
    }),
    myChat.family.create({
      data: {
        id: fixture.familyId,
        displayName: "T010 joint family",
        createdByActorId: fixture.actorId,
      },
    }),
  ]);
  await myChat.familyChildMembership.create({
    data: {
      id: fixture.membershipId,
      familyId: fixture.familyId,
      childId: fixture.childId,
      createdByActorId: fixture.actorId,
    },
  });
  await myChat.familyStewardship.create({
    data: {
      id: fixture.stewardshipId,
      familyId: fixture.familyId,
      stewardActorId: fixture.actorId,
      grantedByActorId: fixture.actorId,
      authorityType: "guardian",
    },
  });
  return fixture;
}

async function cleanupMyChatFixture(fixture: MyChatFixture, workspaceId: string): Promise<void> {
  await myChat.outboxEvent.deleteMany({ where: { workspaceId } });
  const authorizations = await myChat.familyNurtureAuthorization.findMany({
    where: { familyId: fixture.familyId },
    select: { id: true },
  });
  const authorizationIds = authorizations.map((item) => item.id);
  await myChat.familyNurtureAuthorizationReceipt.deleteMany({
    where: { authorizationId: { in: authorizationIds } },
  });
  await myChat.familyNurtureAuthorizationCommand.deleteMany({
    where: { authorizationId: { in: authorizationIds } },
  });
  await myChat.familyNurtureAuthorization.deleteMany({
    where: { id: { in: authorizationIds } },
  });
  await myChat.familyChildMembership.deleteMany({
    where: { id: fixture.membershipId },
  });
  await myChat.familyStewardship.deleteMany({
    where: { id: fixture.stewardshipId },
  });
  await myChat.family.deleteMany({ where: { id: fixture.familyId } });
  await myChat.child.deleteMany({ where: { id: fixture.childId } });
  await myChat.actor.deleteMany({ where: { id: fixture.actorId } });
}

function parseCleanupEvent(value: unknown): Readonly<{
  category: "media" | "focus_collaboration";
  decision: "withdrawn";
  effective_state: "not_shared";
  cleanup_targets: readonly string[];
}> {
  if (typeof value !== "object" || value === null) {
    throw new Error("withdrawal cleanup outbox payload is invalid");
  }
  const record = value as Record<string, unknown>;
  if (
    (record.category !== "media" && record.category !== "focus_collaboration") ||
    record.decision !== "withdrawn" ||
    record.effective_state !== "not_shared" ||
    !Array.isArray(record.cleanup_targets) ||
    record.cleanup_targets.some((item: unknown) => typeof item !== "string")
  )
    throw new Error("withdrawal cleanup outbox payload is invalid");
  return {
    category: record.category,
    decision: record.decision,
    effective_state: record.effective_state,
    cleanup_targets: record.cleanup_targets,
  };
}
