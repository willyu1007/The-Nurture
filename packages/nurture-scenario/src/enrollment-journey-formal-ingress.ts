import type {
  WorkflowTrustedInvocationHandlerRegistry,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import {
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1,
  parseNurtureEnrollmentJourneyFormalExecuteInputV2,
  parseNurtureEnrollmentJourneyFormalPrepareInputV1,
  parseNurtureEnrollmentJourneyFormalQueryInputV1,
  type NurtureEnrollmentJourneyFormalAuthorityResolverV1,
  type NurtureEnrollmentJourneyLocalAuthorityV1,
  type NurtureEnrollmentJourneyPreparedCommandOwnerV1,
} from "./enrollment-journey-formal-ingress-contract.js";
import type { NurtureWorkflowRunSettlementOwnerV1 } from "./domain/institution/workflow-run-settlement.js";
import {
  NurtureEnrollmentJourneySurfaceHandler,
  type NurtureEnrollmentJourneyAdapterRequest,
  type NurtureEnrollmentJourneyBindingPort,
  type NurtureEnrollmentJourneySurfaceDeps,
  type NurtureEnrollmentJourneyTrustedContextV1,
} from "./enrollment-journey-surfaces.js";

export const NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS = Object.freeze({
  query: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.query.handler_key,
  prepare: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.prepare.handler_key,
  execute: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.execute.handler_key,
} as const);

export type NurtureEnrollmentJourneyFormalIngressDeps = {
  surfaceDeps: NurtureEnrollmentJourneySurfaceDeps;
  authorityResolver?: NurtureEnrollmentJourneyFormalAuthorityResolverV1;
  preparedCommandOwner?: NurtureEnrollmentJourneyPreparedCommandOwnerV1;
  workflowRunSettlementOwner?: NurtureWorkflowRunSettlementOwnerV1;
};

export function createNurtureEnrollmentJourneyFormalInvocationHandlers(
  deps: NurtureEnrollmentJourneyFormalIngressDeps,
): WorkflowTrustedInvocationHandlerRegistry {
  return Object.freeze({
    [NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.query]:
      (verified) => query(verified, deps),
    [NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.prepare]:
      (verified) => prepare(verified, deps),
    [NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]:
      (verified) => execute(verified, deps),
  });
}

async function query(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureEnrollmentJourneyFormalIngressDeps,
): Promise<unknown> {
  if (!matchesOperation(verified, "query")) return declarationDrift();
  const input = parseNurtureEnrollmentJourneyFormalQueryInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.authorityResolver) return unavailable();
  try {
    const resolution = await resolveCurrentAuthority(verified, deps, input.request);
    if (resolution.status !== "resolved") return resolution;
    return await invokeSurface(
      verified,
      deps,
      resolution.authority,
      input.request,
      verified.invocation.request.request_id,
    );
  } catch {
    return unavailable();
  }
}

async function prepare(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureEnrollmentJourneyFormalIngressDeps,
): Promise<unknown> {
  if (!matchesOperation(verified, "prepare")) return declarationDrift();
  const input = parseNurtureEnrollmentJourneyFormalPrepareInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.preparedCommandOwner || !deps.authorityResolver) return unavailable();
  try {
    const resolution = await resolveCurrentAuthority(verified, deps, input.request);
    if (resolution.status !== "resolved") return resolution;
    const prepared = await deps.preparedCommandOwner.prepare({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      client_surface: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.client_surface,
      authority: resolution.authority,
      command: input,
    });
    return normalizePreparedResult(prepared, input.request.capabilityKey);
  } catch {
    return unavailable();
  }
}

