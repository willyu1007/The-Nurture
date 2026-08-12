import type { PrismaClient } from "@prisma/client";
import type { NurtureEnrollmentContactOwnerV1 } from "@my-chat/scenario-integrations";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import {
  NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS,
  NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS,
  NurtureCommandRunner,
  NurtureDeterministicRollback,
  NurtureEnrollmentJourneyCurrentAuthorityOwner,
  NurtureEnrollmentJourneyPreparedCommandCrypto,
  NurtureEnrollmentJourneyPreparedCommandOwner,
  NurtureEnrollmentJourneyTargetOptionCodec,
  createNurtureWorkflowRunSettlementOwner,
  withNurtureWorkflowRunSettlementFinalizer,
  workflowRunSettlementBinding,
  type InstitutionBusinessCommunicationReadPort,
  type NurtureCommandRepository,
  type NurtureCommandResult,
  type NurtureCommandSpec,
  type NurtureEnrollmentJourneyAdapterRequest,
  type NurtureEnrollmentJourneyBindingDecision,
  type NurtureEnrollmentJourneyBindingPort,
  type NurtureEnrollmentJourneyCommandExecutionResult,
  type NurtureEnrollmentJourneyCommandExecutor,
  type NurtureEnrollmentJourneyCommandKey,
  type NurtureEnrollmentJourneyFormalAuthorityResolverV1,
  type NurtureEnrollmentJourneyPreparedBindingV1,
  type NurtureEnrollmentJourneyPreparedCommandOwnerV1,
  type NurtureEnrollmentJourneySurfaceDeps,
  type NurtureEnrollmentJourneyTargetSelectionV1,
  type NurtureEnrollmentJourneyTrustedContextV1,
  type NurtureWorkflowRunSettlementBindingV1,
  type NurtureWorkflowRunSettlementOwnerV1,
  type ProtectedContentWritePort,
} from "@the-nurture/scenario";
import {
  createNurtureEnrollmentJourneyCurrentOwnerProvider,
  createNurtureEnrollmentNativeSourceProvider,
  createNurtureEnrollmentProspectiveContactProvider,
  type NurtureEnrollmentCurrentOwnerEvidenceSourceV1,
  type NurtureEnrollmentJourneyCurrentOwnerProviderV1,
  type NurtureEnrollmentNativeSourceProviderV1,
  type NurtureEnrollmentProspectiveContactProviderV1,
} from "./enrollment-journey-owner-providers.js";
import { PrismaNurtureParticipantBindingReader } from "./c30/participant-binding.js";
import {
  PrismaNurtureEnrollmentJourneyAdminRoleReader,
  PrismaNurtureEnrollmentJourneyCurrentTargetReader,
  PrismaNurtureEnrollmentJourneyParticipantAuthorityReader,
} from "./repositories/enrollment-journey-current-authority.repository.js";
import { PrismaNurtureEnrollmentJourneyPreparedCommandLedger } from "./repositories/enrollment-journey-prepared-command.repository.js";
import { PrismaEnrollmentJourneyRepository } from "./repositories/enrollment-journey.repository.js";
import { PrismaEnrollmentPairOwnerRepository } from "./repositories/enrollment-pair-owner.repository.js";
import { PrismaEnrollmentWaitlistRepository } from "./repositories/enrollment-waitlist.repository.js";
import { PrismaNurtureCommandRepository } from "./repositories/institution-core.repositories.js";
import { PrismaNurtureWorkflowRunSettlementRepository } from "./repositories/workflow-run-settlement.repository.js";

const LEDGERED = new Set<string>(NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS);
const DIRECT = new Set<string>(NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS);

type BindingDeps = {
  prisma: PrismaClient;
  codec: NurtureEnrollmentJourneyTargetOptionCodec;
  roles: PrismaNurtureEnrollmentJourneyAdminRoleReader;
  contactProvider: NurtureEnrollmentProspectiveContactProviderV1;
  nativeSourceProvider: NurtureEnrollmentNativeSourceProviderV1;
  currentOwnerProvider: NurtureEnrollmentJourneyCurrentOwnerProviderV1;
  protectedContent: ProtectedContentWritePort;
  workflowRunSettlementOwner: NurtureWorkflowRunSettlementOwnerV1;
  now: () => Date;
};

