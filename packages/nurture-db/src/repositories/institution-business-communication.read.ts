import type { Prisma, PrismaClient } from "@prisma/client";
import {
  institutionAdminDisclosureAuthorizes,
  type InstitutionBusinessCommunicationListPageV1,
  type InstitutionBusinessCommunicationListRowV1,
  type InstitutionBusinessCommunicationRawV1,
  type InstitutionBusinessCommunicationListPort,
  type InstitutionBusinessCommunicationReadPort,
} from "@the-nurture/scenario/harness";

const FAMILY_CARE_PURPOSE = "family_care_workflow" as const;
const AUTHORIZATION_PAGE_SIZE = 20;

type AuthorizedCommunicationFacts = InstitutionBusinessCommunicationRawV1 & {
  child_care_process_id: string;
  acknowledgement_state?: "pending" | "acknowledged";
  response_state?: "awaiting_reply" | "responded" | "not_applicable";
  due_at?: string;
};

const toSingleMessageRaw = (
  facts: AuthorizedCommunicationFacts,
): InstitutionBusinessCommunicationRawV1 => ({
  message_id: facts.message_id,
  enrollment_id: facts.enrollment_id,
  care_group_id: facts.care_group_id,
  institution_id: facts.institution_id,
  direction: facts.direction,
  data_class: facts.data_class,
  purpose: facts.purpose,
  author_side: facts.author_side,
  author_role: facts.author_role,
  occurred_at: facts.occurred_at,
  corrected: facts.corrected,
  redacted: facts.redacted,
  lifecycle: facts.lifecycle,
  ...(facts.lifecycle_reason ? { lifecycle_reason: facts.lifecycle_reason } : {}),
  ...(facts.body_envelope ? { body_envelope: facts.body_envelope } : {}),
  ...(facts.correction_body_envelope
    ? { correction_body_envelope: facts.correction_body_envelope }
    : {}),
});

const toListRow = (
  facts: AuthorizedCommunicationFacts,
): InstitutionBusinessCommunicationListRowV1 => ({
  message_id: facts.message_id,
  child_care_process_id: facts.child_care_process_id,
  direction: facts.direction,
  data_class: facts.data_class,
  author_side: facts.author_side,
  occurred_at: facts.occurred_at,
  corrected: facts.corrected,
  redacted: facts.redacted,
  lifecycle: facts.lifecycle,
  ...(facts.lifecycle_reason ? { lifecycle_reason: facts.lifecycle_reason } : {}),
  ...(facts.acknowledgement_state
    ? { acknowledgement_state: facts.acknowledgement_state }
    : {}),
  ...(facts.response_state ? { response_state: facts.response_state } : {}),
  ...(facts.due_at ? { due_at: facts.due_at } : {}),
});

const currentRole = (
  role: { status: string; startsAt: Date | null; endsAt: Date | null } | null,
  now: Date,
): boolean =>
  Boolean(
    role &&
      role.status === "active" &&
      (!role.startsAt || role.startsAt <= now) &&
      (!role.endsAt || role.endsAt > now),
  );

/**
 * Exact request-time source read for the protected Institution Admin
 * projection. Every locator and policy fact stays inside the Nurture owner.
 */
