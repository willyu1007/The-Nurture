import { createHmac } from "node:crypto";
import type {
  NurtureCommandInput,
  NurtureCommandResult,
} from "./domain/commands/command-kernel.js";
import { issueBoardOpaqueRef } from "./harness/board-projection.js";
import type { CaregiverDailyCareEligibilityReadPort } from "./harness/board-mutations.js";
import {
  createConfirmChildMediaAttributionSpec,
  createRejectChildMediaAttributionSpec,
  type ChildAttributionCommandV1,
  type MediaAttributionFactsV1,
} from "./harness/media-attribution.js";
import {
  canonicalizeDiscardMediaAssetCommand,
  createDiscardMediaAssetSpec,
  type DiscardMediaAssetCommandV1,
} from "./harness/publication-safety.js";
import {
  TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE,
  type TeacherMediaAssociationOwnerOperation,
} from "./teacher-media-association-owner-contract.js";
import type {
  TeacherCaregiverContextV1,
  TeacherClassFactsV1,
} from "./teacher-class-stream-service.js";

/**
 * W9 real-owner service for `nurture.teacher-media-association-owner@1.0.0`
 * — association-only over the frozen G3-C1 attribution machinery. Reads
 * follow the W6 discipline; the two exchanges run on the generic command
 * ledger with the W7 actor HMAC. Media refs resolve over the class's full
 * asset set (terminal states included) so exact replays stay resolvable
 * after a decision or discard — the W8 lesson applied up front.
 */

const RESPONSE_TTL_MS = 300_000;
const MAX_ASSETS = 50;
const MAX_CHILDREN = 80;
const COUNT_CAP = 999;
const TALLY_CAP = 99;

type CaregiverRole = "caregiver" | "lead_caregiver";

type BaseRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  class_ref: string;
}>;

export type TeacherMediaAssociationUnassociatedRequest = BaseRequestV1;
export type TeacherMediaAssociationAssociationRequest = BaseRequestV1 &
  Readonly<{ media_ref: string }>;
export type TeacherMediaAssociationAssociateRequest = BaseRequestV1 &
  Readonly<{
    media_ref: string;
    child_ref: string;
    command_request_id: string;
    decision: "confirm" | "reject";
    expected_attribution_revision: number;
    expected_media_revision: number;
  }>;
export type TeacherMediaAssociationDiscardRequest = BaseRequestV1 &
  Readonly<{ media_ref: string; command_request_id: string }>;

export type TeacherMediaAssociationResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: CaregiverRole;
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

export type TeacherMediaAssociationAuthorityDecisionV1 =
  | Readonly<{ status: "resolved"; owner_resolution: TeacherMediaAssociationResolutionV1 }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface TeacherMediaAssociationAuthorityPortV1 {
  resolve(
    input: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      host_request_id: string;
      context_ref: string;
      operation: TeacherMediaAssociationOwnerOperation;
      class_ref: string;
    }>,
  ): Promise<TeacherMediaAssociationAuthorityDecisionV1>;
}

export interface TeacherMediaAssociationOwnerPortV1 {
  unassociated(input: Readonly<{
    request: TeacherMediaAssociationUnassociatedRequest;
    authority: TeacherMediaAssociationResolutionV1;
  }>): Promise<unknown>;
  association(input: Readonly<{
    request: TeacherMediaAssociationAssociationRequest;
    authority: TeacherMediaAssociationResolutionV1;
  }>): Promise<unknown>;
  associate(input: Readonly<{
    request: TeacherMediaAssociationAssociateRequest;
    authority: TeacherMediaAssociationResolutionV1;
  }>): Promise<unknown>;
  discard(input: Readonly<{
    request: TeacherMediaAssociationDiscardRequest;
    authority: TeacherMediaAssociationResolutionV1;
  }>): Promise<unknown>;
}

