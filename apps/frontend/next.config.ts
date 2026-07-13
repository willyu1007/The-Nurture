import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND = process.env.NURTURE_BACKEND_URL ?? "http://localhost:3001";
const WORKSPACE_PARENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const config: NextConfig = {
  // The web-workbench kit ships ESM + a CSS side-effect; transpile it.
  transpilePackages: ["@willyu1007/web-workbench"],
  // The pinned source dependency is a sibling checkout of The-Nurture in local and CI workspaces.
  turbopack: { root: WORKSPACE_PARENT },
  // Same-origin proxy so client fetches avoid CORS (server components hit BACKEND directly).
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
      { source: "/internal/:path*", destination: `${BACKEND}/internal/:path*` },
    ];
  },
};

export default config;
