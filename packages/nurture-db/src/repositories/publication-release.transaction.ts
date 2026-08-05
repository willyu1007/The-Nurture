import { createHash } from "node:crypto";
import { currentAttributionRowsPerChild } from "./media-safety.read.js";
import { Prisma, type PrismaClient } from "@prisma/client";
import { deriveTargetPublishBlockingReasons } from "@the-nurture/scenario/harness";
import type {
  CaregiverFactAuthorityV1,
  CommitTargetReleaseResultV1,
  MediaEligibilityInputV1,
  PublicationReleasePort,
  PublicationSafetyFactsV1,
  PublicationSafetyReadPort,
  ReleaseFactsV1,
  ReleaseTargetFactsV1,
  ReleaseTriggerV1,
} from "@the-nurture/scenario/harness";
import {
  activeRoleWindow,
  caregiverRowAuthority,
  readMediaComposition,
  resolveCaregiverReachFor,
  resolveCaregiverReaches,
  type BoardPrisma,
} from "./board-read-support.js";
import { readResolvedPublishSchedule } from "./publish-schedule.support.js";
import { loadCurrentInstitutionPublicationPolicy } from "./institution-publication-policy.read.js";

const RELEASE_COMMAND_KEY = "release_publish_process";
const RELEASE_COMMAND_SCOPE = "board_publication";
const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;
const RELEASE_COMMAND_CONTRACT_VERSION = 1;
const MAX_SERIALIZABLE_ATTEMPTS = 3;

