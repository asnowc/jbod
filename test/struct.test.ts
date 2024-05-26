import { StructTrans } from "jbod";
import { describe, expect, test } from "vitest";
import { formatBin } from "./utils/mod.ts";
const s1 = StructTrans.define<{ f1: boolean; f2: number; f3: any }>(
  {
    f1: { id: 1, type: "bool" },
    f2: { id: 2, type: "i32" },
    f3: 3,
  },
  { required: true }
);
describe("encode", function () {
  test("基础", function () {
    const u8Arr = s1.encode({ f1: true, f2: 9, f3: "ab" });
    expect(formatBin(u8Arr), "decode").toBe("0103" + "0200000009" + "030a026162" + "00");
  });
  test("repeat", function () {
    const s1 = StructTrans.define(
      {
        f1: { id: 1, type: "bool", repeat: true },
        f2: { id: 2, type: "any", repeat: true },
        f3: { id: 3, type: "i32", repeat: true },
      },
      { required: true }
    );
    const u8Arr = s1.encode({
      f1: [true, false], // type repeat
      f2: [1, true], // any repeat
      f3: [], // any repeat
    });
    expect(formatBin(u8Arr), "decode").toBe("01020304" + "0202070203" + "0300" + "00");
  });
  test("字段缺失", function () {
    expect(() => s1.encode({ f1: true, f2: 9n } as any)).toThrowError();
  });
  test("可选类型", function () {
    const s1 = StructTrans.define<Partial<{ f1: boolean; f2: number; f3: any }>>({
      f1: { id: 1, type: "bool" },
      f2: { id: 2, type: "i32" },
      f3: 3,
    });
    const u8Arr = s1.encode({ f2: 9 });
    expect(formatBin(u8Arr)).toBe(`020000000900`);
  });
});
describe("decode", function () {
  const optionalStruct = StructTrans.define<Partial<{ f1: boolean; f2: number; f3: any }>>({
    f1: { id: 1, type: "bool" },
    f2: { id: 2, type: "i32" },
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
  test("嵌套", function () {
    const optionalStruct = StructTrans.define<Partial<{ f1: number; f2: { c1: number; c2: number } }>>({
      f1: 1,
      f2: { id: 2, type: { c1: 1, c2: 2 } },
    });
    const raw = { f1: 8, f2: { c1: 9, c2: -1 } };
    const buf = optionalStruct.encode(raw);
    const res = optionalStruct.decode(buf);
    expect(res.data).toEqual(raw);
  });
  test("repeat", function () {
    const struct = StructTrans.define({
      i32: { repeat: true, type: "i32", id: 1 },
      bool: { repeat: true, id: 2 },
      void: { id: 3, repeat: true },
      struct: {
        id: 4,
        type: {
          k2: 1,
        },
        repeat: true,
      },
    });
    const raw = { i32: [1, 2, 3], bool: [true, false], struct: [{ k2: 0.2 }] };
    const u8Arr = struct.encode(raw);
    const data = struct.decode(u8Arr);
    expect(data.data).toEqual(raw);
  });
});
