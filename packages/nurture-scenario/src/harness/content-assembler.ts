import { issueBoardOpaqueRef, type BoardScopeV1 } from "./board-projection.js";
import type { CaptureIntakeKindV1 } from "./care-capture-batch.js";

/**
 * G3-B1 deterministic content assembler (02-architecture.md D-15).
 *
 * The everyday organize path never depends on generative copy. This module has
 * no provider port at all: a draft is composed from the teacher's own text, the
 * host-supplied voice transcript and a versioned template over structured facts
 * (activity, time, original media count). Photo-only content legitimately has
 * no free body — inventing "had a great time" to make a card look complete is
 * exactly what this lane must not do.
 */
export const DETERMINISTIC_CARE_DRAFT_TEMPLATE = {
  key: "nurture_deterministic_care_draft",
  version: "1.0.0",
} as const;

const MAX_SEGMENT_CHARS = 2_000;
const MAX_SEGMENTS = 50;

/**
 * Public provenance names the author, not the intake channel: a reader must be
 * able to tell the teacher's own words from a host transcript.
 */
export type ContentSourceKindV1 = "teacher_text" | "voice_transcript";

const provenanceKind = (
  kind: Extract<CaptureIntakeKindV1, "text" | "voice_transcript">,
): ContentSourceKindV1 => (kind === "text" ? "teacher_text" : "voice_transcript");

export type ContentProvenanceV1 = {
  kind: ContentSourceKindV1;
  sourceRef: string;
  /** Present for transcripts so a later teacher edit stays explainable. */
  transcriptRevision?: string;
};

export type AssemblerSourceV1 = {
  capture_id: string;
  kind: CaptureIntakeKindV1;
  source_sequence: number;
  occurred_at: string;
  /** Verbatim teacher text or host transcript; never rewritten here. */
  text?: string;
  transcript_revision?: string;
  /** Stable, owner-issued media identity; the assembler never sees a file path. */
  media_asset_id?: string;
};

export type AssemblerInputV1 = {
  /** The exact frozen organizer input revision this assembly is bound to. */
  organizer_input_revision: string;
  activity_key?: string;
  activity_label?: string;
  sources: AssemblerSourceV1[];
};

export type AssembledBodySegmentV1 = {
  text: string;
  provenance: ContentProvenanceV1;
};

export type AssembledDraftContentV1 = {
  template: { key: string; version: string };
  organizerInputRevision: string;
  title: string;
  tags: string[];
  /** Absent for photo-only content. Never a generated sentence. */
  body?: { segments: AssembledBodySegmentV1[] };
  mediaRefs: string[];
  metadata: {
    originalMediaCount: number;
    occurredFrom: string;
    occurredTo: string;
    activityLabel?: string;
  };
  sourceRefs: string[];
};

export type AssemblerDecisionV1 =
  | { status: "ok"; content: AssembledDraftContentV1 }
  | { status: "empty" }
  | { status: "invalid"; reason_code: string };

const isTextual = (source: AssemblerSourceV1): boolean =>
  source.kind === "text" || source.kind === "voice_transcript";

/**
 * Composes the draft. The title and tags are the only generated strings and
 * they come from structured facts through the versioned template; every body
 * segment is a verbatim source bound to its own provenance entry.
 */
export const assembleDeterministicDraft = (
  integrityKey: string,
  scope: BoardScopeV1,
  input: AssemblerInputV1,
): AssemblerDecisionV1 => {
  if (!input.organizer_input_revision) {
    return { status: "invalid", reason_code: "missing_organizer_input_revision" };
  }
  const ordered = [...input.sources].sort(
    (left, right) => left.source_sequence - right.source_sequence,
  );
  if (ordered.length === 0) return { status: "empty" };
  if (ordered.filter((source) => source.kind !== "media").length > MAX_SEGMENTS) {
    return { status: "invalid", reason_code: "organizer_input_too_large" };
  }

  const segments: AssembledBodySegmentV1[] = [];
  const mediaRefs: string[] = [];
  for (const source of ordered) {
    if (source.kind === "media") {
      if (!source.media_asset_id) {
        return { status: "invalid", reason_code: "media_source_without_asset" };
      }
      mediaRefs.push(
        issueBoardOpaqueRef(integrityKey, scope, "media_asset", source.media_asset_id),
      );
      continue;
    }
    if (!isTextual(source)) return { status: "invalid", reason_code: "unknown_source_kind" };
    const text = source.text ?? "";
    if (text.length === 0 || text.length > MAX_SEGMENT_CHARS) {
      return { status: "invalid", reason_code: "invalid_source_text" };
    }
    if (source.kind === "voice_transcript" && !source.transcript_revision) {
      // A transcript without its revision cannot keep provenance, so it is not
      // silently promoted into teacher-authored text.
      return { status: "invalid", reason_code: "transcript_without_revision" };
    }
    segments.push({
      // Verbatim. No tone, meaning, tense or uncertainty is normalized here.
      text,
      provenance: {
        kind: provenanceKind(source.kind),
        sourceRef: issueBoardOpaqueRef(integrityKey, scope, "care_capture", source.capture_id),
        ...(source.transcript_revision
          ? { transcriptRevision: source.transcript_revision }
          : {}),
      },
    });
  }

  const occurredAt = ordered.map((source) => source.occurred_at).sort();
  const metadata = {
    originalMediaCount: mediaRefs.length,
    occurredFrom: occurredAt[0] ?? "",
    occurredTo: occurredAt.at(-1) ?? "",
    ...(input.activity_label ? { activityLabel: input.activity_label } : {}),
  };

  return {
    status: "ok",
    content: {
      template: { ...DETERMINISTIC_CARE_DRAFT_TEMPLATE },
      organizerInputRevision: input.organizer_input_revision,
      title: composeTitle(input.activity_label, mediaRefs.length, metadata.occurredFrom),
      tags: composeTags(input.activity_key, mediaRefs.length, segments.length),
      ...(segments.length > 0 ? { body: { segments } } : {}),
      mediaRefs,
      metadata,
      sourceRefs: ordered.map((source) =>
        issueBoardOpaqueRef(integrityKey, scope, "care_capture", source.capture_id),
      ),
    },
  };
};

/**
 * Template titles describe what the sources actually are: an activity name the
 * owner already holds, an original photo count, or the capture date. They never
 * describe how anyone felt.
 */
const composeTitle = (
  activityLabel: string | undefined,
  mediaCount: number,
  occurredFrom: string,
): string => {
  const parts: string[] = [];
  if (activityLabel) parts.push(activityLabel);
  if (mediaCount > 0) parts.push(`${mediaCount} 张照片`);
  if (parts.length > 0) return parts.join(" · ");
  const day = occurredFrom.slice(0, 10);
  return day ? `${day} 记录` : "记录";
};

const composeTags = (
  activityKey: string | undefined,
  mediaCount: number,
  segmentCount: number,
): string[] => {
  const tags = ["daily_care"];
  if (activityKey) tags.push(`activity:${activityKey}`);
  if (mediaCount > 0) tags.push("has_media");
  if (segmentCount === 0) tags.push("photo_only");
  return tags;
};
