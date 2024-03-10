import { DecodeError } from "../const.js";

/**
 * @public
 * @remarks 计算字无符号整型编码成DBN后的字节数
 */
export function calcU64DByte(bigint: u64) {
  let len = 0;
  do {
    let value = Number(bigint & 0xfffffffn);
    let max = len + 4;
    do {
      if (value <= 0b01111111 && bigint <= 0xfffffff) return len + 1;
      len++;
      value >>>= 7;
    } while (len < max);

    bigint >>= 28n;
  } while (true);
}

/**
 * @public
 * @returns 返回 Uint8Array 偏移量
 */
export function encodeU64DInto(bigint: u64, buf: Uint8Array, offset = 0) {
  do {
    let value = Number(bigint & 0xfffffffn);
    let max = offset + 4;
    do {
      if (value <= 0b0111_1111 && bigint <= 0xfffffff) {
        buf[offset++] = value;
        return offset;
      }
      buf[offset++] = 0b1000_0000 | (value & 0b0111_1111);
      value >>>= 7;
    } while (offset < max);

    bigint >>= 28n;
  } while (true);
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
  while (value > 0b0111_1111) {
    buf[offset++] = 0b1000_0000 | (value & 0b0111_1111);
    value >>>= 7;
  }
  buf[offset++] = value;
  return offset;
}

/**
 * @public */
export function decodeU64D(buf: Uint8Array, offset = 0): { value: bigint; byte: number } {
  const res: { value: any; byte: number } = decodeDyInt(buf, offset);
  if (typeof res.value === "bigint") return res;
  res.value = BigInt(res.value);
  return res;
}
/** @public */
export function decodeU32D(buf: Uint8Array, offset = 0) {
  let next = buf[offset];
  let value = next & 0b0111_1111;
  let byte = 1;
  while (next > 0b0111_1111) {
    next = buf[offset + byte];
    value |= (next & 0b0111_1111) << (7 * byte);
    if (++byte > 5) throw new DecodeError(offset, "DyInt is more than 5 bytes");
  }

  return { value, byte };
}

/**
 * @public
 * 2**53 (Number.MAX_SAFE_INTEGER + 1 ): 返回 number
 */
export function decodeDyInt(buf: Uint8Array, offset: number = 0) {
  let next: number;
  let beforeValue = 0;
  let beforeByte = 0;

  // 小于等于31位使用位运算 (实际 4*7=28 位)
  do {
    next = buf[offset + beforeByte];
    beforeValue |= (next & 0b0111_1111) << (beforeByte * 7);
    beforeByte++;
    if (next <= 0b0111_1111) return { value: beforeValue, byte: beforeByte };
  } while (beforeByte < 4);

  offset += beforeByte;
  let byte = 0;
  let value = 0;

  // 小于等于52位使用指数运算 (实际 7*7=49 位)
  do {
    next = buf[offset + byte];
    value += (next & 0b0111_1111) << (byte * 7);
    byte++;
    if (next <= 0b0111_1111) {
      byte += beforeByte;
      if (byte > 7) return { value: BigInt(beforeValue) + (BigInt(value) << 28n), byte };
      else return { value: beforeValue + value * 2 ** 28, byte };
    }
  } while (byte < 4);

  // bigint 位运算
  offset += beforeByte;

  next = buf[offset + 8];
  if (next > 0b0111_1111) throw new DecodeError(offset, "DyInt is more than 9 bytes");
  return {
    value: BigInt(value) | (BigInt(next & 0b0111_1111) << 56n),
    byte: 9,
  };
}
/** @public */
export class U32DByteParser {
  value = 0;
  private result?: {
    value: number;
    residue?: Uint8Array;
  };
  next(buf: Uint8Array): boolean {
    let max = buf.byteLength;
    let next: number;
    let byteLen = 0;
    do {
      next = buf[byteLen];
      this.value |= (next & 0b0111_1111) << (7 * byteLen);
      if (++byteLen > max) {
        return false;
      }
    } while (next > 0b0111_1111);
    this.result = { value: this.value, residue: byteLen < max ? buf.subarray(byteLen) : undefined };
    this.value = 0;
    return true;
  }
  finish() {
    const result = this.result;
    if (!result) throw new Error("unfinished");
    this.result = undefined;
    return result;
  }
}

type u32 = number;
type u64 = bigint;
// zigzag 编码
export function zigzagEncodeI32(val: number) {
  return (val << 1) ^ (val >> 31);
}

// zigzag解码
export function zigzagDecodeI32(val: number) {
  return (val >> 1) ^ -(val & 1);
}
