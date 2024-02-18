## JavaScript Binary Object Data

**目前尚不稳定**

JBOD 借鉴了 BSON 和 ProtoBuf, 不过设计 JBOD 的主要用于传输 JavaScript 数据，当然也可以用于存储数据。 [查看 JBOD 数据帧格式](./docs/jbod.md)
JBOD 比 JSON 支持更多的 JavaScript 数据类型

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
   * @param type - 指定解析的数据类型. 如果不指定, 将从 buffer 的第一个字节读取, 否则认为buffer 不携带类型
   */
  decode(buffer: Uint8Array, offset?: number, type?: number): DecodeResult;
  /** 将数据编码为携带类型的 Uint8Array, 这会比 encodeContentInto 多一个字节 */
  encodeInto(value: UserCalcResult, buf: Uint8Array, offset?: number): number;
  /** 将数据编码为不携带类型的 Uint8Array, 这会比 encodeInto 少一个字节 */
  encodeContentInto(value: UserCalcResult, buf: Uint8Array, offset?: number): number;
  /**
   * @public
   * @remarks 获取数据对应的类型 ID
   */
  toTypeCode(data: any): number;
  /**
   * @remarks 计算数据的字节长度, 并进行预处理. 不要修改结果对象, 否则可能会造成异常
   */
  byteLength(data: any): UserCalcResult;

  /**
   * @public
   * @remarks 将数据编码为携带类型的 Uint8Array, 这会比 encodeContent 多一个字节
   */
  encode(data: any): Uint8Array;
  /**
   * @public
   * @remarks 将数据编码为不携带类型的 Uint8Array, 这会比 encode 少一个字节
   */
  encodeContent(data: any): Uint8Array;
};
export type { JBOD as default };
```
