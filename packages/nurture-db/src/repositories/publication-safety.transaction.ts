import type { Prisma } from "@prisma/client";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurturePublicationSafetyTransaction,
  NurturePublicationSafetyWriteFacts,
} from "@the-nurture/scenario/harness";
import {
  caregiverRowAuthority,
  resolveCaregiverReach,
  type BoardPrisma,
} from "./board-read-support.js";

type DomainContextRef = CanonicalRef;

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

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
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) return null;
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
    return {
      authority: caregiverRowAuthority(reach, process.careGroupId),
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
      from_visibility: string[];
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
          visibility: { in: update.from_visibility as never },
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
    events: Array<{
      event_id: string;
      publication_id: string;
      kind: "correction" | "target_removal" | "redaction";
      reason_key: string;
      source_release_revision: number;
      occurred_at: string;
      body_envelope?: unknown;
    }>;
  }): Promise<void> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) throw new Error("nurture publication safety: target unavailable");
    for (const event of input.events) {
      await this.prisma.nurturePublicationVisibilityEvent.create({
        data: {
          id: event.event_id,
          workspaceId: input.workspace_id,
          publicationReleaseId: event.publication_id,
          kind: event.kind,
          reasonKey: event.reason_key,
          actorRoleAssignmentId: reach.role_assignment_id,
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
    }
  }
}
