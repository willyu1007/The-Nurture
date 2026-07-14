import type {
  CanonicalRef,
  DomainContextRef,
  ScenarioCommandDriverContext,
  ScenarioHandoffRequestSnapshot,
} from "@my-chat/workflow-contracts";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;
const DRIVER_KEYS = new Set([
  "driverRef",
  "contractHash",
  "capabilityKey",
  "entrypointKey",
  "claimToken",
  "expectedStepVersion",
]);
const DRIVER_REF_KEYS = new Set([
  "namespace",
  "consumer_scenario_key",
  "object_type",
  "object_id",
  "owner_scope",
]);
const CONTEXT_REF_KEYS = new Set([
  "namespace",
  "consumer_scenario_key",
  "object_type",
  "object_id",
  "version",
  "owner_scope",
  "canonical_ref",
]);
const CANONICAL_REF_KEYS = new Set(["kind", "id", "version"]);
const CANONICAL_REF_KINDS = new Set<CanonicalRef["kind"]>([
  "scenario",
  "capability",
  "workflow_version",
  "workflow_run",
  "workflow_step",
  "workflow_artifact",
  "workflow_approval",
  "workflow_handoff",
  "domain_context_ref",
  "context_snapshot",
  "downstream_object",
]);
const CANONICAL_IDENTITY_KEYS = new Set(["service", "object_type", "object_id"]);
const SNAPSHOT_KEYS = new Set([
  "requestId",
  "handoffKey",
  "requestedPurpose",
  "sourceContextRefs",
  "sourceArtifactRefs",
  "expiresAt",
]);
const ACTIVATION_KEYS = new Set(["request_id", "expires_at", "driver_context"]);

export const NURTURE_HANDOFF_SNAPSHOT_LIMIT = 32;
const MAX_REF_COLLECTION = 32;
const MAX_SERIALIZED_REF = 2_000;
const MAX_CLAIM_TOKEN = 2_048;
const MAX_CONTRACT_HASH = 256;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, keys: ReadonlySet<string>): boolean =>
  Object.keys(value).every((key) => keys.has(key));

const validId = (value: unknown): value is string => typeof value === "string" && ID.test(value);

const validText = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maxLength && !CONTROL.test(value);

const validVersion = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;

const validIsoInstant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const normalizeCanonicalIdentity = (
  value: unknown,
): DomainContextRef["canonical_ref"] | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !hasOnlyKeys(value, CANONICAL_IDENTITY_KEYS)) {
    throw new Error("invalid canonical context identity");
  }
  if (!validId(value.service) || !validId(value.object_type) || !validId(value.object_id)) {
    throw new Error("invalid canonical context identity");
  }
  return {
    service: value.service,
    object_type: value.object_type,
    object_id: value.object_id,
  };
};

const normalizeContextRef = (value: unknown): DomainContextRef => {
  if (!isRecord(value) || !hasOnlyKeys(value, CONTEXT_REF_KEYS)) {
    throw new Error("invalid handoff context ref");
  }
  if (
    !validId(value.namespace) ||
    !validId(value.object_type) ||
    !validId(value.object_id) ||
    !["workspace", "organization", "platform", "external"].includes(String(value.owner_scope)) ||
    (value.consumer_scenario_key !== undefined && !validId(value.consumer_scenario_key)) ||
    !validVersion(value.version)
  ) {
    throw new Error("invalid handoff context ref");
  }
  const canonicalRef = normalizeCanonicalIdentity(value.canonical_ref);
  const normalized: DomainContextRef = {
    namespace: value.namespace,
    ...(value.consumer_scenario_key
      ? { consumer_scenario_key: value.consumer_scenario_key }
      : {}),
    object_type: value.object_type,
    object_id: value.object_id,
    version: value.version,
    owner_scope: value.owner_scope as DomainContextRef["owner_scope"],
    ...(canonicalRef ? { canonical_ref: canonicalRef } : {}),
  };
  if (JSON.stringify(normalized).length > MAX_SERIALIZED_REF) {
    throw new Error("handoff context ref is too large");
  }
  return normalized;
};

const normalizeCanonicalRef = (value: unknown): CanonicalRef => {
  if (!isRecord(value) || !hasOnlyKeys(value, CANONICAL_REF_KEYS)) {
    throw new Error("invalid handoff artifact ref");
  }
  if (
    typeof value.kind !== "string" ||
    !CANONICAL_REF_KINDS.has(value.kind as CanonicalRef["kind"]) ||
    !validId(value.id) ||
    (value.version !== undefined && !validVersion(value.version))
  ) {
    throw new Error("invalid handoff artifact ref");
  }
  const kind = value.kind as CanonicalRef["kind"];
  const normalized: CanonicalRef = {
    kind,
    id: value.id,
    ...(value.version !== undefined ? { version: value.version } : {}),
  };
  if (JSON.stringify(normalized).length > MAX_SERIALIZED_REF) {
    throw new Error("handoff artifact ref is too large");
  }
  return normalized;
};

