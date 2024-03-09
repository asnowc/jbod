/** @public */
export interface Encoder<T = any> {
  createWriter(data: T): DataWriter;
}
/** @public */
export type Decoder<T = any> = { decode(buf: Uint8Array, offset: number): DecodeResult<T> };
/** @public */
export type DecodeResult<T = any> = { data: T; offset: number };
/** @public */
export interface DataWriter {
  encodeTo(buf: Uint8Array, offset: number): number;
  readonly byteLength: number;
}