/**
 * G4-D I3 production binding port: composes the three upstream owners
 * (prospective contact, native source, current owner) with the local Prisma
 * facts. Every owner fact enters through this port — the wire request supplies
 * routing input only. Guardian-only lanes stay absent here (the workbench
 * ingress can never satisfy them) and fail closed at the surface.
 */
class PrismaNurtureEnrollmentJourneyBindingPort
implements NurtureEnrollmentJourneyBindingPort {
  constructor(private readonly deps: BindingDeps) {}

  async resolve(input: {
    request: NurtureEnrollmentJourneyAdapterRequest;
    trusted: NurtureEnrollmentJourneyTrustedContextV1;
  }): Promise<NurtureEnrollmentJourneyBindingDecision> {
    try {
      return await this.resolveInner(input);
    } catch {
      return { status: "unavailable", reason_code: "enrollment_binding_owner_unavailable" };
    }
  }

  private async resolveInner(input: {
    request: NurtureEnrollmentJourneyAdapterRequest;
    trusted: NurtureEnrollmentJourneyTrustedContextV1;
  }): Promise<NurtureEnrollmentJourneyBindingDecision> {
    const { request, trusted } = input;
    const selection = this.deps.codec.resolve({
      workspace_id: trusted.workspace_id,
      participant_ref: trusted.actor_participant_ref,
      target_option_ref: request.targetOptionRef,
    });
    if (!selection) {
      return { status: "denied", reason_code: "enrollment_target_option_invalid" };
    }

    const anchored = await this.anchor(trusted.workspace_id, selection);
    if ("reason_code" in anchored) return anchored;

    const roleRows = await this.deps.roles.readCurrent({
      workspace_id: trusted.workspace_id,
      participant_ref: trusted.actor_participant_ref,
      institution_ref: anchored.institution_ref,
      at: this.deps.now().toISOString(),
      limit: 2,
    });
    if (roleRows.length === 0) {
      return { status: "denied", reason_code: "institution_admin_role_not_current" };
    }
    const role = roleRows[0];
    if (roleRows.length !== 1 || !role) {
      return { status: "unavailable", reason_code: "institution_admin_role_ambiguous" };
    }

    const binding: NurtureEnrollmentJourneyPreparedBindingV1 = {
      surface_key: "institution_workbench",
      active_role: "institution_admin",
      institution_ref: anchored.institution_ref,
      role_assignment_ref: role.role_assignment_ref,
      heads: {},
      refs: {},
    };
    if (anchored.kind === "journey") {
      binding.refs.workflow = anchored.workflow.id;
      binding.heads.workflow = anchored.workflow.workflowHead;
      const runRef = parseWorkflowRunRef(anchored.workflow.workflowRunRef);
      if (!runRef) {
        return { status: "unavailable", reason_code: "enrollment_workflow_run_ref_invalid" };
      }
      binding.workflow_run_ref = runRef;
    }
    if (anchored.kind === "care_group") {
      binding.refs.target_care_group = anchored.care_group_ref;
    }

    return this.enrich(binding, request, trusted, selection, anchored);
  }

  private async anchor(
    workspaceId: string,
    selection: NurtureEnrollmentJourneyTargetSelectionV1,
  ): Promise<
    | { kind: "care_group"; institution_ref: string; care_group_ref: string }
    | {
        kind: "journey";
        institution_ref: string;
        selection_entry_ref: string;
        workflow: {
          id: string;
          workflowHead: number;
          workflowRunRef: unknown;
          childCareProcessId: string | null;
        };
      }
    | { kind: "prospective_contact"; institution_ref: string }
    | { status: "denied"; reason_code: string }
  > {
    if (selection.target_kind === "care_group") {
      const group = await this.deps.prisma.nurtureCareGroup.findFirst({
        where: {
          id: selection.target_ref,
          workspaceId,
          status: "active",
          deletedAt: null,
          institution: { workspaceId, status: "active", deletedAt: null },
        },
        select: { id: true, institutionId: true },
      });
      return group
        ? { kind: "care_group", institution_ref: group.institutionId, care_group_ref: group.id }
        : { status: "denied", reason_code: "enrollment_target_not_found" };
    }
    if (selection.target_kind === "journey") {
      const workflow = await this.deps.prisma.nurtureInstitutionWorkflow.findFirst({
        where: {
          id: selection.target_ref,
          workspaceId,
          institution: { workspaceId, status: "active", deletedAt: null },
        },
        select: {
          id: true,
          institutionId: true,
          workflowHead: true,
          workflowRunRef: true,
          childCareProcessId: true,
        },
      });
      return workflow
        ? {
            kind: "journey",
            institution_ref: workflow.institutionId,
            selection_entry_ref: selection.waitlist_entry_ref,
            workflow,
          }
        : { status: "denied", reason_code: "enrollment_target_not_found" };
    }
    const institution = await this.deps.prisma.nurtureCareInstitution.findFirst({
      where: {
        id: selection.institution_ref,
        workspaceId,
        status: "active",
        deletedAt: null,
      },
      select: { id: true },
    });
    return institution
      ? { kind: "prospective_contact", institution_ref: institution.id }
      : { status: "denied", reason_code: "enrollment_target_not_found" };
  }

  private async enrich(
    binding: NurtureEnrollmentJourneyPreparedBindingV1,
    request: NurtureEnrollmentJourneyAdapterRequest,
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
    selection: NurtureEnrollmentJourneyTargetSelectionV1,
    anchored: { kind: string; institution_ref: string },
  ): Promise<NurtureEnrollmentJourneyBindingDecision> {
    const key = request.capabilityKey;
    const operationInput = request.operationInput as Record<string, unknown>;

    if (key === "start_enrollment_inquiry") {
      if (selection.target_kind !== "prospective_contact") {
        return { status: "denied", reason_code: "enrollment_target_option_invalid" };
      }
      const hostReservation = trusted.host_workflow_run_reservation;
      if (!hostReservation) {
        return {
          status: "unavailable",
          reason_code: "workflow_run_reservation_evidence_required",
        };
      }
      // Registration is the first cross-owner action. No prospective-contact
      // fact is read and no protected value is sealed until the exact signed
      // Host reservation has a durable, replayable Nurture settlement row.
      const settlement = await this.deps.workflowRunSettlementOwner.register({
        workspace_id: trusted.workspace_id,
        command_request_id: trusted.command_request_id,
        host_reservation: hostReservation,
      });
      if (settlement.status === "denied" || settlement.status === "unavailable") {
        return settlement;
      }
      if (settlement.status === "confirmed_no_effect") {
        return {
          status: "denied",
          reason_code: "workflow_run_settlement_already_no_effect",
        };
      }
      const contact = await this.deps.contactProvider.resolveContact({
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        contact_object_id: selection.target_ref,
        contact_version: selection.contact_version,
      });
      if (contact.status !== "resolved") return contact;
      binding.contact_owner_snapshot = contact.snapshot;
      binding.workflow_run_ref = hostReservation.run_ref;
      if (typeof operationInput.birthYearMonth === "string") {
        binding.protected_birth_year_month =
          this.deps.protectedContent.seal(operationInput.birthYearMonth);
      }
      if (typeof operationInput.targetCareGroupOptionRef === "string") {
        const groupRef = await this.resolveCareGroupOption(
          trusted,
          operationInput.targetCareGroupOptionRef,
          binding.institution_ref,
        );
        if (!groupRef) {
          return { status: "denied", reason_code: "enrollment_care_group_option_invalid" };
        }
        binding.refs.target_care_group = groupRef.care_group_ref;
      }
      return { status: "resolved", binding };
    }

    if (key === "record_external_touchpoint") {
      if (typeof operationInput.summary === "string") {
        binding.protected_external_summary =
          this.deps.protectedContent.seal(operationInput.summary);
      }
      // Touchpoint correction refs need a touchpoint option issuance surface
      // that does not exist yet; the correction lane stays fail-closed
      // (`refs.superseded_touchpoint` absent) until it does.
      return { status: "resolved", binding };
    }

    if (key === "confirm_native_touchpoint_note") {
      if (typeof operationInput.sourceMessageOptionRef !== "string") {
        return { status: "denied", reason_code: "native_source_option_invalid" };
      }
      const nativeSource = await this.deps.nativeSourceProvider.resolveNativeSource({
        workspace_id: trusted.workspace_id,
        participant_id: trusted.actor_participant_ref,
        source_message_option_ref: operationInput.sourceMessageOptionRef,
      });
      if (nativeSource.status !== "resolved") return nativeSource;
      binding.native_source_owner_snapshot = nativeSource.snapshot;
      return { status: "resolved", binding };
    }

    if (key === "qualify_capacity_waitlist") {
      if (typeof operationInput.targetCareGroupOptionRef !== "string") {
        return { status: "denied", reason_code: "enrollment_care_group_option_invalid" };
      }
      const group = await this.resolveCareGroupOption(
        trusted,
        operationInput.targetCareGroupOptionRef,
        binding.institution_ref,
      );
      if (!group) {
        return { status: "denied", reason_code: "enrollment_care_group_option_invalid" };
      }
      binding.refs.target_care_group = group.care_group_ref;
      binding.heads.capacity_revision = group.capacity_revision;
      const acceptance = await this.deps.currentOwnerProvider.resolveFamilyAcceptance({
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        workflow_ref: requireRef(binding.refs.workflow),
      });
      if (acceptance.status !== "resolved") return acceptance;
      binding.family_acceptance_owner_snapshot = acceptance.snapshot;
      return { status: "resolved", binding };
    }

    const needsEntry = [
      "review_waitlist_interest",
      "override_waitlist_category",
      "issue_trial_offer",
      "withdraw_from_waitlist",
      "accept_trial_offer",
      "decline_or_expire_trial_offer",
      "cancel_trial_preparation",
      "prepare_trial_relationship",
      "start_trial",
      "mark_trial_review_reached",
      "extend_trial",
      "propose_formal_enrollment",
      "formalize_enrollment",
      "end_trial",
    ].includes(key);
    if (!needsEntry || anchored.kind !== "journey") {
      return { status: "resolved", binding };
    }
    const entryRef = (anchored as { selection_entry_ref?: string }).selection_entry_ref;
    const entry = entryRef
      ? await this.deps.prisma.nurtureEnrollmentWaitlistEntry.findFirst({
          where: {
            id: entryRef,
            workspaceId: trusted.workspace_id,
            workflowId: requireRef(binding.refs.workflow),
          },
          select: {
            id: true,
            entryHead: true,
            targetCareGroupId: true,
            currentOfferId: true,
            targetCareGroup: { select: { aggregateVersion: true } },
          },
        })
      : null;
    if (!entry) return { status: "resolved", binding };
    binding.refs.waitlist_entry = entry.id;
    binding.heads.waitlist_entry = entry.entryHead;
    binding.refs.target_care_group ??= entry.targetCareGroupId;
    binding.heads.capacity_revision ??= entry.targetCareGroup.aggregateVersion;

    if (entry.currentOfferId) {
      const offer = await this.deps.prisma.nurtureEnrollmentTrialOffer.findFirst({
        where: { id: entry.currentOfferId, workspaceId: trusted.workspace_id },
        select: {
          id: true,
          offerHead: true,
          reservation: { select: { id: true, reservationHead: true, targetCareGroupId: true } },
        },
      });
      if (offer) {
        binding.refs.trial_offer = offer.id;
        binding.heads.trial_offer = offer.offerHead;
        if (offer.reservation) {
          binding.refs.reservation = offer.reservation.id;
          binding.heads.reservation = offer.reservation.reservationHead;
        }
      }
    }

    if (["prepare_trial_relationship", "start_trial"].includes(key)) {
      const pair = await this.deps.currentOwnerProvider.resolveTrialPair({
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        workflow_ref: requireRef(binding.refs.workflow),
      });
      if (pair.status !== "resolved") return pair;
      binding.pair_owner_snapshot = pair.pair;
      binding.grant_terms_snapshot = pair.grant_terms;
    }

    if (["start_trial", "mark_trial_review_reached", "extend_trial", "propose_formal_enrollment", "end_trial"].includes(key)) {
      const workflow = (anchored as {
        workflow?: { childCareProcessId: string | null };
      }).workflow;
      const processId = workflow?.childCareProcessId;
      if (processId && binding.refs.target_care_group) {
        const enrollments = await this.deps.prisma.nurtureEnrollment.findMany({
          where: {
            workspaceId: trusted.workspace_id,
            institutionId: binding.institution_ref,
            careGroupId: binding.refs.target_care_group,
            childCareProcessId: processId,
            deletedAt: null,
          },
          select: { id: true, aggregateVersion: true },
          take: 2,
        });
        const enrollment = enrollments[0];
        if (enrollments.length === 1 && enrollment) {
          const grants = await this.deps.prisma.nurtureChildLinkGrant.findMany({
            where: {
              workspaceId: trusted.workspace_id,
              enrollmentId: enrollment.id,
              deletedAt: null,
            },
            select: { id: true, aggregateVersion: true },
            take: 2,
          });
          const grant = grants[0];
          if (grants.length === 1 && grant) {
            binding.refs.enrollment = enrollment.id;
            binding.heads.enrollment = enrollment.aggregateVersion;
            binding.refs.grant = grant.id;
            binding.heads.grant = grant.aggregateVersion;
          }
        }
      }
    }
    return { status: "resolved", binding };
  }

  private async resolveCareGroupOption(
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
    optionRef: string,
    institutionRef: string,
  ): Promise<{ care_group_ref: string; capacity_revision: number } | null> {
    const selection = this.deps.codec.resolve({
      workspace_id: trusted.workspace_id,
      participant_ref: trusted.actor_participant_ref,
      target_option_ref: optionRef,
    });
    if (!selection || selection.target_kind !== "care_group") return null;
    const group = await this.deps.prisma.nurtureCareGroup.findFirst({
      where: {
        id: selection.target_ref,
        workspaceId: trusted.workspace_id,
        institutionId: institutionRef,
        status: "active",
        deletedAt: null,
      },
      select: { id: true, aggregateVersion: true },
    });
    return group
      ? { care_group_ref: group.id, capacity_revision: group.aggregateVersion }
      : null;
  }
}

