import { createHash } from "node:crypto";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import type { ProtectedContentWritePort } from "../../harness/protected-content.js";
import { canonicalJsonV1 } from "../commands/command-kernel.js";
import {
  deriveInstitutionKnowledgeRevisionState,
  validateInstitutionKnowledgeAuthorityLink,
  validateInstitutionKnowledgeBody,
  validateInstitutionKnowledgeCommandFacts,
  type NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1,
  type NurtureInstitutionKnowledgeBodyV1,
  type NurtureInstitutionKnowledgeItemV1,
  type NurtureInstitutionKnowledgeRevisionEventV1,
  type NurtureInstitutionKnowledgeRevisionV1,
} from "./institution-knowledge-lifecycle.js";

export const INSTITUTION_KNOWLEDGE_RETRIEVAL_CONTRACT = {
  key: "nurture.institution-knowledge-retrieval",
  version: "1.0.0",
} as const;

export const INSTITUTION_KNOWLEDGE_PURPOSES = [
  "institution_knowledge_indexing",
  "institution_admin_online_answer",
  "institution_admin_editor_preview",
] as const;

export type NurtureInstitutionKnowledgePurpose =
  (typeof INSTITUTION_KNOWLEDGE_PURPOSES)[number];

export type NurtureInstitutionKnowledgeSourceIdentityV1 = {
  /** Owner-issued canonical ref; object_id must never be a persistence row id. */
  source_ref: CanonicalRef;
  source_version: string;
  content_hash: string;
};

export type NurtureInstitutionKnowledgeReadFactsV1 = {
  source: NurtureInstitutionKnowledgeSourceIdentityV1;
  publication_event_ref?: CanonicalRef;
  item: NurtureInstitutionKnowledgeItemV1;
  revision: NurtureInstitutionKnowledgeRevisionV1;
  revisions: NurtureInstitutionKnowledgeRevisionV1[];
  events: NurtureInstitutionKnowledgeRevisionEventV1[];
  authority_links: NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1[];
};

export type NurtureInstitutionKnowledgeReadResultV1 =
  | { status: "resolved"; facts: NurtureInstitutionKnowledgeReadFactsV1 }
  | { status: "missing" }
  | { status: "unavailable" };

export type NurtureInstitutionKnowledgeSourceChangeType =
  | "published"
  | "superseded"
  | "revoked"
  | "review_changed";

export type NurtureInstitutionKnowledgeSourceChangeV1 = {
  cursor: string;
  source: NurtureInstitutionKnowledgeSourceIdentityV1;
  institution_ref: string;
  item_head: number;
  event_ref: CanonicalRef;
  event_type: NurtureInstitutionKnowledgeSourceChangeType;
  committed_at: string;
};

export type NurtureInstitutionKnowledgeReadOwnerV1 = {
  listSourceChanges(input: {
    workspace_id: string;
    institution_ref: string;
    after_cursor?: string;
    limit: number;
  }): Promise<
    | {
        status: "resolved";
        changes: NurtureInstitutionKnowledgeSourceChangeV1[];
        next_cursor?: string;
      }
    | { status: "unavailable" }
  >;
  readCurrentPublication(input: {
    workspace_id: string;
    institution_ref: string;
    source_ref: CanonicalRef;
  }): Promise<NurtureInstitutionKnowledgeReadResultV1>;
  listCurrentPublications(input: {
    workspace_id: string;
    institution_ref: string;
    reconciliation_ref?: string;
    after_source_cursor?: string;
    limit: number;
  }): Promise<
    | {
        status: "resolved";
        reconciliation_ref: string;
        evaluated_at: string;
        rows: NurtureInstitutionKnowledgeReadFactsV1[];
        next_source_cursor?: string;
        complete: boolean;
      }
    | { status: "unavailable" }
  >;
  readPreviewOptions(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref?: string;
    invocation_ref: string;
    /** Actor-bound opaque option refs; never persistence revision ids. */
    revision_option_refs: string[];
  }): Promise<
    | {
        status: "resolved";
        rows: Array<{
          revision_option_ref: string;
          facts: NurtureInstitutionKnowledgeReadFactsV1;
        }>;
      }
    | { status: "unavailable" }
  >;
};

export type NurtureKnowledgeServiceAuthorityV1 = {
  authorize(input: {
    workspace_id: string;
    institution_ref: string;
    service_invocation_ref: string;
    purpose: string;
  }): Promise<"authorized" | "denied" | "unavailable">;
};

export type NurtureInstitutionAdminKnowledgeAuthorityV1 = {
  authorize(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref?: string;
    surface: string;
    purpose: string;
    evaluated_at: string;
  }): Promise<"authorized" | "denied" | "unavailable">;
};

export type NurtureAuthoritySourceCurrentnessOwnerV1 = {
  validateExactSources(input: {
    sources: Array<{
      authority_source_ref: CanonicalRef;
      source_version: string;
    }>;
    evaluated_at: string;
  }): Promise<
    | {
        status: "resolved";
        decisions: Array<{
          authority_source_ref: CanonicalRef;
          source_version: string;
          decision: "eligible" | "denied";
        }>;
      }
    | { status: "unavailable" }
  >;
};

export type NurtureInstitutionKnowledgeEligibilityReason =
  | "scope_denied"
  | "not_published"
  | "review_incomplete"
  | "audience_denied"
  | "not_yet_valid"
  | "expired"
  | "applicability_mismatch"
  | "authority_source_invalid"
  | "content_drift";

type AuthorityDecision = {
  authority_source_ref: CanonicalRef;
  source_version: string;
  decision: "eligible" | "denied";
};

export type NurtureInstitutionKnowledgeEligibilityContextV1 = {
  workspace_id: string;
  institution_ref: string;
  purpose: "institution_knowledge_indexing" | "institution_admin_online_answer";
  evaluated_at: string;
  age_band_keys?: string[];
  scenario_keys?: string[];
  expected_source?: NurtureInstitutionKnowledgeSourceIdentityV1;
};

