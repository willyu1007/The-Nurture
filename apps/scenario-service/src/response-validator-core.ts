import type { AnySchema, ValidateFunction } from "ajv";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

export type { ValidateFunction } from "ajv";

type PublishedContractSchemaKey = "schemas" | "contract_schema";

export type PublishedContract<
  Operation extends string,
  SchemaKey extends PublishedContractSchemaKey,
> = Readonly<{
  interface: Readonly<{ key: string; version: string }>;
  operations: Readonly<
    Record<Operation, Readonly<{ response_schema_ref: string }>>
  >;
}> & Readonly<Record<SchemaKey, AnySchema>>;

export type AjvRuntime = Readonly<{
  addSchema(schema: AnySchema): unknown;
  getSchema(ref: string): ValidateFunction | undefined;
}>;

const Ajv2020 = ((Ajv2020Module as unknown as { default?: unknown }).default
  ?? Ajv2020Module) as new (options: object) => AjvRuntime;
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default
  ?? addFormatsModule) as (ajv: AjvRuntime) => unknown;

export function createAjvRuntime(): AjvRuntime {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv;
}

export function parsePublishedContract<
  Operation extends string,
  SchemaKey extends PublishedContractSchemaKey,
>(
  value: unknown,
  operations: readonly Operation[],
  schemaKey: SchemaKey,
  invalidMessage: string,
): PublishedContract<Operation, SchemaKey> {
  if (!isRecord(value) || !isRecord(value.interface)) {
    throw new Error(invalidMessage);
  }
  if (
    typeof value.interface.key !== "string"
    || typeof value.interface.version !== "string"
    || !isRecord(value.operations)
    || !isRecord(value[schemaKey])
  ) {
    throw new Error(invalidMessage);
  }
  for (const operation of operations) {
    const definition = value.operations[operation];
    if (
      !isRecord(definition)
      || typeof definition.response_schema_ref !== "string"
    ) {
      throw new Error(invalidMessage);
    }
  }
  return value as PublishedContract<Operation, SchemaKey>;
}

export function hasForbiddenKey(
  value: unknown,
  forbiddenKeys: ReadonlySet<string>,
): boolean {
  return collectKeys(value).some((key) => forbiddenKeys.has(key));
}

function collectKeys(value: unknown, output: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, output);
    return output;
  }
  if (!isRecord(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    output.push(key);
    collectKeys(child, output);
  }
  return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
