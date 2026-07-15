import type { DomainContextRef, WorkflowPolicies } from "@my-chat/workflow-contracts";
import { defaultNurtureDeps, type NurtureHandlerDeps } from "./deps.js";
import { nurtureScenarioManifest } from "./registry.js";
import { NurtureUserAttentionService } from "./domain/institution/user-attention-activation.js";

// Port-derived, FAIL-CLOSED handoff/exposure gates. Caller-supplied bag values
// (exposure_level, guardian_approval, ...) are UNTRUSTED hints; authoritative
// facts come from the resolver + project port. Any missing/unresolvable input,
// resolver miss, or error => false.

const ap = nurtureScenarioManifest.artifact_policy;
const handoffsByType = new Map(
  nurtureScenarioManifest.handoffs
    .filter((handoff) => handoff.materialization_mode === undefined)
    .map((handoff) => [handoff.handoff_type, handoff]),
);
const HANDOFF_BUCKET: Record<string, string> = { public_draft: "public_draft", knowledge_candidate: "indexing", notification: "notification" };
const EXTERNALIZING = new Set(["public_draft", "knowledge_candidate"]);

type GateBag = {
  workspace_id?: string;
  project_id?: string;
  run_id?: string;
  source?: { artifact_id?: string };
};

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

const parseBag = (input: Record<string, unknown>): GateBag => {
  const source = input.source && typeof input.source === "object" ? (input.source as { artifact_id?: unknown }) : undefined;
  return {
    workspace_id: str(input.workspace_id),
    project_id: str(input.project_id),
    run_id: str(input.run_id),
    source: source ? { artifact_id: str(source.artifact_id) } : undefined,
  };
};

const isEligible = (handoffType: string, artifactType: string): boolean => {
  const bucket = HANDOFF_BUCKET[handoffType];
  if (!bucket) return false;
  const bucketList = (ap.handoff_eligible as Record<string, string[]>)[bucket] ?? [];
  const sources = handoffsByType.get(handoffType)?.source_artifact_types ?? [];
  return bucketList.includes(artifactType) && sources.includes(artifactType);
};

const exposurePermitted = (handoffType: string, artifactType: string, exposureLevel: string): boolean => {
  const allowedLevels = EXTERNALIZING.has(handoffType) ? ["L1", "L2"] : ["L1", "L3"]; // notification is an internal push
  if (!allowedLevels.includes(exposureLevel)) return false;
  return ((ap.exposure_levels as Record<string, string[]>)[exposureLevel] ?? []).includes(artifactType);
};

export const createNurturePolicies = (deps: NurtureHandlerDeps): WorkflowPolicies => {
  const resolveSource = async (ws: string, bag: GateBag) => {
    if (!bag.source?.artifact_id) return null;
    return deps.canonicalResolver.resolveArtifact({ workspace_id: ws, artifact_id: bag.source.artifact_id });
  };

  // The escalation/approval target is the resolved ARTIFACT's authoritative
  // owning project/run — NEVER the caller-supplied bag (which a caller could
  // point at a clean sibling project to bypass an escalation on the real owner).
  type Target = { project_id?: string; run_id?: string };

  // True only if we can CONFIRM the owning project is not medically escalated.
  const noMedicalEscalation = async (ws: string, target: Target): Promise<boolean> => {
    const project = target.project_id
      ? await deps.repositories.projects.getById({ workspace_id: ws, project_id: target.project_id })
      : target.run_id
        ? await deps.repositories.projects.getByWorkflowRunId({ workspace_id: ws, workflow_run_id: target.run_id })
        : null;
    if (!project) return false; // cannot confirm => fail closed
    return project.status !== "escalated" && !project.escalated_at;
  };

  const guardianApproved = async (ws: string, target: Target): Promise<boolean> => {
    if (!target.project_id && !target.run_id) return false;
    const state = await deps.canonicalResolver.resolveApprovalState({ workspace_id: ws, run_id: target.run_id, project_id: target.project_id });
    return state?.guardian_approved === true;
  };

  const handoffGate = (handoffType: string, requireApproval: boolean) => async (input: Record<string, unknown>): Promise<boolean> => {
    const bag = parseBag(input);
    const ws = bag.workspace_id;
    if (!ws) return false;
    const src = await resolveSource(ws, bag);
    if (!src) return false;
    // bind the safety/approval decision to the artifact's own owner; fail closed if unknown.
    const target: Target = { project_id: src.owning_project_id, run_id: src.owning_run_id };
    if (!target.project_id && !target.run_id) return false;
    if (!isEligible(handoffType, src.artifact_type)) return false;
    if (!exposurePermitted(handoffType, src.artifact_type, src.exposure_level)) return false;
    if (!(await noMedicalEscalation(ws, target))) return false;
    if (requireApproval && !(await guardianApproved(ws, target))) return false;
    return true;
  };

  return {
    "nurture.can_create_public_draft_handoff": handoffGate("public_draft", true),
    "nurture.can_create_knowledge_candidate_handoff": handoffGate("knowledge_candidate", true),
    "nurture.can_create_notification_handoff": handoffGate("notification", false),
    "nurture.can_request_user_attention": async (input) => {
      if (!deps.repositories.userAttention) return false;
      const workspaceId = str(input.workspace_id);
      const sourceRefs = input.source_context_refs;
      if (!workspaceId || !Array.isArray(sourceRefs)) return false;
      try {
        const resolution = await new NurtureUserAttentionService(
          deps.repositories.userAttention,
        ).resolve({
          workspace_id: workspaceId,
          source_context_refs: sourceRefs as DomainContextRef[],
          ...(str(input.actor_user_id) ? { actor_user_id: str(input.actor_user_id)! } : {}),
        });
        return resolution.status === "ready";
      } catch {
        return false;
      }
    },
    "nurture.can_expose_artifact": async (input) => {
      const bag = parseBag(input);
      const ws = bag.workspace_id;
      if (!ws) return false;
      const src = await resolveSource(ws, bag);
      if (!src) return false;
      const target: Target = { project_id: src.owning_project_id, run_id: src.owning_run_id };
      if (!target.project_id && !target.run_id) return false; // cannot bind to an owner => fail closed
      const allowed = ["L1", "L2", "L3"]; // L0/L4 are never exposable
      if (!allowed.includes(src.exposure_level)) return false;
      if (!((ap.exposure_levels as Record<string, string[]>)[src.exposure_level] ?? []).includes(src.artifact_type)) return false;
      return noMedicalEscalation(ws, target);
    },
    // Direct project-escalation query (no artifact in play): the caller asks
    // about a specific project/run, so the bag identifiers ARE the target.
    "nurture.medical_safety_boundary": async (input) => {
      const bag = parseBag(input);
      return bag.workspace_id ? noMedicalEscalation(bag.workspace_id, { project_id: bag.project_id, run_id: bag.run_id }) : false;
    },
  };
};

export const nurturePolicies: WorkflowPolicies = createNurturePolicies(defaultNurtureDeps);
