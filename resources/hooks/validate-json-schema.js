#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(""));
  });
}

function parsePayload(raw) {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getRepoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function resolveTargetPath(payload, repoRoot) {
  const candidates = [
    payload.file_path,
    payload.filePath,
    payload.target_file,
    payload.targetFile,
    process.argv[2]
  ];

  const filePath = candidates.find((c) => typeof c === "string" && c.trim().length > 0);
  if (!filePath) return null;

  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(repoRoot, filePath);
}

function inferSchemaPath(repoRoot, targetPath) {
  const normalizedTarget = path.resolve(targetPath);
  const forgeDir = path.resolve(repoRoot, ".forge");
  const forgeDirPrefix = forgeDir + path.sep;
  if (!normalizedTarget.startsWith(forgeDirPrefix)) {
    return null;
  }
  const base = path.basename(normalizedTarget);
  const schemaMap = {
    "project.json": "project.schema.json",
    "vision.json": "vision.schema.json",
    "features.json": "features.schema.json",
    "roadmap.json": "roadmap.schema.json",
    "technical_concepts.json": "technical_concepts.schema.json"
  };
  const schemaFile = schemaMap[base];
  if (!schemaFile) return null;
  return path.resolve(forgeDir, "schemas", schemaFile);
}

function resolveLocalRef(rootSchema, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) return null;

  const pathParts = ref
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));

  let current = rootSchema;
  for (const part of pathParts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return null;
    }
    current = current[part];
  }
  return current;
}

function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesType(value, expected) {
  switch (expected) {
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return false;
  }
}

function validate(instance, schema, atPath, errors, rootSchema) {
  if (schema && typeof schema.$ref === "string") {
    const resolvedSchema = resolveLocalRef(rootSchema, schema.$ref);
    if (!resolvedSchema) {
      errors.push(`${atPath}: could not resolve local schema reference ${JSON.stringify(schema.$ref)}`);
      return;
    }
    validate(instance, resolvedSchema, atPath, errors, rootSchema);
    return;
  }

  const expectedType = schema.type;
  if (typeof expectedType === "string" && !matchesType(instance, expectedType)) {
    errors.push(`${atPath}: expected ${expectedType}, got ${typeName(instance)}`);
    return;
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(instance)) {
    errors.push(`${atPath}: value ${JSON.stringify(instance)} is not in enum ${JSON.stringify(schema.enum)}`);
  }

  if (typeof instance === "string") {
    if (Number.isInteger(schema.minLength) && instance.length < schema.minLength) {
      errors.push(`${atPath}: string length must be >= ${schema.minLength}`);
    }
    if (typeof schema.pattern === "string") {
      const re = new RegExp(schema.pattern);
      if (!re.test(instance)) {
        errors.push(`${atPath}: string does not match pattern ${JSON.stringify(schema.pattern)}`);
      }
    }
  }

  if (Array.isArray(instance)) {
    if (Number.isInteger(schema.minItems) && instance.length < schema.minItems) {
      errors.push(`${atPath}: array length must be >= ${schema.minItems}`);
    }
    if (schema.items && typeof schema.items === "object") {
      instance.forEach((item, idx) => validate(item, schema.items, `${atPath}[${idx}]`, errors, rootSchema));
    }
  }

  if (instance && typeof instance === "object" && !Array.isArray(instance)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in instance)) {
          errors.push(`${atPath}: missing required property ${JSON.stringify(key)}`);
        }
      }
    }

    const props = schema.properties && typeof schema.properties === "object" ? schema.properties : {};

    for (const [key, subSchema] of Object.entries(props)) {
      if (key in instance && subSchema && typeof subSchema === "object") {
        validate(instance[key], subSchema, `${atPath}.${key}`, errors, rootSchema);
      }
    }

    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(props));
      for (const key of Object.keys(instance)) {
        if (!allowed.has(key)) {
          errors.push(`${atPath}: unexpected property ${JSON.stringify(key)}`);
        }
      }
    }
  }
}

function relPath(repoRoot, targetPath) {
  return path.relative(repoRoot, targetPath) || targetPath;
}

async function main() {
  const repoRoot = getRepoRoot();
  const payload = parsePayload(await readStdin());
  const targetPath = resolveTargetPath(payload, repoRoot);
  if (!targetPath) {
    process.exit(0);
  }

  const schemaPath = inferSchemaPath(repoRoot, targetPath);
  if (!schemaPath) {
    process.exit(0);
  }

  if (!fs.existsSync(schemaPath)) {
    process.exit(0);
  }

  if (!fs.existsSync(targetPath)) {
    process.exit(0);
  }

  let schema;
  let instance;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (err) {
    console.error(`[schema-hook] Failed reading schema ${schemaPath}: ${err.message}`);
    process.exit(1);
  }

  try {
    instance = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch (err) {
    console.error(`[schema-hook] ${relPath(repoRoot, targetPath)} is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = [];
  validate(instance, schema, "$", errors, schema);

  if (errors.length > 0) {
    console.error(
      `[schema-hook] Validation failed for ${relPath(repoRoot, targetPath)} against ${relPath(repoRoot, schemaPath)}`
    );
    for (const err of errors.slice(0, 30)) {
      console.error(`  - ${err}`);
    }
    if (errors.length > 30) {
      console.error(`  - ... and ${errors.length - 30} more errors`);
    }
    process.exit(1);
  }

  console.error(`[schema-hook] OK: ${relPath(repoRoot, targetPath)} matches ${relPath(repoRoot, schemaPath)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`[schema-hook] Unexpected error: ${err.message}`);
  process.exit(1);
});
