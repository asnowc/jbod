import type { DataType } from "./data_trans/mod.js";
export interface JbodIteratorBasicItem<V = unknown, K = string | number> {
  dataType: number;
  key?: K;
  value: V;
  isIterator: false;
}
export interface JbodAsyncIteratorArrayItem {
  dataType: DataType.dyArray | DataType.set;
  key: number;
  value: AsyncGenerator<JbodAsyncIteratorItem, void, void>;
  isIterator: true;
}
export interface JbodAsyncIteratorValue<K = string> {
  dataType: DataType.dyRecord | DataType.map;
  key: K;
  value: AsyncGenerator<JbodAsyncIteratorItem, void, void>;
  isIterator: true;
}

export interface JbodIteratorArrayItem {
  dataType: DataType.dyArray;
  key: number;
  value: Generator<JbodIteratorItem, void, void>;
  isIterator: true;
}
export interface JbodIteratorMapValue<K = string> {
  dataType: DataType.dyRecord;
  key: K;
  value: Generator<JbodIteratorItem, void, void>;
  isIterator: true;
}
export type JbodIteratorItem = JbodIteratorBasicItem | JbodIteratorArrayItem | JbodIteratorMapValue;
export type JbodAsyncIteratorItem = JbodIteratorBasicItem | JbodAsyncIteratorArrayItem | JbodAsyncIteratorValue;

/** @public */
export interface Encoder<T = any> {
  createWriter(data: T): DataWriter;
}
/** @public */
export type Decoder<T = any> = { decode(buf: Uint8Array, offset: number): DecodeResult<T> };
/** @public */
export type DecodeResult<T = any> = { data: T; offset: number };

export type EncodeFn<T = any> = (data: T, buf: Uint8Array, offset: number) => number;
/** @public */
export interface DataWriter {
  encodeTo(buf: Uint8Array, offset: number): number;
  readonly byteLength: number;
}
