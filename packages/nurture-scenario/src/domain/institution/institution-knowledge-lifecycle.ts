import { createHash } from "node:crypto";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import type { ProtectedContentEnvelopeV1 } from "../../harness/protected-content.js";
import { canonicalJsonV1 } from "../commands/command-kernel.js";
import type { NurturePolicyReasonCode } from "./institution-context.js";

export const INSTITUTION_KNOWLEDGE_LIFECYCLE_CONTRACT = {
  key: "nurture.institution-knowledge-lifecycle",
  version: "1.0.0",
} as const;

export const INSTITUTION_KNOWLEDGE_CATEGORIES = [
  "child_communication_development",
  "daily_care_safety",
  "institution_policy",
  "activity_resource",
  "guardian_communication",
  "basic_health_first_aid",
] as const;
export type NurtureInstitutionKnowledgeCategory =
  (typeof INSTITUTION_KNOWLEDGE_CATEGORIES)[number];

export const INSTITUTION_KNOWLEDGE_SAFETY_CLASSES = [
  "general_guidance",
  "care_safety",
  "basic_health_first_aid",
] as const;
export type NurtureInstitutionKnowledgeSafetyClass =
  (typeof INSTITUTION_KNOWLEDGE_SAFETY_CLASSES)[number];

export const INSTITUTION_KNOWLEDGE_AUDIENCES = [
  "institution_admin",
  "caregiver",
  "guardian",
] as const;
export type NurtureInstitutionKnowledgeAudience =
  (typeof INSTITUTION_KNOWLEDGE_AUDIENCES)[number];

export type NurtureInstitutionKnowledgeBodyV1 = {
  title: string;
  summary: string;
  sections: Array<{
    sectionKey: string;
    heading: string;
    body: string;
  }>;
};

/**
 * Trusted service input resolved from an owner provider. It is deliberately
 * not a public authoring DTO: a future Surface accepts source requests, never
 * caller-asserted publisher/currentness evidence.
 */
export type NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1 = {
  authority_source_ref: CanonicalRef;
  source_version: string;
  publisher: string;
  title: string;
  source_date: string;
  deep_link: string;
  excerpt: string;
  verified_at: string;
  snapshot_hash: string;
};

export type NurtureInstitutionKnowledgeItemV1 = {
  item_ref: string;
  workspace_id: string;
  institution_ref: string;
  category: NurtureInstitutionKnowledgeCategory;
  item_head: number;
  latest_revision_ref: string;
  current_published_revision_ref?: string;
  created_at: string;
  updated_at: string;
};

export type NurtureInstitutionKnowledgeRevisionV1 = {
  revision_ref: string;
  item_ref: string;
  workspace_id: string;
  institution_ref: string;
  revision_number: number;
  body_envelope: ProtectedContentEnvelopeV1;
  content_hash: string;
  authorship: "institution_authored";
  intended_audiences: NurtureInstitutionKnowledgeAudience[];
  age_band_keys: string[];
  scenario_keys: string[];
  safety_class: NurtureInstitutionKnowledgeSafetyClass;
  valid_from?: string;
  valid_until?: string;
  author_participant_ref: string;
  author_role_assignment_ref: string;
  created_at: string;
};

export type NurtureInstitutionKnowledgeRevisionSummaryV1 = Omit<
  NurtureInstitutionKnowledgeRevisionV1,
  "body_envelope"
>;

export type NurtureInstitutionKnowledgeRevisionEventType =
  | "revision_created"
  | "revision_superseded"
  | "reviewed"
  | "changes_requested"
  | "published"
  | "publication_superseded"
  | "revoked";

export type NurtureInstitutionKnowledgeRevisionEventV1 = {
  event_ref: string;
  workspace_id: string;
  institution_ref: string;
  item_ref: string;
  revision_ref: string;
  event_type: NurtureInstitutionKnowledgeRevisionEventType;
  item_head: number;
  event_ordinal: number;
  actor_participant_ref: string;
  actor_role_assignment_ref: string;
  reason_key: string;
  command_execution_ref: string;
  occurred_at: string;
};

