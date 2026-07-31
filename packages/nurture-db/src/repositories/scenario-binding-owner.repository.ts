import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  NurtureScenarioBindingError,
  formatNurtureBindingOwnerRef,
  parseNurtureBindingOwnerRef,
  validateNurtureBindingAuthorityEvidence,
  type IssueNurtureBindingAuthorizationInput,
  type IssuedNurtureBindingAuthorization,
  type NurtureBindingAuthorityEvidence,
  type NurtureBindingSubjectType,
  type NurtureScenarioBindingAuthorizationRepository,
  type ReservedNurtureBindingAnchor,
  type ReserveNurtureBindingAnchorInput,
  type VerifyCurrentNurtureBindingAuthorityInput,
} from "@the-nurture/scenario/binding-owner";

type TransactionClient = Prisma.TransactionClient;

type PersistedAnchor = {
  id: string;
  status: string;
  aggregateVersion: number;
};

type PersistedAuthorization = {
  id: string;
  requestFingerprint: string;
  status: string;
  verifiedAt: Date;
  expiresAt: Date;
};

/**
 * Private infrastructure port for the exact role/grant/purpose/lifecycle
 * source that authorizes a binding. Implementations must use the supplied
 * transaction and lock or compare-and-set the exact source row. Network or
 * out-of-transaction authority reads are not valid implementations.
 */
export type TransactionalNurtureBindingAuthorityReader = {
  verifyCurrent(
    transaction: TransactionClient,
    input: VerifyCurrentNurtureBindingAuthorityInput,
  ): Promise<NurtureBindingAuthorityEvidence>;
};

export class DenyTransactionalNurtureBindingAuthorityReader
  implements TransactionalNurtureBindingAuthorityReader
{
  async verifyCurrent(): Promise<never> {
    throw new NurtureScenarioBindingError(
      "owner_authorization_unavailable",
      "Nurture binding authority is not configured; owner verification remains disabled.",
    );
  }
}

export class PrismaNurtureScenarioBindingAuthorizationRepository
  implements NurtureScenarioBindingAuthorizationRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly authorityReader: TransactionalNurtureBindingAuthorityReader =
      new DenyTransactionalNurtureBindingAuthorityReader(),
  ) {}

  reserveAnchor(
    input: ReserveNurtureBindingAnchorInput,
  ): Promise<ReservedNurtureBindingAnchor> {
    requireSubjectType(input.subjectType);
    requireDigest(input.reservationKeyHash, "reservation key hash");
    return this.prisma.$transaction(async (transaction) => {
      const existing = await findAnchorByReservationKey(transaction, input);
      if (existing) {
        assertAnchorReservable(existing);
        return mapReservedAnchor(input.subjectType, existing, true);
      }
      const candidateId = randomUUID();
      const reserved = await reserveAnchor(transaction, input, candidateId);
      assertAnchorReservable(reserved);
      return mapReservedAnchor(
        input.subjectType,
        reserved,
        reserved.id !== candidateId,
      );
    });
  }

  issueAuthorization(
    input: IssueNurtureBindingAuthorizationInput,
  ): Promise<IssuedNurtureBindingAuthorization> {
    validateIssueInput(input);
    return this.prisma.$transaction(async (transaction) => {
      const anchor = await findAndLockAnchor(transaction, input);
      if (!anchor) {
        throw new NurtureScenarioBindingError(
          "anchor_not_found",
          "The Nurture binding anchor was not found.",
        );
      }
      if (
        (anchor.status !== "reserved" &&
          anchor.status !== "bound_empty" &&
          anchor.status !== "associated") ||
        anchor.aggregateVersion !== input.ownerVersion
      ) {
        throw new NurtureScenarioBindingError(
          "anchor_not_current",
          "The Nurture binding anchor is not current at the requested version.",
        );
      }

      const authority = await this.authorityReader.verifyCurrent(
        transaction,
        input.authorityInput,
      );
      validateNurtureBindingAuthorityEvidence(authority, input.now);

      const existing =
        await transaction.nurtureScenarioBindingAuthorization.findUnique({
          where: { idempotencyKeyHash: input.idempotencyKeyHash },
        });
      if (existing) {
        return replayAuthorization(existing, input);
      }

      const candidateId = randomUUID();
      const issued =
        await transaction.nurtureScenarioBindingAuthorization.upsert({
          where: { idempotencyKeyHash: input.idempotencyKeyHash },
          update: {},
          create: {
            id: candidateId,
            workspaceId: input.workspaceId,
            subjectType: input.subjectType,
            childAnchorId:
              input.subjectType === "child" ? input.anchorId : undefined,
            familyAnchorId:
              input.subjectType === "family" ? input.anchorId : undefined,
            ownerRef: input.ownerRef,
            ownerVersion: input.ownerVersion,
            idempotencyKeyHash: input.idempotencyKeyHash,
            requestFingerprint: input.requestFingerprint,
            subjectEvidenceHash: input.subjectEvidenceHash,
            userEvidenceHash: input.userEvidenceHash,
            actorEvidenceHash: input.actorEvidenceHash,
            organizationEvidenceHash: input.organizationEvidenceHash,
            purpose: input.purpose,
            authorizationSourceRef: authority.authorizationSourceRef,
            authorizationSourceVersion: authority.authorizationSourceVersion,
            status: "active",
            verifiedAt: authority.verifiedAt,
            expiresAt: authority.expiresAt,
          },
        });
      return issued.id === candidateId
        ? mapAuthorization(issued, false)
        : replayAuthorization(issued, input);
    });
  }
}

