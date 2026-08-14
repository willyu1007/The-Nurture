import assert from "node:assert/strict";
import { test } from "node:test";
import { replaceAnchoredLiteral } from "./reseal-cross-repo-pins.mjs";

const NEW = "b".repeat(40);

test("replaces the anchored value and the preceding comment block", () => {
  const source = [
    "const expected = {",
    '  baseHead: "x",',
    "  // old note line one",
    "  // old note line two",
    `  hostHead: "${"a".repeat(40)}",`,
    "};",
    "",
  ].join("\n");
  const output = replaceAnchoredLiteral(
    source,
    String.raw`hostHead: "[0-9a-f]{40}"`,
    NEW,
    ["2026-08-14 reseal: fresh note"],
  );
  assert.ok(output.includes(`hostHead: "${NEW}"`));
  assert.ok(output.includes("  // 2026-08-14 reseal: fresh note"));
  assert.ok(!output.includes("old note line"));
  assert.ok(output.includes('baseHead: "x"'));
});

test("handles a bare string literal anchored by its following label line", () => {
  const source = [
    "assertEqual(",
    "  workflowPin.myChat?.revision,",
    "  // stale rationale",
    `  "${"a".repeat(40)}",`,
    '  "My-Chat revision",',
    ");",
    "",
  ].join("\n");
  const output = replaceAnchoredLiteral(
    source,
    String.raw`"[0-9a-f]{40}",\n\s*"My-Chat revision",`,
    NEW,
    ["note alpha", "note beta"],
  );
  assert.ok(output.includes(`  "${NEW}",`));
  assert.ok(output.includes("  // note alpha\n  // note beta"));
  assert.ok(!output.includes("stale rationale"));
});

test("throws when the anchor is missing", () => {
  assert.throws(
    () => replaceAnchoredLiteral("const x = 1;", String.raw`hostHead: "[0-9a-f]{40}"`, NEW, ["n"]),
    /Anchor not found/u,
  );
});