export type NurtureInstitutionKnowledgeRevisionState =
  | "draft"
  | "published"
  | "superseded"
  | "revoked";

export type NurtureInstitutionKnowledgeCommandFacts = {
  actor_participant_ref: string;
  actor_role_assignment_ref: string;
  item?: NurtureInstitutionKnowledgeItemV1;
  revisions: NurtureInstitutionKnowledgeRevisionSummaryV1[];
  events: NurtureInstitutionKnowledgeRevisionEventV1[];
};

export type NurtureInstitutionKnowledgeCommandFactsResult =
  | { status: "resolved"; facts: NurtureInstitutionKnowledgeCommandFacts }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

type KnowledgeAuthoringMetadata = {
  intended_audiences: NurtureInstitutionKnowledgeAudience[];
  age_band_keys?: string[];
  scenario_keys?: string[];
  safety_class: NurtureInstitutionKnowledgeSafetyClass;
  valid_from?: string;
  valid_until?: string;
  verified_authority_links?: NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1[];
};

type CommonCommandPayload = {
  workspace_id: string;
  institution_ref: string;
  role_assignment_ref: string;
};

export type NurtureCreateInstitutionKnowledgeItemPayload = CommonCommandPayload &
  KnowledgeAuthoringMetadata & {
    category: NurtureInstitutionKnowledgeCategory;
    body: NurtureInstitutionKnowledgeBodyV1;
  };

export type NurtureCreateInstitutionKnowledgeRevisionPayload = CommonCommandPayload &
  KnowledgeAuthoringMetadata & {
    item_ref: string;
    expected_item_head: number;
    body: NurtureInstitutionKnowledgeBodyV1;
  };

export type NurtureRecordInstitutionKnowledgeReviewPayload = CommonCommandPayload & {
  item_ref: string;
  revision_ref: string;
  expected_item_head: number;
  decision: "reviewed" | "changes_requested";
  reason_key: string;
};

export type NurturePublishInstitutionKnowledgeRevisionPayload = CommonCommandPayload & {
  item_ref: string;
  revision_ref: string;
  expected_item_head: number;
};

export type NurtureRevokeInstitutionKnowledgeRevisionPayload = CommonCommandPayload & {
  item_ref: string;
  revision_ref: string;
  expected_item_head: number;
  reason_key: string;
};

export type NurtureInstitutionKnowledgeCommand =
  | ({ action: "create_institution_knowledge_item" } &
      NurtureCreateInstitutionKnowledgeItemPayload)
  | ({ action: "create_institution_knowledge_revision" } &
      NurtureCreateInstitutionKnowledgeRevisionPayload)
  | ({ action: "record_institution_knowledge_review" } &
      NurtureRecordInstitutionKnowledgeReviewPayload)
  | ({ action: "publish_institution_knowledge_revision" } &
      NurturePublishInstitutionKnowledgeRevisionPayload)
  | ({ action: "revoke_institution_knowledge_revision" } &
      NurtureRevokeInstitutionKnowledgeRevisionPayload);

export type NurtureInstitutionKnowledgeDecision =
  | {
      status: "ready";
      action: NurtureInstitutionKnowledgeCommand["action"];
      next_item_head: number;
      revision_number: number;
      resulting_state: NurtureInstitutionKnowledgeRevisionState;
      superseded_revision_ref?: string;
    }
  | {
      status: "denied";
      layer: "contract" | "authority" | "concurrency" | "state";
      reason_code: string;
    }
  | { status: "unavailable"; reason_code: string };

const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const TOKEN_PATTERN = /^[a-z][a-z0-9._:-]{0,99}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const SOURCE_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CANONICAL_BODY_BYTES = 8_192;
const MAX_AGE_BANDS = 16;
const MAX_SCENARIO_KEYS = 16;
const MAX_AUTHORITY_LINKS = 16;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
};

const validRef = (value: unknown): value is string =>
  typeof value === "string" && REF_PATTERN.test(value);

const validHead = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const validBoundedText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const validIsoInstant = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const validIsoDate = (value: unknown): value is string =>
  typeof value === "string" &&
  ISO_DATE_PATTERN.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