const refJson = (value: CanonicalRef): string => canonicalJsonV1(value);
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const REF_TOKEN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const SOURCE_VERSION_PATTERN = /^r[1-9][0-9]*:[0-9a-f]{64}$/;

const validInstant = (value: string): boolean =>
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;

const validSourceIdentity = (source: NurtureInstitutionKnowledgeSourceIdentityV1): boolean => {
  try {
    assertCanonicalRef(source.source_ref);
    return (
      source.source_ref.namespace === "nurture" &&
      source.source_ref.object_type === "institution_knowledge_source" &&
      source.source_ref.version === undefined &&
      SOURCE_VERSION_PATTERN.test(source.source_version) &&
      HASH_PATTERN.test(source.content_hash) &&
      source.source_version.endsWith(`:${source.content_hash}`)
    );
  } catch {
    return false;
  }
};

export const institutionKnowledgeSourceVersion = (
  revision: Pick<NurtureInstitutionKnowledgeRevisionV1, "revision_number" | "content_hash">,
): string => `r${revision.revision_number}:${revision.content_hash}`;

export const institutionKnowledgeSourceIdentity = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
): NurtureInstitutionKnowledgeSourceIdentityV1 => facts.source;

const byEventOrder = (
  left: NurtureInstitutionKnowledgeRevisionEventV1,
  right: NurtureInstitutionKnowledgeRevisionEventV1,
): number => left.item_head - right.item_head || left.event_ordinal - right.event_ordinal;

const latestReview = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
): "reviewed" | "changes_requested" | undefined =>
  [...facts.events]
    .filter(
      (event) =>
        event.revision_ref === facts.revision.revision_ref &&
        (event.event_type === "reviewed" || event.event_type === "changes_requested"),
    )
    .sort(byEventOrder)
    .at(-1)?.event_type as "reviewed" | "changes_requested" | undefined;

const exactIntersection = (source: string[], requested: string[] | undefined): boolean =>
  source.length === 0 ||
  Boolean(requested?.length && source.some((value) => requested.includes(value)));

const authorityDecisionFor = (
  link: NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1,
  decisions: readonly AuthorityDecision[],
): AuthorityDecision | undefined =>
  decisions.find(
    (decision) =>
      decision.source_version === link.source_version &&
      refJson(decision.authority_source_ref) === refJson(link.authority_source_ref),
  );

const hasCurrentAuthoritySource = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
  decisions: readonly AuthorityDecision[],
): boolean =>
  facts.authority_links.some(
    (link) => authorityDecisionFor(link, decisions)?.decision === "eligible",
  );

const publicationIsCurrent = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
): boolean => {
  if (facts.item.current_published_revision_ref !== facts.revision.revision_ref) return false;
  const lifecycle = [...facts.events]
    .filter(
      (event) =>
        event.revision_ref === facts.revision.revision_ref &&
        ["published", "publication_superseded", "revoked"].includes(event.event_type),
    )
    .sort(byEventOrder)
    .at(-1)?.event_type;
  return lifecycle === "published";
};

const factsMatchScope = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
  workspaceId: string,
  institutionRef: string,
): boolean =>
  facts.item.workspace_id === workspaceId &&
  facts.item.institution_ref === institutionRef &&
  facts.revision.workspace_id === workspaceId &&
  facts.revision.institution_ref === institutionRef &&
  facts.revision.item_ref === facts.item.item_ref;

const factsAreCoherent = (facts: NurtureInstitutionKnowledgeReadFactsV1): boolean => {
  try {
    assertCanonicalRef(facts.source.source_ref);
    if (facts.publication_event_ref) assertCanonicalRef(facts.publication_event_ref);
  } catch {
    return false;
  }
  const selectedRevision = facts.revisions.find(
    (revision) => revision.revision_ref === facts.revision.revision_ref,
  );
  if (
    !validSourceIdentity(facts.source) ||
    (facts.publication_event_ref !== undefined &&
      (facts.publication_event_ref.namespace !== "nurture" ||
        facts.publication_event_ref.object_type !== "institution_knowledge_revision_event")) ||
    facts.source.source_version !== institutionKnowledgeSourceVersion(facts.revision) ||
    facts.source.content_hash !== facts.revision.content_hash ||
    selectedRevision === undefined ||
    canonicalJsonV1(selectedRevision) !== canonicalJsonV1(facts.revision) ||
    !facts.authority_links.every(validateInstitutionKnowledgeAuthorityLink) ||
    !validateInstitutionKnowledgeCommandFacts({
      item: facts.item,
      revisions: facts.revisions,
      events: facts.events,
      actor_participant_ref: facts.revision.author_participant_ref,
      actor_role_assignment_ref: facts.revision.author_role_assignment_ref,
    })
  ) return false;
  const publication = [...facts.events]
    .filter(
      (event) =>
        event.revision_ref === facts.revision.revision_ref &&
        event.event_type === "published",
    )
    .sort(byEventOrder)
    .at(-1);
  return (
    publication
      ? facts.publication_event_ref?.version === publication.item_head
      : facts.publication_event_ref === undefined
  );
};

