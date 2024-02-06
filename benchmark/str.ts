import { decodeUtf8, readByUtf8, calcUtf8Length, encodeUtf8Into } from "../src/uint_array_util/string.ts";
const str = "中".repeat(10);//25
let byteLen = calcUtf8Length(str);
const u8Arr = new Uint8Array(byteLen + 10);
encodeUtf8Into(str, u8Arr, 5);

const textDecoder = new TextDecoder();
let arr = new Array(4095);
Deno.bench("custom", () => {
  readByUtf8(u8Arr, arr, 5, byteLen + 5);
});
Deno.bench("fx", () => {
  decodeUtf8(u8Arr, 5, byteLen + 5);
});
Deno.bench("textDecoder", () => {
  textDecoder.decode(u8Arr.subarray(5, byteLen + 5));
});
textDecoder.decode(u8Arr, {});
