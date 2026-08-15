#!/usr/bin/env node

import process from "node:process";

const environment = process.argv[process.argv.indexOf("--env") + 1];
if (environment !== "staging") {
  console.error(
    "[blocked] Only the authorized staging path is registered for Nurture.",
  );
  process.exit(1);
}

console.log("[ok] Nurture staging deployment registration is active.");
console.log(
  "[info] Remote build, migration, deployment and rollback are human-executed through My-Chat:ops/deploy/handbook/runbooks/staging-nurture.md.",
);
