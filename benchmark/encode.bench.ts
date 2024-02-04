import { createList } from "./__mocks__/compare.cases.ts";
import { LineSuite, benchSuiteRunner, bench, hrtimeNow } from "@eavid/vitest-tool/bench";
// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
import * as JSON from "./json.ts";
import { cases, strMap } from "./__mocks__/compare.cases.ts";
import { config } from "./utils/config.ts";
import * as protobuf from "./protobuf.ts";

export const suite1 = new LineSuite(
  "Encode Array",
  cases,
  function (item) {
    const listData = createList(item.size, item.value);
    const protoBufType = protobuf.defined.lookupType(item.protobufGetter);
    bench("JBOD", function () {
      JBOD.binaryify(listData);
    });
    bench("JSON", function () {
      JSON.encode(listData);
    });
    bench("ProtoBuf", function () {
      protobuf.encodeArray(listData, protoBufType);
    });
  },
  {
    group: (item) => item.name,
    type: "bar",
    now: hrtimeNow,
  }
);
export const suite2 = new LineSuite(
  "Encode Object string map",
  [strMap],
  function ({ data, size }) {
    bench("JBOD", function () {
      JBOD.binaryify(data);
    });
    bench("JSON", function () {
      JSON.encode(data);
    });
  },
  {
    group: (item) => item.size + " * key",
    type: "bar",
    now: hrtimeNow,
  }
);
benchSuiteRunner("xx", config.port, [suite1, suite2]);
