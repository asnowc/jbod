import { calcU32DByte, decodeU32D, encodeU32DInto } from "../../varints/mod.ts";
import { DataType, VOID_ID, DecodeError } from "../const.ts";
import { JbodWriter, fastDecodeJbod, jbodDecoder } from "./jbod.ts";
import type { DecodeResult } from "../../type.ts";
import type { EncodeContext, DecodeContext, DataWriter, DataWriterCreator, DecodeFn, Defined } from "../type.ts";
type Key = string | number | symbol;
export type StructDecodeInfo = {
  decode: number | DecodeFn | Record<number, StructDecodeInfo>;
  key: Key;
  repeat: boolean;
};
export type StructEncodeInfo = {
  encode: number | DataWriterCreator | StructEncodeInfo[];
  id: number;
  optional: boolean;
  repeat: boolean;
  key: Key;
};
class RepeatWriter implements DataWriter {
  constructor(private writers: DataWriter[], public byteLength: number) {
    this.byteLength += calcU32DByte(writers.length);
  }
  encodeTo(buf: Uint8Array, offset: number): number {
    const writer = this.writers;
    offset = encodeU32DInto(writer.length, buf, offset);
    for (let i = 0; i < writer.length; i++) {
      offset = writer[i].encodeTo(buf, offset);
    }
    return offset;
  }
}
function decodeRepeat<T = void>(
  buf: Uint8Array,
  offset: number,
  ctx: DecodeContext,
  decode: (buf: Uint8Array, offset: number, ctx: DecodeContext, type: T) => DecodeResult,
  type: T
): DecodeResult {
  let lenRes = decodeU32D(buf, offset);
  const len = lenRes.value;
  offset += lenRes.byte;
  let res: DecodeResult;
  let value: any[] = [];
  for (let i = 0; i < len; i++) {
    res = decode(buf, offset, ctx, type);
    offset = res.offset;
    value[i] = res.data;
  }
  return { data: value, offset };
}
class BoolWriter implements DataWriter {
  constructor(private value: boolean) {}
  encodeTo(buf: Uint8Array, offset: number): number {
    buf[offset] = this.value ? DataType.true : DataType.false;
    return offset + 1;
  }
  byteLength = 1;
}
function decodeBool(buf: Uint8Array, offset: number): DecodeResult {
  let data = buf[offset++] === DataType.true;
  return { data, offset };
}
export class StructWriter implements DataWriter {
  constructor(encodeStruct: StructEncodeInfo[], data: object, ctx: EncodeContext);
  constructor(encodeStruct: StructEncodeInfo[], data: Record<Key, any>, ctx: EncodeContext) {
    let len = 1;
    let ids: number[] = [];
    let dataWriter: DataWriter[] = [];
    let res: DataWriter;

    let info: StructEncodeInfo;
    let value;
    let y = 0;
    for (let i = 0; i < encodeStruct.length; i++) {
      info = encodeStruct[i];
      value = data[info.key];
      if (value === undefined) {
        if (info.optional) continue;
        else throw new Error(`The field '${String(info.key)}' cannot be undefined`);
      }
      res = this.getWriter(value, info, ctx);

      len += calcU32DByte(info.id) + res.byteLength;
      ids[y] = info.id;
      dataWriter[y] = res;
      y++;
    }

    this.byteLength = len;
    this.writers = dataWriter;
    this.ids = ids;
  }
  private getWriter(value: any, define: StructEncodeInfo, ctx: EncodeContext): DataWriter {
    let encoder: DataWriterCreator;
    switch (typeof define.encode) {
      case "number": {
        if (define.encode === DataType.true) encoder = BoolWriter; //bool
        else encoder = ctx[define.encode]; //defined type
        break;
      }
      case "function": {
        // any or custom
        encoder = define.encode;
        break;
      }
      case "object": {
        let res: DataWriter;
        if (define.repeat) {
          let totalLen = calcU32DByte(value.length);
          const writers: DataWriter[] = [];
          for (let i = 0; i < value.length; i++) {
            writers[i] = new StructWriter(define.encode, value[i], ctx);
            totalLen += writers[i].byteLength;
          }
          return new RepeatWriter(writers, totalLen);
        } else res = new StructWriter(define.encode, value, ctx);
        return res;
      }

      default:
        throw new Error("encode field error");
    }
    if (define.repeat) {
      let totalLen = 0;
      const writers: DataWriter[] = [];
      for (let i = 0; i < value.length; i++) {
        writers[i] = new encoder(value[i], ctx);
        totalLen += writers[i].byteLength;
      }
      return new RepeatWriter(writers, totalLen);
    } else return new encoder(value, ctx);
  }
  private ids: number[];
  private writers: DataWriter[];
  readonly byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    const ids = this.ids;
    const writers = this.writers;
    for (let i = 0; i < writers.length; i++) {
      offset = encodeU32DInto(ids[i], buf, offset);
      offset = writers[i].encodeTo(buf, offset);
    }
    buf[offset++] = VOID_ID;
    return offset;
  }
}

