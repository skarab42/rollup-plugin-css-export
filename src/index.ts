import path from "path";

import { createFilter } from "@rollup/pluginutils";

import type { FilterPattern } from "@rollup/pluginutils/types";
import type { Plugin } from "rollup";

export interface CSSExportOptions {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

interface StyleAsset {
  id: string;
  source: string;
}

export default function CSSExport(options: CSSExportOptions = {}): Plugin {
  const styleFilter = createFilter(
    options.include || ["**/*.css"],
    options.exclude
  );
  const styleAssets: Map<string, StyleAsset> = new Map();

  return {
    name: "css-export",

    transform(source, id) {
      if (!styleFilter(id)) {
        return null;
      }

      styleAssets.set(id, { id, source });

      return "";
    },

    generateBundle(outputOptions, bundle) {
      styleAssets.forEach(({ id, source }) => {
        let name: string;

        if (outputOptions.preserveModules) {
          const cwd = outputOptions.preserveModulesRoot ?? process.cwd();
          name = path.relative(cwd, id).replace(/\\/g, "/");
        } else {
          name = path.basename(id);
        }

        this.emitFile({ type: "asset", name, source });
      });

      Object.entries(bundle).forEach(([id, chunkInfo]) => {
        console.log(id, chunkInfo);
      });
    },
  };
}
