import { Buffer } from "node:buffer";
export const objData = {
  disabled: false,
  count: 100837,
  name: "Documentation",
  dataStamp: 4 / 7,
  id: 876,
};
export const strMap = { data: createMap(1024 * 1024, "中文123abcde24", 1), size: 1024 * 100 };
export const cases = [
  { name: "number:8", size: 1000, value: 8, protobufGetter: "i32" },
  { name: "number:-12345567", size: 1000, value: -12345567, protobufGetter: "i32" },
  { name: "number_0x1fffff", size: 1000, value: 0x1fffff, protobufGetter: "i32" },
  { name: "double", size: 1000, value: 4 / 7, protobufGetter: "f64" },
  { name: "boolean", size: 10000, value: true, protobufGetter: "bool" },
  { name: "string", size: 1000, value: "中文abc".repeat(10), protobufGetter: "string" },
  {
    name: "object list",
    size: 1000,
    value: objData,
    protobufGetter: "object",
  },
];
export function createMap(branch: number, value: any, deep: number = 1, obj: Record<string, any> = {}) {
  if (deep <= 0) return obj;
  for (let i = 0; i < branch; i++) {
    obj["key" + i] = deep - 1 === 0 ? value : createMap(branch, value, deep - 1);
  }
  return obj;
}
export function createList(branch: number, value: any, deep: number = 1, obj: any = []) {
  if (deep <= 0) return obj;
  for (let i = 0; i < branch; i++) {
    obj[i] = deep - 1 === 0 ? value : createList(branch, value, deep - 1);
  }
  return obj;
}

export function linerList(length: number, distance: number, start = 0) {
  let arr: number[] = [];
  for (let i = 0; i < length; i++) {
    arr[i] = start;
    start += distance;
  }
  return arr;
}
function randomChar() {
  return Math.floor(Math.random() * 0x9fa5) + 0x4e00;
}
/** 创建一个指定长度的随机的中文 Uint8Array */
export function createUtf8Buf(size: number) {
  let str = "";
  for (let i = 0, max = Math.floor(size / 3); i < max; i++) {
    let code = randomChar();
    str += String.fromCharCode(code);
  }
  const buf = Buffer.from(str);
  return new Uint8Array(buf);
}
