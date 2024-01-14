## JS JBOD

### Base data type:

0000_xxxx :

| DEC | BIN  | type       | content length                              |
| --- | ---- | ---------- | ------------------------------------------- |
| 0   | 0000 | void       | 0 (Represents termination in map and array) |
| 1   | 0001 | null       | 0                                           |
| 2   | 0010 | undefined  | 0                                           |
| 3   | 0011 | true       | 0                                           |
| 4   | 0100 | false      | 0                                           |
| 5   | 0101 | int        | 4                                           |
| 6   | 0110 | bigint     | 8                                           |
| 7   | 0111 | double     | 8                                           |
| 8   | 1000 | id         | DBN                                         |
| 9   | 1001 | uInt8Arr   | contentLen(DBN) + content                   |
| 10  | 1010 | \*string   | uInt8Arr                                    |
| 11  | 1011 | \*regExp   | string                                      |
| 12  | 1100 | \*function | string[]&string //未实现                    |
| 13  | 1101 | array      | item, item, ..., void                       |
| 14  | 1110 | object     | item, item, ..., void                       |
| 15  | 1111 | \*symbol   |                                             |

0001_xxxx:

| DEC | BIN  | type    | content length                |
| --- | ---- | ------- | ----------------------------- |
| 16  | 0000 | \*error | object                        |
| 17  | 0001 | map     | [key, value, key, value, ...] |
| 18  | 0010 | set     | array                         |
| 19  | 0011 |         |                               |
| 20  | 0100 |         |                               |
| 21  | 0101 |         |                               |
| 22  | 0110 |         |                               |
| 23  | 0111 |         |                               |
| 24  | 1000 |         |                               |
| 25  | 1001 |         |                               |
| 26  | 1010 |         |                               |
| 27  | 1011 |         |                               |
| 28  | 1100 |         |                               |
| 29  | 1101 |         |                               |
| 30  | 1110 |         |                               |
| 31  | 1111 |         |                               |

0010_xxxx:

| DEC | BIN  | type             | content length |
| --- | ---- | ---------------- | -------------- |
| 16  | 0000 | \*Int8Array      | map            |
| 17  | 0001 | \*Uint8Array     |                |
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

#### JBOD Map:

```
|--1-|<dynamicContent>|---n---|  |--1-|<dynamicContent>|---n---| ... |--1-|<dynamicContent>|---n---| |--1-|
|type|      key       |content|  |type|      key       |content| ... |type|      key       |content| |void|

```

#### Dynamic Binary Number

| byte | max               | real    | content                          |
| ---- | ----------------- | ------- | -------------------------------- |
| 1    | 0x7f              | 7bit    | 0xxxxxxx                         |
| 2    | 0x3fff            | 6bit 1B | 10xxxxxx ff                      |
| 3    | 0x1fffff          | 5bit 2B | 110xxxxx ff ff                   |
| 4    | 0xfffffff(255MB)  | 4bit 3B | 1110xxxx ff ff ff                |
| 5    | 0x7_ffffffff      | 3bit 4B | 11110xxx ff ff ff ff             |
| 6    | 0x3ff_ffffffff    | 2bit 5B | 111110xx ff ff ff ff ff          |
| 7    | 0x1ffff_ffffffff  | 1bit 6B | 1111110x ff ff ff ff ff ff       |
|      |                   |         |                                  |
| 8    | 0xffffff_ffffffff | 7B      | 11111110 ff ff ff ff ff ff ff    |
| 9    |                   | 8B      | 11111111 ff ff ff ff ff ff ff ff |

number(47 bit): 0~512 TB - 1
id(7 bytes): 0~65535 TB -1

#### DBN Content

```
<DBN> content
```
