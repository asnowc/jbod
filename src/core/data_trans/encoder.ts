import { Encoder } from "../type.js";
import { createCalcContext, createEncContext, toTypeCode } from "./base_trans.js";
import { createEncMaps } from "./defined.js";
import { Calc, DefinedDataTypeMap, Enc } from "./type.js";

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
    buf[offset++] = value.type;
    return this.encodeContext[value.type](value.pretreatment, buf, offset);
  }
  encodeContentInto(value: Calc.Result, buf: Uint8Array, offset: number = 0) {
    return this.encodeContext[value.type](value.pretreatment, buf, offset);
  }
  toTypeCode(data: any) {
    return toTypeCode(data, this.calcContext.customClassType);
  }
  byteLength(data: any) {
    let res = this.calcContext.byteLength(data);
    res.byteLength++;
    return res;
  }
}
