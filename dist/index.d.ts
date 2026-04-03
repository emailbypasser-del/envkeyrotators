type EnvEntry = {
    key: string;
    value: string;
};
type KeyFileFormat = "dotenv" | "json";
type ParseDotenvOptions = {
    /**
     * Keep duplicate keys as separate entries (default: true).
     * If false, the last value wins per key.
     */
    keepDuplicates?: boolean;
};
type PickRandomOptions = {
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
declare function parseDotenv(content: string, options?: ParseDotenvOptions): EnvEntry[];
declare function parseJsonKeys(content: string, options?: ParseDotenvOptions): EnvEntry[];
declare function detectKeyFileFormatFromPath(filePath: string): KeyFileFormat;
declare function parseKeyFile(content: string, format: KeyFileFormat, options?: ParseDotenvOptions): EnvEntry[];
declare function pickRandom<T extends EnvEntry>(entries: readonly T[], options?: PickRandomOptions): T;
declare function toDotenvLine(entry: EnvEntry): string;
declare function toJsonObject(entries: readonly EnvEntry[]): Record<string, string>;

export { type EnvEntry, type KeyFileFormat, type ParseDotenvOptions, type PickRandomOptions, detectKeyFileFormatFromPath, parseDotenv, parseJsonKeys, parseKeyFile, pickRandom, toDotenvLine, toJsonObject };
