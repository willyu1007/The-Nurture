import { randomUUID } from "node:crypto";
import type {
  ScenarioCurrentOwnerBindingPairEvidenceV1,
  ScenarioHumanPrincipalV1,
} from "@my-chat/workflow-contracts";
import type { NurtureEnrollmentContactOwnerV1 } from "@my-chat/scenario-integrations";
import {
  NurtureCommandRunner,
  NurtureEnrollmentJourneySurfaceHandler,
  NurtureEnrollmentJourneyPreparedCommandCrypto,
  acceptTrialOfferSpec,
  confirmIntentConversationSpec,
  issueFamilyCareMessageTargetRef,
  issueTrialOfferSpec,
  recordExternalTouchpointSpec,
  startEnrollmentInquirySpec,
  type InstitutionBusinessCommunicationReadPort,
  type NurtureCommandSpec,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureEnrollmentJourneyCurrentOwnerCarrierV1,
  type NurtureEnrollmentJourneyCommandIntentV1,
  type NurtureEnrollmentJourneyDirectCommandKey,
  type NurtureEnrollmentJourneyGuardianOwnerCarrierV1,
  type NurtureEnrollmentJourneyFormalClientSurface,
  type NurtureEnrollmentJourneyPreparedCommandDraftV1,
  type NurtureTrialGrantTermsSnapshotV1,
  type NurtureTrialPairOwnerSnapshotV1,
} from "@the-nurture/scenario";
import { afterAll, describe, expect, it, vi } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { createAesGcmProtectedContentPort } from "../src/index.js";
import {
  bindPrismaNurtureEnrollmentJourneyFormalOwners,
  createPrismaNurtureEnrollmentJourneyFormalOwners,
} from "../src/enrollment-journey-owners.composition.js";
import {
  createNurtureEnrollmentJourneyCurrentOwnerProvider,
  createNurtureEnrollmentNativeSourceProvider,
  type NurtureEnrollmentLocalOwnerDerivationV1,
} from "../src/enrollment-journey-owner-providers.js";
import { PrismaEnrollmentPairOwnerRepository } from "../src/repositories/enrollment-pair-owner.repository.js";
import { PrismaInstitutionBusinessCommunicationReadPort } from "../src/repositories/institution-business-communication.read.js";
import { PrismaNurtureCommandRepository } from "../src/repositories/institution-core.repositories.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const TARGET_OPTION_KEY = "t007-enrollment-option-integrity-key-0001";
const PREPARED_INTEGRITY_KEY = "t007-enrollment-prepared-integrity-0001";
const PREPARED_ENCRYPTION_KEY = "t007-enrollment-prepared-encryption-001";
const MESSAGE_REF_KEY = "t007-enrollment-message-ref-integrity-01";

