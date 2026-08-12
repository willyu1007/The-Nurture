import {
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  NURTURE_FAMILY_SHARING_CLEANUP_OPERATION,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION,
  NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT,
  NURTURE_FAMILY_SHARING_PRIVATE_INGRESS,
  NURTURE_FAMILY_SHARING_PRIVATE_INPUT_SCHEMA_VERSION,
  NurtureFamilySharingCleanupOwner,
  nurtureCanonicalJsonBytes,
  parseCleanupInput,
  parseEligibilityPrivateInput,
  readFamilySharingEligibility,
  signNurtureScenarioResponse,
  verifyNurtureScenarioInvocation,
  type NurtureDetachedRequestSignatureV1,
  type NurtureDetachedResponseSignatureV1,
  type NurtureFamilySharingCleanupResultV1,
  type NurtureFamilySharingCurrentAuthorityReadPortV1,
  type NurtureFamilySharingEligibilityResultV1,
  type NurtureFamilySharingExactLocalPairResolverV1,
  type NurtureInvocationTrustPolicyV1,
  type NurtureResponseSigningIdentityV1,
  type NurtureScenarioNonceStore,
  type NurtureFamilySharingVerifiedServicePrincipalV1,
} from "@the-nurture/scenario";

export const FAMILY_SHARING_PRIVATE_REQUEST_SIGNATURE_HEADER =
  "x-nurture-request-signature" as const;
export const FAMILY_SHARING_PRIVATE_RESPONSE_SIGNATURE_HEADER =
  "x-nurture-response-signature" as const;
export const FAMILY_SHARING_PRIVATE_SERVICE_SUBJECT_HEADER =
  "x-nurture-service-subject" as const;

export const NURTURE_FAMILY_SHARING_PRIVATE_DECLARATIONS = Object.freeze([
  declaration(NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION),
  declaration(NURTURE_FAMILY_SHARING_CLEANUP_OPERATION),
]);

export type FamilySharingPrivateRuntimeResult = Readonly<{
  status: 200;
  body: Buffer;
  response_signature: NurtureDetachedResponseSignatureV1;
}>;

export type FamilySharingPrivateRuntime = Readonly<{
  engine?: FamilySharingPrivateEngine;
}>;

export class FamilySharingPrivateContractError extends Error {
  constructor(
    readonly code: "invalid_request" | "route_mismatch" | "output_invalid",
  ) {
    super(code);
    this.name = "FamilySharingPrivateContractError";
  }
}

/**
 * C3 private composition. Construction requires every trust, replay, signing,
 * exact-pair and owner dependency; the application default never constructs
 * this engine and therefore cannot accidentally provide positive results.
 */
export class FamilySharingPrivateEngine {
  constructor(
    private readonly dependencies: Readonly<{
      trustPolicies: readonly NurtureInvocationTrustPolicyV1[];
      nonceStore: NurtureScenarioNonceStore;
      responseIdentity: NurtureResponseSigningIdentityV1;
      localPairResolver: NurtureFamilySharingExactLocalPairResolverV1;
      authority: NurtureFamilySharingCurrentAuthorityReadPortV1;
      cleanupOwner: NurtureFamilySharingCleanupOwner;
      now?: () => Date;
    }>,
  ) {
    if (dependencies.trustPolicies.length === 0) {
      throw new Error("At least one family-sharing trust policy is required.");
    }
  }

