import type { DomainContextRef, WorkflowInternalApiRegistry } from "@my-chat/workflow-contracts";
import type { NurtureHandlerDeps } from "./deps.js";
import { NurtureInteractionContextService } from "./domain/interactions/interaction-context.js";
import {
  NurtureInstitutionWorkQueryService,
  type ClassFamilyInboxItem,
  type TeacherAttentionCard,
} from "./domain/institution/family-care-query.js";
import {
  NurtureInstitutionResolver,
  type NurtureStructuredInteraction,
} from "./domain/institution/institution-resolver.js";
import {
  NurtureUserAttentionService,
  type NurtureUserAttentionResolution,
} from "./domain/institution/user-attention-activation.js";

export type InstitutionSurfaceKey = "class_family_inbox" | "teacher_attention_board";

export type InstitutionSurfaceItem = {
  opaque_ref: string;
  safe_title: string;
  safe_summary?: string;
  badges: Array<{ key: string; label: string }>;
  requires_attention: boolean;
  aggregate_version: number;
};

export type InstitutionSurfaceResponse =
  | {
      status: "ready";
      view_key: InstitutionSurfaceKey;
      safe_title: string;
      safe_summary: string;
      safe_empty_state?: string;
      items: InstitutionSurfaceItem[];
    }
  | {
      status: "needs_clarification";
      view_key: InstitutionSurfaceKey;
      scenario_token: { token: string; purpose: "clarify"; expires_at: string };
      interaction: NurtureStructuredInteraction;
      safe_reason_code: string;
    }
  | {
      status: "unavailable";
      view_key: InstitutionSurfaceKey;
      safe_title: string;
      safe_summary: string;
      safe_reason_code: "access_changed" | "unavailable";
    };

export type InstitutionSurfaceReadInput = {
  view_key: InstitutionSurfaceKey;
  workspace_id: string;
  my_chat_user_id?: string;
  host_request_id: string;
  surface: string;
  on_date?: string;
  limit?: number;
  structured_clarification?: boolean;
};

const unavailable = (
  viewKey: InstitutionSurfaceKey,
  reasonCode: "access_changed" | "unavailable",
): InstitutionSurfaceResponse => ({
  status: "unavailable",
  view_key: viewKey,
  safe_title: viewKey === "class_family_inbox" ? "Class family inbox" : "Teacher attention board",
  safe_summary: "This care-group view is not currently available.",
  safe_reason_code: reasonCode,
});

const displayLabel = (value: string, labels: Record<string, string>): string =>
  labels[value] ?? "Current";

const presentInboxItem = (item: ClassFamilyInboxItem): InstitutionSurfaceItem => ({
  opaque_ref: `nurture:item:${item.item_id}`,
  safe_title: item.child_display_name,
  safe_summary: item.safe_summary,
  badges: [
    {
      key: "category",
      label: displayLabel(item.category, {
        question: "Question",
        request: "Request",
        reminder: "Reminder",
        update: "Update",
      }),
    },
    {
      key: "urgency",
      label: displayLabel(item.urgency, {
        normal: "Routine",
        today_attention: "Today",
        urgent: "Urgent",
      }),
    },
    {
      key: "state",
      label: displayLabel(item.status, {
        open: "Needs review",
        acknowledged: "Acknowledged",
        replied: "Replied",
        resolved: "Resolved",
      }),
    },
  ],
  requires_attention: item.requires_ack || item.requires_reply,
  aggregate_version: item.version,
});

const presentAttentionItem = (item: TeacherAttentionCard): InstitutionSurfaceItem => ({
  opaque_ref: `nurture:attention:${item.attention_item_id}`,
  safe_title: item.safe_title,
  ...(item.safe_summary ? { safe_summary: item.safe_summary } : {}),
  badges: [
    { key: "child", label: item.child_display_name },
    {
      key: "priority",
      label: displayLabel(item.priority, {
        routine: "Routine",
        attention: "Attention",
        urgent: "Urgent",
      }),
    },
    ...(item.effective_date ? [{ key: "effective_date", label: item.effective_date }] : []),
  ],
  requires_attention: true,
  aggregate_version: item.aggregate_version,
});

/**
 * Direct scenario owner-read path. It never trusts host-authored Nurture ids:
 * actor, role and care-group scope are resolved from current Nurture facts on
 * every read, and the repository rechecks enrollment/thread/grant/redaction.
 */