describe("T-007 Prisma formal Enrollment Journey owners", () => {
  it("rejects malformed carrier, cross-pair and expired locally derived facts", async () => {
    const now = new Date("2026-08-12T10:00:00.000Z");
    const pairOwner = { isTrialSnapshotCurrent: vi.fn(async () => true) };
    const facts = currentOwnerFacts(now);
    let derived: Awaited<ReturnType<
      NurtureEnrollmentLocalOwnerDerivationV1["deriveTrialPair"]
    >> = { status: "resolved", pair: facts.pair, grant_terms: facts.grantTerms };
    const provider = createNurtureEnrollmentJourneyCurrentOwnerProvider({
      localOwnerDerivation: {
        deriveTrialPair: async () => derived,
      },
      pairOwner,
      now: () => now,
    });
    const request = {
      workspace_id: "workspace-current-owner",
      institution_ref: "institution-current-owner",
      workflow_ref: "workflow-current-owner",
    };

    const malformedFamilyCarrier = {
      ...facts.familyCarrier,
      guardianAction: {
        ...facts.familyCarrier.guardianAction,
        action_ref: {
          ...facts.familyCarrier.guardianAction.action_ref,
          namespace: "nurture",
        },
      },
    } as NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
    await expect(provider.resolveFamilyAcceptance({
      ...request,
      current_owner_carrier: malformedFamilyCarrier,
    })).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_evidence_invalid",
    });

    derived = {
      status: "resolved",
      pair: {
        ...facts.pair,
        child_owner_ref: "nurture_child_binding_anchor_v1:another-child",
      },
      grant_terms: facts.grantTerms,
    };
    await expect(provider.resolveTrialPair({
      ...request,
      current_owner_carrier: facts.trialCarrier,
    })).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_pair_evidence_drift",
    });
    expect(pairOwner.isTrialSnapshotCurrent).not.toHaveBeenCalled();

    derived = {
      status: "resolved",
      pair: facts.pair,
      grant_terms: {
        ...facts.grantTerms,
        expires_at: now.toISOString(),
      },
    };
    await expect(provider.resolveTrialPair({
      ...request,
      current_owner_carrier: facts.trialCarrier,
    })).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_grant_terms_not_current",
    });
    expect(pairOwner.isTrialSnapshotCurrent).not.toHaveBeenCalled();
  });

  it("admits only the exact current pair after the local owner reread", async () => {
    const now = new Date("2026-08-12T10:00:00.000Z");
    const facts = currentOwnerFacts(now);
    const pairOwner = { isTrialSnapshotCurrent: vi.fn(async () => true) };
    const provider = createNurtureEnrollmentJourneyCurrentOwnerProvider({
      localOwnerDerivation: {
        deriveTrialPair: async () => ({
          status: "resolved",
          pair: facts.pair,
          grant_terms: facts.grantTerms,
        }),
      },
      pairOwner,
      now: () => now,
    });

    await expect(provider.resolveTrialPair({
      workspace_id: "workspace-current-owner",
      institution_ref: "institution-current-owner",
      workflow_ref: "workflow-current-owner",
      current_owner_carrier: facts.trialCarrier,
    })).resolves.toEqual({
      status: "resolved",
      pair: facts.pair,
      grant_terms: facts.grantTerms,
    });
    expect(pairOwner.isTrialSnapshotCurrent).toHaveBeenCalledOnce();
  });

  it("derives pair, Guardian role and Grant policy only from current Prisma owners", async () => {
    const scope = await seedAdminScope("derive-current-owner");
    const clock = { now: new Date("2026-08-12T10:00:00.000Z") };
    const seeded = await seedTrialOwnerScope(scope, clock.now);
      const owner = new PrismaEnrollmentPairOwnerRepository(prisma, () => clock.now);
      const request = {
        workspace_id: scope.workspaceId,
        institution_ref: scope.institutionId,
        workflow_ref: seeded.workflowId,
        current_owner_evidence: seeded.carrier.currentOwnerEvidence,
      };

      const current = await owner.deriveTrialPair(request);
      expect(current).toMatchObject({
        pair: {
          actor_ref: seeded.guardianActorRef,
          guardian_participant_ref: seeded.guardianParticipantId,
          guardian_role_assignment_ref: seeded.guardianRoleId,
          child_owner_ref: seeded.childOwnerRef,
          family_owner_ref: seeded.familyOwnerRef,
        },
        grant_terms: {
          policy_ref: "trial-care-policy",
          policy_revision: 1,
          directions: ["family_to_org", "org_to_family"],
          data_classes: ["daily_care_log", "care_day_note"],
          purposes: ["trial_care"],
        },
      });
      if (!current) throw new Error("current owner derivation failed");
      await expect(owner.isTrialSnapshotCurrent(scope.workspaceId, current.pair))
        .resolves.toBe(true);

      await prisma.nurtureCareRoleAssignment.update({
        where: { id: seeded.guardianRoleId },
        data: { status: "revoked" },
      });
      await expect(owner.deriveTrialPair(request)).resolves.toBeNull();
      await prisma.nurtureCareRoleAssignment.update({
        where: { id: seeded.guardianRoleId },
        data: { status: "active" },
      });

      await prisma.nurtureScenarioBindingAuthorization.update({
        where: { id: seeded.childAuthorizationId },
        data: { expiresAt: clock.now },
      });
      await expect(owner.deriveTrialPair(request)).resolves.toBeNull();
      await prisma.nurtureScenarioBindingAuthorization.update({
        where: { id: seeded.childAuthorizationId },
        data: { expiresAt: seeded.ownerExpiresAt },
      });

      const duplicateAuthorization = await prisma.nurtureScenarioBindingAuthorization.create({
        data: {
          workspaceId: scope.workspaceId,
          subjectType: "child",
          childAnchorId: seeded.childAnchorId,
          ownerRef: seeded.childOwnerRef,
          ownerVersion: 1,
          idempotencyKeyHash: fixtureHash(),
          requestFingerprint: fixtureHash(),
          subjectEvidenceHash: fixtureHash(),
          userEvidenceHash: fixtureHash(),
          actorEvidenceHash: fixtureHash(),
          purpose: "scenario_binding_write",
          authorizationSourceRef: "my_chat_child_identity",
          authorizationSourceVersion: 1,
          status: "active",
          verifiedAt: new Date(clock.now.getTime() - 30_000),
          expiresAt: seeded.ownerExpiresAt,
        },
      });
      await expect(owner.deriveTrialPair(request)).resolves.toBeNull();
      await prisma.nurtureScenarioBindingAuthorization.update({
        where: { id: duplicateAuthorization.id },
        data: { status: "revoked", revokedAt: clock.now },
      });

      await prisma.nurtureEnrollmentTrialGrantPolicy.update({
        where: { id: seeded.policyId },
        data: { supersededAt: clock.now },
      });
      const currentPolicy = await prisma.nurtureEnrollmentTrialGrantPolicy.create({
        data: {
          workspaceId: scope.workspaceId,
          institutionId: scope.institutionId,
          contractVersion: "1.0.0",
          policyRef: "trial-care-policy",
          policyRevision: 2,
          directions: ["family_to_org", "org_to_family"],
          dataClasses: ["daily_care_log"],
          purposes: ["trial_care"],
          effectiveFrom: clock.now,
          expiresAt: seeded.policyExpiresAt,
        },
      });
      await expect(owner.deriveTrialPair(request)).resolves.toMatchObject({
        grant_terms: { policy_revision: 2, data_classes: ["daily_care_log"] },
      });
      await expect(prisma.nurtureEnrollmentTrialGrantPolicy.update({
        where: { id: currentPolicy.id },
        data: { dataClasses: ["care_day_note"] },
      })).rejects.toThrow();
      await expect(prisma.nurtureEnrollmentTrialGrantPolicy.delete({
        where: { id: currentPolicy.id },
      })).rejects.toThrow();
  });

  it("admits qualify, trial preparation and trial start through production owners", async () => {
    const scope = await seedAdminScope("current-owner-command-matrix");
    const clock = { now: new Date("2026-08-12T10:00:00.000Z") };
    const seeded = await seedTrialOwnerScope(scope, clock.now);
    expect(seeded.qualifyResult).toMatchObject({
      status: "ok",
      result: { effect: "qualify_capacity_waitlist", workflowHead: 4 },
    });

    const world = composed(clock);
    const journeyOption = () => world.owners.enrollmentJourneyOptionIssuer.issue({
      workspace_id: scope.workspaceId,
      actor_participant_ref: scope.participantId,
      kind: "journey",
      target_ref: seeded.workflowId,
      waitlist_entry_ref: seeded.entryId,
      waitlist_entry_head: 3,
    });
    const prepareOption = journeyOption();
    if (!prepareOption) throw new Error("prepare journey option issue failed");
    const prepared = await executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "prepare_trial_relationship",
        capabilityVersion: "1.0.0",
        targetOptionRef: prepareOption,
        operationInput: {},
      },
      currentOwnerCarrier: seeded.carrier,
    });
    expect(prepared).toMatchObject({
      status: "ok",
      disposition: "executed",
      result: { effect: "prepare_trial_relationship", workflowHead: 7 },
    });
    await expect(prisma.nurtureEnrollment.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, childCareProcessId: seeded.processId },
    })).resolves.toMatchObject({ status: "pending", participationPhase: null });

    clock.now = new Date(clock.now.getTime() + 4 * 60 * 60_000);
    const startOption = journeyOption();
    if (!startOption) throw new Error("start journey option issue failed");
    const started = await executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "start_trial",
        capabilityVersion: "1.0.0",
        targetOptionRef: startOption,
        operationInput: {},
      },
      currentOwnerCarrier: seeded.carrier,
    });
    if (started.status !== "ok") {
      throw new Error(`trial start failed:${JSON.stringify(started)}`);
    }
    expect(started).toMatchObject({
      status: "ok",
      disposition: "executed",
      result: { effect: "start_trial", workflowHead: 8, currentStage: "trial_in_progress" },
    });
    await expect(prisma.nurtureEnrollment.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, childCareProcessId: seeded.processId },
    })).resolves.toMatchObject({ status: "active", participationPhase: "trial" });
  });

  it("formalizes through current Guardian mobile authority and exact replay", async () => {
    const scope = await seedAdminScope("guardian-formalization");
    const clock = { now: new Date("2026-08-12T10:00:00.000Z") };
    const seeded = await seedTrialOwnerScope(scope, clock.now);
    const world = composed(clock);
    const journeyOption = (participantRef: string) =>
      world.owners.enrollmentJourneyOptionIssuer.issue({
        workspace_id: scope.workspaceId,
        actor_participant_ref: participantRef,
        kind: "journey",
        target_ref: seeded.workflowId,
        waitlist_entry_ref: seeded.entryId,
        waitlist_entry_head: 3,
      });

    const mobileQueryOption = journeyOption(scope.participantId);
    if (!mobileQueryOption) throw new Error("Admin mobile query option issue failed");
    await expect(world.owners.enrollmentJourneyAuthorityResolver.resolveCurrent({
      principal: scope.principal,
      invocation_request_id: `invocation-${randomUUID()}`,
      declared_operation_key: "query_enrollment_journey",
      client_surface: "mobile_dashboard",
      capability_key: "query_institution_enrollment_journey",
      target_option_ref: mobileQueryOption,
    })).resolves.toMatchObject({
      status: "resolved",
      authority: {
        active_role: "institution_admin",
        surface_key: "institution_board",
      },
    });

    const prepareOption = journeyOption(scope.participantId);
    if (!prepareOption) throw new Error("trial preparation option issue failed");
    await expect(executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "prepare_trial_relationship",
        capabilityVersion: "1.0.0",
        targetOptionRef: prepareOption,
        operationInput: {},
      },
      currentOwnerCarrier: seeded.carrier,
    })).resolves.toMatchObject({ status: "ok", result: { workflowHead: 7 } });

    clock.now = new Date(clock.now.getTime() + 4 * 60 * 60_000);
    const startOption = journeyOption(scope.participantId);
    if (!startOption) throw new Error("trial start option issue failed");
    await expect(executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "start_trial",
        capabilityVersion: "1.0.0",
        targetOptionRef: startOption,
        operationInput: {},
      },
      currentOwnerCarrier: seeded.carrier,
    })).resolves.toMatchObject({ status: "ok", result: { workflowHead: 8 } });

    clock.now = new Date(seeded.reviewAt.getTime() + 1_000);
    const reviewOption = journeyOption(scope.participantId);
    if (!reviewOption) throw new Error("trial review option issue failed");
    await expect(executeDirectAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "mark_trial_review_reached",
        capabilityVersion: "1.0.0",
        targetOptionRef: reviewOption,
        operationInput: {},
      },
    })).resolves.toMatchObject({ status: "ok", result: { workflowHead: 9 } });

    const proposalOption = journeyOption(scope.participantId);
    if (!proposalOption) throw new Error("formal proposal option issue failed");
    await expect(executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "propose_formal_enrollment",
        capabilityVersion: "1.0.0",
        targetOptionRef: proposalOption,
        operationInput: {
          proposedFormalStartAt: clock.now.toISOString(),
          proposedGrantPurposes: ["trial_care"],
          proposedGrantExpiresAt: new Date(
            clock.now.getTime() + 5 * 24 * 60 * 60_000,
          ).toISOString(),
          safeFamilySummary: "Guardian reviewed the formal care continuation.",
          proposalExpiresAt: new Date(
            clock.now.getTime() + 12 * 60 * 60_000,
          ).toISOString(),
          reasonKey: "admin_proposed_formal_continuation",
        },
      },
    })).resolves.toMatchObject({ status: "ok", result: { workflowHead: 10 } });

    const guardianCarrier: NurtureEnrollmentJourneyGuardianOwnerCarrierV1 = {
      carrierVersion: 1,
      guardianAction: {
        contract_version: "1.0.0",
        actor_ref: seeded.guardianActorRef,
        contact_ref: seeded.contactRef,
        action_ref: canonical(
          "my_chat",
          "enrollment_action",
          `formal-acceptance-${scope.suffix}`,
        ),
        occurred_at: clock.now.toISOString(),
        verified_at: clock.now.toISOString(),
      },
      currentOwnerEvidence: {
        ...seeded.carrier.currentOwnerEvidence,
        purpose_key: "formalize_enrollment",
      },
    };
    const formalizeOption = journeyOption(seeded.guardianParticipantId);
    if (!formalizeOption) throw new Error("Guardian formalization option issue failed");
    const formalized = await executePreparedGuardianCommand({
      world,
      principal: seeded.guardianPrincipal,
      participantRef: seeded.guardianParticipantId,
      surface: "mobile_dashboard",
      guardianOwnerCarrier: guardianCarrier,
      request: {
        capabilityKey: "formalize_enrollment",
        capabilityVersion: "1.0.0",
        targetOptionRef: formalizeOption,
        operationInput: {},
      },
      evidenceExpiresAt: new Date(clock.now.getTime() + 60_000).toISOString(),
    });
    if (formalized.first.status !== "ok") {
      throw new Error(`Guardian formalization failed:${JSON.stringify(formalized.first)}`);
    }
    expect(formalized.first).toMatchObject({
      status: "ok",
      disposition: "executed",
      result: { workflowHead: 11, currentStage: "completed", lifecycle: "completed" },
    });
    if (formalized.replay.status !== "ok") {
      throw new Error(`Guardian replay failed:${JSON.stringify(formalized.replay)}`);
    }
    expect(formalized.replay).toMatchObject({ status: "ok", disposition: "replayed" });
    await expect(prisma.nurtureEnrollment.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, childCareProcessId: seeded.processId },
    })).resolves.toMatchObject({ status: "active", participationPhase: "formal" });
    await expect(prisma.nurtureEnrollmentJourneyPreparedCommand.findUniqueOrThrow({
      where: { commandRequestId: formalized.commandRequestId },
    })).resolves.toMatchObject({
      participantId: seeded.guardianParticipantId,
      roleAssignmentId: null,
      clientSurface: "mobile_dashboard",
      status: "consumed",
    });
  });

  it("resolves a native touchpoint only through the current production message owner", async () => {
    const scope = await seedAdminScope("native-source-owner");
    const source = await seedNativeSource(scope);
    const provider = createNurtureEnrollmentNativeSourceProvider({
      reads: new PrismaInstitutionBusinessCommunicationReadPort(prisma),
      messageRefIntegrityKey: MESSAGE_REF_KEY,
      now: () => new Date("2026-08-12T10:00:00.000Z"),
    });
    const option = issueFamilyCareMessageTargetRef(MESSAGE_REF_KEY, {
      workspace_id: scope.workspaceId,
      participant_id: scope.participantId,
      message_id: source.messageId,
    });

    const resolved = await provider.resolveNativeSource({
      workspace_id: scope.workspaceId,
      participant_id: scope.participantId,
      source_message_option_ref: option,
    });
    expect(resolved).toMatchObject({
      status: "resolved",
      snapshot: {
        contract_version: "1.0.0",
        source_ref: {
          namespace: "nurture",
          object_type: "family_care_message",
          object_id: source.messageId,
        },
      },
    });
    expect(JSON.stringify(resolved)).not.toContain("bodyProtectionPayload");
    expect(JSON.stringify(resolved)).not.toContain("private-family-message");

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.roleAssignmentId },
      data: { status: "revoked" },
    });
    await expect(provider.resolveNativeSource({
      workspace_id: scope.workspaceId,
      participant_id: scope.participantId,
      source_message_option_ref: option,
    })).resolves.toEqual({ status: "denied", reason_code: "native_source_not_visible" });
  });

  it("denies trial start when the current Grant policy drifts after preparation", async () => {
    const scope = await seedAdminScope("current-owner-policy-drift");
    const clock = { now: new Date("2026-08-12T10:00:00.000Z") };
    const seeded = await seedTrialOwnerScope(scope, clock.now);
    const world = composed(clock);
    const option = () => world.owners.enrollmentJourneyOptionIssuer.issue({
      workspace_id: scope.workspaceId,
      actor_participant_ref: scope.participantId,
      kind: "journey",
      target_ref: seeded.workflowId,
      waitlist_entry_ref: seeded.entryId,
      waitlist_entry_head: 3,
    });
    const prepareOption = option();
    if (!prepareOption) throw new Error("prepare journey option issue failed");
    await expect(executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "prepare_trial_relationship",
        capabilityVersion: "1.0.0",
        targetOptionRef: prepareOption,
        operationInput: {},
      },
      currentOwnerCarrier: seeded.carrier,
    })).resolves.toMatchObject({ status: "ok" });

    clock.now = new Date(clock.now.getTime() + 4 * 60 * 60_000);
    await prisma.nurtureEnrollmentTrialGrantPolicy.update({
      where: { id: seeded.policyId },
      data: { supersededAt: clock.now },
    });
    await prisma.nurtureEnrollmentTrialGrantPolicy.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institutionId,
        contractVersion: "1.0.0",
        policyRef: "trial-care-policy",
        policyRevision: 2,
        directions: ["family_to_org", "org_to_family"],
        dataClasses: ["daily_care_log"],
        purposes: ["trial_care"],
        effectiveFrom: clock.now,
        expiresAt: seeded.policyExpiresAt,
      },
    });
    const startOption = option();
    if (!startOption) throw new Error("start journey option issue failed");
    await expect(executePreparedAdminCommand({
      world,
      scope,
      request: {
        capabilityKey: "start_trial",
        capabilityVersion: "1.0.0",
        targetOptionRef: startOption,
        operationInput: {},
      },
      currentOwnerCarrier: seeded.carrier,
    })).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_grant_policy_drift",
    });
    await expect(prisma.nurtureEnrollment.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, childCareProcessId: seeded.processId },
    })).resolves.toMatchObject({ status: "pending", aggregateVersion: 0 });
  });

  it("prepares, verifies and consumes inside the command transaction", async () => {
    const scope = await seedAdminScope("consume");
    const clock = { now: new Date("2026-08-12T10:00:00.000Z") };
    const world = composed(clock);
    try {
      const option = world.owners.enrollmentJourneyOptionIssuer.issueProspectiveContact({
        workspace_id: scope.workspaceId,
        participant_ref: scope.participantId,
        contact_object_id: `contact-${scope.suffix}`,
        contact_version: 4,
        institution_ref: scope.institutionId,
      });
      if (!option) throw new Error("option issue failed");

      const authority = await world.owners.enrollmentJourneyAuthorityResolver.resolveCurrent({
        principal: scope.principal,
        invocation_request_id: `invocation-${scope.suffix}`,
        declared_operation_key: "prepare_enrollment_journey_command",
        client_surface: "web_run_workbench",
        capability_key: "start_enrollment_inquiry",
        target_option_ref: option,
      });
      expect(authority.status).toBe("resolved");
      if (authority.status !== "resolved") throw new Error("authority failed");
      if (authority.authority.active_role !== "institution_admin") {
        throw new Error("admin authority required");
      }
      expect(authority.authority.institution_ref).toBe(scope.institutionId);
      expect(authority.authority.role_assignment_ref).toBe(scope.roleAssignmentId);

      const prepared = await world.owners.enrollmentJourneyPreparedCommandOwner.prepare({
        principal: scope.principal,
        invocation_request_id: `invocation-${scope.suffix}`,
        client_surface: "web_run_workbench",
        authority: authority.authority,
        command: {
          contractVersion: 1,
          clientCommandId: `client-${scope.suffix}`,
          request: {
            capabilityKey: "start_enrollment_inquiry",
            capabilityVersion: "1.0.0",
            targetOptionRef: option,
            operationInput: startInquiryInput(clock),
          },
        },
      });
      expect(prepared.status).toBe("ready_to_confirm");
      if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

      const verified = await world.owners.enrollmentJourneyPreparedCommandOwner
        .verifyConfirmed({
          principal: scope.principal,
          invocation_request_id: `invocation-verify-${scope.suffix}`,
          client_surface: "web_run_workbench",
          command: {
            commandRequestId: prepared.command_request_id,
            confirmationRef: prepared.confirmation_ref,
          },
        });
      expect(verified.status).toBe("resolved");
      const row = await prisma.nurtureEnrollmentJourneyPreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: prepared.command_request_id },
      });
      expect(row.status).toBe("prepared");

      // Consume inside a real advisory-locked command transaction, exactly as
      // the production executor does (record 63/86).
      const commands = new PrismaNurtureCommandRepository(prisma, () => clock.now);
      const outcome = await commands.executeLocked({
        workspace_id: scope.workspaceId,
        command_request_id_hash: "a".repeat(64),
        operation: async (transaction) => {
          const ledger = transaction.enrollmentPreparedCommands;
          if (!ledger) throw new Error("ledger missing on command transaction");
          return ledger.consumeExact({
            workspace_id: scope.workspaceId,
            participant_ref: scope.participantId,
            command_request_id: prepared.command_request_id,
            confirmation_ref_hash: world.confirmationHash(prepared.confirmation_ref),
            consumed_at: clock.now.toISOString(),
          });
        },
      });
      expect(outcome).toMatchObject({ acquired: true, value: { status: "consumed" } });
      const consumedRow = await prisma.nurtureEnrollmentJourneyPreparedCommand
        .findUniqueOrThrow({ where: { commandRequestId: prepared.command_request_id } });
      expect(consumedRow.status).toBe("consumed");

      // Replay stays exact and non-mutating; verify remains resolvable.
      const replay = await commands.executeLocked({
        workspace_id: scope.workspaceId,
        command_request_id_hash: "b".repeat(64),
        operation: async (transaction) =>
          transaction.enrollmentPreparedCommands?.consumeExact({
            workspace_id: scope.workspaceId,
            participant_ref: scope.participantId,
            command_request_id: prepared.command_request_id,
            confirmation_ref_hash: world.confirmationHash(prepared.confirmation_ref),
            consumed_at: clock.now.toISOString(),
          }),
      });
      expect(replay).toMatchObject({ acquired: true, value: { status: "replayed" } });
      await expect(
        world.owners.enrollmentJourneyPreparedCommandOwner.verifyConfirmed({
          principal: scope.principal,
          invocation_request_id: `invocation-replay-${scope.suffix}`,
          client_surface: "web_run_workbench",
          command: {
            commandRequestId: prepared.command_request_id,
            confirmationRef: prepared.confirmation_ref,
          },
        }),
      ).resolves.toMatchObject({ status: "resolved" });
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });

  it("dedups exact prepares, rejects reuse and scrubs expiry on PostgreSQL", async () => {
    const scope = await seedAdminScope("dedup");
    const clock = { now: new Date("2026-08-12T11:00:00.000Z") };
    const world = composed(clock, { preparedCommandTtlMs: 1_000 });
    try {
      const option = world.owners.enrollmentJourneyOptionIssuer.issueProspectiveContact({
        workspace_id: scope.workspaceId,
        participant_ref: scope.participantId,
        contact_object_id: `contact-${scope.suffix}`,
        contact_version: 4,
        institution_ref: scope.institutionId,
      });
      if (!option) throw new Error("option issue failed");
      const authority = await world.owners.enrollmentJourneyAuthorityResolver.resolveCurrent({
        principal: scope.principal,
        invocation_request_id: `invocation-${scope.suffix}`,
        declared_operation_key: "prepare_enrollment_journey_command",
        client_surface: "web_run_workbench",
        capability_key: "start_enrollment_inquiry",
        target_option_ref: option,
      });
      if (authority.status !== "resolved") throw new Error("authority failed");
      const prepare = (preferredLabel: string) =>
        world.owners.enrollmentJourneyPreparedCommandOwner.prepare({
          principal: scope.principal,
          invocation_request_id: `invocation-${scope.suffix}`,
          client_surface: "web_run_workbench",
          authority: authority.authority,
          command: {
            contractVersion: 1,
            clientCommandId: `client-${scope.suffix}`,
            request: {
              capabilityKey: "start_enrollment_inquiry",
              capabilityVersion: "1.0.0",
              targetOptionRef: option,
              operationInput: { ...startInquiryInput(clock), preferredLabel },
            },
          },
        });

      const first = await prepare("Prospective family A");
      expect(first.status).toBe("ready_to_confirm");
      if (first.status !== "ready_to_confirm") throw new Error("prepare failed");
      const replay = await prepare("Prospective family A");
      expect(replay).toEqual(first);
      await expect(prepare("Prospective family B")).resolves.toEqual({
        status: "not_prepared",
        reason_code: "prepared_client_command_reuse_conflict",
      });
      await expect(prisma.nurtureEnrollmentJourneyPreparedCommand.count({
        where: { workspaceId: scope.workspaceId },
      })).resolves.toBe(1);

      // Wrong confirmation conflicts and consumes nothing.
      const commands = new PrismaNurtureCommandRepository(prisma, () => clock.now);
      const conflict = await commands.executeLocked({
        workspace_id: scope.workspaceId,
        command_request_id_hash: "c".repeat(64),
        operation: async (transaction) =>
          transaction.enrollmentPreparedCommands?.consumeExact({
            workspace_id: scope.workspaceId,
            participant_ref: scope.participantId,
            command_request_id: first.command_request_id,
            confirmation_ref_hash: world.confirmationHash(`ejc1.${"z".repeat(43)}`),
            consumed_at: clock.now.toISOString(),
          }),
      });
      expect(conflict).toMatchObject({ acquired: true, value: { status: "conflict" } });

      // Natural expiry scrubs the snapshot in place (DR-E7-01 branch).
      clock.now = new Date(clock.now.getTime() + 2_000);
      const expired = await commands.executeLocked({
        workspace_id: scope.workspaceId,
        command_request_id_hash: "d".repeat(64),
        operation: async (transaction) =>
          transaction.enrollmentPreparedCommands?.consumeExact({
            workspace_id: scope.workspaceId,
            participant_ref: scope.participantId,
            command_request_id: first.command_request_id,
            confirmation_ref_hash: world.confirmationHash(first.confirmation_ref),
            consumed_at: clock.now.toISOString(),
          }),
      });
      expect(expired).toMatchObject({ acquired: true, value: { status: "expired" } });
      const scrubbed = await prisma.nurtureEnrollmentJourneyPreparedCommand
        .findUniqueOrThrow({ where: { commandRequestId: first.command_request_id } });
      expect(scrubbed.status).toBe("expired");
      expect(scrubbed.snapshotCodecVersion).toBe(0);
      expect(scrubbed.frozenSnapshotCiphertext).toBe("");
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });

  it("fails before prospective-contact read when signed reservation evidence is absent", async () => {
    const scope = await seedAdminScope("contact");
    const clock = { now: new Date("2026-08-12T12:00:00.000Z") };
    const world = composed(clock);
    try {
      const option = world.owners.enrollmentJourneyOptionIssuer.issueProspectiveContact({
        workspace_id: scope.workspaceId,
        participant_ref: scope.participantId,
        contact_object_id: `contact-${scope.suffix}`,
        contact_version: 4,
        institution_ref: scope.institutionId,
      });
      if (!option) throw new Error("contact option issue failed");

      const resolved = await world.owners.enrollmentJourneySurfaceDeps.bindings.resolve({
        request: {
          capabilityKey: "start_enrollment_inquiry",
          capabilityVersion: "1.0.0",
          targetOptionRef: option,
          operationInput: {
            preferredLabel: "Prospective family",
            birthYearMonth: "2024-03",
            expectedEntryStartDate: "2026-09-01",
            expectedEntryEndDate: "2026-10-01",
            targetClassTypeKey: "toddler",
            targetAgeBandKey: "age_2_3",
            careScheduleNeedKeys: ["full_day"],
            sourceChannel: "walk_in",
            safetyLabelKeys: [],
            initialContactAt: clock.now.toISOString(),
            nextTouchpointAt: clock.now.toISOString(),
          },
          confirmationRef: `ejc1.${"a".repeat(43)}`,
        } as never,
        trusted: {
          workspace_id: scope.workspaceId,
          actor_participant_ref: scope.participantId,
          invocation_request_id: `invocation-${scope.suffix}`,
          host_correlation_id: `correlation-${scope.suffix}`,
          host_trace_id: `trace-${scope.suffix}`,
          command_request_id: `command-${scope.suffix}`,
          client_surface: "web_run_workbench",
        },
      });
      expect(resolved).toEqual({
        status: "unavailable",
        reason_code: "workflow_run_reservation_evidence_required",
      });
      expect(world.contactOwnerCalls.count).toBe(0);
      expect(() => bindPrismaNurtureEnrollmentJourneyFormalOwners({
        formalOwners: world.owners,
      })).not.toThrow();
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });

  it("registers exact Host reservation before reading the prospective contact", async () => {
    const scope = await seedAdminScope("settlement-register");
    const clock = { now: new Date("2026-08-12T12:30:00.000Z") };
    const world = composed(clock);
    try {
      const option = world.owners.enrollmentJourneyOptionIssuer.issueProspectiveContact({
        workspace_id: scope.workspaceId,
        participant_ref: scope.participantId,
        contact_object_id: `contact-${scope.suffix}`,
        contact_version: 4,
        institution_ref: scope.institutionId,
      });
      if (!option) throw new Error("contact option issue failed");
      const reservation = hostReservation(scope.suffix);
      const commandRequestId = `command-${scope.suffix}`;
      const resolved = await world.owners.enrollmentJourneySurfaceDeps.bindings.resolve({
        request: {
          capabilityKey: "start_enrollment_inquiry",
          capabilityVersion: "1.0.0",
          targetOptionRef: option,
          operationInput: startInquiryInput(clock),
          confirmationRef: `ejc1.${"a".repeat(43)}`,
        } as never,
        trusted: {
          workspace_id: scope.workspaceId,
          actor_participant_ref: scope.participantId,
          invocation_request_id: `invocation-${scope.suffix}`,
          host_correlation_id: `correlation-${scope.suffix}`,
          command_request_id: commandRequestId,
          client_surface: "web_run_workbench",
          host_workflow_run_reservation: reservation,
        },
      });
      expect(resolved).toMatchObject({
        status: "resolved",
        binding: { workflow_run_ref: reservation.run_ref },
      });
      expect(world.contactOwnerCalls.count).toBe(1);
      await expect(prisma.nurtureWorkflowRunSettlement.findMany({
        where: { workspaceId: scope.workspaceId },
      })).resolves.toMatchObject([{
        state: "prepared",
        runObjectId: reservation.run_ref.object_id,
      }]);
    } finally {
      await cleanupScope(scope.workspaceId);
    }
  });
});

