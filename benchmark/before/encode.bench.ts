// @deno-types="https://esm.sh/jbod@0.4.x"
import { JbodTrans } from "jbod";
// @deno-types="https://esm.sh/jbod@0.4.x"
import { JbodTrans as BJbodTrans } from "../dist/before.js";
import { cases, createList } from "../__mocks__/compare.cases.ts";
const JBOD = new JbodTrans();
const B_JBOD = new BJbodTrans();
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
  // @ts-ignore xx
  const res1 = JBOD.createContentWriter(listData);
  // @ts-ignore xx
  // const res2 = B_JBOD.createContentEncoder(listData);
  const res2 = B_JBOD.byteLength(listData);

  let buf = new Uint8Array(res1.byteLength);
  return {
    name,
    JBOD: () => {
      // @ts-ignore xx
      const res1 = JBOD.createContentWriter(listData);
      res1.encodeTo(buf, 0);
    },
    B_JBOD: () => {
      // @ts-ignore xx
      // const res2 = B_JBOD.createContentEncoder(listData);
      //res1.encodeTo(buf, 0);
      const res2 = B_JBOD.byteLength(listData);
      B_JBOD.encodeContentInto(res2, buf, 0);
    },
  };
});
benchFn.map(({ B_JBOD, JBOD, name }) => {
  Deno.bench("Current", { group: name }, JBOD);
  Deno.bench("Before", { group: name }, B_JBOD);
});
