import { createHmac, timingSafeEqual } from "node:crypto";
import {
  DIRECTOR_PRESENTER_INTERFACE,
  type DirectorPresenterOperation,
} from "./director-presenter-contract.js";

const RESPONSE_TTL_MS = 60_000;
const MAX_DRILLDOWN_ITEMS = 50;

type DirectorPresenterIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  interface_contract: typeof DIRECTOR_PRESENTER_INTERFACE;
}>;

export type DirectorPresenterOverviewRequestV1 =
  DirectorPresenterIdentityV1 & Readonly<{ local_date: string }>;
export type DirectorPresenterDrilldownRequestV1 =
  DirectorPresenterIdentityV1 & Readonly<{ drilldown_ref: string }>;
export type DirectorPresenterMaterialRequestV1 =
  DirectorPresenterIdentityV1 &
    Readonly<{ collection_ref: string; cursor?: string }>;

export type DirectorPresenterPublicOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "institution_director";
  scope_kind: "institution";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

export type DirectorPresenterExactAuthorityV1 =
  DirectorPresenterPublicOwnerResolutionV1 & Readonly<{
    exact: Readonly<{
      participant_id: string;
      participant_version: number;
      role_assignment_id: string;
      role_version: number;
      institution_id: string;
      institution_version: number;
    }>;
  }>;

export type DirectorPresenterAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: DirectorPresenterExactAuthorityV1;
    }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface DirectorPresenterAuthorityResolverV1 {
  resolve(
    input: DirectorPresenterIdentityV1 &
      Readonly<{ operation: DirectorPresenterOperation }>,
  ): Promise<DirectorPresenterAuthorityResultV1>;
}

export interface DirectorPresenterOwnerV1 {
  overview(input: Readonly<{
    request: DirectorPresenterOverviewRequestV1;
    authority: DirectorPresenterExactAuthorityV1;
  }>): Promise<unknown>;
  drilldown(input: Readonly<{
    request: DirectorPresenterDrilldownRequestV1;
    authority: DirectorPresenterExactAuthorityV1;
  }>): Promise<unknown>;
  materials(input: Readonly<{
    request: DirectorPresenterMaterialRequestV1;
    authority: DirectorPresenterExactAuthorityV1;
  }>): Promise<unknown>;
}

export type DirectorPresenterOwnerBindingV1 = Readonly<{
  authorityResolver: DirectorPresenterAuthorityResolverV1;
  owner: DirectorPresenterOwnerV1;
}>;

export type DirectorContextFactsV1 = Readonly<{
  participant_id: string;
  participant_version: number;
  role_assignment_id: string;
  role_version: number;
  institution_id: string;
  institution_version: number;
}>;

export type DirectorContextReadV1 =
  | Readonly<{ status: "resolved"; facts: DirectorContextFactsV1 }>
  | Readonly<{ status: "access_changed" | "ambiguous_institution" }>;

export type DirectorSourceReadV1<T> =
  | Readonly<{ status: "current"; value: T }>
  | Readonly<{ status: "unavailable" }>;

export type DirectorOverviewFactsV1 = Readonly<{
  organization_display_name: string;
  attendance: DirectorSourceReadV1<
    Readonly<{ present_count: number; roster_count: number }>
  >;
  activity: DirectorSourceReadV1<Readonly<{ count: number }>>;
  message_response: DirectorSourceReadV1<
    Readonly<{ responded_count: number; total_count: number }>
  >;
  home_kindergarten_flow: DirectorSourceReadV1<
    Readonly<{
      home_to_kindergarten_count: number;
      kindergarten_to_home_count: number;
    }>
  >;
  authorization_changes: DirectorSourceReadV1<Readonly<{ count: number }>>;
  trend: DirectorSourceReadV1<Readonly<{ points: readonly number[] }>>;
  family_focus_attention: DirectorSourceReadV1<Readonly<{ count: number }>>;
}>;

export type DirectorDrilldownKindV1 =
  | "attendance"
  | "activity"
  | "message_response"
  | "home_kindergarten_flow"
  | "authorization_changes"
  | "class_load_attention"
  | "family_focus_attention";

