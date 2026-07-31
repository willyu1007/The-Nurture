/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
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

process.stdout.write(
  `[ok] surface contract schemas=${schemas.length} manifest=valid artifact-pin=valid fixtures=2 negatives=3\n`,
);

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
