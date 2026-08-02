import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurturePublishProcessCancelFacts,
  NurturePublishProcessTransaction,
} from "@the-nurture/scenario/harness";
import {
  caregiverRowAuthority,
  resolveCaregiverReach,
  type BoardPrisma,
} from "./board-read-support.js";

type DomainContextRef = CanonicalRef;

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