const validUniqueTokens = (
  value: unknown,
  max: number,
  requireNonEmpty = false,
): value is string[] =>
  Array.isArray(value) &&
  (!requireNonEmpty || value.length > 0) &&
  value.length <= max &&
  value.every((entry) => typeof entry === "string" && TOKEN_PATTERN.test(entry)) &&
  new Set(value).size === value.length;

export const validateInstitutionKnowledgeBody = (
  value: unknown,
): value is NurtureInstitutionKnowledgeBodyV1 => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["title", "summary", "sections"]) ||
    !validBoundedText(value.title, 200) ||
    !validBoundedText(value.summary, 1_000) ||
    !Array.isArray(value.sections) ||
    value.sections.length < 1 ||
    value.sections.length > 16
  ) {
    return false;
  }
  const sectionKeys = new Set<string>();
  for (const section of value.sections) {
    if (
      !isRecord(section) ||
      !hasExactKeys(section, ["sectionKey", "heading", "body"]) ||
      typeof section.sectionKey !== "string" ||
      !TOKEN_PATTERN.test(section.sectionKey) ||
      sectionKeys.has(section.sectionKey) ||
      !validBoundedText(section.heading, 160) ||
      !validBoundedText(section.body, 4_000)
    ) {
      return false;
    }
    sectionKeys.add(section.sectionKey);
  }
  return Buffer.byteLength(canonicalJsonV1(value), "utf8") <= MAX_CANONICAL_BODY_BYTES;
};

const authoritySnapshotSeed = (
  value: Omit<NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1, "snapshot_hash">,
): string => canonicalJsonV1(value);

export const hashInstitutionKnowledgeAuthoritySnapshot = (
  value: Omit<NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1, "snapshot_hash">,
): string => createHash("sha256").update(authoritySnapshotSeed(value), "utf8").digest("hex");

export const validateInstitutionKnowledgeAuthorityLink = (
  value: unknown,
): value is NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1 => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "authority_source_ref",
      "source_version",
      "publisher",
      "title",
      "source_date",
      "deep_link",
      "excerpt",
      "verified_at",
      "snapshot_hash",
    ]) ||
    typeof value.source_version !== "string" ||
    !SOURCE_VERSION_PATTERN.test(value.source_version) ||
    !validBoundedText(value.publisher, 200) ||
    !validBoundedText(value.title, 300) ||
    !validIsoDate(value.source_date) ||
    !validBoundedText(value.deep_link, 2_048) ||
    !validBoundedText(value.excerpt, 1_000) ||
    !validIsoInstant(value.verified_at) ||
    typeof value.snapshot_hash !== "string" ||
    !HASH_PATTERN.test(value.snapshot_hash)
  ) {
    return false;
  }
  try {
    assertCanonicalRef(value.authority_source_ref);
    const url = new URL(value.deep_link);
    if (url.protocol !== "https:" || url.username || url.password) return false;
  } catch {
    return false;
  }
  const snapshot = value as NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1;
  const { snapshot_hash: _snapshotHash, ...seed } = snapshot;
  return hashInstitutionKnowledgeAuthoritySnapshot(seed) === snapshot.snapshot_hash;
};

const validateMetadata = (command: Record<string, unknown>): boolean => {
  if (
    !Array.isArray(command.intended_audiences) ||
    command.intended_audiences.length === 0 ||
    command.intended_audiences.length > INSTITUTION_KNOWLEDGE_AUDIENCES.length ||
    command.intended_audiences.some(
      (value) =>
        typeof value !== "string" ||
        !(INSTITUTION_KNOWLEDGE_AUDIENCES as readonly string[]).includes(value),
    ) ||
    new Set(command.intended_audiences).size !== command.intended_audiences.length ||
    !validUniqueTokens(command.age_band_keys ?? [], MAX_AGE_BANDS) ||
    !validUniqueTokens(command.scenario_keys ?? [], MAX_SCENARIO_KEYS) ||
    typeof command.safety_class !== "string" ||
    !(INSTITUTION_KNOWLEDGE_SAFETY_CLASSES as readonly string[]).includes(
      command.safety_class,
    ) ||
    (command.valid_from !== undefined && !validIsoInstant(command.valid_from)) ||
    (command.valid_until !== undefined && !validIsoInstant(command.valid_until))
  ) {
    return false;
  }
  if (
    typeof command.valid_from === "string" &&
    typeof command.valid_until === "string" &&
    command.valid_from >= command.valid_until
  ) {
    return false;
  }
  const links = command.verified_authority_links ?? [];
  if (
    !Array.isArray(links) ||
    links.length > MAX_AUTHORITY_LINKS ||
    !links.every(validateInstitutionKnowledgeAuthorityLink)
  ) {
    return false;
  }
  const identities = links.map((link) =>
    canonicalJsonV1([link.authority_source_ref, link.source_version]),
  );
  return new Set(identities).size === identities.length;
};

