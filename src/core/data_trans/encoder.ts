import { calcU32DByte, encodeU32DInto } from "../dynamic_binary_number.js";

import { DataType, UnsupportedDataTypeError } from "../../const.js";
import {
  writeInt32BE,
  writeBigInt64BE,
  writeDoubleBE,
  calcUtf8Length,
  encodeUtf8Into,
} from "../../uint_array_util/mod.js";
import { Encoder } from "../type.js";
/** @public */
export interface JbodEncoderConfig {
  customObjet?: DefinedDataTypeMap;
}

interface ClassType {
  code: number;
  class: new (...args: any[]) => object;
}
/** @public */
export type DefinedDataType = {
  calculator: Calculator;
  encoder: EncodeFn;
  class?: new (...args: any[]) => object;
};
type DefinedDataTypeMap = Record<number, DefinedDataType>;

function toTypeCode(this: CalculatorMap, data: any, safe?: boolean): number {
  let type: number;
  switch (typeof data) {
    case "undefined":
      return DataType.undefined;
    case "boolean":
      return data ? DataType.true : DataType.false;
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647) type = DataType.f64;
      else type = DataType.i32;
      break;
    case "string":
      type = DataType.string;
      break;
    case "bigint":
      type = DataType.u64;
      break;
    case "symbol":
      type = DataType.symbol;
      break;
    case "object": {
      if (data === null) return DataType.null;
      else if (data instanceof Array) return DataType.dyArray;
      let item: (typeof this.customClassType)[0];
      for (let i = 0; i < this.customClassType.length; i++) {
        item = this.customClassType[i];
        if (data instanceof item.class) return item.code;
      }
      return DataType.dyRecord;
    }
    default:
      if (safe) return DataType.undefined;
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}

/** @public */
export class JbodEncoder implements Encoder<any, CalcRes> {
  private encoderMap: EncoderMap;
  private calculatorMap: CalculatorMap;
  constructor(config: JbodEncoderConfig = {}) {
    const customType: ClassType[] = [];
    const encoderMap: EncoderMap = {};
    const calculatorMap: CalculatorMap = {
      toTypeCode,
      fixedLength: new Map(),
      customClassType: customType,
    };
    this.toTypeCode = toTypeCode.bind(calculatorMap);
    this.calculatorMap = calculatorMap;
    this.encoderMap = encoderMap;

    if (config.customObjet) this.merge(encoderMap, calculatorMap, customType, config.customObjet);
    this.merge(encoderMap, calculatorMap, customType, jsDefaultClassType);
    this.merge(encoderMap, calculatorMap, customType, default_type);
  }
  private merge(
    encoderMap: EncoderMap,
    calculatorMap: CalculatorMap,
    classType: ClassType[],
    definedMap: DefinedDataTypeMap
  ) {
    for (const [codeStr, item] of Object.entries(definedMap)) {
      let code = parseInt(codeStr);
      if (item.class) classType.push({ class: item.class!, code });
      encoderMap[code] = item.encoder;
      calculatorMap[code] = item.calculator;
    }
  }

