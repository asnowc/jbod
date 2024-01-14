import { DBN } from "../dynamic_binary_number.js";
import { DataType, JbodError, UnsupportedDataTypeError } from "../../const.js";
import { VOID, ObjectId } from "../internal_type.js";
import { decodeUtf8, readInt32BE, readBigInt64BE, readDoubleBE } from "../../uint_array_util/mod.js";
type StreamReader = (size: number) => Promise<Uint8Array>;
type AsyncParser = (read: StreamReader) => Promise<unknown>;

export class JbodAsyncParser implements Record<DataType, AsyncParser> {
  async [DataType.function]() {
    throw new UnsupportedDataTypeError("function");
  }
  async [DataType.void]() {
    return VOID;
  }
  async [DataType.undefined]() {
    return undefined;
  }
  async [DataType.null]() {
    return null;
  }
  async [DataType.true]() {
    return true;
  }
  async [DataType.false]() {
    return false;
  }

  async [DataType.int](read: StreamReader) {
    return readInt32BE(await read(4));
  }
  async [DataType.bigint](read: StreamReader) {
    return readBigInt64BE(await read(8));
  }
  async [DataType.double](read: StreamReader) {
    return readDoubleBE(await read(8));
  }

  async [DataType.id](read: StreamReader) {
    const data = await DBN.readBigInt(read);
    return new ObjectId(data);
  }

  async [DataType.uInt8Arr](read: StreamReader): Promise<Uint8Array> {
    const len = await DBN.readNumber(read);
    if (len <= 0) return new Uint8Array(0);
    return read(len);
  }
  async [DataType.string](read: StreamReader): Promise<string> {
    const buf = await this[DataType.uInt8Arr](read);
    return decodeUtf8(buf);
  }
  async [DataType.symbol](read: StreamReader): Promise<Symbol> {
    const type = (await read(1))[0];
    if (type === DataType.void) return Symbol();
    const data = await this[DataType.string](read);
    return Symbol(data);
  }
  async [DataType.regExp](read: StreamReader) {
    const str = await this[DataType.string](read);
    return RegExp(str);
  }
  async [DataType.array](read: StreamReader) {
    let arrayList: unknown[] = [];
    while (true) {
      const type = (await read(1))[0];
      if (type === DataType.void) break;

      if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      let value = await this[type](read);
      arrayList.push(value);
    }
    return arrayList;
  }
  async [DataType.object](read: StreamReader) {
    const map: Record<string, unknown> = {};
    let key: string;
    while (true) {
      const type = (await read(1))[0] as DataType;
      if (type === DataType.void) break;
      key = (await this[DataType.string](read)) as string;
      if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      map[key] = await this[type](read);
    }

    return map as any;
  }

  async [DataType.error](read: StreamReader) {
    const { message, cause, ...attr } = await this[DataType.object](read);
    const error = new JbodError(message, { cause });
    Object.assign(error, attr);
    return error;
  }
  async [DataType.set](read: StreamReader) {
    const arr = await this[DataType.array](read);
    return new Set(arr);
  }
  async [DataType.map](read: StreamReader) {
    const arr = await this[DataType.array](read);
    const map = new Map();
    for (let i = 0; i < arr.length; i += 2) {
      map.set(arr[i], arr[i + 1]);
    }
    return map;
  }
  [key: number]: AsyncParser;
}
