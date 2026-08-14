#!/usr/bin/env node
/**
 * Cross-repo pin reseal tool. Any commit that touches a pinned source
 * population (the workflow-contract pin covers whole source trees plus the
 * lockfile) must reseal the recorded hashes; this tool replaces the manual
 * chain proven on 2026-08-14.
 *
 * Subcommands:
 *   plan            (default) report every stale pin/lock/literal; write nothing
 *   apply --note "" rewrite the pin JSON and the three revision literals, then
 *                   run the pin/g2/upstream verifiers. Commit the result, then:
 *   lock            regenerate docs/project/integrations/c30-i3-owner-adoption-lock.json
 *                   at the current committed HEAD and verify it. Commit again.
 *
 * The two-step split exists because the owner-adoption lock binds a committed
 * source revision; it can only be minted after the apply commit exists.
 * My-Chat's own scenario-host-adoption lock is checked but never written from
 * here — refresh and commit it in My-Chat first when stale. A Base revision
 * move is refused without --allow-base-move because Base adoption is a
 * governance decision, not a mechanical reseal.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeContractHash } from "./verify-workflow-contract-pin.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const myChatRoot = path.resolve(repoRoot, "..", "My-Chat");
const baseRoot = path.resolve(repoRoot, "..", "My-Workflow-Base");
const pinPath = path.join(repoRoot, "docs/project/integrations/my-chat-workflow-contract.json");
const ownerLockPath = path.join(
  repoRoot,
  "docs/project/integrations/c30-i3-owner-adoption-lock.json",
);
const myChatLockPath = path.join(
  myChatRoot,
  "packages/workflow-runtime/conformance/scenario-host-adoption-lock.json",
);

const LITERAL_FILES = {
  upstream: path.join(scriptsDir, "verify-c30-i3-upstream.mjs"),
  g2: path.join(scriptsDir, "assert-g2-exit-contract.mjs"),
  ownerAdoption: path.join(scriptsDir, "compute-c30-i3-owner-adoption-hash.mjs"),
};

const run = (command, args, cwd = repoRoot, env = {}) =>
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  }).trim();

const gitHead = (root) => run("git", ["rev-parse", "HEAD"], root);
const gitClean = (root) => run("git", ["status", "--porcelain"], root) === "";

const resolveInside = (root, sub) => (sub === "." ? root : path.join(root, sub));

/**
 * Replaces the value of `anchor: "<value>"` (or a bare `"<value>",` line for
 * the g2 assert) together with the consecutive `//` comment block immediately
 * above it. Exported for the node --test suite.
 */
export const replaceAnchoredLiteral = (source, anchorPattern, newValue, noteLines) => {
  const anchor = new RegExp(anchorPattern, "u");
  const match = anchor.exec(source);
  if (!match || match.index === undefined) {
    throw new Error(`Anchor not found: ${anchorPattern}`);
  }
  const lineStart = source.lastIndexOf("\n", match.index) + 1;
  const indent = /^[ \t]*/u.exec(source.slice(lineStart))?.[0] ?? "";
  let blockStart = lineStart;
  for (;;) {
    const previousEnd = blockStart - 1;
    if (previousEnd < 0) break;
    const previousStart = source.lastIndexOf("\n", previousEnd - 1) + 1;
    const previousLine = source.slice(previousStart, previousEnd);
    if (!previousLine.trimStart().startsWith("//")) break;
    blockStart = previousStart;
  }
  const comment = noteLines.map((line) => `${indent}// ${line}`).join("\n");
  const replacedAnchor = source
    .slice(match.index, match.index + match[0].length)
    .replace(/"[0-9a-f]{40,64}"/u, `"${newValue}"`);
  return `${source.slice(0, blockStart)}${comment}\n${indent}${source
    .slice(lineStart, match.index)
    .slice(indent.length)}${replacedAnchor}${source.slice(match.index + match[0].length)}`;
};

