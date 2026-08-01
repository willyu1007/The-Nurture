/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  checkConformanceRegistry,
  generatedArtifactPinPath,
  generatedManifestPath,
  repoRoot,
  sourceRoot,
} from "./contract-core.mjs";

const manifestSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/interface/surface-contract-manifest.schema.json";
const artifactPinSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/interface/surface-contract-artifact-pin.schema.json";
const syntheticWorldSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/fixtures/world/synthetic-world.schema.json";
const journeyInitialStateSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/fixtures/journeys/journey-initial-state.schema.json";
const journeyScriptSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/fixtures/journeys/journey-script.schema.json";
const journeyExpectedViewSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/fixtures/journeys/journey-expected-view.schema.json";
const selectionCasesSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/fixtures/selection/selection-cases.schema.json";
const conformanceCasesSchemaId =
  "https://contracts.the-nurture.local/surfaces/v1/source/conformance/conformance-cases.schema.json";
const journeyKeys = ["gj-1", "gj-2", "gj-3", "gj-4", "gj-5", "rj-1"];
const scriptedJourneyKeys = journeyKeys;
const selectionFamilies = [
  "candidate_filtering",
  "correct_selection",
  "clarification_needed",
  "confirmation_needed",
  "unavailable",
];

const validatedFixtureDocuments = new Set();
const schemaPaths = await collectSchemaPaths(sourceRoot);
const schemas = await Promise.all(
  schemaPaths.map(async (schemaPath) => ({
    schemaPath,
    value: JSON.parse(await readFile(schemaPath, "utf8")),
  })),
);
const validator = new Ajv2020({
  allErrors: true,
  strict: true,
});
addFormats(validator);

for (const { schemaPath, value } of schemas) {
  try {
    validator.addSchema(value);
  } catch (error) {
    throw schemaFailure(schemaPath, error);
  }
}
for (const { schemaPath, value } of schemas) {
  try {
    if (!validator.getSchema(value.$id)) {
      throw new Error("schema did not register its canonical $id");
    }
  } catch (error) {
    throw schemaFailure(schemaPath, error);
  }
}

const manifest = await validateGeneratedArtifact(
  validator,
  manifestSchemaId,
  generatedManifestPath,
);
const artifactPin = await validateGeneratedArtifact(
  validator,
  artifactPinSchemaId,
  generatedArtifactPinPath,
);
assertManifestRejectsMalformedHeadBinding(validator, manifest);
assertArtifactPinRejectsUnknownFields(validator, artifactPin);
const world = await validateSourceDocument(
  validator,
  syntheticWorldSchemaId,
  path.join(sourceRoot, "fixtures/world/world-v1.json"),
);
await validateSourceDocument(
  validator,
  `${syntheticWorldSchemaId}#/$defs/pilotProfile`,
  path.join(sourceRoot, "fixtures/world/profile-single-institution.json"),
);
assertWorldRejectsNonSyntheticLabel(validator, world);
const initialStates = [];
for (const journeyKey of journeyKeys) {
  const initialState = await validateSourceDocument(
    validator,
    journeyInitialStateSchemaId,
    path.join(sourceRoot, `fixtures/journeys/${journeyKey}/initial-state.json`),
  );
  if (initialState.journeyKey !== journeyKey) {
    throw new Error(
      `fixtures/journeys/${journeyKey}/initial-state.json declares journeyKey ${initialState.journeyKey}`,
    );
  }
  initialStates.push(initialState);
}
assertInitialStateRejectsClosedItem(validator, initialStates);
let scriptCount = 0;
let expectedViewCount = 0;
let firstScript;
for (const journeyKey of scriptedJourneyKeys) {
  const journeyRoot = path.join(sourceRoot, `fixtures/journeys/${journeyKey}`);
  const script = await validateSourceDocument(
    validator,
    journeyScriptSchemaId,
    path.join(journeyRoot, "script.json"),
  );
  if (script.journeyKey !== journeyKey) {
    throw new Error(
      `fixtures/journeys/${journeyKey}/script.json declares journeyKey ${script.journeyKey}`,
    );
  }
  firstScript ??= script;
  scriptCount += 1;
  const referencedViews = new Set(
    [
      ...script.valueLoop.map((step) => step.expectedViewRef),
      script.refusal.expectedViewRef,
      script.refusal.postConditionViewRef,
    ].filter((ref) => typeof ref === "string"),
  );
  const expectedDirectory = path.join(journeyRoot, "expected");
  const expectedEntries = (await readdir(expectedDirectory)).sort();
  const presentViews = new Set(
    expectedEntries.map((name) => `expected/${name}`),
  );
  for (const ref of referencedViews) {
    if (!presentViews.has(ref)) {
      throw new Error(`${journeyKey} script references missing ${ref}`);
    }
  }
  for (const present of presentViews) {
    if (!referencedViews.has(present)) {
      throw new Error(`${journeyKey} has an unreferenced ${present}`);
    }
  }
  for (const entry of expectedEntries) {
    const view = await validateSourceDocument(
      validator,
      journeyExpectedViewSchemaId,
      path.join(expectedDirectory, entry),
    );
    if (view.journeyKey !== journeyKey) {
      throw new Error(
        `fixtures/journeys/${journeyKey}/expected/${entry} declares journeyKey ${view.journeyKey}`,
      );
    }
    expectedViewCount += 1;
  }
}
assertScriptRejectsUnknownErrorCode(validator, firstScript);
const selectionCases = await validateSourceDocument(
  validator,
  selectionCasesSchemaId,
  path.join(sourceRoot, "fixtures/selection/selection-cases.json"),
);
const presentFamilies = new Set(
  selectionCases.cases.map((entry) => entry.family),
);
for (const family of selectionFamilies) {
  if (!presentFamilies.has(family)) {
    throw new Error(`selection-cases.json misses the ${family} family`);
  }
}
assertSelectionRejectsUnknownFamily(validator, selectionCases);
const conformanceRegistry = await validateSourceDocument(
  validator,
  conformanceCasesSchemaId,
  path.join(sourceRoot, "conformance/conformance-cases.json"),
);
const conformanceCoverage = checkConformanceRegistry(
  conformanceRegistry,
  manifest,
);
assertConformanceRejectsUnknownSlice(conformanceRegistry, manifest);

