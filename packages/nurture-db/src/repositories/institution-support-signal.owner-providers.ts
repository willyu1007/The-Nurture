import { createHmac } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { NurtureExactOwnerSupportSignalSourceReader } from "@the-nurture/scenario";
import {
  type NurtureAttendanceSubmissionOwnerFactV1,
  type NurtureAttendanceSubmissionSignalOwner,
  type NurtureAuthoritySourceBlockerOwnerFactV1,
  type NurtureAuthoritySourceBlockerSignalOwner,
  type NurtureBusinessResponseOwnerFactV1,
  type NurtureBusinessResponseSignalOwner,
  type NurtureConfiguredLoadOwnerFactV1,
  type NurtureConfiguredLoadSignalOwner,
  type NurtureGrantAsk,
  type NurtureInstitutionSupportSignalExactOwnerRead,
  type NurtureInstitutionSupportSignalOwnerReadRequest,
  type NurtureInstitutionSupportSignalPolicyV1,
  type NurtureReviewBacklogOwnerFactV1,
  type NurtureReviewBacklogSignalOwner,
  type NurtureWorkItemWorkflowBlockerOwnerFactV1,
  type NurtureWorkItemWorkflowBlockerSignalOwner,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow } from "./board-read-support.js";
import { PrismaInstitutionBusinessCommunicationReadPort } from "./institution-business-communication.read.js";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";
import { loadInstitutionLocalDay } from "./institution-local-day.js";
import { PrismaInstitutionSupportSignalRepository } from "./institution-support-signal.repository.js";

export const PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS = {
  attendance: "attendance:class-day-closeout",
  business_response: "family-care:response",
  review_backlog: "placement:daily-review",
  authority_source_blocker: "family-care:source-lifecycle",
  work_item_workflow_blocker: "child-link-receipt:current-blocker",
  configured_load: "family-care:pending-work",
} as const;

// The provider is a consumer of the frozen wire contract. Keep this literal
// beside its checkpoint vocabulary instead of importing a runtime value from
// the scenario package's separately built `./harness` entry.
const SUPPORT_SIGNAL_CONTRACT_VERSION = "1.0.0" as const;
const MAX_EXACT_OWNER_ROWS = 100;

const REVIEW_ASK = {
  direction: "org_to_family",
  data_class: "daily_care_log",
  purpose_key: "care_coordination",
} as const satisfies NurtureGrantAsk;

const LOAD_ASK = {
  direction: "family_to_org",
  data_class: "family_care_question",
  purpose_key: "family_communication",
} as const satisfies NurtureGrantAsk;

type OwnerClass = {
  id: string;
  name: string;
  ageBandKey: string | null;
};

type OwnerScope = {
  at: Date;
  classes: OwnerClass[];
};

type LocalDay = NonNullable<Awaited<ReturnType<typeof loadInstitutionLocalDay>>>;

type OwnerSelection = {
  care_group: OwnerClass;
  policy: NurtureInstitutionSupportSignalPolicyV1;
  local_day: LocalDay;
};

type SelectionRead =
  | { status: "available"; selections: OwnerSelection[]; scope: OwnerScope }
  | { status: "unavailable" };

type BusinessRows = Awaited<
  ReturnType<PrismaInstitutionBusinessCommunicationReadPort["listInstitutionBusinessCommunications"]>
>["rows"];

const available = <T>(facts: T[]): NurtureInstitutionSupportSignalExactOwnerRead<T> => ({
  status: "available",
  facts,
});

const unavailable = <T>(): NurtureInstitutionSupportSignalExactOwnerRead<T> => ({
  status: "unavailable",
});

const localDateFromWindow = (windowKey: string): string | null => {
  const match = /^local-day:(\d{4}-\d{2}-\d{2})$/.exec(windowKey);
  return match?.[1] ?? null;
};

