import { JbodDecoder } from "./data_trans/decoder.js";
import { JbodEncoder, JbodEncoderConfig } from "./data_trans/encoder.js";
export { defineStruct } from "./data_trans/base_trans.js";
export { StructEncoder } from "./data_trans/struct.js";
export { type JbodEncoderConfig };
const defaultDecoder = new JbodDecoder();
const defaultEncoder = new JbodEncoder();
export default {
  /**
   * @public
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  decode: defaultDecoder.decode.bind(defaultDecoder),
  /** 编码后携带带类型 */
  encodeInto: defaultEncoder.encodeInto.bind(defaultEncoder),
  /** 编码后不携带带类型, 需要注意, 由 byteLength 计算而来的长度是包含类型的 */
  encodeContentInto: defaultEncoder.encodeContentInto.bind(defaultEncoder),
  byteLength: defaultEncoder.byteLength.bind(defaultEncoder),
  /**
   *
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  toTypeCode: defaultEncoder.toTypeCode.bind(defaultEncoder),

  /**
   * @public
   * @remarks 将数据转为带类型的的完整二进制数据
   */
  encode: function encodeJbod(data: any) {
    let res = defaultEncoder.byteLength(data);
    const buf = new Uint8Array(res.byteLength);
    defaultEncoder.encodeInto(res, buf);
    return buf;
  },
  /**
   * @public
   * @remarks 将数据转为不带类型的二进制数据
   */
  encodeContent: function encodeJbodContent(data: any) {
    let res = defaultEncoder.byteLength(data);
    const buf = new Uint8Array(res.byteLength - 1);
    defaultEncoder.encodeContentInto(res, buf);
    return buf;
  },
};
