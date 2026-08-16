import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurturePublicationSafetyTransaction,
  NurturePublicationSafetyWriteFacts,
} from "@the-nurture/scenario/harness";
import {
  assembleLifecycleEventV1,
  type FamilyGrowthCanonicalTargetV1,
  type FamilyGrowthLifecycleReasonV1,
} from "@the-nurture/scenario/family-growth";
import {
  caregiverRowAuthority,
  resolveCaregiverReachFor,
  type BoardPrisma,
} from "./board-read-support.js";
import { appendFamilyGrowthOutboxEventWithin } from "./family-growth-outbox.transaction.js";
import { asJson } from "./prisma-json.js";

type DomainContextRef = CanonicalRef;

const domainRef = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

/**
 * Canonical-owner writes behind the three post-release safety actions.
 *
 * Visibility transitions are monotone updates guarded by their own FROM set in
 * the WHERE; the lineage rows are appended by the finalize step because they
 * name the CommandExecution, a row that does not exist until `apply` returns.
 * Nothing here deletes or rewrites the release, its Receipt or the audit.
 */
export class PrismaPublicationSafetyTransaction implements NurturePublicationSafetyTransaction {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadPublicationSafetyWriteFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<NurturePublicationSafetyWriteFacts | null> {
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: {
        releases: {
          include: {
            revision: { select: { revision: true } },
            visibilityEvents: { orderBy: [{ occurredAt: "asc" }, { id: "asc" }] },
          },
          orderBy: [{ committedAt: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!process) return null;
    // The row names its class; authority is asked of exactly that class.
    const reach = await resolveCaregiverReachFor(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      process.careGroupId,
      new Date(),
    );
    if (!reach) return null;
    return {
      authority: caregiverRowAuthority(reach, process.careGroupId),
      actor_role_assignment_id: reach.role_assignment_id,
      publish_process_ref: domainRef("publish_process", process.id, process.aggregateVersion),
      publications: process.releases.map((release) => ({
        publication_id: release.id,
        ...(release.receiptId ? { receipt_id: release.receiptId } : {}),
        release_revision: release.revision.revision,
        visibility: release.visibility,
        events: release.visibilityEvents.map((event) => ({
          event_id: event.id,
          kind: event.kind,
          reason_key: event.reasonKey,
          occurred_at: event.occurredAt.toISOString(),
          source_release_revision: event.sourceReleaseRevision,
        })),
      })),
    };
  }

  async applyPublicationVisibilityUpdate(input: {
    workspace_id: string;
    participant_id: string;
    updates: Array<{
      publication_id: string;
      from_visibility: Array<"visible" | "removed" | "redacted">;
      to_visibility: "removed" | "redacted";
    }>;
  }): Promise<{ updated_publication_ids: string[] }> {
    const updated: string[] = [];
    for (const update of input.updates) {
      // Monotone by construction: the FROM set is in the WHERE, so a
      // transition the lineage already passed matches zero rows and fails
      // loudly instead of quietly rewinding it.
      const result = await this.prisma.nurturePublicationRelease.updateMany({
        where: {
          id: update.publication_id,
          workspaceId: input.workspace_id,
          visibility: { in: update.from_visibility },
        },
        data: { visibility: update.to_visibility },
      });
      if (result.count !== 1) {
        throw new Error("nurture publication safety: visibility transition conflict");
      }
      updated.push(update.publication_id);
    }
    return { updated_publication_ids: updated };
  }

  async appendPublicationVisibilityEvents(input: {
    workspace_id: string;
    participant_id: string;
    command_execution_id: string;
    actor_role_assignment_id: string;
    events: Array<{
      event_id: string;
      publication_id: string;
      kind: "correction" | "target_removal" | "redaction";
      reason_key: string;
      source_release_revision: number;
      occurred_at: string;
      body_envelope?: unknown;
      correction_display_safe_text?: string;
    }>;
  }): Promise<void> {
    for (const event of input.events) {
      // Each lineage row and its family-growth outbox event land as one
      // pair: a lineage row whose lifecycle never leaves, or an outbox event
      // for a lineage row that rolled back, are both defects (T-009 I3).
      await this.runAtomic(async (tx) => {
        await tx.nurturePublicationVisibilityEvent.create({
          data: {
            id: event.event_id,
            workspaceId: input.workspace_id,
            publicationReleaseId: event.publication_id,
            kind: event.kind,
            reasonKey: event.reason_key,
            // The assignment the authorization validated, on the load-time
            // clock — never a finalize-time re-resolution.
            actorRoleAssignmentId: input.actor_role_assignment_id,
            sourceReleaseRevision: event.source_release_revision,
            // The lineage names the command behind it — the reason the append
            // happens in finalize, after the execution row exists.
            commandExecutionId: input.command_execution_id,
            occurredAt: new Date(event.occurred_at),
            ...(event.body_envelope !== undefined
              ? { bodyProtectionPayload: asJson(event.body_envelope) }
              : {}),
          },
        });

        // Lifecycle delivery follows the release's own delivery: exactly the
        // releases that emitted a `released` event propagate their lineage.
        // A release My-Chat never admitted has nothing downstream to
        // correct, remove or redact.
        const releasedOutbox = await tx.nurtureFamilyGrowthOutboxEvent.findFirst({
          where: {
            workspaceId: input.workspace_id,
            publicationReleaseId: event.publication_id,
            kind: "released",
          },
          select: { envelopePayload: true },
        });
        if (!releasedOutbox) return;

        // The lifecycle target is the exact target the release was delivered
        // with — read back from the stored envelope, never re-resolved: a
        // binding revoked after release must not stop a redaction cascade.
        const envelope = assembleLifecycleEventV1({
          eventId: randomUUID(),
          occurredAt: event.occurred_at,
          kind: event.kind,
          source: {
            publicationReleaseRef: event.publication_id,
            eventRef: event.event_id,
            sourceReleaseRevision: event.source_release_revision,
            // Same closed taxonomy on both sides; the assembler re-validates
            // and an out-of-taxonomy value aborts the pair (fail closed).
            reasonKey: event.reason_key as FamilyGrowthLifecycleReasonV1,
          },
          target: readStoredEnvelopeTarget(releasedOutbox.envelopePayload),
          ...(event.correction_display_safe_text !== undefined
            ? { correctionDisplaySafeText: event.correction_display_safe_text }
            : {}),
        });
        await appendFamilyGrowthOutboxEventWithin(tx, {
          workspaceId: input.workspace_id,
          eventId: envelope.event_id,
          kind: event.kind,
          publicationReleaseId: event.publication_id,
          visibilityEventId: event.event_id,
          payloadDigest: envelope.payload_digest,
          envelope,
        });
      });
    }
  }

  /**
   * `BoardPrisma` may already be a transaction client; only open a new
   * transaction when this port holds a root client.
   */
  private async runAtomic<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const maybeRoot = this.prisma as PrismaClient;
    if (typeof maybeRoot.$transaction === "function") {
      return maybeRoot.$transaction(fn);
    }
    return fn(this.prisma as Prisma.TransactionClient);
  }
}

/** The canonical pair the release envelope committed with; malformed storage fails closed. */
const readStoredEnvelopeTarget = (payload: unknown): FamilyGrowthCanonicalTargetV1 => {
  const target =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as { target?: unknown }).target
      : undefined;
  const record =
    target && typeof target === "object" && !Array.isArray(target)
      ? (target as Record<string, unknown>)
      : undefined;
  const childId = record?.child_id;
  const familyId = record?.family_id;
  if (typeof childId !== "string" || childId.length === 0 || typeof familyId !== "string" || familyId.length === 0) {
    throw new Error(
      "nurture family growth lifecycle: stored release envelope carries no canonical target",
    );
  }
  return { child_id: childId, family_id: familyId };
};