const sourceBase = (
  input: NurtureInstitutionSupportSignalOwnerReadRequest,
  selection: OwnerSelection,
  sourceType: string,
  opaqueSourceRef: string,
  occurredAt: string,
) => ({
  workspace_id: input.workspace_id,
  institution_ref: input.institution_ref,
  source_type: sourceType,
  opaque_source_ref: opaqueSourceRef,
  scope_ref: selection.care_group.id,
  scope_kind: "care_group" as const,
  subject_order: {
    age_band_key: selection.care_group.ageBandKey,
    name: selection.care_group.name,
  },
  checkpoint_ref: selection.policy.checkpoint_ref,
  occurred_at: occurredAt,
});

/**
 * Shared request-time owner context. Its WeakMap caches live only as long as
 * the exact request object passed to the six providers, so no authority or
 * source result survives into another request.
 */
class PrismaInstitutionSupportSignalOwnerContext {
  private readonly scopes = new WeakMap<object, Promise<OwnerScope | null>>();
  private readonly localDays = new WeakMap<object, Map<string, Promise<LocalDay | null>>>();
  private readonly communications = new WeakMap<
    object,
    Map<string, Promise<BusinessRows | null>>
  >();
  private readonly populations = new WeakMap<
    object,
    Map<string, Promise<Awaited<ReturnType<PrismaInstitutionContextRepository["loadAggregatePopulation"]>> | null>>
  >();

