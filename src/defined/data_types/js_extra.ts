import { DecodeResult } from "../../type.ts";
import { defineStruct, StructWriter, decodeStruct } from "./struct.ts";
import { EncodeContext, Defined } from "../type.ts";
import { dyArray } from "./repeat.ts";
const symbolStruct = defineStruct({ description: 1 }, { defaultOptional: true });

export const symbol: Defined<symbol> = {
  encoder: function SymbolWriter(data: Symbol, ctx: EncodeContext) {
    return new StructWriter(symbolStruct.encodeDefined, data, ctx);
  } as any,
  decoder: function (buf, offset, ctx) {
    const info = decodeStruct(buf, offset, ctx, symbolStruct.decodeDefined) as DecodeResult;
    info.data = Symbol(info.data.description);
    return info;
  },
};

const errorStruct = defineStruct({ message: 1, name: 2, cause: 3, code: 4 }, { defaultOptional: true });

export const error: Defined<Error> = {
  encoder: function ErrorWriter(data: Error, ctx: EncodeContext) {
    return new StructWriter(errorStruct.encodeDefined, data, ctx);
  } as any,
  decoder: function (buf, offset, ctx) {
    const info = decodeStruct(buf, offset, ctx, errorStruct.decodeDefined) as DecodeResult;
    const data = info.data;
    info.data = new Error(data.message, { cause: data.cause });
    if (data.code) info.data.code = data.code;
    return info;
  },
  class: Error,
};

const regExpStruct = defineStruct({ source: 1, flags: 2 }, { defaultOptional: true });
export const regExp: Defined<RegExp> = {
  encoder: function RegExpWriter(data: RegExp, ctx: EncodeContext) {
    return new StructWriter(regExpStruct.encodeDefined, data, ctx);
  } as any,
  decoder: function (buf, offset, ctx) {
    const info = decodeStruct(buf, offset, ctx, regExpStruct.decodeDefined) as DecodeResult;
    info.data = new RegExp(info.data.source, info.data.flags);
    return info;
  },
  class: RegExp,
};

const { decoder: dyArrayDecoder, encoder: DyArrayWriter } = dyArray;
export const jsSet: Defined<Set<any>> = {
  encoder: function JsSetWriter(data: Set<any>, ctx: EncodeContext) {
    return new DyArrayWriter(Array.from(data), ctx);
  } as any,
  decoder: function (buf, offset, ctx) {
    const res: DecodeResult = dyArray.decoder(buf, offset, ctx);
    res.data = new Set(res.data);
    return res;
  },
  class: Set,
};
export const jsMap: Defined<Set<any>> = {
  encoder: function JsMapWriter(data: Set<any>, ctx: EncodeContext) {
    const list: any[] = [];
    let i = 0;
    for (const item of data) {
      list[i] = item[0];
      list[i + 1] = item[1];
      i += 2;
    }
    return new DyArrayWriter(list, ctx);
  } as any,
  decoder: function (buf, offset, ctx) {
    const res: DecodeResult = dyArrayDecoder(buf, offset, ctx);
    const object = res.data;
    const map = new Map();
    for (let i = 0; i < object.length; i += 2) {
      map.set(object[i], object[i + 1]);
    }
    res.data = map;
    return res;
  },
  class: Map,
};
