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
import { Calc, EncoderMap, DefinedDataTypeMap, EncodeFn, JbodEncoderConfig } from "./type.js";

function toTypeCode(data: any, customClassType?: Calc.ClassType[]): number {
  let type: number;
  switch (typeof data) {
    case "number":
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647) type = DataType.f64;
      else type = DataType.i32;
      break;
    case "bigint":
      type = DataType.i64;
      break;
    case "boolean":
      return data ? DataType.true : DataType.false;
    case "string":
      type = DataType.string;
      break;
    case "undefined":
      return DataType.undefined;
    case "symbol":
      type = DataType.symbol;
      break;
    case "object": {
      if (data === null) return DataType.null;

      if (data instanceof Array) return DataType.dyArray;
      let item: Calc.ClassType;
      if (customClassType?.length) {
        for (let i = 0; i < customClassType.length; i++) {
          item = customClassType[i];
          if (data instanceof item.class) return item.code;
        }
      }
      return DataType.dyRecord;
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
  return type;
}
function byteLength(this: Calc.CalcMap, data: any): Calc.Result {
  switch (typeof data) {
    case "number": {
      if (data % 1 !== 0 || data < -2147483648 || data > 2147483647)
        return { type: DataType.f64, byteLength: 8, pretreatment: data };
      else return { type: DataType.i32, byteLength: 4, pretreatment: data };
    }
    case "bigint":
      return { type: DataType.i64, byteLength: 8, pretreatment: data };
    case "string":
      return this[DataType.string](data);
    case "boolean":
      return { byteLength: 0, pretreatment: undefined, type: data ? DataType.true : DataType.false };
    case "undefined":
      return { byteLength: 0, pretreatment: undefined, type: DataType.undefined };
    case "symbol":
      return this[DataType.symbol](data);
    case "object": {
      if (data === null) return { type: DataType.null, byteLength: 0, pretreatment: undefined };

      if (data instanceof Array) return this[DataType.dyArray](data);

      let item: (typeof this.customClassType)[0];
      for (let i = 0; i < this.customClassType.length; i++) {
        item = this.customClassType[i];
        if (data instanceof item.class) return this[item.code](data);
      }
      return this[DataType.dyRecord](data);
    }
    default:
      throw new UnsupportedDataTypeError(typeof data);
  }
}

export class JbodEncoder implements Encoder<any, Calc.Result> {
  private encoderMap: EncoderMap;
  private calculatorMap: Calc.CalcMap;
  constructor(config: JbodEncoderConfig = {}) {
    const customType: Calc.ClassType[] = [];
    const encoderMap: EncoderMap = {};
    const calculatorMap: Calc.CalcMap = {
      byteLength,
      customClassType: customType,
    };
    this.calculatorMap = calculatorMap;
    this.encoderMap = encoderMap;

    if (config.customObjet) this.merge(encoderMap, calculatorMap, customType, config.customObjet);
    this.merge(encoderMap, calculatorMap, customType, jsDefaultClassType);
    this.merge(encoderMap, calculatorMap, customType, default_type);
  }
  private merge(
    encoderMap: EncoderMap,
    calculatorMap: Calc.CalcMap,
    classType: Calc.ClassType[],
    definedMap: DefinedDataTypeMap
  ) {
    for (const [codeStr, item] of Object.entries(definedMap)) {
      let code = parseInt(codeStr);
      if (item.class) classType.push({ class: item.class!, code });
      encoderMap[code] = item.encoder;
      calculatorMap[code] = item.calculator;
    }
  }

  encodeInto(value: Calc.Result, buf: Uint8Array, offset: number = 0) {
    return this.encoderMap[value.type](value.pretreatment, buf, offset);
  }
  toTypeCode(data: any) {
    return toTypeCode(data, this.calculatorMap.customClassType);
  }

  byteLength(data: any) {
    return this.calculatorMap.byteLength(data);
  }
}

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
  [DataType.i64]: {
    encoder(data: bigint, buf: Uint8Array, offset) {
      writeBigInt64BE(buf, data, offset);
      return offset + 8;
    },
    calculator: (data) => ({ pretreatment: data, byteLength: 8, type: DataType.i64 }),
  },

  [DataType.string]: {
    calculator(data: string): Calc.Result<CalcPreData.String> {
      const len = calcUtf8Length(data);
      const dbnLen = calcU32DByte(len);
      return {
        pretreatment: { str: data, contentLen: len },
        byteLength: dbnLen + len,
        type: DataType.string,
      };
    },
    encoder(data: CalcPreData.String, buf: Uint8Array, offset) {
      offset = encodeU32DInto(data.contentLen, buf, offset);
      return encodeUtf8Into(data.str, buf, offset);
    },
  },
  [DataType.binary]: {
    class: Uint8Array,
    calculator(data: Uint8Array): Calc.Result<Uint8Array> {
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
    calculator: function dyArrayCalculator(arr: any[]): Calc.Result<CalcPreData.Array> {
      let preData: CalcPreData.Array = new Array(arr.length);
      let totalLen = preData.length + 1; //type*length+ void
      let valueRes: Calc.Result;

      for (let i = 0; i < arr.length; i++) {
        valueRes = this.byteLength(arr[i]);
        totalLen += valueRes.byteLength;
        preData[i] = valueRes;
      }

      return { pretreatment: preData, byteLength: totalLen, type: DataType.dyArray };
    },
    encoder: function dyArrayEncoder(array: CalcPreData.Array, buf: Uint8Array, offset) {
      for (let i = 0; i < array.length; i++) {
        buf[offset] = array[i].type;
        offset = this[array[i].type](array[i].pretreatment, buf, offset + 1);
      }
      buf[offset++] = DataType.void;
      return offset;
    },
  },
  [DataType.dyRecord]: {
    calculator: function dyRecordCalculator(data: Record<string, any>): Calc.Result<CalcPreData.DyRecord> {
      const map = Object.keys(data);
      let preData: CalcPreData.DyRecord = new Array(map.length);
      let totalLen = map.length + 1; //type*length + void

      let item: any;
      let keyRes: Calc.Result;
      let valueRes: Calc.Result;

      for (let i = 0; i < map.length; i++) {
        item = data[map[i]];
        keyRes = this[DataType.string](map[i]);
        valueRes = this.byteLength(item);
        totalLen += keyRes.byteLength + valueRes.byteLength;

        preData[i] = {
          key: keyRes.pretreatment,
          value: valueRes.pretreatment,
          type: valueRes.type,
        };
      }
      return { pretreatment: preData, byteLength: totalLen, type: DataType.dyRecord };
    },
    encoder: function dyRecordEncoder(map: CalcPreData.DyRecord, buf: Uint8Array, offset) {
      let item: CalcPreData.DyRecord[0];
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
namespace CalcPreData {
  export type Array = Calc.Result[];
  export type DyRecord = { key: String; value: any; type: number }[];
  export type String = { str: string; contentLen: number };
}
