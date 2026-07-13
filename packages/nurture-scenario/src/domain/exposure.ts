// Pure exposure-visibility resolver for presenters. Data-driven from the
// manifest's artifact_policy.exposure_levels — the levels are INDEPENDENT named
// buckets, NOT a monotonic ladder. Fail-closed: unknown type/level -> ref-only.

export type ExposureLevels = Record<string, string[]>; // e.g. { L0:[], L1:[...], ... }

export type VisibilityReason = "exposure_level_restricted" | "unknown_artifact_type" | "unknown_exposure_level";
export type ArtifactVisibility = { visible: true } | { visible: false; reason: VisibilityReason };

export type ExposureResolver = {
  isVisible(artifactType: string, requestedLevel: string): ArtifactVisibility;
  visibleTypes(requestedLevel: string): string[];
};

export const buildExposureResolver = (exposureLevels: ExposureLevels): ExposureResolver => {
  const sets = new Map<string, Set<string>>();
  for (const [level, types] of Object.entries(exposureLevels)) sets.set(level, new Set(types));
  const allTypes = new Set<string>(Object.values(exposureLevels).flat());

  return {
    isVisible(artifactType, requestedLevel) {
      const set = sets.get(requestedLevel);
      if (!set) return { visible: false, reason: "unknown_exposure_level" };
      if (!allTypes.has(artifactType)) return { visible: false, reason: "unknown_artifact_type" };
      return set.has(artifactType) ? { visible: true } : { visible: false, reason: "exposure_level_restricted" };
    },
    visibleTypes(requestedLevel) {
      return [...(sets.get(requestedLevel) ?? [])];
    },
  };
};
