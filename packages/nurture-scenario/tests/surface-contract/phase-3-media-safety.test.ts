import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  evaluateContentSafetyRoute,
  type ContentSafetySourceSignalV1,
} from "../../src/harness/content-safety-policy.js";
import {
  confirmChildMediaAttribution,
  issueChildOptionRef,
  issueMediaAssetTargetRef,
  type MediaAttributionFactsV1,
} from "../../src/harness/media-attribution.js";
import { derivePublishEligibility } from "../../src/harness/publish-eligibility.js";
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
      concurrencyPolicy: { headBindings: Array<{ headKey: string }> };
    };
  }>;
};

const C1_ACTIONS = [
  "confirm_child_media_attribution",
  "reject_child_media_attribution",
  "supersede_child_media_attribution",
];

const capability = (key: string) =>
  manifest.capabilities.find((entry) => entry.capabilityKey === key);

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const now = () => new Date("2026-08-02T10:00:00.000Z");

describe("Phase 3 manual content and media safety path", () => {
  it("registers the three manual attribution capabilities for class teachers", () => {
    for (const key of C1_ACTIONS) {
      const entry = capability(key);
      expect(entry, key).toBeDefined();
      expect(entry?.capabilityVersion, key).toBe("1.0.0");
      expect(entry?.descriptor.executionClass, key).toBe("action_execution");
      expect(entry?.descriptor.supportedRoles, key).toEqual(["caregiver", "lead_caregiver"]);
      expect(
        entry?.descriptor.concurrencyPolicy.headBindings.map((binding) => binding.headKey),
        key,
      ).toEqual(["child_media_attribution", "media_asset_revision", "care_group_scope"]);
    }
    // Correcting confirmed history is reviewed; confirming a candidate is not.
    expect(capability("supersede_child_media_attribution")?.descriptor.confirmationPolicy).toBe(
      "reviewable_commit",
    );
    expect(capability("confirm_child_media_attribution")?.descriptor.confirmationPolicy).toBe(
      "direct_commit",
    );
  });

  it("leaves the default-off G3-C2 face matcher entirely unregistered", () => {
    for (const key of manifest.capabilities.map((entry) => entry.capabilityKey)) {
      expect(key).not.toContain("face_match");
      expect(key).not.toContain("biometric");
    }
    const serialized = JSON.stringify(manifest);
    for (const forbidden of ["ClassScopedFaceMatch", "face_reference", "embedding"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("keeps the hard-rule tier above anything a classifier or institution says", () => {
    const source: ContentSafetySourceSignalV1 = {
      source_id: "capture-1",
      fact_kind: "media_photo",
      markers: ["body_privacy_or_toileting_imagery"],
    };
    const result = evaluateContentSafetyRoute({
      policy_ref: "syn-content-safety-1",
      policy_head: 2,
      sources: [source],
      classifier: {
        provider_revision: "provider-1",
        model_revision: "model-1",
        prompt_policy_revision: "prompt-1",
        status: "ok",
        risk_codes: [],
        confidence: 0.99,
      },
      institution: {
        policy_ref: "syn-institution-policy-1",
        policy_head: 4,
        raise_markers: {},
        minimum_tier: "ordinary",
      },
    });
    expect(result.assessment.route).toBe("direct_interaction_required");
  });

  it("resolves a blocked group photo by manual confirmation and nothing else", async () => {
    const media = {
      media_asset_id: "media-1",
      media_revision: 3,
      current_media_revision: 3,
      lifecycle: "ready" as const,
      visible_children: [
        {
          child_care_process_id: "child-1",
          attribution_status: "confirmed" as const,
          clearly_visible: true,
        },
        {
          child_care_process_id: "child-2",
          attribution_status: "candidate" as const,
          clearly_visible: true,
        },
      ],
    };
    const target = {
      target_key: "child-1~enrollment-1~grant-1",
      child_care_process_id: "child-1",
      enrollment_active: true,
      grant_allows: true,
      data_class_allowed: true,
      purpose_allowed: true,
      exposure_allows_child_ids: ["child-1", "child-2"],
    };

    const blocked = derivePublishEligibility(BOARD_INTEGRITY_KEY, scope, {
      process_state: "draft",
      media: [media],
      targets: [target],
    });
    expect(blocked.eligible).toBe(false);
    expect(blocked.route).toBe("needs_review");
    expect(blocked.blockingReasons).toContain("unconfirmed_visible_child");
    expect(blocked.resolutionPaths).toEqual([
      "correct_attribution",
      "remove_media_from_candidate",
      "remove_target",
      "split_process",
    ]);

    const facts: MediaAttributionFactsV1 = {
      authority: caregiverAuthority(),
      media_lifecycle: "ready",
      media_revision: 3,
      eligible_child_ids: ["child-1", "child-2"],
      attributions: [
        {
          attribution_id: "attr-2",
          child_care_process_id: "child-2",
          status: "candidate",
          revision: 1,
          source: "organizer_candidate",
        },
      ],
    };
    const confirmed = await confirmChildMediaAttribution(
      {
        integrity_key: BOARD_INTEGRITY_KEY,
        now,
        reads: {
          listAttributableMediaIds: async () => ["media-1"],
          loadMediaAttributionFacts: async () => facts,
        },
      },
      scope,
      {
        media_ref: issueMediaAssetTargetRef(BOARD_INTEGRITY_KEY, scope, "media-1"),
        operation_input: { childRef: issueChildOptionRef(BOARD_INTEGRITY_KEY, scope, "child-2") },
      },
    );
    expect(confirmed.status).toBe("committed");
    if (confirmed.status !== "committed") return;
    expect(confirmed.mediaRevision).toBe(3);

    const resolved = derivePublishEligibility(BOARD_INTEGRITY_KEY, scope, {
      process_state: "draft",
      media: [
        {
          ...media,
          visible_children: [
            media.visible_children[0]!,
            { ...media.visible_children[1]!, attribution_status: "confirmed" as const },
          ],
        },
      ],
      targets: [target],
    });
    expect(resolved.eligible).toBe(true);
    expect(resolved.route).toBe("publishable");
    // The publication still binds the exact unchanged original revision.
    expect(resolved.mediaRefs).toEqual(blocked.mediaRefs);
  });

  it("keeps an unresolved photo blocked when the audience may not see the other child", () => {
    const result = derivePublishEligibility(BOARD_INTEGRITY_KEY, scope, {
      process_state: "draft",
      media: [
        {
          media_asset_id: "media-1",
          media_revision: 3,
          current_media_revision: 3,
          lifecycle: "ready",
          visible_children: [
            {
              child_care_process_id: "child-1",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
            {
              child_care_process_id: "child-2",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
          ],
        },
      ],
      targets: [
        {
          target_key: "child-1~enrollment-1~grant-1",
          child_care_process_id: "child-1",
          enrollment_active: true,
          grant_allows: true,
          data_class_allowed: true,
          purpose_allowed: true,
          exposure_allows_child_ids: ["child-1"],
        },
      ],
    });
    expect(result.route).toBe("needs_review");
    expect(result.blockingReasons).toContain("exposure_not_allowed");
    // Confirming everyone is not enough; the exposure policy still governs.
    expect(result.eligible).toBe(false);
  });
});
