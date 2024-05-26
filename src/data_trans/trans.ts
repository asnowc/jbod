import type { DecodeResult, Decoder, Encoder } from "../type.ts";
import { createContext, EncodeContext, DecodeContext } from "./ctx.ts";
import { DataWriter, Defined } from "./defined/type.ts";
import { JbodWriter } from "./defined/mod.ts";
/** @internal */
export interface JbodTransConfig {
  customObjet?: Record<number, Defined>;
}
type UserCalcResult = { byteLength: number; type: number; pretreatment: unknown };

/** @internal */
export class JbodTrans implements Encoder<any>, Decoder {
  protected encContext: EncodeContext;
  protected decContext: DecodeContext;
  constructor(config: JbodTransConfig = {}) {
    const { dec, enc } = createContext(config.customObjet);
    this.encContext = enc;
    this.decContext = dec;
  }
  /** 从 Uint8Array 解析数据
   * @public
   * @param type - 指定解析的数据类型. 如果不指定, 将从 buffer 的第一个字节读取, 否则认为buffer 不携带类型
   */
  decode<T = any>(buffer: Uint8Array, offset: number = 0, type?: number): DecodeResult<T> {
    if (type === undefined) type = buffer[offset++];
    return this.decContext[type](buffer, offset, this.decContext);
  }

  /** 获取数据对应的类型 ID
   * @public
   */
  toTypeCode(data: any) {
    return this.encContext.toTypeCode(data);
  }
  /** 创建 DataWriter 用于编码, 这个方法创建的 DataWriter 会比 encodeContentWriter 多一个字节
   * @param data - 需要编码的数据
   * @example
   *
   * ```ts
   *    const data=[1,2,3];
   *    const writer=JBOD.createWriter(data);
   *    const buf=new Uint8Array(writer.byteLength)
   *    writer.encodeTo(buf);
   *
   *    JBOD.decode(buf)
   * ```
   */
  createWriter(data: any): DataWriter {
    return new JbodWriter(data, this.encContext);
  }
  /** 创建 DataWriter 用于编码 将数据编码为不携带类型的 Uint8Array, 这会比 encodeInto 少一个字节
   * @param data - 需要编码的数据
   */
  createContentWriter(data: any): DataWriter {
    const type = this.encContext.toTypeCode(data);
    return new this.encContext[type](data, this.encContext);
  }

  /** 计算数据的字节长度, 并进行预处理. 不要修改结果对象, 否则可能会造成异常
   * @deprecated 改用 createWriter()
   */
  byteLength(data: any): UserCalcResult {
    const type = this.encContext.toTypeCode(data);
    const writer = new this.encContext[type](data, this.encContext);
    return { byteLength: writer.byteLength + 1, type, pretreatment: writer };
  }
  /** 将数据编码为携带类型的 Uint8Array, 这会比 encodeContentInto 多一个字节
   * @deprecated 改用 createContentWriter() */
  encodeInto(value: UserCalcResult, buf: Uint8Array, offset: number = 0) {
    buf[offset++] = value.type;
    return (value.pretreatment as DataWriter).encodeTo(buf, offset);
  }
  /** 将数据编码为不携带类型的 Uint8Array, 这会比 encodeInto 少一个字节
   * @deprecated 改用 createContentWriter()
   */
  encodeContentInto(value: UserCalcResult, buf: Uint8Array, offset: number = 0) {
    return (value.pretreatment as DataWriter).encodeTo(buf, offset);
  }
}

export { type Defined };
