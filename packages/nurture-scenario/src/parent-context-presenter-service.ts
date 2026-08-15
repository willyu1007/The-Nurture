import { createHash, createHmac, randomUUID } from "node:crypto";
import {
  NurtureCommandRunner,
  NurtureDeterministicRollback,
  type NurtureCommandSpec,
} from "./domain/commands/command-kernel.js";
import {
  classifyInteractionContextRow,
  hashScenarioToken,
  NurtureInteractionContextService,
} from "./domain/interactions/interaction-context.js";
import { nurtureCanonicalJson } from "./c30/canonical-json.js";
import {
  PARENT_CONTEXT_PRESENTER_INTERFACE,
  type ParentContextPresenterActivityDetailRequestV1,
  type ParentContextPresenterDateRequestV1,
  type ParentContextPresenterIdentityV1,
  type ParentContextPresenterNoticeConfirmRequestV1,
  type ParentContextPresenterNoticeListRequestV1,
  type ParentContextPresenterNoticePrepareRequestV1,
  type ParentContextPresenterNoticeRequestV1,
  type ParentContextPresenterOperation,
  type ParentContextPresenterOwnerV1,
  type ParentContextPresenterRequestV1,
  type ParentContextPresenterExactAuthorityV1,
  type ParentContextPresenterResolvedAuthorityV1,
  type ParentContextPresenterAsyncBoundaryV1,
} from "./parent-context-presenter-contract.js";

const CACHE_TTL_MS = 5 * 60_000;
const CONFIRMATION_TTL_MS = 5 * 60_000;
const DATE_WINDOW_DAYS = 31;
const MAX_ACTIVITY_ROWS = 20;
const MAX_NOTICE_CANDIDATES = 100;

export type ParentContextDailyLogFactV1 = Readonly<{
  log_id: string;
  log_version: number;
  local_date: string;
  recorded_at: string;
  summary: string | null;
  meal: unknown;
  nap: unknown;
  activity: unknown;
  mood: unknown;
  health_observation: unknown;
}>;

export type ParentContextNoticeFactV1 = Readonly<{
  notice_id: string;
  notice_version: number;
  source_type:
    | "family_care_message"
    | "family_care_item"
    | "daily_care_log"
    | "media_attribution"
    | "system_summary"
    | "publication_release";
  data_class: string | null;
  delivery_status:
    | "delivered"
    | "read"
    | "acknowledged"
    | "revoked_after_delivery";
  published_at: string;
  expires_at?: string;
}>;

export type ParentContextAttendanceFactV1 = Readonly<{
  submission_state: "submitted" | "reopened" | "missing";
  entry_state:
    | "present"
    | "absent"
    | "excused_absent"
    | "not_expected"
    | "missing";
  observed_at?: string;
}>;

type CurrentRead<T> =
  | Readonly<{ status: "current"; value: T }>
  | Readonly<{ status: "scope_changed" }>;

export type ParentContextPresenterReadPortV1 = Readonly<{
  listDailyLogs(input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
    local_date: string;
    take: number;
  }): Promise<CurrentRead<readonly ParentContextDailyLogFactV1[]>>;
  listNotices(input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
    page_size: number;
    cursor?: string;
  }): Promise<
    CurrentRead<
      Readonly<{
        notices: readonly ParentContextNoticeFactV1[];
        has_more: boolean;
        next_cursor?: string;
      }>
    >
  >;
  listNoticeCandidates(input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
    take: number;
  }): Promise<CurrentRead<readonly ParentContextNoticeFactV1[]>>;
  readAttendance(input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
    local_date: string;
  }): Promise<CurrentRead<ParentContextAttendanceFactV1>>;
}>;

type ParentContextPresenterOwnerDeps = Readonly<{
  reads: ParentContextPresenterReadPortV1;
  interactionContexts: NurtureInteractionContextService;
  commands: NurtureCommandRunner;
  integrityKey: string;
  now?: () => Date;
  createCommandId?: () => string;
}>;

type PreparedNoticeState = Readonly<{
  schema_version: 1;
  command_request_id: string;
  context_ref: string;
  notice_id: string;
  notice_ref: string;
  notice_version: number;
  action_ref: string;
  action_version: number;
  prepared_preview_digest: string;
  resolution_ref: string;
  scope_version: number;
}>;

