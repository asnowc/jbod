import { createList, createMap } from "./__mocks__/care_jbod_data.js";
import { bench } from "vitest";
import JBOD from "../src/mod.js";
import { lineSuite } from "@eavid/vitest-tool";
import { cases } from "./__mocks__/compare.cases.js";

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
