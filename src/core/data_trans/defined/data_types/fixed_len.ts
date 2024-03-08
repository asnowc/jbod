import type { EncodeContext, Defined, EncodeFn, DataWriterCreator, DecodeFn, DataWriter } from "../type.js";
import {
  writeDoubleBE,
  writeBigInt64BE,
  writeInt32BE,
  readDoubleBE,
  readInt32BE,
  readBigInt64BE,
} from "../../../../uint_array_util/mod.js";
export class FixedLenDataWriter<T> implements DataWriter {
  constructor(private data: T, private writer: EncodeFn<T>, readonly byteLength: number) {}
  encodeTo(buf: Uint8Array, offset: number): number {
    return this.writer(this.data, buf, offset);
  }
}
export const i32: Defined<number> = {
  encoder: function I32Writer(data: number, ctx: EncodeContext): DataWriter {
    return new FixedLenDataWriter(data, writeInt32BE, 4);
  } as any,
  decoder: function I32Decoder(buf, offset) {
    return {
      data: readInt32BE(buf, offset),
      offset: offset + 4,
    };
  },
};
export const i64: Defined<bigint> = {
  encoder: function I64Writer(data: bigint, ctx: EncodeContext): DataWriter {
    return new FixedLenDataWriter(data, writeBigInt64BE, 8);
  } as any,
  decoder: function I32Decoder(buf, offset) {
    return {
      data: readBigInt64BE(buf, offset),
      offset: offset + 8,
    };
  },
};
export const f64: Defined<number> = {
  encoder: function F64Writer(data: number, ctx: EncodeContext): DataWriter {
    return new FixedLenDataWriter(data, writeDoubleBE, 8);
  } as any,
  decoder: function F64Decoder(buf, offset) {
    return {
      data: readDoubleBE(buf, offset),
      offset: offset + 8,
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
