import { describe, expect, it } from "vitest";
import type {
  NurtureCommandInput,
  NurtureCommandResult,
  NurtureCommandTransaction,
} from "../src/domain/commands/command-kernel.js";
import type { G2MessageChangeFacts } from "../src/domain/institution/family-care-transaction.js";
import { NurtureInteractionContextService } from "../src/domain/interactions/interaction-context.js";
import { createInMemoryInteractionContextRepository } from "../src/domain/testing/in-memory-institution-ports.js";
import {
  createParentCommunicationExtensionService,
  type ParentCommunicationExtensionServiceDependenciesV1,
} from "../src/parent-communication-extension-service.js";
import type { ParentCommunicationResolvedAuthorityV1 } from "../src/parent-communication-owner-contract.js";
import { presentationVersionFor } from "../src/parent-communication-owner-service.js";
import {
  MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  type ParentContextSelectionV1,
} from "../src/parent-context-selection-contract.js";
import { createHmac } from "node:crypto";

const INTEGRITY_KEY = "parent-communication-extension-unit-key-01";
const WORKSPACE = "workspace-unit-01";
const USER = "user-unit-01";
const PARTICIPANT = "participant-unit-01";
const THREAD = "thread-unit-01";
const MESSAGE = "message-unit-0001";
const CONTEXT = "context:parent:unit:v1";

let clock = Date.parse("2026-08-15T09:00:00.000Z");
const now = () => new Date(clock);

const authority = (): ParentCommunicationResolvedAuthorityV1 =>
  ({
    participant_id: PARTICIPANT,
    participant_version: 1,
    guardian_role_assignment_id: "role-unit-01",
    guardian_role_version: 1,
    association_ref: "association-unit-01",
    association_version: 1,
    enrollment_ref: "enrollment-unit-01",
    enrollment_version: 1,
    care_group_ref: "care-group-unit-01",
    care_group_version: 1,
    institution_ref: "institution-unit-01",
    institution_version: 1,
    family_ref: "family-unit-01",
    family_version: 1,
    child_care_process_ref: "child-process-unit-01",
    child_care_process_version: 1,
    thread_ref: THREAD,
    thread_version: 1,
    membership_ref: "membership-unit-01",
    membership_version: 1,
    grant_ref: "grant-unit-01",
    grant_version: 1,
    context_version: "v1",
    resolution_ref: "resolution:parent:unit:v1",
    scope_ref: "scope:parent:unit",
    scope_version: 4,
    context_ref: CONTEXT,
  }) as ParentCommunicationResolvedAuthorityV1;

const messageRef = (request: {
  workspace_id: string;
  my_chat_user_id: string;
  context_ref: string;
}) =>
  createHmac("sha256", INTEGRITY_KEY)
    .update(
      `nurture.parent-communication-ref.v1\0${request.workspace_id}\0${request.my_chat_user_id}\0${request.context_ref}\0message\0${MESSAGE}`,
      "utf8",
    )
    .digest("hex");

const identity = (host: string) => ({
  workspace_id: WORKSPACE,
  my_chat_user_id: USER,
  host_request_id: host,
  context_ref: CONTEXT,
});

const contextSelection = (host: string): ParentContextSelectionV1 => ({
  interface_contract: MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  ...identity(host),
  context_version: "pcv1:unit",
  child_binding: {
    owner_ref: "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
    owner_version: 1,
  },
  family_binding: {
    owner_ref: "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
    owner_version: 1,
  },
});

const baseFacts = (): G2MessageChangeFacts =>
  ({
    participant_active: true,
    message_present: true,
    writer_contract: "harness_g2_v1",
    message_kind: "family_message",
    message_status: "sent",
    message_version: 3,
    exact_author: true,
    current_author_role_assignment_id: "role-unit-01",
    same_side_reachable: true,
    policy_actor_authorized: false,
    correction_head: 0,
    grant: {} as G2MessageChangeFacts["grant"],
  }) as G2MessageChangeFacts;

type Overrides = Partial<ParentCommunicationExtensionServiceDependenciesV1> & {
  facts?: G2MessageChangeFacts;
  presentationHead?: string;
  applyG2Redaction?: (input: Record<string, unknown>) => Promise<{
    message_ref: unknown;
    cascade_audit_ref: unknown;
    finalization: unknown;
  }>;
};

