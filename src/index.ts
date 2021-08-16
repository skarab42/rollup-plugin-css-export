import type { Plugin } from "rollup";

export default function svelteCompilePlugin(): Plugin {
  return {
    name: "css-export",
  };
}
