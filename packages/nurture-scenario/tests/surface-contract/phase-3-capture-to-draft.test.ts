import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  evaluateOrganizeTrigger,
  type OrganizeTriggerPolicyV1,
} from "../../src/harness/care-capture-batch.js";
import { assembleDeterministicDraft } from "../../src/harness/content-assembler.js";
import {
  createPublishCandidate,
  type ContentSafetyRoutePort,
} from "../../src/harness/publish-process.js";
import { BOARD_INTEGRITY_KEY, caregiverAuthority } from "../harness/board-fixtures.js";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const manifest = JSON.parse(
  readFileSync(
    path.join(packageRoot, "contracts/surfaces/v1/generated/surface-contract.manifest.json"),
    "utf8",
  ),
) as {
  capabilities: Array<{
    capabilityKey: string;
    capabilityVersion: string;
    descriptor: {
      domainClass: string;
      executionClass: string;
      confirmationPolicy: string;
      supportedRoles?: string[];
      targetPolicy: { kind: string; optionSchemaRef: string | null };
      concurrencyPolicy: { class: string; headBindings: Array<{ headKey: string }> };
      inputSchemaRef: string;
    };
  }>;
};
const schemaRegistry = JSON.parse(
  readFileSync(
    path.join(packageRoot, "contracts/surfaces/v1/source/interface/schema-registry.json"),
    "utf8",
  ),
) as { schemas: Array<{ schemaRef: string; artifactPath: string; jsonPointer: string }> };

const B1_ACTIONS = [
  "organize_care_capture_batch",
  "save_publish_process_draft",
  "acquire_publish_edit_hold",
  "renew_publish_edit_hold",
  "release_publish_edit_hold",
  "cancel_publish_process",
];

const capability = (key: string) =>
  manifest.capabilities.find((entry) => entry.capabilityKey === key);

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const policy: OrganizeTriggerPolicyV1 = {
  policy_ref: "syn-policy-1",
  policy_head: 3,
  time_zone: "Asia/Shanghai",
  default_release_local_time: "17:00",
  organize_idle_seconds: 600,
  organize_fallback_lead_seconds: 1800,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 60,
  automatic_organize_enabled: true,
};

const safety = (route: "ordinary" | "review_required" | "direct_interaction_required") =>
  ({
    deriveRoute: async () => ({
      route,
      policyRef: "syn-content-safety-1",
      policyHead: 2,
      ruleRevision: "rules-1.0.0",
      riskCodes: [],
    }),
  }) satisfies ContentSafetyRoutePort;

