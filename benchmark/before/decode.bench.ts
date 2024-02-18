// @deno-types="https://esm.sh/jbod@0.4"
import JBOD from "jbod";
// @deno-types="https://esm.sh/jbod@0.4"
import B_JBOD from "../dist/before.js";
import { cases, createList } from "../__mocks__/compare.cases.ts";

cases
  .map(({ size, value, name }) => {
    const listData = JBOD.encode(createList(size, value));
    const b_listData = B_JBOD.encode(createList(size, value));
    return {
      size,
      name,
      Current: () => {
        JBOD.decode(listData);
      },
      Before: () => {
        B_JBOD.decode(b_listData);
      },
    };
  })
  .forEach(({ Before, Current, name }) => {
    Deno.bench("Current", { group: name }, Current);
    Deno.bench("Before", { group: name }, Before);
  });
