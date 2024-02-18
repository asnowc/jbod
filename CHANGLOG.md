### 0.4.0

#### Feature

- 新增结构体转码器

#### Breaking Change

- 复合类型 RegExp、Error、Symbol 数据格式改为结构体
- 导出接口更改

### 0.3.0

### 0.2.0

#### Breaking Change

- 数据类型代码更改

### 0.1.0

#### Feature:

- 支持 Map 和 Set 类型

#### Performance:

**JBOD.parse():**

| v0.1.0                 | 提升  |
| ---------------------- | ----- |
| number                 | 6.9x  |
| double                 | 9.35x |
| boolean/null/undefined | 8.72x |
| parse tree             | 1.13x |

**JBOD.binaryify():**

| v0.1.0                 | 提升  |
| ---------------------- | ----- |
| number                 | 2.7x  |
| double                 | 2.54x |
| boolean/null/undefined | 4.42x |
| string                 | 2.65x |
| parse tree             | 4.62x |

#### Breaking Change

- Uint8Array(uInt8Arr=9) 类型代替 ArrayBuffer 类型
- Id 类型 代替 ObjectId 类型
- object 类型代替原本的 map 类型
- symbol 类型代码由 17 改为 15
