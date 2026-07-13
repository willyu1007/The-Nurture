import { describe, expect, it } from "vitest";
import type { ArtifactPreviewFacts, NurturePresenterDeps } from "../src/index.js";
import { createNurturePresenters } from "../src/index.js";
import { nurtureScenarioManifest } from "../src/registry.js";

const facts = (over: Partial<ArtifactPreviewFacts>): ArtifactPreviewFacts => ({
  artifact_id: "run-1:activity_comparison_summary",
  run_id: "run-1",
  artifact_type: "activity_comparison_summary",
  exposure_level: "L1",
  safe_title: "Activity comparison",
  safe_summary: "summary",
  safe_preview: "preview body",
  aggregate_version: 1,
  ...over,
});

const presentersWith = (preview: ArtifactPreviewFacts | null) => {
  const deps: NurturePresenterDeps = {
    artifacts: {
      getPreview: async () => preview,
      listRunPreviews: async () => (preview ? [preview] : []),
    },
  };
  return createNurturePresenters(nurtureScenarioManifest, deps);
};

describe("artifact_preview exposure filtering (default level L1)", () => {
  it("renders a full preview for an L1-visible artifact type", async () => {
    const p = presentersWith(facts({ artifact_type: "activity_comparison_summary" }));
    const r = await p.artifact_preview({ artifact_id: "run-1:activity_comparison_summary" });
    expect(r.safe_title).toBe("Activity comparison");
    expect(r.safe_preview).toBe("preview body");
    expect(r.unavailable_reason).toBeUndefined();
  });

  it("ref-only (no safe_*) for an unknown artifact type at L1", async () => {
    const p = presentersWith(facts({ artifact_type: "not_a_real_type" }));
    const r = await p.artifact_preview({ artifact_id: "run-1:x" });
    expect(r.unavailable_reason).toBe("unknown_artifact_type");
    expect(r.safe_title).toBeUndefined();
    expect(r.safe_summary).toBeUndefined();
    expect(r.safe_preview).toBeUndefined();
  });

  it("ref-only when the artifact is not found", async () => {
    const p = presentersWith(null);
    const r = await p.artifact_preview({ artifact_id: "missing" });
    expect(r.unavailable_reason).toBe("artifact_not_found");
    expect(r.safe_title).toBeUndefined();
  });

  it.each(["L0", "L4"] as const)("ref-only (no safe_*) for a never-exposable %s artifact", async (level) => {
    // even with a known type + a body present, L0/L4 must never render safe_*
    const p = presentersWith(facts({ artifact_type: "health_state_summary", exposure_level: level, safe_preview: "SECRET_BODY" }));
    const r = await p.artifact_preview({ artifact_id: "run-1:health_state_summary" });
    expect(r.unavailable_reason).toBe("exposure_level_restricted");
    expect(r.safe_title).toBeUndefined();
    expect(r.safe_summary).toBeUndefined();
    expect(r.safe_preview).toBeUndefined();
  });

  it("respects disjoint buckets: an L3-classified type renders, an L2-only type at L3 is ref-only", async () => {
    // health_state_summary is in the manifest L3 bucket -> visible at L3
    const visible = presentersWith(facts({ artifact_type: "health_state_summary", exposure_level: "L3" }));
    expect((await visible.artifact_preview({ artifact_id: "x" })).safe_title).toBeTruthy();
    // activity_comparison_summary is L2 (not L3) -> a stored L3 classification renders it ref-only
    const hidden = presentersWith(facts({ artifact_type: "activity_comparison_summary", exposure_level: "L3" }));
    const r = await hidden.artifact_preview({ artifact_id: "y" });
    expect(r.unavailable_reason).toBe("exposure_level_restricted");
    expect(r.safe_preview).toBeUndefined();
  });
});

describe("web_run_workbench exposure filtering", () => {
  it("includes the visible artifact with its preview", async () => {
    const p = presentersWith(facts({}));
    const r = await p.web_run_workbench({ workspace_id: "ws-1", run_id: "run-1" });
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]?.safe_preview).toBe("preview body");
  });
});

describe("chat_dashboard_summary never leaks artifact bodies", () => {
  it("returns only safe title/summary + refs", async () => {
    const p = presentersWith(facts({}));
    const r = await p.chat_dashboard_summary({ workspace_id: "ws-1" });
    expect(r.safe_title).toBeTruthy();
    expect(r.run_refs.length).toBeGreaterThan(0);
    expect(JSON.stringify(r)).not.toContain("preview body");
  });
});
