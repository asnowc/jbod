import { createList, createMap } from "./__mocks__/care_jbod_data.js";
import { bench } from "vitest";
import JBOD from "../src/mod.js";
import { lineSuite } from "@lineSuite";
const cases = [
  { name: "number_8", size: 1000, value: 8 },
  { name: "number_0x1fffff", size: 1000, value: 0x1fffff },
  { name: "double", size: 1000, value: 1.8237592 },
  { name: "boolean", size: 1000, value: true },
  { name: "string", size: 100, value: "中文".repeat(100) },
];
function toStr(data: any) {
  return {
    jbodData: JBOD.binaryify(data),
    jsonStr: JSON.stringify(data),
  };
}
lineSuite(
  "Decode Array",
  cases,
  function ({ size, value }) {
    const data = toStr(createList(size, value));
    bench("JBOD", function () {
      JBOD.pase(data.jbodData);
    });
    bench("JSON", function () {
      JSON.parse(data.jsonStr);
    });
  },
  (item) => item.name
);
lineSuite(
  "Decode Map",
  cases,
  function ({ size, value }) {
    const { jbodData, jsonStr } = toStr(createMap(size, value));
    bench("JBOD", function () {
      JBOD.pase(jbodData);
    });
    bench("JSON", function () {
      JSON.parse(jsonStr);
    });
  },
  (item) => item.name
);
