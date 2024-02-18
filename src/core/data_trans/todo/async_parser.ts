import { decodeU32D } from "../../dynamic_binary_number.js";
import { DataType, JbodError, UnsupportedDataTypeError, VOID_ID } from "../../const.js";
import { decodeUtf8, readInt32BE, readBigInt64BE, readDoubleBE } from "../../../uint_array_util/mod.js";
type StreamReader = (size: number) => Promise<Uint8Array>;
type AsyncParser = (read: StreamReader) => Promise<unknown>;
async function paseUint8Arr(read: StreamReader) {
  //todo: 异步读取DBN优化
  let buf = new Uint8Array(4);
  let chunk = await read(1);
  let byte = 0;
  do {
    buf[byte] = chunk[0];
  } while (chunk[0] > 0b0111_111);
  const len = decodeU32D(buf).value;
  if (len <= 0) return new Uint8Array(0);
  return read(len);
}
export class JbodAsyncParser {
  async paseItem(type: DataType, read: StreamReader) {
    switch (type) {
      case DataType.undefined:
        return undefined;
      case DataType.null:
        return null;
      case DataType.true:
        return true;
      case DataType.false:
        return false;
      case DataType.i32:
        return readInt32BE(await read(4));
      case DataType.i64:
        return readBigInt64BE(await read(8));
      case DataType.f64:
        return readDoubleBE(await read(8));
      case DataType.binary:
        return paseUint8Arr(read);
      default: {
        if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
        return this[type](read);
      }
    }
  }

  async [DataType.string](read: StreamReader): Promise<string> {
    const buf = await paseUint8Arr(read);
    return decodeUtf8(buf);
  }
  async [DataType.symbol](read: StreamReader): Promise<Symbol> {
    const data = await this[DataType.dyArray](read);
    return Symbol(data[0] as any);
  }
  async [DataType.regExp](read: StreamReader) {
    const str = await this[DataType.string](read);
    return RegExp(str);
  }
  async [DataType.dyArray](read: StreamReader) {
    let arrayList: unknown[] = [];
    while (true) {
      const type = (await read(1))[0];
      if (type === VOID_ID) break;
      let value = await this.paseItem(type, read);
      arrayList.push(value);
    }
    return arrayList;
  }
  async [DataType.dyRecord](read: StreamReader) {
    const map: Record<string, unknown> = {};
    let key: string;
    while (true) {
      const type = (await read(1))[0];
      if (type === VOID_ID) break;
      key = (await this[DataType.string](read)) as string;
      map[key] = await this.paseItem(type, read);
    }

    return map as any;
  }

  async [DataType.error](read: StreamReader) {
    const { message, cause, ...attr } = await this[DataType.dyRecord](read);
    const error = new JbodError(message, { cause });
    Object.assign(error, attr);
    return error;
  }
  async [DataType.set](read: StreamReader) {
    const arr = await this[DataType.dyArray](read);
    return new Set(arr);
  }
  async [DataType.map](read: StreamReader) {
    const arr = await this[DataType.dyArray](read);
    const map = new Map();
    for (let i = 0; i < arr.length; i += 2) {
      map.set(arr[i], arr[i + 1]);
    }
    return map;
  }
  [key: number]: AsyncParser;
}