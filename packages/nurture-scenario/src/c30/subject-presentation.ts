import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  assertListScenarioSubjectContextsInputV1,
  assertListScenarioSubjectContextsResultActiveV1,
  assertPresentScenarioSubjectContextExchangeV1,
  assertPresentScenarioSubjectContextInputV1,
  assertResolveScenarioSubjectContextInputV1,
  assertResolveScenarioSubjectContextResultActiveV1,
  resolveScenarioPageSizeV1,
  type ListScenarioSubjectContextsInputV1,
  type ListScenarioSubjectContextsResultV1,
  type PresentScenarioSubjectContextInputV1,
  type ResolveScenarioSubjectContextInputV1,
  type ResolveScenarioSubjectContextResultV1,
  type ScenarioHumanPrincipalV1,
  type ScenarioPresentationResultV1,
  type ScenarioSafeReasonV1,
  type ScenarioSubjectContextOptionV1,
} from "@my-chat/workflow-contracts";
import {
  NurtureParticipantResolutionError,
  resolveAuthorizedNurtureParticipant,
  type AuthorizedNurtureParticipantV1,
  type NurtureParticipantAuthorityReader,
  type NurtureParticipantBindingReader,
} from "./participant-binding.js";

export const nurtureC30SubjectProviderKey = "nurture.child_care_process_v1";
export const nurtureC30PresentationKey = "nurture.child_care_process_overview_v1";
export const nurtureC30ProductSurfaceKey = "nurture.child_care_process_overview_v1";

export type NurtureC30CurrentSubjectV1 = {
  subject_version: 1;
  process_id: string;
  context_version: string;
  process_revision: number;
  updated_at: string;
};

export type NurtureC30SubjectReadPageV1 = {
  subjects: readonly NurtureC30CurrentSubjectV1[];
  next_after_process_id?: string;
};

export type NurtureC30SubjectReadContextV1 = {
  principal: ScenarioHumanPrincipalV1;
  participant: AuthorizedNurtureParticipantV1;
  now: Date;
};

export type NurtureC30SubjectReadRepository = {
  listCurrent(input: NurtureC30SubjectReadContextV1 & {
    after_process_id?: string;
    page_size: number;
  }): Promise<NurtureC30SubjectReadPageV1>;
  resolveCurrent(input: NurtureC30SubjectReadContextV1 & {
    process_id: string;
  }): Promise<NurtureC30CurrentSubjectV1 | null>;
};

type SubjectLocatorV1 = {
  locator_version: 1;
  locator_kind: "subject";
  workspace_id: string;
  participant_id: string;
  process_id: string;
  context_version: string;
  issued_at: string;
  expires_at: string;
};

type CursorLocatorV1 = {
  locator_version: 1;
  locator_kind: "cursor";
  workspace_id: string;
  participant_id: string;
  after_process_id: string;
  expires_at: string;
};

type LocatorV1 = SubjectLocatorV1 | CursorLocatorV1;

export type NurtureC30SubjectLocatorCodec = {
  seal(locator: LocatorV1): string;
  open(value: string): LocatorV1;
};

export class AesGcmNurtureC30SubjectLocatorCodec implements NurtureC30SubjectLocatorCodec {
  private readonly key: Buffer;

  constructor(key: Uint8Array) {
    if (key.byteLength !== 32) {
      throw new Error("The C30 subject locator key must contain exactly 32 bytes.");
    }
    this.key = Buffer.from(key);
  }

