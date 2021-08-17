# rollup-plugin-css-export

Extracts and exports all CSS files that have been imported as a module, preserving or not the original path of the asset.

In addition to this a `styles` property can be added to the `metadata` of each entry that imports one or more CSS files.

> The `styles` property contains a list of paths to the generated assets which can, for example, be used by other plugins to generate HTML template.

# Installation

With yarn:

```bash
yarn add --dev rollup-plugin-css-export
```

With npm:

```bash
npm install --save-dev rollup-plugin-css-export
```

> If you want to import libraries directly from `node_modules` (e.g. [normalize.css](https://www.npmjs.com/package/normalize.css)) you may need to install the [@rollup/plugin-node-resolve](https://www.npmjs.com/package/@rollup/plugin-node-resolve) plugin.

# Options

| Name     | Type                                         | Default     | Description                                                                                                      |
| -------- | -------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| metaKey? | string \| Symbol                             | `undefined` | The name of the metadata key. When the value is `nullish` the plugin will not process or export any metadata.    |
| include? | String \| RegExp \| Array[...String\|RegExp] | `**/*.css`  | See [pluginutils](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter) for more info |
| exclude? | String \| RegExp \| Array[...String\|RegExp] | `undefined` | See [pluginutils](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter) for more info |

# Basic example

```js
import css from "rollup-plugin-css-export";

export default {
  input: ["src/red.js", "src/blue.js", "src/purple.js"],
  output: {
    dir: "dist",
    // preserveModules: true,
  },
  plugins: [css()],
};
```

Outputs with `preserveModules = false`

```
📦dist
 ┣ 📂assets
 ┃ ┣ 📜blue-8e2a6dc2.css
 ┃ ┣ 📜red-443842c2.css
 ┃ ┗ 📜reset-be7c786b.css
 ┣ 📜blue.js
 ┣ 📜purple.js
 ┗ 📜red.js
```

Outputs with `preserveModules = true`

```
📦dist
 ┣ 📂assets
 ┃ ┣ 📂lib
 ┃ ┃ ┗ 📜reset-5af228c6.css
 ┃ ┣ 📜blue-8e2a6dc2.css
 ┃ ┗ 📜red-443842c2.css
 ┣ 📜blue.js
 ┣ 📜purple.js
 ┗ 📜red.js
```

# Accessing metadata from another plugin

```js
import css from "rollup-plugin-css-export";

const metaKey = Symbol("styles");

export default {
  input: ["src/red.js", "src/blue.js", "src/purple.js"],
  output: {
    dir: "dist",
    // preserveModules: true,
  },
  plugins: [
    css({ metaKey }),
    {
      name: "your-plugin",
      generateBundle() {
        [...this.getModuleIds()].forEach((id) => {
          const chunkInfo = this.getModuleInfo(id);
          if (chunkInfo.isEntry) {
            console.log(chunkInfo.id, chunkInfo.meta[metaKey]);
          }
        });
      },
    },
  ],
};
```

Outputs with `preserveModules = false`

```bash
.../red.js    [ 'assets/reset-be7c786b.css', 'assets/red-443842c2.css' ]
.../blue.js   [ 'assets/reset-be7c786b.css', 'assets/blue-8e2a6dc2.css' ]
.../purple.js [ 'assets/reset-be7c786b.css', 'assets/red-443842c2.css', 'assets/blue-8e2a6dc2.css' ]
```

Outputs with `preserveModules = true`

```bash
.../red.js    [ 'assets/lib/reset-be7c786b.css', 'assets/red-443842c2.css' ]
.../blue.js   [ 'assets/lib/reset-be7c786b.css', 'assets/blue-8e2a6dc2.css' ]
.../purple.js [ 'assets/lib/reset-be7c786b.css', 'assets/red-443842c2.css', 'assets/blue-8e2a6dc2.css' ]
```
