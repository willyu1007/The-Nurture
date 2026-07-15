export type ResolutionScopeRef = {
  kind: string;
  id: string;
};

export type ResolutionTargetRef = {
  object_type: string;
  object_id: string;
  lifecycle_state: string;
  child_care_process_id?: string;
};

export type ResolutionCandidate = {
  candidate_key: string;
  actor_binding_ref: string;
  scope_ref: ResolutionScopeRef;
  target_ref?: ResolutionTargetRef;
  intent_key: string;
  source_key: string;
  state_class: "actionable" | "active_context" | "recent_context";
  match_class:
    | "exact_entities"
    | "exact_topic_or_date"
    | "explicit_continuation"
    | "weak_recent_context";
  evidence_codes: string[];
  occurred_at?: string;
  dedupe_key: string;
  safe_label: string;
  safe_description?: string;
};

export type ResolutionKernelResult =
  | { status: "resolved"; candidate: ResolutionCandidate }
  | {
      status: "needs_clarification";
      reason_code: "ambiguous_context" | "weak_context" | "candidate_limit_exceeded";
      candidates: ResolutionCandidate[];
      total_candidate_count: number;
    }
  | { status: "blocked"; reason_code: "no_reachable_context" };

export const isResolutionCandidate = (value: unknown): value is ResolutionCandidate => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ResolutionCandidate>;
  return Boolean(
    typeof candidate.candidate_key === "string" &&
      typeof candidate.actor_binding_ref === "string" &&
      candidate.scope_ref &&
      typeof candidate.scope_ref.kind === "string" &&
      typeof candidate.scope_ref.id === "string" &&
      typeof candidate.intent_key === "string" &&
      typeof candidate.source_key === "string" &&
      ["actionable", "active_context", "recent_context"].includes(candidate.state_class ?? "") &&
      [
        "exact_entities",
        "exact_topic_or_date",
        "explicit_continuation",
        "weak_recent_context",
      ].includes(candidate.match_class ?? "") &&
      Array.isArray(candidate.evidence_codes) &&
      candidate.evidence_codes.every((entry) => typeof entry === "string") &&
      typeof candidate.dedupe_key === "string" &&
      typeof candidate.safe_label === "string" &&
      (!candidate.target_ref ||
        (typeof candidate.target_ref.object_type === "string" &&
          typeof candidate.target_ref.object_id === "string" &&
          typeof candidate.target_ref.lifecycle_state === "string"))
  );
};

const MATCH_RANK: Record<ResolutionCandidate["match_class"], number> = {
  exact_entities: 0,
  exact_topic_or_date: 1,
  explicit_continuation: 2,
  weak_recent_context: 3,
};

const STATE_RANK: Record<ResolutionCandidate["state_class"], number> = {
  actionable: 0,
  active_context: 1,
  recent_context: 2,
};

const semanticRank = (candidate: ResolutionCandidate): string =>
  `${MATCH_RANK[candidate.match_class]}:${STATE_RANK[candidate.state_class]}`;

const compareCandidates = (left: ResolutionCandidate, right: ResolutionCandidate): number => {
  const match = MATCH_RANK[left.match_class] - MATCH_RANK[right.match_class];
  if (match !== 0) return match;
  const state = STATE_RANK[left.state_class] - STATE_RANK[right.state_class];
  if (state !== 0) return state;
  const occurred = (right.occurred_at ?? "").localeCompare(left.occurred_at ?? "");
  if (occurred !== 0) return occurred;
  return left.candidate_key.localeCompare(right.candidate_key);
};

const mergeEvidence = (left: string[], right: string[]): string[] =>
  [...new Set([...left, ...right])].sort();

/**
 * Host-neutral resolver kernel. It only merges complete candidate paths and
 * applies categorical ordering; it never interprets Nurture ids or policy.
 */
export const resolveCandidates = (
  sourceCandidates: readonly (readonly ResolutionCandidate[])[],
  limits: { aggregate_candidate_limit: number; rendered_option_limit: number } = {
    aggregate_candidate_limit: 40,
    rendered_option_limit: 8,
  },
): ResolutionKernelResult => {
  if (
    !Number.isSafeInteger(limits.aggregate_candidate_limit) ||
    limits.aggregate_candidate_limit < 1 ||
    !Number.isSafeInteger(limits.rendered_option_limit) ||
    limits.rendered_option_limit < 1 ||
    limits.rendered_option_limit > limits.aggregate_candidate_limit
  ) {
    throw new Error("invalid resolution candidate limits");
  }

  const deduped = new Map<string, ResolutionCandidate>();
  for (const source of sourceCandidates) {
    for (const candidate of source) {
      if (!isResolutionCandidate(candidate)) {
        throw new Error("resolution candidate is incomplete");
      }
      const existing = deduped.get(candidate.dedupe_key);
      if (!existing || compareCandidates(candidate, existing) < 0) {
        deduped.set(candidate.dedupe_key, {
          ...candidate,
          evidence_codes: mergeEvidence(existing?.evidence_codes ?? [], candidate.evidence_codes),
        });
      } else {
        deduped.set(candidate.dedupe_key, {
          ...existing,
          evidence_codes: mergeEvidence(existing.evidence_codes, candidate.evidence_codes),
        });
      }
    }
  }

  const ordered = [...deduped.values()].sort(compareCandidates);
  if (ordered.length === 0) return { status: "blocked", reason_code: "no_reachable_context" };
  if (ordered.length > limits.aggregate_candidate_limit) {
    return {
      status: "needs_clarification",
      reason_code: "candidate_limit_exceeded",
      candidates: [],
      total_candidate_count: ordered.length,
    };
  }

  const best = ordered[0]!;
  const tied = ordered.filter((candidate) => semanticRank(candidate) === semanticRank(best));
  if (best.match_class === "weak_recent_context") {
    return {
      status: "needs_clarification",
      reason_code: "weak_context",
      candidates: tied.length <= limits.rendered_option_limit ? tied : [],
      total_candidate_count: tied.length,
    };
  }
  if (tied.length === 1) return { status: "resolved", candidate: best };
  if (tied.length > limits.rendered_option_limit) {
    return {
      status: "needs_clarification",
      reason_code: "candidate_limit_exceeded",
      candidates: [],
      total_candidate_count: tied.length,
    };
  }
  return {
    status: "needs_clarification",
    reason_code: "ambiguous_context",
    candidates: tied,
    total_candidate_count: tied.length,
  };
};
