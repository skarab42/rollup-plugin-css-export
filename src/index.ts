import path from "path";

import { createFilter } from "@rollup/pluginutils";

import type { FilterPattern } from "@rollup/pluginutils/types";
import type { Plugin } from "rollup";

export interface CSSExportOptions {
  include?: FilterPattern;
  exclude?: FilterPattern;
  metaKey?: string;
}

interface StyleAsset {
  id: string;
  source: string;
}

type StylesList = Set<string>;
type StyleAssets = Map<string, StyleAsset>;
type ImportedIds = Map<string, readonly string[]>;

function getEntryStyles(id: string, entries: ImportedIds): StylesList {
  const entry = entries.get(id) ?? [];
  const styles: StylesList = new Set();

  entry.forEach((asset) => {
    if (asset.endsWith(".css")) {
      styles.add(asset);
    } else {
      getEntryStyles(asset, entries).forEach((s) => styles.add(s));
    }
  });

  return styles;
}

export default function CSSExport(options: CSSExportOptions = {}): Plugin {
  const styleFilter = createFilter(
    options.include || ["**/*.css"],
    options.exclude
  );

  const styleAssets: StyleAssets = new Map();

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
      const resolveName = (id: string) => {
        let name: string;

        if (outputOptions.preserveModules) {
          const cwd = outputOptions.preserveModulesRoot ?? process.cwd();
          name = path.relative(cwd, id).replace(/\\/g, "/");
        } else {
          name = path.basename(id);
        }
        return name;
      };

      styleAssets.forEach(({ id, source }) => {
        this.emitFile({ type: "asset", name: resolveName(id), source });
      });

      const { metaKey } = options;

      if (!metaKey) {
        return;
      }

      const getFileName = (id: string) =>
        Object.values(bundle).find((e) => e.name === resolveName(id))?.fileName;

      const importedIds: ImportedIds = new Map();

      [...this.getModuleIds()].forEach((id) => {
        importedIds.set(id, this.getModuleInfo(id)?.importedIds ?? []);
      });

      importedIds.forEach((_, id) => {
        const styles = getEntryStyles(id, importedIds);

        if (styles.size === 0) {
          return;
        }

        const info = this.getModuleInfo(id);

        if (info) {
          info.meta[metaKey] = [...styles]
            .map(getFileName)
            .filter((fileName) => fileName !== undefined);
        }
      });
    },
  };
}
