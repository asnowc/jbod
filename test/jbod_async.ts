import JBOD from "jbod";
import { baseDataTypes, compoundTypes } from "./__mocks__/data_type.cases.js";
import "./expects/expect.js";
import { describe, expect, test } from "vitest";

describe.skip("parseAsync", function () {
  describe.each(Object.entries({ ...baseDataTypes, ...compoundTypes }))("%s", function (type, cases) {
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