  encodeInto(value: CalcRes, buf: Uint8Array, offset: number = 0) {
    offset = this.encoderMap[value.type](value.pretreatment, buf, offset);
    return buf.subarray(offset);
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
type MapPreData = { key: StrPreData; value: any; type: number }[];
type StrPreData = { str: string; contentLen: number };

type EncodeFn = (this: EncoderMap, data: any, buf: Uint8Array, offset: number) => number;
type Calculator = (this: CalculatorMap, data: any) => CalcRes;
type EncoderMap = Record<number, EncodeFn>;

type CalculatorMap = {
  customClassType: ClassType[];
  fixedLength: Map<number, number>;
  toTypeCode(data: any, safe?: boolean): number;
  [key: number]: Calculator;
};
const noContentTrans: EncodeFn = (data, buf, offset) => offset;

const default_type: DefinedDataTypeMap = {
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

  [DataType.i32]: {
    encoder(data: number, buf: Uint8Array, offset) {
      writeInt32BE(buf, data, offset);
      return offset + 4;
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 4, type: DataType.i32 }),
  },
  [DataType.f64]: {
    encoder(data: number, buf: Uint8Array, offset) {
      writeDoubleBE(buf, data, offset);
      return offset + 8;
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 8, type: DataType.f64 }),
  },
  [DataType.u64]: {
    encoder(data: bigint, buf: Uint8Array, offset) {
      writeBigInt64BE(buf, data, offset);
      return offset + 8;
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 8, type: DataType.u64 }),
  },

  [DataType.string]: {
    calculator(data: string): CalcRes<StrPreData> {
      const len = calcUtf8Length(data);
      const dbnLen = calcU32DByte(len);
      return {
        pretreatment: { str: data, contentLen: len },
        byteLength: dbnLen + len,
        type: DataType.string,
      };
    },
    encoder(data: StrPreData, buf: Uint8Array, offset) {
      offset = encodeU32DInto(data.contentLen, buf, offset);
      return encodeUtf8Into(data.str, buf, offset);
    },
  },
  [DataType.binary]: {
    class: Uint8Array,
    calculator(data: Uint8Array): CalcRes<Uint8Array> {
      const dbnLen = calcU32DByte(data.byteLength);
      return {
        pretreatment: data,
        byteLength: dbnLen + data.byteLength,
        type: DataType.binary,
      };
    },
    encoder(data: Uint8Array, buf: Uint8Array, offset) {
      offset = encodeU32DInto(data.byteLength, buf, offset);
      buf.set(data, offset);
      return offset + data.byteLength;
    },
  },
  [DataType.dyArray]: {
    class: Array,
    calculator: function dyArrayCalculator(arr: any[]): CalcRes<ArrayPreData> {
      let preData: ArrayPreData = new Array(arr.length);
      let totalLen = preData.length + 1; //type*length+ void
      let valueRes: CalcRes;
      let itemType: number;

      for (let i = 0; i < arr.length; i++) {
        itemType = this.toTypeCode(arr[i]);
        valueRes = this[itemType](arr[i]);
        valueRes.type = itemType;
        totalLen += valueRes.byteLength;
        preData[i] = valueRes;
      }

      return { pretreatment: preData, byteLength: totalLen, type: DataType.dyArray };
    },
    encoder: function dyArrayEncoder(array: ArrayPreData, buf: Uint8Array, offset) {
      for (let i = 0; i < array.length; i++) {
        buf[offset] = array[i].type;
        offset = this[array[i].type](array[i].pretreatment, buf, offset + 1);
      }
      buf[offset++] = DataType.void;
      return offset;
    },
  },
  [DataType.dyRecord]: {
    calculator: function dyRecordCalculator(data: Record<string, any>): CalcRes<MapPreData> {
      const map = Object.keys(data);
      let preData: MapPreData = new Array(map.length);
      let totalLen = map.length + 1; //type*length + void

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

        totalLen += keyRes.byteLength + valueRes.byteLength;

        preData[i] = {
          key: keyRes.pretreatment,
          value: valueRes.pretreatment,
          type: valueRes.type,
        };
      }
      return { pretreatment: preData, byteLength: totalLen, type: DataType.dyRecord };
    },
    encoder: function dyRecordEncoder(map: MapPreData, buf: Uint8Array, offset) {
      let item: MapPreData[0];
      for (let i = 0; i < map.length; i++) {
        item = map[i];
        buf[offset++] = item.type;
        offset = this[DataType.string](item.key, buf, offset);
        offset = this[item.type](item.value, buf, offset);
      }
      buf[offset++] = DataType.void;
      return offset;
    },
  },
};

const jsDefaultClassType: DefinedDataTypeMap = {
  [DataType.symbol]: {
    calculator(data: symbol) {
      return this[DataType.dyArray]([data.description]);
    },
    encoder(data, buf, offset) {
      return this[DataType.dyArray](data, buf, offset);
    },
  },
  [DataType.error]: {
    class: Error,
    encoder: default_type[DataType.dyRecord].encoder,
    calculator(error: Error) {
      const errorMap = { ...error, message: error.message, name: error.name };
      if (error.cause) errorMap.cause = error.cause;
      return this[DataType.dyRecord](errorMap);
    },
  },
  [DataType.set]: {
    class: Set,
    encoder: default_type[DataType.dyArray].encoder,
    calculator(data: Set<any>) {
      return this[DataType.dyArray](Array.from(data));
    },
  },
  [DataType.map]: {
    class: Map,
    encoder: default_type[DataType.dyArray].encoder,
    calculator(data: Map<any, any>) {
      const list: any[] = [];
      let i = 0;
      for (const item of data) {
        list[i] = item[0];
        list[i + 1] = item[1];
        i += 2;
      }
      return this[DataType.dyArray](list);
    },
  },

  [DataType.regExp]: {
    class: RegExp,
    encoder: default_type[DataType.string].encoder,
    calculator(data: RegExp) {
      return this[DataType.string](data.source);
    },
  },
  [DataType.undefined]: {
    encoder: noContentTrans,
    calculator: () => ({ pretreatment: undefined, type: DataType.undefined, byteLength: 0 }),
  },
};
