import JBOD from "jbod";
// @deno-types="jbod"
import B_JBOD from "jbod-before";
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

const benchFn = casesList.map(({ name, size, value }) => {
  const listData = createList(size, value);
  const res1 = JBOD.createContentWriter(listData);
  // const res2 = B_JBOD.createContentWriter(listData);
  let buf = new Uint8Array(res1.byteLength);
  return {
    name,
    JBOD: () => {
      const res1 = JBOD.createContentWriter(listData);
      res1.encodeTo(buf, 0);
    },
    B_JBOD: () => {
      const res2 = B_JBOD.createContentWriter(listData);
      res2.encodeTo(buf, 0);
    },
  };
});
benchFn.map(({ B_JBOD, JBOD, name }) => {
  Deno.bench("Current", { group: name }, JBOD);
  Deno.bench("Before", { group: name }, B_JBOD);
});