/**
 * G4-D I3 production command executor. Ledgered capabilities consume their
 * prepared-command row inside the same Serializable transaction as the I1
 * effect (record 63/86); direct_commit capabilities run on the kernel's own
 * command_request_id idempotency with no ledger row.
 */
class PrismaNurtureEnrollmentJourneyCommandExecutor
implements NurtureEnrollmentJourneyCommandExecutor {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly commands: PrismaNurtureCommandRepository,
    private readonly protection: NurtureEnrollmentJourneyPreparedCommandCrypto,
    private readonly now: () => Date,
  ) {}

  async execute<Input>(input: {
    capability_key: NurtureEnrollmentJourneyCommandKey;
    confirmation_ref: string;
    trusted: NurtureEnrollmentJourneyTrustedContextV1;
    spec: NurtureCommandSpec<Input>;
    payload: Input;
  }): Promise<NurtureEnrollmentJourneyCommandExecutionResult> {
    if (!LEDGERED.has(input.capability_key) && !DIRECT.has(input.capability_key)) {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: "enrollment_capability_unknown",
      };
    }
    const ledgered = LEDGERED.has(input.capability_key);
    const repository = ledgered
      ? this.consumingRepository(input.trusted, input.confirmation_ref)
      : this.commands;
    const settlementBinding = this.settlementBinding(input);
    if (input.capability_key === "start_enrollment_inquiry" && !settlementBinding) {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: "workflow_run_settlement_binding_invalid",
      };
    }
    const spec = settlementBinding
      ? withNurtureWorkflowRunSettlementFinalizer(input.spec, settlementBinding)
      : input.spec;
    const runner = new NurtureCommandRunner(repository);
    let result: NurtureCommandResult;
    try {
      result = await runner.execute({
        workspace_id: input.trusted.workspace_id,
        invocation_request_id: input.trusted.invocation_request_id,
        command_request_id: input.trusted.command_request_id,
        business_actor_ref: input.trusted.actor_participant_ref,
        payload: input.payload,
        spec,
      });
    } catch {
      return { status: "outcome_unknown", reason_code: "enrollment_command_runner_failed" };
    }
    if (result.status === "not_committed") {
      if (ledgered && result.reason_code === "prepared_command_expired") {
        // Persist the expiry scrub the aborted transaction rolled back.
        await this.persistExpiryScrub(input.trusted, input.confirmation_ref);
      }
      return result;
    }
    if (result.status === "outcome_unknown") return result;

    const workflowRef = readWorkflowRef(result.committed_result, input.payload);
    const payloadScope = input.payload as {
      institution_ref?: string;
      role_assignment_ref?: string;
    };
    if (!workflowRef || typeof payloadScope.institution_ref !== "string") {
      return { status: "outcome_unknown", reason_code: "committed_result_scope_unreadable" };
    }
    let read;
    try {
      read = await new PrismaEnrollmentJourneyRepository(this.prisma).readWorkflow({
        workspace_id: input.trusted.workspace_id,
        institution_ref: payloadScope.institution_ref,
        participant_ref: input.trusted.actor_participant_ref,
        ...(typeof payloadScope.role_assignment_ref === "string"
          ? { role_assignment_ref: payloadScope.role_assignment_ref }
          : {}),
        workflow_ref: workflowRef,
      });
    } catch {
      return { status: "outcome_unknown", reason_code: "committed_result_read_unavailable" };
    }
    if (read.status !== "resolved") {
      return { status: "outcome_unknown", reason_code: "committed_result_read_unavailable" };
    }
    return {
      status: "committed",
      disposition: result.disposition,
      workflow: read.workflow,
    };
  }

  private settlementBinding(input: {
    capability_key: NurtureEnrollmentJourneyCommandKey;
    trusted: NurtureEnrollmentJourneyTrustedContextV1;
  }): NurtureWorkflowRunSettlementBindingV1 | null {
    if (input.capability_key !== "start_enrollment_inquiry") return null;
    const hostReservation = input.trusted.host_workflow_run_reservation;
    return hostReservation
      ? workflowRunSettlementBinding({
          workspace_id: input.trusted.workspace_id,
          command_request_id: input.trusted.command_request_id,
          host_reservation: hostReservation,
        })
      : null;
  }

  private consumingRepository(
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
    confirmationRef: string,
  ): NurtureCommandRepository {
    const confirmationRefHash = this.protection.tag({
      purpose: "confirmation-ref",
      values: [confirmationRef],
    });
    const inner = this.commands;
    const consumedAt = this.now().toISOString();
    return {
      findCommitted: (input) => inner.findCommitted(input),
      classifyRollback: (error) => inner.classifyRollback(error),
      executeLocked: (input) =>
        inner.executeLocked({
          ...input,
          operation: async (transaction) => {
            const ledger = transaction.enrollmentPreparedCommands;
            if (!ledger) {
              throw new NurtureDeterministicRollback(
                "prepared_command_ledger_unavailable",
                "technical_error",
              );
            }
            const consumed = await ledger.consumeExact({
              workspace_id: trusted.workspace_id,
              participant_ref: trusted.actor_participant_ref,
              command_request_id: trusted.command_request_id,
              confirmation_ref_hash: confirmationRefHash,
              consumed_at: consumedAt,
            });
            if (consumed.status === "not_found") {
              throw new NurtureDeterministicRollback("prepared_command_not_found", "invalid");
            }
            if (consumed.status === "expired") {
              throw new NurtureDeterministicRollback("prepared_command_expired", "blocked");
            }
            if (consumed.status === "conflict") {
              throw new NurtureDeterministicRollback(
                "prepared_command_reuse_conflict",
                "conflict",
              );
            }
            return input.operation(transaction);
          },
        }),
    };
  }

  private async persistExpiryScrub(
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
    confirmationRef: string,
  ): Promise<void> {
    try {
      await new PrismaNurtureEnrollmentJourneyPreparedCommandLedger(this.prisma).consumeExact({
        workspace_id: trusted.workspace_id,
        participant_ref: trusted.actor_participant_ref,
        command_request_id: trusted.command_request_id,
        confirmation_ref_hash: this.protection.tag({
          purpose: "confirmation-ref",
          values: [confirmationRef],
        }),
        consumed_at: this.now().toISOString(),
      });
    } catch {
      // Hygiene only; the next attempt scrubs again.
    }
  }
}

