import type { Defined, DecodeFn, DataWriter } from "../type.js";
import { encodeF64BE, decodeF64BE } from "./float.js";

export const i32: Defined<number> = {
  encoder: class I32Writer implements DataWriter {
    constructor(private data: number) {}
    byteLength = 4;
    encodeTo(buf: Uint8Array, offset: number): number {
      let value = this.data;
      buf[offset + 3] = value;
      value = value >>> 8;
      buf[offset + 2] = value;
      value = value >>> 8;
      buf[offset + 1] = value;
      value = value >>> 8;
      buf[offset] = value;
      return offset + 4;
    }
  },
  decoder: function decodeI32(buf: Uint8Array, offset: number) {
    //first << 24 可能溢出
    const data = (buf[offset++] << 24) + (buf[offset++] << 16) + (buf[offset++] << 8) + buf[offset++];
    return {
      data,
      offset: offset,
    };
  },
};

export const i64: Defined<bigint> = {
  encoder: class I64Writer implements DataWriter {
    constructor(private data: bigint) {}
    byteLength = 8;
    encodeTo(buf: Uint8Array, offset: number): number {
      const value = this.data;
      let lo = Number(value & 0xffffffffn);
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number((value >> 32n) & 0xffffffffn);
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
  },
  decoder: function decodeI64(buf: Uint8Array, offset = 0): { data: bigint; offset: number } {
    //first << 24 可能溢出
    let val: number | bigint = (buf[offset++] << 24) + (buf[offset++] << 16) + (buf[offset++] << 8) + buf[offset++];
    val =
      (BigInt(val) << 32n) +
      BigInt(buf[offset++] * 2 ** 24 + (buf[offset++] << 16) + (buf[offset++] << 8) + buf[offset++]);
    return {
      data: val,
      offset: offset,
    };
  },
};

export const NO_CONTENT: DataWriter = {
  byteLength: 0,
  encodeTo(data: any, offset: any) {
    return offset;
  },
};
/* @__NO_SIDE_EFFECTS__ */
export function createNoContent<T>(decodeFn: DecodeFn<T>): Defined<T> {
  return {
    encoder: NoContent as any,
    decoder: decodeFn,
  };
}
function NoContent(): DataWriter {
  return { ...NO_CONTENT };
}

class F64Writer implements DataWriter {
  constructor(private data: number) {}
  byteLength: number = 8;
  declare encodeTo: DataWriter["encodeTo"];
}
F64Writer.prototype.encodeTo = encodeF64BE;

export const f64: Defined<number> = {
  encoder: F64Writer,
  decoder: decodeF64BE,
};
