export function formatBin(buf: Uint8Array) {
  const buffer = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  return buffer.toString("hex");
}
