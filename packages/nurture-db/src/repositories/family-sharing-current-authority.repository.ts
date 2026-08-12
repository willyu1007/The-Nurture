import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  NURTURE_FAMILY_SHARING_CATEGORIES,
  NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  type NurtureFamilySharingAuthorityCategoryFactsV1,
  type NurtureFamilySharingAuthorityRecordV1,
  type NurtureFamilySharingCategory,
  type NurtureFamilySharingCurrentAuthorityReadInputV1,
  type NurtureFamilySharingCurrentAuthorityReadPortV1,
  type NurtureFamilySharingCurrentAuthorityReadResultV1,
  type NurtureFamilySharingPolicyRecordV1,
} from "@the-nurture/scenario";

type PrismaReader = Pick<PrismaClient, "$queryRaw">;

type FamilySharingAuthorityRow = {
  category: string;
  direction: string;
  axis: string;
  child_revision: number;
  child_updated_at: Date;
  process_revision: number;
  process_updated_at: Date;
  family_revision: number;
  family_updated_at: Date;
  enrollment_revision: number;
  enrollment_updated_at: Date;
  institution_revision: number;
  institution_updated_at: Date;
  care_group_revision: number;
  care_group_updated_at: Date;
  child_anchor_version: number;
  family_anchor_version: number;
  child_association_revision: number;
  family_association_revision: number;
  pair_current_owner_evidence_hash: string;
  pair_commit_evidence_hash: string;
  authority_id: string | null;
  authority_status: string | null;
  authority_effective_from: Date | null;
  authority_expires_at: Date | null;
  authority_revoked_at: Date | null;
  authority_role: string | null;
  authority_role_assignment_id: string | null;
  authority_version: number | null;
  authority_updated_at: Date | null;
  authority_role_revision: number | null;
  authority_participant_revision: number | null;
  policy_id: string | null;
  policy_status: string | null;
  policy_effective_from: Date | null;
  policy_expires_at: Date | null;
  policy_revoked_at: Date | null;
  policy_role: string | null;
  policy_role_assignment_id: string | null;
  policy_version: number | null;
  policy_updated_at: Date | null;
  policy_role_revision: number | null;
  policy_participant_revision: number | null;
};

/**
 * PostgreSQL current-authority owner for T-010 I4-C2.
 *
 * One SQL statement observes the pair, selected target, local lifecycle,
 * dedicated category authority and both policy axes from one MVCC snapshot.
 * Every malformed, absent, stale, duplicate or database-error state collapses
 * to `unavailable`; repository ordering never selects an authority winner.
 */
export class PrismaNurtureFamilySharingCurrentAuthorityRepository
implements NurtureFamilySharingCurrentAuthorityReadPortV1 {
  constructor(private readonly prisma: PrismaReader) {}

  async loadCurrent(
    input: NurtureFamilySharingCurrentAuthorityReadInputV1,
  ): Promise<NurtureFamilySharingCurrentAuthorityReadResultV1> {
    const evaluatedAt = validateInput(input);
    if (!evaluatedAt) return unavailable();

    try {
      const rows = await this.prisma.$queryRaw<FamilySharingAuthorityRow[]>(
        currentAuthorityQuery(input, evaluatedAt),
      );
      return assembleCurrentAuthority(input, rows);
    } catch {
      return unavailable();
    }
  }
}