type ConfirmNoticePayload = Readonly<{
  context_ref: string;
  action_ref: string;
  action_version: number;
  prepared_preview_digest: string;
  actor_binding_ref: string;
}>;

type CommittedNoticeResult = Readonly<{
  schema_version: 1;
  notice_ref: string;
  display_status: "read";
  confirmed_at: string;
}>;

export class NurtureParentContextPresenter implements ParentContextPresenterOwnerV1 {
  private readonly now: () => Date;
  private readonly createCommandId: () => string;

  constructor(private readonly deps: ParentContextPresenterOwnerDeps) {
    if (deps.integrityKey.length < 32) {
      throw new Error("parent-context presenter integrity key must contain at least 32 characters");
    }
    this.now = deps.now ?? (() => new Date());
    this.createCommandId = deps.createCommandId ?? (() => `pcn-${randomUUID()}`);
  }

  async present(input: {
    operation: ParentContextPresenterOperation;
    request: ParentContextPresenterRequestV1;
    authority: ParentContextPresenterResolvedAuthorityV1;
  }): Promise<unknown> {
    if (
      !isExactAuthority(input.authority)
      || input.authority.context_ref !== input.request.context_ref
    ) {
      return masked(input.request, this.now);
    }
    const authority = input.authority;
    switch (input.operation) {
      case "day_query":
        return this.day(input.request as ParentContextPresenterDateRequestV1, authority);
      case "daily_care_cards_query":
        return this.dailyCare(
          input.request as ParentContextPresenterDateRequestV1,
          authority,
        );
      case "activity_detail_query":
        return this.activityDetail(
          input.request as ParentContextPresenterActivityDetailRequestV1,
          authority,
        );
      case "notice_list_and_confirmation":
        return this.notices(
          input.request as ParentContextPresenterNoticeRequestV1,
          authority,
        );
      case "freshness_attendance_projection":
        return this.freshnessAttendance(
          input.request as ParentContextPresenterDateRequestV1,
          authority,
        );
    }
  }

  private async day(
    request: ParentContextPresenterDateRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    if (isFutureDate(request.local_date, this.now())) return unavailable(request, this.now);
    const read = await this.deps.reads.listDailyLogs({
      workspace_id: request.workspace_id,
      authority,
      local_date: request.local_date,
      take: MAX_ACTIVITY_ROWS,
    });
    if (read.status === "scope_changed") return masked(request, this.now);
    const generatedAt = this.now();
    const dates = dateWindow(generatedAt, DATE_WINDOW_DAYS, request.local_date);
    const selectedIndex = dates.indexOf(request.local_date);
    const activities = read.value.map((log) => ({
      activity_ref: this.publicRef(request, "activity", log.log_id),
      title_display: activityTitle(log),
      occurred_at: log.recorded_at,
      media_state: "none" as const,
    }));
    return {
      status: "ready",
      ...this.binding("day_query", request, authority, generatedAt),
      generated_at: generatedAt.toISOString(),
      day: {
        selected_date: request.local_date,
        selected_date_label: longDateLabel(request.local_date),
        previous_date: selectedIndex > 0 ? dates[selectedIndex - 1] : null,
        next_date:
          selectedIndex >= 0 && selectedIndex < dates.length - 1
            ? dates[selectedIndex + 1]
            : null,
        calendar: {
          earliest_date: dates[0],
          latest_date: dates.at(-1),
          date_options: dates.map((date) => ({
            date,
            label: longDateLabel(date),
            short_label: shortDateLabel(date),
            is_today: date === utcLocalDate(generatedAt),
            available: true,
          })),
        },
      },
      activities,
    };
  }

  private async dailyCare(
    request: ParentContextPresenterDateRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    if (isFutureDate(request.local_date, this.now())) return unavailable(request, this.now);
    const read = await this.deps.reads.listDailyLogs({
      workspace_id: request.workspace_id,
      authority,
      local_date: request.local_date,
      take: MAX_ACTIVITY_ROWS,
    });
    if (read.status === "scope_changed") return masked(request, this.now);
    const generatedAt = this.now();
    return {
      status: "ready",
      ...this.binding("daily_care_cards_query", request, authority, generatedAt),
      generated_at: generatedAt.toISOString(),
      local_date: request.local_date,
      cards: careCards(read.value, (kind) =>
        this.publicRef(request, "care-card", `${request.local_date}\0${kind}`)),
    };
  }

