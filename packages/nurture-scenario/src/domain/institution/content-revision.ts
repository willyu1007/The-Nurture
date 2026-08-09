import type { NurtureCommandSpec } from "../commands/command-kernel.js";
import { hashCommandRequestId } from "../commands/command-kernel.js";
import {
  assertProtectedContentEnvelopeV1,
  type ProtectedContentEnvelopeV1,
} from "../../harness/protected-content.js";
import type { NurtureActivityPlacementDecidedBy } from "./class-schedule-placement.js";
import type { NurturePolicyReasonCode } from "./institution-context.js";

/** G4-C 0D-3, frozen by 28-g4-0d-3-revision-downscope-freeze.md. */
export const CONTENT_REVISION_CONTRACT = {
  key: "nurture.content-revision-downscope",
  version: "1.0.0",
} as const;

export type NurtureContentRevisionSubjectKind =
  | "placement"
  | "visibility"
  | "institution_note";

export type NurtureContentRevisionTarget =
  | {
      target_kind: "activity_placement";
      source_kind: string;
      source_ref: string;
    }
  | {
      target_kind: "care_capture" | "media_asset_ref";
      target_ref: string;
    };

export type NurturePlacementRevisionValueV1 = {
  state: "placed" | "unplaced";
  activity_ref: string | null;
  decided_by: NurtureActivityPlacementDecidedBy;
};

/**
 * The restrictions 0D-3 itself owns, not a second copy of the audience or
 * Grant owners. The neutral value says only that this lane has imposed no
 * additional restriction. Every transition is monotone: flags can tighten
 * and audience keys can only be added.
 */
export type NurtureContentVisibilityValueV1 = {
  hidden: boolean;
  publication_eligible: boolean;
  restricted_audiences: string[];
};

export type NurtureInstitutionNoteValueV1 = {
  body_envelope: ProtectedContentEnvelopeV1 | null;
};

export type NurtureContentRevisionValueV1 =
  | NurturePlacementRevisionValueV1
  | NurtureContentVisibilityValueV1
  | NurtureInstitutionNoteValueV1;

export type NurtureContentRevisionV1 = {
  contract_version: typeof CONTENT_REVISION_CONTRACT.version;
  revision_ref: string;
  subject_ref: string;
  subject_kind: NurtureContentRevisionSubjectKind;
  previous_value: NurtureContentRevisionValueV1;
  new_value: NurtureContentRevisionValueV1;
  decided_by_before?: NurtureActivityPlacementDecidedBy;
  actor_ref: string;
  reason: string;
  supersedes_ref?: string;
  revision_head: number;
  occurred_at: string;
};

export type NurtureContentRevisionFacts = {
  subject_ref: string;
  subject_kind: NurtureContentRevisionSubjectKind;
  actor_role_assignment_ref: string;
  revisions: NurtureContentRevisionV1[];
  current_placement?: NurturePlacementRevisionValueV1 & { placement_head: number };
  available_activity_refs?: string[];
};

export type NurtureContentRevisionFactsResult =
  | { status: "resolved"; facts: NurtureContentRevisionFacts }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export type NurtureContentRevisionRepository = {
  loadContentRevisionFacts(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    subject_kind: NurtureContentRevisionSubjectKind;
    target: NurtureContentRevisionTarget;
  }): Promise<NurtureContentRevisionFactsResult>;
};

export type NurtureContentRevisionTransaction = NurtureContentRevisionRepository & {
  appendContentRevision(input: {
    workspace_id: string;
    target: NurtureContentRevisionTarget;
    subject_ref: string;
    subject_kind: NurtureContentRevisionSubjectKind;
    previous_value: NurtureContentRevisionValueV1;
    new_value: NurtureContentRevisionValueV1;
    decided_by_before?: NurtureActivityPlacementDecidedBy;
    actor_role_assignment_ref: string;
    reason: string;
    supersedes_ref?: string;
    revision_head: number;
    expected_placement_head?: number;
    command_request_id_hash: string;
  }): Promise<
    | { committed: true; revision: NurtureContentRevisionV1; placement_head?: number }
    | { committed: false }
  >;
};

type CommonPayload = {
  workspace_id: string;
  role_assignment_ref: string;
  expected_revision_head: number;
  reason: string;
};

export type NurtureAdjustActivityPlacementPayload = CommonPayload & {
  source_kind: string;
  source_ref: string;
  activity_ref: string | null;
  expected_placement_head: number;
};

