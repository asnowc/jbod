[![NPM version][npm]][npm-url] [![JSR version][jsr]][jsr-url]

[npm]: https://img.shields.io/npm/v/jbod.svg
[npm-url]: https://npmjs.com/package/jbod
[jsr]: https://jsr.io/badges/@asn/jbod
[jsr-url]: https://jsr.io/@asn/jbod

[English](./README.md) | 中文

[API 文档](https://jsr.io/@asn/jbod/doc) [JBOD 编码格式](./docs/jbod.md)
[基准测试](./docs/benchmark.zh.md)

## JavaScript Binary Object Data

JBOD 是一个 JavaScript 二进制序列化与反序列化库。它支持更多 JavaScript
数据类型，序列化后的数据体积较小，适用于数据传输和存储。 JBOD 借鉴了
[Protocol Buffers](https://protobuf.dev/)，但更加灵活，更适合 JavaScript
这类动态类型语言。

## 功能特性

### 支持更多 JavaScript 数据类型

| 类型         | 备注                                             |
| ------------ | ------------------------------------------------ |
| `boolean`    |                                                  |
| `null`       |                                                  |
| `undefined`  |                                                  |
| `number`     | 支持 `NaN`、`-Infinity` 和 `Infinity`            |
| `bigint`     |                                                  |
| `Uint8Array` |                                                  |
| `string`     |                                                  |
| `RegExp`     |                                                  |
| `Array`      |                                                  |
| `Object`     |                                                  |
| `Symbol`     | 转换后仅保留 `description` 属性                  |
| `Error`      | 仅保留 `cause`、`code`、`message` 和 `name` 属性 |
| `Map`        |                                                  |
| `Set`        |                                                  |

### 更小的二进制数据体积

| 数据类型                                 |          字节大小（JSON） | 字节大小（JBOD） |
| ---------------------------------------- | ------------------------: | ---------------: |
| int（0–2147483647）                      |                      1–10 |              1–5 |
| int（-1–-2147483648）                    |                      2–11 |              1–5 |
| double                                   |                      1–22 |                8 |
| boolean                                  | 4（`true`）、5（`false`） |                1 |
| null                                     |                         4 |                1 |
| string（设 n 为字符串的 UTF-8 编码长度） |                       n+2 |          n+(1–5) |

`JBOD.encode()` 编码后的数据大小约为 JSON 的
**70%**；使用[结构化编码](#结构化编码)时，`StructCodec.encode()`
编码后的数据大小约为 JSON 的 **20%–40%**。

参见[简单的数据大小对比](#与-json-数据大小的简单对比)。

## 使用方法

### Node

```sh
npm install jbod
```

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

### 浏览器

```ts
import JBOD from "https://esm.sh/jbod";
const u8Arr = JBOD.encode(data);
const decodedData = JBOD.decode(u8Arr).data;
```

## 结构化编码

在某些场景中，数据结构比较固定，此时在传输时携带类型信息会显得冗余。对象的键名也很占空间，并且会影响
JavaScript
环境中的性能。当键固定时，编码结果只需保留值；解码方可根据预先定义的结构解码并还原对象。此功能借鉴了
Protocol Buffers。

### Struct 数据类型

| 类型                                      | JavaScript 值  | 编码方式                         |
| ----------------------------------------- | -------------- | -------------------------------- |
| `dyI32`                                   | `number`       | 32 位有符号整数，ZigZag + varint |
| `dyI64`                                   | `bigint`       | 64 位有符号整数，ZigZag + varint |
| `i32`                                     | `number`       | 固定长度 32 位整数               |
| `i64`                                     | `bigint`       | 固定长度 64 位整数               |
| `f64`                                     | `number`       | 64 位浮点数                      |
| `bool`                                    | `boolean`      | 布尔值                           |
| `string`                                  | `string`       | UTF-8 字符串                     |
| `binary`                                  | `Uint8Array`   | 二进制数据                       |
| `any`                                     | 任意受支持值   | 自描述值                         |
| `anyArray`、`anyRecord`                   | 数组或对象     | 成员为自描述值                   |
| `regExp`、`error`、`map`、`set`、`symbol` | 对应的 JS 类型 | 类型专用编码                     |

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

定义 Struct：

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

ID 用于映射字段名，必须是正整数，并且不能重复。 对于 `any`
类型，可以省略类型声明。因此，上例也可以写成：

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

`any` 类型会比固定类型多占用一个字节来保存类型信息，可根据实际场景选择。

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

const anyStruct = StructCodec.define({
  disabled: 1,
  count: 2,
  name: 3,
  dataStamp: 4,
  id: 5,
});
const fixedStruct = StructCodec.define({
  disabled: { id: 1, type: "bool" },
  count: { id: 2, type: "dyI32" },
  name: { id: 3, type: "string" },
  dataStamp: { id: 4, type: "f64" },
  id: { id: 5, type: "dyI32" },
});

console.log(encodeJSON(objData).byteLength); // 96
console.log(JBOD.encode(objData).byteLength); // 67（JSON 的 70%）
console.log(anyStruct.encode(objData).byteLength); // 38（JSON 的 55%）
console.log(fixedStruct.encode(objData).byteLength); // 34（JSON 的 35%）
```