type SeededScope = {
  suffix: string;
  workspaceId: string;
  participantId: string;
  institutionId: string;
  roleAssignmentId: string;
  accountId: string;
  actorId: string;
  principal: ScenarioHumanPrincipalV1;
};

function composed(
  clock: { now: Date },
  overrides: { preparedCommandTtlMs?: number } = {},
) {
  const contactOwnerCalls = { count: 0 };
  const contactOwner: NurtureEnrollmentContactOwnerV1 = {
    owner_pin: {
      key: "my-chat.nurture-enrollment-prospective-contact-owner",
      version: "1.0.0",
      purpose: "enrollment_inquiry_contact",
      snapshot_contract_version: "1.0.0",
    },
    resolveCurrentContact: async (request) => {
      contactOwnerCalls.count += 1;
      return request.contact_ref.version === 4
        ? {
            status: "resolved",
            snapshot: {
              contract_version: "1.0.0",
              contact_ref: request.contact_ref,
              safe_label: "尾号 6789（微信）",
              verified_at: clock.now.toISOString(),
            },
          }
        : { status: "denied", reason_code: "prospective_contact_not_current" };
    },
  } as NurtureEnrollmentContactOwnerV1;
  const reads: InstitutionBusinessCommunicationReadPort = {
    loadInstitutionBusinessCommunication: async () => ({ authorized: false }),
  };
  const owners = createPrismaNurtureEnrollmentJourneyFormalOwners({
    prisma,
    targetOptionIntegrityKey: TARGET_OPTION_KEY,
    preparedCommandIntegrityKey: PREPARED_INTEGRITY_KEY,
    preparedCommandEncryptionSecret: PREPARED_ENCRYPTION_KEY,
    messageRefIntegrityKey: MESSAGE_REF_KEY,
    contactOwner,
    businessCommunicationReads: reads,
    protectedContent: createAesGcmProtectedContentPort({
      keyRef: "t007-enrollment-protected-content-key",
      keyMaterial: "t007-enrollment-protected-content-key-material-0001",
    }),
    now: () => clock.now,
    ...(overrides.preparedCommandTtlMs === undefined
      ? {}
      : { preparedCommandTtlMs: overrides.preparedCommandTtlMs }),
  });
  const protection = new NurtureEnrollmentJourneyPreparedCommandCrypto(
    PREPARED_INTEGRITY_KEY,
    PREPARED_ENCRYPTION_KEY,
  );
  return {
    owners,
    contactOwnerCalls,
    confirmationHash: (confirmationRef: string) =>
      protection.tag({ purpose: "confirmation-ref", values: [confirmationRef] }),
  };
}

