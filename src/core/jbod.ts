import { DataType, UnsupportedDataTypeError } from "../const.js";
import { JbodScanItem, JbodScanner } from "./data_trans/scanner.js";
import { JbodReader } from "./data_trans/reader.js";
import { JbodWriter } from "./data_trans/writer.js";

type StreamReader = (size: number) => Promise<Uint8Array>;

const syncReader = new JbodReader();
const jbodScanner = new JbodScanner();
export type { JbodScanItem };
async function* scanDataType(read: StreamReader) {
  do {
    const type = (await read(1))[0];
    if (type === DataType.void) return;
    yield type;
  } while (true);
}
async function* scanArray(read: StreamReader): AsyncGenerator<JbodScanItem, void, void> {
  let key = 0;
  for await (const type of scanDataType(read)) {
    let value: unknown;
    let isIterator = true;
    if (type === DataType.array) value = scanArray(read);
    else if (type === DataType.map) value = scanMap(read);
    else if (typeof jbodScanner[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
    else {
      value = await jbodScanner[type](read);
      isIterator = false;
    }
    yield { dataType: type, key, value, isIterator } as JbodScanItem;
    key++;
  }
}
async function* scanMap(read: StreamReader): AsyncGenerator<JbodScanItem, void, void> {
  const map: Record<string, unknown> = {};
  let key: string;
  for await (const type of scanDataType(read)) {
    key = (await jbodScanner[DataType.string](read)) as string;

    let value: any;
    let isIterator = true;
    if (type === DataType.array) value = scanArray(read);
    else if (type === DataType.map) value = scanMap(read);
    else if (typeof jbodScanner[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
    else {
      value = await jbodScanner[type](read);
      isIterator = false;
    }

    map[key] = value;

    yield { key, dataType: type, value, isIterator } as JbodScanItem;
  }

  return map as any;
}

/** @public */
export class JBOD {
  static toArray<T = unknown>(buffer: Uint8Array, offset: number = 0): T[] {
    if (!(buffer instanceof Uint8Array)) throw new Error("The parameter must be of Uint8Array type");

    return syncReader[DataType.array](buffer, offset)[0];
  }
  static toMap<T = Record<string, unknown>>(buffer: Uint8Array, offset = 0): T {
    if (!(buffer instanceof Uint8Array)) throw new Error("The parameter must be of Uint8Array type");

    return syncReader[DataType.map](buffer, offset)[0] as T;
  }
  /**
   * 读取一个Array项
   */
  static toArrayItem<T = unknown>(buffer: Uint8Array, offset: number = 0): [T, number] {
    if (!(buffer instanceof Uint8Array)) throw new Error("The parameter must be of Uint8Array type");
    return syncReader.readArrayItem(buffer, offset);
  }
  static scanMap = scanMap;
  static scanArray = scanArray;

  static readArray<T = unknown>(read: StreamReader): Promise<T[]> {
    return jbodScanner[DataType.array](read) as any;
  }
  static readMap<T = unknown>(read: StreamReader): Promise<T> {
    return jbodScanner[DataType.map](read) as any;
  }
  static readItem<T = unknown>(read: StreamReader): Promise<T> {
    return jbodScanner.readArrayItem(read) as any;
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
