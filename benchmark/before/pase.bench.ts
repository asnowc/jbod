import { bench } from "vitest";
import JBOD from "jbod";
import { createList } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";
import { lineSuite } from "@eavid/vitest-tool";
const B_JBOD: typeof JBOD = before as any;

const value = null;
const samples = [10 ** 2, 10 ** 3, 10 ** 4, 10 ** 5].map((num) => ({
  num,
  data: JBOD.binaryify(createList(num, value)),
}));
lineSuite(
  "pase",
  samples,
  function ({ data }) {
    bench("Current", function () {
      JBOD.parse(data);
    });
    bench("Before", function () {
      B_JBOD.parse(data);
    });
  },
  (item) => String(item.num)
);