async function executePreparedAdminCommand(input: {
  world: ReturnType<typeof composed>;
  scope: SeededScope;
  request: NurtureEnrollmentJourneyPreparedCommandDraftV1["request"];
  currentOwnerCarrier?: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
}) {
  const invocationRequestId = `invocation-${randomUUID()}`;
  const authority = await input.world.owners.enrollmentJourneyAuthorityResolver.resolveCurrent({
    principal: input.scope.principal,
    invocation_request_id: invocationRequestId,
    declared_operation_key: "prepare_enrollment_journey_command",
    client_surface: "web_run_workbench",
    capability_key: input.request.capabilityKey,
    target_option_ref: input.request.targetOptionRef,
  });
  if (authority.status !== "resolved") {
    throw new Error(`authority:${authority.status}:${authority.reason_code}`);
  }
  const prepared = await input.world.owners.enrollmentJourneyPreparedCommandOwner.prepare({
    principal: input.scope.principal,
    invocation_request_id: invocationRequestId,
    client_surface: "web_run_workbench",
    authority: authority.authority,
    command: {
      contractVersion: 1,
      clientCommandId: `client-${randomUUID()}`,
      request: input.request,
    },
  });
  if (prepared.status !== "ready_to_confirm") {
    throw new Error(`prepare:${prepared.status}:${prepared.reason_code}`);
  }
  return new NurtureEnrollmentJourneySurfaceHandler(
    input.world.owners.enrollmentJourneySurfaceDeps,
  ).handle(
    { ...input.request, confirmationRef: prepared.confirmation_ref },
    {
      workspace_id: input.scope.workspaceId,
      actor_participant_ref: input.scope.participantId,
      invocation_request_id: `invocation-execute-${randomUUID()}`,
      host_correlation_id: `correlation-${randomUUID()}`,
      host_trace_id: `trace-${randomUUID()}`,
      command_request_id: prepared.command_request_id,
      client_surface: "web_run_workbench",
      ...(input.currentOwnerCarrier
        ? { current_owner_carrier: input.currentOwnerCarrier }
        : {}),
    },
  );
}