type CommitTargetReleaseInput = {
  workspace_id: string;
  participant_id: string;
  process_key: string;
  target_key: string;
  revision: number;
  command_request_id: string;
  trigger: ReleaseTriggerV1;
};

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
    // Every class this caregiver currently holds: a listing built from "the
    // first class" made the second class's sealed refs unresolvable.
    const reaches = await resolveCaregiverReaches(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (reaches.length === 0) return [];
    const processes = await this.prisma.nurturePublishProcess.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: { in: reaches.map((reach) => reach.care_group_id) },
      },
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
    // The row names its class; the authority question is about THAT class.
    const reach = await resolveCaregiverReachFor(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      process.careGroupId,
      at,
    );
    if (!reach) return null;

    const schedule = readResolvedPublishSchedule(process);
    const policy = await loadCurrentInstitutionPublicationPolicy(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: reach.institution_id,
      at,
    });

    const frozenRevision = process.frozenRevisionId
      ? await this.prisma.nurturePublishProcessRevision.findFirst({
          where: { id: process.frozenRevisionId, workspaceId: input.workspace_id },
          select: { revision: true, mediaCompositionPayload: true },
        })
      : null;

    // The authorizing role must still be current at release time; a release
    // signed by an assignment that has since lapsed is not a release.
    const authorizingRoleCurrent = process.authorizingRoleAssignmentId
      ? (await this.prisma.nurtureCareRoleAssignment.count({
          where: {
            id: process.authorizingRoleAssignmentId,
            workspaceId: input.workspace_id,
            role: { in: [...CAREGIVER_ROLES] },
            scopeType: "care_group",
            scopeId: process.careGroupId,
            ...activeRoleWindow(at),
            participant: { status: "active", deletedAt: null },
          },
        })) === 1
      : false;

    const media = await this.loadMediaEligibility(
      this.prisma,
      input.workspace_id,
      process.careGroupId,
      frozenRevision?.mediaCompositionPayload ??
        process.currentRevision?.mediaCompositionPayload ??
        null,
    );

    const receiptEvidenceAvailable = process.targets.every(
      (target) => !target.release || target.release.receipt !== null,
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
        ...(target.release?.receipt
          ? {
              already_committed: {
                publication_ref: target.release.id,
                receipt_ref: target.release.receipt.id,
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
      current_policy: policy
        ? {
            policy_ref: policy.policy_ref,
            policy_head: policy.policy_head,
            policy_version: policy.policy_version,
          }
        : null,
      receipt_evidence_available: receiptEvidenceAvailable,
      media,
      targets,
    };
  }

  private async loadMediaEligibility(
    prisma: BoardPrisma,
    workspaceId: string,
    careGroupId: string,
    compositionPayload: unknown,
  ): Promise<MediaEligibilityInputV1[]> {
    const composed = readMediaComposition(compositionPayload);
    if (composed.length === 0) return [];
    const assets = await prisma.nurtureMediaAssetRef.findMany({
      where: {
        workspaceId,
        careGroupId,
        id: { in: composed.map((entry) => entry.media_asset_id) },
        deletedAt: null,
      },
      include: { attributions: { where: { deletedAt: null } } },
    });
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    return composed.flatMap((entry) => {
      const asset = byId.get(entry.media_asset_id);
      if (!asset) {
        // A missing or foreign-class asset is still part of the saved
        // composition. Dropping it would turn "media unavailable" into "no
        // media" and silently make the target publishable.
        return [
          {
            media_asset_id: entry.media_asset_id,
            media_revision: entry.media_revision,
            current_media_revision: entry.media_revision,
            lifecycle: "unavailable",
            visible_children: [],
          },
        ];
      }
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

  async commitTargetRelease(
    input: CommitTargetReleaseInput,
  ): Promise<CommitTargetReleaseResultV1> {
    const commandHash = publicationReleaseCommandIdentity(input.command_request_id, input.target_key);

    for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
      try {
        return await this.commitTargetReleaseOnce(input, commandHash);
      } catch (error) {
        if (isRetryableTransactionConflict(error) && attempt < MAX_SERIALIZABLE_ATTEMPTS) {
          continue;
        }
        if (isUniqueViolation(error)) {
          // A concurrent same-target winner is reconciled from the committed
          // row. A different unique-key collision is still a definite rollback,
          // so reject it without pretending a target release already exists.
          const target = await this.prisma.nurturePublishProcessTarget.findFirst({
            where: {
              workspaceId: input.workspace_id,
              targetKey: input.target_key,
              publishProcess: {
                workspaceId: input.workspace_id,
                processKey: input.process_key,
              },
            },
            include: { release: true },
          });
          if (!target?.release) {
            return { status: "rejected", reason_code: "command_identity_conflict" };
          }
          if (target.release.commandRequestIdHash === commandHash) {
            return target.release.receiptId
              ? {
                  status: "committed",
                  publication_ref: target.release.id,
                  receipt_ref: target.release.receiptId,
                }
              : { status: "rejected", reason_code: "receipt_evidence_unavailable" };
          }
          return { status: "rejected", reason_code: "already_released" };
        }
        return { status: "outcome_unknown" };
      }
    }

    return { status: "outcome_unknown" };
  }

  private async commitTargetReleaseOnce(
    input: CommitTargetReleaseInput,
    commandHash: string,
  ): Promise<CommitTargetReleaseResultV1> {
    const at = new Date();
    return this.prisma.$transaction(
      async (tx) => {
        const process = await tx.nurturePublishProcess.findFirst({
          where: {
            workspaceId: input.workspace_id,
            processKey: input.process_key,
          },
          include: {
            editHold: true,
            targets: {
              where: { targetKey: input.target_key },
              include: { release: true, grant: true, enrollment: true },
            },
          },
        });
        if (!process) return { status: "rejected", reason_code: "target_unavailable" };
        // Authority against the process's own class, re-read inside the
        // transaction — never "whichever class comes first". The refusal is
        // target_unavailable, the same answer an unresolvable sealed ref
        // gives: an unauthorized caller learns nothing about existence.
        const reach = await resolveCaregiverReachFor(
          tx,
          input.workspace_id,
          input.participant_id,
          process.careGroupId,
          at,
        );
        if (!reach) return { status: "rejected", reason_code: "target_unavailable" };
        const target = process.targets[0];
        if (!target) return { status: "rejected", reason_code: "target_unavailable" };

        // An exact replay of the same command for the same target returns the
        // refs the original attempt committed, and writes nothing.
        if (target.release) {
          if (!target.release.receiptId) {
            return { status: "rejected", reason_code: "receipt_evidence_unavailable" };
          }
          return target.release.commandRequestIdHash === commandHash
            ? {
                status: "committed" as const,
                publication_ref: target.release.id,
                receipt_ref: target.release.receiptId,
              }
            : { status: "rejected" as const, reason_code: "already_released" };
        }

        const receiptlessReleaseCount = await tx.nurturePublicationRelease.count({
          where: {
            workspaceId: input.workspace_id,
            publishProcessId: process.id,
            receiptId: null,
          },
        });
        if (receiptlessReleaseCount > 0) {
          return { status: "rejected", reason_code: "receipt_evidence_unavailable" };
        }

        const revision = await tx.nurturePublishProcessRevision.findFirst({
          where: {
            workspaceId: input.workspace_id,
            publishProcessId: process.id,
            revision: input.revision,
          },
        });
        if (!revision) return { status: "rejected", reason_code: "revision_unavailable" };

        if (process.state !== "pending_release" && process.state !== "released") {
          return { status: "rejected", reason_code: "process_not_queued" };
        }
        if (
          (process.state === "pending_release" &&
            (process.frozenRevisionId !== null || process.currentRevisionId !== revision.id)) ||
          (process.state === "released" && process.frozenRevisionId !== revision.id)
        ) {
          return { status: "rejected", reason_code: "revision_conflict" };
        }

        const schedule = readResolvedPublishSchedule(process);
        if (!schedule) return { status: "rejected", reason_code: "schedule_unavailable" };
        if (input.trigger === "scheduler" && at.getTime() >= Date.parse(schedule.notAfter)) {
          return { status: "rejected", reason_code: "past_cutoff" };
        }
        if (input.trigger === "scheduler" && at.getTime() < Date.parse(schedule.scheduledAt)) {
          return { status: "rejected", reason_code: "before_scheduled_at" };
        }

        const policy = await loadCurrentInstitutionPublicationPolicy(tx, {
          workspace_id: input.workspace_id,
          institution_id: reach.institution_id,
          at,
        });
        if (!policy) {
          return { status: "rejected", reason_code: "publication_policy_unavailable" };
        }
        if (
          policy.policy_ref !== schedule.policyRef ||
          policy.policy_head !== schedule.policyHead ||
          policy.policy_version !== schedule.policyVersion
        ) {
          return { status: "rejected", reason_code: "publication_policy_drift" };
        }

        const authorizingRoleCurrent = process.authorizingRoleAssignmentId
          ? (await tx.nurtureCareRoleAssignment.count({
              where: {
                id: process.authorizingRoleAssignmentId,
                workspaceId: input.workspace_id,
                role: { in: [...CAREGIVER_ROLES] },
                scopeType: "care_group",
                scopeId: process.careGroupId,
                ...activeRoleWindow(at),
                participant: { status: "active", deletedAt: null },
              },
            })) === 1
          : false;
        if (!authorizingRoleCurrent) {
          return { status: "rejected", reason_code: "not_authorized" };
        }
        if (process.editHold && process.editHold.expiresAt > at) {
          return { status: "rejected", reason_code: "edit_hold_active" };
        }

        const media = await this.loadMediaEligibility(
          tx,
          input.workspace_id,
          process.careGroupId,
          revision.mediaCompositionPayload,
        );
        const blockingReasons = deriveTargetPublishBlockingReasons(
          {
            target_key: target.targetKey,
            child_care_process_id: target.childCareProcessId,
            enrollment_active:
              target.enrollment.status === "active" && target.enrollment.deletedAt === null,
            grant_allows: target.grant.status === "active" && target.grant.deletedAt === null,
            data_class_allowed: target.grant.dataClasses.includes(process.dataClass),
            purpose_allowed: target.grant.purposes.includes(process.purposeKey),
            exposure_allows_child_ids: [target.childCareProcessId],
          },
          media,
        );
        if (blockingReasons.includes("enrollment_inactive")) {
          return { status: "rejected", reason_code: "enrollment_inactive" };
        }
        if (
          blockingReasons.includes("grant_not_allowed") ||
          blockingReasons.includes("data_class_not_allowed") ||
          blockingReasons.includes("purpose_not_allowed")
        ) {
          return { status: "rejected", reason_code: "grant_not_allowed" };
        }
        const mediaBlock = blockingReasons.find(
          (reason) =>
            reason !== "enrollment_inactive" &&
            reason !== "grant_not_allowed" &&
            reason !== "data_class_not_allowed" &&
            reason !== "purpose_not_allowed",
        );
        if (mediaBlock) return { status: "rejected", reason_code: mediaBlock };

        if (process.state === "pending_release") {
          // Freeze before issuing any target effect. The CAS is part of this
          // transaction, so a loser cannot leave a release on a different
          // revision and a later write failure rolls the freeze back too.
          const frozen = await tx.nurturePublishProcess.updateMany({
            where: {
              id: process.id,
              workspaceId: input.workspace_id,
              state: "pending_release",
              currentRevisionId: revision.id,
              frozenRevisionId: null,
            },
            data: { frozenRevisionId: revision.id, state: "released" },
          });
          if (frozen.count !== 1) {
            return { status: "rejected", reason_code: "revision_conflict" };
          }
        }

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

        return { status: "committed", publication_ref: release.id, receipt_ref: receipt.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async loadPublicationSafetyFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublicationSafetyFactsV1 | null> {
    const at = new Date();
    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: {
        releases: {
          include: {
            target: { select: { targetKey: true } },
            revision: { select: { revision: true } },
            visibilityEvents: { orderBy: [{ occurredAt: "asc" }, { id: "asc" }] },
          },
          orderBy: [{ committedAt: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!process) return null;
    const reach = await resolveCaregiverReachFor(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      process.careGroupId,
      at,
    );
    if (!reach) return null;

    return {
      authority: caregiverRowAuthority(reach, process.careGroupId) as CaregiverFactAuthorityV1,
      process_state: process.state,
      // Post-release safety has no expiry window: every committed publication
      // stays addressable, whatever its current visibility.
      publications: process.releases.map((release) => ({
        publication_id: release.id,
        target_key: release.target.targetKey,
        // Omitted, never "": absence must stay unrepresentable by a value
        // that hashes into a valid-looking preserved receipt ref.
        ...(release.receiptId ? { receipt_id: release.receiptId } : {}),
        release_revision: release.revision.revision,
        visibility: release.visibility,
        // The stored lineage, oldest first: what an idempotent repeat answers
        // from instead of its own clock.
        events: release.visibilityEvents.map((event) => ({
          kind: event.kind,
          reason_key: event.reasonKey,
          occurred_at: event.occurredAt.toISOString(),
          source_release_revision: event.sourceReleaseRevision,
        })),
      })),
    };
  }
}

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === "P2002";

const isRetryableTransactionConflict = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === "P2034";
