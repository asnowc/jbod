[![NPM version][npm]][npm-url]
[![JSR version][jsr]][jsr-url]

[npm]: https://img.shields.io/npm/v/jbod.svg
[npm-url]: https://npmjs.com/package/jbod
[jsr]: https://jsr.io/badges/@asn/jbod
[jsr-url]: https://jsr.io/@asn/jbod
[root]: https://github.com/mian/blob

English | [中文](https://github.com/asnowc/jbod/blob/main/README.ZH.md)

[API Document](https://jsr.io/@asn/jbod/doc)\
[JBOD encoding format](https://github.com/asnowc/jbod/blob/main/docs/jbod.md)\
[Benchmark](https://github.com/asnowc/jbod/blob/main/docs/benchmark.md)

## JavaScript Binary Object Data

JavaScript Binary Serialization and deserialization lib. Support for more JS data types。Can be used for transmission, and storage. \
JavaScript 二进制序列化与反序列库。支持更多的 JS 数据类型，序列化后大小占用很小。可用于传输、和存储。

Inspired by [ProtoBuf](https://protobuf.dev/), JBOD is more flexible than ProtoBuf. More applicable to dynamically typed languages like JavaScript.

## Features

##### More JavaScript data types

| type       | Notes                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| boolean    |                                                                                                       |
| null       |                                                                                                       |
| undefined  |                                                                                                       |
| number     | Support NaN、-Infinity、+Infinity                                                                     |
| bigint     |                                                                                                       |
| Uint8Array |                                                                                                       |
| string     |                                                                                                       |
| RegExp     |                                                                                                       |
| Array      |                                                                                                       |
| Object     |                                                                                                       |
| Symbol     | The significance is not significant, only the description attribute will be retained after conversion |
| Error      | Keep only the cause, code, message, and name attributes                                               |
| Map        |                                                                                                       |
| Set        |                                                                                                       |

##### Smaller binary data size

| Data type                                                 | Byte size (JSON)  | Byte size (JBOD) |
| --------------------------------------------------------- | ----------------- | ---------------- |
| int(0~2147483647)                                         | 1~ 10             | 1~5              |
| int (-1~-2147483648)                                      | 2~ 11             | 1~5              |
| double                                                    | 1~22              | 8                |
| boolean                                                   | 4(true)、5(false) | 1                |
| null                                                      | 4                 | 1                |
| string (Set n as the UTF-8 encoding length of the string) | n+2               | n+(1~5)          |

The data encoded by `JBOD.encode()` is about **70%** the size of JSON
The data size of structured encoding is **20% ~ 40%** of JSON View [Structured Encoding](#structured-encoding)

View [simple code size comparison example](#simple-code-size-comparison-example)

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

## Structured encoding

There are some scenarios where the data structure is fairly fixed, in which case transmitting type information can be quite redundant. For example, the object type has very space-consuming key names, and it also has a significant impact on performance in the JavaScript environment. In some scenarios, the keys are fixed, in which case ideally, the encoding should not retain the key information, only encode the values, and the decoder should decode the values based on the predefined structure, then restore the object data. This feature is inspired by ProtoBuf.

### Struct data types

| Type symbol | description                                                    | js type    |
| ----------- | -------------------------------------------------------------- | ---------- |
| dyI32       | 32-bit Integer （Dynamic length encode by zigzag + varints ）  | number     |
| dyI64       | 64-bit Integer （Dynamic length, encode by zigzag + varints ） | bigint     |
| i32         | 32-bit Integer                                                 | number     |
| i64         | 64-bit Integer                                                 | bigint     |
| f64         | 64-bit Float                                                   | number     |
| bool        | Boolean                                                        | boolean    |
|             |                                                                |            |
| string      |                                                                | string     |
| binary      |                                                                | Uint8Array |
| any         | Any type                                                       |            |
| anyArray    | Array elements can be of any type                              |            |
| anyRecord   | Object pieces and values can be of any type                    |            |
|             |                                                                |            |
| regExp      |                                                                | RegExp     |
| error       |                                                                | Error      |
| map         |                                                                | Map        |
| set         |                                                                | Set        |
| symbol      |                                                                | symbol     |

Any type: The any type has an extra byte to hold type information than the fixed type

### Example Struct definition

Suppose you need to define the following data structure:

```ts
interface Data {
  name: string;
  count?: number;
  custom: any;
  list: number[];
  items: { key1: any; key2: any }[];
}
```

Defining structure：

```ts
const struct = StructCodec.define({
  name: { id: 1, type: "string" },
  count: { id: 2, type: "dyI32", optional: true }, // Optional field
  custom: { id: 111, type: "any" }, // Any type, or you can omit type
  list: { id: 3, repeat: true, type: "dyI32" },

  // Array of objects
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

Note that the id is used to map with the key name, it must be a positive integer, and it cannot be repeated。\
For the any type, you don't have to write the type. In this case, you could have also defined it like this:

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

The any type contains an extra byte to hold the type information, depending on your use case

## Examples

### Simple code size comparison example

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