async function executeDirectAdminCommand(input: {
  world: ReturnType<typeof composed>;
  scope: SeededScope;
  request: NurtureEnrollmentJourneyCommandIntentV1<
    NurtureEnrollmentJourneyDirectCommandKey
  >;
}) {
  const invocationRequestId = `invocation-${randomUUID()}`;
  const authority = await input.world.owners.enrollmentJourneyAuthorityResolver.resolveCurrent({
    principal: input.scope.principal,
    invocation_request_id: invocationRequestId,
    declared_operation_key: "execute_prepared_enrollment_journey_command",
    client_surface: "web_run_workbench",
    capability_key: input.request.capabilityKey,
    target_option_ref: input.request.targetOptionRef,
  });
  if (authority.status !== "resolved") {
    throw new Error(`direct authority:${authority.status}:${authority.reason_code}`);
  }
  const direct = await input.world.owners.enrollmentJourneyPreparedCommandOwner
    .deriveDirectContext({
      principal: input.scope.principal,
      invocation_request_id: invocationRequestId,
      client_surface: "web_run_workbench",
      command: {
        clientCommandId: `client-${randomUUID()}`,
        request: input.request,
      },
    });
  if (direct.status !== "resolved") {
    throw new Error(`direct context:${direct.status}:${direct.reason_code}`);
  }
  return new NurtureEnrollmentJourneySurfaceHandler(
    input.world.owners.enrollmentJourneySurfaceDeps,
  ).handle(
    { ...input.request, confirmationRef: direct.confirmation_ref },
    {
      workspace_id: input.scope.workspaceId,
      actor_participant_ref: input.scope.participantId,
      invocation_request_id: invocationRequestId,
      host_correlation_id: `correlation-${randomUUID()}`,
      host_trace_id: `trace-${randomUUID()}`,
      command_request_id: direct.command_request_id,
      client_surface: "web_run_workbench",
    },
  );
}