function currentAuthorityQuery(
  input: NurtureFamilySharingCurrentAuthorityReadInputV1,
  evaluatedAt: Date,
): Prisma.Sql {
  const pair = input.local_pair;
  const evidence = input.pair_evidence;
  const target = input.target;
  return Prisma.sql`
    WITH expected_category(category, direction) AS (
      VALUES
        ('daily_activity', 'nurture_to_family'),
        ('media', 'family_to_nurture'),
        ('focus_collaboration', 'family_to_nurture')
    ),
    expected_axis(axis) AS (
      VALUES ('release'), ('receiving')
    ),
    pair_scope AS (
      SELECT
        child."aggregate_version" AS child_revision,
        child."updated_at" AS child_updated_at,
        process."aggregate_version" AS process_revision,
        process."updated_at" AS process_updated_at,
        family."aggregate_version" AS family_revision,
        family."updated_at" AS family_updated_at,
        child_anchor."aggregate_version" AS child_anchor_version,
        family_anchor."aggregate_version" AS family_anchor_version,
        child_association."aggregate_version" AS child_association_revision,
        family_association."aggregate_version" AS family_association_revision,
        pair_operation."current_owner_evidence_hash" AS pair_current_owner_evidence_hash,
        pair_operation."pair_commit_evidence_hash" AS pair_commit_evidence_hash
      FROM "nurture_family_anchor_association" family_association
      INNER JOIN "nurture_child_anchor_association" child_association
        ON child_association."id" = family_association."child_association_id"
        AND child_association."id" = family_association."current_child_association_id"
        AND child_association."workspace_id" = family_association."workspace_id"
        AND child_association."child_anchor_id" = family_association."child_anchor_id"
        AND child_association."child_id" = family_association."child_id"
      INNER JOIN "nurture_child_binding_anchor" child_anchor
        ON child_anchor."id" = family_association."child_anchor_id"
      INNER JOIN "nurture_family_binding_anchor" family_anchor
        ON family_anchor."id" = family_association."family_anchor_id"
      INNER JOIN "nurture_child" child
        ON child."id" = family_association."child_id"
        AND child."workspace_id" = family_association."workspace_id"
      INNER JOIN "nurture_child_care_process" process
        ON process."id" = family_association."child_care_process_id"
        AND process."workspace_id" = family_association."workspace_id"
        AND process."child_id" = family_association."child_id"
      INNER JOIN "nurture_family" family
        ON family."id" = family_association."family_id"
        AND family."workspace_id" = family_association."workspace_id"
        AND family."child_care_process_id" = family_association."child_care_process_id"
      INNER JOIN "nurture_c30_pair_operation" pair_operation
        ON pair_operation."family_association_id" = family_association."id"
        AND pair_operation."child_association_id" = child_association."id"
        AND pair_operation."child_owner_version" = child_anchor."aggregate_version"
        AND pair_operation."family_owner_version" = family_anchor."aggregate_version"
        AND pair_operation."state" = 'committed'
      WHERE family_association."id" = ${pair.family_association_ref}
        AND child_association."id" = ${pair.child_association_ref}
        AND family_association."workspace_id" = ${pair.workspace_id}
        AND family_association."child_id" = ${pair.child_ref}
        AND family_association."child_care_process_id" = ${pair.child_care_process_ref}
        AND family_association."family_id" = ${pair.family_ref}
        AND family_association."child_anchor_id" = ${evidence.child_anchor_ref}
        AND family_association."family_anchor_id" = ${evidence.family_anchor_ref}
        AND child_anchor."aggregate_version" = ${evidence.child_owner_version}
        AND family_anchor."aggregate_version" = ${evidence.family_owner_version}
        AND family_association."status" = 'active'
        AND family_association."current_key" = 'current'
        AND family_association."revoked_at" IS NULL
        AND family_association."quarantined_at" IS NULL
        AND child_association."status" = 'active'
        AND child_association."current_key" = 'current'
        AND child_association."revoked_at" IS NULL
        AND child_association."quarantined_at" IS NULL
        AND child_anchor."status" = 'associated'
        AND child_anchor."revoked_at" IS NULL
        AND child_anchor."quarantined_at" IS NULL
        AND family_anchor."status" = 'associated'
        AND family_anchor."revoked_at" IS NULL
        AND family_anchor."quarantined_at" IS NULL
        AND child."status" = 'active'
        AND child."deleted_at" IS NULL
        AND process."status" = 'active'
        AND process."deleted_at" IS NULL
        AND family."status" = 'active'
        AND family."deleted_at" IS NULL
    ),
    selected_target AS (
      SELECT
        enrollment."aggregate_version" AS enrollment_revision,
        enrollment."updated_at" AS enrollment_updated_at,
        institution."aggregate_version" AS institution_revision,
        institution."updated_at" AS institution_updated_at,
        care_group."aggregate_version" AS care_group_revision,
        care_group."updated_at" AS care_group_updated_at,
        enrollment."institution_id" AS institution_id,
        enrollment."care_group_id" AS care_group_id
      FROM "nurture_enrollment" enrollment
      INNER JOIN pair_scope ON TRUE
      INNER JOIN "nurture_care_institution" institution
        ON institution."id" = enrollment."institution_id"
        AND institution."workspace_id" = enrollment."workspace_id"
      INNER JOIN "nurture_care_group" care_group
        ON care_group."id" = enrollment."care_group_id"
        AND care_group."workspace_id" = enrollment."workspace_id"
        AND care_group."institution_id" = enrollment."institution_id"
      WHERE enrollment."id" = ${target.enrollment_ref}
        AND enrollment."aggregate_version" = ${target.enrollment_revision}
        AND enrollment."workspace_id" = ${pair.workspace_id}
        AND enrollment."child_care_process_id" = ${pair.child_care_process_ref}
        AND enrollment."status" = 'active'
        AND enrollment."deleted_at" IS NULL
        AND institution."status" = 'active'
        AND institution."deleted_at" IS NULL
        AND care_group."status" = 'active'
        AND care_group."deleted_at" IS NULL
    )
    SELECT
      expected_category.category,
      expected_category.direction,
      expected_axis.axis,
      pair_scope.child_revision,
      pair_scope.child_updated_at,
      pair_scope.process_revision,
      pair_scope.process_updated_at,
      pair_scope.family_revision,
      pair_scope.family_updated_at,
      selected_target.enrollment_revision,
      selected_target.enrollment_updated_at,
      selected_target.institution_revision,
      selected_target.institution_updated_at,
      selected_target.care_group_revision,
      selected_target.care_group_updated_at,
      pair_scope.child_anchor_version,
      pair_scope.family_anchor_version,
      pair_scope.child_association_revision,
      pair_scope.family_association_revision,
      pair_scope.pair_current_owner_evidence_hash,
      pair_scope.pair_commit_evidence_hash,
      authority."id" AS authority_id,
      authority."status"::text AS authority_status,
      authority."effective_from" AS authority_effective_from,
      authority."expires_at" AS authority_expires_at,
      authority."revoked_at" AS authority_revoked_at,
      authority."authorizing_role"::text AS authority_role,
      authority."authorizing_role_assignment_id" AS authority_role_assignment_id,
      authority."authority_version" AS authority_version,
      authority."updated_at" AS authority_updated_at,
      authority_role."aggregate_version" AS authority_role_revision,
      authority_participant."aggregate_version" AS authority_participant_revision,
      policy."id" AS policy_id,
      policy."status"::text AS policy_status,
      policy."effective_from" AS policy_effective_from,
      policy."expires_at" AS policy_expires_at,
      policy."revoked_at" AS policy_revoked_at,
      policy."authorizing_role"::text AS policy_role,
      policy."authorizing_role_assignment_id" AS policy_role_assignment_id,
      policy."policy_version" AS policy_version,
      policy."updated_at" AS policy_updated_at,
      policy_role."aggregate_version" AS policy_role_revision,
      policy_participant."aggregate_version" AS policy_participant_revision
    FROM pair_scope
    INNER JOIN selected_target ON TRUE
    CROSS JOIN expected_category
    CROSS JOIN expected_axis
    LEFT JOIN "nurture_family_sharing_authority" authority
      ON authority."workspace_id" = ${pair.workspace_id}
      AND authority."child_care_process_id" = ${pair.child_care_process_ref}
      AND authority."family_id" = ${pair.family_ref}
      AND authority."enrollment_id" = ${target.enrollment_ref}
      AND authority."category"::text = expected_category.category
      AND authority."direction"::text = expected_category.direction
      AND authority."purpose" = ${input.purpose}
      AND authority."status" = 'active'
      AND authority."revoked_at" IS NULL
      AND authority."effective_from" <= (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC')
      AND (authority."expires_at" IS NULL
        OR authority."expires_at" > (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC'))
    LEFT JOIN "nurture_care_role_assignment" authority_role
      ON authority_role."id" = authority."authorizing_role_assignment_id"
      AND authority_role."workspace_id" = authority."workspace_id"
      AND authority_role."role" = authority."authorizing_role"
      AND authority_role."status" = 'active'
      AND authority_role."deleted_at" IS NULL
      AND (authority_role."starts_at" IS NULL
        OR authority_role."starts_at" <= (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC'))
      AND (authority_role."ends_at" IS NULL
        OR authority_role."ends_at" > (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC'))
      AND (
        (authority_role."scope_type" = 'child_care_process'
          AND authority_role."scope_id" = ${pair.child_care_process_ref})
        OR (authority_role."scope_type" = 'family'
          AND authority_role."scope_id" = ${pair.family_ref})
        OR (authority_role."scope_type" = 'enrollment'
          AND authority_role."scope_id" = ${target.enrollment_ref})
        OR (authority_role."scope_type" = 'institution'
          AND authority_role."scope_id" = selected_target.institution_id)
        OR (authority_role."scope_type" = 'care_group'
          AND authority_role."scope_id" = selected_target.care_group_id)
      )
    LEFT JOIN "nurture_participant" authority_participant
      ON authority_participant."id" = authority_role."participant_id"
      AND authority_participant."workspace_id" = authority_role."workspace_id"
      AND authority_participant."status" = 'active'
      AND authority_participant."deleted_at" IS NULL
    LEFT JOIN "nurture_family_sharing_policy" policy
      ON policy."workspace_id" = ${pair.workspace_id}
      AND policy."child_care_process_id" = ${pair.child_care_process_ref}
      AND policy."family_id" = ${pair.family_ref}
      AND policy."enrollment_id" = ${target.enrollment_ref}
      AND policy."category"::text = expected_category.category
      AND policy."direction"::text = expected_category.direction
      AND policy."axis"::text = expected_axis.axis
      AND policy."purpose" = ${input.purpose}
      AND policy."status" = 'active'
      AND policy."revoked_at" IS NULL
      AND policy."effective_from" <= (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC')
      AND (policy."expires_at" IS NULL
        OR policy."expires_at" > (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC'))
    LEFT JOIN "nurture_care_role_assignment" policy_role
      ON policy_role."id" = policy."authorizing_role_assignment_id"
      AND policy_role."workspace_id" = policy."workspace_id"
      AND policy_role."role" = policy."authorizing_role"
      AND policy_role."status" = 'active'
      AND policy_role."deleted_at" IS NULL
      AND (policy_role."starts_at" IS NULL
        OR policy_role."starts_at" <= (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC'))
      AND (policy_role."ends_at" IS NULL
        OR policy_role."ends_at" > (${evaluatedAt}::timestamptz AT TIME ZONE 'UTC'))
      AND (
        (policy_role."scope_type" = 'child_care_process'
          AND policy_role."scope_id" = ${pair.child_care_process_ref})
        OR (policy_role."scope_type" = 'family'
          AND policy_role."scope_id" = ${pair.family_ref})
        OR (policy_role."scope_type" = 'enrollment'
          AND policy_role."scope_id" = ${target.enrollment_ref})
        OR (policy_role."scope_type" = 'institution'
          AND policy_role."scope_id" = selected_target.institution_id)
        OR (policy_role."scope_type" = 'care_group'
          AND policy_role."scope_id" = selected_target.care_group_id)
      )
    LEFT JOIN "nurture_participant" policy_participant
      ON policy_participant."id" = policy_role."participant_id"
      AND policy_participant."workspace_id" = policy_role."workspace_id"
      AND policy_participant."status" = 'active'
      AND policy_participant."deleted_at" IS NULL
    ORDER BY expected_category.category, expected_axis.axis`;
}

