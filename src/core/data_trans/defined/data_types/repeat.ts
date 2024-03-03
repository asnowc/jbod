import { calcU32DByte, decodeU32D, encodeU32DInto } from "../../../dynamic_binary_number.js";
import type { EncodeContext, DataWriter, TypeDataWriter, Defined } from "../type.js";
import { DecodeResult } from "../../../type.js";
import { VOID_ID, DataType } from "../const.js";

class ArrayWriter implements DataWriter {
  constructor(arr: any[], ctx: EncodeContext, fixed?: boolean) {
    const type = ctx.toTypeCode(arr[0]);
    this.type = type;
    let byteLength = 1 + calcU32DByte(arr.length);
    if (fixed) {
      this.writer = new ctx[type](arr, ctx);
      this.length = arr.length;
    } else {
      let writers: DataWriter[] = new Array(arr.length);
      let writer: DataWriter;
      for (let i = 0; i < arr.length; i++) {
        writer = new ctx[type](arr[i], ctx);
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
    let type: number;
    for (let i = 0; i < arr.length; i++) {
      type = ctx.toTypeCode(arr[i]);
      writer = new ctx[type](arr[i], ctx) as TypeDataWriter;
      writer.type = type;
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
    const map = Object.keys(data);
    let totalLen = map.length + 1; //type*length + void
    let valWriters: TypeDataWriter[] = new Array(map.length);
    let keyWriters: DataWriter[] = new Array(map.length);

    let item: any;
    let keyRes: DataWriter;
    let valueRes: TypeDataWriter;
    let type: number;

    for (let i = 0; i < map.length; i++) {
      item = data[map[i]];
      keyRes = new ctx[DataType.string](map[i], ctx);
      type = ctx.toTypeCode(item);
      valueRes = new ctx[type](item, ctx) as TypeDataWriter;
      valueRes.type = type;
      totalLen += keyRes.byteLength + valueRes.byteLength;

      keyWriters[i] = keyRes;
      valWriters[i] = valueRes;
    }
    this.valueWriters = valWriters;
    this.keyWriters = keyWriters;
    this.byteLength = totalLen;
  }
  private readonly keyWriters: DataWriter[];
  private readonly valueWriters: TypeDataWriter[];
  readonly byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    const { keyWriters, valueWriters } = this;
    let item: TypeDataWriter;
    for (let i = 0; i < valueWriters.length; i++) {
      item = valueWriters[i];
      buf[offset++] = item.type;

      offset = keyWriters[i].encodeTo(buf, offset);
      offset = item.encodeTo(buf, offset);
    }
    buf[offset++] = VOID_ID;
    return offset;
  }
}

export const array: Defined<any[]> = {
  encoder: ArrayWriter,
  decoder: function arrayDecoder(buf: Uint8Array, offset: number): DecodeResult<any[]> {
    const type = buf[offset++];
    let du32 = decodeU32D(buf, offset);
    offset += du32.byte;
    const length = du32.value;

    let arrayList: unknown[] = [];
    let res: DecodeResult;
    for (let i = 0; i < length; i++) {
      res = this[type](buf, offset);
      offset = res.offset;
      arrayList[i] = res.data;
    }

    return { data: arrayList, offset };
  },
};

export const dyArray: Defined<any[]> = {
  encoder: DyArrayWriter,
  decoder: function dyArrayDecoder(buf: Uint8Array, offset: number): DecodeResult<any[]> {
    let arrayList: unknown[] = [];
    let res: DecodeResult;
    let type: number;
    while (offset < buf.byteLength) {
      type = buf[offset++];
      if (type === VOID_ID) break;
      res = this[type](buf, offset);
      offset = res.offset;
      arrayList.push(res.data);
    }
    return { data: arrayList, offset };
  },
  class: Array,
};

export const dyRecord: Defined<object> = {
  encoder: DyRecordWriter,
  decoder: function DyRecordDecoder(buf, offset) {
    const map: Record<string, unknown> = {};
    let key: string;
    let res: DecodeResult;
    while (offset < buf.byteLength) {
      const type = buf[offset++];
      if (type === VOID_ID) break;
      res = this[DataType.string](buf, offset);
      key = res.data;
      offset = res.offset;

      res = this[type](buf, offset);
      map[key] = res.data;
      offset = res.offset;
    }

    return { data: map, offset };
  },
};
export const jsSet: Defined<Set<any>> = {
  encoder: function JsSetWriter(data: Set<any>, ctx: EncodeContext) {
    return new DyArrayWriter(Array.from(data), ctx);
  } as any,
  decoder: function (buf, offset) {
    const res: DecodeResult = dyArray.decoder.call(this, buf, offset);
    res.data = new Set(res.data);
    return res;
  },
  class: Set,
};
export const jsMap: Defined<Set<any>> = {
  encoder: function JsMapWriter(data: Set<any>, ctx: EncodeContext) {
    const list: any[] = [];
    let i = 0;
    for (const item of data) {
      list[i] = item[0];
      list[i + 1] = item[1];
      i += 2;
    }
    return new DyArrayWriter(list, ctx);
  } as any,
  decoder: function (buf, offset) {
    const res: DecodeResult = dyArray.decoder.call(this, buf, offset);
    const object = res.data;
    const map = new Map();
    for (let i = 0; i < object.length; i += 2) {
      map.set(object[i], object[i + 1]);
    }
    res.data = map;
    return res;
  },
  class: Map,
};
