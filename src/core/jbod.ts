import { JbodDecoder } from "./data_trans/decoder.js";
import { JbodEncoder } from "./data_trans/encoder.js";

// export { JbodEncoder, type DefinedDataType, type JbodEncoderConfig } from "./data_trans/encoder.js";
// export { JbodDecoder } from "./data_trans/decoder.js";
export { type JbodAsyncIteratorItem } from "./type.js";

const defaultDecoder = new JbodDecoder();
const defaultEncoder = new JbodEncoder();
export default {
  /**
   * @public
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 这会认为 buffer 的第一个字节是数据的值, 而不是数据类型
   */
  decode: defaultDecoder.decode.bind(defaultDecoder),

  encodeInto: defaultEncoder.encodeInto.bind(defaultEncoder),
  calcLen: defaultEncoder.calcLen.bind(defaultEncoder),

  /**
   *
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  getType: defaultEncoder.toTypeCode,
  /**
   * @public
   * @remarks 将数据转为带类型的的完整二进制数据
   */
  encode: function encodeJbod(data: any) {
    let res = defaultEncoder.calcLen(data);
    const buf = new Uint8Array(res.byteLength + 1);
    defaultEncoder.encodeInto(res, buf.subarray(1));
    buf[0] = defaultEncoder.toTypeCode(data);
    return buf;
  },
  /**
   * @public
   * @remarks 将数据转为不带类型的二进制数据
   */
  encodeContent: function binaryifyJbodContent(data: any) {
    let res = defaultEncoder.calcLen(data);
    const buf = new Uint8Array(res.byteLength);
    defaultEncoder.encodeInto(res, buf);
    return buf;
  },
};
