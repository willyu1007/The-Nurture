import { createHash } from "node:crypto";

/**
 * SSOT for the PostgreSQL writer fence shared by command execution and
 * cross-owner settlement reconciliation. Any no-effect decision must hold
 * this exact transaction-scoped advisory lock before checking for execution.
 */
export function nurtureCommandAdvisoryKey(
  workspaceId: string,
  commandRequestIdHash: string,
): bigint {
  const digest = createHash("sha256")
    .update(
      `nurture.command-lock.v1\0${workspaceId}\0${commandRequestIdHash}`,
      "utf8",
    )
    .digest();
  return BigInt.asIntN(64, digest.readBigUInt64BE(0));
}
