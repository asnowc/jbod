import { DataType, IterableDataType, UnsupportedDataTypeError, VOID_ID } from "../../const.js";
import { JbodAsyncParser } from "./async_parser.js";
import type { JbodAsyncIteratorArrayItem, JbodAsyncIteratorItem, JbodAsyncIteratorValue } from "../../type.js";

const asyncParser = new JbodAsyncParser();
type StreamReader = (size: number) => Promise<Uint8Array>;
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
    if (type === VOID_ID) break;
    yield genIteratorItem(read, type, key++);
  } while (true);
}
async function* scanObject(read: StreamReader): JbodAsyncIteratorValue["value"] {
  let key: string;
  do {
    const type = (await read(1))[0];
    if (type === VOID_ID) break;
    key = (await asyncParser[DataType.string](read)) as string;
    yield genIteratorItem(read, type, key);
  } while (true);
}
async function* scanMap(read: StreamReader): JbodAsyncIteratorValue["value"] {
  do {
    const keyType = (await read(1))[0];
    if (keyType === VOID_ID) break;
    const key = await asyncParser[keyType](read); //todo: 异常处理
    const type = (await read(1))[0];

    yield genIteratorItem(read, type, key);
  } while (true);
}
/**
 * @public
 * @remarks 异步解析数据
 * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
 */
export async function paseJbodAsync<T = unknown>(read: StreamReader, type?: DataType): Promise<T> {
  if (!type) type = (await read(1))[0];
  return asyncParser.paseItem(type, read);
}
export async function* scanJbodAsync(
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
}
