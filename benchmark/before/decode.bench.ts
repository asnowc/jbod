// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
import B_JBOD from "npm:jbod@0.2.0";
import { LineSuite, benchSuiteRunner, bench } from "@eavid/vitest-tool/bench";
import { cases, createList, strMap } from "../__mocks__/compare.cases.ts";
import { config } from "../config.ts";

const suite1 = new LineSuite(
  "Decode",
  cases,
  function ({ size, value }) {
    const listData = JBOD.binaryify(createList(size, value));
    const b_listData = B_JBOD.binaryify(createList(size, value));
    bench("Current", function () {
      JBOD.parse(listData);
    });
    bench("Before", function () {
      B_JBOD.parse(b_listData);
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
  function ({ data }) {
    const u8Arr = JBOD.binaryify(strMap.data);
    bench("Current", function () {
      JBOD.parse(u8Arr);
    });
    bench("Before", function () {
      B_JBOD.parse(u8Arr);
    });
  },
  {
    type: "bar",
    group: (item) => item.size.toString(),
  }
);

await benchSuiteRunner("", config.port, [suite1]);