  async invoke(input: {
    invocation: unknown;
    signature: NurtureDetachedRequestSignatureV1;
    transportCredentialSubject: string | undefined;
  }): Promise<FamilySharingPrivateRuntimeResult> {
    const now = (this.dependencies.now ?? (() => new Date()))();
    if (!Number.isFinite(now.getTime())) {
      throw new FamilySharingPrivateContractError("invalid_request");
    }
    const verified = await verifyNurtureScenarioInvocation({
      invocation: input.invocation,
      signature: input.signature,
      transport_credential_subject: input.transportCredentialSubject,
      trust_policies: this.dependencies.trustPolicies,
      nonce_store: this.dependencies.nonceStore,
      now,
    });
    assertExactPrivateRoute(verified.invocation);
    const workspaceId = exactWorkspaceId(verified.invocation.principal.workspace_ref);
    if (!workspaceId) throw new FamilySharingPrivateContractError("invalid_request");

    const operation = verified.invocation.operation;
    let result:
      | NurtureFamilySharingEligibilityResultV1
      | NurtureFamilySharingCleanupResultV1;

    if (operation.operation_key === NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION) {
      const request = parseEligibilityPrivateInput(operation.input);
      if (!request) throw new FamilySharingPrivateContractError("invalid_request");
      const servicePrincipal = authorityReadPrincipal(verified);
      const localPair = await this.dependencies.localPairResolver.resolveExact({
        workspace_id: workspaceId,
        pair_evidence: verifiedPairEvidence(request.pair_evidence),
        target: verifiedTarget(request.target),
        evaluated_at: now.toISOString(),
      });
      result = localPair.status === "resolved"
        ? await readFamilySharingEligibility({
            authority: this.dependencies.authority,
            service_principal: servicePrincipal,
            request,
            local_pair: localPair.local_pair,
            evaluated_at: now.toISOString(),
          })
        : { status: "unavailable" };
    } else if (operation.operation_key === NURTURE_FAMILY_SHARING_CLEANUP_OPERATION) {
      const request = parseCleanupInput(operation.input);
      if (!request) throw new FamilySharingPrivateContractError("invalid_request");
      const localPair = await this.dependencies.localPairResolver.resolveExact({
        workspace_id: workspaceId,
        pair_evidence: verifiedPairEvidence(request.pair_evidence),
        target: verifiedTarget(request.target),
        evaluated_at: now.toISOString(),
      });
      result = localPair.status === "resolved"
        ? await this.dependencies.cleanupOwner.cleanup({
            invocation_request_ref: verified.invocation.request.request_id,
            service_ref: verified.invocation.caller_binding.caller_subject,
            request: { wire: request, local_pair: localPair.local_pair },
          })
        : { status: "unavailable" };
    } else {
      throw new FamilySharingPrivateContractError("route_mismatch");
    }

    if (!validPrivateOutput(operation.operation_key, result)) {
      throw new FamilySharingPrivateContractError("output_invalid");
    }
    const body = nurtureCanonicalJsonBytes(result);
    return {
      status: 200,
      body,
      response_signature: signNurtureScenarioResponse({
        verified,
        response_status: 200,
        response_body: body,
        identity: this.dependencies.responseIdentity,
        now,
      }),
    };
  }
}

function authorityReadPrincipal(verified: {
  trust_policy_revision: number;
  credential_subject: string;
  invocation: {
    issuer: string;
    caller_binding: { caller_subject: string };
  };
}): NurtureFamilySharingVerifiedServicePrincipalV1 {
  return {
    verification: "verified_service_principal",
    service_ref: verified.invocation.caller_binding.caller_subject,
    trust_source_ref: `c30.trust:${verified.invocation.issuer}:${verified.credential_subject}`,
    trust_source_version: verified.trust_policy_revision,
    audience: NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
    operation: NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  };
}

export function createDisabledFamilySharingPrivateRuntime(): FamilySharingPrivateRuntime {
  return Object.freeze({});
}

export function createFamilySharingPrivateRuntime(input: ConstructorParameters<
  typeof FamilySharingPrivateEngine
>[0]): FamilySharingPrivateRuntime {
  return Object.freeze({ engine: new FamilySharingPrivateEngine(input) });
}

function declaration(operationKey: string) {
  return Object.freeze({
    scenario_key: "nurture",
    endpoint_key: NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT,
    method: "POST" as const,
    operation_key: operationKey,
    input_schema_version: NURTURE_FAMILY_SHARING_PRIVATE_INPUT_SCHEMA_VERSION,
    ingress_category: "workflow_runtime" as const,
    ingress_key: NURTURE_FAMILY_SHARING_PRIVATE_INGRESS,
    principal_origins: ["durable_run_actor"] as const,
  });
}

