import { calcU32DByte, encodeU32DInto } from "../dynamic_binary_number.js";

import { DataType, UnsupportedDataTypeError } from "../../const.js";
import {
  writeInt32BE,
  writeBigInt64BE,
  writeDoubleBE,
  calcUtf8Length,
  encodeUtf8Into,
} from "../../uint_array_util/mod.js";
import { Serializer } from "../type.js";
export interface JbodSerializerConfig {
  customObjet?: DefinedClassTypeMap;
}

interface ClassType {
  code: number;
  class: new (...args: any[]) => object;
}

type DefinedBaseTypeMap = Record<
  number,
  {
    calculator: Calculator;
    encoder: Encoder;
    class?: new (...args: any[]) => object;
  }
>;
type DefinedClassTypeMap = Record<
  number,
  {
    calculator: Calculator;
    encoder: Encoder;
    class: new (...args: any[]) => object;
  }
>;

function toTypeCode(this: { customClassType: ClassType[] }, data: any, safe?: boolean): number {
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
    case "object": {
      if (data === null) return DataType.null;
      else if (data instanceof Array) return DataType.array;
      let item: (typeof this.customClassType)[0];
      for (let i = 0; i < this.customClassType.length; i++) {
        item = this.customClassType[i];
        if (data instanceof item.class) return item.code;
      }
      return DataType.object;
    }
    default:
      if (safe) return DataType.undefined;
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}

export class JbodSerializer implements Serializer<any, CalcRes> {
  private encoderMap: EncoderMap;
  private calculatorMap: calculatorMap;
  constructor(config: JbodSerializerConfig = {}) {
    const customType: ClassType[] = [];
    this.toTypeCode = toTypeCode.bind({ customClassType: customType });
    const encoderMap: EncoderMap = {};
    const calculatorMap: calculatorMap = { toTypeCode: this.toTypeCode };
    this.calculatorMap = calculatorMap;
    this.encoderMap = encoderMap;

    if (config.customObjet) this.merge(encoderMap, calculatorMap, customType, config.customObjet);
    this.merge(encoderMap, calculatorMap, customType, jsDefaultClassType);
    this.merge(encoderMap, calculatorMap, customType, default_type);
  }
  private merge(
    encoderMap: EncoderMap,
    calculatorMap: calculatorMap,
    classType: ClassType[],
    definedMap: DefinedBaseTypeMap
  ) {
    for (const [codeStr, item] of Object.entries(definedMap)) {
      let code = parseInt(codeStr);
      if (item.class) classType.push({ class: item.class!, code });
      encoderMap[code] = item.encoder;
      calculatorMap[code] = item.calculator;
    }
  }

  binaryifyInto(value: CalcRes, buf: Uint8Array) {
    return this.encoderMap[value.type](value.pretreatment, buf);
  }
  toTypeCode: (data: any) => number;

