const childOwnerRefPrefix = "nurture_child_binding_anchor_v1:";
const familyOwnerRefPrefix = "nurture_family_binding_anchor_v1:";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NurtureBindingSubjectType = "child" | "family";
export type NurtureBindingAnchorStatus =
  | "reserved"
  | "bound_empty"
  | "associated"
  | "revoked"
  | "quarantined"
  | "retired";

export type NurtureBindingOwnerRef = {
  subjectType: NurtureBindingSubjectType;
  anchorId: string;
  value: string;
};

export type NurtureScenarioOwnerVerificationInput = {
  workspaceId: string;
  actingUserId: string;
  idempotencyKey: string;
  subjectType: NurtureBindingSubjectType;
  subjectId: string;
  scenarioKey: "nurture";
  ownerRef: string;
  ownerVersion: number;
  actingActorId: string;
  representedOrganizationId?: string;
  purpose: "scenario_binding_write";
  correlationId?: string;
  traceId?: string;
};

export type NurtureScenarioOwnerAuthorizationReceipt = {
  authorizationRef: string;
  workspaceId: string;
  subjectType: NurtureBindingSubjectType;
  subjectId: string;
  scenarioKey: "nurture";
  ownerRef: string;
  ownerVersion: number;
  authorizedActorId: string;
  representedOrganizationId?: string;
  purpose: "scenario_binding_write";
  verifiedAt: Date;
  expiresAt: Date;
};

/**
 * HTTP-free application input for reserving a typed Nurture anchor and issuing
 * one current owner-authorization receipt. Transport adapters own snake_case
 * parsing; the authorizer owns no request/response framework concepts.
 */
export type ScenarioBindingAuthorizeInput = {
  workspaceId: string;
  actingUserId: string;
  idempotencyKey: string;
  subjectType: NurtureBindingSubjectType;
  subjectId: string;
  scenarioKey: "nurture";
  actingActorId: string;
  representedOrganizationId?: string;
  purpose: "scenario_binding_write";
  correlationId?: string;
  traceId?: string;
};

export type ScenarioBindingOwnerAuthorizer = {
  authorize(
    input: ScenarioBindingAuthorizeInput,
  ): Promise<NurtureScenarioOwnerAuthorizationReceipt>;
};

export type NurtureBindingAuthorityEvidence = {
  authorizationSourceRef: string;
  authorizationSourceVersion: number;
  verifiedAt: Date;
  expiresAt: Date;
};

export type VerifyCurrentNurtureBindingAuthorityInput = Omit<
  NurtureScenarioOwnerVerificationInput,
  "subjectId" | "scenarioKey" | "idempotencyKey"
> & {
  anchorId: string;
};

export type NurtureBindingEvidenceHasher = {
  hash(parts: readonly string[]): string;
};

export type ReserveNurtureBindingAnchorInput = {
  subjectType: NurtureBindingSubjectType;
  reservationKeyHash: string;
};

export type ReservedNurtureBindingAnchor = {
  ownerRef: string;
  ownerVersion: number;
  status: NurtureBindingAnchorStatus;
  replayed: boolean;
};

export type IssueNurtureBindingAuthorizationInput = {
  anchorId: string;
  subjectType: NurtureBindingSubjectType;
  workspaceId: string;
  ownerRef: string;
  ownerVersion: number;
  idempotencyKeyHash: string;
  requestFingerprint: string;
  subjectEvidenceHash: string;
  userEvidenceHash: string;
  actorEvidenceHash: string;
  organizationEvidenceHash?: string;
  purpose: "scenario_binding_write";
  authorityInput: VerifyCurrentNurtureBindingAuthorityInput;
  now: Date;
};

export type IssuedNurtureBindingAuthorization = {
  authorizationRef: string;
  verifiedAt: Date;
  expiresAt: Date;
  replayed: boolean;
};

export type NurtureScenarioBindingAuthorizationRepository = {
  reserveAnchor(
    input: ReserveNurtureBindingAnchorInput,
  ): Promise<ReservedNurtureBindingAnchor>;
  issueAuthorization(
    input: IssueNurtureBindingAuthorizationInput,
  ): Promise<IssuedNurtureBindingAuthorization>;
};

export type NurtureScenarioBindingErrorCode =
  | "invalid_binding_request"
  | "invalid_owner_ref"
  | "anchor_not_found"
  | "anchor_not_current"
  | "owner_authorization_denied"
  | "owner_authorization_unavailable"
  | "authorization_replay_conflict"
  | "authorization_receipt_inactive";

