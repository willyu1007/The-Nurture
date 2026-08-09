import type { PrismaClient } from "@prisma/client";
import type {
  NurtureAttendanceEvidence,
  NurtureAttendancePreviewRepository,
  NurtureAttendanceWatermark,
} from "@the-nurture/scenario/harness";

/**
 * G4-B increment 2 — the evidence read behind a preview, frozen by 0D-1 §2.
 *
 * Every source here already has an owner. This reads them and holds nothing:
 * `AttendanceEvidence` is a derived projection with no table, because a stored
 * copy would drift from the rows that produced it.
 */
export class PrismaAttendancePreviewRepository implements NurtureAttendancePreviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private static dayBounds(localDate: string): { day: Date; start: Date; end: Date } {
    const start = new Date(`${localDate}T00:00:00.000Z`);
    return { day: start, start, end: new Date(start.getTime() + 86_400_000) };
  }

  async loadPreviewFacts(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<{ members: NurtureAttendanceEvidence[]; watermark?: NurtureAttendanceWatermark }> {
    const { day, start, end } = PrismaAttendancePreviewRepository.dayBounds(input.local_date);

    // The population is SCOPE — a current enrolment in this class — never a
    // protected fact, exactly as 0C-5 §5 established for aggregates. A child
    // with no evidence is still a member: they are who the teacher must decide
    // about, and omitting them would quietly shrink the class.
    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        status: "active",
        deletedAt: null,
      },
      orderBy: { id: "asc" },
      select: { childCareProcessId: true },
    });
    if (enrollments.length === 0) return { members: [] };
    const memberRefs = enrollments.map((row) => row.childCareProcessId);

    // 0D-1 §5: the stable prefix is the one T-006 already defines. Only
    // captures belonging to an already-cut batch count, so "stable" means the
    // same thing here as it does in the publish lane rather than being a
    // second, silently diverging definition.
    const cutBatches = await this.prisma.nurtureCareCaptureBatch.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        state: { in: ["cut", "organized"] },
        cutAt: { gte: start, lt: end },
      },
      select: { id: true, watermarkSourceSequence: true },
      orderBy: { watermarkSourceSequence: "desc" },
    });
    const cutBatchIds = cutBatches.map((batch) => batch.id);
    const highWater = cutBatches.find(
      (batch) => batch.watermarkSourceSequence !== null,
    )?.watermarkSourceSequence;

    const [logs, captures, attributions] = await Promise.all([
      this.prisma.nurtureDailyCareLog.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          childCareProcessId: { in: memberRefs },
          logDate: day,
          status: { in: ["recorded", "shared"] },
          deletedAt: null,
        },
        select: { childCareProcessId: true },
      }),
      cutBatchIds.length > 0
        ? this.prisma.nurtureCareCapture.findMany({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: input.care_group_ref,
              captureBatchId: { in: cutBatchIds },
              // Belt and braces with the batch filter: an unstable row inside
              // a cut batch is not part of the prefix that was cut.
              stable: true,
              deletedAt: null,
            },
            select: { id: true, mediaAssetRefId: true },
          })
        : Promise.resolve([]),
      // Only CONFIRMED attributions are evidence. A candidate is a suggestion
      // about who is in a photo, and building presence on it would let one
      // non-canonical guess feed another (0D-4).
      this.prisma.nurtureChildMediaAttribution.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: { in: memberRefs },
          state: "confirmed",
          confirmedAt: { gte: start, lt: end },
          deletedAt: null,
        },
        select: { childCareProcessId: true, mediaAssetRefId: true },
      }),
    ]);

    // A capture is class-level: it says the class was active, not which child
    // was present. Only an attribution ties an asset to a child, so captures
    // contribute per-child evidence only through one.
    const stableAssetIds = new Set(
      captures.flatMap((row) => (row.mediaAssetRefId ? [row.mediaAssetRefId] : [])),
    );

    const members = memberRefs.map((child_process_ref) => {
      const sources: NurtureAttendanceEvidence["sources"] = [];
      let observation_count = 0;

      const logCount = logs.filter((row) => row.childCareProcessId === child_process_ref).length;
      if (logCount > 0) {
        sources.push("daily_care_log");
        observation_count += logCount;
      }
      const childAttributions = attributions.filter(
        (row) => row.childCareProcessId === child_process_ref,
      );
      if (childAttributions.length > 0) {
        sources.push("confirmed_media_attribution");
        observation_count += childAttributions.length;
      }
      const withinStablePrefix = childAttributions.filter((row) =>
        stableAssetIds.has(row.mediaAssetRefId),
      ).length;
      if (withinStablePrefix > 0) sources.push("care_capture");

      return { child_process_ref, sources, observation_count };
    });

    return {
      members,
      ...(highWater !== undefined && highWater !== null
        ? {
            watermark: {
              source_kind: "care_capture_batch" as const,
              source_sequence: highWater,
            },
          }
        : {}),
    };
  }

  /**
   * The audit of a non-canonical run. It records what the inference read and
   * under which policy — never an attendance state, because 0D-1 forbids an
   * inference from producing one and the table has nowhere to put it.
   */
  async recordInferenceRun(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    policy_version: string;
    evidence_refs: string[];
  }): Promise<void> {
    await this.prisma.nurtureAttendanceInferenceRun.create({
      data: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: PrismaAttendancePreviewRepository.dayBounds(input.local_date).day,
        policyVersion: input.policy_version,
        evidenceRefsPayload: { refs: input.evidence_refs },
        generatedAt: new Date(),
      },
    });
  }
}
