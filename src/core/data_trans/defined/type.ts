import { DecodeResult, EncodeFn, DataWriter } from "../../type.js";
export type DataWriterCreator<T = any> = new (data: T, ctx: EncodeContext) => DataWriter;
export interface TypeDataWriter extends DataWriter {
  type: number;
}
export type { EncodeFn, DataWriter };
export type DecodeFn<T = any> = (this: DecodeContext, buf: Uint8Array, offset: number) => DecodeResult<T>;

export interface EncodeContext {
  [key: number]: DataWriterCreator;
  toTypeCode(data: any): number;
  JbodWriter: new (data: any, ctx: EncodeContext) => TypeDataWriter;
  classTypes: Map<ClassType, number>;
}
export interface DecodeContext {
  [key: number]: DecodeFn;
  decodeJbod: DecodeFn;
}
/** @internal */
export type Defined<T = any> = {
  encoder: DataWriterCreator<T>;
  decoder: DecodeFn<T>;
  class?: ClassType;
};
type ClassType = new (...args: any[]) => object;