export type PrismaNurtureEnrollmentJourneyFormalOwners = Readonly<{
  enrollmentJourneyAuthorityResolver: NurtureEnrollmentJourneyFormalAuthorityResolverV1;
  enrollmentJourneyPreparedCommandOwner: NurtureEnrollmentJourneyPreparedCommandOwnerV1;
  enrollmentJourneyOptionIssuer: NurtureEnrollmentJourneyTargetOptionCodec;
  enrollmentJourneySurfaceDeps: NurtureEnrollmentJourneySurfaceDeps;
  workflowRunSettlementOwner: NurtureWorkflowRunSettlementOwnerV1;
}>;

/**
 * Composes the Nurture-owned pieces of the formal Enrollment Journey ingress
 * (record 86). Supplying this bundle does not register a route, enable a
 * feature or create external traffic; the My-Chat prospective-contact owner
 * and the wave4 current-owner evidence source arrive as inputs, never as a
 * reverse source pin.
 */
export function createPrismaNurtureEnrollmentJourneyFormalOwners(input: {
  prisma: PrismaClient;
  targetOptionIntegrityKey: string;
  preparedCommandIntegrityKey: string;
  preparedCommandEncryptionSecret: string;
  messageRefIntegrityKey: string;
  contactOwner: NurtureEnrollmentContactOwnerV1;
  businessCommunicationReads: InstitutionBusinessCommunicationReadPort;
  currentOwnerEvidenceSource: NurtureEnrollmentCurrentOwnerEvidenceSourceV1;
  protectedContent: ProtectedContentWritePort;
  now?: () => Date;
  preparedCommandTtlMs?: number;
}): PrismaNurtureEnrollmentJourneyFormalOwners {
  const now = input.now ?? (() => new Date());
  const participantBindings = new PrismaNurtureParticipantBindingReader(input.prisma);
  const participantAuthority =
    new PrismaNurtureEnrollmentJourneyParticipantAuthorityReader(input.prisma, now);
  const codec = new NurtureEnrollmentJourneyTargetOptionCodec(input.targetOptionIntegrityKey);
  const enrollmentJourneyAuthorityResolver =
    new NurtureEnrollmentJourneyCurrentAuthorityOwner({
      participantBindings,
      participantAuthority,
      targetOptions: codec,
      targets: new PrismaNurtureEnrollmentJourneyCurrentTargetReader(input.prisma),
      roles: new PrismaNurtureEnrollmentJourneyAdminRoleReader(input.prisma),
      now,
    });
  const protection = new NurtureEnrollmentJourneyPreparedCommandCrypto(
    input.preparedCommandIntegrityKey,
    input.preparedCommandEncryptionSecret,
  );
  const enrollmentJourneyPreparedCommandOwner =
    new NurtureEnrollmentJourneyPreparedCommandOwner({
      ledger: new PrismaNurtureEnrollmentJourneyPreparedCommandLedger(input.prisma),
      participantBindings,
      participantAuthority,
      protection,
      now,
      ...(input.preparedCommandTtlMs === undefined
        ? {}
        : { ttlMs: input.preparedCommandTtlMs }),
    });
  const workflowRunSettlementOwner = createNurtureWorkflowRunSettlementOwner({
    repository: new PrismaNurtureWorkflowRunSettlementRepository(
      input.prisma,
      now,
    ),
  });
  const bindings = new PrismaNurtureEnrollmentJourneyBindingPort({
    prisma: input.prisma,
    codec,
    roles: new PrismaNurtureEnrollmentJourneyAdminRoleReader(input.prisma),
    contactProvider: createNurtureEnrollmentProspectiveContactProvider({
      owner: input.contactOwner,
    }),
    nativeSourceProvider: createNurtureEnrollmentNativeSourceProvider({
      reads: input.businessCommunicationReads,
      messageRefIntegrityKey: input.messageRefIntegrityKey,
      now,
    }),
    currentOwnerProvider: createNurtureEnrollmentJourneyCurrentOwnerProvider({
      source: input.currentOwnerEvidenceSource,
      pairOwner: new PrismaEnrollmentPairOwnerRepository(input.prisma, now),
      now,
    }),
    protectedContent: input.protectedContent,
    workflowRunSettlementOwner,
    now,
  });
  const commands = new PrismaNurtureEnrollmentJourneyCommandExecutor(
    input.prisma,
    new PrismaNurtureCommandRepository(input.prisma, now),
    protection,
    now,
  );
  const enrollmentJourneySurfaceDeps: NurtureEnrollmentJourneySurfaceDeps = Object.freeze({
    bindings,
    commands,
    journeyQueries: new PrismaEnrollmentJourneyRepository(input.prisma),
    waitlistQueries: new PrismaEnrollmentWaitlistRepository(input.prisma, now),
    targetOptions: codec,
  });

  return Object.freeze({
    enrollmentJourneyAuthorityResolver,
    enrollmentJourneyPreparedCommandOwner,
    enrollmentJourneyOptionIssuer: codec,
    enrollmentJourneySurfaceDeps,
    workflowRunSettlementOwner,
  });
}

