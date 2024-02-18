import type { DecodeResult, Decoder, Encoder } from "../type.js";
import type { Calc, Enc, Dec, DefinedDataType } from "./type.js";
import { createEncMaps } from "./defined.js";
import { createDecContext } from "./base_trans.js";
import { createCalcContext, createEncContext, toTypeCode } from "./base_trans.js";

/** @internal */
export interface JbodTransConfig {
  customObjet?: Record<number, DefinedDataType>;
}
type UserCalcResult = { byteLength: number; type: number; pretreatment: unknown };

/** @internal */
export class JbodTrans implements Encoder<any, UserCalcResult>, Decoder {
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
   * @public
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 如果不指定, 将从 buffer 的第一个字节读取, 否则认为buffer 不携带类型
   */
  decode(buffer: Uint8Array, offset: number = 0, type?: number): DecodeResult {
    if (type === undefined) type = buffer[offset++];
    return this.decContext.decodeItem(buffer, offset, type);
  }
  /** @remarks 将数据编码为携带类型的 Uint8Array, 这会比 encodeContentInto 多一个字节 */
  encodeInto(value: UserCalcResult, buf: Uint8Array, offset: number = 0) {
    buf[offset++] = value.type;
    return this.encodeContext[value.type](value.pretreatment, buf, offset);
  }
  /** @remarks 将数据编码为不携带类型的 Uint8Array, 这会比 encodeInto 少一个字节 */
  encodeContentInto(value: UserCalcResult, buf: Uint8Array, offset: number = 0) {
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
  byteLength(data: any): UserCalcResult {
    let res = this.calcContext.byteLength(data);
    res.byteLength++;
    return res;
  }
}

export { type DefinedDataType };