export const decideInstitutionKnowledgeEligibility = (input: {
  facts: NurtureInstitutionKnowledgeReadFactsV1;
  context: NurtureInstitutionKnowledgeEligibilityContextV1;
  authority_decisions?: AuthorityDecision[];
  body_hash?: string;
}):
  | { status: "eligible" }
  | { status: "denied"; reason_code: NurtureInstitutionKnowledgeEligibilityReason } => {
  const { facts, context } = input;
  if (
    !factsMatchScope(facts, context.workspace_id, context.institution_ref) ||
    !factsAreCoherent(facts)
  ) {
    return { status: "denied", reason_code: "scope_denied" };
  }
  if (!publicationIsCurrent(facts)) {
    return { status: "denied", reason_code: "not_published" };
  }
  if (latestReview(facts) !== "reviewed") {
    return { status: "denied", reason_code: "review_incomplete" };
  }
  if (!facts.revision.intended_audiences.includes("institution_admin")) {
    return { status: "denied", reason_code: "audience_denied" };
  }
  if (facts.revision.valid_until && context.evaluated_at >= facts.revision.valid_until) {
    return { status: "denied", reason_code: "expired" };
  }
  if (
    context.purpose === "institution_admin_online_answer" &&
    facts.revision.valid_from &&
    context.evaluated_at < facts.revision.valid_from
  ) {
    return { status: "denied", reason_code: "not_yet_valid" };
  }
  if (
    context.purpose === "institution_admin_online_answer" &&
    (!exactIntersection(facts.revision.age_band_keys, context.age_band_keys) ||
      !exactIntersection(facts.revision.scenario_keys, context.scenario_keys))
  ) {
    return { status: "denied", reason_code: "applicability_mismatch" };
  }
  if (
    facts.revision.safety_class === "basic_health_first_aid" &&
    !hasCurrentAuthoritySource(facts, input.authority_decisions ?? [])
  ) {
    return { status: "denied", reason_code: "authority_source_invalid" };
  }
  const actual = institutionKnowledgeSourceIdentity(facts);
  if (
    input.context.expected_source &&
    (refJson(input.context.expected_source.source_ref) !== refJson(actual.source_ref) ||
      input.context.expected_source.source_version !== actual.source_version ||
      input.context.expected_source.content_hash !== actual.content_hash)
  ) {
    return { status: "denied", reason_code: "content_drift" };
  }
  if (input.body_hash !== undefined && input.body_hash !== facts.revision.content_hash) {
    return { status: "denied", reason_code: "content_drift" };
  }
  return { status: "eligible" };
};

const readBody = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
  protectedContent: Pick<ProtectedContentWritePort, "unseal">,
): { body: NurtureInstitutionKnowledgeBodyV1; body_hash: string } | null => {
  try {
    const value: unknown = JSON.parse(protectedContent.unseal(facts.revision.body_envelope));
    if (!validateInstitutionKnowledgeBody(value)) return null;
    return {
      body: value,
      body_hash: createHash("sha256").update(canonicalJsonV1(value), "utf8").digest("hex"),
    };
  } catch {
    return null;
  }
};

const authoritySources = (
  rows: readonly NurtureInstitutionKnowledgeReadFactsV1[],
): Array<{ authority_source_ref: CanonicalRef; source_version: string }> => {
  const unique = new Map<string, { authority_source_ref: CanonicalRef; source_version: string }>();
  for (const row of rows) {
    for (const link of row.authority_links) {
      const key = canonicalJsonV1([link.authority_source_ref, link.source_version]);
      unique.set(key, {
        authority_source_ref: link.authority_source_ref,
        source_version: link.source_version,
      });
    }
  }
  return [...unique.values()];
};

