import { createHmac } from "node:crypto";
import type { ProtectedContentEnvelopeV1, ProtectedContentWritePort } from "./protected-content.js";
import { issueCareItemTargetRef } from "./family-care-item-actions.js";

/**
 * G2 query lane (09-capability-query-contract.md): role-safe read-only
 * projections over the three-axis facts. Queries never write, never create a
 * CommandExecution, and never return raw ids, internal content refs, grants
 * or another Institution's existence.
 */
export const QUERY_GUARDIAN_FAMILY_CARE_TIMELINE_CAPABILITY = {
  key: "query_guardian_family_care_timeline",
  version: "1.0.0",
} as const;

export const QUERY_CAREGIVER_FAMILY_CARE_WORK_CAPABILITY = {
  key: "query_caregiver_family_care_work",
  version: "1.0.0",
} as const;

export const QUERY_FAMILY_CARE_ITEM_CAPABILITY = {
  key: "query_family_care_item",
  version: "1.0.0",
} as const;

const CURSOR_TTL_MS = 10 * 60_000;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

// Display-only opaque ref: stable per (workspace, kind, id) for client-side
// identity diffing, irreversible and never accepted back as a locator.
export const issueDisplayRef = (
  integrityKey: string,
  scope: { workspace_id: string },
  kind: string,
  id: string,
): string =>
  createHmac("sha256", integrityKey)
    .update(`nurture.display-ref.v1\0${scope.workspace_id}\0${kind}\0${id}`, "utf8")
    .digest("hex")
    .slice(0, 32);

export type FamilyCareQueryCursorV1 = {
  query: "guardian_timeline" | "caregiver_work";
  before_occurred_at: string;
  before_id: string;
  issued_at: string;
};

export const issueQueryCursor = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  cursor: Omit<FamilyCareQueryCursorV1, "issued_at">,
  now: () => Date = () => new Date(),
): string => {
  const payload = Buffer.from(
    JSON.stringify({ ...cursor, issued_at: now().toISOString() }),
    "utf8",
  ).toString("base64url");
  const tag = createHmac("sha256", integrityKey)
    .update(`nurture.query-cursor.v1\0${scope.workspace_id}\0${scope.participant_id}\0${payload}`, "utf8")
    .digest("hex")
    .slice(0, 32);
  return `${payload}.${tag}`;
};

export const resolveQueryCursor = (
  integrityKey: string,
  scope: { workspace_id: string; participant_id: string },
  expectedQuery: FamilyCareQueryCursorV1["query"],
  token: string,
  now: () => Date = () => new Date(),
): FamilyCareQueryCursorV1 | null => {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, tag] = parts as [string, string];
  const expectedTag = createHmac("sha256", integrityKey)
    .update(`nurture.query-cursor.v1\0${scope.workspace_id}\0${scope.participant_id}\0${payload}`, "utf8")
    .digest("hex")
    .slice(0, 32);
  if (tag !== expectedTag) return null;
  let cursor: FamilyCareQueryCursorV1;
  try {
    cursor = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    cursor.query !== expectedQuery ||
    typeof cursor.before_occurred_at !== "string" ||
    typeof cursor.before_id !== "string" ||
    typeof cursor.issued_at !== "string" ||
    new Date(cursor.issued_at).getTime() + CURSOR_TTL_MS <= now().getTime()
  ) {
    return null;
  }
  return cursor;
};

// ---------------------------------------------------------------------------
// Raw read-port rows (server-internal; never leave the presenter).

export type RawTimelineMessageRow = {
  message_id: string;
  item_id: string;
  enrollment_id: string;
  message_kind: "family_message" | "caregiver_reply";
  redacted: boolean;
  occurred_at: string;
  body_envelope?: unknown;
  source_label: string;
  acknowledgement_state: "pending" | "acknowledged";
  response_state: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle_state: "active" | "closed" | "suppressed";
  receipt?: { receipt_id: string; direction: "family_to_org" | "org_to_family"; logical_status: string; occurred_at: string };
  continuation_source_item_id?: string;
  continuation_source_readable?: boolean;
};

export type RawWorkItemRow = {
  item_id: string;
  child_safe_label: string;
  source_safe_summary: string;
  acknowledgement_state: "pending" | "acknowledged";
  response_state: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle_state: "active" | "closed" | "suppressed";
  attention_state: "active" | "resolved" | "suppressed";
  created_at: string;
  last_activity_at: string;
};