export type NurtureDownscopeContentVisibilityPayload = CommonPayload & {
  target_kind: "care_capture" | "media_asset_ref";
  target_ref: string;
  hide?: true;
  suspend_publication?: true;
  restrict_audiences?: string[];
};

export type NurtureAddInstitutionNotePayload = CommonPayload & {
  target_kind: "care_capture" | "media_asset_ref";
  target_ref: string;
  note_body_envelope: ProtectedContentEnvelopeV1;
};

export type NurtureContentRevisionCommand =
  | ({ action: "adjust_activity_placement" } & NurtureAdjustActivityPlacementPayload)
  | ({ action: "downscope_content_visibility" } & NurtureDownscopeContentVisibilityPayload)
  | ({ action: "add_institution_note" } & NurtureAddInstitutionNotePayload);

export type NurtureContentRevisionDecision =
  | {
      status: "ready";
      subject_ref: string;
      subject_kind: NurtureContentRevisionSubjectKind;
      previous_value: NurtureContentRevisionValueV1;
      new_value: NurtureContentRevisionValueV1;
      decided_by_before?: NurtureActivityPlacementDecidedBy;
      actor_role_assignment_ref: string;
      reason: string;
      supersedes_ref?: string;
      revision_head: number;
      expected_placement_head?: number;
    }
  | { status: "already_satisfied"; revision?: NurtureContentRevisionV1; placement_head?: number }
  | {
      status: "denied";
      layer: "contract" | "authority" | "concurrency";
      reason_code: string;
    }
  | { status: "unavailable"; reason_code: string };

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const MAX_REASON_LENGTH = 1_000;
const MAX_AUDIENCE_RESTRICTIONS = 32;

const VISIBILITY_BASELINE: NurtureContentVisibilityValueV1 = {
  hidden: false,
  publication_eligible: true,
  restricted_audiences: [],
};

const NOTE_BASELINE: NurtureInstitutionNoteValueV1 = { body_envelope: null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (value: object, keys: readonly string[]): boolean =>
  Object.keys(value).every((key) => keys.includes(key));

const validReference = (value: unknown): value is string =>
  typeof value === "string" && REFERENCE_PATTERN.test(value);

const validHead = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const normalizePlacement = (value: unknown): NurturePlacementRevisionValueV1 | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["state", "activity_ref", "decided_by"])) {
    return null;
  }
  const state = value.state;
  const activityRef = value.activity_ref;
  const decidedBy = value.decided_by;
  if (
    (state !== "placed" && state !== "unplaced") ||
    ![
      "source_binding",
      "day_override",
      "schedule_window",
      "assisted",
      "admin",
    ].includes(String(decidedBy)) ||
    (state === "placed" ? !validReference(activityRef) : activityRef !== null)
  ) {
    return null;
  }
  return {
    state,
    activity_ref: activityRef as string | null,
    decided_by: decidedBy as NurtureActivityPlacementDecidedBy,
  };
};

const normalizeVisibility = (value: unknown): NurtureContentVisibilityValueV1 | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["hidden", "publication_eligible", "restricted_audiences"]) ||
    typeof value.hidden !== "boolean" ||
    typeof value.publication_eligible !== "boolean" ||
    !Array.isArray(value.restricted_audiences) ||
    value.restricted_audiences.length > MAX_AUDIENCE_RESTRICTIONS ||
    value.restricted_audiences.some((entry) => !validReference(entry))
  ) {
    return null;
  }
  const audiences = [...new Set(value.restricted_audiences as string[])].sort();
  if (audiences.length !== value.restricted_audiences.length) return null;
  return {
    hidden: value.hidden,
    publication_eligible: value.publication_eligible,
    restricted_audiences: audiences,
  };
};

const normalizeNote = (value: unknown): NurtureInstitutionNoteValueV1 | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["body_envelope"])) return null;
  if (value.body_envelope === null) return NOTE_BASELINE;
  try {
    return { body_envelope: assertProtectedContentEnvelopeV1(value.body_envelope) };
  } catch {
    return null;
  }
};

const normalizeValue = (
  kind: NurtureContentRevisionSubjectKind,
  value: unknown,
): NurtureContentRevisionValueV1 | null => {
  switch (kind) {
    case "placement":
      return normalizePlacement(value);
    case "visibility":
      return normalizeVisibility(value);
    case "institution_note":
      return normalizeNote(value);
  }
};

const isMonotoneVisibility = (
  previous: NurtureContentVisibilityValueV1,
  next: NurtureContentVisibilityValueV1,
): boolean =>
  (!previous.hidden || next.hidden) &&
  (previous.publication_eligible || !next.publication_eligible) &&
  previous.restricted_audiences.every((audience) =>
    next.restricted_audiences.includes(audience),
  );

