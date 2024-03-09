function readByUtf8(buf: Uint8Array, chunk: number[], offset = 0, end = buf.byteLength) {
  let y = 0;
  let strChunks = [];
  let strIndex = 0;
  let code;
  let chunkSize = chunk.length;
  while (offset < end) {
    code = buf[offset++];
    if (code < 0b10000000) {
      chunk[y++] = code;
    } else if (code < 0b11100000) {
      chunk[y++] = ((code & 0b11111) << 6) | (buf[offset++] & 63);
    } else if (code < 0b11110000) {
      chunk[y++] = ((code & 0b1111) << 12) | (((buf[offset++] & 63) << 6) | (buf[offset++] & 63));
    } else if (code < 0b11111000) {
      chunk[y++] =
        ((code & 0b111) << 18) | (((buf[offset++] & 63) << 12) | (((buf[offset++] & 63) << 6) | (buf[offset++] & 63)));
    } else if (code < 0b11111100) {
      chunk[y++] =
        ((code & 0b11) << 24) |
        ((buf[offset++] & 63) << 18) |
        (((buf[offset++] & 63) << 12) | ((buf[offset++] & 63) << 6) | (buf[offset++] & 63));
    } else {
      chunk[y++] =
        ((code & 0b1) << 30) |
        ((buf[offset++] & 63) << 24) |
        ((buf[offset++] & 63) << 18) |
        (((buf[offset++] & 63) << 12) | ((buf[offset++] & 63) << 6) | (buf[offset++] & 63));
    }
    if (y >= chunkSize) {
      strChunks[strIndex++] = String.fromCharCode.apply(String, chunk);
      y = 0;
    }
  }
  if (y !== 0) strChunks[strIndex++] = String.fromCharCode.apply(String, chunk.slice(0, y));

  if (strIndex === 1) return strChunks[0];
  return strChunks.join("");
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
export const decodeUtf8: (buf: Uint8Array, start?: number, end?: number) => string = (function () {
  const TextDecoder = (globalThis as any).TextDecoder;
  let cache: number[];
  if (TextDecoder) {
    //英文在长度小于22左右，手搓解码器比 TextDecoder 快。如果是中文，手搓的总是比 TextDecoder 快。这里需要权衡
    const critical = 22;
    cache = new Array(critical);
    const textDecoder = new TextDecoder();
    return (buf: Uint8Array, start, end) => {
      if (buf.byteLength > critical) return textDecoder.decode(start ? buf.subarray(start, end) : buf);
      return readByUtf8(buf, cache, start, end);
    };
  } else {
    cache = new Array(4095);
    return (buf, offset) => readByUtf8(buf, cache, offset);
  }
})();

export const encodeUtf8Into: (str: string, buf: Uint8Array, offset: number) => number = (function () {
  const TextEncoder = (globalThis as any).TextEncoder;
  if (TextEncoder) {
    const textEncoder = new TextEncoder();
    return (str: string, buf: Uint8Array, offset) => {
      //英文在长度小于15左右，手搓的编码器比 TextEncoder 快。如果是中文，这个长度更长
      if (str.length > 15) {
        if (offset > 0) buf = buf.subarray(offset);
        return textEncoder.encodeInto(str, buf).written + offset;
      }
      return writeByUtf8Into(str, buf, offset);
    };
  } else return writeByUtf8Into;
})();
