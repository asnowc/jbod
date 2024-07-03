import JBOD, { StructCodec } from "jbod";
import { Buffer } from "node:buffer";
import { formatSize } from "./util/mod.ts";
function encodeJSON(data: any) {
  return Buffer.from(JSON.stringify(data));
}
export const objData = {
  arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

const anyStruct = StructCodec.define({ arr: { id: 1, repeat: true } });
const fixedStruct = StructCodec.define({ arr: { id: 1, repeat: true, type: "dyI32" } });

const jsonSize = encodeJSON(objData).byteLength;
const res: { name: string; size: number; present?: string }[] = [
  {
    name: "JSON",
    size: jsonSize,
  },
  {
    name: "JBOD",
    size: JBOD.encode(objData).byteLength,
  },
  {
    name: "JBOD:Struct any",
    size: anyStruct.encode(objData).byteLength,
  },
  {
    name: "JBOD:Struct",
    size: fixedStruct.encode(objData).byteLength,
  },
];
console.table(formatSize(res));
console.log(anyStruct.encode(objData));
console.log(fixedStruct.encode(objData));
