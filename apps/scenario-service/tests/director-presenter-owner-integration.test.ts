import {
  createDirectorPresenterService,
  DIRECTOR_PRESENTER_INTERFACE,
  type DirectorPresenterReadPortV1,
} from "@the-nurture/scenario";
import { describe, expect, it, vi } from "vitest";
import { DirectorPresenterComposition } from "../src/director-presenter-composition.js";

const NOW = new Date("2026-08-15T08:00:00.000Z");
const identity = {
  interface_contract: DIRECTOR_PRESENTER_INTERFACE,
  workspace_id: "workspace-a",
  my_chat_user_id: "director-a",
  host_request_id: "request-a",
  context_ref: "context-a",
} as const;

describe("director presenter real owner contract", () => {
  it("validates real overview, drilldown and protected denial responses", async () => {
    const reads: DirectorPresenterReadPortV1 = {
      loadDirectorContext: vi.fn(async () => ({
        status: "resolved" as const,
        facts: {
          participant_id: "participant-a",
          participant_version: 2,
          role_assignment_id: "role-a",
          role_version: 3,
          institution_id: "institution-a",
          institution_version: 4,
        },
      })),
      loadOverviewFacts: vi.fn(async () => ({
        status: "current" as const,
        value: {
          organization_display_name: "晨光幼儿园",
          attendance: {
            status: "current" as const,
            value: { present_count: 18, roster_count: 20 },
          },
          activity: { status: "current" as const, value: { count: 4 } },
          message_response: {
            status: "current" as const,
            value: { responded_count: 7, total_count: 8 },
          },
          home_kindergarten_flow: {
            status: "current" as const,
            value: {
              home_to_kindergarten_count: 3,
              kindergarten_to_home_count: 5,
            },
          },
          authorization_changes: {
            status: "current" as const,
            value: { count: 2 },
          },
          trend: {
            status: "current" as const,
            value: { points: [1, 2, 3, 2, 4, 3, 5] },
          },
          family_focus_attention: {
            status: "current" as const,
            value: { count: 1 },
          },
        },
      })),
      loadDrilldownFacts: vi.fn(async () => ({
        status: "current" as const,
        value: {
          organization_display_name: "晨光幼儿园",
          rows: [{
            care_group_id: "group-a",
            class_label: "向日葵班",
            status: "current" as const,
            primary_value: 18,
            secondary_value: 20,
          }],
        },
      })),
      authorityIsCurrent: vi.fn(async () => true),
    };
    const binding = createDirectorPresenterService({
      reads,
      integrityKey: "director-presenter-integrity-key-32-bytes",
      now: () => NOW,
    });
    const composition = new DirectorPresenterComposition(
      binding.authorityResolver,
      binding.owner,
    );

    const overview = await composition.overview({
      ...identity,
      local_date: "2026-08-15",
    }) as Record<string, unknown>;
    const sections = overview.sections as Array<Record<string, unknown>>;
    const attendance = sections.find(
      (section) => section.section_key === "attendance",
    );
    const drilldownRef = String(attendance?.drilldown_ref);
    const operationEntry = sections.find(
      (section) => section.section_key === "operation_entry",
    );
    const overviewCache = overview.cache_partition as Record<string, unknown>;

    expect(overview).toMatchObject({
      status: "ready",
      generated_at: NOW.toISOString(),
      overall_state: "partial",
    });
    expect(overviewCache).toMatchObject({
      operation: "overview_query",
      query_key: "2026-08-15",
      expires_at: "2026-08-15T08:01:00.000Z",
    });
    expect(operationEntry).toMatchObject({
      status: "unavailable",
      availability: "web_workbench_required",
    });
    expect(JSON.stringify(overview)).not.toMatch(
      /participant-a|role-a|institution-a|action_ref|confirmation_ref|command_request_id/,
    );

    const drilldown = await composition.drilldown({
      ...identity,
      host_request_id: "request-b",
      drilldown_ref: drilldownRef,
    }) as Record<string, unknown>;
    expect(drilldown).toMatchObject({
      status: "ready",
      drilldown_ref: drilldownRef,
    });
    expect(drilldown.cache_partition).toMatchObject({
      operation: "drilldown_query",
      query_key: drilldownRef,
    });

    await expect(composition.materials({
      ...identity,
      host_request_id: "request-c",
      collection_ref: "opaque-collection-ref",
      cursor: "opaque-page-cursor",
    })).resolves.toMatchObject({
      status: "masked",
      context_ref: "context-a",
      mask_signal: {
        reason_code: "protected_material_denied",
        material_access_invalidated: true,
      },
    });
    expect(reads.loadDirectorContext).toHaveBeenCalledTimes(3);
    expect(reads.loadOverviewFacts).toHaveBeenCalledOnce();
    expect(reads.loadDrilldownFacts).toHaveBeenCalledOnce();
    expect(reads.authorityIsCurrent).toHaveBeenCalledOnce();
  });
});
