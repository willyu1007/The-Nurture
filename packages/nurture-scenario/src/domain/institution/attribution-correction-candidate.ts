import type { NurtureCommandSpec } from "../commands/command-kernel.js";
import { hashCommandRequestId } from "../commands/command-kernel.js";
import type { NurtureCareRole, NurturePolicyReasonCode } from "./institution-context.js";

export const ATTRIBUTION_CORRECTION_CONTRACT = {
  key: "nurture.child-attribution-authority",
  version: "1.0.0",
} as const;

export type NurtureAttributionCorrectionCandidateV1 = {
  contract_version: typeof ATTRIBUTION_CORRECTION_CONTRACT.version;
  candidate_ref: string;
  /** The exact immutable canonical revision this report is sourced from. */
  source_attribution_ref: string;
  raised_by_role_assignment_ref: string;
  reason: string;
  occurred_at: string;
};

export type NurtureAttributionCorrectionFacts = {
  source_attribution_ref: string;
  actor_role_assignment_ref: string;
  actor_role_kind: NurtureCareRole;
};

export type NurtureAttributionCorrectionFactsResult =
  | { status: "resolved"; facts: NurtureAttributionCorrectionFacts }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export type NurtureAttributionCorrectionCandidateReadResult =
  | {
      status: "resolved";
      source_attribution_ref: string;
      candidates: NurtureAttributionCorrectionCandidateV1[];
    }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export type NurtureAttributionCorrectionCandidateRepository = {
  loadAttributionCorrectionFacts(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    source_attribution_ref: string;
  }): Promise<NurtureAttributionCorrectionFactsResult>;
  listAttributionCorrectionCandidates(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    source_attribution_ref: string;
  }): Promise<NurtureAttributionCorrectionCandidateReadResult>;
};

export type NurtureAttributionCorrectionCandidateTransaction =
  NurtureAttributionCorrectionCandidateRepository & {
    appendAttributionCorrectionCandidate(input: {
      workspace_id: string;
      participant_ref: string;
      role_assignment_ref: string;
      source_attribution_ref: string;
      reason: string;
      command_request_id_hash: string;
    }): Promise<NurtureAttributionCorrectionCandidateV1 | null>;
  };

export type NurtureRaiseAttributionCorrectionPayload = {
  workspace_id: string;
  role_assignment_ref: string;
  source_attribution_ref: string;
  reason: string;
};

export type NurtureRaiseAttributionCorrectionCommand =
  NurtureRaiseAttributionCorrectionPayload & { action: "raise_attribution_correction" };

export type NurtureAttributionCorrectionDecision =
  | {
      status: "ready";
      source_attribution_ref: string;
      actor_role_assignment_ref: string;
      reason: string;
    }
  | {
      status: "denied";
      layer: "contract" | "authority";
      reason_code: "contract_mismatch" | "not_authorized";
    }
  | { status: "unavailable"; reason_code: string };

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const MAX_REASON_LENGTH = 1_000;

const validReference = (value: unknown): value is string =>
  typeof value === "string" && REFERENCE_PATTERN.test(value);

const hasOnlyKeys = (value: object, keys: readonly string[]): boolean =>
  Object.keys(value).every((key) => keys.includes(key));

export const validateAttributionCorrectionCommand = (
  command: NurtureRaiseAttributionCorrectionCommand,
): { status: "valid" } | { status: "invalid"; reason_code: "contract_mismatch" } =>
  hasOnlyKeys(command, [
    "action",
    "workspace_id",
    "role_assignment_ref",
    "source_attribution_ref",
    "reason",
  ]) &&
  command.action === "raise_attribution_correction" &&
  validReference(command.workspace_id) &&
  validReference(command.role_assignment_ref) &&
  validReference(command.source_attribution_ref) &&
  typeof command.reason === "string" &&
  command.reason.trim().length > 0 &&
  command.reason.length <= MAX_REASON_LENGTH
    ? { status: "valid" }
    : { status: "invalid", reason_code: "contract_mismatch" };

