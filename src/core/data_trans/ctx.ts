import { EncodeContext, DecodeContext, Defined, JbodWriter } from "./defined/mod.js";
import { DEFAULT_TYPE, JS_OBJECT_EXTRA_TYPE } from "./defined/mod.js";
import { toTypeCode } from "./defined/item/mod.js";

const ENCODE_CONTEXT: EncodeContext = {
  classTypes: new Map(),
  toTypeCode,
};
const DECODE_CONTEXT: DecodeContext = {};
export function createContext(customType?: Record<number, Defined>) {
  let enc: EncodeContext = { ...ENCODE_CONTEXT };
  let dec: DecodeContext = { ...DECODE_CONTEXT };
  join(enc, dec, DEFAULT_TYPE);
  join(enc, dec, JS_OBJECT_EXTRA_TYPE);
  if (customType) join(enc, dec, customType);
  return { enc, dec };
}
function join(enc: EncodeContext, dec: DecodeContext, define: Record<number, Defined>) {
  for (const [typeStr, defineInfo] of Object.entries(define)) {
    const type = parseInt(typeStr);
    enc[type] = defineInfo.encoder;
    dec[type] = defineInfo.decoder;
    if (defineInfo.class) {
      const prototype = defineInfo.class.prototype;
      if (typeof prototype !== "object" || prototype === null)
        throw new Error("Class must be a constructor with a prototype");
      enc.classTypes.set(defineInfo.class.prototype, type);
    }
  }
}

export type { EncodeContext, DecodeContext };
