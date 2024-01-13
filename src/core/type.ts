import { DataType } from "../const.js";

export interface JbodAsyncIteratorBasicItem<V = unknown> {
  dataType: number;
  key?: number | string;
  value: V;
  isIterator: false;
}
export interface JbodAsyncIteratorArrayItem<T = unknown> {
  dataType: DataType.array;
  key: number;
  value: AsyncGenerator<JbodIteratorItem, T[], void>;
  isIterator: true;
}
export interface JbodAsyncIteratorValue<T = unknown> {
  dataType: DataType.object;
  key: string;
  value: AsyncGenerator<JbodIteratorItem, Record<string, T>, void>;
  isIterator: true;
}
export interface JbodIteratorBasicItem<V = unknown> {
  dataType: number;
  key?: number | string;
  value: V;
  isIterator: false;
}
export interface JbodIteratorArrayItem<T = unknown> {
  dataType: DataType.array;
  key: number;
  value: AsyncGenerator<JbodIteratorItem, T[], void>;
  isIterator: true;
}
export interface JbodIteratorMapValue<T = unknown> {
  dataType: DataType.object;
  key: string;
  value: AsyncGenerator<JbodIteratorItem, Record<string, T>, void>;
  isIterator: true;
}
export type JbodIteratorItem = JbodIteratorBasicItem | JbodIteratorArrayItem | JbodIteratorMapValue;
/** @public */
export type JbodAsyncIteratorItem = JbodAsyncIteratorBasicItem | JbodAsyncIteratorArrayItem | JbodAsyncIteratorValue;