export type PrismaNurtureEnrollmentJourneyFormalModuleBinding = Readonly<{
  enrollmentJourneyFormalOwnerBinding: Readonly<{
    surfaceDeps: NurtureEnrollmentJourneySurfaceDeps;
    authorityResolver: NurtureEnrollmentJourneyFormalAuthorityResolverV1;
    preparedCommandOwner: NurtureEnrollmentJourneyPreparedCommandOwnerV1;
    workflowRunSettlementOwner: NurtureWorkflowRunSettlementOwnerV1;
  }>;
}>;

/**
 * Creates the one module binding for the formal Enrollment Journey owners.
 * The surface dependencies must use the very same option codec instance; a
 * second codec/key would create an unverifiable target-option track.
 */
export function bindPrismaNurtureEnrollmentJourneyFormalOwners(input: {
  formalOwners: PrismaNurtureEnrollmentJourneyFormalOwners;
}): PrismaNurtureEnrollmentJourneyFormalModuleBinding {
  if (
    input.formalOwners.enrollmentJourneySurfaceDeps.targetOptions
    !== input.formalOwners.enrollmentJourneyOptionIssuer
  ) {
    throw new Error("Enrollment Journey option issuer must be the formal owner codec instance");
  }
  return Object.freeze({
    enrollmentJourneyFormalOwnerBinding: Object.freeze({
      surfaceDeps: input.formalOwners.enrollmentJourneySurfaceDeps,
      authorityResolver: input.formalOwners.enrollmentJourneyAuthorityResolver,
      preparedCommandOwner: input.formalOwners.enrollmentJourneyPreparedCommandOwner,
      workflowRunSettlementOwner: input.formalOwners.workflowRunSettlementOwner,
    }),
  });
}

function requireRef(value: string | undefined): string {
  if (value === undefined) throw new Error("incomplete_trusted_binding");
  return value;
}

function parseWorkflowRunRef(value: unknown): CanonicalRef | null {
  if (
    typeof value !== "object" || value === null || Array.isArray(value)
  ) return null;
  const ref = value as Record<string, unknown>;
  return ref.schema_version === 1
    && typeof ref.namespace === "string"
    && typeof ref.object_type === "string"
    && typeof ref.object_id === "string"
    ? (value as CanonicalRef)
    : null;
}

function readWorkflowRef(committedResult: unknown, payload: unknown): string | null {
  const fromResult =
    typeof committedResult === "object" && committedResult !== null
      ? (committedResult as Record<string, unknown>).workflow_ref
      : undefined;
  if (typeof fromResult === "string") return fromResult;
  const fromPayload =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).workflow_ref
      : undefined;
  return typeof fromPayload === "string" ? fromPayload : null;
}