async function findAnchorByReservationKey(
  transaction: TransactionClient,
  input: ReserveNurtureBindingAnchorInput,
): Promise<PersistedAnchor | null> {
  return input.subjectType === "child"
    ? transaction.nurtureChildBindingAnchor.findUnique({
        where: { reservationKeyHash: input.reservationKeyHash },
      })
    : transaction.nurtureFamilyBindingAnchor.findUnique({
        where: { reservationKeyHash: input.reservationKeyHash },
      });
}

async function reserveAnchor(
  transaction: TransactionClient,
  input: ReserveNurtureBindingAnchorInput,
  candidateId: string,
): Promise<PersistedAnchor> {
  const data = {
    id: candidateId,
    reservationKeyHash: input.reservationKeyHash,
    status: "reserved" as const,
  };
  return input.subjectType === "child"
    ? transaction.nurtureChildBindingAnchor.upsert({
        where: { reservationKeyHash: input.reservationKeyHash },
        update: {},
        create: data,
      })
    : transaction.nurtureFamilyBindingAnchor.upsert({
        where: { reservationKeyHash: input.reservationKeyHash },
        update: {},
        create: data,
      });
}

async function findAndLockAnchor(
  transaction: TransactionClient,
  input: IssueNurtureBindingAuthorizationInput,
): Promise<PersistedAnchor | null> {
  const rows =
    input.subjectType === "child"
      ? await transaction.$queryRaw<PersistedAnchor[]>(
          Prisma.sql`
            SELECT
              "id",
              "status",
              "aggregate_version" AS "aggregateVersion"
            FROM "nurture_child_binding_anchor"
            WHERE "id" = ${input.anchorId}
            FOR UPDATE
          `,
        )
      : await transaction.$queryRaw<PersistedAnchor[]>(
          Prisma.sql`
            SELECT
              "id",
              "status",
              "aggregate_version" AS "aggregateVersion"
            FROM "nurture_family_binding_anchor"
            WHERE "id" = ${input.anchorId}
            FOR UPDATE
          `,
        );
  return rows[0] ?? null;
}

function replayAuthorization(
  existing: PersistedAuthorization,
  input: IssueNurtureBindingAuthorizationInput,
): IssuedNurtureBindingAuthorization {
  if (existing.requestFingerprint !== input.requestFingerprint) {
    throw new NurtureScenarioBindingError(
      "authorization_replay_conflict",
      "The idempotency key was already used with a different binding authorization request.",
    );
  }
  if (existing.status !== "active" || existing.expiresAt <= input.now) {
    throw new NurtureScenarioBindingError(
      "authorization_receipt_inactive",
      "The existing binding authorization receipt is revoked or expired.",
    );
  }
  return mapAuthorization(existing, true);
}

