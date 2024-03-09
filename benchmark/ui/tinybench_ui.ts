import { BenchSeries, genBenchDataSet, ReportUiServer } from "@eavid/vitest-tool/bench";

export async function run(list: BenchSeries[], port = 5520) {
  for await (const benchGroup of list) {
    await benchGroup.warmup();
    await benchGroup.run();
    const meta = benchGroup.customMeta;
    console.log(meta.groupName, ...benchGroup.results.map((res) => res?.rme?.toFixed(2)));
  }
  const json = genBenchDataSet(list);
  const u8Arr = textEncoder.encode(JSON.stringify([{ file: name, suiteData: [json] }]));
  const server = new ReportUiServer();
  server.updateBenchResult(u8Arr);
  server.listen(port);
  console.log(`http://localhost:${port}`);

  return server;
}
const textEncoder = new TextEncoder();