/**
 * Validates the whole chain before exposing or extending it. A truncated,
 * forked, gapped or cross-lane history is unavailable, never a partial answer.
 */
export const currentContentRevisionValue = (
  facts: NurtureContentRevisionFacts,
):
  | {
      status: "valid";
      current_value: NurtureContentRevisionValueV1;
      current_revision?: NurtureContentRevisionV1;
    }
  | { status: "unavailable"; reason_code: string } => {
  let previousRevision: NurtureContentRevisionV1 | undefined;
  let currentValue: NurtureContentRevisionValueV1 | undefined;
  for (const [index, revision] of facts.revisions.entries()) {
    const previousValue = normalizeValue(facts.subject_kind, revision.previous_value);
    const newValue = normalizeValue(facts.subject_kind, revision.new_value);
    if (
      revision.contract_version !== CONTENT_REVISION_CONTRACT.version ||
      revision.subject_ref !== facts.subject_ref ||
      revision.subject_kind !== facts.subject_kind ||
      revision.revision_head !== index + 1 ||
      !previousValue ||
      !newValue ||
      (previousRevision
        ? revision.supersedes_ref !== previousRevision.revision_ref ||
          !sameValue(previousValue, currentValue)
        : revision.supersedes_ref !== undefined)
    ) {
      return { status: "unavailable", reason_code: "incomplete_revision_chain" };
    }
    if (
      facts.subject_kind === "placement" &&
      revision.decided_by_before !== (previousValue as NurturePlacementRevisionValueV1).decided_by
    ) {
      return { status: "unavailable", reason_code: "invalid_placement_revision" };
    }
    if (facts.subject_kind !== "placement" && revision.decided_by_before !== undefined) {
      return { status: "unavailable", reason_code: "invalid_revision_lane" };
    }
    if (
      facts.subject_kind === "visibility" &&
      !isMonotoneVisibility(
        previousValue as NurtureContentVisibilityValueV1,
        newValue as NurtureContentVisibilityValueV1,
      )
    ) {
      return { status: "unavailable", reason_code: "non_monotone_visibility_chain" };
    }
    previousRevision = revision;
    currentValue = newValue;
  }

  if (facts.subject_kind === "placement") {
    const placement = facts.current_placement;
    if (!placement) return { status: "unavailable", reason_code: "placement_owner_unavailable" };
    const normalized = normalizePlacement({
      state: placement.state,
      activity_ref: placement.activity_ref,
      decided_by: placement.decided_by,
    });
    if (!currentValue && placement.decided_by === "admin") {
      return { status: "unavailable", reason_code: "untracked_admin_placement" };
    }
    if (!normalized || (currentValue && !sameValue(currentValue, normalized))) {
      return { status: "unavailable", reason_code: "placement_revision_drift" };
    }
    return {
      status: "valid",
      current_value: currentValue ?? normalized,
      ...(previousRevision ? { current_revision: previousRevision } : {}),
    };
  }

  const baseline = facts.subject_kind === "visibility" ? VISIBILITY_BASELINE : NOTE_BASELINE;
  if (facts.revisions.length > 0) {
    const firstPrevious = normalizeValue(facts.subject_kind, facts.revisions[0]!.previous_value);
    if (!firstPrevious || !sameValue(firstPrevious, baseline)) {
      return { status: "unavailable", reason_code: "invalid_revision_origin" };
    }
  }
  return {
    status: "valid",
    current_value: currentValue ?? baseline,
    ...(previousRevision ? { current_revision: previousRevision } : {}),
  };
};

const commonPayloadValid = (command: NurtureContentRevisionCommand): boolean =>
  validReference(command.workspace_id) &&
  validReference(command.role_assignment_ref) &&
  validHead(command.expected_revision_head) &&
  typeof command.reason === "string" &&
  command.reason.trim().length > 0 &&
  command.reason.length <= MAX_REASON_LENGTH;

