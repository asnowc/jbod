import JBOD, { DataType, varints } from "jbod";
import { baseDataTypes, compoundTypes, unsupportedData } from "./__mocks__/data_type.cases.ts";
import "./expects/expect.ts";
import { describe, expect, test } from "vitest";

describe("encode", function () {
  test("anyRecord", function () {
    const data = { a: 1, b: 2, c: 3 };
    const buf = JBOD.encode(data);

    const k1 = [DataType.dyI32, 1, 97, varints.zigzagEncodeI32(1)];
    const k2 = [DataType.dyI32, 1, 98, varints.zigzagEncodeI32(2)];
    const k3 = [DataType.dyI32, 1, 99, varints.zigzagEncodeI32(3)];
    expect(Buffer.from(buf)).toEqual(Buffer.from([DataType.anyRecord, ...k1, ...k2, ...k3, 0]));
  });
  test("anyArray", function () {
    const data = [1, "a", null];
    const buf = JBOD.encode(data);

    const v1 = [DataType.dyI32, varints.zigzagEncodeI32(1)];
    const v2 = [DataType.string, 1, 97];
    const v3 = [DataType.null];
    expect(Buffer.from(buf)).toEqual(Buffer.from([DataType.anyArray, ...v1, ...v2, ...v3, 0]));
  });
  test("doubleArray", function () {
    const data: number[] = [1 / 3, 1 / 3, 1 / 3];
    const buf = JBOD.encode(data);
    expect(buf.byteLength).toBe(1 + 9 * data.length + 1);
    expect(JBOD.decode(buf).data).toEqual(data);
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
    const res = JBOD.createWriter(data);
    const buf = new Uint8Array(res.byteLength + 4);
    res.encodeTo(buf, 4);
    expect(JBOD.decode(buf, 4).data).toEqual(data);
  });
});

/** 测试编码后再解码，确定数据正确性 */
describe("encode-decode", function () {
  describe.each(Object.entries({ ...baseDataTypes, ...compoundTypes }))("%s", function (type, cases) {
    test.each(cases as any[])("%s", function (data) {
      const buf = JBOD.encode(data);
      const { data: decodedData, offset } = JBOD.decode(buf);
      expect(decodedData).jbodEqual(data);
      expect(offset).toBe(buf.byteLength);
    });
  });
  test("array-string", function () {
    const data = ["ab", "cd", "ef", "gh"]; // 1+2+12
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

describe("不支持的数据类型", function () {
  //todo: function 待支持
  const fn = unsupportedData.function[0];
  test("function", function () {
    const u8Arr = JBOD.encode(fn);
    const data = JBOD.decode(u8Arr).data;
    expect(data).toBe(null);
  });
  test("function array", function () {
    const u8Arr = JBOD.encode([fn, fn]);
    const data = JBOD.decode(u8Arr).data;
    expect(data).toEqual([null, null]);
  });
});
