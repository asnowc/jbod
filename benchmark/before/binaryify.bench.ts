import { bench } from "vitest";
import JBOD from "jbod";
import { createList, linerList } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";
import { lineSuite } from "@eavid/vitest-tool";

const B_JBOD: typeof JBOD = before as any;

const value = null;
const samples = linerList(5, 500, 500).map((num) => ({
  num,
  data: createList(num, value),
}));

lineSuite(
  "binaryify",
  samples,
  function ({ data }) {
    bench("Current", function () {
      JBOD.binaryify(data);
    });
    bench("Before", function () {
      B_JBOD.binaryify(data);
    });
  },
  (item) => String(item.num)
);
