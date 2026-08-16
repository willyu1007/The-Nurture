import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORKSPACE_PARENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// No backend proxy: the legacy host this app used to call is retired, and no
// controller serves institution_workbench yet. The rewrite comes back when the
// real scenario-service ingress exists, pointed at that service rather than at
// the retired host's port.
const config: NextConfig = {
  // The web-workbench kit ships ESM + a CSS side-effect; transpile it.
  transpilePackages: ["@willyu1007/web-workbench"],
  // The pinned source dependency is a sibling checkout of The-Nurture in local and CI workspaces.
  turbopack: { root: WORKSPACE_PARENT },
};

export default config;
