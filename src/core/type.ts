import { DataType } from "../const.js";
export interface JbodIteratorBasicItem<V = unknown, K = string | number> {
  dataType: number;
  key?: K;
  value: V;
  isIterator: false;
}
export interface JbodAsyncIteratorArrayItem {
  dataType: DataType.array | DataType.set;
  key: number;
  value: AsyncGenerator<JbodAsyncIteratorItem, void, void>;
  isIterator: true;
}
export interface JbodAsyncIteratorValue<K = string> {
  dataType: DataType.object | DataType.map;
  key: K;
  value: AsyncGenerator<JbodAsyncIteratorItem, void, void>;
  isIterator: true;
}

export interface JbodIteratorArrayItem {
  dataType: DataType.array;
  key: number;
  value: Generator<JbodIteratorItem, void, void>;
  isIterator: true;
}
export interface JbodIteratorMapValue<K = string> {
  dataType: DataType.object;
  key: K;
  value: Generator<JbodIteratorItem, void, void>;
  isIterator: true;
}
export type JbodIteratorItem = JbodIteratorBasicItem | JbodIteratorArrayItem | JbodIteratorMapValue;
/** @public */
export type JbodAsyncIteratorItem = JbodIteratorBasicItem | JbodAsyncIteratorArrayItem | JbodAsyncIteratorValue;