async function execute(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureEnrollmentJourneyFormalIngressDeps,
): Promise<unknown> {
  if (!matchesOperation(verified, "execute")) return declarationDrift();
  const input = parseNurtureEnrollmentJourneyFormalExecuteInputV2(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.preparedCommandOwner || !deps.authorityResolver) return unavailable();
  try {
    if ("commandRequestId" in input) {
      // Ledgered lane: verify without consuming — the production executor
      // consumes the ledger row inside the same transaction as the I1 effect
      // (record 63/86).
      const verifiedCommand = normalizeVerifiedResult(
        await deps.preparedCommandOwner.verifyConfirmed({
          principal: verified.invocation.principal,
          invocation_request_id: verified.invocation.request.request_id,
          client_surface: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.client_surface,
          command: {
            commandRequestId: input.commandRequestId,
            confirmationRef: input.confirmationRef,
          },
        }),
      );
      if (verifiedCommand.status !== "resolved") return verifiedCommand;
      if (
        verifiedCommand.command_request_id !== input.commandRequestId ||
        verifiedCommand.frozen_request.confirmationRef !== input.confirmationRef
      ) return { status: "conflict", reason_code: "prepared_command_binding_drift" };
      const startsInquiry =
        verifiedCommand.frozen_request.capabilityKey === "start_enrollment_inquiry";
      if (
        startsInquiry !== (input.hostWorkflowRunReservation !== undefined)
      ) return invalid();
      if (startsInquiry && !deps.workflowRunSettlementOwner) return unavailable();
      const hostReservation = input.hostWorkflowRunReservation;
      const current = await resolveCurrentAuthority(
        verified,
        deps,
        verifiedCommand.frozen_request,
      );
      if (current.status !== "resolved") return current;
      if (!sameAuthority(verifiedCommand.authority, current.authority)) {
        return { status: "denied", reason_code: "enrollment_authority_snapshot_drift" };
      }
      const surfaceResult = await invokeSurface(
        verified,
        deps,
        current.authority,
        verifiedCommand.frozen_request,
        verifiedCommand.command_request_id,
        hostReservation,
      );
      if (!startsInquiry || !isRecord(surfaceResult) || surfaceResult.status !== "ok") {
        return surfaceResult;
      }
      if (!hostReservation) return invalid();
      const settlement = await deps.workflowRunSettlementOwner?.readStatus({
        workspace_id: current.authority.workspace_id,
        command_request_id: verifiedCommand.command_request_id,
        host_reservation: hostReservation,
      });
      if (settlement?.status !== "committed") {
        return {
          status: "outcome_unknown",
          reason_code: "workflow_run_settlement_receipt_unavailable",
        };
      }
      return {
        ...surfaceResult,
        workflow_run_settlement: settlement,
      };
    }
    // Direct lane: the three direct_commit capabilities bypass the ledger
    // with an owner-derived deterministic command id (I1 idempotency dedups
    // replays); the surface still authorizes role and surface.
    const resolution = await resolveCurrentAuthority(verified, deps, input.request);
    if (resolution.status !== "resolved") return resolution;
    const direct = await deps.preparedCommandOwner.deriveDirectContext({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      client_surface: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.client_surface,
      command: { clientCommandId: input.clientCommandId, request: input.request },
    });
    if (direct.status !== "resolved") {
      return validReasonCode(direct.reason_code)
        ? direct
        : unavailable("enrollment_journey_owner_response_invalid");
    }
    if (!opaqueId(direct.command_request_id) || !opaqueRef(direct.confirmation_ref)) {
      return unavailable("enrollment_journey_owner_response_invalid");
    }
    const request = {
      ...input.request,
      confirmationRef: direct.confirmation_ref,
    } as NurtureEnrollmentJourneyAdapterRequest;
    return await invokeSurface(
      verified,
      deps,
      resolution.authority,
      request,
      direct.command_request_id,
    );
  } catch {
    return unavailable();
  }
}

