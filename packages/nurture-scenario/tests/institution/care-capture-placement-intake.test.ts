import { describe, expect, it } from "vitest";
import {
  NurtureCareCapturePlacementIntakeService,
  NurtureClassScheduleService,
  zonedInstantToLocalDateTime,
  type NurtureCareCapturePlacementSourcePort,
  type NurtureClassSchedulePlacementRepository,
} from "../../src/index.js";

const facts = {
  capture_ref: "capture-1",
  institution_ref: "institution-1",
  care_group_ref: "class-1",
  local_date: "2026-08-09",
  occurred_at_minute: 600,
};

const sourcePort = (
  value: typeof facts | null,
): NurtureCareCapturePlacementSourcePort => ({
  loadExactCaptureSource: async () => value,
});

const placementRepository = () => {
  const writes: Parameters<NurtureClassSchedulePlacementRepository["writePlacement"]>[0][] = [];
  const repository: NurtureClassSchedulePlacementRepository = {
    loadScheduleLayers: async () => [
      {
        resolved_from: "class_standing",
        slots: [
          { slot_ref: "morning", label: "Morning", starts_at_minute: 540, ends_at_minute: 660 },
        ],
        updated_at_ms: 1,
      },
    ],
    loadPlacement: async () => null,
    writePlacement: async (input) => {
      writes.push(input);
      return true;
    },
  };
  return { repository, writes };
};

describe("0D-2 care-capture placement intake", () => {
  it("resolves the Institution-local date and minute across UTC midnight", () => {
    expect(
      zonedInstantToLocalDateTime(
        new Date("2026-08-08T16:30:00.000Z"),
        "Asia/Shanghai",
      ),
    ).toMatchObject({ local_date: "2026-08-09", minutes_of_day: 30 });
    expect(
      zonedInstantToLocalDateTime(new Date("invalid"), "Asia/Shanghai"),
    ).toBeNull();
    expect(
      zonedInstantToLocalDateTime(new Date("2026-08-08T16:30:00.000Z"), "Mars/Olympus"),
    ).toBeNull();
  });

  it("derives the placement only from exact-owner source facts", async () => {
    const placement = placementRepository();
    const service = new NurtureCareCapturePlacementIntakeService(
      sourcePort(facts),
      new NurtureClassScheduleService(placement.repository),
    );

    await expect(
      service.consume({ workspace_id: "workspace-1", capture_ref: "capture-1" }),
    ).resolves.toEqual({
      status: "consumed",
      capture_ref: "capture-1",
      care_group_ref: "class-1",
      local_date: "2026-08-09",
      applied: 1,
      skipped: 0,
    });
    expect(placement.writes).toEqual([
      {
        workspace_id: "workspace-1",
        source_kind: "care_capture",
        source_id: "capture-1",
        care_group_ref: "class-1",
        local_date: "2026-08-09",
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      },
    ]);
  });

  it("fails closed before schedule access when the owner source is unavailable", async () => {
    let scheduleReads = 0;
    const repository: NurtureClassSchedulePlacementRepository = {
      loadScheduleLayers: async () => {
        scheduleReads += 1;
        return [];
      },
      loadPlacement: async () => null,
      writePlacement: async () => true,
    };
    const service = new NurtureCareCapturePlacementIntakeService(
      sourcePort(null),
      new NurtureClassScheduleService(repository),
    );

    await expect(
      service.consume({ workspace_id: "workspace-1", capture_ref: "missing" }),
    ).resolves.toEqual({ status: "unavailable", reason_code: "unavailable" });
    expect(scheduleReads).toBe(0);
  });
});
