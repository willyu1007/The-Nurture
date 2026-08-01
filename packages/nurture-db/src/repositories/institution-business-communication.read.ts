import type { Prisma, PrismaClient } from "@prisma/client";
import {
  institutionAdminDisclosureAuthorizes,
  type InstitutionBusinessCommunicationRawV1,
  type InstitutionBusinessCommunicationReadPort,
} from "@the-nurture/scenario/harness";

const FAMILY_CARE_PURPOSE = "family_care_workflow" as const;

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
  implements InstitutionBusinessCommunicationReadPort
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
    const now = new Date();
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
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: { id: "asc" },
    });
    if (!currentRole(adminRole, now)) return { authorized: false };

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
      (!grant.effectiveFrom || grant.effectiveFrom <= now) &&
      (!grant.expiresAt || grant.expiresAt > now) &&
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
        ...(message.bodyProtectionPayload
          ? { body_envelope: message.bodyProtectionPayload }
          : {}),
        ...(message.corrections[0]?.bodyProtectionPayload
          ? { correction_body_envelope: message.corrections[0].bodyProtectionPayload }
          : {}),
      },
    };
  }
}