export type DirectorDrilldownRowV1 = Readonly<{
  care_group_id: string;
  class_label: string;
  status: "current" | "unavailable";
  primary_value: number;
  secondary_value?: number;
}>;

export type DirectorOwnerReadV1<T> =
  | Readonly<{ status: "current"; value: T }>
  | Readonly<{ status: "scope_changed" }>
  | Readonly<{ status: "unavailable" }>;

export interface DirectorPresenterReadPortV1 {
  loadDirectorContext(input: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }>): Promise<DirectorContextReadV1>;
  loadOverviewFacts(input: Readonly<{
    workspace_id: string;
    authority: DirectorPresenterExactAuthorityV1;
    local_date: string;
    at: Date;
  }>): Promise<DirectorOwnerReadV1<DirectorOverviewFactsV1>>;
  loadDrilldownFacts(input: Readonly<{
    workspace_id: string;
    authority: DirectorPresenterExactAuthorityV1;
    local_date: string;
    kind: Exclude<DirectorDrilldownKindV1, "class_load_attention">;
    take: number;
    at: Date;
  }>): Promise<DirectorOwnerReadV1<Readonly<{
    organization_display_name: string;
    rows: readonly DirectorDrilldownRowV1[];
  }>>>;
  authorityIsCurrent(input: Readonly<{
    workspace_id: string;
    authority: DirectorPresenterExactAuthorityV1;
    at: Date;
  }>): Promise<boolean>;
}

export interface DirectorClassLoadSupportQueryV1 {
  compose(input: Readonly<{
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    institution_ref: string;
    snapshot_at: string;
  }>): Promise<
    | Readonly<{
        status: "ok";
        output: Readonly<{
          signals: readonly Readonly<{
            category: string;
            sourceRef: string;
            safeReason: string;
            currentCount?: number;
          }>[];
        }>;
      }>
    | Readonly<{ status: "denied" | "unavailable" }>
  >;
}

export type DirectorPresenterServiceDependenciesV1 = Readonly<{
  reads: DirectorPresenterReadPortV1;
  supportSignals?: DirectorClassLoadSupportQueryV1;
  integrityKey: string;
  now?: () => Date;
}>;

type DrilldownRefPayload = Readonly<{
  kind: DirectorDrilldownKindV1;
  local_date: string;
  resolution_ref: string;
  scope_version: number;
  expires_at: string;
}>;

const DRILLDOWN_KINDS: readonly DirectorDrilldownKindV1[] = [
  "attendance",
  "activity",
  "message_response",
  "home_kindergarten_flow",
  "authorization_changes",
  "class_load_attention",
  "family_focus_attention",
];

const TITLE = {
  attendance: "到园情况",
  activity: "今日活动",
  message_response: "沟通响应",
  home_kindergarten_flow: "家园信息流",
  authorization_changes: "授权变更",
  class_load_attention: "班级沟通负载关注",
  family_focus_attention: "家庭新增关注点",
} as const;

const publicResolution = (
  authority: DirectorPresenterExactAuthorityV1,
): DirectorPresenterPublicOwnerResolutionV1 => ({
  resolution_ref: authority.resolution_ref,
  presentation_role: authority.presentation_role,
  scope_kind: authority.scope_kind,
  scope_ref: authority.scope_ref,
  context_ref: authority.context_ref,
  scope_version: authority.scope_version,
  resolved_at: authority.resolved_at,
});