const worldOf = (overrides: Overrides = {}) => {
  const contextRepository = createInMemoryInteractionContextRepository();
  const interactionContexts = new NurtureInteractionContextService(
    contextRepository,
    undefined,
    now,
  );
  const facts = overrides.facts ?? baseFacts();
  const domainRef = (objectType: string, objectId: string) => ({
    schema_version: 1 as const,
    namespace: "nurture" as const,
    object_type: objectType,
    object_id: objectId,
    version: 1,
  });
  const applyG2Redaction =
    overrides.applyG2Redaction
    ?? (async () => ({
      message_ref: domainRef("family_care_message", MESSAGE),
      cascade_audit_ref: domainRef("cascade_audit", "audit-unit-01"),
      finalization: {
        cascade_audit_id: "audit-unit-01",
        root_message_id: MESSAGE,
        cascade_scope: "source_question",
        affected_refs: [domainRef("family_care_message", "reply-1")],
      },
    }));
  const familyCare = {
    loadG2MessageChangeFacts: async () => facts,
    applyG2Redaction,
    finalizeG2Redaction: async () => undefined,
  } as unknown as NonNullable<NurtureCommandTransaction["familyCare"]>;
  const transaction = {
    interactionContexts: contextRepository,
    familyCare,
  } as unknown as NurtureCommandTransaction;
  const calls: Array<NurtureCommandInput<unknown>> = [];
  const execute = async (
    input: NurtureCommandInput<unknown>,
  ): Promise<NurtureCommandResult> => {
    calls.push(input);
    const contextRecord = {
      workspace_id: input.workspace_id,
      business_actor_ref: input.business_actor_ref,
      command_request_id: input.command_request_id,
    };
    const decision = await input.spec.checkPreconditions(
      transaction,
      input.payload as never,
      contextRecord,
    );
    if (decision.status === "already_satisfied") {
      return {
        status: "ok",
        disposition: "executed",
        business_outcome: "already_satisfied",
        execution_ref: domainRef("command_execution", "execution-unit"),
        output_refs: decision.output_refs,
        handoff_request_snapshots: [],
        committed_result: decision.committed_result,
      };
    }
    if (decision.status !== "ready") {
      return {
        status: "not_committed",
        decision: decision.status,
        reason_code: decision.reason_code,
      };
    }
    const effect = await input.spec.apply(
      transaction,
      input.payload as never,
      contextRecord,
    );
    return {
      status: "ok",
      disposition: "executed",
      business_outcome: "applied",
      execution_ref: domainRef("command_execution", "execution-unit"),
      output_refs: effect.output_refs,
      handoff_request_snapshots: [],
      committed_result: effect.committed_result,
    };
  };
  const deps: ParentCommunicationExtensionServiceDependenciesV1 = {
    authority: { resolve: async () => ({ status: "resolved", authority: authority() }) },
    reads: {
      read: async () => ({
        status: "current",
        refreshed_at: now().toISOString(),
        unread_count: 0,
        presentation_head: overrides.presentationHead ?? "head-1",
        members: [],
        messages: [],
        has_more: false,
      }),
    },
    extensionReads: {
      listThreadMessageIds: async () => [MESSAGE, "message-unit-0002"],
      loadRedactionImpact: async () => ({
        affected_reply_count: 2,
        derived_record_present: true,
      }),
      loadDeliveryAggregate: async () => ({
        delivery_state: "read",
        advanced_at: "2026-08-15T08:59:00.000Z",
      }),
    },
    messageFacts: {
      loadG2MessageChangeFacts: async () => facts,
      loadG2WithdrawalFacts: async () => {
        throw new Error("withdrawal facts are not part of the extension");
      },
    },
    interactionContexts,
    commands: { execute: execute as ParentCommunicationExtensionServiceDependenciesV1["commands"]["execute"] },
    integrityKey: INTEGRITY_KEY,
    now,
    create_cascade_audit_id: () => "audit-unit-01",
    ...overrides,
  };
  return { deps, calls, binding: createParentCommunicationExtensionService(deps) };
};

const currentPresentation = () => presentationVersionFor(authority(), "head-1");