export type RawItemDetail = {
  projection_role: "guardian" | "caregiver";
  item_id: string;
  enrollment_id: string;
  source_label: string;
  direction: "family_to_org";
  acknowledgement_state: "pending" | "acknowledged";
  response_state: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle_state: "active" | "closed" | "suppressed";
  reply_count: number;
  content_readable: boolean;
  messages: Array<{
    message_id: string;
    message_kind: "family_message" | "caregiver_reply";
    redacted: boolean;
    occurred_at: string;
    body_envelope?: unknown;
  }>;
  receipts: Array<{
    receipt_id: string;
    direction: "family_to_org" | "org_to_family";
    logical_status: string;
    occurred_at: string;
  }>;
  attention_state?: "active" | "resolved" | "suppressed";
  continuation_source_item_id?: string;
  continuation_source_readable?: boolean;
};

export type FamilyCareQueryReadPort = {
  listGuardianTimeline(input: {
    workspace_id: string;
    participant_id: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{ authorized: boolean; rows: RawTimelineMessageRow[] }>;
  listCaregiverWork(input: {
    workspace_id: string;
    participant_id: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{ authorized: boolean; rows: RawWorkItemRow[] }>;
  loadItemDetail(input: {
    workspace_id: string;
    participant_id: string;
    item_id: string;
  }): Promise<{ authorized: boolean; detail?: RawItemDetail }>;
};

// ---------------------------------------------------------------------------
// Role-safe wire shapes (09-capability-query-contract.md).

export type SnapshotPageInfoV1 = { nextCursor?: string; hasMore: boolean };

export type RoleSafeFamilyCareStateV1 = {
  acknowledgementState: "pending" | "acknowledged";
  responseState: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle: "active" | "closed" | "suppressed";
};

export type GuardianFamilyCareTimelineItemV1 = {
  kind: "source_question" | "caregiver_reply" | "redaction_tombstone";
  itemRef: string;
  careItemRef: string;
  enrollmentRef: string;
  sourceLabel: string;
  occurredAt: string;
  content?: { body: string };
  state: RoleSafeFamilyCareStateV1;
  receipt?: {
    receiptRef: string;
    direction: "family_to_org" | "org_to_family";
    logicalStatus: string;
    occurredAt: string;
  };
  contextContinuation?: { sourceItemRef: string; label: string };
};

export type GuardianFamilyCareTimelineOutputV1 = {
  items: GuardianFamilyCareTimelineItemV1[];
  pageInfo: SnapshotPageInfoV1;
};

export type CapabilityActionRefV1 = {
  capabilityKey: string;
  capabilityVersion: string;
  targetOptionRef: string;
  availability: "available" | "already_satisfied";
};

export type CaregiverFamilyCareWorkItemV1 = {
  careItemRef: string;
  childSafeLabel: string;
  sourceSafeSummary: string;
  acknowledgementState: "pending" | "acknowledged";
  responseState: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle: "active" | "closed" | "suppressed";
  attentionState: "active" | "resolved" | "suppressed";
  createdAt: string;
  lastActivityAt: string;
  actions: CapabilityActionRefV1[];
};

export type CaregiverFamilyCareWorkOutputV1 = {
  items: CaregiverFamilyCareWorkItemV1[];
  pageInfo: SnapshotPageInfoV1;
};

export type FamilyCareItemDetailOutputV1 = {
  projectionRole: "guardian" | "caregiver";
  careItemRef: string;
  provenance: { enrollmentRef: string; sourceLabel: string; direction: "family_to_org" };
  progress: RoleSafeFamilyCareStateV1 & { replyCount: number };
  messages: Array<{
    kind: "source_question" | "caregiver_reply" | "redaction_tombstone";
    messageRef: string;
    authoredAs: "family" | "care_group";
    occurredAt: string;
    content?: { body: string };
  }>;
  receipts: Array<{
    receiptRef: string;
    direction: "family_to_org" | "org_to_family";
    logicalStatus: string;
    occurredAt: string;
  }>;
  attention?: { state: "active" | "resolved" | "suppressed" };
  contextContinuation?: { sourceItemRef: string; label: string };
  actions: CapabilityActionRefV1[];
};

export type FamilyCareQueryDecision<Output> =
  | { status: "ok"; output: Output }
  | { status: "refresh_required" }
  | { status: "denied"; reason_code: string };

export type FamilyCareQueryDependencies = {
  reads: FamilyCareQueryReadPort;
  protected_content: Pick<ProtectedContentWritePort, "unseal">;
  integrity_key: string;
  now?: () => Date;
};

const unsealOrTombstone = (
  deps: FamilyCareQueryDependencies,
  envelope: unknown,
): { body: string } | undefined => {
  if (!envelope) return undefined;
  try {
    return { body: deps.protected_content.unseal(envelope as ProtectedContentEnvelopeV1) };
  } catch {
    return undefined;
  }
};

const parsePage = (
  value: unknown,
): { take: number } | null => {
  if (value === undefined) return { take: DEFAULT_PAGE_SIZE };
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > MAX_PAGE_SIZE) {
    return null;
  }
  return { take: value };
};

const timelineKind = (
  row: Pick<RawTimelineMessageRow, "message_kind" | "redacted">,
): GuardianFamilyCareTimelineItemV1["kind"] =>
  row.redacted
    ? "redaction_tombstone"
    : row.message_kind === "family_message"
      ? "source_question"
      : "caregiver_reply";

export const queryGuardianFamilyCareTimeline = async (
  deps: FamilyCareQueryDependencies,
  request: {
    workspace_id: string;
    participant_id: string;
    page_size?: unknown;
    cursor?: string;
  },
): Promise<FamilyCareQueryDecision<GuardianFamilyCareTimelineOutputV1>> => {
  const page = parsePage(request.page_size);
  if (!page) return { status: "denied", reason_code: "invalid_query_input" };
  let before: { occurred_at: string; id: string } | undefined;
  if (request.cursor !== undefined) {
    const cursor = resolveQueryCursor(
      deps.integrity_key,
      request,
      "guardian_timeline",
      request.cursor,
      deps.now,
    );
    if (!cursor) return { status: "refresh_required" };
    before = { occurred_at: cursor.before_occurred_at, id: cursor.before_id };
  }
  const result = await deps.reads.listGuardianTimeline({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    take: page.take + 1,
    ...(before ? { before } : {}),
  });
  if (!result.authorized) return { status: "denied", reason_code: "not_authorized" };
  const rows = result.rows.slice(0, page.take);
  const hasMore = result.rows.length > page.take;
  const last = rows[rows.length - 1];
  return {
    status: "ok",
    output: {
      items: rows.map((row) => ({
        kind: timelineKind(row),
        itemRef: issueDisplayRef(deps.integrity_key, request, "timeline_entry", row.message_id),
        careItemRef: issueCareItemTargetRef(deps.integrity_key, {
          workspace_id: request.workspace_id,
          participant_id: request.participant_id,
          item_id: row.item_id,
        }),
        enrollmentRef: issueDisplayRef(deps.integrity_key, request, "enrollment", row.enrollment_id),
        sourceLabel: row.source_label,
        occurredAt: row.occurred_at,
        ...(row.redacted
          ? {}
          : (() => {
              const content = unsealOrTombstone(deps, row.body_envelope);
              return content ? { content } : {};
            })()),
        state: {
          acknowledgementState: row.acknowledgement_state,
          responseState: row.response_state,
          lifecycle: row.lifecycle_state,
        },
        ...(row.receipt
          ? {
              receipt: {
                receiptRef: issueDisplayRef(deps.integrity_key, request, "receipt", row.receipt.receipt_id),
                direction: row.receipt.direction,
                logicalStatus: row.receipt.logical_status,
                occurredAt: row.receipt.occurred_at,
              },
            }
          : {}),
        ...(row.continuation_source_item_id && row.continuation_source_readable
          ? {
              contextContinuation: {
                sourceItemRef: issueCareItemTargetRef(deps.integrity_key, {
                  workspace_id: request.workspace_id,
                  participant_id: request.participant_id,
                  item_id: row.continuation_source_item_id,
                }),
                label: "continues_previous_item",
              },
            }
          : {}),
      })),
      pageInfo: {
        hasMore,
        ...(hasMore && last
          ? {
              nextCursor: issueQueryCursor(
                deps.integrity_key,
                request,
                {
                  query: "guardian_timeline",
                  before_occurred_at: last.occurred_at,
                  before_id: last.message_id,
                },
                deps.now,
              ),
            }
          : {}),
      },
    },
  };
};

export const queryCaregiverFamilyCareWork = async (
  deps: FamilyCareQueryDependencies,
  request: {
    workspace_id: string;
    participant_id: string;
    page_size?: unknown;
    cursor?: string;
  },
): Promise<FamilyCareQueryDecision<CaregiverFamilyCareWorkOutputV1>> => {
  const page = parsePage(request.page_size);
  if (!page) return { status: "denied", reason_code: "invalid_query_input" };
  let before: { occurred_at: string; id: string } | undefined;
  if (request.cursor !== undefined) {
    const cursor = resolveQueryCursor(
      deps.integrity_key,
      request,
      "caregiver_work",
      request.cursor,
      deps.now,
    );
    if (!cursor) return { status: "refresh_required" };
    before = { occurred_at: cursor.before_occurred_at, id: cursor.before_id };
  }
  const result = await deps.reads.listCaregiverWork({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    take: page.take + 1,
    ...(before ? { before } : {}),
  });
  if (!result.authorized) return { status: "denied", reason_code: "not_authorized" };
  const rows = result.rows.slice(0, page.take);
  const hasMore = result.rows.length > page.take;
  const last = rows[rows.length - 1];
  return {
    status: "ok",
    output: {
      items: rows.map((row) => ({
        careItemRef: issueCareItemTargetRef(deps.integrity_key, {
          workspace_id: request.workspace_id,
          participant_id: request.participant_id,
          item_id: row.item_id,
        }),
        childSafeLabel: row.child_safe_label,
        sourceSafeSummary: row.source_safe_summary,
        acknowledgementState: row.acknowledgement_state,
        responseState: row.response_state,
        lifecycle: row.lifecycle_state,
        attentionState: row.attention_state,
        createdAt: row.created_at,
        lastActivityAt: row.last_activity_at,
        actions: caregiverActions(deps, request, row),
      })),
      pageInfo: {
        hasMore,
        ...(hasMore && last
          ? {
              nextCursor: issueQueryCursor(
                deps.integrity_key,
                request,
                {
                  query: "caregiver_work",
                  before_occurred_at: last.created_at,
                  before_id: last.item_id,
                },
                deps.now,
              ),
            }
          : {}),
      },
    },
  };
};

const caregiverActions = (
  deps: FamilyCareQueryDependencies,
  scope: { workspace_id: string; participant_id: string },
  row: Pick<RawWorkItemRow, "item_id" | "acknowledgement_state" | "lifecycle_state">,
): CapabilityActionRefV1[] => {
  if (row.lifecycle_state !== "active") return [];
  const targetOptionRef = issueCareItemTargetRef(deps.integrity_key, {
    workspace_id: scope.workspace_id,
    participant_id: scope.participant_id,
    item_id: row.item_id,
  });
  return [
    {
      capabilityKey: "acknowledge_family_care_item",
      capabilityVersion: "1.0.0",
      targetOptionRef,
      availability:
        row.acknowledgement_state === "acknowledged" ? "already_satisfied" : "available",
    },
    {
      capabilityKey: "reply_family_care_item",
      capabilityVersion: "1.0.0",
      targetOptionRef,
      availability: "available",
    },
  ];
};

export const queryFamilyCareItemDetail = async (
  deps: FamilyCareQueryDependencies,
  request: {
    workspace_id: string;
    participant_id: string;
    item_id: string;
  },
): Promise<FamilyCareQueryDecision<FamilyCareItemDetailOutputV1>> => {
  const result = await deps.reads.loadItemDetail(request);
  if (!result.authorized || !result.detail) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const detail = result.detail;
  const scope = { workspace_id: request.workspace_id, participant_id: request.participant_id };
  return {
    status: "ok",
    output: {
      projectionRole: detail.projection_role,
      careItemRef: issueCareItemTargetRef(deps.integrity_key, {
        ...scope,
        item_id: detail.item_id,
      }),
      provenance: {
        enrollmentRef: issueDisplayRef(deps.integrity_key, scope, "enrollment", detail.enrollment_id),
        sourceLabel: detail.source_label,
        direction: detail.direction,
      },
      progress: {
        acknowledgementState: detail.acknowledgement_state,
        responseState: detail.response_state,
        lifecycle: detail.lifecycle_state,
        replyCount: detail.reply_count,
      },
      messages: detail.messages.map((message) => ({
        kind: timelineKind(message),
        messageRef: issueDisplayRef(deps.integrity_key, scope, "message", message.message_id),
        authoredAs: message.message_kind === "family_message" ? "family" : "care_group",
        occurredAt: message.occurred_at,
        ...(message.redacted || !detail.content_readable
          ? {}
          : (() => {
              const content = unsealOrTombstone(deps, message.body_envelope);
              return content ? { content } : {};
            })()),
      })),
      receipts: detail.receipts.map((receipt) => ({
        receiptRef: issueDisplayRef(deps.integrity_key, scope, "receipt", receipt.receipt_id),
        direction: receipt.direction,
        logicalStatus: receipt.logical_status,
        occurredAt: receipt.occurred_at,
      })),
      ...(detail.attention_state ? { attention: { state: detail.attention_state } } : {}),
      ...(detail.continuation_source_item_id && detail.continuation_source_readable
        ? {
            contextContinuation: {
              sourceItemRef: issueCareItemTargetRef(deps.integrity_key, {
                ...scope,
                item_id: detail.continuation_source_item_id,
              }),
              label: "continues_previous_item",
            },
          }
        : {}),
      actions:
        detail.projection_role === "caregiver"
          ? caregiverActions(deps, scope, {
              item_id: detail.item_id,
              acknowledgement_state: detail.acknowledgement_state,
              lifecycle_state: detail.lifecycle_state,
            })
          : [],
    },
  };
};
