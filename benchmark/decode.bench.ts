import { createList } from "./__mocks__/compare.cases.ts";
// @deno-types="npm:jbod@0.2.1"
import JBOD from "jbod";
import { cases } from "./__mocks__/compare.cases.ts";
import * as JSON from "./json.ts";

function toStr(data: any) {
  return {
    jbodU8Arr: JBOD.binaryify(data),
    jsonU8Arr: JSON.encode(data),
  };
}
cases
  .map(({ size, value, name, protobufGetter }) => {
    const data = toStr(createList(size, value));
    return {
      JBOD() {
        JBOD.parse(data.jbodU8Arr);
      },
      JSON() {
        JSON.decode(data.jsonU8Arr);
      },
      name,
      size,
    };
  })
  .forEach(({ JBOD, JSON, name, size }) => {
    Deno.bench("JBOD", { group: `${name} * ${size}` }, JBOD);
    Deno.bench("JSON", { group: `${name} * ${size}` }, JSON);
  });
