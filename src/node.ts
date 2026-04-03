import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pickRandom, type EnvEntry, type PickRandomOptions } from "./index";
import { detectKeyFileFormatFromPath, parseKeyFile } from "./index";

export type PickRandomFromFileOptions = Omit<PickRandomOptions, "rng"> & {
  encoding?: BufferEncoding;
  /**
   * Override format detection. If omitted, format is detected from filename.
   */
  format?: "dotenv" | "json";
};

export async function pickRandomFromFile(
  filePath: string,
  options: PickRandomFromFileOptions = {}
): Promise<EnvEntry> {
  const encoding = options.encoding ?? "utf8";
  const content = await readFile(filePath, { encoding });
  const format = options.format ?? detectKeyFileFormatFromPath(filePath);
  const entries = parseKeyFile(content, format, { keepDuplicates: true });
  return pickRandom(entries, { key: options.key });
}

export type DiscoverKeyFilesOptions = {
  /**
   * Directory to search (default: process.cwd()).
   */
  dir?: string;
  /**
   * Filenames to check in priority order.
   */
  candidates?: string[];
  /**
   * If true, also scan the directory for supported extensions.
   * Default: true.
   */
  scanDirectory?: boolean;
};

export const DEFAULT_KEY_FILE_CANDIDATES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".keys",
  "keys.txt",
  "keys.env",
  "keys.json"
] as const;

function hasSupportedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower === ".env") return true;
  if (lower.endsWith(".env")) return true;
  if (lower.endsWith(".keys")) return true;
  if (lower.endsWith(".txt")) return true;
  if (lower.endsWith(".json")) return true;
  return false;
}

export async function discoverKeyFiles(options: DiscoverKeyFilesOptions = {}): Promise<string[]> {
  const dir = options.dir ?? process.cwd();
  const candidates = options.candidates ?? [...DEFAULT_KEY_FILE_CANDIDATES];
  const scanDirectory = options.scanDirectory ?? true;

  const found: string[] = [];

  // Prefer explicit candidates first.
  for (const name of candidates) {
    const full = join(dir, name);
    try {
      // readFile is an easy existence check without extra fs imports.
      await readFile(full, { encoding: "utf8" });
      found.push(full);
    } catch {
      // ignore
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
      // ignore
    }
  }

  return found;
}

export type LoadEntriesFromFilesOptions = {
  encoding?: BufferEncoding;
};

export async function loadEntriesFromFiles(
  filePaths: readonly string[],
  options: LoadEntriesFromFilesOptions = {}
): Promise<Array<EnvEntry & { sourcePath: string }>> {
  const encoding = options.encoding ?? "utf8";
  const all: Array<EnvEntry & { sourcePath: string }> = [];

  for (const filePath of filePaths) {
    const content = await readFile(filePath, { encoding });
    const format = detectKeyFileFormatFromPath(filePath);
    const entries = parseKeyFile(content, format, { keepDuplicates: true });
    for (const e of entries) all.push({ ...e, sourcePath: filePath });
  }

  return all;
}

export type PickRandomDiscoveredOptions = Omit<PickRandomOptions, "rng"> &
  DiscoverKeyFilesOptions & {
    encoding?: BufferEncoding;
  };

export async function pickRandomDiscovered(
  options: PickRandomDiscoveredOptions = {}
): Promise<EnvEntry & { sourcePath: string }> {
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