const validCommon = (command: Record<string, unknown>): boolean =>
  validRef(command.workspace_id) &&
  validRef(command.institution_ref) &&
  validRef(command.role_assignment_ref);

export const validateInstitutionKnowledgeCommand = (
  value: unknown,
): { status: "valid" } | { status: "invalid"; reason_code: "contract_mismatch" } => {
  if (!isRecord(value) || typeof value.action !== "string" || !validCommon(value)) {
    return { status: "invalid", reason_code: "contract_mismatch" };
  }
  const common = ["action", "workspace_id", "institution_ref", "role_assignment_ref"];
  const metadataRequired = ["intended_audiences", "safety_class"];
  const metadataOptional = [
    "age_band_keys",
    "scenario_keys",
    "valid_from",
    "valid_until",
    "verified_authority_links",
  ];
  switch (value.action) {
    case "create_institution_knowledge_item":
      if (
        !hasExactKeys(
          value,
          [...common, "category", "body", ...metadataRequired],
          metadataOptional,
        ) ||
        typeof value.category !== "string" ||
        !(INSTITUTION_KNOWLEDGE_CATEGORIES as readonly string[]).includes(value.category) ||
        !validateInstitutionKnowledgeBody(value.body) ||
        !validateMetadata(value)
      ) {
        return { status: "invalid", reason_code: "contract_mismatch" };
      }
      break;
    case "create_institution_knowledge_revision":
      if (
        !hasExactKeys(
          value,
          [...common, "item_ref", "expected_item_head", "body", ...metadataRequired],
          metadataOptional,
        ) ||
        !validRef(value.item_ref) ||
        !validHead(value.expected_item_head) ||
        !validateInstitutionKnowledgeBody(value.body) ||
        !validateMetadata(value)
      ) {
        return { status: "invalid", reason_code: "contract_mismatch" };
      }
      break;
    case "record_institution_knowledge_review":
      if (
        !hasExactKeys(value, [
          ...common,
          "item_ref",
          "revision_ref",
          "expected_item_head",
          "decision",
          "reason_key",
        ]) ||
        !validRef(value.item_ref) ||
        !validRef(value.revision_ref) ||
        !validHead(value.expected_item_head) ||
        (value.decision !== "reviewed" && value.decision !== "changes_requested") ||
        typeof value.reason_key !== "string" ||
        !TOKEN_PATTERN.test(value.reason_key)
      ) {
        return { status: "invalid", reason_code: "contract_mismatch" };
      }
      break;
    case "publish_institution_knowledge_revision":
      if (
        !hasExactKeys(value, [
          ...common,
          "item_ref",
          "revision_ref",
          "expected_item_head",
        ]) ||
        !validRef(value.item_ref) ||
        !validRef(value.revision_ref) ||
        !validHead(value.expected_item_head)
      ) {
        return { status: "invalid", reason_code: "contract_mismatch" };
      }
      break;
    case "revoke_institution_knowledge_revision":
      if (
        !hasExactKeys(value, [
          ...common,
          "item_ref",
          "revision_ref",
          "expected_item_head",
          "reason_key",
        ]) ||
        !validRef(value.item_ref) ||
        !validRef(value.revision_ref) ||
        !validHead(value.expected_item_head) ||
        typeof value.reason_key !== "string" ||
        !TOKEN_PATTERN.test(value.reason_key)
      ) {
        return { status: "invalid", reason_code: "contract_mismatch" };
      }
      break;
    default:
      return { status: "invalid", reason_code: "contract_mismatch" };
  }
  return { status: "valid" };
};

