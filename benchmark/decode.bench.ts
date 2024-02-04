import { createList } from "./__mocks__/compare.cases.ts";
import { LineSuite, benchSuiteRunner, bench, hrtimeNow } from "@eavid/vitest-tool/bench";
// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
import { cases, strMap } from "./__mocks__/compare.cases.ts";
import * as JSON from "./json.ts";
import { config } from "./utils/config.ts";

function toStr(data: any) {
  return {
    jbodU8Arr: JBOD.binaryify(data),
    jsonU8Arr: JSON.encode(data),
  };
}
export const suite1 = new LineSuite(
  `Decode Array`,
  cases,
  function ({ size, value }) {
    const data = toStr(createList(size, value));
    bench("JBOD", function () {
      JBOD.parse(data.jbodU8Arr);
    });
    bench("JSON", function () {
      JSON.decode(data.jsonU8Arr);
    });
  },
  {
    group: (item) => `${item.name} * ${item.size}`,
    type: "bar",
    now: hrtimeNow,
  }
);
export const suite2 = new LineSuite(
  "Decode Object string map",
  [strMap],
  function ({ data, size }) {
    const { jbodU8Arr, jsonU8Arr } = toStr(data);
    bench("JBOD", function () {
      JBOD.parse(jbodU8Arr);
    });
    bench("JSON", function () {
      JSON.decode(jsonU8Arr);
    });
  },
  { group: (item) => item.size + " * key", type: "bar", now: hrtimeNow }
);

benchSuiteRunner("xx", config.port, [suite1]);
