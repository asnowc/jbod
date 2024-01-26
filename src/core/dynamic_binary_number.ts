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
 * @param buf 要写入的Uint8Array. 传入的 Uint8Array 必须是计算后的字节数的长度，否则会造成异常
 * @remarks 将无符号整型编码
 */
export function encodeU64DInto(value: u64, buf: Uint8Array) {
  if (value < 0b1000_0000) {
    buf[0] = Number(value);
    return;
  }
  let i = 0;
  let max = buf.byteLength - 1;
  while (i < max) {
    buf[i++] = 0b1000_0000 + Number(value & 0b0111_1111n);
    value >>= 7n;
  }
  buf[i] = Number(value & 0b0111_1111n);
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
export function encodeU32DInto(value: u32, buf: Uint8Array) {
  if (value < 0b1000_0000) {
    buf[0] = value;
    return;
  }
  let i = 0;
  let max = buf.byteLength - 1;
  while (i < max) {
    buf[i++] = 0b1000_0000 + (value & 0b0111_1111);
    value >>>= 7;
  }
  buf[i] = value & 0b0111_1111;
}
/**
 * @public */
export function decodeU64D(buf: Uint8Array) {
  let value: bigint = 0n;
  let byte = 0;
  let next = 0;
  do {
    next = buf[byte];
    value += BigInt(next & 0b0111_1111) << BigInt(7 * byte);
    byte++;
  } while (next > 0b0111_1111);

  return { value, byte };
}
/**
 * @public */
export function decodeU32D(buf: Uint8Array) {
  let value = 0;
  let byte = 0;
  let next = 0;
  do {
    next = buf[byte];
    value += (next & 0b0111_1111) << (7 * byte);
    byte++;
  } while (next > 0b0111_1111);

  return { value, byte };
}

/**
 * @public
 * @param buf - 如果存在，直接写入。这必须是计算好长度的Uint8Array
 */
export function encodeDyNum(data: number | bigint, buf?: Uint8Array): Uint8Array {
  if (typeof data === "number") {
    if (data % 1 !== 0) throw new Error("The number must be an integer");
    //超过32位无法使用移位运算符
    if (data <= 0xffffffff) {
      if (!buf) buf = new Uint8Array(calcU32DByte(data));
      encodeU32DInto(data, buf);
      return buf;
    } else data = BigInt(data);
  } else if (typeof data !== "bigint") throw new TypeError("Parameter type error");
  if (!buf) buf = new Uint8Array(calcU64DByte(data));

  encodeU64DInto(data, buf);
  return buf;
}

async function asyncUpdateU64D(byte: bigint, value: bigint, read: StreamReader, safe?: boolean) {
  const buf = new Uint8Array(1);
  do {
    let res = await read(buf, safe);
    if (!res) return undefined;
    value += BigInt(buf[0] & 0b0111_1111) << (7n * byte);
    byte++;
  } while (buf[0] > 0b0111_1111);

  return value;
}
//todo
async function decodeDyNumAsync(read: StreamReader, safe?: false): Promise<number | bigint>;
async function decodeDyNumAsync(read: StreamReader, safe?: boolean): Promise<number | bigint | undefined>;
async function decodeDyNumAsync(read: StreamReader, safe?: boolean): Promise<number | bigint | undefined> {
  let value: number = 0;
  let byte = 0;
  const buf = new Uint8Array(1);
  do {
    let res = await read(buf, safe);
    if (!res) return undefined;
    value += (buf[0] & 0b0111_1111) << (7 * byte);
    byte++;
  } while (buf[0] > 0b0111_1111 && value <= 0b1111_1111_1111);
  if (buf[0] > 0b0111_1111) return asyncUpdateU64D(BigInt(byte), BigInt(value), read, safe);

  return value;
}

interface StreamReader {
  (len: Uint8Array, safe?: false): Promise<Uint8Array>;
  (len: Uint8Array, safe?: boolean): Promise<Uint8Array | null>;
}
type u32 = number;
type u64 = bigint;

interface StreamReader {
  (len: number, safe?: false): Promise<Uint8Array>;
  (len: Uint8Array, safe?: boolean): Promise<Uint8Array | null>;
}
