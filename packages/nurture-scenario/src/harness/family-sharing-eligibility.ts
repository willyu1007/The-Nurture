import { createHash } from "node:crypto";

export const NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE =
  "family_nurture_sharing_authorization" as const;

export const NURTURE_FAMILY_SHARING_CATEGORIES = [
  "daily_activity",
  "media",
  "focus_collaboration",
] as const;

export type NurtureFamilySharingCategory =
  (typeof NURTURE_FAMILY_SHARING_CATEGORIES)[number];

export type NurtureFamilySharingDirection =
  | "nurture_to_family"
  | "family_to_nurture";

export const NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY: Readonly<
  Record<NurtureFamilySharingCategory, NurtureFamilySharingDirection>
> = {
  daily_activity: "nurture_to_family",
  media: "family_to_nurture",
  focus_collaboration: "family_to_nurture",
};

/**
 * Nurture-owned private decision interface. It is intentionally independent of
 * the product surface manifest: resolving eligibility is not an action offer or
 * a capability activation.
 */
export const NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_SCHEMA_V1 = {
  key: "nurture.family-sharing-eligibility",
  version: "1.0.0",
  request: {
    fields: [
      "workspace_id",
      "my_chat_user_id",
      "host_request_id",
      "parent_context_ref",
      "purpose",
      "interface_contract",
    ],
    carrier: "scenario_private_invocation_with_current_binding_evidence",
    raw_child_or_family_ids: "forbidden",
  },
  response: {
    statuses: ["resolved", "unavailable"],
    resolved_fields: [
      "contract",
      "purpose",
      "authority_version",
      "evaluated_at",
      "categories",
    ],
    categories: [
      { category_key: "daily_activity", direction: "nurture_to_family" },
      { category_key: "media", direction: "family_to_nurture" },
      {
        category_key: "focus_collaboration",
        direction: "family_to_nurture",
      },
    ],
    category_fields: [
      "category_key",
      "direction",
      "eligibility",
      "source_lifecycle",
      "destination_lifecycle",
    ],
    eligibility: ["eligible", "ineligible"],
    lifecycle: ["active", "inactive"],
    eligible_requires_both_lifecycles_active: true,
  },
  authority: {
    owner: "nurture",
    identity_or_binding_as_authority: "forbidden",
    current_reread: [
      "role",
      "grant",
      "release",
      "receiving_eligibility",
      "source_lifecycle",
      "destination_lifecycle",
    ],
    eligible_requires: "all_current_authority_facts_and_active_lifecycles",
    cache: "forbidden",
    failure: "unavailable",
  },
  privacy: {
    response_forbidden: [
      "participant_or_role_ids",
      "grant_or_policy_ids",
      "raw_child_or_family_ids",
      "authority_evidence",
      "protected_content",
    ],
  },
  compatibility: {
    admission: "exact_key_version_digest",
    version_ranges: "forbidden",
    latest_alias: "forbidden",
    fallback: "forbidden",
  },
} as const;

const computedInterfaceDigest = `sha256:${createHash("sha256")
  .update(
    JSON.stringify(NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_SCHEMA_V1),
    "utf8",
  )
  .digest("hex")}` as const;

export const NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_DIGEST =
  "sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8" as const;

if (
  computedInterfaceDigest !==
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_DIGEST
) {
  throw new Error(
    `Nurture family-sharing eligibility interface changed without an exact digest rotation: ${computedInterfaceDigest}`,
  );
}

export const NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE = {
  key: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_SCHEMA_V1.key,
  version: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_SCHEMA_V1.version,
  digest: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_DIGEST,
} as const;

export type NurtureFamilySharingEligibilityRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  parent_context_ref: string;
  purpose: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE;
  interface_contract: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE;
}>;

export type NurtureFamilySharingEligibilityCategoryV1 = Readonly<{
  category_key: NurtureFamilySharingCategory;
  direction: NurtureFamilySharingDirection;
  eligibility: "eligible" | "ineligible";
  source_lifecycle: "active" | "inactive";
  destination_lifecycle: "active" | "inactive";
}>;

export type NurtureFamilySharingEligibilityResultV1 =
  | Readonly<{
      status: "resolved";
      contract: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE;
      purpose: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE;
      authority_version: string;
      evaluated_at: string;
      categories: readonly NurtureFamilySharingEligibilityCategoryV1[];
    }>
  | Readonly<{ status: "unavailable" }>;

export type NurtureFamilySharingAuthorityCategoryFactsV1 = Readonly<{
  category_key: NurtureFamilySharingCategory;
  direction: NurtureFamilySharingDirection;
  role_authorized: boolean;
  grant_authorized: boolean;
  release_authorized: boolean;
  receiving_authorized: boolean;
  source_lifecycle: "active" | "inactive";
  destination_lifecycle: "active" | "inactive";
}>;

export type NurtureFamilySharingAuthoritySnapshotV1 = Readonly<{
  authority_version: string;
  categories: readonly NurtureFamilySharingAuthorityCategoryFactsV1[];
}>;

/**
 * The adapter behind this port must resolve a current typed platform binding
 * and reread Nurture canonical authority. The raw host user id alone is never a
 * valid lookup or authorization path.
 */
