import { DataType, StructTrans } from "jbod";
import { describe, expect, test } from "vitest";
import { formatBin } from "./utils/mod.js";
describe("encode", function () {
  const s1 = StructTrans.define<{ f1: boolean; f2: number; f3: any }>(
    {
      f1: { id: 1, type: DataType.true },
      f2: { id: 2, type: DataType.i32 },
      f3: 3,
    },
    { required: true }
  );
  test("encode", function () {
    const u8Arr = s1.encode({ f1: true, f2: 9, f3: "ab" });
    expect(formatBin(u8Arr)).toBe(`01010200000009030a02616200`);
  });
  test("字段缺失", function () {
    expect(() => s1.encode({ f1: true, f2: 9n } as any)).toThrowError();
  });
  test("可选类型", function () {
    const s1 = StructTrans.define<Partial<{ f1: boolean; f2: number; f3: any }>>({
      f1: { id: 1, type: DataType.true },
      f2: { id: 2, type: DataType.i32 },
      f3: 3,
    });
    const u8Arr = s1.encode({ f2: 9 });
    expect(formatBin(u8Arr)).toBe(`020000000900`);
  });
});