export class PrismaInstitutionBusinessCommunicationReadPort
  implements InstitutionBusinessCommunicationReadPort, InstitutionBusinessCommunicationListPort
{
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async loadInstitutionBusinessCommunication(input: {
    workspace_id: string;
    participant_id: string;
    message_id: string;
  }): Promise<
    | { authorized: true; communication: InstitutionBusinessCommunicationRawV1 }
    | { authorized: false }
  > {
    const loaded = await this.loadAuthorizedCommunicationAt(input, new Date());
    return loaded.authorized
      ? { authorized: true, communication: toSingleMessageRaw(loaded.communication) }
      : loaded;
  }

  private async loadAuthorizedCommunicationAt(
    input: {
      workspace_id: string;
      participant_id: string;
      message_id: string;
    },
    at: Date,
  ): Promise<
    | { authorized: true; communication: AuthorizedCommunicationFacts }
    | { authorized: false }
  > {
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) return { authorized: false };

    const message = await this.prisma.nurtureFamilyCareMessage.findFirst({
      where: {
        id: input.message_id,
        workspaceId: input.workspace_id,
        writerContract: "harness_g2_v1",
        status: { in: ["sent", "redacted"] },
        enrollmentId: { not: null },
        careGroupId: { not: null },
        grantId: { not: null },
      },
      include: {
        enrollment: { include: { institution: true, careGroup: true } },
        grant: true,
        senderRoleAssignment: true,
        corrections: {
          where: { status: "active" },
          orderBy: [{ correctionVersion: "desc" }, { id: "asc" }],
          take: 1,
        },
      },
    });
    if (
      !message?.enrollment ||
      !message.enrollmentId ||
      !message.careGroupId ||
      !message.grant ||
      !message.direction ||
      message.enrollment.status !== "active" ||
      message.enrollment.deletedAt !== null ||
      message.enrollment.institution.status !== "active" ||
      message.enrollment.institution.deletedAt !== null ||
      !message.enrollment.careGroup ||
      message.enrollment.careGroup.id !== message.careGroupId ||
      message.enrollment.careGroup.status !== "active" ||
      message.enrollment.careGroup.deletedAt !== null
    ) {
      return { authorized: false };
    }

    const institutionId = message.enrollment.institutionId;
    const adminRole = await this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: "institution_admin",
        scopeType: "institution",
        scopeId: institutionId,
        status: "active",
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: at } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
        ],
      },
      orderBy: { id: "asc" },
    });
    if (!currentRole(adminRole, at)) return { authorized: false };

    const item =
      message.messageKind === "family_message"
        ? await this.prisma.nurtureFamilyCareItem.findFirst({
            where: {
              workspaceId: input.workspace_id,
              sourceMessageId: message.id,
              writerContract: "harness_g2_v1",
            },
          })
        : message.sourceItemId
          ? await this.prisma.nurtureFamilyCareItem.findFirst({
              where: {
                workspaceId: input.workspace_id,
                id: message.sourceItemId,
                writerContract: "harness_g2_v1",
              },
            })
          : null;
    const direct = message.messageKind === "caregiver_direct_message";
    if (!direct && !item) return { authorized: false };
    if (
      item &&
      (item.enrollmentId !== message.enrollmentId ||
        item.careGroupId !== message.careGroupId ||
        item.grantId !== message.grantId)
    ) {
      return { authorized: false };
    }

    const dataClass = direct ? "direct_care_communication" : item!.dataClass;
    if (
      dataClass !== "family_care_question" &&
      dataClass !== "direct_care_communication"
    ) {
      return { authorized: false };
    }
    const grant = message.grant;
    const exactGrantTarget =
      (grant.grantedToScopeType === "care_group" &&
        grant.grantedToScopeId === message.careGroupId) ||
      (grant.grantedToScopeType === "enrollment" &&
        grant.grantedToScopeId === message.enrollmentId) ||
      (grant.grantedToScopeType === "institution" &&
        grant.grantedToScopeId === institutionId);
    const grantCurrent =
      grant.status === "active" &&
      grant.revokedAt === null &&
      grant.deletedAt === null &&
      (!grant.effectiveFrom || grant.effectiveFrom <= at) &&
      (!grant.expiresAt || grant.expiresAt > at) &&
      grant.childCareProcessId === message.childCareProcessId &&
      grant.enrollmentId === message.enrollmentId &&
      exactGrantTarget &&
      grant.directions.includes(message.direction) &&
      grant.dataClasses.includes(dataClass) &&
      grant.purposes.includes(FAMILY_CARE_PURPOSE);
    if (!grantCurrent) return { authorized: false };
    if (
      !institutionAdminDisclosureAuthorizes(grant.policySnapshotPayload, {
        institution_id: institutionId,
        enrollment_id: message.enrollmentId,
        care_group_id: message.careGroupId,
        direction: message.direction,
        data_class: dataClass,
        purpose: FAMILY_CARE_PURPOSE,
      })
    ) {
      return { authorized: false };
    }

    const authorRole = message.senderRoleAssignment.role;
    const familyAuthored =
      message.messageKind === "family_message" &&
      message.authorshipKind === "family_authored" &&
      authorRole === "guardian";
    const caregiverAuthored =
      (message.messageKind === "caregiver_reply" || direct) &&
      message.authorshipKind === "caregiver_confirmed" &&
      (authorRole === "caregiver" || authorRole === "lead_caregiver");
    if (!familyAuthored && !caregiverAuthored) return { authorized: false };

    return {
      authorized: true,
      communication: {
        message_id: message.id,
        child_care_process_id: message.childCareProcessId,
        enrollment_id: message.enrollmentId,
        care_group_id: message.careGroupId,
        institution_id: institutionId,
        direction: message.direction,
        data_class: dataClass,
        purpose: FAMILY_CARE_PURPOSE,
        author_side: familyAuthored ? "family" : "care_group",
        author_role: authorRole as "guardian" | "caregiver" | "lead_caregiver",
        occurred_at: message.createdAt.toISOString(),
        corrected: message.corrections.length > 0,
        redacted: message.status === "redacted",
        lifecycle: item?.lifecycleState ?? "active",
        ...(item?.lifecycleReason ? { lifecycle_reason: item.lifecycleReason } : {}),
        ...(item
          ? {
              acknowledgement_state: item.acknowledgementState,
              response_state: item.responseState,
              ...(item.dueAt ? { due_at: item.dueAt.toISOString() } : {}),
            }
          : {}),
        ...(message.bodyProtectionPayload
          ? { body_envelope: message.bodyProtectionPayload }
          : {}),
        ...(message.corrections[0]?.bodyProtectionPayload
          ? { correction_body_envelope: message.corrections[0].bodyProtectionPayload }
          : {}),
      },
    };
  }

  async listInstitutionBusinessCommunications(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    occurred_from: string;
    occurred_before: string;
    snapshot_at: string;
    limit: number;
    child_care_process_id?: string;
    direction?: "family_to_org" | "org_to_family";
    data_class?: "family_care_question" | "direct_care_communication";
  }): Promise<InstitutionBusinessCommunicationListPageV1> {
    const limit = Math.max(0, Math.min(input.limit, 100));
    if (limit === 0) return { rows: [], has_more: false };
    const occurredFrom = new Date(input.occurred_from);
    const occurredBefore = new Date(input.occurred_before);
    const snapshot = new Date(input.snapshot_at);
    if (
      [occurredFrom, occurredBefore, snapshot].some((value) => Number.isNaN(value.getTime())) ||
      occurredFrom >= occurredBefore
    ) {
      throw new RangeError("invalid business-communication list window");
    }
    const authorized: InstitutionBusinessCommunicationListRowV1[] = [];
    let cursor: string | undefined;
    while (authorized.length <= limit) {
      const rows = await this.prisma.nurtureFamilyCareMessage.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          ...(input.child_care_process_id
            ? { childCareProcessId: input.child_care_process_id }
            : {}),
          ...(input.direction ? { direction: input.direction } : {}),
          writerContract: "harness_g2_v1",
          status: { in: ["sent", "redacted"] },
          createdAt: { gte: occurredFrom, lt: occurredBefore, lte: snapshot },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: AUTHORIZATION_PAGE_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: { id: true },
      });
      if (rows.length === 0) break;
      const loaded = await Promise.all(
        rows.map((row) =>
          this.loadAuthorizedCommunicationAt(
            {
              workspace_id: input.workspace_id,
              participant_id: input.participant_id,
              message_id: row.id,
            },
            snapshot,
          ),
        ),
      );
      authorized.push(
        ...loaded.flatMap((result) =>
          result.authorized &&
          (!input.data_class || result.communication.data_class === input.data_class)
            ? [toListRow(result.communication)]
            : [],
        ),
      );
      cursor = rows.at(-1)!.id;
      if (rows.length < AUTHORIZATION_PAGE_SIZE) break;
    }
    return { rows: authorized.slice(0, limit), has_more: authorized.length > limit };
  }
}
