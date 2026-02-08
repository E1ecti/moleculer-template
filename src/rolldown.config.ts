import { readdir } from "node:fs/promises"
import { defineConfig, type InputOption } from "rolldown"

import packages from "../package.json" with { type: "json" }
import RolldownFix from "./rolldown.fix"

const services = process.env.SERVICES
  ? process.env.SERVICES.split(/[, ]/)
  : await readdir("src/services")

const inputs: InputOption = services.reduce(
  (obj, dir) => ({
    ...obj,
    [`services/${dir}`]: `src/services/${dir}/index.ts`,
  }),
  {},
)

const models = await readdir("src/models")
const _groupPerModel = models.map((model) => {
  const filename = model.replace(".ts", "")
  return {
    name: `models/${filename}`,
    test: new RegExp(`models[\\\\/]${filename.replaceAll(".", "\\.")}`),
  }
})

inputs.index = "src/index.ts"

export default defineConfig({
  input: inputs,
  platform: "node",
  plugins: [RolldownFix],
  watch: {
    include: /.*.ts/,
    exclude: /types/
  },
  transform: {
    decorator: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },
  external:
    // Object.keys(packages.dependencies),
    [
      /rolldown-binding\..*\.node/,
      /rolldown-binding\..*\.wasm/,
      /@typegoose.*/,
      /@oxc-project.*/,
      /@rolldown\/binding-.*/,
      /\.\/rolldown-binding\.wasi\.cjs/,
      // some dependencies (e.g. zod) cannot be inlined because their types
      // are used in public APIs
      ...Object.keys(packages.dependencies),
      ...Object.keys(packages.devDependencies),
      /node_modules/g,
      // /typegoose/g
    ],
  resolve: {
    tsconfigFilename: "tsconfig.json",
    // alias: {
    // 	"fastest-validator-decorators": "src/utils/fastest-validator-decorators"
    // 	// 	"@models": resolve(import.meta.dirname, "src/models"),
    // 	// 	"@utils": resolve(import.meta.dirname, "src/utils")
    // }
  },
  output: {
    dir: "dist",
    // minify: false,
    advancedChunks: {
      groups: [
        // ...groupPerModel,
        {
          name: "models",
          test: /models/,
        },
        {
          name: "utils",
          test: /utils/,
        },
      ],
    },

    // Rolldown currently doesn't supports `manualChunks` option
    // manualChunks: (id) =>
    // 	id.includes("models")
    // 		? "models/" + id.split("/").pop().replace(".ts", "")
    // 		: null,
    // chunkFileNames: ({ name }) =>
    // 	(name.includes("models") ? "[name]" : "lib/[name]") + ".js"

    // intro: (all) => {
    // 	console.log(all)
    // 	return (all.moduleIds[0].includes("models") ? "models/[name]" : "lib/[name]") + ".js"
    // }
  },
})
