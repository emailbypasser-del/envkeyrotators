import { defineConfig } from "tsup";

export default defineConfig([
  // Browser-safe core
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2022"
  },
  // Node-only helpers
  {
    entry: ["src/node.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    target: "es2022",
    platform: "node"
  },
  // CLI (node)
  {
    entry: ["src/cli.ts"],
    format: ["esm", "cjs"],
    dts: false,
    sourcemap: true,
    clean: false,
    target: "es2022",
    platform: "node",
    banner: {
      js: "#!/usr/bin/env node\n"
    }
  }
]);
