export abstract class ByteParser<T> {
  abstract next(chunk: Uint8Array): boolean;
  protected result?: ByteParserResult<T>;
  finish(): ByteParserResult<T> {
    const result = this.result;
    if (!result) throw new Error("unfinished");
    this.result = undefined;
    return result;
  }
}
export type ByteParserResult<T> = {
  value: T;
  residue?: Uint8Array;
};
export class TransformByteParser<T, P = unknown> extends ByteParser<T> {
  constructor(first: ByteParser<P>, final?: (data: P) => T) {
    super();
    this.#current = first;
    this.#final = final;
  }
  #current: ByteParser<any>;
  #final?: (data: any) => T;
  next(chunk: Uint8Array): boolean {
    if (this.#current.next(chunk)) {
      const res = this.#current.finish();
      if (this.#final) res.value = this.#final(res.value);
      this.result = res;
      return true;
    }
    return false;
  }
}

export class LengthByteParser<T = Uint8Array> extends ByteParser<T> {
  constructor(readonly total: number, public final?: (buf: Uint8Array) => T) {
    super();
    if (total <= 0) throw new Error("total must gt 0");
    this.#length = total;
  }
  #length: number;
  #list: Uint8Array[] = [];
  next(buf: Uint8Array): boolean {
    if (buf.byteLength > this.#length) {
      const residue = buf.subarray(this.#length);
      this.#list.push(buf.subarray(0, this.#length));
      this.result = { value: this.#endValue(), residue };
      return true;
    } else if (buf.length === this.#length) {
      this.#list.push(buf);
      this.result = { value: this.#endValue() };
      return true;
    } else this.#length -= buf.byteLength;
    this.#list.push(buf);
    return false;
  }
  #endValue(): T {
    let buf: Uint8Array;
    if (this.#list.length === 1) buf = this.#list[0];
    else {
      buf = new Uint8Array(this.total);
      let offset = 0;
      for (let i = 0; i < this.#list.length; i++) {
        buf.set(this.#list[i], offset);
        offset += this.#list[i].byteLength;
      }
    }
    this.#list.length = 0;
    this.#length = this.total;

    if (this.final) return this.final(buf);
    return buf as T;
  }
}
export class LengthTransByteParser<T> extends LengthByteParser<any> {
  constructor(total: number, final?: (buf: Uint8Array) => T);
  constructor(
    total: number,
    final: (buf: Uint8Array) => any,
    ...trans: [...((data: any) => any)[], final: (data: any) => T]
  );
  constructor(total: number, first?: (buf: Uint8Array) => any, ...trans: ((data: any) => any)[]) {
    super(total, first);
    this.#trans = trans;
  }
  #trans: ((data: any) => any)[];
  finish(): { value: T; residue?: Uint8Array } {
    let res = super.finish();
    for (let i = 0; this.#trans.length; i++) {
      res.value = this.#trans[i](res.value);
    }
    return res;
  }
}
export class StepsByteParser<T> extends ByteParser<T> {
  constructor(
    opts: { first: ByteParser<any>; final?: (data: any) => T },
    ...steps: ((data: any) => ByteParser<any>)[]
  ) {
    super();
    this.#first = opts.first;
    this.#current = opts.first;
    this.#final = opts.final;
    this.#steps = steps;
  }
  #current: ByteParser<any>;
  #first: ByteParser<any>;
  #final?: (data: any) => T;
  #steps: ((data: any) => ByteParser<any>)[];
  step = 0;
  next(chunk: Uint8Array): boolean;
  next(chunk?: Uint8Array): boolean {
    do {
      if (this.#current.next(chunk!)) {
        let res = this.#current.finish();
        let next = this.#steps[this.step++];
        if (next) {
          this.#current = next(res.value);
          chunk = res.residue;
        } else {
          this.result = { value: this.#final ? this.#final(res.value) : res.value, residue: res.residue };
          this.step = 0;
          this.#current = this.#first;
          return true;
        }
      }
    } while (chunk);

    return false;
  }
}
