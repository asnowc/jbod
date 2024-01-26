import { DataType, IterableDataType, UnsupportedDataTypeError } from "../const.js";
import { JbodAsyncParser } from "./data_trans/async_parser.js";
import { JbodDecoder } from "./data_trans/decoder.js";
import { JbodEncoder } from "./data_trans/encoder.js";
import type { JbodAsyncIteratorArrayItem, JbodAsyncIteratorItem, JbodAsyncIteratorValue } from "./type.js";

type StreamReader = (size: number) => Promise<Uint8Array>;

const defaultDecoder = new JbodDecoder();
const asyncParser = new JbodAsyncParser();
export * from "./data_trans/encoder.js";
export { type JbodAsyncIteratorItem };

const defaultEncoder = new JbodEncoder();
export default {
  /**
   * @public
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  parse: function paseJbod<T = unknown>(buffer: Uint8Array, type?: DataType): { data: T; offset: number } {
    if (!(buffer instanceof Uint8Array)) throw new Error("The parameter must be of Uint8Array type");
    let offset = 0;
    if (type === undefined) {
      type = buffer[0];
      offset = 1;
    }
    return defaultDecoder.paseItem(type, buffer, offset);
  },
  /**
   * @public
   * @remarks 异步解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  parseAsync: async function paseJbodAsync<T = unknown>(read: StreamReader, type?: DataType): Promise<T> {
    if (!type) type = (await read(1))[0];
    return asyncParser.paseItem(type, read);
  },
  scanAsync: async function* scanJbodAsync(
    read: StreamReader,
    type?: IterableDataType
  ): AsyncGenerator<JbodAsyncIteratorItem, void, void> {
    if (type === undefined) type = (await read(1))[0];

    switch (type) {
      case DataType.dyArray:
        return yield* scanList(read);
      case DataType.set:
        return yield* scanList(read);
      case DataType.dyRecord:
        return yield* scanObject(read);
      case DataType.map:
        return yield* scanMap(read);
      default:
        throw new UnsupportedDataTypeError(DataType[type] ?? type);
    }
  },
  encodeInto: defaultEncoder.encodeInto.bind(defaultEncoder),
  calcLen: defaultEncoder.calcLen.bind(defaultEncoder),

  /**
   *
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  getType: defaultEncoder.toTypeCode,
  /**
   * @public
   * @remarks 将数据转为带类型的的完整二进制数据
   */
  binaryify: function binaryifyJbod(data: any) {
    const type = defaultEncoder.toTypeCode(data);
    let res = defaultEncoder.calcLen(data);
    const buf = new Uint8Array(res.byteLength + 1);
    defaultEncoder.encodeInto(res, buf.subarray(1));
    buf[0] = type;
    return buf;
  },
  /**
   * @public
   * @remarks 将数据转为不带类型的二进制数据
   */
  binaryifyContent: function binaryifyJbodContent(data: any) {
    let res = defaultEncoder.calcLen(data);
    const buf = new Uint8Array(res.byteLength);
    defaultEncoder.encodeInto(res, buf);
    return buf;
  },
};

async function genIteratorItem(read: StreamReader, type: DataType, key: any): Promise<JbodAsyncIteratorItem> {
  let value: any;
  switch (type) {
    case DataType.dyArray:
      value = scanList(read);
      break;
    case DataType.set:
      value = scanList(read);
      break;
    case DataType.dyRecord:
      value = scanObject(read);
      break;
    case DataType.map:
      value = scanMap(read);
      break;
    default: {
      return {
        key,
        isIterator: false,
        dataType: type,
        value: await asyncParser.paseItem(type, read),
      };
    }
  }
  return { dataType: type, key, value, isIterator: true } as JbodAsyncIteratorItem;
}
async function* scanList(read: StreamReader): JbodAsyncIteratorArrayItem["value"] {
  let key = 0;
  do {
    const type = (await read(1))[0];
    if (type === DataType.void) break;
    yield genIteratorItem(read, type, key++);
  } while (true);
}
async function* scanObject(read: StreamReader): JbodAsyncIteratorValue["value"] {
  let key: string;
  do {
    const type = (await read(1))[0];
    if (type === DataType.void) break;
    key = (await asyncParser[DataType.string](read)) as string;
    yield genIteratorItem(read, type, key);
  } while (true);
}
async function* scanMap(read: StreamReader): JbodAsyncIteratorValue["value"] {
  do {
    const keyType = (await read(1))[0];
    if (keyType === DataType.void) break;
    const key = await asyncParser[keyType](read); //todo: 异常处理
    const type = (await read(1))[0];

    yield genIteratorItem(read, type, key);
  } while (true);
}