  private async activityDetail(
    request: ParentContextPresenterActivityDetailRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    if (isFutureDate(request.local_date, this.now())) return unavailable(request, this.now);
    const read = await this.deps.reads.listDailyLogs({
      workspace_id: request.workspace_id,
      authority,
      local_date: request.local_date,
      take: MAX_ACTIVITY_ROWS,
    });
    if (read.status === "scope_changed") return masked(request, this.now);
    const log = read.value.find(
      (candidate) =>
        this.publicRef(request, "activity", candidate.log_id) === request.activity_ref,
    );
    if (!log) return unavailable(request, this.now);
    const generatedAt = this.now();
    const summary = boundedText(log.summary, 1_000);
    return {
      status: "ready",
      ...this.binding("activity_detail_query", request, authority, generatedAt),
      generated_at: generatedAt.toISOString(),
      activity: {
        activity_ref: request.activity_ref,
        local_date: request.local_date,
        title_display: activityTitle(log),
        time_display: null,
        ...(summary ? { summary_display: summary } : {}),
        occurred_at: log.recorded_at,
        media_state: "none",
        media: [],
      },
    };
  }

  private notices(
    request: ParentContextPresenterNoticeRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    switch (request.kind) {
      case "list":
        return this.listNotices(request, authority);
      case "prepare_confirmation":
        return this.prepareNotice(request, authority);
      case "confirm":
        return this.confirmNotice(request, authority);
    }
  }

  private async listNotices(
    request: ParentContextPresenterNoticeListRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    const read = await this.deps.reads.listNotices({
      workspace_id: request.workspace_id,
      authority,
      page_size: request.page_size ?? 20,
      ...(request.cursor ? { cursor: request.cursor } : {}),
    });
    if (read.status === "scope_changed") return masked(request, this.now);
    const generatedAt = this.now();
    return {
      status: "ready",
      ...this.binding("notice_list_and_confirmation", request, authority, generatedAt),
      generated_at: generatedAt.toISOString(),
      notices: read.value.notices.map((notice) => this.presentNotice(request, notice)),
      page_info: read.value.has_more
        ? { has_more: true, next_cursor: read.value.next_cursor }
        : { has_more: false },
    };
  }

  private async prepareNotice(
    request: ParentContextPresenterNoticePrepareRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    const read = await this.deps.reads.listNoticeCandidates({
      workspace_id: request.workspace_id,
      authority,
      take: MAX_NOTICE_CANDIDATES,
    });
    if (read.status === "scope_changed") return masked(request, this.now);
    const notice = read.value.find(
      (candidate) => this.publicRef(request, "notice", candidate.notice_id) === request.notice_ref,
    );
    if (
      !notice
      || notice.delivery_status !== "delivered"
      || notice.notice_version !== request.expected_notice_version
      || notice.notice_version !== request.action_version
      || this.publicRef(request, "notice-action", notice.notice_id) !== request.action_ref
    ) {
      return unavailable(request, this.now);
    }
    const commandRequestId = this.createCommandId();
    const preview = noticePreview(notice);
    const preparedPreviewDigest = digestPreview(preview);
    const issued = await this.deps.interactionContexts.issue({
      workspace_id: request.workspace_id,
      participant_id: authority.participant_id,
      purpose: "prepare_action",
      surface: "parent_context_presenter",
      host_conversation_ref: commandRequestId,
      payload_schema_version: 1,
      state_payload: {
        schema_version: 1,
        command_request_id: commandRequestId,
        context_ref: request.context_ref,
        notice_id: notice.notice_id,
        notice_ref: request.notice_ref,
        notice_version: notice.notice_version,
        action_ref: request.action_ref,
        action_version: request.action_version,
        prepared_preview_digest: preparedPreviewDigest,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
      } satisfies PreparedNoticeState,
      ttl_ms: CONFIRMATION_TTL_MS,
    });
    const generatedAt = this.now();
    return {
      status: "ready_to_confirm",
      ...this.binding("notice_list_and_confirmation", request, authority, generatedAt),
      notice_ref: request.notice_ref,
      notice_version: notice.notice_version,
      action_ref: request.action_ref,
      action_version: request.action_version,
      preview,
      prepared_preview_digest: preparedPreviewDigest,
      confirmation_ref: issued.token,
      expires_at: issued.expires_at,
      command_request_id: commandRequestId,
    };
  }

