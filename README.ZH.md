[![NPM version][npm]][npm-url]
[![JSR version][jsr]][jsr-url]

[npm]: https://img.shields.io/npm/v/jbod.svg
[npm-url]: https://npmjs.com/package/jbod
[jsr]: https://jsr.io/badges/@asn/jbod
[jsr-url]: https://jsr.io/@asn/jbod

[API 文档](https://jsr.io/@asn/jbod/doc)
[JBOD 编码格式](./docs/jbod.md)
[基准测试](./docs/benchmark.zh.md)

## JavaScript Binary Object Data

JavaScript 二进制序列化与反序列库。支持更多的 JS 数据类型，序列化后大小占用很小。可用于传输、和存储。\
借鉴了 [ProtoBuf](https://protobuf.dev/), 相比于 ProtoBuf 更为灵活。更适用于 JavaScript 这种动态类型语言。

## 功能特性

##### 更多的 JavaScript 数据类型

| 类型       | 备注                                       |
| ---------- | ------------------------------------------ |
| boolean    |                                            |
| null       |                                            |
| undefined  |                                            |
| number     | 支持 NaN、-Infinity、+Infinity             |
| bigint     |                                            |
| Uint8Array |                                            |
| string     |                                            |
| RegExp     |                                            |
| Array      |                                            |
| Object     |                                            |
| Symbol     | 意义不大, 转换后只保留 description 属性    |
| Error      | 仅支持保留 cause、code、message、name 属性 |
| Map        |                                            |
| Set        |                                            |

##### 更小的二进制数据大小

| 数据类型                              | 字节大小(JSON)    | 字节大小(JBOD) |
| ------------------------------------- | ----------------- | -------------- |
| int(0~2147483647)                     | 1~ 10             | 1~5            |
| int (-1~-2147483648)                  | 2~ 11             | 1~5            |
| double                                | 1~22              | 8              |
| boolean                               | 4(true)、5(false) | 1              |
| null                                  | 4                 | 1              |
| string (设 n 为字符串 utf-8 编码长度) | n+2               | n+(1~5)        |

`JBOD.encode()` 编码的数据大小是 JSON 的 **70%** 左右
[结构化编码](#结构化编码) `StructCodec.encode()` 编码的数据大小是 JSON 的 **20%~40%**。

查看 [简单的编码大小对比示例](#与-json-数据大小的简单对比)

## Usage

### Node

`npm install jbod`

```ts
import JBOD from "jbod";
const u8Arr = JBOD.encode(data);
const decodedData = JBOD.decode(u8Arr).data;
```

### Deno

```ts
import JBOD from "jsr:@asn/jbod";
const u8Arr = JBOD.encode(data);
const decodedData = JBOD.decode(u8Arr).data;
```

### Browser

```ts
import JBOD from "https://esm.sh/jbod";
const u8Arr = JBOD.encode(data);
const decodedData = JBOD.decode(u8Arr).data;
```

## 结构化编码

有些场景，数据结构比较固定，那么传输时携带类型信息会比较冗余。例如 object 类型，其键名非常占用空间，并且在 Javascript 环境下还非常影响性能。在一些场景，键是固定，这时候理想情况下编码后不应保留键的信息，仅编码值，解码方根据预先定义好的结构解码值，然后还原对象数据。这个功能借鉴了 ProtoBuf。

### Struct 数据类型

| 可用类型  | 描述                                          | js 类型    |
| --------- | --------------------------------------------- | ---------- |
| dyI32     | 32 位整型 （动态长度，zigzag+ varints 编码 ） | number     |
| dyI64     | 64 位整型 （动态长度，zigzag+ varints 编码 ） | bigint     |
| i32       | 32 位整型                                     | number     |
| i64       | 64 位整型                                     | bigint     |
| f64       | 64 为浮点                                     | number     |
| bool      | 布尔类型                                      | boolean    |
|           |                                               |            |
| string    | 字符串                                        | string     |
| binary    | 二进制数据                                    | Uint8Array |
| any       | 任意类型                                      |            |
| anyArray  | 任意数组(数组元素可以是任意类型)              |            |
| anyRecord | 任意对象 (对象字段可以是任意类型)             |            |
|           |                                               |            |
| regExp    |                                               | RegExp     |
| error     |                                               | Error      |
| map       |                                               | Map        |
| set       |                                               | Set        |
| symbol    |                                               | symbol     |

any 类型。any 类型会比固定类型多出一个字节，用来保存类型信息

### Struct 定义示例

假设当前需要定义如下数据结构：

```ts
interface Data {
  name: string;
  count?: number;
  custom: any;
  list: number[];
  items: { key1: any; key2: any }[];
}
```

定义 Struct:

```ts
const struct = StructCodec.define({
  name: { id: 1, type: "string" },
  count: { id: 2, type: "dyI32", optional: true }, //可选字段
  custom: { id: 111, type: "any" }, // 任意类型，也可以忽略 type
  list: { id: 3, repeat: true, type: "dyI32" },

  // 对象数组
  items: {
    id: 4,
    repeat: true,
    type: {
      key1: { id: 1, type: "any" },
      key2: { id: 2, type: "any" },
    },
  },
});
const rawObject = { name: "test", count: 9, custom: [1] };
const u8Arr = struct.encode(rawObject);

const decodedData = struct.decode(u8Arr).data;
console.log(decodedData);
```

需要注意的是，id 用于与键名进行映射，它必须是正整数，并且不能重复。\
对于 any 类型，可以省略类型的编写，本例子中还可以这样定义：

```ts
const struct = StructCodec.define({
  name: { id: 1, type: "string" },
  count: { id: 2, type: "dyI32", optional: true },
  custom: 111,
  list: { id: 3, repeat: true, type: "dyI32" },
  items: {
    id: 4,
    repeat: true,
    type: { key1: 1, key2: 2 },
  },
});
```

any 类型会比固定类型多出一个字节，用来保存类型信息，可根据场景自行选择

## 示例

### 与 JSON 数据大小的简单对比

```ts
import JBOD, { StructCodec } from "jbod";
import { Buffer } from "node:buffer";
function encodeJSON(data: any) {
  return Buffer.from(JSON.stringify(data));
}
export const objData = {
  disabled: false,
  count: 100837,
  name: "Documentation",
  dataStamp: 4 / 7,
  id: 876,
};

const anyStruct = StructCodec.define({ disabled: 1, count: 2, name: 3, dataStamp: 4, id: 5 });
const fixedStruct = StructCodec.define({
  disabled: { id: 1, type: "bool" },
  count: { id: 2, type: "dyI32" },
  name: { id: 3, type: "string" },
  dataStamp: { id: 4, type: "f64" },
  id: { id: 5, type: "dyI32" },
});

console.log(encodeJSON(objData).byteLength); // 96
console.log(JBOD.encode(objData).byteLength); // 67   (70% of JSON)
console.log(anyStruct.encode(objData).byteLength); // 38 (55% of JSON)
console.log(fixedStruct.encode(objData).byteLength); // 34 (35% of JSON)
```