export const validateContentRevisionCommand = (
  command: NurtureContentRevisionCommand,
): { status: "valid" } | { status: "invalid"; reason_code: "contract_mismatch" } => {
  if (!commonPayloadValid(command)) return { status: "invalid", reason_code: "contract_mismatch" };
  switch (command.action) {
    case "adjust_activity_placement":
      return hasOnlyKeys(command, [
        "action",
        "workspace_id",
        "role_assignment_ref",
        "expected_revision_head",
        "reason",
        "source_kind",
        "source_ref",
        "activity_ref",
        "expected_placement_head",
      ]) &&
        validReference(command.source_kind) &&
        validReference(command.source_ref) &&
        (command.activity_ref === null || validReference(command.activity_ref)) &&
        validHead(command.expected_placement_head) &&
        command.expected_placement_head >= 1
        ? { status: "valid" }
        : { status: "invalid", reason_code: "contract_mismatch" };

    case "downscope_content_visibility": {
      const audiences = command.restrict_audiences ?? [];
      const valid =
        hasOnlyKeys(command, [
          "action",
          "workspace_id",
          "role_assignment_ref",
          "expected_revision_head",
          "reason",
          "target_kind",
          "target_ref",
          "hide",
          "suspend_publication",
          "restrict_audiences",
        ]) &&
        (command.target_kind === "care_capture" || command.target_kind === "media_asset_ref") &&
        validReference(command.target_ref) &&
        (command.hide === undefined || command.hide === true) &&
        (command.suspend_publication === undefined || command.suspend_publication === true) &&
        Array.isArray(audiences) &&
        audiences.length <= MAX_AUDIENCE_RESTRICTIONS &&
        audiences.every(validReference) &&
        new Set(audiences).size === audiences.length &&
        (command.hide === true || command.suspend_publication === true || audiences.length > 0);
      return valid
        ? { status: "valid" }
        : { status: "invalid", reason_code: "contract_mismatch" };
    }

    case "add_institution_note":
      try {
        if (
          !hasOnlyKeys(command, [
            "action",
            "workspace_id",
            "role_assignment_ref",
            "expected_revision_head",
            "reason",
            "target_kind",
            "target_ref",
            "note_body_envelope",
          ]) ||
          (command.target_kind !== "care_capture" && command.target_kind !== "media_asset_ref") ||
          !validReference(command.target_ref)
        ) {
          return { status: "invalid", reason_code: "contract_mismatch" };
        }
        assertProtectedContentEnvelopeV1(command.note_body_envelope);
        return { status: "valid" };
      } catch {
        return { status: "invalid", reason_code: "contract_mismatch" };
      }
  }
};

export const contentRevisionTargetOf = (
  command: NurtureContentRevisionCommand,
): NurtureContentRevisionTarget =>
  command.action === "adjust_activity_placement"
    ? {
        target_kind: "activity_placement",
        source_kind: command.source_kind,
        source_ref: command.source_ref,
      }
    : { target_kind: command.target_kind, target_ref: command.target_ref };

export const contentRevisionSubjectKindOf = (
  command: NurtureContentRevisionCommand,
): NurtureContentRevisionSubjectKind => {
  switch (command.action) {
    case "adjust_activity_placement":
      return "placement";
    case "downscope_content_visibility":
      return "visibility";
    case "add_institution_note":
      return "institution_note";
  }
};

