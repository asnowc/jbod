## JavaScript Binary Object Data

**目前尚不稳定，可能会有较大的破坏性变更**

JBOD 借鉴了 BSON 和 ProtoBuf, 不过设计 JBOD 的主要用于传输 JavaScript 数据，当然也可以用于存储数据。 [查看 JBOD 数据帧格式](./docs/jbod.md)
JBOD 比 JSON 支持更多的 JavaScript 数据类型

#### 支持的数据类型

| 类型       | 备注                                                                  |
| ---------- | --------------------------------------------------------------------- |
| boolean    |                                                                       |
| null       |                                                                       |
| undefined  |                                                                       |
| number     | 支持 NaN、Infinity                                                    |
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

### 使用

#### node

`npm install jbod`

```js
import JBOD from "jbod";

const data = [1, "string", new Set([7, 2, 4]), new Uint8Array([1, 2, 3]), 12n];

const uInt8Arr = JBOD.binaryify(data);
const data2 = JBOD.parse(uInt8Arr);
```

#### deno 或浏览器

```ts
import JBOD from "https://esm.sh/jbod";
const data = [1, "string", new Set([7, 2, 4]), new Uint8Array([1, 2, 3]), 12n];

const uInt8Arr = JBOD.binaryify(data);
const data2 = JBOD.parse(uInt8Arr);
```

### API

```ts
declare const JBOD: {
  parse<T = unknown>(buffer: Uint8Array, type?: DataType); //解析 Uint8Array 转换为 JavaScript 数据
  parseAsync<T = unknown>(read: StreamReader, type?: DataType): Promise<T>;
  scanAsync(read: StreamReader, type?: IterableDataType): AsyncGenerator<JbodAsyncIteratorItem, void, void>;

  getType(data: any): number; // 获取对应的数据类型编号
  binaryify(data: any): Uint8Array; //将 JavaScript 数据转换为 Uint8Array
  binaryifyContent(data: any): Uint8Array;
};
export type { JBOD as default };
```