  seal(locator: LocatorV1): string {
    assertLocator(locator);
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, nonce);
    cipher.setAAD(locatorAad);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(compactLocator(locator)), "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString("base64url");
  }

  open(value: string): LocatorV1 {
    if (!opaqueLocatorPattern.test(value)) throw locatorError();
    try {
      const envelope = Buffer.from(value, "base64url");
      if (envelope.byteLength < 29) throw locatorError();
      const decipher = createDecipheriv("aes-256-gcm", this.key, envelope.subarray(0, 12));
      decipher.setAAD(locatorAad);
      decipher.setAuthTag(envelope.subarray(12, 28));
      const plaintext = Buffer.concat([
        decipher.update(envelope.subarray(28)),
        decipher.final(),
      ]).toString("utf8");
      const locator: unknown = expandLocator(JSON.parse(plaintext));
      assertLocator(locator);
      return locator;
    } catch (error) {
      if (error instanceof NurtureC30SubjectPresentationError) throw error;
      throw locatorError();
    }
  }
}

export type NurtureC30SubjectPresentationErrorCode =
  | "subject_request_invalid"
  | "subject_locator_invalid"
  | "subject_authority_changed"
  | "subject_unavailable";

export class NurtureC30SubjectPresentationError extends Error {
  constructor(readonly code: NurtureC30SubjectPresentationErrorCode, message: string) {
    super(message);
    this.name = "NurtureC30SubjectPresentationError";
  }
}

export type NurtureC30SubjectPresentationDeps = {
  binding_reader: NurtureParticipantBindingReader;
  authority_reader: NurtureParticipantAuthorityReader;
  subject_repository: NurtureC30SubjectReadRepository;
  locator_codec: NurtureC30SubjectLocatorCodec;
  clock?: () => Date;
};

export class NurtureC30ChildCareProcessPresentationOwner {
  private readonly clock: () => Date;

  constructor(private readonly deps: NurtureC30SubjectPresentationDeps) {
    this.clock = deps.clock ?? (() => new Date());
  }

  async list(
    principal: ScenarioHumanPrincipalV1,
    input: ListScenarioSubjectContextsInputV1,
  ): Promise<ListScenarioSubjectContextsResultV1> {
    assertListScenarioSubjectContextsInputV1(input);
    const now = this.clock();
    try {
      const participant = await this.resolveParticipant(principal, "list_subject_contexts");
      const cursor = input.cursor === undefined
        ? undefined
        : this.openLocator(input.cursor, "cursor", principal, participant, now);
      const pageSize = resolveScenarioPageSizeV1(input.page_size);
      const page = await this.deps.subject_repository.listCurrent({
        principal,
        participant,
        now,
        page_size: pageSize,
        ...(cursor?.locator_kind === "cursor"
          ? { after_process_id: cursor.after_process_id }
          : {}),
      });
      if (page.subjects.length === 0) return unavailable("subject_unavailable", "No care process is available.");
      if (page.subjects.length > pageSize) throw requestError("The subject repository exceeded the requested page size.");
      const options = page.subjects.map((subject, index) => this.option(subject, participant, now, index));
      let result: ListScenarioSubjectContextsResultV1;
      if (options.length === 1 && page.next_after_process_id === undefined) {
        const context = options[0];
        if (!context) throw new Error("unreachable subject option");
        result = { status: "resolved", context };
      } else if (options.length >= 2) {
        result = {
          status: "needs_selection",
          scope_kind: "unresolved",
          candidates: options,
          ...(page.next_after_process_id
            ? { next_cursor: this.cursor(page.next_after_process_id, participant, now) }
            : {}),
        };
      } else {
        result = unavailable(
          "subject_unavailable",
          "A larger page is required to select a care process.",
        );
      }
      assertListScenarioSubjectContextsResultActiveV1(result, now.toISOString());
      return result;
    } catch (error) {
      return this.closedResult(error);
    }
  }

