import { createList } from "./__mocks__/compare.cases.ts";
// @deno-types="npm:jbod@0.3"
import JBOD from "jbod";
import * as JSON from "./json.ts";
import { cases } from "./__mocks__/compare.cases.ts";
import * as protobuf from "./protobuf.ts";
cases
  .map((item) => {
    const listData = createList(item.size, item.value);
    const protoBufType = protobuf.defined.lookupType(item.protobufGetter);
    return {
      JSON() {
        JSON.encode(listData);
      },
      JBOD() {
        JBOD.encode(listData);
      },
      ProtoBuf() {
        protobuf.encodeArray(listData, protoBufType);
      },
      name: item.name,
      size: item.size,
    };
  })
  .forEach(({ JBOD, JSON, ProtoBuf, name }) => {
    Deno.bench("JBOD", { group: name }, JBOD);
    Deno.bench("JSON", { group: name }, JSON);
    Deno.bench("ProtoBuf", { group: name }, ProtoBuf);
  });
