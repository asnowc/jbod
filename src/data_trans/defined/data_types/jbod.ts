import type { TypeDataWriter, DataWriter, DecodeContext, EncodeContext } from "../type.js";
import type { DecodeResult } from "../../../type.js";

import { DataType, UnsupportedDataTypeError } from "../const.js";
import { NO_CONTENT } from "../data_types/fixed_len.js";
import * as numberTrans from "./fixed_len.js";
import { decodeDyInt, decodeU64D, zigzagDecodeI64, zigzagDecodeI32 } from "../../../varints/mod.js";

export class JbodWriter implements TypeDataWriter {
  constructor(data: any, ctx: EncodeContext) {
    this.type = ctx.toTypeCode(data);
    this.writer = new ctx[this.type](data, ctx);
    this.byteLength = this.writer.byteLength + 1;
  }
  private writer: DataWriter;
  readonly type: number;
  byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    buf[offset] = this.type;
    return this.writer.encodeTo(buf, offset + 1);
  }
}

export function toTypeCode(this: EncodeContext, data: any): number {
  let type: number;
  switch (typeof data) {
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647) type = DataType.f64;
      else type = DataType.dyI32;
      break;
    case "bigint":
      type = DataType.dyI64;
      break;
    case "boolean":
      return data ? DataType.true : DataType.false;
    case "string":
      type = DataType.string;
      break;
    case "undefined":
      return DataType.undefined;
    case "symbol":
      type = DataType.symbol;
      break;
    case "object": {
      if (data === null) return DataType.null;
      return getClassTypeCode(data, this.classTypes);
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}
function getClassTypeCode(data: object, classTypes: Map<object, number>) {
  let constructor = Reflect.getPrototypeOf(data);
  let type: number | undefined;
  while (constructor) {
    type = classTypes.get(constructor as any);
    if (type !== undefined) return type;
    constructor = Reflect.getPrototypeOf(constructor);
  }
  return DataType.anyRecord;
}
const { encoder: F64Writer, decoder: encodeF64 } = numberTrans.f64;
const { decoder: encodeI32 } = numberTrans.i32;
const { decoder: encodeI64 } = numberTrans.i64;

const f64 = F64Writer.prototype.encodeTo;
export function fastJbodWriter(data: any, ctx: EncodeContext): TypeDataWriter {
  let type: number;
  switch (typeof data) {
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647)
        return { byteLength: 8, encodeTo: f64, data, type: DataType.f64 } as any;
      else type = DataType.dyI32;
      break;
    case "bigint":
      type = DataType.dyI64;
      break;
    case "boolean":
      return { type: data ? DataType.true : DataType.false, byteLength: 0, encodeTo: NO_CONTENT.encodeTo };
    case "string":
      type = DataType.string;
      break;
    case "undefined":
      return { type: DataType.undefined, byteLength: 0, encodeTo: NO_CONTENT.encodeTo };
    case "symbol":
      type = DataType.symbol;
      break;
    case "object": {
      if (data === null) return { type: DataType.null, byteLength: 0, encodeTo: NO_CONTENT.encodeTo };
      type = getClassTypeCode(data, ctx.classTypes);
      break;
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
  const writer = new ctx[type](data, ctx) as any;
  writer.type = type;
  return writer;
}

export function fastDecodeJbod(buf: Uint8Array, offset: number, ctx: DecodeContext, type: number): DecodeResult<any> {
  switch (type) {
    case DataType.i32:
      return encodeI32(buf, offset, ctx);
    case DataType.i64:
      return encodeI64(buf, offset, ctx);
    case DataType.f64:
      return encodeF64(buf, offset, ctx);
    case DataType.dyI32: {
      const res = decodeDyInt(buf, offset) as { value: number; byte: number };
      return { data: zigzagDecodeI32(res.value), offset: offset + res.byte };
    }
    case DataType.dyI64: {
      const res = decodeU64D(buf, offset);
      return { data: zigzagDecodeI64(res.value), offset: offset + res.byte };
    }
    case DataType.true:
      return { data: true, offset };
    case DataType.false:
      return { data: false, offset };
    case DataType.null:
      return { data: null, offset };
    case DataType.undefined:
      return { data: undefined, offset };
    default: {
      const decode = ctx[type];
      if (typeof decode !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      return decode(buf, offset, ctx);
    }
  }
}
export function jbodDecoder(buf: Uint8Array, offset: number, ctx: DecodeContext) {
  let type = buf[offset++];
  return fastDecodeJbod(buf, offset, ctx, type);
}
