import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  formatNurtureBindingOwnerRef,
  type IssueNurtureBindingAuthorizationInput,
} from "@the-nurture/scenario";
import { HmacNurtureBindingEvidenceHasher } from "../src/binding-evidence-hasher.js";
import { PrismaNurtureScenarioBindingAuthorizationRepository } from "../src/repositories/scenario-binding-owner.repository.js";

const childAnchorId = "55a6c91b-dac9-4a17-9d61-dff098243d42";
const familyAnchorId = "6975acbe-7272-4e5d-acad-b85140070598";
const now = new Date("2026-07-28T13:00:00.000Z");

describe("HmacNurtureBindingEvidenceHasher", () => {
  it("requires an explicit high-entropy key", () => {
    expect(() => new HmacNurtureBindingEvidenceHasher("short")).toThrow(
      /at least 32 bytes/,
    );
  });

  it("length-frames evidence parts to avoid concatenation ambiguity", () => {
    const hasher = new HmacNurtureBindingEvidenceHasher("k".repeat(32));

    expect(hasher.hash(["ab", "c"])).toMatch(/^[0-9a-f]{64}$/);
    expect(hasher.hash(["ab", "c"])).not.toBe(hasher.hash(["a", "bc"]));
  });
});

describe("PrismaNurtureScenarioBindingAuthorizationRepository", () => {
  it("reserves and exact-replays one body-free child anchor", async () => {
    const prisma = new FakePrismaClient();
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );

    const first = await repository.reserveAnchor({
      subjectType: "child",
      reservationKeyHash: digest("reservation"),
    });
    const recoveredRepository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );
    const replay = await recoveredRepository.reserveAnchor({
      subjectType: "child",
      reservationKeyHash: digest("reservation"),
    });

    expect(first).toMatchObject({
      ownerVersion: 1,
      status: "reserved",
      replayed: false,
    });
    expect(replay).toEqual({ ...first, replayed: true });
    expect(prisma.transaction.childAnchorsCreated).toBe(1);
  });

  it("persists a typed family anchor and authorization without a child-anchor alias", async () => {
    const prisma = new FakePrismaClient({
      familyAnchor: anchor({
        id: familyAnchorId,
        reservationKeyHash: digest("family-reservation"),
      }),
    });
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );

    const issued = await repository.issueAuthorization(
      issueInput({
        anchorId: familyAnchorId,
        subjectType: "family",
        ownerRef: formatNurtureBindingOwnerRef("family", familyAnchorId),
      }),
    );

    expect(issued.replayed).toBe(false);
    expect(prisma.transaction.authorizationCreateData).toMatchObject({
      subjectType: "family",
      familyAnchorId,
    });
    expect(
      prisma.transaction.authorizationCreateData?.childAnchorId,
    ).toBeUndefined();
  });

  it("issues and exact-replays an authorization without persisting platform subject or actor ids", async () => {
    const prisma = new FakePrismaClient({ childAnchor: anchor() });
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );
    const input = issueInput();

    const first = await repository.issueAuthorization(input);
    const replay = await repository.issueAuthorization(input);

    expect(first.replayed).toBe(false);
    expect(replay).toEqual({ ...first, replayed: true });
    expect(prisma.transaction.authorizationsCreated).toBe(1);
    expect(prisma.transaction.anchorLocks).toBe(2);
    expect(
      JSON.stringify(prisma.transaction.authorizationCreateData),
    ).not.toContain("platform-child-1");
    expect(
      JSON.stringify(prisma.transaction.authorizationCreateData),
    ).not.toContain("platform-actor-1");
  });

  it("rejects divergent payload replay under the same idempotency digest", async () => {
    const prisma = new FakePrismaClient({ childAnchor: anchor() });
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );
    await repository.issueAuthorization(issueInput());

    await expect(
      repository.issueAuthorization({
        ...issueInput(),
        requestFingerprint: digest("different-request"),
      }),
    ).rejects.toMatchObject({ code: "authorization_replay_conflict" });
    expect(prisma.transaction.authorizationsCreated).toBe(1);
  });

  it("rejects a stale anchor version before issuing a receipt", async () => {
    const prisma = new FakePrismaClient({ childAnchor: anchor() });
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );

    await expect(
      repository.issueAuthorization({ ...issueInput(), ownerVersion: 2 }),
    ).rejects.toMatchObject({ code: "anchor_not_current" });
    expect(prisma.transaction.authorizationsCreated).toBe(0);
  });

  it("rejects replay of a revoked receipt", async () => {
    const prisma = new FakePrismaClient({
      childAnchor: anchor(),
      authorization: {
        id: "authorization-1",
        requestFingerprint: digest("request"),
        status: "revoked",
        verifiedAt: now,
        expiresAt: new Date("2026-07-28T13:05:00.000Z"),
      },
    });
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(
        prisma as unknown as PrismaClient,
      );

    await expect(
      repository.issueAuthorization(issueInput()),
    ).rejects.toMatchObject({ code: "authorization_receipt_inactive" });
  });
});

type AnchorRow = {
  id: string;
  reservationKeyHash: string;
  status: string;
  aggregateVersion: number;
};
type AuthorizationRow = {
  id: string;
  requestFingerprint: string;
  status: string;
  verifiedAt: Date;
  expiresAt: Date;
};

