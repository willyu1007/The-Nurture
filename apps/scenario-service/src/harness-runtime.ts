import type { OnApplicationShutdown } from "@nestjs/common";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createAcknowledgeFamilyCareItemSpec,
  createReplyFamilyCareItemSpec,
  createSubmitFamilyCareQuestionSpec,
  hashCommandRequestId,
  hashScenarioToken,
  parseHarnessConfirmationPayloadV2,
  parseReplyFamilyCareItemInputV1,
  parseSubmitFamilyCareQuestionInputV1,
  prepareAcknowledgeFamilyCareItem,
  prepareReplyFamilyCareItem,
  prepareSubmitFamilyCareQuestion,
  queryCaregiverFamilyCareWork,
  queryFamilyCareItemDetail,
  queryGuardianFamilyCareTimeline,
  resolveCareItemTargetRef,
  withHarnessConfirmation,
  type HarnessConfirmationPayloadV2,
  type ItemActionPrepareDecision,
  type NurtureCommandSpec,
  type SubmitPrepareDecision,
} from "@the-nurture/scenario/harness";
import {
  PrismaFamilyCareCommandTransaction,
  PrismaFamilyCareHarnessQueryReadPort,
  PrismaInteractionContextRepository,
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
} from "./harness-http.js";

const PROTECTED_CONTENT_KEY_REF = "nurture-protected-content-v1";

export type HarnessEngine = {
  prepare(request: HarnessPrepareRequestV1): Promise<HarnessPrepareResponseV1>;
  execute(request: HarnessExecuteRequestV1): Promise<HarnessExecuteResponseV1>;
  query(request: HarnessQueryRequestV1): Promise<HarnessQueryResponseV1>;
  readResult(request: HarnessReadResultRequestV1): Promise<HarnessQueryResponseV1>;
};

export class HarnessRuntime implements OnApplicationShutdown {
  constructor(
    readonly engine: HarnessEngine | undefined,
    private readonly ownedDatabaseClient?: Pick<NurturePrismaClient, "$disconnect">,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.ownedDatabaseClient?.$disconnect();
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
}): HarnessRuntime {
  if (input.engine) return new HarnessRuntime(input.engine);

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
  const factsPort = new PrismaFamilyCareCommandTransaction(input.prisma);
  const queryReads = new PrismaFamilyCareHarnessQueryReadPort(input.prisma);
  const protectedContent = createAesGcmProtectedContentPort({
    keyRef: PROTECTED_CONTENT_KEY_REF,
    keyMaterial: input.contentKey,
  });
  const submitSpec = createSubmitFamilyCareQuestionSpec({
    protected_content: protectedContent,
    integrity_key: input.integrityKey,
  });
  const acknowledgeSpec = createAcknowledgeFamilyCareItemSpec();
  const replySpec = createReplyFamilyCareItemSpec({
    protected_content: protectedContent,
    integrity_key: input.integrityKey,
  });

  const toPrepareResponse = (
    decision: SubmitPrepareDecision | ItemActionPrepareDecision,
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

  return {
    async prepare(request) {
      const shared = {
        workspace_id: request.workspace_id,
        participant_id: request.actor_participant_id,
        surface: request.surface,
        ...(request.host_conversation_ref
          ? { host_conversation_ref: request.host_conversation_ref }
          : {}),
      };
      if (request.capability_key === "submit_family_care_question") {
        return toPrepareResponse(
          await prepareSubmitFamilyCareQuestion(
            { eligibility: submitEligibility, contexts, integrity_key: input.integrityKey },
            {
              ...shared,
              operation_input: request.operation_input,
              ...(request.target_option_ref
                ? { target_option_ref: request.target_option_ref }
                : {}),
            },
          ),
        );
      }
      if (!request.target_option_ref) {
        return { status: "needs_input", fields: ["target_option_ref"] };
      }
      const itemRequest = {
        ...shared,
        target_option_ref: request.target_option_ref,
        operation_input: request.operation_input,
      };
      return toPrepareResponse(
        request.capability_key === "acknowledge_family_care_item"
          ? await prepareAcknowledgeFamilyCareItem(
              { facts: factsPort, contexts, integrity_key: input.integrityKey },
              itemRequest,
            )
          : await prepareReplyFamilyCareItem(
              { facts: factsPort, contexts, integrity_key: input.integrityKey },
              itemRequest,
            ),
      );
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
      return mapHarnessCommandResult(result);
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
  };

  type BuiltCommand =
    | { status: "ok"; payload: unknown; spec: NurtureCommandSpec<never> }
    | { status: "invalid"; reason_code: string };

  function buildHarnessCommand(
    request: HarnessExecuteRequestV1,
    payload: HarnessConfirmationPayloadV2,
  ): BuiltCommand {
    if (request.capability_key === "submit_family_care_question") {
      const parsed = parseSubmitFamilyCareQuestionInputV1(request.operation_input);
      const enrollmentId = payload.target_refs.enrollment;
      if (parsed.status !== "ok" || !enrollmentId) {
        return { status: "invalid", reason_code: "invalid_operation_input" };
      }
      const continuation = payload.target_refs.continuation_item;
      return {
        status: "ok",
        payload: {
          body: parsed.input.body,
          enrollment_id: enrollmentId,
          ...(continuation ? { context_continuation_of_item_id: continuation } : {}),
        },
        spec: submitSpec as NurtureCommandSpec<never>,
      };
    }
    const itemId = payload.target_refs.care_item;
    if (!itemId) return { status: "invalid", reason_code: "invalid_operation_input" };
    if (request.capability_key === "acknowledge_family_care_item") {
      if (
        request.operation_input !== undefined &&
        (typeof request.operation_input !== "object" ||
          request.operation_input === null ||
          Object.keys(request.operation_input).length > 0)
      ) {
        return { status: "invalid", reason_code: "invalid_operation_input" };
      }
      return {
        status: "ok",
        payload: {
          item_id: itemId,
          expected_acknowledgement_head: payload.expected_heads.acknowledgement ?? 0,
          expected_lifecycle_head: payload.expected_heads.lifecycle ?? 0,
        },
        spec: acknowledgeSpec as NurtureCommandSpec<never>,
      };
    }
    const parsed = parseReplyFamilyCareItemInputV1(request.operation_input);
    if (parsed.status !== "ok") {
      return { status: "invalid", reason_code: "invalid_operation_input" };
    }
    return {
      status: "ok",
      payload: {
        body: parsed.input.body,
        item_id: itemId,
        expected_lifecycle_head: payload.expected_heads.lifecycle ?? 0,
      },
      spec: replySpec as NurtureCommandSpec<never>,
    };
  }
}
