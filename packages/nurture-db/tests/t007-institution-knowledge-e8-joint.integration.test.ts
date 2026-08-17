import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SelectedChatModel } from "@my-chat/domain/chat";
import type { ChatModelStreamEvent, LlmGateway } from "@my-chat/llm";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaIdentityRepository,
  PrismaKnowledgeRepository,
  PrismaNurtureInstitutionKnowledgeGenerationRepository,
  PrismaNurtureInstitutionKnowledgeSyncRepository,
} from "@my-chat/db";
import { createKnowledgeRagService } from "@my-chat/rag";
import {
  bindNurtureInstitutionKnowledgeDefaultOffE7,
  bindNurtureInstitutionKnowledgeRetrievalHost,
  createNurtureAuthorityCitationCurrentnessOwner,
  createNurtureInstitutionKnowledgeGenerationOwner,
  createNurtureInstitutionKnowledgeRetrievalOwner,
  createNurtureInstitutionKnowledgeSourceConsumer,
  NURTURE_INSTITUTION_KNOWLEDGE_DEFAULT_OFF_E7_PIN,
  NURTURE_INSTITUTION_KNOWLEDGE_RETRIEVAL_HOST_BINDING_PIN,
  NURTURE_INSTITUTION_KNOWLEDGE_SAFETY_TARGET_SERVICE_PIN,
} from "@my-chat/scenario-integrations";
import {
  dispatchTrustedScenarioInvocation,
  loadWorkflowRegistry,
  type WorkflowRegistry,
} from "@my-chat/workflow-runtime";
import type { WorkflowVerifiedScenarioInvocationV1 } from "@my-chat/workflow-contracts";
import {
  createNurtureScenarioModule,
  createInstitutionKnowledgeConflictCandidateRecorder,
  createInstitutionKnowledgeCommandSpecs,
  hashInstitutionKnowledgeAuthoritySnapshot,
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
  NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN,
  NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN,
  NurtureCommandRunner,
  NurtureInstitutionKnowledgeCurrentnessProvider,
  NurtureInstitutionKnowledgePreviewProvider,
  NurtureInstitutionKnowledgeSourceProvider,
  type InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1,
  type NurtureAuthorityKnowledgeSourceCurrentnessProviderV1,
} from "@the-nurture/scenario";
import {
  bindPrismaNurtureInstitutionKnowledgeFormalOwners,
  createAesGcmProtectedContentPort,
  createNurtureRepositories,
  createPrismaClient as createNurturePrismaClient,
  createPrismaNurtureInstitutionKnowledgeFormalOwners,
  institutionKnowledgeSourceObjectId,
  PrismaInstitutionKnowledgeReadOwner,
  PrismaNurtureCommandRepository,
} from "../src/index.js";
import { jointHostValidationSnapshot as devHostSnapshot } from "./host-validation-snapshot.js";

// T-007 G4-E E8 Joint Conformance: the Base-committed / My-Chat-adopted
// trusted dispatcher, the real Nurture formal owners over the Nurture
// disposable database, and the real My-Chat principal-bound retrieval /
// final-access owners over the My-Chat disposable database, composed exactly
// as the default-off production binding prescribes. Model transport is
// recorded (adapter-qualified evidence only, never live); every capability
// stays default-off and no route or traffic exists.
const NURTURE_DATABASE_URL = process.env.X5_NURTURE_DATABASE_URL;
const MY_CHAT_DATABASE_URL = process.env.X5_MY_CHAT_DATABASE_URL;
if (!NURTURE_DATABASE_URL || !MY_CHAT_DATABASE_URL) {
  throw new Error(
    "X5_NURTURE_DATABASE_URL and X5_MY_CHAT_DATABASE_URL are required for the E8 joint suite.",
  );
}

const nurture = createNurturePrismaClient(NURTURE_DATABASE_URL);
// My-Chat's client factory reads DATABASE_URL at construction (x5 lane swap
// pattern; see t009-family-growth-joint).
const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
const myChat = createMyChatPrismaClient();
if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = previousDatabaseUrl;

const SAFETY_PROFILE_ID = "nurture-institution-knowledge-safety-v1";
const GENERATION_PROFILE_ID = "nurture-institution-knowledge-answer-v1";
const safetySelectedModel: SelectedChatModel = {
  profileId: SAFETY_PROFILE_ID,
  providerId: "aliyun-bailian",
  generationProvider: "tongyi",
  modelId: NURTURE_INSTITUTION_KNOWLEDGE_SAFETY_TARGET_SERVICE_PIN.model_id,
};
const generationSelectedModel: SelectedChatModel = {
  profileId: GENERATION_PROFILE_ID,
  providerId: "aliyun-bailian",
  generationProvider: "tongyi",
  modelId: NURTURE_INSTITUTION_KNOWLEDGE_SAFETY_TARGET_SERVICE_PIN.model_id,
};

type RecordedTurn =
  | { kind: "safety"; body: unknown }
  | { kind: "generation"; body: unknown }
  | { kind: "unavailable" };

/**
 * Recorded transport double for the answer-safety service and the generation
 * owner. It executes the real adapters; only the wire is recorded. A side
 * effect registered for a turn runs before that turn streams, which lets a
 * case revoke a source between generation and final currentness validation.
 */
class RecordedJointGateway implements LlmGateway {
  turns: RecordedTurn[] = [];
  sideEffects = new Map<number, () => Promise<void>>();
  calls = 0;

  reset(turns: RecordedTurn[]): void {
    this.turns = turns;
    this.sideEffects = new Map();
    this.calls = 0;
  }

  selectInitialModel(profileId?: string): SelectedChatModel {
    if (profileId === SAFETY_PROFILE_ID) return safetySelectedModel;
    if (profileId === GENERATION_PROFILE_ID) return generationSelectedModel;
    throw new TypeError(`unexpected profile: ${String(profileId)}`);
  }

  streamChat(): AsyncIterable<ChatModelStreamEvent> {
    const index = this.calls;
    this.calls += 1;
    const turn = this.turns[index];
    const effect = this.sideEffects.get(index);
    if (!turn) throw new Error(`no recorded turn for call ${index}`);
    if (turn.kind === "unavailable") {
      return (async function* () {
        await Promise.resolve();
        throw new Error("recorded provider outage");
      })();
    }
    const selected =
      turn.kind === "safety" ? safetySelectedModel : generationSelectedModel;
    const body = JSON.stringify(turn.body);
    return (async function* () {
      if (effect) await effect();
      const middle = Math.ceil(body.length / 2);
      yield { type: "delta", text: body.slice(0, middle), selectedModel: selected };
      yield { type: "delta", text: body.slice(middle), selectedModel: selected };
      yield { type: "done", selectedModel: selected };
    })();
  }
}

type World = Awaited<ReturnType<typeof buildWorld>>;
let world: World;

