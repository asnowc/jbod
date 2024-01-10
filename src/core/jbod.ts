import { DataType, UnsupportedDataTypeError } from "../const.js";
import { VOID } from "./internal_type.js";
import { JbodAsyncParser } from "./data_trans/async_parser.js";
import { JbodParser } from "./data_trans/parser.js";
import { JbodWriter } from "./data_trans/writer.js";
import type {
  JbodAsyncIteratorArrayItem,
  JbodAsyncIteratorItem,
  JbodAsyncIteratorValue,
  JbodIteratorItem,
} from "./type.js";

type StreamReader = (size: number) => Promise<Uint8Array>;

const syncParser = new JbodParser();
const asyncParser = new JbodAsyncParser();
const writer = new JbodWriter();

/**
 * @public
 * @remarks 使用迭代器迭代读取数据项
 */
function scanJbodAsync<R = unknown>(
  read: StreamReader,
  type?: DataType
): AsyncGenerator<JbodAsyncIteratorItem, R, void>;
async function* scanJbodAsync(
  read: StreamReader,
  type?: DataType
): AsyncGenerator<JbodAsyncIteratorItem, unknown, void> {
  if (type === undefined) type = (await read(1))[0];
  if (type === DataType.void) return VOID;

  if (type === DataType.array) return yield* scanArray(read);
  else if (type === DataType.map) return yield* scanMap(read);
  else if (typeof asyncParser[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
  else return asyncParser[type](read);
}

export { type JbodAsyncIteratorItem };
export default {
  /**
   * @public
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  parse: function paseJbod<T = unknown>(buffer: Uint8Array, type?: DataType): { data: T; offset: number } {
    if (!(buffer instanceof Uint8Array)) throw new Error("The parameter must be of Uint8Array type");
    let res;
    if (type === undefined) res = syncParser.readItem(buffer, 0);
    else res = syncParser[type](buffer, 0);
    return {
      data: res[0],
      offset: res[1],
    };
  },
  /**
   * @public
   * @remarks 异步解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  parseAsync: async function paseJbodAsync<T = unknown>(read: StreamReader, type?: DataType): Promise<T> {
    if (!type) type = (await read(1))[0];
    if (type === DataType.void) return VOID as any;
    if (typeof asyncParser[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
    return asyncParser[type](read);
  },
  scanAsync: scanJbodAsync,
  /**
   *
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  getType: function getJbodType(data: any) {
    return writer.toType(data);
  },
  /**
   * @public
   * @remarks 将数据转为带类型的的完整二进制数据
   */
  binaryify: function binaryifyJbod(data: any) {
    const [write, concat] = collectDebris();
    writer.writeItem(data, write);
    return concat();
  },
  /**
   * @public
   * @remarks 将数据转为不带类型且无结尾(array 和 map 的结尾标识)的的的二进制数据
   */
  binaryifyContent: function binaryifyJbodContent(data: any) {
    const [write, concat] = collectDebris();
    const type = writer.toType(data) as DataType;
    writer[type](data, write, true);
    return concat();
  },
};
function collectDebris(): [(data: Uint8Array) => void, () => Uint8Array] {
  let bufferList: Uint8Array[] = [];
  let totalSize = 0;
  function write(data: Uint8Array) {
    bufferList.push(data);
    totalSize += data.byteLength;
  }
  function concat() {
    if (bufferList.length === 1) {
      let value = bufferList[0];
      totalSize = 0;
      bufferList = [];
      return value;
    }
    const buf = new Uint8Array(totalSize);
    let offset = 0;
    for (let i = 0; i < bufferList.length; i++) {
      buf.set(bufferList[i], offset);
      offset += bufferList[i].byteLength;
    }
    totalSize = 0;
    bufferList = [];
    return buf;
  }

  return [write, concat];
}

async function genIteratorItem(read: StreamReader, type: DataType, key: string | number): Promise<JbodIteratorItem> {
  let value: unknown;
  let isIterator = true;
  if (type === DataType.array) value = scanArray(read);
  else if (type === DataType.map) value = scanMap(read);
  else if (typeof asyncParser[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
  else {
    value = await asyncParser[type](read);
    isIterator = false;
  }
  return { dataType: type, key, value, isIterator } as JbodIteratorItem;
}
async function* scanArray(read: StreamReader): JbodAsyncIteratorArrayItem["value"] {
  const arr: unknown[] = [];
  let key = 0;
  do {
    const type = (await read(1))[0];
    if (type === DataType.void) break;
    const item = await genIteratorItem(read, type, key);
    const value = item.value;
    yield item;
    arr[key++] = value;
  } while (true);

  return arr;
}
async function* scanMap(read: StreamReader): JbodAsyncIteratorValue["value"] {
  const map: Record<string, unknown> = {};
  let key: string;
  do {
    const type = (await read(1))[0];
    if (type === DataType.void) break;
    key = (await asyncParser[DataType.string](read)) as string;
    const item = await genIteratorItem(read, type, key);
    let value = item.value;
    yield item;
    map[key] = value;
  } while (true);

  return map as any;
}
