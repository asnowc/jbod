function readByUtf8(buf: Uint8Array, chunk: number[]) {
  let y = 0;
  let str = [];
  let strIndex = 0;
  let code;
  let i = 0;
  while (i < buf.length) {
    code = buf[i++];
    if (code < 0b10000000) {
      chunk[y++] = code;
    } else if (code < 0b11100000) {
      chunk[y++] = ((code & 0b11111) << 6) | (buf[i++] & 63);
    } else if (code < 0b11110000) {
      chunk[y++] = ((code & 0b1111) << 12) | (((buf[i++] & 63) << 6) | (buf[i++] & 63));
    } else if (code < 0b11111000) {
      chunk[y++] = ((code & 0b111) << 18) | (((buf[i++] & 63) << 12) | (((buf[i++] & 63) << 6) | (buf[i++] & 63)));
    } else if (code < 0b11111100) {
      chunk[y++] =
        ((code & 0b11) << 24) |
        ((buf[i++] & 63) << 18) |
        (((buf[i++] & 63) << 12) | ((buf[i++] & 63) << 6) | (buf[i++] & 63));
    } else {
      chunk[y++] =
        ((code & 0b1) << 30) |
        ((buf[i++] & 63) << 24) |
        ((buf[i++] & 63) << 18) |
        (((buf[i++] & 63) << 12) | ((buf[i++] & 63) << 6) | (buf[i++] & 63));
    }
    if (y >= chunk.length) {
      str[strIndex++] = String.fromCharCode.apply(String, chunk);
      y = 0;
    }
  }
  if (str.length) return str.join("");
  return String.fromCharCode.apply(String, y === chunk.length ? chunk : chunk.slice(0, y));
}

export function calcUtf8Length(str: string) {
  let utf8Len = 0;
  let code: number;
  for (let i = 0; i < str.length; i++) {
    code = str.charCodeAt(i);
    if (code < 0x80) utf8Len++;
    else if (code < 0x8_00) utf8Len += 2;
    else if (code < 0x10000) utf8Len += 3;
    else if (code < 0x200000) utf8Len += 4;
    else if (code < 0x4000000) utf8Len += 5;
    else utf8Len += 6;
  }
  return utf8Len;
}
function writeByUtf8Into(str: string, buf: Uint8Array, offset = 0) {
  let code;
  for (let i = 0; i < str.length; i++) {
    code = str.charCodeAt(i);
    if (code < 0x80) buf[offset++] = code;
    else if (code < 0x8_00) {
      buf[offset++] = 0b11000000 | (code >> 6);
      buf[offset++] = 128 | (63 & code);
    } else if (code < 0x10000) {
      buf[offset++] = 0b11100000 | (63 & (code >> 12));
      buf[offset++] = 128 | (63 & (code >> 6));
      buf[offset++] = 128 | (63 & code);
    } else if (code < 0x200000) {
      buf[offset++] = 0b11110000 | (63 & (code >> 18));
      buf[offset++] = 128 | (63 & (code >> 12));
      buf[offset++] = 128 | (63 & (code >> 6));
      buf[offset++] = 128 | (63 & code);
    } else if (code < 0x4000000) {
      buf[offset++] = 0b11111000 | (63 & (code >> 24));
      buf[offset++] = 128 | (63 & (code >> 18));
      buf[offset++] = 128 | (63 & (code >> 12));
      buf[offset++] = 128 | (63 & (code >> 6));
      buf[offset++] = 128 | (63 & code);
    } else {
      buf[offset++] = 0b11111100 | (63 & (code >> 32));
      buf[offset++] = 128 | (63 & (code >> 24));
      buf[offset++] = 128 | (63 & (code >> 18));
      buf[offset++] = 128 | (63 & (code >> 12));
      buf[offset++] = 128 | (63 & (code >> 6));
      buf[offset++] = 128 | (63 & code);
    }
  }
  return offset;
}
export const decodeUtf8: (buf: Uint8Array) => string = (function () {
  const TextDecoder = (globalThis as any).TextDecoder;
  if (TextDecoder) {
    const textDecoder = new TextDecoder();
    return (buf: Uint8Array) => textDecoder.decode(buf);
  } else {
    const cache = new Array(4095);
    return (buf) => readByUtf8(buf, cache);
  }
})();

export const encodeUtf8Into: (str: string, buf: Uint8Array, offset: number) => number = (function () {
  const TextEncoder = (globalThis as any).TextEncoder;
  if (TextEncoder) {
    const textEncoder = new TextEncoder();
    return (str: string, buf: Uint8Array, offset) => {
      if (str.length > 15) {
        if (offset > 0) buf = buf.subarray(offset);
        return textEncoder.encodeInto(str, buf).written + offset;
      }
      return writeByUtf8Into(str, buf, offset);
    };
  } else return writeByUtf8Into;
})();
