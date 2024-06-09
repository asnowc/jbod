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
| 7   | 0111 | dyI32     | zigzag + varints                            |
| 8   | 1000 | dyI64     | zigzag + varints                            |
| 9   | 1001 | binary    | contentLen(varints) + content               |
| 10  | 1010 | \*string  | contentLen(varints) + content(utf8)         |
| 11  | 1011 | array     | item-len, item-type, item...                |
| 12  | 1100 | record    | item-len ,key-type, value-type, key-item... |
| 13  | 1101 | anyArray  | item, item, ..., void                       |
| 14  | 1110 | anyRecord | item, item, ..., void                       |
| 15  | 1111 |           |                                             |

001_xxxx:

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

010_xxxx: (javascript)

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

1xx_xxxx: (custom)

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