async function executePreparedGuardianCommand(input: {
  world: ReturnType<typeof composed>;
  principal: ScenarioHumanPrincipalV1;
  participantRef: string;
  surface: Exclude<NurtureEnrollmentJourneyFormalClientSurface, "web_run_workbench">;
  guardianOwnerCarrier: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
  request: NurtureEnrollmentJourneyPreparedCommandDraftV1["request"];
  evidenceExpiresAt: string;
}) {
  const prepareInvocationId = `invocation-${randomUUID()}`;
  const authority = await input.world.owners.enrollmentJourneyAuthorityResolver.resolveCurrent({
    principal: input.principal,
    invocation_request_id: prepareInvocationId,
    declared_operation_key: "prepare_enrollment_journey_command",
    client_surface: input.surface,
    capability_key: input.request.capabilityKey,
    target_option_ref: input.request.targetOptionRef,
    guardian_owner_carrier: input.guardianOwnerCarrier,
  });
  if (authority.status !== "resolved") {
    throw new Error(`Guardian authority:${authority.status}:${authority.reason_code}`);
  }
  const prepared = await input.world.owners.enrollmentJourneyPreparedCommandOwner.prepare({
    principal: input.principal,
    invocation_request_id: prepareInvocationId,
    client_surface: input.surface,
    authority: authority.authority,
    command: {
      contractVersion: 1,
      clientCommandId: `client-${randomUUID()}`,
      request: input.request,
    },
  });
  if (prepared.status !== "ready_to_confirm") {
    throw new Error(`Guardian prepare:${prepared.status}:${prepared.reason_code}`);
  }
  const trusted = {
    workspace_id: input.principal.workspace_ref.object_id,
    actor_participant_ref: input.participantRef,
    invocation_request_id: `invocation-execute-${randomUUID()}`,
    host_correlation_id: `correlation-${randomUUID()}`,
    host_trace_id: `trace-${randomUUID()}`,
    command_request_id: prepared.command_request_id,
    client_surface: input.surface,
    guardian_owner_carrier: input.guardianOwnerCarrier,
    guardian_invocation_nonce_hash: fixtureHash(),
    guardian_evidence_expires_at: input.evidenceExpiresAt,
  } as const;
  const request = { ...input.request, confirmationRef: prepared.confirmation_ref };
  const handler = new NurtureEnrollmentJourneySurfaceHandler(
    input.world.owners.enrollmentJourneySurfaceDeps,
  );
  return {
    commandRequestId: prepared.command_request_id,
    first: await handler.handle(request, trusted),
    replay: await handler.handle(request, {
      ...trusted,
      invocation_request_id: `invocation-replay-${randomUUID()}`,
    }),
  };
}

function startInquiryInput(clock: { now: Date }) {
  return {
    preferredLabel: "Prospective family A",
    ageBandKey: "age_2_3",
    expectedEntryStartDate: "2026-09-01",
    expectedEntryEndDate: "2026-10-01",
    targetClassTypeKey: "toddler",
    targetAgeBandKey: "age_2_3",
    careScheduleNeedKeys: ["full_day"],
    sourceChannel: "walk_in",
    safetyLabelKeys: [],
    initialContactAt: clock.now.toISOString(),
    nextTouchpointAt: clock.now.toISOString(),
  };
}

function currentOwnerFacts(
  now: Date,
): {
  trialCarrier: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
  familyCarrier: NurtureEnrollmentJourneyCurrentOwnerCarrierV1 & {
    guardianAction: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  };
  pair: NurtureTrialPairOwnerSnapshotV1;
  grantTerms: NurtureTrialGrantTermsSnapshotV1;
} {
  const childOwnerRef =
    "nurture_child_binding_anchor_v1:00000000-0000-4000-8000-000000000001";
  const familyOwnerRef =
    "nurture_family_binding_anchor_v1:00000000-0000-4000-8000-000000000002";
  const evidence: ScenarioCurrentOwnerBindingPairEvidenceV1 = {
    binding_evidence_version: 1,
    purpose_key: "enrollment_trial_pair",
    owner_bindings: [
      {
        owner_binding_ref_version: 1,
        binding_slot: "child",
        owner_ref: {
          ...canonical("scenario-owner", "child_binding_owner", childOwnerRef),
          version: 2,
        },
      },
      {
        owner_binding_ref_version: 1,
        binding_slot: "family",
        owner_ref: {
          ...canonical("scenario-owner", "family_binding_owner", familyOwnerRef),
          version: 3,
        },
      },
    ],
    pair_relation_evidence_hash: "a".repeat(64),
    current_owner_evidence_hash: "b".repeat(64),
  };
  const guardianAction: NurtureEnrollmentGuardianActionOwnerSnapshotV1 = {
    contract_version: "1.0.0",
    actor_ref: canonical("my_chat", "actor", "actor-current-owner"),
    contact_ref: canonical("my_chat", "nurture_prospective_contact", "contact-current-owner"),
    action_ref: canonical("my_chat", "enrollment_action", "action-current-owner"),
    occurred_at: new Date(now.getTime() - 2_000).toISOString(),
    verified_at: new Date(now.getTime() - 1_000).toISOString(),
  };
  return {
    trialCarrier: {
      carrierVersion: 1,
      currentOwnerEvidence: {
        ...evidence,
        purpose_key: "enrollment_trial_pair",
      },
    },
    familyCarrier: {
      carrierVersion: 1,
      currentOwnerEvidence: {
        ...evidence,
        purpose_key: "enrollment_family_acceptance",
      },
      guardianAction,
    },
    pair: {
      contract_version: "1.0.0",
      actor_ref: canonical("my_chat", "actor", "actor-current-owner"),
      guardian_participant_ref: "guardian-current-owner",
      guardian_role_assignment_ref: "guardian-role-current-owner",
      child_owner_ref: childOwnerRef,
      child_owner_version: 2,
      family_owner_ref: familyOwnerRef,
      family_owner_version: 3,
      child_association_ref: "child-association-current-owner",
      child_association_head: 4,
      family_association_ref: "family-association-current-owner",
      family_association_head: 5,
      child_care_process_ref: "care-process-current-owner",
      verified_at: new Date(now.getTime() - 1_000).toISOString(),
      expires_at: new Date(now.getTime() + 30_000).toISOString(),
    },
    grantTerms: {
      contract_version: "1.0.0",
      policy_ref: "policy-current-owner",
      policy_revision: 1,
      directions: ["family_to_org", "org_to_family"],
      data_classes: ["daily_care_log"],
      purposes: ["trial_care"],
      verified_at: new Date(now.getTime() - 1_000).toISOString(),
      expires_at: new Date(now.getTime() + 30_000).toISOString(),
    },
  };
}

