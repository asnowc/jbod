import type { EncodeContext, Defined, DataWriter } from "../type.js";
import { calcU32DByte, decodeU32D, encodeU32DInto } from "../../../dynamic_binary_number.js";
import { calcUtf8Length, decodeUtf8, encodeUtf8Into } from "../../../../uint_array_util/mod.js";

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
    return {
      data: buf.subarray(offset, res.value),
      offset,
    };
  },
};
