## JavaScript Binary Object Data

支持更多 JS 数据类型的序列化与反序列化库，序列化后大小占用很小。可用于传输、和存储。
借鉴了 BSON 和 ProtoBuf, 不过设计 JBOD 的主要用于传输 JavaScript 数据。 [查看 JBOD 数据帧格式](./docs/jbod.md)

**目前尚不稳定**

### 功能特性

##### 更多的 JavaScript 数据类型

| 类型       | 备注                                                                  |
| ---------- | --------------------------------------------------------------------- |
| boolean    |                                                                       |
| null       |                                                                       |
| undefined  |                                                                       |
| number     | 支持 NaN、-Infinity、+Infinity                                        |
| bigint     |                                                                       |
| Uint8Array |                                                                       |
| string     |                                                                       |
| RegExp     |                                                                       |
| Array      |                                                                       |
| Object     |                                                                       |
| Symbol     | 意义不大, 转换后只保留 description 属性                               |
| Error      | 仅支持保留 cause、code、message、name 属性 , 转换后会转变成 JbodError |
| Map        |                                                                       |
| Set        |                                                                       |

##### 更小的二进制数据大小

暂无示例

### 使用

#### node

`npm install jbod`

```js
import JBOD from "jbod";

const data = [1, "string", new Set([7, 2, 4]), new Uint8Array([1, 2, 3]), 12n];

const u8Arr = JBOD.encode(data);
const data2 = JBOD.decode(u8Arr);
```

#### deno 或浏览器

```ts
import JBOD from "https://esm.sh/jbod";
const data = [1, "string", new Set([7, 2, 4]), new Uint8Array([1, 2, 3]), 12n];

const u8Arr = JBOD.encode(data);
const data2 = JBOD.decode(u8Arr);
```

### API

```ts
type UserCalcResult = { byteLength: number; type: number; pretreatment: unknown };
declare const JBOD: {
  /**
   * @remarks 从 Uint8Array 解析数据
   * @param type - 指定解析的数据类型. 对于 createWriter() 编码的数据，不应指定。 对于 encodeContentWriter() 编码的数据，需要指定才能正确解析。
   */
  decode(buffer: Uint8Array, offset?: number, type?: number): DecodeResult;
  /** 创建 DataWriter 用于编码, 这个方法创建的 DataWriter 会比 encodeContentWriter 多一个字节 */
  createWriter(data: any): DataWriter;
  /** 创建 DataWriter 用于编码 将数据编码为不携带类型的 Uint8Array, 这会比 encodeInto 少一个字节  */
  encodeContentWriter(data: any): DataWriter;
  /**
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  toTypeCode(data: any): number;
  /**
   * @public
   * @remarks 将数据直接编码为二进制数据
   */
  encode(data: any): Uint8Array;
};
export type { JBOD as default };

export interface DataWriter {
  encodeTo(buf: Uint8Array, offset: number): number;
  readonly byteLength: number;
}
```