beforeAll(async () => {
  world = await buildWorld();
}, 120_000);

afterAll(async () => {
  await nurture.$disconnect();
  await myChat.$disconnect();
});

const authorityLinkSeed = () => {
  const seed = {
    authority_source_ref: {
      schema_version: 1 as const,
      namespace: "my_chat",
      object_type: "knowledge_source",
      object_id: `authority:e8-${randomUUID()}`,
      version: 4,
    },
    source_version: "2026.08.10",
    publisher: "Public health authority",
    title: "Daily care guidance",
    source_date: "2026-08-01",
    deep_link: "https://example.test/daily-care-guidance",
    excerpt: "A bounded, non-diagnostic daily-care excerpt.",
    verified_at: "2026-08-10T12:00:00.000Z",
  };
  return { ...seed, snapshot_hash: hashInstitutionKnowledgeAuthoritySnapshot(seed) };
};

async function buildWorld() {
  const suffix = randomUUID().slice(0, 12);
  const workspaceId = `e8-workspace-${suffix}`;
  const accountId = `e8-user-${suffix}`;
  const actorId = `e8-actor-${suffix}`;
  const caregiverAccountId = `e8-caregiver-user-${suffix}`;
  const caregiverActorId = `e8-caregiver-actor-${suffix}`;

  // ---- Nurture canonical business facts -----------------------------------
  const participant = await nurture.nurtureParticipant.create({
    data: {
      id: `e8-participant-${suffix}`,
      workspaceId,
      myChatUserId: accountId,
      status: "active",
      aggregateVersion: 7,
    },
  });
  await nurture.nurtureParticipantPrincipalBinding.create({
    data: {
      participantId: participant.id,
      workspaceId,
      accountObjectId: accountId,
      actorObjectId: actorId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 9,
    },
  });
  const caregiver = await nurture.nurtureParticipant.create({
    data: {
      id: `e8-caregiver-${suffix}`,
      workspaceId,
      myChatUserId: caregiverAccountId,
      status: "active",
      aggregateVersion: 3,
    },
  });
  await nurture.nurtureParticipantPrincipalBinding.create({
    data: {
      participantId: caregiver.id,
      workspaceId,
      accountObjectId: caregiverAccountId,
      actorObjectId: caregiverActorId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 2,
    },
  });
  const institution = await nurture.nurtureCareInstitution.create({
    data: {
      id: `e8-institution-${suffix}`,
      workspaceId,
      displayName: "E8 joint institution",
      status: "active",
      aggregateVersion: 3,
    },
  });
  const emptyInstitution = await nurture.nurtureCareInstitution.create({
    data: {
      id: `e8-empty-institution-${suffix}`,
      workspaceId,
      displayName: "E8 joint institution without sources",
      status: "active",
      aggregateVersion: 3,
    },
  });
  const adminRole = await nurture.nurtureCareRoleAssignment.create({
    data: {
      id: `e8-admin-role-${suffix}`,
      workspaceId,
      participantId: participant.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
      aggregateVersion: 5,
    },
  });
  const emptyAdminRole = await nurture.nurtureCareRoleAssignment.create({
    data: {
      id: `e8-empty-admin-role-${suffix}`,
      workspaceId,
      participantId: participant.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: emptyInstitution.id,
      status: "active",
      aggregateVersion: 2,
    },
  });
  await nurture.nurtureCareRoleAssignment.create({
    data: {
      id: `e8-caregiver-role-${suffix}`,
      workspaceId,
      participantId: caregiver.id,
      role: "caregiver",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
      aggregateVersion: 2,
    },
  });

  // Published knowledge content through the real command runner and specs.
  const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(nurture));
  const protectedContent = createAesGcmProtectedContentPort({
    keyRef: "e8-joint",
    keyMaterial: "e8-joint-protected-content-key-material",
  });
  const specs = createInstitutionKnowledgeCommandSpecs({
    protected_content: protectedContent,
  });
  const authorityLink = authorityLinkSeed();
  const runCommand = async <Payload>(commandId: string, payload: Payload, spec: never) =>
    runner.execute({
      workspace_id: workspaceId,
      invocation_request_id: `invocation:${commandId}`,
      command_request_id: commandId,
      business_actor_ref: participant.id,
      payload,
      spec,
    });
  const created = await runCommand(`e8-knowledge-create-${suffix}`, {
    workspace_id: workspaceId,
    institution_ref: institution.id,
    role_assignment_ref: adminRole.id,
    category: "daily_care_safety",
    body: {
      title: "Outdoor play routine",
      summary: "General, non-diagnostic guidance for institution staff.",
      sections: [{
        sectionKey: "outdoor_play",
        heading: "Outdoor play",
        body: "Record the activity, responsible role, and completion evidence.",
      }],
    },
    intended_audiences: ["institution_admin", "caregiver"],
    age_band_keys: ["toddler"],
    scenario_keys: ["daily_transition"],
    safety_class: "care_safety",
    verified_authority_links: [authorityLink],
  }, specs.createInstitutionKnowledgeItem as never) as {
    status: string;
    committed_result?: { item_ref: string; revision_ref: string };
  };
  if (created.status !== "ok" || !created.committed_result) {
    throw new Error(`seed item creation failed: ${JSON.stringify(created)}`);
  }
  const itemRef = created.committed_result.item_ref;
  const revisionRef = created.committed_result.revision_ref;
  const reviewed = await runCommand(`e8-knowledge-review-${suffix}`, {
    workspace_id: workspaceId,
    institution_ref: institution.id,
    role_assignment_ref: adminRole.id,
    item_ref: itemRef,
    revision_ref: revisionRef,
    expected_item_head: 1,
    decision: "reviewed",
    reason_key: "admin_reviewed",
  }, specs.recordInstitutionKnowledgeReview as never) as { status: string };
  if (reviewed.status !== "ok") {
    throw new Error(`seed review failed: ${JSON.stringify(reviewed)}`);
  }
  const published = await runCommand(`e8-knowledge-publish-${suffix}`, {
    workspace_id: workspaceId,
    institution_ref: institution.id,
    role_assignment_ref: adminRole.id,
    item_ref: itemRef,
    revision_ref: revisionRef,
    expected_item_head: 2,
  }, specs.publishInstitutionKnowledgeRevision as never) as { status: string };
  if (published.status !== "ok") {
    throw new Error(`seed publish failed: ${JSON.stringify(published)}`);
  }
  const publishedRevision = await nurture.nurtureInstitutionKnowledgeRevision
    .findUniqueOrThrow({ where: { id: revisionRef } });
  const publicationEvent = await nurture.nurtureInstitutionKnowledgeRevisionEvent
    .findFirstOrThrow({
      where: { revisionId: revisionRef, eventType: "published" },
    });
  const sourceObjectId = institutionKnowledgeSourceObjectId({
    workspace_id: workspaceId,
    institution_ref: institution.id,
    item_row_id: itemRef,
  });
  const publicationEventRef = {
    schema_version: 1,
    namespace: "nurture",
    object_type: "institution_knowledge_revision_event",
    object_id: institutionKnowledgeSourceObjectId({
      workspace_id: workspaceId,
      institution_ref: institution.id,
      item_row_id: publicationEvent.id,
    }),
  };

  // ---- My-Chat canonical identity and knowledge rows ----------------------
  await myChat.workspace.create({
    data: { id: workspaceId, type: "organization", name: "E8 joint workspace" },
  });
  await myChat.user.create({ data: { id: accountId, displayName: "E8 admin" } });
  await myChat.user.create({
    data: { id: caregiverAccountId, displayName: "E8 caregiver" },
  });
  await myChat.membership.create({
    data: { workspaceId, userId: accountId, role: "member", status: "active" },
  });
  await myChat.membership.create({
    data: {
      workspaceId,
      userId: caregiverAccountId,
      role: "member",
      status: "active",
    },
  });
  await myChat.actor.create({
    data: {
      id: actorId,
      actorType: "human_user",
      status: "active",
      ownerUserId: accountId,
      defaultHumanUserId: accountId,
      workspaceId,
      displayName: "E8 admin actor",
    },
  });
  await myChat.actor.create({
    data: {
      id: caregiverActorId,
      actorType: "human_user",
      status: "active",
      ownerUserId: caregiverAccountId,
      defaultHumanUserId: caregiverAccountId,
      workspaceId,
      displayName: "E8 caregiver actor",
    },
  });
  await myChat.actor.upsert({
    where: { id: "e8-service-actor" },
    update: {},
    create: {
      id: "e8-service-actor",
      actorType: "system_agent",
      status: "active",
      displayName: "E8 generation service agent",
    },
  });
  await myChat.retrievalPolicy.create({
    data: {
      workspaceId,
      purpose: "institution_admin_online_answer",
      sourceType: "nurture_institution",
      trustLabel: "institution_authored",
      allowed: true,
    },
  });
  await myChat.retrievalPolicy.create({
    data: {
      workspaceId,
      purpose: "institution_admin_online_answer",
      sourceType: "authority",
      trustLabel: "authority_source",
      allowed: true,
    },
  });
  const excerpt =
    "How should staff record the outdoor play routine? " +
    "Record the activity, responsible role, and completion evidence.";
  await myChat.knowledgeSource.create({
    data: {
      workspaceId,
      sourceType: "nurture_institution",
      trustLabel: "institution_authored",
      sourceOrigin: "human",
      humanReviewStatus: "reviewed",
      sourceSafetyStatus: "passed",
      sourcePrivacyStatus: "no_pii",
      pbrStatus: "allowed",
      reviewState: "promoted",
      indexStatus: "indexed",
      sourceSurface: "system",
      sourceKind: "nurture_institution_revision",
      sourceVersion: publishedRevision.revisionNumber,
      ownerNamespace: "nurture",
      ownerScopeRef: institution.id,
      ownerSourceRef: JSON.stringify({
        schema_version: 1,
        namespace: "nurture",
        object_type: "institution_knowledge_source",
        object_id: sourceObjectId,
      }),
      ownerSourceVersion:
        `r${publishedRevision.revisionNumber}:${publishedRevision.contentHash}`,
      sourceContentHash: publishedRevision.contentHash,
      titleSnapshot: "Outdoor play routine",
      allowedPurposes: ["institution_admin_online_answer"],
      provenanceRefs: {
        item_ref: itemRef,
        revision_ref: revisionRef,
        revision_number: publishedRevision.revisionNumber,
        publication_event_ref: publicationEventRef,
        published_at: publicationEvent.occurredAt.toISOString(),
        authority_sources: [{
          authority_source_ref: authorityLink.authority_source_ref,
          source_version: authorityLink.source_version,
        }],
      },
      chunks: {
        create: {
          workspaceId,
          chunkIndex: 0,
          charEnd: excerpt.length,
          excerpt,
          status: "active",
          indexStatus: "indexed",
          allowedPurposes: ["institution_admin_online_answer"],
        },
      },
    },
  });

  await myChat.knowledgeSource.create({
    data: {
      workspaceId,
      sourceType: "authority",
      trustLabel: "authority_source",
      sourceOrigin: "human",
      humanReviewStatus: "reviewed",
      sourceSafetyStatus: "passed",
      sourcePrivacyStatus: "no_pii",
      pbrStatus: "allowed",
      reviewState: "promoted",
      indexStatus: "indexed",
      sourceSurface: "system",
      sourceKind: "authority_source",
      sourceVersion: 4,
      ownerNamespace: "my_chat",
      ownerScopeRef: institution.id,
      ownerSourceRef: JSON.stringify(authorityLink.authority_source_ref),
      ownerSourceVersion: authorityLink.source_version,
      sourceContentHash: "b".repeat(64),
      titleSnapshot: authorityLink.title,
      allowedPurposes: ["institution_admin_online_answer"],
      provenanceRefs: {
        publisher: authorityLink.publisher,
        source_date: authorityLink.source_date,
      },
    },
  });


  // ---- reusable publish helper for the remaining matrix items -------------
  const publishItemWithSource = async (opts: {
    slug: string;
    title: string;
    bodyText: string;
    excerpt: string;
    safetyClass: "care_safety" | "basic_health_first_aid";
    link?: ReturnType<typeof authorityLinkSeed>;
    authorityExcerpt?: string;
  }) => {
    const createdItem = await runCommand(`e8-${opts.slug}-create-${suffix}`, {
      workspace_id: workspaceId,
      institution_ref: institution.id,
      role_assignment_ref: adminRole.id,
      category: "daily_care_safety",
      body: {
        title: opts.title,
        summary: "General, non-diagnostic guidance for institution staff.",
        sections: [{ sectionKey: "main", heading: opts.title, body: opts.bodyText }],
      },
      intended_audiences: ["institution_admin", "caregiver"],
      safety_class: opts.safetyClass,
      verified_authority_links: opts.link ? [opts.link] : [],
    }, specs.createInstitutionKnowledgeItem as never) as {
      status: string;
      committed_result?: { item_ref: string; revision_ref: string };
    };
    if (createdItem.status !== "ok" || !createdItem.committed_result) {
      throw new Error(`seed ${opts.slug} create failed: ${JSON.stringify(createdItem)}`);
    }
    const iRef = createdItem.committed_result.item_ref;
    const rRef = createdItem.committed_result.revision_ref;
    const reviewedStep = await runCommand(`e8-${opts.slug}-review-${suffix}`, {
      workspace_id: workspaceId,
      institution_ref: institution.id,
      role_assignment_ref: adminRole.id,
      item_ref: iRef,
      revision_ref: rRef,
      expected_item_head: 1,
      decision: "reviewed",
      reason_key: "admin_reviewed",
    }, specs.recordInstitutionKnowledgeReview as never) as { status: string };
    if (reviewedStep.status !== "ok") {
      throw new Error(`seed ${opts.slug} review failed: ${JSON.stringify(reviewedStep)}`);
    }
    const publishedStep = await runCommand(`e8-${opts.slug}-publish-${suffix}`, {
      workspace_id: workspaceId,
      institution_ref: institution.id,
      role_assignment_ref: adminRole.id,
      item_ref: iRef,
      revision_ref: rRef,
      expected_item_head: 2,
    }, specs.publishInstitutionKnowledgeRevision as never) as { status: string };
    if (publishedStep.status !== "ok") {
      throw new Error(`seed ${opts.slug} publish failed: ${JSON.stringify(publishedStep)}`);
    }
    const revision = await nurture.nurtureInstitutionKnowledgeRevision
      .findUniqueOrThrow({ where: { id: rRef } });
    const event = await nurture.nurtureInstitutionKnowledgeRevisionEvent
      .findFirstOrThrow({ where: { revisionId: rRef, eventType: "published" } });
    const objectId = institutionKnowledgeSourceObjectId({
      workspace_id: workspaceId,
      institution_ref: institution.id,
      item_row_id: iRef,
    });
    await myChat.knowledgeSource.create({
      data: {
        workspaceId,
        sourceType: "nurture_institution",
        trustLabel: "institution_authored",
        sourceOrigin: "human",
        humanReviewStatus: "reviewed",
        sourceSafetyStatus: "passed",
        sourcePrivacyStatus: "no_pii",
        pbrStatus: "allowed",
        reviewState: "promoted",
        indexStatus: "indexed",
        sourceSurface: "system",
        sourceKind: "nurture_institution_revision",
        sourceVersion: revision.revisionNumber,
        ownerNamespace: "nurture",
        ownerScopeRef: institution.id,
        ownerSourceRef: JSON.stringify({
          schema_version: 1,
          namespace: "nurture",
          object_type: "institution_knowledge_source",
          object_id: objectId,
        }),
        ownerSourceVersion: `r${revision.revisionNumber}:${revision.contentHash}`,
        sourceContentHash: revision.contentHash,
        titleSnapshot: opts.title,
        allowedPurposes: ["institution_admin_online_answer"],
        provenanceRefs: {
          item_ref: iRef,
          revision_ref: rRef,
          revision_number: revision.revisionNumber,
          publication_event_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "institution_knowledge_revision_event",
            object_id: institutionKnowledgeSourceObjectId({
              workspace_id: workspaceId,
              institution_ref: institution.id,
              item_row_id: event.id,
            }),
          },
          published_at: event.occurredAt.toISOString(),
          ...(opts.link
            ? {
                authority_sources: [{
                  authority_source_ref: opts.link.authority_source_ref,
                  source_version: opts.link.source_version,
                }],
              }
            : { authority_sources: [] }),
        },
        chunks: {
          create: {
            workspaceId,
            chunkIndex: 0,
            charEnd: opts.excerpt.length,
            excerpt: opts.excerpt,
            status: "active",
            indexStatus: "indexed",
            allowedPurposes: ["institution_admin_online_answer"],
          },
        },
      },
    });
    if (opts.link) {
      await myChat.knowledgeSource.create({
        data: {
          workspaceId,
          sourceType: "authority",
          trustLabel: "authority_source",
          sourceOrigin: "human",
          humanReviewStatus: "reviewed",
          sourceSafetyStatus: "passed",
          sourcePrivacyStatus: "no_pii",
          pbrStatus: "allowed",
          reviewState: "promoted",
          indexStatus: "indexed",
          sourceSurface: "system",
          sourceKind: "authority_source",
          sourceVersion: 4,
          ownerNamespace: "my_chat",
          ownerScopeRef: institution.id,
          ownerSourceRef: JSON.stringify(opts.link.authority_source_ref),
          ownerSourceVersion: opts.link.source_version,
          sourceContentHash: "c".repeat(64),
          titleSnapshot: opts.link.title,
          allowedPurposes: ["institution_admin_online_answer"],
          provenanceRefs: {
            publisher: opts.link.publisher,
            source_date: opts.link.source_date,
          },
          ...(opts.authorityExcerpt
            ? {
                chunks: {
                  create: {
                    workspaceId,
                    chunkIndex: 0,
                    charEnd: opts.authorityExcerpt.length,
                    excerpt: opts.authorityExcerpt,
                    status: "active",
                    indexStatus: "indexed",
                    allowedPurposes: ["institution_admin_online_answer"],
                  },
                },
              }
            : {}),
        },
      });
    }
    return { itemRef: iRef, revisionRef: rRef, revision, sourceObjectId: objectId };
  };

  const medicalItem = await publishItemWithSource({
    slug: "medical",
    title: "Child fever first aid",
    bodyText: "Cool the child and monitor the fever according to authority guidance.",
    excerpt:
      "What is the fever first aid guidance for a child? " +
      "Cool the child and monitor the fever according to authority guidance.",
    safetyClass: "basic_health_first_aid",
    link: authorityLinkSeed(),
    authorityExcerpt:
      "What is the fever first aid guidance for a child? " +
      "Authority guidance on child fever first aid steps.",
  });
  const conflictItemA = await publishItemWithSource({
    slug: "conflict-a",
    title: "Nosebleed handling A",
    bodyText: "Lean the head forward during a nosebleed.",
    excerpt:
      "How should a nosebleed be handled? " +
      "Lean the head forward during a nosebleed.",
    safetyClass: "basic_health_first_aid",
    link: authorityLinkSeed(),
  });
  const conflictItemB = await publishItemWithSource({
    slug: "conflict-b",
    title: "Nosebleed handling B",
    bodyText: "Lean the head backward during a nosebleed.",
    excerpt:
      "How should a nosebleed be handled? " +
      "Lean the head backward during a nosebleed.",
    safetyClass: "basic_health_first_aid",
    link: authorityLinkSeed(),
  });
  const currentnessItem = await publishItemWithSource({
    slug: "currentness",
    title: "Sunscreen application",
    bodyText: "Apply sunscreen before outdoor time.",
    excerpt:
      "When should sunscreen be applied? " +
      "Apply sunscreen before outdoor time.",
    safetyClass: "care_safety",
  });
  const driftInstitution = await nurture.nurtureCareInstitution.create({
    data: {
      id: `e8-drift-institution-${suffix}`,
      workspaceId,
      displayName: "E8 drift institution",
      status: "active",
      aggregateVersion: 2,
    },
  });
  const driftRole = await nurture.nurtureCareRoleAssignment.create({
    data: {
      id: `e8-drift-role-${suffix}`,
      workspaceId,
      participantId: participant.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: driftInstitution.id,
      status: "active",
      aggregateVersion: 2,
    },
  });
  const revokeItem = async (
    target: { itemRef: string; revisionRef: string },
    slug: string,
  ) => {
    const revoked = await runCommand(`e8-${slug}-revoke-${suffix}`, {
      workspace_id: workspaceId,
      institution_ref: institution.id,
      role_assignment_ref: adminRole.id,
      item_ref: target.itemRef,
      revision_ref: target.revisionRef,
      expected_item_head: 3,
      reason_key: "source_withdrawn",
    }, specs.revokeInstitutionKnowledgeRevision as never) as { status: string };
    if (revoked.status !== "ok") {
      throw new Error(`revoke ${slug} failed: ${JSON.stringify(revoked)}`);
    }
  };

  // ---- My-Chat owner composition (the real default-off E7 binding) --------
  const knowledgeRepository = new PrismaKnowledgeRepository(myChat);
  const identityRepository = new PrismaIdentityRepository(myChat);
  const gateway = new RecordedJointGateway();
  const retrievalOwner = createNurtureInstitutionKnowledgeRetrievalOwner({
    rag: createKnowledgeRagService(knowledgeRepository),
  });
  const authorityCurrentnessOwner = createNurtureAuthorityCitationCurrentnessOwner({
    repository: knowledgeRepository,
  });
  const reads = new PrismaInstitutionKnowledgeReadOwner(nurture);
  const adminAuthority = {
    authorize: async (context: { workspace_id: string; institution_ref: string }) => {
      const role = await nurture.nurtureCareRoleAssignment.findFirst({
        where: {
          workspaceId: context.workspace_id,
          scopeType: "institution",
          scopeId: context.institution_ref,
          role: "institution_admin",
          status: "active",
          deletedAt: null,
        },
      });
      return role ? ("authorized" as const) : ("denied" as const);
    },
  };
  // Nurture-side authority source currentness: validated against the real
  // My-Chat canonical authority rows through the adopted currentness owner.
  const authoritySourcesOwner = {
    validateExactSources: async (input: {
      sources: Array<{
        authority_source_ref: Record<string, unknown> & { object_id: string };
        source_version: string;
      }>;
      evaluated_at: string;
    }) => {
      const encodeRef = (ref: Record<string, unknown>) => JSON.stringify({
        schema_version: ref.schema_version,
        namespace: ref.namespace,
        object_type: ref.object_type,
        object_id: ref.object_id,
        ...(ref.version === undefined ? {} : { version: ref.version }),
      });
      try {
        const refs = input.sources.map((source) =>
          encodeRef(source.authority_source_ref));
        const rows = await knowledgeRepository.validateOwnerSources({
          workspaceId,
          purpose: "institution_admin_online_answer",
          ownerNamespace: "my_chat",
          ownerScopeRef: institution.id,
          ownerSourceRefs: refs,
        });
        const currentBySourceRef = new Map(
          rows.map((row) => [row.ownerSourceRef, row.ownerSourceVersion]),
        );
        return {
          status: "resolved" as const,
          decisions: input.sources.map((source, index) => ({
            authority_source_ref: source.authority_source_ref,
            source_version: source.source_version,
            decision: currentBySourceRef.get(refs[index]!) === source.source_version
              ? ("eligible" as const)
              : ("denied" as const),
          })),
        };
      } catch {
        return { status: "unavailable" as const };
      }
    },
  };
  const sourceProvider = new NurtureInstitutionKnowledgeSourceProvider(
    reads,
    {
      authorize: async (input: { workspace_id: string; institution_ref: string }) => {
        const active = await nurture.nurtureCareInstitution.findFirst({
          where: {
            id: input.institution_ref,
            workspaceId: input.workspace_id,
            status: "active",
            deletedAt: null,
          },
        });
        return active ? ("authorized" as const) : ("denied" as const);
      },
    } as never,
    authoritySourcesOwner as never,
    protectedContent,
  );
  const sourceConsumer = createNurtureInstitutionKnowledgeSourceConsumer({
    provider: sourceProvider as never,
    repository: new PrismaNurtureInstitutionKnowledgeSyncRepository(myChat),
  });
  const generationOwner = createNurtureInstitutionKnowledgeGenerationOwner({
    gateway,
    repository: new PrismaNurtureInstitutionKnowledgeGenerationRepository(myChat),
    actorId: "e8-service-actor",
  });
  const e7 = bindNurtureInstitutionKnowledgeDefaultOffE7({
    adoptedPin: NURTURE_INSTITUTION_KNOWLEDGE_DEFAULT_OFF_E7_PIN,
    retrievalOwner,
    authorityCurrentnessOwner,
    sourceConsumer,
    generationOwner,
    generationSafety:
      new PrismaNurtureInstitutionKnowledgeGenerationRepository(myChat) as never,
    gateway,
    actorId: "e8-service-actor",
  });
  if (e7.status !== "bound_default_off") {
    throw new Error(`E7 composition did not bind: ${JSON.stringify(e7)}`);
  }
  const host = bindNurtureInstitutionKnowledgeRetrievalHost({
    adoptedPin: NURTURE_INSTITUTION_KNOWLEDGE_RETRIEVAL_HOST_BINDING_PIN,
    identityRepository,
    e7Composition: e7.composition,
  });
  if (host.status !== "bound_default_off") {
    throw new Error(`retrieval host binding failed: ${JSON.stringify(host)}`);
  }

  // ---- Nurture formal owners + module + registry --------------------------
  const formalOwners = createPrismaNurtureInstitutionKnowledgeFormalOwners({
    prisma: nurture,
    targetOptionIntegrityKey: "e8-target-option-integrity-key-000001",
    preparedCommandIntegrityKey: "e8-prepared-integrity-key-0000000001",
    preparedCommandEncryptionSecret: "e8-prepared-encryption-key-000000001",
  });
  // DR-E8-02 closed: the production E7 composition owns the {context, sources}
  // port. Both currentness slots consume it below; the typed assignments are
  // the compile-time proof that no cast bridges the port shape anymore.
  const authorityCurrentnessPort: NurtureAuthorityKnowledgeSourceCurrentnessProviderV1 =
    e7.composition.authority_currentness_port;
  const finalAuthorityCurrentnessPort: InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1 =
    e7.composition.authority_currentness_port;
  const bindings = {
    resolve: async (input: {
      request: { capabilityKey: string; targetOptionRef: string } & Record<string, unknown>;
      trusted: { workspace_id: string; actor_participant_ref: string };
    }) => {
      const selection = formalOwners.institutionKnowledgeOptionIssuer.resolve({
        workspace_id: input.trusted.workspace_id,
        participant_ref: input.trusted.actor_participant_ref,
        target_option_ref: input.request.targetOptionRef,
      });
      if (!selection || selection.target_kind !== "institution") {
        return {
          status: "denied" as const,
          reason_code: "institution_target_option_invalid",
        };
      }
      const role = await nurture.nurtureCareRoleAssignment.findFirst({
        where: {
          id: selection.role_assignment_ref,
          workspaceId: input.trusted.workspace_id,
          participantId: input.trusted.actor_participant_ref,
          role: "institution_admin",
          scopeType: "institution",
          scopeId: selection.target_ref,
          status: "active",
          deletedAt: null,
        },
      });
      if (!role) {
        return {
          status: "denied" as const,
          reason_code: "institution_admin_role_not_current",
        };
      }
      return {
        status: "resolved" as const,
        binding: {
          capability_key: input.request.capabilityKey,
          target_option_ref: input.request.targetOptionRef,
          ...(typeof input.request.confirmationRef === "string"
            ? { confirmation_ref: input.request.confirmationRef }
            : {}),
          workspace_id: input.trusted.workspace_id,
          actor_participant_ref: input.trusted.actor_participant_ref,
          surface_key: "institution_workbench" as const,
          active_role: "institution_admin" as const,
          institution_ref: selection.target_ref,
          role_assignment_ref: selection.role_assignment_ref,
          evaluated_at: new Date().toISOString(),
          authority_links: [],
        },
      };
    },
  };
  const surfaceDeps = {
    bindings: bindings as never,
    commands: {
      execute: async () => ({
        status: "not_committed" as const,
        decision: "blocked" as const,
        reason_code: "e8_command_lane_out_of_scope",
      }),
    },
    preview: new NurtureInstitutionKnowledgePreviewProvider(
      reads,
      adminAuthority as never,
      authoritySourcesOwner as never,
      protectedContent,
    ),
    protectedContent,
    adminAuthority: adminAuthority as never,
    retrievalOwner: {
      retrieveCandidates: async () => ({ status: "unavailable" as const }),
    },
    nurtureCurrentness: new NurtureInstitutionKnowledgeCurrentnessProvider(
      reads,
      adminAuthority as never,
      authoritySourcesOwner as never,
    ),
    authorityCurrentness: authorityCurrentnessPort,
    finalAuthorityCurrentness: finalAuthorityCurrentnessPort,
    safetyOwner: e7.composition.answer_safety_owner,
    generationOwner: e7.composition.generation_owner,
    conflictCandidates: createInstitutionKnowledgeConflictCandidateRecorder({
      command_runner: runner,
      protected_content: protectedContent,
    }),
    optionIssuer: formalOwners.institutionKnowledgeOptionIssuer,
    answerPolicy: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
  };
  const moduleBinding = bindPrismaNurtureInstitutionKnowledgeFormalOwners({
    formalOwners,
    ownerIntegration: {
      q2_owner_pin: NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN,
      q3_adapter_qualification_pin:
        NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN,
      surface_deps: surfaceDeps as never,
    },
    authorizedRetrievalOwnerFactory:
      host.binding.nurture_module_dependencies.authorizedRetrievalOwnerFactory,
  });

  const module = createNurtureScenarioModule({
    handlerDeps: {
      repositories: createNurtureRepositories(nurture),
      canonicalResolver: {
        resolve: async () => ({ status: "unavailable" as const }),
      },
      runContext: { load: async () => null },
      scenarioCommandBridge: {
        createDriverContext: () => {
          throw new Error("e8 does not drive workflow commands");
        },
        createHandoffDrafts: () => [],
      },
    } as never,
    presenterDeps: { artifacts: { preview: async () => null } } as never,
    workerRuntime: { claim: async () => null } as never,
    institutionKnowledgeFormalOwnerBinding:
      moduleBinding.institutionKnowledgeFormalOwnerBinding,
  });
  const registry: WorkflowRegistry = loadWorkflowRegistry({
    modules: [module],
    host_snapshot: devHostSnapshot,
  });
  const scenario = registry.scenarios.get("nurture");
  if (!scenario) throw new Error("nurture scenario failed to register");
  const contractHash = scenario.contract_hash;

  const issueTarget = (
    roleId = adminRole.id,
    institutionId = institution.id,
    version = 3,
  ) => {
    const issued = formalOwners.institutionKnowledgeOptionIssuer.issueInstitution({
      workspace_id: workspaceId,
      participant_ref: participant.id,
      institution_ref: institutionId,
      role_assignment_ref: roleId,
      version,
    });
    if (!issued) throw new Error("target option issuance failed");
    return issued;
  };

  return {
    suffix,
    workspaceId,
    accountId,
    actorId,
    caregiverAccountId,
    caregiverActorId,
    participant,
    caregiver,
    institution,
    emptyInstitution,
    adminRole,
    emptyAdminRole,
    itemRef,
    revisionRef,
    publishedRevision,
    sourceObjectId,
    runner,
    specs,
    protectedContent,
    gateway,
    registry,
    contractHash,
    issueTarget,
    medicalItem,
    conflictItemA,
    conflictItemB,
    currentnessItem,
    driftInstitution,
    driftRole,
    revokeItem,
  };
}

