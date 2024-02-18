import { DataType, UnsupportedDataTypeError, VOID_ID, FieldType } from "../const.js";
import type { DecodeResult, Encoder, Struct } from "../type.js";
import type { Calc, Dec, Enc, Struct as Stru } from "./type.js";
import { calcU32DByte, decodeU32D, encodeU32DInto } from "../dynamic_binary_number.js";
import { readBigInt64BE, readDoubleBE, readInt32BE } from "../../uint_array_util/mod.js";

/* 计算 */

export function createCalcContext(calcMap: Calc.DefineMap): Calc.Context {
  return { ...calcMap, byteLength: calcLength, calcStruct };
}

function calcLength(this: Calc.Context, data: any): Calc.Result {
  switch (typeof data) {
    case "number": {
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647)
        return { type: DataType.f64, byteLength: 8, pretreatment: data };
      else return { type: DataType.i32, byteLength: 4, pretreatment: data };
    }
    case "bigint":
      return { type: DataType.i64, byteLength: 8, pretreatment: data };
    case "string":
      return this[DataType.string](data);
    case "boolean":
      return { byteLength: 0, pretreatment: data, type: data ? DataType.true : DataType.false };
    case "undefined":
      return { byteLength: 0, pretreatment: undefined, type: DataType.undefined };
    case "symbol":
      return this[DataType.symbol](data);
    case "object": {
      if (data === null) return { type: DataType.null, byteLength: 0, pretreatment: null };

      if (data instanceof Array) return this[DataType.dyArray](data);

      let item: (typeof this.customClassType)[0];
      for (let i = 0; i < this.customClassType.length; i++) {
        item = this.customClassType[i];
        if (data instanceof item.class) return this[item.code](data);
      }
      return this[DataType.dyRecord](data);
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
}
function calcLengthById(data: any, type: number, ctx: Calc.Context): Calc.Result {
  switch (type) {
    case DataType.i32:
      return { type: DataType.i32, byteLength: 4, pretreatment: data };
    case DataType.f64:
      return { type: DataType.f64, byteLength: 8, pretreatment: data };
    case DataType.i64:
      return { type: DataType.i64, byteLength: 8, pretreatment: data };
    case DataType.true:
      return { byteLength: 0, pretreatment: true, type: DataType.true };
    case DataType.false:
      return { byteLength: 0, pretreatment: false, type: DataType.true };
    case DataType.undefined:
      return { byteLength: 0, pretreatment: undefined, type: DataType.undefined };
    case DataType.null:
      return { byteLength: 0, pretreatment: null, type: DataType.null };
    default:
      return ctx[type](data);
  }
}
function calcStruct(
  this: Calc.Context,
  data: Record<string | number | symbol, any>,
  struct: Map<Stru.Key, Stru.EncodeValue>
): Stru.CalcResult {
  let len = 1;
  let value;
  let preMap: Stru.CalcResult["pretreatment"] = new Map();
  let res: Stru.PreDataItem;
  for (const [key, define] of struct) {
    value = data[key];
    if (value === undefined) {
      if (define.optional) continue;
      else throw new Error(`字段 '${String(key)}' 不是可选类型, 不能为为 undefined`);
    }
    if (typeof define.encode === "number") {
      switch (define.encode) {
        case FieldType.bool:
          res = {
            type: FieldType.bool,
            byteLength: 0,
            pretreatment: value,
            enc: define,
          };
          len++; //type flag
          break;
        case FieldType.any: {
          res = this.byteLength(value) as any;
          len++; //type flag
          break;
        }
        default:
          res = calcLengthById(value, define.encode, this) as Stru.PreDataItem;
          break;
      }
    } else {
      res = define.encode.byteLength(value) as Stru.PreDataItem;
      res.type = define.encode;
    }
    res.enc = define;
    len += res.byteLength;
    preMap.set(define.id, res);
    len += calcU32DByte(define.id);
  }
  return {
    byteLength: len,
    pretreatment: preMap,
  };
}

/* 编码 */

function encodeStructInto(
  this: Enc.Context,
  res: Stru.CalcResult["pretreatment"],
  buf: Uint8Array,
  offset = 0
): number {
  for (const [key, value] of res) {
    offset = encodeU32DInto(key, buf, offset);
    if (typeof value.type === "number") {
      switch (value.enc.encode) {
        case FieldType.bool:
          buf[offset++] = value.pretreatment ? 1 : 0;
          break;
        case FieldType.any:
          buf[offset++] = value.type;
        default:
          offset = this[value.type](value.pretreatment, buf, offset);
          break;
      }
    } else offset = value.type.encodeInto(value.pretreatment as any, buf, offset);
  }
  buf[offset++] = VOID_ID;
  return offset;
}
export function createEncContext(encMap: Record<number, Enc.Fn>): Enc.Context {
  return { ...encMap, encodeStruct: encodeStructInto };
}

/* 解码 */

function decodeStruct<T = any>(
  this: Dec.Context,
  buf: Uint8Array,
  offset: number,
  struct: Stru.DecodeDefine
): DecodeResult<T> {
  let obj: Record<Stru.Key, any> = {};
  let res = decodeU32D(buf, offset);
  let info: Stru.DecodeValue | undefined;
  let value: DecodeResult;
  while (res.value > 0) {
    offset += res.byte;
    info = struct[res.value];
    if (!info) throw new Error("Undefined field ID: " + res.value);

    if (typeof info.decode === "object") value = info.decode.decode(buf, offset);
    else if (info.decode) value = this.decodeItem(buf, offset, info.decode);
    else {
      let type = buf[offset++];
      value = this.decodeItem(buf, offset, type);
    }

    obj[info.key] = value.data;
    offset = value.offset;

    res = decodeU32D(buf, offset);
  }
  offset += res.byte;
  return {
    data: obj,
    offset,
  };
}
function decodeItem(this: Dec.Context, buf: Uint8Array, offset: number, type: number): DecodeResult {
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
      if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      return this[type](buf, offset);
    }
  }
}
export function createDecContext(decMap: Record<number, Dec.Fn>): Dec.Context {
  return { ...decMap, decodeItem, decodeStruct };
}

