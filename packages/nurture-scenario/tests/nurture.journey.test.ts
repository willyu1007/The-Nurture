import { compareActivities, collectContext } from "../src/handlers/p0-handlers.js";
import { nurtureScenarioManifest } from "../src/registry.js";
import { activityComparisonStepInput, familyContextRef } from "./fixtures/nurture-run.fixture.js";

export const nurtureP0Journey = {
  scenario_key: nurtureScenarioManifest.scenario_key,
  capability_key: "activity_comparison",
  entrypoint_key: "compare_activity_options",
  required_context_refs: [familyContextRef],
  expected_artifact_type: "activity_comparison_summary",
};

export const runNurtureP0JourneyFixture = async (): Promise<boolean> => {
  const contextResult = await collectContext(activityComparisonStepInput);
  const comparisonResult = await compareActivities(activityComparisonStepInput);
  return (
    nurtureP0Journey.scenario_key === "nurture" &&
    contextResult.status === "completed" &&
    comparisonResult.artifact_drafts?.[0]?.artifact_type === nurtureP0Journey.expected_artifact_type
  );
};
