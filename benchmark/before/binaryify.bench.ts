import { bench, describe } from "vitest";
import JBOD from "jbod";
import { createList, createMap } from "../__mocks__/care_jbod_data.js";
import before from "@jbod-before";

const B_JBOD: typeof JBOD = before as any;

const value = 4;

describe("binaryify", function () {
  const data = createList(10000, value);
  bench("Current", function () {
    JBOD.binaryify(data);
  });
  bench("Before", function () {
    B_JBOD.binaryify(data);
  });
});

const data = createMap(5, value, 6);
describe("binaryify tree - " + (5 ** 7 - 1) / 4, function () {
  bench("Current", function () {
    JBOD.binaryify(data);
  });
  bench("Before", function () {
    B_JBOD.binaryify(data);
  });
});