/** 0D-3's one rule engine; repositories only resolve facts and persist it. */
export const decideContentRevision = (input: {
  command: NurtureContentRevisionCommand;
  facts: NurtureContentRevisionFacts;
}): NurtureContentRevisionDecision => {
  const valid = validateContentRevisionCommand(input.command);
  if (valid.status === "invalid") {
    return { status: "denied", layer: "contract", reason_code: valid.reason_code };
  }
  const command = input.command;
  const expectedKind = contentRevisionSubjectKindOf(command);
  if (input.facts.subject_kind !== expectedKind) {
    return { status: "unavailable", reason_code: "revision_lane_mismatch" };
  }
  const chain = currentContentRevisionValue(input.facts);
  if (chain.status === "unavailable") return chain;
  const currentHead = chain.current_revision?.revision_head ?? 0;
  if (command.expected_revision_head !== currentHead) {
    return { status: "denied", layer: "concurrency", reason_code: "conflict" };
  }

  let nextValue: NurtureContentRevisionValueV1;
  let decidedByBefore: NurtureActivityPlacementDecidedBy | undefined;
  let expectedPlacementHead: number | undefined;
  if (command.action === "adjust_activity_placement") {
    const current = input.facts.current_placement;
    if (!current) return { status: "unavailable", reason_code: "placement_owner_unavailable" };
    if (command.expected_placement_head !== current.placement_head) {
      return { status: "denied", layer: "concurrency", reason_code: "conflict" };
    }
    if (!input.facts.available_activity_refs) {
      return { status: "unavailable", reason_code: "activity_owner_unavailable" };
    }
    if (
      command.activity_ref !== null &&
      !input.facts.available_activity_refs.includes(command.activity_ref)
    ) {
      return { status: "denied", layer: "authority", reason_code: "not_authorized" };
    }
    nextValue = {
      state: command.activity_ref === null ? "unplaced" : "placed",
      activity_ref: command.activity_ref,
      decided_by: "admin",
    };
    decidedByBefore = current.decided_by;
    expectedPlacementHead = command.expected_placement_head;
  } else if (command.action === "downscope_content_visibility") {
    const current = chain.current_value as NurtureContentVisibilityValueV1;
    nextValue = {
      hidden: current.hidden || command.hide === true,
      publication_eligible:
        current.publication_eligible && command.suspend_publication !== true,
      restricted_audiences: [
        ...new Set([...current.restricted_audiences, ...(command.restrict_audiences ?? [])]),
      ].sort(),
    };
    if (!isMonotoneVisibility(current, nextValue)) {
      return { status: "denied", layer: "contract", reason_code: "not_authorized" };
    }
  } else {
    nextValue = {
      body_envelope: assertProtectedContentEnvelopeV1(command.note_body_envelope),
    };
  }

  if (sameValue(chain.current_value, nextValue)) {
    return {
      status: "already_satisfied",
      ...(chain.current_revision ? { revision: chain.current_revision } : {}),
      ...(input.facts.current_placement
        ? { placement_head: input.facts.current_placement.placement_head }
        : {}),
    };
  }
  return {
    status: "ready",
    subject_ref: input.facts.subject_ref,
    subject_kind: input.facts.subject_kind,
    previous_value: chain.current_value,
    new_value: nextValue,
    ...(decidedByBefore ? { decided_by_before: decidedByBefore } : {}),
    actor_role_assignment_ref: input.facts.actor_role_assignment_ref,
    reason: command.reason,
    ...(chain.current_revision ? { supersedes_ref: chain.current_revision.revision_ref } : {}),
    revision_head: currentHead + 1,
    ...(expectedPlacementHead !== undefined
      ? { expected_placement_head: expectedPlacementHead }
      : {}),
  };
};

const canonicalize = (command: NurtureContentRevisionCommand): unknown => ({
  ...command,
  ...(command.action === "downscope_content_visibility" && command.restrict_audiences
    ? { restrict_audiences: [...command.restrict_audiences].sort() }
    : {}),
});

type ContentRevisionPayloadByAction = {
  adjust_activity_placement: NurtureAdjustActivityPlacementPayload;
  downscope_content_visibility: NurtureDownscopeContentVisibilityPayload;
  add_institution_note: NurtureAddInstitutionNotePayload;
};

type ContentRevisionAction = keyof ContentRevisionPayloadByAction;

const commandOf = <Action extends ContentRevisionAction>(
  action: Action,
  payload: ContentRevisionPayloadByAction[Action],
): Extract<NurtureContentRevisionCommand, { action: Action }> =>
  ({ action, ...payload }) as unknown as Extract<
    NurtureContentRevisionCommand,
    { action: Action }
  >;

