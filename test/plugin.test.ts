import { OutputAsset, OutputChunk, rollup, Plugin } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import css from "../src/index";
import rimraf from "rimraf";
import glob from "glob";
import fs from "fs";

type Metadata = Record<string, string[] | null>;

interface TestPluginOptions {
  metaKey: string;
  metadata: Metadata;
}

const tempDir = "test/temp";

const tempGlob = () => glob.sync(`${tempDir}/**/*.css`, { nodir: true });
const readFile = (path: string) => fs.readFileSync(path, { encoding: "utf-8" });

const defaultOutputOptions = {
  dir: tempDir,
  assetFileNames: "assets/[name].[ext]",
};

function expectTree(outputs: string[]) {
  expect(tempGlob()).toEqual(expect.arrayContaining(outputs));
}

function expectTreeAndContent(fixtures: string[], outputs: string[]) {
  expectTree(outputs);

  outputs.forEach((output, index) => {
    const fixture = fixtures[index];

    if (!fixture) {
      throw new Error(
        `Missing fixture(s) for output '${output}' at index ${index}.`
      );
    }

    expect(readFile(fixture)).toEqual(readFile(output));
  });
}

function isEntryChunk(info: OutputAsset | OutputChunk): info is OutputChunk {
  info = info as OutputChunk;
  return info.isEntry === true && info.facadeModuleId !== null;
}

function testPlugin(options: TestPluginOptions): Plugin {
  const { metaKey, metadata } = options;

  return {
    name: "test-plugin",

    generateBundle(_, bundle) {
      Object.entries(bundle).forEach(([id, entry]) => {
        if (isEntryChunk(entry) && entry.facadeModuleId) {
          const info = this.getModuleInfo(entry.facadeModuleId);
          metadata[id] = info?.meta[metaKey];
        }
      });
    },
  };
}

afterEach(() => {
  rimraf.sync(tempDir);
});

describe("Basic CSS", () => {
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

    expectTreeAndContent(fixtures, outputs);
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

    expectTreeAndContent(fixtures, outputs);
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

    expectTreeAndContent(fixtures, outputs);
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

    expectTreeAndContent(fixtures, outputs);
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

    const metadata: Metadata = {};

    const bundle = await rollup({
      input: [
        "test/fixtures/blue.js",
        "test/fixtures/red.js",
        "test/fixtures/purple.js",
      ],
      plugins: [css({ metaKey }), testPlugin({ metaKey, metadata })],
    });

    await bundle.write(defaultOutputOptions);

    expectTreeAndContent(fixtures, outputs);
    expect(metadata).toStrictEqual(expectedMetadata);
  });

  it("should export entry metadata with recursive import", async () => {
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
      "rainbow.js": ["assets/reset.css", "assets/red.css", "assets/blue.css"],
    };

    const metadata: Record<string, string[] | null> = {};

    const bundle = await rollup({
      input: "test/fixtures/rainbow.js",
      plugins: [css({ metaKey }), testPlugin({ metaKey, metadata })],
    });

    await bundle.write(defaultOutputOptions);

    expectTreeAndContent(fixtures, outputs);
    expect(metadata).toStrictEqual(expectedMetadata);
  });

  it("should import CSS from node_modules", async () => {
    const fixtures: string[] = ["node_modules/normalize.css/normalize.css"];
    const outputs: string[] = ["test/temp/assets/normalize.css"];

    const bundle = await rollup({
      input: "test/fixtures/normalize.js",
      plugins: [css(), resolve()],
    });

    await bundle.write(defaultOutputOptions);

    expectTreeAndContent(fixtures, outputs);
  });
});

describe("CSS with @import directive(s)", () => {
  it.each([
    {
      name: "should inline a single @import directive",
      fixture: "basic",
      expected: `/* utils.css */
h1.greenTitle {
  color: green;
}
/* basic.css */
body {
  background-color: purple;
}
`,
    },
    {
      name: "should inline multiple @import directives",
      fixture: "multiple",
      expected: `/* utils.css */
h1.greenTitle {
  color: green;
}
/* red.css */
body {
  background-color: red;
}
/* multiple.css */
body {
  background-color: fuchsia;
}
`,
    },
    {
      name: "should inline nested @import directives",
      fixture: "nested",
      expected: `/* utils.css */
h1.greenTitle {
  color: green;
}
/* fonts.css */
body {
  font-family: sans-serif;
}
/* nested.css */
body {
  background-color: yellow;
}
`,
    },
    {
      name: "should skip similar @import directives",
      fixture: "duplicate",
      expected: `* {
  margin: 0;
  padding: 0;
}
/* layout.css */
section {
  margin: 0;
}
/* duplicate.css */
body {
  background-color: aqua;
}
`,
    },
  ])("$name", async ({ fixture, expected }) => {
    const bundle = await rollup({
      input: `test/fixtures/import/${fixture}.js`,
      plugins: [css()],
    });

    await bundle.write(defaultOutputOptions);

    const outputPath = `test/temp/assets/${fixture}.css`;

    expectTree([outputPath]);
    expect(readFile(outputPath)).toEqual(expected);
  });

  it("should gracefully fail on invalid @import directive(s) and report the associated CSS file", async () => {
    const bundle = await rollup({
      input: `test/fixtures/import/invalid.js`,
      plugins: [css()],
    });

    await expect(
      bundle.write(defaultOutputOptions)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Something went wrong when inlining an @import directive in 'invalid.css'."`
    );
  });
});