  private readonly communicationOwner: PrismaInstitutionBusinessCommunicationReadPort;
  private readonly institutionContext: PrismaInstitutionContextRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly integrityKey: string,
  ) {
    if (integrityKey.length < 16) {
      throw new RangeError("support-signal owner ref integrity key is too short");
    }
    this.communicationOwner = new PrismaInstitutionBusinessCommunicationReadPort(prisma);
    this.institutionContext = new PrismaInstitutionContextRepository(prisma);
  }

  private loadScope(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<OwnerScope | null> {
    const cached = this.scopes.get(input);
    if (cached) return cached;
    const loaded = (async () => {
      const at = new Date(input.snapshot_at);
      if (Number.isNaN(at.getTime())) return null;
      const [participant, role, institution, classes] = await Promise.all([
        this.prisma.nurtureParticipant.findFirst({
          where: {
            id: input.participant_ref,
            workspaceId: input.workspace_id,
            status: "active",
            deletedAt: null,
          },
          select: { id: true },
        }),
        this.prisma.nurtureCareRoleAssignment.findFirst({
          where: {
            id: input.role_assignment_ref,
            workspaceId: input.workspace_id,
            participantId: input.participant_ref,
            role: "institution_admin",
            scopeType: "institution",
            scopeId: input.institution_ref,
            ...activeRoleWindow(at),
          },
          select: { id: true },
        }),
        this.prisma.nurtureCareInstitution.findFirst({
          where: {
            id: input.institution_ref,
            workspaceId: input.workspace_id,
            status: "active",
            deletedAt: null,
          },
          select: { id: true },
        }),
        this.prisma.nurtureCareGroup.findMany({
          where: {
            workspaceId: input.workspace_id,
            institutionId: input.institution_ref,
            status: "active",
            deletedAt: null,
          },
          select: { id: true, name: true, ageBandKey: true },
          orderBy: { id: "asc" },
          take: MAX_EXACT_OWNER_ROWS + 1,
        }),
      ]);
      return participant && role && institution && classes.length <= MAX_EXACT_OWNER_ROWS
        ? { at, classes }
        : null;
    })();
    this.scopes.set(input, loaded);
    return loaded;
  }

  private loadLocalDay(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    localDate: string,
    at: Date,
  ): Promise<LocalDay | null> {
    let cache = this.localDays.get(input);
    if (!cache) {
      cache = new Map();
      this.localDays.set(input, cache);
    }
    const cached = cache.get(localDate);
    if (cached) return cached;
    const loaded = loadInstitutionLocalDay(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: input.institution_ref,
      local_date: localDate,
      at,
    });
    cache.set(localDate, loaded);
    return loaded;
  }

  async select(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    category: NurtureInstitutionSupportSignalPolicyV1["category"],
    checkpointRef: string,
  ): Promise<SelectionRead> {
    const scope = await this.loadScope(input);
    if (!scope) return { status: "unavailable" };
    const policies = input.policies.filter((policy) => policy.category === category);
    if (
      policies.some(
        (policy) =>
          policy.workspace_id !== input.workspace_id ||
          policy.institution_ref !== input.institution_ref,
      )
    ) {
      return { status: "unavailable" };
    }

    const selections: OwnerSelection[] = [];
    for (const careGroup of scope.classes) {
      const classPolicies = policies.filter(
        (policy) => policy.care_group_ref === careGroup.id,
      );
      const candidates =
        classPolicies.length > 0
          ? classPolicies
          : policies.filter((policy) => policy.care_group_ref === undefined);
      if (candidates.length === 0) continue;
      if (candidates.length !== 1) return { status: "unavailable" };
      const policy = candidates[0]!;
      if (!policy.enabled) continue;
      const localDate = localDateFromWindow(policy.window_key);
      if (
        policy.contract_version !== SUPPORT_SIGNAL_CONTRACT_VERSION ||
        policy.checkpoint_ref !== checkpointRef ||
        !localDate
      ) {
        return { status: "unavailable" };
      }
      const localDay = await this.loadLocalDay(input, localDate, scope.at);
      if (!localDay) return { status: "unavailable" };
      selections.push({ care_group: careGroup, policy, local_day: localDay });
    }
    return { status: "available", selections, scope };
  }

  async loadBusinessRows(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    selection: OwnerSelection,
  ): Promise<BusinessRows | null> {
    let cache = this.communications.get(input);
    if (!cache) {
      cache = new Map();
      this.communications.set(input, cache);
    }
    const key = `${selection.care_group.id}\0${selection.local_day.occurred_from}\0${selection.local_day.occurred_before}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const loaded = (async () => {
      const candidateCount = await this.prisma.nurtureFamilyCareMessage.count({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: selection.care_group.id,
          writerContract: "harness_g2_v1",
          status: { in: ["sent", "redacted"] },
          createdAt: {
            gte: new Date(selection.local_day.occurred_from),
            lt: new Date(selection.local_day.occurred_before),
            lte: new Date(input.snapshot_at),
          },
        },
      });
      if (candidateCount > MAX_EXACT_OWNER_ROWS) return null;
      const page = await this.communicationOwner.listInstitutionBusinessCommunications({
        workspace_id: input.workspace_id,
        participant_id: input.participant_ref,
        care_group_id: selection.care_group.id,
        occurred_from: selection.local_day.occurred_from,
        occurred_before: selection.local_day.occurred_before,
        snapshot_at: input.snapshot_at,
        limit: MAX_EXACT_OWNER_ROWS,
      });
      return page.has_more ? null : page.rows;
    })();
    cache.set(key, loaded);
    return loaded;
  }

  async loadPopulation(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    selection: OwnerSelection,
  ) {
    let cache = this.populations.get(input);
    if (!cache) {
      cache = new Map();
      this.populations.set(input, cache);
    }
    const cached = cache.get(selection.care_group.id);
    if (cached) return cached;
    const loaded = (async () => {
      const count = await this.prisma.nurtureEnrollment.count({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          careGroupId: selection.care_group.id,
          status: "active",
          deletedAt: null,
        },
      });
      if (count > MAX_EXACT_OWNER_ROWS) return null;
      const population = await this.institutionContext.loadAggregatePopulation({
        workspace_id: input.workspace_id,
        institution_ref: input.institution_ref,
        care_group_ref: selection.care_group.id,
        at: input.snapshot_at,
        limit: count + 1,
      });
      return population.class_state === "in_scope" && population.members.length === count
        ? population
        : null;
    })();
    cache.set(selection.care_group.id, loaded);
    return loaded;
  }

  async hasAttendanceSubmission(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    selection: OwnerSelection,
    at: Date,
  ): Promise<boolean> {
    const row = await this.prisma.nurtureDailyAttendanceSubmission.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: selection.care_group.id,
        localDate: new Date(selection.local_day.storage_date),
        createdAt: { lte: at },
        deletedAt: null,
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  issueRef(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
    kind: string,
    sourceId: string,
  ): string {
    return createHmac("sha256", this.integrityKey)
      .update(
        `nurture.institution-support-signal-source.v1\0${input.workspace_id}\0${input.participant_ref}\0${input.role_assignment_ref}\0${kind}\0${sourceId}`,
        "utf8",
      )
      .digest("base64url")
      .slice(0, 32);
  }
}

class PrismaAttendanceSubmissionSignalOwner
  implements NurtureAttendanceSubmissionSignalOwner
{
  constructor(private readonly context: PrismaInstitutionSupportSignalOwnerContext) {}

  async loadAttendanceSubmissionFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureAttendanceSubmissionOwnerFactV1>
  > {
    const read = await this.context.select(
      input,
      "attendance_submission_overdue",
      PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.attendance,
    );
    if (read.status === "unavailable") return unavailable();
    for (const selection of read.selections) {
      const submission = await this.context.hasAttendanceSubmission(
        input,
        selection,
        read.scope.at,
      );
      // A stored submission is already resolved and therefore absent from the
      // projection. For an unsubmitted day this schema has no owner checkpoint
      // instant, so claiming either overdue or not-overdue would invent one.
      if (!submission) return unavailable();
    }
    return available([]);
  }
}

class PrismaBusinessResponseSignalOwner implements NurtureBusinessResponseSignalOwner {
  constructor(private readonly context: PrismaInstitutionSupportSignalOwnerContext) {}

  async loadBusinessResponseFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureBusinessResponseOwnerFactV1>
  > {
    const read = await this.context.select(
      input,
      "business_response_overdue",
      PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.business_response,
    );
    if (read.status === "unavailable") return unavailable<NurtureBusinessResponseOwnerFactV1>();
    const facts: NurtureBusinessResponseOwnerFactV1[] = [];
    for (const selection of read.selections) {
      const rows = await this.context.loadBusinessRows(input, selection);
      if (!rows) return unavailable();
      for (const row of rows) {
        if (
          row.lifecycle !== "active" ||
          row.response_state !== "awaiting_reply" ||
          !row.due_at
        ) {
          continue;
        }
        facts.push({
          ...sourceBase(
            input,
            selection,
            "institution_business_communication",
            this.context.issueRef(input, "business-communication", row.message_id),
            row.occurred_at,
          ),
          response_state: row.response_state,
          lifecycle: row.lifecycle,
          response_deadline_at: row.due_at,
        });
      }
    }
    return available(facts);
  }
}

class PrismaReviewBacklogSignalOwner implements NurtureReviewBacklogSignalOwner {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly context: PrismaInstitutionSupportSignalOwnerContext,
  ) {}

  async loadReviewBacklogFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureReviewBacklogOwnerFactV1>
  > {
    const read = await this.context.select(
      input,
      "review_backlog_threshold",
      PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.review_backlog,
    );
    if (read.status === "unavailable") return unavailable<NurtureReviewBacklogOwnerFactV1>();
    const facts: NurtureReviewBacklogOwnerFactV1[] = [];
    for (const selection of read.selections) {
      const placements = await this.prisma.nurtureActivityPlacement.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: selection.care_group.id,
          localDate: new Date(selection.local_day.storage_date),
          sourceKind: "daily_care_log",
          state: "unplaced",
          updatedAt: { lte: read.scope.at },
        },
        select: { sourceId: true, updatedAt: true },
        take: MAX_EXACT_OWNER_ROWS + 1,
      });
      if (placements.length > MAX_EXACT_OWNER_ROWS) return unavailable();
      if (placements.length === 0) continue;
      const logs = await this.prisma.nurtureDailyCareLog.findMany({
        where: {
          id: { in: placements.map((placement) => placement.sourceId) },
          workspaceId: input.workspace_id,
          careGroupId: selection.care_group.id,
          logDate: new Date(selection.local_day.storage_date),
          status: { in: ["recorded", "shared", "corrected"] },
          deletedAt: null,
        },
        include: { grant: true },
      });
      const readableLogs = logs.filter((log) =>
        grantAllows(log.grant, REVIEW_ASK, read.scope.at, {
          institution_id: input.institution_ref,
          care_group_id: selection.care_group.id,
          enrollment_id: log.enrollmentId,
          child_care_process_id: log.childCareProcessId,
        }),
      );
      if (readableLogs.length === 0) continue;
      const population = await this.context.loadPopulation(input, selection);
      if (!population) return unavailable();
      const countByMember = new Map<string, number>();
      for (const log of readableLogs) {
        countByMember.set(
          log.childCareProcessId,
          (countByMember.get(log.childCareProcessId) ?? 0) + 1,
        );
      }
      const readableSourceIds = new Set(readableLogs.map((log) => log.id));
      const occurredAt = placements
        .filter((placement) => readableSourceIds.has(placement.sourceId))
        .map((placement) => placement.updatedAt.toISOString())
        .sort()
        .at(-1)!;
      facts.push({
        ...sourceBase(
          input,
          selection,
          "activity_review_backlog",
          this.context.issueRef(
            input,
            "activity-review-backlog",
            `${selection.care_group.id}:${selection.local_day.storage_date}`,
          ),
          occurredAt,
        ),
        condition: "open",
        aggregate: {
          members: population.members.map((member) => ({
            ...member,
            current_count: countByMember.get(member.member_ref) ?? 0,
          })),
          ask: REVIEW_ASK,
        },
      });
    }
    return available(facts);
  }
}

class PrismaAuthoritySourceBlockerSignalOwner
  implements NurtureAuthoritySourceBlockerSignalOwner
{
  constructor(private readonly context: PrismaInstitutionSupportSignalOwnerContext) {}

  async loadAuthoritySourceBlockerFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureAuthoritySourceBlockerOwnerFactV1>
  > {
    const read = await this.context.select(
      input,
      "authority_or_source_blocked",
      PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.authority_source_blocker,
    );
    if (read.status === "unavailable") {
      return unavailable<NurtureAuthoritySourceBlockerOwnerFactV1>();
    }
    if (read.selections.length === 0) return available([]);

    // The current owner schemas do not expose a readable, canonical
    // authority/source blocker fact. In particular, `source_redacted` is a
    // terminal source lifecycle whose next support-signal snapshot must omit
    // it; translating it to `blocked` would create a second blocker state.
    return unavailable<NurtureAuthoritySourceBlockerOwnerFactV1>();
  }
}

class PrismaWorkItemWorkflowBlockerSignalOwner
  implements NurtureWorkItemWorkflowBlockerSignalOwner
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly context: PrismaInstitutionSupportSignalOwnerContext,
  ) {}

  async loadWorkItemWorkflowBlockerFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureWorkItemWorkflowBlockerOwnerFactV1>
  > {
    const read = await this.context.select(
      input,
      "work_item_or_workflow_blocked",
      PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.work_item_workflow_blocker,
    );
    if (read.status === "unavailable") {
      return unavailable<NurtureWorkItemWorkflowBlockerOwnerFactV1>();
    }
    const facts: NurtureWorkItemWorkflowBlockerOwnerFactV1[] = [];
    for (const selection of read.selections) {
      const messages = await this.context.loadBusinessRows(input, selection);
      if (!messages) return unavailable();
      if (messages.length === 0) continue;
      const messageById = new Map(messages.map((message) => [message.message_id, message]));
      const receipts = await this.prisma.nurtureChildLinkReceipt.findMany({
        where: {
          workspaceId: input.workspace_id,
          sourceType: "family_care_message",
          sourceId: { in: [...messageById.keys()] },
          status: "blocked",
          driverType: { in: ["item_action", "workflow_step"] },
          createdAt: { lte: read.scope.at },
          updatedAt: { lte: read.scope.at },
          retryReceipts: { none: {} },
        },
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: MAX_EXACT_OWNER_ROWS + 1,
      });
      if (receipts.length > MAX_EXACT_OWNER_ROWS) return unavailable();
      for (const receipt of receipts) {
        const message = messageById.get(receipt.sourceId);
        if (!message || message.child_care_process_id !== receipt.childCareProcessId) continue;
        facts.push({
          ...sourceBase(
            input,
            selection,
            "child_link_receipt",
            this.context.issueRef(input, "child-link-receipt", receipt.id),
            receipt.updatedAt.toISOString(),
          ),
          // This is the receipt owner's literal canonical state. Ordinary
          // WorkItem, publish or Workflow statuses are never translated here.
          condition: "blocked",
        });
      }
    }
    return available(facts);
  }
}

class PrismaConfiguredLoadSignalOwner implements NurtureConfiguredLoadSignalOwner {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly context: PrismaInstitutionSupportSignalOwnerContext,
  ) {}

  async loadConfiguredLoadFacts(
    input: NurtureInstitutionSupportSignalOwnerReadRequest,
  ): Promise<
    NurtureInstitutionSupportSignalExactOwnerRead<NurtureConfiguredLoadOwnerFactV1>
  > {
    const read = await this.context.select(
      input,
      "configured_load_threshold",
      PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.configured_load,
    );
    if (read.status === "unavailable") return unavailable<NurtureConfiguredLoadOwnerFactV1>();
    const facts: NurtureConfiguredLoadOwnerFactV1[] = [];
    for (const selection of read.selections) {
      const items = await this.prisma.nurtureFamilyCareItem.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: selection.care_group.id,
          dataClass: "family_care_question",
          writerContract: "harness_g2_v1",
          lifecycleState: "active",
          status: { in: ["open", "acknowledged"] },
          OR: [{ requiresAck: true }, { requiresReply: true }],
          createdAt: {
            gte: new Date(selection.local_day.occurred_from),
            lt: new Date(selection.local_day.occurred_before),
            lte: read.scope.at,
          },
          updatedAt: { lte: read.scope.at },
        },
        include: { grant: true },
        take: MAX_EXACT_OWNER_ROWS + 1,
      });
      if (items.length > MAX_EXACT_OWNER_ROWS) return unavailable();
      const readableItems = items.filter((item) =>
        grantAllows(item.grant, LOAD_ASK, read.scope.at, {
          institution_id: input.institution_ref,
          care_group_id: selection.care_group.id,
          enrollment_id: item.enrollmentId,
          child_care_process_id: item.childCareProcessId,
        }),
      );
      if (readableItems.length === 0) continue;
      const population = await this.context.loadPopulation(input, selection);
      if (!population) return unavailable();
      const countByMember = new Map<string, number>();
      for (const item of readableItems) {
        countByMember.set(
          item.childCareProcessId,
          (countByMember.get(item.childCareProcessId) ?? 0) + 1,
        );
      }
      const occurredAt = readableItems
        .map((item) => item.updatedAt.toISOString())
        .sort()
        .at(-1)!;
      facts.push({
        ...sourceBase(
          input,
          selection,
          "family_care_pending_work",
          this.context.issueRef(
            input,
            "family-care-pending-work",
            `${selection.care_group.id}:${selection.local_day.storage_date}`,
          ),
          occurredAt,
        ),
        condition: "open",
        aggregate: {
          members: population.members.map((member) => ({
            ...member,
            current_count: countByMember.get(member.member_ref) ?? 0,
          })),
          ask: LOAD_ASK,
        },
      });
    }
    return available(facts);
  }
}

type GrantScope = {
  institution_id: string;
  care_group_id: string;
  enrollment_id: string | null;
  child_care_process_id: string;
};

type GrantRow = {
  status: string;
  revokedAt: Date | null;
  deletedAt: Date | null;
  effectiveFrom: Date | null;
  expiresAt: Date | null;
  childCareProcessId: string;
  enrollmentId: string | null;
  grantedToScopeType: string;
  grantedToScopeId: string;
  directions: readonly string[];
  dataClasses: readonly string[];
  purposes: readonly string[];
};

const grantAllows = (
  grant: GrantRow | null,
  ask: Required<NurtureGrantAsk>,
  at: Date,
  scope: GrantScope,
): boolean =>
  Boolean(
    grant &&
      grant.status === "active" &&
      !grant.revokedAt &&
      !grant.deletedAt &&
      (!grant.effectiveFrom || grant.effectiveFrom <= at) &&
      (!grant.expiresAt || grant.expiresAt > at) &&
      grant.childCareProcessId === scope.child_care_process_id &&
      grant.enrollmentId === scope.enrollment_id &&
      ((grant.grantedToScopeType === "care_group" &&
        grant.grantedToScopeId === scope.care_group_id) ||
        (grant.grantedToScopeType === "institution" &&
          grant.grantedToScopeId === scope.institution_id) ||
        (grant.grantedToScopeType === "enrollment" &&
          grant.grantedToScopeId === scope.enrollment_id)) &&
      grant.directions.includes(ask.direction) &&
      grant.dataClasses.includes(ask.data_class) &&
      grant.purposes.includes(ask.purpose_key),
  );

export type PrismaInstitutionSupportSignalOwnerBindings = {
  attendance: NurtureAttendanceSubmissionSignalOwner;
  business_response: NurtureBusinessResponseSignalOwner;
  review_backlog: NurtureReviewBacklogSignalOwner;
  authority_source_blocker: NurtureAuthoritySourceBlockerSignalOwner;
  work_item_workflow_blocker: NurtureWorkItemWorkflowBlockerSignalOwner;
  configured_load: NurtureConfiguredLoadSignalOwner;
};

export const createPrismaInstitutionSupportSignalOwnerBindings = (input: {
  prisma: PrismaClient;
  owner_ref_integrity_key: string;
}): PrismaInstitutionSupportSignalOwnerBindings => {
  const context = new PrismaInstitutionSupportSignalOwnerContext(
    input.prisma,
    input.owner_ref_integrity_key,
  );
  return {
    attendance: new PrismaAttendanceSubmissionSignalOwner(context),
    business_response: new PrismaBusinessResponseSignalOwner(context),
    review_backlog: new PrismaReviewBacklogSignalOwner(input.prisma, context),
    authority_source_blocker: new PrismaAuthoritySourceBlockerSignalOwner(context),
    work_item_workflow_blocker: new PrismaWorkItemWorkflowBlockerSignalOwner(
      input.prisma,
      context,
    ),
    configured_load: new PrismaConfiguredLoadSignalOwner(input.prisma, context),
  };
};

/** One production composition path: policy SSOT + all six exact-owner ports. */
export const createPrismaInstitutionSupportSignalRepository = (input: {
  prisma: PrismaClient;
  owner_ref_integrity_key: string;
}): PrismaInstitutionSupportSignalRepository =>
  new PrismaInstitutionSupportSignalRepository(
    input.prisma,
    new NurtureExactOwnerSupportSignalSourceReader(
      createPrismaInstitutionSupportSignalOwnerBindings(input),
    ),
  );
