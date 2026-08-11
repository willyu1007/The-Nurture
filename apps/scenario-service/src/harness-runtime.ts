import type { OnApplicationShutdown } from "@nestjs/common";
import {
  DEFAULT_EDIT_HOLD_TTL_SECONDS,
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createInitiateCaregiverDirectMessageSpec,
  createAcknowledgeFamilyCareItemSpec,
  createCorrectFamilyCareMessageSpec,
  createRedactFamilyCareMessageSpec,
  createReplyFamilyCareItemSpec,
  createSubmitFamilyCareQuestionSpec,
  createWithdrawFamilyCareRequestSpec,
  grantAuthorizesDirectCareCommunication,
  hashCommandRequestId,
  hashScenarioToken,
  issueCapabilityResultRef,
  parseHarnessConfirmationPayloadV2,
  parseInitiateCaregiverDirectMessageInputV1,
  parseCorrectFamilyCareMessageInputV1,
  parsePolicyRedactFamilyCareMessageInputV1,
  parseReplyFamilyCareItemInputV1,
  parseRecordCaregiverDailyCareInputV1,
  parseSubmitFamilyCareQuestionInputV1,
  parseCancelPublishProcessInputV1,
  parseRescheduleInputV1,
  parsePublishEditHoldInputV1,
  parseSavePublishProcessDraftInputV1,
  prepareAcknowledgeFamilyCareItem,
  prepareInitiateCaregiverDirectMessage,
  prepareCorrectFamilyCareMessage,
  preparePolicyRedactFamilyCareMessage,
  prepareRedactFamilyCareMessage,
  prepareReplyFamilyCareItem,
  prepareRecordCaregiverDailyCare,
  prepareSubmitFamilyCareQuestion,
  prepareWithdrawFamilyCareRequest,
  preparePublishProcessCancel,
  prepareReschedulePublishProcess,
  prepareConfirmChildMediaAttribution,
  prepareDetachPublishProcessMedia,
  prepareCorrectPublication,
  prepareRemovePublicationTargetVisibility,
  prepareRedactPublication,
  createCorrectPublicationSpec,
  createRemovePublicationTargetVisibilitySpec,
  createRedactPublicationSpec,
  parseReasonInput,
  prepareDiscardMediaAsset,
  createDetachPublishProcessMediaSpec,
  createDiscardMediaAssetSpec,
  parseDetachMediaInputV1,
  issueMediaAssetTargetRef,
  prepareRejectChildMediaAttribution,
  prepareSupersedeChildMediaAttribution,
  createConfirmChildMediaAttributionSpec,
  createRejectChildMediaAttributionSpec,
  createSupersedeChildMediaAttributionSpec,
  issueChildOptionRef,
  parseChildAttributionExecuteInput,
  prepareAcquirePublishEditHold,
  prepareRenewPublishEditHold,
  prepareReleasePublishEditHold,
  prepareSavePublishProcessDraft,
  createAcquirePublishEditHoldSpec,
  createRenewPublishEditHoldSpec,
  createReleasePublishEditHoldSpec,
  createSavePublishProcessDraftSpec,
  createCancelPublishProcessSpec,
  createReschedulePublishProcessSpec,
  createRecordCaregiverDailyCareSpec,
  loadBoardSurfaceRegistration,
  loadSurfaceContractPin,
  presentCaregiverTeacherBoard,
  presentGuardianFamilyBoard,
  queryCaregiverChildToday,
  queryCaregiverFamilyCareWork,
  queryFamilyCareItemDetail,
  queryGuardianEnrollmentActivity,
  queryGuardianFamilyCareTimeline,
  issueBoardSealedRef,
  issuePublicationRef,
  PUBLISH_PROCESS_TARGET_KIND,
  canonicalizeReleasePublishProcessCommand,
  classifyInteractionContextRow,
  computeHarnessInputIntegrityTag,
  prepareOrganizeCareCaptureBatch,
  prepareReleasePublishProcess,
  presentReleaseTargets,
  createOrganizeCareCaptureBatchSpec,
  queryTeacherPublishQueue,
  readInstitutionBusinessCommunication,
  releasePublishProcess,
  resolveCareItemTargetRef,
  type NurtureInteractionContextRecord,
  withHarnessConfirmation,
  type HarnessConfirmationPayloadV2,
  type CaregiverDirectMessagePrepareDecision,
  type ItemActionPrepareDecision,
  type BoardMutationPrepareDecision,
  type CancelPublishProcessPrepareDecision,
  type ReschedulePublishProcessPrepareDecision,
  type EditLanePrepareDecision,
  type LifecyclePrepareDecision,
  type NurtureCommandSpec,
  type SubmitPrepareDecision,
  type ReleaseTargetPresentationDecisionV1,
} from "@the-nurture/scenario/harness";
import {
  PrismaCaregiverBoardReadPort,
  PrismaCaregiverDailyCareEligibilityReadPort,
  PrismaFamilyCareCommandTransaction,
  PrismaCaregiverDirectMessageEligibilityReadPort,
  PrismaFamilyCareHarnessQueryReadPort,
  PrismaGuardianBoardReadPort,
  PrismaMediaSafetyReadPort,
  PrismaCareCaptureReadPort,
  PrismaPublicationReleasePort,
  PrismaPublishLaneReadPort,
  publicationReleaseAttemptIdentity,
  PrismaInteractionContextRepository,
  PrismaInstitutionBusinessCommunicationReadPort,
  PrismaNurtureCommandRepository,
  PrismaSubmitEligibilityReadPort,
  createAesGcmProtectedContentPort,
  createPrismaClient,
  type NurturePrismaClient,
} from "@the-nurture/db/harness";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  mapHarnessCommandResult,
  notCommitted,
  type HarnessExecuteRequestV1,
  type HarnessExecuteResponseV1,
  type HarnessPrepareRequestV1,
  type HarnessPrepareResponseV1,
  type HarnessQueryRequestV1,
  type HarnessQueryResponseV1,
  type HarnessReadResultRequestV1,
  type HarnessCapabilityKey,
  type InstitutionBusinessCommunicationReadRequestV1,
  type InstitutionBusinessCommunicationReadResponseV1,
} from "./harness-http.js";

const PROTECTED_CONTENT_KEY_REF = "nurture-protected-content-v1";

export type HarnessInternalPrepareRequestV1 = HarnessPrepareRequestV1 & {
  target_snapshot_ref?: string;
};

export type HarnessEngine = {
  prepare(
    request: HarnessInternalPrepareRequestV1,
  ): Promise<HarnessPrepareResponseV1>;
  execute(request: HarnessExecuteRequestV1): Promise<HarnessExecuteResponseV1>;
  query(request: HarnessQueryRequestV1): Promise<HarnessQueryResponseV1>;
  readResult(request: HarnessReadResultRequestV1): Promise<HarnessQueryResponseV1>;
  readInstitutionBusinessCommunication(
    request: InstitutionBusinessCommunicationReadRequestV1,
  ): Promise<InstitutionBusinessCommunicationReadResponseV1>;
  presentReleaseTargets(request: {
    workspace_id: string;
    actor_participant_id: string;
    process_ref: string;
  }): Promise<ReleaseTargetPresentationDecisionV1>;
};

export class HarnessRuntime implements OnApplicationShutdown {
  constructor(
    readonly engine: HarnessEngine | undefined,
    readonly databaseClient?: NurturePrismaClient,
    readonly institutionBusinessCommunicationReadEnabled = false,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.databaseClient?.$disconnect();
  }
}

