import type { TypeDataWriter, DataWriter, DecodeContext, EncodeContext } from "../type.js";
import type { DecodeResult } from "../../../type.js";
import {
  writeDoubleBE,
  writeBigInt64BE,
  writeInt32BE,
  readInt32BE,
  readBigInt64BE,
  readDoubleBE,
} from "../../../../uint_array_util/mod.js";
import { DataType, UnsupportedDataTypeError } from "../const.js";
import { NO_CONTENT } from "../data_types/fixed_len.js";

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
      else type = DataType.i32;
      break;
    case "bigint":
      type = DataType.i64;
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
  return DataType.dyRecord;
}

function i32(this: { data: number }, buf: Uint8Array, offset: number) {
  return writeInt32BE(this.data, buf, offset);
}
function F64(this: { data: number }, buf: Uint8Array, offset: number) {
  return writeDoubleBE(this.data, buf, offset);
}
function i64(this: { data: bigint }, buf: Uint8Array, offset: number) {
  return writeBigInt64BE(this.data, buf, offset);
}

export function fastJbodWriter(data: any, ctx: EncodeContext): TypeDataWriter {
  let type: number;
  switch (typeof data) {
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647)
        return { byteLength: 8, encodeTo: F64, data, type: DataType.f64 } as any;
      else return { byteLength: 4, encodeTo: i32, data, type: DataType.i32 } as any;
    case "bigint":
      return { byteLength: 4, encodeTo: i64, data, type: DataType.f64 } as any;
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
      return { data: readInt32BE(buf, offset), offset: offset + 4 };
    case DataType.i64:
      return { data: readBigInt64BE(buf, offset), offset: offset + 8 };
    case DataType.f64:
      return { data: readDoubleBE(buf, offset), offset: offset + 8 };
    case DataType.true:
      return { data: true, offset };
    case DataType.false:
      return { data: false, offset };
    case DataType.null:
      return { data: null, offset };
    case DataType.undefined:
      return { data: undefined, offset };
    default: {
      if (typeof ctx[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      return ctx[type](buf, offset, ctx);
    }
  }
}
export function jbodDecoder(buf: Uint8Array, offset: number, ctx: DecodeContext) {
  let type = buf[offset++];
  return fastDecodeJbod(buf, offset, ctx, type);
}
