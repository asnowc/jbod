import { JbodTrans } from "./data_trans/trans.js";
export { StructTrans } from "./data_trans/struct.js";
export { JbodTrans, type JbodTransConfig } from "./data_trans/trans.js";
class UserJbodTrans extends JbodTrans {
  /**
   * @public
   * @remarks 将数据编码为携带类型的 Uint8Array, 这会比 encodeContent 多一个字节
   */
  encode(data: any) {
    let res = this.byteLength(data);
    const buf = new Uint8Array(res.byteLength);
    this.encodeInto(res, buf);
    return buf;
  }
  /**
   * @public
   * @remarks 将数据编码为不携带类型的 Uint8Array, 这会比 encode 少一个字节
   */
  encodeContent(data: any) {
    let res = this.byteLength(data);
    const buf = new Uint8Array(res.byteLength - 1);
    this.encodeContentInto(res, buf);
    return buf;
  }
}
export default new UserJbodTrans();
