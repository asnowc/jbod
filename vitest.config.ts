import { defineConfig, UserConfig } from "vitest/config";
import path from "node:path";
import { EChartsBenchmarkReporter } from "@eavid/vitest-tool/reporter";

const args = process.argv.slice(2);
const isBench = args[0] === "bench";

const root = __dirname;
export default defineConfig({
  test: {
    alias: isBench ? createBenchAlias() : [{ find: /^jbod$/, replacement: path.resolve(root, "src/mod.js") }],
    benchmark: {
      reporters: [new EChartsBenchmarkReporter(), "default"],
      outputFile: "scripts/bench_ui/public/result.json",
    },
  },
});
type Alias = NonNullable<NonNullable<UserConfig["test"]>["alias"]>;

function createBenchAlias(): { find: RegExp; replacement: string }[] {
  return [
    { find: /^jbod$/, replacement: path.resolve(root, "dist/mod.js") },
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
