import type {
  MediaAttributionFactsV1,
  TeacherMediaAssetDisplayV1,
  TeacherMediaAssociationReadPortV1,
} from "@the-nurture/scenario";
import { type BoardPrisma } from "./board-read-support.js";
import { PrismaMediaSafetyReadPort } from "./media-safety.read.js";

/**
 * W9 Prisma facts for the teacher media-association owner: the G3-C1
 * attribution/lifecycle reads are delegated to the existing media-safety
 * port; this class adds the class-wide resolution candidate list (terminal
 * lifecycles included, so refs stay resolvable after decisions/discards)
 * and the display fields the queue renders. No bytes, storage refs or
 * preview handles are read anywhere here.
 */
export class PrismaTeacherMediaAssociationReadPort
implements TeacherMediaAssociationReadPortV1 {
  private readonly mediaSafety: PrismaMediaSafetyReadPort;

  constructor(private readonly prisma: BoardPrisma) {
    this.mediaSafety = new PrismaMediaSafetyReadPort(prisma);
  }

  listAttributableMediaIds(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    return this.mediaSafety.listAttributableMediaIds(input);
  }

  async listClassMediaIds(input: {
    workspace_id: string;
    care_group_id: string;
  }): Promise<readonly string[]> {
    const rows = await this.prisma.nurtureMediaAssetRef.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  loadMediaAttributionFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<MediaAttributionFactsV1 | null> {
    return this.mediaSafety.loadMediaAttributionFacts(input);
  }

  async loadAssetDisplay(input: {
    workspace_id: string;
    media_asset_ids: readonly string[];
  }): Promise<readonly TeacherMediaAssetDisplayV1[]> {
    if (input.media_asset_ids.length === 0) return [];
    const rows = await this.prisma.nurtureMediaAssetRef.findMany({
      where: {
        workspaceId: input.workspace_id,
        id: { in: [...input.media_asset_ids] },
      },
      select: { id: true, safeTitle: true, capturedAt: true },
    });
    return rows.map((row) => ({
      media_asset_id: row.id,
      ...(row.safeTitle ? { safe_title: row.safeTitle } : {}),
      ...(row.capturedAt ? { captured_at: row.capturedAt.toISOString() } : {}),
    }));
  }

  async loadDiscardHeads(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<Readonly<{
    media_revision: number;
    referencing_draft_count: number;
  }> | null> {
    const facts = await this.mediaSafety.loadMediaLifecycleFacts(input);
    if (!facts) return null;
    return {
      media_revision: facts.media_revision,
      referencing_draft_count: facts.referencing_draft_count,
    };
  }
}
