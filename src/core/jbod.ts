import { DataType, UnsupportedDataTypeError, VOID } from "../const.js";
import { JbodScanner } from "./data_trans/scanner.js";
import { JbodReader } from "./data_trans/reader.js";
import { JbodWriter } from "./data_trans/writer.js";

type StreamReader = (size: number) => Promise<Uint8Array>;

const syncReader = new JbodReader();
const jbodScanner = new JbodScanner();

/** @public */
export class JBOD {
  /**
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  static paseSync<T = unknown>(buffer: Uint8Array, type?: DataType): { data: T; offset: number } {
    if (!(buffer instanceof Uint8Array)) throw new Error("The parameter must be of Uint8Array type");
    let res;
    if (type === undefined) res = syncReader.readArrayItem(buffer, 0);
    else res = syncReader[type](buffer, 0);
    return {
      data: res[0],
      offset: res[1],
    };
  }

  static pase<T = unknown>(reader: StreamReader, type?: DataType): Promise<T> {
    if (type === undefined) return jbodScanner.readArrayItem(reader) as any;
    else return jbodScanner[type](reader) as any;
  }
  static iterator<R = unknown>(read: StreamReader, type?: DataType): AsyncGenerator<JbodAsyncIteratorItem, R, void>;
  static async *iterator(read: StreamReader, type?: DataType): AsyncGenerator<JbodAsyncIteratorItem, unknown, void> {
    if (type === undefined) type = (await read(1))[0];
    if (type === DataType.void) return VOID;

    if (type === DataType.array) return yield* scanArray(read);
    else if (type === DataType.map) return yield* scanMap(read);
    else if (typeof jbodScanner[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
    else return jbodScanner[type](read);
  }

  static getJbodType(data: any) {
    return writer.toType(data);
  }
}

const writer = new JbodWriter();

/**
 * @public
 * @remarks 将对象转为 array 类型的 JBOD. 顶层不写入类型
 * @param ignoreVoid - 如果为true, 则在Array结束位置忽略写入Void类型(仅在顶层忽略写入)
 */
export function toArrayJBOD(arr: any[], ignoreVoid?: boolean): Uint8Array {
  const [write, concat] = collectDebris();
  writer[DataType.array](arr, write, ignoreVoid);
  return concat();
}
/**
 * @public
 * @remarks 将对象类型转为 map 类型的 JBOD. 顶层不写入类型
 * @param ignoreVoid - 如果为true, 则在Map结束位置忽略写入Void类型(仅在顶层忽略写入)
 */
export function toMapJBOD(arr: object, ignoreVoid?: boolean) {
  const [write, concat] = collectDebris();
  writer[DataType.map](arr, write, ignoreVoid);
  return concat();
}
/**
 * @public
 * @remarks 转为 JBOD 的 Array 项
 */
export function toArrayItemJBOD(data: any) {
  const [write, concat] = collectDebris();
  writer.writeArrayItem(data, write);
  return concat();
}

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

interface JbodAsyncIteratorBasicItem<V = unknown> {
  dataType: number;
  key?: number | string;
  value: V;
  isIterator: false;
}
interface JbodAsyncIteratorArrayItem<T = unknown> {
  dataType: DataType.array;
  key: number;
  value: AsyncGenerator<JbodIteratorItem, T[], void>;
  isIterator: true;
}
interface JbodAsyncIteratorValue<T = unknown> {
  dataType: DataType.map;
  key: string;
  value: AsyncGenerator<JbodIteratorItem, Record<string, T>, void>;
  isIterator: true;
}
interface JbodIteratorBasicItem<V = unknown> {
  dataType: number;
  key?: number | string;
  value: V;
  isIterator: false;
}
interface JbodIteratorArrayItem<T = unknown> {
  dataType: DataType.array;
  key: number;
  value: AsyncGenerator<JbodIteratorItem, T[], void>;
  isIterator: true;
}
interface JbodIteratorMapValue<T = unknown> {
  dataType: DataType.map;
  key: string;
  value: AsyncGenerator<JbodIteratorItem, Record<string, T>, void>;
  isIterator: true;
}
/** @public */
export type JbodIteratorItem = JbodIteratorBasicItem | JbodIteratorArrayItem | JbodIteratorMapValue;
export type JbodAsyncIteratorItem = JbodAsyncIteratorBasicItem | JbodAsyncIteratorArrayItem | JbodAsyncIteratorValue;

async function genIteratorItem(read: StreamReader, type: DataType, key: string | number): Promise<JbodIteratorItem> {
  let value: unknown;
  let isIterator = true;
  if (type === DataType.array) value = scanArray(read);
  else if (type === DataType.map) value = scanMap(read);
  else if (typeof jbodScanner[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
  else {
    value = await jbodScanner[type](read);
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
    key = (await jbodScanner[DataType.string](read)) as string;
    const item = await genIteratorItem(read, type, key);
    let value = item.value;
    yield item;
    map[key] = value;
  } while (true);

  return map as any;
}