  calcLen(data: any) {
    const type = this.toTypeCode(data);
    const res = this.calculatorMap[type](data);
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

type Encoder = (this: EncoderMap, data: any, buf: Uint8Array) => Uint8Array;
type Calculator = (this: calculatorMap, data: any) => CalcRes;
export type EncoderMap = Record<number, Encoder>;
export type calculatorMap = {
  toTypeCode(data: any, safe?: boolean): number;
  [key: number]: Calculator;
};
const noContentTrans: Encoder = (data, buf) => buf;

const default_type: DefinedBaseTypeMap = {
  [DataType.undefined]: {
    encoder: noContentTrans,
    calculator: () => ({ pretreatment: undefined, type: DataType.undefined, byteLength: 0 }),
  },
  [DataType.true]: {
    encoder: noContentTrans,
    calculator: () => ({ pretreatment: undefined, type: DataType.true, byteLength: 0 }),
  },
  [DataType.false]: {
    encoder: noContentTrans,
    calculator: () => ({ pretreatment: undefined, type: DataType.false, byteLength: 0 }),
  },
  [DataType.null]: {
    encoder: noContentTrans,
    calculator: () => ({ pretreatment: undefined, type: DataType.null, byteLength: 0 }),
  },

  [DataType.int]: {
    encoder(data: number, buf: Uint8Array) {
      writeInt32BE(buf, data);
      return buf.subarray(4);
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 4, type: DataType.int }),
  },
  [DataType.double]: {
    encoder(data: number, buf: Uint8Array) {
      writeDoubleBE(buf, data);
      return buf.subarray(8);
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 8, type: DataType.double }),
  },
  [DataType.bigint]: {
    encoder(data: bigint, buf: Uint8Array) {
      writeBigInt64BE(buf, data);
      return buf.subarray(8);
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 8, type: DataType.bigint }),
  },

  [DataType.string]: {
    calculator(data: string): CalcRes<StrPreData> {
      const len = calcUtf8Length(data);
      const dbnLen = calcU32DByte(len);
      return {
        pretreatment: { str: data, dbnLen: dbnLen, contentLen: len },
        byteLength: dbnLen + len,
        type: DataType.string,
      };
    },
    encoder(data: StrPreData, buf: Uint8Array) {
      encodeU32DInto(data.contentLen, buf.subarray(0, data.dbnLen));
      encodeUtf8Into(data.str, buf.subarray(data.dbnLen));
      return buf.subarray(data.dbnLen + data.contentLen);
    },
  },

  [DataType.symbol]: {
    calculator(data: symbol) {
      return this[DataType.array]([data.description]);
    },
    encoder(data, buf) {
      return this[DataType.array](data, buf);
    },
  },
  [DataType.array]: {
    class: Array,
    calculator(arr: any[]): CalcRes<ArrayPreData> {
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
    encoder(array: ArrayPreData, buf: Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        buf[0] = array[i].type;
        buf = this[array[i].type](array[i].pretreatment, buf.subarray(1));
      }
      buf[0] = DataType.void;
      return buf.subarray(1);
    },
  },
  [DataType.uInt8Arr]: {
    class: Uint8Array,
    calculator(data: Uint8Array): CalcRes<Uint8ArrPreData> {
      const dbnLen = calcU32DByte(data.byteLength);
      return {
        pretreatment: { uInt8Arr: data, dbnLen },
        byteLength: dbnLen + data.byteLength,
        type: DataType.uInt8Arr,
      };
    },
    encoder(data: Uint8ArrPreData, buf: Uint8Array) {
      encodeU32DInto(data.uInt8Arr.byteLength, buf.subarray(0, data.dbnLen));
      buf.set(data.uInt8Arr, data.dbnLen);
      return buf.subarray(data.dbnLen + data.uInt8Arr.byteLength);
    },
  },
  [DataType.object]: {
    calculator(data: Record<string, any>): CalcRes<MapPreData> {
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
    encoder(map: MapPreData, buf: Uint8Array) {
      let item: MapPreData[0];
      for (let i = 0; i < map.length; i++) {
        item = map[i];
        buf[0] = item.value.type;
        buf = this[DataType.string](item.key.pretreatment, buf.subarray(1));
        buf = this[item.value.type](item.value.pretreatment, buf);
      }
      buf[0] = DataType.void;
      return buf.subarray(1);
    },
  },
};

const jsDefaultClassType: DefinedBaseTypeMap = {
  [DataType.set]: {
    class: Set,
    encoder: default_type[DataType.array].encoder,
    calculator(data: Set<any>) {
      return this[DataType.array](Array.from(data));
    },
  },
  [DataType.map]: {
    class: Map,
    encoder: default_type[DataType.array].encoder,
    calculator(data: Map<any, any>) {
      const list: any[] = [];
      let i = 0;
      for (const item of data) {
        list[i] = item[0];
        list[i + 1] = item[1];
        i += 2;
      }
      return this[DataType.array](list);
    },
  },
  [DataType.error]: {
    class: Error,
    encoder: default_type[DataType.object].encoder,
    calculator(error: Error) {
      const errorMap = { ...error, message: error.message, name: error.name };
      if (error.cause) errorMap.cause = error.cause;
      return this[DataType.object](errorMap);
    },
  },
  [DataType.regExp]: {
    class: RegExp,
    encoder: default_type[DataType.string].encoder,
    calculator(data: RegExp) {
      return this[DataType.string](data.source);
    },
  },
};

export const defaultSerializer: JbodSerializer = new JbodSerializer();
