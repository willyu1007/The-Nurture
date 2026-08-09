import type {
  NurtureInstitutionSupportSignalAggregateMember,
  NurtureInstitutionSupportSignalRepository,
  NurtureInstitutionSupportSignalSourceRequest,
  NurtureInstitutionSupportSignalSourceV1,
} from "./institution-support-signal.js";
import type { NurtureGrantAsk } from "./institution-authority-chain.js";

/**
 * The request every exact owner receives. Policies are included so an owner
 * can resolve its own checkpoint/window vocabulary; the signal layer never
 * parses a `checkpoint_ref` into a deadline or a `window_key` into a range.
 */
export type NurtureInstitutionSupportSignalOwnerReadRequest =
  NurtureInstitutionSupportSignalSourceRequest;

export type NurtureInstitutionSupportSignalExactOwnerRead<T> =
  | { status: "available"; facts: T[] }
  | { status: "unavailable" };

type ExactOwnerSource = {
  workspace_id: string;
  institution_ref: string;
  source_type: string;
  /** Actor-bound opaque ref issued by the exact owner, never a raw row id. */
  opaque_source_ref: string;
  scope_ref: string;
  scope_kind: "institution" | "care_group";
  subject_order: { age_band_key: string | null; name: string };
  checkpoint_ref: string;
  occurred_at: string;
};

export type NurtureAttendanceSubmissionOwnerFactV1 = ExactOwnerSource & {
  /** The formal 0D-1 owner state; elapsed time cannot change it. */
  submission_state: "unsubmitted" | "submitted" | "reopened";
  /** Required owner fact. The adapter has no fallback based on local date. */
  checkpoint_deadline_at: string;
};

export type NurtureBusinessResponseOwnerFactV1 = ExactOwnerSource & {
  response_state: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle: "active" | "closed" | "suppressed";
  /** Required owner fact. `updated_at` and occurrence time are not deadlines. */
  response_deadline_at: string;
};

type ExactThresholdOwnerFact = ExactOwnerSource & {
  condition: "open" | "resolved";
  aggregate: {
    members: NurtureInstitutionSupportSignalAggregateMember[];
    ask: NurtureGrantAsk;
  };
};

export type NurtureReviewBacklogOwnerFactV1 = ExactThresholdOwnerFact;

export type NurtureAuthoritySourceBlockerOwnerFactV1 = ExactOwnerSource & {
  /** Canonical owner condition. The adapter does not derive this from status. */
  condition: "open" | "blocked" | "resolved";
  deadline_at?: string;
};

export type NurtureWorkItemWorkflowBlockerOwnerFactV1 = ExactOwnerSource & {
  /** Canonical WorkItem/Workflow condition, not a signal-local state. */
  condition: "open" | "blocked" | "resolved";
  deadline_at?: string;
};

export type NurtureConfiguredLoadOwnerFactV1 = ExactThresholdOwnerFact;

export type NurtureAttendanceSubmissionSignalOwner = {
  loadAttendanceSubmissionFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureAttendanceSubmissionOwnerFactV1>
  >;
};

export type NurtureBusinessResponseSignalOwner = {
  loadBusinessResponseFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureBusinessResponseOwnerFactV1>
  >;
};

export type NurtureReviewBacklogSignalOwner = {
  loadReviewBacklogFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureReviewBacklogOwnerFactV1>
  >;
};

export type NurtureAuthoritySourceBlockerSignalOwner = {
  loadAuthoritySourceBlockerFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureAuthoritySourceBlockerOwnerFactV1>
  >;
};

export type NurtureWorkItemWorkflowBlockerSignalOwner = {
  loadWorkItemWorkflowBlockerFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureWorkItemWorkflowBlockerOwnerFactV1>
  >;
};

export type NurtureConfiguredLoadSignalOwner = {
  loadConfiguredLoadFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureConfiguredLoadOwnerFactV1>
  >;
};

