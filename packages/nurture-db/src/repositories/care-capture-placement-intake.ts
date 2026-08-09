import type { PrismaClient, Prisma } from "@prisma/client";
import {
  NurtureCareCapturePlacementIntakeService,
  NurtureClassScheduleService,
  type NurtureCareCapturePlacementIntakeResult,
  type NurtureCareCapturePlacementSourcePort,
} from "@the-nurture/scenario";
import { PrismaClassSchedulePlacementRepository } from "./class-schedule-placement.repository.js";
import { loadInstitutionLocalDayAtInstant } from "./institution-local-day.js";

type PlacementPrisma = PrismaClient | Prisma.TransactionClient;

/**
 * Resolves a stored owner-issued capture to its exact class/date placement
 * facts. The relation predicates keep a capture from a paused/deleted class or
 * Institution out, and the local-day provider owns all timezone resolution.
 */
export class PrismaCareCapturePlacementSourceAdapter
  implements NurtureCareCapturePlacementSourcePort
{
  constructor(private readonly prisma: PlacementPrisma) {}

  async loadExactCaptureSource(input: { workspace_id: string; capture_ref: string }) {
    const capture = await this.prisma.nurtureCareCapture.findFirst({
      where: {
        id: input.capture_ref,
        workspaceId: input.workspace_id,
        deletedAt: null,
        careGroup: {
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
          institution: {
            workspaceId: input.workspace_id,
            status: "active",
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        careGroupId: true,
        occurredAt: true,
        careGroup: { select: { institutionId: true } },
      },
    });
    if (!capture) return null;

    const localDay = await loadInstitutionLocalDayAtInstant(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: capture.careGroup.institutionId,
      instant: capture.occurredAt,
    });
    if (!localDay) return null;
    return {
      capture_ref: capture.id,
      institution_ref: capture.careGroup.institutionId,
      care_group_ref: capture.careGroupId,
      local_date: localDay.local_date,
      occurred_at_minute: localDay.occurred_at_minute,
    };
  }
}

/** Concrete intake entrypoint for an already-persisted care capture. */
export class PrismaCareCapturePlacementIntakeConsumer {
  private readonly service: NurtureCareCapturePlacementIntakeService;

  constructor(prisma: PlacementPrisma) {
    this.service = new NurtureCareCapturePlacementIntakeService(
      new PrismaCareCapturePlacementSourceAdapter(prisma),
      new NurtureClassScheduleService(new PrismaClassSchedulePlacementRepository(prisma)),
    );
  }

  consume(input: {
    workspace_id: string;
    capture_ref: string;
  }): Promise<NurtureCareCapturePlacementIntakeResult> {
    return this.service.consume(input);
  }
}
