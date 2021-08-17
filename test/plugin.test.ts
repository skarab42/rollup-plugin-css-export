import { rollup } from "rollup";
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
});
