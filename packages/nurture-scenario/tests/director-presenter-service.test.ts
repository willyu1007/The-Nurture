import { describe, expect, it, vi } from "vitest";
import {
  createDirectorPresenterService,
  type DirectorOverviewFactsV1,
  type DirectorPresenterExactAuthorityV1,
  type DirectorPresenterReadPortV1,
} from "../src/director-presenter-service.js";
import { DIRECTOR_PRESENTER_INTERFACE } from "../src/director-presenter-contract.js";

const NOW = new Date("2026-08-15T08:00:00.000Z");
const KEY = "director-presenter-integrity-key-32-bytes";
const identity = {
  interface_contract: DIRECTOR_PRESENTER_INTERFACE,
  workspace_id: "workspace-a",
  my_chat_user_id: "director-a",
  host_request_id: "request-a",
  context_ref: "context-a",
} as const;

const overviewFacts = (): DirectorOverviewFactsV1 => ({
  organization_display_name: "晨光幼儿园",
  attendance: {
    status: "current",
    value: { present_count: 18, roster_count: 20 },
  },
  activity: { status: "current", value: { count: 4 } },
  message_response: {
    status: "current",
    value: { responded_count: 7, total_count: 8 },
  },
  home_kindergarten_flow: {
    status: "current",
    value: {
      home_to_kindergarten_count: 3,
      kindergarten_to_home_count: 5,
    },
  },
  authorization_changes: { status: "current", value: { count: 2 } },
  trend: { status: "current", value: { points: [1, 2, 3, 2, 4, 3, 5] } },
  family_focus_attention: { status: "current", value: { count: 1 } },
});

const exact = {
  participant_id: "participant-a",
  participant_version: 2,
  role_assignment_id: "role-a",
  role_version: 3,
  institution_id: "institution-a",
  institution_version: 4,
} as const;

