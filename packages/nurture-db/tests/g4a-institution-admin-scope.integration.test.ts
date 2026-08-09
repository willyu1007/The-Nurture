import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureInstitutionAuthorityChain,
  NurtureInstitutionPolicyService,
  type NurturePolicyFactRequest,
  type NurtureResolvedContext,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaInstitutionContextRepository } from "../src/repositories/institution-context.repository.js";

/**
 * G4-A increment 1 — the 0C authority chain against real rows.
 *
 * Increment 1 shipped with 31 passing tests that all hand-supplied facts
 * through the in-memory repository, so none of them executed the Prisma
 * computation that produces those facts. All three fail-open defects the audit
 * found (21-g4-a-increment-1-audit-record.md) lived in exactly that blind spot.
 * These tests close it: every fact below is computed by
 * `PrismaInstitutionContextRepository.loadPolicyFacts` from stored rows, and
 * the decisions come from the real predicate reading them.
 */

const prisma = createPrismaClient();
const repository = new PrismaInstitutionContextRepository(prisma);
const policy = new NurtureInstitutionPolicyService(repository);

afterAll(async () => {
  await prisma.$disconnect();
});

type Scope = Awaited<ReturnType<typeof seedScope>>;
type Child = Awaited<ReturnType<typeof seedChild>>;

const seedInstitution = (workspaceId: string, displayName: string, status: "active" | "paused") =>
  prisma.nurtureCareInstitution.create({ data: { workspaceId, displayName, status } });

const seedClass = (
  workspaceId: string,
  institutionId: string,
  name: string,
  overrides: { status?: "active" | "archived"; deletedAt?: Date } = {},
) =>
  prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId, name, status: "active", ...overrides },
  });

const seedChild = async (workspaceId: string, displayName: string) => {
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName, status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      displayName: `${displayName} family`,
      status: "active",
    },
  });
  return { process, family };
};

const seedEnrollment = (
  scope: Scope,
  child: Child,
  careGroupId: string,
  status: "active" | "ended" = "active",
) =>
  prisma.nurtureEnrollment.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: child.process.id,
      institutionId: scope.home.id,
      careGroupId,
      status,
    },
  });

/**
 * The lightest target the repository actually resolves. `family_care_thread`
 * sends `loadPolicyFacts` down the branch that reads `careGroupId`,
 * `enrollmentId` and `childCareProcessId` off the stored row — the resolution
 * the in-memory tests skipped entirely.
 */
const seedThread = (
  scope: Scope,
  child: Child,
  careGroupId: string | null,
  enrollmentId: string | null = null,
) =>
  prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: child.process.id,
      familyId: child.family.id,
      careGroupId,
      enrollmentId,
      visibilityScope: "enrollment_private",
      status: "active",
    },
  });

const seedScope = async (homeStatus: "active" | "paused" = "active") => {
  const workspaceId = randomUUID();
  const admin = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `admin:${workspaceId}`,
      displayName: "Institution Admin",
      status: "active",
    },
  });
  const home = await seedInstitution(workspaceId, "Home Institution", homeStatus);
  const other = await seedInstitution(workspaceId, "Other Institution", "active");
  const adminRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: admin.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: home.id,
      status: "active",
    },
  });
  return { workspaceId, admin, adminRole, home, other };
};

const target = (
  threadId: string,
  childCareProcessId?: string,
): NonNullable<NurtureResolvedContext["target"]> => ({
  object_type: "family_care_thread",
  object_id: threadId,
  lifecycle_state: "active",
  ...(childCareProcessId ? { child_care_process_id: childCareProcessId } : {}),
});

const request = (
  scope: Scope,
  targetRef?: NurtureResolvedContext["target"],
): NurturePolicyFactRequest => ({
  workspace_id: scope.workspaceId,
  policy_key: "nurture.institution_admin_scope",
  // These cases are about scope placement, so the purpose is declared and
  // recognized throughout. Purpose itself is exercised by the chain suite
  // below, where its absence and its vocabulary are the subject.
  purpose_key: "care_coordination",
  resolved_context: {
    actor: {
      participant_id: scope.admin.id,
      my_chat_user_id: scope.admin.myChatUserId,
      role_assignment_id: scope.adminRole.id,
      role_kind: "institution_admin",
      scope_type: "institution",
      scope_id: scope.home.id,
    },
    // An institution-scoped admin's work scope carries no care_group_id — the
    // shape that let the original `: true` fallback fire.
    work_scope: { kind: "institution", institution_id: scope.home.id },
    ...(targetRef ? { target: targetRef } : {}),
    continuity: {},
    policy_seed: { action_key: "nurture.institution_admin_scope" },
  },
});

