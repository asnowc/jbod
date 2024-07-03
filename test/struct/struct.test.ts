import { StructCodec, Struct } from "jbod";
import { describe, expect, test } from "vitest";
import { formatBin } from "../utils/mod.ts";

describe("编解码", function () {
  test("基础", function () {
    const s1 = StructCodec.define<{ f1: boolean; f2: number; f3: any }>({
      f1: { id: 1, type: "bool" },
      f2: { id: 2, type: "i32" },
      f3: 3,
    });
    const data = { f1: true, f2: 9, f3: "ab" };

    const u8Arr = s1.encode(data);
    expect(s1.decode(u8Arr)).toEqual({ data, offset: u8Arr.byteLength });
    expect(formatBin(u8Arr), "decode").toMatchSnapshot(); // 01(03) 02(00000009) 03(0a026162) 00
  });
  test("sample repeat", function () {
    const struct = StructCodec.define({
      f1: { id: 1, repeat: true, type: "dyI32" },
      f2: { id: 2, repeat: true },
    });
    const raw = { f1: [1, 2, 3], f2: [1, true] };
    const bin = struct.encode(raw);

    expect(struct.decode(bin)).toEqual({ data: raw, offset: bin.byteLength });
    expect(formatBin(bin), "decode").toMatchSnapshot(); // 01(03020406) 02(02070203) 00
  });
  test("struct repeat", function () {
    const arrItem = {
      k2: {
        id: 1,
        type: "dyI32",
      },
    } satisfies Struct;
    const struct = StructCodec.define({
      f1: {
        id: 4,
        repeat: true,
        type: arrItem,
      },
    });
    const raw = { f1: [{ k2: 10 }, { k2: 6 }] };
    const bin = struct.encode(raw);

    /* 
    f1: 04(02 011400 010c00) 00
    f1[0]: 01 14 00
    f1[2]: 01 0c 00
    */
    expect(formatBin(bin), "decode").toMatchSnapshot();
    expect(struct.decode(bin)).toEqual({ data: raw, offset: bin.byteLength });
    expect(formatBin(bin), "decode").toMatchSnapshot();
  });

  test("boolean", function () {
    const optionalStruct = StructCodec.define<Partial<{ f1: boolean; f2: boolean }>>({
      f1: { id: 1, type: "bool" },
      f2: { id: 2, type: "bool" },
    });
    const data = { f1: false, f2: true };
    const u8Arr = optionalStruct.encode(data);
    expect(optionalStruct.decode(u8Arr)).toEqual({ data, offset: u8Arr.byteLength });

    expect(formatBin(u8Arr)).toMatchSnapshot();
  });
  test("嵌套", function () {
    const optionalStruct = StructCodec.define<Partial<{ f1: number; f2: { c1: number; c2: number } }>>({
      f1: 1,
      f2: { id: 2, type: { c1: 1, c2: 2 } },
    });
    const raw = { f1: 8, f2: { c1: 9, c2: -1 } };
    const u8Arr = optionalStruct.encode(raw);
    expect(optionalStruct.decode(u8Arr)).toEqual({ data: raw, offset: u8Arr.byteLength });

    expect(formatBin(u8Arr)).toMatchSnapshot();
  });
});
describe("可选类型", function () {
  test("可选类型编解码", function () {
    const struct = StructCodec.define<Partial<{ f1: boolean; f2: number; f3: any }>>({
      f1: { id: 1, type: "bool", optional: true },
      f2: { id: 2, type: "i32" },
    });
    const raw = { f2: 9 };
    const u8Arr = struct.encode(raw);
    expect(struct.decode(u8Arr)).toEqual({ data: raw, offset: u8Arr.byteLength });
    expect(formatBin(u8Arr)).toMatchSnapshot();
  });
  test("字段缺失", function () {
    const data = { f1: 2 };
    const s1 = StructCodec.define({ f1: { id: 1, type: "dyI32" }, f2: { id: 2, type: "dyI32" } });
    expect(() => s1.encode(data), "默认不可选").toThrowError();

    const s2 = StructCodec.define({ f1: 1, f2: 2 });
    expect(() => s2.encode(data), "默认不可选").toThrowError();

    const s3 = StructCodec.define({ f1: { id: 1, type: { f2: 2 } } });
    expect(() => s3.encode({ f1: {} }), "默认不可选").toThrowError();
  });
  test("配置默认可选", function () {
    const data = { f1: 2 };

    const s2 = StructCodec.define({ f1: 1, f2: 2 }, { defaultOptional: true });
    expect(() => s2.encode(data), "默认不可选").not.toThrowError();
  });
});
