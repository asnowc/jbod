import { DecodeError } from "../const.js";

/**
 * @public
 * @param bigint - 一个 u64类型，传入负数为解析为 u64 类型
 * @remarks 计算字无符号整型编码成DBN后的字节数
 */
export function calcU64DByte(bigint: bigint) {
  let next = bigint <= 0xfff_ffff && bigint > 0; //bigint 为 i64 类型， 算法需要 u64 类型
  let len = 0;
  do {
    let value = Number(bigint & 0xfff_ffffn);
    let max = len + 4;
    do {
      if (value <= 0b0111_1111 && next) return len + 1;
      len++;
      value >>>= 7;
    } while (len < max);

    bigint >>= 28n;
    if (bigint < 0) bigint &= 0xf_ffff_ffffn; // bigint 没有逻辑右移
    next = bigint <= 0xfff_ffff;
  } while (true);
}

/**
 * @public
 * @param bigint - 一个 u64类型，传入负数为解析为 u64 类型
 * @returns 返回 Uint8Array 偏移量
 */
export function encodeU64DInto(bigint: bigint, buf: Uint8Array, offset = 0) {
  let next = bigint <= 0xfff_ffff && bigint > 0; //bigint 为 i64 类型， 算法需要 u64 类型
  do {
    let value = Number(bigint & 0xfff_ffffn);
    let max = offset + 4;
    do {
      if (value <= 0b0111_1111 && next) {
        buf[offset++] = value;
        return offset;
      }
      buf[offset++] = 0b1000_0000 | value;
      value >>>= 7;
    } while (offset < max);

    bigint >>= 28n;
    if (bigint < 0) bigint &= 0xf_ffff_ffffn; // bigint 没有逻辑右移

    next = bigint <= 0xfff_ffff;
  } while (true);
}
/** @public */
export function calcU32DByte(value: number) {
  let len = 1;
  if (value < 0) {
    len++;
    value >>>= 7;
  }
  while (value > 0b0111_1111) {
    value >>>= 7;
    len++;
  }
  return len;
}
/**
 * @public
 * @param value - 一个 u32类型，传入负数为解析为 u32 类型
 * @returns 返回 Uint8Array 偏移量 */
export function encodeU32DInto(value: number, buf: Uint8Array, offset = 0) {
  if (value < 0) {
    buf[offset++] = 0b1000_0000 | value;
    value >>>= 7;
  }
  while (value > 0b0111_1111) {
    buf[offset++] = 0b1000_0000 | value;
    value >>>= 7;
  }
  buf[offset++] = value;
  return offset;
}

/**
 *  需要确保数字范围是无符号长整型的范围，否则结果可能错误
 *  @public */
export function decodeU64D(buf: Uint8Array, offset = 0): { value: bigint; byte: number } {
  const res: { value: any; byte: number } = decodeDyInt(buf, offset);
  if (typeof res.value === "bigint") return res;
  res.value = BigInt(res.value);
  return res;
}
/**
 * 需要确保数字范围是无符号整型的范围，否则结果可能错误
 * @public
 *
 */
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
  let beforeValue: number | bigint = 0;
  let beforeByte = 0;

  // 小于等于32位 (实际 4*7=28 位)
  do {
    next = buf[offset + beforeByte];
    beforeValue |= (next & 0b0111_1111) << (beforeByte * 7);
    beforeByte++;
    if (next <= 0b0111_1111) return { value: beforeValue, byte: beforeByte };
  } while (beforeByte < 4);

  offset += beforeByte;
  let byte = 0;
  let value = 0;

  // 小于等于64位 (实际 8*7=56 位)
  do {
    next = buf[offset + byte];
    value += (next & 0b0111_1111) << (byte * 7);
    byte++;
    if (next <= 0b0111_1111) {
      byte += beforeByte;
      if (byte > 7) return { value: BigInt(beforeValue) + (BigInt(value) << 28n), byte };
      else return { value: beforeValue + value * 0x1000_0000, byte }; // 0x1000_0000 =
    }
  } while (byte < 4);

  // bigint 位运算
  offset += byte;
  beforeByte += byte;
  beforeValue = BigInt(beforeValue) + (BigInt(value) << 28n);

  byte = 0;
  value = 0;
  // 小于等于80位使用指数运算 (实际 10*7=70 位)
  do {
    next = buf[offset + byte];
    value += (next & 0b0111_1111) << (byte * 7);
    byte++;
    if (next <= 0b0111_1111) {
      byte += beforeByte;
      return { value: beforeValue + BigInt(value) * 0x100_0000_0000_0000n, byte };
    }
  } while (byte < 2);

  throw new DecodeError(offset, "DyInt is more than 10 bytes");
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

/** @public */
export function zigzagEncodeI32(val: number) {
  return (val << 1) ^ (val >> 31);
}

/** @public */
export function zigzagDecodeI32(val: number) {
  return (val >>> 1) ^ -(val & 1);
}
/** @public */
export function zigzagEncodeI64(val: bigint) {
  return (val << 1n) ^ (val >> 63n);
}

/** @public */
export function zigzagDecodeI64(value: bigint) {
  let a: bigint;
  if (value < 0) a = (value >> 1n) & 0x7fff_ffff_ffff_ffffn;
  else a = value >> 1n;
  return a ^ -(value & 1n);
}