describe("T-007 G4-A institution_admin_scope facts (production DB lane)", () => {
  it("places a target against the admin's own institution in four explicit states", async () => {
    const scope = await seedScope();
    const currentClass = await seedClass(scope.workspaceId, scope.home.id, "Home Class");
    const archivedClass = await seedClass(scope.workspaceId, scope.home.id, "Archived Class", {
      status: "archived",
    });
    const softDeletedClass = await seedClass(scope.workspaceId, scope.home.id, "Deleted Class", {
      deletedAt: new Date(),
    });
    const foreignClass = await seedClass(scope.workspaceId, scope.other.id, "Foreign Class");
    // One child per case: a child may hold only one enrollment-private thread.
    const enrolled = await seedChild(scope.workspaceId, "Enrolled Child");
    await seedEnrollment(scope, enrolled, currentClass.id);

    // No target: an institution-level read with nothing to place.
    await expect(repository.loadPolicyFacts(request(scope))).resolves.toMatchObject({
      target_scope_state: "absent",
      institution_scope_current: true,
    });
    await expect(policy.evaluate(request(scope))).resolves.toMatchObject({
      allowed: true,
      reason_code: "allowed",
    });

    const inScope = await seedThread(scope, enrolled, currentClass.id);
    await expect(
      repository.loadPolicyFacts(request(scope, target(inScope.id))),
    ).resolves.toMatchObject({ target_scope_state: "in_scope" });

    // 0C-2 fixture 2. Pre-repair this reached the `: true` fallback and the
    // Admin was ALLOWED onto another institution's class.
    const foreign = await seedThread(
      scope,
      await seedChild(scope.workspaceId, "Foreign Class Child"),
      foreignClass.id,
    );
    await expect(
      repository.loadPolicyFacts(request(scope, target(foreign.id))),
    ).resolves.toMatchObject({ target_scope_state: "out_of_scope" });
    await expect(policy.evaluate(request(scope, target(foreign.id)))).resolves.toMatchObject({
      allowed: false,
      reason_code: "not_authorized",
    });

    // A supplied target that resolves to no institution edge at all. This is
    // `out_of_scope`, NOT `absent`: conflating the two is what failed open,
    // because "absent" is the legitimate no-target read.
    const unplaceable = target(randomUUID());
    await expect(
      repository.loadPolicyFacts(request(scope, { ...unplaceable, object_type: "care_group" })),
    ).resolves.toMatchObject({ target_scope_state: "out_of_scope" });
    await expect(
      policy.evaluate(request(scope, { ...unplaceable, object_type: "care_group" })),
    ).resolves.toMatchObject({ allowed: false, reason_code: "not_authorized" });

    // 0C-3's own code, for a class inside the admin's institution that is not
    // current — under either half of the status/deletedAt conjunction.
    const archived = await seedThread(
      scope,
      await seedChild(scope.workspaceId, "Archived Class Child"),
      archivedClass.id,
    );
    const softDeleted = await seedThread(
      scope,
      await seedChild(scope.workspaceId, "Deleted Class Child"),
      softDeletedClass.id,
    );
    await expect(
      repository.loadPolicyFacts(request(scope, target(archived.id))),
    ).resolves.toMatchObject({ target_scope_state: "class_not_current" });
    await expect(
      repository.loadPolicyFacts(request(scope, target(softDeleted.id))),
    ).resolves.toMatchObject({ target_scope_state: "class_not_current" });
    await expect(policy.evaluate(request(scope, target(archived.id)))).resolves.toMatchObject({
      allowed: false,
      reason_code: "class_not_current",
    });
  });

  it("resolves the child target from stored rows when the caller omits the field", async () => {
    const scope = await seedScope();
    const namedClass = await seedClass(scope.workspaceId, scope.home.id, "Named Class");
    const siblingClass = await seedClass(scope.workspaceId, scope.home.id, "Sibling Class");

    const insider = await seedChild(scope.workspaceId, "Child In Class");
    await seedEnrollment(scope, insider, namedClass.id);
    const insiderThread = await seedThread(scope, insider, namedClass.id);

    // The caller supplies no `target.child_care_process_id`; the repository
    // resolves it off the thread row, so the fact is true either way.
    await expect(
      repository.loadPolicyFacts(request(scope, target(insiderThread.id))),
    ).resolves.toMatchObject({
      resolved_child_process_ref: expect.any(String),
      child_in_named_class: true,
      target_scope_state: "in_scope",
    });
    await expect(policy.evaluate(request(scope, target(insiderThread.id)))).resolves.toMatchObject({
      allowed: true,
      reason_code: "allowed",
    });

    // Same omission, but the child is not in the class the target names.
    const outsider = await seedChild(scope.workspaceId, "Child In Sibling Class");
    await seedEnrollment(scope, outsider, siblingClass.id);
    const outsiderThread = await seedThread(scope, outsider, namedClass.id);
    await expect(
      repository.loadPolicyFacts(request(scope, target(outsiderThread.id))),
    ).resolves.toMatchObject({ resolved_child_process_ref: expect.any(String), child_in_named_class: false });

    // The guard must read the same channel the fact is computed from. Hold the
    // stored rows constant and vary only whether the caller supplied the
    // optional field: both must deny. Pre-repair the omitted form was ALLOWED
    // while the repository had already computed `child_in_named_class: false`.
    const supplied = target(outsiderThread.id, outsider.process.id);
    const omitted = target(outsiderThread.id);
    await expect(policy.evaluate(request(scope, supplied))).resolves.toMatchObject({
      allowed: false,
      reason_code: "scope_mismatch",
    });
    await expect(policy.evaluate(request(scope, omitted))).resolves.toMatchObject({
      allowed: false,
      reason_code: "scope_mismatch",
    });
  });

  it("keeps child_in_named_class narrower than scope_reaches_child inside one institution", async () => {
    const scope = await seedScope();
    const fromClass = await seedClass(scope.workspaceId, scope.home.id, "Former Class");
    const toClass = await seedClass(scope.workspaceId, scope.home.id, "Current Class");
    const child = await seedChild(scope.workspaceId, "Transferred Child");

    // A child who moved classes inside the institution: the old enrollment is
    // ended, the new one is active, and a thread still anchors to the old class.
    const endedEnrollment = await seedEnrollment(scope, child, fromClass.id, "ended");
    await seedEnrollment(scope, child, toClass.id);
    const thread = await seedThread(scope, child, fromClass.id, endedEnrollment.id);

    const facts = await repository.loadPolicyFacts(request(scope, target(thread.id)));
    expect(facts).toMatchObject({
      // Institution-scoped, so `scope_reaches_child` matches on institutionId
      // alone and admits the child through the *other* class. Reusing it for
      // 0C-3 would widen the predicate to the whole institution.
      scope_reaches_child: true,
      // 0C-3 asks the narrower question, and answers it differently.
      child_in_named_class: false,
      resolved_child_process_ref: expect.any(String),
      target_scope_state: "in_scope",
      enrollment_state: "inactive",
    });
    await expect(policy.evaluate(request(scope, target(thread.id)))).resolves.toMatchObject({
      allowed: false,
      reason_code: "scope_mismatch",
    });
  });

  it("denies every target state when the institution scope is not current", async () => {
    const scope = await seedScope("paused");
    const child = await seedChild(scope.workspaceId, "Child A");
    const homeClass = await seedClass(scope.workspaceId, scope.home.id, "Home Class");
    await seedEnrollment(scope, child, homeClass.id);
    const thread = await seedThread(scope, child, homeClass.id);

    await expect(
      repository.loadPolicyFacts(request(scope, target(thread.id))),
    ).resolves.toMatchObject({
      role_kind: "institution_admin",
      institution_scope_current: false,
      // Placement was never evaluated; the state stays honest rather than
      // reporting an `in_scope` the code did not establish.
      target_scope_state: "out_of_scope",
    });
    await expect(policy.evaluate(request(scope, target(thread.id)))).resolves.toMatchObject({
      allowed: false,
      reason_code: "not_authorized",
    });
    await expect(policy.evaluate(request(scope))).resolves.toMatchObject({
      allowed: false,
      reason_code: "not_authorized",
    });
  });
});

