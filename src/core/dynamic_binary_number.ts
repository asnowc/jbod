import { ByteParser } from "../lib/mod.js";

/**
 * @public
 * @remarks 计算字无符号整型编码成DBN后的字节数
 */
export function calcU64DByte(value: u64) {
  let len = 1;
  while (value > 0b0111_1111) {
    value >>= 7n;
    len++;
  }
  return len;
}
/**
 * @public
 * @returns 返回 Uint8Array 偏移量
 */
export function encodeU64DInto(value: u64, buf: Uint8Array, offset = 0) {
  if (value < 0b1000_0000) {
    buf[offset++] = Number(value);
    return offset;
  }
  while (value > 0b01111111) {
    buf[offset++] = 0b1000_0000 + Number(value & 0b0111_1111n);
    value >>= 7n;
  }
  buf[offset++] = Number(value & 0b0111_1111n);
  return offset;
}

/** @public */
export function calcU32DByte(value: u32) {
  let len = 1;
  while (value > 0b0111_1111) {
    value >>>= 7;
    len++;
  }
  return len;
}
/**
 * @public
 * @returns 返回 Uint8Array 偏移量 */
export function encodeU32DInto(value: u32, buf: Uint8Array, offset = 0) {
  if (value < 0b10000000) {
    buf[offset++] = value;
    return offset;
  }
  while (value > 0b01111111) {
    buf[offset++] = 0b1000_0000 | (value & 0b0111_1111);
    value >>>= 7;
  }
  buf[offset++] = value & 0b0111_1111;
  return offset;
}
/**
 * @public */
export function decodeU64D(buf: Uint8Array, offset = 0) {
  let value: bigint = 0n;
  let byte = 0;
  let next = 0;
  do {
    next = buf[offset + byte];
    value += BigInt(next & 0b0111_1111) << BigInt(7 * byte);
    byte++;
  } while (next > 0b0111_1111);

  return { value, byte };
}
/**
 * @public */
export function decodeU32D(buf: Uint8Array, offset = 0) {
  let value = 0;
  let byte = 0;
  let next = 0;
  do {
    next = buf[offset + byte];
    value += (next & 0b0111_1111) << (7 * byte);
    byte++;
  } while (next > 0b0111_1111);

  return { value, byte };
}
/** @public */
export class U32DByteParser extends ByteParser<number> {
  value = 0;
  next(buf: Uint8Array): boolean {
    let max = buf.byteLength;
    let next: number;
    let byteLen = 0;
    do {
      next = buf[byteLen];
      this.value += (next & 0b0111_1111) << (7 * byteLen);
      if (++byteLen > max) {
        return false;
      }
    } while (next > 0b0111_1111);
    this.result = { value: this.value, residue: byteLen < max ? buf.subarray(byteLen) : undefined };
    this.value = 0;
    return true;
  }
}

type u32 = number;
type u64 = bigint;