export type TeacherMediaAssociationOwnerServiceBindingV1 = Readonly<{
  authorityResolver: TeacherMediaAssociationAuthorityPortV1;
  owner: TeacherMediaAssociationOwnerPortV1;
}>;

// ---------------------------------------------------------------------------
// Owner-internal read facts.

export interface TeacherMediaAssociationContextReadPortV1 {
  loadCaregiverContext(input: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }>): Promise<TeacherCaregiverContextV1 | null>;
}

export type TeacherMediaAssetDisplayV1 = Readonly<{
  media_asset_id: string;
  safe_title?: string;
  captured_at?: string;
}>;

export interface TeacherMediaAssociationReadPortV1 {
  /** The actor's currently attributable assets (the G3-C1 set). */
  listAttributableMediaIds(input: Readonly<{
    workspace_id: string;
    participant_id: string;
  }>): Promise<readonly string[]>;
  /**
   * Resolution candidates: every asset of the exact CareGroup regardless of
   * lifecycle, so a ref stays resolvable after a decision or discard.
   */
  listClassMediaIds(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
  }>): Promise<readonly string[]>;
  loadMediaAttributionFacts(input: Readonly<{
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }>): Promise<MediaAttributionFactsV1 | null>;
  loadAssetDisplay(input: Readonly<{
    workspace_id: string;
    media_asset_ids: readonly string[];
  }>): Promise<readonly TeacherMediaAssetDisplayV1[]>;
  /** The discard payload heads, read fresh before the command. */
  loadDiscardHeads(input: Readonly<{
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }>): Promise<Readonly<{
    media_revision: number;
    referencing_draft_count: number;
  }> | null>;
}

export type TeacherMediaAssociationCommandRunnerV1 = Readonly<{
  execute<Input>(input: NurtureCommandInput<Input>): Promise<NurtureCommandResult>;
}>;

export type TeacherMediaAssociationOwnerServiceDependenciesV1 = Readonly<{
  contextReads: TeacherMediaAssociationContextReadPortV1;
  mediaReads: TeacherMediaAssociationReadPortV1;
  childOptions: CaregiverDailyCareEligibilityReadPort;
  commands: TeacherMediaAssociationCommandRunnerV1;
  integrityKey: string;
  now?: () => Date;
}>;

// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const createTeacherMediaAssociationOwnerService = (
  deps: TeacherMediaAssociationOwnerServiceDependenciesV1,
): TeacherMediaAssociationOwnerServiceBindingV1 => {
  const now = deps.now ?? (() => new Date());
  if (deps.integrityKey.length < 32) {
    throw new Error(
      "Teacher media-association integrity key must be at least 32 characters",
    );
  }

  const scopeOf = (workspaceId: string) => ({ workspace_id: workspaceId });
  const refOf = (workspaceId: string, kind: string, id: string): string =>
    issueBoardOpaqueRef(deps.integrityKey, scopeOf(workspaceId), kind, id);
  const classRefOf = (workspaceId: string, careGroupId: string): string =>
    refOf(workspaceId, "care_group", careGroupId);
  const mediaRefOf = (workspaceId: string, mediaAssetId: string): string =>
    refOf(workspaceId, "media_asset", mediaAssetId);
  const childRefOf = (workspaceId: string, childCareProcessId: string): string =>
    refOf(workspaceId, "child_care_process", childCareProcessId);
  const actorBindingOf = (workspaceId: string, participantId: string): string =>
    createHmac("sha256", deps.integrityKey)
      .update(
        `nurture.teacher-media-association-actor.v1\0${workspaceId}\0${participantId}`,
        "utf8",
      )
      .digest("hex");

  const masked = (
    contextRef: string,
    reason: "access_changed" | "context_changed" | "refresh_not_retryable",
  ): unknown => ({
    status: "masked",
    context_ref: contextRef,
    masked_at: now().toISOString(),
    mask_signal: {
      kind: "mask",
      reason_code: reason,
      purge_partition: true,
      content_masked: true,
    },
  });

  const unavailable = (
    contextRef: string,
    reason: "content_unavailable" | "temporarily_unavailable" | "request_invalid",
  ): unknown => ({
    status: "unavailable",
    context_ref: contextRef,
    failed_at: now().toISOString(),
    reason_code: reason,
    retryable: reason === "temporarily_unavailable",
  });

  const outcomeUnknown = (contextRef: string, commandRequestId: string): unknown => ({
    status: "outcome_unknown",
    context_ref: contextRef,
    command_request_id: commandRequestId,
    recovery: "reconcile_same_command",
  });

  const notCommitted = (
    request: Readonly<{ context_ref: string; command_request_id: string }>,
    reason: string,
  ): unknown => ({
    status: "not_committed",
    context_ref: request.context_ref,
    command_request_id: request.command_request_id,
    reason_code: reason,
  });

  const findByClassRef = (
    workspaceId: string,
    context: TeacherCaregiverContextV1,
    classRef: string,
  ): TeacherClassFactsV1 | undefined =>
    context.classes.find(
      (entry) => classRefOf(workspaceId, entry.care_group_id) === classRef,
    );

  const loadContext = (request: BaseRequestV1) =>
    deps.contextReads.loadCaregiverContext({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      at: now(),
    });

  const classResolution = (
    request: BaseRequestV1,
    entry: TeacherClassFactsV1,
    resolvedAt: string,
  ): TeacherMediaAssociationResolutionV1 => {
    const scopeVersion = Math.max(1, entry.role_version, entry.care_group_version);
    return Object.freeze({
      resolution_ref: refOf(
        request.workspace_id,
        "resolution",
        `media-association:${entry.care_group_id}:${scopeVersion}`,
      ),
      presentation_role: entry.role,
      scope_kind: "care_group" as const,
      scope_ref: request.class_ref,
      context_ref: request.context_ref,
      scope_version: scopeVersion,
      resolved_at: resolvedAt,
    });
  };

  const readyEnvelope = (
    request: BaseRequestV1,
    authority: TeacherMediaAssociationResolutionV1,
    operation: "unassociated_query" | "association_query",
    queryKey: string,
  ) => {
    const generatedAt = now();
    return {
      status: "ready" as const,
      owner_resolution: authority,
      cache_partition: {
        partition_key: refOf(
          request.workspace_id,
          "partition",
          `${operation}\0${request.my_chat_user_id}\0${authority.resolution_ref}\0${queryKey}`,
        ),
        interface_key: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.key,
        interface_version: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.version,
        contract_digest: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        presentation_role: authority.presentation_role,
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        query_key: queryKey,
        expires_at: new Date(generatedAt.getTime() + RESPONSE_TTL_MS).toISOString(),
      },
      generated_at: generatedAt.toISOString(),
      freshness: {
        resolved_at: authority.resolved_at,
        source: "current_owner_read" as const,
      },
    };
  };

  const authorityResolver: TeacherMediaAssociationAuthorityPortV1 = {
    async resolve(input) {
      let context: TeacherCaregiverContextV1 | null;
      try {
        context = await deps.contextReads.loadCaregiverContext({
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
      const entry = context
        ? findByClassRef(input.workspace_id, context, input.class_ref)
        : undefined;
      if (!entry) {
        return {
          status: "closed",
          response: masked(input.context_ref, "access_changed"),
        };
      }
      return {
        status: "resolved",
        owner_resolution: classResolution(input, entry, now().toISOString()),
      };
    },
  };

  type Membership = Readonly<{
    context: TeacherCaregiverContextV1;
    entry: TeacherClassFactsV1;
  }>;

  const resolveMembership = async (
    request: BaseRequestV1,
  ): Promise<Membership | null> => {
    const context = await loadContext(request);
    if (!context) return null;
    const entry = findByClassRef(request.workspace_id, context, request.class_ref);
    return entry ? { context, entry } : null;
  };

  const resolveMediaId = async (
    request: BaseRequestV1 & Readonly<{ media_ref: string }>,
    membership: Membership,
  ): Promise<string | null> => {
    const ids = await deps.mediaReads.listClassMediaIds({
      workspace_id: request.workspace_id,
      care_group_id: membership.entry.care_group_id,
    });
    return (
      ids.find(
        (id) => mediaRefOf(request.workspace_id, id) === request.media_ref,
      ) ?? null
    );
  };

  const attributionEntryOf = (
    workspaceId: string,
    fact: Readonly<{
      child_care_process_id: string;
      status: "candidate" | "confirmed" | "rejected" | "superseded";
      revision: number;
      decided_at?: string;
    }>,
  ) => ({
    child_ref: childRefOf(workspaceId, fact.child_care_process_id),
    state: fact.status,
    revision: Math.max(1, fact.revision),
    ...(fact.status !== "candidate" && fact.decided_at
      ? { decided_at: fact.decided_at }
      : {}),
  });

  const owner: TeacherMediaAssociationOwnerPortV1 = {
    async unassociated({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const participantId = membership.context.participant_id;
      const ids = await deps.mediaReads.listAttributableMediaIds({
        workspace_id: request.workspace_id,
        participant_id: participantId,
      });
      const needing: Array<{
        media_asset_id: string;
        lifecycle: "ready" | "unavailable";
        media_revision: number;
        candidate_count: number;
        confirmed_count: number;
      }> = [];
      for (const id of ids) {
        const facts = await deps.mediaReads.loadMediaAttributionFacts({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          media_asset_id: id,
        });
        if (!facts) continue;
        if (facts.media_lifecycle !== "ready" && facts.media_lifecycle !== "unavailable") {
          continue;
        }
        const confirmed = facts.attributions.filter(
          (attribution) => attribution.status === "confirmed",
        ).length;
        if (confirmed > 0) continue;
        needing.push({
          media_asset_id: id,
          lifecycle: facts.media_lifecycle,
          media_revision: Math.max(1, facts.media_revision),
          candidate_count: Math.min(
            facts.attributions.filter((a) => a.status === "candidate").length,
            TALLY_CAP,
          ),
          confirmed_count: Math.min(confirmed, TALLY_CAP),
        });
      }
      const page = needing.slice(0, MAX_ASSETS);
      const display = new Map(
        (
          await deps.mediaReads.loadAssetDisplay({
            workspace_id: request.workspace_id,
            media_asset_ids: page.map((asset) => asset.media_asset_id),
          })
        ).map((row) => [row.media_asset_id, row] as const),
      );
      const eligibility =
        await deps.childOptions.resolveCaregiverDailyCareEligibility({
          workspace_id: request.workspace_id,
          participant_id: participantId,
        });
      return {
        ...readyEnvelope(request, authority, "unassociated_query", request.class_ref),
        unassociated_count: Math.min(needing.length, COUNT_CAP),
        assets: page.map((asset) => {
          const row = display.get(asset.media_asset_id);
          return {
            media_ref: mediaRefOf(request.workspace_id, asset.media_asset_id),
            ...(row?.safe_title ? { safe_title: row.safe_title.slice(0, 120) } : {}),
            ...(row?.captured_at ? { captured_at: row.captured_at } : {}),
            lifecycle: asset.lifecycle,
            media_revision: asset.media_revision,
            candidate_count: asset.candidate_count,
            confirmed_count: asset.confirmed_count,
          };
        }),
        children: eligibility.children.slice(0, MAX_CHILDREN).map((child) => ({
          child_ref: childRefOf(request.workspace_id, child.child_care_process_id),
          child_safe_label: (child.display_label || "孩子").slice(0, 80),
        })),
      };
    },

    async association({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const mediaId = await resolveMediaId(request, membership);
      if (!mediaId) return masked(request.context_ref, "access_changed");
      const facts = await deps.mediaReads.loadMediaAttributionFacts({
        workspace_id: request.workspace_id,
        participant_id: membership.context.participant_id,
        media_asset_id: mediaId,
      });
      if (
        !facts
        || (facts.media_lifecycle !== "ready"
          && facts.media_lifecycle !== "unavailable")
      ) {
        return unavailable(request.context_ref, "content_unavailable");
      }
      return {
        ...readyEnvelope(request, authority, "association_query", request.media_ref),
        media_ref: request.media_ref,
        lifecycle: facts.media_lifecycle,
        media_revision: Math.max(1, facts.media_revision),
        attributions: facts.attributions
          .slice(0, MAX_CHILDREN)
          .map((fact) => attributionEntryOf(request.workspace_id, fact)),
      };
    },

    async associate({ request }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const mediaId = await resolveMediaId(request, membership);
      if (!mediaId) return masked(request.context_ref, "access_changed");
      const participantId = membership.context.participant_id;
      const eligibility =
        await deps.childOptions.resolveCaregiverDailyCareEligibility({
          workspace_id: request.workspace_id,
          participant_id: participantId,
        });
      const child = eligibility.children.find(
        (candidate) =>
          childRefOf(request.workspace_id, candidate.child_care_process_id)
          === request.child_ref,
      );
      if (!child) return masked(request.context_ref, "access_changed");
      const actorBinding = actorBindingOf(request.workspace_id, participantId);
      const spec = request.decision === "confirm"
        ? createConfirmChildMediaAttributionSpec({ integrity_key: deps.integrityKey })
        : createRejectChildMediaAttributionSpec({ integrity_key: deps.integrityKey });
      const payload: ChildAttributionCommandV1 = {
        media_asset_id: mediaId,
        child_care_process_id: child.child_care_process_id,
        expected_attribution_revision: request.expected_attribution_revision,
        expected_media_revision: request.expected_media_revision,
      };
      const result = await deps.commands.execute({
        workspace_id: request.workspace_id,
        invocation_request_id: request.host_request_id,
        command_request_id: request.command_request_id,
        business_actor_ref: participantId,
        payload,
        spec: {
          ...spec,
          canonicalize: (input: ChildAttributionCommandV1) => ({
            ...(spec.canonicalize(input) as Record<string, unknown>),
            actor_binding_ref: actorBinding,
          }),
        },
      });
      if (result.status === "outcome_unknown") {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      if (result.status === "ok") {
        const committed = isRecord(result.committed_result)
          ? result.committed_result
          : undefined;
        const records = Array.isArray(committed?.records)
          ? (committed?.records as Array<Record<string, unknown>>)
          : [];
        const record = records.find((entry) => isRecord(entry));
        const state = request.decision === "confirm" ? "confirmed" : "rejected";
        if (
          !record
          || typeof record.revision !== "number"
          || typeof record.decidedAt !== "string"
        ) {
          return outcomeUnknown(request.context_ref, request.command_request_id);
        }
        return {
          status: "committed",
          context_ref: request.context_ref,
          command_request_id: request.command_request_id,
          executed: result.disposition,
          disposition:
            result.business_outcome === "already_satisfied"
              ? "already_satisfied"
              : "applied",
          media_ref: request.media_ref,
          child_ref: request.child_ref,
          state,
          revision: Math.max(1, Math.trunc(record.revision)),
          decided_at: record.decidedAt,
        };
      }
      if (result.decision === "idempotency_conflict") {
        return notCommitted(request, "command_payload_conflict");
      }
      if (result.decision === "conflict") {
        // Attribute the drift honestly: one extra read on the failure path.
        const facts = await deps.mediaReads.loadMediaAttributionFacts({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          media_asset_id: mediaId,
        });
        const mediaMoved =
          !facts || facts.media_revision !== request.expected_media_revision;
        return notCommitted(
          request,
          mediaMoved ? "media_revision_moved" : "attribution_revision_moved",
        );
      }
      if (result.reason_code === "not_authorized") {
        return masked(request.context_ref, "access_changed");
      }
      if (result.reason_code === "target_unavailable") {
        return notCommitted(request, "target_unavailable");
      }
      if (
        ["illegal_attribution_transition", "attribution_already_decided"].includes(
          result.reason_code,
        )
        || result.reason_code.includes("transition")
      ) {
        return notCommitted(request, "illegal_attribution_transition");
      }
      return unavailable(request.context_ref, "content_unavailable");
    },

    async discard({ request }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const mediaId = await resolveMediaId(request, membership);
      if (!mediaId) return masked(request.context_ref, "access_changed");
      const participantId = membership.context.participant_id;
      const heads = await deps.mediaReads.loadDiscardHeads({
        workspace_id: request.workspace_id,
        participant_id: participantId,
        media_asset_id: mediaId,
      });
      const actorBinding = actorBindingOf(request.workspace_id, participantId);
      const base = createDiscardMediaAssetSpec({ integrity_key: deps.integrityKey });
      const discardedAt = now().toISOString();
      const spec = {
        ...base,
        // Identity must not depend on the volatile heads (the W7 lesson) so a
        // replay after the discard still matches; the heads still gate the
        // first write via expected-heads. The recorded instant rides the
        // committed result so replays answer the original moment.
        canonicalize: (input: DiscardMediaAssetCommandV1) => ({
          media_asset_id: (
            canonicalizeDiscardMediaAssetCommand(input) as {
              media_asset_id: string;
            }
          ).media_asset_id,
          actor_binding_ref: actorBinding,
        }),
        apply: async (
          transaction: Parameters<typeof base.apply>[0],
          input: Parameters<typeof base.apply>[1],
          context: Parameters<typeof base.apply>[2],
        ) => {
          const effect = await base.apply(transaction, input, context);
          return {
            ...effect,
            committed_result: {
              ...(isRecord(effect.committed_result) ? effect.committed_result : {}),
              discardedAt,
            },
          };
        },
      };
      const result = await deps.commands.execute({
        workspace_id: request.workspace_id,
        invocation_request_id: request.host_request_id,
        command_request_id: request.command_request_id,
        business_actor_ref: participantId,
        payload: {
          media_asset_id: mediaId,
          expected_media_revision: heads?.media_revision ?? 1,
          expected_referencing_draft_count: heads?.referencing_draft_count ?? 0,
        } satisfies DiscardMediaAssetCommandV1,
        spec,
      });
      if (result.status === "outcome_unknown") {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      if (result.status === "ok") {
        const committed = isRecord(result.committed_result)
          ? result.committed_result
          : undefined;
        if (!committed || typeof committed.discardedAt !== "string") {
          return outcomeUnknown(request.context_ref, request.command_request_id);
        }
        const affected = Number(committed.affectedDraftCount);
        return {
          status: "committed",
          context_ref: request.context_ref,
          command_request_id: request.command_request_id,
          executed: result.disposition,
          media_ref: request.media_ref,
          discarded_at: committed.discardedAt,
          affected_draft_count: Number.isSafeInteger(affected)
            ? Math.min(Math.max(affected, 0), TALLY_CAP)
            : 0,
        };
      }
      if (result.decision === "idempotency_conflict") {
        return notCommitted(request, "command_payload_conflict");
      }
      if (result.reason_code === "not_authorized") {
        return masked(request.context_ref, "access_changed");
      }
      if (
        ["already_released", "media_already_terminal", "target_unavailable"].includes(
          result.reason_code,
        )
      ) {
        return notCommitted(request, result.reason_code);
      }
      if (result.decision === "conflict") {
        return notCommitted(request, "target_unavailable");
      }
      return unavailable(request.context_ref, "content_unavailable");
    },
  };

  return { authorityResolver, owner };
};