const sortedUnique = <Value extends string>(values: readonly Value[] | undefined): Value[] =>
  [...new Set(values ?? [])].sort();

export const canonicalizeInstitutionKnowledgeCommand = (
  command: NurtureInstitutionKnowledgeCommand,
): unknown => {
  if (
    command.action !== "create_institution_knowledge_item" &&
    command.action !== "create_institution_knowledge_revision"
  ) {
    return command;
  }
  return {
    ...command,
    intended_audiences: sortedUnique(command.intended_audiences),
    age_band_keys: sortedUnique(command.age_band_keys),
    scenario_keys: sortedUnique(command.scenario_keys),
    verified_authority_links: [...(command.verified_authority_links ?? [])].sort((left, right) =>
      canonicalJsonV1([left.authority_source_ref, left.source_version]).localeCompare(
        canonicalJsonV1([right.authority_source_ref, right.source_version]),
      ),
    ),
  };
};

const validRevisionChain = (facts: NurtureInstitutionKnowledgeCommandFacts): boolean => {
  if (!facts.item) return facts.revisions.length === 0 && facts.events.length === 0;
  if (facts.revisions.length === 0) return false;
  if (!facts.revisions.every(
    (revision, index) =>
      revision.item_ref === facts.item?.item_ref &&
      revision.workspace_id === facts.item.workspace_id &&
      revision.institution_ref === facts.item.institution_ref &&
      revision.revision_number === index + 1,
  ) || facts.revisions.at(-1)?.revision_ref !== facts.item.latest_revision_ref) {
    return false;
  }
  const revisionRefs = new Set(facts.revisions.map((revision) => revision.revision_ref));
  if (
    !revisionRefs.has(facts.item.latest_revision_ref) ||
    (facts.item.current_published_revision_ref !== undefined &&
      !revisionRefs.has(facts.item.current_published_revision_ref))
  ) {
    return false;
  }
  const heads = new Map<number, number[]>();
  for (const event of facts.events) {
    if (
      event.item_ref !== facts.item.item_ref ||
      event.workspace_id !== facts.item.workspace_id ||
      event.institution_ref !== facts.item.institution_ref ||
      !revisionRefs.has(event.revision_ref) ||
      event.item_head < 1 ||
      event.item_head > facts.item.item_head ||
      event.event_ordinal < 0 ||
      event.event_ordinal > 1
    ) {
      return false;
    }
    const ordinals = heads.get(event.item_head) ?? [];
    ordinals.push(event.event_ordinal);
    heads.set(event.item_head, ordinals);
  }
  if (heads.size !== facts.item.item_head) return false;
  for (let head = 1; head <= facts.item.item_head; head += 1) {
    const ordinals = [...(heads.get(head) ?? [])].sort();
    if (
      ordinals.length < 1 ||
      ordinals.some((ordinal, index) => ordinal !== index)
    ) {
      return false;
    }
  }
  return facts.revisions.every(
    (revision) =>
      facts.events.filter(
        (event) =>
          event.revision_ref === revision.revision_ref &&
          event.event_type === "revision_created",
      ).length === 1,
  );
};

export const deriveInstitutionKnowledgeRevisionState = (input: {
  facts: NurtureInstitutionKnowledgeCommandFacts;
  revision_ref: string;
}): NurtureInstitutionKnowledgeRevisionState | null => {
  const { item } = input.facts;
  if (!item || !input.facts.revisions.some((row) => row.revision_ref === input.revision_ref)) {
    return null;
  }
  if (item.current_published_revision_ref === input.revision_ref) return "published";
  const lastLifecycleEvent = [...input.facts.events]
    .filter(
      (event) =>
        event.revision_ref === input.revision_ref &&
        ["revision_superseded", "publication_superseded", "revoked"].includes(
          event.event_type,
        ),
    )
    .sort((left, right) =>
      left.item_head - right.item_head || left.event_ordinal - right.event_ordinal,
    )
    .at(-1);
  if (lastLifecycleEvent?.event_type === "revoked") return "revoked";
  if (lastLifecycleEvent) return "superseded";
  return item.latest_revision_ref === input.revision_ref ? "draft" : "superseded";
};

