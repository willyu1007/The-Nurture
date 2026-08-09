import type {
  NurtureAuthorityChainRequest,
  NurtureAuthorityChainResult,
  NurtureGrantAsk,
} from "./institution-authority-chain.js";
import { resolveAggregate } from "./institution-aggregate.js";
import type { NurtureAggregateMember, NurturePolicyReasonCode } from "./institution-context.js";

export const INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION = "1.0.0" as const;

export const NURTURE_INSTITUTION_SUPPORT_SIGNAL_CATEGORIES = [
  "attendance_submission_overdue",
  "business_response_overdue",
  "review_backlog_threshold",
  "authority_or_source_blocked",
  "work_item_or_workflow_blocked",
  "configured_load_threshold",
  "ai_attention_candidate",
] as const;

export type NurtureInstitutionSupportSignalCategory =
  (typeof NURTURE_INSTITUTION_SUPPORT_SIGNAL_CATEGORIES)[number];

export type NurtureInstitutionSupportSignalTier =
  | "action_required"
  | "attention_suggested";

const TIER_BY_CATEGORY: Record<
  NurtureInstitutionSupportSignalCategory,
  NurtureInstitutionSupportSignalTier
> = {
  attendance_submission_overdue: "action_required",
  business_response_overdue: "action_required",
  review_backlog_threshold: "attention_suggested",
  authority_or_source_blocked: "action_required",
  work_item_or_workflow_blocked: "action_required",
  configured_load_threshold: "attention_suggested",
  ai_attention_candidate: "attention_suggested",
};

const SAFE_REASON_BY_CATEGORY = {
  attendance_submission_overdue: "Attendance submission is past its checkpoint.",
  business_response_overdue: "A business response is past its explicit deadline.",
  review_backlog_threshold: "The configured review backlog threshold is reached.",
  authority_or_source_blocked: "Current authority or source state blocks this work.",
  work_item_or_workflow_blocked: "A current work item or workflow is blocked.",
  configured_load_threshold: "The configured pending-work threshold is reached.",
  ai_attention_candidate: "A source-cited item may need attention.",
} as const satisfies Record<NurtureInstitutionSupportSignalCategory, string>;

export type NurtureInstitutionSupportSignalPolicyV1 = {
  contract_version: string;
  policy_ref: string;
  workspace_id: string;
  institution_ref: string;
  /** Absent means the exact Institution policy; present is a class override. */
  care_group_ref?: string;
  category: NurtureInstitutionSupportSignalCategory;
  absolute_threshold?: number;
  window_key: string;
  checkpoint_ref: string;
  enabled: boolean;
  policy_revision: number;
  effective_from: string;
  effective_to?: string;
  changed_by_role_assignment_ref: string;
  change_reason: string;
};

export type NurtureInstitutionSupportSignalAggregateMember = NurtureAggregateMember & {
  current_count: number;
};

/**
 * One actor-safe fact from a canonical owner. The signal composer does not
 * infer source state, deadlines or readability; owners provide those facts
 * after their exact read predicate has run.
 */
export type NurtureInstitutionSupportSignalSourceV1 = {
  workspace_id: string;
  institution_ref: string;
  source_type: string;
  source_ref: string;
  category: NurtureInstitutionSupportSignalCategory;
  scope_ref: string;
  scope_kind: "institution" | "care_group";
  subject_order: { age_band_key: string | null; name: string };
  checkpoint_ref: string;
  occurred_at: string;
  deadline_at?: string;
  condition: "open" | "blocked" | "resolved";
  readable: boolean;
  aggregate?: {
    members: NurtureInstitutionSupportSignalAggregateMember[];
    ask: NurtureGrantAsk;
  };
};

export type NurtureInstitutionSupportSignalV1 = {
  category: NurtureInstitutionSupportSignalCategory;
  tier: NurtureInstitutionSupportSignalTier;
  scopeRef: string;
  sourceRef: string;
  safeReason: string;
  currentCount?: number;
  deadlineAt?: string;
  occurredAt: string;
  policyRevision: number;
  contractVersion: typeof INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION;
};

