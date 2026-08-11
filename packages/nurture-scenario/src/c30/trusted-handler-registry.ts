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
      assertOperation(verified, "list_subject_contexts");
      if (!owner) return unavailable();
      return owner.list(
        verified.invocation.principal,
        verified.invocation.operation.input as ListScenarioSubjectContextsInputV1,
      );
    },
    [handlerKeys.resolve]: async (verified) => {
      assertOperation(verified, "resolve_subject_context");
      if (!owner) return unavailable();
      return owner.resolve(
        verified.invocation.principal,
        verified.invocation.operation.input as ResolveScenarioSubjectContextInputV1,
      );
    },
    [handlerKeys.present]: async (verified) => {
      assertOperation(verified, "present_subject_context");
      if (!owner) return unavailable();
      return owner.present(
        verified.invocation.principal,
        verified.invocation.operation.input as PresentScenarioSubjectContextInputV1,
      );
    },
  });
}

function assertOperation(
  verified: WorkflowVerifiedScenarioInvocationV1,
  operationKey: "list_subject_contexts" | "resolve_subject_context" | "present_subject_context",
): void {
  if (
    verified.invocation.route.scenario_key !== "nurture" ||
    verified.invocation.operation.operation_key !== operationKey ||
    verified.declaration.operation_key !== operationKey
  ) {
    throw new Error("trusted Nurture invocation operation does not match its handler");
  }
}

function unavailable(): { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 } {
  return {
    status: "unavailable",
    safe_reason: {
      reason_code: "unavailable",
      message: {
        kind: "plain_text",
        value: "The requested Nurture context is unavailable.",
        locale: "en",
      },
      retry_class: "refresh",
    },
  };
}