export function decodeStruct<T = any>(
  buf: Uint8Array,
  offset: number,
  ctx: DecodeContext,
  struct: Record<number, StructDecodeInfo>
): DecodeResult<T> {
  let obj: Record<Key, any> = {};
  let idRes = decodeU32D(buf, offset);
  let info: StructDecodeInfo | undefined;
  let value: DecodeResult;
  while (idRes.value > 0) {
    info = struct[idRes.value];
    if (!info) throw new DecodeError(offset, "Undefined field ID: " + idRes.value);
    offset += idRes.byte;

    switch (typeof info.decode) {
      case "number": {
        if (info.repeat) value = decodeRepeat(buf, offset, ctx, fastDecodeJbod, info.decode);
        else value = fastDecodeJbod(buf, offset, ctx, info.decode);
        break;
      }
      case "function":
        if (info.repeat) value = decodeRepeat(buf, offset, ctx, info.decode, undefined);
        else value = info.decode(buf, offset, ctx);
        break;
      case "object":
        if (info.repeat) value = decodeRepeat(buf, offset, ctx, decodeStruct, info.decode);
        else value = decodeStruct(buf, offset, ctx, info.decode);
        break;
      default:
        throw new DecodeError(offset, "decode field error");
    }

    obj[info.key] = value.data;
    offset = value.offset;

    idRes = decodeU32D(buf, offset);
  }
  offset += idRes.byte;
  return {
    data: obj,
    offset,
  };
}

function initStructDefineItem(
  value: StructDefined,
  key: string,
  opts: DefinedOpts
): {
  encode: StructEncodeInfo;
  decode: StructDecodeInfo;
} {
  let type = value.type === "any" ? undefined : value.type;
  let encoder: StructEncodeInfo["encode"];
  let decoder: StructDecodeInfo["decode"];
  switch (typeof type) {
    case "string": {
      let code = FIELD_TYPE_MAP[type];
      if (typeof code !== "number") throw new Error("Invalid type: " + type);
      if (code === DataType.true) {
        encoder = BoolWriter;
        decoder = decodeBool;
      } else {
        // jbod 类型
        decoder = code;
        encoder = code;
      }
      break;
    }

    case "object":
      if (type instanceof StructType) {
        // 自定义编解码
        decoder = type.decoder;
        encoder = type.encoder;
      } else {
        //结构体
        const res = defineStruct(type, opts);
        decoder = res.decodeDefined;
        encoder = res.encodeDefined;
      }
      break;

    default:
      encoder = JbodWriter;
      decoder = jbodDecoder;
      break;
  }

  return {
    decode: { decode: decoder, repeat: value.repeat ?? false, key },
    encode: {
      encode: encoder,
      repeat: value.repeat ?? false,
      id: value.id,
      optional: value.optional === undefined ? !opts.required : Boolean(value.optional),
      key,
    },
  };
}
type DefinedOpts = {
  required?: boolean;
};
/* @__NO_SIDE_EFFECTS__ */
export function defineStruct(definedMap: Struct, opts: DefinedOpts = {}) {
  const optional = !opts.required;
  const keys = Object.keys(definedMap);
  const encodeDefined: StructEncodeInfo[] = [];
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
      encodeItem = { encode: JbodWriter, repeat: false, id: value, optional, key };
      decodeItem = { decode: jbodDecoder, repeat: false, key };
    } else if (typeof value === "object") {
      const res = initStructDefineItem(value, key, opts);
      encodeItem = res.encode;
      decodeItem = res.decode;
    } else throw new Error(`[${key}]定义错误`);

    if (encodeItem.id <= 0) throw new Error(`[${key}]无效id`);
    if (encodeItem.id % 1 !== 0) throw new Error(`[${key}]无效id`);

    encodeDefined[i] = encodeItem;
    decodeDefined[encodeItem.id] = decodeItem;
  }
  return { encodeDefined, decodeDefined };
}
const FIELD_TYPE_MAP = {
  any: VOID_ID,

  bool: DataType.true,
  f32: DataType.f32,
  f64: DataType.f64,
  dyI64: DataType.dyI64,
  dyI32: DataType.dyI32,
  binary: DataType.binary,
  string: DataType.string,
  anyArray: DataType.anyArray,
  anyRecord: DataType.anyRecord,

  i32: DataType.i32,
  i64: DataType.i64,

  error: DataType.error,
  map: DataType.map,
  set: DataType.set,
  regExp: DataType.regExp,
};
/** JBOD类型描述
 *  @public */
export type StructFieldType = keyof typeof FIELD_TYPE_MAP;
/** Struct 定义
 *  @public */
export type StructDefined = {
  /** 值类型 */
  type?: StructType | Struct | StructFieldType;
  id: number;
  /** 键是否可选 */
  optional?: boolean;
  repeat?: boolean;
};
/** 结构类型-描述对象结构
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
/** Struct 自定义类型
 * @public */
export class StructType<T = any> {
  constructor(defined: Defined) {
    this.decoder = defined.decoder;
    this.encoder = defined.encoder;
  }
  encoder: DataWriterCreator<T>;
  decoder: DecodeFn<T>;
}