export class NurtureScenarioBindingError extends Error {
  readonly code: NurtureScenarioBindingErrorCode;

  constructor(code: NurtureScenarioBindingErrorCode, message: string) {
    super(message);
    this.name = "NurtureScenarioBindingError";
    this.code = code;
  }
}

export class NurtureScenarioBindingOwnerVerifier {
  constructor(
    private readonly repository: NurtureScenarioBindingAuthorizationRepository,
    private readonly evidenceHasher: NurtureBindingEvidenceHasher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  reserveAnchor(
    subjectType: NurtureBindingSubjectType,
    reservationKey: string,
  ): Promise<ReservedNurtureBindingAnchor> {
    requireSubjectType(subjectType);
    const normalizedKey = requireText(reservationKey, "reservation key", 512);
    return this.repository.reserveAnchor({
      subjectType,
      reservationKeyHash: this.evidenceHasher.hash([
        "nurture_binding_anchor_reservation_v1",
        subjectType,
        normalizedKey,
      ]),
    });
  }

  async verify(
    input: NurtureScenarioOwnerVerificationInput,
  ): Promise<NurtureScenarioOwnerAuthorizationReceipt> {
    validateVerificationInput(input);
    const ownerRef = parseNurtureBindingOwnerRef(input.ownerRef);
    if (ownerRef.subjectType !== input.subjectType) {
      throw new NurtureScenarioBindingError(
        "invalid_owner_ref",
        "The owner reference type does not match the binding subject.",
      );
    }

    const now = this.now();
    const optionalOrganization = input.representedOrganizationId ?? "";
    const hash = (label: string, value: string) =>
      this.evidenceHasher.hash([
        "nurture_scenario_binding_authorization_v1",
        label,
        value,
      ]);
    const idempotencyKeyHash = hash(
      "idempotency_key",
      `${input.workspaceId}\u0000${input.idempotencyKey}`,
    );
    const requestFingerprint = this.evidenceHasher.hash([
      "nurture_scenario_binding_authorization_request_v1",
      input.workspaceId,
      input.actingUserId,
      input.idempotencyKey,
      input.subjectType,
      input.subjectId,
      input.scenarioKey,
      input.ownerRef,
      String(input.ownerVersion),
      input.actingActorId,
      optionalOrganization,
      input.purpose,
    ]);
    const issued = await this.repository.issueAuthorization({
      anchorId: ownerRef.anchorId,
      subjectType: input.subjectType,
      workspaceId: input.workspaceId,
      ownerRef: input.ownerRef,
      ownerVersion: input.ownerVersion,
      idempotencyKeyHash,
      requestFingerprint,
      subjectEvidenceHash: hash("subject", input.subjectId),
      userEvidenceHash: hash("user", input.actingUserId),
      actorEvidenceHash: hash("actor", input.actingActorId),
      organizationEvidenceHash: optionalOrganization
        ? hash("organization", optionalOrganization)
        : undefined,
      purpose: input.purpose,
      authorityInput: {
        workspaceId: input.workspaceId,
        actingUserId: input.actingUserId,
        actingActorId: input.actingActorId,
        representedOrganizationId: input.representedOrganizationId,
        subjectType: input.subjectType,
        ownerRef: input.ownerRef,
        ownerVersion: input.ownerVersion,
        purpose: input.purpose,
        correlationId: input.correlationId,
        traceId: input.traceId,
        anchorId: ownerRef.anchorId,
      },
      now,
    });

    return {
      authorizationRef: issued.authorizationRef,
      workspaceId: input.workspaceId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      scenarioKey: input.scenarioKey,
      ownerRef: input.ownerRef,
      ownerVersion: input.ownerVersion,
      authorizedActorId: input.actingActorId,
      representedOrganizationId: input.representedOrganizationId,
      purpose: input.purpose,
      verifiedAt: issued.verifiedAt,
      expiresAt: issued.expiresAt,
    };
  }
}

export function formatNurtureBindingOwnerRef(
  subjectType: NurtureBindingSubjectType,
  anchorId: string,
): string {
  requireSubjectType(subjectType);
  if (!uuidPattern.test(anchorId)) {
    throw new NurtureScenarioBindingError(
      "invalid_owner_ref",
      "The binding anchor identifier is invalid.",
    );
  }
  return `${
    subjectType === "child" ? childOwnerRefPrefix : familyOwnerRefPrefix
  }${anchorId.toLowerCase()}`;
}

export function parseNurtureBindingOwnerRef(
  value: string,
): NurtureBindingOwnerRef {
  const subjectType = value.startsWith(childOwnerRefPrefix)
    ? "child"
    : value.startsWith(familyOwnerRefPrefix)
      ? "family"
      : undefined;
  if (!subjectType) {
    throw new NurtureScenarioBindingError(
      "invalid_owner_ref",
      "The owner reference namespace and object type are invalid.",
    );
  }
  const prefix =
    subjectType === "child" ? childOwnerRefPrefix : familyOwnerRefPrefix;
  const anchorId = value.slice(prefix.length);
  const canonical = formatNurtureBindingOwnerRef(subjectType, anchorId);
  if (canonical !== value) {
    throw new NurtureScenarioBindingError(
      "invalid_owner_ref",
      "The owner reference is not canonical.",
    );
  }
  return { subjectType, anchorId, value };
}

function validateVerificationInput(
  input: NurtureScenarioOwnerVerificationInput,
): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The binding request must be an object.",
    );
  }
  const allowedFields = new Set([
    "workspaceId",
    "actingUserId",
    "idempotencyKey",
    "subjectType",
    "subjectId",
    "scenarioKey",
    "ownerRef",
    "ownerVersion",
    "actingActorId",
    "representedOrganizationId",
    "purpose",
    "correlationId",
    "traceId",
  ]);
  if (Object.keys(input).some((field) => !allowedFields.has(field))) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The binding request contains an unsupported field.",
    );
  }
  requireText(input.workspaceId, "workspace id", 128);
  requireText(input.actingUserId, "acting user id", 128);
  requireText(input.idempotencyKey, "idempotency key", 512);
  requireSubjectType(input.subjectType);
  requireText(input.subjectId, "subject id", 128);
  requireText(input.ownerRef, "owner reference", 256);
  requireText(input.actingActorId, "acting actor id", 128);
  if (input.scenarioKey !== "nurture") {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "Nurture can verify only the nurture scenario key.",
    );
  }
  if (input.purpose !== "scenario_binding_write") {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The binding purpose is invalid.",
    );
  }
  if (!Number.isSafeInteger(input.ownerVersion) || input.ownerVersion < 1) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The owner version must be a positive integer.",
    );
  }
  if (input.representedOrganizationId !== undefined) {
    requireText(
      input.representedOrganizationId,
      "represented organization id",
      128,
    );
  }
  if (input.correlationId !== undefined) {
    requireText(input.correlationId, "correlation id", 128);
  }
  if (input.traceId !== undefined) {
    requireText(input.traceId, "trace id", 128);
  }
}