type SourceAdapter = {
  category: NurtureInstitutionSupportSignalSourceV1["category"];
  loadAuthorizedSources(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<{
    status: "available" | "unavailable";
    sources: NurtureInstitutionSupportSignalSourceV1[];
  }>;
};

const sourceBase = (
  fact: ExactOwnerSource,
): Omit<NurtureInstitutionSupportSignalSourceV1, "category" | "condition"> => ({
  workspace_id: fact.workspace_id,
  institution_ref: fact.institution_ref,
  source_type: fact.source_type,
  source_ref: fact.opaque_source_ref,
  scope_ref: fact.scope_ref,
  scope_kind: fact.scope_kind,
  subject_order: fact.subject_order,
  checkpoint_ref: fact.checkpoint_ref,
  occurred_at: fact.occurred_at,
  readable: true,
});

const unavailable = (): Awaited<ReturnType<SourceAdapter["loadAuthorizedSources"]>> => ({
  status: "unavailable",
  sources: [],
});

/** Maps only the formal submission state and the owner's checkpoint instant. */
export class NurtureAttendanceSubmissionSignalSourceAdapter implements SourceAdapter {
  readonly category = "attendance_submission_overdue" as const;

  constructor(private readonly owner: NurtureAttendanceSubmissionSignalOwner) {}

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    const read = await this.owner.loadAttendanceSubmissionFacts(input);
    if (read.status === "unavailable") return unavailable();
    return {
      status: "available" as const,
      sources: read.facts.map((fact) => ({
        ...sourceBase(fact),
        category: "attendance_submission_overdue" as const,
        condition: fact.submission_state === "unsubmitted" ? "open" as const : "resolved" as const,
        deadline_at: fact.checkpoint_deadline_at,
      })),
    };
  }
}

/** Maps the communication owner's response/lifecycle/deadline facts unchanged. */
export class NurtureBusinessResponseSignalSourceAdapter implements SourceAdapter {
  readonly category = "business_response_overdue" as const;

  constructor(private readonly owner: NurtureBusinessResponseSignalOwner) {}

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    const read = await this.owner.loadBusinessResponseFacts(input);
    if (read.status === "unavailable") return unavailable();
    return {
      status: "available" as const,
      sources: read.facts.map((fact) => ({
        ...sourceBase(fact),
        category: "business_response_overdue" as const,
        condition:
          fact.lifecycle === "active" && fact.response_state === "awaiting_reply"
            ? "open" as const
            : "resolved" as const,
        deadline_at: fact.response_deadline_at,
      })),
    };
  }
}

/** The backlog owner supplies both current state and the full-coverage aggregate. */
export class NurtureReviewBacklogSignalSourceAdapter implements SourceAdapter {
  readonly category = "review_backlog_threshold" as const;

  constructor(private readonly owner: NurtureReviewBacklogSignalOwner) {}

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    const read = await this.owner.loadReviewBacklogFacts(input);
    if (read.status === "unavailable") return unavailable();
    return {
      status: "available" as const,
      sources: read.facts.map((fact) => ({
        ...sourceBase(fact),
        category: "review_backlog_threshold" as const,
        condition: fact.condition,
        aggregate: fact.aggregate,
      })),
    };
  }
}

/** No status-to-blocker translation exists here: the owner supplies condition. */
export class NurtureAuthoritySourceBlockedSignalSourceAdapter implements SourceAdapter {
  readonly category = "authority_or_source_blocked" as const;

  constructor(private readonly owner: NurtureAuthoritySourceBlockerSignalOwner) {}

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    const read = await this.owner.loadAuthoritySourceBlockerFacts(input);
    if (read.status === "unavailable") return unavailable();
    return {
      status: "available" as const,
      sources: read.facts.map((fact) => ({
        ...sourceBase(fact),
        category: "authority_or_source_blocked" as const,
        condition: fact.condition,
        ...(fact.deadline_at ? { deadline_at: fact.deadline_at } : {}),
      })),
    };
  }
}

