import { Prisma, type NurtureProjectStatus, type PrismaClient } from "@prisma/client";

// Host-facing data accessors for the scenario-local tables. These return the
// data layer's row entities (re-exported as domain aliases from the package
// index); the scenario business layer never imports these — it uses the ports.

export class FamilyProfileSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureFamilyProfileSnapshotUncheckedCreateInput) {
    return this.prisma.nurtureFamilyProfileSnapshot.create({ data });
  }
  findById(id: string) {
    return this.prisma.nurtureFamilyProfileSnapshot.findFirst({ where: { id, deletedAt: null } });
  }
  listByFamily(workspaceId: string, familyRefKey: string) {
    return this.prisma.nurtureFamilyProfileSnapshot.findMany({
      where: { workspaceId, familyRefKey, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class ChildProfileSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureChildProfileSnapshotUncheckedCreateInput) {
    return this.prisma.nurtureChildProfileSnapshot.create({ data });
  }
  findById(id: string) {
    return this.prisma.nurtureChildProfileSnapshot.findFirst({ where: { id, deletedAt: null } });
  }
  listByChild(workspaceId: string, childRefKey: string) {
    return this.prisma.nurtureChildProfileSnapshot.findMany({
      where: { workspaceId, childRefKey, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class FamilyCharterRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureFamilyCharterUncheckedCreateInput) {
    return this.prisma.nurtureFamilyCharter.create({ data });
  }
  addItem(data: Prisma.NurtureFamilyCharterItemUncheckedCreateInput) {
    return this.prisma.nurtureFamilyCharterItem.create({ data });
  }
  getWithItems(id: string) {
    return this.prisma.nurtureFamilyCharter.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
  }
  listByFamily(workspaceId: string, familyRefKey: string) {
    return this.prisma.nurtureFamilyCharter.findMany({
      where: { workspaceId, familyRefKey, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class FocusCycleRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureFocusCycleUncheckedCreateInput) {
    return this.prisma.nurtureFocusCycle.create({ data });
  }
  addGoal(data: Prisma.NurtureFocusGoalUncheckedCreateInput) {
    return this.prisma.nurtureFocusGoal.create({ data });
  }
  getWithGoals(id: string) {
    return this.prisma.nurtureFocusCycle.findFirst({
      where: { id, deletedAt: null },
      include: { goals: true },
    });
  }
  listByFamily(workspaceId: string, familyRefKey: string) {
    return this.prisma.nurtureFocusCycle.findMany({
      where: { workspaceId, familyRefKey, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class FamilyQuantificationSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureFamilyQuantificationSnapshotUncheckedCreateInput) {
    return this.prisma.nurtureFamilyQuantificationSnapshot.create({ data });
  }
  findById(id: string) {
    return this.prisma.nurtureFamilyQuantificationSnapshot.findFirst({ where: { id, deletedAt: null } });
  }
  listByFamily(workspaceId: string, familyRefKey: string) {
    return this.prisma.nurtureFamilyQuantificationSnapshot.findMany({
      where: { workspaceId, familyRefKey, deletedAt: null },
      orderBy: { capturedAt: "desc" },
    });
  }
}

export class MetricRepository {
  constructor(private readonly prisma: PrismaClient) {}
  defineMetric(data: Prisma.NurtureMetricDefinitionUncheckedCreateInput) {
    return this.prisma.nurtureMetricDefinition.create({ data });
  }
  recordObservation(data: Prisma.NurtureMetricObservationUncheckedCreateInput) {
    return this.prisma.nurtureMetricObservation.create({ data });
  }
  listObservations(workspaceId: string, familyRefKey: string, metricCode?: string) {
    return this.prisma.nurtureMetricObservation.findMany({
      where: { workspaceId, familyRefKey, ...(metricCode ? { metricCode } : {}), deletedAt: null },
      orderBy: { observedAt: "desc" },
    });
  }
}

export class WorkflowProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureWorkflowProjectUncheckedCreateInput) {
    return this.prisma.nurtureWorkflowProject.create({ data });
  }
  findById(id: string) {
    return this.prisma.nurtureWorkflowProject.findFirst({ where: { id, deletedAt: null } });
  }
  listByFamily(workspaceId: string, familyRefKey: string) {
    return this.prisma.nurtureWorkflowProject.findMany({
      where: { workspaceId, familyRefKey, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
  }
  /**
   * Transition status and bump aggregateVersion. When expectedVersion is given,
   * the update is a compare-and-set: it throws on a version mismatch (lost-update
   * guard). Without it, the bump is best-effort (no concurrency protection).
   */
  async updateStatus(id: string, status: NurtureProjectStatus, expectedVersion?: number) {
    if (expectedVersion === undefined) {
      return this.prisma.nurtureWorkflowProject.update({
        where: { id },
        data: { status, aggregateVersion: { increment: 1 } },
      });
    }
    const res = await this.prisma.nurtureWorkflowProject.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { status, aggregateVersion: { increment: 1 } },
    });
    if (res.count === 0) {
      throw new Error(
        `optimistic concurrency conflict: project ${id} is not at version ${expectedVersion}`,
      );
    }
    return this.prisma.nurtureWorkflowProject.findUniqueOrThrow({ where: { id } });
  }
}

export class WorkflowCaptureRepository {
  constructor(private readonly prisma: PrismaClient) {}
  append(data: Prisma.NurtureWorkflowCaptureUncheckedCreateInput) {
    return this.prisma.nurtureWorkflowCapture.create({ data });
  }
  listByProject(projectId: string) {
    return this.prisma.nurtureWorkflowCapture.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { capturedAt: "asc" },
    });
  }
}

export class WorkflowCheckpointRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureWorkflowCheckpointUncheckedCreateInput) {
    return this.prisma.nurtureWorkflowCheckpoint.create({ data });
  }
  listByProject(projectId: string) {
    return this.prisma.nurtureWorkflowCheckpoint.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }
}

export class WorkflowReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureWorkflowReviewUncheckedCreateInput) {
    return this.prisma.nurtureWorkflowReview.create({ data });
  }
  listByProject(projectId: string) {
    return this.prisma.nurtureWorkflowReview.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }
}

export class FamilyPolicyRepository {
  constructor(private readonly prisma: PrismaClient) {}
  create(data: Prisma.NurtureFamilyPolicyUncheckedCreateInput) {
    return this.prisma.nurtureFamilyPolicy.create({ data });
  }
  findById(id: string) {
    return this.prisma.nurtureFamilyPolicy.findFirst({ where: { id, deletedAt: null } });
  }
  listByFamily(workspaceId: string, familyRefKey: string) {
    return this.prisma.nurtureFamilyPolicy.findMany({
      where: { workspaceId, familyRefKey, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}

/** Convenience bundle of all scenario-table repositories. */
export const createScenarioRepositories = (prisma: PrismaClient) => ({
  familyProfileSnapshots: new FamilyProfileSnapshotRepository(prisma),
  childProfileSnapshots: new ChildProfileSnapshotRepository(prisma),
  familyCharters: new FamilyCharterRepository(prisma),
  focusCycles: new FocusCycleRepository(prisma),
  quantificationSnapshots: new FamilyQuantificationSnapshotRepository(prisma),
  metrics: new MetricRepository(prisma),
  workflowProjects: new WorkflowProjectRepository(prisma),
  captures: new WorkflowCaptureRepository(prisma),
  checkpoints: new WorkflowCheckpointRepository(prisma),
  reviews: new WorkflowReviewRepository(prisma),
  familyPolicies: new FamilyPolicyRepository(prisma),
});
