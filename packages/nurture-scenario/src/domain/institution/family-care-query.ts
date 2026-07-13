import type { NurtureResolvedContext } from "./institution-context.js";

export type ClassFamilyInboxItem = {
  item_id: string;
  child_care_process_id: string;
  child_display_name: string;
  category: string;
  urgency: string;
  status: string;
  safe_summary: string;
  requires_ack: boolean;
  requires_reply: boolean;
  version: number;
  updated_at: string;
};

export type TeacherAttentionCard = {
  attention_item_id: string;
  child_care_process_id: string;
  child_display_name: string;
  source_type: string;
  source_id?: string;
  safe_title: string;
  safe_summary?: string;
  priority: string;
  effective_date?: string;
  aggregate_version: number;
};

export type NurtureFamilyCareQueryRepository = {
  listClassFamilyInbox(input: {
    workspace_id: string;
    participant_id: string;
    role_assignment_id: string;
    care_group_id: string;
    limit: number;
  }): Promise<ClassFamilyInboxItem[]>;
  listTeacherAttentionBoard(input: {
    workspace_id: string;
    participant_id: string;
    role_assignment_id: string;
    care_group_id: string;
    on_date: string;
    limit: number;
  }): Promise<TeacherAttentionCard[]>;
};

export class NurtureFamilyCareQueryAccessError extends Error {
  constructor() {
    super("family care collection access denied");
    this.name = "NurtureFamilyCareQueryAccessError";
  }
}

export type InstitutionCollectionResult<T> =
  | { status: "ok"; items: T[]; safe_empty_state?: string }
  | {
      status: "blocked";
      reason_code: "role_missing" | "care_group_mismatch" | "query_unavailable";
    };

const collectionScope = (
  context: NurtureResolvedContext,
): { participant_id: string; role_assignment_id: string; care_group_id: string } | null => {
  if (
    !["caregiver", "lead_caregiver", "institution_admin"].includes(context.actor.role_kind) ||
    context.work_scope.kind !== "care_group" ||
    !context.work_scope.care_group_id
  ) {
    return null;
  }
  return {
    participant_id: context.actor.participant_id,
    role_assignment_id: context.actor.role_assignment_id,
    care_group_id: context.work_scope.care_group_id,
  };
};

const boundedLimit = (value: number | undefined): number =>
  typeof value === "number" && Number.isSafeInteger(value)
    ? Math.min(Math.max(value, 1), 100)
    : 50;

const validIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export class NurtureInstitutionWorkQueryService {
  constructor(private readonly repository: NurtureFamilyCareQueryRepository) {}

  async openClassFamilyInbox(input: {
    workspace_id: string;
    context: NurtureResolvedContext;
    limit?: number;
  }): Promise<InstitutionCollectionResult<ClassFamilyInboxItem>> {
    const scope = collectionScope(input.context);
    if (!scope) return { status: "blocked", reason_code: "care_group_mismatch" };
    try {
      const items = await this.repository.listClassFamilyInbox({
        workspace_id: input.workspace_id,
        ...scope,
        limit: boundedLimit(input.limit),
      });
      return {
        status: "ok",
        items,
        ...(items.length === 0 ? { safe_empty_state: "No current family-care work." } : {}),
      };
    } catch (error) {
      if (error instanceof NurtureFamilyCareQueryAccessError) {
        return { status: "blocked", reason_code: "role_missing" };
      }
      return { status: "blocked", reason_code: "query_unavailable" };
    }
  }

  async openTeacherAttentionBoard(input: {
    workspace_id: string;
    context: NurtureResolvedContext;
    on_date: string;
    limit?: number;
  }): Promise<InstitutionCollectionResult<TeacherAttentionCard>> {
    const scope = collectionScope(input.context);
    if (!scope) return { status: "blocked", reason_code: "care_group_mismatch" };
    if (!validIsoDate(input.on_date)) {
      return { status: "blocked", reason_code: "query_unavailable" };
    }
    try {
      const items = await this.repository.listTeacherAttentionBoard({
        workspace_id: input.workspace_id,
        ...scope,
        on_date: input.on_date,
        limit: boundedLimit(input.limit),
      });
      return {
        status: "ok",
        items,
        ...(items.length === 0 ? { safe_empty_state: "No current attention items." } : {}),
      };
    } catch (error) {
      if (error instanceof NurtureFamilyCareQueryAccessError) {
        return { status: "blocked", reason_code: "role_missing" };
      }
      return { status: "blocked", reason_code: "query_unavailable" };
    }
  }
}
