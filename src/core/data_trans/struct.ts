import type { DecodeResult, Encoder, Decoder, DataWriter } from "../type.js";
import {
  StructDefined,
  Struct,
  StructType,
  StructDecodeInfo,
  StructEncodeDefine,
  StructWriter,
  defineStruct,
  decodeStruct,
} from "./defined/mod.js";
import { DecodeContext, EncodeContext, createContext } from "./ctx.js";
/** @public */
export class StructTrans<T extends object = any> implements Encoder, Decoder {
  static define<T extends object>(definedMap: Struct, opts: { required?: boolean } = {}): StructTrans<T> {
    const { decodeDefined, encodeDefined } = defineStruct(definedMap, opts);
    return new this(encodeDefined, decodeDefined);
  }
  private encContext: EncodeContext;
  private decContext: DecodeContext;
  private constructor(
    private encodeDefine: StructEncodeDefine,
    private decodeDefine: Record<number, StructDecodeInfo>
  ) {
    const { dec, enc } = createContext();
    this.encContext = enc;
    this.decContext = dec;
  }
  /** @deprecated 改用 createWriter()*/
  byteLength(data: T): { byteLength: number; pretreatment: unknown };
  byteLength(data: Record<string | number | symbol, any>) {
    const writer = new StructWriter(this.encodeDefine, data, this.encContext);
    return { byteLength: writer.byteLength, pretreatment: writer };
  }
  /** @deprecated 改用 createWriter()*/
  encodeInto(calcRes: { byteLength: number; pretreatment: unknown }, buf: Uint8Array, offset?: number): number;
  encodeInto(calcRes: { byteLength: number; pretreatment: StructWriter }, buf: Uint8Array, offset = 0): number {
    return calcRes.pretreatment.encodeTo(buf, offset);
  }

  encode(data: T): Uint8Array {
    const writer = new StructWriter(this.encodeDefine, data, this.encContext);
    const u8Arr = new Uint8Array(writer.byteLength);
    writer.encodeTo(u8Arr, 0);
    return u8Arr;
  }
  decode(buf: Uint8Array, offset: number = 0): DecodeResult<T> {
    return decodeStruct(buf, offset, this.decodeDefine, this.decContext) as DecodeResult;
  }
  createWriter(data: any): DataWriter {
    return new StructWriter(this.encodeDefine, data, this.encContext);
  }
}
export type { Struct, StructType, StructDefined };