export type NurtureInstitutionSupportSignalProjectionV1 = {
  contract_version: typeof INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION;
  institution_ref: string;
  snapshot_at: string;
  signals: NurtureInstitutionSupportSignalV1[];
  projection_version: 1;
};

export type NurtureInstitutionSupportSignalComposeDecision =
  | { status: "ok"; output: NurtureInstitutionSupportSignalProjectionV1 }
  | {
      status: "denied";
      reason_code: "contract_mismatch" | NurturePolicyReasonCode;
    }
  | {
      status: "unavailable";
      reason_code: NurturePolicyReasonCode | "source_unavailable";
    };

const isThresholdCategory = (
  category: NurtureInstitutionSupportSignalCategory,
): category is "review_backlog_threshold" | "configured_load_threshold" =>
  category === "review_backlog_threshold" || category === "configured_load_threshold";

const isOverdueCategory = (
  category: NurtureInstitutionSupportSignalCategory,
): category is "attendance_submission_overdue" | "business_response_overdue" =>
  category === "attendance_submission_overdue" || category === "business_response_overdue";

const validInstant = (value: string): boolean => !Number.isNaN(new Date(value).getTime());

const effectiveAt = (
  policy: NurtureInstitutionSupportSignalPolicyV1,
  at: Date,
): boolean =>
  validInstant(policy.effective_from) &&
  new Date(policy.effective_from) <= at &&
  (!policy.effective_to ||
    (validInstant(policy.effective_to) && new Date(policy.effective_to) > at));

const policyFor = (
  policies: NurtureInstitutionSupportSignalPolicyV1[],
  source: NurtureInstitutionSupportSignalSourceV1,
  at: Date,
  workspaceId: string,
  institutionRef: string,
): { status: "absent" } | { status: "mismatch" } | {
  status: "resolved";
  policy: NurtureInstitutionSupportSignalPolicyV1;
} => {
  const applicable = policies.filter(
    (policy) =>
      policy.category === source.category &&
      policy.workspace_id === workspaceId &&
      policy.institution_ref === institutionRef &&
      effectiveAt(policy, at) &&
      (policy.care_group_ref === undefined ||
        (source.scope_kind === "care_group" &&
          policy.care_group_ref === source.scope_ref)),
  );
  const classPolicies = applicable.filter(
    (policy) => policy.care_group_ref === source.scope_ref,
  );
  const candidates = classPolicies.length > 0
    ? classPolicies
    : applicable.filter((policy) => policy.care_group_ref === undefined);
  if (candidates.length === 0) return { status: "absent" };
  if (
    candidates.length !== 1 ||
    candidates[0]!.contract_version !== INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION
  ) {
    return { status: "mismatch" };
  }
  return { status: "resolved", policy: candidates[0]! };
};

/** Composite identity; clients can derive it without a stored signal row. */
export const institutionSupportSignalDedupeIdentity = (input: {
  source_type: string;
  source_ref: string;
  policy_revision: number;
  window_key: string;
}): string =>
  JSON.stringify([
    input.source_type,
    input.source_ref,
    input.policy_revision,
    input.window_key,
  ]);

type OrderedSignal = {
  signal: NurtureInstitutionSupportSignalV1;
  dedupe_identity: string;
  subject_order: NurtureInstitutionSupportSignalSourceV1["subject_order"];
};

const orderSignals = (signals: OrderedSignal[]): NurtureInstitutionSupportSignalV1[] =>
  [...signals]
    .sort((left, right) => {
      const leftDeadline = left.signal.deadlineAt;
      const rightDeadline = right.signal.deadlineAt;
      if (leftDeadline && rightDeadline) {
        const byDeadline = leftDeadline.localeCompare(rightDeadline);
        if (byDeadline !== 0) return byDeadline;
      } else if (leftDeadline) {
        return -1;
      } else if (rightDeadline) {
        return 1;
      }
      const byBand = (left.subject_order.age_band_key ?? "￿").localeCompare(
        right.subject_order.age_band_key ?? "￿",
      );
      if (byBand !== 0) return byBand;
      const byName = left.subject_order.name.localeCompare(right.subject_order.name);
      return byName !== 0
        ? byName
        : left.dedupe_identity.localeCompare(right.dedupe_identity);
    })
    .map((entry) => entry.signal);

