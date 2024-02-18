import { DataType, JbodError, VOID_ID } from "../const.js";
import { Calc, Dec, DefinedDataType, Enc, EncodeFn } from "./type.js";
import {
  writeInt32BE,
  writeBigInt64BE,
  writeDoubleBE,
  calcUtf8Length,
  encodeUtf8Into,
  decodeUtf8,
} from "../../uint_array_util/mod.js";
import { calcU32DByte, decodeU32D, encodeU32DInto } from "../dynamic_binary_number.js";
import { DecodeResult } from "../type.js";
import { defineStruct, toTypeCode } from "./base_trans.js";

type DefinedDataTypeMap = Record<number, DefinedDataType>;
const JS_ClASS_STRUCT = {
  symbol: defineStruct({ description: 1 }),
  error: defineStruct({ message: 1, name: 2, cause: 3, code: 4 }),
  regExp: defineStruct({ source: 1 }),
};
const noContentTrans: EncodeFn = (data, buf, offset) => offset;
const BASE_ENCODERS: Record<string, Enc.Fn> = {
  [DataType.true]: noContentTrans,
  [DataType.false]: noContentTrans,
  [DataType.null]: noContentTrans,
  [DataType.undefined]: noContentTrans, //js
  [DataType.i32]: writeInt32BE,
  [DataType.i64]: writeBigInt64BE,
  [DataType.f64]: writeDoubleBE,
};

const DEFAULT_DEFINE_TYPE: DefinedDataTypeMap = {
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
    decoder(buf, offset) {
      const res = decodeU32D(buf, offset);
      offset += res.byte;
      if (res.value <= 0) return { data: "", offset };
      return {
        data: decodeUtf8(buf.subarray(offset, offset + res.value)),
        offset: offset + res.value,
      };
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
    decoder(buf, offset) {
      const res = decodeU32D(buf, offset);
      offset += res.byte;
      if (res.value <= 0) return { data: new Uint8Array(0), offset };
      return { data: buf.subarray(offset, offset + res.value), offset: offset + res.value };
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
      buf[offset++] = VOID_ID;
      return offset;
    },
    decoder: function dyArrayDecoder(this: Dec.Context, buf: Uint8Array, offset: number): DecodeResult<any[]> {
      let arrayList: unknown[] = [];
      let res: DecodeResult;
      let type: number;
      while (offset < buf.byteLength) {
        type = buf[offset++];
        if (type === VOID_ID) break;
        res = this.decodeItem(buf, offset, type);
        offset = res.offset;
        arrayList.push(res.data);
      }
      return { data: arrayList, offset };
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
      buf[offset++] = VOID_ID;
      return offset;
    },
    decoder(this: Dec.Context, buf, offset) {
      const map: Record<string, unknown> = {};
      let key: string;
      let res: DecodeResult;
      while (offset < buf.byteLength) {
        const type = buf[offset++];
        if (type === VOID_ID) break;
        res = this[DataType.string](buf, offset);
        key = res.data;
        offset = res.offset;

        res = this.decodeItem(buf, offset, type);
        map[key] = res.data;
        offset = res.offset;
      }

      return { data: map, offset };
    },
  },
};
const JS_CLASS_DEFINE_TYPE: DefinedDataTypeMap = {
  [DataType.set]: {
    class: Set,
    encoder: DEFAULT_DEFINE_TYPE[DataType.dyArray].encoder,
    calculator(data: Set<any>) {
      let res = this[DataType.dyArray](Array.from(data));
      res.type = DataType.set;
      return res;
    },
    decoder(this: Dec.Context, buf, offset) {
      const arr: DecodeResult = this[DataType.dyArray](buf, offset);
      arr.data = new Set(arr.data);
      return arr;
    },
  },
  [DataType.map]: {
    class: Map,
    encoder: DEFAULT_DEFINE_TYPE[DataType.dyArray].encoder,
    calculator(data: Map<any, any>) {
      const list: any[] = [];
      let i = 0;
      for (const item of data) {
        list[i] = item[0];
        list[i + 1] = item[1];
        i += 2;
      }
      let res = this[DataType.dyArray](list);
      res.type = DataType.map;
      return res;
    },
    decoder(this: Dec.Context, buf, offset) {
      const res: DecodeResult = this[DataType.dyArray](buf, offset);
      const object = res.data;
      const map = new Map();
      for (let i = 0; i < object.length; i += 2) {
        map.set(object[i], object[i + 1]);
      }
      res.data = map;
      return res;
    },
  },

  [DataType.symbol]: {
    calculator(data: symbol) {
      let res = this.calcStruct(data as any, JS_ClASS_STRUCT.symbol.encodeDefined) as Calc.Result;
      res.type = DataType.symbol;
      return res;
    },
    encoder(data, buf, offset) {
      return this.encodeStruct(data, buf, offset);
    },
    decoder(this: Dec.Context, buf, offset) {
      const res = this.decodeStruct(buf, offset, JS_ClASS_STRUCT.symbol.decodeDefined);
      res.data = Symbol((res.data as Symbol).description);
      return res;
    },
  },
  [DataType.error]: {
    class: Error,
    calculator(data: Error) {
      let res = this.calcStruct(data as any, JS_ClASS_STRUCT.error.encodeDefined) as Calc.Result;
      res.type = DataType.error;
      return res;
    },
    encoder(data, buf, offset) {
      return this.encodeStruct(data, buf, offset);
    },
    decoder(this: Dec.Context, buf, offset) {
      const res = this.decodeStruct(buf, offset, JS_ClASS_STRUCT.error.decodeDefined);
      const struct = res.data as Error;
      const error = new JbodError(struct.message, { cause: struct.cause });
      error.name = struct.name;
      res.data = error;
      return res;
    },
  },
  [DataType.regExp]: {
    class: RegExp,
    calculator(data: RegExp) {
      let res = this.calcStruct(data as any, JS_ClASS_STRUCT.regExp.encodeDefined) as Calc.Result;
      res.type = DataType.regExp;
      return res;
    },
    encoder(data, buf, offset) {
      return this.encodeStruct(data, buf, offset);
    },
    decoder(this: Dec.Context, buf, offset) {
      const res = this.decodeStruct(buf, offset, JS_ClASS_STRUCT.regExp.decodeDefined);
      const struct = res.data as RegExp;
      res.data = new RegExp(struct.source, struct.flags);
      return res;
    },
  },
};
namespace CalcPreData {
  export type Array = Calc.Result[];
  export type DyRecord = { key: String; value: any; type: number }[];
  export type String = { str: string; contentLen: number };
}