  private async confirmNotice(
    request: ParentContextPresenterNoticeConfirmRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    let prepared: PreparedNoticeState | undefined;
    const spec: NurtureCommandSpec<ConfirmNoticePayload> = {
      command_key: "parent_context_confirm_notice",
      command_scope: "parent_context_presenter",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) => {
        if (!transaction.interactionContexts || !transaction.parentContextPresenter) {
          return { status: "blocked", reason_code: "parent_context_presenter_ports_unavailable" };
        }
        const row = await transaction.interactionContexts.findByTokenHash({
          workspace_id: request.workspace_id,
          token_hash: hashScenarioToken(request.workspace_id, request.confirmation_ref),
        });
        const classified = classifyInteractionContextRow(
          row,
          {
            workspace_id: request.workspace_id,
            participant_id: authority.participant_id,
            purpose: "prepare_action",
            surface: "parent_context_presenter",
            host_conversation_ref: request.command_request_id,
          },
          this.now(),
        );
        if (classified.status === "expired") {
          return { status: "blocked", reason_code: "confirmation_expired" };
        }
        if (classified.status === "blocked") {
          return { status: "blocked", reason_code: classified.reason_code };
        }
        const state = parsePreparedNoticeState(classified.context.state_payload);
        if (
          !state
          || state.command_request_id !== request.command_request_id
          || state.context_ref !== request.context_ref
          || state.action_ref !== request.action_ref
          || state.action_version !== request.action_version
          || state.prepared_preview_digest !== request.prepared_preview_digest
          || state.resolution_ref !== authority.resolution_ref
          || state.scope_version !== authority.scope_version
        ) {
          return { status: "invalid", reason_code: "invalid_confirmation" };
        }
        const facts = await transaction.parentContextPresenter.loadNoticeConfirmationFacts({
          workspace_id: request.workspace_id,
          authority,
          notice_id: state.notice_id,
          expected_notice_version: state.notice_version,
        });
        if (facts.status === "scope_changed") {
          return { status: "blocked", reason_code: "access_changed" };
        }
        if (facts.status === "notice_missing" || facts.status === "notice_changed") {
          return { status: "conflict", reason_code: "stale_confirmation" };
        }
        const consumed = await transaction.interactionContexts.consume({
          workspace_id: request.workspace_id,
          context_id: classified.context.id,
          expected_version: classified.context.version,
          consumed_at: this.now().toISOString(),
        });
        if (!consumed) {
          return { status: "blocked", reason_code: "confirmation_replayed" };
        }
        prepared = state;
        if (facts.status === "already_satisfied") {
          return {
            status: "already_satisfied",
            output_refs: facts.output_refs,
            result_schema_version: 1,
            committed_result: {
              schema_version: 1,
              notice_ref: state.notice_ref,
              display_status: "read",
              confirmed_at: facts.confirmed_at,
            } satisfies CommittedNoticeResult,
          };
        }
        return { status: "ready" };
      },
      apply: async (transaction) => {
        if (!prepared || !transaction.parentContextPresenter) {
          throw new NurtureDeterministicRollback(
            "parent_context_presenter_ports_unavailable",
            "blocked",
          );
        }
        const applied = await transaction.parentContextPresenter.markNoticeRead({
          workspace_id: request.workspace_id,
          authority,
          notice_id: prepared.notice_id,
          expected_notice_version: prepared.notice_version,
          confirmed_at: this.now().toISOString(),
        });
        if (applied.status !== "committed") {
          throw new NurtureDeterministicRollback(
            applied.status === "scope_changed" ? "access_changed" : "stale_confirmation",
            applied.status === "scope_changed" ? "blocked" : "conflict",
          );
        }
        return {
          output_refs: [applied.notice_ref],
          result_schema_version: 1,
          committed_result: {
            schema_version: 1,
            notice_ref: prepared.notice_ref,
            display_status: "read",
            confirmed_at: applied.confirmed_at,
          } satisfies CommittedNoticeResult,
        };
      },
    };
    const result = await this.deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.invocation_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: authority.participant_id,
      child_care_process_id: authority.child_care_process_ref,
      payload: {
        context_ref: request.context_ref,
        action_ref: request.action_ref,
        action_version: request.action_version,
        prepared_preview_digest: request.prepared_preview_digest,
        actor_binding_ref: this.publicRef(request, "actor", authority.participant_id),
      },
      spec,
    });
    if (result.status === "outcome_unknown") return outcomeUnknown();
    if (result.status === "ok") {
      const committed = parseCommittedNoticeResult(result.committed_result);
      if (!committed) return outcomeUnknown();
      const generatedAt = this.now();
      return {
        status: "committed",
        ...this.binding("notice_list_and_confirmation", request, authority, generatedAt),
        execution_disposition: result.disposition,
        business_outcome: result.business_outcome,
        committed_result: {
          notice_ref: committed.notice_ref,
          display_status: committed.display_status,
          confirmed_at: committed.confirmed_at,
        },
      };
    }
    if ([
      "command_busy",
      "command_lookup_failed",
      "command_execution_failed",
      "parent_context_presenter_ports_unavailable",
    ].includes(result.reason_code)) {
      return outcomeUnknown();
    }
    return mapNotCommitted(result.reason_code);
  }

  private async freshnessAttendance(
    request: ParentContextPresenterDateRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
  ): Promise<unknown> {
    if (isFutureDate(request.local_date, this.now())) return unavailable(request, this.now);
    const read = await this.deps.reads.readAttendance({
      workspace_id: request.workspace_id,
      authority,
      local_date: request.local_date,
    });
    if (read.status === "scope_changed") return masked(request, this.now);
    const generatedAt = this.now();
    return {
      status: "ready",
      ...this.binding(
        "freshness_attendance_projection",
        request,
        authority,
        generatedAt,
      ),
      generated_at: generatedAt.toISOString(),
      local_date: request.local_date,
      freshness: {
        state: "fresh",
        data_as_of: generatedAt.toISOString(),
        stale_at: new Date(generatedAt.getTime() + CACHE_TTL_MS).toISOString(),
        last_successful_refresh_at: generatedAt.toISOString(),
        read_only: false,
      },
      attendance: presentAttendance(read.value),
    };
  }

  private presentNotice(
    request: ParentContextPresenterNoticeListRequestV1,
    notice: ParentContextNoticeFactV1,
  ): object {
    const noticeRef = this.publicRef(request, "notice", notice.notice_id);
    const title = noticeTitle(notice);
    const common = {
      notice_ref: noticeRef,
      notice_version: notice.notice_version,
      title_display: title,
      display_status: noticeDisplayStatus(notice.delivery_status),
      published_at: notice.published_at,
      ...(notice.expires_at ? { expires_at: notice.expires_at } : {}),
    };
    return notice.delivery_status === "delivered"
      ? {
          ...common,
          display_status: "action_required",
          action: {
            action_ref: this.publicRef(request, "notice-action", notice.notice_id),
            action_version: notice.notice_version,
            label: "标记已读",
            confirmation_title: "确认已读",
            confirmation_body: `确认已阅读“${title}”。`,
            action_semantics: "confirm_notice",
          },
        }
      : common;
  }

  private binding(
    operation: ParentContextPresenterOperation,
    request: ParentContextPresenterRequestV1,
    authority: ParentContextPresenterExactAuthorityV1,
    generatedAt: Date,
  ): object {
    const queryKey = queryKeyOf(operation, request);
    const partitionKey = this.publicRef(
      request,
      "cache",
      [
        PARENT_CONTEXT_PRESENTER_INTERFACE.digest,
        authority.resolution_ref,
        authority.scope_version,
        operation,
        queryKey,
      ].join("\0"),
    );
    return {
      owner_resolution: {
        resolution_ref: authority.resolution_ref,
        presentation_role: "parent",
        scope_kind: "parent_context",
        scope_ref: authority.scope_ref,
        context_ref: request.context_ref,
        scope_version: authority.scope_version,
        resolved_at: authority.resolved_at,
      },
      cache_partition: {
        partition_key: partitionKey,
        interface_key: PARENT_CONTEXT_PRESENTER_INTERFACE.key,
        interface_version: PARENT_CONTEXT_PRESENTER_INTERFACE.version,
        contract_digest: PARENT_CONTEXT_PRESENTER_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        presentation_role: "parent",
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        query_key: queryKey,
        expires_at: new Date(generatedAt.getTime() + CACHE_TTL_MS).toISOString(),
      },
    };
  }

  private publicRef(
    request: Pick<
      ParentContextPresenterIdentityV1,
      "workspace_id" | "my_chat_user_id" | "context_ref"
    >,
    kind: string,
    canonicalId: string,
  ): string {
    return createHmac("sha256", this.deps.integrityKey)
      .update(
        `nurture.parent-context-presenter-ref.v1\0${request.workspace_id}\0${request.my_chat_user_id}\0${request.context_ref}\0${kind}\0${canonicalId}`,
        "utf8",
      )
      .digest("hex");
  }
}