/** WorkItem/Workflow owns its blocker; this adapter only changes projection shape. */
export class NurtureWorkItemWorkflowBlockedSignalSourceAdapter implements SourceAdapter {
  readonly category = "work_item_or_workflow_blocked" as const;

  constructor(private readonly owner: NurtureWorkItemWorkflowBlockerSignalOwner) {}

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    const read = await this.owner.loadWorkItemWorkflowBlockerFacts(input);
    if (read.status === "unavailable") return unavailable();
    return {
      status: "available" as const,
      sources: read.facts.map((fact) => ({
        ...sourceBase(fact),
        category: "work_item_or_workflow_blocked" as const,
        condition: fact.condition,
        ...(fact.deadline_at ? { deadline_at: fact.deadline_at } : {}),
      })),
    };
  }
}

/** The configured-load owner supplies current counts per authorized member. */
export class NurtureConfiguredLoadSignalSourceAdapter implements SourceAdapter {
  readonly category = "configured_load_threshold" as const;

  constructor(private readonly owner: NurtureConfiguredLoadSignalOwner) {}

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    const read = await this.owner.loadConfiguredLoadFacts(input);
    if (read.status === "unavailable") return unavailable();
    return {
      status: "available" as const,
      sources: read.facts.map((fact) => ({
        ...sourceBase(fact),
        category: "configured_load_threshold" as const,
        condition: fact.condition,
        aggregate: fact.aggregate,
      })),
    };
  }
}

/**
 * One reader for the six deterministic categories. Any deterministic owner
 * outage makes the projection unavailable; no cached or partial list is
 * presented as complete. AI remains outside this reader and cannot affect it.
 */
export class NurtureExactOwnerSupportSignalSourceReader
  implements Pick<NurtureInstitutionSupportSignalRepository, "loadAuthorizedSources">
{
  private readonly adapters: readonly SourceAdapter[];

  constructor(input: {
    attendance: NurtureAttendanceSubmissionSignalOwner;
    business_response: NurtureBusinessResponseSignalOwner;
    review_backlog: NurtureReviewBacklogSignalOwner;
    authority_source_blocker: NurtureAuthoritySourceBlockerSignalOwner;
    work_item_workflow_blocker: NurtureWorkItemWorkflowBlockerSignalOwner;
    configured_load: NurtureConfiguredLoadSignalOwner;
  }) {
    this.adapters = [
      new NurtureAttendanceSubmissionSignalSourceAdapter(input.attendance),
      new NurtureBusinessResponseSignalSourceAdapter(input.business_response),
      new NurtureReviewBacklogSignalSourceAdapter(input.review_backlog),
      new NurtureAuthoritySourceBlockedSignalSourceAdapter(input.authority_source_blocker),
      new NurtureWorkItemWorkflowBlockedSignalSourceAdapter(input.work_item_workflow_blocker),
      new NurtureConfiguredLoadSignalSourceAdapter(input.configured_load),
    ];
  }

  async loadAuthorizedSources(input: NurtureInstitutionSupportSignalOwnerReadRequest) {
    try {
      // An absent or wholly disabled category has no owner read to perform.
      // Calling an unavailable owner anyway would turn the frozen
      // "unconfigured means disabled" rule into a cross-category outage.
      const enabledCategories = new Set(
        input.policies.filter((policy) => policy.enabled).map((policy) => policy.category),
      );
      const reads = await Promise.all(
        this.adapters
          .filter((adapter) => enabledCategories.has(adapter.category))
          .map((adapter) => adapter.loadAuthorizedSources(input)),
      );
      if (reads.some((read) => read.status === "unavailable")) return unavailable();
      return {
        status: "available" as const,
        sources: reads.flatMap((read) => read.sources),
      };
    } catch {
      return unavailable();
    }
  }
}
