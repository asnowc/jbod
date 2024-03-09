export type ReportJSON = { file: string; suiteData: BenchmarkDataSet[] }[];

export type BenchmarkDataSet = {
  title: string;
  yName?: string;
  dimensions: string[];
  source: DataSetItem[];
  chartType?: ChartType;
  /** 误差 */
  rmeDataSet: DataSetItem[];
};
export type DataSetItem = { [key: string]: number | string };

export type ChartType = "line" | "bar";

type BenchResult = {
  n: number;
  min: number;
  max: number;
  avg: number;
  p75: number;
  p99: number;
  p995: number;
  p999: number;
  highPrecision: boolean;
  usedExplicitTimers: boolean;
};
type Bench = {
  origin: string;
  group: string;
  name: string;
  baseline: boolean;
  results: {
    ok: BenchResult;
  }[];
};
function genChartData(title: string, fileResult: Map<string, Bench[]>) {
  const chartData: BenchmarkDataSet = {
    dimensions: ["groupName"],
    source: [],
    rmeDataSet: [],
    title,
    chartType: "bar",
    yName: "ms",
  };
  const dimensions = new Set<string>();
  for (const [name, group] of fileResult) {
    const item: DataSetItem = {
      groupName: name,
    };
    for (const bench of group) {
      dimensions.add(bench.name);
      item[bench.name] = bench.results[0].ok.avg / 1000000;
    }
    chartData.source.push(item);
  }
  chartData.dimensions.push(...dimensions);
  return chartData;
}
function parseFilename(name: string, base?: string) {
  if (base && name.startsWith(base)) name = name.slice(base.length + 1);
  else name = name.slice(name.lastIndexOf("/") + 1);
  return name.replace(/(.bench)?\..+$/, "");
}
function group(list: Bench[]) {
  const fileMap: Map<string, Map<string, Bench[]>> = new Map();
  for (const item of list) {
    let file = fileMap.get(item.origin);
    if (!file) {
      file = new Map();
      fileMap.set(item.origin, file);
    }
    let group = file.get(item.group);
    if (!group) {
      group = [];
      file.set(item.group, group);
    }
    group.push(item);
  }
  return fileMap;
}
export function genChartPageData(data: any): ReportJSON {
  const chartDataList: ReportJSON = [];
  for (const [filename, file] of group(data.benches)) {
    const title = parseFilename(filename);
    chartDataList.push({ file: filename, suiteData: [genChartData(title, file)] });
  }
  return chartDataList;
}