const reads = (facts = overviewFacts()): DirectorPresenterReadPortV1 => ({
  loadDirectorContext: vi.fn(async () => ({
    status: "resolved" as const,
    facts: exact,
  })),
  loadOverviewFacts: vi.fn(async () => ({
    status: "current" as const,
    value: facts,
  })),
  loadDrilldownFacts: vi.fn(async () => ({
    status: "current" as const,
    value: {
      organization_display_name: facts.organization_display_name,
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
});

const resolve = async (
  service: ReturnType<typeof createDirectorPresenterService>,
): Promise<DirectorPresenterExactAuthorityV1> => {
  const result = await service.authorityResolver.resolve({
    ...identity,
    operation: "overview_query",
  });
  if (result.status !== "resolved") throw new Error("expected resolved authority");
  return result.owner_resolution;
};

describe("director presenter service", () => {
  it("composes exactly eleven safe overview sections from current owner facts", async () => {
    const supportSignals = {
      compose: vi.fn(async () => ({
        status: "ok" as const,
        output: {
          contract_version: "1.0.0" as const,
          institution_ref: exact.institution_id,
          snapshot_at: NOW.toISOString(),
          projection_version: 1 as const,
          signals: [{
            category: "configured_load_threshold" as const,
            tier: "attention_suggested" as const,
            scopeRef: "group-a",
            sourceRef: "support-a",
            safeReason: "The configured pending-work threshold is reached.",
            currentCount: 6,
            occurredAt: NOW.toISOString(),
            policyRevision: 2,
            contractVersion: "1.0.0" as const,
          }],
        },
      })),
    };
    const service = createDirectorPresenterService({
      reads: reads(),
      supportSignals,
      integrityKey: KEY,
      now: () => NOW,
    });
    const authority = await resolve(service);
    const response = await service.owner.overview({
      authority,
      request: { ...identity, local_date: "2026-08-15" },
    }) as Record<string, unknown>;
    const sections = response.sections as Array<Record<string, unknown>>;

    expect(response.status).toBe("ready");
    expect(sections).toHaveLength(11);
    expect(new Set(sections.map((section) => section.section_key)).size).toBe(11);
    expect(sections.find((section) => section.section_key === "attendance"))
      .toMatchObject({
        status: "ready",
        metric: { primary_value: 18, secondary_value: 20, unit: "ratio" },
      });
    expect(sections.find((section) => section.section_key === "class_load_attention"))
      .toMatchObject({ status: "ready", metric: { primary_value: 1 } });
    expect(sections.find((section) => section.section_key === "philosophy_observation"))
      .toEqual({
        section_key: "philosophy_observation",
        status: "unavailable",
        title: "理念与实践观察",
        availability: "not_available",
      });
    expect(sections.find((section) => section.section_key === "organized_materials"))
      .toMatchObject({ status: "unavailable", availability: "not_available" });
    expect(sections.find((section) => section.section_key === "operation_entry"))
      .toMatchObject({
        status: "unavailable",
        availability: "web_workbench_required",
      });
    expect(JSON.stringify(response)).not.toMatch(
      /participant_id|role_assignment_id|institution_id|action_ref|storage_ref/,
    );
  });

  it("keeps an incomplete source unavailable instead of presenting zero", async () => {
    const facts = overviewFacts();
    const service = createDirectorPresenterService({
      reads: reads({ ...facts, attendance: { status: "unavailable" } }),
      integrityKey: KEY,
      now: () => NOW,
    });
    const response = await service.owner.overview({
      authority: await resolve(service),
      request: { ...identity, local_date: "2026-08-15" },
    }) as Record<string, unknown>;
    const attendance = (response.sections as Array<Record<string, unknown>>)
      .find((section) => section.section_key === "attendance");

    expect(attendance).toMatchObject({
      status: "unavailable",
      availability: "not_available",
    });
    expect(attendance).not.toHaveProperty("metric");
    expect(attendance).not.toHaveProperty("drilldown_ref");
  });

  it("binds signed drilldown refs to workspace, authority and cache lifetime", async () => {
    let clock = NOW;
    const readPort = reads();
    const service = createDirectorPresenterService({
      reads: readPort,
      integrityKey: KEY,
      now: () => clock,
    });
    const authority = await resolve(service);
    const overview = await service.owner.overview({
      authority,
      request: { ...identity, local_date: "2026-08-15" },
    }) as Record<string, unknown>;
    const attendance = (overview.sections as Array<Record<string, unknown>>)
      .find((section) => section.section_key === "attendance");
    const drilldownRef = String(attendance?.drilldown_ref);
    const request = { ...identity, drilldown_ref: drilldownRef };

    await expect(service.owner.drilldown({ authority, request })).resolves
      .toMatchObject({ status: "ready", drilldown_ref: drilldownRef });
    await expect(service.owner.drilldown({
      authority,
      request: { ...request, drilldown_ref: `${drilldownRef}0` },
    })).resolves.toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "context_changed" },
    });
    await expect(service.owner.drilldown({
      authority,
      request: { ...request, workspace_id: "workspace-b" },
    })).resolves.toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "context_changed" },
    });
    clock = new Date(NOW.getTime() + 60_001);
    await expect(service.owner.drilldown({ authority, request })).resolves
      .toMatchObject({
        status: "masked",
        mask_signal: { reason_code: "context_changed" },
      });
  });

  it("closes ambiguous authority and rechecks authority before every material open", async () => {
    const ambiguousReads = reads();
    ambiguousReads.loadDirectorContext = vi.fn(async () => ({
      status: "ambiguous_institution" as const,
    }));
    const ambiguous = createDirectorPresenterService({
      reads: ambiguousReads,
      integrityKey: KEY,
      now: () => NOW,
    });
    await expect(ambiguous.authorityResolver.resolve({
      ...identity,
      operation: "overview_query",
    })).resolves.toMatchObject({
      status: "closed",
      response: {
        status: "masked",
        mask_signal: { reason_code: "ambiguous_institution" },
      },
    });

    const readPort = reads();
    readPort.authorityIsCurrent = vi.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const service = createDirectorPresenterService({
      reads: readPort,
      integrityKey: KEY,
      now: () => NOW,
    });
    const authority = await resolve(service);
    const request = { ...identity, collection_ref: "collection-a" };
    await expect(service.owner.materials({ authority, request })).resolves
      .toMatchObject({
        status: "masked",
        mask_signal: { reason_code: "protected_material_denied" },
      });
    await expect(service.owner.materials({ authority, request })).resolves
      .toMatchObject({
        status: "masked",
        mask_signal: { reason_code: "access_changed" },
      });
    expect(readPort.authorityIsCurrent).toHaveBeenCalledTimes(2);
  });
});
