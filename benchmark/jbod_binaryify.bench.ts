import { createList, createMap } from "./__mocks__/care_jbod_data.js";
import { bench } from "vitest";
import JBOD from "../src/mod.js";
import { lineSuite } from "@lineSuite";

const cases = [
  { name: "number_8", size: 10000, value: 8 },
  { name: "number_0x1fffff", size: 10000, value: 0x1fffff },
  { name: "double", size: 10000, value: 1.8237592 },
  { name: "boolean", size: 10000, value: true },
  { name: "string", size: 1000, value: "中文".repeat(100) },
];
lineSuite(
  "Encode Array",
  cases,
  function ({ size, value }) {
    const listData = createList(size, value);
    bench("JBOD", function () {
      JBOD.binaryify(listData);
    });
    bench("JSON", function () {
      JSON.stringify(listData);
    });
  },
  (item) => item.name
);
lineSuite(
  "Encode Map",
  cases,
  function ({ size, value }) {
    const mapData = createMap(size, value);
    bench("JBOD", function () {
      JBOD.binaryify(mapData);
    });
    bench("JSON", function () {
      JSON.stringify(mapData);
    });
  },
  (item) => item.name
);
