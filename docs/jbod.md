## JBOD Data Frame

### Type Code:

#### JBOD standard types:

Range: 000x_xxxx

0000_xxxx :

| DEC | BIN  | type      | value format                                                              | Description                                        |
| --- | ---- | --------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| 0   | 0000 | void      | 0                                                                         | Repeating type end flag                            |
| 1   | 0001 | null      | 0                                                                         |                                                    |
| 2   | 0010 |           |                                                                           |                                                    |
| 3   | 0011 | true      | 0                                                                         |                                                    |
| 4   | 0100 | false     | 0                                                                         |                                                    |
| 5   | 0101 | f32       | 8                                                                         | 32-bit float                                       |
| 6   | 0110 | f64       | 8                                                                         | 64-bit float                                       |
| 7   | 0111 | dyI32     | zigzag + varints                                                          |                                                    |
| 8   | 1000 | dyI64     | zigzag + varints                                                          |                                                    |
| 9   | 1001 | binary    | contentLen(varints) + content                                             |                                                    |
| 10  | 1010 | \*string  | contentLen(varints) + content(utf8)                                       |                                                    |
| 11  | 1011 | array     | elements-len, elements-type, element-0, element-1, ..., element-n         | Elements do not have a type                        |
| 12  | 1100 | record    | elements-len, keys-type, values-type, key-0, value-0, ..., key-n, value-n | Keys and values do not carry types                 |
| 13  | 1101 | anyArray  | element-0, element-1, ..., element-n, void                                | Elements carry types                               |
| 14  | 1110 | anyRecord | value-0-type, key-0, value-0, ..., key-n, value-n-type, void              | Keys are of type string and values are of type any |
| 15  | 1111 |           |                                                                           |                                                    |

0001_xxxx:

| DEC | BIN  | type | content length |
| --- | ---- | ---- | -------------- |
| 16  | 0000 |      |                |
| 17  | 0001 |      |                |
| 18  | 0010 |      |                |
| 19  | 0011 |      |                |
| 20  | 0100 |      |                |
| 21  | 0101 |      |                |
| 23  | 0111 |      |                |
| 24  | 1000 |      |                |
| 25  | 1001 |      |                |
| 26  | 1010 |      |                |
| 27  | 1011 |      |                |
| 28  | 1100 |      |                |
| 29  | 1101 |      |                |
| 30  | 1110 |      |                |
| 31  | 1111 |      |                |

#### Language extension types

Range: 0010_xxxx

0010_xxxx: (javascript)

| DEC | BIN  | type       | content length                                |
| --- | ---- | ---------- | --------------------------------------------- |
| 16  | 0000 | \*error    | struct                                        |
| 17  | 0001 | \*map      | anyArray: [key, value, key, value, ..., void] |
| 18  | 0010 | \*set      | anyArray                                      |
| 19  | 0011 | \*regExp   | struct                                        |
| 20  | 0100 | \*function | string[]&string (未实现 )                     |
| 21  | 0101 |            |                                               |
| 22  | 0110 | undefined  | 0                                             |
| 23  | 0111 |            |                                               |
| 24  | 1000 |            |                                               |
| 25  | 1001 |            |                                               |
| 26  | 1010 |            |                                               |
| 27  | 1011 |            |                                               |
| 28  | 1100 |            |                                               |
| 29  | 1101 |            |                                               |
| 30  | 1110 |            |                                               |
| 31  | 1111 |            |                                               |

#### Custom types

Range: 1xxx_xxx

### Encoding format

#### JBOD anyArray:

```
|--1-|---n---|  |--1-|---n---| ... |--1-|---n---| |--1-|
|type|content|  |type|content| ... |type|content| |void|

```

Example:

```js
console.log(JBOD.encode([1, undefined, true])); //Uint8Array([5, 0, 0, 0, 1, 1, 3, 0]);
console.log(JBOD.encode([2, "abcd", true])); //Uint8Array([5, 0, 0, 0, 2, 11, 4, 97, 98, 99, 100, 3, 0]);
```

#### JBOD anyRecord:

```
|--1-|<dynamicContent>|---n---|  |--1-|<dynamicContent>|---n---| ... |--1-|<dynamicContent>|---n---| |--1-|
|type|      key       |content|  |type|      key       |content| ... |type|      key       |content| |void|

```

#### Other types

Todo...
