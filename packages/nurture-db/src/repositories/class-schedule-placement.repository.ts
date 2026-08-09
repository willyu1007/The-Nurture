import type { PrismaClient } from "@prisma/client";
// Type-only, like every other repository here. Importing the domain's runtime
// values would pull its whole module graph into this package's compilation —
// which is how a typecheck of this repo started compiling a sibling
// repository's half-finished files. Orchestration lives in
// `NurtureClassScheduleService`; this file is IO.
import type {
  NurtureActivityPlacementDecidedBy,
  NurtureClassSchedulePlacementRepository,
  NurtureScheduleLayer,
  NurtureScheduleSlot,
  NurtureStoredPlacement,
} from "@the-nurture/scenario/harness";

/**
 * G4-B increment 4 — schedule resolution and placement over stored rows.
 *
 * The repository holds no rule. It reads the layers, hands them to the
 * resolver, reads a source's current placement, hands that to the decision,
 * and writes what comes back.
 */
export class PrismaClassSchedulePlacementRepository
  implements NurtureClassSchedulePlacementRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  private static day(localDate: string): Date {
    return new Date(`${localDate}T00:00:00.000Z`);
  }

  private static slotsOf(payload: unknown): NurtureScheduleSlot[] {
    // A layer whose payload is not a slot array resolves to no slots rather
    // than throwing: a malformed layer must not take the class's whole day
    // down, and an empty layer is already a legal state.
    if (!Array.isArray(payload)) return [];
    return payload.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const slot = entry as Record<string, unknown>;
      const { slot_ref, label, starts_at_minute, ends_at_minute } = slot;
      if (
        typeof slot_ref !== "string" ||
        typeof starts_at_minute !== "number" ||
        typeof ends_at_minute !== "number"
      ) {
        return [];
      }
      return [
        {
          slot_ref,
          label: typeof label === "string" ? label : slot_ref,
          starts_at_minute,
          ends_at_minute,
        },
      ];
    });
  }

  /**
   * Every candidate layer, including soft-deleted ones. A withdrawn layer
   * returns no slots but keeps its timestamp, which is what lets the version
   * move forward rather than back when a layer is removed. Resolution itself
   * belongs to the domain.
   */
  async loadScheduleLayers(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureScheduleLayer[]> {
    const day = PrismaClassSchedulePlacementRepository.day(input.local_date);
    const [override, templates] = await Promise.all([
      this.prisma.nurtureClassScheduleDayOverride.findFirst({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          localDate: day,
        },
      }),
      this.prisma.nurtureClassScheduleTemplate.findMany({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          OR: [{ careGroupId: input.care_group_ref }, { careGroupId: null }],
        },
      }),
    ]);

    const layers: NurtureScheduleLayer[] = [];
    if (override) {
      layers.push({
        resolved_from: "day_override",
        slots: override.deletedAt
          ? []
          : PrismaClassSchedulePlacementRepository.slotsOf(override.slotsPayload),
        updated_at_ms: override.updatedAt.getTime(),
      });
    }
    for (const template of templates) {
      layers.push({
        resolved_from:
          template.layer === "class_standing"
            ? ("class_standing" as const)
            : ("institution_default" as const),
        slots: template.deletedAt
          ? []
          : PrismaClassSchedulePlacementRepository.slotsOf(template.slotsPayload),
        updated_at_ms: template.updatedAt.getTime(),
      });
    }
    return layers;
  }

  async loadPlacement(input: {
    workspace_id: string;
    source_kind: string;
    source_id: string;
  }): Promise<NurtureStoredPlacement | null> {
    const row = await this.prisma.nurtureActivityPlacement.findFirst({
      where: {
        workspaceId: input.workspace_id,
        sourceKind: input.source_kind,
        sourceId: input.source_id,
      },
    });
    if (!row) return null;
    return {
      state: row.state,
      ...(row.activityRef ? { activity_ref: row.activityRef } : {}),
      decided_by: row.decidedBy,
      placement_head: row.placementHead,
    };
  }

  /**
   * Writes one placement decision. Creating starts the head at 1; updating
   * increments it, so every change — including a move to `unplaced` — advances
   * the head a caller may have been holding.
   */
  async writePlacement(input: {
    workspace_id: string;
    source_kind: string;
    source_id: string;
    care_group_ref: string;
    local_date: string;
    state: "placed" | "unplaced";
    activity_ref: string | null;
    decided_by: NurtureActivityPlacementDecidedBy;
  }): Promise<void> {
    await this.prisma.nurtureActivityPlacement.upsert({
      where: {
        workspaceId_sourceKind_sourceId: {
          workspaceId: input.workspace_id,
          sourceKind: input.source_kind,
          sourceId: input.source_id,
        },
      },
      create: {
        workspaceId: input.workspace_id,
        sourceKind: input.source_kind,
        sourceId: input.source_id,
        careGroupId: input.care_group_ref,
        localDate: PrismaClassSchedulePlacementRepository.day(input.local_date),
        state: input.state,
        activityRef: input.activity_ref,
        decidedBy: input.decided_by,
        placementHead: 1,
      },
      update: {
        state: input.state,
        activityRef: input.activity_ref,
        decidedBy: input.decided_by,
        placementHead: { increment: 1 },
      },
    });
  }

  /**
   * The Admin adjustment. Conditional on the head that was read, so a
   * concurrent write is refused rather than merged — and it may only move a
   * source between activities of its **own** class.
   */
  async adjustPlacement(input: {
    workspace_id: string;
    source_kind: string;
    source_id: string;
    care_group_ref: string;
    activity_ref: string | null;
    expected_head: number;
  }): Promise<{ committed: boolean; placement_head: number }> {
    const updated = await this.prisma.nurtureActivityPlacement.updateMany({
      where: {
        workspaceId: input.workspace_id,
        sourceKind: input.source_kind,
        sourceId: input.source_id,
        // Scoping the write to the class is what makes a cross-class move
        // impossible rather than merely denied by a check above it.
        careGroupId: input.care_group_ref,
        placementHead: input.expected_head,
      },
      data: {
        state: input.activity_ref ? "placed" : "unplaced",
        activityRef: input.activity_ref,
        decidedBy: "admin",
        placementHead: { increment: 1 },
      },
    });
    return {
      committed: updated.count > 0,
      placement_head: updated.count > 0 ? input.expected_head + 1 : input.expected_head,
    };
  }
}
