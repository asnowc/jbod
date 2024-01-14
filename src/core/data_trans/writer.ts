import { numberToDLD } from "../dynamic_binary_number.js";
import { DataType, UnsupportedDataTypeError } from "../../const.js";
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
      else if (data instanceof Uint8Array) type = DataType.uInt8Arr;
      else if (data instanceof RegExp) type = DataType.regExp;
      else if (data instanceof Error) type = DataType.error;
      else if (data instanceof Set) type = DataType.set;
      else if (data instanceof Map) type = DataType.map;
      else type = DataType.object;
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
type Uint8ArrPreData = { strData: Uint8Array; strLen: Uint8Array };
export class JbodLengthCalc {
  calcArray(arr: any[], type: DataType): CalcRes<ArrayPreData> {
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
    return { dataLen: totalLen, preData, baseType: DataType.array, type };
  }
  calcMap(data: Record<string, any>, type: DataType): CalcRes<MapPreData> {
    const map = Object.keys(data);
    let preData: MapPreData = [];
    let totalLen = 1; // void
    for (let i = 0; i < map.length; i++) {
      const key = this.calcStr(map[i], DataType.string);
      const value = this.calc(data[map[i]]);
      totalLen += 1 + key.dataLen + value.dataLen;

      preData.push({
        keyData: key.preData.strData,
        keyLenData: key.preData.strLen,
        value,
      });
    }
    return { dataLen: totalLen, preData, baseType: DataType.object, type };
  }
  calcUint8Arr(data: Uint8Array, type: DataType): CalcRes<Uint8ArrPreData> {
    const lenBuf = numberToDLD(data.byteLength); //todo: 优化计算
    return {
      dataLen: data.byteLength + lenBuf.byteLength,
      baseType: DataType.uInt8Arr,
      type,
      preData: { strData: data, strLen: lenBuf },
    };
  }
  calcStr(data: string, type: DataType) {
    return this.calcUint8Arr(encodeUtf8(data), type); //todo: 优化计算
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
      case DataType.uInt8Arr:
        return this.calcUint8Arr(data, DataType.uInt8Arr);
      case DataType.string:
        return this.calcStr(data as string, DataType.string);
      case DataType.regExp:
        return this.calcStr((data as RegExp).source, DataType.regExp);
      case DataType.symbol: {
        let desc = (data as Symbol).description;
        if (desc === undefined) return { baseType: DataType.symbol, preData: desc, dataLen: 1, type: DataType.symbol };
        const res = this.calcStr(desc, DataType.symbol);
        res.dataLen++;
        res.baseType = DataType.symbol;
        return res;
      }
      case DataType.array:
        return this.calcArray(data, DataType.array);
      case DataType.object:
        return this.calcMap(data, DataType.object);
      case DataType.error: {
        const error = data as Error;
        const errorMap = { ...error, message: error.message, name: error.name };
        if (error.cause) errorMap.cause = error.cause;
        return this.calcMap(errorMap, DataType.error);
      }
      case DataType.map: {
        const list: any[] = [];
        let i = 0;
        for (const item of data as Map<any, any>) {
          list[i] = item[0];
          list[i + 1] = item[1];
          i += 2;
        }
        return this.calcArray(list, DataType.map);
      }
      case DataType.set:
        return this.calcArray(Array.from(data), DataType.set);

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
  [DataType.uInt8Arr](data: Uint8ArrPreData, buf: Uint8Array) {
    buf.set(data.strLen);
    buf.set(data.strData, data.strLen.byteLength);
  }
  [DataType.symbol](data: undefined | Uint8ArrPreData, buf: Uint8Array) {
    if (data === undefined) buf[0] = DataType.void;
    else {
      buf[0] = DataType.string;
      this[DataType.uInt8Arr](data, buf.subarray(1));
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
  [DataType.object](map: MapPreData, buf: Uint8Array) {
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