  async resolve(
    principal: ScenarioHumanPrincipalV1,
    input: ResolveScenarioSubjectContextInputV1,
  ): Promise<ResolveScenarioSubjectContextResultV1> {
    assertResolveScenarioSubjectContextInputV1(input);
    const now = this.clock();
    try {
      const participant = await this.resolveParticipant(principal, "resolve_subject_context");
      const locator = this.openLocator(input.subject_context_ref, "subject", principal, participant, now);
      if (locator.locator_kind !== "subject") throw locatorError();
      const subject = await this.deps.subject_repository.resolveCurrent({
        principal,
        participant,
        now,
        process_id: locator.process_id,
      });
      if (!subject) return unavailable("subject_unavailable", "The care process is unavailable.");
      if (
        subject.context_version !== locator.context_version
        || (input.known_context_version !== undefined
          && input.known_context_version !== subject.context_version)
      ) {
        return changed();
      }
      const result: ResolveScenarioSubjectContextResultV1 = {
        status: "resolved",
        context: optionFromLocator(input.subject_context_ref, locator),
        resolved_at: now.toISOString(),
      };
      assertResolveScenarioSubjectContextResultActiveV1(result, now.toISOString());
      return result;
    } catch (error) {
      return this.closedResult(error);
    }
  }

  async present(
    principal: ScenarioHumanPrincipalV1,
    input: PresentScenarioSubjectContextInputV1,
  ): Promise<ScenarioPresentationResultV1> {
    assertPresentScenarioSubjectContextInputV1(input);
    if (
      input.presentation_key !== nurtureC30PresentationKey
      || (input.view_query !== undefined && input.view_query.view_mode !== "current")
    ) {
      throw requestError("The requested C30 presentation is not declared.");
    }
    const now = this.clock();
    try {
      const participant = await this.resolveParticipant(principal, "present_subject_context");
      const locator = this.openLocator(input.subject_context_ref, "subject", principal, participant, now);
      if (locator.locator_kind !== "subject") throw locatorError();
      const subject = await this.deps.subject_repository.resolveCurrent({
        principal,
        participant,
        now,
        process_id: locator.process_id,
      });
      if (!subject) return unavailable("subject_unavailable", "The care process is unavailable.");
      if (subject.context_version !== locator.context_version) return changed();
      const result: ScenarioPresentationResultV1 = {
        status: "ready",
        presentation: {
          presentation_version: 1,
          presentation_key: nurtureC30PresentationKey,
          subject_context_ref: input.subject_context_ref,
          context_version: subject.context_version,
          generated_at: now.toISOString(),
          blocks: [
            {
              kind: "summary",
              block_key: "care_process_summary",
              tone: "informational",
              narration: "allowed",
              title: safeText("Care process overview"),
              body: safeText("This care process is active."),
            },
            {
              kind: "notice",
              block_key: "read_only_notice",
              tone: "neutral",
              narration: "allowed",
              body: safeText("This overview is read only."),
            },
            {
              kind: "fact_group",
              block_key: "current_facts",
              tone: "neutral",
              narration: "allowed",
              title: safeText("Current facts"),
              facts: [{
                fact_key: "care_process_status",
                label: safeText("Care process status"),
                value: safeText("Active"),
                tone: "positive",
              }],
            },
            {
              kind: "metric_group",
              block_key: "record_details",
              tone: "neutral",
              narration: "display_only",
              title: safeText("Record details"),
              metrics: [{
                metric_key: "record_revision",
                label: safeText("Record revision"),
                value: safeText(String(subject.process_revision)),
                tone: "neutral",
              }],
            },
            {
              kind: "item_collection",
              block_key: "current_connections",
              tone: "neutral",
              narration: "allowed",
              title: safeText("Current connections"),
              items: [{
                item_key: "canonical_family_connection",
                title: safeText("Family connection"),
                summary: safeText("The current care context is connected."),
                badges: [{ label: safeText("Current"), tone: "positive" }],
              }],
            },
            {
              kind: "timeline",
              block_key: "care_process_timeline",
              tone: "neutral",
              narration: "display_only",
              title: safeText("Care process timeline"),
              entries: [{
                entry_key: "care_process_updated",
                title: safeText("Care process updated"),
                badges: [],
                occurred_at: subject.updated_at,
              }],
            },
          ],
          navigation: [{
            route_class: "scenario_overview",
            label: safeText("Care process overview"),
            view_mode: "current",
            priority: "primary",
            narration: "display_only",
          }],
          actions: [],
        },
      };
      assertPresentScenarioSubjectContextExchangeV1(input, result);
      return result;
    } catch (error) {
      return this.closedResult(error);
    }
  }

