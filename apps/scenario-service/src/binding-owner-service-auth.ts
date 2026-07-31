import { timingSafeEqual } from "node:crypto";

export type BindingOwnerServiceAuth = Readonly<{
  configured: boolean;
  bearerAuthorized(header: string | undefined): boolean;
}>;

export function createBindingOwnerServiceAuth(
  token: string | undefined,
): BindingOwnerServiceAuth {
  const expected = token ? Buffer.from(token, "utf8") : undefined;

  return Object.freeze({
    configured: expected !== undefined,
    bearerAuthorized(header: string | undefined): boolean {
      if (!expected || !header?.startsWith("Bearer ")) return false;
      const supplied = Buffer.from(header.slice("Bearer ".length), "utf8");
      return (
        supplied.length === expected.length &&
        timingSafeEqual(supplied, expected)
      );
    },
  });
}