await assertNoUnvalidatedFixtureFiles();

process.stdout.write(
  `[ok] surface contract schemas=${schemas.length} manifest=valid artifact-pin=valid fixtures=${10 + scriptCount + expectedViewCount} conformance-cases=${conformanceRegistry.cases.length} slices=${conformanceCoverage.covered}/${conformanceCoverage.universe} negatives=7\n`,
);

async function assertNoUnvalidatedFixtureFiles() {
  const fixtureFiles = [];
  const walk = async (directory) => {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
      (left, right) => left.name.localeCompare(right.name),
    )) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(entryPath);
      else if (entry.isFile()) fixtureFiles.push(entryPath);
    }
  };
  await walk(path.join(sourceRoot, "fixtures"));
  for (const filePath of fixtureFiles) {
    const relative = path.relative(sourceRoot, filePath);
    if (relative.endsWith(".schema.json")) continue;
    if (!validatedFixtureDocuments.has(relative)) {
      throw new Error(
        `Fixture file is not covered by document validation: ${relative}`,
      );
    }
  }
}

async function collectSchemaPaths(directory) {
  const result = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectSchemaPaths(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".schema.json")) {
      result.push(entryPath);
    }
  }
  return result;
}

async function validateGeneratedArtifact(ajv, schemaId, artifactPath) {
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new Error(`Missing compiled schema ${schemaId}`);
  const value = JSON.parse(await readFile(artifactPath, "utf8"));
  if (!validate(value)) {
    throw new Error(
      `${path.relative(repoRoot, artifactPath)} failed ${schemaId}: ${JSON.stringify(
        validate.errors,
      )}`,
    );
  }
  return value;
}

function assertManifestRejectsMalformedHeadBinding(ajv, manifest) {
  const validate = ajv.getSchema(manifestSchemaId);
  if (!validate) throw new Error(`Missing compiled schema ${manifestSchemaId}`);
  const malformed = structuredClone(manifest);
  const reply = malformed.capabilities.find(
    (entry) => entry.capabilityKey === "reply_family_care_item",
  );
  if (!reply) throw new Error("Missing reply capability for negative schema check");
  reply.descriptor.concurrencyPolicy.headBindings[0] = {
    headKey: "grant_authority",
    mode: "must_satisfy",
  };
  if (validate(malformed)) {
    throw new Error("Manifest schema accepted a condition head without its ref");
  }
}

