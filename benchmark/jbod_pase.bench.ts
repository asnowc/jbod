import { createList, createMap } from "./__mocks__/care_jbod_data.js";
import { bench } from "vitest";
import JBOD from "../src/mod.js";
import { lineSuite } from "@eavid/vitest-tool";
import { cases } from "./__mocks__/compare.cases.js";

function toStr(data: any) {
  return {
    jbodData: JBOD.binaryify(data),
    jsonStr: JSON.stringify(data),
  };
}
lineSuite(
  "JBOD.parse:JSON.parse (Array)",
  cases,
  function ({ size, value }) {
    const data = toStr(createList(size, value));
    bench("JBOD", function () {
      JBOD.parse(data.jbodData);
    });
    bench("JSON", function () {
      JSON.parse(data.jsonStr);
    });
  },
  (item) => item.name
);
lineSuite(
  "JBOD.parse:JSON.parse (Object)",
  cases,
  function ({ size, value }) {
    const { jbodData, jsonStr } = toStr(createMap(size, value));
    bench("JBOD", function () {
      JBOD.parse(jbodData);
    });
    bench("JSON", function () {
      JSON.parse(jsonStr);
    });
  },
  (item) => item.name
);
