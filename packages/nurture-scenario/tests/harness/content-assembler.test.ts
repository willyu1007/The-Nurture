import { describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "../../src/harness/board-projection.js";
import {
  DETERMINISTIC_CARE_DRAFT_TEMPLATE,
  assembleDeterministicDraft,
  type AssemblerInputV1,
  type AssemblerSourceV1,
} from "../../src/harness/content-assembler.js";
import { BOARD_INTEGRITY_KEY } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const source = (overrides: Partial<AssemblerSourceV1> = {}): AssemblerSourceV1 => ({
  capture_id: "capture-1",
  kind: "media",
  source_sequence: 1,
  occurred_at: "2026-08-01T09:00:00.000Z",
  media_asset_id: "media-1",
  ...overrides,
});

const input = (overrides: Partial<AssemblerInputV1> = {}): AssemblerInputV1 => ({
  organizer_input_revision: "organizer-rev-1",
  sources: [source()],
  ...overrides,
});

const assemble = (value: AssemblerInputV1) =>
  assembleDeterministicDraft(BOARD_INTEGRITY_KEY, scope, value);

describe("G3-B1 deterministic content assembler", () => {
  it("keeps the teacher's own text byte-for-byte, including negation and uncertainty", () => {
    const original = "今天没有午睡，可能是有点兴奋；不确定原因。";
    const result = assemble(
      input({
        sources: [source({ capture_id: "c-1", kind: "text", text: original, media_asset_id: undefined })],
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const segments = result.content.body?.segments ?? [];
    expect(segments).toHaveLength(1);
    expect(segments[0]?.text).toBe(original);
    expect(segments[0]?.provenance.kind).toBe("teacher_text");
    expect(segments[0]?.provenance.sourceRef).toBe(
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "care_capture", "c-1"),
    );
  });

  it("carries transcript provenance and refuses a transcript without its revision", () => {
    const ok = assemble(
      input({
        sources: [
          source({
            capture_id: "c-2",
            kind: "voice_transcript",
            text: "户外活动结束后回教室。",
            transcript_revision: "transcript-rev-4",
            media_asset_id: undefined,
          }),
        ],
      }),
    );
    expect(ok.status).toBe("ok");
    if (ok.status !== "ok") return;
    expect(ok.content.body?.segments[0]?.provenance).toMatchObject({
      kind: "voice_transcript",
      transcriptRevision: "transcript-rev-4",
    });

    expect(
      assemble(
        input({
          sources: [
            source({
              capture_id: "c-2",
              kind: "voice_transcript",
              text: "户外活动结束后回教室。",
              media_asset_id: undefined,
            }),
          ],
        }),
      ),
    ).toEqual({ status: "invalid", reason_code: "transcript_without_revision" });
  });

  it("leaves photo-only content without a body instead of inventing an observation", () => {
    const result = assemble(
      input({
        activity_key: "outdoor_play",
        activity_label: "户外活动",
        sources: [
          source({ capture_id: "c-1", media_asset_id: "media-1", source_sequence: 1 }),
          source({ capture_id: "c-2", media_asset_id: "media-2", source_sequence: 2 }),
          source({ capture_id: "c-3", media_asset_id: "media-3", source_sequence: 3 }),
        ],
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.content.body).toBeUndefined();
    expect(result.content.title).toBe("户外活动 · 3 张照片");
    expect(result.content.tags).toEqual([
      "daily_care",
      "activity:outdoor_play",
      "has_media",
      "photo_only",
    ]);
    const serialized = JSON.stringify(result.content);
    for (const invented of ["很开心", "表现很棒", "喜欢", "自信", "进步"]) {
      expect(serialized).not.toContain(invented);
    }
  });

  it("builds title and metadata only from structured facts the owner already holds", () => {
    const withActivity = assemble(
      input({ activity_label: "午餐", sources: [source({ media_asset_id: "media-1" })] }),
    );
    expect(withActivity.status).toBe("ok");
    if (withActivity.status !== "ok") return;
    expect(withActivity.content.title).toBe("午餐 · 1 张照片");
    expect(withActivity.content.metadata).toEqual({
      originalMediaCount: 1,
      occurredFrom: "2026-08-01T09:00:00.000Z",
      occurredTo: "2026-08-01T09:00:00.000Z",
      activityLabel: "午餐",
    });

    // No activity name is available: the template falls back to the capture
    // date rather than naming an activity nobody recorded.
    const withoutActivity = assemble(
      input({
        sources: [
          source({ capture_id: "c-1", kind: "text", text: "记录一句。", media_asset_id: undefined }),
        ],
      }),
    );
    expect(withoutActivity.status).toBe("ok");
    if (withoutActivity.status !== "ok") return;
    expect(withoutActivity.content.title).toBe("2026-08-01 记录");
    expect(withoutActivity.content.metadata.activityLabel).toBeUndefined();
  });

  it("orders segments by intake sequence and pins the exact organizer input revision", () => {
    const result = assemble(
      input({
        organizer_input_revision: "organizer-rev-9",
        sources: [
          source({ capture_id: "c-3", kind: "text", text: "第三句", source_sequence: 3, media_asset_id: undefined }),
          source({ capture_id: "c-1", kind: "text", text: "第一句", source_sequence: 1, media_asset_id: undefined }),
          source({ capture_id: "c-2", kind: "media", media_asset_id: "media-1", source_sequence: 2 }),
        ],
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.content.body?.segments.map((segment) => segment.text)).toEqual([
      "第一句",
      "第三句",
    ]);
    expect(result.content.organizerInputRevision).toBe("organizer-rev-9");
    expect(result.content.template).toEqual({ ...DETERMINISTIC_CARE_DRAFT_TEMPLATE });
    expect(result.content.sourceRefs).toHaveLength(3);
  });

  it("never exposes a storage path and only emits opaque media refs", () => {
    const result = assemble(input({ sources: [source({ media_asset_id: "media-1" })] }));
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.content.mediaRefs).toEqual([
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "media_asset", "media-1"),
    ]);
    expect(JSON.stringify(result.content)).not.toContain("media-1");
  });

  it("rejects malformed organizer input instead of assembling something partial", () => {
    expect(assemble(input({ sources: [] }))).toEqual({ status: "empty" });
    expect(assemble(input({ organizer_input_revision: "" }))).toEqual({
      status: "invalid",
      reason_code: "missing_organizer_input_revision",
    });
    expect(assemble(input({ sources: [source({ media_asset_id: undefined })] }))).toEqual({
      status: "invalid",
      reason_code: "media_source_without_asset",
    });
    expect(
      assemble(
        input({
          sources: [source({ kind: "text", text: "", media_asset_id: undefined })],
        }),
      ),
    ).toEqual({ status: "invalid", reason_code: "invalid_source_text" });
  });

  it("is deterministic for the same frozen input", () => {
    const value = input({
      activity_label: "户外活动",
      sources: [
        source({ capture_id: "c-1", kind: "text", text: "原文", media_asset_id: undefined }),
        source({ capture_id: "c-2", media_asset_id: "media-1", source_sequence: 2 }),
      ],
    });
    expect(assemble(value)).toEqual(assemble(value));
  });
});
