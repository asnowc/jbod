import { DataType } from "./const.ts";
import { Defined } from "./type.ts";
import { binary, string, dyI32, dyI64 } from "./data_types/dy_len.ts";
import { f64, i32, i64, createNoContent } from "./data_types/fixed_len.ts";
export { NO_CONTENT } from "./data_types/fixed_len.ts";
import { dyArray, dyRecord } from "./data_types/repeat.ts";
import { error, regExp, symbol, jsMap, jsSet } from "./data_types/js_extra.ts";

/** @internal */
export const DEFAULT_TYPE: Record<number, Defined> = {
  [DataType.true]: createNoContent<true>((buf, offset) => ({ data: true, offset })),
  [DataType.false]: createNoContent<false>((buf, offset) => ({ data: false, offset })),
  [DataType.null]: createNoContent<null>((buf, offset) => ({ data: null, offset })),
  [DataType.dyI32]: dyI32,
  [DataType.dyI64]: dyI64,
  [DataType.i32]: i32,
  [DataType.i64]: i64,
  [DataType.f64]: f64,
  [DataType.string]: string,
  [DataType.binary]: binary,

  [DataType.anyArray]: dyArray,
  [DataType.anyRecord]: dyRecord,
};
/** @internal */
export const JS_OBJECT_EXTRA_TYPE: Record<number, Defined> = {
  [DataType.undefined]: createNoContent<undefined>((buf, offset) => ({ data: undefined, offset })),
  [DataType.map]: jsMap,
  [DataType.set]: jsSet,
  [DataType.regExp]: regExp,
  [DataType.error]: error,
  [DataType.symbol]: symbol,
};
export * from "./data_types/jbod.ts";
export * from "./data_types/struct.ts";
export * from "./type.ts";
