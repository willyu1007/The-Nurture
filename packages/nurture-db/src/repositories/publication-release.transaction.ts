import { createHash } from "node:crypto";
import { currentAttributionRowsPerChild } from "./media-safety.read.js";
import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CaregiverFactAuthorityV1,
  CommitTargetReleaseResultV1,
  MediaEligibilityInputV1,
  PublicationReleasePort,
  PublicationSafetyFactsV1,
  PublicationSafetyReadPort,
  ReleaseFactsV1,
  ReleaseTargetFactsV1,
  ResolvedPublishScheduleV1,
} from "@the-nurture/scenario/harness";
import {
  activeRoleWindow,
  caregiverRowAuthority,
  readMediaComposition,
  resolveCaregiverReach,
} from "./board-read-support.js";

const RELEASE_COMMAND_KEY = "release_publish_process";
const RELEASE_COMMAND_SCOPE = "board_publication";
const RELEASE_COMMAND_CONTRACT_VERSION = 1;

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

/**
 * One release attempt reaches every target of a process, so the attempt
 * identity alone cannot be the committed identity — `CommandExecution` is
 * unique per command hash, and a second target would collide with the first.
 * The committed identity is therefore per (attempt, target); the attempt hash
 * travels as the parent, which is exactly what that column records.
 */
export const publicationReleaseCommandIdentity = (
  commandRequestId: string,
  targetKey: string,
): string => sha256(`nurture.publication-release.v1\0${commandRequestId}\0${targetKey}`);

export const publicationReleaseAttemptIdentity = (commandRequestId: string): string =>
  sha256(`nurture.publication-release-attempt.v1\0${commandRequestId}`);

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const canonicalRef = (objectType: string, objectId: string) => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version: 1,
});

/**
 * The release and post-release safety owner (G3-D).
 *
 * `commitTargetRelease` is the only place in T-006 where three facts must land
 * as one: the target's `PublicationRelease`, its logical Receipt and the
 * immutable `CommandExecution`. A partially applied target is worse than a
 * failed one — the family would hold a publication with no receipt, or an
 * audit row with nothing behind it — so the three writes share one transaction
 * and an exact command replay returns the original refs instead of writing
 * anything.
 */
