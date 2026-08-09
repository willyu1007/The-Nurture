import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaInstitutionSupportSignalRepository } from "../src/repositories/institution-support-signal.repository.js";

const row = () => ({
  id: "policy-1",
  workspaceId: "workspace-1",
  institutionId: "institution-1",
  careGroupId: null,
  contractVersion: "1.0.0",
  policyRef: "support-policy-1",
  category: "attendance_submission_overdue" as const,
  absoluteThreshold: null,
  windowKey: "local-day:2026-08-09",
  checkpointRef: "attendance:closeout",
  enabled: true,
  policyRevision: 1,
  effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
  effectiveTo: null,
  changedByRoleAssignmentId: "admin-role-1",
  changeReason: "Enable attendance reminder",
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  careGroup: null,
  changedByRoleAssignment: {
    workspaceId: "workspace-1",
    role: "institution_admin" as const,
    scopeType: "institution" as const,
    scopeId: "institution-1",
  },
});

const repository = (rows: unknown[]) => {
  const findMany = vi.fn(async () => rows);
  const sources = {
    loadAuthorizedSources: vi.fn(async () => ({
      status: "available" as const,
      sources: [],
    })),
  };
  return {
    findMany,
    sources,
    value: new PrismaInstitutionSupportSignalRepository(
      {
        nurtureInstitutionSupportSignalPolicy: { findMany },
      } as unknown as PrismaClient,
      sources,
    ),
  };
};

describe("PrismaInstitutionSupportSignalRepository", () => {
  it("maps effective policy audit facts and delegates source admission unchanged", async () => {
    const fixture = repository([row()]);
    await expect(
      fixture.value.loadEffectivePolicies({
        workspace_id: "workspace-1",
        institution_ref: "institution-1",
        snapshot_at: "2026-08-09T12:00:00.000Z",
      }),
    ).resolves.toEqual([
      {
        contract_version: "1.0.0",
        policy_ref: "support-policy-1",
        workspace_id: "workspace-1",
        institution_ref: "institution-1",
        category: "attendance_submission_overdue",
        window_key: "local-day:2026-08-09",
        checkpoint_ref: "attendance:closeout",
        enabled: true,
        policy_revision: 1,
        effective_from: "2026-08-01T00:00:00.000Z",
        changed_by_role_assignment_ref: "admin-role-1",
        change_reason: "Enable attendance reminder",
      },
    ]);
    expect(fixture.findMany).toHaveBeenCalledOnce();

    const request = {
      workspace_id: "workspace-1",
      participant_ref: "admin-1",
      institution_ref: "institution-1",
      snapshot_at: "2026-08-09T12:00:00.000Z",
    };
    await fixture.value.loadAuthorizedSources(request);
    expect(fixture.sources.loadAuthorizedSources).toHaveBeenCalledWith(request);
  });

  it("fails closed when the audit role is not the exact Institution Admin", async () => {
    const valid = row();
    const malformed = {
      ...valid,
      changedByRoleAssignment: {
        ...valid.changedByRoleAssignment,
        role: "caregiver" as const,
      },
    };
    const fixture = repository([malformed]);
    await expect(
      fixture.value.loadEffectivePolicies({
        workspace_id: "workspace-1",
        institution_ref: "institution-1",
        snapshot_at: "2026-08-09T12:00:00.000Z",
      }),
    ).rejects.toThrow("exact Admin audit actor");
  });
});
