import { JbodCodec } from "./data_trans/codec.ts";
export { StructTrans, type Struct, type StructType } from "./data_trans/struct.ts";
export { JbodCodec, type JbodTransConfig, type Defined } from "./data_trans/codec.ts";
export type * from "./type.ts";
export * from "./data_trans/mod.ts";
import * as varints from "./varints/mod.ts";
export {
  /** @deprecated - 改用 varints */
  varints as DBN,
  varints,
};
class UserJbodCodec extends JbodCodec {
  /** 将数据编码为携带类型的 Uint8Array, 这会比 encodeContent 多一个字节
   * @public
   */
  encode(data: any) {
    const res = this.createWriter(data);
    const buf = new Uint8Array(res.byteLength);
    res.encodeTo(buf, 0);
    return buf;
  }
  /** 将数据编码为不携带类型的 Uint8Array, 这会比 encode 少一个字节
   * @public
   */
  encodeContent(data: any) {
    const res = this.createContentWriter(data);
    const buf = new Uint8Array(res.byteLength);
    res.encodeTo(buf, 0);
    return buf;
  }
}
export default new UserJbodCodec();