function assembleCurrentAuthority(
  input: NurtureFamilySharingCurrentAuthorityReadInputV1,
  rows: readonly FamilySharingAuthorityRow[],
): NurtureFamilySharingCurrentAuthorityReadResultV1 {
  if (rows.length !== NURTURE_FAMILY_SHARING_CATEGORIES.length * 2) {
    return unavailable();
  }

  const byCategoryAndAxis = new Map<string, FamilySharingAuthorityRow>();
  for (const row of rows) {
    if (!isExpectedRow(row)) return unavailable();
    const key = `${row.category}:${row.axis}`;
    if (byCategoryAndAxis.has(key)) return unavailable();
    byCategoryAndAxis.set(key, row);
  }

  const categories: NurtureFamilySharingAuthorityCategoryFactsV1[] = [];
  const categoryHeads: unknown[] = [];
  for (const category of NURTURE_FAMILY_SHARING_CATEGORIES) {
    const release = byCategoryAndAxis.get(`${category}:release`);
    const receiving = byCategoryAndAxis.get(`${category}:receiving`);
    if (!release || !receiving || !sameAuthorityHead(release, receiving)) {
      return unavailable();
    }

    const authority = authorityRecord(input, category, release);
    const releasePolicy = policyRecord(input, category, release, "release");
    const receivingPolicy = policyRecord(input, category, receiving, "receiving");
    if (!authority || !releasePolicy || !receivingPolicy) return unavailable();

    const myChatLifecycle = input.pair_evidence.my_chat_family_lifecycle;
    categories.push({
      category_key: category,
      direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[category],
      role_authorized: true,
      grant_authorized: true,
      release_authorized: true,
      receiving_authorized: true,
      source_lifecycle:
        category === "daily_activity" ? "active" : myChatLifecycle,
      destination_lifecycle:
        category === "daily_activity" ? myChatLifecycle : "active",
    });
    categoryHeads.push({
      category,
      authority_record_ref: release.authority_id,
      authority,
      authority_updated_at: instant(release.authority_updated_at!),
      authority_role_revision: release.authority_role_revision,
      authority_participant_revision: release.authority_participant_revision,
      release_policy_record_ref: release.policy_id,
      release_policy: releasePolicy,
      release_policy_updated_at: instant(release.policy_updated_at!),
      release_role_revision: release.policy_role_revision,
      release_participant_revision: release.policy_participant_revision,
      receiving_policy_record_ref: receiving.policy_id,
      receiving_policy: receivingPolicy,
      receiving_policy_updated_at: instant(receiving.policy_updated_at!),
      receiving_role_revision: receiving.policy_role_revision,
      receiving_participant_revision: receiving.policy_participant_revision,
    });
  }

  const head = rows[0];
  if (!head) return unavailable();
  const authorityVersion = deterministicVersion({
    schema_version: 1,
    service_principal: {
      service_ref: input.principal.service_ref,
      trust_source_ref: input.principal.trust_source_ref,
      trust_source_version: input.principal.trust_source_version,
    },
    pair_evidence: {
      evidence_ref: input.pair_evidence.evidence_ref,
      evidence_version: input.pair_evidence.evidence_version,
      verified_at: input.pair_evidence.verified_at,
      expires_at: input.pair_evidence.expires_at,
      child_anchor_ref: input.pair_evidence.child_anchor_ref,
      child_owner_version: input.pair_evidence.child_owner_version,
      family_anchor_ref: input.pair_evidence.family_anchor_ref,
      family_owner_version: input.pair_evidence.family_owner_version,
      my_chat_family_lifecycle: input.pair_evidence.my_chat_family_lifecycle,
    },
    local_pair: {
      workspace_id: input.local_pair.workspace_id,
      child_ref: input.local_pair.child_ref,
      child_care_process_ref: input.local_pair.child_care_process_ref,
      family_ref: input.local_pair.family_ref,
      child_association_ref: input.local_pair.child_association_ref,
      family_association_ref: input.local_pair.family_association_ref,
    },
    target: {
      pair_evidence_ref: input.target.pair_evidence_ref,
      pair_evidence_version: input.target.pair_evidence_version,
      target_kind: input.target.target_kind,
      enrollment_ref: input.target.enrollment_ref,
      enrollment_revision: input.target.enrollment_revision,
    },
    local_heads: {
      child_revision: head.child_revision,
      child_updated_at: instant(head.child_updated_at),
      process_revision: head.process_revision,
      process_updated_at: instant(head.process_updated_at),
      family_revision: head.family_revision,
      family_updated_at: instant(head.family_updated_at),
      enrollment_revision: head.enrollment_revision,
      enrollment_updated_at: instant(head.enrollment_updated_at),
      institution_revision: head.institution_revision,
      institution_updated_at: instant(head.institution_updated_at),
      care_group_revision: head.care_group_revision,
      care_group_updated_at: instant(head.care_group_updated_at),
      child_anchor_version: head.child_anchor_version,
      family_anchor_version: head.family_anchor_version,
      child_association_revision: head.child_association_revision,
      family_association_revision: head.family_association_revision,
      // The local commit stores two different heads: the My-Chat owner
      // evidence admitted by the pair operation and the commit receipt for
      // the local association. Both are authority-version inputs.
      pair_current_owner_evidence_hash: head.pair_current_owner_evidence_hash,
      pair_commit_evidence_hash: head.pair_commit_evidence_hash,
    },
    category_heads: categoryHeads,
  });
  if (!authorityVersion) return unavailable();
  return { status: "resolved", authority_version: authorityVersion, categories };
}