export type NurtureFamilySharingAuthorityPort = Readonly<{
  loadCurrentFamilySharingAuthority(input: {
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    parent_context_ref: string;
    purpose: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE;
  }): Promise<NurtureFamilySharingAuthoritySnapshotV1>;
}>;

export async function resolveNurtureFamilySharingEligibility(
  deps: Readonly<{
    authority: NurtureFamilySharingAuthorityPort;
    now?: () => Date;
  }>,
  request: unknown,
): Promise<NurtureFamilySharingEligibilityResultV1> {
  if (!isEligibilityRequest(request)) return { status: "unavailable" };

  try {
    const snapshot = await deps.authority.loadCurrentFamilySharingAuthority({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      host_request_id: request.host_request_id,
      parent_context_ref: request.parent_context_ref,
      purpose: request.purpose,
    });
    if (!isAuthoritySnapshot(snapshot)) return { status: "unavailable" };

    const factsByCategory = new Map(
      snapshot.categories.map((facts) => [facts.category_key, facts]),
    );
    const evaluatedAt = (deps.now ?? (() => new Date()))().toISOString();

    return {
      status: "resolved",
      contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      authority_version: snapshot.authority_version,
      evaluated_at: evaluatedAt,
      categories: NURTURE_FAMILY_SHARING_CATEGORIES.map((categoryKey) =>
        deriveCategoryEligibility(factsByCategory.get(categoryKey)!),
      ),
    };
  } catch {
    return { status: "unavailable" };
  }
}

function deriveCategoryEligibility(
  facts: NurtureFamilySharingAuthorityCategoryFactsV1,
): NurtureFamilySharingEligibilityCategoryV1 {
  const eligibility =
    facts.role_authorized &&
    facts.grant_authorized &&
    facts.release_authorized &&
    facts.receiving_authorized &&
    facts.source_lifecycle === "active" &&
    facts.destination_lifecycle === "active"
      ? "eligible"
      : "ineligible";
  return {
    category_key: facts.category_key,
    direction: facts.direction,
    eligibility,
    source_lifecycle: facts.source_lifecycle,
    destination_lifecycle: facts.destination_lifecycle,
  };
}

function isEligibilityRequest(
  value: unknown,
): value is NurtureFamilySharingEligibilityRequestV1 {
  return (
    isRecord(value) &&
    exactKeys(value, [
      "workspace_id",
      "my_chat_user_id",
      "host_request_id",
      "parent_context_ref",
      "purpose",
      "interface_contract",
    ]) &&
    isOpaqueText(value.workspace_id, 191) &&
    isOpaqueText(value.my_chat_user_id, 191) &&
    isOpaqueText(value.host_request_id, 191) &&
    isOpaqueText(value.parent_context_ref, 512) &&
    value.purpose === NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE &&
    isExactInterfaceContract(value.interface_contract)
  );
}

function isAuthoritySnapshot(
  value: unknown,
): value is NurtureFamilySharingAuthoritySnapshotV1 {
  if (
    !isRecord(value) ||
    !exactKeys(value, ["authority_version", "categories"]) ||
    !isOpaqueText(value.authority_version, 256) ||
    !Array.isArray(value.categories) ||
    value.categories.length !== NURTURE_FAMILY_SHARING_CATEGORIES.length ||
    !value.categories.every(isAuthorityCategoryFacts)
  ) {
    return false;
  }
  const categoryKeys = new Set(
    value.categories.map((facts) => facts.category_key),
  );
  return NURTURE_FAMILY_SHARING_CATEGORIES.every((key) =>
    categoryKeys.has(key),
  );
}

function isAuthorityCategoryFacts(
  value: unknown,
): value is NurtureFamilySharingAuthorityCategoryFactsV1 {
  return (
    isRecord(value) &&
    exactKeys(value, [
      "category_key",
      "direction",
      "role_authorized",
      "grant_authorized",
      "release_authorized",
      "receiving_authorized",
      "source_lifecycle",
      "destination_lifecycle",
    ]) &&
    isCategory(value.category_key) &&
    value.direction ===
      NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[value.category_key] &&
    typeof value.role_authorized === "boolean" &&
    typeof value.grant_authorized === "boolean" &&
    typeof value.release_authorized === "boolean" &&
    typeof value.receiving_authorized === "boolean" &&
    (value.source_lifecycle === "active" ||
      value.source_lifecycle === "inactive") &&
    (value.destination_lifecycle === "active" ||
      value.destination_lifecycle === "inactive")
  );
}

function isExactInterfaceContract(value: unknown): boolean {
  return (
    isRecord(value) &&
    exactKeys(value, ["key", "version", "digest"]) &&
    value.key === NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE.key &&
    value.version === NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE.version &&
    value.digest === NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE.digest
  );
}

function isCategory(value: unknown): value is NurtureFamilySharingCategory {
  return NURTURE_FAMILY_SHARING_CATEGORIES.some((key) => key === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
): boolean {
  return (
    required.every((key) => key in value) &&
    Object.keys(value).every((key) => required.includes(key))
  );
}

function isOpaqueText(value: unknown, maximumLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximumLength &&
    value === value.trim() &&
    ![...value].some((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
    })
  );
}
