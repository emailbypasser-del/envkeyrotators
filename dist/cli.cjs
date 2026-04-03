#!/usr/bin/env node

"use strict";

// src/node.ts
var import_promises = require("fs/promises");
var import_node_path = require("path");

// src/index.ts
function parseDotenv(content, options = {}) {
  const keepDuplicates = options.keepDuplicates ?? true;
  const lines = content.split(/\r?\n/);
  const entries = [];
  const lastByKey = /* @__PURE__ */ new Map();
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (!key) continue;
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (keepDuplicates) {
      entries.push({ key, value });
    } else {
      lastByKey.set(key, value);
    }
  }
  if (!keepDuplicates) {
    for (const [key, value] of lastByKey.entries()) entries.push({ key, value });
  }
  return entries;
}
function parseJsonKeys(content, options = {}) {
  const keepDuplicates = options.keepDuplicates ?? true;
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    const entries = [];
    const lastByKey = /* @__PURE__ */ new Map();
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const maybeKey = item.key;
      const maybeValue = item.value;
      if (typeof maybeKey !== "string") continue;
      const value = typeof maybeValue === "string" ? maybeValue : String(maybeValue ?? "");
      if (keepDuplicates) entries.push({ key: maybeKey, value });
      else lastByKey.set(maybeKey, value);
    }
    if (!keepDuplicates) {
      for (const [key, value] of lastByKey.entries()) entries.push({ key, value });
    }
    return entries;
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed;
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : String(value ?? "")
    }));
  }
  throw new Error("Invalid JSON keys format. Expected object or array.");
}
function detectKeyFileFormatFromPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  return "dotenv";
}
function parseKeyFile(content, format, options = {}) {
  if (format === "json") return parseJsonKeys(content, options);
  return parseDotenv(content, options);
}
function pickRandom(entries, options = {}) {
  const { key, rng } = options;
  const random = rng ?? Math.random;
  const pool = key ? entries.filter((e) => e.key === key) : [...entries];
  if (pool.length === 0) {
    throw new Error(key ? `No entries found for key "${key}".` : "No entries provided.");
  }
  const idx = Math.floor(random() * pool.length);
  return pool[Math.min(Math.max(idx, 0), pool.length - 1)];
}
function toDotenvLine(entry) {
  const escaped = entry.value.replaceAll('"', '\\"');
  return `${entry.key}="${escaped}"`;
}

// src/node.ts
async function pickRandomFromFile(filePath, options = {}) {
  const encoding = options.encoding ?? "utf8";
  const content = await (0, import_promises.readFile)(filePath, { encoding });
  const format = options.format ?? detectKeyFileFormatFromPath(filePath);
  const entries = parseKeyFile(content, format, { keepDuplicates: true });
  return pickRandom(entries, { key: options.key });
}
var DEFAULT_KEY_FILE_CANDIDATES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".keys",
  "keys.txt",
  "keys.env",
  "keys.json"
];
function hasSupportedExtension(name) {
  const lower = name.toLowerCase();
  if (lower === ".env") return true;
  if (lower.endsWith(".env")) return true;
  if (lower.endsWith(".keys")) return true;
  if (lower.endsWith(".txt")) return true;
  if (lower.endsWith(".json")) return true;
  return false;
}
async function discoverKeyFiles(options = {}) {
  const dir = options.dir ?? process.cwd();
  const candidates = options.candidates ?? [...DEFAULT_KEY_FILE_CANDIDATES];
  const scanDirectory = options.scanDirectory ?? true;
  const found = [];
  for (const name of candidates) {
    const full = (0, import_node_path.join)(dir, name);
    try {
      await (0, import_promises.readFile)(full, { encoding: "utf8" });
      found.push(full);
    } catch {
    }
  }
  if (scanDirectory) {
    try {
      const names = await (0, import_promises.readdir)(dir);
      for (const name of names) {
        if (!hasSupportedExtension(name)) continue;
        const full = (0, import_node_path.join)(dir, name);
        if (!found.includes(full)) found.push(full);
      }
    } catch {
    }
  }
  return found;
}
async function loadEntriesFromFiles(filePaths, options = {}) {
  const encoding = options.encoding ?? "utf8";
  const all = [];
  for (const filePath of filePaths) {
    const content = await (0, import_promises.readFile)(filePath, { encoding });
    const format = detectKeyFileFormatFromPath(filePath);
    const entries = parseKeyFile(content, format, { keepDuplicates: true });
    for (const e of entries) all.push({ ...e, sourcePath: filePath });
  }
  return all;
}
async function pickRandomDiscovered(options = {}) {
  const filePaths = await discoverKeyFiles(options);
  if (filePaths.length === 0) {
    throw new Error(
      `No key files found in "${options.dir ?? process.cwd()}". Supported: .env/.txt/.keys/.json`
    );
  }
  const entries = await loadEntriesFromFiles(filePaths, { encoding: options.encoding });
  const picked = pickRandom(entries, { key: options.key });
  return picked;
}

// src/cli.ts
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" || a === "-f") args.file = argv[++i];
    else if (a === "--dir" || a === "-d") args.dir = argv[++i];
    else if (a === "--key" || a === "-k") args.key = argv[++i];
    else if (a === "--format") args.format = argv[++i];
    else if (a === "--set-env") args.setEnv = true;
    else if (a === "--show-source") args.showSource = true;
    else if (a === "--help" || a === "-h") {
      printHelpAndExit(0);
    }
  }
  return args;
}
function printHelpAndExit(code) {
  console.log(
    [
      "envkeyrotators - pick a random entry from key files",
      "",
      "Usage:",
      "  envkeyrotators --file ./.env.sample",
      "  envkeyrotators --dir . --key KEY1 --format json",
      "  envkeyrotators            (auto-discovers .env/.txt/.keys/.json in cwd)",
      "",
      "Options:",
      "  -f, --file <path>     Path to a key file (.env/.txt/.keys/.json)",
      "  -d, --dir <path>      Directory to auto-discover supported files (default: cwd)",
      "  -k, --key <KEY>       Only pick values for this key (optional)",
      "  --format <json|dotenv|value>   Output format (default: dotenv)",
      "  --show-source         Print the source file path to stderr",
      "  --set-env             Set process.env[KEY]=VALUE (Node only)",
      "  -h, --help            Show help"
    ].join("\n")
  );
  process.exit(code);
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const entry = args.file ? await pickRandomFromFile(args.file, { key: args.key }) : await pickRandomDiscovered({ dir: args.dir, key: args.key });
  const format = args.format ?? "dotenv";
  if (args.showSource && "sourcePath" in entry) {
    console.error(entry.sourcePath);
  }
  if (args.setEnv) {
    process.env[entry.key] = entry.value;
  }
  if (format === "json") {
    console.log(JSON.stringify(entry));
  } else if (format === "value") {
    console.log(entry.value);
  } else {
    console.log(toDotenvLine(entry));
  }
}
main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
//# sourceMappingURL=cli.cjs.map