function authorityRecord(
  input: NurtureFamilySharingCurrentAuthorityReadInputV1,
  category: NurtureFamilySharingCategory,
  row: FamilySharingAuthorityRow,
): NurtureFamilySharingAuthorityRecordV1 | null {
  const effectiveFrom = row.authority_effective_from;
  if (
    !opaque(row.authority_id) ||
    row.authority_status !== "active" ||
    !currentWindow(effectiveFrom, row.authority_expires_at, input.evaluated_at) ||
    row.authority_revoked_at !== null ||
    !opaque(row.authority_role) ||
    !opaque(row.authority_role_assignment_id) ||
    !positiveVersion(row.authority_version) ||
    !nonNegativeVersion(row.authority_role_revision) ||
    !nonNegativeVersion(row.authority_participant_revision) ||
    !validDate(row.authority_updated_at)
  ) return null;
  if (!effectiveFrom) return null;
  return {
    scope: scope(input),
    category,
    direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[category],
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    status: "active",
    effective_from: instant(effectiveFrom),
    expires_at: row.authority_expires_at ? instant(row.authority_expires_at) : null,
    revoked_at: null,
    authorizing_role: row.authority_role,
    authorizing_role_assignment_ref: row.authority_role_assignment_id,
    authority_version: row.authority_version,
  };
}

