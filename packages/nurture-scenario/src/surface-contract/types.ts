export type InterfaceContractRefV1 = {
  key: "nurture.surface-contract";
  version: string;
  digest: `sha256:${string}`;
};

export type VersionedRefV1 = {
  key: string;
  version: string;
};

export type DependencyGateStageV1 =
  | "contract_boundary"
  | "owner_integration"
  | "joint_conformance"
  | "activation";

export type DependencyGateV1 = {
  dependencyKey: string;
  minimumVersion: string;
  requiredGate: DependencyGateStageV1;
};

export type HeadBindingModeV1 =
  | "must_equal"
  | "must_satisfy"
  | "compatible_append"
  | "convergent_postcondition";

export type HeadBindingV1 = {
  headKey: string;
  mode: HeadBindingModeV1;
  predicateRef?: VersionedRefV1;
  postconditionRef?: VersionedRefV1;
};

export type CapabilityDescriptorV1 = {
  capabilityKey: string;
  capabilityVersion: string;
  contract: InterfaceContractRefV1;
  domainClass:
    | "care_interaction"
    | "institution_management"
    | "publish_process"
    | "read_model";
  executionClass:
    | "query"
    | "action_execution"
    | "institution_workflow_action"
    | "publish_process_transition";
  deliveryClass: "none" | "action_delivery_candidate";
  intentKeys: string[];
  inputSchemaRef: string;
  resultSchemaRef: string;
  errorSchemaRef: string;
  targetPolicy: {
    kind:
      | "none"
      | "exact_bound"
      | "owner_option_required"
      | "unique_eligible_default";
    optionSchemaRef: string | null;
  };
  confirmationPolicy:
    | "none"
    | "direct_commit"
    | "reviewable_commit"
    | "strong_confirmation";
  concurrencyPolicy: {
    class: "exact_state" | "lifecycle_authority" | "append_compatible";
    headBindings: HeadBindingV1[];
  };
  eligibilityPolicyRef: VersionedRefV1;
  handlerBinding: {
    bindingKey: string;
    bindingKind: "query" | "action" | "institution_workflow" | "publish_process";
  };
  presenterBindings: Array<{
    surfaceKey: string;
    presenterKey: string;
  }>;
  invalidationScopeKinds: string[];
  dependencyGates: DependencyGateV1[];
  supportedRoles?: string[];
};

export type SurfaceContractManifestV1 = {
  schemaVersion: 1;
  interfaceContract: InterfaceContractRefV1;
  canonicalization: {
    schemaVersion: 1;
    algorithm: "sha256";
    encoding: "utf-8";
    inventoryOrder: "path_lexicographic";
    objectKeys: "lexicographic";
    arrayOrder: "semantic_except_declared_registries";
    duplicateObjectKeys: "reject";
  };
  sourceSet: {
    sourceDigest: `sha256:${string}`;
    inventory: Array<{
      path: string;
      artifactHash: `sha256:${string}`;
    }>;
  };
  sharedCoreHash: `sha256:${string}`;
  capabilities: Array<{
    capabilityKey: string;
    capabilityVersion: string;
    sliceHash: `sha256:${string}`;
    descriptor: CapabilityDescriptorV1;
  }>;
  surfaces: Array<{
    surfaceKey: string;
    surfaceVersion: string;
    presenterKey: string;
    sliceHash: `sha256:${string}`;
  }>;
  admission: {
    mode: "exact_key_version_digest";
    versionRanges: "forbidden";
    latestAlias: "forbidden";
    fallback: "forbidden";
  };
};

export type ContractAdmissionV1 =
  | {
      admitted: true;
      contract: InterfaceContractRefV1;
    }
  | {
      admitted: false;
      error: {
        code: "contract_mismatch";
        retryHint: "required_upgrade";
        contract: InterfaceContractRefV1;
      };
    };

export type DependencyStateV1 = {
  dependencyKey: string;
  version: string;
  achievedGate: DependencyGateStageV1;
};

export type DependencyReadinessV1 =
  | {
      status: "eligible";
      reasons: [];
    }
  | {
      status: "unavailable";
      reasons: Array<{
        code: "dependency_no_go";
        dependencyKey: string;
        retryHint: "required_upgrade" | "none";
      }>;
    };

export type QueryInvocationV1<TInput extends object> = {
  expectedContract: InterfaceContractRefV1;
  surfaceKey: string;
  surfaceVersion: string;
  capabilityKey: string;
  capabilityVersion: string;
  trustedContextRef: string;
  scopeRef: string;
  purposeKey: string;
  requestNonce: string;
  expiresAt: string;
  targetOptionRef?: string;
  typedInput: TInput;
  cursor?: string;
  pageSize?: number;
};

export type PrepareActionInvocationV1<TInput extends object> = {
  expectedContract: InterfaceContractRefV1;
  surfaceKey: string;
  surfaceVersion: string;
  capabilityKey: string;
  capabilityVersion: string;
  trustedContextRef: string;
  scopeRef: string;
  purposeKey: string;
  requestNonce: string;
  expiresAt: string;
  targetOptionRef?: string;
  commandIdentity: string;
  idempotencyKey: string;
  typedInput: TInput;
};

export type ExecuteActionInvocationV1 = {
  expectedContract: InterfaceContractRefV1;
  surfaceKey: string;
  surfaceVersion: string;
  capabilityKey: string;
  capabilityVersion: string;
  trustedContextRef: string;
  scopeRef: string;
  purposeKey: string;
  requestNonce: string;
  expiresAt: string;
  commandIdentity: string;
  idempotencyKey: string;
  confirmationRef: string;
};

export type ReadResultInvocationV1 = {
  expectedContract: InterfaceContractRefV1;
  capabilityKey: string;
  capabilityVersion: string;
  trustedContextRef: string;
  scopeRef: string;
  purposeKey: string;
  requestNonce: string;
  expiresAt: string;
  commandExecutionRef: string;
};
