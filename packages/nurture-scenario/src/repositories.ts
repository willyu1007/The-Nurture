import type { CanonicalRef, DomainContextRef } from "./types.js";

export type NurtureProfileProjection = {
  profile_id: string;
  workspace_id: string;
  canonical_object_ref: DomainContextRef;
  scenario_key: "nurture";
  projection_version: number;
  safe_summary: string;
};

export type ActivityComparisonDraft = {
  comparison_id: string;
  workspace_id: string;
  target_refs: DomainContextRef[];
  option_refs: CanonicalRef[];
  safe_summary: string;
};

export type NurtureProfileRepository = {
  getByCanonicalObjectRef(input: { workspace_id: string; canonical_object_ref: DomainContextRef }): Promise<NurtureProfileProjection | null>;
  upsertProjection(input: NurtureProfileProjection): Promise<NurtureProfileProjection>;
};

export type ActivityComparisonRepository = {
  createDraft(input: ActivityComparisonDraft): Promise<ActivityComparisonDraft>;
  getDraft(input: { workspace_id: string; comparison_id: string }): Promise<ActivityComparisonDraft | null>;
};

export type NurtureEvidenceRepository = {
  appendEvidenceRef(input: { workspace_id: string; target_ref: CanonicalRef; evidence_ref: CanonicalRef; reason_code: string }): Promise<CanonicalRef>;
};

export type NurtureRepositories = {
  profiles: NurtureProfileRepository;
  activityComparisons: ActivityComparisonRepository;
  evidence: NurtureEvidenceRepository;
};

export const repositoryTokens = {
  profiles: "nurture.repositories.profiles",
  activityComparisons: "nurture.repositories.activity_comparisons",
  evidence: "nurture.repositories.evidence",
} as const;

export const createRepositoryPorts = (repositories: NurtureRepositories): NurtureRepositories => repositories;
