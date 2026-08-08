import { Prisma, type PrismaClient } from "@prisma/client";
import {
  nurtureCanonicalJsonBytes,
  nurtureSha256Hex,
  NurtureC30SubjectPresentationError,
  type NurtureC30CurrentSubjectV1,
  type NurtureC30SubjectReadContextV1,
  type NurtureC30SubjectReadPageV1,
  type NurtureC30SubjectReadRepository,
} from "@the-nurture/scenario";

type TransactionClient = Prisma.TransactionClient;

export type NurtureC30CurrentPairEvidenceInput = {
  workspaceId: string;
  childAnchorId: string;
  childOwnerVersion: number;
  familyAnchorId: string;
  familyOwnerVersion: number;
  purpose: "read_subject_presentation";
  now: Date;
};

export type NurtureC30CurrentPairEvidence = {
  current: true;
  evidenceSourceRef: string;
  evidenceSourceVersion: number;
};

export type TransactionalNurtureC30CurrentPairEvidenceReader = {
  verifyCurrent(
    transaction: TransactionClient,
    input: NurtureC30CurrentPairEvidenceInput,
  ): Promise<NurtureC30CurrentPairEvidence>;
};

export class DenyTransactionalNurtureC30CurrentPairEvidenceReader
implements TransactionalNurtureC30CurrentPairEvidenceReader {
  async verifyCurrent(): Promise<never> {
    throw authorityChanged("Current canonical-pair evidence is not configured.");
  }
}