/**
 * G4-A increment 2 — the chain over real rows.
 *
 * The unit tests drive `selectActiveRole` and `deriveInstitutionScopeChain`
 * over hand-built bindings. What they cannot show is that the bindings a real
 * `listActiveActorBindings` returns carry the shape selection depends on, or
 * that the actor scope the predicate now trusts is genuinely the stored one.
 */
describe("T-007 G4-A authority chain over stored rows (production DB lane)", () => {
  const chain = new NurtureInstitutionAuthorityChain(repository);
  const at = "2026-08-09T00:00:00.000Z";

  const seedAdminRole = (scope: Scope, institutionId: string) =>
    prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: scope.admin.id,
        role: "institution_admin",
        scopeType: "institution",
        scopeId: institutionId,
        status: "active",
      },
    });

  it("resolves a single stored assignment as unique and echoes its scope", async () => {
    const scope = await seedScope();
    const result = await chain.resolve({
      workspace_id: scope.workspaceId,
      participant_ref: scope.admin.id,
      at,
    });
    expect(result).toMatchObject({
      status: "resolved",
      level: "institution_scope",
      active_role: {
        selection_mode: "unique",
        role_assignment_ref: scope.adminRole.id,
        role_kind: "institution_admin",
        scope_type: "institution",
        scope_ref: scope.home.id,
      },
      institution_scope: { institution_ref: scope.home.id, institution_state: "active" },
    });
  });

  it("denies two stored assignments with none named, and resolves the named one exactly", async () => {
    const scope = await seedScope();
    const second = await seedAdminRole(scope, scope.other.id);

    // 0C-1 §4: an ambiguous multi-role request never picks, merges or defaults.
    await expect(
      chain.resolve({ workspace_id: scope.workspaceId, participant_ref: scope.admin.id, at }),
    ).resolves.toMatchObject({
      status: "denied",
      level: "active_role",
      reason_code: "role_selection_required",
    });

    await expect(
      chain.resolve({
        workspace_id: scope.workspaceId,
        participant_ref: scope.admin.id,
        role_assignment_ref: second.id,
        at,
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      active_role: {
        selection_mode: "explicit",
        role_assignment_ref: second.id,
        scope_ref: scope.other.id,
      },
    });
  });

  it("denies an assignment belonging to another participant with no fallback", async () => {
    const scope = await seedScope();
    const stranger = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        myChatUserId: `stranger:${scope.workspaceId}`,
        status: "active",
      },
    });
    const strangerRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: stranger.id,
        role: "institution_admin",
        scopeType: "institution",
        scopeId: scope.home.id,
        status: "active",
      },
    });
    // The caller's own assignment would resolve on its own, so falling back to
    // it would look like a success.
    await expect(
      chain.resolve({
        workspace_id: scope.workspaceId,
        participant_ref: scope.admin.id,
        role_assignment_ref: strangerRole.id,
        at,
      }),
    ).resolves.toMatchObject({
      status: "denied",
      level: "active_role",
      reason_code: "role_missing",
    });
  });

  it("emits the actor scope from the assignment row, for the predicate to read", async () => {
    const scope = await seedScope();
    await expect(repository.loadPolicyFacts(request(scope))).resolves.toMatchObject({
      actor_scope_type: "institution",
      actor_scope_ref: scope.home.id,
    });

    // A care_group-scoped admin: the stored channel says care_group, and no
    // claim the caller makes can widen it to the group's institution.
    const groupScoped = await seedScope();
    const groupClass = await seedClass(groupScoped.workspaceId, groupScoped.home.id, "Class");
    const groupRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: groupScoped.workspaceId,
        participantId: groupScoped.admin.id,
        role: "institution_admin",
        scopeType: "care_group",
        scopeId: groupClass.id,
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: groupScoped.adminRole.id },
      data: { status: "revoked" },
    });
    const claimed = {
      ...request(groupScoped),
      resolved_context: {
        ...request(groupScoped).resolved_context,
        actor: {
          ...request(groupScoped).resolved_context.actor,
          role_assignment_id: groupRole.id,
        },
      },
    };
    await expect(repository.loadPolicyFacts(claimed)).resolves.toMatchObject({
      actor_scope_type: "care_group",
      actor_scope_ref: groupClass.id,
    });
    // The caller's context still claims scope_type "institution".
    await expect(policy.evaluate(claimed)).resolves.toMatchObject({
      allowed: false,
      reason_code: "not_authorized",
    });
  });

  it("requires a declared purpose from the frozen vocabulary for a child-level read", async () => {
    const scope = await seedScope();
    const namedClass = await seedClass(scope.workspaceId, scope.home.id, "Named Class");
    const child = await seedChild(scope.workspaceId, "Child In Class");
    await seedEnrollment(scope, child, namedClass.id);
    const thread = await seedThread(scope, child, namedClass.id);
    const base = {
      workspace_id: scope.workspaceId,
      participant_ref: scope.admin.id,
      at,
      target: {
        object_type: "family_care_thread",
        object_id: thread.id,
        lifecycle_state: "active",
      },
    };

    // The child is resolved from the thread row, so 0C-3 applies even though
    // the caller named no child.
    await expect(chain.resolve(base)).resolves.toMatchObject({
      status: "denied",
      level: "child_scope",
      reason_code: "purpose_required",
    });
    await expect(
      chain.resolve({ ...base, purpose_key: "attendance_review" }),
    ).resolves.toMatchObject({ status: "denied", reason_code: "purpose_not_honoured" });

    await expect(
      chain.resolve({ ...base, purpose_key: "care_coordination" }),
    ).resolves.toMatchObject({
      status: "resolved",
      level: "child_scope",
      child_scope: {
        care_group_ref: namedClass.id,
        child_process_ref: child.process.id,
        purpose_key: "care_coordination",
      },
    });
  });

  /**
   * G4-A increment 3 — 0C-5's level over stored grant rows.
   *
   * The unit tests hand `grant_terms` straight to the predicate. What they
   * cannot show is that the repository builds those terms from the right rows:
   * only current ones, with the grant currency rule that is deliberately NOT
   * the lifecycle conjunction, and one entry per grant so the axes cannot be
   * satisfied across two.
   */
  it("evaluates direction, data class and purpose together over stored grants", async () => {
    const scope = await seedScope();
    const namedClass = await seedClass(scope.workspaceId, scope.home.id, "Named Class");
    const child = await seedChild(scope.workspaceId, "Granted Child");
    const enrollment = await seedEnrollment(scope, child, namedClass.id);
    const thread = await seedThread(scope, child, namedClass.id, enrollment.id);
    const grant = (
      overrides: Partial<{
        directions: ("family_to_org" | "org_to_family")[];
        dataClasses: ("daily_care_log" | "child_growth_record")[];
        purposes: string[];
        status: "active" | "revoked" | "expired";
        expiresAt: Date;
        revokedAt: Date;
      }> = {},
    ) =>
      prisma.nurtureChildLinkGrant.create({
        data: {
          workspaceId: scope.workspaceId,
          childCareProcessId: child.process.id,
          enrollmentId: enrollment.id,
          grantedByParticipantId: scope.admin.id,
          grantedToScopeType: "institution",
          grantedToScopeId: scope.home.id,
          directions: ["family_to_org"],
          dataClasses: ["daily_care_log"],
          purposes: ["care_coordination"],
          status: "active",
          ...overrides,
        },
      });

    const base = {
      workspace_id: scope.workspaceId,
      participant_ref: scope.admin.id,
      at,
      purpose_key: "care_coordination",
      direction: "family_to_org" as const,
      data_class: "daily_care_log" as const,
      target: {
        object_type: "family_care_thread",
        object_id: thread.id,
        lifecycle_state: "active",
      },
    };

    // No grant at all.
    await expect(chain.resolve(base)).resolves.toMatchObject({
      status: "denied",
      level: "grant_scope",
      reason_code: "grant_missing",
    });

    const full = await grant();
    await expect(chain.resolve(base)).resolves.toMatchObject({
      status: "resolved",
      level: "grant_scope",
    });
    await expect(chain.resolve({ ...base, data_class: "child_growth_record" })).resolves.toMatchObject(
      { reason_code: "data_class_mismatch" },
    );
    await expect(chain.resolve({ ...base, purpose_key: "safety_response" })).resolves.toMatchObject({
      reason_code: "purpose_not_granted",
    });

    // Expired is folded into `missing`: the caller learns no lifecycle detail.
    await prisma.nurtureChildLinkGrant.update({
      where: { id: full.id },
      data: { expiresAt: new Date("2026-01-01T00:00:00.000Z") },
    });
    await expect(chain.resolve(base)).resolves.toMatchObject({ reason_code: "grant_missing" });

    // Revoked keeps its own code. `ck_nurture_grant_scope` requires the
    // revoker alongside the timestamp, so a half-set revocation cannot exist.
    await prisma.nurtureChildLinkGrant.update({
      where: { id: full.id },
      data: {
        status: "revoked",
        revokedAt: new Date("2026-02-01T00:00:00.000Z"),
        revokedByParticipantId: scope.admin.id,
        expiresAt: null,
      },
    });
    await expect(chain.resolve(base)).resolves.toMatchObject({ reason_code: "grant_revoked" });
  });

  it("never satisfies the axes across two stored grants", async () => {
    const scope = await seedScope();
    const namedClass = await seedClass(scope.workspaceId, scope.home.id, "Named Class");
    const child = await seedChild(scope.workspaceId, "Split Grant Child");
    const enrollment = await seedEnrollment(scope, child, namedClass.id);
    const thread = await seedThread(scope, child, namedClass.id, enrollment.id);
    const common = {
      workspaceId: scope.workspaceId,
      childCareProcessId: child.process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: scope.admin.id,
      grantedToScopeType: "institution" as const,
      grantedToScopeId: scope.home.id,
      purposes: ["care_coordination"],
      status: "active" as const,
    };
    // One grant carries the direction, the other the data class. Together they
    // look like coverage; 0C-5 §4 requires them on the same grant.
    await prisma.nurtureChildLinkGrant.create({
      data: { ...common, directions: ["family_to_org"], dataClasses: ["child_growth_record"] },
    });
    await prisma.nurtureChildLinkGrant.create({
      data: { ...common, directions: ["org_to_family"], dataClasses: ["daily_care_log"] },
    });

    await expect(
      chain.resolve({
        workspace_id: scope.workspaceId,
        participant_ref: scope.admin.id,
        at,
        purpose_key: "care_coordination",
        direction: "family_to_org",
        data_class: "daily_care_log",
        target: {
          object_type: "family_care_thread",
          object_id: thread.id,
          lifecycle_state: "active",
        },
      }),
    ).resolves.toMatchObject({
      status: "denied",
      level: "grant_scope",
      reason_code: "data_class_mismatch",
    });
  });

  /**
   * G4-A increment 4 — 0C-5 §5 over a real class.
   *
   * The unit tests hand the population straight to the rule. What they cannot
   * show is that the repository builds it from scope rather than from
   * protected facts, or that a member counts as readable here on exactly the
   * grant terms a direct read would require.
   */
  it("aggregates a class only when every enrolled member is readable", async () => {
    const scope = await seedScope();
    const namedClass = await seedClass(scope.workspaceId, scope.home.id, "Counted Class");
    const otherClass = await seedClass(scope.workspaceId, scope.home.id, "Other Class");
    const grantFor = (childProcessId: string, enrollmentId: string, purposes = ["care_coordination"]) =>
      prisma.nurtureChildLinkGrant.create({
        data: {
          workspaceId: scope.workspaceId,
          childCareProcessId: childProcessId,
          enrollmentId,
          grantedByParticipantId: scope.admin.id,
          grantedToScopeType: "institution",
          grantedToScopeId: scope.home.id,
          directions: ["family_to_org"],
          dataClasses: ["daily_care_log"],
          purposes,
          status: "active",
        },
      });

    const request = {
      workspace_id: scope.workspaceId,
      participant_ref: scope.admin.id,
      care_group_ref: namedClass.id,
      at,
      purpose_key: "care_coordination",
      direction: "family_to_org" as const,
      data_class: "daily_care_log" as const,
    };
    const chainForClass = new NurtureInstitutionAuthorityChain(repository);

    // A class with nobody in it is 0, reached without consulting any grant.
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "available",
      value: 0,
    });

    const first = await seedChild(scope.workspaceId, "Counted A");
    const firstEnrollment = await seedEnrollment(scope, first, namedClass.id);
    const second = await seedChild(scope.workspaceId, "Counted B");
    const secondEnrollment = await seedEnrollment(scope, second, namedClass.id);

    // Population is non-empty and nobody has granted: refuse, never 0.
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "unavailable",
      reason_code: "grant_missing",
    });

    await grantFor(first.process.id, firstEnrollment.id);
    // One of two readable — still a refusal, and byte-identical to the
    // refusal above, so the grant that was just added is not observable.
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "unavailable",
      reason_code: "grant_missing",
    });

    await grantFor(second.process.id, secondEnrollment.id);
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "available",
      value: 2,
    });

    // A child in another class of the same institution is not in this
    // population, so their missing grant cannot refuse this class's count.
    const outsider = await seedChild(scope.workspaceId, "Other Class Child");
    await seedEnrollment(scope, outsider, otherClass.id);
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "available",
      value: 2,
    });

    // An ended enrolment leaves the population: scope defines membership.
    await prisma.nurtureEnrollment.update({
      where: { id: secondEnrollment.id },
      data: { status: "ended" },
    });
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "available",
      value: 1,
    });

    // A grant whose purpose does not cover the ask refuses the whole class,
    // on the same axis a direct read would refuse.
    const third = await seedChild(scope.workspaceId, "Counted C");
    const thirdEnrollment = await seedEnrollment(scope, third, namedClass.id);
    await grantFor(third.process.id, thirdEnrollment.id, ["safety_response"]);
    await expect(chainForClass.aggregate(request, () => 1)).resolves.toEqual({
      status: "unavailable",
      reason_code: "grant_missing",
    });
  });

  /**
   * The class reference is caller-supplied, so it is placed before it is
   * counted. A class in another institution has no members, and an empty
   * population is `0` per 0C-5 §5 — so an unplaced reference would be answered
   * with a number where 0C-2 requires a denial, and a real empty class would
   * be indistinguishable from a foreign one.
   */
  it("places a caller-supplied class reference before counting it", async () => {
    const scope = await seedScope();
    const ownClass = await seedClass(scope.workspaceId, scope.home.id, "Own Class");
    const foreignClass = await seedClass(scope.workspaceId, scope.other.id, "Foreign Class");
    const archivedClass = await seedClass(scope.workspaceId, scope.home.id, "Archived", {
      status: "archived",
    });
    const base = {
      workspace_id: scope.workspaceId,
      participant_ref: scope.admin.id,
      at,
      purpose_key: "care_coordination",
      direction: "family_to_org" as const,
      data_class: "daily_care_log" as const,
    };
    const chainForClass = new NurtureInstitutionAuthorityChain(repository);

    // Own class, genuinely empty: 0, and reached without consulting a grant.
    await expect(
      chainForClass.aggregate({ ...base, care_group_ref: ownClass.id }, () => 1),
    ).resolves.toEqual({ status: "available", value: 0 });

    // Another institution's class: denied, not counted as 0.
    await expect(
      chainForClass.aggregate({ ...base, care_group_ref: foreignClass.id }, () => 1),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });

    // A class that never existed denies identically to a foreign one.
    await expect(
      chainForClass.aggregate({ ...base, care_group_ref: randomUUID() }, () => 1),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });

    // Own institution but not current: 0C-3's own code.
    await expect(
      chainForClass.aggregate({ ...base, care_group_ref: archivedClass.id }, () => 1),
    ).resolves.toEqual({ status: "denied", reason_code: "class_not_current" });
  });
});