// ---- verified trusted invocation builder ----------------------------------

function verified(
  lane: "query" | "prepare" | "execute",
  input: unknown,
  overrides: {
    requestId?: string;
    accountId?: string;
    actorId?: string;
    workspaceId?: string;
  } = {},
): WorkflowVerifiedScenarioInvocationV1 {
  const bindings = {
    query: ["nurture.institution_knowledge.query", "query_institution_knowledge"],
    prepare: [
      "nurture.institution_knowledge.command.prepare",
      "prepare_institution_knowledge_command",
    ],
    execute: [
      "nurture.institution_knowledge.command.execute",
      "execute_prepared_institution_knowledge_command",
    ],
  } as const;
  const [endpointKey, operationKey] = bindings[lane];
  const requestId = overrides.requestId ?? `e8-invocation-${randomUUID()}`;
  const issuedAt = new Date();
  return {
    declaration: {
      scenario_key: "nurture",
      endpoint_key: endpointKey,
      method: "POST",
      operation_key: operationKey,
      input_schema_version: 1,
      ingress_category: "host_transition",
      ingress_key: endpointKey,
      principal_origins: ["interactive_session"],
    },
    invocation: {
      invocation_version: 1,
      contract_version: 1,
      contract_hash: world.contractHash,
      issuer: "my_chat",
      assertion_audience: "nurture",
      caller_binding: { caller_subject: "my-chat-host" },
      principal: {
        principal_version: 1,
        principal_kind: "human_user",
        principal_origin: "interactive_session",
        account_ref: ref("user", overrides.accountId ?? world.accountId),
        actor_ref: ref("actor", overrides.actorId ?? world.actorId),
        workspace_ref: ref("workspace", overrides.workspaceId ?? world.workspaceId),
      },
      route: {
        scenario_key: "nurture",
        endpoint_key: endpointKey,
        method: "POST",
        ingress: {
          ingress_version: 1,
          ingress_category: "host_transition",
          ingress_key: endpointKey,
        },
      },
      request: {
        request_id: requestId,
        correlation_id: `e8-correlation-${randomUUID()}`,
        issued_at: issuedAt.toISOString(),
        expires_at: new Date(issuedAt.getTime() + 60_000).toISOString(),
        nonce: `e8-nonce-${randomUUID()}`,
      },
      operation: { operation_key: operationKey, input_schema_version: 1, input },
    },
  };
}

