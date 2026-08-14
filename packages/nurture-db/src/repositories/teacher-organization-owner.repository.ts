import type {
  TeacherOrganizationBatchFactsV1,
  TeacherOrganizationBatchReadPortV1,
  TeacherOrganizationLaneRowV1,
} from "@the-nurture/scenario";
import { TEACHER_ORGANIZATION_DATA_CLASSES } from "@the-nurture/scenario";
import type { BoardPrisma } from "./board-read-support.js";

/**
 * W7 Prisma reads for the teacher organization owner: the class's current
 * capture batch (any non-cancelled state; the newest wins) and the
 * owner-ordered draft lane. Text bodies stay sealed — the service unseals
 * excerpts through the protected-content port.
 */

const LANE_STATES = ["draft", "needs_review", "pending_release"] as const;

const DATA_CLASS_SET: ReadonlySet<string> = new Set(
  TEACHER_ORGANIZATION_DATA_CLASSES,
);

export class PrismaTeacherOrganizationBatchReadPort
implements TeacherOrganizationBatchReadPortV1 {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadCurrentBatch(input: {
    workspace_id: string;
    care_group_id: string;
  }): Promise<TeacherOrganizationBatchFactsV1 | null> {
    const batch = await this.prisma.nurtureCareCaptureBatch.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        state: { in: ["collecting", "cut", "organized"] },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        captures: {
          where: { deletedAt: null },
          orderBy: { sourceSequence: "asc" },
        },
      },
    });
    if (!batch) return null;
    return {
      batch_id: batch.id,
      state: batch.state as "collecting" | "cut" | "organized",
      watermark_sequence: batch.watermarkSourceSequence ?? 0,
      captures: batch.captures.map((capture) => ({
        capture_id: capture.id,
        kind: capture.kind,
        occurred_at: capture.occurredAt.toISOString(),
        stable: capture.stable,
        has_media: capture.mediaAssetRefId !== null,
        ...(capture.bodyProtectionPayload !== null
          ? { body_envelope: capture.bodyProtectionPayload }
          : {}),
      })),
    };
  }

  async listLaneProcesses(input: {
    workspace_id: string;
    care_group_id: string;
  }): Promise<readonly TeacherOrganizationLaneRowV1[]> {
    const processes = await this.prisma.nurturePublishProcess.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        state: { in: [...LANE_STATES] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: {
        targets: {
          orderBy: { targetKey: "asc" },
          include: {
            childCareProcess: {
              select: { child: { select: { displayName: true } } },
            },
          },
        },
      },
    });
    return processes.flatMap((process) => {
      if (!DATA_CLASS_SET.has(process.dataClass)) return [];
      return [
        {
          process_id: process.id,
          process_key: process.processKey,
          origin: process.captureBatchId !== null
            ? ("agent_organized" as const)
            : ("manual" as const),
          data_class:
            process.dataClass as TeacherOrganizationLaneRowV1["data_class"],
          purpose_key: process.purposeKey,
          state: process.state as TeacherOrganizationLaneRowV1["state"],
          recipients_count: Math.min(process.targets.length, 999),
          safe_labels: process.targets.flatMap((target) => {
            const label = target.childCareProcess.child.displayName;
            return label ? [label] : [];
          }),
        },
      ];
    });
  }
}
