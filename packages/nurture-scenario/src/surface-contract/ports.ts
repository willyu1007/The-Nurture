import type { VersionedRefV1 } from "./types.js";

export type VersionedPortBindingV1<TImplementation> = VersionedRefV1 & {
  implementation: TImplementation;
};

export class SurfaceContractPortError extends Error {
  readonly code = "dependency_no_go";
}

export function requireExactPortBinding<TImplementation>(
  expected: VersionedRefV1,
  supplied: VersionedPortBindingV1<TImplementation> | undefined,
): TImplementation {
  if (
    !supplied ||
    supplied.key !== expected.key ||
    supplied.version !== expected.version
  ) {
    throw new SurfaceContractPortError(
      `Required exact port ${expected.key}@${expected.version} is unavailable`,
    );
  }
  return supplied.implementation;
}
