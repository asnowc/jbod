import { JbodTrans } from "./data_trans/trans.js";
export { StructTrans, type Struct, type StructType } from "./data_trans/struct.js";
export { JbodTrans, type JbodTransConfig, type Defined } from "./data_trans/trans.js";
export type * from "./type.js";
export * from "./data_trans/mod.js";
import * as varints from "./varints/mod.js";
export {
  /** @deprecated - 改用 varints */
  varints as DBN,
  varints,
};
class UserJbodTrans extends JbodTrans {
  /**
   * @public
   * @remarks 将数据编码为携带类型的 Uint8Array, 这会比 encodeContent 多一个字节
   */
  encode(data: any) {
    const res = this.createWriter(data);
    const buf = new Uint8Array(res.byteLength);
    res.encodeTo(buf, 0);
    return buf;
  }
  /**
   * @public
   * @remarks 将数据编码为不携带类型的 Uint8Array, 这会比 encode 少一个字节
   */
  encodeContent(data: any) {
    const res = this.createContentWriter(data);
    const buf = new Uint8Array(res.byteLength);
    res.encodeTo(buf, 0);
    return buf;
  }
}
export default new UserJbodTrans();
