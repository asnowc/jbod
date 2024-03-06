// @deno-types="https://esm.sh/jbod@0.4.x"
import JBOD from "jbod";
// @deno-types="https://esm.sh/jbod@0.4.x"
import B_JBOD from "../dist/before.js";
import { cases, createList } from "../__mocks__/compare.cases.ts";
const map = new Map(
  Object.entries({
    disabled: false,
    count: 100837,
    name: "Documentation",
    dataStamp: 4 / 7,
    id: 876,
  })
);

const casesList: { size: number; value: any; name: string }[] = cases.slice(1);
casesList.push({ name: "map", value: map, size: 1000 });

casesList
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
