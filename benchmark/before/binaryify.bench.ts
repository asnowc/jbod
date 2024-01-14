import { bench, describe } from "vitest";
import JBOD from "jbod";
import { createList, createMap } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";

const B_JBOD: typeof JBOD = before as any;

const value = 4;

describe("binaryify", function () {
  const data = createList(50000, value);
  bench("Current", function () {
    JBOD.binaryify(data);
  });
  bench("Before", function () {
    B_JBOD.binaryify(data);
  });
});

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
