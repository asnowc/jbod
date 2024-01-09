export class ObjectId {
  #value: bigint;
  /** @remarks ObjectId的原始值 */
  get value() {
    return this.#value;
  }
  constructor(value: bigint | number) {
    if (value < 0) throw new Error("The number cannot be negative");
    if (typeof value === "number") {
      if (value % 1 !== 0) throw new Error("Id must be an integer");
      this.#value = BigInt(value);
    } else this.#value = value;
  }
  valueOf(): bigint {
    return this.#value;
  }
  toString() {
    return this.#value.toString();
  }
}
/**
 * @remarks 代表void值，用于写入或响应 array 或 map 的结束标志
 */
export const VOID = Symbol("void");