type AsyncEntry = Readonly<{
  generation: number;
  context_ref: string;
  touched_at: number;
}>;

export class LatestParentContextPresenterAsyncBoundary
  implements ParentContextPresenterAsyncBoundaryV1
{
  private readonly entries = new Map<string, AsyncEntry>();

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly maxEntries = 2_000,
    private readonly ttlMs = 10 * 60_000,
  ) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || ttlMs < 1) {
      throw new Error("invalid parent-context presenter async boundary limits");
    }
  }

  async capture(input: ParentContextPresenterIdentityV1 & {
    operation: ParentContextPresenterOperation;
  }): Promise<Readonly<{ response_generation: number }>> {
    this.prune();
    const key = asyncKey(input);
    const generation = (this.entries.get(key)?.generation ?? 0) + 1;
    this.entries.delete(key);
    this.entries.set(key, {
      generation,
      context_ref: input.context_ref,
      touched_at: this.now().getTime(),
    });
    this.trim();
    return { response_generation: generation };
  }

  async current(input: Omit<ParentContextPresenterIdentityV1, "context_ref"> & {
    operation: ParentContextPresenterOperation;
  }): Promise<Readonly<{ active_generation: number; active_context_ref: string }>> {
    this.prune();
    const entry = this.entries.get(asyncKey(input));
    if (!entry) throw new Error("parent-context presenter async generation missing");
    return {
      active_generation: entry.generation,
      active_context_ref: entry.context_ref,
    };
  }

  private prune(): void {
    const cutoff = this.now().getTime() - this.ttlMs;
    for (const [key, entry] of this.entries) {
      if (entry.touched_at <= cutoff) this.entries.delete(key);
    }
  }

  private trim(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) return;
      this.entries.delete(oldest);
    }
  }
}

