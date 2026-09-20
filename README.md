[![NPM version][npm]][npm-url] [![JSR version][jsr]][jsr-url]

[npm]: https://img.shields.io/npm/v/jbod.svg
[npm-url]: https://npmjs.com/package/jbod
[jsr]: https://jsr.io/badges/@asn/jbod
[jsr-url]: https://jsr.io/@asn/jbod

English | [中文](./README.ZH.md)

[API Documentation](https://jsr.io/@asn/jbod/doc)
[JBOD Encoding Format](./docs/jbod.md) [Benchmark](./docs/benchmark.md)

## JavaScript Binary Object Data

JBOD is a binary serialization and deserialization library for JavaScript. It
supports more JavaScript data types and produces compact serialized data
suitable for transmission and storage. Inspired by
[Protocol Buffers](https://protobuf.dev/), JBOD is more flexible and better
suited to dynamically typed languages such as JavaScript.

## Features

### More JavaScript Data Types

| Type         | Notes                                                     |
| ------------ | --------------------------------------------------------- |
| `boolean`    |                                                           |
| `null`       |                                                           |
| `undefined`  |                                                           |
| `number`     | Supports `NaN`, `-Infinity`, and `Infinity`               |
| `bigint`     |                                                           |
| `Uint8Array` |                                                           |
| `string`     |                                                           |
| `RegExp`     |                                                           |
| `Array`      |                                                           |
| `Object`     |                                                           |
| `Symbol`     | Only the `description` property is preserved              |
| `Error`      | Only `cause`, `code`, `message`, and `name` are preserved |
| `Map`        |                                                           |
| `Set`        |                                                           |

### Smaller Binary Data Size

| Data type                                 |        Byte size (JSON) | Byte size (JBOD) |
| ----------------------------------------- | ----------------------: | ---------------: |
| int (0–2147483647)                        |                    1–10 |              1–5 |
| int (-1–-2147483648)                      |                    2–11 |              1–5 |
| double                                    |                    1–22 |                8 |
| boolean                                   | 4 (`true`), 5 (`false`) |                1 |
| null                                      |                       4 |                1 |
| string (where n is its UTF-8 byte length) |                     n+2 |          n+(1–5) |

Data encoded with `JBOD.encode()` is approximately **70%** the size of JSON.
Data encoded with [structured encoding](#structured-encoding), using
`StructCodec.encode()`, is approximately **20%–40%** the size of JSON.

See the [simple size comparison](#simple-size-comparison).

## Usage

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

### Browser

```ts
import JBOD from "https://esm.sh/jbod";
const u8Arr = JBOD.encode(data);
const decodedData = JBOD.decode(u8Arr).data;
```

## Structured Encoding

In some scenarios, the data structure is fixed, so including type information
during transmission is redundant. Object keys also consume considerable space
and affect performance in JavaScript. When the keys are known in advance, the
encoded data only needs to contain values; the decoder can restore the object
from a predefined structure. This feature is inspired by Protocol Buffers.

### Struct Data Types

| Type                                      | JavaScript value      | Encoding                               |
| ----------------------------------------- | --------------------- | -------------------------------------- |
| `dyI32`                                   | `number`              | Signed 32-bit integer, ZigZag + varint |
| `dyI64`                                   | `bigint`              | Signed 64-bit integer, ZigZag + varint |
| `i32`                                     | `number`              | Fixed-width 32-bit integer             |
| `i64`                                     | `bigint`              | Fixed-width 64-bit integer             |
| `f64`                                     | `number`              | 64-bit floating point                  |
| `bool`                                    | `boolean`             | Boolean                                |
| `string`                                  | `string`              | UTF-8 string                           |
| `binary`                                  | `Uint8Array`          | Binary payload                         |
| `any`                                     | Any supported value   | Self-describing value                  |
| `anyArray`, `anyRecord`                   | Array or object       | Self-describing members                |
| `regExp`, `error`, `map`, `set`, `symbol` | Corresponding JS type | Type-specific encoding                 |

### Struct Definition Example

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

Define the Struct:

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

The ID maps to the field name. It must be a positive integer and cannot be
duplicated. For an `any` field, the type can be omitted. The example above can
also be written as follows:

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

The `any` type uses one extra byte to store type information. Choose between
`any` and a fixed type according to your use case.

## Examples

### Simple Size Comparison

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
console.log(JBOD.encode(objData).byteLength); // 67 (70% of JSON)
console.log(anyStruct.encode(objData).byteLength); // 38 (55% of JSON)
console.log(fixedStruct.encode(objData).byteLength); // 34 (35% of JSON)
```