describe("W11 parent-communication extension owner service", () => {
  it("prepares the redaction preview with the typed impact and confirmation", async () => {
    const { binding } = worldOf();
    const request = {
      ...identity("host-preview-1"),
      message_ref: messageRef(identity("host-preview-1")),
      presentation_version: currentPresentation(),
      command_request_id: "command-unit-0001",
    };
    const response = (await binding.owner.redactionPreview({
      request,
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "ready_to_confirm",
      command_request_id: "command-unit-0001",
      presentation_version: currentPresentation(),
      preview: {
        message_ref: request.message_ref,
        cascade_scope: "source_question",
        affected_reply_count: 2,
        derived_record_present: true,
        effect: "redact_family_care_message_irreversibly",
      },
    });
    expect(String(response.prepared_preview_digest)).toMatch(/^sha256:[0-9a-f]{64}$/);
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.operation).toBe("redaction_preview_query");
    expect(cache.presentation_version).toBe(currentPresentation());
  });

  it("masks stale presentations, foreign messages and non-author redactions", async () => {
    const { binding } = worldOf();
    const stale = (await binding.owner.redactionPreview({
      request: {
        ...identity("host-preview-2"),
        message_ref: messageRef(identity("host-preview-2")),
        presentation_version: "pc-stale",
        command_request_id: "command-unit-0002",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(stale).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "context_changed" },
    });

    const foreign = (await binding.owner.redactionPreview({
      request: {
        ...identity("host-preview-3"),
        message_ref: "0".repeat(64),
        presentation_version: currentPresentation(),
        command_request_id: "command-unit-0003",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(foreign).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed" },
    });

    const notAuthor = worldOf({
      facts: { ...baseFacts(), exact_author: false },
    });
    const denied = (await notAuthor.binding.owner.redactionPreview({
      request: {
        ...identity("host-preview-4"),
        message_ref: messageRef(identity("host-preview-4")),
        presentation_version: currentPresentation(),
        command_request_id: "command-unit-0004",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(denied).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed" },
    });
  });

  it("commits the prepared redaction through the frozen spec with enriched evidence", async () => {
    const world = worldOf();
    const previewRequest = {
      ...identity("host-redact-1"),
      message_ref: messageRef(identity("host-redact-1")),
      presentation_version: currentPresentation(),
      command_request_id: "command-unit-0005",
    };
    const preview = (await world.binding.owner.redactionPreview({
      request: previewRequest,
      authority: {} as never,
    })) as Record<string, unknown>;
    const committed = (await world.binding.owner.redact({
      request: {
        ...previewRequest,
        host_request_id: "host-redact-2",
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: String(preview.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(committed).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      disposition: "applied",
      command_request_id: "command-unit-0005",
      message_ref: previewRequest.message_ref,
      // Exactly the count the preview promised — never the internal
      // cascade fan-out.
      cascade: { scope: "source_question", affected_count: 2 },
    });
    expect(typeof committed.redacted_at).toBe("string");
    const payload = world.calls[0]?.payload as Record<string, unknown>;
    expect(String(payload.confirmation_digest)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(String(payload.actor_binding_ref)).toMatch(/^[0-9a-f]{64}$/);

    // A second confirm with the consumed confirmation is foreign, never a
    // silent duplicate; exact same-command replays ride the ledger instead.
    const reused = (await world.binding.owner.redact({
      request: {
        ...previewRequest,
        host_request_id: "host-redact-3",
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: String(preview.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(reused).toMatchObject({
      status: "not_committed",
      reason_code: "confirmation_foreign",
      recovery: "re_prepare",
    });
  });

  it("refuses digest mismatches and expired confirmations with the frozen pairing", async () => {
    const world = worldOf();
    const previewRequest = {
      ...identity("host-redact-4"),
      message_ref: messageRef(identity("host-redact-4")),
      presentation_version: currentPresentation(),
      command_request_id: "command-unit-0006",
    };
    const preview = (await world.binding.owner.redactionPreview({
      request: previewRequest,
      authority: {} as never,
    })) as Record<string, unknown>;
    const mismatch = (await world.binding.owner.redact({
      request: {
        ...previewRequest,
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: `sha256:${"f".repeat(64)}`,
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(mismatch).toMatchObject({
      status: "not_committed",
      reason_code: "preview_digest_mismatch",
      recovery: "re_prepare",
    });

    // The refusal must not have burned the confirmation: the exact same
    // prepared commit still succeeds afterwards.
    const recovered = (await world.binding.owner.redact({
      request: {
        ...previewRequest,
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: String(preview.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(recovered).toMatchObject({ status: "committed", disposition: "applied" });

    const second = (await world.binding.owner.redactionPreview({
      request: { ...previewRequest, command_request_id: "command-unit-0008" },
      authority: {} as never,
    })) as Record<string, unknown>;
    clock += 6 * 60_000;
    const expired = (await world.binding.owner.redact({
      request: {
        ...previewRequest,
        command_request_id: "command-unit-0008",
        confirmation_ref: String(second.confirmation_ref),
        prepared_preview_digest: String(second.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(expired).toMatchObject({
      status: "not_committed",
      reason_code: "confirmation_expired",
      recovery: "re_prepare",
    });
    clock -= 6 * 60_000;
  });

  it("refuses a replayed command that names a different message", async () => {
    const { binding } = worldOf({
        commands: {
          execute: async () => ({
            status: "ok",
            disposition: "replayed",
            business_outcome: "applied",
            execution_ref: {
              schema_version: 1,
              namespace: "nurture",
              object_type: "command_execution",
              object_id: "execution-unit",
              version: 1,
            },
            output_refs: [],
            handoff_request_snapshots: [],
            committed_result: {
              redactedAt: "2026-08-15T08:00:00.000Z",
              cascadeScope: "source_question",
              affectedCount: 2,
              extensionMessageRef: "another-message-ref-recorded-earlier",
            },
          }),
        },
      });
    const previewRequest = {
      ...identity("host-redact-6"),
      message_ref: messageRef(identity("host-redact-6")),
      presentation_version: currentPresentation(),
      command_request_id: "command-unit-0009",
    };
    const preview = (await binding.owner.redactionPreview({
      request: previewRequest,
      authority: {} as never,
    })) as Record<string, unknown>;
    const divergent = (await binding.owner.redact({
      request: {
        ...previewRequest,
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: String(preview.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(divergent).toMatchObject({
      status: "not_committed",
      reason_code: "command_payload_conflict",
      recovery: "new_command",
    });
  });

  it("reports retryable ledger conflicts as temporarily unavailable", async () => {
    const { binding } = worldOf({
      commands: {
        execute: async () => ({
          status: "not_committed",
          decision: "conflict",
          reason_code: "command_write_conflict",
        }),
      },
    });
    const previewRequest = {
      ...identity("host-redact-7"),
      message_ref: messageRef(identity("host-redact-7")),
      presentation_version: currentPresentation(),
      command_request_id: "command-unit-0011",
    };
    const preview = (await binding.owner.redactionPreview({
      request: previewRequest,
      authority: {} as never,
    })) as Record<string, unknown>;
    const busy = (await binding.owner.redact({
      request: {
        ...previewRequest,
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: String(preview.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(busy).toMatchObject({
      status: "unavailable",
      reason_code: "temporarily_unavailable",
      retryable: true,
    });
  });

  it("answers already_satisfied without fabricating apply evidence", async () => {
    const world = worldOf({
      facts: {
        ...baseFacts(),
        message_status: "redacted",
        existing_redaction_refs: [
          {
            schema_version: 1,
            namespace: "nurture",
            object_type: "family_care_message",
            object_id: MESSAGE,
            version: 2,
          },
          {
            schema_version: 1,
            namespace: "nurture",
            object_type: "redaction_tombstone",
            object_id: "tombstone-unit-01",
            version: 1,
          },
        ],
      },
    });
    const previewRequest = {
      ...identity("host-redact-5"),
      message_ref: messageRef(identity("host-redact-5")),
      presentation_version: currentPresentation(),
      command_request_id: "command-unit-0007",
    };
    const preview = (await world.binding.owner.redactionPreview({
      request: previewRequest,
      authority: {} as never,
    })) as Record<string, unknown>;
    const satisfied = (await world.binding.owner.redact({
      request: {
        ...previewRequest,
        confirmation_ref: String(preview.confirmation_ref),
        prepared_preview_digest: String(preview.prepared_preview_digest),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(satisfied).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
      message_ref: previewRequest.message_ref,
    });
    expect(satisfied).not.toHaveProperty("redacted_at");
    expect(satisfied).not.toHaveProperty("cascade");
  });

  it("serves the delivery aggregate through the v1 envelope discipline", async () => {
    const { binding } = worldOf();
    const request = {
      ...identity("host-receipt-1"),
      message_ref: messageRef(identity("host-receipt-1")),
    };
    const response = (await binding.owner.deliveryReceipt({
      request,
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "ready",
      message_ref: request.message_ref,
      delivery: { delivery_state: "read", advanced_at: "2026-08-15T08:59:00.000Z" },
      presentation_version: currentPresentation(),
    });
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.operation).toBe("delivery_receipt_query");
    expect(JSON.stringify(response)).not.toContain("receipt_ref");
  });

  it("maps authority failures to the v1 boundary shapes", async () => {
    const unavailable = worldOf({
      authority: {
        resolve: async () => ({ status: "temporarily_unavailable" }),
      },
    });
    const outage = (await unavailable.binding.owner.deliveryReceipt({
      request: {
        ...identity("host-receipt-2"),
        message_ref: messageRef(identity("host-receipt-2")),
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(outage).toMatchObject({
      status: "unavailable",
      reason_code: "temporarily_unavailable",
      retryable: true,
    });

    const ambiguous = worldOf({
      authority: {
        resolve: async () => ({ status: "ambiguous_enrollment" }),
      },
    });
    const closed = (await ambiguous.binding.authorityResolver.resolve({
      ...identity("host-receipt-3"),
      operation: "delivery_receipt_query",
      message_ref: messageRef(identity("host-receipt-3")),
      context_selection: contextSelection("host-receipt-3"),
    })) as { status: string; response: Record<string, unknown> };
    expect(closed.status).toBe("closed");
    expect(closed.response).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "ambiguous_context" },
    });
  });
});
