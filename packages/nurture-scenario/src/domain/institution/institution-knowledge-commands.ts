import { createHash } from "node:crypto";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import {
  assertProtectedContentEnvelopeV1,
  type ProtectedContentEnvelopeV1,
  type ProtectedContentWritePort,
} from "../../harness/protected-content.js";
import {
  NurtureDeterministicRollback,
  canonicalJsonV1,
  type NurtureCommandExecutionRecord,
  type NurtureCommandSpec,
} from "../commands/command-kernel.js";
import {
  canonicalizeInstitutionKnowledgeCommand,
  decideInstitutionKnowledgeCommand,
  validateInstitutionKnowledgeCommand,
  type NurtureCreateInstitutionKnowledgeItemPayload,
  type NurtureCreateInstitutionKnowledgeRevisionPayload,
  type NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1,
  type NurtureInstitutionKnowledgeCommand,
  type NurtureInstitutionKnowledgeCommandFactsResult,
  type NurtureInstitutionKnowledgeDecision,
  type NurtureInstitutionKnowledgeItemV1,
  type NurtureInstitutionKnowledgeRevisionEventType,
  type NurtureInstitutionKnowledgeRevisionState,
  type NurtureInstitutionKnowledgeRevisionSummaryV1,
  type NurturePublishInstitutionKnowledgeRevisionPayload,
  type NurtureRecordInstitutionKnowledgeReviewPayload,
  type NurtureRevokeInstitutionKnowledgeRevisionPayload,
} from "./institution-knowledge-lifecycle.js";

type AuthoringRevisionDraft = {
  body_envelope: ProtectedContentEnvelopeV1;
  content_hash: string;
  intended_audiences: NurtureCreateInstitutionKnowledgeItemPayload["intended_audiences"];
  age_band_keys: string[];
  scenario_keys: string[];
  safety_class: NurtureCreateInstitutionKnowledgeItemPayload["safety_class"];
  valid_from?: string;
  valid_until?: string;
  verified_authority_links: NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1[];
};

type CommonMutation = {
  workspace_id: string;
  institution_ref: string;
  actor_participant_ref: string;
  actor_role_assignment_ref: string;
  expected_item_head: number;
  resulting_state: NurtureInstitutionKnowledgeRevisionState;
};

export type NurtureInstitutionKnowledgeMutation =
  | (CommonMutation & {
      kind: "create_item";
      category: NurtureCreateInstitutionKnowledgeItemPayload["category"];
      revision: AuthoringRevisionDraft;
    })
  | (CommonMutation & {
      kind: "create_revision";
      item_ref: string;
      revision_number: number;
      superseded_revision_ref?: string;
      revision: AuthoringRevisionDraft;
    })
  | (CommonMutation & {
      kind: "record_review";
      item_ref: string;
      revision_ref: string;
      decision: NurtureRecordInstitutionKnowledgeReviewPayload["decision"];
      reason_key: string;
    })
  | (CommonMutation & {
      kind: "publish_revision";
      item_ref: string;
      revision_ref: string;
      superseded_revision_ref?: string;
    })
  | (CommonMutation & {
      kind: "revoke_revision";
      item_ref: string;
      revision_ref: string;
      reason_key: string;
    });

export type NurtureInstitutionKnowledgeEventDraft = {
  workspace_id: string;
  institution_ref: string;
  item_ref: string;
  revision_ref: string;
  event_type: NurtureInstitutionKnowledgeRevisionEventType;
  item_head: number;
  event_ordinal: number;
  actor_participant_ref: string;
  actor_role_assignment_ref: string;
  reason_key: string;
  occurred_at: string;
};

export type NurtureInstitutionKnowledgeMutationResult =
  | { committed: false }
  | {
      committed: true;
      item: NurtureInstitutionKnowledgeItemV1;
      revision: NurtureInstitutionKnowledgeRevisionSummaryV1;
      revision_state: NurtureInstitutionKnowledgeRevisionState;
      event_drafts: NurtureInstitutionKnowledgeEventDraft[];
      occurred_at: string;
    };

