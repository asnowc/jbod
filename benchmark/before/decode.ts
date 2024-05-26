import JBOD from "jbod";
// @deno-types="jbod"
import B_JBOD from "jbod-before";
import { createList } from "../__mocks__/compare.cases.ts";
import { casesList } from "./data/mod.ts";

casesList
  .map(({ size, value, name }) => {
    const data = createList(size, value);
    const listData = JBOD.encode(data);
    const b_listData = B_JBOD.encode(data);

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
