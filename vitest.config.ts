import { defineConfig } from "vitest/config";
import path from "node:path";

const root = import.meta.dirname;
export default defineConfig({
  test: {
    alias: [{ find: /^jbod$/, replacement: path.resolve(root, "src/mod.ts") }],
  },
});
