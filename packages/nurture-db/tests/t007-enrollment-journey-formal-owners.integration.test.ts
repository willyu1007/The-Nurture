import { randomUUID } from "node:crypto";
import type { ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import type { NurtureEnrollmentContactOwnerV1 } from "@my-chat/scenario-integrations";
import {
  NurtureEnrollmentJourneyPreparedCommandCrypto,
  type InstitutionBusinessCommunicationReadPort,
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
  type NurtureEnrollmentCurrentOwnerEvidenceV1,
} from "../src/enrollment-journey-owner-providers.js";
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
  it("rejects malformed, cross-pair and expired current-owner source facts", async () => {
    const now = new Date("2026-08-12T10:00:00.000Z");
    const pairOwner = { isTrialSnapshotCurrent: vi.fn(async () => true) };
    const sourceValue = currentOwnerSourceValue(now);
    let returned = sourceValue;
    const provider = createNurtureEnrollmentJourneyCurrentOwnerProvider({
      source: {
        fetchCurrentOwnerEvidence: async () => ({
          status: "resolved",
          value: returned,
        }),
      },
      pairOwner,
      now: () => now,
    });
    const request = {
      workspace_id: "workspace-current-owner",
      institution_ref: "institution-current-owner",
      workflow_ref: "workflow-current-owner",
    };

    returned = {
      ...sourceValue,
      evidence: {
        ...sourceValue.evidence,
        purpose_key: "enrollment_family_acceptance",
      },
      guardian_action: {
        ...sourceValue.guardian_action,
        action_ref: { ...sourceValue.guardian_action.action_ref, namespace: "nurture" },
      },
    } as typeof sourceValue;
    await expect(provider.resolveFamilyAcceptance(request)).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_guardian_action_invalid",
    });

    returned = {
      ...sourceValue,
      pair: sourceValue.pair && {
        ...sourceValue.pair,
        child_owner_ref: "nurture_child_binding_anchor_v1:another-child",
      },
    };
    await expect(provider.resolveTrialPair(request)).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_pair_evidence_drift",
    });
    expect(pairOwner.isTrialSnapshotCurrent).not.toHaveBeenCalled();

    returned = {
      ...sourceValue,
      grant_terms: sourceValue.grant_terms && {
        ...sourceValue.grant_terms,
        expires_at: now.toISOString(),
      },
    };
    await expect(provider.resolveTrialPair(request)).resolves.toEqual({
      status: "denied",
      reason_code: "current_owner_grant_terms_not_current",
    });
    expect(pairOwner.isTrialSnapshotCurrent).not.toHaveBeenCalled();
  });

  it("admits only the exact current pair after the local owner reread", async () => {
    const now = new Date("2026-08-12T10:00:00.000Z");
    const value = currentOwnerSourceValue(now);
    const pairOwner = { isTrialSnapshotCurrent: vi.fn(async () => true) };
    const provider = createNurtureEnrollmentJourneyCurrentOwnerProvider({
      source: {
        fetchCurrentOwnerEvidence: async () => ({ status: "resolved", value }),
      },
      pairOwner,
      now: () => now,
    });

    await expect(provider.resolveTrialPair({
      workspace_id: "workspace-current-owner",
      institution_ref: "institution-current-owner",
      workflow_ref: "workflow-current-owner",
    })).resolves.toEqual({
      status: "resolved",
      pair: value.pair,
      grant_terms: value.grant_terms,
    });
    expect(pairOwner.isTrialSnapshotCurrent).toHaveBeenCalledOnce();
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
        capability_key: "start_enrollment_inquiry",
        target_option_ref: option,
      });
      expect(authority.status).toBe("resolved");
      if (authority.status !== "resolved") throw new Error("authority failed");
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
    currentOwnerEvidenceSource: {
      fetchCurrentOwnerEvidence: async () => ({
        status: "unavailable",
        reason_code: "current_owner_evidence_unavailable",
      }),
    },
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

function currentOwnerSourceValue(
  now: Date,
): NurtureEnrollmentCurrentOwnerEvidenceV1 {
  const childOwnerRef = "nurture_child_binding_anchor_v1:child-current-owner";
  const familyOwnerRef = "nurture_family_binding_anchor_v1:family-current-owner";
  return {
    evidence: {
      binding_evidence_version: 1 as const,
      purpose_key: "enrollment_trial_pair",
      owner_bindings: [
        {
          owner_binding_ref_version: 1 as const,
          binding_slot: "child" as const,
          owner_ref: {
            ...canonical("scenario-owner", "child_binding_owner", childOwnerRef),
            version: 2,
          },
        },
        {
          owner_binding_ref_version: 1 as const,
          binding_slot: "family" as const,
          owner_ref: {
            ...canonical("scenario-owner", "family_binding_owner", familyOwnerRef),
            version: 3,
          },
        },
      ],
      pair_relation_evidence_hash: "a".repeat(64),
      current_owner_evidence_hash: "b".repeat(64),
    },
    guardian_action: {
      contract_version: "1.0.0" as const,
      actor_ref: canonical("my_chat", "actor", "actor-current-owner"),
      contact_ref: canonical("my_chat", "nurture_prospective_contact", "contact-current-owner"),
      action_ref: canonical("my_chat", "enrollment_action", "action-current-owner"),
      occurred_at: new Date(now.getTime() - 2_000).toISOString(),
      verified_at: new Date(now.getTime() - 1_000).toISOString(),
    },
    pair: {
      contract_version: "1.0.0" as const,
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
    grant_terms: {
      contract_version: "1.0.0" as const,
      policy_ref: "policy-current-owner",
      policy_revision: 1,
      directions: ["family_to_org", "org_to_family"] as const,
      data_classes: ["daily_care_log"] as const,
      purposes: ["trial_care"],
      verified_at: new Date(now.getTime() - 1_000).toISOString(),
      expires_at: new Date(now.getTime() + 30_000).toISOString(),
    },
  };
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
