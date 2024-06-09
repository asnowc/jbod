export const compoundTypes = {
  dyRecord: [
    {},
    { a: 1, b: 2, c: 3 },
    { a: false, b: [1, "a", null] },
    { a: false, b: { a: 9, b: null } },
    { a: 8, b: false, q: [1, 3, "a", null], c: { a: 9 } },
  ],
  dyArray: [[], [1, 4, "2"], [undefined, [1, 3, [8, 9], {}, 4]]],

  set: [new Set([1, { a: null }, "xx"])],
  map: [new Map(Object.entries({ a: 1, b2: "xx", c: [0, 3] }))],

  error: [new Error("abc"), new Error("abc", { cause: 23 })],
  regExp: [/\d+./],
  symbol: [Symbol("abc"), Symbol(""), Symbol()],
};

export const baseDataTypes = {
  noContent: [undefined, null, true, false],
  int: [-2147483648, -66, -1, 0, 1, 0x3fff_ffff, 2147483647],
  //@ts-ignore
  bigint: [-9223372036854775808n, -1n, 0n, 1n, 9223372036854775807n],
  double: [-1.1, 1.1, -2147483649, 2147483648, NaN, Infinity, -Infinity],
  binary: [new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array(0)],

  string: ["abcd中文123", ""],
};
export const unsupportedData = {
  function: [() => true, function name() {}, function () {}],
};
