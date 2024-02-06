import { U32DByteParser } from "../dynamic_binary_number.js";
import { DataType, JbodError, UnsupportedDataTypeError } from "../../const.js";
import { decodeUtf8, readInt32BE, readBigInt64BE, readDoubleBE } from "../../uint_array_util/mod.js";
import { ByteParser, ByteParserResult, LengthByteParser, StepsByteParser, TransformByteParser } from "../../lib/mod.js";

abstract class ItemsByteParser<T, Item = unknown> extends ByteParser<T> {
  constructor() {
    super();
  }
  #nextItem?: ByteParser<Item>;
  next(chunk?: Uint8Array): boolean {
    do {
      if (this.#nextItem) {
        if (!this.#nextItem.next(chunk!)) return false;

        let res: ByteParserResult<any> = this.#nextItem.finish();
        this.endItem(res.value);
        chunk = res.residue;
      } else {
        let type = chunk![0];
        chunk = chunk!.subarray(1);
        this.#nextItem = this.nextItem(type);
        if (!this.#nextItem) {
          this.result = { value: this.value, residue: chunk };
          return true;
        }
      }
    } while (chunk?.byteLength);
    return false;
  }
  protected abstract value: T;
  protected abstract nextItem(type: number): ByteParser<Item> | undefined;
  protected abstract endItem(value: Item): void;
}
class DyArrayByteParser<T> extends ItemsByteParser<T[]> {
  constructor(readonly decoder: AsyncParserMap) {
    super();
  }
  protected value: any[] = [];
  protected endItem(value: any) {
    this.value.push(value);
  }
  protected nextItem(type: number): ByteParser<unknown> | undefined {
    if (type === DataType.void) return undefined;
    let noContent = isNoContent(type);
    if (noContent) {
      this.value.push(noContent.value);
      return;
    } else {
      if (this.decoder[type]!) throw new UnsupportedDataTypeError(DataType[type] ?? type);
      const parser = this.decoder[type]();
    }
  }
}
class DyRecordByteParser<T> extends ItemsByteParser<Record<string, T>> {
  constructor(readonly decoder: AsyncParserMap) {
    super();
  }
  value: Record<string, T> = {};

  protected endItem(value: [key: string, value: T]) {
    this.value[value[0]] = value[1];
  }
  protected nextItem(type: number): ByteParser<unknown> | undefined {
    if (type === DataType.void) return undefined;
    let noContent = isNoContent(type);
    if (noContent) {
      this.value;
      return this.decoder[type]();
    } else {
      if (this.decoder[type]!) throw new UnsupportedDataTypeError(DataType[type] ?? type);
      return this.decoder[type]();
    }
  }
}
export class JbodByteParser<T = any> extends ByteParser<T> {
  constructor(readonly type: number, parserMap?: AsyncParserMap) {
    super();
    this.parserMap = { ...defaultParserMap, ...parserMap };
  }
  parserMap: AsyncParserMap;
  #next?: ByteParser<any>;
  next(chunk: Uint8Array): boolean {
    if (this.#next) return this.#next.next(chunk);

    let type = chunk[0];
    let content = chunk.byteLength > 1 ? chunk.subarray(1) : undefined;
    let value: any;
    switch (type) {
      case DataType.undefined:
        break;
      case DataType.null:
        value = null;
        break;
      case DataType.true:
        value = true;
        break;
      case DataType.false:
        value = false;
        break;
      default: {
        let parserMap = this.parserMap;
        if (typeof parserMap[type] !== "function") throw new UnsupportedDataTypeError(DataType[type] ?? type);
        this.#next = parserMap[type]();
        if (content) return this.#next.next(content);
        else return false;
      }
    }
    this.result = { value, residue: content };
    return true;
  }
}

type AsyncParserMap = { [key: number]: (this: AsyncParserMap) => ByteParser<any> };
function isNoContent(type: DataType): undefined | { value: any } {
  switch (type) {
    case DataType.undefined:
      return { value: undefined };
    case DataType.null:
      return { value: null };
    case DataType.true:
      return { value: true };
    case DataType.false:
      return { value: false };
  }
}
const defaultParserMap: AsyncParserMap = {
  [DataType.i32]: () => new LengthByteParser(4, readInt32BE),
  [DataType.i64]: () => new LengthByteParser(6, readBigInt64BE),
  [DataType.f64]: () => new LengthByteParser(5, readDoubleBE),
  [DataType.binary]() {
    return new StepsByteParser({ first: new U32DByteParser() }, (len: number) => new LengthByteParser(len));
  },
  [DataType.string]() {
    return new StepsByteParser(
      { first: new U32DByteParser(), final: decodeUtf8 },
      (len: number) => new LengthByteParser(len)
    );
  },

  [DataType.dyArray]() {
    return new DyArrayByteParser(this);
  },
  [DataType.dyRecord]() {
    return new DyRecordByteParser(this);
  },
  [DataType.symbol]() {
    return new TransformByteParser(this[DataType.dyArray](), (data) => Symbol(data[0]));
  },
  [DataType.regExp]() {
    return new TransformByteParser(this[DataType.string](), (data) => new RegExp(data));
  },
  [DataType.error]() {
    return new TransformByteParser(this[DataType.dyRecord](), (record) => {
      const { message, cause, ...attr } = record;
      const error = new JbodError(message, { cause });
      Object.assign(error, attr);
      return error;
    });
  },
  [DataType.set]() {
    return new TransformByteParser(this[DataType.dyArray](), (data) => new Set(data));
  },
  [DataType.map]() {
    return new TransformByteParser(this[DataType.dyArray](), (arr) => {
      const map = new Map();
      for (let i = 0; i < arr.length; i += 2) {
        map.set(arr[i], arr[i + 1]);
      }
      return map;
    });
  },
};