const validateAuthoritySources = async (
  owner: NurtureAuthoritySourceCurrentnessOwnerV1,
  rows: readonly NurtureInstitutionKnowledgeReadFactsV1[],
  evaluatedAt: string,
): Promise<{ status: "resolved"; decisions: AuthorityDecision[] } | { status: "unavailable" }> => {
  const sources = authoritySources(rows);
  if (sources.length === 0) return { status: "resolved", decisions: [] };
  if (sources.length > 512) return { status: "unavailable" };
  try {
    const result = await owner.validateExactSources({ sources, evaluated_at: evaluatedAt });
    if (result.status === "unavailable" || result.decisions.length !== sources.length) {
      return { status: "unavailable" };
    }
    const exact = sources.every((source, index) => {
      const decision = result.decisions[index];
      return (
        decision !== undefined &&
        decision.source_version === source.source_version &&
        refJson(decision.authority_source_ref) === refJson(source.authority_source_ref)
      );
    });
    return exact ? result : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
};

const medicalRows = (rows: readonly NurtureInstitutionKnowledgeReadFactsV1[]) =>
  rows.filter((row) => row.revision.safety_class === "basic_health_first_aid");

export type NurtureInstitutionKnowledgeSourceSnapshotV1 =
  NurtureInstitutionKnowledgeSourceIdentityV1 & {
    source_kind: "nurture_institution_revision";
    provenance_kind: "institution_authored";
    institution_ref: string;
    item_head: number;
    category: NurtureInstitutionKnowledgeItemV1["category"];
    body: NurtureInstitutionKnowledgeBodyV1;
    intended_audiences: NurtureInstitutionKnowledgeRevisionV1["intended_audiences"];
    age_band_keys: string[];
    scenario_keys: string[];
    safety_class: NurtureInstitutionKnowledgeRevisionV1["safety_class"];
    valid_from?: string;
    valid_until?: string;
    publication_event_ref: CanonicalRef;
    authority_sources: Array<{
      authority_source_ref: CanonicalRef;
      source_version: string;
    }>;
  };

const snapshotOf = (
  facts: NurtureInstitutionKnowledgeReadFactsV1,
  body: NurtureInstitutionKnowledgeBodyV1,
): NurtureInstitutionKnowledgeSourceSnapshotV1 | null =>
  facts.publication_event_ref
    ? ({
        ...institutionKnowledgeSourceIdentity(facts),
        source_kind: "nurture_institution_revision",
        provenance_kind: "institution_authored",
        institution_ref: facts.item.institution_ref,
        item_head: facts.item.item_head,
        category: facts.item.category,
        body,
        intended_audiences: facts.revision.intended_audiences,
        age_band_keys: facts.revision.age_band_keys,
        scenario_keys: facts.revision.scenario_keys,
        safety_class: facts.revision.safety_class,
        ...(facts.revision.valid_from ? { valid_from: facts.revision.valid_from } : {}),
        ...(facts.revision.valid_until ? { valid_until: facts.revision.valid_until } : {}),
        publication_event_ref: facts.publication_event_ref,
        authority_sources: facts.authority_links.map((link) => ({
          authority_source_ref: link.authority_source_ref,
          source_version: link.source_version,
        })),
      } satisfies NurtureInstitutionKnowledgeSourceSnapshotV1)
    : null;

export type InstitutionKnowledgeSourceChangeProviderV1 = {
  listSourceChanges(input: {
    workspace_id: string;
    institution_ref: string;
    service_invocation_ref: string;
    purpose: string;
    after_cursor?: string;
    limit: number;
  }): Promise<
    | { status: "resolved"; changes: NurtureInstitutionKnowledgeSourceChangeV1[]; next_cursor?: string }
    | { status: "denied" }
    | { status: "unavailable" }
  >;
  readSourceForIndexing(input: {
    workspace_id: string;
    institution_ref: string;
    service_invocation_ref: string;
    purpose: string;
    source_ref: CanonicalRef;
    source_version: string;
  }): Promise<
    | { status: "resolved"; source: NurtureInstitutionKnowledgeSourceSnapshotV1 }
    | { status: "ineligible"; reason_code: NurtureInstitutionKnowledgeEligibilityReason }
    | { status: "denied" }
    | { status: "unavailable" }
  >;
  listCurrentSourceStates(input: {
    workspace_id: string;
    institution_ref: string;
    service_invocation_ref: string;
    purpose: string;
    reconciliation_ref?: string;
    after_source_cursor?: string;
    limit: number;
  }): Promise<
    | {
        status: "resolved";
        reconciliation_ref: string;
        evaluated_at: string;
        rows: Array<NurtureInstitutionKnowledgeSourceIdentityV1 & { decision: "indexable" | "ineligible" }>;
        next_source_cursor?: string;
        complete: boolean;
      }
    | { status: "denied" }
    | { status: "unavailable" }
  >;
};

export class NurtureInstitutionKnowledgeSourceProvider
  implements InstitutionKnowledgeSourceChangeProviderV1
{
  constructor(
    private readonly reads: NurtureInstitutionKnowledgeReadOwnerV1,
    private readonly serviceAuthority: NurtureKnowledgeServiceAuthorityV1,
    private readonly authoritySourcesOwner: NurtureAuthoritySourceCurrentnessOwnerV1,
    private readonly protectedContent: Pick<ProtectedContentWritePort, "unseal">,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private async authorize(input: {
    workspace_id: string;
    institution_ref: string;
    service_invocation_ref: string;
    purpose: string;
  }) {
    if (
      input.purpose !== "institution_knowledge_indexing" ||
      !REF_TOKEN_PATTERN.test(input.workspace_id) ||
      !REF_TOKEN_PATTERN.test(input.institution_ref) ||
      !REF_TOKEN_PATTERN.test(input.service_invocation_ref)
    ) return "denied" as const;
    try {
      return await this.serviceAuthority.authorize(input);
    } catch {
      return "unavailable" as const;
    }
  }

  async listSourceChanges(input: Parameters<InstitutionKnowledgeSourceChangeProviderV1["listSourceChanges"]>[0]) {
    if (
      !Number.isSafeInteger(input.limit) ||
      input.limit < 1 ||
      input.limit > 100 ||
      (input.after_cursor !== undefined && !REF_TOKEN_PATTERN.test(input.after_cursor))
    ) {
      return { status: "denied" as const };
    }
    const authority = await this.authorize(input);
    if (authority !== "authorized") return { status: authority };
    try {
      const result = await this.reads.listSourceChanges({
        workspace_id: input.workspace_id,
        institution_ref: input.institution_ref,
        ...(input.after_cursor ? { after_cursor: input.after_cursor } : {}),
        limit: input.limit,
      });
      if (result.status === "unavailable") return result;
      if (result.changes.length > input.limit) {
        return { status: "unavailable" as const };
      }
      const changes: NurtureInstitutionKnowledgeSourceChangeV1[] = [];
      for (const change of result.changes) {
        try {
          assertCanonicalRef(change.event_ref);
        } catch {
          return { status: "unavailable" as const };
        }
        if (
          change.institution_ref !== input.institution_ref ||
          !validSourceIdentity(change.source) ||
          change.event_ref.namespace !== "nurture" ||
          change.event_ref.object_type !== "institution_knowledge_revision_event" ||
          !REF_TOKEN_PATTERN.test(change.cursor) ||
          !(["published", "superseded", "revoked", "review_changed"] as const).includes(
            change.event_type,
          ) ||
          !validInstant(change.committed_at) ||
          !Number.isSafeInteger(change.item_head) ||
          change.item_head < 1
        ) return { status: "unavailable" as const };
        changes.push({
          cursor: change.cursor,
          source: change.source,
          institution_ref: change.institution_ref,
          item_head: change.item_head,
          event_ref: change.event_ref,
          event_type: change.event_type,
          committed_at: change.committed_at,
        });
      }
      if (result.next_cursor !== undefined && !REF_TOKEN_PATTERN.test(result.next_cursor)) {
        return { status: "unavailable" as const };
      }
      return {
        status: "resolved" as const,
        changes,
        ...(result.next_cursor ? { next_cursor: result.next_cursor } : {}),
      };
    } catch {
      return { status: "unavailable" as const };
    }
  }

  async readSourceForIndexing(input: Parameters<InstitutionKnowledgeSourceChangeProviderV1["readSourceForIndexing"]>[0]) {
    const authority = await this.authorize(input);
    if (authority !== "authorized") return { status: authority };
    if (!SOURCE_VERSION_PATTERN.test(input.source_version)) return { status: "denied" as const };
    let read: NurtureInstitutionKnowledgeReadResultV1;
    try {
      assertCanonicalRef(input.source_ref);
      if (
        input.source_ref.namespace !== "nurture" ||
        input.source_ref.object_type !== "institution_knowledge_source" ||
        input.source_ref.version !== undefined
      ) return { status: "denied" as const };
      read = await this.reads.readCurrentPublication({
        workspace_id: input.workspace_id,
        institution_ref: input.institution_ref,
        source_ref: input.source_ref,
      });
    } catch {
      return { status: "unavailable" as const };
    }
    if (read.status === "unavailable") return read;
    if (read.status === "missing") {
      return { status: "ineligible" as const, reason_code: "not_published" as const };
    }
    if (
      !factsMatchScope(read.facts, input.workspace_id, input.institution_ref) ||
      !factsAreCoherent(read.facts)
    ) {
      return { status: "unavailable" as const };
    }
    const evaluatedAt = this.now();
    const currentness = await validateAuthoritySources(
      this.authoritySourcesOwner,
      medicalRows([read.facts]),
      evaluatedAt,
    );
    if (currentness.status === "unavailable") return currentness;
    const body = readBody(read.facts, this.protectedContent);
    if (!body) return { status: "unavailable" as const };
    const decision = decideInstitutionKnowledgeEligibility({
      facts: read.facts,
      context: {
        workspace_id: input.workspace_id,
        institution_ref: input.institution_ref,
        purpose: "institution_knowledge_indexing",
        evaluated_at: evaluatedAt,
        expected_source: {
          source_ref: input.source_ref,
          source_version: input.source_version,
          content_hash: read.facts.revision.content_hash,
        },
      },
      authority_decisions: currentness.decisions,
      body_hash: body.body_hash,
    });
    if (decision.status === "denied") {
      return { status: "ineligible" as const, reason_code: decision.reason_code };
    }
    const source = snapshotOf(read.facts, body.body);
    return source
      ? { status: "resolved" as const, source }
      : { status: "unavailable" as const };
  }

  async listCurrentSourceStates(input: Parameters<InstitutionKnowledgeSourceChangeProviderV1["listCurrentSourceStates"]>[0]) {
    if (
      !Number.isSafeInteger(input.limit) ||
      input.limit < 1 ||
      input.limit > 100 ||
      (input.reconciliation_ref !== undefined &&
        !REF_TOKEN_PATTERN.test(input.reconciliation_ref)) ||
      (input.after_source_cursor !== undefined &&
        !REF_TOKEN_PATTERN.test(input.after_source_cursor))
    ) {
      return { status: "denied" as const };
    }
    const authority = await this.authorize(input);
    if (authority !== "authorized") return { status: authority };
    let read: Awaited<ReturnType<NurtureInstitutionKnowledgeReadOwnerV1["listCurrentPublications"]>>;
    try {
      read = await this.reads.listCurrentPublications({
        workspace_id: input.workspace_id,
        institution_ref: input.institution_ref,
        ...(input.reconciliation_ref ? { reconciliation_ref: input.reconciliation_ref } : {}),
        ...(input.after_source_cursor ? { after_source_cursor: input.after_source_cursor } : {}),
        limit: input.limit,
      });
    } catch {
      return { status: "unavailable" as const };
    }
    if (
      read.status === "unavailable" ||
      read.rows.length > input.limit ||
      !validInstant(read.evaluated_at) ||
      !REF_TOKEN_PATTERN.test(read.reconciliation_ref) ||
      (read.next_source_cursor !== undefined &&
        !REF_TOKEN_PATTERN.test(read.next_source_cursor)) ||
      (read.complete === Boolean(read.next_source_cursor))
    ) return { status: "unavailable" as const };
    if (input.reconciliation_ref && read.reconciliation_ref !== input.reconciliation_ref) {
      return { status: "unavailable" as const };
    }
    if (
      read.rows.some(
        (row) =>
          !factsMatchScope(row, input.workspace_id, input.institution_ref) ||
          !factsAreCoherent(row),
      ) ||
      new Set(read.rows.map((row) => refJson(row.source.source_ref))).size !== read.rows.length ||
      read.rows.some(
        (row, index) =>
          index > 0 &&
          refJson(read.rows[index - 1]!.source.source_ref) >= refJson(row.source.source_ref),
      )
    ) {
      return { status: "unavailable" as const };
    }
    const authorityCurrentness = await validateAuthoritySources(
      this.authoritySourcesOwner,
      medicalRows(read.rows),
      read.evaluated_at,
    );
    if (authorityCurrentness.status === "unavailable") return authorityCurrentness;
    const rows: Array<NurtureInstitutionKnowledgeSourceIdentityV1 & { decision: "indexable" | "ineligible" }> = [];
    for (const facts of read.rows) {
      const body = readBody(facts, this.protectedContent);
      if (!body) return { status: "unavailable" as const };
      const decision = decideInstitutionKnowledgeEligibility({
        facts,
        context: {
          workspace_id: facts.item.workspace_id,
          institution_ref: facts.item.institution_ref,
          purpose: "institution_knowledge_indexing",
          evaluated_at: read.evaluated_at,
        },
        authority_decisions: authorityCurrentness.decisions,
        body_hash: body.body_hash,
      });
      rows.push({
        ...institutionKnowledgeSourceIdentity(facts),
        decision: decision.status === "eligible" ? "indexable" : "ineligible",
      });
    }
    return {
      status: "resolved" as const,
      reconciliation_ref: read.reconciliation_ref,
      evaluated_at: read.evaluated_at,
      rows,
      ...(read.next_source_cursor ? { next_source_cursor: read.next_source_cursor } : {}),
      complete: read.complete,
    };
  }
}

export type NurtureInstitutionKnowledgeOnlineContextV1 = {
  workspace_id: string;
  institution_ref: string;
  participant_ref: string;
  role_assignment_ref?: string;
  surface: string;
  purpose: string;
  invocation_ref: string;
  evaluated_at: string;
  age_band_keys: string[];
  scenario_keys: string[];
};

export type NurtureInstitutionKnowledgeSourceCurrentnessProviderV1 = {
  validateSources(input: {
    context: NurtureInstitutionKnowledgeOnlineContextV1;
    sources: NurtureInstitutionKnowledgeSourceIdentityV1[];
  }): Promise<
    | {
        status: "resolved";
        decisions: Array<
          | (NurtureInstitutionKnowledgeSourceIdentityV1 & { decision: "eligible" })
          | (NurtureInstitutionKnowledgeSourceIdentityV1 & {
              decision: "denied";
              reason_code: NurtureInstitutionKnowledgeEligibilityReason;
            })
        >;
      }
    | { status: "denied" }
    | { status: "unavailable" }
  >;
};

const validAdminContext = (
  context: Omit<NurtureInstitutionKnowledgeOnlineContextV1, "age_band_keys" | "scenario_keys">,
  purpose: "institution_admin_online_answer" | "institution_admin_editor_preview",
): boolean =>
  context.surface === "institution_workbench" &&
  context.purpose === purpose &&
  context.workspace_id.trim().length > 0 &&
  context.institution_ref.trim().length > 0 &&
  context.participant_ref.trim().length > 0 &&
  context.invocation_ref.trim().length > 0 &&
  !Number.isNaN(Date.parse(context.evaluated_at)) &&
  new Date(context.evaluated_at).toISOString() === context.evaluated_at;

const validOnlineContext = (context: NurtureInstitutionKnowledgeOnlineContextV1): boolean =>
  validAdminContext(context, "institution_admin_online_answer") &&
  context.age_band_keys.length <= 16 &&
  context.scenario_keys.length <= 16 &&
  context.age_band_keys.every((key) => /^[a-z][a-z0-9._:-]{0,99}$/.test(key)) &&
  context.scenario_keys.every((key) => /^[a-z][a-z0-9._:-]{0,99}$/.test(key)) &&
  new Set(context.age_band_keys).size === context.age_band_keys.length &&
  new Set(context.scenario_keys).size === context.scenario_keys.length;

export class NurtureInstitutionKnowledgeCurrentnessProvider
  implements NurtureInstitutionKnowledgeSourceCurrentnessProviderV1
{
  constructor(
    private readonly reads: NurtureInstitutionKnowledgeReadOwnerV1,
    private readonly adminAuthority: NurtureInstitutionAdminKnowledgeAuthorityV1,
    private readonly authoritySourcesOwner: NurtureAuthoritySourceCurrentnessOwnerV1,
  ) {}

  async validateSources(input: Parameters<NurtureInstitutionKnowledgeSourceCurrentnessProviderV1["validateSources"]>[0]) {
    if (
      !validOnlineContext(input.context) ||
      input.sources.length < 1 ||
      input.sources.length > 32 ||
      input.sources.some((source) => !validSourceIdentity(source)) ||
      new Set(input.sources.map((source) => canonicalJsonV1(source))).size !== input.sources.length
    ) {
      return { status: "denied" as const };
    }
    let authority: "authorized" | "denied" | "unavailable";
    try {
      authority = await this.adminAuthority.authorize(input.context);
    } catch {
      authority = "unavailable";
    }
    if (authority !== "authorized") return { status: authority };
    let reads: NurtureInstitutionKnowledgeReadResultV1[];
    try {
      reads = await Promise.all(input.sources.map(async (source) => {
        assertCanonicalRef(source.source_ref);
        return this.reads.readCurrentPublication({
          workspace_id: input.context.workspace_id,
          institution_ref: input.context.institution_ref,
          source_ref: source.source_ref,
        });
      }));
    } catch {
      return { status: "unavailable" as const };
    }
    if (reads.some((read) => read.status === "unavailable")) return { status: "unavailable" as const };
    const rows = reads.flatMap((read) => (read.status === "resolved" ? [read.facts] : []));
    if (
      rows.some(
        (row) =>
          !factsMatchScope(
            row,
            input.context.workspace_id,
            input.context.institution_ref,
          ),
      )
    ) return { status: "unavailable" as const };
    const authorityCurrentness = await validateAuthoritySources(
      this.authoritySourcesOwner,
      medicalRows(rows),
      input.context.evaluated_at,
    );
    if (authorityCurrentness.status === "unavailable") return authorityCurrentness;
    return {
      status: "resolved" as const,
      decisions: input.sources.map((source, index) => {
        const read = reads[index]!;
        if (read.status === "missing") {
          return { ...source, decision: "denied" as const, reason_code: "not_published" as const };
        }
        if (read.status === "unavailable") {
          throw new Error("unreachable unavailable read");
        }
        const decision = decideInstitutionKnowledgeEligibility({
          facts: read.facts,
          context: {
            workspace_id: input.context.workspace_id,
            institution_ref: input.context.institution_ref,
            purpose: "institution_admin_online_answer",
            evaluated_at: input.context.evaluated_at,
            age_band_keys: input.context.age_band_keys,
            scenario_keys: input.context.scenario_keys,
            expected_source: source,
          },
          authority_decisions: authorityCurrentness.decisions,
        });
        return decision.status === "eligible"
          ? { ...source, decision: "eligible" as const }
          : { ...source, decision: "denied" as const, reason_code: decision.reason_code };
      }),
    };
  }
}

export type NurtureInstitutionKnowledgeRetrievalCandidateV1 =
  NurtureInstitutionKnowledgeSourceIdentityV1 & {
    candidate_ref: string;
    source_owner: "nurture";
    source_kind: "nurture_institution_revision";
    provenance_kind: "institution_authored";
    rank: number;
    match_reason: string;
    excerpt: string;
    host_current_source_decision: "current";
    authority_sources: Array<{
      authority_source_ref: CanonicalRef;
      source_version: string;
    }>;
  };

export type InstitutionKnowledgeRetrievalOwnerPortV1 = {
  retrieveCandidates(input: {
    context: NurtureInstitutionKnowledgeOnlineContextV1;
    question: string;
  }): Promise<
    | { status: "resolved"; candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[] }
    | { status: "unavailable" }
  >;
};

export type InstitutionKnowledgeOnlineQueryV1 = {
  question: string;
  age_band_keys?: string[];
  scenario_keys?: string[];
};

export const validateInstitutionKnowledgeOnlineQuery = (
  value: unknown,
): value is InstitutionKnowledgeOnlineQueryV1 => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !["question", "age_band_keys", "scenario_keys"].includes(key))) return false;
  const question = record.question;
  if (
    typeof question !== "string" ||
    question.trim().length === 0 ||
    question.length > 2_000 ||
    Buffer.byteLength(question, "utf8") > 8_192
  ) return false;
  return [record.age_band_keys ?? [], record.scenario_keys ?? []].every(
    (values) =>
      Array.isArray(values) &&
      values.length <= 16 &&
      values.every((entry) => typeof entry === "string" && /^[a-z][a-z0-9._:-]{0,99}$/.test(entry)) &&
      new Set(values).size === values.length,
  );
};