const asyncKey = (input: {
  operation: ParentContextPresenterOperation;
  workspace_id: string;
  my_chat_user_id: string;
}): string => `${input.workspace_id}\0${input.my_chat_user_id}\0${input.operation}`;

const careCardKinds = [
  ["meal", "饮食"],
  ["nap", "午睡"],
  ["activity", "活动"],
  ["mood", "情绪"],
  ["health_observation", "健康观察"],
] as const;

const careCards = (
  logs: readonly ParentContextDailyLogFactV1[],
  issueRef: (kind: string) => string,
): object[] =>
  careCardKinds.map(([kind, label]) => {
    const source = logs.find((log) => displayCareValue(kind, log[kind]) !== null);
    const value = source ? displayCareValue(kind, source[kind]) : null;
    const cardRef = issueRef(kind);
    return source && value
      ? {
          card_ref: cardRef,
          label,
          value_state: "provided",
          value_display: value,
          recorded_at: source.recorded_at,
        }
      : { card_ref: cardRef, label, value_state: "missing" };
  });

const displayCareValue = (
  kind: (typeof careCardKinds)[number][0],
  value: unknown,
): string | null => {
  if (!isRecord(value)) return null;
  // Only owner-authored display copy crosses the boundary. Raw payload keys
  // such as `mood: "calm"` are business enums and must not become wire copy.
  for (const key of ["summary", "note"] as const) {
    const candidate = value[key];
    if (typeof candidate === "string") {
      const bounded = boundedText(candidate, 120);
      if (bounded) return bounded;
    }
  }
  const minutes = kind === "nap" ? value.minutes : undefined;
  return typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0
    ? `${Math.round(minutes)} 分钟`
    : null;
};