async function validateSourceDocument(ajv, schemaId, documentPath) {
  validatedFixtureDocuments.add(path.relative(sourceRoot, documentPath));
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new Error(`Missing compiled schema ${schemaId}`);
  const value = JSON.parse(await readFile(documentPath, "utf8"));
  if (!validate(value)) {
    throw new Error(
      `${path.relative(repoRoot, documentPath)} failed ${schemaId}: ${JSON.stringify(
        validate.errors,
      )}`,
    );
  }
  return value;
}

function assertWorldRejectsNonSyntheticLabel(ajv, world) {
  const validate = ajv.getSchema(syntheticWorldSchemaId);
  if (!validate) {
    throw new Error(`Missing compiled schema ${syntheticWorldSchemaId}`);
  }
  const malformed = structuredClone(world);
  malformed.participants[0].displayLabel = "Alice Johnson-Smith";
  if (validate(malformed)) {
    throw new Error(
      "Synthetic world schema accepted a realistic display label",
    );
  }
}

function assertInitialStateRejectsClosedItem(ajv, initialStates) {
  const validate = ajv.getSchema(journeyInitialStateSchemaId);
  if (!validate) {
    throw new Error(`Missing compiled schema ${journeyInitialStateSchemaId}`);
  }
  const withItems = initialStates.find(
    (state) => state.overlay.preexistingCareItems.length > 0,
  );
  if (!withItems) {
    throw new Error("Missing an initial state with pre-existing care items");
  }
  const malformed = structuredClone(withItems);
  // Care items never close; a terminal "closed" lifecycle is not a valid
  // pre-existing state and must fail schema admission.
  malformed.overlay.preexistingCareItems[0].state = "closed";
  if (validate(malformed)) {
    throw new Error(
      "Journey initial-state schema accepted a closed care item",
    );
  }
}

function assertScriptRejectsUnknownErrorCode(ajv, script) {
  if (!script) throw new Error("Missing a journey script for the negative check");
  const validate = ajv.getSchema(journeyScriptSchemaId);
  if (!validate) {
    throw new Error(`Missing compiled schema ${journeyScriptSchemaId}`);
  }
  const malformed = structuredClone(script);
  if (malformed.refusal.kind !== "invocation_refused") {
    throw new Error("Negative check expects an invocation refusal");
  }
  // Refusal outcomes must stay inside the closed operation-error code enum.
  malformed.refusal.expectedError.code = "granted";
  if (validate(malformed)) {
    throw new Error("Journey script schema accepted an unknown error code");
  }
}

function assertConformanceRejectsUnknownSlice(registry, manifestValue) {
  const malformed = structuredClone(registry);
  // Evidence scope must stay mechanical: a case may only cover slices that
  // exist in the generated manifest.
  malformed.cases[0].covers = ["capability:not_a_capability"];
  let rejected = false;
  try {
    checkConformanceRegistry(malformed, manifestValue);
  } catch {
    rejected = true;
  }
  if (!rejected) {
    throw new Error(
      "Conformance registry accepted a case covering an unknown slice",
    );
  }
}

function assertSelectionRejectsUnknownFamily(ajv, selectionCases) {
  const validate = ajv.getSchema(selectionCasesSchemaId);
  if (!validate) {
    throw new Error(`Missing compiled schema ${selectionCasesSchemaId}`);
  }
  const malformed = structuredClone(selectionCases);
  // Selection outcomes form a closed set; an auto-execute family that skips
  // filtering/confirmation must fail admission.
  malformed.cases[0].family = "auto_execute";
  if (validate(malformed)) {
    throw new Error("Selection schema accepted an unknown case family");
  }
}

function assertArtifactPinRejectsUnknownFields(ajv, artifactPin) {
  const validate = ajv.getSchema(artifactPinSchemaId);
  if (!validate) throw new Error(`Missing compiled schema ${artifactPinSchemaId}`);
  const malformed = {
    ...structuredClone(artifactPin),
    latest: true,
  };
  if (validate(malformed)) {
    throw new Error("Artifact pin schema accepted an unknown field");
  }
}

function schemaFailure(schemaPath, error) {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(
    `${path.relative(repoRoot, schemaPath)} failed strict compilation: ${message}`,
  );
}