export function validateNurtureBindingAuthorityEvidence(
  evidence: NurtureBindingAuthorityEvidence,
  now: Date,
): void {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new NurtureScenarioBindingError(
      "owner_authorization_denied",
      "Current Nurture binding authority returned invalid evidence.",
    );
  }
  const allowedFields = new Set([
    "authorizationSourceRef",
    "authorizationSourceVersion",
    "verifiedAt",
    "expiresAt",
  ]);
  if (Object.keys(evidence).some((field) => !allowedFields.has(field))) {
    throw new NurtureScenarioBindingError(
      "owner_authorization_denied",
      "Current Nurture binding authority returned unsupported evidence.",
    );
  }
  requireText(
    evidence.authorizationSourceRef,
    "authorization source reference",
    512,
  );
  if (
    !Number.isSafeInteger(evidence.authorizationSourceVersion) ||
    evidence.authorizationSourceVersion < 1 ||
    !(evidence.verifiedAt instanceof Date) ||
    Number.isNaN(evidence.verifiedAt.getTime()) ||
    evidence.verifiedAt > now ||
    !(evidence.expiresAt instanceof Date) ||
    Number.isNaN(evidence.expiresAt.getTime()) ||
    evidence.expiresAt <= now ||
    evidence.expiresAt <= evidence.verifiedAt
  ) {
    throw new NurtureScenarioBindingError(
      "owner_authorization_denied",
      "Current Nurture binding authority was not established.",
    );
  }
}

function requireSubjectType(
  value: NurtureBindingSubjectType,
): NurtureBindingSubjectType {
  if (value !== "child" && value !== "family") {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The binding subject type is invalid.",
    );
  }
  return value;
}

function requireText(value: string, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      `The ${label} is invalid.`,
    );
  }
  const normalized = value.trim();
  if (!normalized || normalized !== value || normalized.length > maxLength) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      `The ${label} is invalid.`,
    );
  }
  return normalized;
}
