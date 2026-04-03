export type EnvEntry = {
  key: string;
  value: string;
};

export type KeyFileFormat = "dotenv" | "json";

export type ParseDotenvOptions = {
  /**
   * Keep duplicate keys as separate entries (default: true).
   * If false, the last value wins per key.
   */
  keepDuplicates?: boolean;
};

export type PickRandomOptions = {
  /**
   * Only pick from entries matching this key.
   * If omitted, picks from all entries.
   */
  key?: string;
  /**
   * Custom random number generator for deterministic tests.
   * Must return a float in [0, 1).
   */
  rng?: () => number;
};

export function parseDotenv(content: string, options: ParseDotenvOptions = {}): EnvEntry[] {
  const keepDuplicates = options.keepDuplicates ?? true;

  const lines = content.split(/\r?\n/);
  const entries: EnvEntry[] = [];
  const lastByKey = new Map<string, string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (!key) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
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

export function parseJsonKeys(
  content: string,
  options: ParseDotenvOptions = {}
): EnvEntry[] {
  const keepDuplicates = options.keepDuplicates ?? true;
  const parsed: unknown = JSON.parse(content);

  if (Array.isArray(parsed)) {
    const entries: EnvEntry[] = [];
    const lastByKey = new Map<string, string>();

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const maybeKey = (item as { key?: unknown }).key;
      const maybeValue = (item as { value?: unknown }).value;
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
    const obj = parsed as Record<string, unknown>;
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : String(value ?? "")
    }));
  }

  throw new Error("Invalid JSON keys format. Expected object or array.");
}

export function detectKeyFileFormatFromPath(filePath: string): KeyFileFormat {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  return "dotenv";
}

export function parseKeyFile(
  content: string,
  format: KeyFileFormat,
  options: ParseDotenvOptions = {}
): EnvEntry[] {
  if (format === "json") return parseJsonKeys(content, options);
  return parseDotenv(content, options);
}

export function pickRandom<T extends EnvEntry>(
  entries: readonly T[],
  options: PickRandomOptions = {}
): T {
  const { key, rng } = options;
  const random = rng ?? Math.random;

  const pool = key ? entries.filter((e) => e.key === key) : [...entries];
  if (pool.length === 0) {
    throw new Error(key ? `No entries found for key "${key}".` : "No entries provided.");
  }

  const idx = Math.floor(random() * pool.length);
  return pool[Math.min(Math.max(idx, 0), pool.length - 1)];
}

export function toDotenvLine(entry: EnvEntry): string {
  const escaped = entry.value.replaceAll('"', '\\"');
  return `${entry.key}="${escaped}"`;
}

export function toJsonObject(entries: readonly EnvEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) out[e.key] = e.value;
  return out;
}
