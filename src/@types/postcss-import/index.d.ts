// Based on https://github.com/DefinitelyTyped/DefinitelyTyped/blob/2cbb6390a8c84fef9ec42dac7d09e8b98a3221f9/types/postcss-import/index.d.ts
// Simplified & updated for recent versions of postcss types.
declare module "postcss-import" {
  import { AcceptedPlugin, PluginCreator } from "postcss";

  declare interface AtImportOptions {
    root?: string;
    path?: string | string[];
    plugins?: AcceptedPlugin[];
    resolve?: (
      id: string,
      basedir: string,
      importOptions: AtImportOptions
    ) => string | string[] | Promise<string | string[]>;
    load?: (
      filename: string,
      importOptions: AtImportOptions
    ) => string | Promise<string>;
    skipDuplicates?: boolean;
    addModulesDirectories?: string[];
  }

  function atImport(options?: AtImportOptions): PluginCreator<AtImportOptions>;

  export = atImport;
}
