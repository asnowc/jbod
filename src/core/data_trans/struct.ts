import { createEncMaps } from "./defined.js";
import type { DecodeResult, Encoder, Decoder, Struct } from "../type.js";
import { Calc, Dec, Enc, Struct as Stru } from "./type.js";
import { createCalcContext, createDecContext, createEncContext, defineStruct } from "./base_trans.js";
import { FieldType } from "../const.js";

/** @public */
export class StructEncoder<T extends object = any> implements Encoder, Decoder {
  static define<T extends object>(definedMap: Struct, opts: { required?: boolean } = {}): StructEncoder<T> {
    const { decodeDefined, encodeDefined } = defineStruct(definedMap, opts);
    return new this(encodeDefined, decodeDefined);
  }
  private calcContext: Calc.Context;
  private encContext: Enc.Context;
  private decContext: Dec.Context;
  private constructor(private encodeDefine: Stru.EncodeDefine, private decodeDefine: Stru.DecodeDefine) {
    const { calcMap, encMap, decMap } = createEncMaps();
    this.calcContext = createCalcContext(calcMap);
    this.encContext = createEncContext(encMap);
    this.decContext = createDecContext(decMap);
  }
  byteLength(data: T): { byteLength: number; pretreatment: unknown };
  byteLength(data: Record<string | number | symbol, any>): Stru.CalcResult {
    return this.calcContext.calcStruct(data, this.encodeDefine);
  }
  encodeInto(calcRes: { byteLength: number; pretreatment: unknown }, buf: Uint8Array, offset?: number): number;
  encodeInto(calcRes: Stru.CalcResult, buf: Uint8Array, offset = 0): number {
    return this.encContext.encodeStruct(calcRes.pretreatment, buf, offset);
  }
  encode(data: T): Uint8Array {
    const res = this.byteLength(data);
    const u8Arr = new Uint8Array(res.byteLength);
    this.encodeInto(res, u8Arr);
    return u8Arr;
  }
  decode(buf: Uint8Array, offset: number = 0): DecodeResult<T> {
    return this.decContext.decodeStruct(buf, offset, this.decodeDefine);
  }
}
