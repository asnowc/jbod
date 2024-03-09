import protobufjs, { Type } from "protobufjs";
const { Root } = protobufjs;
export const objData = {
  disabled: false,
  count: 100837,
  name: "Documentation",
  dataStamp: 4 / 7,
  id: 876,
};
export const defined = Root.fromJSON({
  nested: {
    i32: {
      fields: {
        field: {
          type: "i32",
          id: 1,
          rule: "repeated",
        },
      },
    },
    f64: {
      fields: {
        field: {
          type: "double",
          id: 1,
          rule: "repeated",
        },
      },
    },
    bool: {
      fields: {
        field: {
          type: "bool",
          id: 1,
          rule: "repeated",
        },
      },
    },
    string: {
      fields: {
        field: {
          type: "string",
          id: 1,
          rule: "repeated",
        },
      },
    },
    object: {
      fields: {
        field: {
          type: "struct",
          id: 1,
          rule: "repeated",
        },
      },
    },
    struct: {
      fields: {
        disabled: {
          type: "bool",
          id: 1,
        },
        count: {
          type: "int32",
          id: 2,
        },
        name: {
          type: "string",
          id: 3,
        },
        dataStamp: {
          type: "double",
          id: 4,
        },
        id: {
          type: "int32",
          id: 5,
        },
      },
    },
  },
});

export function encodeArray(payload: any[], defined: Type) {
  const message = defined.create({ field: payload });
  return defined.encode(message).finish();
}
export function decode(buf: Uint8Array, defined: Type) {
  const message = defined.decode(buf);
  return defined.toObject(message);
}