/**
 * Pure 0D-5 composition. It writes nothing and has no command surface.
 */
export const composeInstitutionSupportSignals = (input: {
  workspace_id: string;
  institution_ref: string;
  snapshot_at: string;
  policies: NurtureInstitutionSupportSignalPolicyV1[];
  sources: NurtureInstitutionSupportSignalSourceV1[];
  source_status: "available" | "unavailable";
}): NurtureInstitutionSupportSignalComposeDecision => {
  const at = new Date(input.snapshot_at);
  if (Number.isNaN(at.getTime())) {
    return { status: "unavailable", reason_code: "policy_unavailable" };
  }
  if (input.source_status === "unavailable") {
    return { status: "unavailable", reason_code: "source_unavailable" };
  }
  const candidates = new Map<string, OrderedSignal>();
  for (const source of input.sources) {
    if (
      source.workspace_id !== input.workspace_id ||
      source.institution_ref !== input.institution_ref ||
      source.source_ref.length === 0 ||
      !source.readable ||
      source.condition === "resolved" ||
      !validInstant(source.occurred_at) ||
      new Date(source.occurred_at) > at
    ) {
      continue;
    }
    const selected = policyFor(
      input.policies,
      source,
      at,
      input.workspace_id,
      input.institution_ref,
    );
    if (selected.status === "absent") continue;
    if (selected.status === "mismatch") {
      return { status: "denied", reason_code: "contract_mismatch" };
    }
    const policy = selected.policy;
    if (!policy.enabled) continue;
    if (
      policy.checkpoint_ref !== source.checkpoint_ref ||
      policy.window_key.length === 0 ||
      !Number.isSafeInteger(policy.policy_revision) ||
      policy.policy_revision < 1
    ) {
      return { status: "denied", reason_code: "contract_mismatch" };
    }

    let currentCount: number | undefined;
    if (isThresholdCategory(source.category)) {
      if (
        !source.aggregate ||
        policy.absolute_threshold === undefined ||
        !Number.isSafeInteger(policy.absolute_threshold) ||
        policy.absolute_threshold < 1
      ) {
        return { status: "denied", reason_code: "contract_mismatch" };
      }
      if (
        new Set(source.aggregate.members.map((member) => member.member_ref)).size !==
          source.aggregate.members.length ||
        source.aggregate.members.some(
          (member) =>
            !Number.isSafeInteger(member.current_count) || member.current_count < 0,
        )
      ) {
        return { status: "denied", reason_code: "contract_mismatch" };
      }
      const countByMember = new Map(
        source.aggregate.members.map((member) => [member.member_ref, member.current_count]),
      );
      const aggregate = resolveAggregate(
        source.aggregate.members,
        source.aggregate.ask,
        (member) => countByMember.get(member.member_ref) ?? 0,
      );
      if (aggregate.status === "unavailable") return aggregate;
      if (aggregate.value < policy.absolute_threshold) continue;
      currentCount = aggregate.value;
    } else if (isOverdueCategory(source.category)) {
      if (!source.deadline_at || !validInstant(source.deadline_at)) continue;
      if (new Date(source.deadline_at) >= at) continue;
    } else if (source.condition !== "blocked" && source.category !== "ai_attention_candidate") {
      continue;
    }

    const identity = institutionSupportSignalDedupeIdentity({
      source_type: source.source_type,
      source_ref: source.source_ref,
      policy_revision: policy.policy_revision,
      window_key: policy.window_key,
    });
    candidates.set(identity, {
      dedupe_identity: identity,
      subject_order: source.subject_order,
      signal: {
        category: source.category,
        tier: TIER_BY_CATEGORY[source.category],
        scopeRef: source.scope_ref,
        sourceRef: source.source_ref,
        safeReason: SAFE_REASON_BY_CATEGORY[source.category],
        ...(currentCount !== undefined ? { currentCount } : {}),
        ...(source.deadline_at ? { deadlineAt: source.deadline_at } : {}),
        occurredAt: source.occurred_at,
        policyRevision: policy.policy_revision,
        contractVersion: INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION,
      },
    });
  }
  return {
    status: "ok",
    output: {
      contract_version: INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION,
      institution_ref: input.institution_ref,
      snapshot_at: input.snapshot_at,
      signals: orderSignals([...candidates.values()]),
      projection_version: 1,
    },
  };
};

