/**
 * @public
 * @remarks JBOD 数据类型
 */
export enum DataType {
  /** @internal 内部类型*/
  void = 0,
  null = 1,
  undefined = 2,
  true = 3,
  false = 4,
  int = 5,
  bigint = 6,
  double = 7,

  /** @internal 保留类型*/
  objectId = 8,

  arrayBuffer = 9,
  string = 10,
  regExp = 11,
  /** @internal 保留类型*/
  function = 12,
  array = 13,
  map = 14,

  error = 16,
  symbol = 17,
}

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
