/** @public */
export interface JbodEncoderConfig {
  customObjet?: DefinedDataTypeMap;
}

/** @public */
export type DefinedDataType = {
  calculator: Calc.Calculator;
  encoder: EncodeFn;
  class?: new (...args: any[]) => object;
};
export type DefinedDataTypeMap = Record<number, DefinedDataType>;

export namespace Calc {
  export interface ClassType {
    code: number;
    class: new (...args: any[]) => object;
  }
  export type CalcMap = {
    customClassType: ClassType[];
    byteLength(data: any): Result;
    [key: number]: Calculator;
  };
  export type Calculator = (this: CalcMap, data: any) => Result;
  export type Result<T = any> = {
    byteLength: number;
    pretreatment: T;
    type: number;
  };
}
export type EncodeFn = (this: EncoderMap, data: any, buf: Uint8Array, offset: number) => number;
export type EncoderMap = {
  [key: number]: EncodeFn;
};