function mapAuthorization(
  row: PersistedAuthorization,
  replayed: boolean,
): IssuedNurtureBindingAuthorization {
  return {
    authorizationRef: `nurture_scenario_binding_authorization_v1:${row.id}`,
    verifiedAt: row.verifiedAt,
    expiresAt: row.expiresAt,
    replayed,
  };
}

function mapReservedAnchor(
  subjectType: NurtureBindingSubjectType,
  row: PersistedAnchor,
  replayed: boolean,
): ReservedNurtureBindingAnchor {
  return {
    ownerRef: formatNurtureBindingOwnerRef(subjectType, row.id),
    ownerVersion: row.aggregateVersion,
    status: row.status as ReservedNurtureBindingAnchor["status"],
    replayed,
  };
}

function assertAnchorReservable(anchor: PersistedAnchor): void {
  if (
    anchor.status !== "reserved" &&
    anchor.status !== "bound_empty" &&
    anchor.status !== "associated"
  ) {
    throw new NurtureScenarioBindingError(
      "anchor_not_current",
      "The existing Nurture binding anchor cannot be reused.",
    );
  }
}

function validateIssueInput(
  input: IssueNurtureBindingAuthorizationInput,
): void {
  requireSubjectType(input.subjectType);
  requireCanonicalText(input.workspaceId, "workspace id", 128);
  const ownerRef = parseNurtureBindingOwnerRef(input.ownerRef);
  if (
    ownerRef.subjectType !== input.subjectType ||
    ownerRef.anchorId !== input.anchorId
  ) {
    throw new NurtureScenarioBindingError(
      "invalid_owner_ref",
      "The Nurture owner reference does not match the authorization anchor.",
    );
  }
  for (const [value, label] of [
    [input.idempotencyKeyHash, "idempotency key hash"],
    [input.requestFingerprint, "request fingerprint"],
    [input.subjectEvidenceHash, "subject evidence hash"],
    [input.userEvidenceHash, "user evidence hash"],
    [input.actorEvidenceHash, "actor evidence hash"],
  ] as const) {
    requireDigest(value, label);
  }
  if (input.organizationEvidenceHash) {
    requireDigest(input.organizationEvidenceHash, "organization evidence hash");
  }
  const authorityInput = input.authorityInput;
  if (
    !authorityInput ||
    authorityInput.workspaceId !== input.workspaceId ||
    authorityInput.subjectType !== input.subjectType ||
    authorityInput.anchorId !== input.anchorId ||
    authorityInput.ownerRef !== input.ownerRef ||
    authorityInput.ownerVersion !== input.ownerVersion ||
    authorityInput.purpose !== input.purpose
  ) {
    throw new NurtureScenarioBindingError(
      "owner_authorization_denied",
      "The transactional authority request does not match the binding command.",
    );
  }
  requireCanonicalText(authorityInput.actingUserId, "acting user id", 128);
  requireCanonicalText(authorityInput.actingActorId, "acting actor id", 128);
  if (authorityInput.representedOrganizationId !== undefined) {
    requireCanonicalText(
      authorityInput.representedOrganizationId,
      "represented organization id",
      128,
    );
  }
  if (
    input.purpose !== "scenario_binding_write" ||
    !Number.isSafeInteger(input.ownerVersion) ||
    input.ownerVersion < 1 ||
    !(input.now instanceof Date) ||
    Number.isNaN(input.now.getTime())
  ) {
    throw new NurtureScenarioBindingError(
      "owner_authorization_denied",
      "The Nurture binding authority evidence is not current.",
    );
  }
}

function requireSubjectType(value: NurtureBindingSubjectType): void {
  if (value !== "child" && value !== "family") {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The binding subject type is invalid.",
    );
  }
}

function requireCanonicalText(
  value: string,
  label: string,
  maxLength: number,
): void {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    value.length > maxLength
  ) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      `The ${label} is invalid.`,
    );
  }
}

function requireDigest(value: string, label: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      `The ${label} is invalid.`,
    );
  }
}
