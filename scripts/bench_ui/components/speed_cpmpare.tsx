// @deno-types="https://esm.sh/echarts-comp@0.0.2"
import { ECharts, EChartsOption } from "echarts-comp";
import React, { useMemo } from "react";
export type CompareItem = {
  name: string;
  time: number;
  samples: number[];
};
export function SpeedCompare(props: { source: DataSetItem[]; dimensions: string[]; title: string }) {
  const { source, dimensions, title } = props;
  const compareChart = useMemo((): EChartsOption => {
    return {
      title: { text: title },
      tooltip: { show: true, trigger: "axis" },
      legend: { show: true },
      xAxis: {
        type: "category",
      },
      yAxis: {
        type: "value",
      },
      dataset: {
        dimensions: dimensions,
        source: source,
      },
      series: dimensions.slice(1).map(() => ({ type: "line" })),
    };
  }, [source, dimensions]);
  return <ECharts option={compareChart} style={{ width: "100%", height: 400 }} />;
}

export type DataSetItem = { [key: string]: number | string };