export class PrismaPublicationReleasePort
  implements PublicationReleasePort, PublicationSafetyReadPort
{
  /**
   * A `PrismaClient` rather than a transaction client: this port opens its own
   * per-target transaction and must not be handed one that is already open.
   */
  constructor(private readonly prisma: PrismaClient) {}

  private async listProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) return [];
    const processes = await this.prisma.nurturePublishProcess.findMany({
      where: { workspaceId: input.workspace_id, careGroupId: reach.care_group_id },
      select: { processKey: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return processes.map((process) => process.processKey);
  }

  async listReleasableProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    return this.listProcessKeys(input);
  }

  async listSafetyProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    return this.listProcessKeys(input);
  }

  async loadReleaseFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<ReleaseFactsV1 | null> {
    const at = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
    if (!reach) return null;
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: {
        currentRevision: true,
        editHold: true,
        targets: {
          include: {
            grant: true,
            enrollment: true,
            release: { include: { receipt: { select: { id: true } } } },
          },
          orderBy: [{ targetKey: "asc" }],
        },
      },
    });
    if (!process) return null;

    const schedule = readResolvedSchedule(process);

    const frozenRevision = process.frozenRevisionId
      ? await this.prisma.nurturePublishProcessRevision.findFirst({
          where: { id: process.frozenRevisionId, workspaceId: input.workspace_id },
          select: { revision: true },
        })
      : null;

    // The authorizing role must still be current at release time; a release
    // signed by an assignment that has since lapsed is not a release.
    const authorizingRoleCurrent = process.authorizingRoleAssignmentId
      ? (await this.prisma.nurtureCareRoleAssignment.count({
          where: {
            id: process.authorizingRoleAssignmentId,
            workspaceId: input.workspace_id,
            ...activeRoleWindow(at),
          },
        })) === 1
      : true;

    const media = await this.loadMediaEligibility(
      input.workspace_id,
      process.currentRevision?.mediaCompositionPayload ?? null,
    );

    const targets: ReleaseTargetFactsV1[] = process.targets.map((target) => {
      return {
        target_key: target.targetKey,
        child_care_process_id: target.childCareProcessId,
        enrollment_active: target.enrollment.status === "active" && target.enrollment.deletedAt === null,
        grant_allows: target.grant.status === "active" && target.grant.deletedAt === null,
        data_class_allowed: target.grant.dataClasses.includes(process.dataClass),
        purpose_allowed: target.grant.purposes.includes(process.purposeKey),
        // One family may see its own child and no one else's. Any other
        // clearly visible child in the composed media blocks this target.
        exposure_allows_child_ids: [target.childCareProcessId],
        ...(target.release
          ? {
              already_committed: {
                publication_ref: target.release.id,
                receipt_ref: target.release.receipt?.id ?? "",
              },
            }
          : {}),
      };
    });

    return {
      authority: caregiverRowAuthority(reach, process.careGroupId) as CaregiverFactAuthorityV1,
      authorizing_role_current: authorizingRoleCurrent,
      process_state: process.state,
      current_revision: process.currentRevision?.revision ?? 0,
      ...(frozenRevision ? { frozen_revision: frozenRevision.revision } : {}),
      // The owner only ever holds saved revisions, so it cannot observe an
      // unsaved buffer. Reporting `currentRevisionId === null` here would
      // answer a different question — "nothing was ever saved" — under this
      // field's name. That case is already visible as `current_revision: 0`.
      has_unsaved_revision: false,
      edit_hold_active: Boolean(process.editHold && process.editHold.expiresAt > at),
      schedule,
      media,
      targets,
    };
  }

  private async loadMediaEligibility(
    workspaceId: string,
    compositionPayload: unknown,
  ): Promise<MediaEligibilityInputV1[]> {
    const composed = readMediaComposition(compositionPayload);
    if (composed.length === 0) return [];
    const assets = await this.prisma.nurtureMediaAssetRef.findMany({
      where: {
        workspaceId,
        id: { in: composed.map((entry) => entry.media_asset_id) },
        deletedAt: null,
      },
      include: { attributions: { where: { deletedAt: null } } },
    });
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    return composed.flatMap((entry) => {
      const asset = byId.get(entry.media_asset_id);
      if (!asset) return [];
      return [
        {
          media_asset_id: asset.id,
          // The revision the draft composed, not whatever the asset is now.
          media_revision: entry.media_revision,
          current_media_revision: asset.mediaRevision,
          lifecycle: asset.lifecycle,
          // One CURRENT fact per child, then the terminal "not this child"
          // states drop out. Mapping every historical row treated a stale
          // superseded predecessor as a live obligation while dropping the
          // current rejected fact that replaced it — a child the teacher said
          // is NOT in the photo blocked it as unconfirmed, and a routine A→B
          // correction blocked the media forever. A rejected or superseded
          // current fact records that this child is not in the asset, so it
          // carries no obligation; a face nobody attributed produces no row
          // and therefore no obligation either.
          visible_children: currentAttributionRowsPerChild(asset.attributions)
            .filter(
              (attribution) =>
                attribution.status !== "rejected" && attribution.status !== "superseded",
            )
            .map((attribution) => ({
              child_care_process_id: attribution.child_care_process_id,
              attribution_status: attribution.status,
              clearly_visible: true,
            })),
        },
      ];
    });
  }

  async commitTargetRelease(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    target_key: string;
    revision: number;
    command_request_id: string;
  }): Promise<CommitTargetReleaseResultV1> {
    const at = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
    if (!reach) return { status: "rejected", reason_code: "not_authorized" };

    const commandHash = publicationReleaseCommandIdentity(input.command_request_id, input.target_key);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const process = await tx.nurturePublishProcess.findFirst({
          where: {
            workspaceId: input.workspace_id,
            processKey: input.process_key,
            careGroupId: reach.care_group_id,
          },
            include: {
            targets: {
              where: { targetKey: input.target_key },
              include: { release: true, grant: true, enrollment: true },
            },
          },
        });
        if (!process) return { status: "rejected", reason_code: "target_unavailable" };
        const target = process.targets[0];
        if (!target) return { status: "rejected", reason_code: "target_unavailable" };

        // Eligibility was read before the fan-out began. A thirty-target attempt
        // spans real time, and a Grant revoked partway through must stop the
        // targets that have not committed yet — otherwise a family receives a
        // publication, and a delivered Receipt, under consent it withdrew.
        if (
          target.grant.status !== "active" ||
          target.grant.deletedAt !== null ||
          !target.grant.dataClasses.includes(process.dataClass) ||
          !target.grant.purposes.includes(process.purposeKey)
        ) {
          return { status: "rejected", reason_code: "grant_not_allowed" };
        }
        if (target.enrollment.status !== "active" || target.enrollment.deletedAt !== null) {
          return { status: "rejected", reason_code: "enrollment_inactive" };
        }

        // An exact replay of the same command for the same target returns the
        // refs the original attempt committed, and writes nothing.
        if (target.release) {
          const existingReceipt = target.release.receiptId ?? "";
          return target.release.commandRequestIdHash === commandHash
            ? {
                status: "committed" as const,
                publication_ref: target.release.id,
                receipt_ref: existingReceipt,
              }
            : { status: "rejected" as const, reason_code: "already_released" };
        }

        const revision = await tx.nurturePublishProcessRevision.findFirst({
          where: {
            workspaceId: input.workspace_id,
            publishProcessId: process.id,
            revision: input.revision,
          },
        });
        if (!revision) return { status: "rejected", reason_code: "revision_unavailable" };

        // The T-005 receipt lifecycle CHECK governs this source type too: a
        // delivered publication Receipt must carry its whole routing identity.
        const receipt = await tx.nurtureChildLinkReceipt.create({
          data: {
            workspaceId: input.workspace_id,
            grantId: target.grantId,
            childCareProcessId: target.childCareProcessId,
            enrollmentId: target.enrollmentId,
            direction: "org_to_family",
            dataClass: process.dataClass,
            sourceType: "publication_release",
            sourceId: target.id,
            routingAttemptKey: commandHash,
            targetScopeType: "family",
            targetScopeId: target.familyRefKey,
            status: "delivered",
            deliveredAt: at,
          },
        });

        const release = await tx.nurturePublicationRelease.create({
          data: {
            workspaceId: input.workspace_id,
            publishProcessId: process.id,
            publishProcessTargetId: target.id,
            publishProcessRevisionId: revision.id,
            releasedByRoleAssignmentId: reach.role_assignment_id,
            commandRequestIdHash: commandHash,
            receiptId: receipt.id,
            committedAt: at,
          },
        });

        await tx.nurtureCommandExecution.create({
          data: {
            workspaceId: input.workspace_id,
            commandRequestIdHash: commandHash,
            originInvocationRequestIdHash: publicationReleaseAttemptIdentity(input.command_request_id),
            parentCommandRequestIdHash: publicationReleaseAttemptIdentity(input.command_request_id),
            commandKey: RELEASE_COMMAND_KEY,
            // A lane label, as in every other spec. Writing the raw CareGroup id
            // here put two meanings under one column name.
            commandScope: RELEASE_COMMAND_SCOPE,
            commandContractVersion: RELEASE_COMMAND_CONTRACT_VERSION,
            payloadHash: sha256(
              JSON.stringify([process.processKey, target.targetKey, input.revision]),
            ),
            // The participant, as in every other command. `readResult` gates on
            // `business_actor_ref === actor_participant_id`, so a role
            // assignment id here made a release execution unreadable forever.
            // Which assignment authorized it is already on the release row.
            businessActorRef: input.participant_id,
            childCareProcessId: target.childCareProcessId,
            // Both ref columns are canonical-ref arrays: the immutable result
            // names what it produced, it does not describe it.
            targetRefs: asJson([canonicalRef("publish_process_target", target.id)]),
            businessOutcome: "applied",
            outputRefs: asJson([
              canonicalRef("publication_release", release.id),
              canonicalRef("child_link_receipt", receipt.id),
            ]),
            // No Workflow handoff participates in a release, so the snapshot
            // list stays empty and there is no driver ref to record.
            handoffRequestSnapshotsPayload: asJson([]),
            committedAt: at,
          },
        });

        // The first committed target freezes the shared revision; later targets
        // of the same process bind to it rather than to a newer save.
        await tx.nurturePublishProcess.updateMany({
          where: { id: process.id, frozenRevisionId: null },
          data: { frozenRevisionId: revision.id, state: "released" },
        });

        return { status: "committed", publication_ref: release.id, receipt_ref: receipt.id };
      });
    } catch (error) {
      // A unique violation here means a concurrent attempt won the same target.
      // Anything else leaves this attempt genuinely unresolved: the caller must
      // reconcile rather than assume a rollback.
      return isUniqueViolation(error)
        ? { status: "rejected", reason_code: "already_released" }
        : { status: "outcome_unknown" };
    }
  }

  async loadPublicationSafetyFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublicationSafetyFactsV1 | null> {
    const at = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
    if (!reach) return null;
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: {
        releases: {
          include: { target: { select: { targetKey: true } }, revision: { select: { revision: true } } },
          orderBy: [{ committedAt: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!process) return null;

    return {
      authority: caregiverRowAuthority(reach, process.careGroupId) as CaregiverFactAuthorityV1,
      process_state: process.state,
      // Post-release safety has no expiry window: every committed publication
      // stays addressable, whatever its current visibility.
      publications: process.releases.map((release) => ({
        publication_id: release.id,
        target_key: release.target.targetKey,
        receipt_id: release.receiptId ?? "",
        release_revision: release.revision.revision,
        visibility: release.visibility,
      })),
    };
  }
}

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === "P2002";

/**
 * A schedule is only resolved when the owner recorded every field the T-007
 * contract fixes. A partially recorded schedule is not a window.
 */
const readResolvedSchedule = (process: {
  scheduledAt: Date | null;
  notAfter: Date | null;
  scheduleTimeZone: string | null;
  schedulePolicyRef: string | null;
  schedulePolicyHead: number | null;
  updatedAt: Date;
  aggregateVersion: number;
}): ResolvedPublishScheduleV1 | null => {
  if (
    !process.scheduledAt ||
    !process.notAfter ||
    !process.scheduleTimeZone ||
    !process.schedulePolicyRef ||
    process.schedulePolicyHead === null
  ) {
    return null;
  }
  return {
    scheduledAt: process.scheduledAt.toISOString(),
    notAfter: process.notAfter.toISOString(),
    timeZone: process.scheduleTimeZone,
    policyRef: process.schedulePolicyRef,
    policyHead: process.schedulePolicyHead,
    policyVersion: process.aggregateVersion,
    resolvedAt: process.updatedAt.toISOString(),
  };
};
