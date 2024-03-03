import { DataType, StructTrans, FieldType } from "jbod";
import { describe, expect, test } from "vitest";
import { formatBin } from "./utils/mod.js";
const s1 = StructTrans.define<{ f1: boolean; f2: number; f3: any }>(
  {
    f1: { id: 1, type: FieldType.bool },
    f2: { id: 2, type: FieldType.i32 },
    f3: 3,
  },
  { required: true }
);
describe("encode", function () {
  test("基础", function () {
    const u8Arr = s1.encode({ f1: true, f2: 9, f3: "ab" });
    expect(formatBin(u8Arr), "decode").toBe(`01030200000009030a02616200`);
  });

  test("字段缺失", function () {
    expect(() => s1.encode({ f1: true, f2: 9n } as any)).toThrowError();
  });
  test("可选类型", function () {
    const s1 = StructTrans.define<Partial<{ f1: boolean; f2: number; f3: any }>>({
      f1: { id: 1, type: FieldType.bool },
      f2: { id: 2, type: FieldType.i32 },
      f3: 3,
    });
    const u8Arr = s1.encode({ f2: 9 });
    expect(formatBin(u8Arr)).toBe(`020000000900`);
  });
});
describe("decode", function () {
  const optionalStruct = StructTrans.define<Partial<{ f1: boolean; f2: number; f3: any }>>({
    f1: { id: 1, type: FieldType.bool },
    f2: { id: 2, type: FieldType.i32 },
    f3: 3,
  });
  test("基础", function () {
    const data = { f1: true, f2: 9, f3: "ab" };
    const u8Arr = s1.encode(data);
    expect(s1.decode(u8Arr).data).toEqual(data);
  });
  test("可选类型", function () {
    const data = { f2: 9 };
    const u8Arr = optionalStruct.encode(data);
    expect(optionalStruct.decode(u8Arr).data).toEqual(data);
  });
  test("false", function () {
    const data = { f1: false, f2: 9, f3: "ab" };
    const u8Arr = optionalStruct.encode(data);
    expect(optionalStruct.decode(u8Arr).data).toEqual(data);
  });
});
