import { DecodeResult } from "../../../type.js";
import { defineStruct, StructWriter, decodeStruct } from "./struct.js";
import { EncodeContext, Defined } from "../type.js";
import { JbodError } from "../const.js";

const symbolStruct = defineStruct({ description: 1 });

export const symbol: Defined<symbol> = {
  encoder: function SymbolWriter(data: Symbol, ctx: EncodeContext) {
    return new StructWriter(symbolStruct.encodeDefined, data, ctx);
  } as any,
  decoder: function (buf, offset) {
    const info = decodeStruct(buf, offset, symbolStruct.decodeDefined, this) as DecodeResult;
    info.data = Symbol(info.data.description);
    return info;
  },
};

const errorStruct = defineStruct({ message: 1, name: 2, cause: 3, code: 4 });

export const error: Defined<Error> = {
  encoder: function ErrorWriter(data: Error, ctx: EncodeContext) {
    return new StructWriter(errorStruct.encodeDefined, data, ctx);
  } as any,
  decoder: function (buf, offset) {
    const info = decodeStruct(buf, offset, errorStruct.decodeDefined, this) as DecodeResult;
    const data = info.data;
    info.data = new JbodError(data.message, { cause: data.cause });
    if (data.code) info.data.code = data.code;
    return info;
  },
  class: Error,
};

const regExpStruct = defineStruct({ source: 1, flags: 2 });
export const regExp: Defined<RegExp> = {
  encoder: function RegExpWriter(data: RegExp, ctx: EncodeContext) {
    return new StructWriter(regExpStruct.encodeDefined, data, ctx);
  } as any,
  decoder: function (buf, offset) {
    const info = decodeStruct(buf, offset, regExpStruct.decodeDefined, this) as DecodeResult;
    info.data = new RegExp(info.data.source, info.data.flags);
    return info;
  },
  class: RegExp,
};
