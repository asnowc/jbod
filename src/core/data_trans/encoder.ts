import { DataType, UnsupportedDataTypeError } from "../const.js";
import { Encoder } from "../type.js";
import { createCalcContext, createEncContext } from "./base_trans.js";
import { createEncMaps } from "./defined.js";
import { Calc, DefinedDataTypeMap, Enc } from "./type.js";

function toTypeCode(data: any, customClassType?: Calc.DefineClass[]): number {
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
      let item: Calc.DefineClass;
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
/** @public */
export interface JbodEncoderConfig {
  customObjet?: DefinedDataTypeMap;
}

export class JbodEncoder implements Encoder<any, Calc.Result> {
  private encodeContext: Enc.Context;
  private calcContext: Calc.Context;
  constructor(config: JbodEncoderConfig = {}) {
    const { encMap, calcMap } = createEncMaps(config.customObjet);
    this.calcContext = createCalcContext(calcMap);
    this.encodeContext = createEncContext(encMap);
  }

  encodeInto(value: Calc.Result, buf: Uint8Array, offset: number = 0) {
    return this.encodeContext[value.type](value.pretreatment, buf, offset);
  }
  toTypeCode(data: any) {
    return toTypeCode(data, this.calcContext.customClassType);
  }
  byteLength(data: any) {
    return this.calcContext.byteLength(data);
  }
}
