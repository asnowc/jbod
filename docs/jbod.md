## JBOD Data Frame

### Data Frame:

type: 0000_0000 ~ 0111_111

000_xxxx :

| DEC | BIN  | type      | content length                              |
| --- | ---- | --------- | ------------------------------------------- |
| 0   | 0000 | void      |                                             |
| 1   | 0001 | null      | 0                                           |
| 2   | 0010 |           |                                             |
| 3   | 0011 | true      | 1                                           |
| 4   | 0100 | false     | 1                                           |
| 5   | 0101 | f32       | 8                                           |
| 6   | 0110 | f64       | 8                                           |
| 7   | 0111 | -dyNumber | DBN                                         |
| 8   | 1000 | +dyNumber | DBN                                         |
| 9   | 1001 | binary    | contentLen(DBN) + content                   |
| 10  | 1010 | \*string  | binary                                      |
| 11  | 1011 | array     | item-len, item-type, item...                |
| 12  | 1100 | record    | item-len ,key-type, value-type, key-item... |
| 13  | 1101 | dyArray   | item, item, ..., void                       |
| 14  | 1110 | dyRecord  | item, item, ..., void                       |
| 15  | 1111 |           |                                             |

001_xxxx:

| DEC | BIN  | type | content length |
| --- | ---- | ---- | -------------- |
| 16  | 0000 | i8   | 1              |
| 17  | 0001 | u8   | 1              |
| 18  | 0010 | i16  | 2              |
| 19  | 0011 | u16  | 2              |
| 20  | 0100 | i32  | 4              |
| 21  | 0101 | u32  | 4              |
| 23  | 0111 | i64  | 8              |
| 24  | 1000 | u64  | 8              |
| 25  | 1001 |      |                |
| 26  | 1010 |      |                |
| 27  | 1011 |      |                |
| 28  | 1100 |      |                |
| 29  | 1101 |      |                |
| 30  | 1110 |      |                |
| 31  | 1111 |      |                |

010_xxxx: (javascript)

| DEC | BIN  | type       | content length                |
| --- | ---- | ---------- | ----------------------------- |
| 16  | 0000 | \*error    | object                        |
| 17  | 0001 | \*map      | [key, value, key, value, ...] |
| 18  | 0010 | \*set      | array                         |
| 19  | 0011 | \*regExp   | string                        |
| 20  | 0100 | \*function | string[]&string (未实现 )     |
| 21  | 0101 |            |                               |
| 22  | 0110 | undefined  | 0                             |
| 23  | 0111 |            |                               |
| 24  | 1000 |            |                               |
| 25  | 1001 |            |                               |
| 26  | 1010 |            |                               |
| 27  | 1011 |            |                               |
| 28  | 1100 |            |                               |
| 29  | 1101 |            |                               |
| 30  | 1110 |            |                               |
| 31  | 1111 |            |                               |

011_xxxx: (custom)

| DEC | BIN  | type             | content length |
| --- | ---- | ---------------- | -------------- |
| 16  | 0000 | \*Int8Array      | map            |
| 17  | 0001 |                  |                |
| 18  | 0010 | \*Int16Array     |                |
| 19  | 0011 | \*Uint16Array    |                |
| 20  | 0100 | \*Int32Array     |                |
| 21  | 0101 | \*Uint32Array    |                |
| 22  | 0110 | \*Float32Array   |                |
| 23  | 0111 | \*Float64Array   |                |
| 24  | 1000 | \*BigInt64Array  |                |
| 25  | 1001 | \*BigUint64Array |                |
| 26  | 1010 |                  |                |
| 27  | 1011 |                  |                |
| 28  | 1100 |                  |                |
| 29  | 1101 |                  |                |
| 30  | 1110 |                  |                |
| 31  | 1111 |                  |                |

#### JBOD Array:

```
|--1-|---n---|  |--1-|---n---| ... |--1-|---n---| |--1-|
|type|content|  |type|content| ... |type|content| |void|

```

Example:

```js
console.log(JBOD.binaryify([1, undefined, true])); //Uint8Array([5, 0, 0, 0, 1, 1, 3, 0]);
console.log(JBOD.binaryify([2, "abcd", true])); //Uint8Array([5, 0, 0, 0, 2, 11, 4, 97, 98, 99, 100, 3, 0]);
```

#### JBOD Map:

```
|--1-|<dynamicContent>|---n---|  |--1-|<dynamicContent>|---n---| ... |--1-|<dynamicContent>|---n---| |--1-|
|type|      key       |content|  |type|      key       |content| ... |type|      key       |content| |void|

```

#### Dynamic Binary Number (Little Endian)

| byte | max               | real  | content                             |
| ---- | ----------------- | ----- | ----------------------------------- |
| 1    | 0x7f              | 7bit  | 0xxxxxxx                            |
| 2    | 0x3fff            | 14bi  | 1xxxxxxx 0xxxxxxx                   |
| 3    | 0x1fffff          | 21bit | 1xxxxxxx 1xxxxxxx 0xxxxxxx          |
| 4    | 0xfffffff(255MB)  | 28bit | 1xxxxxxx 1xxxxxxx 1xxxxxxx 0xxxxxxx |
|      | ...               | ...   | ...                                 |
| 8    | 0xffffff_ffffffff | 56bit | ...                                 |
| 9    |                   | 63bit | ...                                 |

number(47 bit): 0~512 TB - 1
id(7 bytes): 0~65535 TB -1

#### DBN Content

```
<DBN> content
```