function policyRecord(
  input: NurtureFamilySharingCurrentAuthorityReadInputV1,
  category: NurtureFamilySharingCategory,
  row: FamilySharingAuthorityRow,
  axis: "release" | "receiving",
): NurtureFamilySharingPolicyRecordV1 | null {
  const effectiveFrom = row.policy_effective_from;
  if (
    row.axis !== axis ||
    !opaque(row.policy_id) ||
    row.policy_status !== "active" ||
    !currentWindow(effectiveFrom, row.policy_expires_at, input.evaluated_at) ||
    row.policy_revoked_at !== null ||
    !opaque(row.policy_role) ||
    !opaque(row.policy_role_assignment_id) ||
    !positiveVersion(row.policy_version) ||
    !nonNegativeVersion(row.policy_role_revision) ||
    !nonNegativeVersion(row.policy_participant_revision) ||
    !validDate(row.policy_updated_at)
  ) return null;
  if (!effectiveFrom) return null;
  return {
    scope: scope(input),
    category,
    direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[category],
    axis,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    status: "active",
    effective_from: instant(effectiveFrom),
    expires_at: row.policy_expires_at ? instant(row.policy_expires_at) : null,
    revoked_at: null,
    authorizing_role: row.policy_role,
    authorizing_role_assignment_ref: row.policy_role_assignment_id,
    policy_version: row.policy_version,
  };
}