export type NurtureInstitutionSupportSignalPolicyRevisionDecision =
  | { status: "allowed"; next_revision: number }
  | { status: "conflict"; reason_code: "conflict" }
  | { status: "invalid"; reason_code: "contract_mismatch" };

/** One optimistic-concurrency rule for every policy category and scope. */
export const decideInstitutionSupportSignalPolicyRevision = (input: {
  current_revision: number;
  expected_policy_revision: number;
  contract_version: string;
}): NurtureInstitutionSupportSignalPolicyRevisionDecision => {
  if (
    input.contract_version !== INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION ||
    !Number.isSafeInteger(input.current_revision) ||
    input.current_revision < 0 ||
    !Number.isSafeInteger(input.expected_policy_revision) ||
    input.expected_policy_revision < 0
  ) {
    return { status: "invalid", reason_code: "contract_mismatch" };
  }
  return input.current_revision === input.expected_policy_revision
    ? { status: "allowed", next_revision: input.current_revision + 1 }
    : { status: "conflict", reason_code: "conflict" };
};

export type NurtureInstitutionSupportSignalRepository = {
  loadEffectivePolicies(input: {
    workspace_id: string;
    institution_ref: string;
    snapshot_at: string;
  }): Promise<NurtureInstitutionSupportSignalPolicyV1[]>;
  loadAuthorizedSources(input: {
    workspace_id: string;
    participant_ref: string;
    institution_ref: string;
    snapshot_at: string;
  }): Promise<{
    status: "available" | "unavailable";
    sources: NurtureInstitutionSupportSignalSourceV1[];
  }>;
};

type SupportSignalAuthorityPort = {
  resolve(request: NurtureAuthorityChainRequest): Promise<NurtureAuthorityChainResult>;
};

/** Authority-first request composer. Reads never mutate a source or policy. */
export class NurtureInstitutionSupportSignalService {
  constructor(
    private readonly repository: NurtureInstitutionSupportSignalRepository,
    private readonly authority: SupportSignalAuthorityPort,
  ) {}

  async compose(request: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref?: string;
    institution_ref: string;
    snapshot_at: string;
  }): Promise<NurtureInstitutionSupportSignalComposeDecision> {
    const scope = await this.authority.resolve({
      workspace_id: request.workspace_id,
      participant_ref: request.participant_ref,
      ...(request.role_assignment_ref
        ? { role_assignment_ref: request.role_assignment_ref }
        : {}),
      at: request.snapshot_at,
    });
    if (scope.status === "denied") {
      return { status: "denied", reason_code: scope.reason_code };
    }
    if (scope.institution_scope.institution_ref !== request.institution_ref) {
      return { status: "denied", reason_code: "not_authorized" };
    }
    try {
      const [policies, sources] = await Promise.all([
        this.repository.loadEffectivePolicies(request),
        this.repository.loadAuthorizedSources(request),
      ]);
      return composeInstitutionSupportSignals({
        workspace_id: request.workspace_id,
        institution_ref: request.institution_ref,
        snapshot_at: request.snapshot_at,
        policies,
        sources: sources.sources,
        source_status: sources.status,
      });
    } catch {
      return { status: "unavailable", reason_code: "source_unavailable" };
    }
  }
}
