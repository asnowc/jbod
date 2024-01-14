import React, { useMemo, useState } from "react";
import { DataSetItem, SpeedCompare } from "./speed_cpmpare.tsx";

async function getData() {
  const data = await getBenchmarkData();
  return data.map((item) => item.suiteData).flat();
}
export function BenchmarkPage() {
  const [data = [], setData] = useState<BenchmarkDataSet[] | undefined>();
  useMemo(() => {
    getData().then(setData);
  }, []);

  return (
    <div>
      {data.map(({ dimensions, source, title }) => {
        return <SpeedCompare dimensions={dimensions} source={source} title={title} />;
      })}
    </div>
  );
}
type ReportJSON = { file: string; suiteData: BenchmarkDataSet[] }[];
type BenchmarkDataSet = {
  title: string;
  dimensions: string[];
  source: DataSetItem[];
};

async function getBenchmarkData() {
  const resp = await fetch("result.json");
  const json: ReportJSON = await resp.json();
  return json;
}
