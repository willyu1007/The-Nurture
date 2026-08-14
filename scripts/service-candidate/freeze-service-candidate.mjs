#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCandidate,
  candidateOutputPath,
} from "./candidate-core.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const write = args.includes("--write");
const sourceRevision = option("--source-revision");
const frozenOn = option("--frozen-on");
if (!sourceRevision || !frozenOn) {
  throw new Error("Usage: freeze-service-candidate.mjs --source-revision <sha> --frozen-on <YYYY-MM-DD> [--write]");
}

const git = (...gitArgs) => execFileSync("git", gitArgs, {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const head = git("rev-parse", "HEAD");
if (head !== sourceRevision) {
  throw new Error(`Freeze source must equal HEAD: expected ${sourceRevision}, got ${head}`);
}
const trackedStatus = git("status", "--porcelain", "--untracked-files=all");
if (trackedStatus !== "") {
  throw new Error(`Freeze requires a clean worktree before writing the artifact:\n${trackedStatus}`);
}

const outputPath = candidateOutputPath(repoRoot);
if (write && existsSync(outputPath)) {
  throw new Error(`Candidate artifact is append-only and already exists: ${outputPath}`);
}
const candidate = buildCandidate({ repoRoot, sourceRevision, frozenOn });
const output = `${JSON.stringify(candidate, null, 2)}\n`;
if (write) {
  writeFileSync(outputPath, output, { encoding: "utf8", flag: "wx" });
  console.log(`[ok] froze ${candidate.candidate_ref} ${candidate.candidate_digest}`);
  console.log(`[ok] wrote ${outputPath}`);
} else {
  process.stdout.write(output);
}
