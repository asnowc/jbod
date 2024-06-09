/** JBOD 数据类型
 * @public
 */
export enum DataType {
  null = 1,

  true = 3,
  false = 4,
  f32 = 5,
  f64 = 6,
  dyI32 = 7,
  dyI64 = 8,
  binary = 9,
  string = 10,
  array = 11,
  record = 12,
  /** @deprecated 改用 anyArray */
  dyArray = 13,
  anyArray = 13,
  /** @deprecated 改用 anyRecord */
  dyRecord = 14,
  anyRecord = 14,

  i32 = 0b1_0100,
  i64 = 0b1_0111,

  error = 0b10_0000,
  map = 0b10_0001,
  set = 0b10_0010,
  regExp = 0b10_0011,
  /** @internal js 保留类型*/
  function = 0b10_0100,
  symbol = 0b10_0101,
  undefined = 0b10_0110,
}
export const VOID_ID = 0;

/** 当读取到一个未知类型的错误
 * @public
 */
export class UnsupportedDataTypeError extends Error {
  constructor(desc?: string | number) {
    super("Unsupported data type: " + desc);
  }
}
/** 远程发送的异常类型
 * @public
 * @deprecated 已弃用
 */
export const JbodError = Error;
export { DecodeError } from "../const.ts";
