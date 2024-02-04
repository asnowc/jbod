// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
import B_JBOD from "npm:jbod@0.2.0";
import { cases, createList, strMap } from "../__mocks__/compare.cases.ts";

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

{
  const u8Arr = JBOD.binaryify(strMap.data);
  const group = "Encode string map * " + strMap.size;
  Deno.bench("Current" + strMap.size, { group }, () => {
    JBOD.parse(u8Arr);
  });
  Deno.bench("Before" + strMap.size, { group }, () => {
    B_JBOD.parse(u8Arr);
  });
}