export const decideInstitutionKnowledgeCommand = (input: {
  command: NurtureInstitutionKnowledgeCommand;
  facts: NurtureInstitutionKnowledgeCommandFacts;
}): NurtureInstitutionKnowledgeDecision => {
  if (validateInstitutionKnowledgeCommand(input.command).status !== "valid") {
    return { status: "denied", layer: "contract", reason_code: "contract_mismatch" };
  }
  if (
    input.facts.actor_role_assignment_ref !== input.command.role_assignment_ref ||
    !validRef(input.facts.actor_participant_ref)
  ) {
    return { status: "denied", layer: "authority", reason_code: "not_authorized" };
  }
  if (!validRevisionChain(input.facts)) {
    return { status: "unavailable", reason_code: "knowledge_revision_chain_unavailable" };
  }
  if (input.command.action === "create_institution_knowledge_item") {
    if (input.facts.item) {
      return { status: "denied", layer: "state", reason_code: "knowledge_item_conflict" };
    }
    return {
      status: "ready",
      action: input.command.action,
      next_item_head: 1,
      revision_number: 1,
      resulting_state: "draft",
    };
  }
  const item = input.facts.item;
  if (
    !item ||
    item.item_ref !== input.command.item_ref ||
    item.workspace_id !== input.command.workspace_id ||
    item.institution_ref !== input.command.institution_ref
  ) {
    return { status: "denied", layer: "authority", reason_code: "not_authorized" };
  }
  if (item.item_head !== input.command.expected_item_head) {
    return { status: "denied", layer: "concurrency", reason_code: "item_head_conflict" };
  }
  const nextHead = item.item_head + 1;
  if (input.command.action === "create_institution_knowledge_revision") {
    const latestState = deriveInstitutionKnowledgeRevisionState({
      facts: input.facts,
      revision_ref: item.latest_revision_ref,
    });
    return {
      status: "ready",
      action: input.command.action,
      next_item_head: nextHead,
      revision_number: input.facts.revisions.length + 1,
      resulting_state: "draft",
      ...(latestState === "draft" ? { superseded_revision_ref: item.latest_revision_ref } : {}),
    };
  }
  if (!("revision_ref" in input.command)) {
    return { status: "unavailable", reason_code: "knowledge_command_shape_unavailable" };
  }
  const targetRevisionRef = input.command.revision_ref;
  const revision = input.facts.revisions.find(
    (candidate) => candidate.revision_ref === targetRevisionRef,
  );
  if (!revision) {
    return { status: "denied", layer: "authority", reason_code: "not_authorized" };
  }
  if (input.command.action === "record_institution_knowledge_review") {
    return {
      status: "ready",
      action: input.command.action,
      next_item_head: nextHead,
      revision_number: revision.revision_number,
      resulting_state:
        deriveInstitutionKnowledgeRevisionState({
          facts: input.facts,
          revision_ref: revision.revision_ref,
        }) ?? "superseded",
    };
  }
  if (input.command.action === "publish_institution_knowledge_revision") {
    if (
      item.latest_revision_ref !== revision.revision_ref ||
      item.current_published_revision_ref === revision.revision_ref
    ) {
      return {
        status: "denied",
        layer: "state",
        reason_code: "revision_not_current_draft",
      };
    }
    return {
      status: "ready",
      action: input.command.action,
      next_item_head: nextHead,
      revision_number: revision.revision_number,
      resulting_state: "published",
      ...(item.current_published_revision_ref
        ? { superseded_revision_ref: item.current_published_revision_ref }
        : {}),
    };
  }
  if (item.current_published_revision_ref !== revision.revision_ref) {
    return {
      status: "denied",
      layer: "state",
      reason_code: "revision_not_current_publication",
    };
  }
  return {
    status: "ready",
    action: input.command.action,
    next_item_head: nextHead,
    revision_number: revision.revision_number,
    resulting_state: "revoked",
  };
};
