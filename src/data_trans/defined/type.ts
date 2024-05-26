import { DecodeResult, DataWriter } from "../../type.ts";
export type DataWriterCreator<T = any> = new (data: T, ctx: EncodeContext) => DataWriter;
export interface TypeDataWriter extends DataWriter {
  type: number;
}
export type { DataWriter };
export type DecodeFn<T = any> = (buf: Uint8Array, offset: number, ctx: DecodeContext) => DecodeResult<T>;

export type EncodeFn<T = any> = (data: T, buf: Uint8Array, offset: number) => number;
export interface EncodeContext {
  [key: number]: DataWriterCreator;
  toTypeCode(data: any): number;
  classTypes: Map<ClassType, number>;
}
export interface DecodeContext {
  [key: number]: DecodeFn;
}
/** @internal */
export type Defined<T = any> = {
  encoder: DataWriterCreator<T>;
  decoder: DecodeFn<T>;
  class?: ClassType;
};
type ClassType = new (...args: any[]) => object;
