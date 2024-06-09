import { JbodCodec } from "./data_trans/mod.ts";
export type * from "./type.ts";
export * from "./data_trans/mod.ts";
import * as varints from "./varints/mod.ts";

/** varints 的别名
 * @public
 * @deprecated - 改用 varints */
export const DBN = varints;
export { varints };

/** JBOD 编解码器
 * @public */
class UserJbodCodec extends JbodCodec {
  /** 将数据编码为携带类型的 Uint8Array, 这会比 encodeContent 多一个字节
   * @public
   */
  encode(data: any): Uint8Array {
    const res = this.createWriter(data);
    const buf = new Uint8Array(res.byteLength);
    res.encodeTo(buf, 0);
    return buf;
  }
  /** 将数据编码为不携带类型的 Uint8Array, 这会比 encode 少一个字节
   * @public
   */
  encodeContent(data: any): Uint8Array {
    const res = this.createContentWriter(data);
    const buf = new Uint8Array(res.byteLength);
    res.encodeTo(buf, 0);
    return buf;
  }
}
export type { UserJbodCodec };
export default new UserJbodCodec() as UserJbodCodec;