const validCandidate = (candidate: NurtureInstitutionKnowledgeRetrievalCandidateV1): boolean => {
  try {
    assertCanonicalRef(candidate.source_ref);
    const authorityKeys = candidate.authority_sources.map((source) => {
      assertCanonicalRef(source.authority_source_ref);
      return canonicalJsonV1([source.authority_source_ref, source.source_version]);
    });
    return (
      validSourceIdentity(candidate) &&
      REF_TOKEN_PATTERN.test(candidate.candidate_ref) &&
      candidate.source_owner === "nurture" &&
      candidate.source_kind === "nurture_institution_revision" &&
      candidate.provenance_kind === "institution_authored" &&
      candidate.excerpt.trim().length > 0 &&
      candidate.excerpt.length <= 1_200 &&
      Buffer.byteLength(candidate.excerpt, "utf8") <= 4_096 &&
      Number.isFinite(candidate.rank) &&
      candidate.rank >= 0 &&
      candidate.match_reason.trim().length > 0 &&
      candidate.match_reason.length <= 200 &&
      candidate.authority_sources.length <= 16 &&
      candidate.authority_sources.every((source) =>
        /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$/.test(source.source_version),
      ) &&
      new Set(authorityKeys).size === authorityKeys.length &&
      candidate.host_current_source_decision === "current"
    );
  } catch {
    return false;
  }
};