async function invokeSurface(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureEnrollmentJourneyFormalIngressDeps,
  authority: NurtureEnrollmentJourneyLocalAuthorityV1,
  request: NurtureEnrollmentJourneyAdapterRequest,
  commandRequestId: string,
  hostWorkflowRunReservation?: NurtureEnrollmentJourneyTrustedContextV1["host_workflow_run_reservation"],
): Promise<unknown> {
  const workspaceId = verified.invocation.principal.workspace_ref.object_id;
  if (authority.workspace_id !== workspaceId) {
    return { status: "denied", reason_code: "enrollment_authority_workspace_drift" };
  }
  const trusted: NurtureEnrollmentJourneyTrustedContextV1 = {
    workspace_id: workspaceId,
    actor_participant_ref: authority.participant_ref,
    invocation_request_id: verified.invocation.request.request_id,
    host_correlation_id: verified.invocation.request.correlation_id,
    ...(verified.invocation.request.trace_id === undefined
      ? {}
      : { host_trace_id: verified.invocation.request.trace_id }),
    command_request_id: commandRequestId,
    client_surface: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.client_surface,
    ...(hostWorkflowRunReservation === undefined
      ? {}
      : { host_workflow_run_reservation: hostWorkflowRunReservation }),
  };
  const handler = new NurtureEnrollmentJourneySurfaceHandler({
    ...deps.surfaceDeps,
    bindings: authorityBoundBindings(deps.surfaceDeps.bindings, authority),
  });
  return handler.handle(request, trusted);
}

function authorityBoundBindings(
  source: NurtureEnrollmentJourneyBindingPort,
  authority: NurtureEnrollmentJourneyLocalAuthorityV1,
): NurtureEnrollmentJourneyBindingPort {
  return {
    async resolve(input) {
      const result = await source.resolve(input);
      if (result.status !== "resolved") return result;
      const binding = result.binding;
      return binding.institution_ref === authority.institution_ref &&
        binding.role_assignment_ref === authority.role_assignment_ref &&
        binding.active_role === authority.active_role &&
        binding.surface_key === authority.surface_key
        ? result
        : { status: "unavailable", reason_code: "enrollment_authority_binding_drift" };
    },
  };
}

async function resolveCurrentAuthority(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureEnrollmentJourneyFormalIngressDeps,
  request: {
    capabilityKey: Parameters<
      NurtureEnrollmentJourneyFormalAuthorityResolverV1["resolveCurrent"]
    >[0]["capability_key"];
    targetOptionRef: string;
  },
) {
  if (!deps.authorityResolver) return unavailable();
  return normalizeAuthorityResolution(
    await deps.authorityResolver.resolveCurrent({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      declared_operation_key: verified.declaration.operation_key,
      capability_key: request.capabilityKey,
      target_option_ref: request.targetOptionRef,
    }),
  );
}

function normalizeAuthorityResolution(
  value: Awaited<ReturnType<NurtureEnrollmentJourneyFormalAuthorityResolverV1["resolveCurrent"]>>,
) {
  if (value.status === "resolved") {
    return validAuthority(value.authority)
      ? { status: "resolved" as const, authority: { ...value.authority } }
      : unavailable("enrollment_journey_owner_response_invalid");
  }
  return validReasonCode(value.reason_code)
    ? { status: value.status, reason_code: value.reason_code }
    : unavailable("enrollment_journey_owner_response_invalid");
}

function normalizePreparedResult(
  value: Awaited<ReturnType<NurtureEnrollmentJourneyPreparedCommandOwnerV1["prepare"]>>,
  expectedEffect: string,
) {
  if (value.status === "ready_to_confirm") {
    if (
      !opaqueId(value.command_request_id) ||
      !opaqueRef(value.confirmation_ref) ||
      !canonicalInstant(value.expires_at) ||
      value.effect !== expectedEffect
    ) {
      return unavailable("enrollment_journey_owner_response_invalid");
    }
    return {
      status: "ready_to_confirm" as const,
      command_request_id: value.command_request_id,
      confirmation_ref: value.confirmation_ref,
      expires_at: value.expires_at,
      effect: value.effect,
    };
  }
  return validReasonCode(value.reason_code)
    ? { status: value.status, reason_code: value.reason_code }
    : unavailable("enrollment_journey_owner_response_invalid");
}