export const decideAttributionCorrectionCandidate = (input: {
  command: NurtureRaiseAttributionCorrectionCommand;
  facts: NurtureAttributionCorrectionFacts;
}): NurtureAttributionCorrectionDecision => {
  if (validateAttributionCorrectionCommand(input.command).status === "invalid") {
    return { status: "denied", layer: "contract", reason_code: "contract_mismatch" };
  }
  if (input.facts.source_attribution_ref !== input.command.source_attribution_ref) {
    return { status: "unavailable", reason_code: "attribution_owner_unavailable" };
  }
  if (input.facts.actor_role_assignment_ref !== input.command.role_assignment_ref) {
    return { status: "unavailable", reason_code: "attribution_owner_unavailable" };
  }
  // Role selection is exact. A dual-role participant acting through their
  // caregiver assignment does not inherit the separate Admin capability.
  if (input.facts.actor_role_kind !== "institution_admin") {
    return { status: "denied", layer: "authority", reason_code: "not_authorized" };
  }
  return {
    status: "ready",
    source_attribution_ref: input.facts.source_attribution_ref,
    actor_role_assignment_ref: input.facts.actor_role_assignment_ref,
    reason: input.command.reason,
  };
};

const commandOf = (
  payload: NurtureRaiseAttributionCorrectionPayload,
): NurtureRaiseAttributionCorrectionCommand => ({
  action: "raise_attribution_correction",
  ...payload,
});

export const raiseAttributionCorrectionSpec: NurtureCommandSpec<NurtureRaiseAttributionCorrectionPayload> = {
  command_key: "nurture.raise_attribution_correction",
  command_scope: "child_media_attribution",
  contract_version: 1,
  canonicalize: commandOf,
  async checkPreconditions(transaction, payload, context) {
    const corrections = transaction.attributionCorrections;
    if (!corrections) {
      return { status: "invalid", reason_code: "attribution_correction_owner_unavailable" };
    }
    const command = commandOf(payload);
    if (
      validateAttributionCorrectionCommand(command).status === "invalid" ||
      payload.workspace_id !== context.workspace_id
    ) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const facts = await corrections.loadAttributionCorrectionFacts({
      workspace_id: context.workspace_id,
      participant_ref: context.business_actor_ref,
      role_assignment_ref: payload.role_assignment_ref,
      source_attribution_ref: payload.source_attribution_ref,
    });
    if (facts.status === "denied") {
      return { status: "blocked", reason_code: facts.reason_code };
    }
    if (facts.status === "unavailable") {
      return { status: "blocked", reason_code: "unavailable" };
    }
    const decision = decideAttributionCorrectionCandidate({ command, facts: facts.facts });
    if (decision.status === "unavailable") {
      return { status: "blocked", reason_code: "unavailable" };
    }
    if (decision.status === "denied") {
      return decision.layer === "contract"
        ? { status: "invalid", reason_code: decision.reason_code }
        : { status: "blocked", reason_code: decision.reason_code };
    }
    return { status: "ready" };
  },
  async apply(transaction, payload, context) {
    const corrections = transaction.attributionCorrections;
    if (!corrections) throw new Error("attribution correction owner adapter is not wired");
    const candidate = await corrections.appendAttributionCorrectionCandidate({
      workspace_id: context.workspace_id,
      participant_ref: context.business_actor_ref,
      role_assignment_ref: payload.role_assignment_ref,
      source_attribution_ref: payload.source_attribution_ref,
      reason: payload.reason,
      command_request_id_hash: hashCommandRequestId(
        context.workspace_id,
        context.command_request_id,
      ),
    });
    if (!candidate) throw new Error("attribution_correction_write_unavailable");
    return {
      output_refs: [
        {
          schema_version: 1,
          namespace: "nurture",
          object_type: "attribution_correction_candidate",
          object_id: candidate.candidate_ref,
          version: 1,
        },
      ],
      result_schema_version: 1,
      committed_result: {
        candidate_ref: candidate.candidate_ref,
        source_attribution_ref: candidate.source_attribution_ref,
      },
    };
  },
};

export type NurtureAttributionCorrectionQueryResult =
  | {
      status: "resolved";
      contract_version: typeof ATTRIBUTION_CORRECTION_CONTRACT.version;
      source_attribution_ref: string;
      candidates: NurtureAttributionCorrectionCandidateV1[];
    }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export class NurtureAttributionCorrectionCandidateQueryService {
  constructor(private readonly repository: NurtureAttributionCorrectionCandidateRepository) {}

  async query(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    source_attribution_ref: string;
  }): Promise<NurtureAttributionCorrectionQueryResult> {
    try {
      const result = await this.repository.listAttributionCorrectionCandidates(input);
      if (result.status !== "resolved") return result;
      return {
        status: "resolved",
        contract_version: ATTRIBUTION_CORRECTION_CONTRACT.version,
        source_attribution_ref: result.source_attribution_ref,
        candidates: result.candidates,
      };
    } catch {
      return { status: "unavailable", reason_code: "attribution_correction_owner_unavailable" };
    }
  }
}