export const retrieveCurrentInstitutionKnowledgeCandidates = async (input: {
  public_query: unknown;
  trusted_context: Omit<NurtureInstitutionKnowledgeOnlineContextV1, "age_band_keys" | "scenario_keys">;
  retrieval_owner: InstitutionKnowledgeRetrievalOwnerPortV1;
  currentness_provider: NurtureInstitutionKnowledgeSourceCurrentnessProviderV1;
  admin_authority: NurtureInstitutionAdminKnowledgeAuthorityV1;
}): Promise<
  | { status: "resolved"; candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[] }
  | { status: "denied" }
  | { status: "unavailable" }
> => {
  if (!validateInstitutionKnowledgeOnlineQuery(input.public_query)) return { status: "denied" };
  const context: NurtureInstitutionKnowledgeOnlineContextV1 = {
    ...input.trusted_context,
    age_band_keys: input.public_query.age_band_keys ?? [],
    scenario_keys: input.public_query.scenario_keys ?? [],
  };
  if (!validOnlineContext(context)) return { status: "denied" };
  let authority: "authorized" | "denied" | "unavailable";
  try {
    authority = await input.admin_authority.authorize(context);
  } catch {
    authority = "unavailable";
  }
  if (authority !== "authorized") return { status: authority };
  let retrieved: Awaited<ReturnType<InstitutionKnowledgeRetrievalOwnerPortV1["retrieveCandidates"]>>;
  try {
    retrieved = await input.retrieval_owner.retrieveCandidates({
      context,
      question: input.public_query.question,
    });
  } catch {
    return { status: "unavailable" };
  }
  if (retrieved.status === "unavailable") return retrieved;
  if (
    retrieved.candidates.length > 16 ||
    retrieved.candidates.some((candidate) => !validCandidate(candidate)) ||
    new Set(retrieved.candidates.map((candidate) => candidate.candidate_ref)).size !== retrieved.candidates.length
  ) return { status: "unavailable" };
  if (retrieved.candidates.length === 0) return { status: "resolved", candidates: [] };
  let currentness: Awaited<
    ReturnType<NurtureInstitutionKnowledgeSourceCurrentnessProviderV1["validateSources"]>
  >;
  try {
    currentness = await input.currentness_provider.validateSources({
      context,
      sources: retrieved.candidates.map(({ source_ref, source_version, content_hash }) => ({
        source_ref,
        source_version,
        content_hash,
      })),
    });
  } catch {
    return { status: "unavailable" };
  }
  if (currentness.status !== "resolved") return currentness;
  if (
    currentness.decisions.length !== retrieved.candidates.length ||
    currentness.decisions.some((decision, index) => {
      const candidate = retrieved.candidates[index];
      return (
        candidate === undefined ||
        decision.source_version !== candidate.source_version ||
        decision.content_hash !== candidate.content_hash ||
        refJson(decision.source_ref) !== refJson(candidate.source_ref)
      );
    })
  ) return { status: "unavailable" };
  return {
    status: "resolved",
    candidates: retrieved.candidates.filter(
      (_candidate, index) => currentness.decisions[index]?.decision === "eligible",
    ),
  };
};

