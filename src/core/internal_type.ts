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