function ref(objectType: string, objectId: string) {
  return {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: objectType,
    object_id: objectId,
  };
}

async function prepareAnswer(input: {
  question: string;
  targetOptionRef: string;
  clientCommandId: string;
  accountId?: string;
  actorId?: string;
  operationExtras?: Record<string, unknown>;
}) {
  return (await dispatchTrustedScenarioInvocation(
    world.registry,
    verified("prepare", {
      contractVersion: 1,
      clientCommandId: input.clientCommandId,
      request: {
        capabilityKey: "answer_institution_knowledge",
        capabilityVersion: "1.0.0",
        targetOptionRef: input.targetOptionRef,
        operationInput: { question: input.question, ...input.operationExtras },
      },
    }, { accountId: input.accountId, actorId: input.actorId }),
  )) as { status: string; command_request_id?: string; confirmation_ref?: string };
}

async function executePrepared(
  prepared: { command_request_id?: string; confirmation_ref?: string },
  overrides: { accountId?: string; actorId?: string } = {},
): Promise<unknown> {
  return dispatchTrustedScenarioInvocation(
    world.registry,
    verified("execute", {
      contractVersion: 1,
      commandRequestId: prepared.command_request_id,
      confirmationRef: prepared.confirmation_ref,
    }, overrides),
  );
}

