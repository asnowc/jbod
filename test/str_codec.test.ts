import { calcUtf8Length, readByUtf8, encodeUtf8Into } from "../src/utf8/mod.ts";
import { test, expect } from "vitest";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function enc(str: string) {
  let buf = new Uint8Array(calcUtf8Length(str));
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

test("dd", function () {
  const buf = new Uint8Array(6);
  const chunk = new Array(10);
  for (let i = 0; i < 55300; i += 100) {
    const str = String.fromCodePoint(i);

    const len = encodeUtf8Into(str, buf, 0);

    const decoded = textDecoder.decode(buf.subarray(0, len));
    const str2 = readByUtf8(buf, chunk);

    expect(str2.codePointAt(0)).toBe(i);
    expect(decoded.charCodeAt(0)).toBe(i);
  }
});
