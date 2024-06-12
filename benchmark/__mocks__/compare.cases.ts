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
  { name: "int32: 8", size: 10000, value: 8, protobufGetter: "i32" },
  { name: "int32: -12345567", size: 10000, value: -12345567, protobufGetter: "i32" },
  { name: "double", size: 10000, value: 4 / 7, protobufGetter: "f64" },
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

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

/** 创建一个指定字节长度的随机 uft8 编码的 Uint8Array */
export function createUtf8Buf(size: number, codePointMin: number = 0, codePointMax: number = 0xffff) {
  const str = createStr(size, codePointMax, codePointMin);
  const buf = Buffer.from(str);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
/** 创建一个指定字节长度的随机字符串 */
export function createStr(byteSize: number, codePointMin: number = 0, codePointMax: number = 0xffff) {
  const chunk = new Array(4095);
  let offset = 0;
  const strList: string[] = [];
  for (let i = 0, max = Math.floor(byteSize / 3); i < max; i++) {
    chunk[offset++] = randomInt(codePointMin, codePointMax);
    if (offset === chunk.length) {
      strList.push(String.fromCodePoint.apply(String, chunk));
      offset = 0;
    }
  }
  if (offset > 0) strList.push(String.fromCodePoint.apply(String, chunk.slice(0, offset)));

  return strList.join("");
}
