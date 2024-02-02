// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
import B_JBOD from "npm:jbod@0.2.0";
import { LineSuite, benchSuiteRunner, bench } from "@eavid/vitest-tool/bench";
import { cases, createList, strMap } from "../__mocks__/compare.cases.ts";
import { config } from "../config.ts";

const suite1 = new LineSuite(
  "Encode",
  cases,
  function ({ size, value }) {
    const listData = createList(size, value);
    bench("Current", function () {
      JBOD.binaryify(listData);
    });
    bench("Before", function () {
      B_JBOD.binaryify(listData);
    });
  },
  {
    group: (item) => item.name,
    type: "bar",
  }
);
const suite2 = new LineSuite(
  "Encode string map * " + strMap.size,
  [strMap],
  function () {
    bench("Current", function () {
      JBOD.binaryify(strMap.data);
    });
    bench("Before", function () {
      B_JBOD.binaryify(strMap.data);
    });
  },
  { type: "bar" }
);
await benchSuiteRunner("", config.port, [suite1, suite2]);
