import { JbodTrans, JbodTransConfig } from "./data_trans/trans.js";
export { defineStruct } from "./data_trans/base_trans.js";
export { StructTrans } from "./data_trans/struct.js";
export { type JbodTransConfig as JbodEncoderConfig };
class UserJbodTrans extends JbodTrans {
  /**
   * @public
   * @remarks 将数据转为带类型的的完整二进制数据
   */
  encode(data: any) {
    let res = this.byteLength(data);
    const buf = new Uint8Array(res.byteLength);
    this.encodeInto(res, buf);
    return buf;
  }
  /**
   * @public
   * @remarks 将数据转为不带类型的二进制数据
   */
  encodeContent(data: any) {
    let res = this.byteLength(data);
    const buf = new Uint8Array(res.byteLength - 1);
    this.encodeContentInto(res, buf);
    return buf;
  }
}
export default new UserJbodTrans();
