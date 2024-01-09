import JBOD, { DataType, JbodAsyncIteratorItem, UnsupportedDataTypeError, JbodError } from "jbod";
import { baseDataTypes, unsupportedData } from "./__mocks__/data_type.cases.js";
import "./expects/expect.js";
import { describe, expect, test } from "vitest";

describe("paseSync", function () {
  describe.each(Object.entries(baseDataTypes))("%s", function (type, cases) {
    test.each(cases as any[])("%s", function (data) {
      const buf = JBOD.binaryify(data);
      const { data: transData, offset } = JBOD.pase(buf);
      expect(transData).jbodEqual(data);
      expect(offset).toBe(buf.byteLength);
    });
  });
});

test("不支持的数据类型", function () {
  expect(() => JBOD.binaryify(unsupportedData.function[0])).toThrowError(UnsupportedDataTypeError);
});
describe("pase", function () {
  describe.each(Object.entries(baseDataTypes))("%s", function (type, cases) {
    test.each(cases as any[])("%s", async function (data) {
      const reader = createFixedStreamReader(JBOD.binaryify(data));
      const array = await JBOD.paseAsync(reader);
      expect(array).jbodEqual(data);
    });
  });
});
describe("iterator", function () {
  describe.each(Object.entries(baseDataTypes))("%s", async function (type, cases) {
    test.each(cases as any[])("%s", async function (data) {
      const reader = createFixedStreamReader(JBOD.binaryify(data));
      const expectPath = createIteratorPath(data, []);
      const expectKeyPath = expectPath.map((item) => item.key);

      const array = await recordIteratorPath(JBOD.scanAsync(reader), []);
      const actualKeyPath = array.map((item) => item.key);
      expect(actualKeyPath).toEqual(expectKeyPath);
      expect(array).toEqual(expectPath);
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
/** 记录迭代器路径数据 */
async function recordIteratorPath(
  iterable: AsyncIterable<JbodAsyncIteratorItem>,
  path: IteratorPathItem[]
): Promise<IteratorPathItem[]> {
  const itr = iterable[Symbol.asyncIterator]();
  let res = await itr.next();
  while (!res.done) {
    const item = res.value;

    const mockValue = toMockValue(item.value);
    if (item.isIterator) {
      await recordIteratorPath(item.value, path);
    } else {
      path.push({
        isEnd: false,
        dataType: DataType[item.dataType],
        key: item.key,
        value: mockValue,
      });
    }

    res = await itr.next();
  }
  path.push({ isEnd: true, dataType: DataType[JBOD.getType(res.value)] });

  return path;
}
type IteratorPathItem =
  | {
      isEnd: false;
      dataType: string;
      key?: number | string;
      value: any;
    }
  | {
      isEnd: true;
      key?: number | string;
      dataType: string;
    };
/** 生成迭代器路径数据 */
function createIteratorPath(data: any, path: IteratorPathItem[], key?: string | number): IteratorPathItem[] {
  const value = toMockValue(data);
  if (value !== Null) {
    if (key === undefined) path.push({ isEnd: true, dataType: DataType[JBOD.getType(data)] });
    else path.push({ isEnd: false, dataType: DataType[JBOD.getType(data)], value, key });
    return path;
  }
  if (data instanceof Array) {
    for (let i = 0; i < data.length; i++) {
      createIteratorPath(data[i], path, i);
    }
    path.push({ isEnd: true, dataType: DataType[DataType.array] });
  } else {
    for (const [key, value] of Object.entries(data)) {
      createIteratorPath(value, path, key);
    }
    path.push({ isEnd: true, dataType: DataType[DataType.map] });
  }
  return path;
}
function toMockValue(data: any): any {
  const type = typeof data;
  if (type !== "object" || data === null) {
    return type === "symbol" ? "symbol" : data;
  }

  if (data instanceof Error || data instanceof RegExp || data instanceof ArrayBuffer) {
    let valueName = data instanceof Error ? JbodError.name : data.constructor.name;
    return valueName;
  }
  return Null;
}
const Null = Symbol("null");
