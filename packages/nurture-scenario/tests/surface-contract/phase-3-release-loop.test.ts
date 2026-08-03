import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { issueBoardSealedRef } from "../../src/harness/board-projection.js";
import { PUBLISH_PROCESS_TARGET_KIND } from "../../src/harness/publish-process.js";
import {
  resolvePublishSchedule,
  type InstitutionPublicationPolicyV1,
} from "../../src/harness/publish-schedule.js";
import {
  derivePartialReleaseFollowUp,
  releasePublishProcess,
  type ReleaseFactsV1,
} from "../../src/harness/publication-release.js";
import { redactPublication } from "../../src/harness/publication-safety.js";
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
      deliveryClass: string;
      confirmationPolicy: string;
      supportedRoles?: string[];
      dependencyGates: Array<{ dependencyKey: string; requiredGate: string }>;
      concurrencyPolicy: { headBindings: Array<{ headKey: string }> };
    };
  }>;
};

const D_ACTIONS = [
  "release_publish_process",
  "reschedule_publish_process",
  "correct_publication",
  "remove_publication_target_visibility",
  "redact_publication",
  "detach_publish_process_media",
  "discard_media_asset",
];

const capability = (key: string) =>
  manifest.capabilities.find((entry) => entry.capabilityKey === key);

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const PROCESS_KEY = "care-group-1~trigger-1";
const processRef = () =>
  issueBoardSealedRef(BOARD_INTEGRITY_KEY, scope, PUBLISH_PROCESS_TARGET_KIND, PROCESS_KEY);

const policy: InstitutionPublicationPolicyV1 = {
  policy_ref: "syn-publication-policy-1",
  policy_head: 5,
  policy_version: 2,
  institution_ref: "syn-institution-1",
  time_zone: "Asia/Shanghai",
  default_release_local_time: "17:00",
  retry_cutoff_local_time: "19:00",
  organize_idle_seconds: 600,
  organize_fallback_lead_seconds: 1800,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 60,
  automatic_organize_enabled: true,
  effective_from: "2026-01-01T00:00:00.000Z",
};

