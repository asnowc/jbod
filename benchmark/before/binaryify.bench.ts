import { bench, describe } from "vitest";
import JBOD from "jbod";
import { createList, createMap } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";
import { lineSuite } from "@eavid/vitest-tool";
import { cases } from "../__mocks__/compare.cases.js";

const B_JBOD: typeof JBOD = before as any;

const value = "中文";
const k = 6;
const data = createMap(k, value, 6);
describe("binaryify tree - " + (k ** 7 - 1) / (k - 1), function () {
  bench("Current", function () {
    JBOD.binaryify(data);
  });
  bench("Before", function () {
    B_JBOD.binaryify(data);
  });
});
lineSuite(
  "binaryify",
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
  (item) => item.name
);
