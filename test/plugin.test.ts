import { rollup } from "rollup";
import css from "../dist/index";
import glob from "glob";
import fs from "fs";

const tempDir = "test/temp";

const tempGlob = () => glob.sync(`${tempDir}/**/*.css`, { nodir: true });
const readFile = (path: string) => fs.readFileSync(path, { encoding: "utf-8" });

describe("rollup-plugin-css-export", () => {
  it("should output red.js assets", async () => {
    const fixtures: string[] = [
      "test/fixtures/red.css",
      "test/fixtures/lib/reset.css",
    ];
    const outputs: string[] = [
      "test/temp/assets/red-443842c2.css",
      "test/temp/assets/reset-be7c786b.css",
    ];

    const bundle = await rollup({
      input: "test/fixtures/red.js",
      plugins: [css()],
    });

    await bundle.write({
      dir: tempDir,
    });

    expect(tempGlob()).toEqual(expect.arrayContaining(outputs));

    outputs.forEach((output, index) => {
      expect(readFile(fixtures[index] as string)).toEqual(readFile(output));
    });
  });
});
