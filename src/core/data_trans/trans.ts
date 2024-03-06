import type { DecodeResult, Decoder, Encoder } from "../type.js";
import { createContext, EncodeContext, DecodeContext } from "./ctx.js";
import { DataWriter, Defined } from "./defined/type.js";
import { JbodWriter } from "./defined/mod.js";
/** @internal */
export interface JbodTransConfig {
  customObjet?: Record<number, Defined>;
}
type UserCalcResult = { byteLength: number; type: number; pretreatment: unknown };

/** @internal */
export class JbodTrans implements Encoder<any, UserCalcResult>, Decoder {
  protected encContext: EncodeContext;
  protected decContext: DecodeContext;
  constructor(config: JbodTransConfig = {}) {
    const { dec, enc } = createContext(config.customObjet);
    this.encContext = enc;
    this.decContext = dec;
  }
  /**
   * @public
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 如果不指定, 将从 buffer 的第一个字节读取, 否则认为buffer 不携带类型
   */
  decode<T = any>(buffer: Uint8Array, offset: number = 0, type?: number): DecodeResult<T> {
    if (type === undefined) type = buffer[offset++];
    return this.decContext[type](buffer, offset, this.decContext);
  }

  /**
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  toTypeCode(data: any) {
    return this.encContext.toTypeCode(data);
  }

  createWriter(data: any) {
    return new JbodWriter(data, this.encContext);
  }
  createContentWriter(data: any) {
    const type = this.encContext.toTypeCode(data);
    return new this.encContext[type](data, this.encContext);
  }

  /**
   * @remarks 计算数据的字节长度, 并进行预处理. 不要修改结果对象, 否则可能会造成异常
   */
  byteLength(data: any): UserCalcResult {
    const type = this.encContext.toTypeCode(data);
    const writer = new this.encContext[type](data, this.encContext);
    return { byteLength: writer.byteLength + 1, type, pretreatment: writer };
  }
  /**
   * @remarks 将数据编码为携带类型的 Uint8Array, 这会比 encodeContentInto 多一个字节 */
  encodeInto(value: UserCalcResult, buf: Uint8Array, offset: number = 0) {
    buf[offset++] = value.type;
    return (value.pretreatment as DataWriter).encodeTo(buf, offset);
  }
  /**
   * @deprecated 改用 createContentWriter
   * @remarks 将数据编码为不携带类型的 Uint8Array, 这会比 encodeInto 少一个字节
   */
  encodeContentInto(value: UserCalcResult, buf: Uint8Array, offset: number = 0) {
    return (value.pretreatment as DataWriter).encodeTo(buf, offset);
  }
}

export { type Defined };
