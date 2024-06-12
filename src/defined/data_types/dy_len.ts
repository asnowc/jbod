import type { EncodeContext, Defined, DataWriter } from "../type.ts";
import {
  calcU32DByte,
  calcU64DByte,
  decodeU64D,
  decodeU32D,
  encodeU32DInto,
  encodeU64DInto,
  zigzagDecodeI64,
} from "../../varints/mod.ts";
import { calcUtf8Length, decodeUtf8, encodeUtf8Into } from "../../utf8/mod.ts";

export const string: Defined<string> = {
  encoder: class StringWriter implements DataWriter {
    constructor(private data: string) {
      this.strByteLen = calcUtf8Length(data);
      this.byteLength = calcU32DByte(this.strByteLen) + this.strByteLen;
    }
    private readonly strByteLen: number;
    readonly byteLength: number;
    encodeTo(buf: Uint8Array, offset: number): number {
      offset = encodeU32DInto(this.strByteLen, buf, offset);
      return encodeUtf8Into(this.data, buf, offset);
    }
  },
  decoder: stringDecode,
};
export function stringDecode(buf: Uint8Array, offset: number) {
  const res = decodeU32D(buf, offset);
  offset += res.byte;
  if (res.value <= 0) return { data: "", offset };
  return {
    data: decodeUtf8(buf.subarray(offset, offset + res.value)), // 这里用 subarray 比传入 start end 要快，没搞清楚为什么
    offset: offset + res.value,
  };
}
export const binary: Defined<Uint8Array> = {
  encoder: class BinaryWriter implements DataWriter {
    constructor(data: Uint8Array, ctx: EncodeContext) {
      this.byteLength = calcU32DByte(data.byteLength) + data.byteLength;
      this.pretreatment = data;
    }
    private pretreatment: Uint8Array;
    readonly byteLength: number;
    encodeTo(buf: Uint8Array, offset: number): number {
      let data = this.pretreatment;
      buf.set(data, encodeU32DInto(data.byteLength, buf, offset));
      return offset + this.byteLength;
    }
  },
  decoder: function decode(buf: Uint8Array, offset: number) {
    const res = decodeU32D(buf, offset);
    offset += res.byte;
    let end = offset + res.value;
    return {
      data: buf.subarray(offset, end),
      offset: end,
    };
  },
  class: Uint8Array,
};

export const dyI32: Defined<number> = {
  encoder: class DyI32 implements DataWriter {
    private data: number;
    constructor(data: number) {
      data = (data << 1) ^ (data >> 31);
      this.data = data;
      this.byteLength = calcU32DByte(data);
    }
    byteLength: number;
    encodeTo(buf: Uint8Array, offset: number): number {
      return encodeU32DInto(this.data, buf, offset);
    }
  },
  decoder: function decodeDyI32(buf, offset) {
    const res = decodeU32D(buf, offset);
    return { data: (res.value >>> 1) ^ -(res.value & 1), offset: offset + res.byte };
  },
};
export const dyI64: Defined<bigint> = {
  encoder: class DyI64 implements DataWriter {
    private data: bigint;
    constructor(data: bigint) {
      data = (data << BigInt(1)) ^ (data >> BigInt(63));
      this.data = data;
      this.byteLength = calcU64DByte(data);
    }
    byteLength: number;
    encodeTo(buf: Uint8Array, offset: number): number {
      return encodeU64DInto(this.data, buf, offset);
    }
  },
  decoder: function decodeDyI64(buf, offset) {
    const res = decodeU64D(buf, offset);
    return { data: zigzagDecodeI64(res.value), offset: offset + res.byte };
  },
};
