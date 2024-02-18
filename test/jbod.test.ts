import JBOD, { DataType, UnsupportedDataTypeError } from "jbod";
import { baseDataTypes, unsupportedData } from "./__mocks__/data_type.cases.js";
import "./expects/expect.js";
import { describe, expect, test } from "vitest";

describe("encode", function () {
  test("dyRecord", function () {
    const data = { a: 1, b: 2, c: 3 };
    const buf = JBOD.encode(data);

    const k1 = [DataType.i32, 1, 97, 0, 0, 0, 1];
    const k2 = [DataType.i32, 1, 98, 0, 0, 0, 2];
    const k3 = [DataType.i32, 1, 99, 0, 0, 0, 3];
    expect(Buffer.from(buf)).toEqual(Buffer.from([DataType.dyRecord, ...k1, ...k2, ...k3, 0]));
  });
  test("dyArray", function () {
    const data = [1, "a", null];
    const buf = JBOD.encode(data);

    const v1 = [DataType.i32, 0, 0, 0, 1];
    const v2 = [DataType.string, 1, 97];
    const v3 = [DataType.null];
    expect(Buffer.from(buf)).toEqual(Buffer.from([DataType.dyArray, ...v1, ...v2, ...v3, 0]));
  });
});

describe("jbod fn", function () {
  test("encodeContent", function () {
    const data = [1, "a", null];
    const buf = JBOD.encode(data);
    const buf2 = JBOD.encodeContent(data);
    expect(buf2).toEqual(buf.subarray(1));
  });
  test("decode-offset", function () {
    const data = [1, "a", null];
    const res = JBOD.byteLength(data);
    const buf = new Uint8Array(res.byteLength + 4);
    JBOD.encodeInto(res, buf, 4);

    expect(JBOD.decode(buf, 4).data).toEqual(data);
  });
});

describe("encode-pase", function () {
  describe.each(Object.entries(baseDataTypes))("%s", function (type, cases) {
    test.each(cases as any[])("%s", function (data) {
      const buf = JBOD.encode(data);
      const { data: transData, offset } = JBOD.decode(buf);
      expect(transData).jbodEqual(data);
      expect(offset).toBe(buf.byteLength);
    });
  });
  test("array-string", function () {
    const data = ["ab", "cd", "ef", "gh"];
    const buf = JBOD.encode(data);
    const res = JBOD.decode(buf);
    expect(res.data).toEqual(data);
  });
  test("array-int", function () {
    const data = [1, 3, 4, 5, 6, 7];
    const buf = JBOD.encode(data);
    const res = JBOD.decode(buf);
    expect(res.data).toEqual(data);
  });
});

test("不支持的数据类型", function () {
  expect(() => JBOD.encode(unsupportedData.function[0])).toThrowError(UnsupportedDataTypeError);
});
describe.skip("parseAsync", function () {
  describe.each(Object.entries(baseDataTypes))("%s", function (type, cases) {
    test.each(cases as any[])("%s", async function (data) {
      const reader = createFixedStreamReader(JBOD.encode(data));
      const array = await JBOD.parseAsync(reader);
      expect(array).jbodEqual(data);
    });
  });
});
describe.skip("scanAsync", function () {
  const iterableDataType = [
    { data: baseDataTypes.array, type: "array" },
    { data: baseDataTypes.set, type: "set" },
    { data: baseDataTypes.map, type: "map" },
    { data: baseDataTypes.object, type: "object" },
  ];
  describe.each(iterableDataType)("$type", async function ({ data: cases, type }) {
    cases.forEach((data) => {
      test(JSON.stringify(data), async function () {
        const reader = createFixedStreamReader(JBOD.encode(data));
        const expectItems = createIteratorPath(data).value as Map<any, TestItrItem>;
        const expectKeys = Array.from(expectItems.keys());

        const map = await collectIterator(JBOD.scanAsync(reader));
        const actualKeyPath = Array.from(map.keys());
        expect(actualKeyPath).toEqual(expectKeys);
        expect(map).toEqual(expectItems);
      });
    });
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

type TestItrItem = {
  dataType: number;
  value: any;
  isItr: boolean;
};
/** 生成迭代器路径数据 */
function createIteratorPath(data: any): TestItrItem {
  if (typeof data !== "object" || data === null) {
    return { dataType: JBODtoTypeCode(data), isItr: false, value: data };
  }
  const map = new Map<any, TestItrItem>();
  if (data instanceof Array || data instanceof Set) {
    let i = 0;
    for (const item of data) {
      map.set(i++, createIteratorPath(item));
    }
  } else {
    const itr = data instanceof Map ? data : Object.entries(data);
    for (const [key, value] of itr) {
      map.set(key, createIteratorPath(value));
    }
  }

  return {
    dataType: JBODtoTypeCode(data),
    isItr: true,
    value: map,
  };
}
async function collectIterator(
  data: AsyncGenerator<JbodAsyncIteratorItem, void, void>
): Promise<Map<any, TestItrItem>> {
  const path: Map<any, TestItrItem> = new Map();
  for await (const item of data) {
    let value;
    if (!item.isIterator) value = item.value;
    else value = await collectIterator(item.value);
    path.set(item.key, { dataType: item.dataType, isItr: item.isIterator, value });
  }
  return path;
}
