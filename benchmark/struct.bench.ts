import { StructTrans } from "jbod";
import { objData, createList } from "./__mocks__/compare.cases.ts";
import * as protobuf from "./lib/protobuf.ts";
import * as JSON from "./lib/json.ts";

const listData = createList(1000, objData);
const protoBufType = protobuf.defined.lookupType("object");

const jbodStruct = StructTrans.define({
  key: {
    type: {
      disabled: 1,
      count: 2,
      name: 3,
      dataStamp: 4,
      id: 5,
    },
    id: 1,
    repeat: true,
  },
} as any);

function benchEncode() {
  Deno.bench("JBOD", { group: "Encode" }, () => {
    jbodStruct.encode({ key: listData });
  });
  Deno.bench("JSON", { group: "Encode" }, () => {
    JSON.encode(listData);
  });
  Deno.bench("ProtoBuf", { group: "Encode" }, () => {
    protobuf.encodeArray(listData, protoBufType);
  });
}

function benchDecode() {
  let d1 = JSON.encode(listData);
  let d2 = jbodStruct.encode({ key: listData });
  let d3 = protobuf.encodeArray(listData, protoBufType);
  Deno.bench("JBOD", { group: "Decode" }, () => {
    jbodStruct.decode(d2);
  });
  Deno.bench("JSON", { group: "Decode" }, () => {
    JSON.decode(d1);
  });
  Deno.bench("ProtoBuf", { group: "Decode" }, () => {
    protobuf.decode(d3, protoBufType);
  });
}
benchEncode();
benchDecode();