const activityTitle = (log: ParentContextDailyLogFactV1): string =>
  log.activity !== null ? "活动记录" : "日常照护记录";

const noticeTitle = (notice: ParentContextNoticeFactV1): string => {
  switch (notice.source_type) {
    case "daily_care_log":
      return "日常照护记录已更新";
    case "publication_release":
      return "成长内容已发布";
    case "media_attribution":
      return "媒体内容已更新";
    case "family_care_message":
      return "园所消息待查看";
    case "family_care_item":
      return "照护事项已更新";
    case "system_summary":
      return "照护摘要已更新";
  }
};

const noticePreview = (notice: ParentContextNoticeFactV1) => {
  const title = noticeTitle(notice);
  return {
    effect: "confirm_notice" as const,
    title: "确认已读",
    body: `确认已阅读“${title}”。`,
  };
};

const noticeDisplayStatus = (
  status: ParentContextNoticeFactV1["delivery_status"],
): "unread" | "read" | "expired" => {
  if (status === "delivered") return "unread";
  if (status === "read" || status === "acknowledged") return "read";
  return "expired";
};

const presentAttendance = (fact: ParentContextAttendanceFactV1): object => {
  const observed = fact.observed_at ? { observed_at: fact.observed_at } : {};
  if (fact.submission_state === "reopened") {
    return {
      display_state: "unknown",
      message: "考勤记录正在重新确认",
      source_display: "园所考勤记录",
      ...observed,
    };
  }
  switch (fact.entry_state) {
    case "present":
      return {
        display_state: "present",
        message: "已记录到园",
        source_display: "园所考勤记录",
        ...observed,
      };
    case "absent":
    case "excused_absent":
      return {
        display_state: "no_attendance",
        message: "未记录到园",
        source_display: "园所考勤记录",
        ...observed,
      };
    case "not_expected":
      return {
        display_state: "closed",
        message: "当日无需到园",
        source_display: "园所考勤记录",
        ...observed,
      };
    case "missing":
      return {
        display_state: "unknown",
        message: "暂无已确认考勤",
        source_display: "园所考勤记录",
        ...observed,
      };
  }
};

const queryKeyOf = (
  operation: ParentContextPresenterOperation,
  request: ParentContextPresenterRequestV1,
): string =>
  `q:${createHash("sha256")
    .update(
      nurtureCanonicalJson({
        operation,
        ...(requestFields(request)),
      }),
      "utf8",
    )
    .digest("hex")}`;

const requestFields = (request: ParentContextPresenterRequestV1): object => {
  if ("local_date" in request) {
    return {
      local_date: request.local_date,
      ...("activity_ref" in request ? { activity_ref: request.activity_ref } : {}),
    };
  }
  switch (request.kind) {
    case "list":
      return {
        kind: request.kind,
        page_size: request.page_size ?? 20,
        cursor: request.cursor ?? null,
      };
    case "prepare_confirmation":
      return {
        kind: request.kind,
        notice_ref: request.notice_ref,
        action_ref: request.action_ref,
        action_version: request.action_version,
        expected_notice_version: request.expected_notice_version,
      };
    case "confirm":
      return {
        kind: request.kind,
        command_request_id: request.command_request_id,
        action_ref: request.action_ref,
        action_version: request.action_version,
        prepared_preview_digest: request.prepared_preview_digest,
      };
  }
};

const digestPreview = (preview: object): string =>
  `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(preview), "utf8")
    .digest("hex")}`;

const parsePreparedNoticeState = (value: unknown): PreparedNoticeState | null =>
  isRecord(value)
  && value.schema_version === 1
  && typeof value.command_request_id === "string"
  && typeof value.context_ref === "string"
  && typeof value.notice_id === "string"
  && typeof value.notice_ref === "string"
  && Number.isSafeInteger(value.notice_version)
  && typeof value.action_ref === "string"
  && Number.isSafeInteger(value.action_version)
  && typeof value.prepared_preview_digest === "string"
  && typeof value.resolution_ref === "string"
  && Number.isSafeInteger(value.scope_version)
    ? value as PreparedNoticeState
    : null;