describe("Phase 3 capture-to-draft deterministic main path", () => {
  it("registers every G3-B1 action as a publish-process transition for class teachers", () => {
    for (const key of B1_ACTIONS) {
      const entry = capability(key);
      expect(entry, key).toBeDefined();
      expect(entry?.capabilityVersion, key).toBe("1.0.0");
      expect(entry?.descriptor.domainClass, key).toBe("publish_process");
      expect(entry?.descriptor.executionClass, key).toBe("publish_process_transition");
      expect(entry?.descriptor.supportedRoles, key).toEqual(["caregiver", "lead_caregiver"]);
      expect(entry?.descriptor.targetPolicy.optionSchemaRef, key).toBe(
        "schema:nurture.owner-target-option@1",
      );
    }
    const queue = capability("query_teacher_publish_queue");
    expect(queue?.descriptor.executionClass).toBe("query");
    expect(queue?.descriptor.confirmationPolicy).toBe("none");
  });

  it("binds each transition to the head it actually depends on", () => {
    expect(
      capability("save_publish_process_draft")?.descriptor.concurrencyPolicy.headBindings.map(
        (binding) => binding.headKey,
      ),
    ).toEqual(["draft_revision", "care_group_scope", "publish_edit_hold"]);
    expect(
      capability("organize_care_capture_batch")?.descriptor.concurrencyPolicy.headBindings.map(
        (binding) => binding.headKey,
      ),
    ).toEqual(["capture_batch", "care_group_scope", "content_safety_route"]);
    expect(capability("cancel_publish_process")?.descriptor.concurrencyPolicy.class).toBe(
      "lifecycle_authority",
    );
  });

  it("keeps server-issued metadata out of every typed business input", () => {
    // Two different things must not be conflated here. Server-issued transport
    // metadata (heads the owner froze, refs the owner sealed, identities the
    // runner owns) never rides in typed input. The client's OBSERVED BASE
    // REVISION is neither: it is a business fact only the client knows, and
    // D-08 requires every save to carry it — an earlier version of this list
    // forbade it, which forced prepare to substitute the server's own head and
    // turned concurrent saves into silent last-write-wins (review finding 2).
    for (const key of [...B1_ACTIONS, "query_teacher_publish_queue"]) {
      const inputRef = capability(key)?.descriptor.inputSchemaRef;
      const binding = schemaRegistry.schemas.find((entry) => entry.schemaRef === inputRef);
      expect(binding, key).toBeDefined();
      const artifact = JSON.parse(
        readFileSync(
          path.join(packageRoot, "contracts/surfaces/v1/source", binding?.artifactPath ?? ""),
          "utf8",
        ),
      ) as { $defs: Record<string, unknown> };
      const pointer = (binding?.jsonPointer ?? "").replace("/$defs/", "");
      const serialized = JSON.stringify(artifact.$defs[pointer]);
      for (const forbidden of [
        "expectedHeads",
        "targetOptionRef",
        "commandIdentity",
        "idempotencyKey",
        "confirmationRef",
        "scopeRef",
      ]) {
        expect(serialized, `${key} ${forbidden}`).not.toContain(forbidden);
      }
      if (key === "save_publish_process_draft") {
        // Required, not merely permitted: without it the drift check has
        // nothing of the client's to protect.
        expect(serialized).toContain('"expectedDraftRevision"');
        expect(JSON.stringify((artifact.$defs[pointer] as { required?: string[] }).required)).toContain(
          "expectedDraftRevision",
        );
      } else {
        expect(serialized, `${key} expectedDraftRevision`).not.toContain("expectedDraftRevision");
      }
    }
  });

  it("registers no T-006 capability identity the G3-0 freeze never reserved", () => {
    // The freeze guard checks that every reserved identity is tracked; this is
    // the other direction — nothing may appear in the registry that the freeze
    // did not reserve.
    const freeze = readFileSync(
      path.join(
        packageRoot,
        "../../dev-docs/active/nurture-child-care-boards/06-g3-0-fact-contract-schema-freeze.md",
      ),
      "utf8",
    );
    const adoptionSet = freeze.slice(
      freeze.indexOf("## Capability Adoption Set"),
      freeze.indexOf("## DB SSOT Delta"),
    );
    const reserved = new Set(
      [...adoptionSet.matchAll(/`([a-z][a-z0-9_]*)`/g)]
        .map((match) => match[1] as string)
        .filter((key) => key.includes("_")),
    );
    // The G3-A topology queries are reserved in the topology table instead.
    for (const key of [
      "query_guardian_family_board",
      "query_guardian_current_focus",
      "query_guardian_enrollment_activity",
      "query_caregiver_teacher_board",
      "query_caregiver_child_today",
      "query_teacher_publish_queue",
    ]) {
      reserved.add(key);
    }
    const preG3Keys = new Set([
      "acknowledge_family_care_item",
      "correct_family_care_message",
      "initiate_caregiver_direct_message",
      "policy_redact_family_care_message",
      "query_caregiver_family_care_work",
      "query_family_care_item",
      "query_guardian_family_care_timeline",
      "redact_family_care_message",
      "reply_family_care_item",
      "submit_family_care_question",
      "withdraw_family_care_request",
    ]);
    for (const entry of manifest.capabilities) {
      if (preG3Keys.has(entry.capabilityKey)) continue;
      expect(reserved.has(entry.capabilityKey), entry.capabilityKey).toBe(true);
    }
  });

  it("runs capture → organize → deterministic assembly → draft on one frozen input", async () => {
    const captures = [
      {
        capture_id: "c-1",
        kind: "text" as const,
        stable: true,
        source_sequence: 1,
        occurred_at: "2026-08-01T09:00:00.000Z",
        authority: caregiverAuthority(),
      },
      {
        capture_id: "c-2",
        kind: "media" as const,
        stable: true,
        source_sequence: 2,
        occurred_at: "2026-08-01T09:01:00.000Z",
        authority: caregiverAuthority(),
      },
      {
        capture_id: "c-3",
        kind: "media" as const,
        stable: false,
        source_sequence: 3,
        occurred_at: "2026-08-01T09:02:00.000Z",
        authority: caregiverAuthority(),
      },
    ];
    const cut = evaluateOrganizeTrigger({
      trigger: "manual",
      trigger_request_id: "trigger-1",
      now: new Date("2026-08-01T09:05:00.000Z"),
      policy,
      batch: {
        state: "collecting",
        captures,
        activity: { last_user_activity_at: "2026-08-01T09:02:00.000Z" },
      },
    });
    expect(cut.status).toBe("cut");
    if (cut.status !== "cut") return;
    // The unfinished upload stays behind for the next batch.
    expect(cut.includedCaptureIds).toEqual(["c-1", "c-2"]);
    expect(cut.deferredCaptureIds).toEqual(["c-3"]);

    const assembled = assembleDeterministicDraft(BOARD_INTEGRITY_KEY, scope, {
      organizer_input_revision: "organizer-rev-1",
      activity_key: "outdoor_play",
      activity_label: "户外活动",
      sources: captures
        .filter((entry) => cut.includedCaptureIds.includes(entry.capture_id))
        .map((entry) => ({
          capture_id: entry.capture_id,
          kind: entry.kind,
          source_sequence: entry.source_sequence,
          occurred_at: entry.occurred_at,
          ...(entry.kind === "text" ? { text: "户外活动结束后回教室。" } : {}),
          ...(entry.kind === "media" ? { media_asset_id: `media-${entry.capture_id}` } : {}),
        })),
    });
    expect(assembled.status).toBe("ok");
    if (assembled.status !== "ok") return;
    expect(assembled.content.title).toBe("户外活动 · 1 张照片");
    expect(assembled.content.body?.segments[0]?.text).toBe("户外活动结束后回教室。");

    const candidate = await createPublishCandidate(
      {
        integrity_key: BOARD_INTEGRITY_KEY,
        safety: safety("ordinary"),
        now: () => new Date("2026-08-01T09:05:00.000Z"),
      },
      scope,
      {
        care_group_id: "care-group-1",
        organizer_input_revision: "organizer-rev-1",
        source_ids: cut.includedCaptureIds,
        content: assembled.content,
        targets: [
          {
            child_care_process_id: "child-1",
            enrollment_id: "enrollment-1",
            family_id: "family-1",
            grant_id: "grant-1",
            data_class: "daily_care_log",
            purpose_key: "family_daily_care_update",
            authority: caregiverAuthority(),
          },
        ],
        watermark: cut.evidence.watermark,
        trigger_evidence: cut.evidence,
      },
    );
    expect(candidate.status).toBe("draft_created");
    if (candidate.status !== "draft_created") return;
    expect(candidate.process.state).toBe("draft");
    expect(candidate.process.currentRevision.revision).toBe(1);
    expect(candidate.quickAdjust.deadlineAt).toBe("2026-08-01T09:05:30.000Z");
    // No AI provider took part anywhere in this path.
    expect(JSON.stringify(candidate)).not.toContain("suggestion");
  });

  it("still completes the deterministic path for photo-only content", async () => {
    const assembled = assembleDeterministicDraft(BOARD_INTEGRITY_KEY, scope, {
      organizer_input_revision: "organizer-rev-2",
      activity_label: "午睡",
      sources: [
        {
          capture_id: "c-1",
          kind: "media",
          media_asset_id: "media-1",
          source_sequence: 1,
          occurred_at: "2026-08-01T12:00:00.000Z",
        },
      ],
    });
    expect(assembled.status).toBe("ok");
    if (assembled.status !== "ok") return;
    expect(assembled.content.body).toBeUndefined();

    const candidate = await createPublishCandidate(
      { integrity_key: BOARD_INTEGRITY_KEY, safety: safety("ordinary") },
      scope,
      {
        care_group_id: "care-group-1",
        organizer_input_revision: "organizer-rev-2",
        source_ids: ["c-1"],
        content: assembled.content,
        targets: [
          {
            child_care_process_id: "child-1",
            enrollment_id: "enrollment-1",
            family_id: "family-1",
            grant_id: "grant-1",
            data_class: "daily_care_log",
            purpose_key: "family_daily_care_update",
            authority: caregiverAuthority(),
          },
        ],
        watermark: { source_sequence: 1, cut_at: "2026-08-01T12:05:00.000Z" },
        trigger_evidence: {
          trigger: "manual",
          triggerRequestId: "trigger-2",
          policyRef: "syn-policy-1",
          policyHead: 3,
          timeZone: "Asia/Shanghai",
          quiescenceSeconds: 60,
          observedUserActivityAt: "2026-08-01T12:00:00.000Z",
          leaseActive: false,
          watermark: { source_sequence: 1, cut_at: "2026-08-01T12:05:00.000Z" },
        },
      },
    );
    expect(candidate.status).toBe("draft_created");
  });
});
