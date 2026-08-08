import type { PrismaClient } from "@prisma/client";
import type {
  NurtureParticipantBindingReader,
  NurtureParticipantPrincipalBindingV1,
} from "@the-nurture/scenario";

export class PrismaNurtureParticipantBindingReader implements NurtureParticipantBindingReader {
  constructor(private readonly prisma: PrismaClient) {}

  async readCurrentBindings(
    input: Parameters<NurtureParticipantBindingReader["readCurrentBindings"]>[0],
  ): Promise<readonly NurtureParticipantPrincipalBindingV1[]> {
    const rows = await this.prisma.nurtureParticipantPrincipalBinding.findMany({
      where: {
        workspaceId: input.workspace_ref.object_id,
        accountObjectId: input.account_ref.object_id,
        actorObjectId: input.actor_ref.object_id,
        currentKey: "current",
        participant: {
          workspaceId: input.workspace_ref.object_id,
          status: "active",
        },
      },
      include: { participant: { select: { aggregateVersion: true } } },
      orderBy: { id: "asc" },
      take: 2,
    });
    return rows.map((row) => ({
      binding_version: 1,
      binding_revision: row.aggregateVersion,
      status: row.status,
      participant_ref: ref(
        "nurture",
        "participant",
        row.participantId,
        row.participant.aggregateVersion,
      ),
      account_ref: ref("my_chat", "user", row.accountObjectId),
      actor_ref: ref("my_chat", "actor", row.actorObjectId),
      workspace_ref: ref("my_chat", "workspace", row.workspaceId),
      ...(row.representedOrganizationObjectId
        ? {
            represented_organization_ref: ref(
              "my_chat",
              "organization",
              row.representedOrganizationObjectId,
            ),
          }
        : {}),
    }));
  }
}

function ref(
  namespace: "my_chat" | "nurture",
  objectType: string,
  objectId: string,
  version?: number,
) {
  return {
    schema_version: 1 as const,
    namespace,
    object_type: objectType,
    object_id: objectId,
    ...(version === undefined ? {} : { version }),
  };
}
