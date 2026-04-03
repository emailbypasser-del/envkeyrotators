type EnvEntry = {
    key: string;
    value: string;
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

type PickRandomFromFileOptions = Omit<PickRandomOptions, "rng"> & {
    encoding?: BufferEncoding;
    /**
     * Override format detection. If omitted, format is detected from filename.
     */
    format?: "dotenv" | "json";
};
declare function pickRandomFromFile(filePath: string, options?: PickRandomFromFileOptions): Promise<EnvEntry>;
type DiscoverKeyFilesOptions = {
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
declare const DEFAULT_KEY_FILE_CANDIDATES: readonly [".env", ".env.local", ".env.development", ".env.production", ".keys", "keys.txt", "keys.env", "keys.json"];
declare function discoverKeyFiles(options?: DiscoverKeyFilesOptions): Promise<string[]>;
type LoadEntriesFromFilesOptions = {
    encoding?: BufferEncoding;
};
declare function loadEntriesFromFiles(filePaths: readonly string[], options?: LoadEntriesFromFilesOptions): Promise<Array<EnvEntry & {
    sourcePath: string;
}>>;
type PickRandomDiscoveredOptions = Omit<PickRandomOptions, "rng"> & DiscoverKeyFilesOptions & {
    encoding?: BufferEncoding;
};
declare function pickRandomDiscovered(options?: PickRandomDiscoveredOptions): Promise<EnvEntry & {
    sourcePath: string;
}>;

export { DEFAULT_KEY_FILE_CANDIDATES, type DiscoverKeyFilesOptions, type LoadEntriesFromFilesOptions, type PickRandomDiscoveredOptions, type PickRandomFromFileOptions, discoverKeyFiles, loadEntriesFromFiles, pickRandomDiscovered, pickRandomFromFile };
