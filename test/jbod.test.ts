import { DataType, JBOD, toArrayJBOD, toArrayItemJBOD, toMapJBOD, JbodScanItem, UnsupportedDataTypeError } from "jbod";
import { baseDataTypes, unsupportedData } from "./__mocks__/data_type.cases.js";
import "./expects/expect.js";
import { describe, it, expect, test } from "vitest";
const mapCases: Record<string, any> = {
  0: { a: 1, b: 2, c: 3 },
  1: { a: false, b: [1, "a", null] }, // [4, 1,97, ] [13,1,98,[5,0,0,0,1, 10,1,97, 1, 0], 0]
  2: { a: false, b: { a: 9, b: null } },
};

describe("同步转换器", function () {
  describe("toArrayItemJBSON", function () {
    describe.each(Object.entries(baseDataTypes))("%s", function (type, cases) {
      test.each(cases as any[])("%s", function (data) {
        const buf = toArrayItemJBOD(data);
        const [transData, offset] = JBOD.toArrayItem(buf);
        expect(transData).jbodEqual(data);
        expect(offset).toBe(buf.byteLength);
      });
    });
  });
  describe("toArrayJBSON", function () {
    test.each(Object.entries(baseDataTypes))("%s", function (key, cases) {
      const buffer = toArrayJBOD(cases);
      const map = JBOD.toArray(buffer);
      expect(map).isJbodArray(cases);
    });
  });
  test("toMapJBSON", function () {
    const buffer = toMapJBOD(baseDataTypes);
    const map = JBOD.toMap(buffer);
    expect(map).isJbodMap(baseDataTypes as any);
  });
  test("不支持的数据类型", function () {
    expect(() => toArrayItemJBOD(unsupportedData.function[0])).toThrowError(UnsupportedDataTypeError);
  });
});
describe("异步转换器", function () {
  describe("JBSON.readItem", function () {
    describe.each(Object.entries(baseDataTypes))("%s", function (type, cases) {
      test.each(cases as any[])("%s", async function (data) {
        const reader = createFixedStreamReader(toArrayItemJBOD(data));
        const array = await JBOD.readItem(reader);
        expect(array).jbodEqual(data);
      });
    });
  });
  describe("readArray", function () {
    it.each(Object.entries(baseDataTypes))("%s", async function (type, cases) {
      const reader = createFixedStreamReader(toArrayJBOD(cases));

      const array = await JBOD.readArray(reader);
      expect(array).isJbodArray(cases);
    });
  });
  test("readMap", async function () {
    const reader = createFixedStreamReader(toMapJBOD(baseDataTypes));

    const array = await JBOD.readMap(reader);
    expect(array).isJbodMap(baseDataTypes);
  });
});
describe("异步迭代", function () {
  describe("scanArray", function () {
    it.each(Object.entries(baseDataTypes))("%s", async function (type, cases) {
      const reader = createFixedStreamReader(toArrayJBOD(cases));

      const array = await asyncIteratorToArray(JBOD.scanArray(reader), []);
      expect(array).isJbodArray(cases);
    });
  });
  test("scanMap", async function () {
    const reader = createFixedStreamReader(toMapJBOD(baseDataTypes));

    const map = await asyncIteratorToArray(JBOD.scanMap(reader), {});
    expect(map).isJbodMap(baseDataTypes);
  });
});

/** 固定 Buffer 的 StreamReader*/
function createFixedStreamReader(buffer: Uint8Array) {
  let offset = 0;
  return async function streamReader(size: number) {
    let end = offset + size;
    if (end > buffer.length) throw new Error("out of range");
    let buf = buffer.subarray(offset, end);
    offset = end;
    return buf;
  };
}
async function asyncIteratorToArray<T extends Record<number | string, any>>(
  itr: AsyncIterable<JbodScanItem>,
  obj: T
): Promise<T> {
  for await (const res of itr) {
    const item = res;
    let value = item.value;
    if (item.isIterator) value = await asyncIteratorToArray(item.value, item.dataType === DataType.array ? [] : {});
    (obj as any)[item.key] = value;
  }
  return obj;
}
