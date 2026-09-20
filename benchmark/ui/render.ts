import { createCanvas } from "@napi-rs/canvas";
import * as echarts from "echarts";
import path from "node:path";
import { genChartPageData } from "./pase_deno_bench.ts";

const chartWidth = 1440;
const chartHeight = 480;
const rootDir = path.resolve(import.meta.dirname!, "../..");
const outputFile = path.resolve(Deno.args[0] ?? path.join(rootDir, "benchmark/dist/result.png"));

const input = await new Response(Deno.stdin.readable).text();
if (!input.trim()) throw new Error("No benchmark JSON received from stdin");

const chartData = genChartPageData(JSON.parse(input));
const dataSets = chartData.flatMap((item) => item.suiteData);
if (dataSets.length === 0) throw new Error("No benchmark data found in stdin");

const outputCanvas = createCanvas(chartWidth, chartHeight * dataSets.length);
const outputContext = outputCanvas.getContext("2d");
outputContext.fillStyle = "#ffffff";
outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

for (const [index, dataSet] of dataSets.entries()) {
  const canvas = createCanvas(chartWidth, chartHeight);
  const chart = echarts.init(canvas as never, undefined, {
    renderer: "canvas",
    width: chartWidth,
    height: chartHeight,
  });
  const categories = dataSet.source.map((item) => String(item.groupName));
  const seriesNames = dataSet.dimensions.filter((name) => name !== "groupName");

  chart.setOption({
    animation: false,
    backgroundColor: "#ffffff",
    title: { text: dataSet.title, left: "center" },
    legend: { data: seriesNames, top: 36 },
    grid: { top: 90, right: 40, bottom: 80, left: 80 },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { interval: 0, rotate: categories.some((name) => name.length > 12) ? 20 : 0 },
    },
    yAxis: { type: "value", name: dataSet.yName },
    series: seriesNames.map((name) => ({
      name,
      type: dataSet.chartType ?? "bar",
      data: dataSet.source.map((item) => item[name]),
    })),
  });

  outputContext.drawImage(canvas, 0, index * chartHeight);
  chart.dispose();
}

await Deno.mkdir(path.dirname(outputFile), { recursive: true });
await Deno.writeFile(outputFile, outputCanvas.toBuffer("image/png"));
console.log(`Rendered ${dataSets.length} chart(s) to ${outputFile}`);