import esmTsPlugin from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

const tsPlugin = esmTsPlugin;
const output = "dist/mod.js";

export default defineConfig({
  input: "./src/mod.ts",
  output: {
    file: output,
  },
  plugins: [
    tsPlugin({
      include: ["./src/**"],
      compilerOptions: {
        target: "ES2020",
        module: "nodenext",
        declaration: true,
        declarationDir: "dist",
        declarationMap: true,
      },
    }),
  ],
});
