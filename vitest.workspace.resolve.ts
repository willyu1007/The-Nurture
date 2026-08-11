const source = (path: string): string => new URL(path, import.meta.url).pathname;

/**
 * Source aliases keep qualification independent from stale workspace builds;
 * production package exports continue to resolve compiled artifacts.
 */
export const workspaceResolve = {
  extensionAlias: { ".js": [".ts", ".js"] },
  alias: {
    "@the-nurture/scenario/binding-owner": source(
      "./packages/nurture-scenario/src/binding-owner.ts",
    ),
    "@the-nurture/scenario/binding-owner-http": source(
      "./packages/nurture-scenario/src/binding-owner-http.ts",
    ),
    "@the-nurture/scenario/harness": source(
      "./packages/nurture-scenario/src/harness-entry.ts",
    ),
    "@the-nurture/scenario/family-growth": source(
      "./packages/nurture-scenario/src/family-growth.ts",
    ),
    "@the-nurture/db/binding-owner": source(
      "./packages/nurture-db/src/binding-owner.ts",
    ),
    "@the-nurture/db/harness": source(
      "./packages/nurture-db/src/harness-entry.ts",
    ),
  },
} as const;
