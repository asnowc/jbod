import * as dbn from "../src/core/dynamic_binary_number.js";
import "./expects/expect.js";
import { describe, expect, test } from "vitest";

describe.only("DLD", function () {
  describe("encode", function () {
    const cases: [number | bigint, string][] = [
      [1, "1"],
      [0xff, "11111111_00000001"],
      [0xffff, "11111111_11111111_00000011"],
      [0xffffff, "11111111_11111111_11111111_00000111"],
      [0xffffffff, "11111111_11111111_11111111_11111111_00001111"],
      [0x1_00000000, "10000000_10000000_10000000_10000000_00010000"],
      [0xff_ffffffff, "11111111_11111111_11111111_11111111_11111111_00011111"],
      [0xffff_ffffffff, "11111111_11111111_11111111_11111111_11111111_11111111_00111111"],
      [0xffffff_ffffffffn, "11111111_11111111_11111111_11111111_11111111_11111111_11111111_01111111"],
      [
        0xffffffff_ffffffffn,
        "11111111_11111111_11111111_11111111_11111111_11111111_11111111_11111111_11111111_00000001",
      ],
    ];
    test.each(cases)("%s", function (input, output) {
      expect(formatBin(dbn.encodeDyNum(input)), "u32d:" + input.toString(16)).toBe(output);
      expect(formatBin(dbn.encodeDyNum(BigInt(input))), "u64d:" + input.toString(16)).toBe(output);
    });
    test("小数", () => expect(() => dbn.encodeDyNum(2.25)).toThrowError());
  });

  /** 极值 */
  const cases_int: number[] = [0, 0x7f, 0x80, 0x3fff, 0x4000, 0x1fffff, 0x200000, 0xfffffff, 0x10000000, 0xffffffff];
  const cases_bigint = [
    ...cases_int.map(BigInt),

    0x7_ffffffffn,
    0x8_00000000n,
    0x3ff_ffffffffn,
    0x400_00000000n,
    0x1ffff_ffffffffn,
    0x20000_00000000n,
    0xffffff_ffffffffn,
  ];
  describe("write/read:bigInt", function () {
    cases_bigint.forEach((value, i) => {
      test(value + "-" + value.toString(16), function () {
        const dldBuf = dbn.encodeDyNum(value);
        let res = dbn.decodeU64D(dldBuf);
        expect(res).toEqual({ value, byte: dldBuf.byteLength });
      });
    });
  });
  describe("write/read:number", function () {
    cases_int.slice(0, -1).forEach((value, i) => {
      test(value + "-" + value.toString(16), function () {
        const dldBuf = dbn.encodeDyNum(value as number);
        let res = dbn.decodeU32D(dldBuf);
        expect(res).toEqual({ value: value, byte: dldBuf.byteLength });
      });
    });
  });
});
function formatBin(num_buf: number | Uint8Array) {
  let str = "";
  if (typeof num_buf === "number") {
    str = num_buf.toString(2);
    while (num_buf > 0xff) {
      let binStr = (num_buf % 0x100).toString(2);
      binStr = "0".repeat(8 - binStr.length) + binStr;
      str = binStr + "_" + str;
      num_buf >>>= 8;
    }
    str = num_buf.toString(2) + "_" + str;
    return str.slice(0, -1);
  } else {
    str = num_buf[0].toString(2);
    for (let i = 1; i < num_buf.length; i++) {
      let binStr = num_buf[i].toString(2);
      binStr = "0".repeat(8 - binStr.length) + binStr;
      str += "_" + binStr;
    }
    return str;
  }
}
