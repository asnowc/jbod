import { DBN } from "../dynamic_binary_number.js";
import { DataType, JbodError, UnsupportedDataTypeError } from "../../const.js";
import { VOID, ObjectId } from "../internal_type.js";
import { readInt32BE, readBigInt64BE, readDoubleBE, decodeUtf8 } from "../../uint_array_util/mod.js";
type ParseResult<T = any> = { data: T; offset: number };
type Parser = (buf: Uint8Array, offset: number) => ParseResult<any>;
export class JbodParser implements Record<DataType, Parser> {
  private uInt8Array(buf: Uint8Array, offset: number): [Uint8Array, number] {
    const [lenDesc, len] = DBN.paseNumberSync(buf, offset);
    if (lenDesc <= 0) return [new Uint8Array(0), offset + len];
    offset += len;
    return [buf.subarray(offset, lenDesc + offset), lenDesc + offset];
  }
  [DataType.void](buf: Uint8Array, offset: number): ParseResult<Symbol> {
    return { data: VOID, offset };
  }
  [DataType.function](buf: Uint8Array, offset: number): ParseResult<Function> {
    throw new UnsupportedDataTypeError("function");
  }
  [DataType.undefined](buf: Uint8Array, offset: number): ParseResult<undefined> {
    return { data: undefined, offset };
  }
  [DataType.null](buf: Uint8Array, offset: number): ParseResult<null> {
    return { data: null, offset };
  }
  [DataType.true](buf: Uint8Array, offset: number): ParseResult<true> {
    return { data: true, offset };
  }
  [DataType.false](buf: Uint8Array, offset: number): ParseResult<false> {
    return { data: false, offset };
  }

  [DataType.int](read: Uint8Array, offset: number): ParseResult<number> {
    return { data: readInt32BE(read, offset), offset: offset + 4 };
  }
  [DataType.bigint](read: Uint8Array, offset: number): ParseResult<bigint> {
    return { data: readBigInt64BE(read, offset), offset: offset + 8 };
  }
  [DataType.double](buf: Uint8Array, offset: number): ParseResult<number> {
    return { data: readDoubleBE(buf, offset), offset: offset + 8 };
  }

  [DataType.objectId](buf: Uint8Array, offset: number): ParseResult<ObjectId> {
    const [data, len] = DBN.paseBigIntSync(buf, offset);
    return { data: new ObjectId(data), offset: offset + len };
  }

  [DataType.arrayBuffer](buf: Uint8Array, offset: number): ParseResult<ArrayBuffer> {
    const [lenDesc, len] = DBN.paseNumberSync(buf, offset);
    offset += len;
    if (lenDesc <= 0) return { data: new ArrayBuffer(0), offset };
    const arrayBuffer = new ArrayBuffer(lenDesc);
    const view = new Uint8Array(arrayBuffer);
    view.set(buf.subarray(offset, offset + lenDesc));

    return { data: arrayBuffer, offset: offset + lenDesc };
  }
  [DataType.string](buf: Uint8Array, offset: number): ParseResult<string> {
    const [buffer, newOffset] = this.uInt8Array(buf, offset);
    return { data: decodeUtf8(buffer), offset: newOffset };
  }
  [DataType.symbol](buf: Uint8Array, offset: number): ParseResult<Symbol> {
    const type = buf[offset++];
    let value: Symbol;
    if (type === DataType.void) value = Symbol();
    else {
      const res: ParseResult = this[DataType.string](buf, offset);
      value = Symbol(res.data);
      offset = res.offset;
    }
    return { data: value, offset };
  }
  [DataType.regExp](buf: Uint8Array, offset: number): ParseResult<RegExp> {
    const res: ParseResult = this[DataType.string](buf, offset);
    res.data = new RegExp(res.data);
    return res;
  }
  [DataType.array](buf: Uint8Array, offset: number): ParseResult<any[]> {
    let arrayList: unknown[] = [];
    let res: ParseResult;
    while (offset < buf.byteLength) {
      const type = buf[offset++];
      if (type === DataType.void) break;
      if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      res = this[type](buf, offset);
      offset = res.offset;
      arrayList.push(res.data);
    }
    return { data: arrayList, offset };
  }
  [DataType.object](buf: Uint8Array, offset: number): ParseResult<Object> {
    const map: Record<string, unknown> = {};
    let key: string;
    let res: ParseResult;
    while (offset < buf.byteLength) {
      const type = buf[offset++];
      if (type === DataType.void) break;
      res = this[DataType.string](buf, offset);
      key = res.data;
      offset = res.offset;

      if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      res = this[type](buf, offset);
      map[key] = res.data;
      offset = res.offset;
    }

    return { data: map, offset };
  }

  [DataType.error](buf: Uint8Array, offset: number): ParseResult<Error> {
    const res: ParseResult = this[DataType.object](buf, offset);
    const { message, cause, ...attr } = res.data;
    const error = new JbodError(message, { cause });
    Object.assign(error, attr);
    res.data = error;
    return res;
  }
  [DataType.set](buf: Uint8Array, offset: number): ParseResult<Set<unknown>> {
    const arr: ParseResult = this[DataType.array](buf, offset);
    arr.data = new Set(arr.data);
    return arr;
  }
  [DataType.map](buf: Uint8Array, offset: number): ParseResult<Map<unknown, unknown>> {
    const res: ParseResult = this[DataType.array](buf, offset);
    const object = res.data;
    const map = new Map();
    for (let i = 0; i < object.length; i += 2) {
      map.set(object[i], object[i + 1]);
    }
    res.data = map;
    return res;
  }
  [key: number]: Parser;
}
