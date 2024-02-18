import type { DecodeResult } from "../type.js";
import type { Dec } from "./type.js";
import { createEncMaps } from "./defined.js";
import { createDecContext } from "./base_trans.js";

export class JbodDecoder {
  decode(buffer: Uint8Array, offset: number = 0, type?: number): DecodeResult {
    if (type === undefined) {
      type = buffer[offset++];
    }
    return this.decContext.decodeItem(buffer, offset, type);
  }
  private decContext: Dec.Context;
  constructor() {
    this.decContext = createDecContext(createEncMaps().decMap);
  }
}
