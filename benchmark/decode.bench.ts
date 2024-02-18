import { createList } from "./__mocks__/compare.cases.ts";
// @deno-types="https://esm.sh/jbod@0.4"
import JBOD from "jbod";
import { cases } from "./__mocks__/compare.cases.ts";
import * as JSON from "./json.ts";
import * as protobuf from "./protobuf.ts";

cases
  .map(({ size, value, name, protobufGetter }) => {
    const data = createList(size, value);
    const jbodU8Arr = JBOD.encode(data);
    const jsonU8Arr = JSON.encode(data);
    const protobufType = protobuf.defined.lookupType(protobufGetter);
    const protobufU8Arr = protobuf.encodeArray(data, protobufType);

    return {
      JBOD() {
        JBOD.decode(jbodU8Arr);
      },
      JSON() {
        JSON.decode(jsonU8Arr);
      },
      ProtoBuf() {
        protobuf.decode(protobufU8Arr, protobufType);
      },
      name,
      size,
    };
  })
  .forEach(({ JBOD, JSON, ProtoBuf, name, size }) => {
    Deno.bench("JBOD", { group: `${name} * ${size}` }, JBOD);
    Deno.bench("JSON", { group: `${name} * ${size}` }, JSON);
    Deno.bench("ProtoBuf", { group: `${name} * ${size}` }, ProtoBuf);
  });
