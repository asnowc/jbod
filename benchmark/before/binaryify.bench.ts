import { describe, bench } from "vitest";
import JBOD from "jbod";
import { createList } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";
import { lineSuite } from "@lineSuite";
const B_JBOD: typeof JBOD = before as any;

const value = null;
const samples = [10 ** 2, 10 ** 3, 10 ** 4, 10 ** 5].map((num) => ({
  num,
  data: createList(num, value),
}));

describe("binaryify", function () {
  samples.forEach(function ({ num, data }) {
    bench("Current", function () {
      JBOD.binaryify(data);
    });
    bench("Before", function () {
      B_JBOD.binaryify(data);
    });
  });
});
lineSuite(
  "binaryify",
  samples,
  function ({ data }) {
    bench("Current", function () {
      JBOD.binaryify(data);
    });
    bench("Before", function () {
      JBOD.binaryify(data);
    });
  },
  (item) => String(item.num)
);