export const createDirectorPresenterService = (
  deps: DirectorPresenterServiceDependenciesV1,
): DirectorPresenterOwnerBindingV1 => {
  if (deps.integrityKey.length < 32) {
    throw new Error("Director presenter integrity key must be at least 32 characters");
  }
  const now = deps.now ?? (() => new Date());
  const opaqueRef = (
    workspaceId: string,
    kind: string,
    value: string,
  ): string => `1.${createHmac("sha256", deps.integrityKey)
    .update(
      `nurture.director-presenter-opaque-ref.v1\0${workspaceId}\0${kind}\0${value}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32)}`;

  const masked = (
    contextRef: string,
    reasonCode:
      | "access_changed"
      | "context_changed"
      | "ambiguous_institution"
      | "purpose_denied"
      | "protected_material_denied"
      | "refresh_not_retryable",
  ): unknown => ({
    status: "masked",
    context_ref: contextRef,
    masked_at: now().toISOString(),
    mask_signal: {
      kind: "mask",
      reason_code: reasonCode,
      purge_partition: true,
      content_masked: true,
      material_access_invalidated: true,
    },
  });

  const unavailable = (
    contextRef: string,
    reasonCode:
      | "content_unavailable"
      | "temporarily_unavailable"
      | "request_invalid"
      | "mobile_action_forbidden",
  ): unknown => ({
    status: "unavailable",
    context_ref: contextRef,
    failed_at: now().toISOString(),
    reason_code: reasonCode,
    retryable: reasonCode === "temporarily_unavailable",
  });

  const readyEnvelope = (
    request: DirectorPresenterIdentityV1,
    authority: DirectorPresenterExactAuthorityV1,
    operation: DirectorPresenterOperation,
    queryKey: string,
  ) => {
    const measuredAt = now();
    const resolvedAt = new Date(authority.resolved_at);
    const generatedAt = measuredAt < resolvedAt ? resolvedAt : measuredAt;
    const expiresAt = new Date(generatedAt.getTime() + RESPONSE_TTL_MS);
    return {
      status: "ready" as const,
      owner_resolution: publicResolution(authority),
      cache_partition: {
        partition_key: opaqueRef(
          request.workspace_id,
          "director_partition",
          `${request.my_chat_user_id}\0${authority.resolution_ref}\0${operation}\0${queryKey}`,
        ),
        interface_key: DIRECTOR_PRESENTER_INTERFACE.key,
        interface_version: DIRECTOR_PRESENTER_INTERFACE.version,
        contract_digest: DIRECTOR_PRESENTER_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        presentation_role: authority.presentation_role,
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        query_key: queryKey,
        expires_at: expiresAt.toISOString(),
      },
      generated_at: generatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    };
  };

  const drilldownRef = (
    workspaceId: string,
    authority: DirectorPresenterExactAuthorityV1,
    kind: DirectorDrilldownKindV1,
    localDate: string,
    expiresAt: string,
  ): string => encodeDrilldownRef(deps.integrityKey, workspaceId, {
    kind,
    local_date: localDate,
    resolution_ref: authority.resolution_ref,
    scope_version: authority.scope_version,
    expires_at: expiresAt,
  });

  const authorityResolver: DirectorPresenterAuthorityResolverV1 = {
    async resolve(input) {
      let context: DirectorContextReadV1;
      try {
        context = await deps.reads.loadDirectorContext({
          workspace_id: input.workspace_id,
          my_chat_user_id: input.my_chat_user_id,
          at: now(),
        });
      } catch {
        return {
          status: "closed",
          response: unavailable(input.context_ref, "temporarily_unavailable"),
        };
      }
      if (context.status !== "resolved") {
        return {
          status: "closed",
          response: masked(input.context_ref, context.status),
        };
      }
      const resolvedAt = now().toISOString();
      const facts = context.facts;
      const scopeVersion = Math.max(
        1,
        facts.participant_version,
        facts.role_version,
        facts.institution_version,
      );
      const authority: DirectorPresenterExactAuthorityV1 = Object.freeze({
        resolution_ref: opaqueRef(
          input.workspace_id,
          "director_resolution",
          [
            facts.participant_id,
            facts.participant_version,
            facts.role_assignment_id,
            facts.role_version,
            facts.institution_id,
            facts.institution_version,
            input.context_ref,
          ].join("\0"),
        ),
        presentation_role: "institution_director",
        scope_kind: "institution",
        scope_ref: opaqueRef(
          input.workspace_id,
          "care_institution",
          facts.institution_id,
        ),
        context_ref: input.context_ref,
        scope_version: scopeVersion,
        resolved_at: resolvedAt,
        exact: facts,
      });
      return { status: "resolved", owner_resolution: authority };
    },
  };

  const owner: DirectorPresenterOwnerV1 = {
    async overview({ request, authority }) {
      if (request.context_ref !== authority.context_ref) {
        return masked(request.context_ref, "context_changed");
      }
      let read: DirectorOwnerReadV1<DirectorOverviewFactsV1>;
      try {
        read = await deps.reads.loadOverviewFacts({
          workspace_id: request.workspace_id,
          authority,
          local_date: request.local_date,
          at: now(),
        });
      } catch {
        return unavailable(request.context_ref, "temporarily_unavailable");
      }
      if (read.status === "scope_changed") {
        return masked(request.context_ref, "access_changed");
      }
      if (read.status === "unavailable") {
        return unavailable(request.context_ref, "temporarily_unavailable");
      }

      const facts = read.value;
      const support = await loadClassLoadSupport(
        deps.supportSignals,
        request,
        authority,
        now,
      );
      const envelope = readyEnvelope(
        request,
        authority,
        "overview_query",
        request.local_date,
      );
      const expiresAt = envelope.expires_at;
      const sections = [
        ratioSection(
          "attendance",
          "到园情况",
          facts.attendance,
          "已到园人数 / 当前在册人数",
          "所选日期",
          (value) => value.present_count,
          (value) => value.roster_count,
          () => drilldownRef(
            request.workspace_id,
            authority,
            "attendance",
            request.local_date,
            expiresAt,
          ),
        ),
        countSection(
          "activity",
          "今日活动",
          facts.activity,
          "已归位的当日活动记录数",
          "所选日期",
          () => drilldownRef(
            request.workspace_id,
            authority,
            "activity",
            request.local_date,
            expiresAt,
          ),
        ),
        ratioSection(
          "message_response",
          "沟通响应",
          facts.message_response,
          "已响应 / 需要回复的沟通事项",
          "所选日期",
          (value) => value.responded_count,
          (value) => value.total_count,
          () => drilldownRef(
            request.workspace_id,
            authority,
            "message_response",
            request.local_date,
            expiresAt,
          ),
        ),
        flowSection(
          facts.home_kindergarten_flow,
          () => drilldownRef(
            request.workspace_id,
            authority,
            "home_kindergarten_flow",
            request.local_date,
            expiresAt,
          ),
        ),
        countSection(
          "authorization_changes",
          "授权变更",
          facts.authorization_changes,
          "当前园所范围内发生版本变化的授权数",
          "所选日期",
          () => drilldownRef(
            request.workspace_id,
            authority,
            "authorization_changes",
            request.local_date,
            expiresAt,
          ),
        ),
        unavailableSection("philosophy_observation", "理念与实践观察"),
        trendSection(facts.trend),
        classLoadSection(
          support,
          () => drilldownRef(
            request.workspace_id,
            authority,
            "class_load_attention",
            request.local_date,
            expiresAt,
          ),
        ),
        countSection(
          "family_focus_attention",
          "家庭新增关注点",
          facts.family_focus_attention,
          "新增家庭关注点所涉及的在园儿童数",
          "所选日期",
          () => drilldownRef(
            request.workspace_id,
            authority,
            "family_focus_attention",
            request.local_date,
            expiresAt,
          ),
        ),
        unavailableSection("organized_materials", "已整理素材"),
        {
          section_key: "operation_entry",
          status: "unavailable",
          title: "园所操作",
          summary: "请前往独立的 Web 工作台处理园所操作。",
          availability: "web_workbench_required",
        },
      ];
      const availableSections = sections.filter(
        (section) => section.status !== "unavailable",
      );
      const overallState = sections.some((section) => section.status === "unavailable")
        ? "partial"
        : availableSections.every((section) => section.status === "empty")
          ? "empty"
          : "ready";
      return {
        status: envelope.status,
        owner_resolution: envelope.owner_resolution,
        cache_partition: envelope.cache_partition,
        generated_at: envelope.generated_at,
        freshness: "fresh",
        overall_state: overallState,
        organization: {
          organization_ref: authority.scope_ref,
          display_name: facts.organization_display_name,
          local_date: request.local_date,
        },
        sections,
      };
    },

    async drilldown({ request, authority }) {
      if (request.context_ref !== authority.context_ref) {
        return masked(request.context_ref, "context_changed");
      }
      const target = decodeDrilldownRef(
        deps.integrityKey,
        request.workspace_id,
        request.drilldown_ref,
        authority,
        now(),
      );
      if (!target) return masked(request.context_ref, "context_changed");

      if (target.kind === "class_load_attention") {
        let current: boolean;
        try {
          current = await deps.reads.authorityIsCurrent({
            workspace_id: request.workspace_id,
            authority,
            at: now(),
          });
        } catch {
          return unavailable(request.context_ref, "temporarily_unavailable");
        }
        if (!current) return masked(request.context_ref, "access_changed");
        const support = await loadClassLoadSupport(
          deps.supportSignals,
          request,
          authority,
          now,
        );
        if (support.status === "unavailable") {
          return unavailable(request.context_ref, "content_unavailable");
        }
        const envelope = readyEnvelope(
          request,
          authority,
          "drilldown_query",
          request.drilldown_ref,
        );
        return {
          status: envelope.status,
          owner_resolution: envelope.owner_resolution,
          cache_partition: envelope.cache_partition,
          generated_at: envelope.generated_at,
          drilldown_ref: request.drilldown_ref,
          title: TITLE.class_load_attention,
          purpose_label: "只读支持信号，不用于人员评价",
          breadcrumbs: [{ label: "园所总览", level: "aggregate" }],
          items: support.signals.slice(0, MAX_DRILLDOWN_ITEMS).map((signal) => ({
            item_ref: opaqueRef(
              request.workspace_id,
              "director_support_signal",
              signal.sourceRef,
            ),
            kind: "class",
            label: "班级沟通负载关注",
            summary: signal.currentCount === undefined
              ? signal.safeReason
              : `${signal.safeReason}（当前 ${signal.currentCount} 项）`,
          })),
        };
      }

      let read: Awaited<ReturnType<DirectorPresenterReadPortV1["loadDrilldownFacts"]>>;
      try {
        read = await deps.reads.loadDrilldownFacts({
          workspace_id: request.workspace_id,
          authority,
          local_date: target.local_date,
          kind: target.kind,
          take: MAX_DRILLDOWN_ITEMS,
          at: now(),
        });
      } catch {
        return unavailable(request.context_ref, "temporarily_unavailable");
      }
      if (read.status === "scope_changed") {
        return masked(request.context_ref, "access_changed");
      }
      if (read.status === "unavailable") {
        return unavailable(request.context_ref, "content_unavailable");
      }
      const kind = target.kind;
      const envelope = readyEnvelope(
        request,
        authority,
        "drilldown_query",
        request.drilldown_ref,
      );
      return {
        status: envelope.status,
        owner_resolution: envelope.owner_resolution,
        cache_partition: envelope.cache_partition,
        generated_at: envelope.generated_at,
        drilldown_ref: request.drilldown_ref,
        title: TITLE[kind],
        purpose_label: "当前园所范围内的只读班级明细",
        breadcrumbs: [
          { label: read.value.organization_display_name, level: "aggregate" },
        ],
        items: read.value.rows.slice(0, MAX_DRILLDOWN_ITEMS).map((row) => ({
          item_ref: opaqueRef(
            request.workspace_id,
            "director_drilldown_item",
            `${kind}\0${target.local_date}\0${row.care_group_id}`,
          ),
          kind: "class",
          label: row.class_label,
          summary: drilldownSummary(kind, row),
        })),
      };
    },

    async materials({ request, authority }) {
      if (request.context_ref !== authority.context_ref) {
        return masked(request.context_ref, "context_changed");
      }
      try {
        if (!await deps.reads.authorityIsCurrent({
          workspace_id: request.workspace_id,
          authority,
          at: now(),
        })) {
          return masked(request.context_ref, "access_changed");
        }
      } catch {
        return unavailable(request.context_ref, "temporarily_unavailable");
      }
      return masked(request.context_ref, "protected_material_denied");
    },
  };

  return { authorityResolver, owner };
};

const unavailableSection = (sectionKey: string, title: string) => ({
  section_key: sectionKey,
  status: "unavailable" as const,
  title,
  availability: "not_available" as const,
});

const countSection = (
  sectionKey: string,
  title: string,
  source: DirectorSourceReadV1<Readonly<{ count: number }>>,
  definition: string,
  timeWindow: string,
  ref: () => string,
) => {
  if (source.status === "unavailable") return unavailableSection(sectionKey, title);
  if (!validCount(source.value.count)) return unavailableSection(sectionKey, title);
  if (source.value.count === 0) {
    return { section_key: sectionKey, status: "empty" as const, title };
  }
  return {
    section_key: sectionKey,
    status: "ready" as const,
    title,
    availability: "current" as const,
    metric: {
      primary_value: source.value.count,
      unit: "count" as const,
      definition,
      time_window_label: timeWindow,
    },
    drilldown_ref: ref(),
  };
};

const ratioSection = <T>(
  sectionKey: string,
  title: string,
  source: DirectorSourceReadV1<T>,
  definition: string,
  timeWindow: string,
  primary: (value: T) => number,
  secondary: (value: T) => number,
  ref: () => string,
) => {
  if (source.status === "unavailable") return unavailableSection(sectionKey, title);
  const numerator = primary(source.value);
  const denominator = secondary(source.value);
  if (
    !validCount(numerator)
    || !validCount(denominator)
    || numerator > denominator
  ) {
    return unavailableSection(sectionKey, title);
  }
  if (denominator === 0) {
    return { section_key: sectionKey, status: "empty" as const, title };
  }
  return {
    section_key: sectionKey,
    status: "ready" as const,
    title,
    availability: "current" as const,
    metric: {
      primary_value: numerator,
      secondary_value: denominator,
      unit: "ratio" as const,
      definition,
      time_window_label: timeWindow,
    },
    drilldown_ref: ref(),
  };
};

const flowSection = (
  source: DirectorOverviewFactsV1["home_kindergarten_flow"],
  ref: () => string,
) => {
  if (source.status === "unavailable") {
    return unavailableSection("home_kindergarten_flow", "家园信息流");
  }
  const primary = source.value.home_to_kindergarten_count;
  const secondary = source.value.kindergarten_to_home_count;
  if (!validCount(primary) || !validCount(secondary)) {
    return unavailableSection("home_kindergarten_flow", "家园信息流");
  }
  if (primary + secondary === 0) {
    return {
      section_key: "home_kindergarten_flow",
      status: "empty" as const,
      title: "家园信息流",
    };
  }
  return {
    section_key: "home_kindergarten_flow",
    status: "ready" as const,
    title: "家园信息流",
    availability: "current" as const,
    metric: {
      primary_value: primary,
      secondary_value: secondary,
      unit: "flow" as const,
      definition: "家庭到园所 / 园所到家庭的信息条数",
      time_window_label: "所选日期",
    },
    drilldown_ref: ref(),
  };
};

const trendSection = (source: DirectorOverviewFactsV1["trend"]) => {
  if (source.status === "unavailable") return unavailableSection("trend", "七日趋势");
  if (source.value.points.length !== 7 || !source.value.points.every(validCount)) {
    return unavailableSection("trend", "七日趋势");
  }
  if (source.value.points.every((point) => point === 0)) {
    return { section_key: "trend", status: "empty" as const, title: "七日趋势" };
  }
  return {
    section_key: "trend",
    status: "ready" as const,
    title: "七日趋势",
    availability: "current" as const,
    trend: {
      points: source.value.points,
      accessible_summary: `最近七天每天的园所沟通量依次为 ${source.value.points.join("、")}。`,
    },
  };
};

type ClassLoadSupport =
  | Readonly<{
      status: "current";
      signals: readonly Readonly<{
        sourceRef: string;
        safeReason: string;
        currentCount?: number;
      }>[];
    }>
  | Readonly<{ status: "unavailable" }>;

const loadClassLoadSupport = async (
  supportSignals: DirectorClassLoadSupportQueryV1 | undefined,
  request: DirectorPresenterIdentityV1,
  authority: DirectorPresenterExactAuthorityV1,
  now: () => Date,
): Promise<ClassLoadSupport> => {
  if (!supportSignals) return { status: "unavailable" };
  try {
    const decision = await supportSignals.compose({
      workspace_id: request.workspace_id,
      participant_ref: authority.exact.participant_id,
      role_assignment_ref: authority.exact.role_assignment_id,
      institution_ref: authority.exact.institution_id,
      snapshot_at: now().toISOString(),
    });
    return decision.status === "ok"
      ? {
          status: "current",
          signals: decision.output.signals.filter(
            (signal) => signal.category === "configured_load_threshold",
          ),
        }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
};

const classLoadSection = (
  support: ClassLoadSupport,
  ref: () => string,
) => {
  if (support.status === "unavailable") {
    return unavailableSection("class_load_attention", "班级沟通负载关注");
  }
  if (support.signals.length === 0) {
    return {
      section_key: "class_load_attention",
      status: "empty" as const,
      title: "班级沟通负载关注",
    };
  }
  return {
    section_key: "class_load_attention",
    status: "ready" as const,
    title: "班级沟通负载关注",
    summary: "仅用于支持情境，不用于评价或排序人员。",
    availability: "current" as const,
    metric: {
      primary_value: support.signals.length,
      unit: "count" as const,
      definition: "达到当前园所政策阈值的班级支持信号数",
      time_window_label: "当前政策窗口",
    },
    drilldown_ref: ref(),
  };
};

const drilldownSummary = (
  kind: Exclude<DirectorDrilldownKindV1, "class_load_attention">,
  row: DirectorDrilldownRowV1,
): string => {
  if (row.status === "unavailable") return "当前来源尚未完整提交。";
  if (!validCount(row.primary_value)) return "当前来源尚未完整提交。";
  if (
    (kind === "attendance" || kind === "message_response")
    && (
      row.secondary_value === undefined
      || !validCount(row.secondary_value)
      || row.primary_value > row.secondary_value
    )
  ) {
    return "当前来源尚未完整提交。";
  }
  if (
    kind === "home_kindergarten_flow"
    && (row.secondary_value === undefined || !validCount(row.secondary_value))
  ) {
    return "当前来源尚未完整提交。";
  }
  switch (kind) {
    case "attendance":
      return `${row.primary_value}/${row.secondary_value ?? 0} 人已到园。`;
    case "activity":
      return `${row.primary_value} 项当日活动记录。`;
    case "message_response":
      return `${row.primary_value}/${row.secondary_value ?? 0} 项需回复沟通已响应。`;
    case "home_kindergarten_flow":
      return `家庭到园所 ${row.primary_value} 条，园所到家庭 ${row.secondary_value ?? 0} 条。`;
    case "authorization_changes":
      return `${row.primary_value} 项授权发生版本变化。`;
    case "family_focus_attention":
      return `${row.primary_value} 个在园儿童关联新增家庭关注点。`;
  }
};

const encodeDrilldownRef = (
  key: string,
  workspaceId: string,
  payload: DrilldownRefPayload,
): string => {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signRef(key, workspaceId, encoded)}`;
};

const decodeDrilldownRef = (
  key: string,
  workspaceId: string,
  value: string,
  authority: DirectorPresenterExactAuthorityV1,
  at: Date,
): DrilldownRefPayload | null => {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra || !/^[0-9a-f]{64}$/.test(signature)) {
    return null;
  }
  const expected = Buffer.from(signRef(key, workspaceId, payload), "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as unknown;
    if (
      !isRecord(decoded)
      || !DRILLDOWN_KINDS.includes(decoded.kind as DirectorDrilldownKindV1)
      || typeof decoded.local_date !== "string"
      || decoded.resolution_ref !== authority.resolution_ref
      || decoded.scope_version !== authority.scope_version
      || typeof decoded.expires_at !== "string"
      || Number.isNaN(Date.parse(decoded.expires_at))
      || new Date(decoded.expires_at) <= at
    ) {
      return null;
    }
    return decoded as DrilldownRefPayload;
  } catch {
    return null;
  }
};

const signRef = (key: string, workspaceId: string, payload: string): string =>
  createHmac("sha256", key)
    .update(`nurture.director-presenter-ref.v1\0${workspaceId}\0${payload}`, "utf8")
    .digest("hex");

const validCount = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
