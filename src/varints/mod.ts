import { DecodeError } from "../const.ts";

/** 计算64位无符号整数(bigint) 编码成 varints 后的字节数
 * @public
 * @param bigint - 一个 u64类型，传入负数为解析为 u64 类型
 */
export function calcU64DByte(bigint: bigint): number {
  let next = bigint <= 0xfff_ffff && bigint > 0; //bigint 为 i64 类型， 算法需要 u64 类型
  let len = 0;
  const N28 = BigInt(28);
  do {
    let value = Number(bigint & BigInt(0xfff_ffff));
    let max = len + 4;
    do {
      if (value <= 0b0111_1111 && next) return len + 1;
      len++;
      value >>>= 7;
    } while (len < max);

    bigint >>= N28;
    if (bigint < 0) bigint &= BigInt(0xf_ffff_ffff); // bigint 没有逻辑右移
    next = bigint <= 0xfff_ffff;
  } while (true);
}
/** 将64位无符号整数(bigint) 编码成 varints
 * @public
 * @param bigint - 一个 u64类型，传入负数为解析为 u64 类型
 * @returns 返回 Uint8Array 偏移量
 */
export function encodeU64DInto(bigint: bigint, buf: Uint8Array, offset = 0): number {
  let next = bigint <= 0xfff_ffff && bigint > 0; //bigint 为 i64 类型， 算法需要 u64 类型
  const N28 = BigInt(28);
  do {
    let value = Number(bigint & BigInt(0xfff_ffff));
    let max = offset + 4;
    do {
      if (value <= 0b0111_1111 && next) {
        buf[offset++] = value;
        return offset;
      }
      buf[offset++] = 0b1000_0000 | value;
      value >>>= 7;
    } while (offset < max);

    bigint >>= N28;
    if (bigint < 0) bigint &= BigInt(0xf_ffff_ffff); // bigint 没有逻辑右移

    next = bigint <= 0xfff_ffff;
  } while (true);
}

/**
 * 计算32位无符号整数编码成 varints 后的字节数
 * @public
 */
export function calcU32DByte(value: number): number {
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
 * 将32位无符号整数编码成 varints
 * @public
 * @param value - 一个 u32类型，传入负数为解析为 u32 类型
 * @returns 返回 Uint8Array 偏移量 */
export function encodeU32DInto(value: number, buf: Uint8Array, offset = 0): number {
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

/** 从二进制解码64位无符号整数。
 *  需要确保数字范围是无符号长整数的范围，否则结果可能错误
 *  @public */
export function decodeU64D(buf: Uint8Array, offset = 0): { value: bigint; byte: number } {
  const res: { value: any; byte: number } = decodeDyInt(buf, offset);
  if (typeof res.value === "bigint") return res;
  res.value = BigInt(res.value);
  return res;
}
/** 从二进制解码32位无符号整数。需要确保数字范围是无符号整数的范围，否则结果可能错误
 * @public
 *
 */
export function decodeU32D(buf: Uint8Array, offset = 0): { value: number; byte: number } {
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
/* 
如果在 ES2020 之前的环境，值为 0
兼容 ES2020 之前的版本
*/
const X_100_0000_0000_0000 = typeof BigInt === "function" ? BigInt(0x100_0000_0000) << BigInt(16) : 0;
const X_7fff_ffff_ffff_ffff =
  typeof BigInt === "function" ? (BigInt(0x7fff_ffff) << BigInt(32)) | BigInt(0xffff_ffff) : 0;

/**
 * @public
 * 2**53 (Number.MAX_SAFE_INTEGER + 1 ): 返回 number
 */
export function decodeDyInt(buf: Uint8Array, offset: number = 0): { value: bigint | number; byte: number } {
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
  const N28 = BigInt(28);

  // 小于等于64位 (实际 8*7=56 位)
  do {
    next = buf[offset + byte];
    value += (next & 0b0111_1111) << (byte * 7);
    byte++;
    if (next <= 0b0111_1111) {
      byte += beforeByte;
      if (byte > 7) return { value: BigInt(beforeValue) + (BigInt(value) << N28), byte };
      else return { value: beforeValue + value * 0x1000_0000, byte };
    }
  } while (byte < 4);

  // bigint 位运算
  offset += byte;
  beforeByte += byte;
  beforeValue = BigInt(beforeValue) + (BigInt(value) << N28);

  byte = 0;
  value = 0;
  // 小于等于80位使用指数运算 (实际 10*7=70 位)
  do {
    next = buf[offset + byte];
    value += (next & 0b0111_1111) << (byte * 7);
    byte++;
    if (next <= 0b0111_1111) {
      byte += beforeByte;
      return { value: beforeValue + BigInt(value) * (X_100_0000_0000_0000 as bigint), byte }; //如果在 ES2020 之前的环境执行， bigint 与 0 进行位运算会抛出异常
    }
  } while (byte < 2);

  throw new DecodeError(offset, "DyInt is more than 10 bytes");
}
/**
 * 32位无符号整数的 varins 解码器. 多个不完整的二进制块. 然后解码
 * @public */
export class U32DByteParser {
  value = 0;
  private result?: {
    value: number;
    residue?: Uint8Array;
  };
  /**
   * 传入二进制分块，如果数据不完整，返回false，你应继续传入分块，直到则返回true
   */
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
  /** 当 next() 返回 true 后，调用 finish(), 返回解码的值*/
  finish(): {
    value: number;
    residue?: Uint8Array | undefined;
  } {
    const result = this.result;
    if (!result) throw new Error("unfinished");
    this.result = undefined;
    return result;
  }
}

/** @public */
export function zigzagEncodeI32(val: number): number {
  return (val << 1) ^ (val >> 31);
}

/** @public */
export function zigzagDecodeI32(val: number): number {
  return (val >>> 1) ^ -(val & 1);
}
/** @public */
export function zigzagEncodeI64(val: bigint): bigint {
  return (val << BigInt(1)) ^ (val >> BigInt(63));
}

/** @public */
export function zigzagDecodeI64(value: bigint): bigint {
  let a: bigint;
  if (value < 0) a = (value >> BigInt(1)) & (X_7fff_ffff_ffff_ffff as bigint);
  //如果在 ES2020 之前的环境执行， bigint 与 0 进行位运算会抛出异常
  else a = value >> BigInt(1);
  return a ^ -(value & BigInt(1));
}
