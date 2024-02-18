import type { DecodeResult, Decoder, Encoder } from "../type.js";
import type { Calc, DefinedDataTypeMap, Enc, Dec } from "./type.js";
import { createEncMaps } from "./defined.js";
import { createDecContext } from "./base_trans.js";
import { createCalcContext, createEncContext, toTypeCode } from "./base_trans.js";

/** @public */
export interface JbodTransConfig {
  customObjet?: DefinedDataTypeMap;
}

export class JbodTrans implements Encoder<any, Calc.Result<unknown>>, Decoder {
  private encodeContext: Enc.Context;
  private calcContext: Calc.Context;
  private decContext: Dec.Context;
  constructor(config: JbodTransConfig = {}) {
    const { encMap, calcMap } = createEncMaps(config.customObjet);
    this.calcContext = createCalcContext(calcMap);
    this.encodeContext = createEncContext(encMap);
    this.decContext = createDecContext(createEncMaps().decMap);
  }
  /**
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  decode(buffer: Uint8Array, offset: number = 0, type?: number): DecodeResult {
    if (type === undefined) type = buffer[offset++];
    return this.decContext.decodeItem(buffer, offset, type);
  }
  /** 编码后携带带类型 */
  encodeInto(value: Calc.Result<unknown>, buf: Uint8Array, offset: number = 0) {
    buf[offset++] = value.type;
    return this.encodeContext[value.type](value.pretreatment, buf, offset);
  }
  /** 编码后不携带带类型, 需要注意, 由 byteLength 计算而来的长度是包含类型的 */
  encodeContentInto(value: Calc.Result<unknown>, buf: Uint8Array, offset: number = 0) {
    return this.encodeContext[value.type](value.pretreatment, buf, offset);
  }
  /**
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  toTypeCode(data: any) {
    return toTypeCode(data, this.calcContext.customClassType);
  }
  /**
   * @remarks 计算数据的字节长度, 并进行预处理. 不要修改结果对象, 否则可能会造成异常
   */
  byteLength(data: any) {
    let res = this.calcContext.byteLength(data);
    res.byteLength++;
    return res;
  }
}