const normalizeRefCollection = <T>(
  value: unknown,
  normalize: (entry: unknown) => T,
): T[] | undefined => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_REF_COLLECTION) {
    throw new Error("invalid handoff source ref collection");
  }
  return value.map(normalize);
};

export type NurtureCommandHandoffActivation = {
  request_id: string;
  expires_at?: string;
  driver_context?: ScenarioCommandDriverContext;
};

export type NurtureCommandHandoffPolicy<Input> = {
  capability_key: string;
  entrypoint_key: string;
  handoff_key: string;
  requested_purpose: string;
  validate_input?: (input: Input) => string | null;
  select_source_context_refs: (
    input: Input,
    outputRefs: readonly DomainContextRef[],
  ) => DomainContextRef[];
};

export type PreparedNurtureHandoffActivation<Input> = {
  request_id: string;
  expires_at?: string;
  driver_ref: DomainContextRef;
  policy: NurtureCommandHandoffPolicy<Input>;
};

export type NurtureHandoffActivationDecision<Input> =
  | { status: "none" }
  | { status: "ready"; activation: PreparedNurtureHandoffActivation<Input> }
  | { status: "invalid"; reason_code: string };

const normalizeDriverRef = (value: unknown): DomainContextRef => {
  if (!isRecord(value) || !hasOnlyKeys(value, DRIVER_REF_KEYS)) {
    throw new Error("invalid durable handoff driver ref");
  }
  if (
    value.namespace !== "host.workflow" ||
    (value.consumer_scenario_key !== undefined && value.consumer_scenario_key !== "nurture") ||
    value.object_type !== "workflow_step" ||
    !validId(value.object_id) ||
    value.owner_scope !== "workspace"
  ) {
    throw new Error("invalid durable handoff driver ref");
  }
  return {
    namespace: "host.workflow",
    // The shared driver fixture is owner-shaped and omits a consumer. Persist
    // the scenario binding explicitly so a replay seed cannot cross scenarios.
    consumer_scenario_key: "nurture",
    object_type: "workflow_step",
    object_id: value.object_id,
    owner_scope: "workspace",
  };
};

export const normalizePersistedHandoffDriverRef = (value: unknown): DomainContextRef =>
  normalizeDriverRef(value);

export const prepareNurtureHandoffActivation = <Input>(input: {
  activation?: NurtureCommandHandoffActivation;
  policy?: NurtureCommandHandoffPolicy<Input>;
  command_input: Input;
}): NurtureHandoffActivationDecision<Input> => {
  if (!input.activation) return { status: "none" };
  if (!input.policy) return { status: "invalid", reason_code: "handoff_activation_not_supported" };
  const activation = input.activation as unknown;
  if (!isRecord(activation) || !hasOnlyKeys(activation, ACTIVATION_KEYS)) {
    return { status: "invalid", reason_code: "invalid_handoff_activation" };
  }
  if (!validId(activation.request_id)) {
    return { status: "invalid", reason_code: "invalid_handoff_request_id" };
  }
  if (activation.expires_at !== undefined && !validIsoInstant(activation.expires_at)) {
    return { status: "invalid", reason_code: "invalid_handoff_expiry" };
  }
  if (!activation.driver_context) {
    return { status: "invalid", reason_code: "missing_durable_handoff_driver" };
  }
  const driver = activation.driver_context;
  if (!isRecord(driver) || !hasOnlyKeys(driver, DRIVER_KEYS)) {
    return { status: "invalid", reason_code: "invalid_durable_handoff_driver" };
  }
  try {
    if (
      !validText(driver.contractHash, MAX_CONTRACT_HASH) ||
      driver.capabilityKey !== input.policy.capability_key ||
      driver.entrypointKey !== input.policy.entrypoint_key ||
      !validText(driver.claimToken, MAX_CLAIM_TOKEN) ||
      !validVersion(driver.expectedStepVersion)
    ) {
      throw new Error("invalid durable handoff driver binding");
    }
    const reasonCode = input.policy.validate_input?.(input.command_input) ?? null;
    if (reasonCode) return { status: "invalid", reason_code: reasonCode };
    return {
      status: "ready",
      activation: {
        request_id: activation.request_id,
        ...(activation.expires_at ? { expires_at: activation.expires_at } : {}),
        driver_ref: normalizeDriverRef(driver.driverRef),
        policy: input.policy,
      },
    };
  } catch {
    return { status: "invalid", reason_code: "invalid_durable_handoff_driver" };
  }
};

