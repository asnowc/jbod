import { DataType } from "./const.js";
import { Defined } from "./type.js";
import { binary, string } from "./data_types/dy_len.js";
import { f64, i32, i64, createNoContent } from "./data_types/fixed_len.js";
export { NO_CONTENT } from "./data_types/fixed_len.js";
import { dyArray, dyRecord, jsMap, jsSet } from "./data_types/repeat.js";
import { error, regExp, symbol } from "./data_types/js_extra.js";

export const DEFAULT_TYPE: Record<number, Defined> = {
  [DataType.true]: createNoContent<true>((buf, offset) => ({ data: true, offset })),
  [DataType.false]: createNoContent<false>((buf, offset) => ({ data: false, offset })),
  [DataType.null]: createNoContent<null>((buf, offset) => ({ data: null, offset })),

  [DataType.i32]: i32,
  [DataType.i64]: i64,
  [DataType.f64]: f64,
  [DataType.string]: string,
  [DataType.binary]: binary,

  [DataType.dyArray]: dyArray,
  [DataType.dyRecord]: dyRecord,
};
export const JS_OBJECT_EXTRA_TYPE: Record<number, Defined> = {
  [DataType.undefined]: createNoContent<undefined>((buf, offset) => ({ data: undefined, offset })),
  [DataType.map]: jsMap,
  [DataType.set]: jsSet,
  [DataType.regExp]: regExp,
  [DataType.error]: error,
  [DataType.symbol]: symbol,
};
export * from "./data_types/jbod.js";
export * from "./data_types/struct.js";
export * from "./type.js";
