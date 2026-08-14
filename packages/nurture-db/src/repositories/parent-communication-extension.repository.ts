import type {
  ParentCommunicationDeliveryAggregateV1,
  ParentCommunicationExtensionReadPortV1,
  ParentCommunicationRedactionImpactV1,
} from "@the-nurture/scenario";
import type { BoardPrisma } from "./board-read-support.js";

/**
 * W11 Prisma facts for the parent-communication extension: the exact
 * thread's full message-id set (terminal states included, so a ref stays
 * resolvable after its redaction — the W7/W8 replay lesson), the bounded
 * redaction-impact preview facts, and the per-message delivery aggregate
 * over ChildLinkReceipt rows. No bodies, recipient identities or receipt
 * ids are read into responses anywhere here.
 */
export class PrismaParentCommunicationExtensionReadPort
implements ParentCommunicationExtensionReadPortV1 {
  constructor(private readonly prisma: BoardPrisma) {}

  async listThreadMessageIds(input: {
    workspace_id: string;
    thread_id: string;
  }): Promise<readonly string[]> {
    const rows = await this.prisma.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId: input.workspace_id,
        threadId: input.thread_id,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async loadRedactionImpact(input: {
    workspace_id: string;
    message_id: string;
  }): Promise<ParentCommunicationRedactionImpactV1> {
    const message = await this.prisma.nurtureFamilyCareMessage.findFirst({
      where: { id: input.message_id, workspaceId: input.workspace_id },
      select: { sourceItemId: true, messageKind: true },
    });
    if (!message?.sourceItemId || message.messageKind !== "family_message") {
      return { affected_reply_count: 0, derived_record_present: false };
    }
    const [replies, derived] = await Promise.all([
      this.prisma.nurtureFamilyCareMessage.count({
        where: {
          workspaceId: input.workspace_id,
          sourceItemId: message.sourceItemId,
          messageKind: "caregiver_reply",
        },
      }),
      this.prisma.nurtureDailyCareLog.count({
        where: {
          workspaceId: input.workspace_id,
          sourceItemId: message.sourceItemId,
          deletedAt: null,
        },
      }),
    ]);
    return {
      affected_reply_count: Math.min(replies, 99),
      derived_record_present: derived > 0,
    };
  }

  async loadDeliveryAggregate(input: {
    workspace_id: string;
    message_id: string;
  }): Promise<ParentCommunicationDeliveryAggregateV1 | null> {
    const receipts = await this.prisma.nurtureChildLinkReceipt.findMany({
      where: {
        workspaceId: input.workspace_id,
        sourceType: "family_care_message",
        sourceId: input.message_id,
      },
      select: {
        status: true,
        deliveredAt: true,
        readAt: true,
        acknowledgedAt: true,
      },
    });
    if (receipts.length === 0) return { delivery_state: "sent" };
    const read = receipts
      .filter((row) => row.status === "read" || row.status === "acknowledged")
      .map((row) => row.readAt ?? row.acknowledgedAt)
      .filter((at): at is Date => at !== null)
      .sort((left, right) => left.getTime() - right.getTime());
    if (
      receipts.some((row) => row.status === "read" || row.status === "acknowledged")
    ) {
      return {
        delivery_state: "read",
        ...(read[0] ? { advanced_at: read[0].toISOString() } : {}),
      };
    }
    const delivered = receipts
      .filter((row) => row.status === "delivered")
      .map((row) => row.deliveredAt)
      .filter((at): at is Date => at !== null)
      .sort((left, right) => left.getTime() - right.getTime());
    if (receipts.some((row) => row.status === "delivered")) {
      return {
        delivery_state: "delivered",
        ...(delivered[0] ? { advanced_at: delivered[0].toISOString() } : {}),
      };
    }
    const terminal = new Set(["failed", "blocked", "revoked_after_delivery"]);
    if (receipts.every((row) => terminal.has(String(row.status)))) {
      return { delivery_state: "not_applicable" };
    }
    return { delivery_state: "sent" };
  }
}
