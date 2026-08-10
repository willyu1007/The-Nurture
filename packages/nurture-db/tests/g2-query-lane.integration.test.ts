import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import {
  issueQueryCursor,
  queryCaregiverFamilyCareWork,
  queryFamilyCareItemDetail,
  queryGuardianFamilyCareTimeline,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaFamilyCareHarnessQueryReadPort } from "../src/repositories/family-care-harness-query.read.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";

// Domain-level guards of the G2 query lane: keyed cursor paging, role-reach
// denial, owner-read content fencing after revoke and redaction tombstones.
const prisma = createPrismaClient();
const INTEGRITY_KEY = "g2-query-lane-integrity-key-32chars!!!!";
const CONTENT_KEY = "g2-query-lane-content-key-32chars!!!!!!";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g2-query-k1",
  keyMaterial: CONTENT_KEY,
});
const deps = {
  reads: new PrismaFamilyCareHarnessQueryReadPort(prisma),
  protected_content: protectedContent,
  integrity_key: INTEGRITY_KEY,
};

afterAll(async () => {
  await prisma.$disconnect();
});

const seedScope = async () => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver:${workspaceId}`, status: "active" },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "小明", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: { workspaceId, childCareProcessId: process.id, displayName: "Family", status: "active" },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      createdByParticipantId: caregiver.id,
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const caregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiver.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: group.id,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["family_care_question"],
      purposes: ["family_care_workflow"],
      status: "active",
    },
  });
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      visibilityScope: "family_private",
      status: "active",
    },
  });
  return { workspaceId, guardian, caregiver, process, family, group, enrollment, guardianRole, caregiverRole, grant, thread };
};

type Scope = Awaited<ReturnType<typeof seedScope>>;

const seedQuestion = async (scope: Scope, body: string, createdAt: Date) => {
  const message = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId: scope.workspaceId,
      threadId: scope.thread.id,
      childCareProcessId: scope.process.id,
      senderParticipantId: scope.guardian.id,
      senderRoleAssignmentId: scope.guardianRole.id,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: "encrypted",
      bodyProtectionPayload: protectedContent.seal(body) as never,
      sourceSurface: "mobile",
      grantId: scope.grant.id,
      status: "sent",
      writerContract: "harness_g2_v1",
      enrollmentId: scope.enrollment.id,
      careGroupId: scope.group.id,
      direction: "family_to_org",
      createdAt,
    },
  });
  const item = await prisma.nurtureFamilyCareItem.create({
    data: {
      workspaceId: scope.workspaceId,
      sourceMessageId: message.id,
      threadId: scope.thread.id,
      childCareProcessId: scope.process.id,
      familyId: scope.family.id,
      enrollmentId: scope.enrollment.id,
      careGroupId: scope.group.id,
      dataClass: "family_care_question",
      category: "question",
      summary: "New family care question",
      urgency: "today_attention",
      requiresAck: true,
      requiresReply: true,
      status: "open",
      classificationSource: "system",
      grantId: scope.grant.id,
      writerContract: "harness_g2_v1",
      createdAt,
    },
  });
  return { message, item };
};

describe("G2 query lane guards", () => {
  it("pages the guardian timeline with keyed cursors and refuses forged ones", async () => {
    const scope = await seedScope();
    const base = Date.now() - 60_000;
    await seedQuestion(scope, "第一条", new Date(base));
    await seedQuestion(scope, "第二条", new Date(base + 1_000));
    await seedQuestion(scope, "第三条", new Date(base + 2_000));

    const first = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      page_size: 2,
    });
    if (first.status !== "ok") throw new Error("expected ok");
    expect(first.output.items).toHaveLength(2);
    expect(first.output.items[0]!.content?.body).toBe("第三条");
    expect(first.output.pageInfo.hasMore).toBe(true);

    const second = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      page_size: 2,
      cursor: first.output.pageInfo.nextCursor!,
    });
    if (second.status !== "ok") throw new Error("expected ok");
    expect(second.output.items).toHaveLength(1);
    expect(second.output.items[0]!.content?.body).toBe("第一条");
    expect(second.output.pageInfo.hasMore).toBe(false);

    const forged = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      cursor: `${first.output.pageInfo.nextCursor!.split(".")[0]}.${"0".repeat(32)}`,
    });
    expect(forged).toEqual({ status: "refresh_required" });

    const crossActor = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.caregiver.id,
      cursor: first.output.pageInfo.nextCursor!,
    });
    expect(crossActor).toEqual({ status: "refresh_required" });
  });

  it("performs zero writes and creates no CommandExecution", async () => {
    const scope = await seedScope();
    await seedQuestion(scope, "只读查询", new Date());
    const before = await Promise.all([
      prisma.nurtureCommandExecution.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureFamilyCareItem.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureFamilyCareItemEvent.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureInteractionContext.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureChildLinkReceipt.count({ where: { workspaceId: scope.workspaceId } }),
    ]);
    const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
    });
    await queryCaregiverFamilyCareWork(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.caregiver.id,
    });
    await queryFamilyCareItemDetail(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.caregiver.id,
      item_id: item.id,
    });
    const after = await Promise.all([
      prisma.nurtureCommandExecution.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureFamilyCareItem.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureFamilyCareItemEvent.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureInteractionContext.count({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureChildLinkReceipt.count({ where: { workspaceId: scope.workspaceId } }),
    ]);
    expect(after).toEqual(before);
    expect(after[0]).toBe(0);
  });

  it("keeps paging correct when a scanned record cannot be projected", async () => {
    const scope = await seedScope();
    const base = Date.now() - 60_000;
    await seedQuestion(scope, "可投影一", new Date(base));
    // An orphan harness reply (no resolvable source item) is skipped by the
    // presenter; it must not shorten the page or end pagination early.
    await prisma.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: scope.workspaceId,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        senderParticipantId: scope.caregiver.id,
        senderRoleAssignmentId: scope.caregiverRole.id,
        messageKind: "caregiver_reply",
        authorshipKind: "caregiver_confirmed",
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: protectedContent.seal("孤儿回复") as never,
        sourceSurface: "mobile",
        grantId: scope.grant.id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.group.id,
        direction: "org_to_family",
        replyOrderKey: `${base + 1_000}-orphan`,
        createdAt: new Date(base + 1_000),
      },
    });
    await seedQuestion(scope, "可投影二", new Date(base + 2_000));

    const first = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      page_size: 2,
    });
    if (first.status !== "ok") throw new Error("expected ok");
    expect(first.output.pageInfo.hasMore).toBe(true);
    const second = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      page_size: 2,
      cursor: first.output.pageInfo.nextCursor!,
    });
    if (second.status !== "ok") throw new Error("expected ok");
    const seen = [...first.output.items, ...second.output.items]
      .map((entry) => entry.content?.body)
      .filter(Boolean);
    expect(seen).toContain("可投影一");
    expect(seen).toContain("可投影二");
  });

  it("keeps an enrollment-scoped guardian out of the child's other enrollments", async () => {
    const scope = await seedScope();
    // A second Institution enrolment for the same child.
    const otherInstitution = await prisma.nurtureCareInstitution.create({
      data: {
        workspaceId: scope.workspaceId,
        displayName: "Second Center",
        status: "active",
        createdByParticipantId: scope.caregiver.id,
      },
    });
    const otherGroup = await prisma.nurtureCareGroup.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: otherInstitution.id,
        name: "Class Z",
        status: "active",
      },
    });
    const otherEnrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        institutionId: otherInstitution.id,
        careGroupId: otherGroup.id,
        status: "active",
        participationPhase: "formal",
      },
    });
    const otherThread = await prisma.nurtureFamilyCareThread.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        enrollmentId: otherEnrollment.id,
        careGroupId: otherGroup.id,
        visibilityScope: "family_private",
        status: "active",
      },
    });
    const otherGrant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: otherEnrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: otherGroup.id,
        directions: ["family_to_org", "org_to_family"],
        dataClasses: ["family_care_question"],
        purposes: ["family_care_workflow"],
        status: "active",
      },
    });
    const otherMessage = await prisma.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: scope.workspaceId,
        threadId: otherThread.id,
        childCareProcessId: scope.process.id,
        senderParticipantId: scope.guardian.id,
        senderRoleAssignmentId: scope.guardianRole.id,
        messageKind: "family_message",
        authorshipKind: "family_authored",
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: protectedContent.seal("另一机构的私密内容") as never,
        sourceSurface: "mobile",
        grantId: otherGrant.id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: otherEnrollment.id,
        careGroupId: otherGroup.id,
        direction: "family_to_org",
      },
    });
    const otherItem = await prisma.nurtureFamilyCareItem.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceMessageId: otherMessage.id,
        threadId: otherThread.id,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        enrollmentId: otherEnrollment.id,
        careGroupId: otherGroup.id,
        dataClass: "family_care_question",
        category: "question",
        summary: "New family care question",
        urgency: "today_attention",
        requiresAck: true,
        requiresReply: true,
        status: "open",
        classificationSource: "system",
        grantId: otherGrant.id,
        writerContract: "harness_g2_v1",
      },
    });
    await seedQuestion(scope, "本机构内容", new Date());

    // A guardian scoped to the FIRST enrollment only must not reach the
    // second one, even though both belong to the same child-care process.
    const scopedGuardian = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        myChatUserId: `scoped:${scope.workspaceId}`,
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: scopedGuardian.id,
        role: "guardian",
        scopeType: "enrollment",
        scopeId: scope.enrollment.id,
        status: "active",
      },
    });

    const timeline = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scopedGuardian.id,
    });
    if (timeline.status !== "ok") throw new Error("expected ok");
    const bodies = timeline.output.items.map((entry) => entry.content?.body);
    expect(bodies).toContain("本机构内容");
    expect(bodies).not.toContain("另一机构的私密内容");
    expect(JSON.stringify(timeline.output)).not.toContain("另一机构");

    await expect(
      queryFamilyCareItemDetail(deps, {
        workspace_id: scope.workspaceId,
        participant_id: scopedGuardian.id,
        item_id: otherItem.id,
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("refuses an expired cursor with refresh_required", async () => {
    const scope = await seedScope();
    const stale = issueQueryCursor(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: scope.guardian.id },
      {
        query: "guardian_timeline",
        before_occurred_at: new Date().toISOString(),
        before_id: randomUUID(),
        snapshot_at: new Date().toISOString(),
      },
      () => new Date(Date.now() - 11 * 60_000),
    );
    await expect(
      queryGuardianFamilyCareTimeline(deps, {
        workspace_id: scope.workspaceId,
        participant_id: scope.guardian.id,
        cursor: stale,
      }),
    ).resolves.toEqual({ status: "refresh_required" });
  });

  it("denies actors outside the current role reach", async () => {
    const scope = await seedScope();
    const { item } = await seedQuestion(scope, "问题", new Date());
    const stranger = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        myChatUserId: `stranger:${scope.workspaceId}`,
        status: "active",
      },
    });
    await expect(
      queryFamilyCareItemDetail(deps, {
        workspace_id: scope.workspaceId,
        participant_id: stranger.id,
        item_id: item.id,
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    const work = await queryCaregiverFamilyCareWork(deps, {
      workspace_id: scope.workspaceId,
      participant_id: stranger.id,
    });
    if (work.status !== "ok") throw new Error("expected ok");
    expect(work.output.items).toHaveLength(0);
  });

  it("fences caregiver content behind the current original grant", async () => {
    const scope = await seedScope();
    const { item } = await seedQuestion(scope, "受保护内容", new Date());

    const before = await queryFamilyCareItemDetail(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.caregiver.id,
      item_id: item.id,
    });
    if (before.status !== "ok") throw new Error("expected ok");
    expect(before.output.messages[0]!.content?.body).toBe("受保护内容");

    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: scope.guardian.id,
        revokeReason: "user_revoked",
      },
    });
    const after = await queryFamilyCareItemDetail(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.caregiver.id,
      item_id: item.id,
    });
    if (after.status !== "ok") throw new Error("expected ok");
    expect(after.output.messages[0]!.content).toBeUndefined();
    expect(after.output.progress.acknowledgementState).toBe("pending");

    const guardianView = await queryFamilyCareItemDetail(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      item_id: item.id,
    });
    if (guardianView.status !== "ok") throw new Error("expected ok");
    expect(guardianView.output.messages[0]!.content?.body).toBe("受保护内容");
  });

  it("projects redacted messages as tombstones without content", async () => {
    const scope = await seedScope();
    const { message } = await seedQuestion(scope, "会被移除的内容", new Date());
    await prisma.nurtureFamilyCareMessage.update({
      where: { id: message.id },
      data: {
        status: "redacted",
        bodyStorageMode: "redacted",
        redactedAt: new Date(),
        redactedByParticipantId: scope.guardian.id,
        redactionReason: "author_redacted",
        bodyProtectionPayload: Prisma.DbNull,
      },
    });
    const timeline = await queryGuardianFamilyCareTimeline(deps, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
    });
    if (timeline.status !== "ok") throw new Error("expected ok");
    expect(timeline.output.items[0]).toMatchObject({ kind: "redaction_tombstone" });
    expect(timeline.output.items[0]!.content).toBeUndefined();
    expect(JSON.stringify(timeline.output)).not.toContain("会被移除的内容");
  });
});
