import type { File, Suite, Task } from "vitest";
import { BenchmarkReportsMap } from "vitest/reporters";
import { EntityData, LineSuiteData } from "./type.js";

function genLineEntity(task: Task): EntityData | null {
  const benchmark = task.result?.benchmark;
  if (task.type !== "custom" || !benchmark) return null;
  return { mean: benchmark.mean, type: task.name };
}
function genLineEntityList(suite: Suite): EntityData[] {
  const dataList: EntityData[] = [];
  for (const subTask of suite.tasks) {
    const data = genLineEntity(subTask);
    if (data) dataList.push(data);
  }
  return dataList;
}

const prefix = "\0line\0-";
export default class CustomJsonReporter extends BenchmarkReportsMap.json {
  async logTasks(files: File[]): Promise<void> {
    let fileDataList: ReportJSON = [];
    for (const file of files) {
      const fileData: LineSuiteData[] = [];
      for (const suite of this.findLineSuite(file)) {
        fileData.push(this.genSuiteData(suite));
      }
      if (fileData.length) fileDataList.push(fileData);
    }
    const str = JSON.stringify(fileDataList);
    await this.writeReport(str);
  }
  private *findLineSuite(file: File): Generator<Suite> {
    for (const task of file.tasks) {
      if (task.type !== "suite") continue;

      if (task.name.startsWith(prefix)) {
        yield task;
      }
    }
  }
  private genSuiteData(suite: Suite): LineSuiteData {
    const name = suite.name.slice(prefix.length);
    const data: LineSuiteData["data"] = [];
    const newSuite: EntityData[] = [];
    for (const task of suite.tasks) {
      if (task.type === "suite") {
        data.push([task.name, genLineEntityList(task)]);
      } else if (task.type === "test") {
        const data = genLineEntity(task);
        if (data) newSuite.push(data);
      }
    }
    if (newSuite.length) data.push([name, newSuite]);
    return { title: name, data };
  }
}
export type ReportJSON = LineSuiteData[][];