const parseCommittedNoticeResult = (value: unknown): CommittedNoticeResult | null =>
  isRecord(value)
  && value.schema_version === 1
  && typeof value.notice_ref === "string"
  && value.display_status === "read"
  && typeof value.confirmed_at === "string"
  && !Number.isNaN(Date.parse(value.confirmed_at))
    ? value as CommittedNoticeResult
    : null;

const mapNotCommitted = (reasonCode: string): object => {
  if (reasonCode === "confirmation_expired" || reasonCode === "token_expired") {
    return { status: "not_committed", reason_code: "confirmation_expired", recovery: "reprepare" };
  }
  if (reasonCode === "confirmation_replayed" || reasonCode === "token_replayed") {
    return { status: "not_committed", reason_code: "confirmation_replayed", recovery: "refresh" };
  }
  if (reasonCode === "stale_confirmation" || reasonCode === "access_changed") {
    return { status: "not_committed", reason_code: "stale_confirmation", recovery: "reprepare" };
  }
  return { status: "not_committed", reason_code: "invalid_confirmation", recovery: "none" };
};

const outcomeUnknown = (): object => ({
  status: "outcome_unknown",
  reason_code: "confirmation_outcome_unknown",
  recovery: "reconcile_same_command",
});

const unavailable = (
  request: ParentContextPresenterIdentityV1,
  now: () => Date,
): object => ({
  status: "unavailable",
  context_ref: request.context_ref,
  failed_at: now().toISOString(),
  reason_code: "content_unavailable",
  retryable: false,
});

const masked = (
  request: ParentContextPresenterIdentityV1,
  now: () => Date,
): object => ({
  status: "masked",
  context_ref: request.context_ref,
  masked_at: now().toISOString(),
  mask_signal: {
    kind: "mask",
    reason_code: "access_changed",
    purge_partition: true,
    content_masked: true,
    actions_disabled: true,
    media_access_invalidated: true,
  },
});

const dateWindow = (now: Date, count: number, selectedDate: string): string[] => {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const defaultEarliest = new Date(today);
  defaultEarliest.setUTCDate(today.getUTCDate() - (count - 1));
  const selected = new Date(`${selectedDate}T00:00:00.000Z`);
  const earliest = selected < defaultEarliest ? selected : defaultEarliest;
  const latest = new Date(earliest);
  latest.setUTCDate(earliest.getUTCDate() + (count - 1));
  if (latest > today) latest.setTime(today.getTime());
  const length = Math.round((latest.getTime() - earliest.getTime()) / 86_400_000) + 1;
  return Array.from({ length }, (_, index) => {
    const date = new Date(earliest);
    date.setUTCDate(earliest.getUTCDate() + index);
    return utcLocalDate(date);
  });
};

const utcLocalDate = (date: Date): string => date.toISOString().slice(0, 10);
const isFutureDate = (value: string, now: Date): boolean => value > utcLocalDate(now);

const longDateLabel = (value: string): string => {
  const [, month = "", day = ""] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
};

const shortDateLabel = (value: string): string => {
  const [, month = "", day = ""] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
};

const boundedText = (value: string | null, max: number): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, max) : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isExactAuthority = (
  value: ParentContextPresenterResolvedAuthorityV1,
): value is ParentContextPresenterExactAuthorityV1 => {
  const candidate = value as Partial<ParentContextPresenterExactAuthorityV1>;
  return [
    candidate.participant_version,
    candidate.guardian_role_version,
    candidate.association_version,
    candidate.child_anchor_version,
    candidate.family_anchor_version,
    candidate.parent_context_selection_version,
    candidate.enrollment_version,
    candidate.care_group_version,
    candidate.institution_version,
    candidate.family_version,
    candidate.child_care_process_version,
    candidate.grant_version,
    candidate.thread_version,
    candidate.membership_version,
  ].every((version) => Number.isSafeInteger(version) && (version ?? -1) >= 0)
    && [
      candidate.institution_ref,
      candidate.family_ref,
      candidate.child_care_process_ref,
      candidate.child_anchor_ref,
      candidate.family_anchor_ref,
      candidate.thread_ref,
      candidate.membership_ref,
      candidate.host_context_version,
      candidate.resolved_at,
    ].every((entry) => typeof entry === "string" && entry.length > 0)
    && !Number.isNaN(Date.parse(candidate.resolved_at ?? ""));
};
