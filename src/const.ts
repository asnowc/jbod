/**
 * @public
 * @remarks JBOD 数据类型
 */
export enum DataType {
  /** @internal 内部类型*/
  void = 0,

  null = 1,

  true = 3,
  false = 4,
  f32 = 5,
  f64 = 6,
  dyNumR = 7,
  dyNum = 8,
  binary = 9,
  string = 10,
  array = 11,
  record = 12,
  dyArray = 13,
  dyRecord = 14,
  struct = 15,

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
/** @public */
export type IterableDataType = DataType.dyArray | DataType.dyRecord | DataType.set | DataType.map;
/**
 * @public
 * @remarks 当读取到一个未知类型的错误
 */
export class UnsupportedDataTypeError extends Error {
  constructor(desc?: string | number) {
    super("Unsupported data type: " + desc);
  }
}
/**
 * @public
 * @remarks 远程发送的异常类型
 */
export class JbodError extends Error {}
