export class DecodeError extends Error {
  constructor(offset: number, msg: string = "Decode error") {
    super(msg + ` (offset: ${offset})`);
  }
}
