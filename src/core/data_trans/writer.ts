import { numberToDLD } from "../dynamic_binary_number.js";
import { DataType, UnsupportedDataTypeError } from "../../const.js";
import { ObjectId } from "../internal_type.js";
import { writeInt32BE, writeBigInt64BE, writeDoubleBE, encodeUtf8 } from "../../uint_array_util/mod.js";
export function isNoContentData(type: number) {
  return type === DataType.true || type === DataType.false || type === DataType.null || type === DataType.undefined;
}
export function toType(data: any, safe?: boolean): number {
  let type: number;
  switch (typeof data) {
    case "undefined":
      return DataType.undefined;
    case "boolean":
      return data ? DataType.true : DataType.false;
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647) type = DataType.double;
      else type = DataType.int;
      break;
    case "string":
      type = DataType.string;
      break;
    case "bigint":
      type = DataType.bigint;
      break;
    case "symbol":
      type = DataType.symbol;
      break;
    case "object":
      if (data === null) return DataType.null;
      if (Array.isArray(data)) type = DataType.array;
      else if (data instanceof ArrayBuffer) type = DataType.arrayBuffer;
      else if (data instanceof RegExp) type = DataType.regExp;
      else if (data instanceof Error) type = DataType.error;
      else if (data instanceof ObjectId) type = DataType.objectId;
      else type = DataType.map;
      break;
    default:
      if (safe) return DataType.undefined;
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}

type CalcRes<T = any> = {
  preData: T;
  type: number;
  baseType: number;
  dataLen: number;
};

type ArrayPreData = CalcRes[];
type MapPreData = { keyLenData: Uint8Array; keyData: Uint8Array; value: CalcRes }[];
type ArrayBufferPreData = { strData: Uint8Array; strLen: Uint8Array };
export class JbodLengthCalc {
  calcArray(arr: any[]): CalcRes<ArrayPreData> {
    let item: any;
    let preData: ArrayPreData = [];
    let totalLen = 1; // void
    let res: CalcRes;
    for (let i = 0; i < arr.length; i++) {
      item = arr[i];
      res = this.calc(item);
      totalLen += res.dataLen + 1;
      preData.push(res);
    }
    return { dataLen: totalLen, preData, baseType: DataType.array, type: DataType.array };
  }
  calcMap(data: Record<string, any>): CalcRes<MapPreData> {
    const map = Object.keys(data);
    let preData: MapPreData = [];
    let totalLen = 1; // void
    for (let i = 0; i < map.length; i++) {
      const key = this.calcStr(map[i]);
      const value = this.calc(data[map[i]]);
      totalLen += 1 + key.dataLen + value.dataLen;

      preData.push({
        keyData: key.preData.strData,
        keyLenData: key.preData.strLen,
        value,
      });
    }
    return { dataLen: totalLen, preData, baseType: DataType.map, type: DataType.map };
  }
  calcArrayBuffer(data: Uint8Array): CalcRes<ArrayBufferPreData> {
    const lenBuf = numberToDLD(data.byteLength); //todo: 优化计算
    return {
      dataLen: data.byteLength + lenBuf.byteLength,
      baseType: DataType.arrayBuffer,
      type: DataType.arrayBuffer,
      preData: { strData: data, strLen: lenBuf },
    };
  }
  calcStr(data: string) {
    const res = this.calcArrayBuffer(encodeUtf8(data)); //todo: 优化计算
    res.type = DataType.string;
    return res;
  }

  calc(data: any): CalcRes {
    const type = toType(data);
    if (isNoContentData(type)) return { preData: undefined, dataLen: 0, baseType: type, type };
    switch (type) {
      case DataType.int:
        return { dataLen: 4, preData: data, baseType: type, type };
      case DataType.bigint:
        return { dataLen: 8, preData: data, baseType: type, type };
      case DataType.double:
        return { dataLen: 8, preData: data, baseType: type, type };
      case DataType.arrayBuffer:
        return this.calcArrayBuffer(data);
      case DataType.string:
        return this.calcStr(data as string);
      case DataType.regExp:
        return this.calcStr((data as RegExp).source);
      case DataType.symbol: {
        let desc = (data as Symbol).description;
        if (desc === undefined) return { baseType: DataType.symbol, preData: desc, dataLen: 1, type: DataType.symbol };
        const res = this.calcStr(desc);
        res.dataLen++;
        res.type = DataType.symbol;
        res.baseType = DataType.symbol;
        return res;
      }
      case DataType.array:
        return this.calcArray(data);
      case DataType.map:
        return this.calcMap(data);
      case DataType.error: {
        const error = data as Error;
        const errorMap = { ...error, message: error.message, name: error.name };
        if (error.cause) errorMap.cause = error.cause;
        return this.calcMap(errorMap);
      }
      default:
        throw new Error("???");
    }
  }
}

export class JbodWriter {
  [DataType.int](data: number, buf: Uint8Array) {
    writeInt32BE(buf, data);
  }
  [DataType.bigint](data: bigint, buf: Uint8Array) {
    writeBigInt64BE(buf, data);
  }
  [DataType.double](data: number, buf: Uint8Array) {
    writeDoubleBE(buf, data);
  }
  [DataType.arrayBuffer](data: ArrayBufferPreData, buf: Uint8Array) {
    buf.set(data.strLen);
    buf.set(data.strData, data.strLen.byteLength);
  }
  [DataType.symbol](data: undefined | ArrayBufferPreData, buf: Uint8Array) {
    if (data === undefined) buf[0] = DataType.void;
    else {
      buf[0] = DataType.string;
      this[DataType.arrayBuffer](data, buf.subarray(1));
    }
  }

  [DataType.array](array: ArrayPreData, buf: Uint8Array) {
    let offset = 0;
    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      buf[offset++] = value.type;

      if (!isNoContentData(value.type)) {
        this[value.baseType](value.preData, buf.subarray(offset, offset + value.dataLen));
        offset += value.dataLen;
      }
    }
    buf[offset++] = DataType.void;
  }
  [DataType.map](map: MapPreData, buf: Uint8Array) {
    let offset = 0;
    for (let i = 0; i < map.length; i++) {
      const { keyData, keyLenData, value } = map[i];
      buf[offset++] = value.type;

      //key
      buf.set(keyLenData, offset);
      offset += keyLenData.byteLength;
      buf.set(keyData, offset);
      offset += keyData.byteLength;

      if (!isNoContentData(value.type)) {
        this[value.baseType](value.preData, buf.subarray(offset, offset + value.dataLen));
        offset += value.dataLen;
      }
    }
    buf[offset++] = DataType.void;
  }

  [key: number]: DataWriter;
}

type DataWriter = (data: any, buf: Uint8Array, ignoreVoid?: boolean) => void;