export const readInstitutionSurface = async (
  deps: NurtureHandlerDeps,
  input: InstitutionSurfaceReadInput,
): Promise<InstitutionSurfaceResponse> => {
  if (!deps.repositories.institution || !deps.repositories.familyCareQuery) {
    return unavailable(input.view_key, "unavailable");
  }

  const resolver = new NurtureInstitutionResolver(
    deps.repositories.institution,
    new NurtureInteractionContextService(deps.repositories.interactions),
    undefined,
    { issue_clarification: input.structured_clarification !== false },
  );
  const resolution = await resolver.resolve({
    host: {
      my_chat_user_id: input.my_chat_user_id ?? "",
      workspace_id: input.workspace_id,
      scenario_key: "nurture",
      surface: input.surface,
      host_request_id: input.host_request_id,
    },
    event: { kind: "surface_open" },
    display_state: { selected_view_key: input.view_key },
  });
  if (resolution.status === "needs_clarification") {
    return {
      status: "needs_clarification",
      view_key: input.view_key,
      scenario_token: resolution.scenario_token,
      interaction: resolution.interaction,
      safe_reason_code: resolution.safe_state.reason_code,
    };
  }
  if (resolution.status === "blocked") {
    return unavailable(input.view_key, resolution.safe_user_state);
  }

  const query = new NurtureInstitutionWorkQueryService(deps.repositories.familyCareQuery);
  if (input.view_key === "class_family_inbox") {
    const result = await query.openClassFamilyInbox({
      workspace_id: input.workspace_id,
      context: resolution.context,
      ...(input.limit !== undefined ? { limit: input.limit } : {}),
    });
    if (result.status === "blocked") {
      return unavailable(
        input.view_key,
        result.reason_code === "query_unavailable" ? "unavailable" : "access_changed",
      );
    }
    return {
      status: "ready",
      view_key: input.view_key,
      safe_title: "Class family inbox",
      safe_summary: `${result.items.length} current family-care item(s).`,
      ...(result.safe_empty_state ? { safe_empty_state: result.safe_empty_state } : {}),
      items: result.items.map(presentInboxItem),
    };
  }

  const result = await query.openTeacherAttentionBoard({
    workspace_id: input.workspace_id,
    context: resolution.context,
    on_date: input.on_date ?? new Date().toISOString().slice(0, 10),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  });
  if (result.status === "blocked") {
    return unavailable(
      input.view_key,
      result.reason_code === "query_unavailable" ? "unavailable" : "access_changed",
    );
  }
  return {
    status: "ready",
    view_key: input.view_key,
    safe_title: "Teacher attention board",
    safe_summary: `${result.items.length} current attention item(s).`,
    ...(result.safe_empty_state ? { safe_empty_state: result.safe_empty_state } : {}),
    items: result.items.map(presentAttentionItem),
  };
};

const readNumber = (payload: unknown, key: string): number | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
};

const readString = (payload: unknown, key: string): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

const readArray = (payload: unknown, key: string): unknown[] | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : undefined;
};

export const resolveNurtureUserAttention = async (
  deps: NurtureHandlerDeps,
  input: {
    workspace_id: string;
    source_context_refs: readonly DomainContextRef[];
    actor_user_id?: string;
  },
): Promise<NurtureUserAttentionResolution> => {
  if (!deps.repositories.userAttention) {
    return { status: "stopped", reason_code: "target_unavailable" };
  }
  return new NurtureUserAttentionService(deps.repositories.userAttention).resolve(input);
};

export const createInstitutionInternalApiHandlers = (
  deps: NurtureHandlerDeps,
): WorkflowInternalApiRegistry => ({
  "nurture.internal.open_class_family_inbox": (input) =>
    readInstitutionSurface(deps, {
      view_key: "class_family_inbox",
      workspace_id: input.meta.workspace_id,
      my_chat_user_id: input.meta.actor_id,
      host_request_id: input.meta.idempotency_key,
      surface: input.meta.client_surface,
      limit: readNumber(input.payload, "limit"),
    }),
  "nurture.internal.open_today_attention_board": (input) =>
    readInstitutionSurface(deps, {
      view_key: "teacher_attention_board",
      workspace_id: input.meta.workspace_id,
      my_chat_user_id: input.meta.actor_id,
      host_request_id: input.meta.idempotency_key,
      surface: input.meta.client_surface,
      on_date: readString(input.payload, "on_date"),
      limit: readNumber(input.payload, "limit"),
    }),
  "nurture.internal.resolve_user_attention": (input) => {
    const sourceRefs = readArray(input.payload, "source_context_refs");
    if (!sourceRefs) {
      return Promise.resolve({ status: "stopped", reason_code: "policy_blocked" });
    }
    return resolveNurtureUserAttention(deps, {
      workspace_id: input.meta.workspace_id,
      source_context_refs: sourceRefs as DomainContextRef[],
      ...(readString(input.payload, "actor_user_id")
        ? { actor_user_id: readString(input.payload, "actor_user_id")! }
        : {}),
    });
  },
});
