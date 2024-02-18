export function formatBin(buf: Uint8Array) {
  const buffer = Buffer.from(buf, buf.byteOffset, buf.byteLength);
  return buffer.toString("hex");
}
