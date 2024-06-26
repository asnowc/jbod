import { createList } from "./__mocks__/compare.cases.ts";
import JBOD from "jbod";
import * as JSON from "./lib/json.ts";
import { cases } from "./__mocks__/compare.cases.ts";
import * as protobuf from "./lib/protobuf.ts";
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
