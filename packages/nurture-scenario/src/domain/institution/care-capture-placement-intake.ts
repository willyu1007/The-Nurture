import {
  NurtureClassScheduleService,
  type NurturePlacementSource,
} from "./class-schedule-placement.js";

export type NurtureCareCapturePlacementSource = {
  capture_ref: string;
  institution_ref: string;
  care_group_ref: string;
  local_date: string;
  occurred_at_minute: number;
};

/** Exact-owner source adapter. A caller supplies no class, date or time fact. */
export type NurtureCareCapturePlacementSourcePort = {
  loadExactCaptureSource(input: {
    workspace_id: string;
    capture_ref: string;
  }): Promise<NurtureCareCapturePlacementSource | null>;
};

export type NurtureCareCapturePlacementIntakeResult =
  | { status: "unavailable"; reason_code: "unavailable" }
  | {
      status: "consumed";
      capture_ref: string;
      care_group_ref: string;
      local_date: string;
      applied: number;
      skipped: number;
    };

/**
 * The capture-intake consumer for 0D-2's deterministic pass. The source port
 * resolves the exact owner facts; the existing schedule service owns every
 * placement rule and its repository owns the storage-time write fence.
 */
export class NurtureCareCapturePlacementIntakeService {
  constructor(
    private readonly sources: NurtureCareCapturePlacementSourcePort,
    private readonly schedules: NurtureClassScheduleService,
  ) {}

  async consume(input: {
    workspace_id: string;
    capture_ref: string;
  }): Promise<NurtureCareCapturePlacementIntakeResult> {
    const source = await this.sources.loadExactCaptureSource(input);
    if (!source) return { status: "unavailable", reason_code: "unavailable" };

    const placementSource: NurturePlacementSource = {
      source_kind: "care_capture",
      source_id: source.capture_ref,
      occurred_at_minute: source.occurred_at_minute,
    };
    const result = await this.schedules.runAutomaticPass({
      workspace_id: input.workspace_id,
      institution_ref: source.institution_ref,
      care_group_ref: source.care_group_ref,
      local_date: source.local_date,
      sources: [placementSource],
    });
    return {
      status: "consumed",
      capture_ref: source.capture_ref,
      care_group_ref: source.care_group_ref,
      local_date: source.local_date,
      ...result,
    };
  }
}
