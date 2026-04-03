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
function toJsonObject(entries) {
  const out = {};
  for (const e of entries) out[e.key] = e.value;
  return out;
}
export {
  detectKeyFileFormatFromPath,
  parseDotenv,
  parseJsonKeys,
  parseKeyFile,
  pickRandom,
  toDotenvLine,
  toJsonObject
};
//# sourceMappingURL=index.js.map