async function prepareAndExecuteAnswer(input: {
  question: string;
  targetOptionRef: string;
  clientCommandId: string;
  operationExtras?: Record<string, unknown>;
}): Promise<unknown> {
  const prepared = await prepareAnswer(input);
  if (prepared.status !== "ready_to_confirm") return prepared;
  return executePrepared(prepared);
}

const generalClearTurns = (): RecordedTurn[] => [
  { kind: "safety", body: { status: "general_clear" } },
  {
    kind: "generation",
    body: {
      claims: [{
        text: "Record the outdoor activity, the responsible role, and the completion evidence.",
        claim_kind: "institution_process",
        candidate_refs: ["knowledge-1"],
      }],
    },
  },
  { kind: "safety", body: { status: "safe" } },
];

// ---- the joint matrix ------------------------------------------------------

describe("T-007 G4-E E8 joint conformance", () => {
  it("answers with revalidated citations through the full joint chain (cited-positive)", async () => {
    world.gateway.reset(generalClearTurns());
    const result = await prepareAndExecuteAnswer({
      question: "How should staff record the outdoor play routine?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-positive-${world.suffix}`,
      operationExtras: {
        ageBandKeys: ["toddler"],
        scenarioKeys: ["daily_transition"],
      },
    });
    expect(result).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "answered" }),
    });
    const answered = (result as { result: { claims: unknown[]; citations: unknown[] } }).result;
    expect(answered.claims.length).toBeGreaterThanOrEqual(1);
    expect(answered.citations.length).toBeGreaterThanOrEqual(1);
  });

  it("denies a caregiver principal through the real dispatcher (privacy negative)", async () => {
    world.gateway.reset([]);
    const result = await dispatchTrustedScenarioInvocation(
      world.registry,
      verified("prepare", {
        contractVersion: 1,
        clientCommandId: `e8-caregiver-${world.suffix}`,
        request: {
          capabilityKey: "answer_institution_knowledge",
          capabilityVersion: "1.0.0",
          targetOptionRef: world.issueTarget(),
          operationInput: { question: "What is the outdoor play routine?" },
        },
      }, {
        accountId: world.caregiverAccountId,
        actorId: world.caregiverActorId,
      }),
    );
    expect(result).toMatchObject({ status: "denied" });
    expect(world.gateway.calls).toBe(0);
  });

  it("abstains with no source when retrieval finds no eligible candidate", async () => {
    world.gateway.reset([{ kind: "safety", body: { status: "general_clear" } }]);
    const result = await prepareAndExecuteAnswer({
      question: "What is the policy nobody wrote down?",
      targetOptionRef: world.issueTarget(world.emptyAdminRole.id, world.emptyInstitution.id),
      clientCommandId: `e8-no-source-${world.suffix}`,
    });
    expect(result).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "abstained_no_source" }),
    });
  });

  it("answers a medical question only with authority-backed citations (cited-positive medical)", async () => {
    world.gateway.reset([
      { kind: "safety", body: { status: "medical_clear" } },
      {
        kind: "generation",
        body: {
          claims: [{
            text: "Cool the child and monitor the fever according to the cited authority guidance.",
            claim_kind: "first_aid_action",
            candidate_refs: ["knowledge-1", "knowledge-2"],
          }],
        },
      },
      { kind: "safety", body: { status: "safe" } },
    ]);
    const result = await prepareAndExecuteAnswer({
      question: "What is the fever first aid guidance for a child?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-medical-${world.suffix}`,
    });
    expect(result).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "answered" }),
    });
    const answered = (result as {
      result: { claims: Array<{ claimKind: string; citationRefs: string[] }> };
    }).result;
    expect(answered.claims[0]?.claimKind).toBe("first_aid_action");
    expect(answered.claims[0]?.citationRefs.length).toBeGreaterThanOrEqual(1);
  });

  it("abstains on a material medical conflict and records one immutable review candidate", async () => {
    const conflictTurns = () => [
      {
        kind: "safety" as const,
        body: {
          status: "material_source_conflict",
          findings: [{
            conflict_class: "contradictory_action",
            candidate_refs: ["knowledge-1", "knowledge-2"],
          }],
        },
      },
    ];
    world.gateway.reset(conflictTurns());
    const prepared = await prepareAnswer({
      question: "How should a nosebleed be handled?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-conflict-${world.suffix}`,
    });
    expect(prepared.status).toBe("ready_to_confirm");
    const first = await executePrepared(prepared);
    expect(first).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "abstained_medical_conflict" }),
    });
    const candidateCount = await nurture.nurtureInstitutionKnowledgeConflictReviewCandidate
      .count({ where: { workspaceId: world.workspaceId } });
    expect(candidateCount).toBe(1);

    world.gateway.reset(conflictTurns());
    const replay = await executePrepared(prepared);
    expect(replay).toEqual(first);
    await expect(
      nurture.nurtureInstitutionKnowledgeConflictReviewCandidate
        .count({ where: { workspaceId: world.workspaceId } }),
    ).resolves.toBe(1);
  });

  it("abstains when the drafted text fails structured safety (unsafe text)", async () => {
    world.gateway.reset([
      { kind: "safety", body: { status: "general_clear" } },
      {
        kind: "generation",
        body: {
          claims: [{
            text: "Give the child 5ml of medication every hour.",
            claim_kind: "care_guidance",
            candidate_refs: ["knowledge-1"],
          }],
        },
      },
      {
        kind: "safety",
        body: {
          status: "unsafe",
          reason_codes: ["prescriptive_medication_or_dose"],
        },
      },
    ]);
    const result = await prepareAndExecuteAnswer({
      question: "How should staff record the outdoor play routine?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-unsafe-${world.suffix}`,
      operationExtras: {
        ageBandKeys: ["toddler"],
        scenarioKeys: ["daily_transition"],
      },
    });
    expect(result).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "abstained_safety" }),
    });
  });

  it("fails closed as unavailable on provider outage with no fallback", async () => {
    world.gateway.reset([{ kind: "unavailable" }]);
    const result = await prepareAndExecuteAnswer({
      question: "When should sunscreen be applied?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-outage-${world.suffix}`,
    });
    expect(result).toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_answer_unavailable",
    });
  });

  it("abstains when a used source is revoked after generation (post-generation currentness)", async () => {
    world.gateway.reset([
      { kind: "safety", body: { status: "general_clear" } },
      {
        kind: "generation",
        body: {
          claims: [{
            text: "Apply sunscreen before outdoor time.",
            claim_kind: "care_guidance",
            candidate_refs: ["knowledge-1"],
          }],
        },
      },
      { kind: "safety", body: { status: "safe" } },
    ]);
    world.gateway.sideEffects.set(1, async () => {
      await world.revokeItem(world.currentnessItem, "currentness");
    });
    const result = await prepareAndExecuteAnswer({
      question: "When should sunscreen be applied?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-currentness-${world.suffix}`,
    });
    expect(result).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "abstained_source_changed" }),
    });
  });

  it("denies execution after role revocation between prepare and execute (drift)", async () => {
    world.gateway.reset([]);
    const prepared = await prepareAnswer({
      question: "What applies in the drift institution?",
      targetOptionRef: world.issueTarget(world.driftRole.id, world.driftInstitution.id, 2),
      clientCommandId: `e8-drift-${world.suffix}`,
    });
    expect(prepared.status).toBe("ready_to_confirm");
    await nurture.nurtureCareRoleAssignment.update({
      where: { id: world.driftRole.id },
      data: { status: "revoked", aggregateVersion: { increment: 1 } },
    });
    const result = await executePrepared(prepared);
    expect(result).toMatchObject({ status: "denied" });
    expect(world.gateway.calls).toBe(0);
  });

  it("replays an executed answer from the canonical generation ledger (replay)", async () => {
    world.gateway.reset([
      { kind: "safety", body: { status: "general_clear" } },
      {
        kind: "generation",
        body: {
          claims: [{
            text: "Record the outdoor activity, the responsible role, and the completion evidence.",
            claim_kind: "institution_process",
            candidate_refs: ["knowledge-1"],
          }],
        },
      },
      { kind: "safety", body: { status: "safe" } },
    ]);
    const prepared = await prepareAnswer({
      question: "How should staff record the outdoor play routine?",
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-replay-${world.suffix}`,
      operationExtras: {
        ageBandKeys: ["toddler"],
        scenarioKeys: ["daily_transition"],
      },
    });
    expect(prepared.status).toBe("ready_to_confirm");
    const first = (await executePrepared(prepared)) as {
      status: string;
      result: { status: string; generationRef: string };
    };
    expect(first).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "answered" }),
    });

    world.gateway.reset([
      { kind: "safety", body: { status: "general_clear" } },
      { kind: "safety", body: { status: "safe" } },
    ]);
    const replay = (await executePrepared(prepared)) as {
      status: string;
      result: { status: string; generationRef: string };
    };
    expect(replay).toMatchObject({
      status: "ok",
      result: expect.objectContaining({ status: "answered" }),
    });
    expect(replay.result.generationRef).toBe(first.result.generationRef);
    expect(world.gateway.calls).toBe(2);
  });

  it("keeps provenance on the exportable answer and leaks nothing across the boundary", async () => {
    world.gateway.reset([
      { kind: "safety", body: { status: "general_clear" } },
      {
        kind: "generation",
        body: {
          claims: [{
            text: "Record the outdoor activity, the responsible role, and the completion evidence.",
            claim_kind: "institution_process",
            candidate_refs: ["knowledge-1"],
          }],
        },
      },
      { kind: "safety", body: { status: "safe" } },
    ]);
    const question = "How should staff record the outdoor play routine?";
    const result = (await prepareAndExecuteAnswer({
      question,
      targetOptionRef: world.issueTarget(),
      clientCommandId: `e8-provenance-${world.suffix}`,
      operationExtras: {
        ageBandKeys: ["toddler"],
        scenarioKeys: ["daily_transition"],
      },
    })) as {
      status: string;
      result: {
        status: string;
        assistanceKind: string;
        citations: Array<Record<string, unknown>>;
        claims: Array<{ citationRefs: string[] }>;
      };
    };
    expect(result.status).toBe("ok");
    expect(result.result.status).toBe("answered");
    expect(result.result.assistanceKind).toBe("ai_generated_with_retrieved_sources");
    expect(result.result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.result.claims.every((claim) => claim.citationRefs.length >= 1)).toBe(true);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/permission/iu);
    expect(serialized).not.toContain(world.accountId);
    expect(serialized).not.toContain(world.actorId);

    const preparedRows = await nurture.nurtureInstitutionKnowledgePreparedCommand
      .findMany({ where: { workspaceId: world.workspaceId } });
    expect(preparedRows.length).toBeGreaterThanOrEqual(1);
    for (const row of preparedRows) {
      const rowJson = JSON.stringify(row);
      expect(rowJson).not.toMatch(/permission/iu);
      expect(row.frozenSnapshotCiphertext).not.toContain(question);
    }
  });

  it("keeps every Institution Knowledge capability default-off in the registered manifest (census)", async () => {
    const scenario = world.registry.scenarios.get("nurture");
    expect(scenario).toBeDefined();
    const manifestJson = JSON.stringify(scenario?.manifest);
    for (const endpoint of [
      "nurture.institution_knowledge.query",
      "nurture.institution_knowledge.command.prepare",
      "nurture.institution_knowledge.command.execute",
    ]) {
      expect(manifestJson).toContain(endpoint);
    }
    expect(manifestJson).not.toMatch(/"enablement_policy"\s*:\s*"enabled"/u);
  });
});
