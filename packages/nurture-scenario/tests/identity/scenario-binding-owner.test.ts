import { describe, expect, it } from "vitest";
import {
  NurtureScenarioBindingError,
  NurtureScenarioBindingOwnerVerifier,
  formatNurtureBindingOwnerRef,
  type IssueNurtureBindingAuthorizationInput,
  type NurtureScenarioBindingAuthorizationRepository,
  type NurtureScenarioOwnerVerificationInput,
} from "../../src/domain/identity/scenario-binding-owner.js";

const now = new Date("2026-07-28T13:00:00.000Z");
const childAnchorId = "55a6c91b-dac9-4a17-9d61-dff098243d42";

describe("NurtureScenarioBindingOwnerVerifier", () => {
  it("issues a My-Chat-compatible receipt with exact workspace and actor context", async () => {
    let issued: IssueNurtureBindingAuthorizationInput | undefined;
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository({
        issueAuthorization: async (input) => {
          issued = input;
          return {
            authorizationRef:
              "nurture_scenario_binding_authorization_v1:receipt-1",
            verifiedAt: now,
            expiresAt: new Date("2026-07-28T13:05:00.000Z"),
            replayed: false,
          };
        },
      }),
      { hash: (parts) => `hash:${parts[0]}:${parts.length}` },
      () => now,
    );

    const receipt = await verifier.verify(request());

    expect(issued).toMatchObject({
      anchorId: childAnchorId,
      workspaceId: "workspace-1",
      ownerVersion: 1,
      purpose: "scenario_binding_write",
      authorityInput: {
        workspaceId: "workspace-1",
        actingUserId: "user-1",
        actingActorId: "actor-1",
        subjectType: "child",
        anchorId: childAnchorId,
        purpose: "scenario_binding_write",
      },
    });
    expect(issued?.requestFingerprint).not.toContain("child-1");
    expect(receipt).toMatchObject({
      workspaceId: "workspace-1",
      subjectType: "child",
      subjectId: "child-1",
      scenarioKey: "nurture",
      ownerRef: formatNurtureBindingOwnerRef("child", childAnchorId),
      ownerVersion: 1,
      authorizedActorId: "actor-1",
      purpose: "scenario_binding_write",
    });
  });

  it("rejects a wrong owner-reference object type before authority lookup", async () => {
    let authorityRead = false;
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository({
        issueAuthorization: async () => {
          authorityRead = true;
          throw new Error("unexpected");
        },
      }),
      { hash: (parts) => parts.join("|") },
      () => now,
    );

    await expect(
      verifier.verify({
        ...request(),
        ownerRef: formatNurtureBindingOwnerRef(
          "family",
          "6975acbe-7272-4e5d-acad-b85140070598",
        ),
      }),
    ).rejects.toMatchObject({ code: "invalid_owner_ref" });
    await expect(
      verifier.verify(null as unknown as NurtureScenarioOwnerVerificationInput),
    ).rejects.toMatchObject({ code: "invalid_binding_request" });
    expect(authorityRead).toBe(false);
  });

  it("propagates the repository's fail-closed authority decision", async () => {
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository({
        issueAuthorization: async () => {
          throw new NurtureScenarioBindingError(
            "owner_authorization_unavailable",
            "Authority is not configured.",
          );
        },
      }),
      { hash: (parts) => parts.join("|") },
      () => now,
    );

    await expect(verifier.verify(request())).rejects.toMatchObject({
      code: "owner_authorization_unavailable",
    });
  });

  it("rejects a self-asserted care role instead of treating it as Host or Education authority", async () => {
    let authorityRead = false;
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository({
        issueAuthorization: async () => {
          authorityRead = true;
          throw new Error("unexpected");
        },
      }),
      { hash: (parts) => parts.join("|") },
      () => now,
    );

    await expect(
      verifier.verify({
        ...request(),
        careRole: "guardian",
      } as unknown as NurtureScenarioOwnerVerificationInput),
    ).rejects.toMatchObject({ code: "invalid_binding_request" });
    expect(authorityRead).toBe(false);
  });

  it("rejects an Education scenario request before Nurture authority lookup", async () => {
    let authorityRead = false;
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository({
        issueAuthorization: async () => {
          authorityRead = true;
          throw new Error("unexpected");
        },
      }),
      { hash: (parts) => parts.join("|") },
      () => now,
    );

    await expect(
      verifier.verify({
        ...request(),
        scenarioKey: "education",
      } as unknown as NurtureScenarioOwnerVerificationInput),
    ).rejects.toMatchObject({ code: "invalid_binding_request" });
    expect(authorityRead).toBe(false);
  });

  it("uses a keyed digest for anchor reservation idempotency", async () => {
    let reservationKeyHash: string | undefined;
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository({
        reserveAnchor: async (input) => {
          reservationKeyHash = input.reservationKeyHash;
          return {
            ownerRef: formatNurtureBindingOwnerRef("child", childAnchorId),
            ownerVersion: 1,
            status: "reserved",
            replayed: false,
          };
        },
      }),
      { hash: (parts) => `digest:${parts.join("|")}` },
      () => now,
    );

    await verifier.reserveAnchor("child", "private-reservation-key");

    expect(reservationKeyHash).toContain("digest:");
    expect(reservationKeyHash).not.toBe("private-reservation-key");
  });
});

function request(): NurtureScenarioOwnerVerificationInput {
  return {
    workspaceId: "workspace-1",
    actingUserId: "user-1",
    idempotencyKey: "idempotency-1",
    subjectType: "child",
    subjectId: "child-1",
    scenarioKey: "nurture",
    ownerRef: formatNurtureBindingOwnerRef("child", childAnchorId),
    ownerVersion: 1,
    actingActorId: "actor-1",
    purpose: "scenario_binding_write",
    correlationId: "correlation-1",
  };
}

function repository(
  overrides: Partial<NurtureScenarioBindingAuthorizationRepository> = {},
): NurtureScenarioBindingAuthorizationRepository {
  return {
    reserveAnchor: async () => ({
      ownerRef: formatNurtureBindingOwnerRef("child", childAnchorId),
      ownerVersion: 1,
      status: "reserved",
      replayed: false,
    }),
    issueAuthorization: async (input) => ({
      authorizationRef: "nurture_scenario_binding_authorization_v1:receipt-1",
      verifiedAt: input.now,
      expiresAt: new Date(input.now.getTime() + 5 * 60_000),
      replayed: false,
    }),
    ...overrides,
  };
}
