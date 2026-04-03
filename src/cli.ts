import { pickRandomDiscovered, pickRandomFromFile } from "./node";
import { toDotenvLine } from "./index";

type CliArgs = {
  file?: string;
  dir?: string;
  key?: string;
  format?: "json" | "dotenv" | "value";
  setEnv?: boolean;
  showSource?: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" || a === "-f") args.file = argv[++i];
    else if (a === "--dir" || a === "-d") args.dir = argv[++i];
    else if (a === "--key" || a === "-k") args.key = argv[++i];
    else if (a === "--format") args.format = argv[++i] as CliArgs["format"];
    else if (a === "--set-env") args.setEnv = true;
    else if (a === "--show-source") args.showSource = true;
    else if (a === "--help" || a === "-h") {
      printHelpAndExit(0);
    }
  }
  return args;
}

function printHelpAndExit(code: number): never {
  // eslint-disable-next-line no-console
  console.log(
    [
      "envkeyrotators - pick a random entry from key files",
      "",
      "Usage:",
      "  envkeyrotators --file ./.env.sample",
      '  envkeyrotators --dir . --key KEY1 --format json',
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
  const entry = args.file
    ? await pickRandomFromFile(args.file, { key: args.key })
    : await pickRandomDiscovered({ dir: args.dir, key: args.key });
  const format = args.format ?? "dotenv";

  if (args.showSource && "sourcePath" in entry) {
    // eslint-disable-next-line no-console
    console.error((entry as { sourcePath: string }).sourcePath);
  }

  if (args.setEnv) {
    process.env[entry.key] = entry.value;
  }

  if (format === "json") {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  } else if (format === "value") {
    // eslint-disable-next-line no-console
    console.log(entry.value);
  } else {
    // eslint-disable-next-line no-console
    console.log(toDotenvLine(entry));
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
