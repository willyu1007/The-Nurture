import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

const tsFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? tsFiles(full) : full.endsWith(".ts") ? [full] : [];
  });

describe("architecture invariant: business layer is Prisma-free", () => {
  it("no scenario src file references @prisma/client or @the-nurture/db (any import form)", () => {
    // Match the package root in ANY quoted specifier — static `from`, side-effect
    // `import "..."`, dynamic `import(...)`, `require(...)`, and subpaths like
    // @prisma/client/runtime/library — not just the bare `from "..."` form.
    const PRISMA = /["']@prisma\/client(\/[^"']*)?["']/;
    const DB = /["']@the-nurture\/db(\/[^"']*)?["']/;
    const offenders = tsFiles(SRC).filter((f) => {
      const src = readFileSync(f, "utf8");
      return PRISMA.test(src) || DB.test(src);
    });
    expect(offenders, `Prisma/db import leaked into the business layer: ${offenders.join(", ")}`).toEqual([]);
  });
});
