import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { PrismaInstitutionPublicationPolicyReadPort } from "../src/repositories/institution-publication-policy.read.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const seedInstitution = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Policy Test Institution", status: "active" },
  });
  return { workspaceId, institution };
};

const policyData = (
  scope: Awaited<ReturnType<typeof seedInstitution>>,
  overrides: Partial<{
    policyRef: string;
    policyVersion: number;
    policyHead: number;
    timeZone: string;
    effectiveFrom: Date;
    supersededAt: Date;
  }> = {},
) => ({
  workspaceId: scope.workspaceId,
  institutionId: scope.institution.id,
  policyRef: "nurture.institution-publication-policy@1.0.0",
  policyVersion: 1,
  policyHead: 1,
  timeZone: "Asia/Shanghai",
  defaultReleaseLocalTime: "17:00",
  retryCutoffLocalTime: "19:00",
  organizeIdleSeconds: 600,
  organizeFallbackLeadSeconds: 1800,
  automaticQuiescenceSeconds: 60,
  captureActivityLeaseSeconds: 60,
  automaticOrganizeEnabled: true,
  effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("T-007 publication-policy owner provider", () => {
  it("rereads the exact Institution version/head without a JSON fallback", async () => {
    const scope = await seedInstitution();
    await prisma.nurtureInstitutionPublicationPolicy.create({ data: policyData(scope) });
    const provider = new PrismaInstitutionPublicationPolicyReadPort(prisma);
    await expect(
      provider.loadCurrentInstitutionPublicationPolicy({
        workspace_id: scope.workspaceId,
        institution_id: scope.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      institution_ref: scope.institution.id,
      policy_ref: "nurture.institution-publication-policy@1.0.0",
      policy_version: 1,
      policy_head: 1,
      time_zone: "Asia/Shanghai",
    });
    await expect(
      provider.loadCurrentInstitutionPublicationPolicy({
        workspace_id: randomUUID(),
        institution_id: scope.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toBeNull();
  });

  it("fails closed on missing, ambiguous and invalid effective policy", async () => {
    const missing = await seedInstitution();
    const provider = new PrismaInstitutionPublicationPolicyReadPort(prisma);
    await expect(
      provider.loadCurrentInstitutionPublicationPolicy({
        workspace_id: missing.workspaceId,
        institution_id: missing.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toBeNull();

    const ambiguous = await seedInstitution();
    await prisma.nurtureInstitutionPublicationPolicy.createMany({
      data: [
        policyData(ambiguous),
        policyData(ambiguous, { policyVersion: 2, policyHead: 2 }),
      ],
    });
    await expect(
      provider.loadCurrentInstitutionPublicationPolicy({
        workspace_id: ambiguous.workspaceId,
        institution_id: ambiguous.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toBeNull();

    const invalid = await seedInstitution();
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: policyData(invalid, { timeZone: "Mars/Olympus" }),
    });
    await expect(
      provider.loadCurrentInstitutionPublicationPolicy({
        workspace_id: invalid.workspaceId,
        institution_id: invalid.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toBeNull();

    const unavailableOwner = await seedInstitution();
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: policyData(unavailableOwner),
    });
    await prisma.nurtureCareInstitution.update({
      where: { id: unavailableOwner.institution.id },
      data: { status: "paused" },
    });
    await expect(
      provider.loadCurrentInstitutionPublicationPolicy({
        workspace_id: unavailableOwner.workspaceId,
        institution_id: unavailableOwner.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toBeNull();
  });

  it("rejects contract mismatch and unknown version/head at the owner boundary", async () => {
    const scope = await seedInstitution();
    await expect(
      prisma.nurtureInstitutionPublicationPolicy.create({
        data: policyData(scope, {
          policyRef: "nurture.institution-publication-policy@2.0.0",
        }),
      }),
    ).rejects.toThrow(/ck_nurture_publication_policy_contract/);
    await expect(
      prisma.nurtureInstitutionPublicationPolicy.create({
        data: policyData(scope, { policyVersion: 0 }),
      }),
    ).rejects.toThrow(/ck_nurture_publication_policy_heads/);
    await expect(
      prisma.nurtureInstitutionPublicationPolicy.create({
        data: policyData(scope, { policyHead: 0 }),
      }),
    ).rejects.toThrow(/ck_nurture_publication_policy_heads/);
  });

  it("fails closed when a newly effective policy moves an owner head backwards", async () => {
    const scope = await seedInstitution();
    await prisma.nurtureInstitutionPublicationPolicy.createMany({
      data: [
        policyData(scope, {
          policyVersion: 2,
          policyHead: 2,
          effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
          supersededAt: new Date("2026-06-01T00:00:00.000Z"),
        }),
        policyData(scope, {
          policyVersion: 3,
          policyHead: 1,
          effectiveFrom: new Date("2026-06-01T00:00:00.000Z"),
        }),
      ],
    });
    await expect(
      new PrismaInstitutionPublicationPolicyReadPort(
        prisma,
      ).loadCurrentInstitutionPublicationPolicy({
        workspace_id: scope.workspaceId,
        institution_id: scope.institution.id,
        at: "2026-08-05T00:00:00.000Z",
      }),
    ).resolves.toBeNull();
  });
});
