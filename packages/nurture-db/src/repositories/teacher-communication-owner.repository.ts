import type {
  NurtureTeacherCommunicationTransaction,
  NurtureThreadReadCursorApplied,
  NurtureThreadTextMessageApplied,
  TeacherCommunicationMessageRowV1,
  TeacherCommunicationThreadReadPortV1,
  TeacherCommunicationThreadRowV1,
  TeacherCommunicationTimelinePageV1,
} from "@the-nurture/scenario";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";
import { asJson } from "./prisma-json.js";

/**
 * W8 Prisma facts for the teacher communication owner. Threads are the
 * class's active family-care threads; unread counts derive from the acting
 * teacher's own participant cursor (no cursor row means everything foreign
 * is unread); delivery states for teacher-authored messages derive from the
 * guardian cursors of the same thread — no device-delivery source exists,
 * so `delivered` never appears in this version.
 */

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

const CANDIDATE_MESSAGE_LIMIT = 500;

type ThreadRow = Readonly<{
  id: string;
  careGroupId: string | null;
  childCareProcessId: string;
  latestMessageAt: Date | null;
}>;

export class PrismaTeacherCommunicationReadPort
implements TeacherCommunicationThreadReadPortV1 {
  constructor(private readonly prisma: BoardPrisma) {}

  async listClassThreads(input: {
    workspace_id: string;
    care_group_id: string;
    participant_id: string;
    at: Date;
  }): Promise<readonly TeacherCommunicationThreadRowV1[]> {
    const threads = await this.prisma.nurtureFamilyCareThread.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        status: "active",
        deletedAt: null,
      },
      orderBy: [{ latestMessageAt: "desc" }, { id: "asc" }],
      include: {
        family: { select: { displayName: true } },
        childCareProcess: {
          select: { child: { select: { displayName: true } } },
        },
        participants: {
          where: {
            participantId: input.participant_id,
            visibilityStatus: "active",
            deletedAt: null,
          },
          select: { lastReadAt: true },
        },
      },
    });
    const rows: TeacherCommunicationThreadRowV1[] = [];
    for (const thread of threads) {
      const lastReadAt = thread.participants[0]?.lastReadAt ?? null;
      const unread = await this.prisma.nurtureFamilyCareMessage.count({
        where: {
          workspaceId: input.workspace_id,
          threadId: thread.id,
          redactedAt: null,
          senderParticipantId: { not: input.participant_id },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });
      const childLabel = thread.childCareProcess.child.displayName ?? "";
      rows.push({
        thread_id: thread.id,
        family_safe_label:
          thread.family.displayName ?? (childLabel ? `${childLabel}家庭` : "家庭"),
        child_safe_label: childLabel || "孩子",
        unread_count: unread,
        ...(thread.latestMessageAt
          ? { latest_message_at: thread.latestMessageAt.toISOString() }
          : {}),
      });
    }
    return rows;
  }

  async listWithdrawCandidates(input: {
    workspace_id: string;
    care_group_id: string;
  }) {
    const processes = await this.prisma.nurturePublishProcess.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        state: { in: ["draft", "needs_review", "pending_release", "cancelled"] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, processKey: true },
    });
    return processes.map((process) => ({
      process_id: process.id,
      process_key: process.processKey,
    }));
  }

  async listThreadMembers(input: {
    workspace_id: string;
    thread_id: string;
  }) {
    const rows = await this.prisma.nurtureFamilyCareThreadParticipant.findMany({
      where: {
        workspaceId: input.workspace_id,
        threadId: input.thread_id,
        visibilityStatus: "active",
        deletedAt: null,
      },
      orderBy: [{ participantKind: "asc" }, { id: "asc" }],
      include: {
        participant: { select: { displayName: true } },
        roleAssignment: { select: { displayLabel: true, role: true } },
      },
    });
    return rows.map((row) => ({
      member_id: row.id,
      display_name:
        row.participant.displayName
        ?? row.roleAssignment.displayLabel
        ?? (row.participantKind === "guardian" ? "家长" : "教师"),
      role_display:
        row.roleAssignment.displayLabel
        ?? (row.participantKind === "guardian"
          ? "家长"
          : row.roleAssignment.role === "lead_caregiver"
            ? "主带班老师"
            : "带班老师"),
    }));
  }

  async loadTimelinePage(input: {
    workspace_id: string;
    thread_id: string;
    participant_id: string;
    page_size: number;
    before?: Readonly<{ sent_at: string; message_id: string }>;
  }): Promise<TeacherCommunicationTimelinePageV1> {
    const beforeAt = input.before ? new Date(input.before.sent_at) : undefined;
    const messages = await this.prisma.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId: input.workspace_id,
        threadId: input.thread_id,
        redactedAt: null,
        ...(beforeAt && input.before
          ? {
              OR: [
                { createdAt: { lt: beforeAt } },
                { createdAt: beforeAt, id: { lt: input.before.message_id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.page_size + 1,
      include: { senderParticipant: { select: { displayName: true } } },
    });
    const guardianCursors =
      await this.prisma.nurtureFamilyCareThreadParticipant.findMany({
        where: {
          workspaceId: input.workspace_id,
          threadId: input.thread_id,
          participantKind: "guardian",
          visibilityStatus: "active",
          deletedAt: null,
        },
        select: { lastReadAt: true },
      });
    const guardianReadUpTo = guardianCursors.reduce<Date | null>(
      (earliest, row) =>
        row.lastReadAt === null
          ? null
          : earliest === null
            ? null
            : row.lastReadAt < earliest
              ? row.lastReadAt
              : earliest,
      guardianCursors.length > 0
        ? guardianCursors[0]!.lastReadAt
        : null,
    );
    const hasMore = messages.length > input.page_size;
    const page = messages.slice(0, input.page_size);
    const last = page.at(-1);
    return {
      messages: page.map((row) =>
        mapMessage(
          {
            id: row.id,
            messageKind: row.messageKind,
            authorshipKind: row.authorshipKind,
            attachmentsPayload: row.attachmentsPayload,
            bodyProtectionPayload: row.bodyProtectionPayload,
            createdAt: row.createdAt,
            senderParticipant: row.senderParticipant,
          },
          guardianReadUpTo,
        )),
      has_more: hasMore,
      ...(hasMore && last
        ? {
            next: {
              sent_at: last.createdAt.toISOString(),
              message_id: last.id,
            },
          }
        : {}),
    };
  }
}

type MessageRow = Readonly<{
  id: string;
  messageKind: string;
  authorshipKind: string;
  attachmentsPayload: unknown;
  bodyProtectionPayload: unknown;
  createdAt: Date;
  senderParticipant: Readonly<{ displayName: string | null }>;
}>;

const mapMessage = (
  row: MessageRow,
  guardianReadUpTo: Date | null,
): TeacherCommunicationMessageRowV1 => {
  const system =
    row.messageKind === "system_notice" || row.messageKind === "redaction_notice";
  const hasMedia = row.attachmentsPayload !== null;
  const kind: TeacherCommunicationMessageRowV1["kind"] = system
    ? "system"
    : hasMedia && row.bodyProtectionPayload === null
      ? "media"
      : "text";
  const parentAuthored = row.messageKind === "family_message";
  const agentAuthored = row.authorshipKind === "institution_generated";
  const senderKind: TeacherCommunicationMessageRowV1["sender_kind"] = system
    ? "system"
    : parentAuthored
      ? "parent"
      : agentAuthored
        ? "agent"
        : "teacher";
  const deliveryState: TeacherCommunicationMessageRowV1["delivery_state"] =
    system || parentAuthored
      ? "not_applicable"
      : guardianReadUpTo !== null && guardianReadUpTo >= row.createdAt
        ? "read"
        : "sent";
  return {
    message_id: row.id,
    kind,
    sender_kind: senderKind,
    agent_authored: agentAuthored,
    sender_display:
      row.senderParticipant.displayName
      ?? (parentAuthored ? "家长" : system ? "系统" : "教师"),
    sent_at: row.createdAt.toISOString(),
    delivery_state: deliveryState,
    has_media: hasMedia,
    ...(kind === "text" && row.bodyProtectionPayload !== null
      ? { body_envelope: row.bodyProtectionPayload }
      : {}),
  };
};

export class PrismaTeacherCommunicationTransaction
implements NurtureTeacherCommunicationTransaction {
  constructor(private readonly prisma: BoardPrisma) {}

  private async currentRole(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    at: Date;
  }) {
    return this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        scopeId: input.care_group_id,
        ...activeRoleWindow(input.at),
      },
      orderBy: { id: "asc" },
      select: { id: true },
    });
  }

  private async activeThread(input: {
    workspace_id: string;
    thread_id: string;
  }): Promise<ThreadRow | null> {
    return this.prisma.nurtureFamilyCareThread.findFirst({
      where: {
        id: input.thread_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
      select: {
        id: true,
        careGroupId: true,
        childCareProcessId: true,
        latestMessageAt: true,
      },
    });
  }

  async applyThreadTextMessage(input: {
    workspace_id: string;
    participant_id: string;
    thread_id: string;
    body_envelope: unknown;
    sent_at: string;
  }): Promise<NurtureThreadTextMessageApplied> {
    const at = new Date(input.sent_at);
    const thread = await this.activeThread(input);
    if (!thread || thread.careGroupId === null) {
      return { status: "thread_unavailable" };
    }
    const role = await this.currentRole({
      workspace_id: input.workspace_id,
      participant_id: input.participant_id,
      care_group_id: thread.careGroupId,
      at,
    });
    if (!role) return { status: "not_authorized" };
    const message = await this.prisma.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: input.workspace_id,
        threadId: thread.id,
        childCareProcessId: thread.childCareProcessId,
        senderParticipantId: input.participant_id,
        senderRoleAssignmentId: role.id,
        messageKind: "caregiver_reply",
        authorshipKind: "caregiver_confirmed",
        bodyFormat: "plain_text",
        bodyStorageMode: "protected",
        bodyProtectionPayload: asJson(input.body_envelope),
        sourceSurface: "mobile",
        status: "sent",
        createdAt: at,
      },
      select: { id: true, createdAt: true },
    });
    await this.prisma.nurtureFamilyCareThread.update({
      where: { id: thread.id },
      data: {
        latestMessageAt: at,
        aggregateVersion: { increment: 1 },
      },
    });
    return {
      status: "applied",
      message_id: message.id,
      committed_at: message.createdAt.toISOString(),
    };
  }

  async applyThreadReadCursor(input: {
    workspace_id: string;
    participant_id: string;
    thread_id: string;
    message_ref: string;
    issue_ref: (messageId: string) => string;
    at: string;
  }): Promise<NurtureThreadReadCursorApplied> {
    const at = new Date(input.at);
    const thread = await this.activeThread(input);
    if (!thread || thread.careGroupId === null) return { status: "not_authorized" };
    const role = await this.currentRole({
      workspace_id: input.workspace_id,
      participant_id: input.participant_id,
      care_group_id: thread.careGroupId,
      at,
    });
    if (!role) return { status: "not_authorized" };
    const candidates = await this.prisma.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId: input.workspace_id,
        threadId: thread.id,
        redactedAt: null,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: CANDIDATE_MESSAGE_LIMIT,
      select: { id: true, createdAt: true },
    });
    const target = candidates.find(
      (candidate) => input.issue_ref(candidate.id) === input.message_ref,
    );
    if (!target) return { status: "message_foreign" };
    const existing =
      await this.prisma.nurtureFamilyCareThreadParticipant.findFirst({
        where: {
          workspaceId: input.workspace_id,
          threadId: thread.id,
          participantId: input.participant_id,
          deletedAt: null,
        },
        select: { id: true, lastReadMessageId: true, lastReadAt: true },
      });
    if (existing?.lastReadMessageId === target.id) {
      return { status: "already_satisfied" };
    }
    if (existing?.lastReadAt && existing.lastReadAt > target.createdAt) {
      return { status: "cursor_regression" };
    }
    if (existing) {
      await this.prisma.nurtureFamilyCareThreadParticipant.update({
        where: { id: existing.id },
        data: {
          lastReadMessageId: target.id,
          lastReadAt: target.createdAt,
          aggregateVersion: { increment: 1 },
        },
      });
    } else {
      await this.prisma.nurtureFamilyCareThreadParticipant.create({
        data: {
          workspaceId: input.workspace_id,
          threadId: thread.id,
          participantId: input.participant_id,
          roleAssignmentId: role.id,
          participantKind: "caregiver",
          visibilityStatus: "active",
          lastReadMessageId: target.id,
          lastReadAt: target.createdAt,
        },
      });
    }
    return { status: "advanced" };
  }
}