const contentRevisionSpec = <Action extends ContentRevisionAction>(
  action: Action,
): NurtureCommandSpec<ContentRevisionPayloadByAction[Action]> => ({
  command_key: `nurture.${action}`,
  command_scope: "content_subject",
  contract_version: 1,
  canonicalize: (payload) => canonicalize(commandOf(action, payload)),
  async checkPreconditions(transaction, payload, context) {
    const revisions = transaction.contentRevisions;
    if (!revisions) return { status: "invalid", reason_code: "content_revision_owner_unavailable" };
    const command = commandOf(action, payload);
    const validation = validateContentRevisionCommand(command);
    if (validation.status === "invalid" || payload.workspace_id !== context.workspace_id) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const result = await revisions.loadContentRevisionFacts({
      workspace_id: context.workspace_id,
      participant_ref: context.business_actor_ref,
      role_assignment_ref: payload.role_assignment_ref,
      subject_kind: contentRevisionSubjectKindOf(command),
      target: contentRevisionTargetOf(command),
    });
    if (result.status === "denied") {
      return { status: "blocked", reason_code: result.reason_code };
    }
    if (result.status === "unavailable") {
      return { status: "blocked", reason_code: "unavailable" };
    }
    const decision = decideContentRevision({ command, facts: result.facts });
    if (decision.status === "unavailable") {
      return { status: "blocked", reason_code: "unavailable" };
    }
    if (decision.status === "denied") {
      return decision.layer === "concurrency"
        ? { status: "conflict", reason_code: decision.reason_code }
        : decision.layer === "authority"
          ? { status: "blocked", reason_code: decision.reason_code }
          : { status: "invalid", reason_code: decision.reason_code };
    }
    if (decision.status === "already_satisfied") {
      return {
        status: "already_satisfied",
        output_refs: decision.revision
          ? [
              {
                schema_version: 1,
                namespace: "nurture",
                object_type: "content_revision",
                object_id: decision.revision.revision_ref,
                version: decision.revision.revision_head,
              },
            ]
          : [],
        result_schema_version: 1,
        committed_result: {
          revision_head: decision.revision?.revision_head ?? 0,
          ...(decision.placement_head !== undefined
            ? { placement_head: decision.placement_head }
            : {}),
        },
      };
    }
    return { status: "ready" };
  },
  async apply(transaction, payload, context) {
    const revisions = transaction.contentRevisions;
    if (!revisions) throw new Error("content revision owner adapter is not wired");
    const command = commandOf(action, payload);
    const facts = await revisions.loadContentRevisionFacts({
      workspace_id: context.workspace_id,
      participant_ref: context.business_actor_ref,
      role_assignment_ref: payload.role_assignment_ref,
      subject_kind: contentRevisionSubjectKindOf(command),
      target: contentRevisionTargetOf(command),
    });
    if (facts.status !== "resolved") throw new Error("content_revision_write_unavailable");
    const decision = decideContentRevision({ command, facts: facts.facts });
    if (decision.status !== "ready") throw new Error("content_revision_write_conflict");
    const applied = await revisions.appendContentRevision({
      workspace_id: context.workspace_id,
      target: contentRevisionTargetOf(command),
      subject_ref: decision.subject_ref,
      subject_kind: decision.subject_kind,
      previous_value: decision.previous_value,
      new_value: decision.new_value,
      ...(decision.decided_by_before
        ? { decided_by_before: decision.decided_by_before }
        : {}),
      actor_role_assignment_ref: decision.actor_role_assignment_ref,
      reason: decision.reason,
      ...(decision.supersedes_ref ? { supersedes_ref: decision.supersedes_ref } : {}),
      revision_head: decision.revision_head,
      ...(decision.expected_placement_head !== undefined
        ? { expected_placement_head: decision.expected_placement_head }
        : {}),
      command_request_id_hash: hashCommandRequestId(
        context.workspace_id,
        context.command_request_id,
      ),
    });
    if (!applied.committed) throw new Error("content_revision_write_conflict");
    return {
      output_refs: [
        {
          schema_version: 1,
          namespace: "nurture",
          object_type: "content_revision",
          object_id: applied.revision.revision_ref,
          version: applied.revision.revision_head,
        },
      ],
      result_schema_version: 1,
      committed_result: {
        revision_head: applied.revision.revision_head,
        subject_kind: applied.revision.subject_kind,
        ...(applied.placement_head !== undefined
          ? { placement_head: applied.placement_head }
          : {}),
      },
    };
  },
});

export const adjustActivityPlacementSpec =
  contentRevisionSpec("adjust_activity_placement");
export const downscopeContentVisibilitySpec =
  contentRevisionSpec("downscope_content_visibility");
export const addInstitutionNoteSpec =
  contentRevisionSpec("add_institution_note");

export type NurtureContentRevisionQueryResult =
  | {
      status: "resolved";
      contract_version: typeof CONTENT_REVISION_CONTRACT.version;
      subject_ref: string;
      subject_kind: NurtureContentRevisionSubjectKind;
      revisions: NurtureContentRevisionV1[];
    }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export class NurtureContentRevisionQueryService {
  constructor(private readonly repository: NurtureContentRevisionRepository) {}

  async query(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    subject_kind: NurtureContentRevisionSubjectKind;
    target: NurtureContentRevisionTarget;
  }): Promise<NurtureContentRevisionQueryResult> {
    try {
      const result = await this.repository.loadContentRevisionFacts(input);
      if (result.status !== "resolved") return result;
      const chain = currentContentRevisionValue(result.facts);
      if (chain.status === "unavailable") return chain;
      return {
        status: "resolved",
        contract_version: CONTENT_REVISION_CONTRACT.version,
        subject_ref: result.facts.subject_ref,
        subject_kind: result.facts.subject_kind,
        revisions: result.facts.revisions,
      };
    } catch {
      return { status: "unavailable", reason_code: "content_revision_owner_unavailable" };
    }
  }
}
