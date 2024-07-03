import JBOD, { StructCodec } from "jbod";
import { Buffer } from "node:buffer";
import { formatSize } from "./util/mod.ts";
function encodeJSON(data: any) {
  return Buffer.from(JSON.stringify(data));
}
export const objData = {
  disabled: false,
  count: 100837,
  name: "Documentation",
  dataStamp: 4 / 7,
  id: 876,
};

const anyStruct = StructCodec.define({ disabled: 1, count: 2, name: 3, dataStamp: 4, id: 5 });
const fixedStruct = StructCodec.define({
  disabled: { id: 1, type: "bool" },
  count: { id: 2, type: "dyI32" },
  name: { id: 3, type: "string" },
  dataStamp: { id: 4, type: "f64" },
  id: { id: 5, type: "dyI32" },
});

console.log(encodeJSON(objData).byteLength); // 96
console.log(JBOD.encode(objData).byteLength); // 67
console.log(anyStruct.encode(objData).byteLength); // 38
console.log(fixedStruct.encode(objData).byteLength); // 34

console.table(
  formatSize([
    { name: "JSON", size: encodeJSON(objData).byteLength },
    { name: "JBOD", size: JBOD.encode(objData).byteLength },
    { name: "JBOD:Struct any", size: anyStruct.encode(objData).byteLength },
    { name: "JBOD:Struct", size: fixedStruct.encode(objData).byteLength },
  ])
);