function assertExactPrivateRoute(invocation: {
  route: {
    scenario_key: string;
    endpoint_key: string;
    method: string;
    ingress: { ingress_version: number; ingress_category: string; ingress_key: string };
  };
  operation: { operation_key: string; input_schema_version: number };
}): void {
  const operationAllowed =
    invocation.operation.operation_key === NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION ||
    invocation.operation.operation_key === NURTURE_FAMILY_SHARING_CLEANUP_OPERATION;
  if (
    invocation.route.scenario_key !== "nurture" ||
    invocation.route.endpoint_key !== NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT ||
    invocation.route.method !== "POST" ||
    invocation.route.ingress.ingress_version !== 1 ||
    invocation.route.ingress.ingress_category !== "workflow_runtime" ||
    invocation.route.ingress.ingress_key !== NURTURE_FAMILY_SHARING_PRIVATE_INGRESS ||
    invocation.operation.input_schema_version !==
      NURTURE_FAMILY_SHARING_PRIVATE_INPUT_SCHEMA_VERSION ||
    !operationAllowed
  ) throw new FamilySharingPrivateContractError("route_mismatch");
}

function exactWorkspaceId(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value).sort().join("|");
  return keys === "namespace|object_id|object_type|schema_version" &&
    value.schema_version === 1 &&
    value.namespace === "my_chat" &&
    value.object_type === "workspace" &&
    opaque(value.object_id)
    ? value.object_id
    : null;
}

function verifiedPairEvidence(value: {
  evidence_ref: string;
  evidence_version: number;
  verified_at: string;
  expires_at: string;
  child_anchor_ref: string;
  child_owner_version: number;
  family_anchor_ref: string;
  family_owner_version: number;
  my_chat_family_lifecycle: "active" | "inactive";
}) {
  return { verification: "verified_current_pair_evidence" as const, ...value };
}

function verifiedTarget(value: {
  pair_evidence_ref: string;
  pair_evidence_version: number;
  target_kind: "enrollment";
  enrollment_ref: string;
  enrollment_revision: number;
}) {
  return { verification: "verified_exact_target_selector" as const, ...value };
}

function validPrivateOutput(
  operation: string,
  value: unknown,
): boolean {
  if (!isRecord(value)) return false;
  if (value.status === "unavailable") {
    return Object.keys(value).length === 1;
  }
  if (operation === NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION) {
    return validEligibilityOutput(value);
  }
  if (operation === NURTURE_FAMILY_SHARING_CLEANUP_OPERATION) {
    return validCleanupOutput(value);
  }
  return false;
}

function validEligibilityOutput(value: Record<string, unknown>): boolean {
  if (
    Object.keys(value).sort().join("|") !==
      "authority_version|categories|contract|evaluated_at|purpose|status" ||
    value.status !== "resolved" ||
    typeof value.authority_version !== "string" ||
    !/^v1\.sha256:[a-f0-9]{64}$/u.test(value.authority_version) ||
    typeof value.evaluated_at !== "string" ||
    !Array.isArray(value.categories) ||
    value.categories.length !== 3
  ) return false;
  return value.categories.every((category) =>
    isRecord(category) &&
    Object.keys(category).sort().join("|") ===
      "category_key|destination_lifecycle|direction|eligibility|source_lifecycle" &&
    (category.category_key === "daily_activity" ||
      category.category_key === "media" ||
      category.category_key === "focus_collaboration") &&
    (category.eligibility === "eligible" || category.eligibility === "ineligible") &&
    (category.source_lifecycle === "active" || category.source_lifecycle === "inactive") &&
    (category.destination_lifecycle === "active" ||
      category.destination_lifecycle === "inactive"),
  );
}

function validCleanupOutput(value: Record<string, unknown>): boolean {
  return (
    Object.keys(value).sort().join("|") ===
      "categories|cleanup_command_ref|cleanup_receipt_ref|completed_at|disposition|purged_store_count|status" &&
    value.status === "cleaned" &&
    (value.disposition === "executed" || value.disposition === "replayed") &&
    opaque(value.cleanup_receipt_ref) &&
    opaque(value.cleanup_command_ref) &&
    Array.isArray(value.categories) &&
    value.categories.length > 0 &&
    value.categories.every(
      (category) => category === "media" || category === "focus_collaboration",
    ) &&
    Number.isSafeInteger(value.purged_store_count) &&
    Number(value.purged_store_count) >= 0 &&
    typeof value.completed_at === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function opaque(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}
