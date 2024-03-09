/**
 * 浮点
 */

// Temporary buffers to convert numbers.
const float32Array = new Float32Array(1);
const uInt8Float32Array = new Uint8Array(float32Array.buffer);
const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);

// Check endianness.
float32Array[0] = -1; // 0xBF800000
// Either it is [0, 0, 128, 191] or [191, 128, 0, 0]. It is not possible to
// check this with `os.endianness()` because that is determined at compile time.
export const bigEndian = uInt8Float32Array[3] === 0;
function readDoubleBackwards(buf: Uint8Array, offset = 0) {
  const first = buf[offset];
  const last = buf[offset + 7];
  if (first === undefined || last === undefined) throw outOfBufferError();

  uInt8Float64Array[7] = first;
  uInt8Float64Array[6] = buf[++offset];
  uInt8Float64Array[5] = buf[++offset];
  uInt8Float64Array[4] = buf[++offset];
  uInt8Float64Array[3] = buf[++offset];
  uInt8Float64Array[2] = buf[++offset];
  uInt8Float64Array[1] = buf[++offset];
  uInt8Float64Array[0] = last;
  return {
    data: float64Array[0],
    offset: offset + 2,
  };
}
function readDoubleForwards(buf: Uint8Array, offset = 0) {
  const first = buf[offset];
  const last = buf[offset + 7];
  if (first === undefined || last === undefined) throw outOfBufferError();

  uInt8Float64Array[0] = first;
  uInt8Float64Array[1] = buf[++offset];
  uInt8Float64Array[2] = buf[++offset];
  uInt8Float64Array[3] = buf[++offset];
  uInt8Float64Array[4] = buf[++offset];
  uInt8Float64Array[5] = buf[++offset];
  uInt8Float64Array[6] = buf[++offset];
  uInt8Float64Array[7] = last;
  return {
    data: float64Array[0],
    offset: offset + 2,
  };
}

function writeDoubleBackwards(this: { data: number }, buf: Uint8Array, offset = 0) {
  float64Array[0] = this.data;
  buf[offset++] = uInt8Float64Array[7];
  buf[offset++] = uInt8Float64Array[6];
  buf[offset++] = uInt8Float64Array[5];
  buf[offset++] = uInt8Float64Array[4];
  buf[offset++] = uInt8Float64Array[3];
  buf[offset++] = uInt8Float64Array[2];
  buf[offset++] = uInt8Float64Array[1];
  buf[offset++] = uInt8Float64Array[0];
  return offset;
}
function writeDoubleForwards(this: { data: number }, buf: Uint8Array, offset = 0) {
  float64Array[0] = this.data;
  buf[offset++] = uInt8Float64Array[0];
  buf[offset++] = uInt8Float64Array[1];
  buf[offset++] = uInt8Float64Array[2];
  buf[offset++] = uInt8Float64Array[3];
  buf[offset++] = uInt8Float64Array[4];
  buf[offset++] = uInt8Float64Array[5];
  buf[offset++] = uInt8Float64Array[6];
  buf[offset++] = uInt8Float64Array[7];
  return offset;
}
export const decodeF64LE = bigEndian ? readDoubleBackwards : readDoubleForwards;
export const decodeF64BE = bigEndian ? readDoubleForwards : readDoubleBackwards;
export const encodeF64LE = bigEndian ? writeDoubleBackwards : writeDoubleForwards;
export const encodeF64BE = bigEndian ? writeDoubleForwards : writeDoubleBackwards;

function outOfBufferError() {
  return new Error("Out of Buffer");
}
