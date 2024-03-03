// @deno-types="https://esm.sh/jbod@0.4"
import JBOD from "jbod";
// @deno-types="https://esm.sh/jbod@0.4"
import B_JBOD from "../dist/before.js";
import { cases, createList } from "../__mocks__/compare.cases.ts";
const benchFn = cases.map(({ name, size, value }) => {
  const listData = createList(size, value);

  let buf = new Uint8Array(B_JBOD.byteLength(listData).byteLength * 2);
  return {
    name,
    JBOD: () => {
      // @ts-ignore xx
      const enco = JBOD.createEncoder(listData);
      enco.encodeTo(buf, 0);
    },
    B_JBOD: () => {
      // @ts-ignore xx
      // const enco = B_JBOD.createEncoder(listData);
      // let buf = new Uint8Array(enco.byteLength + 1);
      // enco.encodeTo(buf, 1);
      // buf[0] = enco.type;
      const pre = B_JBOD.byteLength(listData);
      B_JBOD.encodeContentInto(pre, buf, 0);
      // B_JBOD.encode(listData);
    },
  };
});
benchFn.map(({ B_JBOD, JBOD, name }) => {
  Deno.bench("Current", { group: name }, JBOD);
  Deno.bench("Before", { group: name }, B_JBOD);
});