function normalizeVerifiedResult(
  value: Awaited<ReturnType<NurtureEnrollmentJourneyPreparedCommandOwnerV1["verifyConfirmed"]>>,
) {
  if (value.status !== "resolved") {
    return validReasonCode(value.reason_code)
      ? { status: value.status, reason_code: value.reason_code }
      : unavailable("enrollment_journey_owner_response_invalid");
  }
  if (!opaqueId(value.command_request_id) || !validAuthority(value.authority)) {
    return unavailable("enrollment_journey_owner_response_invalid");
  }
  return {
    status: "resolved" as const,
    command_request_id: value.command_request_id,
    frozen_request: value.frozen_request,
    authority: { ...value.authority },
  };
}

function validAuthority(
  value: unknown,
): value is NurtureEnrollmentJourneyLocalAuthorityV1 {
  return isRecord(value) && exactKeys(value, [
    "active_role",
    "authority_version",
    "evaluated_at",
    "institution_ref",
    "participant_ref",
    "role_assignment_ref",
    "surface_key",
    "workspace_id",
  ]) &&
    opaqueId(value.workspace_id) &&
    opaqueId(value.participant_ref) &&
    opaqueId(value.institution_ref) &&
    opaqueId(value.role_assignment_ref) &&
    value.active_role === "institution_admin" &&
    value.surface_key === "institution_workbench" &&
    opaqueId(value.authority_version) &&
    canonicalInstant(value.evaluated_at);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length &&
    expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,190}$/u.test(value);
}

function opaqueRef(value: unknown): value is string {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:~=-]{15,511}$/u.test(value);
}

function validReasonCode(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,119}$/u.test(value);
}

function canonicalInstant(value: unknown): value is string {
  return typeof value === "string" &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function sameAuthority(
  prepared: NurtureEnrollmentJourneyLocalAuthorityV1,
  current: NurtureEnrollmentJourneyLocalAuthorityV1,
): boolean {
  return prepared.workspace_id === current.workspace_id &&
    prepared.participant_ref === current.participant_ref &&
    prepared.institution_ref === current.institution_ref &&
    prepared.role_assignment_ref === current.role_assignment_ref &&
    prepared.active_role === current.active_role &&
    prepared.surface_key === current.surface_key &&
    prepared.authority_version === current.authority_version;
}

function matchesOperation(
  verified: WorkflowVerifiedScenarioInvocationV1,
  lane: "query" | "prepare" | "execute",
): boolean {
  const contract = NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1[lane];
  const invocation = verified.invocation;
  const declaration = verified.declaration;
  return declaration.scenario_key === "nurture" &&
    declaration.method === contract.method &&
    declaration.endpoint_key === contract.endpoint_key &&
    declaration.operation_key === contract.operation_key &&
    declaration.input_schema_version === contract.input_schema_version &&
    declaration.ingress_category === NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.ingress_category &&
    declaration.ingress_key === contract.ingress_key &&
    declaration.principal_origins.length === 1 &&
    declaration.principal_origins[0] === NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.principal_origin &&
    invocation.route.scenario_key === declaration.scenario_key &&
    invocation.route.method === declaration.method &&
    invocation.route.endpoint_key === declaration.endpoint_key &&
    invocation.route.ingress.ingress_category === declaration.ingress_category &&
    invocation.route.ingress.ingress_key === declaration.ingress_key &&
    invocation.operation.operation_key === declaration.operation_key &&
    invocation.operation.input_schema_version === declaration.input_schema_version &&
    invocation.principal.principal_origin === declaration.principal_origins[0];
}

function invalid() {
  return { status: "invalid" as const, reason_code: "invalid_enrollment_journey_formal_input" };
}

function unavailable(
  reasonCode = "enrollment_journey_formal_ingress_unavailable",
) {
  return { status: "unavailable" as const, reason_code: reasonCode };
}

function declarationDrift() {
  return { status: "unavailable" as const, reason_code: "enrollment_journey_formal_declaration_drift" };
}
