import { calcNumByteLen, numberToDldInto } from "../dynamic_binary_number.js";

import { DataType, UnsupportedDataTypeError } from "../../const.js";
import {
  writeInt32BE,
  writeBigInt64BE,
  writeDoubleBE,
  calcUtf8Length,
  encodeUtf8Into,
} from "../../uint_array_util/mod.js";
import { Serializer } from "../type.js";
interface JbodSerializerConfig {
  customType?: Record<number, { calc: Calc; bufTrans: BufTrans }>;
  customObjetType: [object, number][];
}
function toTypeCode(this: { toObjectCode(data: object): number }, data: any, safe?: boolean): number {
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
      else if (data instanceof Array) type = DataType.array;
      else if (data instanceof Uint8Array) type = DataType.uInt8Arr;
      else type = this.toObjectCode(data);
      break;
    default:
      if (safe) return DataType.undefined;
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}
function toObjectCode(data: object): number {
  let type: number;
  if (data instanceof RegExp) type = DataType.regExp;
  else if (data instanceof Error) type = DataType.error;
  else if (data instanceof Set) type = DataType.set;
  else if (data instanceof Map) type = DataType.map;
  else type = DataType.object;
  return type;
}

class JbodSerializer implements Serializer<any, CalcRes> {
  private serializer: BufTransTypeMap;
  private calc: CalcTypeMap;
  constructor(config?: JbodSerializerConfig) {
    this.serializer = serializer;
    this.toTypeCode = toTypeCode.bind({ toObjectCode });
    this.calc = { ...calc, toTypeCode: this.toTypeCode };
  }

  binaryifyInto(value: CalcRes, buf: Uint8Array) {
    return this.serializer[value.type](value.pretreatment, buf);
  }
  toTypeCode;

  calcLen(data: any) {
    const type = this.toTypeCode(data);
    const res = this.calc[type](data);
    res.type = type;
    return res;
  }
}

type CalcRes<T = any> = {
  byteLength: number;
  pretreatment: T;
  type: number;
};

type ArrayPreData = CalcRes[];
type MapPreData = { key: CalcRes<StrPreData>; value: CalcRes }[];
type Uint8ArrPreData = { uInt8Arr: Uint8Array; dbnLen: number };
type StrPreData = { str: string; dbnLen: number; contentLen: number };

type Calc = (this: CalcTypeMap, data: any) => CalcRes;
type CalcTypeMap = {
  toTypeCode(data: any, safe?: boolean): number;
  [key: number]: Calc;
};

const calc: CalcTypeMap = {
  toTypeCode,
  [DataType.uInt8Arr](data: Uint8Array): CalcRes<Uint8ArrPreData> {
    const dbnLen = calcNumByteLen(data.byteLength);
    return {
      pretreatment: { uInt8Arr: data, dbnLen },
      byteLength: dbnLen + data.byteLength,
      type: DataType.uInt8Arr,
    };
  },
  [DataType.string](data: string): CalcRes<StrPreData> {
    const len = calcUtf8Length(data);
    const dbnLen = calcNumByteLen(len);
    return {
      pretreatment: { str: data, dbnLen: dbnLen, contentLen: len },
      byteLength: dbnLen + len,
      type: DataType.string,
    };
  },

  [DataType.array](arr: any[]): CalcRes<ArrayPreData> {
    let item: any;
    let preData: ArrayPreData = [];
    let totalLen = 1; // void
    let valueRes: CalcRes;

    let itemType: number;
    for (let i = 0; i < arr.length; i++) {
      item = arr[i];

      itemType = this.toTypeCode(item);
      valueRes = this[itemType](item);
      valueRes.type = itemType;

      totalLen += valueRes.byteLength + 1;
      preData.push(valueRes);
    }

    return { pretreatment: preData, byteLength: totalLen, type: DataType.array };
  },
  [DataType.object](data: Record<string, any>): CalcRes<MapPreData> {
    const map = Object.keys(data);
    let preData: MapPreData = [];
    let totalLen = 1; // void

    let item: any;
    let keyRes: CalcRes;
    let itemType: number;
    let valueRes: CalcRes;

    for (let i = 0; i < map.length; i++) {
      item = data[map[i]];
      keyRes = this[DataType.string](map[i]);

      itemType = this.toTypeCode(item);
      valueRes = this[itemType](item);
      valueRes.type = itemType;

      totalLen += 1 + keyRes.byteLength + valueRes.byteLength;

      preData.push({
        key: keyRes,
        value: valueRes,
      });
    }
    return { pretreatment: preData, byteLength: totalLen, type: DataType.object };
  },

  [DataType.map](data: Map<any, any>) {
    const list: any[] = [];
    let i = 0;
    for (const item of data) {
      list[i] = item[0];
      list[i + 1] = item[1];
      i += 2;
    }
    return this[DataType.array](list);
  },
  [DataType.set](data: Set<any>) {
    return this[DataType.array](Array.from(data));
  },
  [DataType.error](error: Error) {
    const errorMap = { ...error, message: error.message, name: error.name };
    if (error.cause) errorMap.cause = error.cause;
    return this[DataType.object](errorMap);
  },
  [DataType.symbol](data: symbol) {
    return this[DataType.array]([data.description]);
  },
  [DataType.regExp](data: RegExp) {
    return this[DataType.string](data.source);
  },
};
calc[DataType.true] = () => ({ pretreatment: undefined, type: DataType.true, byteLength: 0 });
calc[DataType.false] = () => ({ pretreatment: undefined, type: DataType.true, byteLength: 0 });
calc[DataType.undefined] = () => ({ pretreatment: undefined, type: DataType.true, byteLength: 0 });
calc[DataType.null] = () => ({ pretreatment: undefined, type: DataType.null, byteLength: 0 });

