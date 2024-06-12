import { readByUtf8 } from "../../src/utf8/mod.ts";

import { createUtf8Buf } from "../__mocks__/compare.cases.ts";

const config: { size: number; min: number; max: number }[] = [
  {
    size: 10,
    max: 127,
    min: 0,
  },
  {
    size: 1024,
    max: 0xffff,
    min: 0,
  },
  {
    size: 1024 * 1024,
    max: 0x10ffff,
    min: 0xff,
  },
];
const textEncoder = new TextEncoder();
// Deno.bench(function textEncoder() {});
// Deno.bench(function textEncoder() {});

const textDecoder = new TextDecoder();
const bin = config.map((item) => createUtf8Buf(item.size));
const index = 0;

const chunk = new Array(4095);
Deno.bench(function B() {
  readByUtf8(bin[index], chunk);
});
Deno.bench(function C() {
  textDecoder.decode(bin[index]);
});
