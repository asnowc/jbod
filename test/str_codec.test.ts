import { calcUtf16Length, readByUtf8, encodeUtf8Into } from "../src/defined/data_types/string.ts";
import { test, expect } from "vitest";
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function enc(str: string) {
  let buf = new Uint8Array(calcUtf16Length(str));
  encodeUtf8Into(str, buf, 0);
  return buf;
}
function dec(buf: Uint8Array) {
  return readByUtf8(buf, new Array(4095), 0);
}

test("enc-utf-16", function () {
  const str = "😂a";
  expect(enc(str)).toEqual(textEncoder.encode(str));

  let s2 = "𡠀";
  expect(enc(s2)).toEqual(textEncoder.encode(s2));
});
test("dec-utf-16", function () {
  const buf = textEncoder.encode("😂a");
  expect(dec(buf)).toEqual(textDecoder.decode(buf));
});
