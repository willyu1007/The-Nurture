import type { PrismaClient } from "@prisma/client";
import {
  DAILY_ATTENDANCE_CLOSEOUT_CHECKPOINT_REF,
  NurtureExactOwnerSupportSignalSourceReader,
} from "@the-nurture/scenario";
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
  type NurtureReviewBacklogOwnerFactV1,
  type NurtureReviewBacklogSignalOwner,
  type NurtureWorkItemWorkflowBlockerOwnerFactV1,
  type NurtureWorkItemWorkflowBlockerSignalOwner,
} from "@the-nurture/scenario/harness";
import {
  MAX_EXACT_OWNER_ROWS,
  type OwnerSelection,
  PrismaInstitutionSupportSignalOwnerContext,
} from "./institution-support-signal.owner-context.js";
import { PrismaInstitutionSupportSignalRepository } from "./institution-support-signal.repository.js";

export const PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS = {
  attendance: DAILY_ATTENDANCE_CLOSEOUT_CHECKPOINT_REF,
  business_response: "family-care:response",
  review_backlog: "placement:daily-review",
  authority_source_blocker: "family-care:source-lifecycle",
  work_item_workflow_blocker: "child-link-receipt:current-blocker",
  configured_load: "family-care:pending-work",
} as const;

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

const available = <T>(facts: T[]): NurtureInstitutionSupportSignalExactOwnerRead<T> => ({
  status: "available",
  facts,
});

const unavailable = <T>(): NurtureInstitutionSupportSignalExactOwnerRead<T> => ({
  status: "unavailable",
});

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
    const facts: NurtureAttendanceSubmissionOwnerFactV1[] = [];
    for (const selection of read.selections) {
      const submission = await this.context.hasAttendanceSubmission(
        input,
        selection,
        read.scope.at,
      );
      if (submission) continue;
      const checkpoint = await this.context.loadAttendanceCheckpoint(
        input,
        selection,
        read.scope.at,
      );
      if (!checkpoint) return unavailable();
      facts.push({
        ...sourceBase(
          input,
          selection,
          "daily_attendance_closeout",
          this.context.issueRef(
            input,
            "daily-attendance-closeout",
            `${selection.care_group.id}:${selection.local_day.storage_date}:${checkpoint.policy_revision}`,
          ),
          checkpoint.checkpoint_at,
        ),
        submission_state: "unsubmitted",
        checkpoint_deadline_at: checkpoint.checkpoint_at,
      });
    }
    return available(facts);
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
        if (
          !message ||
          message.child_care_process_id !== receipt.childCareProcessId ||
          message.direction !== receipt.direction ||
          message.data_class !== receipt.dataClass
        ) {
          continue;
        }
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
      const businessRows = await this.context.loadBusinessRows(input, selection);
      if (!businessRows) return unavailable();
      const authorizedMessageIds = businessRows
        .filter((row) => row.data_class === "family_care_question")
        .map((row) => row.message_id);
      if (authorizedMessageIds.length === 0) continue;
      const items = await this.prisma.nurtureFamilyCareItem.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: selection.care_group.id,
          sourceMessageId: { in: authorizedMessageIds },
          dataClass: "family_care_question",
          writerContract: "harness_g2_v1",
          lifecycleState: "active",
          OR: [
            { requiresAck: true, acknowledgementState: "pending" },
            { requiresReply: true, responseState: "awaiting_reply" },
          ],
          createdAt: {
            gte: new Date(selection.local_day.occurred_from),
            lt: new Date(selection.local_day.occurred_before),
            lte: read.scope.at,
          },
          updatedAt: { lte: read.scope.at },
        },
        take: MAX_EXACT_OWNER_ROWS + 1,
      });
      if (items.length > MAX_EXACT_OWNER_ROWS) return unavailable();
      if (items.length === 0) continue;
      const population = await this.context.loadPopulation(input, selection);
      if (!population) return unavailable();
      const countByMember = new Map<string, number>();
      for (const item of items) {
        countByMember.set(
          item.childCareProcessId,
          (countByMember.get(item.childCareProcessId) ?? 0) + 1,
        );
      }
      const occurredAt = items
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
