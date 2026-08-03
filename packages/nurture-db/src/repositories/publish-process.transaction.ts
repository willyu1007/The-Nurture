import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurturePublishDraftContent,
  NurturePublishDraftFacts,
  NurturePublishEditHoldFacts,
  NurturePublishProcessCancelFacts,
  NurturePublishProcessTransaction,
} from "@the-nurture/scenario/harness";
import { NO_PUBLISH_EDIT_HOLD_VERSION } from "@the-nurture/scenario/harness";
import {
  caregiverRowAuthority,
  readMediaComposition,
  resolveCaregiverReach,
  type BoardPrisma,
  type CaregiverReachV1,
} from "./board-read-support.js";

type DomainContextRef = CanonicalRef;

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

/**
 * The revision-level identity of one draft save. It backs
 * `uq_nurture_publish_revision_command`, so a second revision for the same
 * command cannot land even if something above this layer tried.
 */
export const publishDraftCommandIdentity = (commandRequestId: string): string =>
  createHash("sha256")
    .update(`nurture.publish-draft-command.v1\0${commandRequestId}`, "utf8")
    .digest("hex");

/** A malformed payload contributes no known refs rather than a partial set. */
const readSourceRefs = (payload: unknown): string[] =>
  Array.isArray(payload) && payload.every((entry) => typeof entry === "string")
    ? (payload as string[])
    : [];

const domainRef = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

/**
 * Canonical-owner writes behind the T-006 publish-process lifecycle.
 *
 * The publish queue is a projection; the process row is the fact. Each write
 * re-reads the row inside the command transaction and updates it under its own
 * expected `aggregateVersion`, so a concurrent change makes the update match
 * zero rows rather than overwrite a newer one.
 */