export type InstitutionKnowledgeEditorPreviewV1 = {
  revision_option_refs: string[];
};

export type NurtureInstitutionKnowledgePreviewWarning =
  | "draft"
  | "superseded"
  | "unreviewed"
  | "not_yet_valid"
  | "expired"
  | "authority_source_invalid";

export type NurtureInstitutionKnowledgePreviewOptionV1 = {
  revision_option_ref: string;
  source_ref: CanonicalRef;
  source_version: string;
  revision_number: number;
  state: "draft" | "published" | "superseded";
  body: NurtureInstitutionKnowledgeBodyV1;
  warnings: NurtureInstitutionKnowledgePreviewWarning[];
};

export class NurtureInstitutionKnowledgePreviewProvider {
  constructor(
    private readonly reads: NurtureInstitutionKnowledgeReadOwnerV1,
    private readonly adminAuthority: NurtureInstitutionAdminKnowledgeAuthorityV1,
    private readonly authoritySourcesOwner: NurtureAuthoritySourceCurrentnessOwnerV1,
    private readonly protectedContent: Pick<ProtectedContentWritePort, "unseal">,
  ) {}

  async preview(input: {
    context: Omit<NurtureInstitutionKnowledgeOnlineContextV1, "age_band_keys" | "scenario_keys">;
    request: unknown;
  }): Promise<
    | { status: "resolved"; options: NurtureInstitutionKnowledgePreviewOptionV1[] }
    | { status: "denied" }
    | { status: "unavailable" }
  > {
    if (!input.request || typeof input.request !== "object" || Array.isArray(input.request)) {
      return { status: "denied" };
    }
    const request = input.request as Record<string, unknown>;
    const revisionOptionRefs = request.revision_option_refs;
    if (
      Object.keys(request).some((key) => key !== "revision_option_refs") ||
      !validAdminContext(input.context, "institution_admin_editor_preview") ||
      !Array.isArray(revisionOptionRefs) ||
      revisionOptionRefs.length < 1 ||
      revisionOptionRefs.length > 8 ||
      revisionOptionRefs.some(
        (ref) => typeof ref !== "string" || !REF_TOKEN_PATTERN.test(ref),
      ) ||
      new Set(revisionOptionRefs).size !== revisionOptionRefs.length
    ) return { status: "denied" };
    const exactOptionRefs = revisionOptionRefs as string[];
    let authority: "authorized" | "denied" | "unavailable";
    try {
      authority = await this.adminAuthority.authorize(input.context);
    } catch {
      authority = "unavailable";
    }
    if (authority !== "authorized") return { status: authority };
    let read: Awaited<ReturnType<NurtureInstitutionKnowledgeReadOwnerV1["readPreviewOptions"]>>;
    try {
      read = await this.reads.readPreviewOptions({
        workspace_id: input.context.workspace_id,
        institution_ref: input.context.institution_ref,
        participant_ref: input.context.participant_ref,
        ...(input.context.role_assignment_ref
          ? { role_assignment_ref: input.context.role_assignment_ref }
          : {}),
        invocation_ref: input.context.invocation_ref,
        revision_option_refs: exactOptionRefs,
      });
    } catch {
      return { status: "unavailable" };
    }
    if (read.status === "unavailable" || read.rows.length !== exactOptionRefs.length) {
      return { status: "unavailable" };
    }
    const byRef = new Map(read.rows.map((row) => [row.revision_option_ref, row.facts]));
    const ordered = exactOptionRefs.map((ref) => byRef.get(ref));
    if (ordered.some((row) => row === undefined)) return { status: "unavailable" };
    const rows = ordered as NurtureInstitutionKnowledgeReadFactsV1[];
    if (
      rows.some(
        (row) =>
          !factsMatchScope(row, input.context.workspace_id, input.context.institution_ref) ||
          !factsAreCoherent(row),
      )
    ) return { status: "unavailable" };
    const sourceCurrentness = await validateAuthoritySources(
      this.authoritySourcesOwner,
      rows,
      input.context.evaluated_at,
    );
    if (sourceCurrentness.status === "unavailable") return sourceCurrentness;
    const options: NurtureInstitutionKnowledgePreviewOptionV1[] = [];
    for (const [index, row] of rows.entries()) {
      const state = deriveInstitutionKnowledgeRevisionState({
        facts: {
          item: row.item,
          revisions: row.revisions,
          events: row.events,
          actor_participant_ref: row.revision.author_participant_ref,
          actor_role_assignment_ref: row.revision.author_role_assignment_ref,
        },
        revision_ref: row.revision.revision_ref,
      });
      if (!state || state === "revoked") return { status: "unavailable" };
      const body = readBody(row, this.protectedContent);
      if (!body || body.body_hash !== row.revision.content_hash) return { status: "unavailable" };
      const warnings = new Set<NurtureInstitutionKnowledgePreviewWarning>();
      if (state === "draft") warnings.add("draft");
      if (state === "superseded") warnings.add("superseded");
      if (latestReview(row) !== "reviewed") warnings.add("unreviewed");
      if (row.revision.valid_from && input.context.evaluated_at < row.revision.valid_from) warnings.add("not_yet_valid");
      if (row.revision.valid_until && input.context.evaluated_at >= row.revision.valid_until) warnings.add("expired");
      if (
        row.revision.safety_class === "basic_health_first_aid" &&
        !hasCurrentAuthoritySource(row, sourceCurrentness.decisions)
      ) warnings.add("authority_source_invalid");
      options.push({
        revision_option_ref: exactOptionRefs[index]!,
        source_ref: row.source.source_ref,
        source_version: row.source.source_version,
        revision_number: row.revision.revision_number,
        state,
        body: body.body,
        warnings: [...warnings],
      });
    }
    return { status: "resolved", options };
  }
}
