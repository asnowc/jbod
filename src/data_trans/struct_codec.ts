import type { DecodeResult, Encoder, Decoder, DataWriter } from "../type.ts";
import {
  DefinedFiled,
  Struct,
  DefinedCodec,
  StructDecodeInfo,
  StructWriter,
  defineStruct,
  decodeStruct,
  StructEncodeInfo,
  DefinedType,
  DefinedOpts,
  DataTypeDesc,
  TypeDescMap,
} from "../defined/mod.ts";
import { DecodeContext, EncodeContext, createContext } from "./ctx.ts";
/**
 * 固定结构解码器
 * @public */
export class StructCodec<T extends object = any> implements Encoder, Decoder {
  // static define<T extends Struct>(definedMap: T, opts?: { required?: boolean }): InferStructType<T>;
  static define<T extends object>(definedMap: Struct, opts?: DefinedOpts): StructCodec<T>;
  static define(definedMap: Struct, opts: DefinedOpts = {}): StructCodec<any> {
    const { defaultOptional = false } = opts;
    const { decodeDefined, encodeDefined } = defineStruct(definedMap, { defaultOptional });
    return new this(encodeDefined, decodeDefined);
  }
  private encContext: EncodeContext;
  private decContext: DecodeContext;
  private constructor(
    private encodeDefine: StructEncodeInfo[],
    private decodeDefine: Record<number, StructDecodeInfo>
  ) {
    const { dec, enc } = createContext();
    this.encContext = enc;
    this.decContext = dec;
  }

  encode(data: T): Uint8Array {
    const writer = new StructWriter(this.encodeDefine, data, this.encContext);
    const u8Arr = new Uint8Array(writer.byteLength);
    writer.encodeTo(u8Arr, 0);
    return u8Arr;
  }
  decode(buf: Uint8Array, offset: number = 0): DecodeResult<T> {
    return decodeStruct(buf, offset, this.decContext, this.decodeDefine) as DecodeResult;
  }
  createWriter(data: any): DataWriter {
    return new StructWriter(this.encodeDefine, data, this.encContext);
  }

  /** @deprecated 改用 createWriter()*/
  byteLength(data: T): { byteLength: number; pretreatment: unknown };
  /** @deprecated 改用 createWriter()*/
  byteLength(data: Record<string | number | symbol, any>) {
    const writer = new StructWriter(this.encodeDefine, data, this.encContext);
    return { byteLength: writer.byteLength, pretreatment: writer };
  }
  /** @deprecated 改用 createWriter()*/
  encodeInto(calcRes: { byteLength: number; pretreatment: unknown }, buf: Uint8Array, offset?: number): number;
  /** @deprecated 改用 createWriter()*/
  encodeInto(calcRes: { byteLength: number; pretreatment: StructWriter }, buf: Uint8Array, offset = 0): number {
    return calcRes.pretreatment.encodeTo(buf, offset);
  }
}

/** StructCodec 的别名
 * @public
 * @deprecated 改用 StructCodec */
export const StructTrans = StructCodec;

export type {
  StructType,
  StructFieldType,
  StructDefined,
  Struct,
  DefinedCodec,
  DefinedFiled,
  DataTypeDesc,
  TypeDescMap,
} from "../defined/data_types/struct.ts";

// type GetFieldType<T> = T extends Defin keyof TypeMap ? TypeMap[T] : any;

//TODO 类型推断
type InferDefinedType<T> = T extends DefinedCodec<infer P>
  ? P
  : T extends keyof TypeDescMap
  ? TypeDescMap[T]
  : T extends Struct
  ? { [key in keyof T]: InferStructField<T[key]> }
  : unknown;

type InferStructField<T> = T extends number
  ? any
  : T extends DefinedFiled
  ? T["repeat"] extends true
    ? InferDefinedType<T["type"]>[]
    : InferDefinedType<T["type"]>
  : any;
const d = { k: { id: 1, type: { q: 8 } } } satisfies Struct;
type c = InferDefinedType<typeof d>;
