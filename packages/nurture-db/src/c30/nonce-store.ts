import { Prisma, type PrismaClient } from "@prisma/client";
import {
  nurtureSha256Hex,
  type NurtureScenarioNonceConsumptionV1,
  type NurtureScenarioNonceStore,
} from "@the-nurture/scenario";

export class PrismaNurtureScenarioNonceStore implements NurtureScenarioNonceStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly maximumRecords = 100_000,
  ) {
    if (!Number.isSafeInteger(maximumRecords) || maximumRecords < 1) {
      throw new Error("maximumRecords must be a positive safe integer");
    }
  }

  async consumeOnce(input: NurtureScenarioNonceConsumptionV1, now: Date): Promise<boolean> {
    const expiresAt = new Date(input.expires_at);
    if (
      Number.isNaN(now.getTime())
      || Number.isNaN(expiresAt.getTime())
      || expiresAt <= now
      || !/^[A-Za-z0-9_-]{43}$/u.test(input.body_sha256)
    ) {
      return false;
    }
    const scopeHash = hashFields([
      input.issuer,
      input.assertion_audience,
      input.caller_subject,
      input.credential_subject,
      input.nonce,
    ]);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.nurtureScenarioInvocationNonce.deleteMany({
          where: { expiresAt: { lte: now } },
        });
        const population = await transaction.nurtureScenarioInvocationNonce.count();
        if (population >= this.maximumRecords) return false;
        await transaction.nurtureScenarioInvocationNonce.create({
          data: {
            scopeHash,
            requestIdHash: hashFields([input.request_id]),
            bodySha256: input.body_sha256,
            expiresAt,
            consumedAt: now,
          },
        });
        return true;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isUniqueConflict(error) || isSerializationConflict(error)) return false;
      throw error;
    }
  }
}

function hashFields(fields: readonly string[]): string {
  return nurtureSha256Hex(Buffer.from(fields.map((field) => `${field.length}:${field}`).join("|"), "utf8"));
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isSerializationConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}
