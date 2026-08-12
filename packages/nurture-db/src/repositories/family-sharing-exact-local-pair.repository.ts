import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  NurtureFamilySharingExactLocalPairResolverV1,
  NurtureFamilySharingExactTargetSelectorV1,
  NurtureFamilySharingVerifiedCurrentPairEvidenceV1,
} from "@the-nurture/scenario";

type PrismaReader = Pick<PrismaClient, "$queryRaw">;

type LocalPairRow = Readonly<{
  workspace_id: string;
  child_ref: string;
  child_care_process_ref: string;
  family_ref: string;
  child_association_ref: string;
  family_association_ref: string;
}>;

/**
 * Resolves signed My-Chat anchor evidence to one current Nurture-local pair.
 * Callers never supply local object or association refs. The LIMIT 2 result
 * deliberately exposes duplicate/ambiguous persistence states to fail closed.
 */
export class PrismaNurtureFamilySharingExactLocalPairResolver
implements NurtureFamilySharingExactLocalPairResolverV1 {
  constructor(private readonly prisma: PrismaReader) {}

  async resolveExact(input: {
    workspace_id: string;
    pair_evidence: NurtureFamilySharingVerifiedCurrentPairEvidenceV1;
    target: NurtureFamilySharingExactTargetSelectorV1;
    evaluated_at: string;
  }) {
    const evaluatedAt = validate(input);
    if (!evaluatedAt) return { status: "unavailable" } as const;
    try {
      const rows = await this.prisma.$queryRaw<LocalPairRow[]>(
        exactLocalPairQuery(input, evaluatedAt),
      );
      if (rows.length !== 1 || !validRow(rows[0])) {
        return { status: "unavailable" } as const;
      }
      return { status: "resolved", local_pair: rows[0] } as const;
    } catch {
      return { status: "unavailable" } as const;
    }
  }
}

function exactLocalPairQuery(
  input: {
    workspace_id: string;
    pair_evidence: NurtureFamilySharingVerifiedCurrentPairEvidenceV1;
    target: NurtureFamilySharingExactTargetSelectorV1;
  },
  evaluatedAt: Date,
): Prisma.Sql {
  const evidence = input.pair_evidence;
  const target = input.target;
  return Prisma.sql`
    SELECT
      family_association."workspace_id" AS workspace_id,
      family_association."child_id" AS child_ref,
      family_association."child_care_process_id" AS child_care_process_ref,
      family_association."family_id" AS family_ref,
      child_association."id" AS child_association_ref,
      family_association."id" AS family_association_ref
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
    INNER JOIN "nurture_enrollment" enrollment
      ON enrollment."id" = ${target.enrollment_ref}
      AND enrollment."workspace_id" = family_association."workspace_id"
      AND enrollment."child_care_process_id" = family_association."child_care_process_id"
    INNER JOIN "nurture_c30_pair_operation" pair_operation
      ON pair_operation."family_association_id" = family_association."id"
      AND pair_operation."child_association_id" = child_association."id"
      AND pair_operation."child_anchor_id" = child_anchor."id"
      AND pair_operation."family_anchor_id" = family_anchor."id"
      AND pair_operation."child_owner_version" = child_anchor."aggregate_version"
      AND pair_operation."family_owner_version" = family_anchor."aggregate_version"
      AND pair_operation."state" = 'committed'
    WHERE family_association."workspace_id" = ${input.workspace_id}
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
      AND enrollment."aggregate_version" = ${target.enrollment_revision}
      AND enrollment."status" = 'active'
      AND enrollment."deleted_at" IS NULL
      AND ${evaluatedAt}::timestamptz < ${new Date(evidence.expires_at)}::timestamptz
    LIMIT 2`;
}

function validate(input: {
  workspace_id: string;
  pair_evidence: NurtureFamilySharingVerifiedCurrentPairEvidenceV1;
  target: NurtureFamilySharingExactTargetSelectorV1;
  evaluated_at: string;
}): Date | null {
  const evidence = input.pair_evidence;
  const target = input.target;
  const evaluatedAt = canonicalInstant(input.evaluated_at);
  const verifiedAt = canonicalInstant(evidence?.verified_at);
  const expiresAt = canonicalInstant(evidence?.expires_at);
  if (
    !opaque(input.workspace_id) ||
    evidence?.verification !== "verified_current_pair_evidence" ||
    !opaque(evidence.evidence_ref) ||
    !positive(evidence.evidence_version) ||
    !opaque(evidence.child_anchor_ref) ||
    !positive(evidence.child_owner_version) ||
    !opaque(evidence.family_anchor_ref) ||
    !positive(evidence.family_owner_version) ||
    (evidence.my_chat_family_lifecycle !== "active" &&
      evidence.my_chat_family_lifecycle !== "inactive") ||
    target?.verification !== "verified_exact_target_selector" ||
    target.pair_evidence_ref !== evidence.evidence_ref ||
    target.pair_evidence_version !== evidence.evidence_version ||
    target.target_kind !== "enrollment" ||
    !opaque(target.enrollment_ref) ||
    !nonNegative(target.enrollment_revision) ||
    !evaluatedAt ||
    !verifiedAt ||
    !expiresAt ||
    verifiedAt.getTime() > evaluatedAt.getTime() ||
    expiresAt.getTime() <= evaluatedAt.getTime() ||
    expiresAt.getTime() <= verifiedAt.getTime()
  ) return null;
  return evaluatedAt;
}

function validRow(value: LocalPairRow | undefined): value is LocalPairRow {
  return Boolean(
    value &&
      opaque(value.workspace_id) &&
      opaque(value.child_ref) &&
      opaque(value.child_care_process_ref) &&
      opaque(value.family_ref) &&
      opaque(value.child_association_ref) &&
      opaque(value.family_association_ref),
  );
}

function canonicalInstant(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
    ? parsed
    : null;
}

function opaque(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}

function positive(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function nonNegative(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}
