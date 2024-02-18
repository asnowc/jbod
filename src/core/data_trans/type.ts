import type { DecodeResult, Encoder } from "../type.js";

/** @internal */
export type DefinedDataType = {
  calculator: Calc.Fn;
  encoder: Enc.Fn;
  decoder: Dec.Fn;
  class?: ClassType;
};

type ClassType = new (...args: any[]) => object;
type Decoder = {
  decode(buf: Uint8Array, offset: number): DecodeResult;
};
export type EncodeFn = (data: any, buf: Uint8Array, offset: number) => number;

export namespace Struct {
  export type Key = string | number | symbol;
  export type DecodeValue = { decode?: number | Decoder; key: Key };
  export type EncodeValue = { encode: number | Encoder; id: number; optional?: boolean };
  export type EncodeDefine = Map<Key, EncodeValue>;
  export type DecodeDefine = Record<number, DecodeValue>;

  export type CalcResult = { byteLength: number; pretreatment: Map<number, PreDataItem> };
  export type PreDataItem = {
    byteLength: number;
    pretreatment: unknown;
    enc: EncodeValue;
    type: Encoder | number;
  };
}

export namespace Calc {
  export interface DefineClass {
    code: number;
    class: ClassType;
  }

  export type Fn = (this: Context, data: any) => Result;
  export type Result<T = any> = {
    byteLength: number;
    pretreatment: T;
    type: number;
  };
  export type DefineMap = {
    customClassType: Calc.DefineClass[];
    [key: number]: Calc.Fn;
  };
  export type Context = {
    customClassType: Calc.DefineClass[];
    byteLength(data: any): Calc.Result;
    calcStruct(this: Context, data: object, struct: Map<Struct.Key, Struct.EncodeValue>): Struct.CalcResult;
    [key: number]: Calc.Fn;
  };
}
export namespace Enc {
  export type Fn = (this: Context, data: any, buf: Uint8Array, offset: number) => number;
  export type Context = {
    [key: number]: Enc.Fn;
    encodeStruct(data: Struct.CalcResult["pretreatment"], buf: Uint8Array, offset: number): number;
  };
}
export namespace Dec {
  export type Fn = (this: Context, buf: Uint8Array, offset: number) => DecodeResult<any>;
  export type Context = {
    [key: number]: Fn;
    decodeItem(buf: Uint8Array, offset: number, type: number): DecodeResult;
    decodeStruct<T = any>(this: Context, buf: Uint8Array, offset: number, struct: Struct.DecodeDefine): DecodeResult<T>;
  };
}
