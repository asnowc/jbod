interface LineSuiteDataSet {
  type: string;
}
export interface LineSuiteData {
  title: string;
  data: [string, EntityData[]][];
  dataSet?: LineSuiteDataSet[];
}
/** 每个测试的数据 */
export interface EntityData {
  type: string;
  mean: number;
}
