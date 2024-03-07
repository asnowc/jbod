import { calcU32DByte, decodeU32D, encodeU32DInto } from "../../../dynamic_binary_number.js";
import { DataType, FieldType, VOID_ID } from "../const.js";
import type { DecodeResult } from "../../../type.js";
import { fastDecodeJbod } from "../item/mod.js";
import type { EncodeContext, DecodeContext, DataWriter, DataWriterCreator, DecodeFn, Defined } from "../type.js";
import { JbodWriter } from "./jbod.js";
type Key = string | number | symbol;
export type StructDecodeInfo = { decode: number | DecodeFn | Record<number, StructDecodeInfo>; key: Key };
export type StructEncodeInfo = {
  encode: number | DataWriterCreator | StructEncodeDefine;
  id: number;
  optional?: boolean;
};
export type StructEncodeDefine = Map<Key, StructEncodeInfo>;

export class StructWriter implements DataWriter {
  constructor(encodeStruct: StructEncodeDefine, data: object, ctx: EncodeContext);
  constructor(encodeStruct: StructEncodeDefine, data: Record<Key, any>, ctx: EncodeContext) {
    let len = 1;
    let value;
    let preMap = new Map<number, DataWriter>();
    let res: DataWriter;
    for (const [key, define] of encodeStruct) {
      value = data[key];
      if (value === undefined) {
        if (define.optional) continue;
        else throw new Error(`字段 '${String(key)}' 不是可选类型, 不能为为 undefined`);
      }
      switch (typeof define.encode) {
        case "number": {
          switch (define.encode) {
            case FieldType.bool:
              res = {
                byteLength: 1,
                value,
                encodeTo: boolEncode,
              } as DataWriter;
              break;
            case FieldType.any: {
              res = new JbodWriter(value, ctx);
              break;
            }
            default:
              res = new ctx[define.encode](value, ctx);
              break;
          }
          break;
        }
        case "function": {
          res = new define.encode(value, ctx);
          break;
        }
        case "object": {
          res = new StructWriter(define.encode, value, ctx);
          break;
        }

        default:
          throw new Error("encode field error");
      }

      len += res.byteLength;
      preMap.set(define.id, res);
      len += calcU32DByte(define.id);
    }

    this.byteLength = len;
    this.pretreatment = preMap;
  }
  private pretreatment: Map<number, DataWriter>;
  readonly byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    for (const [key, value] of this.pretreatment) {
      offset = encodeU32DInto(key, buf, offset);
      offset = value.encodeTo(buf, offset);
    }
    buf[offset++] = VOID_ID;
    return offset;
  }
}
export function decodeStruct<T = any>(
  buf: Uint8Array,
  offset: number,
  struct: Record<number, StructDecodeInfo>,
  ctx: DecodeContext
): DecodeResult<T> {
  let obj: Record<Key, any> = {};
  let res = decodeU32D(buf, offset);
  let info: StructDecodeInfo | undefined;
  let value: DecodeResult;
  while (res.value > 0) {
    offset += res.byte;
    info = struct[res.value];
    if (!info) throw new Error("Undefined field ID: " + res.value);

    switch (typeof info.decode) {
      case "number": {
        switch (info.decode) {
          case FieldType.bool:
            value = { data: buf[offset++] === DataType.true ? true : false, offset };
            break;
          case FieldType.any: {
            let type = buf[offset++];
            value = fastDecodeJbod(ctx, buf, offset, type);
            break;
          }
          default:
            value = fastDecodeJbod(ctx, buf, offset, info.decode);
            break;
        }
        break;
      }
      case "function":
        value = info.decode(buf, offset, ctx);
        break;
      case "object":
        value = decodeStruct(buf, offset, info.decode, ctx);
        break;
      default:
        throw new Error("decode field error");
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
function boolEncode(this: { value: boolean }, buf: Uint8Array, offset: number) {
  buf[offset] = this.value ? DataType.true : DataType.false;
  return offset + 1;
}

/* @__NO_SIDE_EFFECTS__ */
export function defineStruct(definedMap: Struct, opts: { required?: boolean } = {}) {
  const optional = !opts.required;
  const keys = Object.keys(definedMap);
  const encodeDefined: StructEncodeDefine = new Map();
  const decodeDefined: Record<number, StructDecodeInfo> = {};

  let key: string;
  let value;
  let encodeItem: StructEncodeInfo;
  let decodeItem: StructDecodeInfo;
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    value = definedMap[key];
    if (typeof value === "number") {
      // 仅定义ID： any 类型
      encodeItem = { encode: FieldType.any, id: value, optional };
      decodeItem = { decode: FieldType.any, key };
    } else if (typeof value === "object") {
      let type: number | StructType | Struct = value.type ?? FieldType.any;
      let encoder: StructEncodeInfo["encode"];
      let decoder: StructDecodeInfo["decode"];
      if (typeof type === "number") {
        // jbod 类型
        decoder = type;
        encoder = type;
      } else if (type instanceof StructType) {
        // 自定义编解码
        decoder = type.decoder;
        encoder = type.encoder;
      } else {
        //结构体
        const res = defineStruct(type, opts);
        decoder = res.decodeDefined;
        encoder = res.encodeDefined;
      }
      decodeItem = { decode: decoder, key };
      encodeItem = {
        encode: encoder,
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
/** @public */
export type StructDefined = {
  type?: FieldType | StructType | Struct;
  id: number;
  optional?: boolean;
  repeat?: boolean;
};
/**
 * @example
 * ```js
 *  const struct={
 *    abc:1,  //仅指定id, 则为动态类型
 *    def:{
 *      type:"number",
 *      id:2
 *    }
 *  }
 * ```
 *
 * @public
 */
export type Struct = {
  [key: string]: StructDefined | number;
};
/** @public */
export class StructType<T = any> {
  constructor(defined: Defined) {
    this.decoder = defined.decoder;
    this.encoder = defined.encoder;
  }
  encoder: DataWriterCreator<T>;
  decoder: DecodeFn<T>;
}
