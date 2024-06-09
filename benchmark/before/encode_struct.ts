import { StructCodec } from "jbod";
// @deno-types="jbod"
import { StructCodec as B_StructCodec } from "jbod-before";
import { objData, createList } from "../__mocks__/compare.cases.ts";

const listData = createList(500, objData);
const defined: any = {
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
};
const currentStruct = StructCodec.define(defined);
const beforeStruct = B_StructCodec.define(defined);

function benchEncode() {
  const len = currentStruct.createWriter({ key: listData }).byteLength;
  const u8Arr = new Uint8Array(len);
  Deno.bench("current", { group: "Encode" }, () => {
    const writer = currentStruct.createWriter({ key: listData });
    writer.encodeTo(u8Arr, 0);
  });
  Deno.bench("before", { group: "Encode" }, () => {
    const writer = beforeStruct.createWriter({ key: listData });
    writer.encodeTo(u8Arr, 0);
  });
}

function benchDecode() {
  const c_arr = currentStruct.encode({ key: listData });
  const b_arr = beforeStruct.encode({ key: listData });
  Deno.bench("current", { group: "Decode" }, () => {
    currentStruct.decode(c_arr);
  });
  Deno.bench("before", { group: "Decode" }, () => {
    beforeStruct.decode(b_arr);
  });
}
benchEncode();
benchDecode();
