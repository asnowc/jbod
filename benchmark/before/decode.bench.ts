// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
// @deno-types="npm:jbod@0.2.1"
import B_JBOD from "../dist/before.js";
import { cases, createList } from "../__mocks__/compare.cases.ts";

cases
  .map(({ size, value, name }) => {
    const listData = JBOD.binaryify(createList(size, value));
    const b_listData = B_JBOD.binaryify(createList(size, value));
    return {
      size,
      name,
      Current: () => {
        JBOD.parse(listData);
      },
      Before: () => {
        B_JBOD.parse(b_listData);
      },
    };
  })
  .forEach(({ Before, Current, name }) => {
    Deno.bench("Current", { group: name }, Current);
    Deno.bench("Before", { group: name }, Before);
  });
