import { DBN } from "../dynamic_binary_number.js";
import { DataType, JbodError, UnsupportedDataTypeError } from "../../const.js";
import { readInt32BE, readBigInt64BE, readDoubleBE, decodeUtf8 } from "../../uint_array_util/mod.js";
type ParseResult<T = any> = { data: T; offset: number };
type Parser = (buf: Uint8Array, offset: number) => ParseResult<any>;

function paseUint8Arr(buf: Uint8Array, offset: number): ParseResult<Uint8Array> {
  const [lenDesc, len] = DBN.paseNumberSync(buf, offset);
  offset += len;
  if (lenDesc <= 0) return { data: new Uint8Array(0), offset };
  return { data: buf.subarray(offset, offset + lenDesc), offset: offset + lenDesc };
}
export class JbodParser {
  paseItem(type: number, buf: Uint8Array, offset: number): ParseResult {
    switch (type) {
      case DataType.undefined:
        return { data: undefined, offset };
      case DataType.null:
        return { data: null, offset };
      case DataType.true:
        return { data: true, offset };
      case DataType.false:
        return { data: false, offset };
      case DataType.int:
        return { data: readInt32BE(buf, offset), offset: offset + 4 };
      case DataType.bigint:
        return { data: readBigInt64BE(buf, offset), offset: offset + 8 };
      case DataType.double:
        return { data: readDoubleBE(buf, offset), offset: offset + 8 };
      case DataType.uInt8Arr:
        return paseUint8Arr(buf, offset);
      default: {
        if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
        return this[type](buf, offset);
      }
    }
  }

  [DataType.string](buf: Uint8Array, offset: number): ParseResult<string> {
    const res: ParseResult = paseUint8Arr(buf, offset);
    res.data = decodeUtf8(res.data);
    return res;
  }
  [DataType.symbol](buf: Uint8Array, offset: number): ParseResult<Symbol> {
    const data = this[DataType.array](buf, offset) as ParseResult<any>;
    data.data = Symbol(data.data[0]);
    return data;
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
      res = this.paseItem(type, buf, offset);
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

      res = this.paseItem(type, buf, offset);
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
