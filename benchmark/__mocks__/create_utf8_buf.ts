function randomChar() {
  return Math.floor(Math.random() * 0x9fa5) + 0x4e00;
}
/** 创建一个指定长度的随机的中文 Uint8Array */
export function createUtf8Buf(size: number) {
  let str = "";
  for (let i = 0, max = Math.floor(size / 3); i < max; i++) {
    let code = randomChar();
    str += String.fromCharCode(code);
  }
  const buf = Buffer.from(str);
  return new Uint8Array(buf);
}