type FakeOptions = {
  childAnchor?: AnchorRow;
  familyAnchor?: AnchorRow;
  authorization?: AuthorizationRow;
};

class FakePrismaClient {
  readonly transaction: FakeTransaction;

  constructor(options: FakeOptions = {}) {
    this.transaction = new FakeTransaction(options);
  }

  $transaction<TResult>(
    callback: (transaction: FakeTransaction) => Promise<TResult>,
  ): Promise<TResult> {
    return callback(this.transaction);
  }
}

class FakeTransaction {
  childAnchorsCreated = 0;
  authorizationsCreated = 0;
  anchorLocks = 0;
  authorizationCreateData?: Record<string, unknown>;
  private childAnchor: AnchorRow | null;
  private familyAnchor: AnchorRow | null;
  private authorization: AuthorizationRow | null;

  constructor(options: FakeOptions) {
    this.childAnchor = options.childAnchor ?? null;
    this.familyAnchor = options.familyAnchor ?? null;
    this.authorization = options.authorization ?? null;
  }

  $queryRaw(query: {
    strings: readonly string[];
    values: readonly unknown[];
  }): Promise<AnchorRow[]> {
    this.anchorLocks += 1;
    const tableSql = query.strings.join("");
    const candidate = tableSql.includes("nurture_child_binding_anchor")
      ? this.childAnchor
      : this.familyAnchor;
    return Promise.resolve(
      candidate && query.values[0] === candidate.id ? [candidate] : [],
    );
  }

  readonly nurtureChildBindingAnchor = {
    findUnique: async (args: { where: Record<string, unknown> }) => {
      if (!this.childAnchor) return null;
      if (
        "reservationKeyHash" in args.where &&
        args.where.reservationKeyHash !== this.childAnchor.reservationKeyHash
      ) {
        return null;
      }
      if ("id" in args.where && args.where.id !== this.childAnchor.id) {
        return null;
      }
      return this.childAnchor;
    },
    upsert: async (args: { create: Record<string, unknown> }) => {
      if (this.childAnchor) return this.childAnchor;
      this.childAnchorsCreated += 1;
      this.childAnchor = anchor({
        id: String(args.create.id),
        reservationKeyHash: String(args.create.reservationKeyHash),
      });
      return this.childAnchor;
    },
  };

  readonly nurtureFamilyBindingAnchor = {
    findUnique: async (args: { where: Record<string, unknown> }) => {
      if (!this.familyAnchor) return null;
      if (
        "reservationKeyHash" in args.where &&
        args.where.reservationKeyHash !== this.familyAnchor.reservationKeyHash
      ) {
        return null;
      }
      if ("id" in args.where && args.where.id !== this.familyAnchor.id) {
        return null;
      }
      return this.familyAnchor;
    },
    upsert: async (args: { create: Record<string, unknown> }) => {
      if (this.familyAnchor) return this.familyAnchor;
      this.familyAnchor = anchor({
        id: String(args.create.id),
        reservationKeyHash: String(args.create.reservationKeyHash),
      });
      return this.familyAnchor;
    },
  };

  readonly nurtureScenarioBindingAuthorization = {
    findUnique: async (args: { where: { idempotencyKeyHash: string } }) => {
      if (
        !this.authorization ||
        args.where.idempotencyKeyHash !== digest("idempotency")
      ) {
        return null;
      }
      return this.authorization;
    },
    upsert: async (args: { create: Record<string, unknown> }) => {
      if (this.authorization) return this.authorization;
      this.authorizationsCreated += 1;
      this.authorizationCreateData = args.create;
      this.authorization = {
        id: String(args.create.id),
        requestFingerprint: String(args.create.requestFingerprint),
        status: String(args.create.status),
        verifiedAt: args.create.verifiedAt as Date,
        expiresAt: args.create.expiresAt as Date,
      };
      return this.authorization;
    },
  };
}

function anchor(overrides: Partial<AnchorRow> = {}) {
  return {
    id: childAnchorId,
    reservationKeyHash: digest("reservation"),
    status: "reserved",
    aggregateVersion: 1,
    ...overrides,
  };
}

function issueInput(
  overrides: Partial<IssueNurtureBindingAuthorizationInput> = {},
): IssueNurtureBindingAuthorizationInput {
  return {
    anchorId: childAnchorId,
    subjectType: "child",
    workspaceId: "workspace-1",
    ownerRef: formatNurtureBindingOwnerRef("child", childAnchorId),
    ownerVersion: 1,
    idempotencyKeyHash: digest("idempotency"),
    requestFingerprint: digest("request"),
    subjectEvidenceHash: digest("platform-child-1"),
    userEvidenceHash: digest("platform-user-1"),
    actorEvidenceHash: digest("platform-actor-1"),
    purpose: "scenario_binding_write",
    authorizationSourceRef: "nurture-binding-intent-1",
    authorizationSourceVersion: 1,
    verifiedAt: now,
    expiresAt: new Date("2026-07-28T13:05:00.000Z"),
    now,
    ...overrides,
  };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
