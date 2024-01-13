export function concatUint8Array(arr: Uint8Array[], totalLen?: number) {
  if (!totalLen) {
    totalLen = 0;
    for (let i = 0; i < arr.length; i++) totalLen += arr[i].length;
  }
  const buf = new Uint8Array(totalLen);
  let offset = 0;
  for (let i = 0; i < arr.length; i++) {
    buf.set(arr[i], offset);
    offset += arr[i].byteLength;
  }
  return buf;
}
