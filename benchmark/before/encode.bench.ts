// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
// @deno-types="npm:jbod@0.2.1"
import B_JBOD from "../dist/before.js";
import { cases, createList } from "../__mocks__/compare.cases.ts";
const benchFn = cases.map(({ name, size, value }) => {
  const listData = createList(size, value);
  return {
    name,
    JBOD: () => {
      JBOD.binaryify(listData);
    },
    B_JBOD: () => {
      B_JBOD.binaryify(listData);
    },
  };
});
benchFn.map(({ B_JBOD, JBOD, name }) => {
  Deno.bench("Current", { group: name }, JBOD);
  Deno.bench("Before", { group: name }, B_JBOD);
});
