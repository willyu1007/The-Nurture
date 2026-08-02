import { readFileSync } from "node:fs";
import type { InterfaceContractRefV1 } from "./types.js";

/**
 * The separately trusted artifact pin. The ingress must bind the exact
 * admitted contract identity rather than a literal copy that could drift from
 * the generated artifact, so it is read from the pin itself.
 */
export const loadSurfaceContractPin = (): InterfaceContractRefV1 => {
  const pin = JSON.parse(
    readFileSync(
      new URL(
        "../../contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { interfaceContract?: InterfaceContractRefV1 };
  if (
    !pin.interfaceContract ||
    typeof pin.interfaceContract.key !== "string" ||
    typeof pin.interfaceContract.version !== "string" ||
    typeof pin.interfaceContract.digest !== "string"
  ) {
    throw new Error("nurture surface contract pin is malformed");
  }
  return pin.interfaceContract;
};

export type BoardSurfaceRegistrationRefV1 = {
  surfaceKey: string;
  surfaceVersion: string;
  orderedContentKinds: readonly string[];
};

/**
 * The registered module order for one board surface. The ingress must present
 * exactly the frozen order — a presenter that chose its own would decide module
 * composition, which belongs to the registry.
 */
export const loadBoardSurfaceRegistration = (
  surfaceKey: string,
): BoardSurfaceRegistrationRefV1 => {
  const registry = JSON.parse(
    readFileSync(
      new URL(
        "../../contracts/surfaces/v1/source/surfaces/surface-registry.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { surfaces?: BoardSurfaceRegistrationRefV1[] };
  const surface = registry.surfaces?.find((entry) => entry.surfaceKey === surfaceKey);
  if (!surface || !Array.isArray(surface.orderedContentKinds)) {
    throw new Error(`nurture surface registration is missing: ${surfaceKey}`);
  }
  return {
    surfaceKey: surface.surfaceKey,
    surfaceVersion: surface.surfaceVersion,
    orderedContentKinds: surface.orderedContentKinds,
  };
};