export function createEncMaps(customTypes?: DefinedDataTypeMap): {
  calcMap: Record<number, Calc.Fn> & { customClassType: Calc.DefineClass[] };
  encMap: Record<number, Enc.Fn>;
  decMap: Record<number, Dec.Fn>;
} {
  const customType: Calc.DefineClass[] = [];
  const decMap: Record<number, Dec.Fn> = {};
  const encMap: Record<number, Enc.Fn> = {};
  const calcMap: Record<number, Calc.Fn> & { customClassType: Calc.DefineClass[] } = {
    customClassType: customType,
  };

  if (customTypes) mergeMap(encMap, calcMap, decMap, customTypes);
  mergeMap(encMap, calcMap, decMap, JS_CLASS_DEFINE_TYPE);
  mergeMap(encMap, calcMap, decMap, DEFAULT_DEFINE_TYPE);
  Object.assign(encMap, BASE_ENCODERS);
  return {
    calcMap,
    encMap,
    decMap,
  };
}

function mergeMap(
  encMap: Record<number, Enc.Fn>,
  calcMap: Record<number, Calc.Fn> & { customClassType: Calc.DefineClass[] },
  decMap: Record<number, Dec.Fn>,
  definedMap: DefinedDataTypeMap
) {
  for (const [codeStr, item] of Object.entries(definedMap)) {
    let code = parseInt(codeStr);
    if (item.class) calcMap.customClassType.push({ class: item.class!, code });
    if (item.calculator) calcMap[code] = item.calculator;
    if (item.encoder) encMap[code] = item.encoder;
    if (item.decoder) decMap[code] = item.decoder;
  }
}
