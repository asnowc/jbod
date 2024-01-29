import { bench, describe } from "vitest";
import JBOD from "jbod";
import { createList, createMap } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";
import { lineSuite } from "@eavid/vitest-tool";
import { cases } from "../__mocks__/compare.cases.js";
const B_JBOD: typeof JBOD = before as any;

lineSuite(
  "parse",
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
  (item) => item.name
);

const value = "中文";
const k = 6;
const data = JBOD.binaryify(createMap(k, value, 6));
describe("parse tree - " + (k ** 7 - 1) / (k - 1), function () {
  bench("Current", function () {
    JBOD.parse(data);
  });
  bench("Before", function () {
    B_JBOD.parse(data);
  });
});
