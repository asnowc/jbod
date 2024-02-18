import JBOD, { DataType, UnsupportedDataTypeError } from "jbod";
import { baseDataTypes, compoundTypes, unsupportedData } from "./__mocks__/data_type.cases.js";
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
  describe.each(Object.entries({ ...baseDataTypes, ...compoundTypes }))("%s", function (type, cases) {
    test.each(cases as any[])("%s", function (data) {
      const buf = JBOD.encode(data);
      const { data: transData, offset } = JBOD.decode(buf);
      expect(transData).jbodEqual(data);
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

test("不支持的数据类型", function () {
  expect(() => JBOD.encode(unsupportedData.function[0])).toThrowError(UnsupportedDataTypeError);
});