describe("Phase 3 publish and release loop", () => {
  it("registers every G3-D capability for class teachers only", () => {
    for (const key of D_ACTIONS) {
      const entry = capability(key);
      expect(entry, key).toBeDefined();
      expect(entry?.capabilityVersion, key).toBe("1.0.0");
      expect(entry?.descriptor.supportedRoles, key).toEqual(["caregiver", "lead_caregiver"]);
    }
    // Only the release itself can produce a host delivery candidate.
    expect(capability("release_publish_process")?.descriptor.deliveryClass).toBe(
      "action_delivery_candidate",
    );
    for (const key of D_ACTIONS.filter((entry) => entry !== "release_publish_process")) {
      expect(capability(key)?.descriptor.deliveryClass, key).toBe("none");
    }
  });

  it("gates schedule-dependent capabilities on the T-007 provider", () => {
    for (const key of ["release_publish_process", "reschedule_publish_process"]) {
      const gates = capability(key)?.descriptor.dependencyGates ?? [];
      expect(gates.map((gate) => gate.dependencyKey), key).toContain(
        "t007_publication_policy",
      );
      expect(
        gates.find((gate) => gate.dependencyKey === "t007_publication_policy")?.requiredGate,
        key,
      ).toBe("joint_conformance");
    }
    // Post-release safety must stay reachable without the policy provider.
    for (const key of ["correct_publication", "redact_publication"]) {
      expect(
        (capability(key)?.descriptor.dependencyGates ?? []).map((gate) => gate.dependencyKey),
        key,
      ).not.toContain("t007_publication_policy");
    }
  });

  it("keeps the visibility lineage append-only and the heavy action confirmed", () => {
    for (const key of [
      "correct_publication",
      "remove_publication_target_visibility",
      "redact_publication",
    ]) {
      expect(
        capability(key)?.descriptor.concurrencyPolicy.headBindings.map(
          (binding) => binding.headKey,
        ),
        key,
      ).toContain("publication_visibility_lineage");
      expect(capability(key)?.descriptor.executionClass, key).toBe("action_execution");
    }
    expect(capability("redact_publication")?.descriptor.confirmationPolicy).toBe(
      "strong_confirmation",
    );
    expect(capability("discard_media_asset")?.descriptor.confirmationPolicy).toBe(
      "strong_confirmation",
    );
    // An explicit send-now tap is the confirmation; no second dialog.
    expect(capability("release_publish_process")?.descriptor.confirmationPolicy).toBe(
      "direct_commit",
    );
  });

  it("closes the G3 adoption set: nothing is left unregistered", () => {
    for (const key of [
      "query_guardian_family_board",
      "organize_care_capture_batch",
      "confirm_child_media_attribution",
      ...D_ACTIONS,
    ]) {
      expect(capability(key), key).toBeDefined();
    }
    // G3-C2 stays default-off and unregistered.
    for (const key of manifest.capabilities.map((entry) => entry.capabilityKey)) {
      expect(key).not.toContain("face_match");
    }
  });

  it("resolves a window, fans out per target and freezes the shared revision", async () => {
    const resolved = resolvePublishSchedule({
      policy,
      now: new Date("2026-08-01T02:00:00.000Z"),
    });
    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;

    const facts: ReleaseFactsV1 = {
      authority: caregiverAuthority(),
      authorizing_role_current: true,
      process_state: "pending_release",
      current_revision: 4,
      has_unsaved_revision: false,
      edit_hold_active: false,
      schedule: resolved.schedule,
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
          ],
        },
      ],
      targets: [
        {
          target_key: "t-1",
          child_care_process_id: "child-1",
          enrollment_active: true,
          grant_allows: true,
          data_class_allowed: true,
          purpose_allowed: true,
          exposure_allows_child_ids: ["child-1"],
        },
        {
          target_key: "t-2",
          child_care_process_id: "child-1",
          enrollment_active: true,
          // This family's Grant was revoked between draft and send.
          grant_allows: false,
          data_class_allowed: true,
          purpose_allowed: true,
          exposure_allows_child_ids: ["child-1"],
        },
      ],
    };

    const decision = await releasePublishProcess(
      {
        integrity_key: BOARD_INTEGRITY_KEY,
        now: () => new Date("2026-08-01T09:30:00.000Z"),
        reads: {
          listReleasableProcessKeys: async () => [PROCESS_KEY],
          loadReleaseFacts: async () => facts,
          commitTargetRelease: async (input) => ({
            status: "committed",
            publication_ref: `pub-${input.target_key}`,
            receipt_ref: `receipt-${input.target_key}`,
          }),
        },
      },
      scope,
      {
        process_ref: processRef(),
        command_request_id: "command:release-1",
        trigger: "scheduler",
      },
    );
    expect(decision.status).toBe("released");
    if (decision.status === "denied") return;
    // One family received it, the other did not, and both facts survive.
    expect(decision.summary).toEqual({
      total: 2,
      committed: 1,
      rejected: 1,
      outcomeUnknown: 0,
    });
    expect(decision.frozenRevision).toBe(4);
    const followUp = derivePartialReleaseFollowUp(decision);
    expect(followUp.sharedRevisionEditable).toBe(false);
    expect(followUp.requiresNewProcessForContentChange).toBe(true);
    expect(followUp.retryableTargets).toHaveLength(1);
  });

  it("keeps a post-release redaction possible without any T-007 policy", async () => {
    const decision = await redactPublication(
      {
        integrity_key: BOARD_INTEGRITY_KEY,
        now: () => new Date("2027-03-01T10:00:00.000Z"),
        reads: {
          listSafetyProcessKeys: async () => [PROCESS_KEY],
          loadPublicationSafetyFacts: async () => ({
            authority: caregiverAuthority(),
            process_state: "released",
            publications: [
              {
                publication_id: "pub-1",
                target_key: "t-1",
                receipt_id: "receipt-1",
                release_revision: 4,
                visibility: "visible",
                events: [],
              },
            ],
          }),
        },
      },
      scope,
      { process_ref: processRef(), operation_input: { reason: "family_request" } },
    );
    expect(decision.status).toBe("appended");
    if (decision.status !== "appended") return;
    expect(decision.events[0]?.preservedReceiptRef).toBeDefined();
    expect(decision.events[0]?.sourceReleaseRevision).toBe(4);
  });
});
