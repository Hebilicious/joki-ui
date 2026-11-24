import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite-plus";

export const NODE_BUILTIN_SHIMS = {
  "node:assert/strict": "assert-strict",
  "node:timers/promises": "timers-promises",
  "node:util": "util",
} as const;

export interface VaporTestingOptions {
  /** Components by file name, without `.vue`, that a mount may stub. */
  readonly stubbable?: readonly string[];
}

export function vaporTesting(options: VaporTestingOptions = {}): Plugin {
  const names = new Set(options.stubbable ?? []);
  const defaultExport = "export default _sfc_main;";
  const stubsModule = "@joki-ui/vapor-testing/stubs";
  return {
    name: "vapor-testing",
    enforce: "post",
    config: () => ({
      resolve: {
        alias: Object.fromEntries(
          Object.entries(NODE_BUILTIN_SHIMS).map(([builtin, shim]) => [
            builtin,
            fileURLToPath(new URL(`./shims/${shim}.ts`, import.meta.url)),
          ]),
        ),
      },
    }),
    transform(code, id) {
      // A Vapor compiler serves each SFC's component as `<file>.vue?…`; its style and other block requests carry a
      // `type` parameter.
      const [path = "", query = ""] = id.split("?");
      if (!path.endsWith(".vue") || new URLSearchParams(query).has("type")) return null;
      const name = basename(path, ".vue");
      if (!names.has(name)) return null;
      if (!code.includes(defaultExport)) this.error(`${id} has no \`${defaultExport}\` to wrap in its stand-in`);
      return code.replace(
        defaultExport,
        `import { stubbable as __stubbable } from ${JSON.stringify(stubsModule)};\nexport default __stubbable(${JSON.stringify(name)}, _sfc_main);`,
      );
    },
  };
}
