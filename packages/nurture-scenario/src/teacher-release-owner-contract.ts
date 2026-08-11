import {
  nurtureCanonicalJsonBytes,
  nurtureSha256Hex,
} from "./c30/canonical-json.js";

export const TEACHER_RELEASE_OWNER_QUERY_PATH =
  "/internal/nurture/teacher-release-owner/v3/query";
export const TEACHER_RELEASE_OWNER_TARGETS_PATH =
  "/internal/nurture/teacher-release-owner/v3/targets";
export const TEACHER_RELEASE_OWNER_PREPARE_PATH =
  "/internal/nurture/teacher-release-owner/v3/prepare";
export const TEACHER_RELEASE_OWNER_CONFIRM_PATH =
  "/internal/nurture/teacher-release-owner/v3/confirm";

/**
 * The canonical, body-free description hashed by the private owner interface.
 * It deliberately composes the already-frozen surface/action contracts instead
 * of copying their schemas into a second owner contract.
 */
export const TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR = {
  schema_version: 3,
  interface_key: "nurture.teacher-release-owner",
  interface_version: "3.0.0",
  transport: {
    authentication: "service_bearer",
    cache_control: "private, no-store",
    method: "POST",
  },
  dependencies: {
    surface_contract: {
      key: "nurture.surface-contract",
      version: "1.20.0",
      digest:
        "sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273",
    },
    query_capability: {
      key: "query_teacher_publish_queue",
      version: "1.0.0",
    },
    release_capability: {
      key: "release_publish_process",
      version: "1.0.0",
    },
  },
  requests: {
    identity_required: [
      "interface_contract",
      "workspace_id",
      "my_chat_user_id",
      "host_request_id",
    ],
    identity_optional: ["host_conversation_ref"],
    query: {
      path: TEACHER_RELEASE_OWNER_QUERY_PATH,
      optional: ["page_size", "cursor"],
    },
    targets: {
      path: TEACHER_RELEASE_OWNER_TARGETS_PATH,
      required: ["process_ref", "action_option_ref"],
    },
    prepare: {
      path: TEACHER_RELEASE_OWNER_PREPARE_PATH,
      required: [
        "process_ref",
        "action_option_ref",
        "target_snapshot_ref",
      ],
    },
    confirm: {
      path: TEACHER_RELEASE_OWNER_CONFIRM_PATH,
      required: [
        "invocation_request_id",
        "command_request_id",
        "confirmation_ref",
      ],
    },
  },
  responses: {
    envelope_variants: ["ready", "needs_clarification", "unavailable"],
    query_variants: ["ok", "refresh_required"],
    targets_variants: ["ok"],
    prepare_variants: ["ready_to_confirm", "needs_input"],
    confirm_variants: ["committed", "not_committed", "outcome_unknown"],
    unavailable_reason_codes: ["access_changed", "unavailable"],
    clarification_reason_codes: [
      "ambiguous_context",
      "weak_context",
      "candidate_limit_exceeded",
    ],
    confirm_reason_codes: [
      "confirmation_expired",
      "confirmation_replayed",
      "invalid_confirmation",
      "stale_confirmation",
    ],
  },
  wire_schema: {
    dialect: "closed-json-shape-v1",
    scalar_constraints: {
      id: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$",
      ref: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,2047}$",
      confirmation_ref: "^[A-Za-z0-9_-]{32,256}$",
      instant: "canonical UTC ISO 8601 instant with milliseconds",
      non_negative_integer: "JSON safe integer >= 0",
    },
    requests: {
      common: {
        required: [
          "interface_contract",
          "workspace_id",
          "my_chat_user_id",
          "host_request_id",
        ],
        optional: ["host_conversation_ref"],
        interface_contract: "exact interface key, version and digest",
      },
      query: {
        optional: ["page_size", "cursor"],
        page_size: "integer 1..20",
      },
      prepare: {
        required: [
          "process_ref",
          "action_option_ref",
          "target_snapshot_ref",
        ],
        invariants: [
          "process_ref equals action_option_ref",
          "target_snapshot_ref is an unexpired actor-bound snapshot returned by targets",
        ],
      },
      targets: {
        required: ["process_ref", "action_option_ref"],
        invariant: "process_ref equals action_option_ref",
      },
      confirm: {
        required: [
          "invocation_request_id",
          "command_request_id",
          "confirmation_ref",
        ],
      },
    },
    outer_response: {
      variants: {
        ready: { required: ["status", "result"] },
        needs_clarification: {
          required: [
            "status",
            "scenario_token",
            "interaction",
            "safe_reason_code",
          ],
          scenario_token: {
            required: ["token", "purpose", "expires_at"],
            purpose: ["clarify"],
          },
          interaction: {
            required: ["kind", "title", "options"],
            kind: ["single_choice"],
            option_required: ["option_token", "label"],
            option_optional: ["description"],
          },
        },
        unavailable: { required: ["status", "safe_reason_code"] },
      },
    },
    query_result: {
      variants: {
        ok: { required: ["status", "output"] },
        refresh_required: { required: ["status"] },
      },
      output:
        "exact query_teacher_publish_queue@1.0.0 output under the pinned surface contract",
      projection_constraints: [
        "only release_publish_process@1.0.0 actions cross this interface",
        "title is non-empty and at most 200 characters",
        "all keys are closed recursively",
      ],
    },
    targets_result: {
      required: ["status", "detail"],
      status: ["ok"],
      detail: {
        required: [
          "selectionMode",
          "processRef",
          "targetSnapshotRef",
          "snapshotVersion",
          "generatedAt",
          "expiresAt",
          "targets",
        ],
        selectionMode: ["fixed_process_targets"],
        target_available_required: [
          "targetRef",
          "availability",
          "displayLabel",
        ],
        target_available_optional: ["safeDisambiguation"],
        available_values: ["available", "already_released"],
        target_unavailable_required: [
          "targetRef",
          "availability",
          "safeReasonCode",
        ],
        unavailable_value: ["unavailable"],
        safe_reason_code: ["target_unavailable"],
        constraints: [
          "targets contains the complete fixed process target set",
          "targetRef, targetSnapshotRef and snapshotVersion are opaque refs",
          "displayLabel and safeDisambiguation are non-empty and at most 80 characters",
          "unavailable targets expose neither label nor owner policy reason",
          "all keys are closed recursively",
        ],
      },
    },
    prepare_result: {
      variants: {
        ready_to_confirm: {
          required: [
            "status",
            "preview",
            "confirmation_ref",
            "expires_at",
            "command_request_id",
          ],
          preview: {
            required: [
              "effect",
              "target_count",
              "already_committed_count",
              "release_revision",
            ],
            effect: ["release_publish_process"],
          },
        },
        needs_input: {
          required: ["status", "fields"],
          fields: ["target", "target_snapshot"],
        },
      },
    },
    confirm_result: {
      variants: {
        committed: {
          required: [
            "status",
            "execution_disposition",
            "business_outcome",
            "committed_result",
          ],
          execution_disposition: ["executed", "replayed"],
          business_outcome: ["applied", "already_satisfied"],
          committed_result: {
            required: [
              "processState",
              "frozenRevision",
              "results",
              "summary",
              "missedSendAttention",
            ],
            processState: ["released"],
            target_required: ["targetRef", "outcome"],
            target_optional: ["publicationRef", "receiptRef", "reasonCode"],
            outcomes: [
              "committed",
              "already_committed",
              "rejected",
              "outcome_unknown",
            ],
            rejected_reason: ["target_not_released"],
            summary_required: [
              "total",
              "committed",
              "rejected",
              "outcomeUnknown",
            ],
            invariants: [
              "summary equals the exact result census",
              "at least one target is committed or already_committed",
              "committed targets have both publicationRef and receiptRef",
              "non-committed targets have neither publicationRef nor receiptRef",
            ],
          },
        },
        not_committed: {
          required: ["status", "decision", "reason_code", "recovery"],
          decision: ["blocked", "conflict"],
          recovery: ["none", "refresh", "reprepare"],
          decision_recovery_by_reason: {
            confirmation_expired: ["conflict", "reprepare"],
            confirmation_replayed: ["conflict", "refresh"],
            invalid_confirmation: ["blocked", "none"],
            stale_confirmation: ["conflict", "reprepare"],
          },
        },
        outcome_unknown: {
          required: ["status", "reason_code", "recovery"],
          reason_code: ["release_outcome_unknown"],
          recovery: ["reconcile_same_command"],
        },
      },
    },
  },
  invariants: [
    "host_never_supplies_nurture_participant_role_or_scope",
    "owner_resolution_reruns_before_query_targets_prepare_and_confirm",
    "caregiver_or_lead_caregiver_exact_care_group_only",
    "target_review_represents_the_fixed_process_set_and_is_not_subset_selection",
    "prepare_requires_the_current_actor_bound_target_snapshot",
    "confirm_revalidates_the_reviewed_target_snapshot_before_any_target_effect",
    "raw_target_and_identity_ids_never_cross_the_boundary",
    "foreign_request_and_response_fields_are_rejected",
    "owner_policy_reason_codes_do_not_cross_the_boundary",
    "confirm_replay_never_creates_a_substitute_command",
  ],
} as const;

export const computeTeacherReleaseOwnerContractDigest = (): string =>
  `sha256:${nurtureSha256Hex(
    nurtureCanonicalJsonBytes(TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR),
  )}`;

export const TEACHER_RELEASE_OWNER_INTERFACE = {
  key: TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.interface_key,
  version: TEACHER_RELEASE_OWNER_CONTRACT_DESCRIPTOR.interface_version,
  // Checked against the canonical descriptor in contract tests.
  digest:
    "sha256:b17970ed6ad8b1db36737348c54c14cae00a02bf4074b902fcc9c5d81cf5ae73",
} as const;

export type TeacherReleaseOwnerInterfaceRefV3 =
  typeof TEACHER_RELEASE_OWNER_INTERFACE;