const wrapNote = (note, width = 74) => {
  const words = note.split(/\s+/u).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && `${current} ${word}`.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const collectState = async () => {
  const pin = JSON.parse(readFileSync(pinPath, "utf8"));
  const myChatHead = gitHead(myChatRoot);
  const baseHead = gitHead(baseRoot);
  const myChatLock = JSON.parse(readFileSync(myChatLockPath, "utf8"));
  const findings = [];
  const note = (label, expected, actual) => {
    if (expected !== actual) findings.push({ label, expected, actual });
  };

  note("myWorkflowBase.revision", pin.myWorkflowBase.revision, baseHead);
  note("myChat.revision", pin.myChat.revision, myChatHead);

  const scenario = await computeContractHash(
    resolveInside(repoRoot, pin.nurtureScenario.contractRoot),
    pin.nurtureScenario.contractPaths,
  );
  note("nurtureScenario.contractSha256", pin.nurtureScenario.contractSha256, scenario.sha256);

  for (const [label, root, entry] of [
    ["myWorkflowBase.contractSha256", baseRoot, pin.myWorkflowBase],
    ["myChat.contractSha256", myChatRoot, pin.myChat],
  ]) {
    const computed = await computeContractHash(
      resolveInside(root, entry.contractRoot),
      entry.contractPaths,
    );
    note(label, entry.contractSha256, computed.sha256);
  }
  for (const [label, root, pins] of [
    ["myWorkflowBase", baseRoot, pin.myWorkflowBase.sourcePins ?? []],
    ["myChat", myChatRoot, pin.myChat.sourcePins ?? []],
  ]) {
    for (const sourcePin of pins) {
      const computed = await computeContractHash(
        resolveInside(root, sourcePin.root),
        sourcePin.paths,
      );
      note(`${label}.sourcePins.${sourcePin.key}`, sourcePin.sha256, computed.sha256);
    }
  }

  let myChatLockState = "ok";
  try {
    run(
      process.execPath,
      [
        "packages/workflow-runtime/conformance/compute-scenario-host-adoption-hash.mjs",
        "--check",
        "packages/workflow-runtime/conformance/scenario-host-adoption-lock.json",
      ],
      myChatRoot,
    );
  } catch {
    myChatLockState = "stale";
  }

  const upstreamSource = readFileSync(LITERAL_FILES.upstream, "utf8");
  const g2Source = readFileSync(LITERAL_FILES.g2, "utf8");
  const ownerSource = readFileSync(LITERAL_FILES.ownerAdoption, "utf8");
  const literalStale = {
    upstream: !upstreamSource.includes(`hostHead: "${myChatHead}"`),
    g2: !g2Source.includes(`"${myChatHead}",`),
    ownerAdoption:
      !ownerSource.includes(`head_revision: "${myChatHead}"`)
      || !ownerSource.includes(`runtime_revision: "${myChatLock.runtime_source_revision}"`)
      || !ownerSource.includes(`aggregate_source_hash: "${myChatLock.source_hash}"`),
  };

  return { pin, myChatHead, baseHead, myChatLock, myChatLockState, findings, literalStale };
};

const printPlan = (state) => {
  if (state.myChatLockState === "stale") {
    console.log("[stale] My-Chat scenario-host-adoption lock does not match its bytes.");
    console.log("        Refresh it in My-Chat first (update the sourceRevision literal in");
    console.log("        packages/workflow-runtime/conformance/compute-scenario-host-adoption-hash.mjs,");
    console.log("        regenerate the lock with that tool, commit, push), then rerun this plan.");
  }
  for (const finding of state.findings) {
    console.log(`[stale] ${finding.label}: ${String(finding.expected).slice(0, 12)} -> ${String(finding.actual).slice(0, 12)}`);
  }
  for (const [key, stale] of Object.entries(state.literalStale)) {
    if (stale) console.log(`[stale] literal:${key}`);
  }
  const clean = state.findings.length === 0
    && !Object.values(state.literalStale).some(Boolean)
    && state.myChatLockState === "ok";
  console.log(clean ? "[ok] every pin, lock and literal is current" : "[plan] run: pnpm reseal:pins apply --note \"<why>\"");
  return clean;
};

const apply = async (state, note, allowBaseMove) => {
  if (!note) throw new Error("apply requires --note \"<dated rationale for the literal comments>\"");
  if (!gitClean(myChatRoot)) throw new Error("My-Chat worktree must be clean and committed");
  if (!gitClean(baseRoot)) throw new Error("My-Workflow-Base worktree must be clean");
  if (state.myChatLockState === "stale") {
    throw new Error("My-Chat scenario-host-adoption lock is stale; refresh and commit it in My-Chat first");
  }
  if (state.pin.myWorkflowBase.revision !== state.baseHead && !allowBaseMove) {
    throw new Error("Base revision moved; Base adoption is a governance decision. Rerun with --allow-base-move only after that decision exists.");
  }

  const pin = state.pin;
  pin.myWorkflowBase.revision = state.baseHead;
  pin.myChat.revision = state.myChatHead;
  const scenario = await computeContractHash(
    resolveInside(repoRoot, pin.nurtureScenario.contractRoot),
    pin.nurtureScenario.contractPaths,
  );
  pin.nurtureScenario.contractSha256 = scenario.sha256;
  for (const [root, entry] of [
    [baseRoot, pin.myWorkflowBase],
    [myChatRoot, pin.myChat],
  ]) {
    const computed = await computeContractHash(
      resolveInside(root, entry.contractRoot),
      entry.contractPaths,
    );
    entry.contractSha256 = computed.sha256;
    for (const sourcePin of entry.sourcePins ?? []) {
      const computedPin = await computeContractHash(
        resolveInside(root, sourcePin.root),
        sourcePin.paths,
      );
      sourcePin.sha256 = computedPin.sha256;
    }
  }
  writeFileSync(pinPath, `${JSON.stringify(pin, null, 2)}\n`);

  const dated = `${new Date().toISOString().slice(0, 10)} reseal: ${note}`;
  const noteLines = wrapNote(dated);
  writeFileSync(
    LITERAL_FILES.upstream,
    replaceAnchoredLiteral(
      readFileSync(LITERAL_FILES.upstream, "utf8"),
      String.raw`hostHead: "[0-9a-f]{40}"`,
      state.myChatHead,
      noteLines,
    ),
  );
  writeFileSync(
    LITERAL_FILES.g2,
    replaceAnchoredLiteral(
      readFileSync(LITERAL_FILES.g2, "utf8"),
      String.raw`"[0-9a-f]{40}",\n\s*"My-Chat revision",`,
      state.myChatHead,
      noteLines,
    ),
  );
  let ownerSource = readFileSync(LITERAL_FILES.ownerAdoption, "utf8");
  ownerSource = replaceAnchoredLiteral(
    ownerSource,
    String.raw`head_revision: "[0-9a-f]{40}"`,
    state.myChatHead,
    noteLines,
  );
  ownerSource = ownerSource
    .replace(/runtime_revision: "[0-9a-f]{40}"/u, `runtime_revision: "${state.myChatLock.runtime_source_revision}"`)
    .replace(/aggregate_source_hash: "[0-9a-f]{64}"/u, `aggregate_source_hash: "${state.myChatLock.source_hash}"`);
  writeFileSync(LITERAL_FILES.ownerAdoption, ownerSource);

  for (const script of ["verify:workflow-contract-pin", "verify:g2-exit-contract", "verify:c30-i3-upstream"]) {
    run("pnpm", [script]);
    console.log(`[ok] ${script}`);
  }
  console.log("[next] commit these changes, then run: pnpm reseal:pins lock");
};

const mintOwnerLock = () => {
  if (!gitClean(repoRoot)) {
    throw new Error("commit the apply changes first; the owner lock binds a committed revision");
  }
  const head = gitHead(repoRoot);
  const lock = run(
    process.execPath,
    ["scripts/compute-c30-i3-owner-adoption-hash.mjs"],
    repoRoot,
    { C30_I3_SOURCE_REVISION: head },
  );
  writeFileSync(ownerLockPath, `${lock}\n`);
  run("pnpm", ["verify:c30-i3-owner-adoption"]);
  console.log(`[ok] owner adoption lock minted at ${head.slice(0, 12)} and verified`);
  console.log("[next] commit docs/project/integrations/c30-i3-owner-adoption-lock.json");
};

const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (isMain) {
  const args = process.argv.slice(2);
  const subcommand = args[0] && !args[0].startsWith("--") ? args[0] : "plan";
  const noteIndex = args.indexOf("--note");
  const note = noteIndex === -1 ? undefined : args[noteIndex + 1];
  const allowBaseMove = args.includes("--allow-base-move");
  try {
    if (subcommand === "lock") {
      mintOwnerLock();
    } else {
      const state = await collectState();
      if (subcommand === "plan") {
        const clean = printPlan(state);
        process.exitCode = clean ? 0 : 1;
      } else if (subcommand === "apply") {
        await apply(state, note, allowBaseMove);
      } else {
        throw new Error(`Unknown subcommand: ${subcommand}`);
      }
    }
  } catch (error) {
    console.error(`[error] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
