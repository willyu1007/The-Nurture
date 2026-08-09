import type { PrismaClient } from "@prisma/client";
import type {
  NurtureClassDayAttendance,
  NurtureClassDayCaptureRow,
  NurtureClassDayCommunicationRow,
  NurtureChildDayEvidenceRow,
  NurtureEffectiveSchedule,
  NurtureGrantDataClass,
  NurtureGrantDirection,
  NurtureInstitutionClassDayDetailRepository,
} from "@the-nurture/scenario/harness";
import { PrismaClassSchedulePlacementRepository } from "./class-schedule-placement.repository.js";
import { PrismaInstitutionBusinessCommunicationReadPort } from "./institution-business-communication.read.js";

const dayBounds = (localDate: string): { start: Date; end: Date } => {
  const start = new Date(`${localDate}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
};

/**
 * Stored-fact reader for the class-day detail.
 *
 * It deliberately delegates schedule resolution and communication admission
 * to their existing owners. Re-querying either rule here would create a
 * second implementation that could drift while still returning plausible data.
 */
export class PrismaInstitutionClassDayDetailRepository
  implements NurtureInstitutionClassDayDetailRepository
{
  private readonly schedules: PrismaClassSchedulePlacementRepository;
  private readonly communications: PrismaInstitutionBusinessCommunicationReadPort;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly resolveSchedule: (
      layers: Awaited<
        ReturnType<PrismaClassSchedulePlacementRepository["loadScheduleLayers"]>
      >,
      careGroupRef: string,
      localDate: string,
    ) => NurtureEffectiveSchedule | null,
  ) {
    this.schedules = new PrismaClassSchedulePlacementRepository(prisma);
    this.communications = new PrismaInstitutionBusinessCommunicationReadPort(prisma);
  }

  async loadEffectiveSchedule(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureEffectiveSchedule | null> {
    const layers = await this.schedules.loadScheduleLayers(input);
    return this.resolveSchedule(layers, input.care_group_ref, input.local_date);
  }

  async loadClassDayCaptures(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
  }): Promise<NurtureClassDayCaptureRow[]> {
    const { start, end } = dayBounds(input.local_date);
    const snapshot = new Date(input.snapshot_at);
    const captures = await this.prisma.nurtureCareCapture.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        occurredAt: { gte: start, lt: end, lte: snapshot },
        stable: true,
        deletedAt: null,
      },
      include: {
        mediaAssetRef: {
          select: { id: true, lifecycle: true, deletedAt: true },
        },
      },
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    });
    if (captures.length === 0) return [];
    const placements = await this.prisma.nurtureActivityPlacement.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: start,
        sourceKind: "care_capture",
        sourceId: { in: captures.map((capture) => capture.id) },
      },
    });
    const placementBySource = new Map(placements.map((row) => [row.sourceId, row]));
    return captures.flatMap((capture): NurtureClassDayCaptureRow[] => {
      const placement = placementBySource.get(capture.id);
      if (capture.kind === "media") {
        if (
          !capture.mediaAssetRef ||
          capture.mediaAssetRef.lifecycle !== "ready" ||
          capture.mediaAssetRef.deletedAt !== null
        ) {
          return [];
        }
        return [
          {
            source_id: capture.id,
            kind: "photo",
            occurred_at: capture.occurredAt.toISOString(),
            placement_state: placement?.state ?? "unplaced",
            ...(placement?.activityRef ? { activity_ref: placement.activityRef } : {}),
            media_ref: capture.mediaAssetRef.id,
          },
        ];
      }
      return [
        {
          source_id: capture.id,
          kind: capture.kind,
          occurred_at: capture.occurredAt.toISOString(),
          placement_state: placement?.state ?? "unplaced",
          ...(placement?.activityRef ? { activity_ref: placement.activityRef } : {}),
          ...(capture.bodyProtectionPayload
            ? { body_envelope: capture.bodyProtectionPayload }
            : {}),
        },
      ];
    });
  }

  async loadAttendanceState(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
  }): Promise<NurtureClassDayAttendance> {
    const { start } = dayBounds(input.local_date);
    const snapshot = new Date(input.snapshot_at);
    const row = await this.prisma.nurtureDailyAttendanceSubmission.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: start,
        submittedAt: { lte: snapshot },
        deletedAt: null,
      },
    });
    if (!row) return { state: "unsubmitted" };
    return {
      state: row.state,
      submission_head: row.submissionHead,
      submitted_at: row.submittedAt.toISOString(),
      ...(row.reopenedAt && row.reopenedAt <= snapshot
        ? { reopened_at: row.reopenedAt.toISOString() }
        : {}),
    };
  }

  async listAuthorizedCommunications(input: {
    workspace_id: string;
    participant_id: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
    limit: number;
  }): Promise<NurtureClassDayCommunicationRow[]> {
    const rows = await this.communications.listInstitutionBusinessCommunications({
      workspace_id: input.workspace_id,
      participant_id: input.participant_id,
      care_group_id: input.care_group_ref,
      local_date: input.local_date,
      snapshot_at: input.snapshot_at,
      limit: input.limit,
    });
    return rows.map((row) => ({
      message_id: row.message_id,
      child_process_ref: row.child_care_process_id,
      direction: row.direction,
      data_class: row.data_class,
      author_side: row.author_side,
      occurred_at: row.occurred_at,
      corrected: row.corrected,
      redacted: row.redacted,
      lifecycle: row.lifecycle,
      ...(row.acknowledgement_state
        ? { acknowledgement_state: row.acknowledgement_state }
        : {}),
      ...(row.response_state ? { response_state: row.response_state } : {}),
      ...(row.due_at ? { due_at: row.due_at } : {}),
    }));
  }

  async loadChildDayEvidence(input: {
    workspace_id: string;
    participant_id: string;
    child_process_ref: string;
    care_group_ref: string;
    local_date: string;
    snapshot_at: string;
    direction: NurtureGrantDirection;
    data_class: NurtureGrantDataClass;
  }): Promise<NurtureChildDayEvidenceRow[]> {
    const { start, end } = dayBounds(input.local_date);
    const snapshot = new Date(input.snapshot_at);
    if (input.data_class === "daily_care_log") {
      const [logs, attendance] = await Promise.all([
        this.prisma.nurtureDailyCareLog.findMany({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: input.child_process_ref,
            careGroupId: input.care_group_ref,
            logDate: start,
            status: { in: ["recorded", "shared", "corrected"] },
            createdAt: { lte: snapshot },
            deletedAt: null,
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
        this.prisma.nurtureAttendanceEntry.findFirst({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: input.child_process_ref,
            submission: {
              careGroupId: input.care_group_ref,
              localDate: start,
              submittedAt: { lte: snapshot },
              deletedAt: null,
            },
          },
          include: { submission: { select: { updatedAt: true } } },
        }),
      ]);
      return [
        ...logs.map(
          (row): NurtureChildDayEvidenceRow => ({
            kind: "daily_care_log",
            source_id: row.id,
            occurred_at: row.createdAt.toISOString(),
            status: row.status as "recorded" | "shared" | "corrected",
            ...(row.summary ? { summary: row.summary } : {}),
          }),
        ),
        ...(attendance
          ? [
              {
                kind: "attendance" as const,
                source_id: attendance.id,
                occurred_at: attendance.submission.updatedAt.toISOString(),
                state: attendance.state,
              },
            ]
          : []),
      ].filter((row) => new Date(row.occurred_at) < end);
    }

    if (
      input.data_class !== "family_care_question" &&
      input.data_class !== "direct_care_communication"
    ) {
      return [];
    }
    const communications = await this.listAuthorizedCommunications({
      workspace_id: input.workspace_id,
      participant_id: input.participant_id,
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
      snapshot_at: input.snapshot_at,
      limit: 100,
    });
    return communications
      .filter(
        (row) =>
          row.child_process_ref === input.child_process_ref &&
          row.direction === input.direction &&
          row.data_class === input.data_class,
      )
      .map((row) => ({
        kind: "communication" as const,
        source_id: row.message_id,
        occurred_at: row.occurred_at,
        direction: row.direction,
        author_side: row.author_side,
        ...(row.response_state ? { response_state: row.response_state } : {}),
      }));
  }
}