export type NurtureInstitutionKnowledgeTransaction = {
  loadCommandFacts(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    item_ref?: string;
  }): Promise<NurtureInstitutionKnowledgeCommandFactsResult>;
  applyMutation(
    input: NurtureInstitutionKnowledgeMutation,
  ): Promise<NurtureInstitutionKnowledgeMutationResult>;
  appendEvents(input: {
    command_execution_id: string;
    events: NurtureInstitutionKnowledgeEventDraft[];
  }): Promise<void>;
};

export type NurtureInstitutionKnowledgeCommittedResultV1 = {
  item_ref: string;
  revision_ref: string;
  item_head: number;
  revision_number: number;
  revision_state: NurtureInstitutionKnowledgeRevisionState;
  committed_at: string;
};

type PayloadByAction = {
  create_institution_knowledge_item: NurtureCreateInstitutionKnowledgeItemPayload;
  create_institution_knowledge_revision: NurtureCreateInstitutionKnowledgeRevisionPayload;
  record_institution_knowledge_review: NurtureRecordInstitutionKnowledgeReviewPayload;
  publish_institution_knowledge_revision: NurturePublishInstitutionKnowledgeRevisionPayload;
  revoke_institution_knowledge_revision: NurtureRevokeInstitutionKnowledgeRevisionPayload;
};

type KnowledgeAction = keyof PayloadByAction;

const commandOf = <Action extends KnowledgeAction>(
  action: Action,
  payload: PayloadByAction[Action],
): Extract<NurtureInstitutionKnowledgeCommand, { action: Action }> =>
  ({ action, ...payload }) as unknown as Extract<
    NurtureInstitutionKnowledgeCommand,
    { action: Action }
  >;

const itemRef = (item: NurtureInstitutionKnowledgeItemV1): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: "institution_knowledge_item",
  object_id: item.item_ref,
  version: item.item_head,
});

const revisionRef = (revision: NurtureInstitutionKnowledgeRevisionSummaryV1): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: "institution_knowledge_revision",
  object_id: revision.revision_ref,
  version: revision.revision_number,
});

const mapDecision = (decision: NurtureInstitutionKnowledgeDecision) => {
  if (decision.status === "ready") return { status: "ready" as const };
  if (decision.status === "unavailable") {
    return { status: "blocked" as const, reason_code: decision.reason_code };
  }
  if (decision.layer === "concurrency" || decision.layer === "state") {
    return { status: "conflict" as const, reason_code: decision.reason_code };
  }
  return {
    status: decision.layer === "authority" ? ("blocked" as const) : ("invalid" as const),
    reason_code: decision.reason_code,
  };
};

const itemRefFrom = (command: NurtureInstitutionKnowledgeCommand): string | undefined =>
  command.action === "create_institution_knowledge_item" ? undefined : command.item_ref;

const loadFacts = (input: {
  owner: NurtureInstitutionKnowledgeTransaction;
  command: NurtureInstitutionKnowledgeCommand;
  participant_ref: string;
}) =>
  input.owner.loadCommandFacts({
    workspace_id: input.command.workspace_id,
    institution_ref: input.command.institution_ref,
    participant_ref: input.participant_ref,
    role_assignment_ref: input.command.role_assignment_ref,
    ...(itemRefFrom(input.command) ? { item_ref: itemRefFrom(input.command) } : {}),
  });

const contentHash = (body: NurtureCreateInstitutionKnowledgeItemPayload["body"]): string =>
  createHash("sha256").update(canonicalJsonV1(body), "utf8").digest("hex");