/**
 * @__NO_SIDE_EFFECTS__
 * @public
 */
export function defineStruct(definedMap: Struct, opts: { required?: boolean } = {}) {
  const optional = !opts.required;
  const keys = Object.keys(definedMap);
  const encodeDefined: Stru.EncodeDefine = new Map();
  const decodeDefined: Stru.DecodeDefine = {};

  let key: string;
  let value;
  let encodeItem: Stru.EncodeValue;
  let decodeItem: Stru.DecodeValue;
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    value = definedMap[key];
    if (typeof value === "number") {
      encodeItem = { encode: FieldType.any, id: value, optional };
      decodeItem = { key };
    } else if (typeof value === "object") {
      let type: number | Encoder | undefined = value.type;
      if (typeof value.type === "number") {
        if (value.type === DataType.false) type = DataType.true;
        else if (value.type === DataType.undefined || value.type === DataType.null)
          throw new Error("Unknown defined type");
        decodeItem = { decode: value.type, key };
      } else decodeItem = { decode: value.type, key };
      encodeItem = {
        encode: type ?? FieldType.any,
        id: value.id,
        optional: value.optional === undefined ? optional : Boolean(value.optional),
      };
    } else throw new Error(`[${key}]定义错误`);

    if (encodeItem.id <= 0) throw new Error(`[${key}]无效id`);
    if (encodeItem.id % 1 !== 0) throw new Error(`[${key}]无效id`);
    encodeDefined.set(key, encodeItem);
    decodeDefined[encodeItem.id] = decodeItem;
  }
  return { encodeDefined, decodeDefined };
}
