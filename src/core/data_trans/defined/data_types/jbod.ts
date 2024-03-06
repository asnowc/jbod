import type { TypeDataWriter, DataWriter, EncodeContext } from "../type.js";

export class JbodWriter implements TypeDataWriter {
  constructor(data: any, ctx: EncodeContext) {
    this.type = ctx.toTypeCode(data);
    this.writer = new ctx[this.type](data, ctx);
    this.byteLength = this.writer.byteLength + 1;
  }
  private writer: DataWriter;
  readonly type: number;
  byteLength: number;
  encodeTo(buf: Uint8Array, offset: number): number {
    buf[offset] = this.type;
    return this.writer.encodeTo(buf, offset + 1);
  }
}