/**
 * Build the Harness engine only from a complete fail-closed configuration:
 * service auth, database, integrity key and protected-content key. Any
 * missing piece keeps both routes disabled (default-off) — there is no
 * partial or degraded mode.
 */
export function createHarnessRuntime(input: {
  env?: NodeJS.ProcessEnv;
  serviceAuth: BindingOwnerServiceAuth;
  engine?: HarnessEngine;
  institutionBusinessCommunicationReadEnabled?: boolean;
}): HarnessRuntime {
  if (input.engine) {
    return new HarnessRuntime(
      input.engine,
      undefined,
      input.institutionBusinessCommunicationReadEnabled ?? false,
    );
  }

  const env = input.env ?? process.env;
  const integrityKey = env.NURTURE_HARNESS_INTEGRITY_KEY;
  const contentKey = env.NURTURE_PROTECTED_CONTENT_KEY;
  const databaseUrl = env.DATABASE_URL;
  if (
    !input.serviceAuth.configured ||
    !integrityKey ||
    integrityKey.length < 32 ||
    !contentKey ||
    contentKey.length < 32 ||
    !databaseUrl
  ) {
    return new HarnessRuntime(undefined);
  }

  const prisma = createPrismaClient(databaseUrl);
  return new HarnessRuntime(
    createHarnessEngine({ prisma, integrityKey, contentKey }),
    prisma,
    input.institutionBusinessCommunicationReadEnabled ?? false,
  );
}

