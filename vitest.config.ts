import { defineConfig, UserConfig } from "vitest/config";
import path from "node:path";
import Reporter from "./utils/vitest_report/reporter.js";

const args = process.argv.slice(2);
const isBench = args[0] === "bench";

const root = __dirname;
export default defineConfig({
  test: {
    alias: [{ find: /^jbod$/, replacement: path.resolve(root, "src/mod.js") }, ...(isBench ? createBenchAlias() : [])],
    benchmark: {
      reporters: [new Reporter(), "default"],
      outputFile: "bench/dist/result.json",
    },
  },
});
type Alias = NonNullable<NonNullable<UserConfig["test"]>["alias"]>;

function createBenchAlias() {
  return [
    {
      find: /^@jbod-before$/,
      replacement: path.resolve(root, "./benchmark/dist/before.js"),
    },
    {
      find: /^@lineSuite$/,
      replacement: path.resolve(root, "./benchmark/utils/line_suite.js"),
    },
  ];
}