export class PrismaPublishProcessTransaction implements NurturePublishProcessTransaction {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadPublishProcessCancelFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<NurturePublishProcessCancelFacts | null> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) return null;
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
    });
    if (!process) return null;
    // Any committed per-target release closes the pre-release cancel window,
    // whatever the process state currently says.
    const committed = await this.prisma.nurturePublicationRelease.count({
      where: { workspaceId: input.workspace_id, publishProcessId: process.id },
    });
    return {
      authority: caregiverRowAuthority(reach, process.careGroupId),
      publish_process_ref: domainRef(
        "publish_process",
        process.id,
        process.aggregateVersion,
      ),
      process_state: process.state,
      process_version: process.aggregateVersion,
      committed_release_count: committed,
      ...(process.cancelledAt ? { cancelled_at: process.cancelledAt.toISOString() } : {}),
    };
  }

  /**
   * The hold as stored, plus the instant this read was true at. Expiry is not
   * applied here: one instant travels with the facts so the head comparison,
   * the rule and the write all judge the same hold rather than each reading a
   * clock of its own.
   */
  async loadPublishEditHoldFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<NurturePublishEditHoldFacts | null> {
    const loaded = await this.loadHoldRow(input);
    return loaded ? loaded.facts : null;
  }

  private async loadHoldRow(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<{
    facts: NurturePublishEditHoldFacts;
    reach: CaregiverReachV1;
    process: { id: string; careGroupId: string; currentRevisionId: string | null };
  } | null> {
    const readAt = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      readAt,
    );
    if (!reach) return null;
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: { editHold: { include: { holder: true } } },
    });
    if (!process) return null;
    const hold = process.editHold;
    return {
      reach,
      process,
      facts: {
        authority: caregiverRowAuthority(reach, process.careGroupId),
        publish_process_ref: domainRef("publish_process", process.id, process.aggregateVersion),
        process_state: process.state,
        read_at: readAt.toISOString(),
        ...(hold
          ? {
              current_hold: {
                holder_participant_id: hold.holderParticipantId,
                holder_label: hold.holder.displayLabel ?? "",
                expires_at: hold.expiresAt.toISOString(),
                hold_version: hold.aggregateVersion,
              },
            }
          : {}),
      },
    };
  }

  async applyPublishEditHoldGrant(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    expected_hold_version: number;
    expires_at: string;
  }): Promise<{ publish_process_ref: DomainContextRef; expires_at: string }> {
    const loaded = await this.loadHoldRow(input);
    if (!loaded) throw new Error("nurture publish edit hold: target unavailable");
    const expiresAt = new Date(input.expires_at);

    if (input.expected_hold_version === NO_PUBLISH_EDIT_HOLD_VERSION) {
      // Prepared against no hold. The domain encodes an expired hold as
      // absence, but the expired ROW still occupies the `publish_process_id`
      // unique slot — and nothing else ever clears it, so without this sweep
      // the first acquire after any TTL lapse would collide forever. Only rows
      // already dead at this read's own instant are swept: a live hold a
      // colleague took in between is untouched, so the insert below still
      // collides on it — which is exactly the race the reserved 0 exists to
      // surface.
      await this.prisma.nurturePublishEditHold.deleteMany({
        where: {
          workspaceId: input.workspace_id,
          publishProcessId: loaded.process.id,
          expiresAt: { lte: new Date(loaded.facts.read_at) },
        },
      });
      await this.prisma.nurturePublishEditHold.create({
        data: {
          workspaceId: input.workspace_id,
          publishProcessId: loaded.process.id,
          holderRoleAssignmentId: loaded.reach.role_assignment_id,
          holderParticipantId: input.participant_id,
          expiresAt,
        },
      });
      return {
        publish_process_ref: loaded.facts.publish_process_ref,
        expires_at: expiresAt.toISOString(),
      };
    }

    const extended = await this.prisma.nurturePublishEditHold.updateMany({
      where: {
        workspaceId: input.workspace_id,
        publishProcessId: loaded.process.id,
        holderParticipantId: input.participant_id,
        aggregateVersion: input.expected_hold_version,
      },
      data: {
        holderRoleAssignmentId: loaded.reach.role_assignment_id,
        expiresAt,
        aggregateVersion: { increment: 1 },
      },
    });
    if (extended.count !== 1) {
      throw new Error("nurture publish edit hold: grant version conflict");
    }
    return {
      publish_process_ref: loaded.facts.publish_process_ref,
      expires_at: expiresAt.toISOString(),
    };
  }

  async applyPublishEditHoldRelease(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    expected_hold_version: number;
  }): Promise<{ publish_process_ref: DomainContextRef }> {
    const loaded = await this.loadHoldRow(input);
    if (!loaded) throw new Error("nurture publish edit hold: target unavailable");

    if (input.expected_hold_version === NO_PUBLISH_EDIT_HOLD_VERSION) {
      // Prepared against no live hold while the dead row still occupies the
      // slot. Sweeping an expired row is not releasing anyone's coordination —
      // any current class teacher may do it, whoever the lapsed holder was —
      // so this branch is scoped by expiry, not by holder.
      const cleared = await this.prisma.nurturePublishEditHold.deleteMany({
        where: {
          workspaceId: input.workspace_id,
          publishProcessId: loaded.process.id,
          expiresAt: { lte: new Date(loaded.facts.read_at) },
        },
      });
      if (cleared.count !== 1) {
        throw new Error("nurture publish edit hold: release version conflict");
      }
      return { publish_process_ref: loaded.facts.publish_process_ref };
    }

    // Releasing one's own live hold deletes the coordination row under its
    // exact version, never a process state change.
    const released = await this.prisma.nurturePublishEditHold.deleteMany({
      where: {
        workspaceId: input.workspace_id,
        publishProcessId: loaded.process.id,
        holderParticipantId: input.participant_id,
        aggregateVersion: input.expected_hold_version,
      },
    });
    if (released.count !== 1) {
      throw new Error("nurture publish edit hold: release version conflict");
    }
    return { publish_process_ref: loaded.facts.publish_process_ref };
  }

  async loadPublishDraftFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
  }): Promise<NurturePublishDraftFacts | null> {
    const loaded = await this.loadHoldRow(input);
    if (!loaded) return null;
    const current = loaded.process.currentRevisionId
      ? await this.prisma.nurturePublishProcessRevision.findFirst({
          where: { workspaceId: input.workspace_id, id: loaded.process.currentRevisionId },
        })
      : null;
    // Searched by the command identity column, not by `organizer_input_revision`
    // — that one carries the assembler's input revision, so the lookup it used
    // to run could never match what it was looking for.
    const replayed = await this.prisma.nurturePublishProcessRevision.findFirst({
      where: {
        workspaceId: input.workspace_id,
        publishProcessId: loaded.process.id,
        commandRequestIdHash: publishDraftCommandIdentity(input.command_request_id),
      },
    });
    return {
      ...loaded.facts,
      current_revision: current?.revision ?? 0,
      known_source_refs: readSourceRefs(current?.sourceRefsPayload ?? null),
      composition: readMediaComposition(current?.mediaCompositionPayload ?? null),
      ...(replayed
        ? {
            replayed_revision: {
              revision: replayed.revision,
              content_digest: replayed.contentDigest,
              saved_at: replayed.createdAt.toISOString(),
            },
          }
        : {}),
    };
  }

  async applyPublishProcessMediaDetach(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
    expected_draft_revision: number;
    media_asset_id: string;
  }): Promise<{
    publish_process_ref: DomainContextRef;
    revision: number;
    remaining_media_count: number;
    detached_media_revision: number;
  }> {
    const loaded = await this.loadHoldRow(input);
    if (!loaded) throw new Error("nurture publish media detach: target unavailable");
    const current = loaded.process.currentRevisionId
      ? await this.prisma.nurturePublishProcessRevision.findFirstOrThrow({
          where: { workspaceId: input.workspace_id, id: loaded.process.currentRevisionId },
        })
      : null;
    if (!current || current.revision !== input.expected_draft_revision) {
      throw new Error("nurture publish media detach: revision conflict");
    }
    const composition = readMediaComposition(current.mediaCompositionPayload);
    const detached = composition.find(
      (entry) => entry.media_asset_id === input.media_asset_id,
    );
    const remaining = composition.filter(
      (entry) => entry.media_asset_id !== input.media_asset_id,
    );
    if (!detached) {
      throw new Error("nurture publish media detach: media not in composition");
    }

    // Detaching is an edit: it appends the next revision with everything but
    // the composition carried forward byte for byte. The asset row itself is
    // never touched — "remove from this card" is not a lifecycle change.
    const revision = await this.prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: input.workspace_id,
        publishProcessId: loaded.process.id,
        revision: current.revision + 1,
        contentDigest: current.contentDigest,
        organizerInputRevision: current.organizerInputRevision,
        commandRequestIdHash: publishDraftCommandIdentity(input.command_request_id),
        ...(current.templateKey !== null ? { templateKey: current.templateKey } : {}),
        ...(current.templateVersion !== null
          ? { templateVersion: current.templateVersion }
          : {}),
        ...(current.titleProtectionPayload !== null
          ? { titleProtectionPayload: asJson(current.titleProtectionPayload) }
          : {}),
        ...(current.bodyProtectionPayload !== null
          ? { bodyProtectionPayload: asJson(current.bodyProtectionPayload) }
          : {}),
        mediaCompositionPayload: asJson({
          media: remaining.map((entry) => ({
            mediaAssetId: entry.media_asset_id,
            mediaRevision: entry.media_revision,
          })),
        }),
        ...(current.sourceRefsPayload !== null
          ? { sourceRefsPayload: asJson(current.sourceRefsPayload) }
          : {}),
        savedByRoleAssignmentId: loaded.reach.role_assignment_id,
      },
    });
    const advanced = await this.prisma.nurturePublishProcess.updateMany({
      where: {
        workspaceId: input.workspace_id,
        id: loaded.process.id,
        currentRevisionId: current.id,
      },
      data: { currentRevisionId: revision.id, aggregateVersion: { increment: 1 } },
    });
    if (advanced.count !== 1) {
      throw new Error("nurture publish media detach: revision conflict");
    }
    return {
      publish_process_ref: loaded.facts.publish_process_ref,
      revision: revision.revision,
      remaining_media_count: remaining.length,
      detached_media_revision: detached.media_revision,
    };
  }

  async applyPublishProcessDraftSave(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
    expected_draft_revision: number;
    content: NurturePublishDraftContent;
  }): Promise<{ publish_process_ref: DomainContextRef; revision: number; saved_at: string }> {
    const loaded = await this.loadHoldRow(input);
    if (!loaded) throw new Error("nurture publish draft: target unavailable");
    const current = loaded.process.currentRevisionId
      ? await this.prisma.nurturePublishProcessRevision.findFirstOrThrow({
          where: { workspaceId: input.workspace_id, id: loaded.process.currentRevisionId },
        })
      : null;
    if ((current?.revision ?? 0) !== input.expected_draft_revision) {
      throw new Error("nurture publish draft: revision conflict");
    }
    if (!current) {
      // Every card the capture lane produces arrives with revision 1, so an
      // editable process without one has no assembler lineage to carry forward.
      // Inventing one here would put a value in `organizer_input_revision` that
      // names an assembler input that never ran.
      throw new Error("nurture publish draft: process has no assembled revision");
    }

    const revision = await this.prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: input.workspace_id,
        publishProcessId: loaded.process.id,
        revision: current.revision + 1,
        contentDigest: input.content.content_digest,
        // Append-only: the lineage of the assembler input that opened this card
        // is carried forward, never rewritten by an edit.
        organizerInputRevision: current.organizerInputRevision,
        commandRequestIdHash: publishDraftCommandIdentity(input.command_request_id),
        titleProtectionPayload: asJson(input.content.title_envelope),
        bodyProtectionPayload: asJson(input.content.body_envelope),
        ...(current.mediaCompositionPayload !== null
          ? { mediaCompositionPayload: asJson(current.mediaCompositionPayload) }
          : {}),
        // The provenance the process knows stays the process's, so dropping a
        // segment never removes the ability to cite that source again.
        ...(current.sourceRefsPayload !== null
          ? { sourceRefsPayload: asJson(current.sourceRefsPayload) }
          : {}),
        savedByRoleAssignmentId: loaded.reach.role_assignment_id,
      },
    });
    const advanced = await this.prisma.nurturePublishProcess.updateMany({
      where: {
        workspaceId: input.workspace_id,
        id: loaded.process.id,
        currentRevisionId: current.id,
      },
      data: { currentRevisionId: revision.id, aggregateVersion: { increment: 1 } },
    });
    if (advanced.count !== 1) {
      throw new Error("nurture publish draft: revision conflict");
    }
    return {
      publish_process_ref: loaded.facts.publish_process_ref,
      revision: revision.revision,
      saved_at: revision.createdAt.toISOString(),
    };
  }

  async applyPublishProcessCancel(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    expected_process_version: number;
    cancelled_at: string;
  }): Promise<{ publish_process_ref: DomainContextRef; cancelled_at: string }> {
    const cancelledAt = new Date(input.cancelled_at);
    // The expected version and the states a cancel is legal from are both part
    // of the filter, so a process someone else moved matches zero rows instead
    // of being cancelled out from under them.
    const updated = await this.prisma.nurturePublishProcess.updateMany({
      where: {
        workspaceId: input.workspace_id,
        processKey: input.process_key,
        aggregateVersion: input.expected_process_version,
        state: { in: ["draft", "needs_review", "pending_release"] },
      },
      data: {
        state: "cancelled",
        cancelledAt,
        aggregateVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new Error("nurture publish process: cancel version conflict");
    }
    const process = await this.prisma.nurturePublishProcess.findFirstOrThrow({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
    });
    return {
      publish_process_ref: domainRef("publish_process", process.id, process.aggregateVersion),
      cancelled_at: cancelledAt.toISOString(),
    };
  }
}
