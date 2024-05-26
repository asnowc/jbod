import { calcU32DByte, decodeU32D, encodeU32DInto } from "../../../varints/mod.ts";
import type { EncodeContext, DataWriter, TypeDataWriter, Defined } from "../type.ts";
import { DecodeResult } from "../../../type.ts";
import { VOID_ID } from "../const.ts";
import { fastDecodeJbod, fastJbodWriter } from "./jbod.ts";
import { stringDecode } from "./dy_len.ts";
import { calcUtf8Length, encodeUtf8Into } from "./string.ts";

class ArrayWriter implements DataWriter {
  constructor(arr: any[], ctx: EncodeContext, fixed?: boolean) {
    const type = ctx.toTypeCode(arr[0]);
    this.type = type;
    let byteLength = 1 + calcU32DByte(arr.length);
    if (fixed) {
      this.writer = fastJbodWriter(arr, ctx);
      this.length = this.writer.byteLength * arr.length;
    } else {
      let writers: DataWriter[] = new Array(arr.length);
      let writer: DataWriter;
      for (let i = 0; i < arr.length; i++) {
        writer = fastJbodWriter(arr[i], ctx);
        writers[i] = writer;
        byteLength += writer.byteLength;
      }
      this.writer = writers;
    }
    this.byteLength = byteLength;
  }
  private length?: number;
  private writer: DataWriter | DataWriter[];
  readonly type: number;
  readonly byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    buf[offset++] = this.type;
    const writer = this.writer;
    if (this.length === undefined) {
      offset = encodeU32DInto((writer as DataWriter[]).length, buf, offset);
      for (let i = 0; i < this.byteLength; i++) {
        offset = (writer as DataWriter[])[i].encodeTo(buf, offset);
      }
      return offset;
    } else {
      offset = encodeU32DInto(this.length, buf, offset);
      return (writer as DataWriter).encodeTo(buf, offset);
    }
  }
}

class DyArrayWriter implements DataWriter {
  constructor(arr: any[], ctx: EncodeContext) {
    let writers: TypeDataWriter[] = new Array(arr.length);
    let totalLen = arr.length + 1; //type*length+ void
    let writer: TypeDataWriter;
    for (let i = 0; i < arr.length; i++) {
      writer = fastJbodWriter(arr[i], ctx);
      totalLen += writer.byteLength;
      writers[i] = writer;
    }
    this.writers = writers;
    this.byteLength = totalLen;
  }
  private writers: TypeDataWriter[];
  readonly byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    const writers = this.writers;
    for (let i = 0; i < writers.length; i++) {
      buf[offset++] = writers[i].type;
      offset = writers[i].encodeTo(buf, offset);
    }
    buf[offset++] = VOID_ID;
    return offset;
  }
}
class DyRecordWriter implements DataWriter {
  constructor(data: object, ctx: EncodeContext);
  constructor(data: Record<string, any>, ctx: EncodeContext) {
    const keys = Object.keys(data);
    let totalLen = keys.length + 1; //type*length + void
    let valWriters: TypeDataWriter[] = new Array(keys.length);
    let keysLen: number[] = new Array(keys.length);

    let valueRes: TypeDataWriter;
    let keyUtf8Len: number;

    for (let i = 0; i < keys.length; i++) {
      keyUtf8Len = calcUtf8Length(keys[i]);
      valueRes = fastJbodWriter(data[keys[i]], ctx);

      totalLen += calcU32DByte(keyUtf8Len) + keyUtf8Len + valueRes.byteLength;
      keysLen[i] = keyUtf8Len;
      valWriters[i] = valueRes;
    }
    this.valueWriters = valWriters;
    this.keysLen = keysLen;
    this.keys = keys;
    this.byteLength = totalLen;
  }
  private readonly keys: string[];
  private readonly keysLen: number[];
  private readonly valueWriters: TypeDataWriter[];
  readonly byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    const { keysLen, valueWriters, keys } = this;
    let item: TypeDataWriter;
    for (let i = 0; i < valueWriters.length; i++) {
      item = valueWriters[i];
      buf[offset++] = item.type;

      offset = encodeU32DInto(keysLen[i], buf, offset);
      offset = encodeUtf8Into(keys[i], buf, offset);

      offset = item.encodeTo(buf, offset);
    }
    buf[offset++] = VOID_ID;
    return offset;
  }
}

export const array: Defined<any[]> = {
  encoder: ArrayWriter,
  decoder: function arrayDecoder(buf: Uint8Array, offset: number, ctx): DecodeResult<any[]> {
    const type = buf[offset++];
    let du32 = decodeU32D(buf, offset);
    offset += du32.byte;
    const length = du32.value;

    let arrayList: unknown[] = [];
    let res: DecodeResult;
    for (let i = 0; i < length; i++) {
      res = fastDecodeJbod(buf, offset, ctx, type);
      offset = res.offset;
      arrayList[i] = res.data;
    }

    return { data: arrayList, offset };
  },
};

export const dyArray: Defined<any[]> = {
  encoder: DyArrayWriter,
  decoder: function dyArrayDecoder(buf: Uint8Array, offset: number, ctx): DecodeResult<any[]> {
    let arrayList: unknown[] = [];
    let res: DecodeResult;
    let type: number;
    let i = 0;
    while (offset < buf.byteLength) {
      type = buf[offset++];
      if (type === VOID_ID) break;
      res = fastDecodeJbod(buf, offset, ctx, type);
      offset = res.offset;
      arrayList[i++] = res.data;
    }
    return { data: arrayList, offset };
  },
  class: Array,
};

export const dyRecord: Defined<object> = {
  encoder: DyRecordWriter,
  decoder: function DyRecordDecoder(buf, offset, ctx) {
    const map: Record<string, unknown> = {};
    let key: string;
    let res: DecodeResult;
    let type: number;
    while (offset < buf.byteLength) {
      type = buf[offset++];
      if (type === VOID_ID) break;

      res = stringDecode(buf, offset);
      offset = res.offset;
      key = res.data;
      res = fastDecodeJbod(buf, res.offset, ctx, type);

      map[key] = res.data;
      offset = res.offset;
    }

    return { data: map, offset };
  },
};
