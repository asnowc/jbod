import { genChartPageData } from "./pase_deno_bench.ts";
import { ReportUiServer } from "@eavid/vitest-tool/bench";
import path from "node:path";
import { config } from "./config.ts";
const textEncoder = new TextEncoder();
const server = new ReportUiServer();
server.listen(config.port);
console.log(`http://localhost:${config.port}`);

const dirname = import.meta.dirname!;
const resultFilename = path.resolve(dirname, "../dist/result.json");
await update();
for await (const change of Deno.watchFs(resultFilename)) {
  if (change.kind === "modify") {
    console.log(new Date());
    update().catch((e) => {
      console.log(e);
    });
  }
}
async function update() {
  const text = await Deno.readTextFile(resultFilename);
  if (!text) return;
  let jsonStr;
  try {
    jsonStr = JSON.parse(text);
  } catch (error) {
    server.updateBenchResult(textEncoder.encode("[]"))
    return;
  }
  const str = JSON.stringify(genChartPageData(jsonStr));
  server.updateBenchResult(textEncoder.encode(str));
}