async function seedTrialOwnerScope(scope: SeededScope, now: Date) {
  const careGroupId = `care-group-${scope.suffix}`;
  const guardianParticipantId = `guardian-${scope.suffix}`;
  const guardianActorRef = canonical(
    "my_chat",
    "actor",
    `guardian-actor-${scope.suffix}`,
  );
  const trialStartsAt = new Date(now.getTime() + 3 * 60 * 60_000);
  const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60_000);
  const policyExpiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60_000);
  const ownerExpiresAt = new Date(now.getTime() + 8 * 24 * 60 * 60_000);

  await prisma.nurtureCareGroup.create({
    data: {
      id: careGroupId,
      workspaceId: scope.workspaceId,
      institutionId: scope.institutionId,
      name: "Trial class",
      capacity: 1,
      status: "active",
      aggregateVersion: 4,
    },
  });
  const occupyingChild = await prisma.nurtureChild.create({
    data: {
      workspaceId: scope.workspaceId,
      displayName: "Occupying child",
      status: "active",
    },
  });
  const occupyingProcess = await prisma.nurtureChildCareProcess.create({
    data: {
      workspaceId: scope.workspaceId,
      childId: occupyingChild.id,
      status: "active",
    },
  });
  const occupyingEnrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: occupyingProcess.id,
      institutionId: scope.institutionId,
      careGroupId,
      status: "active",
      participationPhase: "formal",
    },
  });
  const contactRef = canonical(
    "my_chat",
    "nurture_prospective_contact",
    `contact-${scope.suffix}`,
  );
  const runner = new NurtureCommandRunner(
    new PrismaNurtureCommandRepository(prisma, () => now),
  );
  const run = <Payload>(input: {
    actor_ref: string;
    payload: Payload;
    spec: NurtureCommandSpec<Payload>;
  }) => runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation-${randomUUID()}`,
    command_request_id: `command-${randomUUID()}`,
    business_actor_ref: input.actor_ref,
    payload: input.payload,
    spec: input.spec,
  }).then((result) => {
    if (result.status !== "ok") {
      throw new Error(`${input.spec.command_key}:${result.status}:${result.reason_code}`);
    }
    return result;
  });
  await run({
    actor_ref: scope.participantId,
    payload: {
      workspace_id: scope.workspaceId,
      institution_ref: scope.institutionId,
      role_assignment_ref: scope.roleAssignmentId,
      expected_workflow_head: 0,
      workflow_run_ref: canonical(
        "my_chat",
        "workflow_run",
        `run-${scope.suffix}`,
      ),
      contact_owner_snapshot: {
        contract_version: "1.0.0",
        contact_ref: contactRef,
        safe_label: "Trial family",
        verified_at: new Date(now.getTime() - 60_000).toISOString(),
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
  const workflow = await prisma.nurtureInstitutionWorkflow.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId },
  });
  const adminBase = (expectedWorkflowHead: number) => ({
    workspace_id: scope.workspaceId,
    institution_ref: scope.institutionId,
    workflow_ref: workflow.id,
    expected_workflow_head: expectedWorkflowHead,
    role_assignment_ref: scope.roleAssignmentId,
  });
  await run({
    actor_ref: scope.participantId,
    payload: {
      ...adminBase(1),
      source_channel: "phone",
      confirmed_need_keys: ["weekday_care"],
      safety_label_keys: [],
      next_action_key: "confirm_intent",
      responsible_role: "institution_admin",
      occurred_at: new Date(now.getTime() - 2 * 60 * 60_000).toISOString(),
      due_at: new Date(now.getTime() + 60 * 60_000).toISOString(),
      next_touchpoint_at: new Date(now.getTime() + 60 * 60_000).toISOString(),
      external_summary_body_envelope: {
        algVersion: 1,
        keyRef: "trial-owner-fixture-key",
        ciphertext: "c3VtbWFyeQ",
        integrityTag: "dGFn",
      },
    },
    spec: recordExternalTouchpointSpec,
  });
  await run({
    actor_ref: scope.participantId,
    payload: adminBase(2),
    spec: confirmIntentConversationSpec,
  });
  const guardianAction = {
    contract_version: "1.0.0" as const,
    actor_ref: guardianActorRef,
    contact_ref: contactRef,
    action_ref: canonical(
      "my_chat",
      "enrollment_action",
      `qualify-action-${scope.suffix}`,
    ),
    occurred_at: new Date(now.getTime() - 1_000).toISOString(),
    verified_at: now.toISOString(),
  };
  const formalClock = { now };
  const formalWorld = composed(formalClock);
  const journeyOption = formalWorld.owners.enrollmentJourneyOptionIssuer.issue({
    workspace_id: scope.workspaceId,
    actor_participant_ref: scope.participantId,
    kind: "journey",
    target_ref: workflow.id,
    waitlist_entry_ref: `pre-waitlist-${scope.suffix}`,
    waitlist_entry_head: 0,
  });
  const careGroupOption = formalWorld.owners.enrollmentJourneyOptionIssuer.issue({
    workspace_id: scope.workspaceId,
    actor_participant_ref: scope.participantId,
    kind: "care_group",
    target_ref: careGroupId,
  });
  if (!journeyOption || !careGroupOption) {
    throw new Error("qualification option issue failed");
  }
  const qualifyResult = await executePreparedAdminCommand({
    world: formalWorld,
    scope,
    request: {
      capabilityKey: "qualify_capacity_waitlist",
      capabilityVersion: "1.0.0",
      targetOptionRef: journeyOption,
      operationInput: {
        targetCareGroupOptionRef: careGroupOption,
        categoryKey: "standard",
        categoryBasisKey: "family_confirmed",
        nextReviewAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000).toISOString(),
      },
    },
    currentOwnerCarrier: {
      ...currentOwnerFacts(now).familyCarrier,
      guardianAction,
    },
  });
  if (qualifyResult.status !== "ok") {
    throw new Error(`formal qualification failed:${JSON.stringify(qualifyResult)}`);
  }
  const entry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId, workflowId: workflow.id },
  });
  await prisma.nurtureEnrollment.update({
    where: { id: occupyingEnrollment.id },
    data: { status: "ended", leftAt: now },
  });
  await run({
    actor_ref: scope.participantId,
    payload: {
      ...adminBase(4),
      entry_ref: entry.id,
      expected_entry_head: 1,
      expires_at: new Date(now.getTime() + 2 * 60 * 60_000).toISOString(),
      trial_starts_at: trialStartsAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      review_at: new Date(trialEndsAt.getTime() - 24 * 60 * 60_000).toISOString(),
      reason_key: "admin_issued_trial_offer",
    },
    spec: issueTrialOfferSpec,
  });
  const offer = await prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId, workflowId: workflow.id },
  });
  await run({
    actor_ref: guardianActorRef.object_id,
    payload: {
      workspace_id: scope.workspaceId,
      institution_ref: scope.institutionId,
      workflow_ref: workflow.id,
      expected_workflow_head: 5,
      entry_ref: entry.id,
      expected_entry_head: 2,
      offer_ref: offer.id,
      expected_offer_head: 1,
      guardian_action_owner_snapshot: {
        ...guardianAction,
        action_ref: canonical(
          "my_chat",
          "enrollment_action",
          `accept-action-${scope.suffix}`,
        ),
        occurred_at: now.toISOString(),
      },
    },
    spec: acceptTrialOfferSpec,
  });
  const reservation = await prisma.nurtureEnrollmentTrialReservation.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId, workflowId: workflow.id },
  });
  const workflowId = workflow.id;
  const entryId = entry.id;
  const reservationId = reservation.id;

  await prisma.nurtureParticipant.create({
    data: {
      id: guardianParticipantId,
      workspaceId: scope.workspaceId,
      myChatUserId: `guardian-user-${scope.suffix}`,
      status: "active",
    },
  });
  await prisma.nurtureParticipantPrincipalBinding.create({
    data: {
      workspaceId: scope.workspaceId,
      participantId: guardianParticipantId,
      accountObjectId: `guardian-account-${scope.suffix}`,
      actorObjectId: guardianActorRef.object_id,
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: {
      workspaceId: scope.workspaceId,
      displayName: "Trial child",
      status: "active",
    },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId: scope.workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: process.id,
      displayName: "Trial family",
      status: "active",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId: scope.workspaceId,
      participantId: guardianParticipantId,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
      endsAt: ownerExpiresAt,
    },
  });
  const childAnchor = await prisma.nurtureChildBindingAnchor.create({
    data: { reservationKeyHash: fixtureHash(), status: "associated" },
  });
  const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
    data: { reservationKeyHash: fixtureHash(), status: "associated" },
  });
  const childAssociation = await prisma.nurtureChildAnchorAssociation.create({
    data: {
      workspaceId: scope.workspaceId,
      childAnchorId: childAnchor.id,
      childId: child.id,
    },
  });
  await prisma.nurtureFamilyAnchorAssociation.create({
    data: {
      workspaceId: scope.workspaceId,
      familyAnchorId: familyAnchor.id,
      childAnchorId: childAnchor.id,
      childAssociationId: childAssociation.id,
      currentChildAssociationId: childAssociation.id,
      childId: child.id,
      childCareProcessId: process.id,
      familyId: family.id,
    },
  });
  const childOwnerRef = `nurture_child_binding_anchor_v1:${childAnchor.id}`;
  const familyOwnerRef = `nurture_family_binding_anchor_v1:${familyAnchor.id}`;
  const authorizations = [];
  for (const [subjectType, anchorId, ownerRef] of [
    ["child", childAnchor.id, childOwnerRef],
    ["family", familyAnchor.id, familyOwnerRef],
  ] as const) {
    authorizations.push(await prisma.nurtureScenarioBindingAuthorization.create({
      data: {
        workspaceId: scope.workspaceId,
        subjectType,
        ...(subjectType === "child"
          ? { childAnchorId: anchorId }
          : { familyAnchorId: anchorId }),
        ownerRef,
        ownerVersion: 1,
        idempotencyKeyHash: fixtureHash(),
        requestFingerprint: fixtureHash(),
        subjectEvidenceHash: fixtureHash(),
        userEvidenceHash: fixtureHash(),
        actorEvidenceHash: fixtureHash(),
        purpose: "scenario_binding_write",
        authorizationSourceRef: "my_chat_child_identity",
        authorizationSourceVersion: 1,
        status: "active",
        verifiedAt: new Date(now.getTime() - 60_000),
        expiresAt: ownerExpiresAt,
      },
    }));
  }
  const policy = await prisma.nurtureEnrollmentTrialGrantPolicy.create({
    data: {
      workspaceId: scope.workspaceId,
      institutionId: scope.institutionId,
      contractVersion: "1.0.0",
      policyRef: "trial-care-policy",
      policyRevision: 1,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["daily_care_log", "care_day_note"],
      purposes: ["trial_care"],
      effectiveFrom: new Date(now.getTime() - 60_000),
      expiresAt: policyExpiresAt,
    },
  });
  const carrier: NurtureEnrollmentJourneyCurrentOwnerCarrierV1 = {
    carrierVersion: 1,
    currentOwnerEvidence: {
      binding_evidence_version: 1,
      purpose_key: "enrollment_trial_pair",
      owner_bindings: [
        {
          owner_binding_ref_version: 1,
          binding_slot: "child",
          owner_ref: {
            ...canonical("scenario-owner", "child_binding_owner", childOwnerRef),
            version: 1,
          },
        },
        {
          owner_binding_ref_version: 1,
          binding_slot: "family",
          owner_ref: {
            ...canonical("scenario-owner", "family_binding_owner", familyOwnerRef),
            version: 1,
          },
        },
      ],
      pair_relation_evidence_hash: fixtureHash(),
      current_owner_evidence_hash: fixtureHash(),
    },
  };
  return {
    workflowId,
    entryId,
    reservationId,
    careGroupId,
    carrier,
    guardianActorRef,
    guardianPrincipal: {
      principal_version: 1 as const,
      principal_kind: "human_user" as const,
      account_ref: canonical(
        "my_chat",
        "user",
        `guardian-account-${scope.suffix}`,
      ),
      actor_ref: guardianActorRef,
      workspace_ref: canonical("my_chat", "workspace", scope.workspaceId),
      principal_origin: "interactive_session" as const,
    },
    guardianParticipantId,
    guardianRoleId: guardianRole.id,
    childAuthorizationId: authorizations[0]!.id,
    childAnchorId: childAnchor.id,
    childOwnerRef,
    familyOwnerRef,
    ownerExpiresAt,
    policyId: policy.id,
    policyExpiresAt,
    processId: process.id,
    contactRef,
    reviewAt: new Date(trialEndsAt.getTime() - 24 * 60 * 60_000),
    trialEndsAt,
    qualifyResult,
  };
}

async function seedNativeSource(scope: SeededScope) {
  const guardian = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: scope.workspaceId,
      myChatUserId: `native-guardian-${scope.suffix}`,
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId: scope.workspaceId, displayName: "Native child", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId: scope.workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: process.id,
      displayName: "Native family",
      status: "active",
    },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId: scope.workspaceId,
      institutionId: scope.institutionId,
      name: "Native source class",
      status: "active",
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: process.id,
      institutionId: scope.institutionId,
      careGroupId: careGroup.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId: scope.workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: careGroup.id,
      directions: ["family_to_org"],
      dataClasses: ["family_care_question"],
      purposes: ["family_care_workflow"],
      policySnapshotPayload: {
        institution_admin_business_communication: {
          schema_version: 1,
          disclosed: true,
          institution_id: scope.institutionId,
          enrollment_id: enrollment.id,
          care_group_id: careGroup.id,
          directions: ["family_to_org"],
          data_classes: ["family_care_question"],
          purposes: ["family_care_workflow"],
        },
      },
      status: "active",
    },
  });
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: careGroup.id,
      visibilityScope: "family_private",
      status: "active",
    },
  });
  const protection = createAesGcmProtectedContentPort({
    keyRef: "t007-native-source-protected-key",
    keyMaterial: "t007-native-source-protected-key-material-0001",
  });
  const message = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId: scope.workspaceId,
      threadId: thread.id,
      childCareProcessId: process.id,
      senderParticipantId: guardian.id,
      senderRoleAssignmentId: guardianRole.id,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: "protected",
      bodyProtectionPayload: protection.seal("private-family-message") as never,
      sourceSurface: "mobile",
      grantId: grant.id,
      status: "sent",
      writerContract: "harness_g2_v1",
      enrollmentId: enrollment.id,
      careGroupId: careGroup.id,
      direction: "family_to_org",
    },
  });
  await prisma.nurtureFamilyCareItem.create({
    data: {
      workspaceId: scope.workspaceId,
      sourceMessageId: message.id,
      threadId: thread.id,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: careGroup.id,
      dataClass: "family_care_question",
      category: "question",
      summary: "Private family message",
      urgency: "normal",
      requiresAck: true,
      requiresReply: true,
      status: "open",
      classificationSource: "system",
      grantId: grant.id,
      writerContract: "harness_g2_v1",
    },
  });
  return { messageId: message.id };
}

function fixtureHash(): string {
  return randomUUID().replaceAll("-", "").repeat(2);
}

async function seedAdminScope(label: string): Promise<SeededScope> {
  const suffix = `${label}-${randomUUID()}`;
  const scope: SeededScope = {
    suffix,
    workspaceId: `workspace-${suffix}`,
    participantId: `participant-${suffix}`,
    institutionId: `institution-${suffix}`,
    roleAssignmentId: `role-${suffix}`,
    accountId: `account-${suffix}`,
    actorId: `actor-${suffix}`,
    principal: undefined as never,
  };
  scope.principal = {
    principal_version: 1,
    principal_kind: "human_user",
    account_ref: canonical("my_chat", "user", scope.accountId),
    actor_ref: canonical("my_chat", "actor", scope.actorId),
    workspace_ref: canonical("my_chat", "workspace", scope.workspaceId),
    principal_origin: "interactive_session",
  };
  await prisma.nurtureParticipant.create({
    data: {
      id: scope.participantId,
      workspaceId: scope.workspaceId,
      myChatUserId: scope.accountId,
      status: "active",
      aggregateVersion: 7,
    },
  });
  await prisma.nurtureParticipantPrincipalBinding.create({
    data: {
      participantId: scope.participantId,
      workspaceId: scope.workspaceId,
      accountObjectId: scope.accountId,
      actorObjectId: scope.actorId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 9,
    },
  });
  await prisma.nurtureCareInstitution.create({
    data: {
      id: scope.institutionId,
      workspaceId: scope.workspaceId,
      displayName: "T-007 enrollment disposable institution",
      status: "active",
      aggregateVersion: 3,
    },
  });
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      id: scope.roleAssignmentId,
      workspaceId: scope.workspaceId,
      participantId: scope.participantId,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: scope.institutionId,
      status: "active",
      aggregateVersion: 5,
    },
  });
  return scope;
}

async function cleanupScope(workspaceId: string) {
  await prisma.nurtureWorkflowRunSettlement.deleteMany({ where: { workspaceId } });
  await prisma.nurtureEnrollmentJourneyPreparedCommand.deleteMany({ where: { workspaceId } });
  await prisma.nurtureCareRoleAssignment.deleteMany({ where: { workspaceId } });
  await prisma.nurtureCareInstitution.deleteMany({ where: { workspaceId } });
  await prisma.nurtureParticipantPrincipalBinding.deleteMany({ where: { workspaceId } });
  await prisma.nurtureParticipant.deleteMany({ where: { workspaceId } });
}

function hostReservation(suffix: string) {
  return {
    evidence_version: 1 as const,
    logical_operation_id: `logical-${suffix}`,
    reservation_ref: {
      ...canonical("my_chat", "workflow_run_reservation", `reservation-${suffix}`),
      version: 1,
    },
    run_ref: canonical("my_chat", "workflow_run", `run-${suffix}`),
    binding_fingerprint_sha256: "b".repeat(64),
    reservation_evidence_sha256: "e".repeat(64),
  };
}

function canonical(
  namespace: "my_chat" | "nurture" | "scenario-owner",
  objectType: string,
  objectId: string,
) {
  return {
    schema_version: 1 as const,
    namespace,
    object_type: objectType,
    object_id: objectId,
  };
}