  private async resolveParticipant(
    principal: ScenarioHumanPrincipalV1,
    operationKey: "list_subject_contexts" | "resolve_subject_context" | "present_subject_context",
  ): Promise<AuthorizedNurtureParticipantV1> {
    if (principal.principal_origin !== "interactive_session") {
      throw new NurtureC30SubjectPresentationError(
        "subject_authority_changed",
        "The C30 presentation requires an interactive principal.",
      );
    }
    return resolveAuthorizedNurtureParticipant({
      principal,
      operation_key: operationKey,
      binding_reader: this.deps.binding_reader,
      authority_reader: this.deps.authority_reader,
    });
  }

  private option(
    subject: NurtureC30CurrentSubjectV1,
    participant: AuthorizedNurtureParticipantV1,
    now: Date,
    index: number,
  ): ScenarioSubjectContextOptionV1 {
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + locatorLifetimeMs).toISOString();
    const locator: SubjectLocatorV1 = {
      locator_version: 1,
      locator_kind: "subject",
      workspace_id: participant.workspace_ref.object_id,
      participant_id: participant.participant_ref.object_id,
      process_id: subject.process_id,
      context_version: subject.context_version,
      issued_at: issuedAt,
      expires_at: expiresAt,
    };
    return {
      subject_context_ref: this.deps.locator_codec.seal(locator),
      scope_kind: "single_subject",
      route_class: "subject_detail",
      safe_label: safeText("Child care process"),
      safe_disambiguation: safeText(`Available care context ${index + 1}`),
      context_version: subject.context_version,
      issued_at: issuedAt,
      expires_at: expiresAt,
    };
  }

  private cursor(
    afterProcessId: string,
    participant: AuthorizedNurtureParticipantV1,
    now: Date,
  ): string {
    return this.deps.locator_codec.seal({
      locator_version: 1,
      locator_kind: "cursor",
      workspace_id: participant.workspace_ref.object_id,
      participant_id: participant.participant_ref.object_id,
      after_process_id: afterProcessId,
      expires_at: new Date(now.getTime() + locatorLifetimeMs).toISOString(),
    });
  }

  private openLocator(
    value: string,
    expectedKind: LocatorV1["locator_kind"],
    principal: ScenarioHumanPrincipalV1,
    participant: AuthorizedNurtureParticipantV1,
    now: Date,
  ): LocatorV1 {
    const locator = this.deps.locator_codec.open(value);
    if (
      locator.locator_kind !== expectedKind
      || locator.workspace_id !== principal.workspace_ref.object_id
      || locator.workspace_id !== participant.workspace_ref.object_id
      || locator.participant_id !== participant.participant_ref.object_id
      || Date.parse(locator.expires_at) <= now.getTime()
    ) throw locatorError();
    return locator;
  }

  private closedResult(error: unknown): {
    status: "unavailable";
    safe_reason: ScenarioSafeReasonV1;
  } {
    if (
      error instanceof NurtureParticipantResolutionError
      || (error instanceof NurtureC30SubjectPresentationError
        && error.code === "subject_authority_changed")
    ) return unavailable("authority_changed", "Current care authority is unavailable.");
    if (error instanceof NurtureC30SubjectPresentationError) {
      return unavailable("subject_unavailable", "The care process is unavailable.");
    }
    throw error;
  }
}