calc[DataType.int] = (data) => ({ pretreatment: data, byteLength: 4, type: DataType.int });
calc[DataType.bigint] = (data) => ({ pretreatment: data, byteLength: 8, type: DataType.bigint });
calc[DataType.double] = (data) => ({ pretreatment: data, byteLength: 8, type: DataType.double });

type BufTrans = (data: any, buf: Uint8Array) => Uint8Array;
type BufTransTypeMap = Record<number, BufTrans>;
const serializer: BufTransTypeMap = {
  [DataType.undefined]: (data, buf) => buf,
  [DataType.int](data: number, buf: Uint8Array) {
    writeInt32BE(buf, data);
    return buf.subarray(4);
  },
  [DataType.bigint](data: bigint, buf: Uint8Array) {
    writeBigInt64BE(buf, data);
    return buf.subarray(8);
  },
  [DataType.double](data: number, buf: Uint8Array) {
    writeDoubleBE(buf, data);
    return buf.subarray(8);
  },
  [DataType.uInt8Arr](data: Uint8ArrPreData, buf: Uint8Array) {
    numberToDldInto(data.uInt8Arr.byteLength, buf.subarray(0, data.dbnLen));
    buf.set(data.uInt8Arr, data.dbnLen);
    return buf.subarray(data.dbnLen + data.uInt8Arr.byteLength);
  },

  [DataType.string](data: StrPreData, buf: Uint8Array) {
    numberToDldInto(data.contentLen, buf.subarray(0, data.dbnLen));
    encodeUtf8Into(data.str, buf.subarray(data.dbnLen));
    return buf.subarray(data.dbnLen + data.contentLen);
  },

  [DataType.array](array: ArrayPreData, buf: Uint8Array) {
    for (let i = 0; i < array.length; i++) {
      buf[0] = array[i].type;
      buf = serializer[array[i].type](array[i].pretreatment, buf.subarray(1));
    }
    buf[0] = DataType.void;
    return buf.subarray(1);
  },
  [DataType.object](map: MapPreData, buf: Uint8Array) {
    let item: MapPreData[0];
    for (let i = 0; i < map.length; i++) {
      item = map[i];
      buf[0] = item.value.type;
      buf = serializer[DataType.string](item.key.pretreatment, buf.subarray(1));
      buf = serializer[item.value.type](item.value.pretreatment, buf);
    }
    buf[0] = DataType.void;
    return buf.subarray(1);
  },
};
serializer[DataType.true] = serializer[DataType.undefined];
serializer[DataType.false] = serializer[DataType.undefined];
serializer[DataType.null] = serializer[DataType.undefined];

serializer[DataType.error] = serializer[DataType.object];
serializer[DataType.regExp] = serializer[DataType.string];
serializer[DataType.set] = serializer[DataType.array];
serializer[DataType.map] = serializer[DataType.array];
serializer[DataType.symbol] = serializer[DataType.array];

export const defaultSerializer: JbodSerializer = new JbodSerializer();

// 无内容
// 固定长度
// 动态固定长度
// 动态不固定场
