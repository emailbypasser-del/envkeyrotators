// src/node.ts
import { readFile, readdir } from "fs/promises";
import { join } from "path";

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

// src/node.ts
async function pickRandomFromFile(filePath, options = {}) {
  const encoding = options.encoding ?? "utf8";
  const content = await readFile(filePath, { encoding });
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
    const full = join(dir, name);
    try {
      await readFile(full, { encoding: "utf8" });
      found.push(full);
    } catch {
    }
  }
  if (scanDirectory) {
    try {
      const names = await readdir(dir);
      for (const name of names) {
        if (!hasSupportedExtension(name)) continue;
        const full = join(dir, name);
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
    const content = await readFile(filePath, { encoding });
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
export {
  DEFAULT_KEY_FILE_CANDIDATES,
  discoverKeyFiles,
  loadEntriesFromFiles,
  pickRandomDiscovered,
  pickRandomFromFile
};
//# sourceMappingURL=node.js.map