export class PrismaNurtureC30SubjectReadRepository implements NurtureC30SubjectReadRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly pairEvidenceReader: TransactionalNurtureC30CurrentPairEvidenceReader =
      new DenyTransactionalNurtureC30CurrentPairEvidenceReader(),
  ) {}

  async listCurrent(
    input: NurtureC30SubjectReadContextV1 & {
      after_process_id?: string;
      page_size: number;
    },
  ): Promise<NurtureC30SubjectReadPageV1> {
    return this.prisma.$transaction(async (transaction) => {
      await assertCurrentParticipantBinding(transaction, input);
      const roles = await transaction.nurtureCareRoleAssignment.findMany({
        where: {
          workspaceId: input.participant.workspace_ref.object_id,
          participantId: input.participant.participant_ref.object_id,
          status: "active",
          scopeType: "child_care_process",
          ...(input.after_process_id ? { scopeId: { gt: input.after_process_id } } : {}),
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: input.now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: input.now } }] },
          ],
        },
        distinct: ["scopeId"],
        orderBy: [{ scopeId: "asc" }, { id: "asc" }],
        take: input.page_size + 1,
        select: { scopeId: true },
      });
      const selected = roles.slice(0, input.page_size);
      const subjects: NurtureC30CurrentSubjectV1[] = [];
      for (const role of selected) {
        subjects.push(await readCurrentSubject(transaction, input, role.scopeId, this.pairEvidenceReader));
      }
      return {
        subjects,
        ...(roles.length > input.page_size && selected.at(-1)
          ? { next_after_process_id: selected.at(-1)?.scopeId }
          : {}),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async resolveCurrent(
    input: NurtureC30SubjectReadContextV1 & { process_id: string },
  ): Promise<NurtureC30CurrentSubjectV1 | null> {
    return this.prisma.$transaction(async (transaction) => {
      await assertCurrentParticipantBinding(transaction, input);
      return readCurrentSubject(
        transaction,
        input,
        input.process_id,
        this.pairEvidenceReader,
      );
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}

async function assertCurrentParticipantBinding(
  transaction: TransactionClient,
  input: NurtureC30SubjectReadContextV1,
): Promise<void> {
  const participant = await transaction.nurtureParticipant.findUnique({
    where: { id: input.participant.participant_ref.object_id },
    select: { workspaceId: true, status: true, aggregateVersion: true },
  });
  if (
    !participant
    || participant.workspaceId !== input.participant.workspace_ref.object_id
    || participant.workspaceId !== input.principal.workspace_ref.object_id
    || participant.status !== "active"
    || participant.aggregateVersion !== input.participant.participant_ref.version
  ) throw authorityChanged("The current local Participant changed.");

  const bindings = await transaction.nurtureParticipantPrincipalBinding.findMany({
    where: {
      participantId: input.participant.participant_ref.object_id,
      workspaceId: input.participant.workspace_ref.object_id,
      currentKey: "current",
    },
    take: 2,
  });
  const binding = bindings[0];
  const expectedOrganization = input.participant.represented_organization_ref?.object_id ?? null;
  if (
    bindings.length !== 1
    || !binding
    || binding.status !== "active"
    || binding.aggregateVersion !== input.participant.binding_revision
    || binding.accountObjectId !== input.principal.account_ref.object_id
    || binding.actorObjectId !== input.principal.actor_ref.object_id
    || binding.representedOrganizationObjectId !== expectedOrganization
  ) throw authorityChanged("The current principal binding changed.");
}

async function readCurrentSubject(
  transaction: TransactionClient,
  input: NurtureC30SubjectReadContextV1,
  processId: string,
  pairEvidenceReader: TransactionalNurtureC30CurrentPairEvidenceReader,
): Promise<NurtureC30CurrentSubjectV1> {
  const workspaceId = input.participant.workspace_ref.object_id;
  const roles = await transaction.nurtureCareRoleAssignment.findMany({
    where: {
      workspaceId,
      participantId: input.participant.participant_ref.object_id,
      scopeType: "child_care_process",
      scopeId: processId,
      status: "active",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: input.now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: input.now } }] },
      ],
    },
    orderBy: { id: "asc" },
    select: { id: true, role: true, aggregateVersion: true, updatedAt: true },
  });
  if (roles.length === 0) throw authorityChanged("No current local role covers the care process.");

  const process = await transaction.nurtureChildCareProcess.findUnique({
    where: { id: processId },
    select: {
      id: true,
      workspaceId: true,
      childId: true,
      primaryFamilyId: true,
      status: true,
      aggregateVersion: true,
      updatedAt: true,
      deletedAt: true,
    },
  });
  if (
    !process
    || process.workspaceId !== workspaceId
    || process.status !== "active"
    || process.deletedAt !== null
    || process.primaryFamilyId === null
  ) throw unavailableSubject("The care process is not current.");

  const child = await transaction.nurtureChild.findUnique({
    where: { id: process.childId },
    select: { workspaceId: true, status: true, aggregateVersion: true, updatedAt: true, deletedAt: true },
  });
  const family = await transaction.nurtureFamily.findUnique({
    where: { id: process.primaryFamilyId },
    select: {
      workspaceId: true,
      childCareProcessId: true,
      status: true,
      aggregateVersion: true,
      updatedAt: true,
      deletedAt: true,
    },
  });
  if (
    !child
    || child.workspaceId !== workspaceId
    || child.status !== "active"
    || child.deletedAt !== null
    || !family
    || family.workspaceId !== workspaceId
    || family.childCareProcessId !== process.id
    || family.status !== "active"
    || family.deletedAt !== null
  ) throw unavailableSubject("The local child/family lifecycle is not current.");

  const familyAssociations = await transaction.nurtureFamilyAnchorAssociation.findMany({
    where: {
      workspaceId,
      childCareProcessId: process.id,
      familyId: process.primaryFamilyId,
      childId: process.childId,
      currentKey: "current",
    },
    include: {
      familyAnchor: true,
      childAnchor: true,
      childAssociation: true,
    },
    take: 2,
  });
  const association = familyAssociations[0];
  if (
    familyAssociations.length !== 1
    || !association
    || association.status !== "active"
    || association.familyAnchor.status !== "associated"
    || association.childAnchor.status !== "associated"
    || association.childAssociation.status !== "active"
    || association.childAssociation.currentKey !== "current"
    || association.childAssociation.childId !== process.childId
  ) throw unavailableSubject("The current canonical association is unavailable.");

  const operation = await transaction.nurtureC30PairOperation.findUnique({
    where: { familyAssociationId: association.id },
    select: {
      state: true,
      childAssociationId: true,
      childOwnerVersion: true,
      familyOwnerVersion: true,
      currentOwnerEvidenceHash: true,
    },
  });
  if (
    !operation
    || operation.state !== "committed"
    || operation.childAssociationId !== association.childAssociationId
    || operation.childOwnerVersion !== association.childAnchor.aggregateVersion
    || operation.familyOwnerVersion !== association.familyAnchor.aggregateVersion
  ) throw unavailableSubject("The canonical pair commit is unavailable.");

  const pairEvidence = await pairEvidenceReader.verifyCurrent(transaction, {
    workspaceId,
    childAnchorId: association.childAnchorId,
    childOwnerVersion: association.childAnchor.aggregateVersion,
    familyAnchorId: association.familyAnchorId,
    familyOwnerVersion: association.familyAnchor.aggregateVersion,
    purpose: "read_subject_presentation",
    now: input.now,
  });
  if (
    pairEvidence.current !== true
    || !opaqueEvidencePattern.test(pairEvidence.evidenceSourceRef)
    || !Number.isSafeInteger(pairEvidence.evidenceSourceVersion)
    || pairEvidence.evidenceSourceVersion < 1
  ) throw authorityChanged("Current canonical-pair evidence is invalid.");

  const contextVersion = `v1.${nurtureSha256Hex(nurtureCanonicalJsonBytes({
    context_version: 1,
    workspace_id: workspaceId,
    process_id: process.id,
    process_revision: process.aggregateVersion,
    process_updated_at: process.updatedAt.toISOString(),
    child_revision: child.aggregateVersion,
    child_updated_at: child.updatedAt.toISOString(),
    family_revision: family.aggregateVersion,
    family_updated_at: family.updatedAt.toISOString(),
    child_association_revision: association.childAssociation.aggregateVersion,
    family_association_revision: association.aggregateVersion,
    child_owner_version: association.childAnchor.aggregateVersion,
    family_owner_version: association.familyAnchor.aggregateVersion,
    pair_commit_evidence_hash: operation.currentOwnerEvidenceHash,
    current_pair_source_ref: pairEvidence.evidenceSourceRef,
    current_pair_source_version: pairEvidence.evidenceSourceVersion,
    participant_revision: input.participant.participant_ref.version,
    binding_revision: input.participant.binding_revision,
    authority_revision: input.participant.authority_revision,
    roles: roles.map((role) => ({
      id: role.id,
      role: role.role,
      revision: role.aggregateVersion,
      updated_at: role.updatedAt.toISOString(),
    })),
  }))}`;
  return {
    subject_version: 1,
    process_id: process.id,
    context_version: contextVersion,
    process_revision: process.aggregateVersion,
    updated_at: process.updatedAt.toISOString(),
  };
}

function authorityChanged(message: string): NurtureC30SubjectPresentationError {
  return new NurtureC30SubjectPresentationError("subject_authority_changed", message);
}

function unavailableSubject(message: string): NurtureC30SubjectPresentationError {
  return new NurtureC30SubjectPresentationError("subject_unavailable", message);
}

const opaqueEvidencePattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
