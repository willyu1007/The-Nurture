export const DIRECTOR_PRESENTER_OVERVIEW_PATH =
  "/internal/nurture/director-presenter/v1/overview";
export const DIRECTOR_PRESENTER_DRILLDOWN_PATH =
  "/internal/nurture/director-presenter/v1/drilldown";
export const DIRECTOR_PRESENTER_MATERIALS_PATH =
  "/internal/nurture/director-presenter/v1/materials";

export const DIRECTOR_PRESENTER_INTERFACE = Object.freeze({
  key: "nurture.director-presenter",
  version: "1.0.0",
  digest:
    "sha256:6ce74306c0fc976feecb5f530cd1a43f5986e9c982cdb12a3b4b5a2a568c7ac1",
});

export type DirectorPresenterOperation =
  | "overview_query"
  | "drilldown_query"
  | "material_query";

export const DIRECTOR_PRESENTER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: DIRECTOR_PRESENTER_INTERFACE.key,
  interface_version: DIRECTOR_PRESENTER_INTERFACE.version,
  interface_digest: DIRECTOR_PRESENTER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  mobile_mode: "read_only" as const,
  paths: Object.freeze({
    overview_query: DIRECTOR_PRESENTER_OVERVIEW_PATH,
    drilldown_query: DIRECTOR_PRESENTER_DRILLDOWN_PATH,
    material_query: DIRECTOR_PRESENTER_MATERIALS_PATH,
  }),
});
