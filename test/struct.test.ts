import { DataType, StructEncoder } from "jbod";
import { describe, expect, test } from "vitest";
import { formatBin } from "./utils/mod.js";
describe("encode", function () {
  const s1 = StructEncoder.define<{ f1: boolean; f2: bigint; f3: any }>({
    f1: { id: 1, type: DataType.true },
    f2: { id: 2, type: DataType.i64 },
    f3: 3,
  });
  test("encode", function () {
    const u8Arr = s1.encode({ f1: true, f2: 9n, f3: "ab" });
    expect(formatBin(u8Arr)).toBe(`010102000000000000000903026162`);
  });
  test("类型不一致", function () {
    expect(() => s1.encode({ f1: true, f2: "", f3: "ab" } as any)).toThrowError();
  });
  test("字段缺失", function () {
    expect(() => s1.encode({ f1: true, f2: 9n } as any)).toThrowError();
  });
});
