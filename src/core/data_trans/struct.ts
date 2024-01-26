import { DataType, JbodEncoder } from "jbod";

const jser = new JbodEncoder();

interface StructEncoder {}
const struct = {
  aa: DataType.dyArray,
  bb: DataType.binary,
  c: {
    myName: DataType.map,
  },
  q: [DataType.i32],
};