function optionFromLocator(
  subjectContextRef: string,
  locator: SubjectLocatorV1,
): ScenarioSubjectContextOptionV1 {
  return {
    subject_context_ref: subjectContextRef,
    scope_kind: "single_subject",
    route_class: "subject_detail",
    safe_label: safeText("Child care process"),
    safe_disambiguation: safeText("Available care context"),
    context_version: locator.context_version,
    issued_at: locator.issued_at,
    expires_at: locator.expires_at,
  };
}

function safeText(value: string) {
  return { kind: "plain_text" as const, value, locale: "en" };
}

function unavailable(reasonCode: "subject_unavailable" | "authority_changed", message: string) {
  return { status: "unavailable" as const, safe_reason: reason(reasonCode, message) };
}

function changed() {
  return {
    status: "context_changed" as const,
    safe_reason: reason("authority_changed", "The care context changed. Refresh before continuing."),
  };
}

function reason(reasonCode: string, message: string): ScenarioSafeReasonV1 {
  return {
    reason_code: reasonCode,
    message: safeText(message),
    retry_class: "refresh",
  };
}

function assertLocator(value: unknown): asserts value is LocatorV1 {
  if (!isRecord(value)) throw locatorError();
  const common = ["locator_version", "locator_kind", "workspace_id", "participant_id", "expires_at"];
  const keys = value.locator_kind === "subject"
    ? [...common, "process_id", "context_version", "issued_at"]
    : value.locator_kind === "cursor"
      ? [...common, "after_process_id"]
      : [];
  if (
    value.locator_version !== 1
    || keys.length === 0
    || Object.keys(value).length !== keys.length
    || Object.keys(value).some((key) => !keys.includes(key))
    || !isOpaqueId(value.workspace_id)
    || !isOpaqueId(value.participant_id)
    || !isCanonicalInstant(value.expires_at)
  ) throw locatorError();
  if (value.locator_kind === "subject") {
    if (
      !isOpaqueId(value.process_id)
      || !opaqueVersionPattern.test(String(value.context_version))
      || !isCanonicalInstant(value.issued_at)
      || Date.parse(String(value.issued_at)) >= Date.parse(String(value.expires_at))
    ) throw locatorError();
  } else if (!isOpaqueId(value.after_process_id)) throw locatorError();
}

function compactLocator(locator: LocatorV1): readonly unknown[] {
  return locator.locator_kind === "subject"
    ? [
        1,
        "s",
        locator.workspace_id,
        locator.participant_id,
        locator.process_id,
        locator.context_version,
        locator.issued_at,
        locator.expires_at,
      ]
    : [
        1,
        "c",
        locator.workspace_id,
        locator.participant_id,
        locator.after_process_id,
        locator.expires_at,
      ];
}

function expandLocator(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  if (value.length === 8 && value[0] === 1 && value[1] === "s") {
    return {
      locator_version: 1,
      locator_kind: "subject",
      workspace_id: value[2],
      participant_id: value[3],
      process_id: value[4],
      context_version: value[5],
      issued_at: value[6],
      expires_at: value[7],
    };
  }
  if (value.length === 6 && value[0] === 1 && value[1] === "c") {
    return {
      locator_version: 1,
      locator_kind: "cursor",
      workspace_id: value[2],
      participant_id: value[3],
      after_process_id: value[4],
      expires_at: value[5],
    };
  }
  return value;
}

function requestError(message: string): NurtureC30SubjectPresentationError {
  return new NurtureC30SubjectPresentationError("subject_request_invalid", message);
}

function locatorError(): NurtureC30SubjectPresentationError {
  return new NurtureC30SubjectPresentationError(
    "subject_locator_invalid",
    "The subject locator is invalid.",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isOpaqueId(value: unknown): value is string {
  return typeof value === "string" && opaqueIdPattern.test(value);
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== "string" || !canonicalInstantPattern.test(value)) return false;
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value;
}

const locatorAad = Buffer.from("nurture.c30.subject-locator.v1", "utf8");
const locatorLifetimeMs = 5 * 60 * 1000;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const opaqueVersionPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