export const normalizeHandoffRequestSnapshots = (
  value: unknown,
): ScenarioHandoffRequestSnapshot[] => {
  if (!Array.isArray(value) || value.length > NURTURE_HANDOFF_SNAPSHOT_LIMIT) {
    throw new Error("invalid handoff snapshot collection");
  }
  const requestIds = new Set<string>();
  let previousRequestId: string | undefined;
  return value.map((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, SNAPSHOT_KEYS)) {
      throw new Error("invalid handoff snapshot");
    }
    if (
      !validId(entry.requestId) ||
      !validId(entry.handoffKey) ||
      !validId(entry.requestedPurpose) ||
      (entry.expiresAt !== undefined && !validIsoInstant(entry.expiresAt))
    ) {
      throw new Error("invalid handoff snapshot");
    }
    if (requestIds.has(entry.requestId) || (previousRequestId && previousRequestId >= entry.requestId)) {
      throw new Error("handoff snapshot request ids must be unique and sorted");
    }
    requestIds.add(entry.requestId);
    previousRequestId = entry.requestId;
    const sourceContextRefs = normalizeRefCollection(entry.sourceContextRefs, normalizeContextRef);
    const sourceArtifactRefs = normalizeRefCollection(entry.sourceArtifactRefs, normalizeCanonicalRef);
    if (!sourceContextRefs && !sourceArtifactRefs) {
      throw new Error("handoff snapshot requires a source ref");
    }
    return {
      requestId: entry.requestId,
      handoffKey: entry.handoffKey,
      requestedPurpose: entry.requestedPurpose,
      ...(sourceContextRefs ? { sourceContextRefs } : {}),
      ...(sourceArtifactRefs ? { sourceArtifactRefs } : {}),
      ...(entry.expiresAt ? { expiresAt: entry.expiresAt } : {}),
    };
  });
};

export const buildNurtureHandoffRequestSnapshots = <Input>(input: {
  activation: PreparedNurtureHandoffActivation<Input>;
  command_input: Input;
  output_refs: readonly DomainContextRef[];
}): ScenarioHandoffRequestSnapshot[] => {
  const sourceContextRefs = input.activation.policy.select_source_context_refs(
    input.command_input,
    input.output_refs,
  );
  return normalizeHandoffRequestSnapshots([
    {
      requestId: input.activation.request_id,
      handoffKey: input.activation.policy.handoff_key,
      requestedPurpose: input.activation.policy.requested_purpose,
      sourceContextRefs,
      ...(input.activation.expires_at ? { expiresAt: input.activation.expires_at } : {}),
    },
  ]);
};

export const normalizeExecutionHandoffState = (input: {
  snapshots: unknown;
  driver_ref: unknown;
}): {
  snapshots: ScenarioHandoffRequestSnapshot[];
  driver_ref?: DomainContextRef;
} => {
  const snapshots = normalizeHandoffRequestSnapshots(input.snapshots);
  if (snapshots.length === 0) {
    if (input.driver_ref !== null && input.driver_ref !== undefined) {
      throw new Error("empty handoff snapshots cannot persist a driver");
    }
    return { snapshots };
  }
  if (input.driver_ref === null || input.driver_ref === undefined) {
    throw new Error("non-empty handoff snapshots require a durable driver");
  }
  return { snapshots, driver_ref: normalizePersistedHandoffDriverRef(input.driver_ref) };
};

export const sameHandoffDriverRef = (
  left: DomainContextRef | undefined,
  right: DomainContextRef | undefined,
): boolean =>
  Boolean(
    left &&
      right &&
      left.namespace === right.namespace &&
      left.consumer_scenario_key === right.consumer_scenario_key &&
      left.object_type === right.object_type &&
      left.object_id === right.object_id &&
      left.owner_scope === right.owner_scope,
  );

export const sameHandoffActivationSnapshot = <Input>(
  snapshots: readonly ScenarioHandoffRequestSnapshot[],
  activation: PreparedNurtureHandoffActivation<Input>,
): boolean => {
  if (snapshots.length !== 1) return false;
  const [snapshot] = snapshots;
  return Boolean(
    snapshot &&
      snapshot.requestId === activation.request_id &&
      snapshot.handoffKey === activation.policy.handoff_key &&
      snapshot.requestedPurpose === activation.policy.requested_purpose &&
      (snapshot.expiresAt ?? null) === (activation.expires_at ?? null),
  );
};
