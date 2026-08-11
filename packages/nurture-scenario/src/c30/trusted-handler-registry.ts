import type {
  ListScenarioSubjectContextsInputV1,
  PresentScenarioSubjectContextInputV1,
  ResolveScenarioSubjectContextInputV1,
  ScenarioSafeReasonV1,
  WorkflowTrustedInvocationHandlerRegistry,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import type { NurtureC30ChildCareProcessPresentationOwner } from "./subject-presentation.js";

const handlerKeys = Object.freeze({
  list: "nurture.c30.list_subject_contexts.transport",
  resolve: "nurture.c30.resolve_subject_context.transport",
  present: "nurture.c30.present_subject_context.transport",
} as const);

const operationBindings = Object.freeze({
  list: {
    endpoint_key: "nurture.subject_context.list",
    operation_key: "list_subject_contexts",
    ingress_category: "host_transition",
    ingress_key: "nurture.subject_context.list",
  },
  resolve: {
    endpoint_key: "nurture.subject_context.resolve",
    operation_key: "resolve_subject_context",
    ingress_category: "host_transition",
    ingress_key: "nurture.subject_context.resolve",
  },
  present: {
    endpoint_key: "nurture.subject_context.present",
    operation_key: "present_subject_context",
    ingress_category: "product_surface",
    ingress_key: "nurture.child_care_process_overview_v1",
  },
} as const);

export type NurtureC30TrustedInvocationOwner = Pick<
  NurtureC30ChildCareProcessPresentationOwner,
  "list" | "resolve" | "present"
>;

/**
 * Bind only the three exact C30 operations declared by the manifest. The host
 * dispatcher supplies a sanitized verified invocation; transport credentials,
 * signatures and trust-policy material are not part of this registry input.
 */
export function createNurtureC30TrustedInvocationHandlers(
  owner?: NurtureC30TrustedInvocationOwner,
): WorkflowTrustedInvocationHandlerRegistry {
  return Object.freeze({
    [handlerKeys.list]: async (verified) => {
      if (!matchesOperation(verified, operationBindings.list)) return unavailable("authority_changed");
      if (!owner) return unavailable("subject_unavailable");
      return owner.list(
        verified.invocation.principal,
        verified.invocation.operation.input as ListScenarioSubjectContextsInputV1,
      );
    },
    [handlerKeys.resolve]: async (verified) => {
      if (!matchesOperation(verified, operationBindings.resolve)) return unavailable("authority_changed");
      if (!owner) return unavailable("subject_unavailable");
      return owner.resolve(
        verified.invocation.principal,
        verified.invocation.operation.input as ResolveScenarioSubjectContextInputV1,
      );
    },
    [handlerKeys.present]: async (verified) => {
      if (!matchesOperation(verified, operationBindings.present)) return unavailable("authority_changed");
      if (!owner) return unavailable("subject_unavailable");
      return owner.present(
        verified.invocation.principal,
        verified.invocation.operation.input as PresentScenarioSubjectContextInputV1,
      );
    },
  });
}

function matchesOperation(
  verified: WorkflowVerifiedScenarioInvocationV1,
  binding: (typeof operationBindings)[keyof typeof operationBindings],
): boolean {
  const { declaration, invocation } = verified;
  return declaration.scenario_key === "nurture"
    && declaration.endpoint_key === binding.endpoint_key
    && declaration.method === "POST"
    && declaration.operation_key === binding.operation_key
    && declaration.input_schema_version === 1
    && declaration.ingress_category === binding.ingress_category
    && declaration.ingress_key === binding.ingress_key
    && declaration.principal_origins.length === 1
    && declaration.principal_origins[0] === "interactive_session"
    && invocation.route.scenario_key === declaration.scenario_key
    && invocation.route.endpoint_key === declaration.endpoint_key
    && invocation.route.method === declaration.method
    && invocation.route.ingress.ingress_category === declaration.ingress_category
    && invocation.route.ingress.ingress_key === declaration.ingress_key
    && invocation.operation.operation_key === declaration.operation_key
    && invocation.operation.input_schema_version === declaration.input_schema_version
    && invocation.principal.principal_origin === "interactive_session";
}

function unavailable(
  reasonCode: "subject_unavailable" | "authority_changed",
): { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 } {
  return {
    status: "unavailable",
    safe_reason: {
      reason_code: reasonCode,
      message: {
        kind: "plain_text",
        value: reasonCode === "authority_changed"
          ? "Current care authority is unavailable."
          : "The care process is unavailable.",
        locale: "en",
      },
      retry_class: "refresh",
    },
  };
}
