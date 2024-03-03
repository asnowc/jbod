import {
  writeDoubleBE,
  writeBigInt64BE,
  writeInt32BE,
  readInt32BE,
  readBigInt64BE,
  readDoubleBE,
} from "../../uint_array_util/mod.js";
import {
  DataWriterCreator,
  EncodeContext,
  DecodeContext,
  TypeDataWriter,
  NO_CONTENT,
  Defined,
  JbodWriter,
  decodeJbod,
} from "./defined/mod.js";
import { DataType, UnsupportedDataTypeError } from "./defined/const.js";
import { DEFAULT_TYPE, JS_OBJECT_EXTRA_TYPE } from "./defined/mod.js";

function i32(this: { data: number }, buf: Uint8Array, offset: number) {
  return writeInt32BE(this.data, buf, offset);
}
function F64(this: { data: number }, buf: Uint8Array, offset: number) {
  return writeDoubleBE(this.data, buf, offset);
}
function i64(this: { data: bigint }, buf: Uint8Array, offset: number) {
  return writeBigInt64BE(this.data, buf, offset);
}
function fastGetWriter(this: EncodeContext, data: any): TypeDataWriter {
  let type: number;
  switch (typeof data) {
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647)
        return { byteLength: 4, encodeTo: F64, data, type: DataType.f64 } as any;
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

      if (data instanceof Array) type = DataType.dyArray;
      else {
        const classTypes = this.classTypes;
        if (classTypes) {
          let constructor = Reflect.getPrototypeOf(data);
          while (constructor) {
            type = classTypes.get(constructor as any)!;
            if (type !== null) break;
          }
          type = DataType.dyRecord;
        } else type = DataType.dyRecord;
      }
      break;
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
  const writer = new this[type](data, this) as any;
  writer.type = type;
  return writer;
}
// DEFAULT_CONTEXT.getWriter = fastGetWriter;

const ENCODE_CONTEXT: EncodeContext = {
  JbodWriter,
  classTypes: new Map(),
  toTypeCode,
};
const DECODE_CONTEXT: DecodeContext = { decodeJbod };
export function createContext(customType?: Record<number, Defined>) {
  let enc: EncodeContext = { ...ENCODE_CONTEXT };
  let dec: DecodeContext = { ...DECODE_CONTEXT };
  join(enc, dec, DEFAULT_TYPE);
  join(enc, dec, JS_OBJECT_EXTRA_TYPE);
  if (customType) join(enc, dec, customType);
  return { enc, dec };
}
function join(enc: EncodeContext, dec: DecodeContext, define: Record<number, Defined>) {
  for (const [typeStr, defineInfo] of Object.entries(define)) {
    const type = parseInt(typeStr);
    enc[type] = defineInfo.encoder;
    dec[type] = defineInfo.decoder;
    if (defineInfo.class) {
      enc.classTypes.set(defineInfo.class, type);
    }
  }
}

function toTypeCode(this: EncodeContext, data: any): number {
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

      if (data instanceof Array) return DataType.dyArray;
      const classTypes = this.classTypes;
      if (classTypes) {
        for (const defineClass of classTypes) {
          if (data instanceof defineClass[0]) return defineClass[1];
        }
      }
      return DataType.dyRecord;
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}
interface DefineClass {
  code: number;
  class: ClassType;
}

type ClassType = new (...args: any[]) => object;
export type { EncodeContext, DecodeContext };