export function createHarnessEngine(input: {
  prisma: NurturePrismaClient;
  integrityKey: string;
  contentKey: string;
}): HarnessEngine {
  const commands = new PrismaNurtureCommandRepository(input.prisma);
  const runner = new NurtureCommandRunner(commands);
  const confirmations = new PrismaInteractionContextRepository(input.prisma);
  const contexts = new NurtureInteractionContextService(confirmations);
  const submitEligibility = new PrismaSubmitEligibilityReadPort(input.prisma);
  const directMessageEligibility =
    new PrismaCaregiverDirectMessageEligibilityReadPort(input.prisma);
  const factsPort = new PrismaFamilyCareCommandTransaction(input.prisma);
  const queryReads = new PrismaFamilyCareHarnessQueryReadPort(input.prisma);
  const protectedContent = createAesGcmProtectedContentPort({
    keyRef: PROTECTED_CONTENT_KEY_REF,
    keyMaterial: input.contentKey,
  });
  const guardianBoardReads = new PrismaGuardianBoardReadPort(input.prisma, protectedContent);
  // Prepare only reads: it enumerates the targets the fact owner would accept a
  // write for. The write itself happens inside the command transaction.
  const caregiverDailyCareEligibility = new PrismaCaregiverDailyCareEligibilityReadPort(
    input.prisma,
  );
  // Prepare only reads: it enumerates the targets the fact owner would accept a
  // write for. The write itself happens inside the command transaction.
  const caregiverBoardReads = new PrismaCaregiverBoardReadPort(input.prisma);
  const institutionBusinessCommunicationReads =
    new PrismaInstitutionBusinessCommunicationReadPort(input.prisma);
  const publishQueueReads = new PrismaPublishLaneReadPort(input.prisma, protectedContent);
  // The exact admitted contract identity and the registered module order come
  // from the artifact itself; the ingress never carries a literal copy.
  const boardContract = loadSurfaceContractPin();
  const guardianBoardSurface = loadBoardSurfaceRegistration("guardian_family_board");
  const caregiverBoardSurface = loadBoardSurfaceRegistration("caregiver_teacher_board");
  const submitSpec = createSubmitFamilyCareQuestionSpec({
    protected_content: protectedContent,
    integrity_key: input.integrityKey,
  });
  const directMessageSpec = createInitiateCaregiverDirectMessageSpec({
    protected_content: protectedContent,
    integrity_key: input.integrityKey,
  });
  const acknowledgeSpec = createAcknowledgeFamilyCareItemSpec();
  const replySpec = createReplyFamilyCareItemSpec({
    protected_content: protectedContent,
    integrity_key: input.integrityKey,
  });
  const correctSpec = createCorrectFamilyCareMessageSpec({
    protected_content: protectedContent,
    integrity_key: input.integrityKey,
  });
  const withdrawSpec = createWithdrawFamilyCareRequestSpec({
    integrity_key: input.integrityKey,
  });
  const redactSpec = createRedactFamilyCareMessageSpec("author", {
    integrity_key: input.integrityKey,
  });
  const policyRedactSpec = createRedactFamilyCareMessageSpec("policy", {
    integrity_key: input.integrityKey,
  });
  const recordDailyCareSpec = createRecordCaregiverDailyCareSpec({
    integrity_key: input.integrityKey,
  });

  const cancelPublishProcessSpec = createCancelPublishProcessSpec({
    integrity_key: input.integrityKey,
  });
  const reschedulePublishProcessSpec = createReschedulePublishProcessSpec();
  const editLaneDeps = {
    reads: publishQueueReads,
    contexts,
    integrity_key: input.integrityKey,
  };
  const acquireEditHoldSpec = createAcquirePublishEditHoldSpec({
    integrity_key: input.integrityKey,
  });
  const renewEditHoldSpec = createRenewPublishEditHoldSpec({
    integrity_key: input.integrityKey,
  });
  const releaseEditHoldSpec = createReleasePublishEditHoldSpec({
    integrity_key: input.integrityKey,
  });
  const saveDraftSpec = createSavePublishProcessDraftSpec({
    integrity_key: input.integrityKey,
    protected_content: protectedContent,
  });
  const mediaAttributionReads = new PrismaMediaSafetyReadPort(input.prisma);
  const attributionDeps = {
    reads: mediaAttributionReads,
    contexts,
    integrity_key: input.integrityKey,
  };
  const confirmAttributionSpec = createConfirmChildMediaAttributionSpec({
    integrity_key: input.integrityKey,
  });
  const rejectAttributionSpec = createRejectChildMediaAttributionSpec({
    integrity_key: input.integrityKey,
  });
  const supersedeAttributionSpec = createSupersedeChildMediaAttributionSpec({
    integrity_key: input.integrityKey,
  });
  const publicationReleaseReads = new PrismaPublicationReleasePort(input.prisma);
  const mediaLifecycleDeps = {
    // Two owner read surfaces, one dependency: the media lifecycle facts come
    // from the media-safety port, the safety-addressable process set from the
    // release port. Explicit delegation, not a merged class.
    reads: {
      listMediaLifecycleAssetIds: mediaAttributionReads.listMediaLifecycleAssetIds.bind(
        mediaAttributionReads,
      ),
      loadMediaLifecycleFacts: mediaAttributionReads.loadMediaLifecycleFacts.bind(
        mediaAttributionReads,
      ),
      listSafetyProcessKeys: publicationReleaseReads.listSafetyProcessKeys.bind(
        publicationReleaseReads,
      ),
    },
    contexts,
    integrity_key: input.integrityKey,
  };
  const detachMediaSpec = createDetachPublishProcessMediaSpec({
    integrity_key: input.integrityKey,
  });
  const discardMediaSpec = createDiscardMediaAssetSpec({
    integrity_key: input.integrityKey,
  });
  const publicationSafetyDeps = {
    reads: publicationReleaseReads,
    contexts,
    integrity_key: input.integrityKey,
  };
  const careCaptureReads = new PrismaCareCaptureReadPort(input.prisma);
  const organizeSpec = createOrganizeCareCaptureBatchSpec({
    integrity_key: input.integrityKey,
    protected_content: protectedContent,
    direct_message_eligibility: directMessageEligibility,
  });
  const correctPublicationSpec = createCorrectPublicationSpec({
    integrity_key: input.integrityKey,
    protected_content: protectedContent,
  });
  const removeTargetVisibilitySpec = createRemovePublicationTargetVisibilitySpec({
    integrity_key: input.integrityKey,
  });
  const redactPublicationSpec = createRedactPublicationSpec({
    integrity_key: input.integrityKey,
  });

  /** Binds one resubmitted media ref to the id the confirmation froze. */
  const boundMediaAssetId = (
    built: BuildInput,
    resubmittedRef: unknown,
    frozenAssetId: string | undefined,
  ): string | null => {
    if (typeof resubmittedRef !== "string" || !frozenAssetId) return null;
    const expected = issueMediaAssetTargetRef(
      input.integrityKey,
      { workspace_id: built.workspace_id, participant_id: built.actor_participant_id },
      frozenAssetId,
    );
    return expected === resubmittedRef ? frozenAssetId : null;
  };

  /**
   * Binds one resubmitted child ref to the id the confirmation froze. The
   * sealed ref is deterministic per actor, so a caller that resubmits a
   * different child than it prepared fails here rather than being silently
   * corrected by the confirmation.
   */
  const boundChildId = (
    built: BuildInput,
    resubmittedRef: unknown,
    frozenChildId: string | undefined,
  ): string | null => {
    if (typeof resubmittedRef !== "string" || !frozenChildId) return null;
    const expected = issueChildOptionRef(
      input.integrityKey,
      { workspace_id: built.workspace_id, participant_id: built.actor_participant_id },
      frozenChildId,
    );
    return expected === resubmittedRef ? frozenChildId : null;
  };

  /**
   * Binds one resubmitted publication ref to the id the confirmation froze,
   * like the media and child bindings above: a caller that resubmits a
   * different publication than it prepared is refused, not silently
   * corrected to the frozen one.
   */
  const boundPublicationId = (
    built: BuildInput,
    resubmittedRef: unknown,
    frozenPublicationId: string | undefined,
  ): string | null => {
    if (typeof resubmittedRef !== "string" || !frozenPublicationId) return null;
    const expected = issuePublicationRef(
      input.integrityKey,
      { workspace_id: built.workspace_id, participant_id: built.actor_participant_id },
      frozenPublicationId,
    );
    return expected === resubmittedRef ? frozenPublicationId : null;
  };

  /** The three hold transitions differ only by which spec they commit through. */
  const buildEditHoldCommand =
    (spec: NurtureCommandSpec<never>, carriesTtl: boolean) =>
    (built: BuildInput): BuiltPayload | null => {
      const processKey = built.target_refs.publish_process;
      const expectedHoldVersion = built.expected_heads.publish_edit_hold;
      if (!processKey || expectedHoldVersion === undefined) return null;
      if (!carriesTtl) {
        return isEmptyOperationInput(built.operation_input)
          ? {
              payload: { process_key: processKey, expected_hold_version: expectedHoldVersion },
              spec,
            }
          : null;
      }
      const parsed = parsePublishEditHoldInputV1(built.operation_input);
      if (parsed.status !== "ok") return null;
      return {
        payload: {
          process_key: processKey,
          expected_hold_version: expectedHoldVersion,
          ttl_seconds: parsed.ttl_seconds ?? DEFAULT_EDIT_HOLD_TTL_SECONDS,
        },
        spec,
      };
    };

  const toPrepareResponse = (
    decision:
      | SubmitPrepareDecision
      | CaregiverDirectMessagePrepareDecision
      | ItemActionPrepareDecision
      | LifecyclePrepareDecision
      | BoardMutationPrepareDecision
      | CancelPublishProcessPrepareDecision
      | ReschedulePublishProcessPrepareDecision
      | EditLanePrepareDecision,
  ): HarnessPrepareResponseV1 => {
    // Internal raw target ids (enrollment_id / item_id) never leave the
    // service; execute recovers the exact target from the confirmation.
    if (decision.status === "ready_to_confirm") {
      return {
        status: "ready_to_confirm",
        preview: { ...decision.preview },
        confirmation_ref: decision.confirmation_ref,
        expires_at: decision.expires_at,
        command_request_id: decision.command_request_id,
      };
    }
    return decision;
  };

  const lifecycleDeps = {
    facts: factsPort,
    contexts,
    integrity_key: input.integrityKey,
  };

  /**
   * Prepare for a capability whose target is optional at this layer: the
   * capability's own prepare step decides whether it needs one.
   */
  const optionalTarget =
    <Decision extends Parameters<typeof toPrepareResponse>[0]>(
      run: (request: PrepareScope & OptionalTargetRequest) => Promise<Decision>,
    ) =>
    async (request: HarnessInternalPrepareRequestV1, scope: PrepareScope) =>
      toPrepareResponse(
        await run({
          ...scope,
          operation_input: request.operation_input,
          ...(request.target_option_ref
            ? { target_option_ref: request.target_option_ref }
            : {}),
          ...(request.target_snapshot_ref
            ? { target_snapshot_ref: request.target_snapshot_ref }
            : {}),
        }),
      );

  /** Prepare for a capability that cannot be addressed without an owner ref. */
  const requiredTarget =
    <Decision extends Parameters<typeof toPrepareResponse>[0]>(
      run: (request: PrepareScope & RequiredTargetRequest) => Promise<Decision>,
    ) =>
    async (
      request: HarnessInternalPrepareRequestV1,
      scope: PrepareScope,
    ): Promise<HarnessPrepareResponseV1> =>
      request.target_option_ref
        ? toPrepareResponse(
            await run({
              ...scope,
              target_option_ref: request.target_option_ref,
              operation_input: request.operation_input,
            }),
          )
        : { status: "needs_input", fields: ["target_option_ref"] };

  const buildRedactCommand =
    (actorKind: "author" | "policy") =>
    (built: BuildInput): BuiltPayload | null => {
      const policyInput =
        actorKind === "policy"
          ? parsePolicyRedactFamilyCareMessageInputV1(built.operation_input)
          : undefined;
      if (actorKind === "author" && !isEmptyOperationInput(built.operation_input)) return null;
      const messageId = built.target_refs.family_care_message;
      const cascadeAuditId = built.target_refs.cascade_audit;
      const cascadeScope = built.target_refs.redaction_scope;
      if (
        !messageId ||
        !cascadeAuditId ||
        (cascadeScope !== "source_question" && cascadeScope !== "reply_local") ||
        (actorKind === "policy" &&
          (policyInput?.status !== "ok" || built.expected_heads.policy_decision === undefined))
      ) {
        return null;
      }
      return {
        payload: {
          message_id: messageId,
          expected_message_version: built.expected_heads.message ?? 0,
          cascade_audit_id: cascadeAuditId,
          cascade_scope: cascadeScope,
          actor_kind: actorKind,
          ...(actorKind === "policy" && policyInput?.status === "ok"
            ? {
                policy_decision_ref: policyInput.input.policyDecisionRef,
                expected_policy_decision_head: built.expected_heads.policy_decision,
              }
            : {}),
        },
        spec: (actorKind === "author" ? redactSpec : policyRedactSpec) as NurtureCommandSpec<never>,
      };
    };

  /**
   * One descriptor per admitted action key: how it prepares, and how the
   * confirmation plus the resubmitted typed input become its exact command.
   *
   * `satisfies Record<HarnessCapabilityKey, ...>` is the point. Admission is a
   * literal key-to-version map in the transport; this table is checked against
   * that same key set, so admitting a key the engine cannot serve — the
   * placeholder the freeze forbids — stops compiling rather than reaching a
   * fallthrough at runtime.
   */
  const actions = {
    submit_family_care_question: {
      prepare: optionalTarget((request) =>
        prepareSubmitFamilyCareQuestion(
          { eligibility: submitEligibility, contexts, integrity_key: input.integrityKey },
          request,
        ),
      ),
      build: (built) => {
        const parsed = parseSubmitFamilyCareQuestionInputV1(built.operation_input);
        const enrollmentId = built.target_refs.enrollment;
        if (parsed.status !== "ok" || !enrollmentId) return null;
        const continuation = built.target_refs.continuation_item;
        return {
          payload: {
            body: parsed.input.body,
            enrollment_id: enrollmentId,
            ...(continuation ? { context_continuation_of_item_id: continuation } : {}),
          },
          spec: submitSpec as NurtureCommandSpec<never>,
        };
      },
    },
    initiate_caregiver_direct_message: {
      prepare: optionalTarget((request) =>
        prepareInitiateCaregiverDirectMessage(
          {
            eligibility: directMessageEligibility,
            contexts,
            integrity_key: input.integrityKey,
          },
          request,
        ),
      ),
      build: (built) => {
        const parsed = parseInitiateCaregiverDirectMessageInputV1(built.operation_input);
        const enrollmentId = built.target_refs.enrollment;
        const grantId = built.target_refs.grant;
        if (parsed.status !== "ok" || !enrollmentId || !grantId) return null;
        return {
          payload: {
            body: parsed.input.body,
            enrollment_id: enrollmentId,
            grant_id: grantId,
            expected_enrollment_version: built.expected_heads.enrollment ?? 0,
            expected_care_group_version: built.expected_heads.care_group ?? 0,
            expected_role_version: built.expected_heads.role ?? 0,
            expected_grant_version: built.expected_heads.grant ?? 0,
            expected_thread_version: built.expected_heads.thread ?? 0,
            expected_safety_policy_head: built.expected_heads.safety_policy ?? 0,
          },
          spec: directMessageSpec as NurtureCommandSpec<never>,
        };
      },
    },
    acknowledge_family_care_item: {
      prepare: requiredTarget((request) =>
        prepareAcknowledgeFamilyCareItem(lifecycleDeps, request),
      ),
      build: (built) => {
        const itemId = built.target_refs.care_item;
        if (!itemId || !isEmptyOperationInput(built.operation_input)) return null;
        return {
          payload: {
            item_id: itemId,
            expected_acknowledgement_head: built.expected_heads.acknowledgement ?? 0,
            expected_lifecycle_head: built.expected_heads.lifecycle ?? 0,
          },
          spec: acknowledgeSpec as NurtureCommandSpec<never>,
        };
      },
    },
    reply_family_care_item: {
      prepare: requiredTarget((request) => prepareReplyFamilyCareItem(lifecycleDeps, request)),
      build: (built) => {
        const parsed = parseReplyFamilyCareItemInputV1(built.operation_input);
        const itemId = built.target_refs.care_item;
        if (parsed.status !== "ok" || !itemId) return null;
        return {
          payload: {
            body: parsed.input.body,
            item_id: itemId,
            expected_lifecycle_head: built.expected_heads.lifecycle ?? 0,
          },
          spec: replySpec as NurtureCommandSpec<never>,
        };
      },
    },
    correct_family_care_message: {
      prepare: requiredTarget((request) =>
        prepareCorrectFamilyCareMessage(lifecycleDeps, request),
      ),
      build: (built) => {
        const parsed = parseCorrectFamilyCareMessageInputV1(built.operation_input);
        const messageId = built.target_refs.family_care_message;
        if (parsed.status !== "ok" || !messageId) return null;
        return {
          payload: {
            body: parsed.input.body,
            message_id: messageId,
            expected_message_version: built.expected_heads.message ?? 0,
            expected_correction_head: built.expected_heads.correction ?? 0,
            ...(built.expected_heads.lifecycle !== undefined
              ? { expected_lifecycle_head: built.expected_heads.lifecycle }
              : {}),
          },
          spec: correctSpec as NurtureCommandSpec<never>,
        };
      },
    },
    withdraw_family_care_request: {
      prepare: requiredTarget((request) =>
        prepareWithdrawFamilyCareRequest(lifecycleDeps, request),
      ),
      build: (built) => {
        const itemId = built.target_refs.care_item;
        if (!itemId || !isEmptyOperationInput(built.operation_input)) return null;
        return {
          payload: {
            item_id: itemId,
            expected_lifecycle_head: built.expected_heads.lifecycle ?? 0,
          },
          spec: withdrawSpec as NurtureCommandSpec<never>,
        };
      },
    },
    redact_family_care_message: {
      prepare: requiredTarget((request) =>
        prepareRedactFamilyCareMessage(lifecycleDeps, request),
      ),
      build: buildRedactCommand("author"),
    },
    policy_redact_family_care_message: {
      prepare: requiredTarget((request) =>
        preparePolicyRedactFamilyCareMessage(lifecycleDeps, request),
      ),
      build: buildRedactCommand("policy"),
    },
    record_caregiver_daily_care: {
      prepare: optionalTarget((request) =>
        prepareRecordCaregiverDailyCare(
          {
            eligibility: caregiverDailyCareEligibility,
            contexts,
            integrity_key: input.integrityKey,
          },
          request,
        ),
      ),
      build: (built) => {
        const parsed = parseRecordCaregiverDailyCareInputV1(built.operation_input);
        const childCareProcessId = built.target_refs.child_care_process;
        if (parsed.status !== "ok" || !childCareProcessId) return null;
        return {
          payload: {
            kind: parsed.input.kind,
            summary: parsed.input.summary,
            child_care_process_id: childCareProcessId,
            expected_care_group_version: built.expected_heads.care_group ?? 0,
            expected_role_version: built.expected_heads.role ?? 0,
            expected_enrollment_version: built.expected_heads.enrollment ?? 0,
          },
          spec: recordDailyCareSpec as NurtureCommandSpec<never>,
        };
      },
    },
    cancel_publish_process: {
      prepare: optionalTarget((request) =>
        preparePublishProcessCancel(
          {
            reads: publishQueueReads,
            contexts,
            integrity_key: input.integrityKey,
          },
          request,
        ),
      ),
      build: (built) => {
        const processKey = built.target_refs.publish_process;
        const expectedVersion = built.expected_heads.publish_process;
        if (
          !processKey ||
          expectedVersion === undefined ||
          parseCancelPublishProcessInputV1(built.operation_input).status !== "ok"
        ) {
          return null;
        }
        return {
          payload: { process_key: processKey, expected_process_version: expectedVersion },
          spec: cancelPublishProcessSpec as NurtureCommandSpec<never>,
        };
      },
    },
    reschedule_publish_process: {
      prepare: optionalTarget((request) =>
        prepareReschedulePublishProcess(
          {
            reads: publishQueueReads,
            contexts,
            integrity_key: input.integrityKey,
          },
          request,
        ),
      ),
      build: (built) => {
        const processKey = built.target_refs.publish_process;
        const expectedScheduleVersion = built.expected_heads.publication_schedule;
        const parsed = parseRescheduleInputV1(built.operation_input);
        if (
          !processKey ||
          expectedScheduleVersion === undefined ||
          parsed.status !== "ok"
        ) {
          return null;
        }
        return {
          payload: {
            process_key: processKey,
            scheduled_at: parsed.input.scheduledAt,
            expected_schedule_version: expectedScheduleVersion,
          },
          spec: reschedulePublishProcessSpec as NurtureCommandSpec<never>,
        };
      },
    },
    acquire_publish_edit_hold: {
      prepare: optionalTarget((request) => prepareAcquirePublishEditHold(editLaneDeps, request)),
      build: buildEditHoldCommand(acquireEditHoldSpec as NurtureCommandSpec<never>, true),
    },
    renew_publish_edit_hold: {
      prepare: optionalTarget((request) => prepareRenewPublishEditHold(editLaneDeps, request)),
      build: buildEditHoldCommand(renewEditHoldSpec as NurtureCommandSpec<never>, true),
    },
    release_publish_edit_hold: {
      prepare: optionalTarget((request) => prepareReleasePublishEditHold(editLaneDeps, request)),
      build: buildEditHoldCommand(releaseEditHoldSpec as NurtureCommandSpec<never>, false),
    },
    save_publish_process_draft: {
      prepare: optionalTarget((request) => prepareSavePublishProcessDraft(editLaneDeps, request)),
      build: (built) => {
        const processKey = built.target_refs.publish_process;
        const expectedRevision = built.expected_heads.draft_revision;
        const parsed = parseSavePublishProcessDraftInputV1(built.operation_input);
        if (
          !processKey ||
          expectedRevision === undefined ||
          parsed.status !== "ok" ||
          // The base the caller resubmits must be the base the confirmation
          // froze. The integrity tag would catch the mismatch one step later;
          // refusing here keeps the two sources visibly one.
          parsed.input.expectedDraftRevision !== expectedRevision
        ) {
          return null;
        }
        return {
          payload: {
            process_key: processKey,
            expected_draft_revision: expectedRevision,
            title: parsed.input.title,
            segments: parsed.input.segments,
          },
          spec: saveDraftSpec as NurtureCommandSpec<never>,
        };
      },
    },
    confirm_child_media_attribution: {
      prepare: optionalTarget((request) =>
        prepareConfirmChildMediaAttribution(attributionDeps, request),
      ),
      build: (built) => {
        const parsed = parseChildAttributionExecuteInput(built.operation_input, ["childRef"]);
        const mediaAssetId = built.target_refs.media_asset;
        const childId = parsed
          ? boundChildId(built, parsed.childRef, built.target_refs.child)
          : null;
        const expectedRevision = built.expected_heads.child_media_attribution;
        const expectedMedia = built.expected_heads.media_asset_revision;
        if (!mediaAssetId || !childId || expectedRevision === undefined || expectedMedia === undefined) {
          return null;
        }
        return {
          payload: {
            media_asset_id: mediaAssetId,
            child_care_process_id: childId,
            expected_attribution_revision: expectedRevision,
            expected_media_revision: expectedMedia,
          },
          spec: confirmAttributionSpec as NurtureCommandSpec<never>,
        };
      },
    },
    reject_child_media_attribution: {
      prepare: optionalTarget((request) =>
        prepareRejectChildMediaAttribution(attributionDeps, request),
      ),
      build: (built) => {
        const parsed = parseChildAttributionExecuteInput(built.operation_input, ["childRef"]);
        const mediaAssetId = built.target_refs.media_asset;
        const childId = parsed
          ? boundChildId(built, parsed.childRef, built.target_refs.child)
          : null;
        const expectedRevision = built.expected_heads.child_media_attribution;
        const expectedMedia = built.expected_heads.media_asset_revision;
        if (!mediaAssetId || !childId || expectedRevision === undefined || expectedMedia === undefined) {
          return null;
        }
        return {
          payload: {
            media_asset_id: mediaAssetId,
            child_care_process_id: childId,
            expected_attribution_revision: expectedRevision,
            expected_media_revision: expectedMedia,
          },
          spec: rejectAttributionSpec as NurtureCommandSpec<never>,
        };
      },
    },
    supersede_child_media_attribution: {
      prepare: optionalTarget((request) =>
        prepareSupersedeChildMediaAttribution(attributionDeps, request),
      ),
      build: (built) => {
        const parsed = parseChildAttributionExecuteInput(built.operation_input, [
          "fromChildRef",
          "toChildRef",
        ]);
        const mediaAssetId = built.target_refs.media_asset;
        const fromChildId = parsed
          ? boundChildId(built, parsed.fromChildRef, built.target_refs.from_child)
          : null;
        const toChildId = parsed
          ? boundChildId(built, parsed.toChildRef, built.target_refs.to_child)
          : null;
        const expectedFrom = built.expected_heads.child_media_attribution;
        const expectedTo = built.expected_heads.target_child_attribution;
        const expectedMedia = built.expected_heads.media_asset_revision;
        if (
          !mediaAssetId ||
          !fromChildId ||
          !toChildId ||
          expectedFrom === undefined ||
          expectedTo === undefined ||
          expectedMedia === undefined
        ) {
          return null;
        }
        return {
          payload: {
            media_asset_id: mediaAssetId,
            from_child_care_process_id: fromChildId,
            to_child_care_process_id: toChildId,
            expected_from_revision: expectedFrom,
            expected_to_revision: expectedTo,
            expected_media_revision: expectedMedia,
          },
          spec: supersedeAttributionSpec as NurtureCommandSpec<never>,
        };
      },
    },
    detach_publish_process_media: {
      prepare: optionalTarget((request) =>
        prepareDetachPublishProcessMedia(mediaLifecycleDeps, request),
      ),
      build: (built) => {
        const parsed = parseDetachMediaInputV1(built.operation_input);
        const processKey = built.target_refs.publish_process;
        const mediaAssetId =
          parsed.status === "ok"
            ? boundMediaAssetId(built, parsed.mediaRef, built.target_refs.media_asset)
            : null;
        const expectedRevision = built.expected_heads.draft_revision;
        if (!processKey || !mediaAssetId || expectedRevision === undefined) return null;
        return {
          payload: {
            process_key: processKey,
            media_asset_id: mediaAssetId,
            expected_draft_revision: expectedRevision,
          },
          spec: detachMediaSpec as NurtureCommandSpec<never>,
        };
      },
    },
    discard_media_asset: {
      prepare: optionalTarget((request) => prepareDiscardMediaAsset(mediaLifecycleDeps, request)),
      build: (built) => {
        const mediaAssetId = built.target_refs.media_asset;
        const expectedRevision = built.expected_heads.media_asset_revision;
        const expectedReferencingDrafts = built.expected_heads.referencing_draft_count;
        if (
          !mediaAssetId ||
          expectedRevision === undefined ||
          expectedReferencingDrafts === undefined ||
          !isEmptyOperationInput(built.operation_input)
        ) {
          return null;
        }
        return {
          payload: {
            media_asset_id: mediaAssetId,
            expected_media_revision: expectedRevision,
            expected_referencing_draft_count: expectedReferencingDrafts,
          },
          spec: discardMediaSpec as NurtureCommandSpec<never>,
        };
      },
    },
    correct_publication: {
      prepare: optionalTarget((request) =>
        prepareCorrectPublication(publicationSafetyDeps, request),
      ),
      build: (built) => {
        const parsed = parseReasonInput(built.operation_input, "correctionText");
        const processKey = built.target_refs.publish_process;
        if (parsed.status !== "ok" || !processKey || !parsed.input.correctionText) return null;
        return {
          payload: {
            process_key: processKey,
            reason: parsed.input.reason,
            correction_text: parsed.input.correctionText,
          },
          spec: correctPublicationSpec as NurtureCommandSpec<never>,
        };
      },
    },
    remove_publication_target_visibility: {
      prepare: optionalTarget((request) =>
        prepareRemovePublicationTargetVisibility(publicationSafetyDeps, request),
      ),
      build: (built) => {
        const parsed = parseReasonInput(built.operation_input, "publicationRef");
        const processKey = built.target_refs.publish_process;
        const publicationId =
          parsed.status === "ok"
            ? boundPublicationId(
                built,
                parsed.input.publicationRef,
                built.target_refs.publication,
              )
            : null;
        if (parsed.status !== "ok" || !processKey || !publicationId) return null;
        return {
          payload: {
            process_key: processKey,
            publication_id: publicationId,
            reason: parsed.input.reason,
          },
          spec: removeTargetVisibilitySpec as NurtureCommandSpec<never>,
        };
      },
    },
    redact_publication: {
      prepare: optionalTarget((request) =>
        prepareRedactPublication(publicationSafetyDeps, request),
      ),
      build: (built) => {
        const parsed = parseReasonInput(built.operation_input);
        const processKey = built.target_refs.publish_process;
        if (parsed.status !== "ok" || !processKey) return null;
        return {
          payload: { process_key: processKey, reason: parsed.input.reason },
          spec: redactPublicationSpec as NurtureCommandSpec<never>,
        };
      },
    },
    organize_care_capture_batch: {
      prepare: optionalTarget((request) =>
        prepareOrganizeCareCaptureBatch(
          {
            integrity_key: input.integrityKey,
            reads: careCaptureReads,
            contexts,
          },
          request,
        ),
      ),
      build: (built) => {
        const careGroupId = built.target_refs.care_group;
        const expectedBatchVersion = built.expected_heads.capture_batch;
        if (
          !careGroupId ||
          expectedBatchVersion === undefined ||
          !isEmptyOperationInput(built.operation_input)
        ) {
          return null;
        }
        return {
          payload: {
            care_group_id: careGroupId,
            expected_batch_version: expectedBatchVersion,
          },
          spec: organizeSpec as NurtureCommandSpec<never>,
        };
      },
    },
    release_publish_process: {
      prepare: optionalTarget((request) =>
        prepareReleasePublishProcess(publicationSafetyDeps, request),
      ),
      // Deliberately NOT a kernel command: each target commits its own
      // PublicationRelease + Receipt + CommandExecution atomically inside the
      // owner, with the attempt identity as every execution's parent. One
      // kernel transaction would make a thirty-family send all-or-nothing —
      // the exact cross-family coupling D-09 forbids.
      fanout: (request, row, payload) => executeReleaseFanout(request, row, payload),
    },
  } satisfies Record<HarnessCapabilityKey, HarnessActionDescriptor>;

  return {
    async presentReleaseTargets(request) {
      return presentReleaseTargets(
        { integrity_key: input.integrityKey, reads: publicationReleaseReads },
        {
          workspace_id: request.workspace_id,
          participant_id: request.actor_participant_id,
        },
        { process_ref: request.process_ref },
      );
    },

    async prepare(request) {
      return actions[request.capability_key].prepare(request, {
        workspace_id: request.workspace_id,
        participant_id: request.actor_participant_id,
        surface: request.surface,
        ...(request.host_conversation_ref
          ? { host_conversation_ref: request.host_conversation_ref }
          : {}),
      });
    },

    async execute(request) {
      // The row is only located and its payload recovered here; every status
      // and binding semantic (expired, consumed, revoked, actor/surface
      // drift) is decided by the confirmation composer inside the command
      // transaction. The runner short-circuits committed replays before that
      // transaction, so a consumed ref still yields its own exact replay.
      const row = await confirmations.findByTokenHash({
        workspace_id: request.workspace_id,
        token_hash: hashScenarioToken(request.workspace_id, request.confirmation_ref),
      });
      if (!row) return notCommitted("blocked", "invalid_confirmation");
      let payload: HarnessConfirmationPayloadV2;
      try {
        payload = parseHarnessConfirmationPayloadV2(row.state_payload);
      } catch {
        return notCommitted("blocked", "invalid_confirmation");
      }
      // Capability identity picks the spec, so it must match here; the
      // command-identity binding is re-checked by the composer inside the
      // transaction, after row-status classification, so a consumed ref maps
      // to confirmation_replayed rather than a generic mismatch.
      if (
        payload.capability_key !== request.capability_key ||
        payload.capability_version !== request.capability_version
      ) {
        return notCommitted("blocked", "invalid_confirmation");
      }

      const descriptor = actions[request.capability_key];
      if ("fanout" in descriptor) {
        return sealCommittedRefs(
          request.workspace_id,
          await descriptor.fanout(request, row, payload),
        );
      }
      const command = buildHarnessCommand(request, payload);
      if (command.status === "invalid") {
        return notCommitted("invalid", command.reason_code);
      }

      const result = await runner.execute({
        workspace_id: request.workspace_id,
        invocation_request_id: request.invocation_request_id,
        command_request_id: request.command_request_id,
        business_actor_ref: request.actor_participant_id,
        payload: command.payload,
        spec: withHarnessConfirmation(command.spec as NurtureCommandSpec<unknown>, {
          confirmation_ref: request.confirmation_ref,
          actor_participant_id: request.actor_participant_id,
          surface: request.surface,
          ...(request.host_conversation_ref
            ? { host_conversation_ref: request.host_conversation_ref }
            : {}),
          command_request_id: request.command_request_id,
          capability_key: request.capability_key,
          capability_version: request.capability_version,
          integrity_key: input.integrityKey,
        }),
      });
      return sealCommittedRefs(request.workspace_id, mapHarnessCommandResult(result));
    },

    async query(request) {
      const queryDeps = {
        reads: queryReads,
        protected_content: protectedContent,
        integrity_key: input.integrityKey,
      };
      const scope = {
        workspace_id: request.workspace_id,
        participant_id: request.actor_participant_id,
      };
      if (request.capability_key === "query_guardian_family_care_timeline") {
        return queryGuardianFamilyCareTimeline(queryDeps, {
          ...scope,
          page_size: request.page_size,
          ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
        });
      }
      if (request.capability_key === "query_caregiver_family_care_work") {
        // The work list is per exact CareGroup; the selector is an
        // owner-issued option ref, never a raw group id.
        const careGroupId = request.target_option_ref
          ? resolveCareItemTargetRef(input.integrityKey, scope, request.target_option_ref)
          : undefined;
        if (request.target_option_ref && !careGroupId) {
          return { status: "denied", reason_code: "not_authorized" };
        }
        return queryCaregiverFamilyCareWork(queryDeps, {
          ...scope,
          page_size: request.page_size,
          ...(careGroupId ? { care_group_id: careGroupId } : {}),
          ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
        });
      }
      if (request.capability_key === "query_family_care_item") {
        if (!request.target_option_ref) {
          return { status: "denied", reason_code: "invalid_query_input" };
        }
        const itemId = resolveCareItemTargetRef(
          input.integrityKey,
          scope,
          request.target_option_ref,
        );
        if (!itemId) return { status: "denied", reason_code: "not_authorized" };
        return queryFamilyCareItemDetail(queryDeps, { ...scope, item_id: itemId });
      }

      // T-006 board lane. Each module read binds the exact admitted contract and
      // reads through its own owner port; nothing is shared with the T-005 lane
      // beyond the actor scope.
      const guardianDeps = {
        contract: boardContract,
        integrity_key: input.integrityKey,
        reads: guardianBoardReads,
      };
      const caregiverDeps = {
        contract: boardContract,
        integrity_key: input.integrityKey,
        reads: caregiverBoardReads,
      };
      if (request.capability_key === "query_guardian_family_board") {
        return presentGuardianFamilyBoard(
          { ...guardianDeps, surface: guardianBoardSurface },
          {
            ...scope,
            ...(request.target_option_ref
              ? { enrollment_target_ref: request.target_option_ref }
              : {}),
            ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
          },
        );
      }
      if (request.capability_key === "query_guardian_enrollment_activity") {
        if (!request.target_option_ref) {
          return { status: "denied", reason_code: "invalid_query_input" };
        }
        return queryGuardianEnrollmentActivity(guardianDeps, {
          ...scope,
          enrollment_target_ref: request.target_option_ref,
          ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
          ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
        });
      }
      if (request.capability_key === "query_caregiver_teacher_board") {
        return presentCaregiverTeacherBoard(
          {
            ...caregiverDeps,
            surface: caregiverBoardSurface,
            family_care_work: queryDeps,
            publish_queue: publishQueueReads,
          },
          {
            ...scope,
            ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
          },
        );
      }
      if (request.capability_key === "query_caregiver_child_today") {
        return queryCaregiverChildToday(caregiverDeps, {
          ...scope,
          ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
          ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
        });
      }
      if (request.capability_key !== "query_teacher_publish_queue") {
        // Every routed key matches explicitly. A trailing unconditional return
        // would answer some other capability with this one's result, which is
        // only ever safe by coincidence of the current allowlist.
        return { status: "denied", reason_code: "unknown_capability" };
      }
      return queryTeacherPublishQueue(
        { contract: boardContract, integrity_key: input.integrityKey, reads: publishQueueReads },
        await caregiverBoardReads.loadCaregiverScope({
          ...scope,
          snapshot_at: new Date().toISOString(),
        }),
        {
          ...scope,
          ...(request.page_size !== undefined ? { page_size: request.page_size } : {}),
          ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
        },
      );
    },

    async readResult(request) {
      // readResult regenerates the role-safe projection from the committed
      // command's OWN stored output refs plus current owner state. Canonical
      // refs are never accepted from the caller: raw ids would bypass the
      // owner-issued ref discipline and turn this lane into an id oracle.
      const execution = await commands.findCommitted({
        workspace_id: request.workspace_id,
        command_request_id_hash: hashCommandRequestId(
          request.workspace_id,
          request.command_request_id,
        ),
      });
      if (!execution || execution.business_actor_ref !== request.actor_participant_id) {
        return { status: "denied", reason_code: "not_authorized" };
      }
      const itemRef = execution.output_refs.find(
        (ref) => ref.namespace === "nurture" && ref.object_type === "family_care_item",
      );
      if (!itemRef && execution.command_key === "initiate_caregiver_direct_message") {
        const messageRef = execution.output_refs.find(
          (ref) => ref.namespace === "nurture" && ref.object_type === "family_care_message",
        );
        if (!messageRef || execution.committed_result_payload === undefined) {
          return { status: "denied", reason_code: "invalid_query_input" };
        }
        const facts = await factsPort.loadG2MessageChangeFacts({
          workspace_id: request.workspace_id,
          participant_id: request.actor_participant_id,
          message_id: messageRef.object_id,
        });
        if (
          !facts.participant_active ||
          !facts.exact_author ||
          !facts.same_side_reachable ||
          facts.message_kind !== "caregiver_direct_message" ||
          !grantAuthorizesDirectCareCommunication(facts.grant)
        ) {
          return { status: "denied", reason_code: "not_authorized" };
        }
        return { status: "ok", output: execution.committed_result_payload };
      }
      if (!itemRef) return { status: "denied", reason_code: "invalid_query_input" };
      return queryFamilyCareItemDetail(
        {
          reads: queryReads,
          protected_content: protectedContent,
          integrity_key: input.integrityKey,
        },
        {
          workspace_id: request.workspace_id,
          participant_id: request.actor_participant_id,
          item_id: itemRef.object_id,
        },
      );
    },

    async readInstitutionBusinessCommunication(request) {
      return readInstitutionBusinessCommunication(
        {
          reads: institutionBusinessCommunicationReads,
          protected_content: protectedContent,
          integrity_key: input.integrityKey,
        },
        {
          workspace_id: request.workspace_id,
          participant_id: request.actor_participant_id,
          target_option_ref: request.target_option_ref,
        },
      );
    },
  };

  type BuiltCommand =
    | { status: "ok"; payload: unknown; spec: NurtureCommandSpec<never> }
    | { status: "invalid"; reason_code: string };

  /**
   * Public execute responses never carry a raw owner row id. The runner's refs
   * keep their canonical ids internally — storage, replay comparison and
   * readResult all need them — but on the wire each `object_id` is replaced by
   * the same keyed display handle `committed_result` uses for the same concept.
   * The sealing is deterministic, so a replayed response still compares equal
   * to the original executed one.
   */
  function sealCommittedRefs(
    workspaceId: string,
    response: HarnessExecuteResponseV1,
  ): HarnessExecuteResponseV1 {
    if (response.status !== "committed") return response;
    const seal = (value: unknown): unknown => {
      const ref = value as {
        schema_version?: number;
        namespace?: string;
        object_type?: string;
        object_id?: string;
        version?: number;
      };
      if (
        typeof ref?.namespace !== "string" ||
        typeof ref?.object_type !== "string" ||
        typeof ref?.object_id !== "string"
      ) {
        // A ref this cannot read must not pass through unsealed.
        return { sealed: false };
      }
      return {
        ...ref,
        object_id: issueCapabilityResultRef(
          input.integrityKey,
          { workspace_id: workspaceId },
          ref.object_type,
          { namespace: ref.namespace, object_type: ref.object_type, object_id: ref.object_id },
        ),
      };
    };
    return {
      ...response,
      execution_ref: seal(response.execution_ref),
      output_refs: response.output_refs.map(seal),
    };
  }

  /**
   * The release fan-out: confirmation semantics first (same classification and
   * CAS consume as `withHarnessConfirmation`, but service-level — there is no
   * single command transaction to host them), then one attempt over every
   * target. Each target's PublicationRelease + Receipt + CommandExecution
   * commit atomically inside the owner with the attempt as parent; the wire
   * answer names the attempt once and carries every per-target outcome in the
   * frozen `releaseResult` shape. A consumed confirmation is not replayable —
   * reconciliation is re-prepare + a fresh attempt, answered from stored rows
   * (`already_committed` is detected by row presence, not command identity).
   */
  async function executeReleaseFanout(
    request: HarnessExecuteRequestV1,
    row: Awaited<ReturnType<typeof confirmations.findByTokenHash>>,
    payload: HarnessConfirmationPayloadV2,
  ): Promise<HarnessExecuteResponseV1> {
    const now = new Date();
    const scope = {
      workspace_id: request.workspace_id,
      participant_id: request.actor_participant_id,
    };
    const classified = classifyInteractionContextRow(
      row,
      {
        workspace_id: request.workspace_id,
        participant_id: request.actor_participant_id,
        purpose: "prepare_action",
        surface: request.surface,
        ...(request.host_conversation_ref
          ? { host_conversation_ref: request.host_conversation_ref }
          : {}),
      },
      now,
    );
    if (classified.status === "expired") {
      return notCommitted("conflict", "confirmation_expired");
    }
    if (classified.status !== "current") {
      if (classified.status === "blocked" && classified.reason_code === "token_replayed") {
        return notCommitted("conflict", "confirmation_replayed");
      }
      if (classified.status === "blocked" && classified.reason_code === "token_revoked") {
        return notCommitted("blocked", "confirmation_revoked");
      }
      return notCommitted("blocked", "invalid_confirmation");
    }
    if (payload.command_request_id !== request.command_request_id) {
      return notCommitted("blocked", "invalid_confirmation");
    }
    if (!isEmptyOperationInput(request.operation_input)) {
      return notCommitted("invalid", "invalid_operation_input");
    }
    const processKey = payload.target_refs.publish_process;
    const expectedTargetSnapshotVersion =
      payload.target_refs.publish_target_snapshot;
    const expectedRevision = payload.expected_heads.draft_revision;
    if (!processKey || expectedRevision === undefined) {
      return notCommitted("blocked", "invalid_confirmation");
    }
    const expectedTag = computeHarnessInputIntegrityTag(
      input.integrityKey,
      canonicalizeReleasePublishProcessCommand({
        process_key: processKey,
        expected_release_revision: expectedRevision,
        ...(expectedTargetSnapshotVersion
          ? {
              expected_target_snapshot_version:
                expectedTargetSnapshotVersion,
            }
          : {}),
        trigger: "immediate",
      }),
    );
    if (expectedTag !== payload.input_integrity_tag) {
      return notCommitted("conflict", "input_integrity_mismatch");
    }

    const consumed = await confirmations.consume({
      workspace_id: request.workspace_id,
      context_id: classified.context.id,
      expected_version: classified.context.version,
      consumed_at: now.toISOString(),
    });
    if (!consumed) return notCommitted("conflict", "confirmation_replayed");

    const decision = await releasePublishProcess(
      { integrity_key: input.integrityKey, reads: publicationReleaseReads },
      scope,
      {
        process_ref: issueBoardSealedRef(
          input.integrityKey,
          scope,
          PUBLISH_PROCESS_TARGET_KIND,
          processKey,
        ),
        command_request_id: request.command_request_id,
        trigger: "immediate",
        expected_release_revision: expectedRevision,
        ...(expectedTargetSnapshotVersion
          ? {
              expected_target_snapshot_version:
                expectedTargetSnapshotVersion,
            }
          : {}),
      },
    );
    if (decision.status === "denied") {
      return decision.reason_code === "stale_confirmation"
        ? notCommitted("conflict", "stale_confirmation")
        : notCommitted("blocked", decision.reason_code);
    }
    const attemptRef = {
      schema_version: 1,
      namespace: "nurture",
      object_type: "publication_release_attempt",
      // The owner's real parent identity: every per-target CommandExecution
      // this attempt committed carries exactly this hash as its parent.
      object_id: publicationReleaseAttemptIdentity(request.command_request_id),
      version: 1,
    };
    const committedResult = {
      processState: decision.processState,
      ...(decision.frozenRevision !== undefined
        ? { frozenRevision: decision.frozenRevision }
        : {}),
      results: decision.results,
      summary: decision.summary,
      missedSendAttention: decision.missedSendAttention,
    };
    if (decision.summary.committed > 0) {
      return {
        status: "committed",
        execution_disposition: "executed",
        business_outcome: "applied",
        execution_ref: attemptRef,
        output_refs: [attemptRef],
        committed_result: committedResult,
      };
    }
    if (decision.summary.outcomeUnknown > 0) {
      // At least one target may or may not have committed and this attempt's
      // confirmation is spent: the honest answer is indeterminate, and the
      // reconciliation is a fresh prepare whose facts read the stored rows.
      return { status: "outcome_unknown", reason_code: "target_outcome_unknown", recovery: "reconcile_same_command" };
    }
    // Zero commits and every outcome certain: nothing was written anywhere.
    return notCommitted("blocked", "no_target_committed");
  }

  /**
   * The confirmation is the only source of targets and frozen heads; the typed
   * input is the only thing the caller resubmits. Each descriptor turns that
   * pair into its own exact command, or refuses.
   */
  function buildHarnessCommand(
    request: HarnessExecuteRequestV1,
    payload: HarnessConfirmationPayloadV2,
  ): BuiltCommand {
    const descriptor = actions[request.capability_key];
    if (!("build" in descriptor)) {
      return { status: "invalid", reason_code: "invalid_operation_input" };
    }
    const built = descriptor.build({
      operation_input: request.operation_input,
      target_refs: payload.target_refs,
      expected_heads: payload.expected_heads,
      workspace_id: request.workspace_id,
      actor_participant_id: request.actor_participant_id,
    });
    return built
      ? { status: "ok", payload: built.payload, spec: built.spec }
      : { status: "invalid", reason_code: "invalid_operation_input" };
  }
}

