import { DBN } from "../dynamic_binary_number.js";
import { DataType, JbodError, UnsupportedDataTypeError } from "../../const.js";
import { VOID, ObjectId } from "../internal_type.js";
import { readInt32BE, readBigInt64BE, readDoubleBE, decodeUtf8 } from "../../uint_array_util/mod.js";
type Parser = (buf: Uint8Array, offset: number) => [data: unknown, readLength: number];
export class JbodParser implements Record<DataType, Parser> {
  /** 如果读取到 void类型, 则返回VOID */
  readItem(read: Uint8Array, offset: number): [any, number] {
    const type = read[offset++];
    if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
    return this[type](read, offset);
  }
  private uInt8Array(buf: Uint8Array, offset: number): [Uint8Array, number] {
    const [lenDesc, len] = DBN.paseNumberSync(buf, offset);
    if (lenDesc <= 0) return [new Uint8Array(0), offset + len];
    offset += len;
    return [buf.subarray(offset, lenDesc + offset), lenDesc + offset];
  }
  [DataType.void](buf: Uint8Array, offset: number): [Symbol, number] {
    return [VOID, offset];
  }
  [DataType.function](buf: Uint8Array, offset: number): [Function, number] {
    throw new UnsupportedDataTypeError("function");
  }
  [DataType.undefined](buf: Uint8Array, offset: number): [undefined, number] {
    return [undefined, offset];
  }
  [DataType.null](buf: Uint8Array, offset: number): [null, number] {
    return [null, offset];
  }
  [DataType.true](buf: Uint8Array, offset: number): [true, number] {
    return [true, offset];
  }
  [DataType.false](buf: Uint8Array, offset: number): [false, number] {
    return [false, offset];
  }

  [DataType.int](read: Uint8Array, offset: number): [number, number] {
    return [readInt32BE(read, offset), offset + 4];
  }
  [DataType.bigint](read: Uint8Array, offset: number): [bigint, number] {
    return [readBigInt64BE(read, offset), offset + 8];
  }
  [DataType.double](buf: Uint8Array, offset: number): [number, number] {
    return [readDoubleBE(buf, offset), offset + 8];
  }

  [DataType.objectId](buf: Uint8Array, offset: number): [ObjectId, number] {
    const [data, len] = DBN.paseBigIntSync(buf, offset);
    return [new ObjectId(data), offset + len];
  }

  [DataType.arrayBuffer](buf: Uint8Array, offset: number): [ArrayBuffer, number] {
    const [lenDesc, len] = DBN.paseNumberSync(buf, offset);
    offset += len;
    if (lenDesc <= 0) return [new ArrayBuffer(0), offset];
    const arrayBuffer = new ArrayBuffer(lenDesc);
    const view = new Uint8Array(arrayBuffer);
    view.set(buf.subarray(offset, offset + lenDesc));

    return [arrayBuffer, offset + lenDesc];
  }
  [DataType.string](buf: Uint8Array, offset: number): [string, number] {
    const [buffer, newOffset] = this.uInt8Array(buf, offset);
    return [decodeUtf8(buffer), newOffset];
  }
  [DataType.symbol](buf: Uint8Array, offset: number): [Symbol, number] {
    const data = this.readItem(buf, offset);
    if (data[0] === VOID) data[0] = Symbol();
    else {
      data[0] = Symbol(data[0]);
    }
    return data;
  }
  [DataType.regExp](buf: Uint8Array, offset: number): [RegExp, number] {
    const data = this[DataType.string](buf, offset);
    data[0] = new RegExp(data[0]) as any;
    return data as any;
  }
  [DataType.array](buf: Uint8Array, offset: number): [any[], number] {
    let arrayList: unknown[] = [];
    while (offset < buf.byteLength) {
      let res = this.readItem(buf, offset);
      offset = res[1];
      if (res[0] === VOID) break;
      arrayList.push(res[0]);
    }
    return [arrayList, offset];
  }
  [DataType.map](buf: Uint8Array, offset: number): [Object, number] {
    const map: Record<string, unknown> = {};
    let key: string;
    while (offset < buf.byteLength) {
      const type = buf[offset++];
      if (type === DataType.void) break;
      let data: [any, number] = this[DataType.string](buf, offset);
      key = data[0];
      offset = data[1];

      if (typeof this[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
      data = this[type](buf, offset);
      map[key] = data[0];
      offset = data[1];
    }

    return [map, offset];
  }

  [DataType.error](buf: Uint8Array, offset: number): [Error, number] {
    let [{ message, cause, ...attr }, len] = this[DataType.map](buf, offset) as [Error, number];
    const error = new JbodError(message, { cause });
    Object.assign(error, attr);
    return [error, len];
  }
  [key: number]: Parser;
}
