#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HASH_ALGORITHM = "sha256-path-content-v1";

const parseArgs = (argv) => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const options = {
    myChatRepo: path.resolve(repoRoot, "..", "My-Chat"),
    pinPath: path.join(
      repoRoot,
      "docs/project/integrations/my-chat-knowledge-rag-contract.json",
    ),
    report: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--report") {
      options.report = true;
      continue;
    }
    if (argument !== "--my-chat-repo" && argument !== "--pin") {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}`);
    }
    index += 1;
    if (argument === "--my-chat-repo") options.myChatRepo = path.resolve(value);
    else options.pinPath = path.resolve(value);
  }
  return options;
};

const validatePath = (value) => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.posix.isAbsolute(value) ||
    value.includes("\\") ||
    path.posix.normalize(value) !== value ||
    value.startsWith("../")
  ) {
    throw new Error(`Invalid pinned path: ${String(value)}`);
  }
};

const assertPin = (pin) => {
  if (!pin || typeof pin !== "object" || Array.isArray(pin)) {
    throw new Error("Knowledge/RAG pin must be an object");
  }
  if (pin.schemaVersion !== 1 || pin.hashAlgorithm !== HASH_ALGORITHM) {
    throw new Error("Unsupported Knowledge/RAG pin schema or hash algorithm");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(pin.repository ?? "")) {
    throw new Error("Invalid Knowledge/RAG repository identity");
  }
  if (!/^[0-9a-f]{40}$/.test(pin.revision ?? "")) {
    throw new Error("Invalid Knowledge/RAG revision");
  }
  if (!Array.isArray(pin.paths) || pin.paths.length === 0) {
    throw new Error("Knowledge/RAG pin must contain paths");
  }
  pin.paths.forEach(validatePath);
  const normalized = [...new Set(pin.paths)].sort();
  if (normalized.length !== pin.paths.length ||
    normalized.some((value, index) => value !== pin.paths[index])) {
    throw new Error("Knowledge/RAG pinned paths must be unique and sorted");
  }
  if (!/^[0-9a-f]{64}$/.test(pin.sha256 ?? "")) {
    throw new Error("Invalid Knowledge/RAG source hash");
  }
};

const gitText = (repoRoot, args) =>
  execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();

export const computeGitRevisionHash = (repoRoot, revision, paths) => {
  execFileSync("git", ["-C", repoRoot, "cat-file", "-e", `${revision}^{commit}`]);
  const hash = createHash("sha256");
  for (const relativePath of paths) {
    const object = `${revision}:${relativePath}`;
    if (gitText(repoRoot, ["cat-file", "-t", object]) !== "blob") {
      throw new Error(`Pinned Knowledge/RAG path is not a file: ${relativePath}`);
    }
    hash.update(relativePath);
    hash.update("\0");
    hash.update(execFileSync("git", ["-C", repoRoot, "show", object]));
    hash.update("\0");
  }
  return hash.digest("hex");
};

export const verifyKnowledgeRagContractPin = async ({ myChatRepo, pinPath }) => {
  const pin = JSON.parse(await readFile(pinPath, "utf8"));
  assertPin(pin);
  const actualSha256 = computeGitRevisionHash(myChatRepo, pin.revision, pin.paths);
  if (actualSha256 !== pin.sha256) {
    throw new Error(
      `My-Chat Knowledge/RAG source hash mismatch: expected ${pin.sha256}, got ${actualSha256}`,
    );
  }
  return {
    repository: pin.repository,
    revision: pin.revision,
    paths: pin.paths,
    sha256: actualSha256,
    checkoutHead: gitText(myChatRepo, ["rev-parse", "HEAD"]),
  };
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const result = await verifyKnowledgeRagContractPin(options);
  if (options.report) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    `[ok] My-Chat Knowledge/RAG source revision=${result.revision} ` +
      `sha256=${result.sha256} files=${result.paths.length}\n`,
  );
  if (result.checkoutHead !== result.revision) {
    process.stdout.write(
      `[info] My-Chat checkout head=${result.checkoutHead} differs from the source pin; ` +
        "owner adoption is not claimed.\n",
    );
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`[error] ${error.message}\n`);
    process.exitCode = 1;
  });
}
