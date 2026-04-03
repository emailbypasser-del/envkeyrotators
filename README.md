# @angloqq03/ekr

Pick a random API key (or any env entry) from dotenv-style files and JSON.

- Supported formats: `.env` / `.txt` / `.keys` (dotenv lines), plus `.json`
- Works in the browser (string input) and in Node (file loading + discovery)

## Install

```bash
npm i @angloqq03/ekr
```

## Quick usage (Vite/React/Vue/etc.)

```ts
import { parseDotenv, pickRandom } from "@angloqq03/ekr";

const entries = parseDotenv(`
KEY1="A"
KEY1="B"
KEY2="C"
`);

const chosen = pickRandom(entries, { key: "KEY1" });
console.log(chosen.key, chosen.value);
```

## File formats

### Dotenv-style (`.env`, `.txt`, `.keys`)

Anything that looks like `KEY="VALUE"` is supported:

```env
API_KEY="abc"
API_KEY="def"
OTHER="123"
```

Duplicate keys are kept (so `pickRandom(..., { key: "API_KEY" })` makes sense).

### JSON (`.json`)

Object form:

```json
{ "API_KEY": "abc", "OTHER": "123" }
```

Array form:

```json
[{ "key": "API_KEY", "value": "abc" }, { "key": "API_KEY", "value": "def" }]
```

## Node usage (load from files)

```ts
import { pickRandomFromFile } from "@angloqq03/ekr/node";

const entry = await pickRandomFromFile("./keys.env", { key: "API_KEY" });
console.log(entry);
```

### Auto-discover key files in a folder

`pickRandomDiscovered()` searches a directory for supported files and picks from all of them.

```ts
import { pickRandomDiscovered } from "@angloqq03/ekr/node";

const entry = await pickRandomDiscovered({ dir: process.cwd(), key: "API_KEY" });
console.log(entry.key, entry.value, entry.sourcePath);
```

Discovery includes common names like `.env`, `.env.local`, `.keys`, `keys.txt`, `keys.json` and will also scan the directory for files ending in `.env`, `.keys`, `.txt`, `.json`.

## CLI

After install:

```bash
npx @angloqq03/ekr --file ./.env --key API_KEY
```

Auto-discover in the current directory:

```bash
npx @angloqq03/ekr --dir . --show-source
```

Output formats:

```bash
npx @angloqq03/ekr --file ./keys.json --format json
npx @angloqq03/ekr --file ./keys.env --format value
```

## API

- `parseDotenv(content, { keepDuplicates?: boolean })`
- `parseJsonKeys(content)`
- `pickRandom(entries, { key?: string, rng?: () => number })`
- `toDotenvLine({ key, value })`
- Node-only: `pickRandomFromFile(path, { key?, format? })`, `pickRandomDiscovered({ dir?, key? })`

## Notes

- This tool doesn’t modify your `.env` file. It just reads/parses and returns a value.
- Treat key files as secrets: don’t commit real API keys to git, and don’t ship them to the browser unless you intend them to be public.