const revisionDraft = (input: {
  payload: NurtureCreateInstitutionKnowledgeItemPayload | NurtureCreateInstitutionKnowledgeRevisionPayload;
  protected_content?: Pick<ProtectedContentWritePort, "seal">;
}): AuthoringRevisionDraft => {
  let bodyEnvelope: ProtectedContentEnvelopeV1;
  try {
    bodyEnvelope = assertProtectedContentEnvelopeV1(
      input.protected_content?.seal(canonicalJsonV1(input.payload.body)),
    );
  } catch {
    throw new NurtureDeterministicRollback(
      "protected_content_unavailable",
      "technical_error",
    );
  }
  return {
    body_envelope: bodyEnvelope,
    content_hash: contentHash(input.payload.body),
    intended_audiences: [...input.payload.intended_audiences].sort(),
    age_band_keys: [...(input.payload.age_band_keys ?? [])].sort(),
    scenario_keys: [...(input.payload.scenario_keys ?? [])].sort(),
    safety_class: input.payload.safety_class,
    ...(input.payload.valid_from ? { valid_from: input.payload.valid_from } : {}),
    ...(input.payload.valid_until ? { valid_until: input.payload.valid_until } : {}),
    verified_authority_links: [...(input.payload.verified_authority_links ?? [])],
  };
};

const mutationOf = (input: {
  command: NurtureInstitutionKnowledgeCommand;
  decision: Extract<NurtureInstitutionKnowledgeDecision, { status: "ready" }>;
  actor_participant_ref: string;
  protected_content?: Pick<ProtectedContentWritePort, "seal">;
}): NurtureInstitutionKnowledgeMutation => {
  const common = {
    workspace_id: input.command.workspace_id,
    institution_ref: input.command.institution_ref,
    actor_participant_ref: input.actor_participant_ref,
    actor_role_assignment_ref: input.command.role_assignment_ref,
    expected_item_head:
      input.command.action === "create_institution_knowledge_item"
        ? 0
        : input.command.expected_item_head,
    resulting_state: input.decision.resulting_state,
  };
  switch (input.command.action) {
    case "create_institution_knowledge_item":
      return {
        ...common,
        kind: "create_item",
        category: input.command.category,
        revision: revisionDraft({
          payload: input.command,
          protected_content: input.protected_content,
        }),
      };
    case "create_institution_knowledge_revision":
      return {
        ...common,
        kind: "create_revision",
        item_ref: input.command.item_ref,
        revision_number: input.decision.revision_number,
        ...(input.decision.superseded_revision_ref
          ? { superseded_revision_ref: input.decision.superseded_revision_ref }
          : {}),
        revision: revisionDraft({
          payload: input.command,
          protected_content: input.protected_content,
        }),
      };
    case "record_institution_knowledge_review":
      return {
        ...common,
        kind: "record_review",
        item_ref: input.command.item_ref,
        revision_ref: input.command.revision_ref,
        decision: input.command.decision,
        reason_key: input.command.reason_key,
      };
    case "publish_institution_knowledge_revision":
      return {
        ...common,
        kind: "publish_revision",
        item_ref: input.command.item_ref,
        revision_ref: input.command.revision_ref,
        ...(input.decision.superseded_revision_ref
          ? { superseded_revision_ref: input.decision.superseded_revision_ref }
          : {}),
      };
    case "revoke_institution_knowledge_revision":
      return {
        ...common,
        kind: "revoke_revision",
        item_ref: input.command.item_ref,
        revision_ref: input.command.revision_ref,
        reason_key: input.command.reason_key,
      };
  }
};

const isFinalizationPayload = (
  value: unknown,
): value is { events: NurtureInstitutionKnowledgeEventDraft[] } =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Array.isArray((value as { events?: unknown }).events);

const appendEventsAfterExecution = async (input: {
  owner: NurtureInstitutionKnowledgeTransaction | undefined;
  execution: NurtureCommandExecutionRecord;
  finalization_payload: unknown;
}): Promise<void> => {
  if (!input.owner || !isFinalizationPayload(input.finalization_payload)) {
    throw new NurtureDeterministicRollback(
      "institution_knowledge_finalization_unavailable",
      "technical_error",
    );
  }
  await input.owner.appendEvents({
    command_execution_id: input.execution.id,
    events: input.finalization_payload.events,
  });
};