type PrepareScope = {
  workspace_id: string;
  participant_id: string;
  surface: string;
  host_conversation_ref?: string;
};

type OptionalTargetRequest = {
  operation_input: unknown;
  target_option_ref?: string;
  target_snapshot_ref?: string;
};
type RequiredTargetRequest = { operation_input: unknown; target_option_ref: string };

type BuildInput = {
  operation_input: unknown;
  target_refs: Record<string, string>;
  expected_heads: Record<string, number>;
  /**
   * The authenticated actor scope, for descriptors that must bind a
   * resubmitted sealed ref to the id the confirmation froze — sealed refs are
   * deterministic per actor, so the binding is an equality, not a resolution.
   */
  workspace_id: string;
  actor_participant_id: string;
};

type BuiltPayload = { payload: unknown; spec: NurtureCommandSpec<never> };

type HarnessActionDescriptor = {
  prepare(
    request: HarnessInternalPrepareRequestV1,
    scope: PrepareScope,
  ): Promise<HarnessPrepareResponseV1>;
} & (
  | {
      /** `null` is the single "this confirmation and this input do not compose" answer. */
      build(built: BuildInput): BuiltPayload | null;
    }
  | {
      /**
       * A deliberate non-kernel execution: the capability runs a fan-out
       * attempt whose per-target effects commit atomically inside the owner.
       * Confirmation semantics are the callee's obligation.
       */
      fanout(
        request: HarnessExecuteRequestV1,
        row: NurtureInteractionContextRecord | null,
        payload: HarnessConfirmationPayloadV2,
      ): Promise<HarnessExecuteResponseV1>;
    }
);

/**
 * Several capabilities take no typed input at all. Absent and `{}` are the two
 * shapes their frozen contract admits; anything else is a caller sending a
 * field the capability never declared.
 */
const isEmptyOperationInput = (value: unknown): boolean =>
  value === undefined ||
  (Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0);
