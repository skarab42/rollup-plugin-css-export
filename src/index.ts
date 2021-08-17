import path from "path";

import { createFilter } from "@rollup/pluginutils";

import type { FilterPattern } from "@rollup/pluginutils/types";
import type { ModuleInfo, NormalizedOutputOptions, Plugin } from "rollup";

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
type ModuleInfos = Map<string, ModuleInfo>;

function getEntryStyles(id: string, moduleInfos: ModuleInfos): StylesList {
  const moduleInfo = moduleInfos.get(id);
  const styles: StylesList = new Set();

  moduleInfo?.importedIds.forEach((asset) => {
    if (asset.endsWith(".css")) {
      styles.add(asset);
    } else {
      getEntryStyles(asset, moduleInfos).forEach((s) => styles.add(s));
    }
  });

  return styles;
}

function resolveName(id: string, options: NormalizedOutputOptions) {
  let name: string;

  if (options.preserveModules) {
    const cwd = options.preserveModulesRoot ?? process.cwd();
    name = path.relative(cwd, id).replace(/\\/g, "/");
  } else {
    name = path.basename(id);
  }
  return name;
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

    generateBundle(opts, bundle) {
      styleAssets.forEach(({ id, source }) => {
        this.emitFile({
          type: "asset",
          name: resolveName(id, opts),
          source,
        });
      });

      const { metaKey } = options;

      if (!metaKey) {
        return;
      }

      const moduleInfos: ModuleInfos = new Map();

      [...this.getModuleIds()].forEach((id) => {
        const moduleInfo = this.getModuleInfo(id);
        if (moduleInfo) {
          moduleInfos.set(id, moduleInfo);
        }
      });

      const getFileName = (id: string) =>
        Object.values(bundle).find((e) => e.name === resolveName(id, opts))
          ?.fileName;

      moduleInfos.forEach((moduleInfo, id) => {
        const styles = getEntryStyles(id, moduleInfos);

        if (styles.size > 0) {
          moduleInfo.meta[metaKey] = [...styles]
            .map(getFileName)
            .filter(Boolean);
        }
      });
    },
  };
}