const knowledgeSpec = <Action extends KnowledgeAction>(input: {
  action: Action;
  protected_content?: Pick<ProtectedContentWritePort, "seal">;
}): NurtureCommandSpec<PayloadByAction[Action]> => ({
  command_key: `nurture.${input.action}`,
  command_scope: "institution_knowledge",
  contract_version: 1,
  canonicalize(payload) {
    return canonicalizeInstitutionKnowledgeCommand(commandOf(input.action, payload));
  },
  async checkPreconditions(transaction, payload, context) {
    const owner = transaction.institutionKnowledge;
    if (!owner) {
      return { status: "blocked", reason_code: "institution_knowledge_owner_unavailable" };
    }
    const command = commandOf(input.action, payload);
    if (
      command.workspace_id !== context.workspace_id ||
      validateInstitutionKnowledgeCommand(command).status !== "valid"
    ) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const result = await loadFacts({
      owner,
      command,
      participant_ref: context.business_actor_ref,
    });
    if (result.status === "denied") {
      return { status: "blocked", reason_code: result.reason_code };
    }
    if (result.status === "unavailable") {
      return { status: "blocked", reason_code: result.reason_code };
    }
    return mapDecision(decideInstitutionKnowledgeCommand({ command, facts: result.facts }));
  },
  async apply(transaction, payload, context) {
    const owner = transaction.institutionKnowledge;
    if (!owner) {
      throw new NurtureDeterministicRollback(
        "institution_knowledge_owner_unavailable",
        "technical_error",
      );
    }
    const command = commandOf(input.action, payload);
    const result = await loadFacts({
      owner,
      command,
      participant_ref: context.business_actor_ref,
    });
    if (result.status !== "resolved") {
      throw new NurtureDeterministicRollback(
        result.reason_code,
        result.status === "denied" ? "blocked" : "technical_error",
      );
    }
    const decision = decideInstitutionKnowledgeCommand({ command, facts: result.facts });
    if (decision.status !== "ready") {
      if (decision.status === "unavailable") {
        throw new NurtureDeterministicRollback(decision.reason_code, "technical_error");
      }
      throw new NurtureDeterministicRollback(
        decision.reason_code,
        decision.layer === "authority"
          ? "blocked"
          : decision.layer === "contract"
            ? "invalid"
            : "conflict",
      );
    }
    const committed = await owner.applyMutation(
      mutationOf({
        command,
        decision,
        actor_participant_ref: result.facts.actor_participant_ref,
        protected_content: input.protected_content,
      }),
    );
    if (!committed.committed) {
      throw new NurtureDeterministicRollback("item_head_conflict", "conflict");
    }
    const committedResult: NurtureInstitutionKnowledgeCommittedResultV1 = {
      item_ref: committed.item.item_ref,
      revision_ref: committed.revision.revision_ref,
      item_head: committed.item.item_head,
      revision_number: committed.revision.revision_number,
      revision_state: committed.revision_state,
      committed_at: committed.occurred_at,
    };
    return {
      output_refs: [itemRef(committed.item), revisionRef(committed.revision)],
      result_schema_version: 1,
      committed_result: committedResult,
      finalization_payload: { events: committed.event_drafts },
    };
  },
  afterExecutionCreated(transaction, _payload, _context, applied) {
    return appendEventsAfterExecution({
      owner: transaction.institutionKnowledge,
      execution: applied.execution,
      finalization_payload: applied.finalization_payload,
    });
  },
});

export const createInstitutionKnowledgeCommandSpecs = (input: {
  protected_content?: Pick<ProtectedContentWritePort, "seal">;
} = {}) => ({
  createInstitutionKnowledgeItem: knowledgeSpec({
    action: "create_institution_knowledge_item",
    protected_content: input.protected_content,
  }),
  createInstitutionKnowledgeRevision: knowledgeSpec({
    action: "create_institution_knowledge_revision",
    protected_content: input.protected_content,
  }),
  recordInstitutionKnowledgeReview: knowledgeSpec({
    action: "record_institution_knowledge_review",
    protected_content: input.protected_content,
  }),
  publishInstitutionKnowledgeRevision: knowledgeSpec({
    action: "publish_institution_knowledge_revision",
    protected_content: input.protected_content,
  }),
  revokeInstitutionKnowledgeRevision: knowledgeSpec({
    action: "revoke_institution_knowledge_revision",
    protected_content: input.protected_content,
  }),
});
