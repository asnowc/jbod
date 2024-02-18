// @deno-types="https://esm.sh/jbod@0.4"
import { StructTrans } from "jbod";
import { objData, createList } from "./__mocks__/compare.cases.ts";
import * as protobuf from "./protobuf.ts";
import * as JSON from "./json.ts";

const listData = createList(1000, objData);
const protoBufType = protobuf.defined.lookupType("object");
const jbodStruct = StructTrans.define({ disabled: 1, count: 2, name: 3, dataStamp: 4, id: 5 });
function jbodEncode(struct: StructTrans, data: any[]) {
  let len = 0;
  let pre: any[] = [];
  for (let i = 0; i < data.length; i++) {
    let res = struct.byteLength(data[i]);
    len += res.byteLength;
    pre[i] = res;
  }
  const buf = new Uint8Array(len);
  let offset = 0;
  for (let i = 0; i < data.length; i++) {
    offset = struct.encodeInto(pre[i], buf, offset);
  }
  return buf;
}
function jbodDecode(struct: StructTrans, buf: Uint8Array, offset = 0) {
  let arr: any = [];
  let i = 0;
  let max = buf.byteLength;
  do {
    let res = struct.decode(buf, offset);
    offset = res.offset;
    arr[i++] = res.data;
  } while (offset < max);
  return arr;
}

function benchEncode() {
  Deno.bench("JSON", { group: "Encode" }, () => {
    JSON.encode(listData);
  });
  Deno.bench("JBOD", { group: "Encode" }, () => {
    jbodEncode(jbodStruct, listData);
  });
  Deno.bench("ProtoBuf", { group: "Encode" }, () => {
    protobuf.encodeArray(listData, protoBufType);
  });
}

function benchDecode() {
  let d1 = JSON.encode(listData);
  let d2 = jbodEncode(jbodStruct, listData);
  let d3 = protobuf.encodeArray(listData, protoBufType);
  Deno.bench("JSON", { group: "Decode" }, () => {
    JSON.decode(d1);
  });
  Deno.bench("JBOD", { group: "Decode" }, () => {
    jbodDecode(jbodStruct, d2);
  });
  Deno.bench("ProtoBuf", { group: "Decode" }, () => {
    protobuf.decode(d3, protoBufType);
  });
}
benchEncode();
benchDecode();