function scope(input: NurtureFamilySharingCurrentAuthorityReadInputV1) {
  return {
    workspace_id: input.local_pair.workspace_id,
    child_care_process_id: input.local_pair.child_care_process_ref,
    family_id: input.local_pair.family_ref,
    enrollment_id: input.target.enrollment_ref,
  };
}

function validateInput(
  input: NurtureFamilySharingCurrentAuthorityReadInputV1,
): Date | null {
  if (!input || typeof input !== "object") return null;
  const principal = input.principal;
  const evidence = input.pair_evidence;
  const pair = input.local_pair;
  const target = input.target;
  if (
    !principal ||
    principal.verification !== "verified_service_principal" ||
    principal.audience !== NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE ||
    principal.operation !== NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION ||
    !opaque(principal.service_ref) ||
    !opaque(principal.trust_source_ref) ||
    !positiveVersion(principal.trust_source_version) ||
    !evidence ||
    evidence.verification !== "verified_current_pair_evidence" ||
    !opaque(evidence.evidence_ref) ||
    !positiveVersion(evidence.evidence_version) ||
    !opaque(evidence.child_anchor_ref) ||
    !positiveVersion(evidence.child_owner_version) ||
    !opaque(evidence.family_anchor_ref) ||
    !positiveVersion(evidence.family_owner_version) ||
    (evidence.my_chat_family_lifecycle !== "active" &&
      evidence.my_chat_family_lifecycle !== "inactive") ||
    !pair ||
    !opaque(pair.workspace_id) ||
    !opaque(pair.child_ref) ||
    !opaque(pair.child_care_process_ref) ||
    !opaque(pair.family_ref) ||
    !opaque(pair.child_association_ref) ||
    !opaque(pair.family_association_ref) ||
    !target ||
    target.verification !== "verified_exact_target_selector" ||
    target.pair_evidence_ref !== evidence.evidence_ref ||
    target.pair_evidence_version !== evidence.evidence_version ||
    target.target_kind !== "enrollment" ||
    !opaque(target.enrollment_ref) ||
    !nonNegativeVersion(target.enrollment_revision) ||
    input.purpose !== NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE
  ) return null;

  const evaluatedAt = canonicalInstant(input.evaluated_at);
  const verifiedAt = canonicalInstant(evidence.verified_at);
  const expiresAt = canonicalInstant(evidence.expires_at);
  if (
    !evaluatedAt ||
    !verifiedAt ||
    !expiresAt ||
    verifiedAt.getTime() > evaluatedAt.getTime() ||
    expiresAt.getTime() <= evaluatedAt.getTime() ||
    expiresAt.getTime() <= verifiedAt.getTime()
  ) return null;
  return evaluatedAt;
}

