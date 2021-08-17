import { OutputAsset, OutputChunk, rollup } from "rollup";
import css from "../dist/index";
import rimraf from "rimraf";
import glob from "glob";
import fs from "fs";

const tempDir = "test/temp";

const tempGlob = () => glob.sync(`${tempDir}/**/*.css`, { nodir: true });
const readFile = (path: string) => fs.readFileSync(path, { encoding: "utf-8" });

const defaultOutputOptions = {
  dir: tempDir,
  assetFileNames: "assets/[name].[ext]",
};

function expectTree(fixtures: string[], outputs: string[]) {
  expect(tempGlob()).toEqual(expect.arrayContaining(outputs));

  outputs.forEach((output, index) => {
    expect(readFile(fixtures[index] as string)).toEqual(readFile(output));
  });
}

function isEntryChunk(info: OutputAsset | OutputChunk): info is OutputChunk {
  info = info as OutputChunk;
  return info.isEntry === true && info.facadeModuleId !== null;
}

describe("rollup-plugin-css-export", () => {
  afterEach(() => {
    rimraf.sync(tempDir);
  });

  it("should output red.js assets", async () => {
    const fixtures: string[] = [
      "test/fixtures/red.css",
      "test/fixtures/lib/reset.css",
    ];
    const outputs: string[] = [
      "test/temp/assets/red.css",
      "test/temp/assets/reset.css",
    ];

    const bundle = await rollup({
      input: "test/fixtures/red.js",
      plugins: [css()],
    });

    await bundle.write(defaultOutputOptions);

    expectTree(fixtures, outputs);
  });

  it("should output purple.js assets", async () => {
    const fixtures: string[] = [
      "test/fixtures/red.css",
      "test/fixtures/blue.css",
      "test/fixtures/lib/reset.css",
    ];
    const outputs: string[] = [
      "test/temp/assets/red.css",
      "test/temp/assets/blue.css",
      "test/temp/assets/reset.css",
    ];

    const bundle = await rollup({
      input: "test/fixtures/purple.js",
      plugins: [css()],
    });

    await bundle.write(defaultOutputOptions);

    expectTree(fixtures, outputs);
  });

  it("should output purple.js assets preserving paths", async () => {
    const fixtures: string[] = [
      "test/fixtures/red.css",
      "test/fixtures/blue.css",
      "test/fixtures/lib/reset.css",
    ];
    const outputs: string[] = [
      "test/temp/assets/test/fixtures/red.css",
      "test/temp/assets/test/fixtures/blue.css",
      "test/temp/assets/test/fixtures/lib/reset.css",
    ];

    const bundle = await rollup({
      input: "test/fixtures/purple.js",
      plugins: [css()],
    });

    await bundle.write({
      ...defaultOutputOptions,
      preserveModules: true,
    });

    expectTree(fixtures, outputs);
  });

  it("should output purple.js assets preserving paths from `test` dir", async () => {
    const fixtures: string[] = [
      "test/fixtures/red.css",
      "test/fixtures/blue.css",
      "test/fixtures/lib/reset.css",
    ];
    const outputs: string[] = [
      "test/temp/assets/fixtures/red.css",
      "test/temp/assets/fixtures/blue.css",
      "test/temp/assets/fixtures/lib/reset.css",
    ];

    const bundle = await rollup({
      input: "test/fixtures/purple.js",
      plugins: [css()],
    });

    await bundle.write({
      ...defaultOutputOptions,
      preserveModules: true,
      preserveModulesRoot: "test",
    });

    expectTree(fixtures, outputs);
  });

  it("should export entry metadata", async () => {
    const metaKey = "styles";
    const fixtures: string[] = [
      "test/fixtures/red.css",
      "test/fixtures/blue.css",
      "test/fixtures/lib/reset.css",
    ];
    const outputs: string[] = [
      "test/temp/assets/red.css",
      "test/temp/assets/blue.css",
      "test/temp/assets/reset.css",
    ];
    const expectedMetadata = {
      "blue.js": ["assets/reset.css", "assets/blue.css"],
      "red.js": ["assets/reset.css", "assets/red.css"],
      "purple.js": ["assets/reset.css", "assets/red.css", "assets/blue.css"],
    };

    const metadata: Record<string, string[] | null> = {};

    const bundle = await rollup({
      input: [
        "test/fixtures/blue.js",
        "test/fixtures/red.js",
        "test/fixtures/purple.js",
      ],
      plugins: [
        css({ metaKey }),
        {
          name: "your-plugin",
          generateBundle(_, bundle) {
            Object.entries(bundle).forEach(([id, entry]) => {
              if (isEntryChunk(entry) && entry.facadeModuleId) {
                const info = this.getModuleInfo(entry.facadeModuleId);
                metadata[id] = info?.meta[metaKey];
              }
            });
          },
        },
      ],
    });

    await bundle.write(defaultOutputOptions);

    expectTree(fixtures, outputs);
    expect(metadata).toStrictEqual(expectedMetadata);
  });
});
