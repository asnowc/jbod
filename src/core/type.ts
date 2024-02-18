import { DataType } from "./const.js";
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

export interface Encoder<Q = any, T extends { byteLength: number } = { byteLength: number }> {
  byteLength(data: Q): T;
  encodeInto(calcRes: T, buf: Uint8Array, offset?: number): number;
}
export type Decoder<T = any> = { decode(buf: Uint8Array, offset: number): DecodeResult<T> };
export type DecodeResult<T = any> = { data: T; offset: number };
/**
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
  [key: string]:
    | {
        type?: DataType | (Encoder & Decoder);
        id: number;
        optional?: boolean;
      }
    | number;
};
