const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function decode(data: Uint8Array) {
  const jsonStr = textDecoder.decode(data);
  return JSON.parse(jsonStr);
}
export function encode(data: any) {
  const jsonStr = JSON.stringify(data);
  return textEncoder.encode(jsonStr);
}
