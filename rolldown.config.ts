import { defineConfig } from "rolldown";

export default defineConfig({
  input: "./src/mod.ts",
  output: {
    dir: "dist",
    preserveModules: true,
  },
  transform: {
    target: "es2020",
  },
});