function isExpectedRow(row: FamilySharingAuthorityRow): boolean {
  if (!isCategory(row.category)) return false;
  if (row.direction !== NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[row.category]) return false;
  if (row.axis !== "release" && row.axis !== "receiving") return false;
  return (
    nonNegativeVersion(row.child_revision) &&
    nonNegativeVersion(row.process_revision) &&
    nonNegativeVersion(row.family_revision) &&
    nonNegativeVersion(row.enrollment_revision) &&
    nonNegativeVersion(row.institution_revision) &&
    nonNegativeVersion(row.care_group_revision) &&
    positiveVersion(row.child_anchor_version) &&
    positiveVersion(row.family_anchor_version) &&
    nonNegativeVersion(row.child_association_revision) &&
    nonNegativeVersion(row.family_association_revision) &&
    /^[a-f0-9]{64}$/u.test(row.pair_current_owner_evidence_hash) &&
    /^[a-f0-9]{64}$/u.test(row.pair_commit_evidence_hash) &&
    validDate(row.child_updated_at) &&
    validDate(row.process_updated_at) &&
    validDate(row.family_updated_at) &&
    validDate(row.enrollment_updated_at) &&
    validDate(row.institution_updated_at) &&
    validDate(row.care_group_updated_at)
  );
}

function sameAuthorityHead(
  left: FamilySharingAuthorityRow,
  right: FamilySharingAuthorityRow,
): boolean {
  return [
    "authority_id",
    "authority_status",
    "authority_effective_from",
    "authority_expires_at",
    "authority_revoked_at",
    "authority_role",
    "authority_role_assignment_id",
    "authority_version",
    "authority_updated_at",
    "authority_role_revision",
    "authority_participant_revision",
  ].every((key) => comparable(left[key as keyof FamilySharingAuthorityRow]) ===
      comparable(right[key as keyof FamilySharingAuthorityRow]));
}

function comparable(value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}

function currentWindow(
  effectiveFrom: Date | null,
  expiresAt: Date | null,
  evaluatedAt: string,
): boolean {
  const evaluated = canonicalInstant(evaluatedAt);
  return Boolean(
    evaluated &&
    validDate(effectiveFrom) &&
    effectiveFrom.getTime() <= evaluated.getTime() &&
    (!expiresAt || (validDate(expiresAt) && expiresAt.getTime() > evaluated.getTime())),
  );
}

function deterministicVersion(value: unknown): string | null {
  try {
    return `v1.sha256:${createHash("sha256")
      .update(JSON.stringify(value), "utf8")
      .digest("hex")}`;
  } catch {
    return null;
  }
}

function instant(value: Date): string {
  return value.toISOString();
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function canonicalInstant(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return validDate(parsed) && parsed.toISOString() === value ? parsed : null;
}

function isCategory(value: string): value is NurtureFamilySharingCategory {
  return NURTURE_FAMILY_SHARING_CATEGORIES.some((category) => category === value);
}

function opaque(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}

function positiveVersion(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function nonNegativeVersion(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function unavailable(): Readonly<{ status: "unavailable" }> {
  return { status: "unavailable" };
}
